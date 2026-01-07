import { Link, useSearchParams } from "react-router-dom";
import { useEffect } from "react";

// Cloudflare Worker endpoint for OG images
const OG_BASE = "https://recall-rush-og-worker.christopher-037.workers.dev";

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
    // Normalize base64url to base64
    let normalized = encoded.replace(/-/g, "+").replace(/_/g, "/");

    // Add padding if needed
    const pad = normalized.length % 4;
    if (pad === 1) {
      return null; // Invalid base64 length
    } else if (pad === 2) {
      normalized += "==";
    } else if (pad === 3) {
      normalized += "=";
    }

    // Decode base64
    const decoded = atob(normalized);

    // Try to parse directly or decode URI first
    const d = decoded.trim();
    let parsed;
    if (d.startsWith("{") || d.startsWith("[")) {
      parsed = JSON.parse(d);
    } else {
      parsed = JSON.parse(decodeURIComponent(d));
    }

    // Handle ultra-compact array format [score, accuracy, streak, avgMs, mode?, deck?]
    if (Array.isArray(parsed)) {
      return {
        runId: "",
        score: Number(parsed[0]) || 0,
        accuracy: Number(parsed[1]) || 0,
        correct: 0,
        answered: 0,
        bestStreak: Number(parsed[2]) || 0,
        avgResponseMs: Number(parsed[3]) || 0,
        mode: String(parsed[4] || "sprint"),
        deckId: String(parsed[5] || "nfl-playoffs"),
        timestamp: 0,
      };
    }

    // Handle compact object format (short keys)
    if (parsed.s !== undefined) {
      return {
        runId: "",
        score: Number(parsed.s) || 0,
        accuracy: Number(parsed.a) || 0,
        correct: Number(parsed.c) || 0,
        answered: Number(parsed.ans) || 0,
        bestStreak: Number(parsed.bs) || 0,
        avgResponseMs: Number(parsed.ar) || 0,
        mode: String(parsed.m || "sprint"),
        deckId: String(parsed.d || "demo"),
        timestamp: 0,
      };
    }

    // Handle old format - validate required string fields
    if (
      typeof parsed.runId !== "string" ||
      typeof parsed.deckId !== "string" ||
      typeof parsed.mode !== "string"
    ) {
      console.error("Invalid run data: missing required string fields");
      return null;
    }

    // Coerce numeric fields
    const result: RunData = {
      runId: parsed.runId,
      deckId: parsed.deckId,
      mode: parsed.mode,
      score: Number(parsed.score) || 0,
      accuracy: Number(parsed.accuracy) || 0,
      correct: Number(parsed.correct) || 0,
      answered: Number(parsed.answered) || 0,
      bestStreak: Number(parsed.bestStreak) || 0,
      avgResponseMs: Number(parsed.avgResponseMs) || 0,
      timestamp: Number(parsed.timestamp) || 0,
    };

    return result;
  } catch (err) {
    console.error("Failed to decode run data:", err);
    return null;
  }
}

export default function Results() {
  const [sp] = useSearchParams();
  const runParam = sp.get("r");
  const resultsData = runParam ? decodeRunData(runParam) : null;

  // Update OG meta tags for social sharing
  useEffect(() => {
    if (!resultsData) return;

    const ogImageUrl = `${OG_BASE}/og?score=${resultsData.score}&acc=${resultsData.accuracy}&streak=${resultsData.bestStreak}&avg=${resultsData.avgResponseMs}&mode=${encodeURIComponent(resultsData.mode)}&deck=${encodeURIComponent(resultsData.deckId)}`;
    const title = "Recall Rush — Shared Run";
    const description = `Score: ${resultsData.score} • Accuracy: ${resultsData.accuracy}% • Best streak: ${resultsData.bestStreak}`;

    // Set or update meta tags (idempotent)
    const setMeta = (property: string, content: string) => {
      let meta = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute("property", property);
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    setMeta("og:title", title);
    setMeta("og:description", description);
    setMeta("og:image", ogImageUrl);
    setMeta("og:type", "website");
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", title);
    setMeta("twitter:description", description);
    setMeta("twitter:image", ogImageUrl);

    document.title = title;
  }, [resultsData]);

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
            className="block w-full px-4 py-2 rounded bg-black text-white hover:bg-gray-800 transition text-center font-semibold"
          >
            Beat this score
          </Link>
        </div>
      </div>
    </div>
  );
}
