# AniList Streaming Sync (`sync-anilist.user.js`)

> Seamlessly track your AnimeUnity and AnimeSaturn watch history into AniList in real time and enjoy a personalized homepage Continue Watching shelf.

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

- **🌐 Multi-Site Provider Architecture**:
  - Full native support for **AnimeUnity** (`*.animeunity.*`) and **AnimeSaturn** (`*.animesaturn.*`).
  - Provider pattern keeps site-specific DOM scrapers, URLs, and search endpoints isolated and resilient against frontend changes.

- **🏠 Homepage Continue Watching Shelf**:
  - Mounted directly above the latest releases on both AnimeUnity and AnimeSaturn.
  - Shows currently tracked series with progress bars and airing status.
  - **Smart Episode Detection**: Calculates if new episodes have aired (`⚡ Ep. X ready`) vs caught up (`🕒 Ep. X in [time]`).
  - **Persistent Filters**: Quick toggles for **"Only unwatched"** and **"Sync Together"** that immediately persist in storage as your default preference.
  - **1-Click Episode Playback**: Clicking an anime resolves the episode URL via the active site's search API and navigates directly to it.

- **📺 Streamlined Anime Control Pillow**:
  - Positioned directly above the episode selector on both AnimeUnity and AnimeSaturn.
  - Compact symbolic status chip right beside the title (wrapping to the 2nd line on mobile) with intuitive icons:
    - **Countdown**: `[Clock] Ep. X · 15s` with `[✕]` cancel and `[✓ Save]`.
    - **Synced**: `[CheckCheck] Ep. X · Synced` with `[↺ Ep. X-1]` rewind button.
    - **Already Seen**: `[Check] Ep. X · Seen` with `[↺ Ep. X-1]` rewind button.
    - **Untracked**: `[Zap] Ep. X` with `[+ Save]` button.
  - Quick library delete bin icon positioned immediately beside the title badge.
  - Real-time library status, rating, and Sync Together buddy selector.

- **🔄 Cross-Provider Quick Switch**:
  - Live shortcut button in the player header (**`#video-top`** on AnimeUnity, **`.watch-toolbar`** on AnimeSaturn).
  - Instantly jump to the opposite streaming provider for the current anime and active episode (`AnimeSaturn · Ep. X ↗` / `AnimeUnity · Ep. X ↗`) if video fails or is unavailable on one of them.
  - Automatically checks learned local cache or queries the target search API with fallback to the direct search page.

- **⏩ AniSkip Opening Skip & Auto-Skip**:
  - Automatically fetches opening interval timings via AniSkip API based on AniList MAL ID.
  - Displays glassmorphic **"Skip Intro"** button (with shortcut `S`) during opening themes.
  - Fallback skip with key `S` (skips configured duration if opening metadata is unavailable).
  - Supports both `vixcloud` and `saturncdn` player iframes.

- **👥 Sync Together (Watch Buddy)**:
  - Track watching progress together with friends via AniList notes (`Sync Together: <username>`).
  - Overlaid friend avatar and progress badge on Continue Watching cards with 1-click sync.

- **⚙️ Unified Preferences Modal**:
  - Compact glassmorphic settings drawer:
    1. **Playback & Auto-Track**: Toggle auto-track and customize grace delay (0s, 10s, 15s, 30s).
    2. **Skip Intro (AniSkip)**: Auto-skip toggle and fallback skip duration (`S` hotkey).
    3. **Search & Matching**: Audio language preference (SUB vs ITA), auto-open search match delay, and "Clear Cache" button to reset learned anime mappings.
    4. **Sync Together**: Select default AniList buddy for watch party sync.
