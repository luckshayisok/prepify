import { useCallback, useEffect, useRef, useState } from "react";

export const VAPI_PUBLIC_KEY = import.meta.env.VITE_VAPI_PUBLIC_KEY;

// Appends a final transcript chunk, merging consecutive chunks from the same speaker.
function appendTurn(turns, role, text) {
  const last = turns.at(-1);
  if (last?.role === role) return [...turns.slice(0, -1), { ...last, text: `${last.text} ${text}`.trim() }];
  return [...turns, { role, text, at: new Date().toISOString() }];
}

// Detaches listeners before stopping, so a stale call-end can't overwrite newer state.
function disposeCall(ref) {
  const vapi = ref.current;
  ref.current = null;
  vapi?.removeAllListeners?.();
  vapi?.stop();
}

/**
 * Runs a browser voice call with Vapi and collects the transcript.
 * status: idle → connecting → live → ended | error
 */
export function useVapiInterview() {
  const vapiRef = useRef(null);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [transcript, setTranscript] = useState([]);
  const [partial, setPartial] = useState(null); // { role, text } currently being spoken
  const [assistantSpeaking, setAssistantSpeaking] = useState(false);
  const [volume, setVolume] = useState(0);
  const [muted, setMuted] = useState(false);
  const transcriptRef = useRef([]);

  useEffect(() => () => disposeCall(vapiRef), []);

  const start = useCallback(async ({ systemPrompt, firstMessage }) => {
    if (!VAPI_PUBLIC_KEY) {
      setError("Voice interviews aren't configured: set VITE_VAPI_PUBLIC_KEY in the frontend environment.");
      setStatus("error");
      return;
    }
    setError("");
    setTranscript([]);
    transcriptRef.current = [];
    setStatus("connecting");
    disposeCall(vapiRef);

    const { default: Vapi } = await import("@vapi-ai/web");
    const vapi = new Vapi(VAPI_PUBLIC_KEY);
    vapiRef.current = vapi;

    vapi.on("call-start", () => setStatus("live"));
    vapi.on("call-end", () => {
      setAssistantSpeaking(false);
      setPartial(null);
      setStatus((s) => (s === "error" ? s : "ended"));
    });
    vapi.on("speech-start", () => setAssistantSpeaking(true));
    vapi.on("speech-end", () => setAssistantSpeaking(false));
    vapi.on("volume-level", (v) => setVolume(v));
    vapi.on("message", (msg) => {
      if (msg?.type !== "transcript" || !msg.transcript) return;
      const role = msg.role === "assistant" ? "assistant" : "user";
      if (msg.transcriptType === "final") {
        transcriptRef.current = appendTurn(transcriptRef.current, role, msg.transcript);
        setTranscript(transcriptRef.current);
        setPartial(null);
      } else {
        setPartial({ role, text: msg.transcript });
      }
    });
    vapi.on("error", (e) => {
      console.error("Vapi error", e);
      const message = e?.error?.message || e?.errorMsg || e?.message;
      setError(
        typeof message === "string" && message
          ? message
          : "The voice call failed. Check your microphone permission and try again."
      );
      setStatus("error");
    });

    try {
      await vapi.start({
        name: "Prepify Interviewer",
        firstMessage,
        model: {
          provider: "openai",
          model: "gpt-4o",
          temperature: 0.6,
          messages: [{ role: "system", content: systemPrompt }],
        },
        voice: { provider: "vapi", voiceId: "Clara" },
        transcriber: { provider: "deepgram", model: "nova-3", language: "en" },
        endCallPhrases: ["goodbye"],
        maxDurationSeconds: 15 * 60,
        silenceTimeoutSeconds: 60,
      });
    } catch (e) {
      console.error(e);
      setError("Couldn't start the call. Allow microphone access and try again.");
      setStatus("error");
    }
  }, []);

  const stop = useCallback(() => {
    vapiRef.current?.stop();
  }, []);

  const reset = useCallback(() => {
    disposeCall(vapiRef);
    transcriptRef.current = [];
    setTranscript([]);
    setPartial(null);
    setError("");
    setStatus("idle");
  }, []);

  const toggleMute = useCallback(() => {
    const vapi = vapiRef.current;
    if (!vapi) return;
    vapi.setMuted(!vapi.isMuted());
    setMuted(vapi.isMuted());
  }, []);

  return { status, error, transcript, transcriptRef, partial, assistantSpeaking, volume, muted, start, stop, reset, toggleMute };
}
