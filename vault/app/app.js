/* ================================
   VAULT – STABLE BASELINE
================================ */

const STORAGE_KEY = "vault_signals";
let viewMode = "home";
let searchQuery = "";
let activeFilter = "all";

document.querySelectorAll(".filters button").forEach(btn => {
  btn.onclick = () => {
    activeFilter = btn.dataset.filter;

    document.querySelectorAll(".filters button").forEach(b =>
      b.classList.remove("active")
    );
    btn.classList.add("active");

    render();
  };
});


/* ---------- STORAGE ---------- */

function loadSignals() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
}

function saveSignals(signals) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(signals));
}

/* ---------- VIEW TOGGLE ---------- */

document.getElementById("seeAllBtn").onclick = () => {
  viewMode = "collection";
  document.getElementById("quickAdd").style.display = "none";
  document.getElementById("collectionTitle").textContent = "All Signals";
  document.getElementById("seeAllBtn").hidden = true;
  document.getElementById("backBtn").hidden = false;
};

document.getElementById("backBtn").onclick = () => {
  viewMode = "home";
  document.getElementById("quickAdd").style.display = "";
  document.getElementById("collectionTitle").textContent = "My Collection";
  document.getElementById("seeAllBtn").hidden = false;
  document.getElementById("backBtn").hidden = true;
};

document.getElementById("searchInput").addEventListener("input", e => {
  searchQuery = e.target.value.toLowerCase();
  render();
});

async function fetchYouTubeMeta(url) {
  const endpoint = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;

  try {
    const res = await fetch(endpoint);
    if (!res.ok) throw new Error("YouTube oEmbed failed");
    return await res.json();
  } catch (err) {
    console.warn("YouTube metadata fetch failed:", err);
    return null;
  }
}

/* ---------- HELPERS ---------- */

function uuid() {
  return crypto.randomUUID();
}

function isLink(text) {
  return text.startsWith("http");
}

function isYouTube(url) {
  return url.includes("youtube.com") || url.includes("youtu.be");
}

function getYouTubeThumbnail(url) {
  try {
    const id = url.includes("youtu.be")
      ? url.split("youtu.be/")[1]
      : new URL(url).searchParams.get("v");
    return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
  } catch {
    return null;
  }
}

/* ---------- DATE BUCKETS ---------- */

function startOfDay(ts) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function daysBetween(a, b) {
  return Math.floor((startOfDay(a) - startOfDay(b)) / 86400000);
}

function getDateBucket(ts) {
  const diff = daysBetween(Date.now(), ts);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff <= 7) return "Earlier This Week";
  return "Older";
}

/* ---------- CAPTURE ---------- */

document.getElementById("captureBtn").onclick = async () => {
  const raw = document.getElementById("linkInput").value.trim();
  const notes = document.getElementById("noteInput").value.trim();
  const imageFile = document.getElementById("imageInput").files[0];

  if (!raw && !imageFile) return;

  if (!confirm("Capture this signal?")) return;

  let imageData = null;
  if (imageFile) {
    imageData = await readImage(imageFile);
  }

  let title = raw || "Image";
let channel = "";
let published = "";
let thumbnail = imageData || null;

if (isYouTube(raw)) {
  const meta = await fetchYouTubeMeta(raw);
  if (meta) {
    title = meta.title;
    channel = meta.author_name;
    thumbnail = meta.thumbnail_url;
  }
}

  const signal = {
    id: uuid(),
    type: imageFile
      ? "image"
      : isYouTube(raw)
      ? "youtube"
      : isLink(raw)
      ? "link"
      : "note",

    title,
    url: isLink(raw) ? raw : "",
    thumbnail,
    notes,

    youtube: isYouTube(raw)
      ? {
          channel,
          published: published || "Unknown"
        }
      : null,

    starred: false,
    created_at: Date.now()
  };

  const signals = loadSignals();
  signals.unshift(signal);
  saveSignals(signals);

  document.getElementById("linkInput").value = "";
  document.getElementById("noteInput").value = "";
  document.getElementById("imageInput").value = "";

  render();
};

/* ---------- DELETE ---------- */

function deleteSignal(id) {
  if (!confirm("Delete this signal?")) return;
  const signals = loadSignals().filter(s => s.id !== id);
  saveSignals(signals);
  render();
}

/* ---------- RENDER ---------- */

function createCard(signal) {
  const card = document.createElement("div");
  card.className = "card";

  const thumb = document.createElement("div");
  thumb.className = "thumb";
  if (signal.thumbnail) {
    thumb.style.backgroundImage = `url(${signal.thumbnail})`;
    thumb.style.backgroundSize = "cover";
  }

  const star = document.createElement("button");
  star.className = "star";
  star.textContent = signal.starred ? "★" : "☆";

  star.onclick = e => {
    e.stopPropagation();
    toggleStar(signal.id);
  };

  card.appendChild(star);

  const meta = document.createElement("div");
  meta.className = "meta";

  const title = document.createElement("p");
  title.className = "title";
  title.textContent = signal.title;

  const sub = document.createElement("p");
  sub.className = "sub";
  sub.textContent = signal.type;

  meta.appendChild(title);
  meta.appendChild(sub);

  card.appendChild(thumb);
  card.appendChild(meta);

  card.onclick = () => expandCard(card, signal);

  return card;
}

function expandCard(card, signal) {
  if (card.classList.contains("expanded")) {
    card.classList.remove("expanded");
    card.querySelector(".expanded")?.remove();
    return;
  }

  card.classList.add("expanded");

  const box = document.createElement("div");
  box.className = "expanded";

  // Date
  const date = document.createElement("p");
  date.textContent = new Date(signal.created_at).toLocaleString();

  if (signal.type === "youtube" && signal.youtube) {
    const yt = document.createElement("p");
    yt.innerHTML = `
      <strong>${signal.youtube.channel}</strong><br>
      <em>Published: ${signal.youtube.published}</em>
    `;
    box.appendChild(yt);
  }

  // Image (if applicable)
  if (signal.type === "image" && signal.thumbnail) {
    const img = document.createElement("img");
    img.src = signal.thumbnail;
    img.className = "expanded-image";
    img.onclick = () => openLightbox(signal.thumbnail);
    box.appendChild(img);
  }

  // Notes
  const notes = document.createElement("p");
  notes.textContent = signal.notes || "No notes";

  // Buttons
  const actions = document.createElement("div");
  actions.className = "actions";

  // Download image (if image exists)
  if (signal.thumbnail) {
    const downloadBtn = document.createElement("button");
    downloadBtn.textContent = "Download Image";
    downloadBtn.onclick = e => {
      e.stopPropagation();
      handleOpen(signal, "download");
    };
    actions.appendChild(downloadBtn);
  }

  // Open link (if link exists)
  if (signal.url) {
    const openBtn = document.createElement("button");
    openBtn.textContent = "Open Link";
    openBtn.onclick = e => {
      e.stopPropagation();
      handleOpen(signal, "open");
    };
    actions.appendChild(openBtn);
  }

  // Delete (always exists)
  const deleteBtn = document.createElement("button");
  deleteBtn.textContent = "Delete";
  deleteBtn.onclick = e => {
    e.stopPropagation();
    deleteSignal(signal.id);
  };
  actions.appendChild(deleteBtn);

  box.appendChild(date);
  box.appendChild(notes);
  box.appendChild(actions);

  card.appendChild(box);
}

function readImage(file) {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
}

function toggleStar(id) {
  const signals = loadSignals();
  const item = signals.find(s => s.id === id);
  if (!item) return;

  item.starred = !item.starred;
  saveSignals(signals);
  render();
}

function buildImageFilename(signal) {
  const notePart = (signal.notes || "image")
    .slice(0, 10)
    .replace(/[^a-z0-9]/gi, "_")
    .toLowerCase();

  const date = new Date(signal.created_at)
    .toISOString()
    .split("T")[0];

  return `${notePart}_${date}.png`;
}

function handleOpen(signal, action) {
  if (action === "download" && signal.thumbnail) {
    const name = buildImageFilename(signal);

    if (!confirm(`Download image as "${name}"?`)) return;

    const a = document.createElement("a");
    a.href = signal.thumbnail;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  if (action === "open" && signal.url) {
    window.open(signal.url, "_blank");
  }
}

function render() {
  const zones = document.getElementById("collectionZones");
  const empty = document.getElementById("emptyState");
  zones.innerHTML = "";

  let signals = loadSignals();

  // SEARCH
  if (searchQuery) {
    signals = signals.filter(s =>
      (s.title || "").toLowerCase().includes(searchQuery) ||
      (s.notes || "").toLowerCase().includes(searchQuery) ||
      (s.type || "").toLowerCase().includes(searchQuery)
    );
  }

  // FILTER
  if (activeFilter !== "all") {
    signals = signals.filter(s => s.type === activeFilter);
  }
  if (!signals.length) {
    empty.hidden = false;
    return;
  }
  empty.hidden = true;

  const starred = signals.filter(s => s.starred);
  const regular = signals.filter(s => !s.starred);

  if (starred.length) {
    const zone = document.createElement("div");
    zone.className = "zone priority";

    const h = document.createElement("h3");
    h.textContent = "⭐ Use This Now";
    zone.appendChild(h);

    starred.forEach(s => zone.appendChild(createCard(s)));
    zones.appendChild(zone);
  }

  const buckets = {};
  regular.forEach(s => {
    const b = getDateBucket(s.created_at);
    if (!buckets[b]) buckets[b] = [];
    buckets[b].push(s);
  });

  Object.keys(buckets).forEach(label => {
    const zone = document.createElement("div");
    zone.className = "zone";

    const h = document.createElement("h3");
    h.textContent = label;
    zone.appendChild(h);

    buckets[label].forEach(s => zone.appendChild(createCard(s)));
    zones.appendChild(zone);
  });
} // <-- THIS CLOSES render()

/* ---------- INIT ---------- */

render();