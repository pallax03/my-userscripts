import { build } from "vite";
import monkey from "vite-plugin-monkey";
import fs from "fs";
import path from "path";

try { process.loadEnvFile(); } catch (_) {}
try { process.loadEnvFile(".env.example"); } catch (_) {}

const isWatch = process.argv.includes("--watch") || process.argv.includes("-w");

let manifest = {};
try {
  manifest = JSON.parse(fs.readFileSync(".release-please-manifest.json", "utf-8"));
} catch (_) {}

function syncToIcloud(distDir, outFile) {
  const rawDir = process.env.SAFARI_USERSCRIPTS_ICLOUD_DIR?.trim();
  if (!rawDir) return;

  const cleanDir = rawDir
    .replace(/^["']|["']$/g, "")
    .replace(/^~/, process.env.HOME || "")
    .replace(/\$\{(?:HOME)\}|\$HOME/g, process.env.HOME || "");

  if (fs.existsSync(cleanDir)) {
    const srcFile = path.join(distDir, outFile);
    const destFile = path.join(cleanDir, outFile);
    if (fs.existsSync(srcFile)) {
      fs.copyFileSync(srcFile, destFile);
      console.log(`   🔄 Synced ${outFile} -> Safari iCloud`);
    }
  }
}

async function getScriptConfigs() {
  const srcDir = path.resolve("src");
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  const configs = [];

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name === "shared") continue;
    const metaPath = path.join(srcDir, entry.name, "meta.js");
    if (fs.existsSync(metaPath)) {
      const metaModule = await import(`file://${metaPath}`);
      const getMeta = metaModule.default || metaModule;
      configs.push(getMeta(manifest));
    }
  }

  return configs;
}

async function run() {
  const distDir = path.resolve("dist");
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  const scripts = await getScriptConfigs();
  console.log(`🚀 ${isWatch ? "Watching" : "Building"} ${scripts.length} userscripts with Vite...\n`);

  for (const s of scripts) {
    const watcher = await build({
      configFile: false,
      plugins: [
        monkey({
          entry: path.resolve(s.entry),
          userscript: s.meta,
          build: {
            fileName: s.outFile
          }
        }),
        // Custom plugin to hook into Vite bundle completion for iCloud sync in watch mode
        {
          name: "userscript-icloud-sync",
          writeBundle() {
            syncToIcloud(distDir, s.outFile);
          }
        }
      ],
      build: {
        outDir: distDir,
        emptyOutDir: false,
        minify: false,
        watch: isWatch ? {} : null
      }
    });

    if (!isWatch) {
      console.log(`✅ dist/${s.outFile} built`);
    }
  }

  if (isWatch) {
    console.log("\n👀 Watch mode active. Changes in src/ will automatically rebuild and sync to iCloud.\n");
  } else {
    console.log("\n✨ Build completed successfully!");
  }
}

run().catch((err) => {
  console.error("Build failed:", err);
  process.exit(1);
});
