import { useEffect } from "react";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useBadgeCatalog } from "@/hooks/useBadgeCatalog";
import { celebrate } from "@/lib/celebrate";

// Shown after any completed session: XP gained, level-ups and new badges.
export default function RewardsDialog({ rewards, score, open, onOpenChange }) {
  const catalog = useBadgeCatalog();
  const leveledUp = rewards?.leveledUp;
  const badges = (rewards?.newBadges ?? []).map((id) => catalog[id]).filter(Boolean);

  useEffect(() => {
    if (open && (leveledUp || score === 100 || badges.length)) celebrate(leveledUp || score === 100);
  }, [open, leveledUp, score, badges.length]);

  if (!rewards) return null;
  const progress = rewards.user?.progress;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md text-center">
        <DialogTitle className="text-2xl">{leveledUp ? `Level ${rewards.user.level}! 🎉` : "Session complete"}</DialogTitle>
        <DialogDescription>
          {rewards.xpEarned > 0 ? "Nice work — here's what you earned." : "Recorded in your history."}
        </DialogDescription>

        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
          className="my-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-5xl font-extrabold text-transparent"
        >
          +{rewards.xpEarned} XP
        </motion.div>

        {progress && (
          <div className="text-left">
            <div className="mb-1 flex justify-between text-xs text-muted-foreground">
              <span>Level {progress.level}</span>
              <span>
                {progress.current} / {progress.needed} XP
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-blue-600 to-purple-600"
                initial={{ width: 0 }}
                animate={{ width: `${progress.pct}%` }}
                transition={{ duration: 0.9, delay: 0.2 }}
              />
            </div>
          </div>
        )}

        {badges.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-sm font-semibold">New badge{badges.length > 1 ? "s" : ""} unlocked</p>
            {badges.map((b, i) => (
              <motion.div
                key={b.id}
                initial={{ y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 + i * 0.15 }}
                className="flex items-center gap-3 rounded-xl border bg-amber-50 p-3 text-left dark:bg-amber-950/20"
              >
                <span className="text-3xl">{b.icon}</span>
                <span>
                  <span className="block font-semibold">{b.name}</span>
                  <span className="block text-xs text-muted-foreground">{b.description}</span>
                </span>
              </motion.div>
            ))}
          </div>
        )}

        <Button className="mt-4 w-full" onClick={() => onOpenChange(false)}>
          See my report
        </Button>
      </DialogContent>
    </Dialog>
  );
}
