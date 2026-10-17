# AniList Friend List - Quick Add & Sync (`import-friend-anilist.user.js`)

> Browse any friend's AniList anime list and add titles directly into your own collection with one click.

---

## 📸 Screenshots

| Feature | Preview |
| :--- | :--- |
| **Color-Coded Split Buttons (Grid View)** | ![Friend List Grid Preview](https://raw.githubusercontent.com/pallax03/my-userscripts/master/docs/screenshots/friend-grid-view.png) |
| **Floating Control Bar & Preferences** | ![Floating Bar Preview](https://raw.githubusercontent.com/pallax03/my-userscripts/master/docs/screenshots/friend-floating-bar.png) |
| **Preferences Modal & Visibility Filter** | ![Friend Preferences Preview](https://raw.githubusercontent.com/pallax03/my-userscripts/master/docs/screenshots/friend-preferences.png) |

*(To add your own screenshots, place image files inside `docs/screenshots/`)*

---

## ✨ Features

- **👥 Automatic Friend List Detection**:
  - Automatically activates on any friend's animelist page (`https://anilist.co/user/:username/animelist*`).
  - Stays invisible on your own list to avoid clutter.

- **🎛️ Color-Coded Split Action Buttons**:
  - Injected directly into both **Grid** (over poster covers) and **Table** (next to anime titles) views.
  - Powered by sharp **Lucide vector icons**.
  - **Left Primary Action**: 1-click Quick Add with your default status (e.g. *+ Plan to Watch*), or shows current status if already added (e.g. *Watching*, *Completed*).
  - **Right Chevron Dropdown**: Instantly change status to any category (*Watching*, *Completed*, *Plan to Watch*, *Paused*, *Rewatching*, *Dropped*) or remove from list (*🗑️ Remove*).

- **🚀 Glassmorphic Floating Toolbar**:
  - Compact bottom pill showing your avatar and username.
  - Quick-switch selector for default action.
  - **Preferences button (`Sliders`)** opening the centralized customization modal.
  - **Strict Z-Index Hierarchy**: Positioned at `z-index: 99990` so anime card buttons and covers will never overlap the bar when scrolling.

- **⚙️ Preferences Modal**:
  - **Hide in my list toggle**: Filters out anime cards and rows that are already in your AniList collection, leaving only new discoveries.
  - **Persistent settings**: Filter preferences and default action are remembered across page reloads and browser sessions.
  - **Account status & disconnect**: Manage active OAuth token and user session.

---

## 🚀 Installation

1. Install a userscript manager:
   - **Safari (macOS / iOS)**: [Userscripts](https://apps.apple.com/app/userscripts/id1463298887)
   - **Chrome / Brave**: [Tampermonkey](https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
2. Click **Install**:
   - [👉 Install `import-friend-anilist.user.js` (Raw)](https://raw.githubusercontent.com/pallax03/my-userscripts/master/dist/import-friend-anilist.user.js)
3. Navigate to any friend's AniList animelist (e.g. `https://anilist.co/user/somefriend/animelist`), connect your account if prompted, and start browsing!
