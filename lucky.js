const SUPABASE_REST = "https://dzmeucgmyzfsizwbxafz.supabase.co/rest/v1";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6bWV1Y2dteXpmc2l6d2J4YWZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxMTQ3ODcsImV4cCI6MjA3MTY5MDc4N30.jNI3dAZ7ro31kZqmhBleuh4CzUKtnlG4i5etbBm9ALk";
const TABLE = "spring";

const ss = window.sessionStorage;

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
function pickCountForCategory(cat) {
  return cat && cat.toLowerCase() === "lege" ? 3 : 6;
}
function thumbSrc(row) {
  return row.youtube_id ? `https://img.youtube.com/vi/${row.youtube_id}/hqdefault.jpg` : row.image_url || "img/placeholder.jpg";
}
function cardHTML(v) {
  return `
    <a style="color:white; text-decoration:none; margin-bottom:1rem;" href="slug.html?id=${v.id}">
      <div class="card">
      <div style="padding-bottom:0.5rem; text-align:center;" class="title">${v.title}</div>
        <img class="thumb" src="${thumbSrc(v)}" alt="${v.title}">
        
        <div style="text-align: center; padding-top: 1rem; padding-bottom:0.5rem;" class="desc">${v.description || ""}</div>
        ${v.difficulty ? `<span class="badge">${v.difficulty}</span>` : ""}
      </div>
    </a>
  `;
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
async function fetchCategorySample(category, limitFetch = 200) {
  const url = `${SUPABASE_REST}/${TABLE}?category=eq.${encodeURIComponent(category)}&select=id,title,description,youtube_id,image_url,category,difficulty&order=id.desc&limit=${limitFetch}`;
  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      Accept: "application/json",
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function parseIds(s) {
  try {
    const arr = JSON.parse(s);
    return Array.isArray(arr) ? arr.map(String) : null;
  } catch {
    return null;
  }
}
function saveIds(key, ids) {
  ss.setItem(key, JSON.stringify(ids.map(String)));
}
function parseDiffs() {
  const p = new URLSearchParams(location.search);
  const raw = (p.get("diffs") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const allowed = new Set(["Begynder", "Øvet", "Advanceret"]);
  return raw.filter((x) => allowed.has(x));
}
function diffsKey(diffs) {
  return diffs && diffs.length ? `_${diffs.join("-")}` : "";
}

async function loadLucky() {
  const params = new URLSearchParams(location.search);
  const category = params.get("category");
  const diffs = parseDiffs();
  const subtitle = document.getElementById("subtitle");
  const empty = document.getElementById("empty");

  try {
    if (category) {
      const count = pickCountForCategory(category);
      if (subtitle) subtitle.textContent = `Kategori: ${category}${diffs.length && category === "Springopstillinger" ? ` (filtreret: ${diffs.join(", ")})` : ""}`;
      const key = `lucky_cat_${category}${category === "Springopstillinger" ? diffsKey(diffs) : ""}`;
      let ids = parseIds(ss.getItem(key));

      let rows;
      if (ids && ids.length) {
        rows = await fetchByIds(ids);
      } else {
        const sample = await fetchCategorySample(category);
        const filtered = category === "Springopstillinger" && diffs.length ? sample.filter((r) => r.difficulty && diffs.includes(r.difficulty)) : sample;
        const chosen = shuffle(filtered.slice()).slice(0, count);
        ids = chosen.map((r) => r.id);
        saveIds(key, ids);
        rows = chosen;
      }

      const sec = document.getElementById("sec-category");
      const grid = document.getElementById("grid-category");
      const title = document.getElementById("cat-title");
      if (title) title.textContent = `${category} (${count} tilfældige)`;
      if (grid) grid.innerHTML = rows.map(cardHTML).join("");
      if (sec) sec.style.display = rows.length ? "block" : "none";
      if (empty) empty.style.display = rows.length ? "none" : "block";
      return;
    }

    // HOME-MODE
    if (subtitle) subtitle.textContent = diffs.length ? `2 Lege og 6 Springstationer ( ${diffs.join(", ")})` : "Blandet: 2 Lege + 6 Springopstillinger";

    const keyLege = "lucky_home_lege";
    const keySpring = `lucky_home_spring${diffsKey(diffs)}`;

    let legeIds = parseIds(ss.getItem(keyLege));
    let springIds = parseIds(ss.getItem(keySpring));

    let legeRows, springRows;

    if (legeIds && legeIds.length) {
      legeRows = await fetchByIds(legeIds);
    } else {
      const sampleLege = await fetchCategorySample("Lege");
      const pickLege = shuffle(sampleLege.slice()).slice(0, 2);
      legeIds = pickLege.map((r) => r.id);
      saveIds(keyLege, legeIds);
      legeRows = pickLege;
    }

    if (springIds && springIds.length) {
      springRows = await fetchByIds(springIds);
    } else {
      const sampleSpring = await fetchCategorySample("Springopstillinger");
      const filtered = diffs.length ? sampleSpring.filter((r) => r.difficulty && diffs.includes(r.difficulty)) : sampleSpring;
      const pickSpring = shuffle(filtered.slice()).slice(0, 6);
      springIds = pickSpring.map((r) => r.id);
      saveIds(keySpring, springIds);
      springRows = pickSpring;
    }

    const secLege = document.getElementById("sec-lege");
    const gridLege = document.getElementById("grid-lege");
    if (gridLege) gridLege.innerHTML = legeRows.map(cardHTML).join("");
    if (secLege) secLege.style.display = legeRows.length ? "block" : "none";

    const secSpring = document.getElementById("sec-spring");
    const gridSpring = document.getElementById("grid-spring");
    if (gridSpring) gridSpring.innerHTML = springRows.map(cardHTML).join("");
    if (secSpring) secSpring.style.display = springRows.length ? "block" : "none";

    if (empty) empty.style.display = legeRows.length + springRows.length ? "none" : "block";
  } catch (e) {
    console.error(e);
    if (empty) empty.style.display = "block";
  }
}

function reshuffleCurrent() {
  const params = new URLSearchParams(location.search);
  const category = params.get("category");
  const diffs = parseDiffs();

  if (category) {
    const key = `lucky_cat_${category}${category === "Springopstillinger" ? diffsKey(diffs) : ""}`;
    ss.removeItem(key);
  } else {
    ss.removeItem("lucky_home_lege");
    ss.removeItem(`lucky_home_spring${diffsKey(diffs)}`);
  }
  loadLucky();
}

document.addEventListener("DOMContentLoaded", () => {
  loadLucky();
  const btn = document.getElementById("reshuffle-btn");
  if (btn) btn.addEventListener("click", reshuffleCurrent);
});
