import { Storage } from "../../shared/storage.js";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Simulates an agentic search typing and auto-selection in AnimeUnity's native search modal
 * @param {Object} media - AniList media object with title
 * @param {Object} [options]
 * @param {number} [options.epTarget] - Target episode number to pass to single page
 * @param {number} [options.autoSelectDelay] - Countdown seconds before auto-selecting match (0 = manual)
 * @returns {Promise<boolean>}
 */
export async function simulateAgenticSearch(media, { epTarget, autoSelectDelay = 3 } = {}) {
  const query = media?.title?.english || media?.title?.romaji || "";
  if (!query) return false;

  // 1. Open AnimeUnity search box
  const searchBtn = document.querySelector("#left-nav button.input-group-text, .search-box button, nav-search button");
  if (!searchBtn) return false;
  searchBtn.click();

  // 2. Wait for search container and input to mount
  let input = null;
  for (let i = 0; i < 25; i++) {
    input = document.querySelector(".search-container .search-bar, .search-backdrop input");
    if (input) break;
    await sleep(40);
  }
  if (!input) return false;

  input.focus();
  input.value = "";

  // 3. Human-like typescripting simulation
  for (let i = 0; i < query.length; i++) {
    input.value += query[i];
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await sleep(35);
  }
  input.dispatchEvent(new Event("change", { bubbles: true }));

  // 4. Wait for results to render
  let items = [];
  for (let i = 0; i < 30; i++) {
    items = Array.from(document.querySelectorAll(".results .result, .results .livesearch-item"));
    if (items.length > 0) break;
    await sleep(80);
  }
  if (!items.length) return true; // Modal is open with query ready for user

  // 5. Match candidate record
  const pref = Storage.get("al_pref_language") || "sub";
  const prefDubInt = pref === "dub" ? 1 : 0;

  let targetIndex = -1;
  const navSearchEl = document.querySelector("nav-search");
  const vueInstance = navSearchEl?.__vue__ || document.querySelector(".search-container")?.__vue__;

  if (vueInstance?.animes && Array.isArray(vueInstance.animes)) {
    const records = vueInstance.animes;
    const matches = [];
    records.forEach((r, idx) => {
      if (r?.anilist_id === media.id) matches.push({ record: r, idx });
    });
    if (matches.length > 0) {
      const selected = matches.find((m) => m.record.dub === prefDubInt) || matches[0];
      targetIndex = selected.idx;
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

  // 6. Highlight candidate visually
  targetEl.classList.add("al-agent-candidate");
  try { targetEl.scrollIntoView({ block: "nearest", behavior: "smooth" }); } catch (_) {}

  if (autoSelectDelay <= 0) return true;

  // 7. Auto-selection countdown badge
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
      if (epTarget) sessionStorage.setItem("al_target_ep", String(epTarget));
      targetLink.click();
    }
  }, 1000);

  return true;
}
