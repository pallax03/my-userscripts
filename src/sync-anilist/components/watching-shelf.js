import { Storage } from "../../shared/storage.js";
import { showToast } from "../../shared/toast.js";
import { Logger } from "../../shared/logger.js";
import { iconHtml, ANILIST_ICON_SVG, Play, Clock, Check, Zap, Sliders, Loader2, Link, Users } from "../../shared/icons.js";
import { openTokenModal } from "../../shared/anilist/auth.js";
import { openPreferencesModal } from "./preferences-modal.js";
import { simulateAgenticSearch } from "./agent-search.js";
import { Settings } from "../settings.js";
import { Buddy } from "../buddy.js";
import { getCurrentProvider } from "../providers/index.js";
import { cleanTitle } from "../providers/base.js";
import { Resume } from "../resume.js";

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
 * Calculates priority tier for Continue Watching shelf:
 * 1. Resume active (intra-episode playback midway)
 * 2. Simulcast ongoing with new episode(s) already aired
 * 3. Other series with unwatched episodes available (backlog / finished / rewatching)
 * 4. Waiting for next episode (not yet aired) or fully caught up
 *
 * @param {Object} entry
 * @returns {number} 1 to 4
 */
export function getEntrySortTier(entry) {
  const media = entry.media || {};
  const state = calculateEntryState(entry);
  const resume = Resume.extract(entry.notes) || Resume.getLocal(media.id);
  const isResumeActive = Boolean(
    resume &&
    resume.percent > 0 &&
    resume.percent < 88 &&
    (resume.ep === state.nextToWatch || resume.ep > state.progress)
  );

  // 1. First priority: Intra-episode resume pending
  if (isResumeActive) return 1;

  const isSimulcast = media.status === "RELEASING" || Boolean(media.nextAiringEpisode);

  // 2. Second priority: Simulcast anime with newly aired episode(s) ready to watch
  if (isSimulcast && state.hasUnwatchedAired) return 2;

  // 3. Third priority: Other anime with unwatched episodes (finished backlog / rewatching)
  if (state.hasUnwatchedAired || state.isRepeating) return 3;

  // 4. Last priority: Anime where no new episode has aired yet (waiting for next air / caught up)
  return 4;
}

/**
 * Comparator for Continue Watching shelf items
 * Tier 1 -> Tier 2 -> Tier 3 -> Tier 4
 * Tier 4 tie-breaker: next air time ascending (airing soonest comes first)
 * Other tiers: last update time descending (most recent first)
 */
export function compareShelfEntries(a, b) {
  const tierA = getEntrySortTier(a);
  const tierB = getEntrySortTier(b);

  if (tierA !== tierB) {
    return tierA - tierB;
  }

  // Tier 4 sub-sorting: anime airing sooner comes first among waiting series
  if (tierA === 4) {
    const timeA = a.media?.nextAiringEpisode?.timeUntilAiring;
    const timeB = b.media?.nextAiringEpisode?.timeUntilAiring;
    if (timeA && timeB) return timeA - timeB;
    if (timeA && !timeB) return -1;
    if (!timeA && timeB) return 1;
  }

  // Sub-sorting for other tiers: most recently updated first
  const updatedA = a.updatedAt || 0;
  const updatedB = b.updatedAt || 0;
  return updatedB - updatedA;
}

/**
 * Creates a single Continue Watching anime card matching original styles.scss
 * @param {Object} entry
 * @param {Object|null} buddySync
 * @param {Function|null} onSyncEntry
 * @returns {HTMLElement}
 */
function createCard(entry, buddySync = null, onSyncEntry = null) {
  const media = entry.media || {};
  const state = calculateEntryState(entry);
  const resume = Resume.extract(entry.notes) || Resume.getLocal(media.id);
  const isResumeActive = resume && resume.percent > 0 && resume.percent < 88 && (resume.ep === state.nextToWatch || resume.ep > state.progress);
  const epTarget = isResumeActive ? resume.ep : (state.hasUnwatchedAired ? state.nextToWatch : (state.progress || 1));
  const title = media.title?.english || media.title?.romaji || media.title?.userPreferred || "Untitled";
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

  // Friend sync overlay badge directly on top of the cover image
  if (buddySync) {
    const buddyPill = document.createElement("div");
    buddyPill.className = "al-card-buddy-overlay";
    buddyPill.title = `Watching with ${buddySync.buddy}`;

    const epDisplay = `Ep. ${buddySync.buddyEp || 0}`;

    buddyPill.innerHTML = `
      <div class="al-card-buddy-left">
        <img src="${buddySync.avatar || "https://anilist.co/img/icons/icon.svg"}" class="al-card-buddy-avatar" alt="${buddySync.buddy}" />
        <span class="al-card-buddy-name">${buddySync.buddy}</span>
      </div>
      <span class="al-card-buddy-status">${epDisplay}</span>
    `;

    coverWrap.appendChild(buddyPill);
  }

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
    txt.textContent = state.unwatchedCount > 1 ? `+${state.unwatchedCount} eps` : "Caught up";
    badge.appendChild(txt);
    badgeWrap.appendChild(badge);
  } else if (state.hasUnwatchedAired) {
    const badge = document.createElement("span");
    badge.className = "al-badge al-badge-CURRENT";
    const dot = document.createElement("span");
    dot.className = "al-dot";
    badge.appendChild(dot);
    const txt = document.createElement("span");
    txt.textContent = state.unwatchedCount > 1 ? `+${state.unwatchedCount} eps` : `Caught up`;
    badge.appendChild(txt);
    badgeWrap.appendChild(badge);
  } else if (state.nextAir && state.nextAir.timeUntilAiring > 0) {
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
  alLink.innerHTML = ANILIST_ICON_SVG;
  alLinkWrap.appendChild(alLink);
  coverWrap.appendChild(alLinkWrap);

  // Cover bottom overlay (Progress text and bar)
  const overlay = document.createElement("div");
  overlay.className = "al-card-cover-overlay";

  const progressText = document.createElement("div");
  progressText.className = "al-card-progress-text";
  const progressLabel = document.createElement("span");

  if (isResumeActive) {
    progressLabel.textContent = `Ep. ${resume.ep} • ${Resume.formatTime(resume.time)} / ${Resume.formatTime(resume.duration)}`;
  } else {
    progressLabel.textContent = `Ep. ${state.progress} / ${state.totalEp || state.latestAired || "?"}`;
  }
  progressText.appendChild(progressLabel);

  if (isResumeActive) {
    const resumeTag = document.createElement("span");
    resumeTag.style.color = "#c084fc";
    resumeTag.textContent = `${resume.percent}%`;
    progressText.appendChild(resumeTag);
  } else if (state.hasUnwatchedAired || state.isRepeating) {
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

  if (isResumeActive) {
    progressFill.style.width = `${resume.percent}%`;
    progressFill.style.background = "linear-gradient(90deg, #3db4f2, #a855f7)";
  } else {
    const totalForBar = state.totalEp || state.latestAired || state.progress || 1;
    const percent = Math.min(100, Math.max(0, Math.round((state.progress / totalForBar) * 100)));
    progressFill.style.width = `${percent}%`;
  }
  progressBar.appendChild(progressFill);
  overlay.appendChild(progressBar);

  coverWrap.appendChild(overlay);
  card.appendChild(coverWrap);

  // Card Body
  const cardBody = document.createElement("div");
  cardBody.className = "al-card-body";

  const titleLink = document.createElement("a");
  titleLink.href = "#";
  titleLink.className = "al-card-title";
  titleLink.title = title;
  titleLink.textContent = title;
  cardBody.appendChild(titleLink);

  const actions = document.createElement("div");
  actions.className = "al-card-actions";

  // If buddy is ahead or completed, place sync button directly above watch button
  if (buddySync) {
    const isCompleted = !!buddySync.isBuddyCompleted;
    const canSync = !!buddySync.isAhead || (isCompleted && entry.status !== "COMPLETED");
    if (canSync) {
      const syncBtn = document.createElement("button");
      syncBtn.type = "button";
      syncBtn.className = "al-card-btn al-btn-buddy-sync";
      syncBtn.title = `Sync AniList to ${isCompleted ? "Completed" : `Ep. ${buddySync.buddyEp}`} (${buddySync.buddy})`;
      syncBtn.innerHTML = `${iconHtml(Link, { width: 12, height: 12 })} <span>${isCompleted ? "Sync Completed" : `Sync Ep. ${buddySync.buddyEp}`}</span>`;
      syncBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        e.preventDefault();
        syncBtn.style.pointerEvents = "none";
        syncBtn.style.opacity = "0.7";
        syncBtn.innerHTML = `${iconHtml(Loader2, { width: 12, height: 12, class: "al-spin" })} <span>Syncing...</span>`;
        if (typeof onSyncEntry === "function") {
          onSyncEntry(buddySync.mediaId, buddySync.buddyEp, isCompleted);
        }
      });
      actions.appendChild(syncBtn);
    }
  }

  const btn = document.createElement("a");
  btn.href = "#";
  btn.className = "al-card-btn";

  if (isResumeActive) {
    btn.classList.add("al-btn-play");
    btn.style.background = "linear-gradient(135deg, #0284c7, #9333ea)";
    btn.title = `Resume Ep. ${resume.ep} (${Resume.formatTime(resume.time)})`;
    btn.innerHTML = `${iconHtml(Play, { width: 12, height: 12 })} Resume`;
  } else if (state.hasUnwatchedAired || state.isRepeating) {
    btn.classList.add("al-btn-play");
    if (state.isRepeating) btn.style.background = "#06b6d4";
    btn.title = `Watch Ep. ${state.nextToWatch}`;
    btn.innerHTML = `${iconHtml(Play, { width: 12, height: 12 })} Play`;
  } else if (state.nextAir && state.nextAir.timeUntilAiring > 0) {
    btn.classList.add("al-btn-secondary");
    btn.innerHTML = `${iconHtml(Clock, { width: 12, height: 12 })} Ep. ${state.progress}`;
  } else {
    btn.classList.add("al-btn-caughtup");
    btn.innerHTML = `${iconHtml(Check, { width: 12, height: 12 })} Caught up`;
  }
  actions.appendChild(btn);
  cardBody.appendChild(actions);
  card.appendChild(cardBody);

  // Unified Card Navigation
  async function handleCardNavigate(e) {
    if (e.target.closest(".al-card-al-link, .al-btn-buddy-sync")) return;
    e.preventDefault();

    const provider = getCurrentProvider();
    const siteName = provider?.name || "Site";

    Logger.info(`Card clicked: "${title}" (AniList ID: ${media.id}) on ${siteName}`);

    if (epTarget) {
      sessionStorage.setItem("al_target_ep", String(epTarget));
    }
    if (isResumeActive && resume?.time > 0) {
      sessionStorage.setItem("al_resume_time", String(resume.time));
    }

    card.classList.add("al-card-loading");
    const originalBtnHtml = btn.innerHTML;
    btn.innerHTML = `${iconHtml(Loader2, { width: 12, height: 12, class: "al-spin" })} Loading...`;
    btn.style.opacity = "0.75";
    btn.style.pointerEvents = "none";

    try {
      const targetUrl = await provider?.resolveTargetUrl(media, epTarget);
      if (targetUrl) {
        showToast(`⚡ Opening ${title}...`);
        window.location.href = targetUrl;
        return;
      }

      if (provider?.name === "AnimeUnity") {
        showToast(`🔍 Searching "${title}" on AnimeUnity...`, false, 2000);
        const settings = Settings.get();
        const ok = await simulateAgenticSearch(media, {
          epTarget,
          autoSelectDelay: settings.searchAutoSelectDelay
        });
        if (!ok) {
          showToast(`⚠️ Could not find "${title}" on AnimeUnity`, true);
        }
      } else {
        showToast(`🔍 Searching "${title}" on AnimeSaturn...`);
        window.location.href = `/filter?key=${encodeURIComponent(cleanTitle(title))}`;
      }
    } catch (err) {
      Logger.error("Search error in handleCardNavigate:", err);
      showToast(`⚠️ Error: ${err.message}`, true);
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
 * @param {Function} [options.onLogin] - Callback to trigger login
 * @param {Array} [options.syncNotifs] - Buddy sync notifications
 * @param {Function} [options.onSyncEntry] - Callback to sync buddy progress
 * @returns {HTMLElement} Shelf container element
 */
export function renderWatchingShelf({
  entries = [],
  viewer = null,
  onRefresh = null,
  onLogin = null,
  syncNotifs = [],
  onSyncEntry = null
} = {}) {
  let unwatchedOnly = Settings.get().shelfFilterUnwatched;
  let syncOnly = Settings.get().shelfFilterSync;

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
  prefBtn.title = "Preferences";
  prefBtn.innerHTML = iconHtml(Sliders, { width: 14, height: 14 });
  controls.appendChild(prefBtn);

  // Filter Chip ("Only unwatched")
  const unwatchedEntries = entries.filter((e) => calculateEntryState(e).hasUnwatchedAired);

  const unwatchedBtn = document.createElement("button");
  unwatchedBtn.type = "button";
  unwatchedBtn.className = `al-shelf-chip-btn ${unwatchedOnly ? "is-active" : ""}`;
  unwatchedBtn.title = "Show only anime with unwatched aired episodes";
  unwatchedBtn.innerHTML = `
    ${iconHtml(Zap, { width: 12, height: 12 })}
    <span>Unwatched</span>
    ${unwatchedEntries.length > 0 ? `<span class="al-chip-count">${unwatchedEntries.length}</span>` : ""}
  `;

  unwatchedBtn.addEventListener("click", () => {
    unwatchedOnly = !unwatchedOnly;
    Settings.set("shelfFilterUnwatched", unwatchedOnly);
    unwatchedBtn.classList.toggle("is-active", unwatchedOnly);
    updateTrack();
  });
  controls.appendChild(unwatchedBtn);

  // Filter Chip ("Sync Together")
  const syncMap = new Map((syncNotifs || []).map((n) => [n.mediaId, n]));
  const syncEntries = entries.filter((e) => syncMap.has(e.mediaId) || !!Buddy.extract(e.notes));

  let syncBtn = null;
  if (syncEntries.length > 0) {
    syncBtn = document.createElement("button");
    syncBtn.type = "button";
    syncBtn.className = `al-shelf-chip-btn is-sync ${syncOnly ? "is-active" : ""}`;
    syncBtn.title = "Show only anime with Sync Together friend";
    syncBtn.innerHTML = `
      ${iconHtml(Users, { width: 12, height: 12 })}
      <span>Sync</span>
      <span class="al-chip-count sync-badge">${syncEntries.length}</span>
    `;

    syncBtn.addEventListener("click", () => {
      syncOnly = !syncOnly;
      Settings.set("shelfFilterSync", syncOnly);
      syncBtn.classList.toggle("is-active", syncOnly);
      updateTrack();
    });
    controls.appendChild(syncBtn);
  }

  prefBtn.addEventListener("click", () => {
    openPreferencesModal({
      viewer,
      onSave: () => {
        unwatchedOnly = Settings.get().shelfFilterUnwatched;
        syncOnly = Settings.get().shelfFilterSync;
        unwatchedBtn.classList.toggle("is-active", unwatchedOnly);
        if (syncBtn) {
          syncBtn.classList.toggle("is-active", syncOnly);
        }
        updateTrack();
      }
    });
  });

  header.appendChild(controls);
  shelfContainer.appendChild(header);

  // --- Track / Carousel Wrap ---
  const carouselWrap = document.createElement("div");
  carouselWrap.className = "al-shelf-carousel-wrap";

  const track = document.createElement("div");
  track.className = "al-shelf-track";

  function updateTrack() {
    track.innerHTML = "";

    if (!viewer) {
      const empty = document.createElement("div");
      empty.className = "al-shelf-empty";
      empty.style.width = "100%";
      empty.innerHTML = `
        <div class="al-shelf-empty-icon">${iconHtml(Play, { width: 32, height: 32 })}</div>
        <div class="al-shelf-empty-title">Connect your AniList Account</div>
        <div class="al-shelf-empty-desc">Sign in with AniList to access your Continue Watching list, release countdowns, and quick episode progress.</div>
        <button type="button" class="al-btn primary al-home-auth-btn" style="margin-top: 6px;">Connect AniList</button>
      `;
      const authBtn = empty.querySelector(".al-home-auth-btn");
      const handleShelfLogin = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (typeof onLogin === "function") onLogin();
        else openTokenModal();
      };
      if (authBtn) {
        authBtn.onclick = handleShelfLogin;
        authBtn.addEventListener("click", handleShelfLogin, true);
      }
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

    let visibleEntries = [...entries];

    if (unwatchedOnly) {
      visibleEntries = visibleEntries.filter((e) => calculateEntryState(e).hasUnwatchedAired);
    }

    if (syncOnly) {
      visibleEntries = visibleEntries.filter((e) => syncMap.has(e.mediaId) || !!Buddy.extract(e.notes));
    }

    visibleEntries.sort(compareShelfEntries);

    if (!visibleEntries.length) {
      const empty = document.createElement("div");
      empty.className = "al-shelf-empty";
      empty.style.width = "100%";
      const reason = unwatchedOnly && syncOnly
        ? "No series with unwatched aired episodes and Sync Together friend."
        : unwatchedOnly
          ? "You are caught up on all airing anime! No unwatched episodes available."
          : "No series with a Sync Together friend found in your watching list.";
      empty.innerHTML = `
        <div class="al-shelf-empty-title">All Caught Up</div>
        <div class="al-shelf-empty-desc">${reason}</div>
      `;
      track.appendChild(empty);
      return;
    }

    visibleEntries.forEach((entry) => {
      const buddySync = syncMap.get(entry.mediaId) || null;
      const card = createCard(entry, buddySync, onSyncEntry);
      track.appendChild(card);
    });
  }

  updateTrack();
  carouselWrap.appendChild(track);
  shelfContainer.appendChild(carouselWrap);

  return shelfContainer;
}
