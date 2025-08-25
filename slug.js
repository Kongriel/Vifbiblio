const SUPABASE_REST = "https://dzmeucgmyzfsizwbxafz.supabase.co/rest/v1";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6bWV1Y2dteXpmc2l6d2J4YWZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxMTQ3ODcsImV4cCI6MjA3MTY5MDc4N30.jNI3dAZ7ro31kZqmhBleuh4CzUKtnlG4i5etbBm9ALk";

const params = new URLSearchParams(window.location.search);
const itemId = params.get("id");

// Favorites helpers
function getFavorites() {
  try {
    return JSON.parse(localStorage.getItem("favorites")) || [];
  } catch {
    return [];
  }
}
function setFavorites(favs) {
  localStorage.setItem("favorites", JSON.stringify(favs));
}

function updateFavoriteButton(itemId) {
  const favorites = getFavorites().map(String);
  const btn = document.getElementById("favorite-btn");
  if (favorites.includes(String(itemId))) {
    btn.textContent = "⭐";
  } else {
    btn.textContent = "☆";
  }
}

function toggleFavorite(itemId) {
  let favorites = getFavorites().map(String);
  if (favorites.includes(String(itemId))) {
    favorites = favorites.filter((id) => id !== String(itemId));
  } else {
    favorites.push(String(itemId));
  }
  setFavorites(favorites);
  updateFavoriteButton(itemId);
}

document.getElementById("favorite-btn").addEventListener("click", () => {
  toggleFavorite(itemId);
});

// Fetch one row
async function fetchItemDetails() {
  try {
    const url = `${SUPABASE_REST}/spring?id=eq.${encodeURIComponent(itemId)}&select=id,title,description,youtube_id,category`;
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

  updateFavoriteButton(item.id);
}

document.addEventListener("DOMContentLoaded", fetchItemDetails);
