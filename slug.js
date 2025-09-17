// --- Konfiguration ---
const SUPABASE_REST = "https://dzmeucgmyzfsizwbxafz.supabase.co/rest/v1";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6bWV1Y2dteXpmc2l6d2J4YWZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxMTQ3ODcsImV4cCI6MjA3MTY5MDc4N30.jNI3dAZ7ro31kZqmhBleuh4CzUKtnlG4i5etbBm9ALk";
const TABLE = "spring";

const params = new URLSearchParams(window.location.search);
const itemId = params.get("id");

// --- Favorites utils ---
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
    const url = `${SUPABASE_REST}/${TABLE}?id=eq.${encodeURIComponent(itemId)}&select=id,title,description,long_description,youtube_id,image_url,main_type,sub_type,difficulty`;
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

  // Long description under description
  const longEl = document.getElementById("long-description");
  if (longEl) {
    const longText = item.long_description || "";
    if (longText.trim().length) {
      longEl.style.display = "block";
      longEl.textContent = longText;
    } else {
      longEl.style.display = "none";
      longEl.textContent = "";
    }
  }

  // Video eller billede
  const videoWrap = document.getElementById("video-wrap");
  if (item.youtube_id) {
    videoWrap.innerHTML = `
      <iframe
        class="player"
        src="https://www.youtube.com/embed/${item.youtube_id}"
        title="${item.title}"
        allow="autoplay; encrypted-media; fullscreen"
        allowfullscreen
      ></iframe>
    `;
  } else {
    const src = item.image_url || "img/placeholder.jpg";
    videoWrap.innerHTML = `<img class="player-img" src="${src}" alt="${item.title}">`;
  }

  // Badges på HOVED-ITEM: main_type + sub_type + difficulty
  const metaWrap = document.getElementById("meta-badges");
  if (metaWrap) {
    const parts = [];
    if (item.main_type) parts.push(`<span class="badge">${item.main_type}</span>`);
    if (item.sub_type) parts.push(`<span class="badge">${item.sub_type}</span>`);
    if (item.difficulty) parts.push(`<span class="badge">${item.difficulty}</span>`);
    metaWrap.innerHTML = parts.join(" ");
    metaWrap.style.display = parts.length ? "flex" : "none";
  }

  // Favoritknap
  updateFavoriteButton(item.id);
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

  const orParts = words.map((w) => `title.ilike.*${encodeURIComponent(w)}*`).join(",");
  // SELECT kun felter vi viser for lignende (kun difficulty som badge)
  const qs = [`or=(${orParts})`, `id=neq.${encodeURIComponent(item.id)}`, "select=id,title,description,youtube_id,image_url,difficulty", "order=id.desc", "limit=6"].join("&");

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
    const thumb = v.youtube_id ? `https://img.youtube.com/vi/${v.youtube_id}/hqdefault.jpg` : v.image_url || "img/placeholder.jpg";
    const a = document.createElement("a");
    a.href = `slug.html?id=${v.id}`;
    a.style.display = "block";
    a.style = "text-decoration:none;";
    a.innerHTML = `
      <div class="card">
       
        <img style="width:100%;border-radius:8px" src="${thumb}" alt="${v.title}">
         <h3 style="color:white; padding-left: 12px;! text-align:left; padding-bottom: 0px; font-size:1rem">${v.title}</h3>
        <p style="color:#aaa; padding-left: 12px;! text-align:left; margin-top:-5px; font-size:.8rem">${v.description || ""}</p>
        <div>
          ${v.difficulty ? `<span style="margin-left:6px;!; margin-bottom: 12px;!" class="badge">${v.difficulty}</span>` : ""}
        </div>
      </div>
    `;
    grid.appendChild(a);
  });
}

document.addEventListener("DOMContentLoaded", fetchItemDetails);
