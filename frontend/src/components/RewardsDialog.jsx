import { useEffect } from "react";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/common";
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
      <DialogContent className="max-w-sm gap-0 p-0">
        <div className="p-6 text-center">
          <DialogTitle className="text-base font-semibold">{leveledUp ? `You reached level ${rewards.user.level}` : "Session complete"}</DialogTitle>
          <DialogDescription className="mt-1 text-sm">
            {rewards.xpEarned > 0 ? "Here's what you earned." : "Saved to your history."}
          </DialogDescription>
          <motion.p
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 22 }}
            className="tabular my-5 text-5xl font-semibold tracking-tight text-primary"
          >
            +{rewards.xpEarned} <span className="text-2xl text-muted-foreground">XP</span>
          </motion.p>
          {progress && (
            <div className="text-left">
              <div className="tabular mb-1.5 flex justify-between text-xs text-muted-foreground">
                <span>Level {progress.level}</span>
                <span>
                  {progress.current} / {progress.needed} XP
                </span>
              </div>
              <ProgressBar value={progress.pct} />
            </div>
          )}
        </div>

        {badges.length > 0 && (
          <div className="space-y-2 border-t bg-muted/40 p-4">
            <p className="text-xs font-medium text-muted-foreground">New badge{badges.length > 1 ? "s" : ""}</p>
            {badges.map((b, i) => (
              <motion.div
                key={b.id}
                initial={{ y: 8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.25 + i * 0.1 }}
                className="flex items-center gap-3 rounded-lg border bg-card p-2.5 text-left"
              >
                <span className="text-2xl">{b.icon}</span>
                <span>
                  <span className="block text-sm font-medium">{b.name}</span>
                  <span className="block text-xs text-muted-foreground">{b.description}</span>
                </span>
              </motion.div>
            ))}
          </div>
        )}

        <div className="border-t p-4">
          <Button className="w-full" onClick={() => onOpenChange(false)}>
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
