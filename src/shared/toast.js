export function showToast(text, isAlert = false, duration = 2200) {
  if (!text) return;
  const dock = document.getElementById("al-dock");
  if (dock) {
    let banner = document.getElementById("al-dock-banner");
    if (!banner) {
      banner = document.createElement("div");
      banner.id = "al-dock-banner";
      dock.appendChild(banner);
    }
    if (dock.__bannerTimer) clearTimeout(dock.__bannerTimer);
    banner.className = `al-dock-banner ${isAlert ? "is-alert" : ""}`;
    banner.textContent = text;
    banner.style.opacity = "1";
    banner.style.display = "inline-flex";
    dock.__bannerTimer = setTimeout(() => {
      banner.style.opacity = "0";
      setTimeout(() => {
        if (banner.style.opacity === "0") banner.style.display = "none";
      }, 250);
    }, duration);
    return;
  }

  document.querySelectorAll(".al-toast").forEach((el) => el.remove());
  const el = document.createElement("div");
  el.className = `al-toast ${isAlert ? "al-toast-alert" : ""}`;
  el.innerText = text;
  document.body.appendChild(el);

  setTimeout(() => {
    el.style.opacity = "0";
    el.style.transition = "opacity 0.3s";
    setTimeout(() => el.remove(), 300);
  }, duration);
}
