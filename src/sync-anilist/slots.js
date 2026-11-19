/** Fixed, DOM-independent mount points (bottom-right dock): the site's markup is never an anchor. */
export function slot(name) {
  const id = `al-slot-${name}`;
  let el = document.getElementById(id);
  if (!el) {
    let dock = document.getElementById("al-dock");
    if (!dock) {
      dock = document.createElement("div");
      dock.id = "al-dock";
      (document.body || document.documentElement).appendChild(dock);
    }
    el = document.createElement("div");
    el.id = id;
    el.className = "al-slot";
    dock.appendChild(el);
  }
  return el;
}
