/** Fixed, DOM-independent mount points (centered bottom dock): the site's markup is never an anchor. */
function ensureDock() {
  let dock = document.getElementById("al-dock");
  if (!dock) {
    dock = document.createElement("div");
    dock.id = "al-dock";
    (document.body || document.documentElement).appendChild(dock);
  }
  return dock;
}

export function slot(name) {
  const id = `al-slot-${name}`;
  let el = document.getElementById(id);
  if (!el) {
    const dock = ensureDock();
    el = document.createElement("div");
    el.id = id;
    el.className = "al-slot";
    dock.appendChild(el);
  }
  return el;
}

let bannerTimer = null;

/** Renders a live status log pill directly above #al-dock. */
export function setDockBanner(text, { isAlert = false, sticky = false, duration = 2600 } = {}) {
  if (!text) return;
  const dock = ensureDock();
  let banner = document.getElementById("al-dock-banner");
  if (!banner) {
    banner = document.createElement("div");
    banner.id = "al-dock-banner";
    dock.appendChild(banner);
  }
  if (bannerTimer) clearTimeout(bannerTimer);
  banner.className = `al-dock-banner ${isAlert ? "is-alert" : ""}`;
  banner.textContent = text;
  banner.style.opacity = "1";
  banner.style.display = "inline-flex";

  if (!sticky) {
    bannerTimer = setTimeout(() => {
      banner.style.opacity = "0";
      setTimeout(() => {
        if (banner.style.opacity === "0") banner.style.display = "none";
      }, 250);
    }, duration);
  }
}
