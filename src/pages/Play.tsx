import { Link, useParams, useSearchParams } from "react-router-dom";
import { useState } from "react";
import { usePlaySession } from "../features/play/usePlaySession";

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

function encodeRunData(data: RunData): string {
  const json = JSON.stringify(data);
  return btoa(json);
}

function decodeRunData(encoded: string): RunData | null {
  try {
    const json = atob(encoded);
    return JSON.parse(json);
  } catch (err) {
    console.error("Failed to decode run data:", err);
    return null;
  }
}

function buildShareText({
  mode,
  deckId,
  score,
  stats,
  bestStreak,
}: {
  mode: string;
  deckId: string;
  score: number;
  stats: { correct: number; answered: number; avgResponseMs: number };
  bestStreak: number;
}) {
  const acc =
    stats.answered > 0 ? Math.round((stats.correct / stats.answered) * 100) : 0;
  const modeLabel = mode === "sudden" ? "Sudden Death" : "Sprint";

  return `Recall Rush — ${modeLabel}
Score: ${score}
Accuracy: ${acc}% (${stats.correct}/${stats.answered})
Best streak: ${bestStreak}
Avg: ${stats.avgResponseMs}ms
Deck: ${deckId}`;
}

export default function Play() {
  const { deckId = "demo" } = useParams();
  const [sp] = useSearchParams();
  const mode = (sp.get("mode") === "sudden" ? "sudden" : "sprint") as
    | "sprint"
    | "sudden";

  const session = usePlaySession(deckId, mode);
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  // Parse shared run from URL parameter
  const runParam = sp.get("r");
  const sharedRun = runParam ? decodeRunData(runParam) : null;
  const [dismissed, setDismissed] = useState(false);

  const secs = Math.ceil(session.remainingMs / 1000);

  const cardPct =
    session.phase === "playing" || session.phase === "reveal"
      ? Math.max(
          0,
          Math.min(100, (session.cardRemainingMs / session.cfg.perCardMs) * 100)
        )
      : 0;

  const isReveal = session.phase === "reveal";
  const buttonsDisabled = session.phase !== "playing";

  // Determine which results to show
  const activeSharedRun = sharedRun && !dismissed ? sharedRun : null;
  const resultsData =
    activeSharedRun ||
    (session.phase === "finished"
      ? {
          runId: session.runId,
          score: session.scoreState.score,
          accuracy:
            session.stats.answered > 0
              ? Math.round(
                  (session.stats.correct / session.stats.answered) * 100
                )
              : 0,
          correct: session.stats.correct,
          answered: session.stats.answered,
          bestStreak: session.scoreState.bestStreak,
          avgResponseMs: session.stats.avgResponseMs,
          mode,
          deckId,
          timestamp: session.finishedAt,
        }
      : null);

  async function handleShare() {
    const text = buildShareText({
      mode,
      deckId,
      score: session.scoreState.score,
      stats: session.stats,
      bestStreak: session.scoreState.bestStreak,
    });

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("Clipboard failed:", err);
    }
  }

  async function handleShareLink() {
    const accuracy =
      session.stats.answered > 0
        ? Math.round((session.stats.correct / session.stats.answered) * 100)
        : 0;

    const runData: RunData = {
      runId: session.runId,
      score: session.scoreState.score,
      accuracy,
      correct: session.stats.correct,
      answered: session.stats.answered,
      bestStreak: session.scoreState.bestStreak,
      avgResponseMs: session.stats.avgResponseMs,
      mode,
      deckId,
      timestamp: Date.now(),
    };

    const encoded = encodeRunData(runData);
    const base = window.location.origin;
    const link = `${base}/play/${deckId}?mode=${mode}&r=${encoded}`;

    try {
      await navigator.clipboard.writeText(link);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 1500);
    } catch (err) {
      console.error("Clipboard failed:", err);
    }
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      {/* tiny scoped CSS for the game feel */}
      <style>{`
        @keyframes rrFlashGreen {
          0% { background-color: transparent; border-color: rgba(0,0,0,0.2); }
          20% { background-color: rgba(34,197,94,0.22); border-color: rgba(34,197,94,0.95); }
          100% { background-color: transparent; border-color: rgba(0,0,0,0.2); }
        }
        @keyframes rrFlashRed {
          0% { background-color: transparent; border-color: rgba(0,0,0,0.2); }
          20% { background-color: rgba(239,68,68,0.22); border-color: rgba(239,68,68,0.95); }
          100% { background-color: transparent; border-color: rgba(0,0,0,0.2); }
        }
        @keyframes rrShake {
          0% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
          100% { transform: translateX(0); }
        }
        .rr-btn-green { animation: rrFlashGreen 180ms ease-out; }
        .rr-btn-red { animation: rrFlashRed 180ms ease-out; }
        .rr-flash-green { animation: rrFlashGreen 180ms ease-out; }
        .rr-flash-red { animation: rrFlashRed 180ms ease-out; }
        .rr-shake { animation: rrShake 180ms ease-out; }
        .rr-correct-highlight {
          background-color: rgba(34,197,94,0.15);
          border-color: rgba(34,197,94,0.8);
        }
      `}</style>

      <div className="mb-4">
        <Link className="text-sm underline opacity-80" to="/">
          ← Menu
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm opacity-70">
            Deck: {deckId} • Mode: {mode}
          </div>
          <div className="text-2xl font-bold">⏱️ {secs}s</div>
        </div>

        <div className="text-right">
          <div className="text-sm opacity-70">Score</div>
          <div className="text-2xl font-bold">{session.scoreState.score}</div>
          <div className="text-xs opacity-70">
            Streak {session.scoreState.streak} (best{" "}
            {session.scoreState.bestStreak})
          </div>
        </div>
      </div>

      <div className="mt-6 rounded border p-4">
        {resultsData ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">🎯 Results</div>
              {activeSharedRun && (
                <div className="text-xs opacity-50">Shared run</div>
              )}
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
                <div className="text-xl font-bold">
                  {resultsData.bestStreak}
                </div>
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
              Mode: {resultsData.mode === "sudden" ? "Sudden Death" : "Sprint"}{" "}
              • Deck: {resultsData.deckId}
            </div>

            {!activeSharedRun && (
              <>
                <div className="flex gap-2">
                  <button
                    onClick={handleShare}
                    className="flex-1 px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 transition"
                  >
                    {copied ? "✓ Copied!" : "Share Score"}
                  </button>
                  <button
                    onClick={handleShareLink}
                    className="flex-1 px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 transition"
                  >
                    {linkCopied ? "✓ Copied!" : "Copy Link"}
                  </button>
                </div>

                <button
                  onClick={session.start}
                  className="w-full px-4 py-2 rounded bg-black text-white hover:bg-gray-800 transition"
                >
                  Play Again
                </button>
              </>
            )}

            {activeSharedRun && (
              <button
                onClick={() => {
                  setDismissed(true);
                  window.history.replaceState(
                    {},
                    "",
                    `/play/${deckId}?mode=${mode}`
                  );
                }}
                className="w-full px-4 py-2 rounded bg-black text-white hover:bg-gray-800 transition"
              >
                Try This Deck
              </button>
            )}
          </div>
        ) : session.phase === "ready" ? (
          <div className="space-y-3">
            <div className="text-lg font-semibold">Ready?</div>
            <button
              onClick={session.start}
              className="px-4 py-2 rounded bg-black text-white"
            >
              Start
            </button>
            <div className="text-sm opacity-70">
              Tap answers • Correct: +10 (or +6 if slow) • Wrong: −4 • Timeout:
              −6 • Bonus every 5 streak
            </div>
          </div>
        ) : session.current ? (
          <div
            key={session.feedbackTick}
            className={`space-y-3 ${
              session.feedback === "wrong" || session.feedback === "timeout"
                ? "rr-shake"
                : ""
            }`}
          >
            <div className="text-sm opacity-70">
              Card {session.index + 1} / {session.deck.length}
            </div>

            {/* per-card countdown */}
            <div className="h-2 w-full rounded bg-gray-200 overflow-hidden">
              <div
                className="h-full bg-black"
                style={{ width: `${cardPct}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs opacity-70">
              <span>Per-card</span>
              <span>{Math.ceil(session.cardRemainingMs / 1000)}s</span>
            </div>

            <div className="text-xl font-semibold">
              {session.current.prompt}
            </div>

            {/* choices */}
            <div className="grid grid-cols-1 gap-2">
              {session.current.choices.map((c, i) => {
                const isSelected = session.lastChoiceIndex === i;
                const isCorrect = i === session.current?.correctIndex;

                let btnClass =
                  "w-full text-left px-3 py-2 rounded border transition ";

                if (buttonsDisabled) {
                  btnClass += "cursor-not-allowed opacity-70 ";
                } else {
                  btnClass += "hover:bg-black hover:text-white ";
                }

                // Highlight correct answer during reveal
                if (isReveal && isCorrect) {
                  btnClass += "rr-correct-highlight ";
                }

                // Flash selected button
                if (isSelected) {
                  if (session.feedback === "correct") {
                    btnClass += "rr-btn-green ";
                  } else if (
                    session.feedback === "wrong" ||
                    session.feedback === "timeout"
                  ) {
                    btnClass += "rr-btn-red ";
                  }
                }

                return (
                  <button
                    key={`${i}-${session.feedbackTick}`}
                    onClick={() => session.choose(i)}
                    disabled={buttonsDisabled}
                    className={btnClass}
                  >
                    {c}
                  </button>
                );
              })}
            </div>

            <div className="text-xs opacity-60">
              Stats — ✅ {session.stats.correct} | ❌ {session.stats.wrong} | ⏳{" "}
              {session.stats.timeout}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-2xl font-bold">🎯 Results</div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 rounded bg-gray-50 border">
                <div className="text-xs opacity-70">Score</div>
                <div className="text-xl font-bold">
                  {session.scoreState.score}
                </div>
              </div>
              <div className="p-3 rounded bg-gray-50 border">
                <div className="text-xs opacity-70">Accuracy</div>
                <div className="text-xl font-bold">
                  {session.stats.answered > 0
                    ? Math.round(
                        (session.stats.correct / session.stats.answered) * 100
                      )
                    : 0}
                  %
                </div>
              </div>
              <div className="p-3 rounded bg-gray-50 border">
                <div className="text-xs opacity-70">Best Streak</div>
                <div className="text-xl font-bold">
                  {session.scoreState.bestStreak}
                </div>
              </div>
              <div className="p-3 rounded bg-gray-50 border">
                <div className="text-xs opacity-70">Avg Response</div>
                <div className="text-xl font-bold">
                  {session.stats.avgResponseMs}ms
                </div>
              </div>
            </div>

            <div className="p-3 rounded bg-gray-50 border text-sm">
              <div className="flex items-center justify-between">
                <span>✅ Correct:</span>
                <span className="font-semibold">{session.stats.correct}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>❌ Wrong:</span>
                <span className="font-semibold">{session.stats.wrong}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>⏳ Timeout:</span>
                <span className="font-semibold">{session.stats.timeout}</span>
              </div>
            </div>

            <div className="text-xs opacity-70 text-center">
              Mode: {mode === "sudden" ? "Sudden Death" : "Sprint"} • Deck:{" "}
              {deckId}
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleShare}
                className="flex-1 px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 transition"
              >
                {copied ? "✓ Copied!" : "Share Score"}
              </button>
              <button
                onClick={handleShareLink}
                className="flex-1 px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 transition"
              >
                {linkCopied ? "✓ Copied!" : "Copy Link"}
              </button>
            </div>

            <button
              onClick={session.start}
              className="w-full px-4 py-2 rounded bg-black text-white hover:bg-gray-800 transition"
            >
              Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
