import { iconHtml, Check, X } from "./icons.js";

/**
 * Creates and mounts a standardized glassmorphic modal or slide-over drawer dialog.
 *
 * @param {Object} options
 * @param {string} [options.id] - Unique DOM id for the modal overlay
 * @param {string} [options.className] - Optional extra class names for .al-modal
 * @param {"modal"|"drawer"} [options.variant="modal"] - Layout variant: centered modal or slide-over drawer
 * @param {Object} [options.icon] - Lucide icon component to display in header
 * @param {string} options.title - Header title
 * @param {string} [options.subtitle] - Header subtitle
 * @param {string|HTMLElement} options.body - HTML string or DOM Element for the body
 * @param {Array<{label: string, primary?: boolean, secondary?: boolean, danger?: boolean, icon?: any, id?: string, onClick?: Function}>} [options.actions] - Action buttons
 * @param {Function} [options.onClose] - Cleanup hook called on dismissal
 * @returns {{ overlay: HTMLElement, modal: HTMLElement, body: HTMLElement, close: Function }}
 */
export function createModal({
  id = "al-modal-overlay",
  className = "",
  variant = "modal",
  icon = null,
  title = "",
  subtitle = "",
  body = "",
  actions = [],
  onClose = null
} = {}) {
  // Remove preexisting instance with the same ID
  document.getElementById(id)?.remove();

  const isDrawer = variant === "drawer";

  const overlay = document.createElement("div");
  overlay.id = id;
  overlay.className = `al-overlay ${isDrawer ? "al-overlay-drawer" : ""}`.trim();
  overlay.style.cssText = isDrawer
    ? "position:fixed!important;top:0!important;left:0!important;right:0!important;bottom:0!important;width:100vw!important;height:100vh!important;height:100dvh!important;z-index:2147483647!important;display:flex!important;align-items:stretch!important;justify-content:flex-end!important;margin:0!important;padding:0!important;box-sizing:border-box!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important;"
    : "position:fixed!important;top:0!important;left:0!important;right:0!important;bottom:0!important;width:100vw!important;height:100vh!important;height:100dvh!important;z-index:2147483647!important;display:flex!important;align-items:center!important;justify-content:center!important;margin:0!important;padding:16px!important;box-sizing:border-box!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important;";

  const modal = document.createElement("div");
  modal.className = `al-modal ${isDrawer ? "al-drawer" : ""} ${className}`.trim();
  modal.style.cssText = "position:relative!important;z-index:2147483647!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important;";

  // Header
  const header = document.createElement("div");
  header.className = "al-modal-header";
  header.innerHTML = `
    <div class="al-modal-header-left">
      ${icon ? `<div class="al-modal-icon">${iconHtml(icon, { width: 22, height: 22 })}</div>` : ""}
      <div>
        <h3 class="al-modal-title">${title}</h3>
        ${subtitle ? `<p class="al-modal-subtitle">${subtitle}</p>` : ""}
      </div>
    </div>
    <button type="button" class="al-modal-close-btn" aria-label="Close dialog">
      ${iconHtml(X, { width: 18, height: 18 })}
    </button>
  `;
  modal.appendChild(header);

  // Body
  const bodyEl = document.createElement("div");
  bodyEl.className = "al-modal-body";
  if (typeof body === "string") {
    bodyEl.innerHTML = body;
  } else if (body instanceof HTMLElement) {
    bodyEl.appendChild(body);
  }
  modal.appendChild(bodyEl);

  // Dismissal handlers
  const close = () => {
    document.removeEventListener("keydown", keyHandler);
    overlay.remove();
    if (typeof onClose === "function") onClose();
  };

  const keyHandler = (e) => {
    if (e.key === "Escape") close();
  };
  document.addEventListener("keydown", keyHandler);

  header.querySelector(".al-modal-close-btn")?.addEventListener("click", (e) => {
    e.stopPropagation();
    close();
  });

  const openedAt = Date.now();
  overlay.onclick = (e) => {
    if (Date.now() - openedAt < 200) return;
    if (e.target === overlay) close();
  };

  // Actions
  const actionsEl = document.createElement("div");
  actionsEl.className = "al-modal-actions";

  const finalActions = actions && actions.length > 0 ? actions : [{ label: "Done", primary: true, icon: Check }];

  for (const act of finalActions) {
    const btn = document.createElement("button");
    btn.type = "button";
    if (act.id) btn.id = act.id;
    btn.className = `al-btn ${act.primary ? "primary" : act.danger ? "danger" : "secondary"}`.trim();
    btn.innerHTML = `
      ${act.icon ? iconHtml(act.icon, { width: 14, height: 14 }) : ""}
      <span>${act.label}</span>
    `;
    btn.onclick = (e) => {
      if (typeof act.onClick === "function") {
        act.onClick({ close, modal, overlay, event: e });
      } else {
        close();
      }
    };
    actionsEl.appendChild(btn);
  }

  modal.appendChild(actionsEl);
  overlay.appendChild(modal);
  const mountPoint = document.body || document.documentElement;
  mountPoint.appendChild(overlay);

  return { overlay, modal, body: bodyEl, close };
}
