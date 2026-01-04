import { Link, useParams, useSearchParams } from "react-router-dom";
import { usePlaySession } from "../features/play/usePlaySession";

export default function Play() {
  const { deckId = "demo" } = useParams();
  const [sp] = useSearchParams();
  const mode = (sp.get("mode") === "sudden" ? "sudden" : "sprint") as
    | "sprint"
    | "sudden";

  const session = usePlaySession(deckId, mode);

  const secs = Math.ceil(session.remainingMs / 1000);

  const cardPct =
    session.status === "running"
      ? Math.max(
          0,
          Math.min(100, (session.cardRemainingMs / session.cfg.perCardMs) * 100)
        )
      : 0;

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
        {session.status !== "running" ? (
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
          // key=feedbackTick forces animation to restart each event
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
              {session.current.choices.map((c, i) => (
                <button
                  key={`${i}-${session.feedbackTick}`}
                  onClick={() => session.choose(i)}
                  className={`w-full text-left px-3 py-2 rounded border hover:bg-black hover:text-white transition ${
                    session.lastChoiceIndex === i
                      ? session.feedback === "correct"
                        ? "rr-btn-green"
                        : session.feedback === "wrong" ||
                          session.feedback === "timeout"
                        ? "rr-btn-red"
                        : ""
                      : ""
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            <div className="text-xs opacity-60">
              Stats — ✅ {session.stats.correct} | ❌ {session.stats.wrong} | ⏳{" "}
              {session.stats.timeout}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-lg font-semibold">Finished</div>
            <div className="text-sm opacity-70">
              Final score: {session.scoreState.score}
            </div>
            <button
              onClick={session.start}
              className="px-4 py-2 rounded bg-black text-white"
            >
              Play again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
