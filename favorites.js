const SUPABASE_URL = "https://ixhjxdppcksildbncfml.supabase.co/rest/v1/items";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4aGp4ZHBwY2tzaWxkYm5jZm1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjU5NjQyMjcsImV4cCI6MjA0MTU0MDIyN30.Ulqb4EiLp61jf5lZNwxpyZ7g4DX8faJ9BwxkCSH0gXs";

async function fetchFavoriteItems() {
  const favoriteIds = JSON.parse(localStorage.getItem("favorites")) || [];

  if (favoriteIds.length === 0) {
    document.getElementById("items-container").innerHTML = '<p class="no-favorites">You have no favorite items yet.</p>';
    return;
  }

  try {
    const url = `${SUPABASE_URL}?id=in.(${favoriteIds.join(",")})`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    displayItems(data);
  } catch (error) {
    console.error("Fetch error:", error);
  }
}

function displayItems(items) {
  const container = document.getElementById("items-container");
  container.innerHTML = ""; // Clear container before displaying items
  items.forEach((item) => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
            <a href="slug.html?id=${item.id}">
                <h2>${item.title}</h2>
                <img src="img/${item.image}" alt="${item.title}">
                <p>${item.shortdescription}</p>
            </a>
            <button class="favorite-button" data-id="${item.id}">⭐</button>
        `;
    container.appendChild(card);
  });

  // Add event listeners to all favorite buttons
  document.querySelectorAll(".favorite-button").forEach((button) => {
    button.addEventListener("click", (event) => {
      const itemId = event.target.getAttribute("data-id");
      toggleFavorite(itemId);
    });
  });
}

// Toggle favorite status and update the localStorage
function toggleFavorite(itemId) {
  let favoriteIds = JSON.parse(localStorage.getItem("favorites")) || [];

  if (favoriteIds.includes(itemId)) {
    // If item is already a favorite, remove it
    favoriteIds = favoriteIds.filter((id) => id !== itemId);
  } else {
    // Otherwise, add it to the favorites
    favoriteIds.push(itemId);
  }

  localStorage.setItem("favorites", JSON.stringify(favoriteIds));

  // Re-fetch favorite items to update the display
  fetchFavoriteItems();
}

document.addEventListener("DOMContentLoaded", () => {
  fetchFavoriteItems();
});
