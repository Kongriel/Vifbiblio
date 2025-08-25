// ----- konfig -----
const SUPABASE_REST = "https://dzmeucgmyzfsizwbxafz.supabase.co/rest/v1";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6bWV1Y2dteXpmc2l6d2J4YWZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxMTQ3ODcsImV4cCI6MjA3MTY5MDc4N30.jNI3dAZ7ro31kZqmhBleuh4CzUKtnlG4i5etbBm9ALk";
const TABLE = "spring";

// ----- favorites utils -----
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

// ----- hent og render -----
async function loadFavorites() {
  const favs = getFavorites();
  const grid = document.getElementById("grid");
  const empty = document.getElementById("empty");
  grid.innerHTML = "";

  if (!favs.length) {
    empty.style.display = "block";
    return;
  }

  // id=in.(1,2,3) — virker når dine ids er numeriske
  const list = favs.join(",");
  const url = `${SUPABASE_REST}/${TABLE}?id=in.(${list})&select=id,title,description,youtube_id,category&limit=200`;

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

    if (!rows.length) {
      empty.style.display = "block";
      return;
    }
    empty.style.display = "none";

    rows.forEach((v) => {
      const wrap = document.createElement("div");
      wrap.className = "card";
      wrap.innerHTML = `
        <a href="slug.html?id=${v.id}">
        <div style="color:white; text-align:center; padding-bottom:1rem; font-size:1.3rem;" class="title">${v.title}</div>
          <img class="thumb" src="https://img.youtube.com/vi/${v.youtube_id}/hqdefault.jpg" alt="${v.title}">
          
          <div style="padding:1rem 0;" class="desc">${v.description || ""}</div>
        </a>
        <button class="favorite-button" title="Fjern/tilføj favorit" aria-label="Toggle favorit">
          ${isFav(v.id) ? "⭐️" : "☆"}
        </button>
      `;

      const btn = wrap.querySelector(".favorite-button");
      btn.addEventListener("click", (e) => {
        e.preventDefault(); // klik på stjerne skal ikke åbne linket
        e.stopPropagation();
        toggleFav(v.id);
        btn.textContent = isFav(v.id) ? "⭐️" : "☆";
        // hvis ikke længere favorit → fjern kort
        if (!isFav(v.id)) {
          wrap.remove();
          if (!getFavorites().length) empty.style.display = "block";
        }
      });

      grid.appendChild(wrap);
    });
  } catch (e) {
    console.error(e);
    empty.style.display = "block";
  }
}

document.addEventListener("DOMContentLoaded", loadFavorites);
