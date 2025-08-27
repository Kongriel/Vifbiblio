// --- Konfiguration ---
const SUPABASE_REST = "https://dzmeucgmyzfsizwbxafz.supabase.co/rest/v1";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6bWV1Y2dteXpmc2l6d2J4YWZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxMTQ3ODcsImV4cCI6MjA3MTY5MDc4N30.jNI3dAZ7ro31kZqmhBleuh4CzUKtnlG4i5etbBm9ALk";
const TABLE = "spring";

// --- Sværheds-sortering + alfabetisk titel ---
const difficultyOrder = { Begynder: 1, Øvet: 2, Advanceret: 3 };
function sortByDifficultyAndTitle(items) {
  return items.slice().sort((a, b) => {
    const da = difficultyOrder[a.difficulty] ?? 99;
    const db = difficultyOrder[b.difficulty] ?? 99;
    if (da !== db) return da - db;
    // Dansk alfabetisk sortering som sekundær nøgle
    return (a.title || "").localeCompare(b.title || "", "da", { sensitivity: "base" });
  });
}

// --- Utils ---
function getCategoryFromUrl() {
  return new URLSearchParams(location.search).get("category");
}
function getFavorites() {
  try {
    return (JSON.parse(localStorage.getItem("favorites")) || []).map(String);
  } catch {
    return [];
  }
}
function setFavorites(f) {
  localStorage.setItem("favorites", JSON.stringify(f.map(String)));
}
function isFav(id) {
  return getFavorites().includes(String(id));
}
function toggleFav(id) {
  const s = String(id);
  let favs = getFavorites();
  if (favs.includes(s)) favs = favs.filter((x) => x !== s);
  else favs.push(s);
  setFavorites(favs);
  return favs;
}

function thumb(item) {
  return item.youtube_id ? `https://img.youtube.com/vi/${item.youtube_id}/hqdefault.jpg` : item.image_url || "img/placeholder.jpg";
}

// --- Card komponent ---
function card(item) {
  const el = document.createElement("div");
  el.className = "card";
  el.innerHTML = `
    <a class="card-link" href="slug.html?id=${item.id}" aria-label="Åbn ${item.title}">
      <h3 style="padding-bottom: 1rem;">${item.title}</h3>
      <img class="thumb" src="${thumb(item)}" alt="${item.title}">
      <p style="margin-top: 0.8rem;">${item.description || ""}</p>
      ${item.difficulty ? `<span class="badge">${item.difficulty}</span>` : ""}
    </a>
    <button class="favorite-button" data-id="${item.id}" title="Favorit" aria-label="Toggle favorit">
      ${isFav(item.id) ? "⭐️" : "☆"}
    </button>
  `;
  const btn = el.querySelector(".favorite-button");
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFav(item.id);
    btn.textContent = isFav(item.id) ? "⭐️" : "☆";
  });
  return el;
}

function makeGrid() {
  const g = document.createElement("div");
  g.className = "grid";
  return g;
}

// Fast rækkefølge for underkategorier
const SUB_ORDER = {
  Bane: ["Forlæns", "Baglæns", "Skrue", "Dobbelt roterende"],
  Trampolin: ["Saltoer", "Skrue", "Dobbelt roterende"],
};

// --- Sektion-render (med sortering per underkategori) ---
function renderSection(container, title, items, subOrder) {
  if (!items.length) return;

  const sec = document.createElement("section");
  sec.className = "section";
  sec.innerHTML = `<h2>${title}</h2>`;
  container.appendChild(sec);

  const noSub = items.filter((x) => !x.sub_type);
  const withSub = items.filter((x) => x.sub_type);

  // 1) Uden underkategori (sortér: Begynder -> Øvet -> Advanceret, derefter titel A-Å)
  if (noSub.length) {
    const sg = document.createElement("div");
    sg.className = "subgroup";
    sg.innerHTML = `<h3>Uden underkategori</h3>`;
    const grid = makeGrid();
    sortByDifficultyAndTitle(noSub).forEach((it) => grid.appendChild(card(it)));
    sg.appendChild(grid);
    sec.appendChild(sg);
  }

  // 2) Kendte underkategorier i fast rækkefølge (hver liste sorteres)
  (subOrder || []).forEach((sub) => {
    const list = withSub.filter((x) => x.sub_type === sub);
    if (!list.length) return;

    const sg = document.createElement("div");
    sg.className = "subgroup";
    sg.innerHTML = `<h3>${sub}</h3>`;
    const grid = makeGrid();
    sortByDifficultyAndTitle(list).forEach((it) => grid.appendChild(card(it)));
    sg.appendChild(grid);
    sec.appendChild(sg);
  });

  // 3) Ukendte sub_types bagerst (failsafe – også sorteret)
  const known = new Set(subOrder || []);
  const otherSubs = Array.from(new Set(withSub.map((x) => x.sub_type))).filter((s) => !known.has(s));
  otherSubs.forEach((sub) => {
    const list = withSub.filter((x) => x.sub_type === sub);
    if (!list.length) return;

    const sg = document.createElement("div");
    sg.className = "subgroup";
    sg.innerHTML = `<h3>${sub}</h3>`;
    const grid = makeGrid();
    sortByDifficultyAndTitle(list).forEach((it) => grid.appendChild(card(it)));
    sg.appendChild(grid);
    sec.appendChild(sg);
  });
}

// --- Springopstillinger (grupperet) ---
function renderSpring(items) {
  const root = document.getElementById("items-container");
  root.innerHTML = "";

  const bane = [];
  const tramp = [];
  items.forEach((i) => {
    if (i.main_type === "Trampolin") tramp.push(i);
    else if (i.main_type === "Bane") bane.push(i);
    else bane.push(i); // fallback hvis main_type mangler
  });

  renderSection(root, "Bane", bane, SUB_ORDER.Bane);
  renderSection(root, "Trampolin", tramp, SUB_ORDER.Trampolin);
}

// --- Andre kategorier (fladt grid) ---
function renderFlat(items) {
  const root = document.getElementById("items-container");
  root.innerHTML = "";
  const grid = makeGrid();
  // Sortér også fladt view hvis der er difficulty (ingen skade hvis null)
  sortByDifficultyAndTitle(items).forEach((i) => grid.appendChild(card(i)));
  root.appendChild(grid);
}

// --- Data ---
function buildQuery(category) {
  const params = [`category=eq.${encodeURIComponent(category)}`, `select=id,title,description,youtube_id,image_url,category,main_type,sub_type,difficulty`, "order=id.desc"];
  return `${SUPABASE_REST}/${TABLE}?${params.join("&")}`;
}

async function fetchItems(category) {
  try {
    const res = await fetch(buildQuery(category), {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Accept: "application/json",
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (category === "Springopstillinger") renderSpring(data);
    else renderFlat(data);
  } catch (e) {
    console.error(e);
  }
}

// --- Init ---
document.addEventListener("DOMContentLoaded", () => {
  const category = getCategoryFromUrl();
  if (!category) return;
  fetchItems(category);
});
