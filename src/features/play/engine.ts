import { applyScoreEvent, initialScoreState, type ScoreState } from "./scoring";

export type Mode = "sprint" | "sudden";

export type Card = {
  id: string;
  prompt: string;
  answer: string;
};

export type RunStats = {
  correct: number;
  wrong: number;
  timeout: number;
  answered: number;
  avgResponseMs: number;
};

export type PlayConfig = {
  mode: Mode;
  totalMs: number; // sprint = 60s, sudden = effectively infinite
  perCardMs: number; // default 6000ms
};

export function configFor(mode: Mode): PlayConfig {
  if (mode === "sudden") {
    return { mode, totalMs: 60_000, perCardMs: 6000 }; // still keep an overall cap
  }
  return { mode, totalMs: 60_000, perCardMs: 6000 };
}

// Demo deck (replace later with Supabase)
export function getDemoDeck(_deckId: string): Card[] {
  // You can branch by deckId later. For now: one deck.
  return [
    {
      id: "1",
      prompt: "What does CPU stand for?",
      answer: "central processing unit",
    },
    { id: "2", prompt: "2 + 2 =", answer: "4" },
    { id: "3", prompt: "Capital of France?", answer: "paris" },
    {
      id: "4",
      prompt: "What is the chemical symbol for water?",
      answer: "h2o",
    },
    { id: "5", prompt: "Derivative of x^2?", answer: "2x" },
    { id: "6", prompt: "Opposite of 'expand'?", answer: "contract" },
  ];
}

export function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

export function isCorrect(userAnswer: string, correctAnswer: string): boolean {
  return normalize(userAnswer) === normalize(correctAnswer);
}

export function updateStats(
  stats: RunStats,
  kind: "correct" | "wrong" | "timeout",
  responseMs?: number
): RunStats {
  const next = { ...stats };
  if (kind === "correct") next.correct += 1;
  if (kind === "wrong") next.wrong += 1;
  if (kind === "timeout") next.timeout += 1;
  next.answered += 1;

  if (typeof responseMs === "number") {
    // running average
    next.avgResponseMs = Math.round(
      (next.avgResponseMs * (next.answered - 1) + responseMs) / next.answered
    );
  }
  return next;
}

export function initialStats(): RunStats {
  return { correct: 0, wrong: 0, timeout: 0, answered: 0, avgResponseMs: 0 };
}

export function scoreCorrect(
  score: ScoreState,
  responseMs: number,
  perCardMs: number
) {
  return applyScoreEvent(score, { type: "correct", responseMs, perCardMs });
}
export function scoreWrong(score: ScoreState) {
  return applyScoreEvent(score, { type: "wrong" });
}
export function scoreTimeout(score: ScoreState) {
  return applyScoreEvent(score, { type: "timeout" });
}

export { initialScoreState };
