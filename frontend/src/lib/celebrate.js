import confetti from "canvas-confetti";

const reduceMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export function celebrate(big = false) {
  if (reduceMotion()) return;
  const colors = ["#2563eb", "#7c3aed", "#f59e0b", "#10b981"];
  if (!big) {
    confetti({ particleCount: 90, spread: 70, origin: { y: 0.65 }, colors });
    return;
  }
  const end = Date.now() + 1200;
  (function frame() {
    confetti({ particleCount: 5, angle: 60, spread: 60, origin: { x: 0 }, colors });
    confetti({ particleCount: 5, angle: 120, spread: 60, origin: { x: 1 }, colors });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}
