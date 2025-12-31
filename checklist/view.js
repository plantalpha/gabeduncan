async function loadManifest() {
  const r = await fetch("/checklist/manifest.json", { cache: "no-store" });
  if (!r.ok) throw new Error("Missing manifest.json");
  return r.json();
}

async function loadContent(year, day) {
  const r = await fetch(`/checklist/${year}/${day}/content.json`, { cache: "no-store" });
  if (!r.ok) throw new Error("Missing content.json for this day");
  return r.json();
}

function checksKey(year, day) {
  return `gd_checks_${year}_${day}`;
}

function loadChecks(year, day) {
  try { return JSON.parse(localStorage.getItem(checksKey(year, day)) || "{}"); }
  catch { return {}; }
}

function saveChecks(year, day, checks) {
  localStorage.setItem(checksKey(year, day), JSON.stringify(checks));
}

function qs(s){ return document.querySelector(s); }
function el(tag, cls){ const n = document.createElement(tag); if (cls) n.className = cls; return n; }

function wirePrevNext(manifest, year, day) {
  const days = (manifest.years?.[year] || []).slice().sort();
  const i = days.indexOf(day);
  const prev = i > 0 ? days[i-1] : null;
  const next = (i >= 0 && i < days.length-1) ? days[i+1] : null;

  const prevLink = qs("#prevLink");
  const nextLink = qs("#nextLink");

  if (prevLink) {
    if (prev) prevLink.href = `/checklist/${year}/${prev}/`;
    else prevLink.classList.add("disabled");
  }
  if (nextLink) {
    if (next) nextLink.href = `/checklist/${year}/${next}/`;
    else nextLink.classList.add("disabled");
  }
}

function renderTasks(year, day, tasks, checks) {
  const ul = qs("#list");
  ul.innerHTML = "";

  tasks.forEach((text, idx) => {
    const li = el("li", "item");
    const label = el("label", "row");

    const cb = el("input");
    cb.type = "checkbox";
    cb.checked = !!checks[idx];

    const span = el("span", "text");
    span.textContent = text;

    cb.addEventListener("change", () => {
      checks[idx] = cb.checked;
      saveChecks(year, day, checks);
      span.classList.toggle("done", cb.checked);
      updateMeta(tasks, checks);
    });

    span.classList.toggle("done", cb.checked);

    label.appendChild(cb);
    label.appendChild(span);
    li.appendChild(label);
    ul.appendChild(li);
  });

  updateMeta(tasks, checks);
}

function updateMeta(tasks, checks) {
  const total = tasks.length;
  const done = Object.values(checks).filter(Boolean).length;
  const meta = qs("#metaLine");
  if (meta) meta.textContent = `${done}/${total} complete • saved on this device`;
}

function renderNotes(content) {
  const card = qs("#notesCard");
  const notes = qs("#notes");
  const html = content.notesHtml || "";
  if (!html.trim()) {
    card.style.display = "none";
    return;
  }
  notes.innerHTML = html; // authored by your app
}

function renderPhotos(content) {
  const card = qs("#photosCard");
  const photos = content.photos || [];
  if (!photos.length) {
    card.style.display = "none";
    return;
  }

  let i = 0;
  const img = qs("#pImg");
  const count = qs("#pCount");

  function show() {
    img.src = photos[i];
    img.style.objectFit = "contain"; // your preference: shrink to fit
    count.textContent = `${i+1} / ${photos.length}`;
  }

  qs("#pPrev").addEventListener("click", () => { i = (i-1+photos.length)%photos.length; show(); });
  qs("#pNext").addEventListener("click", () => { i = (i+1)%photos.length; show(); });

  show();
}

async function main() {
  const { year, day } = window.CHECKLIST_DAY || {};
  if (!year || !day) return;

  const [manifest, content] = await Promise.all([loadManifest(), loadContent(year, day)]);
  wirePrevNext(manifest, year, day);

  qs("#title").textContent = content.title || `${year}-${day.slice(0,2)}-${day.slice(2)}`;

  const tasks = Array.isArray(content.tasks) ? content.tasks : [];
  const checks = loadChecks(year, day);
  renderTasks(year, day, tasks, checks);

  renderNotes(content);
  renderPhotos(content);
}

main().catch(err => {
  console.error(err);
  document.body.prepend(Object.assign(document.createElement("div"), {
    style: "padding:12px",
    textContent: "Checklist error: " + (err.message || err)
  }));
});
