# AnimeUnity to AniList Sync (`sync-anilist.user.js`)

> Seamlessly track your AnimeUnity watch history into AniList in real time and enjoy a personalized homepage Continue Watching shelf.

---

## 📸 Screenshots

| Feature | Preview |
| :--- | :--- |
| **Player Bottom Bar & Countdown** | ![Player Bar Preview](https://raw.githubusercontent.com/pallax03/my-userscripts/master/docs/screenshots/sync-video-bottom.png) |
| **Glassmorphic Preferences Modal** | ![Preferences Modal Preview](https://raw.githubusercontent.com/pallax03/my-userscripts/master/docs/screenshots/sync-preferences.png) |
| **Cover Actions & Manual Search** | ![Cover Actions Preview](https://raw.githubusercontent.com/pallax03/my-userscripts/master/docs/screenshots/sync-actions.png) |

*(To add your own screenshots, place image files inside `docs/screenshots/`)*

---

## ✨ Features

- **🏠 Homepage Continue Watching Shelf**:
  - Mounted directly above the latest releases on `https://animeunity.so/`.
  - Shows currently tracked series with progress bars and airing status.
  - **Smart Episode Detection**: Calculates if new episodes have aired (`⚡ Ep. X ready`) vs caught up (`🕒 Ep. X in [time]`).
  - **Only Unwatched Filter**: Quick toggle to show only series with unwatched aired episodes.
  - **1-Click Episode Playback**: Clicking `▶ Ep. X` navigates to the anime page and automatically switches to that episode.

- **📺 Video Bottom Player Bar (`#video-bottom`)**:
  - Embedded directly below the video player.
  - Interactive auto-sync countdown with quick-action icon buttons: Cancel (`✕`), Save (`✓`), or Synced (`refresh-ccw`).
  - Mobile & landscape layout optimized with edge anchoring for `Precedente` and `Successivo` episode buttons.

- **⚙️ Unified Preferences Modal**:
  - Compact, 3-section glassmorphic dialog:
    1. **Playback & Auto-Track**: Continuous toggle card with grace delay (0s, 10s, 15s, 30s) and rewind protection.
    2. **Preferred Audio**: Choose between **SUB-ITA** (default) and **ITA** (Italian dub) priority when both versions exist.
    3. **Homepage Shelf**: Enable/disable shelf display and customize default filter behavior.

- **🎯 Smart Metadata Resolver**:
  - Automatically identifies anime by querying AnimeUnity's internal `/livesearch` API and matching exact AniList IDs.
  - Resolves direct `/anime/:id-:slug` URLs without relying on broken search pages.
  - Manual override dialog to search AniList or link a specific ID if automatic detection needs adjustment.

- **🎨 Episode Grid Highlights & Auto-Select**:
  - Highlights currently tracked episode (`.al-tracked`) and completed episodes (`.al-done`).
  - Automatically selects target episode when arriving from Continue Watching.

- **👤 Safe Hover Profile Widget**:
  - Replaces login buttons in both desktop navbar (`#left-nav`) and mobile menu (`.nav-top-mobile`) with your AniList avatar.
  - Implements the safe hover triangle (transparent bridge + grace timeout) so moving cursor diagonally never closes the dropdown.

---

## 🚀 Installation

1. Install a userscript manager:
   - **Safari (macOS / iOS)**: [Userscripts](https://apps.apple.com/app/userscripts/id1463298887)
   - **Chrome / Brave**: [Tampermonkey](https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
2. Click **Install**:
   - [👉 Install `sync-anilist.user.js` (Raw)](https://raw.githubusercontent.com/pallax03/my-userscripts/master/dist/sync-anilist.user.js)
3. Navigate to [AnimeUnity](https://animeunity.so), click **Connect AniList** in the navigation bar or actions panel, authorize via OAuth, and paste your token.
