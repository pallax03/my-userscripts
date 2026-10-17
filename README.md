# my-userscripts

Lightweight, modular userscripts collection with automated Vite bundling, native auto-updates, and multi-package semantic releases.

---

## 1. Install Extension

Install the recommended userscript manager for your browser:

| Browser | Extension | Store Link |
| :--- | :--- | :--- |
| 🍏 **Safari** (macOS / iOS) | **Userscripts** | [Download on Mac App Store](https://apps.apple.com/app/userscripts/id1463298887) |
| 🌐 **Google Chrome** | **Tampermonkey** | [Download on Chrome Web Store](https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) |

---

## 2. Scripts & Documentation

Click **Install** to add the script directly into your browser extension, or open the **Documentation** to see detailed features and screenshots:

| Script | Target Site | Documentation & Screenshots | Install Link |
| :--- | :--- | :--- | :--- |
| **`sync-anilist.user.js`** | `animeunity.so` | [📖 Read Guide & Screenshots](src/sync-anilist/README.md) | [👉 Install (Raw)](https://raw.githubusercontent.com/pallax03/my-userscripts/master/dist/sync-anilist.user.js) |
| **`import-friend-anilist.user.js`** | `anilist.co` | [📖 Read Guide & Screenshots](src/import-friend-anilist/README.md) | [👉 Install (Raw)](https://raw.githubusercontent.com/pallax03/my-userscripts/master/dist/import-friend-anilist.user.js) |
| **`home-anilist.user.js`** | `animeunity.so` | [📖 Read Guide & Screenshots](src/home-anilist/README.md) | [👉 Install (Raw)](https://raw.githubusercontent.com/pallax03/my-userscripts/master/dist/home-anilist.user.js) |

*Note: AniList OAuth tokens are securely stored and shared across scripts via GM storage.*

---

## 3. Development

```bash
# Install dependencies
npm install

# Build all scripts (and auto-syncs to Safari iCloud if SAFARI_USERSCRIPTS_ICLOUD_DIR is set)
npm run build

# Verify syntax
npm run validate
```