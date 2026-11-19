# GitHub Copilot Instructions

Follow [AGENTS.md](../AGENTS.md) and [docs/SPEC.md](../docs/SPEC.md) strictly for all changes in this repository.

Key rules:
- **Zero DOM scraping**: Do NOT introduce CSS selector lists for Inertia/Vue sites when structured data (`history.state.page.props`, `/api/...`) is available.
- **Fixed UI mount**: Mount UI inside `#al-dock` (`src/sync-anilist/slots.js`), never inside site navbars or JWPlayer's iframe DOM.
- **Mandatory checks**: Always run `npm run lint`, `npm test`, `npm run build`, and `npm run validate` before concluding.
