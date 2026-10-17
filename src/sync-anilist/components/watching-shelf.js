import { Storage } from "../../shared/storage.js";
import { showToast } from "../../shared/toast.js";
import { Logger } from "../../shared/logger.js";
import { iconHtml, Play, Clock, Check, ChevronLeft, ChevronRight, Zap, ExternalLink, Sliders, Loader2 } from "../../shared/icons.js";
import { openTokenModal } from "../../shared/anilist/auth.js";
import { getAnimeUnityUrl, scanAnimeUnityPageMap } from "../../shared/animeunity/utils.js";
import { openPreferencesModal } from "./preferences-modal.js";
import { simulateAgenticSearch } from "./agent-search.js";
import { Settings } from "../settings.js";

/**
 * Formats seconds into human-readable countdown
 * @param {number} seconds
 * @returns {string}
 */
function formatCountdown(seconds) {
  if (!seconds || seconds <= 0) return "";
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

/**
 * Calculates episode progress and airing state for an AniList entry
 * @param {Object} entry
 */
export function calculateEntryState(entry) {
  const progress = entry.progress || 0;
  const media = entry.media || {};
  const nextAir = media.nextAiringEpisode;
  const totalEp = media.episodes;
  const status = media.status;
  const isRepeating = entry.status === "REPEATING";

  let latestAired = 0;
  if (nextAir?.episode) {
    latestAired = nextAir.episode - 1;
  } else if (status === "FINISHED") {
    latestAired = totalEp || progress;
  } else if (totalEp && totalEp > 0) {
    latestAired = totalEp;
  } else {
    latestAired = progress;
  }

  const hasUnwatchedAired = isRepeating ? (latestAired === 0 || latestAired > progress) : (latestAired > progress);
  const unwatchedCount = Math.max(0, latestAired - progress);
  const isCaughtUp = !hasUnwatchedAired;
  const nextToWatch = progress + 1;

  return {
    progress,
    totalEp,
    latestAired,
    nextAir,
    hasUnwatchedAired,
    unwatchedCount,
    isCaughtUp,
    nextToWatch,
    isRepeating
  };
}

/**
 * Creates a single Continue Watching anime card
 * @param {Object} entry
 * @returns {HTMLElement}
 */
function createCard(entry) {
  const media = entry.media || {};
  const state = calculateEntryState(entry);
  const epTarget = state.hasUnwatchedAired ? state.nextToWatch : (state.progress || 1);
  const auUrl = getAnimeUnityUrl(media, { targetEp: epTarget });
  const title = media.title?.romaji || media.title?.english || "Untitled";
  const coverUrl = media.coverImage?.large || media.coverImage?.medium || "";
  const alUrl = media.siteUrl || `https://anilist.co/anime/${media.id}`;

  const card = document.createElement("div");
  card.className = "al-shelf-card";
  card.dataset.mediaId = media.id;

  // Cover Wrap
  const coverWrap = document.createElement("div");
  coverWrap.className = "al-card-cover";

  const coverImg = document.createElement("img");
  coverImg.src = coverUrl;
  coverImg.alt = title;
  coverImg.loading = "lazy";
  coverWrap.appendChild(coverImg);

  // Top-left status badge
  const badgeWrap = document.createElement("div");
  badgeWrap.className = "al-card-badge-top-left";

  if (state.isRepeating) {
    const badge = document.createElement("span");
    badge.className = "al-badge al-badge-REPEATING";
    const dot = document.createElement("span");
    dot.className = "al-dot";
    badge.appendChild(dot);
    const txt = document.createElement("span");
    txt.textContent = state.hasUnwatchedAired ? `Rewatching • Ep. ${state.nextToWatch}` : "Rewatching • Caught up";
    badge.appendChild(txt);
    badgeWrap.appendChild(badge);
  } else if (state.hasUnwatchedAired) {
    const badge = document.createElement("span");
    badge.className = "al-badge al-badge-CURRENT";
    const dot = document.createElement("span");
    dot.className = "al-dot";
    badge.appendChild(dot);
    const txt = document.createElement("span");
    txt.textContent = state.unwatchedCount > 1 ? `+${state.unwatchedCount} eps` : `Ep. ${state.nextToWatch}`;
    badge.appendChild(txt);
    badgeWrap.appendChild(badge);
  } else if (state.nextAir) {
    const badge = document.createElement("span");
    badge.className = "al-badge al-badge-PAUSED";
    const dot = document.createElement("span");
    dot.className = "al-dot";
    badge.appendChild(dot);
    const txt = document.createElement("span");
    txt.textContent = `Ep. ${state.nextAir.episode} in ${formatCountdown(state.nextAir.timeUntilAiring)}`;
    badge.appendChild(txt);
    badgeWrap.appendChild(badge);
  } else {
    const badge = document.createElement("span");
    badge.className = "al-badge al-badge-COMPLETED";
    const dot = document.createElement("span");
    dot.className = "al-dot";
    badge.appendChild(dot);
    const txt = document.createElement("span");
    txt.textContent = "Caught up";
    badge.appendChild(txt);
    badgeWrap.appendChild(badge);
  }
  coverWrap.appendChild(badgeWrap);

  // Top-right AniList link
  const alLinkWrap = document.createElement("div");
  alLinkWrap.className = "al-card-badge-top-right";
  const alLink = document.createElement("a");
  alLink.href = alUrl;
  alLink.target = "_blank";
  alLink.rel = "noopener noreferrer";
  alLink.className = "al-card-al-link";
  alLink.title = "View on AniList";
  alLink.innerHTML = iconHtml(ExternalLink, { width: 12, height: 12 });
  alLinkWrap.appendChild(alLink);
  coverWrap.appendChild(alLinkWrap);

  // Cover bottom overlay (Progress text and bar)
  const overlay = document.createElement("div");
  overlay.className = "al-card-cover-overlay";

  const progressText = document.createElement("div");
  progressText.className = "al-card-progress-text";
  const progressLabel = document.createElement("span");
  progressLabel.textContent = `Ep. ${state.progress} / ${state.totalEp || state.latestAired || "?"}`;
  progressText.appendChild(progressLabel);

  if (state.hasUnwatchedAired || state.isRepeating) {
    const readyTag = document.createElement("span");
    readyTag.style.color = state.isRepeating ? "#06b6d4" : "#3db4f2";
    readyTag.textContent = state.isRepeating ? "Rewatching" : "Ready";
    progressText.appendChild(readyTag);
  }
  overlay.appendChild(progressText);

  const progressBar = document.createElement("div");
  progressBar.className = "al-card-progress-bar";
  const progressFill = document.createElement("div");
  progressFill.className = "al-card-progress-fill";
  const totalForBar = state.totalEp || state.latestAired || state.progress || 1;
  const percent = Math.min(100, Math.max(0, Math.round((state.progress / totalForBar) * 100)));
  progressFill.style.width = `${percent}%`;
  progressBar.appendChild(progressFill);
  overlay.appendChild(progressBar);

  coverWrap.appendChild(overlay);
  card.appendChild(coverWrap);

  // Card Body
  const cardBody = document.createElement("div");
  cardBody.className = "al-card-body";

  const titleLink = document.createElement("a");
  titleLink.href = auUrl || "#";
  titleLink.className = "al-card-title";
  titleLink.title = title;
  titleLink.textContent = title;
  cardBody.appendChild(titleLink);

  const actions = document.createElement("div");
  actions.className = "al-card-actions";

  const btn = document.createElement("a");
  btn.href = auUrl || "#";
  btn.className = "al-card-btn";

  if (state.hasUnwatchedAired || state.isRepeating) {
    btn.classList.add("al-btn-play");
    if (state.isRepeating) btn.style.background = "#06b6d4";
    btn.innerHTML = `${iconHtml(Play, { width: 12, height: 12 })} Ep. ${state.nextToWatch}`;
  } else if (state.nextAir) {
    btn.classList.add("al-btn-secondary");
    btn.innerHTML = `${iconHtml(Clock, { width: 12, height: 12 })} Ep. ${state.progress}`;
  } else {
    btn.classList.add("al-btn-caughtup");
    btn.innerHTML = `${iconHtml(Check, { width: 12, height: 12 })} Caught up`;
  }
  actions.appendChild(btn);
  cardBody.appendChild(actions);

  card.appendChild(cardBody);

  // Entire card is clickable (Level 1: direct cache, Level 3: search modal)
  async function handleCardNavigate(e) {
    if (e.target.closest(".al-card-al-link")) return;
    e.preventDefault();

    Logger.info(`Card clicked: "${title}" (AniList ID: ${media.id})`);

    if (epTarget) {
      sessionStorage.setItem("al_target_ep", String(epTarget));
    }

    // Level 1: In local cache (direct anime page)
    const directUrl = getAnimeUnityUrl(media, { targetEp: epTarget });
    if (directUrl && directUrl.startsWith("/anime/")) {
      Logger.info(`Level 1 direct cache HIT -> opening ${directUrl}`);
      showToast(`⚡ Opening ${title}...`);
      window.location.href = directUrl;
      return;
    }

    Logger.info(`Level 1 direct cache MISS for ID ${media.id}. Opening search modal...`);
    showToast(`🔍 Searching "${title}" on AnimeUnity...`, false, 2000);

    // Level 3: Uncached -> Search Modal
    card.classList.add("al-card-loading");
    const originalBtnHtml = btn.innerHTML;
    btn.innerHTML = `${iconHtml(Loader2, { width: 12, height: 12, class: "al-spin" })} Loading...`;
    btn.style.opacity = "0.75";
    btn.style.pointerEvents = "none";

    const settings = Settings.get();
    try {
      const ok = await simulateAgenticSearch(media, {
        epTarget,
        autoSelectDelay: settings.searchAutoSelectDelay
      });
      if (!ok) {
        showToast(`⚠️ Could not find or open search for "${title}"`, true);
      }
    } catch (err) {
      Logger.error("Search error in handleCardNavigate:", err);
      showToast(`⚠️ Search error: ${err.message}`, true);
    } finally {
      card.classList.remove("al-card-loading");
      btn.innerHTML = originalBtnHtml;
      btn.style.opacity = "";
      btn.style.pointerEvents = "";
    }
  }

  card.addEventListener("click", handleCardNavigate);

  return card;
}

/**
 * Renders the Continue Watching shelf component
 * @param {Object} options
 * @param {Array} options.entries - List of watching media list entries
 * @param {Object|null} options.viewer - Current logged-in AniList viewer
 * @param {Function} [options.onRefresh] - Callback to refresh data
 * @returns {HTMLElement} Shelf container element
 */
export function renderWatchingShelf({ entries = [], viewer = null, onRefresh = null } = {}) {
  // Harvest any page anime data
  scanAnimeUnityPageMap();

  let unwatchedOnly = Settings.get().homeOnlyUnwatched;

  const shelfContainer = document.createElement("div");
  shelfContainer.id = "al-home-continue-watching";
  shelfContainer.className = "al-home-shelf";

  // --- Header ---
  const header = document.createElement("div");
  header.className = "al-shelf-header";

  const titleWrap = document.createElement("div");
  titleWrap.className = "al-shelf-title-wrap";

  const iconBox = document.createElement("div");
  iconBox.className = "al-shelf-icon";
  iconBox.innerHTML = iconHtml(Play, { width: 15, height: 15 });
  titleWrap.appendChild(iconBox);

  const title = document.createElement("h2");
  title.className = "al-shelf-title";
  title.textContent = "CONTINUE WATCHING";
  titleWrap.appendChild(title);

  const countBadge = document.createElement("span");
  countBadge.className = "al-shelf-count";
  countBadge.textContent = String(entries.length);
  titleWrap.appendChild(countBadge);

  header.appendChild(titleWrap);

  // Header Controls
  const controls = document.createElement("div");
  controls.className = "al-shelf-controls";

  // Preferences Button
  const prefBtn = document.createElement("button");
  prefBtn.type = "button";
  prefBtn.className = "al-shelf-pref-btn";
  prefBtn.title = "Preferences (Audio & Shelf)";
  prefBtn.innerHTML = iconHtml(Sliders, { width: 14, height: 14 });
  prefBtn.addEventListener("click", () => {
    openPreferencesModal({
      onSave: () => {
        unwatchedOnly = Settings.get().homeOnlyUnwatched;
        toggleBox.classList.toggle("active", unwatchedOnly);
        toggleKnob.classList.toggle("active", unwatchedOnly);
        if (typeof onRefresh === "function") onRefresh();
        else updateTrack();
      }
    });
  });
  controls.appendChild(prefBtn);

  // Filter Toggle ("Only unwatched")
  const unwatchedEntries = entries.filter((e) => calculateEntryState(e).hasUnwatchedAired);

  const filterWrap = document.createElement("div");
  filterWrap.className = "al-shelf-filter";
  filterWrap.title = "Toggle: Show only series with unwatched aired episodes";

  const toggleBox = document.createElement("div");
  toggleBox.className = `al-shelf-toggle-box ${unwatchedOnly ? "active" : ""}`;
  const toggleKnob = document.createElement("div");
  toggleKnob.className = `al-shelf-toggle-knob ${unwatchedOnly ? "active" : ""}`;
  toggleBox.appendChild(toggleKnob);
  filterWrap.appendChild(toggleBox);

  const filterLabel = document.createElement("span");
  filterLabel.className = "al-shelf-filter-label";
  filterLabel.innerHTML = `${iconHtml(Zap, { width: 12, height: 12 })} Only unwatched`;
  filterWrap.appendChild(filterLabel);

  if (unwatchedEntries.length > 0) {
    const pill = document.createElement("span");
    pill.className = "al-shelf-unwatched-pill";
    pill.textContent = `${unwatchedEntries.length} ready`;
    filterWrap.appendChild(pill);
  }
  controls.appendChild(filterWrap);

  // Navigation Arrows
  const navWrap = document.createElement("div");
  navWrap.className = "al-shelf-nav";

  const prevBtn = document.createElement("button");
  prevBtn.type = "button";
  prevBtn.className = "al-shelf-arrow";
  prevBtn.title = "Scroll Left";
  prevBtn.innerHTML = iconHtml(ChevronLeft, { width: 16, height: 16 });

  const nextBtn = document.createElement("button");
  nextBtn.type = "button";
  nextBtn.className = "al-shelf-arrow";
  nextBtn.title = "Scroll Right";
  nextBtn.innerHTML = iconHtml(ChevronRight, { width: 16, height: 16 });

  navWrap.appendChild(prevBtn);
  navWrap.appendChild(nextBtn);
  controls.appendChild(navWrap);

  header.appendChild(controls);
  shelfContainer.appendChild(header);

  // --- Track / Carousel Wrap ---
  const carouselWrap = document.createElement("div");
  carouselWrap.className = "al-shelf-carousel-wrap";

  const track = document.createElement("div");
  track.className = "al-shelf-track";

  prevBtn.addEventListener("click", () => {
    track.scrollBy({ left: -380, behavior: "smooth" });
  });
  nextBtn.addEventListener("click", () => {
    track.scrollBy({ left: 380, behavior: "smooth" });
  });

  // Re-populates track cards
  function updateTrack() {
    track.innerHTML = "";

    if (!viewer) {
      const empty = document.createElement("div");
      empty.className = "al-shelf-empty";
      empty.style.width = "100%";
      empty.innerHTML = `
        <div class="al-shelf-empty-icon">${iconHtml(Play, { width: 32, height: 32 })}</div>
        <div class="al-shelf-empty-title">Connect your AniList Account</div>
        <div class="al-shelf-empty-desc">Sign in with AniList to access your Continue Watching list, release countdowns, and quick episode progress directly on AnimeUnity.</div>
        <button type="button" class="al-btn al-btn-primary al-home-auth-btn" style="margin-top: 6px;">Connect AniList</button>
      `;
      empty.querySelector(".al-home-auth-btn")?.addEventListener("click", () => openTokenModal());
      track.appendChild(empty);
      return;
    }

    if (!entries.length) {
      const empty = document.createElement("div");
      empty.className = "al-shelf-empty";
      empty.style.width = "100%";
      empty.innerHTML = `
        <div class="al-shelf-empty-title">No Anime in Watching</div>
        <div class="al-shelf-empty-desc">You don't currently have any anime marked as "Watching" on AniList.</div>
      `;
      track.appendChild(empty);
      return;
    }

    const visibleEntries = unwatchedOnly
      ? entries.filter((e) => calculateEntryState(e).hasUnwatchedAired)
      : entries;

    if (!visibleEntries.length) {
      const empty = document.createElement("div");
      empty.className = "al-shelf-empty";
      empty.style.width = "100%";
      empty.innerHTML = `
        <div class="al-shelf-empty-title">All Caught Up! 🎉</div>
        <div class="al-shelf-empty-desc">You have no unwatched aired episodes in your Watching list. Disable the filter above to view all series.</div>
      `;
      track.appendChild(empty);
      return;
    }

    visibleEntries.forEach((entry) => {
      track.appendChild(createCard(entry));
    });
  }

  // Filter click handler
  filterWrap.addEventListener("click", () => {
    unwatchedOnly = !unwatchedOnly;
    toggleBox.classList.toggle("active", unwatchedOnly);
    toggleKnob.classList.toggle("active", unwatchedOnly);
    updateTrack();
  });

  updateTrack();
  carouselWrap.appendChild(track);
  shelfContainer.appendChild(carouselWrap);

  return shelfContainer;
}
