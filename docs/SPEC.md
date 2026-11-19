# Product & Architecture Specification (`sync-anilist`)

## 1. Core Features & Behavioral Contracts

### F1. Automatic Episode Sync (85% Rule)
- **Trigger**: Playback reaches `>= 85%` (or `ended`).
- **Safety Guard**: Only auto-update AniList if `activeEp > trackedProgress` OR entry status is `REPEATING`. Never mark older episodes when rewatching or browsing.
- **Manual Controls**: Keep minimal manual overrides in `#al-dock` (`Segna visto`, `-1`, `+1` / reset) for edge cases.

### F2. Cross-Device Continue-Resume (Coexistence)
- **Storage**: `[resume:ep=X,t=Y,d=Z]` in AniList `notes` + fast local cache `al_resume_<mediaId>`.
- **Eligibility**: Only resume on the next unwatched episode (`ep === trackedProgress + 1`).
- **Coexistence**: Give native site resume a grace period (~1s) and cancel pending script seek if playback is already past `5s`, preventing double-seeking conflicts.

### F3. Home Watching / Rewatching Shelf
- **Trigger**: Home page (`/` or `/home`).
- **Data**: Fetch viewer's `CURRENT` and `REPEATING` AniList entries.
- **Action**: 1 click resolves the anime on the current provider and navigates directly to the next unwatched episode URL.

### F4. Buddy Sync
- **Storage**: `[sync:<username>]` tag in AniList `notes`.
- **Action**: Display buddy's current episode in `#al-dock` and allow 1-click progress sync when ahead.

### F5. Hybrid Auto-Skip & Contribution
- **Priority**:
  1. AniSkip community API segments (by `malId` + `ep`).
  2. Native site timestamps (`window.video.timestamps` via `AU_NATIVE_TIMESTAMPS`).
  3. Manual `S` key fallback: skips to `op.end - 1` when an opening segment exists, or `+85s` when none is found.
- **Contribution**: Allow submitting/calibrating missing segments to AniSkip from `#al-dock`.
- **Iframe Safety**: Never inject elements into JWPlayer's internal DOM.

---

## 2. Provider & Iframe Contracts

### Provider Interface (`src/sync-anilist/providers/base.js`)
Every site provider must implement:
- `isHome()`, `isAnimePage()`, `isWatchPage()`
- `getAnimeInfo()` -> `{ title, romajiTitle, anilistId, malId, currentEp, totalEp }`
- `getActiveEpisode()` -> `number`
- `getShelfAnchor()`, `getActionsAnchor()`, `getVideoBottomAnchor()`
- `resolveTargetUrl(media, targetEp)` -> `Promise<string|null>`

### Iframe <-> Top Window `postMessage` Protocol
- **Iframe -> Top**:
  - `AL_PLAYER_READY` / `AU_FRAME_READY`
  - `AL_PLAYBACK_STATE`: `{ currentTime, duration, isPaused, isEnded }`
  - `PLAYER_EVENT`: native Vixcloud `playerstate` (`position`, `duration`, `paused`, `reason`)
  - `AU_NATIVE_TIMESTAMPS`: `{ intro: { start, end }, outro?: { start, end } }`
  - `AL_RESUME_CONFIRMED`: `{ time }`
- **Top -> Iframe**:
  - `AL_SEEK`: `{ time }`
  - `AL_SKIP_CONFIG`: `{ op, autoSkip, skipFallbackDuration }`
