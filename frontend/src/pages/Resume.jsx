import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Brain, Briefcase, CheckCircle2, FileText, FolderGit2, Loader2, Mic, Trash2, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { GradientButton, Page, PageHeader, Spinner } from "@/components/common";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useBadgeCatalog } from "@/hooks/useBadgeCatalog";
import { api, errorMessage } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { celebrate } from "@/lib/celebrate";
import { cn } from "@/lib/utils";

function Chips({ items, tone = "bg-muted" }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((s) => (
        <span key={s} className={cn("rounded-full px-3 py-1 text-sm", tone)}>
          {s}
        </span>
      ))}
    </div>
  );
}

function UploadForm({ onDone, compact }) {
  const [file, setFile] = useState(null);
  const [pasteMode, setPasteMode] = useState(false);
  const [text, setText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const upload = useMutation({
    mutationFn: () => {
      const form = new FormData();
      if (pasteMode) form.append("text", text);
      else form.append("resume", file);
      if (jobDescription.trim()) form.append("jobDescription", jobDescription.trim());
      return api.post("/resume", form).then((r) => r.data);
    },
    onSuccess: onDone,
  });

  const pick = (f) => {
    if (f && f.type !== "application/pdf") return upload.reset();
    setFile(f);
  };

  const ready = pasteMode ? text.trim().length >= 200 : Boolean(file);

  return (
    <div className={cn("space-y-5", !compact && "mx-auto max-w-2xl rounded-3xl border bg-card p-6 shadow-lg sm:p-8")}>
      <div className="flex gap-2 rounded-xl bg-muted p-1 text-sm font-medium">
        {[
          [false, "Upload PDF"],
          [true, "Paste text"],
        ].map(([mode, label]) => (
          <button
            key={label}
            type="button"
            onClick={() => setPasteMode(mode)}
            className={cn("flex-1 rounded-lg py-2 transition", pasteMode === mode ? "bg-background shadow" : "text-muted-foreground")}
          >
            {label}
          </button>
        ))}
      </div>

      {pasteMode ? (
        <Textarea
          className="min-h-48"
          placeholder="Paste the full text of your resume…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={20000}
        />
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            pick(e.dataTransfer.files?.[0]);
          }}
          className={cn(
            "flex w-full flex-col items-center rounded-2xl border-2 border-dashed p-10 transition",
            dragging ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30" : "hover:border-blue-400 hover:bg-accent/40"
          )}
        >
          <UploadCloud className="mb-3 h-10 w-10 text-blue-600" />
          {file ? (
            <p className="font-medium">{file.name}</p>
          ) : (
            <>
              <p className="font-medium">Drop your resume PDF here, or click to browse</p>
              <p className="mt-1 text-sm text-muted-foreground">PDF up to 5 MB</p>
            </>
          )}
          <input ref={inputRef} type="file" accept="application/pdf" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
        </button>
      )}

      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium">
          <Briefcase className="h-4 w-4" /> Target job description <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <Textarea
          className="min-h-24"
          placeholder="Paste a job posting to see which skills you're missing for it."
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          maxLength={5000}
        />
      </div>

      {upload.error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{errorMessage(upload.error)}</p>
      )}
      <GradientButton className="h-12 w-full" disabled={!ready || upload.isPending} onClick={() => upload.mutate()}>
        {upload.isPending ? (
          <>
            <Loader2 className="animate-spin" /> Reading your resume…
          </>
        ) : (
          <>
            <FileText /> Analyze resume
          </>
        )}
      </GradientButton>
      <p className="text-center text-xs text-muted-foreground">Your resume is stored on your account only, to personalize your questions. You can delete it anytime.</p>
    </div>
  );
}

export default function Resume() {
  const queryClient = useQueryClient();
  const { refreshUser } = useAuth();
  const { toast } = useToast();
  const catalog = useBadgeCatalog();
  const [replacing, setReplacing] = useState(false);

  const { data: resume, isLoading } = useQuery({
    queryKey: ["resume"],
    queryFn: () =>
      api
        .get("/resume")
        .then((r) => r.data.resume)
        .catch((err) => {
          if (err.response?.status === 404) return null;
          throw err;
        }),
  });

  const remove = useMutation({
    mutationFn: () => api.delete("/resume"),
    onSuccess: () => {
      queryClient.setQueryData(["resume"], null);
      refreshUser().catch(() => {});
    },
  });

  const onUploaded = (data) => {
    queryClient.setQueryData(["resume"], data.resume);
    setReplacing(false);
    refreshUser().catch(() => {});
    for (const id of data.newBadges ?? []) {
      const b = catalog[id];
      if (b) {
        celebrate();
        toast({ title: `${b.icon} Badge unlocked: ${b.name}`, description: b.description });
      }
    }
  };

  if (isLoading) return <Spinner />;

  return (
    <Page className="max-w-4xl">
      <PageHeader
        eyebrow="Resume personalization"
        title={resume ? "Your resume profile" : "Get questions about your own work"}
        description="Upload your resume and Prepify's AI will ask about your actual projects and skills, in every interview mode."
        actions={
          resume &&
          !replacing && (
            <>
              <Button variant="outline" onClick={() => setReplacing(true)}>
                Replace
              </Button>
              <Button
                variant="ghost"
                className="text-red-600"
                onClick={() => window.confirm("Delete your resume from Prepify?") && remove.mutate()}
              >
                <Trash2 /> Delete
              </Button>
            </>
          )
        }
      />

      {!resume || replacing ? (
        <>
          <UploadForm onDone={onUploaded} />
          {replacing && (
            <div className="mt-4 text-center">
              <Button variant="ghost" onClick={() => setReplacing(false)}>
                Cancel
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-6">
          <section className="rounded-2xl border bg-card p-6 shadow-sm">
            <div className="mb-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" /> {resume.fileName} · uploaded {formatDate(resume.uploadedAt)}
              <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-medium capitalize text-blue-600 dark:text-blue-400">
                {resume.experienceLevel} level
              </span>
            </div>
            <p className="text-lg leading-relaxed">{resume.summary}</p>
            {resume.suggestedRoles?.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-sm font-medium text-muted-foreground">Roles that fit</p>
                <Chips items={resume.suggestedRoles} tone="bg-purple-500/10 text-purple-700 dark:text-purple-300" />
              </div>
            )}
          </section>

          <div className="grid gap-6 md:grid-cols-2">
            <section className="rounded-2xl border bg-card p-6 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 font-semibold">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Skills we found
              </h2>
              <Chips items={resume.skills} tone="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" />
            </section>
            <section className="rounded-2xl border bg-card p-6 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 font-semibold">
                <AlertTriangle className="h-4 w-4 text-amber-500" /> Gaps to prepare for
              </h2>
              {resume.gaps?.length ? (
                <Chips items={resume.gaps} tone="bg-amber-500/10 text-amber-700 dark:text-amber-300" />
              ) : (
                <p className="text-sm text-muted-foreground">No major gaps found.</p>
              )}
            </section>
          </div>

          {resume.projects?.length > 0 && (
            <section className="rounded-2xl border bg-card p-6 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 font-semibold">
                <FolderGit2 className="h-4 w-4 text-blue-500" /> Projects interviewers will ask about
              </h2>
              <ul className="space-y-2 text-sm">
                {resume.projects.map((p) => (
                  <li key={p} className="rounded-xl bg-muted px-4 py-3">
                    {p}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="grid gap-4 sm:grid-cols-2">
            <Link to="/setup" className="group flex items-center gap-4 rounded-2xl border bg-card p-5 shadow-sm transition hover:shadow-lg">
              <Brain className="h-8 w-8 text-blue-600" />
              <div>
                <p className="font-semibold">Personalized MCQ</p>
                <p className="text-sm text-muted-foreground">Tick “Personalize from my resume”</p>
              </div>
            </Link>
            <Link to="/voice" className="group flex items-center gap-4 rounded-2xl border bg-card p-5 shadow-sm transition hover:shadow-lg">
              <Mic className="h-8 w-8 text-purple-600" />
              <div>
                <p className="font-semibold">Personalized voice interview</p>
                <p className="text-sm text-muted-foreground">Get grilled on your own projects</p>
              </div>
            </Link>
          </section>
        </div>
      )}
    </Page>
  );
}
