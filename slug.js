// --- Konfiguration ---
const SUPABASE_REST = "https://dzmeucgmyzfsizwbxafz.supabase.co/rest/v1";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6bWV1Y2dteXpmc2l6d2J4YWZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxMTQ3ODcsImV4cCI6MjA3MTY5MDc4N30.jNI3dAZ7ro31kZqmhBleuh4CzUKtnlG4i5etbBm9ALk";
const TABLE = "spring";

const params = new URLSearchParams(window.location.search);
const itemId = params.get("id");

// --- Favorites utils (samme som i category.js) ---
function getFavorites() {
  try {
    return (JSON.parse(localStorage.getItem("favorites")) || []).map(String);
  } catch {
    return [];
  }
}
function setFavorites(favs) {
  localStorage.setItem("favorites", JSON.stringify(favs.map(String)));
}
function isFav(id) {
  return getFavorites().includes(String(id));
}
function toggleFav(id) {
  const sId = String(id);
  let favs = getFavorites();
  if (favs.includes(sId)) favs = favs.filter((x) => x !== sId);
  else favs.push(sId);
  setFavorites(favs);
  return favs;
}
function updateFavoriteButton(id) {
  const btn = document.getElementById("favorite-btn");
  if (!btn) return;
  btn.textContent = isFav(id) ? "⭐" : "☆";
}

// --- Hent én række og render ---
async function fetchItemDetails() {
  try {
    const url = `${SUPABASE_REST}/${TABLE}?id=eq.${encodeURIComponent(itemId)}&select=id,title,description,youtube_id,category`;
    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Accept: "application/json",
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const rows = await res.json();
    if (!rows.length) {
      document.getElementById("item-title").textContent = "Item not found";
      return;
    }
    const item = rows[0];
    renderItem(item);
    fetchSimilar(item); // hent lignende
  } catch (e) {
    console.error("Fetch error:", e);
  }
}

function renderItem(item) {
  document.getElementById("item-title").textContent = item.title;
  document.getElementById("item-description").textContent = item.description || "";

  const videoWrap = document.getElementById("video-wrap");
  videoWrap.innerHTML = `
    <iframe
      class="player"
      src="https://www.youtube.com/embed/${item.youtube_id}"
      title="${item.title}"
      allow="autoplay; encrypted-media; fullscreen"
      allowfullscreen
    ></iframe>
  `;

  // Valgfrit badge hvis du har et element med id="badge-category"
  const badge = document.getElementById("badge-category");
  if (badge && item.category) {
    badge.textContent = item.category;
    badge.style.display = "inline-block";
  }

  updateFavoriteButton(item.id);

  // Sørg for at favoritknap toggler uden sideeffekter
  const favBtn = document.getElementById("favorite-btn");
  if (favBtn) {
    favBtn.onclick = (e) => {
      e.preventDefault();
      toggleFav(item.id);
      updateFavoriteButton(item.id);
    };
  }
}

// --- Lignende videoer (match på titel-ord) ---
const STOP_WORDS = new Set(["og", "i", "på", "til", "for", "en", "et", "der", "de", "af", "som", "med", "at", "the", "a", "an", "of", "in", "on"]);

function extractKeywords(title) {
  return title
    .toLowerCase()
    .replace(/[^a-zæøå0-9\s-]/gi, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOP_WORDS.has(w))
    .slice(0, 5);
}

async function fetchSimilar(item) {
  const words = extractKeywords(item.title);
  if (!words.length) {
    renderSimilar([]);
    return;
  }

  // OR-filter over title ILIKE
  const orParts = words.map((w) => `title.ilike.*${encodeURIComponent(w)}*`).join(",");
  const orFilter = `or=(${orParts})`;

  const qs = [orFilter, `id=neq.${encodeURIComponent(item.id)}`, "select=id,title,description,youtube_id,category", "order=id.desc", "limit=6"].join("&");

  const url = `${SUPABASE_REST}/${TABLE}?${qs}`;

  try {
    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Accept: "application/json",
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const rows = await res.json();
    renderSimilar(rows);
  } catch (e) {
    console.error("Similar fetch error:", e);
    renderSimilar([]);
  }
}

function renderSimilar(items) {
  const wrap = document.getElementById("similar-wrap");
  const grid = document.getElementById("similar-grid");
  if (!wrap || !grid) return;

  grid.innerHTML = "";
  if (!items || !items.length) {
    wrap.style.display = "none";
    return;
  }
  wrap.style.display = "block";

  items.forEach((v) => {
    const a = document.createElement("a");
    a.href = `slug.html?id=${v.id}`;
    a.style.display = "block";
    a.innerHTML = `
      <div class="card" style="padding:12px;">
        <img style="width:100%;border-radius:8px" src="https://img.youtube.com/vi/${v.youtube_id}/hqdefault.jpg" alt="${v.title}">
        <h3 style="color:white; margin:8px 0 4px;font-size:1rem">${v.title}</h3>
        <p style="color:#aaa;font-size:.9rem">${v.description || ""}</p>
      </div>
    `;
    grid.appendChild(a);
  });
}

document.addEventListener("DOMContentLoaded", fetchItemDetails);
