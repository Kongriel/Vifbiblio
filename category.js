// --- Konfiguration ---
const SUPABASE_REST = "https://dzmeucgmyzfsizwbxafz.supabase.co/rest/v1";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6bWV1Y2dteXpmc2l6d2J4YWZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxMTQ3ODcsImV4cCI6MjA3MTY5MDc4N30.jNI3dAZ7ro31kZqmhBleuh4CzUKtnlG4i5etbBm9ALk";
const TABLE = "spring";

// --- Hjælpere (favorites + kategori) ---
function getCategoryFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("category");
}

// Favorites utils (gem som strenge for sikkerhed)
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

// --- Render ---
function displayItems(items) {
  const container = document.getElementById("items-container");
  container.innerHTML = "";

  items.forEach((item) => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <a class="card-link" href="slug.html?id=${item.id}" aria-label="Åbn ${item.title}">
        <h3>${item.title}</h3>
        <img class="thumb" src="https://img.youtube.com/vi/${item.youtube_id}/hqdefault.jpg" alt="${item.title}">
        <p>${item.description || ""}</p>
      </a>
      <button class="favorite-button" data-id="${item.id}" title="Favorit" aria-label="Toggle favorit">
        ${isFav(item.id) ? "⭐️" : "☆"}
      </button>
    `;
    container.appendChild(card);

    // Favorit-knap: må ikke trigge linket
    const favBtn = card.querySelector(".favorite-button");
    favBtn.addEventListener("click", (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      toggleFav(item.id);
      favBtn.textContent = isFav(item.id) ? "⭐️" : "☆";
    });
  });
}

// --- Data ---
async function fetchItems(category) {
  try {
    if (!category) return;
    const url = `${SUPABASE_REST}/${TABLE}?category=eq.${encodeURIComponent(category)}&select=id,title,description,youtube_id,category&order=id.asc`;
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
  if (category) {
    // Opdater evt. en side-overskrift hvis du har #category-title
    const h = document.getElementById("category-title");
    if (h) h.textContent = category;
    fetchItems(category);
  }
});
