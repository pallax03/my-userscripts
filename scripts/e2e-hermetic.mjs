// Hermetic offline E2E suite: mocks AnimeUnity Inertia pages, Vixcloud iframe, AniList GraphQL, and AniSkip.
// Usage: node scripts/e2e-hermetic.mjs
import { chromium, devices } from "playwright-core";
import assert from "node:assert/strict";
import fs from "node:fs";

const code = fs.readFileSync("dist/sync-anilist.user.js", "utf8");

const CHROME_CANDIDATES = [
  process.env.PW_CHROME_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser"
].filter(Boolean);

const executablePath = CHROME_CANDIDATES.find((p) => fs.existsSync(p));
if (!executablePath) {
  console.error("No Chrome/Chromium executable found. Set PW_CHROME_PATH.");
  process.exit(1);
}

const shim = `
  const __store = {
    anilist_token: "hermetic-test-token",
    al_pref_language: "sub"
  };
  window.GM_getValue = (k) => __store[k];
  window.GM_setValue = (k, v) => { __store[k] = v; };
  window.GM_deleteValue = (k) => { delete __store[k]; };
  window.GM_xmlhttpRequest = ({ method = "GET", url, headers, data, onload, onerror }) =>
    fetch(url, { method, headers, body: data })
      .then(async (r) => onload({ status: r.status, responseText: await r.text() }))
      .catch(onerror);
  window.unsafeWindow = window;
`;

function inertiaHtml(pageObj, extraBody = "") {
  const encoded = JSON.stringify(pageObj).replace(/&/g, "&amp;").replace(/'/g, "&#39;");
  return `<!doctype html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>AnimeUnity Mock</title></head>
<body>
  <div id="app" data-page='${encoded}'>
    <main><div class="container"><h1>Mock AnimeUnity</h1>${extraBody}</div></main>
  </div>
  <script>
    history.replaceState({ page: ${JSON.stringify(pageObj)} }, "", location.href);
  </script>
</body>
</html>`;
}

const ANIME_DATA = {
  id: 12,
  slug: "one-piece",
  mal_id: 21,
  anilist_id: 21,
  title: "One Piece",
  episodes_count: 1122
};

const EPISODES_DATA = {
  total: 1122,
  episodes: [
    { number: "3", videos: [{ id: 50571, language: "jpn", is_hidden: false }] },
    { number: "5", videos: [{ id: 50573, language: "jpn", is_hidden: false }] },
    { number: "6", videos: [{ id: 50574, language: "jpn", is_hidden: false }] },
    { number: "7", videos: [{ id: 50575, language: "jpn", is_hidden: false }] }
  ]
};

async function setupRoutes(ctx, state) {
  await ctx.route("**/*", async (route) => {
    const url = route.request().url();

    if (url.startsWith("https://graphql.anilist.co")) {
      const body = JSON.parse(route.request().postData() || "{}");
      const q = body.query || "";
      const vars = body.variables || {};

      if (q.includes("Viewer")) {
        return route.fulfill({
          contentType: "application/json",
          body: JSON.stringify({ data: { Viewer: { id: 1, name: "TestUser", avatar: { medium: "" } } } })
        });
      }

      if (q.includes("SaveMediaListEntry")) {
        state.mutations.push(vars);
        if (typeof vars.progress === "number") state.progress = vars.progress;
        if (vars.status) state.status = vars.status;
        if (typeof vars.notes === "string") state.notes = vars.notes;
        return route.fulfill({
          contentType: "application/json",
          body: JSON.stringify({
            data: {
              SaveMediaListEntry: {
                id: 100,
                status: state.status,
                score: 9,
                progress: state.progress,
                notes: state.notes,
                repeat: 0
              }
            }
          })
        });
      }

      if (q.includes("MediaListCollection")) {
        // Check if buddy lookup or viewer collection
        if (vars.u === 2 || vars.userName === "brother") {
          return route.fulfill({
            contentType: "application/json",
            body: JSON.stringify({
              data: {
                MediaListCollection: {
                  lists: [{
                    entries: [{
                      id: 200,
                      mediaId: 21,
                      status: "CURRENT",
                      progress: state.buddyProgress,
                      media: { id: 21, idMal: 21, episodes: 1122, title: { romaji: "One Piece", english: "One Piece" } }
                    }]
                  }]
                }
              }
            })
          });
        }
        return route.fulfill({
          contentType: "application/json",
          body: JSON.stringify({
            data: {
              MediaListCollection: {
                lists: [{
                  entries: [{
                    id: 100,
                    mediaId: 21,
                    status: state.status,
                    score: 9,
                    progress: state.progress,
                    notes: state.notes,
                    repeat: 0,
                    updatedAt: Math.floor(Date.now() / 1000),
                    media: {
                      id: 21,
                      idMal: 21,
                      episodes: 1122,
                      status: "RELEASING",
                      siteUrl: "https://anilist.co/anime/21",
                      coverImage: { large: "", medium: "" },
                      title: { romaji: "One Piece", english: "One Piece" },
                      nextAiringEpisode: null
                    }
                  }]
                }]
              }
            }
          })
        });
      }

      if (q.includes("User(")) {
        return route.fulfill({
          contentType: "application/json",
          body: JSON.stringify({ data: { User: { id: 2, name: "brother", avatar: { medium: "" } } } })
        });
      }

      if (q.includes("Media(")) {
        return route.fulfill({
          contentType: "application/json",
          body: JSON.stringify({
            data: {
              Media: {
                id: 21,
                idMal: 21,
                episodes: 1122,
                format: "TV",
                status: "RELEASING",
                title: { romaji: "One Piece", english: "One Piece", userPreferred: "One Piece" },
                mediaListEntry: state.untracked ? null : {
                  id: 100,
                  status: state.status,
                  score: 9,
                  progress: state.progress,
                  notes: state.notes,
                  repeat: 0
                }
              }
            }
          })
        });
      }

      return route.fulfill({ contentType: "application/json", body: JSON.stringify({ data: {} }) });
    }

    if (url.startsWith("https://api.aniskip.com")) {
      if (url.includes("/21/6?")) {
        return route.fulfill({
          contentType: "application/json",
          body: JSON.stringify({
            found: true,
            results: [{
              skipId: "skip-op-6",
              skipType: "op",
              interval: { startTime: 90, endTime: 180 },
              episodeLength: 1440
            }]
          })
        });
      }
      return route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ found: false, results: [] }) });
    }

    if (url.startsWith("https://animeunity.cx/api/search")) {
      return route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          data: [{ id: 12, slug: "one-piece", title: "One Piece", total_episodes: 1122, images: { poster: "/bx21-test.jpg" } }]
        })
      });
    }

    if (url.startsWith("https://animeunity.cx/api/anime/12/episodes")) {
      return route.fulfill({ contentType: "application/json", body: JSON.stringify(EPISODES_DATA) });
    }

    if (url.startsWith("https://animeunity.cx/anime/12-one-piece/50570")) {
      return route.fulfill({
        contentType: "text/html",
        body: inertiaHtml({
          props: { anime: ANIME_DATA, episode: { number: "1" }, loadedEpisodes: EPISODES_DATA }
        })
      });
    }

    if (url.startsWith("https://animeunity.cx/anime/12-one-piece/50574")) {
      return route.fulfill({
        contentType: "text/html",
        body: inertiaHtml({
          props: { anime: ANIME_DATA, episode: { number: "6" }, loadedEpisodes: EPISODES_DATA }
        })
      });
    }

    if (url.startsWith("https://animeunity.cx/anime/12-one-piece/50571")) {
      return route.fulfill({
        contentType: "text/html",
        body: inertiaHtml({
          props: { anime: ANIME_DATA, episode: { number: "3" }, loadedEpisodes: EPISODES_DATA }
        })
      });
    }

    if (url.startsWith("https://animeunity.cx/anime/12-one-piece")) {
      return route.fulfill({
        contentType: "text/html",
        body: inertiaHtml({
          props: { anime: ANIME_DATA, episode: { number: "1" }, loadedEpisodes: EPISODES_DATA }
        })
      });
    }

    if (url.startsWith("https://animeunity.cx")) {
      return route.fulfill({ contentType: "text/html", body: inertiaHtml({ props: {} }) });
    }

    // Block external images/assets offline
    return route.fulfill({ status: 204, body: "" });
  });
}

const browser = await chromium.launch({ executablePath });

try {
  const state = { progress: 5, status: "CURRENT", notes: "[sync:brother]", buddyProgress: 7, mutations: [] };

  // 1. Desktop flow: Home -> Detail -> Watch (85% sync + old-episode guard)
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await setupRoutes(ctx, state);
  await ctx.addInitScript(`${shim}; document.addEventListener("DOMContentLoaded", () => setTimeout(() => { ${code}\n}, 50));`);
  const page = await ctx.newPage();

  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));

  // Home
  await page.goto("https://animeunity.cx/", { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#al-home-continue-watching", { timeout: 10000 });
  await page.waitForSelector("#al-home-user-pill", { timeout: 10000 });
  const homeDock = await page.locator("#al-dock").boundingBox();
  assert.ok(homeDock && homeDock.x >= 0 && homeDock.x + homeDock.width <= 1280, "Home dock within desktop viewport");

  // Detail
  await page.goto("https://animeunity.cx/anime/12-one-piece", { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#al-control-bar #al-bar-status", { timeout: 10000 });
  await page.waitForSelector("#al-slot-switch #al-cross-switch-btn", { timeout: 10000 });
  const detailText = await page.locator("#al-control-bar").innerText();
  assert.ok(detailText.includes("Progress: Ep. 5 / 1122"), "Detail dock displays tracked/max progress");
  assert.ok(detailText.includes("One Piece"), "Detail dock displays blue AniList title link");
  const titleHref = await page.locator("#al-control-bar .al-dock-title").getAttribute("href");
  assert.equal(titleHref, "https://anilist.co/anime/21", "Title links directly to AniList");
  assert.equal(await page.locator("#al-dock-anime-btn").count(), 0, "No second ⋯ dropdown next to PFP");

  // User PFP menu must stay strictly user-only (no anime title/actions)
  await page.click("#al-dock-avatar-btn");
  await page.waitForSelector("#al-dock-menu.show", { timeout: 5000 });
  const userMenuText = await page.locator("#al-dock-menu").innerText();
  assert.ok(userMenuText.includes("Profile"), "User PFP menu has Profile");
  assert.ok(!userMenuText.includes("One Piece"), "User PFP menu never mixes anime info");

  // Watch Ep 6 (next unwatched when progress=5) -> verify in-dock resume loading chip + AL_RESUME_SEEK + 86% sync
  await page.evaluate(() => {
    window.localStorage.setItem("al_resume_21", JSON.stringify({ ep: 6, time: 420, duration: 1500, percent: 28, updatedAt: Date.now() }));
  });
  await page.goto("https://animeunity.cx/anime/12-one-piece/50574", { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#al-control-bar #al-ep-save", { timeout: 10000 });
  await page.waitForSelector("#al-control-bar #al-dock-resume-loading", { timeout: 10000 });
  const watchText = await page.locator("#al-control-bar").innerText();
  assert.ok(watchText.includes("Ep. 6 / 1122"), "Watch dock displays current/max episode");
  assert.ok(watchText.includes("7:00"), "Watch dock displays in-dock resume loading chip");
  await page.waitForSelector("#al-skip-toggle-btn", { timeout: 10000 });
  await page.waitForSelector(".al-skip-pill-votes .is-upvote", { timeout: 5000 });
  await page.waitForTimeout(200);

  // Verify AL_RESUME_SEEK dispatch when iframe posts AL_PLAYER_READY
  const resumeSeekTarget = await page.evaluate(async () => {
    const iframe = document.createElement("iframe");
    iframe.srcdoc = "<script>window.receivedSeek = null; window.addEventListener('message', e => { if (e.data?.type === 'AL_RESUME_SEEK') window.receivedSeek = e.data.target; }); window.top.postMessage({ type: 'AL_PLAYER_READY', duration: 1500 }, '*');</" + "script>";
    document.body.appendChild(iframe);
    await new Promise((r) => setTimeout(r, 850));
    return iframe.contentWindow?.receivedSeek ?? null;
  });
  assert.equal(resumeSeekTarget, 420, "Opening Ep 6 with saved resume dispatches AL_RESUME_SEEK to 420s");

  // Inside intro window [90, 180] with Auto-Skip OFF -> in-dock Skip button appears
  await page.evaluate(() => {
    window.postMessage({ type: "AL_PLAYBACK_STATE", currentTime: 95, duration: 1500, isPaused: false }, "*");
  });
  await page.waitForSelector("#al-skip-now-btn", { timeout: 5000 });

  const beforeMutations = state.mutations.length;
  await page.evaluate(() => {
    window.postMessage({ type: "PLAYER_EVENT", data: { event: "playerstate", position: 1290, duration: 1500, paused: false } }, "*");
  });
  await page.waitForTimeout(500);
  const progressMut = state.mutations.slice(beforeMutations).find((m) => m.progress === 6);
  assert.ok(progressMut, "85% playback on Ep 6 incremented AniList progress to 6");

  // Watch Ep 3 (older episode when progress=6) -> simulate 90% playback -> MUST NOT overwrite progress
  await page.goto("https://animeunity.cx/anime/12-one-piece/50571", { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#al-control-bar #al-ep-save", { timeout: 10000 });
  await page.waitForTimeout(200);

  const beforeOld = state.mutations.length;
  await page.evaluate(() => {
    window.postMessage({ type: "PLAYER_EVENT", data: { event: "playerstate", position: 1350, duration: 1500, paused: false } }, "*");
  });
  await page.waitForTimeout(500);
  const wrongMut = state.mutations.slice(beforeOld).find((m) => typeof m.progress === "number");
  assert.equal(wrongMut, undefined, "Old episode (Ep 3 < 6) must NEVER overwrite AniList progress");

  // Untracked anime Ep. 1: 30% saves local resume WITHOUT adding to AniList; 86% auto-adds as CURRENT Ep. 1
  state.progress = -1;
  state.untracked = true;
  await page.goto("https://animeunity.cx/anime/12-one-piece/50570", { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#al-control-bar #al-ep-save", { timeout: 10000 });
  await page.waitForTimeout(200);

  const beforeUntracked = state.mutations.length;
  await page.evaluate(() => {
    window.postMessage({ type: "PLAYER_EVENT", data: { event: "playerstate", position: 450, duration: 1500, paused: true } }, "*");
  });
  await page.waitForTimeout(300);
  assert.equal(state.mutations.length, beforeUntracked, "Pausing at 30% on Ep. 1 must NOT add untracked anime to AniList");
  const localSaved = await page.evaluate(() => JSON.parse(window.localStorage.getItem("al_resume_21") || "null"));
  assert.equal(localSaved?.ep, 1, "Local-only resume saved for untracked Ep. 1");
  assert.equal(localSaved?.time, 450, "Local-only resume timestamp matches 450s");

  await page.evaluate(() => {
    window.postMessage({ type: "PLAYER_EVENT", data: { event: "playerstate", position: 1290, duration: 1500, paused: false } }, "*");
  });
  await page.waitForTimeout(500);
  const autoAddMut = state.mutations.slice(beforeUntracked).find((m) => m.progress === 1 && m.status === "CURRENT");
  assert.ok(autoAddMut, "Finishing Ep. 1 (>= 85%) auto-adds untracked anime to AniList as CURRENT Ep. 1");

  // COMPLETED anime Ep. 1: 30% saves local resume WITHOUT touching AniList; 86% auto-switches to REPEATING Ep. 1
  state.untracked = false;
  state.status = "COMPLETED";
  state.progress = 12;
  await page.evaluate(() => window.localStorage.removeItem("al_resume_21"));
  await page.goto("https://animeunity.cx/anime/12-one-piece/50570", { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#al-control-bar #al-ep-save", { timeout: 10000 });
  await page.waitForTimeout(200);

  const beforeCompletedRewatch = state.mutations.length;
  await page.evaluate(() => {
    window.postMessage({ type: "PLAYER_EVENT", data: { event: "playerstate", position: 450, duration: 1500, paused: true } }, "*");
  });
  await page.waitForTimeout(300);
  assert.equal(state.mutations.length, beforeCompletedRewatch, "Pausing at 30% on COMPLETED Ep. 1 keeps AniList COMPLETED untouched");
  const rewatchLocal = await page.evaluate(() => JSON.parse(window.localStorage.getItem("al_resume_21") || "null"));
  assert.equal(rewatchLocal?.ep, 1, "Local-only resume saved for COMPLETED Ep. 1");

  await page.evaluate(() => {
    window.postMessage({ type: "PLAYER_EVENT", data: { event: "playerstate", position: 1290, duration: 1500, paused: false } }, "*");
  });
  await page.waitForTimeout(500);
  const rewatchMut = state.mutations.slice(beforeCompletedRewatch).find((m) => m.progress === 1 && m.status === "REPEATING");
  assert.ok(rewatchMut, "Finishing Ep. 1 (>= 85%) of a COMPLETED anime auto-switches AniList to REPEATING Ep. 1");

  assert.deepEqual(errors, [], "Zero uncaught pageerrors on desktop");
  await ctx.close();

  // 2. Mobile viewport bounds & dropdown test (iPhone SE, 375x667)
  const mobileCtx = await browser.newContext(devices["iPhone SE"]);
  await setupRoutes(mobileCtx, state);
  await mobileCtx.addInitScript(`${shim}; document.addEventListener("DOMContentLoaded", () => setTimeout(() => { ${code}\n}, 50));`);
  const mPage = await mobileCtx.newPage();
  await mPage.goto("https://animeunity.cx/anime/12-one-piece/50574", { waitUntil: "domcontentloaded" });
  await mPage.waitForSelector("#al-dock-avatar-btn", { timeout: 10000 });
  await mPage.waitForSelector("#al-slot-switch #al-cross-switch-btn", { timeout: 10000 });

  const mDock = await mPage.locator("#al-dock").boundingBox();
  const mSwitch = await mPage.locator("#al-slot-switch").boundingBox();
  const mSkip = await mPage.locator("#al-slot-skip").boundingBox();
  const mBar = await mPage.locator("#al-control-bar").boundingBox();
  assert.ok(mDock && mDock.x >= 0 && mDock.x + mDock.width <= 375, `iPhone SE dock within 375px (${JSON.stringify(mDock)})`);
  assert.ok(mSwitch && mBar && mSwitch.x <= 20 && mSwitch.y < mBar.y, "AnimeSaturn button is above dock on bottom-left");
  assert.ok(mSkip && mBar && mSkip.y + mSkip.height <= mBar.y, "AniSkip separate dock is positioned above main dock");
  assert.ok(mBar && mBar.height <= 120, `iPhone SE dock stays compact (height: ${mBar?.height})`);

  await mPage.click("#al-dock-avatar-btn");
  await mPage.waitForSelector("#al-dock-menu.show", { timeout: 5000 });
  const mMenu = await mPage.locator("#al-dock-menu").boundingBox();
  assert.ok(mMenu && mMenu.x >= 0 && mMenu.x + mMenu.width <= 375 && mMenu.height > 100, `iPhone SE PFP menu fully visible within 375px (${JSON.stringify(mMenu)})`);

  await mobileCtx.close();
  console.log("✅ Hermetic E2E suite passed (Home, Detail, Resume Chip, 85% Sync, Old-Ep Guard, iPhone SE 375px Bounds)");
} finally {
  await browser.close();
}
