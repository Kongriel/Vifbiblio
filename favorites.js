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

// ----- helpers -----
function thumbSrc(row) {
  return row.youtube_id ? `https://img.youtube.com/vi/${row.youtube_id}/hqdefault.jpg` : row.image_url || "img/placeholder.jpg";
}

function cardHTML(v) {
  return `
    <a style="color:white; margin-bottom:1.3rem; text-decoration: none;" href="slug.html?id=${v.id}">
      <div class="card">
      
        <img class="thumb" src="${thumbSrc(v)}" alt="${v.title}">
        <div class="title" style="margin:.5rem 0; padding-left:12px; font-weight:700; padding-top:.3rem; text-align: left;">${v.title}</div>

        <div class="desc" style="color:#aaa;font-size:.9rem; padding-left:12px; padding-bottom:1rem;">${v.description || ""}</div>
        ${v.difficulty ? `<span style="margin-left:12px;" class="badge">${v.difficulty}</span>` : ""}
        <button class="favorite-button" data-id="${v.id}" title="Fjern/tilføj favorit" aria-label="Toggle favorit">
          ${isFav(v.id) ? "⭐️" : "☆"}
        </button>
      </div>
    </a>
  `;
}

// Rækkefølge: standard + mulighed for fokus (flyt fokus-kategori først)
const BASE_ORDER = ["Lege", "Børnegymnastik", "Springopstillinger"];
function orderedCategories(group, focus) {
  const all = Object.keys(group);
  const present = BASE_ORDER.filter((c) => group[c] && group[c].length);
  const others = all.filter((c) => !BASE_ORDER.includes(c) && group[c] && group[c].length);
  let order = [...present, ...others];
  if (focus && order.includes(focus)) {
    order = [focus, ...order.filter((c) => c !== focus)];
  }
  return order;
}

async function fetchByIds(ids) {
  if (!ids || !ids.length) return [];
  const list = ids.join(",");
  const url = `${SUPABASE_REST}/${TABLE}?id=in.(${list})&select=id,title,description,youtube_id,image_url,category,difficulty&limit=${ids.length}`;
  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      Accept: "application/json",
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const rows = await res.json();
  const map = new Map(rows.map((r) => [String(r.id), r]));
  return ids.map((id) => map.get(String(id))).filter(Boolean);
}

function bindStarHandlers(root) {
  root.querySelectorAll(".favorite-button").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const id = btn.getAttribute("data-id");
      toggleFav(id);
      btn.textContent = isFav(id) ? "⭐️" : "☆";
      if (!isFav(id)) {
        const card = btn.closest(".card");
        const aWrapper = card?.parentElement; // <a> wrapper
        const section = btn.closest(".section");
        aWrapper?.remove();
        if (section && section.querySelectorAll(".card").length === 0) {
          section.remove();
          const sections = document.getElementById("sections");
          if (!sections.children.length) {
            document.getElementById("empty").style.display = "block";
          }
        }
      }
    });
  });
}

// ----- hovedflow -----
async function loadFavorites() {
  const gridWrap = document.getElementById("sections");
  const empty = document.getElementById("empty");
  const subtitle = document.getElementById("subtitle");
  gridWrap.innerHTML = "";
  empty.style.display = "none";
  subtitle.textContent = "";

  const favs = getFavorites();
  if (!favs.length) {
    empty.style.display = "block";
    return;
  }

  // Fokus-kategori (hvis linket kom fra en kategori-side)
  const params = new URLSearchParams(location.search);
  const focus = params.get("focus"); // "Lege", "Børnegymnastik" eller "Springopstillinger"
  if (focus) subtitle.textContent = `Fokus: ${focus}`;

  try {
    const rows = await fetchByIds(favs);

    // Grupér efter category
    const group = {};
    rows.forEach((r) => {
      const cat = r.category || "Andet";
      (group[cat] ||= []).push(r);
    });

    const order = orderedCategories(group, focus);
    if (!order.length) {
      empty.style.display = "block";
      return;
    }

    order.forEach((cat) => {
      const items = group[cat];
      if (!items || !items.length) return;

      const section = document.createElement("section");
      section.className = "section";
      section.id = `sec-${cat.toLowerCase().replace(/\s+/g, "-")}`;
      section.innerHTML = `
        <div class="section-header" style="display:flex;align-items:center;justify-content:space-between;gap:.5rem;margin:10px 0 4px;">
          <h2 style="margin:0">${cat}</h2>
          <span class="badge">${items.length} favorit${items.length === 1 ? "" : "ter"}</span>
        </div>
        <div class="grid">
          ${items.map(cardHTML).join("")}
        </div>
      `;
      gridWrap.appendChild(section);
    });

    if (focus) {
      const target = document.getElementById(`sec-${focus.toLowerCase().replace(/\s+/g, "-")}`);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }

    bindStarHandlers(gridWrap);
  } catch (e) {
    console.error(e);
    empty.style.display = "block";
  }
}

document.addEventListener("DOMContentLoaded", loadFavorites);
