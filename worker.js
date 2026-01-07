// Worker to inject OG tags for /results route
export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);

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

          const ogImageUrl = `https://recall-rush-og-worker.christopher-037.workers.dev/?score=${score}&acc=${accuracy}&streak=${streak}&avg=${avgMs}&mode=${encodeURIComponent(mode)}&deck=${encodeURIComponent(deckId)}`;
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
