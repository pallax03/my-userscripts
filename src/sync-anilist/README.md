# AnimeUnity to AniList Sync (`sync-anilist.user.js`)

> Seamlessly track your AnimeUnity watch history directly into AniList in real time.

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

- **📺 Video Bottom Player Bar (`#video-bottom`)**:
  - Embedded directly below the video player.
  - Interactive auto-sync countdown with quick-action icon buttons: Cancel (`✕`), Save (`✓`), or Synced (`refresh-ccw`).
  - Mobile & landscape layout optimized with edge anchoring for `Precedente` and `Successivo` episode buttons.

- **⚙️ Preferences Modal**:
  - Modern cyberpunk / glassmorphic dialog.
  - **Auto-track on episode select**: Continuous accordion toggle card that smoothly expands sub-options.
  - **Grace delay**: Configurable timer (Instant, 10s, 15s, 30s) to prevent false syncs when quickly previewing episodes.
  - **Rewatch rewind prevention**: Guards your progress from accidentally decreasing when rewatching past episodes.

- **🎯 Smart Metadata Resolver**:
  - Automatically identifies anime by checking player metadata, poster image URLs, and Romaji titles.
  - Manual override dialog to search AniList or link a specific ID if automatic detection needs adjustment.

- **🎨 Episode Grid Highlights**:
  - Highlights currently tracked episode (`.al-highlight`) and completed episodes (`.al-done`) on the AnimeUnity episode list.

- **👤 Cohesive Profile Widget**:
  - Replaces AnimeUnity's login buttons in both desktop navbar (`#left-nav`) and mobile menu (`.nav-top-mobile`) with your AniList avatar and dropdown menu.

---

## 🚀 Installation

1. Install a userscript manager:
   - **Safari (macOS / iOS)**: [Userscripts](https://apps.apple.com/app/userscripts/id1463298887)
   - **Chrome / Brave**: [Tampermonkey](https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
2. Click **Install**:
   - [👉 Install `sync-anilist.user.js` (Raw)](https://raw.githubusercontent.com/pallax03/my-userscripts/master/dist/sync-anilist.user.js)
3. Navigate to [AnimeUnity](https://animeunity.so), click **Connect AniList** in the navigation bar or actions panel, authorize via OAuth, and paste your token.
