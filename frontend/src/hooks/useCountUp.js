import { useEffect, useState } from "react";

const reduceMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// Animates a number from 0 to `target` (ease-out). Non-numbers pass straight through.
export function useCountUp(target, duration = 700) {
  const numeric = typeof target === "number" && Number.isFinite(target);
  const [value, setValue] = useState(numeric && !reduceMotion() ? 0 : target);

  useEffect(() => {
    if (!numeric || reduceMotion()) {
      setValue(target);
      return;
    }
    let frame;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      setValue(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, numeric, duration]);

  return value;
}
