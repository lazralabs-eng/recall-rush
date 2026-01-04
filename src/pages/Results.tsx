import { Link, useSearchParams } from "react-router-dom";

type RunData = {
  runId: string;
  score: number;
  accuracy: number;
  correct: number;
  answered: number;
  bestStreak: number;
  avgResponseMs: number;
  mode: string;
  deckId: string;
  timestamp: number;
};

function decodeRunData(encoded: string): RunData | null {
  try {
    const json = atob(encoded);
    return JSON.parse(json);
  } catch (err) {
    console.error("Failed to decode run data:", err);
    return null;
  }
}

export default function Results() {
  const [sp] = useSearchParams();
  const runParam = sp.get("r");
  const resultsData = runParam ? decodeRunData(runParam) : null;

  if (!resultsData) {
    return (
      <div className="p-6 max-w-xl mx-auto">
        <div className="mb-4">
          <Link className="text-sm underline opacity-80" to="/">
            ← Menu
          </Link>
        </div>
        <div className="rounded border p-4">
          <div className="text-xl font-bold">Invalid Results Link</div>
          <p className="mt-2 text-sm opacity-70">
            This results link is invalid or corrupted.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <div className="mb-4">
        <Link className="text-sm underline opacity-80" to="/">
          ← Menu
        </Link>
      </div>

      <div className="rounded border p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold">🎯 Results</div>
            <div className="text-xs opacity-50">Shared run</div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-3 rounded bg-gray-50 border">
              <div className="text-xs opacity-70">Score</div>
              <div className="text-xl font-bold">{resultsData.score}</div>
            </div>
            <div className="p-3 rounded bg-gray-50 border">
              <div className="text-xs opacity-70">Accuracy</div>
              <div className="text-xl font-bold">{resultsData.accuracy}%</div>
            </div>
            <div className="p-3 rounded bg-gray-50 border">
              <div className="text-xs opacity-70">Best Streak</div>
              <div className="text-xl font-bold">{resultsData.bestStreak}</div>
            </div>
            <div className="p-3 rounded bg-gray-50 border">
              <div className="text-xs opacity-70">Avg Response</div>
              <div className="text-xl font-bold">
                {resultsData.avgResponseMs}ms
              </div>
            </div>
          </div>

          <div className="p-3 rounded bg-gray-50 border text-sm">
            <div className="flex items-center justify-between">
              <span>✅ Correct:</span>
              <span className="font-semibold">{resultsData.correct}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>❌ Wrong:</span>
              <span className="font-semibold">
                {resultsData.answered - resultsData.correct}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>📊 Total:</span>
              <span className="font-semibold">{resultsData.answered}</span>
            </div>
          </div>

          <div className="text-xs opacity-70 text-center">
            Mode: {resultsData.mode === "sudden" ? "Sudden Death" : "Sprint"} •
            Deck: {resultsData.deckId}
          </div>

          <Link
            to={`/play/${resultsData.deckId}?mode=${resultsData.mode}`}
            className="block w-full px-4 py-2 rounded bg-black text-white hover:bg-gray-800 transition text-center"
          >
            Try This Deck
          </Link>
        </div>
      </div>
    </div>
  );
}
