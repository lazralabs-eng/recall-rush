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
export function getDemoDeck(): Card[] {
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
      prompt: "Water's chemical formula is…",
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

// NFL Playoffs deck (25 cards: warm-up → mid → pressure → killers)
export function getNFLPlayoffsDeck(): Card[] {
  return [
    // WARM-UP (1-5): Easy questions
    {
      id: "nfl-1",
      prompt: "How many teams make the NFL playoffs?",
      choices: ["12", "14", "16", "18"],
      correctIndex: 1,
    },
    {
      id: "nfl-2",
      prompt: "The Super Bowl winner receives which trophy?",
      choices: ["Stanley Cup", "Lombardi Trophy", "Larry O'Brien Trophy", "Commissioner's Trophy"],
      correctIndex: 1,
    },
    {
      id: "nfl-3",
      prompt: "True or False: The Super Bowl is always played on a Sunday.",
      choices: ["True", "False"],
      correctIndex: 0,
    },
    {
      id: "nfl-4",
      prompt: "How many divisions are in each NFL conference?",
      choices: ["2", "3", "4", "5"],
      correctIndex: 2,
    },
    {
      id: "nfl-5",
      prompt: "Which seed gets a first-round bye in the playoffs?",
      choices: ["#1 seed only", "#1 and #2 seeds", "#1, #2, and #3 seeds", "No teams get a bye"],
      correctIndex: 0,
    },

    // MID (6-15): Medium difficulty
    {
      id: "nfl-6",
      prompt: "True or False: Wild Card teams can host playoff games.",
      choices: ["True", "False"],
      correctIndex: 0,
    },
    {
      id: "nfl-7",
      prompt: "Which team has won the most Super Bowls?",
      choices: ["Dallas Cowboys", "New England Patriots", "Pittsburgh Steelers", "Tied: Patriots & Steelers"],
      correctIndex: 2,
    },
    {
      id: "nfl-8",
      prompt: "What is the maximum number of Wild Card teams per conference?",
      choices: ["2", "3", "4", "5"],
      correctIndex: 1,
    },
    {
      id: "nfl-9",
      prompt: "The NFL Championship Game was renamed the Super Bowl in which year?",
      choices: ["1967", "1970", "1975", "1980"],
      correctIndex: 0,
    },
    {
      id: "nfl-10",
      prompt: "True or False: Division winners are always seeded higher than Wild Cards.",
      choices: ["True", "False"],
      correctIndex: 0,
    },
    {
      id: "nfl-11",
      prompt: "Which QB has the most playoff wins all-time?",
      choices: ["Joe Montana", "Peyton Manning", "Tom Brady", "Brett Favre"],
      correctIndex: 2,
    },
    {
      id: "nfl-12",
      prompt: "How many teams from each conference make the playoffs?",
      choices: ["5", "6", "7", "8"],
      correctIndex: 2,
    },
    {
      id: "nfl-13",
      prompt: "True or False: The Super Bowl has never gone to overtime.",
      choices: ["True", "False"],
      correctIndex: 1,
    },
    {
      id: "nfl-14",
      prompt: "Which team has appeared in the most Super Bowls?",
      choices: ["Pittsburgh Steelers", "Dallas Cowboys", "New England Patriots", "San Francisco 49ers"],
      correctIndex: 2,
    },
    {
      id: "nfl-15",
      prompt: "What round comes after the Wild Card round?",
      choices: ["Conference Championship", "Divisional Round", "Super Bowl", "Pro Bowl"],
      correctIndex: 1,
    },

    // PRESSURE (16-20): Harder questions
    {
      id: "nfl-16",
      prompt: "Which was the first Wild Card team to win the Super Bowl?",
      choices: ["Oakland Raiders (1980)", "Denver Broncos (1997)", "Green Bay Packers (2010)", "New York Giants (2007)"],
      correctIndex: 0,
    },
    {
      id: "nfl-17",
      prompt: "True or False: A team can make the playoffs with a losing record.",
      choices: ["True", "False"],
      correctIndex: 0,
    },
    {
      id: "nfl-18",
      prompt: "The 'Immaculate Reception' happened in which playoff year?",
      choices: ["1970", "1972", "1975", "1978"],
      correctIndex: 1,
    },
    {
      id: "nfl-19",
      prompt: "Which team lost four consecutive Super Bowls in the 1990s?",
      choices: ["Buffalo Bills", "Minnesota Vikings", "Denver Broncos", "New England Patriots"],
      correctIndex: 0,
    },
    {
      id: "nfl-20",
      prompt: "How many playoff games did the 2007 Patriots lose?",
      choices: ["0", "1", "2", "3"],
      correctIndex: 1,
    },

    // KILLERS (21-25): Very difficult
    {
      id: "nfl-21",
      prompt: "What was the original name of the AFC Championship trophy?",
      choices: ["Lamar Hunt Trophy", "George Halas Trophy", "Pete Rozelle Trophy", "Art Rooney Trophy"],
      correctIndex: 0,
    },
    {
      id: "nfl-22",
      prompt: "True or False: The 2010 Seahawks made the playoffs with a 7-9 record and won a playoff game.",
      choices: ["True", "False"],
      correctIndex: 0,
    },
    {
      id: "nfl-23",
      prompt: "Which QB threw for 6 TDs in a single playoff game first?",
      choices: ["Dan Marino", "Steve Young", "Daryle Lamonica", "Tom Brady"],
      correctIndex: 2,
    },
    {
      id: "nfl-24",
      prompt: "The NFL adopted a 14-team playoff format in which season?",
      choices: ["2018", "2019", "2020", "2021"],
      correctIndex: 2,
    },
    {
      id: "nfl-25",
      prompt: "Which team has the longest active playoff win drought (as of 2024)?",
      choices: ["Detroit Lions", "Cleveland Browns", "Cincinnati Bengals", "Miami Dolphins"],
      correctIndex: 2,
    },
  ];
}

// Get deck by ID
export function getDeck(deckId: string): Card[] {
  switch (deckId) {
    case "demo":
      return getDemoDeck();
    case "nfl-playoffs":
      return getNFLPlayoffsDeck();
    default:
      return getDemoDeck();
  }
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
