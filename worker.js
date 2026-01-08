// Worker to inject OG tags for /results route
const OG_WORKER_URL = 'https://recall-rush-og-worker.christopher-037.workers.dev';

// Generate a short ID using base62 encoding
function generateShortId(length = 8) {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % chars.length];
  }
  return result;
}

export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);

      // Handle POST /api/shorten - create short link
      if (request.method === 'POST' && url.pathname === '/api/shorten') {
        if (!env.RESULTS_KV) {
          return new Response('KV namespace not configured', { status: 500 });
        }

        try {
          const body = await request.json();
          const { encodedPayload } = body;

          if (!encodedPayload) {
            return new Response('Missing encodedPayload', { status: 400 });
          }

          // Generate a short ID
          const shortId = generateShortId(8);

          // Store in KV with 7-day expiration
          await env.RESULTS_KV.put(shortId, encodedPayload, {
            expirationTtl: 604800, // 7 days
          });

          console.log(`[Worker] Created short link: ${shortId}`);

          return new Response(JSON.stringify({ shortId }), {
            headers: {
              'content-type': 'application/json',
              'access-control-allow-origin': '*',
            },
          });
        } catch (e) {
          console.error('[Worker] Error creating short link:', e);
          return new Response('Failed to create short link', { status: 500 });
        }
      }

      // Handle GET /r/:shortId - retrieve and redirect to full result
      if (url.pathname.startsWith('/r/')) {
        const shortId = url.pathname.slice(3); // Remove '/r/'

        if (!env.RESULTS_KV) {
          return new Response('KV namespace not configured', { status: 500 });
        }

        try {
          // Lookup in KV
          const encodedPayload = await env.RESULTS_KV.get(shortId);

          if (!encodedPayload) {
            // Link expired or invalid
            const errorResponse = await env.ASSETS.fetch(new URL('/index.html', url.origin));
            return new HTMLRewriter()
              .on('body', {
                element(element) {
                  element.setInnerContent(
                    `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;padding:20px;text-align:center;font-family:system-ui;">
                      <h1 style="font-size:48px;margin-bottom:16px;">🔗</h1>
                      <h2 style="font-size:24px;margin-bottom:8px;">Link Expired or Invalid</h2>
                      <p style="opacity:0.7;margin-bottom:24px;">This share link is no longer available.</p>
                      <a href="/" style="padding:12px 24px;background:#000;color:#fff;text-decoration:none;border-radius:6px;">Go to Homepage</a>
                    </div>`,
                    { html: true }
                  );
                }
              })
              .transform(errorResponse);
          }

          // Found! Now serve the results page with this data
          console.log(`[Worker] Retrieved short link: ${shortId}`);

          // Fetch the results page
          const resultsUrl = new URL('/results', url.origin);
          resultsUrl.searchParams.set('r', encodedPayload);
          const resultsResponse = await env.ASSETS.fetch(resultsUrl);

          // Decode for OG tags
          try {
            const decoded = atob(encodedPayload.replace(/-/g, '+').replace(/_/g, '/'));
            const parsed = JSON.parse(decoded);

            let score, accuracy, streak, avgMs, mode, deckId;

            // Handle array format [score, accuracy, streak, avgMs, mode?, deck?]
            if (Array.isArray(parsed)) {
              score = parsed[0];
              accuracy = parsed[1];
              streak = parsed[2];
              avgMs = parsed[3];
              mode = parsed[4] || 'sprint';
              deckId = parsed[5] || 'nfl-playoffs';
            } else if (parsed.s !== undefined) {
              // Handle object format {s, a, bs, ar, m?, d?}
              score = parsed.s;
              accuracy = parsed.a;
              streak = parsed.bs;
              avgMs = parsed.ar;
              mode = parsed.m || 'sprint';
              deckId = parsed.d || 'nfl-playoffs';
            } else {
              // Old format
              score = parsed.score;
              accuracy = parsed.accuracy;
              streak = parsed.bestStreak;
              avgMs = parsed.avgResponseMs;
              mode = parsed.mode || 'sprint';
              deckId = parsed.deckId || 'nfl-playoffs';
            }

            // Format mode and deck for display
            const modeLabel = mode === 'sudden' ? 'Sudden Death' : 'Sprint';
            const deckLabel = deckId === 'nfl-playoffs' ? 'NFL Playoffs' :
                             deckId === 'demo' ? 'Demo' :
                             deckId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

            const ogImageUrl = `${url.origin}/og/result/${encodedPayload}.png`;
            const title = `Recall Rush — ${modeLabel} • ${deckLabel}`;
            const description = `Score: ${score} • Accuracy: ${accuracy}% • Best streak: ${streak}`;

            // Inject OG meta tags for short link
            return new HTMLRewriter()
              .on('head', {
                element(element) {
                  element.append(
                    `<meta property="og:title" content="${title}">
                     <meta property="og:description" content="${description}">
                     <meta property="og:image" content="${ogImageUrl}">
                     <meta property="og:type" content="website">
                     <meta property="og:url" content="${url.href}">
                     <meta name="twitter:card" content="summary_large_image">
                     <meta name="twitter:title" content="${title}">
                     <meta name="twitter:description" content="${description}">
                     <meta name="twitter:image" content="${ogImageUrl}">`,
                    { html: true }
                  );
                }
              })
              .transform(resultsResponse);
          } catch (e) {
            console.error('[Worker] Failed to decode for OG tags:', e);
            return resultsResponse;
          }
        } catch (e) {
          console.error('[Worker] Error retrieving short link:', e);
          return new Response('Error retrieving short link', { status: 500 });
        }
      }

      // Handle /og/* routes - proxy to OG worker with clean URLs
      if (url.pathname.startsWith('/og/')) {
        if (url.pathname === '/og/daily.png') {
          // Homepage OG image
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

        // Match /og/result/{hash}.png
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

        return new Response('Not found', { status: 404 });
      }

      // Get the asset response (use ASSETS binding or fallback to fetch)
      let response;
      if (env.ASSETS) {
        response = await env.ASSETS.fetch(request);
      } else {
        // Fallback for local dev or different config
        return new Response('ASSETS binding not configured', { status: 500 });
      }

      // Handle SPA routing - serve index.html for non-file paths
      if (response.status === 404 && !url.pathname.match(/\.[a-zA-Z0-9]+$/)) {
        response = await env.ASSETS.fetch(new URL('/index.html', url.origin));
      }

      // Inject OG tags for homepage
      if (url.pathname === '/' || url.pathname === '') {
        console.log('[Worker] Injecting OG tags for homepage');
        const title = 'Daily Recall — One deck. One run. Every day.';
        const description = 'Test your memory under pressure. No signups. No retries. Just recall.';
        const ogImageUrl = url.origin + '/og/daily.png';
        const canonicalUrl = url.origin + '/';

        return new HTMLRewriter()
          .on('head', {
            element(element) {
              element.append(
                `<meta property="og:title" content="${title}">
                 <meta property="og:description" content="${description}">
                 <meta property="og:image" content="${ogImageUrl}">
                 <meta property="og:type" content="website">
                 <meta property="og:url" content="${canonicalUrl}">
                 <meta name="twitter:card" content="summary_large_image">
                 <meta name="twitter:title" content="${title}">
                 <meta name="twitter:description" content="${description}">
                 <meta name="twitter:image" content="${ogImageUrl}">`,
                { html: true }
              );
            }
          })
          .transform(response);
      }

      // Inject OG tags for /results route with ?r= parameter
      if (url.pathname === '/results' && url.searchParams.has('r')) {
        const runParam = url.searchParams.get('r');

        try {
          // Decode the run data
          const decoded = atob(runParam.replace(/-/g, '+').replace(/_/g, '/'));
          const parsed = JSON.parse(decoded);

          let score, accuracy, streak, avgMs, mode, deckId;

          // Handle array format [score, accuracy, streak, avgMs, mode?, deck?]
          if (Array.isArray(parsed)) {
            score = parsed[0];
            accuracy = parsed[1];
            streak = parsed[2];
            avgMs = parsed[3];
            mode = parsed[4] || 'sprint';
            deckId = parsed[5] || 'nfl-playoffs';
          } else if (parsed.s !== undefined) {
            // Handle object format {s, a, bs, ar, m?, d?}
            score = parsed.s;
            accuracy = parsed.a;
            streak = parsed.bs;
            avgMs = parsed.ar;
            mode = parsed.m || 'sprint';
            deckId = parsed.d || 'nfl-playoffs';
          } else {
            // Old format
            score = parsed.score;
            accuracy = parsed.accuracy;
            streak = parsed.bestStreak;
            avgMs = parsed.avgResponseMs;
            mode = parsed.mode || 'sprint';
            deckId = parsed.deckId || 'nfl-playoffs';
          }

          // Format mode and deck for display
          const modeLabel = mode === 'sudden' ? 'Sudden Death' : 'Sprint';
          const deckLabel = deckId === 'nfl-playoffs' ? 'NFL Playoffs' :
                           deckId === 'demo' ? 'Demo' :
                           deckId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

          const ogImageUrl = `${url.origin}/og/result/${runParam}.png`;
          const title = `Recall Rush — ${modeLabel} • ${deckLabel}`;
          const description = `Score: ${score} • Accuracy: ${accuracy}% • Best streak: ${streak}`;

          // Inject OG meta tags into HTML
          return new HTMLRewriter()
            .on('head', {
              element(element) {
                element.append(
                  `<meta property="og:title" content="${title}">
                   <meta property="og:description" content="${description}">
                   <meta property="og:image" content="${ogImageUrl}">
                   <meta property="og:type" content="website">
                   <meta property="og:url" content="${url.href}">
                   <meta name="twitter:card" content="summary_large_image">
                   <meta name="twitter:title" content="${title}">
                   <meta name="twitter:description" content="${description}">
                   <meta name="twitter:image" content="${ogImageUrl}">`,
                  { html: true }
                );
              }
            })
            .transform(response);
        } catch (e) {
          // If decoding fails, just return the response as-is
          console.error('Failed to decode run data:', e);
        }
      }

      return response;
    } catch (err) {
      return new Response(`Worker error: ${err.message}`, { status: 500 });
    }
  }
}
