import { ImageResponse } from "workers-og";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
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
  return clamp(Math.round(v), min, max);
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

      const score = qInt(sp, "score", 0, 0, 999999);
      const acc = qInt(sp, "acc", 0, 0, 100);
      const streak = qInt(sp, "streak", 0, 0, 9999);
      const avg = qInt(sp, "avg", 0, 0, 99999);
      const mode = qStr(sp, "mode", "sprint");
      const deck = qStr(sp, "deck", "demo");

      // Format mode and deck for display
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
