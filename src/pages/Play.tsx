import { Link, useParams, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { usePlaySession } from "../features/play/usePlaySession";
import { tileForEvent, emojiGrid, type Tile } from "../features/play/shareGrid";
import { RunGrid } from "../components/RunGrid";
import { getDevOverrideInfo } from "../features/play/dailySeed";

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
  tiles: Tile[];
  maxScore: number;
  deckLabel?: string;
  dayKey?: string;
};

function encodeRunData(data: RunData): string {
  // Compact: stats + mode + deck + tiles + dayKey
  const compact = [
    data.score,
    data.accuracy,
    data.bestStreak,
    data.avgResponseMs,
    data.mode,
    data.deckId,
    data.tiles,
    data.maxScore,
    data.deckLabel,
    data.dayKey,
  ];
  return btoa(JSON.stringify(compact));
}

function decodeRunData(encoded: string): RunData | null {
  try {
    const json = atob(encoded);
    const parsed = JSON.parse(json);

    // Handle array format [score, accuracy, streak, avgMs, mode?, deck?, tiles?, maxScore?, deckLabel?, dayKey?]
    if (Array.isArray(parsed)) {
      const tiles = parsed[6] && Array.isArray(parsed[6]) ? parsed[6] : [];

      return {
        runId: "",
        score: parsed[0] || 0,
        accuracy: parsed[1] || 0,
        correct: 0,
        answered: 0,
        bestStreak: parsed[2] || 0,
        avgResponseMs: parsed[3] || 0,
        mode: "sprint", // Always sprint
        deckId: parsed[5] || "nfl-playoffs",
        timestamp: 0,
        tiles,
        maxScore: parsed[7] || 450,
        deckLabel: parsed[8],
        dayKey: parsed[9],
      };
    }

    // Handle compact object format {s, a, c, ans, bs, ar, m, d}
    if (parsed.s !== undefined) {
      return {
        runId: "",
        score: parsed.s,
        accuracy: parsed.a,
        correct: parsed.c,
        answered: parsed.ans,
        bestStreak: parsed.bs,
        avgResponseMs: parsed.ar,
        mode: "sprint", // Always sprint
        deckId: parsed.d,
        timestamp: 0,
        tiles: parsed.tiles || [],
        maxScore: parsed.maxScore || 450,
        deckLabel: parsed.deckLabel,
        dayKey: parsed.dayKey,
      };
    }

    // Handle old format for backwards compatibility
    return {
      ...parsed,
      tiles: parsed.tiles || [],
      maxScore: parsed.maxScore || 450,
    };
  } catch (err) {
    console.error("Failed to decode run data:", err);
    return null;
  }
}

function buildShareData({
  score,
  maxScore,
  tiles,
  resultsLink,
}: {
  score: number;
  maxScore: number;
  tiles: Tile[];
  resultsLink: string;
}) {
  // Use 5 tiles per row for better mobile/desktop compatibility
  const grid = emojiGrid(tiles, 5);

  const title = `Recall Rush — Daily Sprint`;
  const text = `${score}/${maxScore}

${grid}`;

  return { title, text, url: resultsLink };
}

export default function Play() {
  const { deckId = "nfl-playoffs" } = useParams();
  const [sp, setSp] = useSearchParams();
  // Force sprint mode - ignore any mode parameter
  const mode = "sprint" as const;

  const session = usePlaySession(deckId, mode);
  const [copied, setCopied] = useState(false);

  // Handle reset parameter to clear localStorage locks
  useEffect(() => {
    const resetParam = sp.get("reset");
    if (resetParam === "1") {
      console.log("[RR] Reset triggered - clearing locks for", deckId, session.dayKey);
      const lockKey = `rr:played:${deckId}:${session.dayKey}`;
      const lastRunKey = `rr:lastRun:${deckId}:${session.dayKey}`;
      localStorage.removeItem(lockKey);
      localStorage.removeItem(lastRunKey);
      console.log("[RR] Cleared:", lockKey, lastRunKey);

      // Remove reset parameter from URL
      const newParams = new URLSearchParams(sp);
      newParams.delete("reset");
      setSp(newParams, { replace: true });

      // Force reload
      console.log("[RR] Reloading page...");
      window.location.reload();
    }
  }, [sp, setSp, deckId, session.dayKey]);

  // Parse shared run from URL parameter
  const runParam = sp.get("r");
  const sharedRun = runParam ? decodeRunData(runParam) : null;
  const [dismissed, setDismissed] = useState(false);

  // Get dev override info
  const devInfo = getDevOverrideInfo();

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
          tiles: session.answerEvents.map((evt) => tileForEvent(evt)),
          maxScore: 450,
          dayKey: session.dayKey,
        }
      : null);

  async function handleShare() {
    const accuracy =
      session.stats.answered > 0
        ? Math.round((session.stats.correct / session.stats.answered) * 100)
        : 0;

    // Generate tiles from answer events
    const tiles = session.answerEvents.map((evt) => tileForEvent(evt));

    // Format deck label
    const deckLabel =
      deckId === "nfl-playoffs"
        ? "NFL Playoffs"
        : deckId === "demo"
        ? "Demo"
        : deckId.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

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
      tiles,
      maxScore: 450,
      deckLabel,
      dayKey: session.dayKey,
    };

    const encoded = encodeRunData(runData);
    const base = window.location.origin;
    const resultsLink = `${base}/results?r=${encoded}`;

    const shareData = buildShareData({
      score: session.scoreState.score,
      maxScore: 450,
      tiles,
      resultsLink,
    });

    try {
      // Try native share first (mobile)
      if (navigator.share) {
        await navigator.share(shareData);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      } else {
        // Fall back to clipboard with formatted text
        const fallbackText = `${shareData.title}\n${shareData.text}\n\n🔗 ${shareData.url}`;
        await navigator.clipboard.writeText(fallbackText);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }
    } catch (err) {
      console.error("Share/clipboard failed:", err);
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

      {devInfo && (
        <div className="mb-2 text-xs bg-yellow-100 border border-yellow-300 rounded px-2 py-1">
          {devInfo}
        </div>
      )}

      {session.phase === "locked" && !sharedRun ? (
        <div className="rounded border p-6 text-center">
          <h2 className="text-2xl font-bold mb-3">Thanks for playing today!</h2>
          <p className="text-lg opacity-80 mb-6">
            Come back tomorrow for a new challenge.
          </p>
          <p className="text-sm opacity-60 mb-4">
            Daily Sprint • {session.dayKey}
          </p>
          <Link
            to="/"
            className="inline-block px-6 py-3 rounded bg-black text-white hover:bg-gray-800 transition font-semibold"
          >
            Back to Home
          </Link>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm opacity-70">
                Daily Sprint{session.dayKey && ` • ${session.dayKey}`}
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

            {resultsData.tiles && resultsData.tiles.length > 0 && (
              <div className="p-4 rounded bg-gray-50 border">
                <div className="text-center mb-2 font-semibold">
                  {resultsData.score}/{resultsData.maxScore || 450}
                </div>
                <div className="py-2">
                  <RunGrid pattern={resultsData.tiles} size="lg" />
                </div>
              </div>
            )}

            <div className="text-xs opacity-70 text-center">
              Daily Sprint{resultsData.dayKey && ` • ${resultsData.dayKey}`}
            </div>

            {!activeSharedRun && (
              <>
                <button
                  onClick={handleShare}
                  className="w-full px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 transition"
                >
                  {copied ? "✓ Copied!" : "Share Score"}
                </button>

                {!session.isLocked && (
                  <button
                    onClick={session.start}
                    className="w-full px-4 py-2 rounded bg-black text-white hover:bg-gray-800 transition font-semibold"
                  >
                    Play Again
                  </button>
                )}
                {session.isLocked && (
                  <div className="text-center py-3 text-sm opacity-70">
                    Thanks for playing! Come back tomorrow for a new challenge.
                  </div>
                )}
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

            {session.answerEvents.length > 0 && (
              <div className="p-4 rounded bg-gray-50 border">
                <div className="text-center mb-2 font-semibold">
                  {session.scoreState.score}/450
                </div>
                <div className="py-2">
                  <RunGrid
                    pattern={session.answerEvents.map((evt) => tileForEvent(evt))}
                    size="lg"
                  />
                </div>
              </div>
            )}

            <div className="text-xs opacity-70 text-center">
              Daily Sprint
            </div>

            <button
              onClick={handleShare}
              className="w-full px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 transition"
            >
              {copied ? "✓ Copied!" : "Share Score"}
            </button>

            {!session.isLocked && (
              <button
                onClick={session.start}
                className="w-full px-4 py-2 rounded bg-black text-white hover:bg-gray-800 transition font-semibold"
              >
                Play Again
              </button>
            )}
            {session.isLocked && (
              <div className="text-center py-3 text-sm opacity-70">
                Thanks for playing! Come back tomorrow for a new challenge.
              </div>
            )}
          </div>
        )}
      </div>
        </>
      )}
    </div>
  );
}
