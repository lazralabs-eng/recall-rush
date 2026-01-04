export type ScoreEvent =
  | { type: "correct"; responseMs: number; perCardMs: number }
  | { type: "wrong" }
  | { type: "timeout" };

export type ScoreState = {
  score: number;
  streak: number;
  bestStreak: number;

  // bonus system: every 5 correct streak earns a "bonus block" for next 5 correct
  bonusMultiplier: number; // 1 or 2 (keep simple)
  bonusRemaining: number; // counts down on correct answers only
};

export function initialScoreState(): ScoreState {
  return {
    score: 0,
    streak: 0,
    bestStreak: 0,
    bonusMultiplier: 1,
    bonusRemaining: 0,
  };
}

export function applyScoreEvent(s: ScoreState, e: ScoreEvent): ScoreState {
  const next = { ...s };

  if (e.type === "correct") {
    const slowThreshold = Math.floor(e.perCardMs * 0.8);
    const base = e.responseMs > slowThreshold ? 6 : 10;

    const points = base * next.bonusMultiplier;
    next.score += points;

    next.streak += 1;
    next.bestStreak = Math.max(next.bestStreak, next.streak);

    // consume bonus on correct only
    if (next.bonusRemaining > 0) {
      next.bonusRemaining -= 1;
      if (next.bonusRemaining === 0) next.bonusMultiplier = 1;
    }

    // every 5 correct streak => activate bonus for next 5 correct
    if (next.streak > 0 && next.streak % 5 === 0) {
      next.bonusMultiplier = 2;
      next.bonusRemaining = 5;
    }

    return next;
  }

  if (e.type === "wrong") {
    next.score += -4;
    next.streak = 0;
    next.bonusMultiplier = 1;
    next.bonusRemaining = 0;
    return next;
  }

  // timeout
  next.score += -6;
  next.streak = 0;
  next.bonusMultiplier = 1;
  next.bonusRemaining = 0;
  return next;
}
