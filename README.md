# 🎬 AnimeUnity to AniList Sync

**English** | [Italiano](README.it.md)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/Version-2.2.0-brightgreen.svg)]()
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
| 🍏 **Safari** (macOS / iOS) | **Stay** | [👉 Download on Mac App Store](https://apps.apple.com/app/stay-for-safari/id1591620924) |
| 🌐 **Google Chrome** / Brave / Edge | **Tampermonkey** *(Most popular)* | [👉 Download on Chrome Web Store](https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) |
| 🌐 **Google Chrome** / Brave / Edge | **Violentmonkey** *(Lightweight & Open Source)* | [👉 Download on Chrome Web Store](https://chromewebstore.google.com/detail/violentmonkey/jinjaccalgkegednnccohejagnlnfdag) |

---

### Step 2: Install the Script

Once the extension is installed, click the link below:

👉 **[📥 Click here to install the script (manage-anilist.js)](./manage-anilist.js)**  
*(On GitHub, click **Raw** on `manage-anilist.js`: your browser extension will automatically prompt you to install it).*

> **Direct URL for remote installation (GitHub Raw):**  
> `https://raw.githubusercontent.com/<YOUR-USERNAME>/<YOUR-REPO>/master/manage-anilist.js`

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
- **Dual Buttons (+1 and -1)**:
  - Below the episode grid, access both `[ ✓ Mark Episode {X} completed (+1) ]` and `[ ↶ Back to Ep. {X-1} (-1) ]` in case you accidentally clicked.
  - Quick action buttons below the video player (`#video-bottom`) allow updating without scrolling down.

### 🔍 Smart Title Resolution
- **Automatic Title Cleaning**: Strips noisy suffixes like `(ITA)`, `(SUB ITA)`, `ITA`, `Season 2` before searching AniList to ensure instant matches.
- **Manual Override**: If a series is a spin-off or has a different English/Romaji title, click **`🔗`** and paste the AniList URL or numerical ID (stored permanently in local storage).

### ⌨️ Keyboard Shortcuts
| Shortcut | Action |
| :---: | :--- |
| `Shift + S` | Mark **next episode (+1)** as completed on AniList |
| `Shift + Z` | Step back by **1 episode (-1)** on AniList |

---

## 📄 License

Distributed under the MIT License. Free for personal use and community contributions.