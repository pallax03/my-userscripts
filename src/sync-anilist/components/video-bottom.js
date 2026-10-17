import {
  iconHtml,
  Zap,
  Check,
  CheckCheck,
  Clock,
  Eye,
  RefreshCcw,
  X
} from "../../shared/icons.js";

export function renderVideoBottom({
  activeEp,
  trackedProgress,
  hasToken,
  autoTrackState,
  callbacks,
  isLoading = false
}) {
  const container = document.getElementById("video-bottom");
  if (!container) return;

  let widget = document.getElementById("al-video-bottom-widget");
  if (!widget) {
    widget = document.createElement("div");
    widget.id = "al-video-bottom-widget";
    const nextBtn = container.querySelector(".float-right, .next");
    if (nextBtn) container.insertBefore(widget, nextBtn);
    else container.appendChild(widget);
  }

  if (!hasToken || !activeEp) {
    widget.innerHTML = "";
    return;
  }

  if (isLoading) {
    widget.innerHTML = `<div class="al-skeleton-pill" style="width: 105px; height: 26px; border-radius: 6px; opacity: 0.85;"></div>`;
    return;
  }

  // 1. Auto-track countdown: X icon on left, countdown in center, Check icon on right
  if (autoTrackState?.isActive && autoTrackState.targetEp === activeEp) {
    widget.innerHTML = `
      <div class="al-vb-countdown">
        <button type="button" class="al-vb-btn ghost al-vb-cancel" id="al-vb-cancel" title="Cancel auto-save">
          ${iconHtml(X, { width: 13, height: 13 })}
        </button>
        <span class="al-vb-timer">
          ${iconHtml(Clock, { width: 11, height: 11, class: "al-pulse" })}
          <span>Ep. ${activeEp} · <strong>${autoTrackState.countdown}s</strong></span>
        </span>
        <button type="button" class="al-vb-btn primary-sm al-vb-save" id="al-vb-savenow" title="Save now">
          ${iconHtml(Check, { width: 13, height: 13 })}
        </button>
      </div>`;

    widget.querySelector("#al-vb-cancel")?.addEventListener("click", (e) => {
      e.stopPropagation();
      callbacks.onCancel();
    });

    widget.querySelector("#al-vb-savenow")?.addEventListener("click", (e) => {
      e.stopPropagation();
      callbacks.onSave(activeEp);
    });
    return;
  }

  // 2. Rewatch state (selected older episode, preventRewind active)
  if (trackedProgress > 0 && activeEp < trackedProgress && autoTrackState?.preventRewind) {
    widget.innerHTML = `
      <div class="al-vb-recap">
        <span class="al-vb-recap-text">
          ${iconHtml(Eye, { width: 12, height: 12 })}
          <span>Ep. ${activeEp} · Rewatch</span>
        </span>
        <button type="button" class="al-vb-btn ghost-xs" id="al-vb-force" title="Sync AniList progress to Ep. ${activeEp}">
          ${iconHtml(RefreshCcw, { width: 11, height: 11 })}
        </button>
      </div>`;

    widget.querySelector("#al-vb-force")?.addEventListener("click", (e) => {
      e.stopPropagation();
      callbacks.onForce(activeEp);
    });
    return;
  }

  // 3. Current active episode is already tracked on AniList
  if (trackedProgress > 0 && activeEp === trackedProgress) {
    widget.innerHTML = `
      <div class="al-vb-synced">
        ${iconHtml(CheckCheck, { width: 13, height: 13, class: "al-text-green" })}
        <span>Ep. ${activeEp} Synced</span>
      </div>`;
    return;
  }

  // 4. Current active episode was already watched (trackedProgress > activeEp)
  if (trackedProgress > 0 && activeEp < trackedProgress) {
    widget.innerHTML = `
      <div class="al-vb-synced">
        ${iconHtml(Check, { width: 13, height: 13, class: "al-text-green" })}
        <span>Ep. ${activeEp} Watched</span>
      </div>`;
    return;
  }

  // 5. Episode ahead of tracked progress: compact primary action button
  widget.innerHTML = `
    <button type="button" class="al-vb-mark-btn" id="al-vb-mark" title="Mark episode ${activeEp} as watched on AniList">
      ${iconHtml(Zap, { width: 12, height: 12 })}
      <span>Mark Ep. ${activeEp}</span>
    </button>`;

  widget.querySelector("#al-vb-mark")?.addEventListener("click", (e) => {
    e.stopPropagation();
    callbacks.onSave(activeEp);
  });
}
