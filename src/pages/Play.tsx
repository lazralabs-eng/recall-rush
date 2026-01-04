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
      {/* MENU LINK (NEW) */}
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
              Correct: +10 (or +6 if slow) • Wrong: −4 • Timeout: −6 • Bonus
              every 5 streak
            </div>
          </div>
        ) : session.current ? (
          <div className="space-y-3">
            <div className="text-sm opacity-70">
              Card {session.index + 1} / {session.deck.length}
            </div>

            {/* PER-CARD COUNTDOWN BAR (NEW) */}
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

            <input
              value={session.answer}
              onChange={(e) => session.setAnswer(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") session.submit();
              }}
              className="w-full border rounded px-3 py-2"
              placeholder="Type answer and press Enter"
              autoFocus
            />

            <button
              onClick={session.submit}
              className="px-4 py-2 rounded bg-black text-white"
            >
              Submit
            </button>

            <div className="text-xs opacity-70">
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
