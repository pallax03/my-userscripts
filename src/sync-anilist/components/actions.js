import { AniListAPI } from "../../shared/anilist/api.js";
import { iconHtml, ExternalLink, Trash2, Plus, KeyRound } from "../../shared/icons.js";

export function renderActions(media, hasToken, actions) {
  // Purge AnimeUnity personal account elements from DOM
  document.querySelectorAll(".cover-wrap .actions, .list-btn-mobile, #add-to-fav").forEach((el) => el.remove());

  const epWrapper = document.querySelector(".episode-wrapper");
  const overview = document.querySelector(".content .overview") || document.querySelector(".overview");
  if (!epWrapper && !overview) return;

  let bar = document.getElementById("al-control-bar");
  if (!bar) {
    bar = document.createElement("div");
    bar.id = "al-control-bar";
    bar.className = "al-card";
  }

  // Anchor bar directly below the episode selector
  if (epWrapper && bar.previousElementSibling !== epWrapper) epWrapper.after(bar);
  else if (!epWrapper && overview && bar.parentElement !== overview) overview.appendChild(bar);

  if (!hasToken) {
    bar.innerHTML = `
      <div class="al-card-row">
        <div class="al-info">
          <span class="al-pill">AniList</span>
          <span>Connect your account to track anime and sync episodes</span>
        </div>
        <button type="button" class="al-btn primary" id="al-bar-login">
          ${iconHtml(KeyRound, { width: 14, height: 14 })}
          <span>Connect AniList</span>
        </button>
      </div>`;
    bar.querySelector("#al-bar-login").onclick = actions.onConnect;
    return;
  }

  if (!media) {
    bar.innerHTML = `
      <div class="al-card-row">
        <div class="al-info text-danger">
          <span class="al-pill danger">AniList</span>
          <span>Anime not found in AniList database</span>
        </div>
      </div>`;
    return;
  }

  const title = media.title?.romaji || media.title?.english || media.title?.userPreferred || `AniList #${media.id}`;
  const entry = media.mediaListEntry;
  const total = media.episodes || 0;
  const progress = entry?.progress || 0;
  const percent = total > 0 && progress > 0 ? Math.min(100, Math.round((progress / total) * 100)) : 0;

  bar.innerHTML = `
    <div class="al-card-row">
      <div class="al-left">
        <a href="https://anilist.co/anime/${media.id}" target="_blank" rel="noopener noreferrer" class="al-badge" title="Open on AniList: ${title}">
          <span class="al-title-text">${title}</span>
          ${iconHtml(ExternalLink, { width: 12, height: 12, class: "al-badge-icon" })}
        </a>
      </div>

      <div class="al-right">
        ${!entry ? `
          <button type="button" class="al-btn primary" id="al-bar-add">
            ${iconHtml(Plus, { width: 14, height: 14 })}
            <span>Add to Watching</span>
          </button>
        ` : `
          <div class="al-controls-group">
            <select class="al-select" id="al-bar-status" title="Anime status">
              ${Object.entries(AniListAPI.statuses).map(([k, v]) => `<option value="${k}" ${entry.status === k ? "selected" : ""}>${v}</option>`).join("")}
            </select>

            <select class="al-select" id="al-bar-score" title="Your rating">
              <option value="0">Score: −</option>
              ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((s) => `<option value="${s}" ${entry.score === s ? "selected" : ""}>★ ${s}/10</option>`).join("")}
            </select>

            <button type="button" class="al-icon-btn danger" id="al-bar-del" title="Remove from AniList library">
              ${iconHtml(Trash2, { width: 14, height: 14 })}
            </button>
          </div>
        `}
      </div>
    </div>
    ${entry && total > 0 ? `
      <div class="al-card-progress-bar" title="Completion: ${progress}/${total} (${percent}%)">
        <div class="al-card-progress-fill" style="width: ${percent}%;"></div>
      </div>
    ` : ""}`;

  bar.querySelector("#al-bar-add")?.addEventListener("click", actions.onAdd);
  bar.querySelector("#al-bar-del")?.addEventListener("click", actions.onDelete);
  bar.querySelector("#al-bar-status")?.addEventListener("change", (e) => actions.onStatusChange(e.target.value));
  bar.querySelector("#al-bar-score")?.addEventListener("change", (e) => actions.onScoreChange(parseFloat(e.target.value)));
}
