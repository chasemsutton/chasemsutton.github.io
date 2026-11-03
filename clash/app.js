"use strict";
// Clash Reference — vanilla JS, hash routing, data in data/*.json.
// Add a category: drop data/<id>.json (same shape as elixir.json) and set "data" for it in data/categories.json.
const $ = (s, el = document) => el.querySelector(s);
const app = $("#app"), titleEl = $("#title"), backBtn = $("#back"), tabsEl = $("#tabs");
const S = {
  th: Number(localStorage.getItem("cr.th") || 15),
  only: localStorage.getItem("cr.only") !== "0",
  tab: localStorage.getItem("cr.tab") || "stats",
  lvl: {}, cur: {},
};
let CATS = null; const CACHE = {};
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmt = (v) => (typeof v === "number" ? v.toLocaleString("en-US") : v);
const mins = (t) => { const g = (re) => { const m = String(t).match(re); return m ? +m[1] : 0; }; return g(/(\d+)d/) * 1440 + g(/(\d+)h/) * 60 + g(/(\d+)m/); };
const fmtMins = (m) => { const d = Math.floor(m / 1440), h = Math.floor((m % 1440) / 60), mm = m % 60; return [d && d + "d", h && h + "h", mm && mm + "m"].filter(Boolean).join(" ") || "0m"; };
const short = (n) => n >= 1e6 ? (n / 1e6).toFixed(n % 1e6 ? 1 : 0).replace(/\.0$/, "") + "M" : n >= 1e3 ? Math.round(n / 1e3) + "K" : String(n);

// ---- settings bar ----
const thSel = $("#thSel");
for (let i = 1; i <= 18; i++) thSel.insertAdjacentHTML("beforeend", `<option value="${i}">Town Hall ${i}</option>`);
function syncSettings() { thSel.value = S.th; $("#onlyTH").checked = S.only; $("#thBadge").textContent = S.th; }
thSel.onchange = () => { S.th = +thSel.value; localStorage.setItem("cr.th", S.th); syncSettings(); render(); };
$("#onlyTH").onchange = (e) => { S.only = e.target.checked; localStorage.setItem("cr.only", S.only ? "1" : "0"); render(); };
$("#settingsBtn").onclick = () => { const p = $("#settings"); p.hidden = !p.hidden; };
backBtn.onclick = () => { const r = route(); location.hash = r.unit ? "#/c/" + r.cat : "#/"; };
tabsEl.querySelectorAll("button").forEach((b) => (b.onclick = () => { S.tab = b.dataset.tab; localStorage.setItem("cr.tab", S.tab); render(); }));

// ---- helpers over a category data file ----
const reqTH = (cat, u, r) => { const lab = +r[r.length - 1]; return lab ? lab + cat.thOffset : u.u; };
const maxAt = (cat, u) => { let m = 0; u.l.forEach((r) => { if (reqTH(cat, u, r) <= S.th) m = +r[0]; }); return m; };
const imgFor = (u, lvl) => {
  if (!u.img || !u.img.length) return u.av;
  for (const [url, range] of u.img) { const [a, b] = String(range).split("-").map(Number); if (lvl >= a && lvl <= (b || a)) return url; }
  return u.img[u.img.length - 1][0];
};
const img = (src, alt, cls = "") => `<img class="${cls}" src="${esc(src)}" alt="${esc(alt)}" loading="lazy" referrerpolicy="no-referrer">`;
async function loadCat(id) {
  const meta = CATS.groups.flatMap((g) => g.cats).find((c) => c.id === id);
  if (!meta || !meta.data) return null;
  if (!CACHE[id]) CACHE[id] = await fetch(meta.data, { cache: "no-cache" }).then((r) => r.json());
  return CACHE[id];
}
function route() { const p = location.hash.replace(/^#\/?/, "").split("/").map(decodeURIComponent); return p[0] === "c" ? { cat: p[1], unit: p[2] } : {}; }

// ---- views ----
function footer() {
  return `<div class="callout"><b>Hammer Jam:</b> every cost and time on this site is the normal, undiscounted value. During Hammer Jam the game takes 50% off upgrade costs and times, so expect half of what's listed while it runs.</div>
  <footer class="src">Sources: stats, costs, times and images from the <a href="https://clashofclans.fandom.com/wiki/Elixir_Troops" target="_blank" rel="noopener">Clash of Clans Fandom wiki</a> (read Nov 3, 2026), including the Oct 20, 2026 balance changes and the 2026 upgrade-time cuts; checked against <a href="https://supercell.com/en/games/clashofclans/blog/" target="_blank" rel="noopener">Supercell's patch notes</a> through Nov 1, 2026. Unofficial fan reference, not affiliated with Supercell.</footer>`;
}
function home() {
  setChrome("Clash Reference", false, false);
  app.innerHTML = CATS.groups.map((g) => `<h2 class="group">${esc(g.heading)}</h2><div class="grid">${g.cats.map((c) => c.data
    ? `<a class="tile" href="#/c/${c.id}">${img(c.img, c.label)}<span class="lbl">${esc(c.label)}</span></a>`
    : `<div class="tile off" aria-disabled="true">${img(c.img, c.label)}<span class="sub">Coming soon</span><span class="lbl">${esc(c.label)}</span></div>`).join("")}</div>`).join("") + footer();
}
let q = "";
function catView(cat) {
  setChrome(cat.label, true, false);
  const list = cat.units.filter((u) => (!S.only || u.u <= S.th) && u.n.toLowerCase().includes(q.toLowerCase()));
  app.innerHTML = `<input class="search" id="q" type="search" placeholder="Search ${cat.noun}s" value="${esc(q)}">
  <div class="grid units">${list.map((u) => { const m = maxAt(cat, u); return `<a class="tile unit ${m ? "" : "locked"}" href="#/c/${cat.id}/${encodeURIComponent(u.n)}">${img(u.av, u.n)}<span class="sub">${m ? "Lv " + m : "TH" + u.u}</span><span class="lbl">${esc(u.n)}</span></a>`; }).join("")}</div>
  ${list.length ? "" : `<p class="note">Nothing unlocked at TH${S.th}. Turn off “Only show what my TH can reach” in the TH menu to see everything.</p>`}
  <p class="note">Badge = max level at TH${S.th}. Tap the TH button at top right to change Town Hall.</p>` + footer();
  const inp = $("#q"); inp.oninput = () => { q = inp.value; const pos = inp.selectionStart; catView(cat); const n = $("#q"); n.focus(); n.setSelectionRange(pos, pos); };
}
function unitView(cat, u) {
  setChrome(u.n, true, true);
  const k = u.c.length, maxAll = +u.l[u.l.length - 1][0], mTH = maxAt(cat, u);
  const levels = u.l.filter((r) => !S.only || reqTH(cat, u, r) <= S.th).map((r) => +r[0]);
  const key = cat.id + "|" + u.n;
  let lvl = S.lvl[key] || mTH || 1; if (S.only && levels.length && !levels.includes(lvl)) lvl = levels[levels.length - 1];
  const row = u.l.find((r) => +r[0] === lvl) || u.l[0];
  const idx = levels.indexOf(lvl);
  const needs = +row[3 + k] ? `${cat.req} ${row[3 + k]} (TH${reqTH(cat, u, row)})` : `${cat.unlock} ${u.b} (TH${u.u})`;
  let html = `<div class="hero"><div class="imgs">${img(u.av, u.n, "av")}${img(imgFor(u, lvl), u.n + " level " + lvl, "lv")}</div>
    <div class="lvpick"><button id="lvDown" ${idx <= 0 ? "disabled" : ""} aria-label="Lower level">&minus;</button><div class="lvnum">Level ${lvl}<small>max ${mTH || "–"} at TH${S.th} · ${maxAll} in game</small></div><button id="lvUp" ${idx < 0 || idx >= levels.length - 1 ? "disabled" : ""} aria-label="Higher level">+</button></div>
    <div class="cap">Housing ${u.hs} · Unlocks at TH${u.u} (${cat.unlock} ${u.b})</div></div>
    <div class="props">${u.c.map((c, i) => `<div><span>${esc(c)}</span><span>${fmt(row[1 + i])}</span></div>`).join("")}
    <div><span>Upgrade cost</span><span>${+row[1 + k] ? fmt(+row[1 + k]) + " " + cat.res : "Unlocked with the " + cat.noun}</span></div>
    <div><span>Upgrade time</span><span>${row[2 + k] || "–"}</span></div><div><span>Needs</span><span>${needs}</span></div></div>`;
  const tab = S.tab;
  if (tab === "stats") {
    const rows = u.l.filter((r) => !S.only || reqTH(cat, u, r) <= S.th);
    html += `<h3 class="sec">Upgrade stats</h3><div class="tblwrap"><table><thead><tr><th>Level</th><th>Cost</th><th>Time</th>${u.c.map((c) => `<th>${esc(c)}</th>`).join("")}<th>${cat.req}</th><th>TH</th></tr></thead><tbody>
    ${rows.map((r) => `<tr class="${+r[0] === lvl ? "sel" : ""}" data-l="${r[0]}"><td><b>${r[0]}</b></td><td class="cost">${+r[1 + k] ? fmt(+r[1 + k]) : "–"}</td><td>${r[2 + k] || "–"}</td>${u.c.map((c, i) => `<td>${fmt(r[1 + i])}</td>`).join("")}<td>${+r[3 + k] || "–"}</td><td>${reqTH(cat, u, r)}</td></tr>`).join("")}</tbody></table></div>
    <p class="note">Cost and time are to reach that level (${cat.res}). ${cat.req} = ${cat.reqName} level required. Tap a row to select it. Swipe the table sideways for more columns.</p>`;
  } else if (tab === "info") {
    const P = [["Housing space", u.hs], ["Preferred target", u.tg], ["Attack type", u.at], ["Movement speed", u.ms], ["Attack speed", u.sp], ["Range", u.rg], ...u.ex,
      ["Unlocks", `${cat.unlock} ${u.b} (TH${u.u})`], [`Max level at TH${S.th}`, mTH || "Not unlocked yet"], ["Max level in game", `${maxAll} (TH${reqTH(cat, u, u.l[u.l.length - 1])})`], ["Last balance change", u.ch || "–"]];
    html += `<h3 class="sec">Info</h3><div class="props">${P.map(([a, b]) => `<div><span>${esc(a)}</span><span>${esc(b)}</span></div>`).join("")}</div>`;
  } else if (tab === "images") {
    html += `<h3 class="sec">Images</h3><div class="imgs-list">${(u.img || []).map(([src, range]) => { const [a, b] = String(range).split("-").map(Number); const sel = lvl >= a && lvl <= (b || a); return `<figure class="${sel ? "sel" : ""}">${img(src, u.n + " level " + range)}<figcaption>Level ${esc(range)}</figcaption></figure>`; }).join("") || "<p class='note'>No level images yet.</p>"}</div>`;
  } else if (tab === "max") {
    const target = S.only ? mTH : maxAll;
    let cur = Math.min(S.cur[key] || 1, Math.max(target, 1));
    const left = u.l.filter((r) => +r[0] > cur && +r[0] <= target);
    const cost = left.reduce((s, r) => s + +r[1 + k], 0), time = left.reduce((s, r) => s + mins(r[2 + k]), 0);
    html += `<h3 class="sec">Remaining to max</h3><div class="props maxbox">
      <div><span>My current level</span><span><select id="curSel">${Array.from({ length: Math.max(target, 1) }, (_, i) => `<option ${i + 1 === cur ? "selected" : ""}>${i + 1}</option>`).join("")}</select></span></div>
      <div><span>Target</span><span>Level ${target || "–"} ${S.only ? "(max at TH" + S.th + ")" : "(max in game)"}</span></div>
      <div><span>Upgrades left</span><span>${left.length}</span></div>
      <div><span>${cat.res} needed</span><span class="big" style="color:var(--elix)">${fmt(cost)}</span></div>
      <div><span>Lab time</span><span class="big">${fmtMins(time)}</span></div></div>
      <p class="note">Normal values. With Hammer Jam's 50% off it would be about ${short(Math.round(cost / 2))} ${cat.res} and ${fmtMins(Math.round(time / 2))}. Builder/Lab boosts and Gold Pass research boosts aren't included.</p>`;
  }
  app.innerHTML = html + footer();
  const go = (d) => { const n = levels[idx + d]; if (n) { S.lvl[key] = n; unitView(cat, u); } };
  $("#lvDown").onclick = () => go(-1); $("#lvUp").onclick = () => go(1);
  app.querySelectorAll("tr[data-l]").forEach((tr) => (tr.onclick = () => { S.lvl[key] = +tr.dataset.l; unitView(cat, u); }));
  const cs = $("#curSel"); if (cs) cs.onchange = () => { S.cur[key] = +cs.value; unitView(cat, u); };
  tabsEl.querySelectorAll("button").forEach((b) => b.classList.toggle("on", b.dataset.tab === tab));
}
function setChrome(t, back, tabs) { titleEl.textContent = t; document.title = t === "Clash Reference" ? t : t + " · Clash Reference"; backBtn.hidden = !back; tabsEl.hidden = !tabs; }

let lastRoute = "";
async function render() {
  syncSettings();
  try {
    if (!CATS) CATS = await fetch("data/categories.json", { cache: "no-cache" }).then((r) => r.json());
    const r = route();
    if (location.hash !== lastRoute) { window.scrollTo(0, 0); lastRoute = location.hash; }
    if (!r.cat) return home();
    const cat = await loadCat(r.cat);
    if (!cat) { location.hash = "#/"; return; }
    if (!r.unit) return catView(cat);
    const u = cat.units.find((x) => x.n === r.unit);
    if (!u) { location.hash = "#/c/" + cat.id; return; }
    unitView(cat, u);
  } catch (e) { app.innerHTML = `<p class="loading">Couldn't load data (${esc(e.message)}). Pull to refresh.</p>`; }
}
window.addEventListener("hashchange", render);
render();
