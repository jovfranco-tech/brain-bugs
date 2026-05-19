# 🐛 Brain Bugs — v0.3.0-mvp

> **Think. Connect. Solve. Grow!**  
> A premium spatial logic puzzle game for kids ages 5–9.

---

## What is Brain Bugs?

Brain Bugs is a mobile-first web app where kids drag and rotate original bug-shaped puzzle pieces onto a grid board. The goal: fill every empty cell without overlaps. Progress through three hand-crafted worlds, earn stars and badges, and get encouragement from Bug Coach — a safe, deterministic hint system (no live AI).

**Target users:** Children aged 5–9, managed by a parent or guardian.  
**Parent account required.** Children never register directly.

---

## Features

| Category | Details |
|---|---|
| Auth | Parent signup/login (localStorage mock · Supabase-ready) |
| Profiles | Multiple child profiles · Edit · Reset · Delete |
| Worlds | 🌿 Meadow Path · 💎 Crystal Cave · 🤖 Robo Reef |
| Levels | 15 puzzles (5 per world) · Star-gated progression |
| Gameplay | Drag-and-drop · Rotation · Live hover preview |
| Pieces | 6 original bugs: Pip, Bobo, Zig, Mo, Rose, Coach |
| Bug Coach | Deterministic contextual hints · Kid-safe · No LLM |
| Badges | 8 collectible badges with unlock conditions |
| Rewards | XP · Level bar · Badge detail modal |
| Parent Dashboard | Metrics · Skill bars · Activity log · Privacy card |
| Privacy | Minimal child data · No ads · No tracking · No chat |
| Deployment | Vercel-ready (vercel.json included) |

---

## Quick Start

```bash
unzip brain-bugs-v0.3.0-mvp.zip
cd brain-bugs
npm install
npm run dev
# Open http://localhost:5173
# Use Chrome DevTools → iPhone 14 Pro (393px) for best experience
```

---

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start dev server (port 5173) |
| `npm run build` | Type-check + production build → `dist/` |
| `npm run preview` | Serve the `dist/` build locally |
| `npm run typecheck` | TypeScript check only (no emit) |

---

## Authentication

### Without Supabase (default — works immediately)
All data lives in `localStorage`. No setup needed. Accounts persist across page refreshes in the same browser.

> ⚠️ The mock auth uses base64 obfuscation for passwords, not bcrypt. **Do not use for real production data.**

### With Supabase (recommended for deployment)
1. Create a project at [supabase.com](https://supabase.com)
2. Copy `.env.example` → `.env.local`
3. Fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
4. In `src/contexts/AppContext.tsx`, replace `signUp`/`signIn`/`signOut` bodies with `supabase.auth.*`
5. In `src/lib/storage.ts`, replace CRUD with `supabase.from('table').*`
6. All comments marked `// TODO (Supabase):` show exactly where to swap

---

## Environment Variables

```bash
# .env.local  (copy from .env.example — never commit)

# Supabase (optional; app runs without these using localStorage)
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

# App config
VITE_APP_VERSION=0.3.0-mvp
VITE_APP_ENV=development
```

---

## Gameplay

- **Goal:** Cover every non-blocked board cell with bug pieces. No gaps, no overlaps.
- **Tap** a piece in the tray to select it, then **tap or drag** onto the board.
- **Rotate** a piece before placing using the Rotate button.
- Stars: **3★** ≤ 55% max moves · **2★** ≤ 100% · **1★** over limit.
- Best star rating per level is saved forever — replaying never reduces your best.

See `docs/GAMEPLAY_RULES.md` for the full rulebook.

---

## Project Structure

```
src/
├── types/index.ts          All TypeScript interfaces
├── data/
│   ├── characters.ts       Bug piece shapes + rotation helpers + colors
│   ├── puzzles.ts          15 verified puzzles (piece counts match board size)
│   ├── worlds.ts           3 worlds × 5 levels · star-gate thresholds
│   └── badges.ts           8 badges + checkNewBadges() utility
├── lib/storage.ts          localStorage persistence + mock auth (Supabase-ready)
├── contexts/AppContext.tsx Auth · navigation · game state
├── components/             Logo · BugSvg · BottomNav · StarRating
└── screens/
    ├── Landing.tsx
    ├── AuthScreen.tsx
    ├── ChildSelector.tsx   Create · Edit · Reset · Delete profiles
    ├── HomeScreen.tsx
    ├── WorldMap.tsx        Locked/unlocked · current level indicator
    ├── Gameplay.tsx        Drag-and-drop puzzle engine · Bug Coach
    └── OtherScreens.tsx    Victory (confetti) · Rewards · Parent Dashboard · Settings
docs/
├── GAMEPLAY_RULES.md      Full rulebook for the puzzle engine
└── PRIVACY_NOTES.md       Child safety and data privacy notes
vercel.json                SPA routing + security headers
```

---

## Known MVP Limitations

| Area | Status |
|---|---|
| Bug Coach | Deterministic state machine — no live LLM |
| Auth | localStorage unless Supabase is configured |
| Password security | Base64 obfuscation only — not production-safe |
| Animations | CSS only — Framer Motion not integrated |
| Offline/PWA | No service worker or manifest |
| Privacy audit | COPPA-friendly design, not formally audited |
| Puzzle quantity | 15 hand-crafted puzzles (no procedural generation) |
| No lint config | `eslint` not configured — use TypeScript strict mode instead |

---

## Deployment (Vercel)

```bash
npm run build
# vercel --prod
# or connect the repo to Vercel — it auto-detects Vite
```

`vercel.json` configures SPA routing and adds security headers automatically.

---

## Roadmap

| Priority | Feature |
|---|---|
| P0 | Supabase Auth + database |
| P0 | Production privacy policy + COPPA audit |
| P1 | Framer Motion animations (piece snap, screen transitions) |
| P1 | Daily Challenge mode |
| P1 | More puzzle worlds (Ocean, Volcano, Space) |
| P2 | Bug Lab — free-play sandbox |
| P2 | Procedural puzzle generator |
| P3 | iOS/Android via Capacitor |
| P3 | Leaderboard (opt-in) |
| P3 | Real AI Bug Coach (safe, content-filtered) |

---

## Privacy & Safety

Brain Bugs is designed with child privacy first. See `docs/PRIVACY_NOTES.md` for full details.

- No email or personal data collected from children
- No ads, no third-party trackers, no social login
- Bug Coach is deterministic — no LLM, no free chat
- All content is hand-crafted for ages 5–9
- Parent controls: reset progress, delete profiles, sign out

---

*Brain Bugs — original IP. All characters, worlds, and assets are original. Not affiliated with any existing board game, toy brand, or children's franchise.*
