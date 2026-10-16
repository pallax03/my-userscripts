# GEMINI.md — Repository Context for Gemini & Antigravity

Architectural context, implementation patterns, and development guidelines for Gemini and Antigravity agents working on `my-userscripts`.

---

## 1. Project Overview & Architecture

Monorepo containing modular userscripts for different web platforms (AnimeUnity, AniList, and future arbitrary websites).

### Key Architectural Guidelines (DRY & SRP)
- **Universal Helpers (`src/shared/`)**: Contains only domain-agnostic utilities (`storage.js`, `toast.js`).
- **Domain Services (`src/shared/<service>/`)**: Contains domain/API-specific logic shared across multiple scripts (e.g. `src/shared/anilist/api.js` and `auth.js`). New userscripts for other platforms (e.g., YouTube, Reddit, GitHub) must not depend on AniList and should create their own domain services if shared across multiple scripts.
- **Independent Scripts (`src/<script-name>/`)**: Each userscript has a single responsibility and is bundled independently into a `dist/<script-name>.user.js` file.
- **Language & Quality Standard**: All code comments, docs, console outputs, UI text, and `.env` files must be in English. Keep code self-documenting without redundant comment bloat.

---

## 2. Core Modules

### `src/shared/anilist/` (Shared AniList Service)
- **`api.js`**: Centralized GraphQL client with automatic 401 token expiry handling, 404 suppression, and media queries/mutations.
- **`auth.js`**: Shared OAuth authorization modal, `?al_token=` URL parser, and date helper.

### `src/sync-anilist` (AnimeUnity to AniList Sync)
- **Goal**: Sync AnimeUnity watch progress and status with AniList.
- **Component Layout (`src/sync-anilist/components/`)**:
  - `nav.js`: Replaces native AnimeUnity Login in `#left-nav` (desktop) and `.nav-top-mobile` (mobile) with AniList profile widget.
  - `actions.js`: Populates `.cover-wrap .actions` reusing AnimeUnity's native Bootstrap buttons (`btn btn-primary al-bg-blue`, `form-control`).
  - `episodes.js`: Manages the quick progress bar (`✓ Ep. X`) and native grid highlights (`.al-highlight`, `.al-done`).
  - `manual-modal.js`: Lightweight dialog to link AniList ID or URL.
- **Resolver Pipeline (`src/sync-anilist/resolver.js`)**:
  1. *Manual Override*: Checks `Storage.get("al_manual_" + animeKey)`.
  2. *Embedded AniList ID*: Extracts ID from `<video-player anime="...">` and cover image URLs `b[x]?(\d+)`.
  3. *Native Romaji Title*: Matches against Romaji title from AnimeUnity player data.
  4. *DOM Title Fallback*: Strips tags (ITA, SUB, Season) and searches via AniList GraphQL.

### `src/import-friend-anilist` (AniList Friend Quick Add)
- **Goal**: Add anime from a friend's AniList animelist page (`/user/:username/animelist`) into personal list.
- **Features**: Floating toolbar with default action selector and "Hide in my list" toggle; color-coded split button for grid and table views.

---

## 3. Adding a New Userscript

1. Create `src/<script-name>/` with `index.js` and `styles.css`.
2. Reuse `src/shared/` universal utilities. If connecting to a new API with multiple future scripts, create `src/shared/<api-name>/`.
3. Register the script entry in `scripts/build.mjs` under `SCRIPTS`.
4. Register the package in `release-please-config.json` and `.release-please-manifest.json` (`"src/<script-name>": "1.0.0"`).
5. Run `npm run build && npm run validate`.
6. Add the install link to `README.md`.

---

## 4. Privacy & Conventions Checklist

- [ ] All code comments, docs, UI strings, and console logs are in English.
- [ ] No personal tokens or API keys committed.
- [ ] No hardcoded absolute user paths (`/Users/<user>/...`).
- [ ] Use Conventional Commits with package scope (`feat(sync-anilist):`, `fix(import-friend-anilist):`).
- [ ] Run `npm run build && npm run validate` before committing.
