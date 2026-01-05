// SPA fallback handler for Workers static assets
export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);

      // Serve static assets
      let response = await env.ASSETS.fetch(request);

      // If 404 on non-file paths, serve index.html for client-side routing
      if (response.status === 404 && !url.pathname.match(/\.[a-zA-Z0-9]+$/)) {
        response = await env.ASSETS.fetch(new URL('/index.html', url.origin));
      }

      return response;
    } catch (err) {
      return new Response(`Worker error: ${err.message}`, { status: 500 });
    }
  }
}
