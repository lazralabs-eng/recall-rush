// Cloudflare Pages Function for /results route
// Serves HTML with OG tags for bots/crawlers, otherwise serves the SPA

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
  dayKey?: string;
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
        mode: "sprint", // Always sprint
        deckId: parsed[5] || "nfl-playoffs",
        tiles,
        maxScore: parsed[7] || 450,
        deckLabel: parsed[8],
        dayKey: parsed[9],
      };
    }

    return null;
  } catch (err) {
    console.error("Failed to decode run data:", err);
    return null;
  }
}

function isBot(userAgent: string): boolean {
  const botPatterns = [
    'twitterbot',
    'facebookexternalhit',
    'slackbot',
    'discordbot',
    'whatsapp',
    'telegram',
    'linkedin',
    'pinterest',
    'redditbot',
    'bingbot',
    'googlebot',
    'yandexbot',
    'baiduspider',
    'duckduckbot',
    'ia_archiver',
    'embedly',
    'quora link preview',
    'showyoubot',
    'outbrain',
    'apple',
    'messagecard',
  ];

  const ua = userAgent.toLowerCase();
  return botPatterns.some(pattern => ua.includes(pattern));
}

function generateBotHTML(runData: RunData, runParam: string, origin: string): string {
  const deckLabel = runData.deckLabel || runData.deckId;
  const dayInfo = runData.dayKey ? ` • ${runData.dayKey}` : '';
  const title = `Recall Rush — Daily Sprint${dayInfo}`;
  const description = `${runData.score}/${runData.maxScore || 450} • ${runData.accuracy}% accuracy • Best streak: ${runData.bestStreak}`;
  const canonicalUrl = `${origin}/results?r=${encodeURIComponent(runParam)}`;
  const ogImageUrl = `https://recall-rush-og-worker.christopher-037.workers.dev/?r=${encodeURIComponent(runParam)}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${ogImageUrl}">

  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image">
  <meta property="twitter:url" content="${canonicalUrl}">
  <meta property="twitter:title" content="${title}">
  <meta property="twitter:description" content="${description}">
  <meta property="twitter:image" content="${ogImageUrl}">

  <meta http-equiv="refresh" content="0;url=${canonicalUrl}">
</head>
<body>
  <h1>${title}</h1>
  <p>${description}</p>
  <p><a href="${canonicalUrl}">View full results</a></p>
</body>
</html>`;
}

export async function onRequest(context: any): Promise<Response> {
  const { request, next } = context;
  const url = new URL(request.url);
  const userAgent = request.headers.get('user-agent') || '';

  // Get the r= parameter
  const runParam = url.searchParams.get('r');

  // If no run param or not a bot, serve the normal SPA
  if (!runParam || !isBot(userAgent)) {
    return next();
  }

  // Decode run data
  const runData = decodeRunData(runParam);
  if (!runData) {
    return next(); // Invalid data, serve normal SPA
  }

  // Generate and return HTML for bots
  const html = generateBotHTML(runData, runParam, url.origin);
  return new Response(html, {
    headers: {
      'content-type': 'text/html;charset=UTF-8',
      'cache-control': 'public, max-age=3600',
    },
  });
}
