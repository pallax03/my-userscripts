# AGENTS.md — Guidelines for AI Coding Agents

Guidelines, architectural rules, and development practices for AI agents working on `my-userscripts`.

---

## 1. Project Philosophy & Architecture

This repository is a monorepo for modular userscripts spanning different target websites and APIs.

### Core Principles
- **DRY & SRP Architecture**:
  - `src/shared/`: Universal helpers (`storage.js`, `toast.js`) shared across all scripts regardless of target website or API.
  - `src/shared/<service>/`: Domain/API-specific shared modules (e.g. `src/shared/anilist/` for GraphQL queries and OAuth dialogs). Only scripts requiring this API import from it. Scripts for other domains (e.g. YouTube, GitHub) stay 100% decoupled.
  - `src/<script-name>/`: Individual userscript entry point (`index.js`), isolated styles (`styles.css`), and domain-specific logic.
- **Fast Vite Bundling**: Bundled into standalone production `dist/*.user.js` files using Vite + `vite-plugin-monkey`.
- **Native Browser Standards**: Distribution `dist/*.user.js` files must include `@updateURL` and `@downloadURL` for native extension auto-updates (Userscripts for Safari, Tampermonkey for Chrome).
- **Code Quality**: Keep code self-documenting. Avoid redundant comments that merely restate code syntax. All comments, docs, UI texts, and console logs must be in English.

---

## 2. Directory Layout

```
my-userscripts/
├── .github/workflows/release.yml   # Release Please multi-package automation
├── dist/                           # Compiled userscript bundles (tracked in Git)
│   ├── sync-anilist.user.js
│   └── import-friend-anilist.user.js
├── scripts/
│   └── build.mjs                   # Bundles all scripts into dist/ with Vite
├── src/
│   ├── shared/                     # Universal cross-script utilities
│   │   ├── storage.js              # GM storage with localStorage fallback
│   │   ├── toast.js                # Auto-dismissing notification toasts
│   │   └── anilist/                # AniList-specific shared domain service
│   │       ├── api.js              # GraphQL queries, mutations, auth error handling
│   │       └── auth.js             # OAuth modal, URL token parser, date helpers
│   ├── sync-anilist/               # AnimeUnity -> AniList Sync userscript
│   │   ├── components/             # Feature-sliced components
│   │   │   ├── nav.js              # Navbar login/profile widget (desktop & mobile)
│   │   │   ├── actions.js          # Cover actions panel using native Bootstrap
│   │   │   ├── episodes.js         # Quick progress buttons & grid highlighting
│   │   │   └── manual-modal.js     # AniList ID/URL association dialog
│   │   ├── index.js                # Orchestrator entry point
│   │   ├── resolver.js             # Smart anime resolver
│   │   └── styles.css              # Minimal AniList accent styles (<45 lines)
│   └── import-friend-anilist/      # AniList Friend List Quick Add userscript
│       ├── index.js                # Entry point
│       ├── ui.js                   # Split button themes
│       └── styles.css              # Isolated styles
├── .env.example                    # Clean template for constants and paths
├── .release-please-manifest.json   # Package versions tracked by Release Please
├── release-please-config.json      # Monorepo Release Please configuration
└── package.json                    # Monorepo scripts and dependencies
```

---

## 3. Adding a New Userscript

To add a new userscript to the monorepo:
1. Create `src/<script-name>/` with `index.js` and `styles.css`.
2. Reuse `src/shared/` for universal utilities. If integrating with an existing domain (like AniList), import from `src/shared/<service>/`. If creating a new domain service shared by multiple future scripts, create `src/shared/<service>/`.
3. Register the script entry in `scripts/build.mjs` under `SCRIPTS`.
4. Register the package path in `release-please-config.json` and `.release-please-manifest.json` (`"src/<script-name>": "1.0.0"`).
5. Run `npm run build && npm run validate`.
6. Add the install link to `README.md`.

---

## 4. Releases & Semantic Versioning

This monorepo uses Google Release Please with package-scoped Conventional Commits:
- `feat(sync-anilist): ...`
- `fix(import-friend-anilist): ...`
- `chore: ...`

`scripts/build.mjs` dynamically stamps `@version` from `.release-please-manifest.json`.

---

## 5. Privacy & Security Rules

1. **No Personal Paths**: Never commit absolute local paths like `/Users/<name>/...`. Always use `$HOME` or environment variables.
2. **No Committed Tokens**: Never commit personal OAuth access tokens or API secrets. Keep them in `.env.local` (gitignored).
3. **Storage Isolation**: Always prefer GM storage APIs (`GM_getValue`/`GM_setValue`) with fallback to `localStorage`.
