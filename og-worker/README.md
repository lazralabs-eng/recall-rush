# Recall Rush OG Image Worker

Cloudflare Worker that generates Open Graph images for social sharing.

## Setup

```bash
cd og-worker
npm install
```

## Development

```bash
npm run dev
```

## Deployment

```bash
npm run deploy
```

After deployment, update your site's base URL to point `/og` requests to this worker, or configure a route in Cloudflare dashboard:

- Route pattern: `your-domain.com/og`
- Worker: `recall-rush-og`

## Usage

The worker accepts the following query parameters:

- `score` - Score value (0-999999)
- `acc` - Accuracy percentage (0-100)
- `streak` - Best streak (0-9999)
- `avg` - Average response time in ms (0-99999)
- `mode` - Game mode ("sprint" or "sudden")
- `deck` - Deck ID (max 24 chars)

Example:
```
/og?score=420&acc=85&streak=12&avg=1234&mode=sprint&deck=demo
```

Returns a 1200x630 PNG image suitable for social media previews.
