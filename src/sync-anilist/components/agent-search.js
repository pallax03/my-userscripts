import { Storage } from "../../shared/storage.js";
import { showToast } from "../../shared/toast.js";
import { Logger } from "../../shared/logger.js";
import { cleanTitle } from "../resolver.js";
import { resolveAnimeUnityAnime, generateSearchCandidates } from "../../shared/animeunity/utils.js";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Opens AnimeUnity's native search modal with pre-filled working query and candidate highlight
 * @param {Object} media - AniList media object with title
 * @param {Object} [options]
 * @param {number} [options.epTarget] - Target episode number to pass to single page
 * @param {number} [options.autoSelectDelay] - Countdown seconds before auto-selecting match (0 = manual)
 * @returns {Promise<boolean>}
 */
export async function simulateAgenticSearch(media, { epTarget, autoSelectDelay = 5 } = {}) {
  if (!media) return false;

  Logger.info(`Searching best query for media ID ${media.id}...`);

  // 1. Resolve exact match using candidate titles against AnimeUnity's internal database
  let resolved = await resolveAnimeUnityAnime(media);
  let query = resolved?.matchingQuery;

  if (!query) {
    const candidates = generateSearchCandidates(media);
    query = candidates[1] || candidates[0] || cleanTitle(media.title?.english || media.title?.romaji) || "";
  }

  Logger.info(`Using search query: "${query}" (Resolved: ${resolved ? resolved.id : "NO"})`);

  // 2. Open AnimeUnity search box
  // AnimeUnity has TWO <nav-search> components:
  // - .nav-top-mobile nav-search (hidden on desktop via Bootstrap .d-md-none)
  // - #left-nav nav-search (visible on desktop)
  const isDesktop = window.innerWidth >= 768;
  const desktopSearch = document.querySelector("#left-nav nav-search, #left-nav .search-box");
  const mobileSearch = document.querySelector(".nav-top-mobile nav-search, .nav-top-mobile .search-box");

  let targetNavSearch = null;
  if (isDesktop && desktopSearch) {
    targetNavSearch = desktopSearch;
  } else if (!isDesktop && mobileSearch) {
    targetNavSearch = mobileSearch;
  } else {
    const allNav = Array.from(document.querySelectorAll("nav-search, .search-box"));
    targetNavSearch = allNav.find((el) => {
      const parent = el.closest(".d-md-none, #left-nav, .nav-top-mobile") || el;
      return window.getComputedStyle(parent).display !== "none";
    }) || desktopSearch || mobileSearch || allNav[0];
  }

  const searchBtn = targetNavSearch?.querySelector("button, button.input-group-text") ||
                    targetNavSearch?.closest(".search-box")?.querySelector("button") ||
                    document.querySelector("#left-nav .search-box button, nav-search button");

  const vueInstance = targetNavSearch?.__vue__ ||
                      targetNavSearch?.closest(".search-box")?.parentElement?.__vue__ ||
                      searchBtn?.closest(".search-box")?.parentElement?.__vue__;

  if (vueInstance) {
    if (vueInstance.active) {
      vueInstance.active = false;
      await sleep(40);
    }
    if (typeof vueInstance.searchClick === "function") {
      vueInstance.searchClick();
    } else {
      vueInstance.active = true;
    }
  } else if (searchBtn) {
    searchBtn.click();
  } else {
    Logger.warn("Search button/component not found in DOM");
    showToast(`⚠️ Could not open search bar`, true);
    return false;
  }

  // 3. Wait for search container and input to mount
  let input = null;
  for (let i = 0; i < 25; i++) {
    input = targetNavSearch?.querySelector(".search-container .search-bar, .search-backdrop input") ||
            document.querySelector("#left-nav .search-bar, .search-container .search-bar, .search-backdrop input");
    if (input) break;
    await sleep(40);
  }

  if (!input) {
    Logger.warn("Search input did not mount within timeout");
    showToast(`⚠️ Could not open search input`, true);
    return false;
  }

  // Ensure backdrop has .show
  const backdrop = targetNavSearch?.querySelector(".search-backdrop") ||
                   input.closest(".search-backdrop") ||
                   document.querySelector(".search-backdrop");
  if (backdrop) {
    backdrop.classList.add("show");
  }

  // 4. Fill in query and trigger search immediately
  input.focus();
  input.value = query;
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true }));

  const currentVue = input.closest(".search-backdrop")?.__vue__ || targetNavSearch?.__vue__ || vueInstance;
  if (currentVue && typeof currentVue.fetchAnime === "function") {
    currentVue.query = query;
    currentVue.fetchAnime({ target: { value: query } });
  }

  Logger.info(`Search modal opened and query "${query}" dispatched`);

  // 5. Wait for results to render
  let items = [];
  for (let i = 0; i < 35; i++) {
    items = Array.from((backdrop || targetNavSearch || document).querySelectorAll(".results .result, .results .livesearch-item"));
    if (items.length > 0) break;
    await sleep(70);
  }

  if (!items.length) {
    Logger.info(`No search results returned for "${query}"`);
    showToast(`⚠️ No immediate results for "${query}"`, true);
    return true; // Modal is open with query ready for user to edit or browse
  }

  Logger.info(`Search results rendered: ${items.length} items`);

  // 6. Match candidate record
  const pref = Storage.get("al_pref_language") || "sub";
  const prefDubInt = pref === "dub" ? 1 : 0;

  let targetIndex = -1;
  const searchVue = document.querySelector(".search-backdrop")?.__vue__ || currentVue;

  if (searchVue?.animes && Array.isArray(searchVue.animes)) {
    const records = searchVue.animes;
    const matches = [];
    records.forEach((r, idx) => {
      if (r?.anilist_id === media.id) matches.push({ record: r, idx });
    });
    if (matches.length > 0) {
      const selected = matches.find((m) => m.record.dub === prefDubInt) || matches[0];
      targetIndex = selected.idx;
      Logger.info(`Candidate matched by AniList ID ${media.id}:`, selected.record);
    }
  }

  // Fallback: match by title text in results or default to top result
  if (targetIndex < 0 || targetIndex >= items.length) {
    const cleanQ = query.toLowerCase().replace(/[^a-z0-9]/g, "");
    const matchIdx = items.findIndex((el) => {
      const text = el.innerText.toLowerCase().replace(/[^a-z0-9]/g, "");
      return text.includes(cleanQ) || cleanQ.includes(text);
    });
    targetIndex = matchIdx >= 0 ? matchIdx : 0;
  }

  const targetEl = items[targetIndex] || items[0];
  if (!targetEl) return true;

  const targetLink = targetEl.tagName === "A" ? targetEl : targetEl.querySelector("a.livesearch-item, a") || targetEl;

  // 7. Highlight candidate visually
  targetEl.classList.add("al-agent-candidate");
  try { targetEl.scrollIntoView({ block: "nearest", behavior: "smooth" }); } catch (_) {}

  if (autoSelectDelay <= 0) return true;

  // 8. Auto-selection countdown badge
  let countdown = autoSelectDelay;
  const badge = document.createElement("div");
  badge.className = "al-agent-countdown-badge";
  badge.innerHTML = `<span>Auto-opening in <strong>${countdown}s</strong></span><span class="al-agent-cancel-hint">(Click any to choose)</span>`;
  targetEl.appendChild(badge);

  let timer = null;
  const cancel = () => {
    if (timer) clearInterval(timer);
    badge.remove();
    targetEl.classList.remove("al-agent-candidate");
    document.removeEventListener("click", onDocumentClick, true);
  };

  const onDocumentClick = (e) => {
    // If user clicked another result or backdrop, cancel the auto-redirect
    if (!targetEl.contains(e.target)) {
      Logger.info("User clicked outside candidate: countdown cancelled");
      cancel();
    }
  };
  document.addEventListener("click", onDocumentClick, true);

  timer = setInterval(() => {
    countdown--;
    if (countdown > 0) {
      badge.innerHTML = `<span>Auto-opening in <strong>${countdown}s</strong></span><span class="al-agent-cancel-hint">(Click any to choose)</span>`;
    } else {
      cancel();
      Logger.info("Countdown finished: auto-clicking matched anime");
      if (epTarget) sessionStorage.setItem("al_target_ep", String(epTarget));
      targetLink.click();
    }
  }, 1000);

  return true;
}
