import { ImageResponse } from "workers-og";

type Tile = "G" | "R" | "T";

type RunData = {
  score: number;
  accuracy: number;
  bestStreak: number;
  avgResponseMs: number;
  mode: string;
  deckId: string;
  tiles: Tile[];
  maxScore: number;
  deckLabel?: string;
};

function decodeRunData(encoded: string): RunData | null {
  try {
    const json = atob(encoded);
    const parsed = JSON.parse(json);

    if (Array.isArray(parsed)) {
      const tiles = parsed[6] && Array.isArray(parsed[6]) ? parsed[6] : [];
      return {
        score: parsed[0] || 0,
        accuracy: parsed[1] || 0,
        bestStreak: parsed[2] || 0,
        avgResponseMs: parsed[3] || 0,
        mode: parsed[4] || "sprint",
        deckId: parsed[5] || "nfl-playoffs",
        tiles,
        maxScore: parsed[7] || 450,
        deckLabel: parsed[8],
      };
    }

    return null;
  } catch (err) {
    console.error("Failed to decode run data:", err);
    return null;
  }
}

function renderGrid(tiles: Tile[]): string {
  const blockSize = 20;
  const gap = 8;
  const blocksPerRow = 5;

  let gridHtml = `<div style="display:flex;flex-wrap:wrap;gap:${gap}px;justify-content:center;max-width:${blocksPerRow * (blockSize + gap)}px;">`;

  for (let i = 0; i < tiles.length; i++) {
    const tile = tiles[i];
    let color = "";
    switch (tile) {
      case "G":
        color = "#22c55e"; // green-500
        break;
      case "R":
        color = "#ef4444"; // red-500
        break;
      case "T":
        color = "#d1d5db"; // gray-300
        break;
    }
    gridHtml += `<div style="display:flex;width:${blockSize}px;height:${blockSize}px;background:${color};border-radius:3px;"></div>`;
  }

  gridHtml += `</div>`;
  return gridHtml;
}

function qInt(
  sp: URLSearchParams,
  key: string,
  def: number,
  min: number,
  max: number
) {
  const v = Number(sp.get(key));
  if (!Number.isFinite(v)) return def;
  return Math.max(min, Math.min(max, Math.round(v)));
}

function qStr(sp: URLSearchParams, key: string, def: string, maxLen = 60) {
  const v = sp.get(key);
  if (!v) return def;
  return v.slice(0, maxLen);
}

export default {
  async fetch(request: Request): Promise<Response> {
    try {
      const url = new URL(request.url);
      const sp = url.searchParams;

      // Handle /og/daily.png path
      if (url.pathname === "/og/daily.png") {
        const html =
          `<div style="width:1200px;height:630px;background:#111;color:#fff;font-family:ui-sans-serif,system-ui,Segoe UI,Roboto,Helvetica,Arial;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px;">` +
          `<div style="width:100px;height:100px;background:#fff;color:#111;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:50px;font-weight:900;margin-bottom:32px;">RR</div>` +
          `<div style="display:flex;flex-direction:column;align-items:center;margin-bottom:32px;">` +
          `<div style="display:flex;font-size:64px;font-weight:800;margin-bottom:20px;">Daily Recall</div>` +
          `<div style="display:flex;font-size:36px;opacity:0.8;margin-bottom:20px;">One deck. One run. Every day.</div>` +
          `<div style="display:flex;font-size:28px;opacity:0.7;">Test your memory under pressure.</div>` +
          `</div>` +
          `<div style="display:flex;font-size:24px;opacity:0.6;margin-top:24px;">No signups. No retries. Just recall.</div>` +
          `</div>`;

        return new ImageResponse(html, {
          width: 1200,
          height: 630,
          headers: {
            'cache-control': 'public, max-age=3600',
          },
        });
      }

      // Handle /og/result/{hash}.png path
      const resultMatch = url.pathname.match(/^\/og\/result\/([^\/]+)\.png$/);
      if (resultMatch) {
        const encodedRun = resultMatch[1];
        const runData = decodeRunData(encodedRun);
        if (!runData) {
          return new Response("Invalid run data", { status: 400 });
        }

        const deckLabel = runData.deckLabel ||
          (runData.deckId === 'nfl-playoffs' ? 'NFL Playoffs' :
           runData.deckId === 'demo' ? 'Demo' :
           runData.deckId.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()));

        const gridHtml = renderGrid(runData.tiles);

        const html =
          `<div style="width:1200px;height:630px;background:#111;color:#fff;font-family:ui-sans-serif,system-ui,Segoe UI,Roboto,Helvetica,Arial;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px;">` +
          `<div style="width:80px;height:80px;background:#fff;color:#111;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:40px;font-weight:900;margin-bottom:24px;">RR</div>` +
          `<div style="display:flex;flex-direction:column;align-items:center;margin-bottom:40px;">` +
          `<div style="display:flex;font-size:48px;font-weight:700;margin-bottom:16px;">Recall Rush — Daily Sprint</div>` +
          `<div style="display:flex;font-size:36px;opacity:0.8;">${deckLabel}</div>` +
          `</div>` +
          `<div style="display:flex;margin-bottom:32px;">${gridHtml}</div>` +
          `<div style="display:flex;font-size:32px;font-weight:700;">${runData.score}/${runData.maxScore}</div>` +
          `<div style="display:flex;font-size:24px;opacity:0.7;margin-top:16px;">${runData.accuracy}% accuracy • ${runData.bestStreak} best streak</div>` +
          `</div>`;

        return new ImageResponse(html, {
          width: 1200,
          height: 630,
          headers: {
            'cache-control': 'public, max-age=86400',
          },
        });
      }

      // Legacy: Check if home=1 parameter is provided (homepage OG image)
      if (sp.get("home") === "1") {
        const html =
          `<div style="width:1200px;height:630px;background:#111;color:#fff;font-family:ui-sans-serif,system-ui,Segoe UI,Roboto,Helvetica,Arial;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px;">` +
          `<div style="width:100px;height:100px;background:#fff;color:#111;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:50px;font-weight:900;margin-bottom:32px;">RR</div>` +
          `<div style="display:flex;flex-direction:column;align-items:center;margin-bottom:32px;">` +
          `<div style="font-size:64px;font-weight:800;margin-bottom:20px;">Daily Recall</div>` +
          `<div style="font-size:36px;opacity:0.8;margin-bottom:20px;">One deck. One run. Every day.</div>` +
          `<div style="font-size:28px;opacity:0.7;">Test your memory under pressure.</div>` +
          `</div>` +
          `<div style="font-size:24px;opacity:0.6;margin-top:24px;">No signups. No retries. Just recall.</div>` +
          `</div>`;

        return new ImageResponse(html, { width: 1200, height: 630 });
      }

      // Check if r= parameter is provided (encoded run data)
      const encodedRun = sp.get("r");
      if (encodedRun) {
        const runData = decodeRunData(encodedRun);
        if (!runData) {
          return new Response("Invalid run data", { status: 400 });
        }

        const deckLabel = runData.deckLabel ||
          (runData.deckId === 'nfl-playoffs' ? 'NFL Playoffs' :
           runData.deckId === 'demo' ? 'Demo' :
           runData.deckId.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()));

        const gridHtml = renderGrid(runData.tiles);

        const html =
          `<div style="width:1200px;height:630px;background:#111;color:#fff;font-family:ui-sans-serif,system-ui,Segoe UI,Roboto,Helvetica,Arial;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px;">` +
          `<div style="width:80px;height:80px;background:#fff;color:#111;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:40px;font-weight:900;margin-bottom:24px;">RR</div>` +
          `<div style="display:flex;flex-direction:column;align-items:center;margin-bottom:40px;">` +
          `<div style="font-size:48px;font-weight:700;margin-bottom:16px;">Recall Rush — Daily Sprint</div>` +
          `<div style="font-size:36px;opacity:0.8;">${deckLabel}</div>` +
          `</div>` +
          `<div style="margin-bottom:32px;">${gridHtml}</div>` +
          `<div style="font-size:32px;font-weight:700;">${runData.score}/${runData.maxScore}</div>` +
          `<div style="font-size:24px;opacity:0.7;margin-top:16px;">${runData.accuracy}% accuracy • ${runData.bestStreak} best streak</div>` +
          `</div>`;

        return new ImageResponse(html, { width: 1200, height: 630 });
      }

      // Fallback to old param-based format
      const score = qInt(sp, "score", 0, 0, 999999);
      const acc = qInt(sp, "acc", 0, 0, 100);
      const streak = qInt(sp, "streak", 0, 0, 9999);
      const avg = qInt(sp, "avg", 0, 0, 99999);
      const mode = qStr(sp, "mode", "sprint");
      const deck = qStr(sp, "deck", "demo");

      const modeLabel = mode === 'sudden' ? 'Sudden Death' : 'Sprint';
      const deckLabel = deck === 'nfl-playoffs' ? 'NFL Playoffs' :
                       deck === 'demo' ? 'Demo' :
                       deck.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());

      const html =
        `<div style="width:1200px;height:630px;background:#111;color:#fff;font-family:ui-sans-serif,system-ui,Segoe UI,Roboto,Helvetica,Arial;display:flex;flex-direction:column;align-items:center;justify-content:center;">` +
        `<div style="display:flex;flex-direction:column;align-items:center;margin-bottom:40px;">` +
        `<div style="display:flex;flex-direction:column;font-size:48px;font-weight:700;">Recall Rush — ${modeLabel} • ${deckLabel}</div>` +
        `</div>` +
        `<div style="display:flex;flex-direction:row;flex-wrap:wrap;gap:24px;justify-content:center;">` +
        `<div style="display:flex;flex-direction:column;width:540px;padding:24px;background:#222;border-radius:12px;">` +
        `<div style="display:flex;flex-direction:column;font-size:20px;opacity:.7;margin-bottom:8px;">Score</div>` +
        `<div style="display:flex;flex-direction:column;font-size:56px;font-weight:800;">${score}</div>` +
        `</div>` +
        `<div style="display:flex;flex-direction:column;width:540px;padding:24px;background:#222;border-radius:12px;">` +
        `<div style="display:flex;flex-direction:column;font-size:20px;opacity:.7;margin-bottom:8px;">Accuracy</div>` +
        `<div style="display:flex;flex-direction:column;font-size:56px;font-weight:800;">${acc}%</div>` +
        `</div>` +
        `<div style="display:flex;flex-direction:column;width:540px;padding:24px;background:#222;border-radius:12px;">` +
        `<div style="display:flex;flex-direction:column;font-size:20px;opacity:.7;margin-bottom:8px;">Best Streak</div>` +
        `<div style="display:flex;flex-direction:column;font-size:56px;font-weight:800;">${streak}</div>` +
        `</div>` +
        `<div style="display:flex;flex-direction:column;width:540px;padding:24px;background:#222;border-radius:12px;">` +
        `<div style="display:flex;flex-direction:column;font-size:20px;opacity:.7;margin-bottom:8px;">Avg Response</div>` +
        `<div style="display:flex;flex-direction:column;font-size:56px;font-weight:800;">${avg}ms</div>` +
        `</div>` +
        `</div>` +
        `</div>`;
      return new ImageResponse(html, { width: 1200, height: 630 });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.stack ?? err.message : String(err);
      return new Response(msg, { status: 500 });
    }
  },
};
