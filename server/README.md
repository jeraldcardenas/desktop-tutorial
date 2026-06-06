# TalkQuest Mission Proxy

A tiny backend that holds your Anthropic API key **server-side** and forwards
TalkQuest's mission requests to Claude. This keeps the key out of the mobile app
bundle (an app binary is not a secret — embedded keys can be extracted).

The app talks to this proxy when you set
`EXPO_PUBLIC_TALKQUEST_AI_ENDPOINT` and enable **AI missions** in Settings.

## What it does

- Receives the app's Anthropic Messages API request (no credentials attached).
- **Re-builds a safe request** — enforces a model allowlist, caps `max_tokens`,
  and requires the `emit_missions` tool — so it can't be abused as an open relay
  for arbitrary prompts or models.
- Adds `x-api-key` + `anthropic-version` and forwards to
  `https://api.anthropic.com/v1/messages`.
- Returns Claude's response verbatim (the app reads `content`).

Core logic lives in `proxy.js` (framework-agnostic, unit-tested). Adapters:
`index.js` (standalone Node) and `serverless.js` (Vercel / Netlify / Lambda).

## Run locally (zero dependencies, Node 18+)

```bash
ANTHROPIC_API_KEY=sk-ant-... node server/index.js
# → http://localhost:8787  (POST /missions, GET /health)
```

Point the app at it (in the project root `.env`):

```
EXPO_PUBLIC_TALKQUEST_AI_ENDPOINT=http://localhost:8787/missions
```

> On a device/emulator, `localhost` refers to the device. Use your machine's LAN
> IP (e.g. `http://192.168.1.20:8787/missions`) or a tunnel.

## Deploy serverless

**Vercel** — `api/missions.js`:

```js
module.exports = require('../server/serverless').vercelHandler;
```

**Netlify** — `netlify/functions/missions.js`:

```js
exports.handler = require('../../server/serverless').netlifyHandler;
```

Set `ANTHROPIC_API_KEY` (and optionally `ALLOWED_ORIGIN`) in the host's
environment settings. Then set the app's endpoint to the deployed URL, e.g.
`https://your-app.vercel.app/api/missions`.

## Before going to production

This is a reference implementation. Add:

- **Auth** — require an app token / API key so only your app can call it.
- **Rate limiting** — per-IP / per-user, to bound cost.
- **CORS lockdown** — set `ALLOWED_ORIGIN` to your app's origin (defaults to `*`).
- **Observability** — log request IDs and errors (never log the API key).

## Environment variables

| Var | Required | Notes |
|---|---|---|
| `ANTHROPIC_API_KEY` | ✅ | Your Anthropic key. Server-side only. |
| `PORT` | — | Standalone server port (default `8787`). |
| `ALLOWED_ORIGIN` | — | CORS origin allowlist (default `*` — tighten in prod). |
