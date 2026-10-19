import { build } from "vite";
import monkey from "vite-plugin-monkey";
import fs from "fs";
import path from "path";

try { process.loadEnvFile(); } catch (_) {}
try { process.loadEnvFile(".env.example"); } catch (_) {}

let manifest = {};
try {
  manifest = JSON.parse(fs.readFileSync(".release-please-manifest.json", "utf-8"));
} catch (_) {}

const SCRIPTS = [
  {
    name: "sync-anilist",
    entry: "src/sync-anilist/index.js",
    outFile: "sync-anilist.user.js",
    meta: {
      name: "AnimeUnity to AniList Sync",
      namespace: "https://github.com/pallax03/my-userscripts",
      version: manifest["src/sync-anilist"] || "0.0.0",
      description: "Automatically sync watched AnimeUnity episodes and status to AniList",
      author: "Alex Mazzoni",
      match: [
        "*://*.animeunity.to/*",
        "*://animeunity.to/*",
        "*://*.animeunity.so/*",
        "*://animeunity.so/*",
        "*://*.animeunity.tv/*",
        "*://animeunity.tv/*",
        "*://*.animeunity.it/*",
        "*://animeunity.it/*",
        "*://*.animeunity.cc/*",
        "*://animeunity.cc/*",
        "*://*.animeunity.fun/*",
        "*://animeunity.fun/*"
      ],
      include: [
        "*://*.animeunity.*/*",
        "*://animeunity.*/*",
        "/^https?:\\/\\/(?:[a-z0-9-]+\\.)?animeunity\\.[a-z]{2,}\\/.*$/"
      ],
      updateURL: "https://raw.githubusercontent.com/pallax03/my-userscripts/master/dist/sync-anilist.user.js",
      downloadURL: "https://raw.githubusercontent.com/pallax03/my-userscripts/master/dist/sync-anilist.user.js",
      grant: ["GM_getValue", "GM_setValue", "GM_deleteValue", "GM_xmlhttpRequest"],
      connect: [
        "graphql.anilist.co",
        "anilist.co",
        "127.0.0.1",
        "localhost"
      ],
      "run-at": "document-idle"
    }
  },
  {
    name: "animeunity-skip-intro",
    entry: "src/animeunity-skip-intro/index.js",
    outFile: "animeunity-skip-intro.user.js",
    meta: {
      name: "AnimeUnity - Skip Intro",
      namespace: "https://github.com/pallax03/my-userscripts",
      version: manifest["src/animeunity-skip-intro"] || "1.0.0",
      description: "Automatically skip or show a quick button to skip opening anime sequences on AnimeUnity using AniSkip",
      author: "Alex Mazzoni",
      match: [
        "*://*.animeunity.to/*",
        "*://animeunity.to/*",
        "*://*.animeunity.so/*",
        "*://animeunity.so/*",
        "*://*.animeunity.tv/*",
        "*://animeunity.tv/*",
        "*://*.animeunity.it/*",
        "*://animeunity.it/*",
        "*://*.animeunity.cc/*",
        "*://animeunity.cc/*",
        "*://*.animeunity.fun/*",
        "*://animeunity.fun/*",
        "*://*.vixcloud.cc/*",
        "*://vixcloud.cc/*",
        "*://*.vixcloud.co/*",
        "*://vixcloud.co/*",
        "*://*.vixcloud.to/*",
        "*://vixcloud.to/*",
        "*://*.vixcloud.net/*",
        "*://vixcloud.net/*",
        "*://*.vixcloud.org/*",
        "*://vixcloud.org/*",
        "*://*.vixcloud.video/*",
        "*://vixcloud.video/*",
        "*://*.vixcloud2.cc/*",
        "*://vixcloud2.cc/*",
        "*://*.vixcloud2.co/*",
        "*://vixcloud2.co/*",
        "*://*.vixcloud2.to/*",
        "*://vixcloud2.to/*",
        "*://*.vixcloud2.net/*",
        "*://vixcloud2.net/*"
      ],
      include: [
        "*://*.animeunity.*/*",
        "*://animeunity.*/*",
        "*://*.vixcloud.*/*",
        "*://vixcloud.*/*",
        "*://*.vixcloud2.*/*",
        "*://vixcloud2.*/*",
        "/^https?:\\/\\/(?:[a-z0-9-]+\\.)?animeunity\\.[a-z]{2,}\\/.*$/",
        "/^https?:\\/\\/(?:[a-z0-9-]+\\.)?vixcloud[0-9]?\\.[a-z]{2,}\\/.*$/"
      ],
      updateURL: "https://raw.githubusercontent.com/pallax03/my-userscripts/master/dist/animeunity-skip-intro.user.js",
      downloadURL: "https://raw.githubusercontent.com/pallax03/my-userscripts/master/dist/animeunity-skip-intro.user.js",
      grant: ["unsafeWindow"],
      connect: ["api.aniskip.com"],
      "run-at": "document-start"
    }
  },
  {
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
  }
];

async function run() {
  console.log("🚀 Building userscripts with Vite...\n");

  const distDir = path.resolve("dist");
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  for (const s of SCRIPTS) {
    await build({
      configFile: false,
      plugins: [
        monkey({
          entry: path.resolve(s.entry),
          userscript: s.meta,
          build: {
            fileName: s.outFile
          }
        })
      ],
      build: {
        outDir: distDir,
        emptyOutDir: false,
        minify: false
      }
    });

    console.log(`✅ dist/${s.outFile} built`);
  }

  // Optional: sync to Safari iCloud folder if configured in .env and directory exists
  const rawDir = process.env.SAFARI_USERSCRIPTS_ICLOUD_DIR?.trim();
  if (rawDir) {
    const cleanDir = rawDir
      .replace(/^["']|["']$/g, "")
      .replace(/^~/, process.env.HOME || "")
      .replace(/\$\{(?:HOME)\}|\$HOME/g, process.env.HOME || "");

    if (fs.existsSync(cleanDir)) {
      for (const s of SCRIPTS) {
        fs.copyFileSync(path.join(distDir, s.outFile), path.join(cleanDir, s.outFile));
      }
      console.log(`\n🔄 Synced scripts to Safari iCloud: ${cleanDir}`);
    }
  }

  console.log("\n✨ Build completed successfully!");
}

run().catch((err) => {
  console.error("Build failed:", err);
  process.exit(1);
});
