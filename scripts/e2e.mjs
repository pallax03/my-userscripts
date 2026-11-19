// Local E2E: loads the built userscript in isolated Chrome with GM_* shims and the .env test token.
// Usage: node scripts/e2e.mjs <url> [out.png] [--mobile]
import { chromium, devices } from "playwright-core";
import fs from "fs";

try { process.loadEnvFile(); } catch (_) {}
const [url, out = "/tmp/e2e.png"] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const mobile = process.argv.includes("--mobile");
const code = fs.readFileSync("dist/sync-anilist.user.js", "utf8");

const shim = `
  const __store = ${JSON.stringify({ anilist_token: process.env.DEBUGGING_ANILIST_TOKEN || "" })};
  window.GM_getValue = (k) => __store[k];
  window.GM_setValue = (k, v) => { __store[k] = v; };
  window.GM_deleteValue = (k) => { delete __store[k]; };
  window.GM_xmlhttpRequest = ({ method = "GET", url, headers, data, onload, onerror }) =>
    fetch(url, { method, headers, body: data }).then(async (r) => onload({ status: r.status, responseText: await r.text() })).catch(onerror);
  window.unsafeWindow = window;
`;

const browser = await chromium.launch({
  executablePath: process.env.PW_CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
});
const ctx = await browser.newContext(mobile ? devices["iPhone 14"] : { viewport: { width: 1280, height: 900 } });
await ctx.addInitScript(`${shim}; document.addEventListener("DOMContentLoaded", () => setTimeout(() => { ${code}\n}, 300));`);
const page = await ctx.newPage();
page.on("console", (m) => ["error", "warning"].includes(m.type()) && console.log(`[${m.type()}]`, m.text().slice(0, 200)));
page.on("pageerror", (e) => console.log("[pageerror]", e.message.slice(0, 300)));
await page.addInitScript(() => { window.__msgs = []; window.addEventListener("message", (e) => e.data?.type && window.__msgs.push(e.data.type)); });
await page.goto(url, { waitUntil: "networkidle", timeout: 45000 }).catch((e) => console.log("goto:", e.message));
await page.waitForTimeout(5000);
console.log(await page.evaluate(() => ({
  slots: [...document.querySelectorAll(".al-slot")].map((s) => `${s.id}:${s.children.length}`),
  shelf: !!document.getElementById("al-home-continue-watching"),
  bar: !!document.getElementById("al-control-bar")
})));
if (process.env.CLICK) { await page.click(process.env.CLICK); await page.waitForTimeout(6000); console.log("after click:", page.url()); }
console.log("msgs:", [...new Set(await page.evaluate(() => window.__msgs))]);
await page.screenshot({ path: out });
await browser.close();
