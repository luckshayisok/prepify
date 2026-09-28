// Weak-area breakdown for MCQ answers: per topic and per difficulty.
export function breakdown(answers = []) {
  const tally = (keyFn) => {
    const map = {};
    for (const a of answers) {
      const key = keyFn(a) || "General";
      map[key] ??= { correct: 0, total: 0 };
      map[key].total++;
      if (a.isCorrect) map[key].correct++;
    }
    return Object.entries(map)
      .map(([name, { correct, total }]) => ({ name, correct, total, accuracy: Math.round((correct / total) * 100) }))
      .sort((a, b) => a.accuracy - b.accuracy || b.total - a.total);
  };

  const unanswered = answers.filter((a) => a.selectedOption == null).length;
  const timed = answers.filter((a) => typeof a.timeSpentSec === "number");
  const avgTimeSec = timed.length ? Math.round(timed.reduce((s, a) => s + a.timeSpentSec, 0) / timed.length) : null;

  return {
    topics: tally((a) => a.topic),
    difficulties: tally((a) => a.difficulty),
    unanswered,
    avgTimeSec,
  };
}
