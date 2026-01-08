// Cloudflare Pages Function for homepage route
// Injects OG tags for social media sharing

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

function generateBotHTML(origin: string): string {
  const title = 'Daily Recall — One deck. One run. Every day.';
  const description = 'Test your memory under pressure. No signups. No retries. Just recall.';
  const canonicalUrl = `${origin}/`;
  const ogImageUrl = `${origin}/og/daily.png`;

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
  <p><a href="${canonicalUrl}">Go to Daily Recall</a></p>
</body>
</html>`;
}

export async function onRequest(context: any): Promise<Response> {
  const { request, next } = context;
  const url = new URL(request.url);
  const userAgent = request.headers.get('user-agent') || '';

  // Only serve special HTML for bots (social media scrapers)
  if (!isBot(userAgent)) {
    return next(); // Serve normal SPA for regular users
  }

  // Generate and return HTML for bots with OG tags
  const html = generateBotHTML(url.origin);
  return new Response(html, {
    headers: {
      'content-type': 'text/html;charset=UTF-8',
      'cache-control': 'public, max-age=3600',
    },
  });
}
