# 🎬 AnimeUnity to AniList Sync

**English** | [Italiano](README.it.md)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/Version-1.1.0-brightgreen.svg)]()
[![Platform](https://img.shields.io/badge/Browser-Safari%20%7C%20Chrome-blueviolet.svg)]()

A modern, lightweight, and responsive Userscript to automatically sync anime watch progress, list statuses (*Watching*, *Completed*, etc.), and personal scores directly with **[AniList](https://anilist.co)** from the AnimeUnity web interface on both **Desktop** and **Mobile**.

> 📌 **Prerequisite**: An **AniList** account is required. If you do not have one yet, you can [sign up for free here](https://anilist.co/signup).

---

## ⚡ Quick 2-Step Installation

### Step 1: Install a Userscript extension for your browser

Choose your browser to install the recommended extension with 1 click from the official store:

| Browser | Recommended Extension | Official Download Link |
| :--- | :--- | :--- |
| 🍏 **Safari** (macOS / iOS) | **Userscripts** *(Open Source, Recommended)* | [👉 Download on Mac App Store](https://apps.apple.com/app/userscripts/id1463298887) <br> *GitHub alternative:* [quoid/userscripts](https://github.com/quoid/userscripts/releases) |
| 🌐 **Google Chrome** / Brave / Edge | **Tampermonkey** *(Most popular)* | [👉 Download on Chrome Web Store](https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) |

---

### Step 2: Install the Scripts

Install either or both scripts with a single click:

| Script | Purpose | Target Site | Quick Install Link |
| :--- | :--- | :--- | :--- |
| **`manage-anilist.js`** | Sync AnimeUnity watch progress & status to AniList | `animeunity.so` | [👉 **Install manage-anilist.js**](https://raw.githubusercontent.com/pallax03/my-userscripts/master/manage-anilist.js) |
| **`list-anilist.js`** | 1-Click add & sync anime from a friend's AniList list | `anilist.co` | [👉 **Install list-anilist.js**](https://raw.githubusercontent.com/pallax03/my-userscripts/master/list-anilist.js) |

> **Shared Token Benefit**: Both scripts share the exact same AniList token. Log in once, and both scripts work seamlessly!

---

## 🔑 AniList Token Setup (Zero-Effort OAuth)

1. Open any anime page on AnimeUnity.
2. In the top navbar (or in the panel beneath the anime cover), click **`🔑 Connect AniList`**.
3. Click the link **[Open AniList OAuth Authorization](https://anilist.co/api/v2/oauth/authorize?client_id=43750&response_type=token)**.
4. Click **Authorize**: you will be redirected to an official AniList page displaying your personal access token (or find it in the URL hash as `access_token=...`).
5. Paste the token into the script popup and click **"Save & Connect"**.

> 💡 **One-Click URL Shortcut**: You can also set your token by visiting any page with:  
> `https://www.animeunity.so/anime/anything?al_token=YOUR_TOKEN`  
> The script will automatically store it and clean up the URL.

---

## ✨ Features & Quality of Life (QoL)

### 👤 Profile & Navbar (Desktop & Mobile)
- **Desktop**: Replaces the generic login button in the top-right navbar with your **AniList Avatar**, username, and quick dropdown.
- **Mobile**: Automatically injects a compact widget into the top bar (`.nav-top-mobile`, next to the search icon), always accessible without opening side drawers.
- **Dropdown Menu**: Direct link to your public AniList profile, token manager, and instant logout.

### 🎛️ Integrated Series Management
- **Status Selector**: Switch on the fly between *Watching*, *Plan to Watch*, *Completed*, *Paused*, *Dropped*, *Rewatching*.
- **Personal Score**: Quick rating selector (1 to 10 with ★ stars) synced with AniList.
- **Mini Progress Bar**: Visual progress indicator showing completed episodes and percentage (e.g. `Progress: 4 / 12 ep - 33%`).
- **Step Buttons (+/-)**: Adjust progress by 1 episode directly from the header without opening dropdowns.
- **Delete / Trash**: Remove an anime from your AniList profile with a safety confirmation prompt.

### 📺 Episode Tracking & Quick Advance
- **Cleaned seen episode styling**: Removed the harsh bright pastel blue background of default seen items in favor of a clean dark theme (`#17212e`).
- **Glow & Badge for latest episode**: The most recently tracked AniList episode stands out with a **radiant glow effect**, slight enlargement, and a **"✓" checkmark badge**.
- **Smart Progress Buttons (+1 and -1)**:
  - Below the episode grid, access both `[ ✓ Mark Episode {X} completed (+1) ]` and `[ ↶ Back to Ep. {X-1} (-1) ]` in case you accidentally clicked.
  - **Catch-up Detection**: The "+1" button automatically hides when you are caught up with the released episodes on AnimeUnity, displaying a clean status badge (*"✓ You are caught up"*).
  - **Auto-Completion & Dates**: Marking the final episode automatically sets the status to **Completed** on AniList and records today's date (`completedAt`). The start date (`startedAt`) is also saved automatically when you begin watching!

### 🔍 Smart Title Resolution
- **Automatic Title Cleaning**: Strips noisy suffixes like `(ITA)`, `(SUB ITA)`, `ITA`, `Season 2` before searching AniList to ensure instant matches.
- **Manual Override**: If a series is a spin-off or has a different English/Romaji title, click **`🔗`** and paste the AniList URL or numerical ID (stored permanently in local storage).

### ⌨️ Keyboard Shortcuts
| Shortcut | Action |
| :---: | :--- |
| `Shift + S` | Mark **next episode (+1)** as completed on AniList |
| `Shift + Z` | Step back by **1 episode (-1)** on AniList |

---

## 👥 Features: `list-anilist.js` (AniList Friend List Quick Add)

When browsing a friend's profile (`https://anilist.co/user/<username>/animelist`):
- **Smart Last Action Memory**: The action button remembers your last chosen status (*Plan to Watch*, *Watching*, *Completed*, etc.). Clicking the main button instantly adds the anime using this preference with **1 single click**.
- **Interactive Status Dropdown (`▾`)**: Click the arrow to choose any other status or delete from your list. Picking a new status updates your future default action automatically.
- **Auto-Completion on Completed**: Choosing *Completed* automatically marks all episodes as seen, setting both completion and start dates.
- **Live Status Badges**: Anime already in your collection are tagged with clean green badges (e.g. `✓ Watching` or `✓ Completed`), preventing accidental re-adds.
- **"Hide Already in My List" Filter**: Floating bottom bar with a toggle checkbox to hide all anime you've already added, allowing you to discover unseen gems from your friend's list instantly!


---

## 📄 License

Distributed under the MIT License. Free for personal use and community contributions.