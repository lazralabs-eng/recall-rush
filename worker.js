// SPA fallback handler for Workers static assets
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Try to serve the static asset
    const response = await env.ASSETS.fetch(request);

    // If 404 and it's not a file request, serve index.html for client-side routing
    if (response.status === 404 && !url.pathname.includes('.')) {
      const indexUrl = new URL('/index.html', url.origin);
      return env.ASSETS.fetch(new Request(indexUrl, request));
    }

    return response;
  }
}
