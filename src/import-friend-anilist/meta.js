export default (manifest = {}) => ({
  name: "import-friend-anilist",
  entry: "src/import-friend-anilist/index.js",
  outFile: "import-friend-anilist.user.js",
  meta: {
    name: "AniList Friend List - Quick Add & Sync",
    namespace: "https://github.com/pallax03/my-userscripts",
    version: manifest["src/import-friend-anilist"] || "0.0.0",
    description: "Add and sync anime directly from a friend's AniList list into your collection with color-coded split buttons",
    author: "Alex Mazzoni",
    match: ["*://anilist.co/user/*/animelist*"],
    updateURL: "https://raw.githubusercontent.com/pallax03/my-userscripts/master/dist/import-friend-anilist.user.js",
    downloadURL: "https://raw.githubusercontent.com/pallax03/my-userscripts/master/dist/import-friend-anilist.user.js",
    grant: ["GM_getValue", "GM_setValue", "GM_deleteValue"],
    "run-at": "document-idle"
  }
});
