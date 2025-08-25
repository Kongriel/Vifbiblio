const SUPABASE_REST = "https://dzmeucgmyzfsizwbxafz.supabase.co/rest/v1";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6bWV1Y2dteXpmc2l6d2J4YWZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxMTQ3ODcsImV4cCI6MjA3MTY5MDc4N30.jNI3dAZ7ro31kZqmhBleuh4CzUKtnlG4i5etbBm9ALk";
const TABLE = "spring";

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

async function loadLuckyByCategory() {
  const params = new URLSearchParams(location.search);
  const category = params.get("category");

  const subtitle = document.getElementById("subtitle");
  subtitle.textContent = category ? `Kategori: ${category}` : "Ingen kategori angivet";

  if (!category) {
    document.getElementById("empty").style.display = "block";
    return;
  }

  try {
    // Hent op til 200 i kategorien, shuffle og tag 6
    const url = `${SUPABASE_REST}/${TABLE}?category=eq.${encodeURIComponent(category)}&select=id,title,description,youtube_id,category&order=id.desc&limit=200`;
    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Accept: "application/json",
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const rows = await res.json();

    const chosen = shuffle(rows.slice()).slice(0, 6);
    render(chosen);
  } catch (e) {
    console.error(e);
    document.getElementById("empty").style.display = "block";
  }
}

function render(items) {
  const grid = document.getElementById("grid");
  const empty = document.getElementById("empty");
  grid.innerHTML = "";

  if (!items || !items.length) {
    empty.style.display = "block";
    return;
  }
  empty.style.display = "none";

  items.forEach((v) => {
    const a = document.createElement("a");
    a.href = `slug.html?id=${v.id}`;
    a.innerHTML = `
      <div class="card">
      <div style="color:white; text-align:center;" class="title">${v.title}</div>
        <img class="thumb" src="https://img.youtube.com/vi/${v.youtube_id}/hqdefault.jpg" alt="${v.title}">
        
        <div style="padding-top:1rem;" class="desc">${v.description || ""}</div>
      </div>
    `;
    grid.appendChild(a);
  });
}

document.addEventListener("DOMContentLoaded", loadLuckyByCategory);
