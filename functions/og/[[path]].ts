// Cloudflare Pages Function to proxy OG images
// Handles /og/daily.png and /og/result/{hash}.png

const OG_WORKER_URL = 'https://recall-rush-og-worker.christopher-037.workers.dev';

export async function onRequest(context: any): Promise<Response> {
  const { request } = context;
  const url = new URL(request.url);

  // Handle /og/daily.png - homepage OG image
  if (url.pathname === '/og/daily.png') {
    const ogUrl = `${OG_WORKER_URL}/?home=1`;
    const ogResponse = await fetch(ogUrl);

    return new Response(ogResponse.body, {
      headers: {
        'content-type': 'image/png',
        'cache-control': 'public, max-age=3600',
        'cdn-cache-control': 'public, max-age=86400',
      },
    });
  }

  // Handle /og/result/{hash}.png - results OG images
  const resultMatch = url.pathname.match(/^\/og\/result\/([^\/]+)\.png$/);
  if (resultMatch) {
    const hash = resultMatch[1];
    const ogUrl = `${OG_WORKER_URL}/?r=${encodeURIComponent(hash)}`;
    const ogResponse = await fetch(ogUrl);

    return new Response(ogResponse.body, {
      headers: {
        'content-type': 'image/png',
        'cache-control': 'public, max-age=86400',
        'cdn-cache-control': 'public, max-age=2592000',
      },
    });
  }

  // No match - return 404
  return new Response('OG image not found', { status: 404 });
}
