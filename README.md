# TalkQuest 🎒

**A screen-assisted developmental play companion for toddlers ages 1–4.**

TalkQuest gives short, parent-guided missions that get little ones talking,
moving, imitating, listening, and pretending — in the *real world*, not glued
to a screen. An AI-style adventure guide named **Buddy** hands out one mission
at a time; the parent helps, taps **Done**, and the child is celebrated.

> 💛 **TalkQuest is a play and learning companion. It does not diagnose, treat,
> or prevent autism or developmental delays. If you have concerns about your
> child's development, consult a pediatrician or licensed specialist.**

---

## ✨ What it does

- **Parent-controlled flow:** pick age → session length → adventure theme.
- **One short mission at a time** with voice narration, big buttons, and a
  small parent coaching tip.
- **5 adventure themes:** Jungle Explorer, Ocean Adventure, Space Mission,
  Animal Parade, Color Hunt.
- **5 game modes:** Real World Treasure Hunt, Copy Me, Animal Adventure,
  Emotion Play, Story Builder.
- **104 built-in missions** structured by age group, theme, and skill category.
- **Age-based difficulty:** simple one-step tasks for 1–2; colors/counting/naming
  for 2–3; two-step instructions, shapes, counting to 5, memory & storytelling
  for 3–4.
- **Celebration** after every mission (confetti, badge, Buddy cheering, voice).
- **Progress Summary** of skills practiced each session.
- **Parent Dashboard:** sessions completed, words practiced, movement /
  imitation / social activities, favorite theme, and weekly progress — framed as
  *"skills practiced,"* never as a diagnosis.
- **Local-first & private:** missions and progress live on-device
  (AsyncStorage). No accounts, no ads, no network required.

## 🗺️ Screens

Welcome → Child Age Selection → Session Length → Adventure Theme → Mission →
Celebration → Progress Summary, plus a Parent Dashboard and Settings.

## 🧱 Tech

- **Expo / React Native** (mobile-first; runs on iOS, Android, and web).
- **React Navigation** (native stack).
- **expo-speech** for text-to-speech voice narration (degrades gracefully).
- **AsyncStorage** for local progress + settings.

## 📁 Project structure

```
App.js                       App entry: providers + loading gate
src/
  constants/                 Age groups, session lengths, themes, categories, disclaimer
  theme/                     Colors, spacing, radius, typography tokens
  data/
    missions.js              104-mission local database + buildStory()
  services/
    storage.js               AsyncStorage + pure progress reducer (applySession)
    speech.js                Text-to-speech wrapper
    missionService.js        Filtering, randomization, session builder, AI + local merge
    aiConfig.js              Resolves AI endpoint/key/model config
    aiMissionProvider.js     Claude-backed mission generation + safety validation
  context/
    SessionContext.js        Live session state + persisted progress/settings
  components/                Buddy, BigButton, SelectCard, StatCard, Confetti, Screen, Disclaimer
  navigation/
    AppNavigator.js          Stack navigator
  screens/                   The 9 screens listed above
server/
  proxy.js                   Framework-agnostic mission-proxy core (unit-tested)
  index.js                   Zero-dependency Node server (npm run server)
  serverless.js              Vercel / Netlify / Lambda adapters
  README.md                  Proxy setup & deploy guide
api/                         Vercel functions (missions, health)
netlify/functions/          Netlify function (missions)
vercel.json / netlify.toml   One-command deploy configs (functions only)
public/index.html            Proxy landing page
```

### Mission data shape

```js
{
  id: 'm001',
  ageGroup: '1-2' | '2-3' | '3-4',
  theme: 'jungle' | 'ocean' | 'space' | 'animals' | 'colors',
  category: 'language' | 'motor' | 'social' | 'cognitive' | 'emotion' | 'pretend',
  mode: 'treasure' | 'copy' | 'animal' | 'emotion' | 'story',
  prompt: 'Can you find something BLUE?',
  parentTip: 'Point to it together and say "blue!" slowly.',
  celebration: 'Great looking, Explorer!',
  options: ['Apple', 'Car', 'Star'], // Story Builder only
}
```

Missions are plain data behind an async `getSessionMissions()` seam, so
**AI-generated missions** drop in without touching any screen.

## ✨ AI-generated missions (optional)

The app runs fully offline from the 104-mission local database. You can *also*
let Buddy generate fresh missions with Claude:

1. Copy `.env.example` → `.env` and set `EXPO_PUBLIC_TALKQUEST_AI_ENDPOINT` to
   your backend proxy (recommended — see [`server/`](server/README.md)), or
   `EXPO_PUBLIC_TALKQUEST_AI_KEY` for local dev only.
2. Toggle **AI missions** on in the in-app Settings screen.

A ready-to-run proxy lives in [`server/`](server/README.md) — zero-dependency
Node (`npm run server`) plus Vercel/Netlify adapters. It holds the API key
server-side and is hardened against open-relay abuse (model allowlist, token
cap, requires the `emit_missions` tool).

How it works (`src/services/aiMissionProvider.js`):

- Calls Claude's Messages API via a single structured tool (`emit_missions`)
  so output already matches the mission schema.
- A strict, kid-safety system prompt forbids any medical/diagnostic framing,
  hazards, or scary content, and matches age-appropriate difficulty.
- **Every** returned mission is re-validated and sanitized locally before it
  can reach a child's screen; invalid ones are dropped.
- Results are topped up with local missions and **always fall back to the local
  database** on any network/config/validation error — a session is never empty
  and never shows unvetted content.

> 🔒 **Security:** an app bundle is not a secret. For production, proxy through
> a backend that holds the API key server-side (`EXPO_PUBLIC_TALKQUEST_AI_ENDPOINT`).
> The direct-key path is for development only.

## 🚀 Run it

```bash
npm install
npm start            # Expo dev server — press i / a / w for iOS / Android / web

# Or go straight to a target:
npm run web          # open in a browser (no phone/simulator needed)
npm run ios          # iOS simulator (needs Xcode)
npm run android      # Android emulator (needs Android Studio)
```

On a phone: install **Expo Go**, run `npm start`, and scan the QR code.
Web support works out of the box (`react-native-web`); a production web bundle
is produced with `npx expo export --platform web`.

## ✅ Tests

Pure logic (mission selection, progress reducer, story builder, data integrity)
is covered by Jest:

```bash
npm test
```

```
Test Suites: 6 passed, 6 total
Tests:       66 passed, 66 total
```
