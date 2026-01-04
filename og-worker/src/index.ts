import { ImageResponse } from "workers-og";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function qInt(sp: URLSearchParams, key: string, def: number, min: number, max: number) {
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
      return new ImageResponse(
        `<div style="display: flex; align-items: center; justify-content: center; width: 1200px; height: 630px; background-color: #111111; color: white; font-size: 48px;">Recall Rush OG OK</div>`,
        {
          width: 1200,
          height: 630,
        }
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      return new Response(errorMessage, {
        status: 500,
        headers: { "Content-Type": "text/plain" },
      });
    }
  },
};
