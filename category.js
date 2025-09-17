// --- Konfiguration ---
const SUPABASE_REST = "https://dzmeucgmyzfsizwbxafz.supabase.co/rest/v1";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6bWV1Y2dteXpmc2l6d2J4YWZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxMTQ3ODcsImV4cCI6MjA3MTY5MDc4N30.jNI3dAZ7ro31kZqmhBleuh4CzUKtnlG4i5etbBm9ALk";
const TABLE = "spring";

// --- Favoritter ---
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
  let f = getFavorites();
  if (f.includes(s)) f = f.filter((x) => x !== s);
  else f.push(s);
  setFavorites(f);
  return f;
}

// --- Hjælpere ---
const difficultyOrder = { Begynder: 1, Øvet: 2, Advanceret: 3 };
function sortByDifficultyThenTitle(items) {
  return items.slice().sort((a, b) => {
    const da = difficultyOrder[a.difficulty] || 99;
    const db = difficultyOrder[b.difficulty] || 99;
    if (da !== db) return da - db;
    const ta = (a.title || "").toLowerCase();
    const tb = (b.title || "").toLowerCase();
    return ta.localeCompare(tb, "da");
  });
}
function thumb(item) {
  return item.youtube_id ? `https://img.youtube.com/vi/${item.youtube_id}/hqdefault.jpg` : item.image_url || "img/placeholder.jpg";
}
function card(item) {
  const el = document.createElement("div");
  el.className = "card";
  el.innerHTML = `
    <a class="card-link" href="slug.html?id=${item.id}" aria-label="Åbn ${item.title}">
      
      <img class="thumb" src="${thumb(item)}" alt="${item.title}">
      <h3 style="text-align: left; margin-top: .8rem; margin-bottom:.8rem;">${item.title}</h3>
      <p style="text-align: left;">${item.description || ""}</p>
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

const SUB_ORDER = {
  Bane: ["Forlæns", "Baglæns", "Skrue", "Dobbelt roterende"],
  Trampolin: ["Saltoer", "Skrue", "Dobbelt roterende"],
};

// --- Rendering (grupperet for Springopstillinger) ---
function renderSection(container, title, items, subOrder) {
  if (!items.length) return;
  const sec = document.createElement("section");
  sec.className = "section";
  sec.innerHTML = `<h2>${title}</h2>`;
  container.appendChild(sec);

  const noSub = sortByDifficultyThenTitle(items.filter((x) => !x.sub_type));
  const withSub = items.filter((x) => x.sub_type);

  if (noSub.length) {
    const sg = document.createElement("div");
    sg.className = "subgroup";
    sg.innerHTML = `<h3>Uden underkategori</h3>`;
    const grid = makeGrid();
    noSub.forEach((it) => grid.appendChild(card(it)));
    sg.appendChild(grid);
    sec.appendChild(sg);
  }

  // Kendte underkategorier i fast rækkefølge
  (subOrder || []).forEach((sub) => {
    const list = sortByDifficultyThenTitle(withSub.filter((x) => x.sub_type === sub));
    if (!list.length) return;
    const sg = document.createElement("div");
    sg.className = "subgroup";
    sg.innerHTML = `<h3>${sub}</h3>`;
    const grid = makeGrid();
    list.forEach((it) => grid.appendChild(card(it)));
    sg.appendChild(grid);
    sec.appendChild(sg);
  });

  // Ukendte bagerst
  const known = new Set(subOrder || []);
  const otherSubs = Array.from(new Set(withSub.map((x) => x.sub_type))).filter((s) => !known.has(s));
  otherSubs.forEach((sub) => {
    const list = sortByDifficultyThenTitle(withSub.filter((x) => x.sub_type === sub));
    if (!list.length) return;
    const sg = document.createElement("div");
    sg.className = "subgroup";
    sg.innerHTML = `<h3>${sub}</h3>`;
    const grid = makeGrid();
    list.forEach((it) => grid.appendChild(card(it)));
    sg.appendChild(grid);
    sec.appendChild(sg);
  });
}

function renderSpring(items) {
  const root = document.getElementById("items-container");
  root.innerHTML = "";
  const bane = [],
    tramp = [];
  items.forEach((i) => {
    if (i.main_type === "Trampolin") tramp.push(i);
    else if (i.main_type === "Bane") bane.push(i);
    else bane.push(i);
  });
  renderSection(root, "Bane", bane, SUB_ORDER.Bane);
  renderSection(root, "Trampolin", tramp, SUB_ORDER.Trampolin);
}

function renderFlat(items) {
  const root = document.getElementById("items-container");
  root.innerHTML = "";
  const grid = makeGrid();
  sortByDifficultyThenTitle(items).forEach((i) => grid.appendChild(card(i)));
  root.appendChild(grid);
}

// --- Datahentning ---
function buildQuery(category) {
  const params = [`category=eq.${encodeURIComponent(category)}`, `select=id,title,description,youtube_id,image_url,category,main_type,sub_type,difficulty`, "order=id.desc"];
  return `${SUPABASE_REST}/${TABLE}?${params.join("&")}`;
}

async function fetchItems(category) {
  const res = await fetch(buildQuery(category), {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ================== FILTER STATE ==================
let RAW_ITEMS = []; // fulde datasæt fra Supabase (Springopstillinger)
let FILTER_DIFF = "Alle"; // "Alle" | "Begynder" | "Øvet" | "Advanceret"
let FILTER_MAIN = null; // null (begge) | "Bane" | "Trampolin"

function applyFiltersAndRender() {
  const category = new URLSearchParams(location.search).get("category");
  if (category !== "Springopstillinger") {
    // andre kategorier — brug RAW_ITEMS direkte
    renderFlat(RAW_ITEMS);
    return;
  }

  let data = RAW_ITEMS.slice();
  // filter difficulty
  if (FILTER_DIFF && FILTER_DIFF !== "Alle") {
    data = data.filter((x) => x.difficulty === FILTER_DIFF);
  }
  // filter main_type
  if (FILTER_MAIN) {
    data = data.filter((x) => x.main_type === FILTER_MAIN);
  }
  renderSpring(data);
}

function setupFiltersIfSpring() {
  const category = new URLSearchParams(location.search).get("category");
  const filtersEl = document.getElementById("filters");
  if (!filtersEl) return;

  if (category === "Springopstillinger") {
    filtersEl.style.display = "block";

    // Default: difficulty = Alle, main = null (begge)
    // Marker "Alle" aktiv fra start
    const diffButtons = [...document.querySelectorAll("[data-diff]")];
    const mainButtons = [...document.querySelectorAll("[data-main]")];

    function updateDiffUI() {
      diffButtons.forEach((b) => {
        b.classList.toggle("active", b.getAttribute("data-diff") === FILTER_DIFF);
      });
    }
    function updateMainUI() {
      mainButtons.forEach((b) => {
        b.classList.toggle("active", b.getAttribute("data-main") === FILTER_MAIN);
      });
    }

    diffButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        FILTER_DIFF = btn.getAttribute("data-diff"); // single choice
        updateDiffUI();
        applyFiltersAndRender();
      });
    });

    mainButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const val = btn.getAttribute("data-main");
        // eksklusiv toggle: klik på aktiv => nulstil (vis begge)
        FILTER_MAIN = FILTER_MAIN === val ? null : val;
        updateMainUI();
        applyFiltersAndRender();
      });
    });

    // init UI
    updateDiffUI(); // sætter Alle aktiv
    updateMainUI(); // ingen valgt = begge
  } else {
    filtersEl.style.display = "none";
  }
}

// --- Init ---
document.addEventListener("DOMContentLoaded", async () => {
  const category = new URLSearchParams(location.search).get("category");
  if (!category) return;

  try {
    const data = await fetchItems(category);
    RAW_ITEMS = data || [];

    // vis filtre hvis Springopstillinger
    setupFiltersIfSpring();

    // første render (ufiltreret eller afhængig af defaults)
    if (category === "Springopstillinger") applyFiltersAndRender();
    else renderFlat(RAW_ITEMS);
  } catch (e) {
    console.error(e);
  }
});
