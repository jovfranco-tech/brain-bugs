# Brain Bugs — Changelog

## v1.1.0 — Prompt 2 Upgrade (2025-05)

### 🎮 Gameplay
- **Drag-and-drop** — Full pointer-event drag with ghost piece that follows the cursor/finger. Works on touch and desktop. Uses `setPointerCapture` for reliable cross-element tracking.
- **Cell hover preview** — Board cells show green (valid) or red (invalid) highlight as piece is dragged over them. Preview cells are calculated in real-time.
- **Win animation** — Green flash overlay on board when puzzle is solved before navigating to Victory.
- **Improved Bug Coach** — State-machine hints that respond to moves made, placement failures, hint count, and progress percentage.
- **Stars preview** — Current star rating shown live as moves accumulate (top-right header).

### 🐛 Puzzle Data
- Fixed two puzzles with incorrect piece counts: `meadow-2` (was 16 cells → fixed to 15) and `crystal-5` (was 18 → fixed to 16).
- Improved all 15 puzzle hint strings to be more friendly and descriptive.
- All puzzles verified: `sum(piece cells) === (cols × rows − blocked.length)`.

### 🎉 Victory Screen
- Confetti particle effect for 3-star clears.
- Stats now include Moves, Hints, and Stars in a clean card row.
- New badge reveal with name and description (not just emoji).
- Replay hint shown for sub-3-star results.
- Background glow varies by star count.

### 👤 Child Profiles
- **Edit profile** — Tap ⋮ on any child card to edit nickname, avatar, age range, and companion.
- **Reset progress** — Confirmation dialog before wiping stars/badges.
- **Delete profile** — Permanent remove with one tap.
- **Empty state** — Friendly welcome message and prompt when no profiles exist.
- Profile sheet uses bottom-sheet pattern (tap outside to dismiss).

### 📊 Parent Dashboard
- 2-column metric grid: Stars, Puzzles, Avg Moves, Hints, Badges, Worlds.
- World progress tracker (how many worlds visited).
- Recent activity shows last 5 levels with star ratings.
- Reset progress accessible from dashboard Tools row.
- Safety privacy card with COPPA-friendly language.

### 🏆 Rewards
- Badge detail modal — tap any earned badge to see name and description.
- XP progress bar showing level and XP needed.
- Locked badge condition text so kids know what to do next.

### 🏠 Home Screen
- Quick stats row (Puzzles, Stars, Badges) when progress exists.
- 2-column grid for secondary nav (World Map, Rewards).
- Decorative flowers in SVG hill artwork.

### 🏗 Architecture
- `editChildProfile(childId, patch)` added to AppContext.
- `resetChildProgress(childId)` added to AppContext.
- `deleteChildProfile` now uses direct import (no `require()`).
- `screen` state initialised from localStorage (auth + child state persists on reload).
- `completeLevel` now awards `first-solve` badge correctly.

### 🔒 Settings
- COPPA-friendly privacy copy.
- Honest MVP limitations note (deterministic Bug Coach, localStorage auth).

---

## v1.0.0 — Initial MVP (Prompt 1)

- Parent signup/login (mock localStorage auth, Supabase-ready abstraction).
- Child profile creation (nickname, avatar, age range, bug companion).
- Child profile selection and switching.
- Home Screen with PLAY CTA and secondary nav.
- World Map with 3 worlds (Meadow, Crystal, Robo), locked/unlocked levels.
- Puzzle Gameplay: click-to-select, click-to-place, rotation, reset, hint, check.
- Bug Coach: deterministic contextual hints.
- Victory screen with stars and badge unlocks.
- Rewards screen with 8 badge collection.
- Parent Dashboard with skill progress bars.
- Settings screen.
- 15 playable puzzles across 3 worlds.
- 8 badges.
- LocalStorage persistence.
- Tailwind CSS with Brain Bugs brand colors.
- Build: TypeScript + Vite, 0 errors.

---

## v0.3.0-mvp — Production Readiness Audit (2025-05)

**Summary:** Final MVP polish pass — gameplay validation, profile persistence, rewards alignment, parent dashboard, mobile responsiveness, and Vercel readiness.

### Critical fixes
- Fixed `completeLevel` to advance `child.currentLevel` and `child.currentWorld` after each level completion.
- Removed `console.info` from AppContext (clean production build).
- Fixed `WorldId` type inference in `storage.ts` (was `Type 'string' is not assignable to type 'WorldId'`).
- Fixed `postcss.config.js` ESM/CJS conflict by adding `"type":"module"` to `package.json`.

### Gameplay
- Bug Coach now awards `crystal-explorer` ("No Hint Win") badge when hintsUsed === 0 at solve time.
- Star scoring threshold tightened: 3★ now requires ≤ 55% (was 60%) of max moves.
- `isBoardSolved` validation unchanged and confirmed correct.
- All 15 puzzle piece counts verified correct (fixed in v1.1.0, confirmed again here).

### Auth & profiles
- Added password length validation in `signUp` (min 6 chars).
- Email trimmed and lowercased before save.
- Nickname trimmed before save.
- `signIn` trims email before lookup.

### Badges
- Updated badge names to match spec: Pattern Finder, Persistence Star, No Hint Win, Rotation Rookie, Brain Bug Champion, Corner Thinker, Meadow Master, First Solve.
- `checkNewBadges` now skips badges with no numeric condition (external-only badges won't auto-award incorrectly).

### World Map
- Added "current level" indicator (gold ring on first incomplete unlocked level).
- Added per-world progress bar (% complete).
- Locked world shows contextual unlock message.
- Level node size adjusts for current level.

### Visual polish
- Landing screen: better cloud/hill artwork, flower decorations, privacy tagline.
- Auth screens: email trim, password validation visible.
- Bottom navigation: unchanged (stable).
- Parent dashboard: 2-col metric grid confirmed working.

### Data & architecture
- Added `ActivityEvent` interface to `types/index.ts`.
- Added `AuthState` interface to `types/index.ts`.
- `ProgressRecord` now includes `activity: ActivityEvent[]`.
- `SkillMetric` interface verified present.
- `getAllLevels()` exported from worlds.ts (used by completeLevel).

### Deployment
- `vercel.json` added: SPA rewrites + security headers (X-Frame-Options, X-Content-Type-Options, etc.)
- `"type": "module"` added to `package.json` (removes postcss ESM warning).
- `typecheck` script added to `package.json`.

### Documentation
- `README.md` updated with full setup, gameplay rules, limitations, roadmap.
- `docs/GAMEPLAY_RULES.md` created.
- `docs/PRIVACY_NOTES.md` created.
- `CHANGELOG.md` updated.
- `.env.example` updated with feature flags.

### Build
```
tsc -b && vite build
✓ 34 modules transformed
dist/index.html                   1.34 kB │ gzip:  0.73 kB
dist/assets/index.css            17.85 kB │ gzip:  4.61 kB
dist/assets/index.js            291.12 kB │ gzip: 84.78 kB
✓ built in ~1s — 0 errors, 0 warnings
```

---

## v0.3.1 — Final MVP Release Preparation (2025-05)

> "Final MVP release preparation: technical audit, gameplay validation, auth/profile persistence, privacy review, responsive polish, documentation, and Vercel readiness."

### Build & Type safety
- **0 TypeScript errors**, **0 console.log/info/warn** in production code
- **0 `as any` casts** (replaced all with proper `WorldId` import in Gameplay.tsx)
- Fixed `storage.ts` spread order for `activity` field migration (TS2783)
- `"type":"module"` in package.json eliminates postcss ESM warning

### Gameplay engine
- Added `failCount` counter — tracks consecutive failed placements
- Bug Coach responds to `failCount`: specific messages at 1, 2, 3+ consecutive failures
- Added `onPointerCancel` event handler — drag ghost cleans up properly on OS interrupts
- Disabled Rotate and Hint buttons after puzzle is solved (prevents confusing state)
- Check button now works correctly after final piece is auto-placed
- NEXT LEVEL button in Victory now navigates to actual next level if unlocked; falls back to world map

### Navigation
- BottomNav: clicking the already-active tab is now a no-op (prevents duplicate history stack entries)
- Victory screen: `goNext()` computes next level from `getAllLevels()` and checks star gate

### Storage
- `getProgress()` safely migrates old records that lack the `activity` field (backward compat for v1.0/v1.1 saved data)
- `EMPTY_PROGRESS` helper extracted for consistency

### Validation results (all automated)
- ✅ 15/15 puzzles: piece counts match board cells
- ✅ 6/6 levelId → puzzleId parsing tests
- ✅ 12/12 screens routed in App.tsx
- ✅ 11/11 AppContext functions present
- ✅ 8/8 badge IDs present
- ✅ 8/8 badge display names present
- ✅ 3/3 external badge award conditions in AppContext
- ✅ 10/10 puzzle boards fit within 360px viewport
- ✅ No `as any`, no `console.*`, no hardcoded secrets

### Files changed
`src/screens/Gameplay.tsx` · `src/screens/OtherScreens.tsx` · `src/components/BottomNav.tsx` · `src/lib/storage.ts` · `.env.example` · `CHANGELOG.md`
