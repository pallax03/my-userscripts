export function showToast(text, isAlert = false, duration = 2200) {
  if (!text) return;
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
