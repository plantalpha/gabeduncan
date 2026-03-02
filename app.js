/* =========================
   BACKGROUND ROTATION
========================= */

const backgrounds = [
  "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=2000&q=80",
  "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=2000&q=80",
  "https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?auto=format&fit=crop&w=2000&q=80"
];

const bgA = document.getElementById("bgA");
const bgB = document.getElementById("bgB");
let showingA = true;
let bgIndex = 0;

bgA.style.backgroundImage = `url('${backgrounds[0]}')`;

setInterval(() => {
  bgIndex = (bgIndex + 1) % backgrounds.length;
  const incoming = showingA ? bgB : bgA;
  const outgoing = showingA ? bgA : bgB;

  incoming.style.backgroundImage = `url('${backgrounds[bgIndex]}')`;
  incoming.classList.add("visible");
  outgoing.classList.remove("visible");

  showingA = !showingA;
}, 5000);


/* =========================
   ENTER BUTTON
========================= */

const enterSounds = [
  "enter1.mp3",
  "enter2.mp3",
  "enter3.mp3"
];

document.getElementById("enter-btn").onclick = () => {
  const sound = new Audio(
    enterSounds[Math.floor(Math.random() * enterSounds.length)]
  );
  sound.play();

  document.body.style.transition = "transform 0.3s ease-in";
  document.getElementById("scene").style.transform = "scale(1.3)";
  const scene = document.getElementById("scene");
  scene.style.transition = "transform 0.3s ease-in";
  scene.style.transform = "scale(2.5)";

  setTimeout(() => {
    window.location.href = "/home";
  }, 300);
};


/* =========================
   CONSOLE
========================= */

const consoleBox = document.getElementById("console");

document.getElementById("console-btn").onclick = () => {
  consoleBox.hidden = false;
};

document.getElementById("console-close").onclick = () => {
  consoleBox.hidden = true;
};

document.getElementById("console-clear").onclick = () => {
  document.getElementById("console-input").value = "";
};


/* Load commands from external file */
let commands = {};

fetch("commands.json")
  .then(r => r.json())
  .then(data => commands = data);

document.getElementById("console-run").onclick = () => {
  const cmd = document.getElementById("console-input").value.trim();
  if (commands[cmd]) {
    commands[cmd]();
  }
};


/* =========================
   DRAGGING
========================= */

let dragging = false, ox, oy;
const header = document.getElementById("console-header");

header.onmousedown = e => {
  dragging = true;
  ox = e.offsetX;
  oy = e.offsetY;
};

document.onmousemove = e => {
  if (!dragging) return;
  consoleBox.style.left = `${e.pageX - ox}px`;
  consoleBox.style.top = `${e.pageY - oy}px`;
};

document.onmouseup = () => dragging = false;

// Footer year
    document.getElementById("year").textContent = new Date().getFullYear();