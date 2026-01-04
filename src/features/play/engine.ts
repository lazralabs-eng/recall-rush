import { applyScoreEvent, initialScoreState, type ScoreState } from "./scoring";

export type Mode = "sprint" | "sudden";

export type Card = {
  id: string;
  prompt: string;
  choices: string[];
  correctIndex: number; // index into choices
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
  totalMs: number;
  perCardMs: number;
};

export function configFor(mode: Mode): PlayConfig {
  // keep same for now (sudden death still caps at 60s total)
  return { mode, totalMs: 60_000, perCardMs: 6000 };
}

// Demo deck (MC/TF style). Replace later with Supabase.
export function getDemoDeck(_deckId: string): Card[] {
  return [
    {
      id: "1",
      prompt: "CPU stands for…",
      choices: [
        "Central Processing Unit",
        "Computer Personal Unit",
        "Core Power Utility",
        "Central Program Upload",
      ],
      correctIndex: 0,
    },
    {
      id: "2",
      prompt: "2 + 2 =",
      choices: ["3", "4", "5", "22"],
      correctIndex: 1,
    },
    {
      id: "3",
      prompt: "Capital of France?",
      choices: ["Rome", "Berlin", "Paris", "Madrid"],
      correctIndex: 2,
    },
    {
      id: "4",
      prompt: "Water’s chemical formula is…",
      choices: ["CO2", "H2O", "NaCl", "O2"],
      correctIndex: 1,
    },
    {
      id: "5",
      prompt: "Derivative of x² is…",
      choices: ["x", "2x", "x²", "2"],
      correctIndex: 1,
    },
    // True/False as 2-choice MC
    {
      id: "6",
      prompt: "True or False: The Pacific is larger than the Atlantic.",
      choices: ["True", "False"],
      correctIndex: 0,
    },
  ];
}

export function isChoiceCorrect(
  selectedIndex: number,
  correctIndex: number
): boolean {
  return selectedIndex === correctIndex;
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
