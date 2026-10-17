# AnimeUnity Home - AniList Continue Watching

Enhances the AnimeUnity homepage (`https://animeunity.so/`) with a native, glassmorphic **Continue Watching** shelf directly integrated above the latest releases, using your AniList profile as the Single Source of Truth (SSoT).

---

## Features

- 📺 **Continue Watching Shelf**: View all series currently marked as `Watching` in your AniList library at a glance directly on the AnimeUnity homepage.
- ⚡ **Smart Airing & Episode Detection**:
  - Automatically calculates whether new episodes have aired based on AniList airing schedules.
  - Highlights ready-to-watch episodes (`⚡ Ep. X ready` or `+N eps`).
  - Displays dynamic countdowns for upcoming releases (`🕒 Ep. X in 2d 5h`).
  - Marks completed or caught-up series (`✓ Caught Up`).
- 🎯 **"Only Unwatched" Toggle Filter**:
  - Filter your shelf to only show anime that have new aired episodes waiting for you.
  - Persists your preference in local storage.
- 🚀 **1-Click Progress Playback**:
  - Direct quick action button (`▶ Ep. X`) that links to the AnimeUnity anime page.
  - Automatic AnimeUnity slug caching from homepage metadata.
  - Fast fallback to AnimeUnity archive search for unmapped titles.
- 🔗 **AniList Quick Links**: Quick button on each card to view details on AniList.
- 📱 **Responsive & Smooth Carousel**: Touch-friendly horizontal scrolling track with scroll snap and desktop navigation chevrons.

---

## Installation

Install directly via your userscript manager (Userscripts for Safari, Tampermonkey, Violentmonkey):

👉 **[Install home-anilist.user.js](https://raw.githubusercontent.com/pallax03/my-userscripts/master/dist/home-anilist.user.js)**

---

## Architecture

- **Domain Helpers**: Reuses `src/shared/anilist/` for GraphQL API queries and OAuth token handling.
- **AnimeUnity Helpers**: Uses `src/shared/animeunity/utils.js` for metadata harvesting, title sanitization, and URL resolution.
- **Standardized Design**: Utilizes shared status colors and badge system from `src/shared/modal.scss` and `src/shared/anilist/statuses.js`.
