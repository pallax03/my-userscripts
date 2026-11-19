# AGENTS.md — Engineering & Vibe-Coding Guardrails

This repository contains browser userscripts (`sync-anilist` and `import-friend-anilist`) built with Vite + `vite-plugin-monkey`.
Read this file and [docs/SPEC.md](docs/SPEC.md) **before** making any code changes.

---

## 1. Core Product Invariants (Never Break)

1. **AniList is the Single Point of Truth**:
   - Site logins (AnimeUnity / AnimeSaturn) must NEVER overwrite or block AniList tracking.
   - All 5 core features must always remain available even when a site implements a partial native equivalent:
     1. **Auto Episode Sync** (85% completion guard: only increment when `activeEp > trackedProgress` or `REPEATING`; never auto-mark older rewatched episodes; keep minimal manual `Segna visto` / `-1` / `+1` controls).
     2. **Cross-Device Continue-Resume** (`[resume:ep,t,d]` in AniList notes, coexisting cleanly with native site resume).
     3. **Home Watching / Rewatching Shelf** (1-click jump from Home to the exact anime and next unwatched episode).
     4. **Buddy Sync** (`[sync:username]` 1-click progress sync across devices/accounts).
     5. **Hybrid Auto-Skip & Contribution** (AniSkip DB -> native `window.video.timestamps` -> `S` key `+85s` fallback + contribution modal).

2. **Minimal Configuration & Auth**:
   - Keep settings minimal. Prefer automatic heuristics over user toggles.
   - Keep AniList OAuth 1-click (`handleOAuthRedirect`) working without manual token copy-paste.

---

## 2. Architecture & Anti-Fragility Rules

1. **Zero DOM Scraping**:
   - Never rely on brittle site CSS class hierarchies when structured data exists (`history.state.page.props`, `#app[data-page]`, same-origin `/api/...`, URL patterns).
   - Never mutate JWPlayer's internal iframe DOM (e.g. injecting buttons/cues inside `.jwplayer`), as it collapses Vixcloud's `<video>` and breaks iOS Safari fullscreen.
2. **Fixed Mount Points (`slots.js`)**:
   - Mount persistent controls inside `#al-dock` (`bottom-right`, safe-area aware) via `slot()`. Never inject dropdowns into site navbars.
3. **Domain-Agnostic Logic**:
   - Never hardcode a single TLD (`.cx`, `.to`, `.cc`) in runtime JS logic. Use `meta.js` wildcard `@include`/`@connect` rules and hostname family matching (`/animeunity\./i`, `/animesaturn\./i`).
4. **Keep Diffs Small & Modular**:
   - Pure business logic (`providers/base.js`, `buddy.js`, `resume.js`, `shared/animeunity/site.js`, skip/resume state machines) must remain DOM-free and unit-tested in `tests/*.test.js`.

---

## 3. Mandatory Verification Gate (100% Agent-Tested)

Every agent **must** run and pass all checks before finishing or opening a PR:

```sh
npm run lint
npm test
npm run build
npm run validate
```

When modifying providers, player, iframe messaging, or UI dock/shelf:
- Also run E2E verification with `node scripts/e2e.mjs <url> [out.png] [--mobile]` (or the hermetic Playwright suite once added) and verify **0 console/page errors**, `#al-dock` inside viewport bounds (`x >= 0`, `right <= viewportWidth`), and player visibility.
- Never claim tests pass unless you ran them after your final edit.
