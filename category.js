// --- Konfiguration ---
const SUPABASE_REST = "https://dzmeucgmyzfsizwbxafz.supabase.co/rest/v1";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6bWV1Y2dteXpmc2l6d2J4YWZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxMTQ3ODcsImV4cCI6MjA3MTY5MDc4N30.jNI3dAZ7ro31kZqmhBleuh4CzUKtnlG4i5etbBm9ALk";

// --- Hjælpere ---
function getCategoryFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("category");
}

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

function updateFavoriteButtonState(button, itemId) {
  const favorites = getFavorites().map(String);
  if (favorites.includes(String(itemId))) {
    button.textContent = "⭐️";
  } else {
    button.textContent = "☆";
  }
}

function toggleFavorite(e) {
  const btn = e.currentTarget;
  const itemId = btn.getAttribute("data-id");
  let favorites = getFavorites().map(String);

  if (favorites.includes(String(itemId))) {
    favorites = favorites.filter((id) => id !== String(itemId));
  } else {
    favorites.push(String(itemId));
  }
  setFavorites(favorites);
  updateFavoriteButtonState(btn, itemId);
}

// --- Render ---
function displayItems(items) {
  const container = document.getElementById("items-container");
  container.innerHTML = "";

  items.forEach((item) => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <a href="slug.html?id=${item.id}">
        <h3>${item.title}</h3>
        <img class="thumb" src="https://img.youtube.com/vi/${item.youtube_id}/hqdefault.jpg" alt="${item.title}">
        <p>${item.description || ""}</p>
      </a>
      <button class="favorite-button" data-id="${item.id}" title="Favorit">☆</button>
    `;
    container.appendChild(card);

    const favBtn = card.querySelector(".favorite-button");
    updateFavoriteButtonState(favBtn, item.id);
    favBtn.addEventListener("click", (ev) => {
      ev.preventDefault(); // så linket ikke åbner når man trykker stjerne
      toggleFavorite(ev);
    });
  });
}

// --- Data ---
async function fetchItems(category) {
  try {
    // Filtrer på category-kolonnen; begræns felter vi henter
    const url = `${SUPABASE_REST}/spring?category=eq.${encodeURIComponent(category)}&select=id,title,description,youtube_id,category&order=id.asc`;
    const response = await fetch(url, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Accept: "application/json",
      },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    console.log("Supabase data:", data);
    displayItems(data);
  } catch (err) {
    console.error("Fetch error:", err);
  }
}

// --- Init ---
document.addEventListener("DOMContentLoaded", () => {
  const category = getCategoryFromUrl();
  if (category) fetchItems(category);
});
