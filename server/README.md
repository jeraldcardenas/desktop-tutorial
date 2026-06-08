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

## Deploy (one URL = web app + proxy)

A single deploy builds the Expo **web app** and ships the **proxy functions** to
the same domain — so you get a shareable live URL, and the app can call the
proxy same-origin at `/api/missions` (no CORS, no API key in the client).

Committed deploy files:

```
api/missions.js          Vercel function  → POST /api/missions
api/health.js            Vercel function  → GET  /api/health
netlify/functions/missions.js   Netlify function
vercel.json              build: expo export web → dist/ ; serve api/*.js as functions
netlify.toml             build: expo export web → dist/ ; functions + /api/missions redirect
```

### Vercel

```bash
npm i -g vercel              # one time
vercel link                  # pick/create the project
# (optional) enable AI missions on the deployed web build — same-origin:
vercel env add EXPO_PUBLIC_TALKQUEST_AI_ENDPOINT production   # value: /api/missions
vercel env add ANTHROPIC_API_KEY production                  # paste your Anthropic key
vercel --prod                # builds the web app + deploys functions
```

Live app: `https://<project>.vercel.app/` — proxy: `https://<project>.vercel.app/api/missions`. Verify:

```bash
curl https://<project>.vercel.app/api/health     # {"ok":true,"keyConfigured":true}
```

### Netlify

```bash
npm i -g netlify-cli         # one time
netlify deploy --build       # follow prompts to link a site
netlify env:set EXPO_PUBLIC_TALKQUEST_AI_ENDPOINT /api/missions   # optional, enables AI
netlify env:set ANTHROPIC_API_KEY sk-ant-...
netlify deploy --build --prod
```

Live app: `https://<site>.netlify.app/` — proxy: `.../api/missions`.

### Notes

- **The web app works without any keys** — leave the two env vars unset and you
  get a fully playable build on the 104 local missions.
- To **also** enable AI missions on the deployed build, set BOTH
  `EXPO_PUBLIC_TALKQUEST_AI_ENDPOINT=/api/missions` (inlined into the web bundle
  at build time) and `ANTHROPIC_API_KEY` (server-side), then flip the toggle in
  Settings.
- `EXPO_PUBLIC_TALKQUEST_AI_ENDPOINT=/api/missions` is a relative URL — it only
  works for the web build (same origin). Native builds need an absolute URL.
- Set `ALLOWED_ORIGIN` to lock CORS if you also call the proxy from other origins;
  never commit `ANTHROPIC_API_KEY`.

### Proxy only (no web app)

If you want to host *just* the proxy, set `buildCommand`/`command` to a no-op and
`outputDirectory`/`publish` to an empty folder — see git history for the
functions-only `vercel.json`, or run the standalone Node server above.

## Continuous deployment (GitHub Actions)

`.github/workflows/deploy.yml` auto-deploys to Vercel on every push to the
development branch (and `master`), but only **after `npm test` passes**.
`.github/workflows/ci.yml` runs tests + a web build on pull requests.

One-time setup — add three repo secrets (Settings → Secrets and variables →
Actions):

| Secret | Where to get it |
|---|---|
| `VERCEL_TOKEN` | Vercel → Account Settings → Tokens → Create |
| `VERCEL_ORG_ID` | run `vercel link` once locally → read `.vercel/project.json` |
| `VERCEL_PROJECT_ID` | same `.vercel/project.json` |

Then set the project's env vars **in Vercel** (not in GitHub): `ANTHROPIC_API_KEY`
and, to enable AI on the web build, `EXPO_PUBLIC_TALKQUEST_AI_ENDPOINT=/api/missions`.
`vercel pull` brings them into the build automatically.

After that, every push deploys itself — no manual `vercel --prod`. The workflow
fails fast with a clear message if the secrets are missing.

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
