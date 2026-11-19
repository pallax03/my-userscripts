import { showToast } from "../../shared/toast.js";
import { Logger } from "../../shared/logger.js";
import { iconHtml, Play, Clock, Check, Zap, Loader2, Link, Users, X, Minus, Plus, Trash2, MoreHorizontal } from "../../shared/icons.js";
import { openTokenModal } from "../../shared/anilist/auth.js";
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
    (resume.ep === state.nextToWatch || resume.ep === state.progress)
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
function createCard(
  entry,
  buddySync = null,
  onSyncEntry = null,
  onClearResume = null,
  onAdjustProgress = null,
  onRemoveEntry = null,
  onStatusChange = null
) {
  const media = entry.media || {};
  const state = calculateEntryState(entry);
  const resume = Resume.extract(entry.notes) || Resume.getLocal(media.id);
  const isResumeActive = Boolean(
    resume &&
    resume.percent > 0 &&
    resume.percent < 88 &&
    (resume.ep === state.nextToWatch || resume.ep === state.progress)
  );
  const epTarget = state.hasUnwatchedAired ? state.nextToWatch : (state.progress || 1);
  const title = media.title?.english || media.title?.romaji || media.title?.userPreferred || "Untitled";
  const coverUrl = media.coverImage?.large || media.coverImage?.medium || "";

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
      <img src="${buddySync.avatar || "https://anilist.co/img/icons/icon.svg"}" class="al-card-buddy-avatar" alt="${buddySync.buddy}" />
      <span class="al-card-buddy-status">${epDisplay}</span>
    `;

    coverWrap.appendChild(buddyPill);
  }

  card.appendChild(coverWrap);

  const isBuddyCompleted = !!buddySync?.isBuddyCompleted;
  const canBuddySync = Boolean(buddySync && (buddySync.isAhead || (isBuddyCompleted && entry.status !== "COMPLETED")));

  // Card Body (Right panel)
  const cardBody = document.createElement("div");
  cardBody.className = "al-card-body";

  const headerRow = document.createElement("div");
  headerRow.className = "al-card-header-row";

  const titleLink = document.createElement("a");
  titleLink.href = "#";
  titleLink.className = "al-card-title";
  titleLink.title = title;
  titleLink.textContent = title;
  headerRow.appendChild(titleLink);

  const moreBtn = document.createElement("button");
  moreBtn.type = "button";
  moreBtn.className = "al-card-more-btn";
  moreBtn.title = "Anime actions";
  moreBtn.innerHTML = iconHtml(MoreHorizontal, { width: 14, height: 14 });
  moreBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    cardBody.classList.toggle("is-actions-open");
  });
  headerRow.appendChild(moreBtn);
  cardBody.appendChild(headerRow);

  // Meta & Status row (Episode / Seek time + Airing countdown or status pill)
  const metaWrap = document.createElement("div");
  metaWrap.className = "al-card-meta-wrap";

  const statusRow = document.createElement("div");
  statusRow.className = "al-card-meta-row";

  const progressLabel = document.createElement("span");
  progressLabel.className = "al-card-ep-label";
  if (isResumeActive) {
    progressLabel.textContent = `Ep. ${resume.ep} • ${Resume.formatTime(resume.time)} / ${Resume.formatTime(resume.duration)}`;
  } else {
    progressLabel.textContent = `Ep. ${state.progress} / ${state.totalEp || state.latestAired || "?"}`;
  }
  statusRow.appendChild(progressLabel);

  const statusPill = document.createElement("span");
  if (state.isRepeating) {
    statusPill.className = "al-badge al-badge-REPEATING";
    statusPill.innerHTML = `<span class="al-dot"></span><span>${state.unwatchedCount > 1 ? `+${state.unwatchedCount} eps` : "Rewatch"}</span>`;
  } else if (state.hasUnwatchedAired) {
    statusPill.className = "al-badge al-badge-CURRENT";
    statusPill.innerHTML = `<span class="al-dot"></span><span>${state.unwatchedCount > 1 ? `+${state.unwatchedCount} eps` : "Ready"}</span>`;
  } else if (state.nextAir && state.nextAir.timeUntilAiring > 0) {
    statusPill.className = "al-badge al-badge-PAUSED";
    statusPill.innerHTML = `<span class="al-dot"></span><span>Ep. ${state.nextAir.episode} in ${formatCountdown(state.nextAir.timeUntilAiring)}</span>`;
  } else {
    statusPill.className = "al-badge al-badge-COMPLETED";
    statusPill.innerHTML = `<span class="al-dot"></span><span>Caught up</span>`;
  }
  statusRow.appendChild(statusPill);
  metaWrap.appendChild(statusRow);

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
  metaWrap.appendChild(progressBar);
  cardBody.appendChild(metaWrap);

  const actions = document.createElement("div");
  actions.className = "al-card-actions";

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
  const actionsRow = document.createElement("div");
  actionsRow.className = "al-card-actions-bar";

  if (isResumeActive && typeof onClearResume === "function") {
    const splitWrap = document.createElement("div");
    splitWrap.className = "al-card-resume-split";

    const clearBtn = document.createElement("button");
    clearBtn.type = "button";
    clearBtn.className = "al-card-btn al-btn-clear-resume";
    clearBtn.title = "Clear saved resume";
    clearBtn.innerHTML = iconHtml(X, { width: 13, height: 13 });
    clearBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      clearBtn.disabled = true;
      clearBtn.innerHTML = iconHtml(Loader2, { width: 13, height: 13, class: "al-spin" });
      await onClearResume(entry);
    });

    splitWrap.appendChild(btn);
    splitWrap.appendChild(clearBtn);
    actionsRow.appendChild(splitWrap);
  } else if (canBuddySync) {
    const syncBtn = document.createElement("button");
    syncBtn.type = "button";
    syncBtn.className = "al-card-btn al-btn-buddy-sync";
    syncBtn.title = `Sync AniList to ${isBuddyCompleted ? "Completed" : `Ep. ${buddySync.buddyEp}`} (${buddySync.buddy})`;
    syncBtn.innerHTML = `${iconHtml(Link, { width: 12, height: 12 })} <span>${isBuddyCompleted ? "Sync Completed" : `Sync Ep. ${buddySync.buddyEp}`}</span>`;
    syncBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      e.preventDefault();
      syncBtn.style.pointerEvents = "none";
      syncBtn.style.opacity = "0.7";
      syncBtn.innerHTML = `${iconHtml(Loader2, { width: 12, height: 12, class: "al-spin" })} <span>Syncing...</span>`;
      if (typeof onSyncEntry === "function") {
        onSyncEntry(buddySync.mediaId, buddySync.buddyEp, isBuddyCompleted);
      }
    });
    actionsRow.appendChild(syncBtn);
  } else {
    actionsRow.appendChild(btn);
  }

  actions.appendChild(actionsRow);
  cardBody.appendChild(actions);

  // Action Overlay (opened via ⋯ button, hides normal info underneath)
  const overlayPanel = document.createElement("div");
  overlayPanel.className = "al-card-action-overlay";

  const overlayHead = document.createElement("div");
  overlayHead.className = "al-card-overlay-head";
  overlayHead.innerHTML = `<span class="al-card-overlay-title">Actions</span>`;

  const closeOverlayBtn = document.createElement("button");
  closeOverlayBtn.type = "button";
  closeOverlayBtn.className = "al-card-mini-btn";
  closeOverlayBtn.title = "Close actions";
  closeOverlayBtn.innerHTML = iconHtml(X, { width: 12, height: 12 });
  closeOverlayBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    cardBody.classList.remove("is-actions-open");
  });
  overlayHead.appendChild(closeOverlayBtn);
  overlayPanel.appendChild(overlayHead);

  const overlayBody = document.createElement("div");
  overlayBody.className = "al-card-overlay-body";

  const editRow = document.createElement("div");
  editRow.className = "al-card-overlay-edit-row";

  if (typeof onAdjustProgress === "function") {
    const decBtn = document.createElement("button");
    decBtn.type = "button";
    decBtn.className = "al-card-overlay-btn";
    decBtn.title = `Decrement to Ep. ${Math.max(0, state.progress - 1)}`;
    decBtn.disabled = state.progress <= 0;
    decBtn.innerHTML = iconHtml(Minus, { width: 13, height: 13 });
    decBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      decBtn.disabled = true;
      await onAdjustProgress(media.id, Math.max(0, state.progress - 1));
    });
    editRow.appendChild(decBtn);

    const incBtn = document.createElement("button");
    incBtn.type = "button";
    incBtn.className = "al-card-overlay-btn";
    incBtn.title = `Mark Ep. ${state.progress + 1} watched`;
    incBtn.disabled = Boolean(state.totalEp && state.progress >= state.totalEp);
    incBtn.innerHTML = iconHtml(Plus, { width: 13, height: 13 });
    incBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      incBtn.disabled = true;
      await onAdjustProgress(media.id, state.progress + 1);
    });
    editRow.appendChild(incBtn);
  }

  if (typeof onRemoveEntry === "function") {
    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.className = "al-card-overlay-btn is-danger";
    delBtn.title = "Remove from AniList";
    delBtn.innerHTML = iconHtml(Trash2, { width: 13, height: 13 });
    delBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      await onRemoveEntry(entry);
    });
    editRow.appendChild(delBtn);
  }

  overlayBody.appendChild(editRow);

  if (typeof onStatusChange === "function") {
    const statusSelect = document.createElement("select");
    statusSelect.className = "al-card-status-select";
    statusSelect.title = "Change AniList status";
    const statuses = [
      ["CURRENT", "Watching"],
      ["REPEATING", "Rewatching"],
      ["PAUSED", "Paused"],
      ["PLANNING", "Planning"],
      ["COMPLETED", "Completed"],
      ["DROPPED", "Dropped"]
    ];
    statuses.forEach(([val, label]) => {
      const opt = document.createElement("option");
      opt.value = val;
      opt.textContent = label;
      if (entry.status === val) opt.selected = true;
      statusSelect.appendChild(opt);
    });
    statusSelect.addEventListener("click", (e) => e.stopPropagation());
    statusSelect.addEventListener("change", async (e) => {
      e.stopPropagation();
      statusSelect.disabled = true;
      await onStatusChange(entry, e.target.value);
    });
    overlayBody.appendChild(statusSelect);
  }

  overlayPanel.appendChild(overlayBody);
  cardBody.appendChild(overlayPanel);
  card.appendChild(cardBody);

  // Unified Card Navigation
  async function handleCardNavigate(e) {
    if (e.target.closest(".al-card-more-btn, .al-card-action-overlay, .al-btn-buddy-sync, .al-btn-clear-resume, .al-card-mini-btn")) return;
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
 * @param {Function} [options.onLogin] - Callback to trigger login
 * @param {Array} [options.syncNotifs] - Buddy sync notifications
 * @param {Function} [options.onSyncEntry] - Callback to sync buddy progress
 * @returns {HTMLElement} Shelf container element
 */
export function renderWatchingShelf({
  entries = [],
  viewer = null,
  onLogin = null,
  syncNotifs = [],
  onSyncEntry = null,
  onClearResume = null,
  onAdjustProgress = null,
  onRemoveEntry = null,
  onStatusChange = null
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

  // Filter Chip ("Only unwatched")
  const unwatchedEntries = entries.filter((e) => calculateEntryState(e).hasUnwatchedAired);

  const unwatchedBtn = document.createElement("button");
  unwatchedBtn.type = "button";
  unwatchedBtn.className = `al-shelf-chip-btn al-is-toggle ${unwatchedOnly ? "is-active" : ""}`;
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
    syncBtn.className = `al-shelf-chip-btn al-is-toggle is-sync ${syncOnly ? "is-active" : ""}`;
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
        authBtn.addEventListener("click", handleShelfLogin);
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
      const card = createCard(entry, buddySync, onSyncEntry, onClearResume, onAdjustProgress, onRemoveEntry, onStatusChange);
      track.appendChild(card);
    });
  }

  updateTrack();
  carouselWrap.appendChild(track);
  shelfContainer.appendChild(carouselWrap);

  return shelfContainer;
}
