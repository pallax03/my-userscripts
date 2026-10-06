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

| Script | Purpose | Target Site | Source File | Direct Raw Install |
| :--- | :--- | :--- | :--- | :--- |
| **`manage-anilist.js`** | Sync AnimeUnity watch progress & status to AniList | `animeunity.so` | [📄 `manage-anilist.js`](./manage-anilist.js) | [👉 **Install (Raw)**](https://raw.githubusercontent.com/pallax03/my-userscripts/master/manage-anilist.js) |
| **`list-anilist.js`** | 1-Click add & sync anime from a friend's AniList list | `anilist.co` | [📄 `list-anilist.js`](./list-anilist.js) | [👉 **Install (Raw)**](https://raw.githubusercontent.com/pallax03/my-userscripts/master/list-anilist.js) |

> **Shared Token Benefit**: Both scripts share the exact same AniList token. Log in once, and both scripts work seamlessly!

---