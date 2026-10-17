import { iconHtml, Check } from "./icons.js";

/**
 * Creates and mounts a standardized glassmorphic modal dialog.
 *
 * @param {Object} options
 * @param {string} [options.id] - Unique DOM id for the modal overlay
 * @param {string} [options.className] - Optional extra class names for .al-modal
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
  icon = null,
  title = "",
  subtitle = "",
  body = "",
  actions = [],
  onClose = null
} = {}) {
  // Remove preexisting instance with the same ID
  document.getElementById(id)?.remove();

  const overlay = document.createElement("div");
  overlay.id = id;
  overlay.className = "al-overlay";

  const modal = document.createElement("div");
  modal.className = `al-modal ${className}`.trim();

  // Header
  const header = document.createElement("div");
  header.className = "al-modal-header";
  header.innerHTML = `
    ${icon ? `<div class="al-modal-icon">${iconHtml(icon, { width: 22, height: 22 })}</div>` : ""}
    <div>
      <h3 class="al-modal-title">${title}</h3>
      ${subtitle ? `<p class="al-modal-subtitle">${subtitle}</p>` : ""}
    </div>
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

  overlay.onclick = (e) => {
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
  document.body.appendChild(overlay);

  return { overlay, modal, body: bodyEl, close };
}
