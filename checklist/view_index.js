async function loadManifest() {
  const r = await fetch("/checklist/manifest.json", { cache: "no-store" });
  if (!r.ok) throw new Error("Missing manifest.json");
  return r.json();
}

function qs(s){ return document.querySelector(s); }
function el(tag, cls){ const n = document.createElement(tag); if (cls) n.className = cls; return n; }

function renderHome(m) {
  const wrap = qs("#years");
  const years = Object.keys(m.years || {}).sort();
  if (!years.length) {
    wrap.textContent = "No years yet.";
    return;
  }
  years.forEach(y => {
    const a = document.createElement("a");
    a.href = `/checklist/${y}/`;
    a.className = "pill";
    a.textContent = y;
    wrap.appendChild(a);
  });
}

function renderYear(m, year) {
  const wrap = qs("#days");
  const days = (m.years?.[year] || []).slice().sort();
  if (!days.length) {
    wrap.textContent = "No days yet.";
    return;
  }

  days.forEach(mmdd => {
    const mm = mmdd.slice(0,2);
    const dd = mmdd.slice(2);
    const label = `${mm}/${dd}/${year}`; // <-- formatted date

    const a = document.createElement("a");
    a.href = `/checklist/${year}/${mmdd}/`;
    a.className = "pill";
    a.innerHTML = `<div class="pillBig">${label}</div><div class="pillSmall">${mmdd}</div>`;
    wrap.appendChild(a);
  });
}


async function main() {
  const view = window.CHECKLIST_VIEW;
  const m = await loadManifest();
  if (view.type === "home") renderHome(m);
  if (view.type === "year") renderYear(m, view.year);
}
main().catch(console.error);
