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

function ensureMainRow(dock) {
  let row = document.getElementById("al-dock-row");
  if (!row) {
    row = document.createElement("div");
    row.id = "al-dock-row";
    row.className = "al-dock-row";
    dock.appendChild(row);
  }
  return row;
}

export function slot(name) {
  const id = `al-slot-${name}`;
  let el = document.getElementById(id);
  if (!el) {
    const dock = ensureDock();
    el = document.createElement("div");
    el.id = id;
    el.className = "al-slot";
    if (name === "actions" || name === "switch" || name === "nav") {
      ensureMainRow(dock).appendChild(el);
    } else {
      dock.appendChild(el);
    }
  }
  return el;
}
