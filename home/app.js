// ============================
// DEBUG ON/OFF
// ============================
const SETTINGS = {

debug: true

}


// ============================
// DEBUG SYSTEM
// ============================

function enableDebug(){

if(!SETTINGS.debug) return

document.body.classList.add("debug")

console.log("DEBUG MODE ENABLED")

}


// ============================
// DEBUG PANEL
// ============================

function activateDebugInspector(){

if(!SETTINGS.debug) return

const panelX = document.getElementById("mouseX")
const panelY = document.getElementById("mouseY")

document.addEventListener("mousemove", e => {

const scene = document.getElementById("scene")
const rect = scene.getBoundingClientRect()

const scale = rect.width / WORLD.width

const localX = e.clientX - rect.left
const localY = e.clientY - rect.top

if(localX < 0 || localY < 0 || localX > rect.width || localY > rect.height){
return
}

const worldX = Math.round(localX / scale)
const worldY = Math.round(localY / scale)

panelX.textContent = worldX
panelY.textContent = worldY

})

}

document.querySelectorAll(".object, .hotspot").forEach(el => {

el.addEventListener("mouseenter", () => {

document.getElementById("hoveredID").textContent = el.id

})

})


// ============================
// SVG HOTSPOT ACTIONS
// ============================

const svgActions = {

cliff() {

alert("You clicked the cliff!")

},

horse() {

alert("The horse runs away!")

}

}


// ============================
// PNG OBJECT ACTIONS
// ============================

const objectActions = {

tree() {

alert("It's a tree 🌳")

},

man() {

alert("Hello traveler!")

}

}


// ============================
// EVENT SYSTEM
// ============================

function activateSVGHotspots(){

document.querySelectorAll(".hotspot").forEach(el => {

el.addEventListener("click", () => {

const action = svgActions[el.id]

if(action) action()

})

})

}


function activateObjects(){

document.querySelectorAll(".object").forEach(el => {

el.addEventListener("click", () => {

const action = objectActions[el.id]

if(action) action()

})

})

}

// ============================
// EVENT SYSTEM
// ============================

function init(){

enableDebug()

activateSVGHotspots()

activateObjects()

activateDebugInspector()

positionObjects()

}

// ============================
// world coordinates → screen coordinates
// ============================

const WORLD = {
width: 3840,
height: 2160
}

function positionObjects(){

const scene = document.getElementById("scene")
const map = document.getElementById("map")
const scale = map.offsetWidth / WORLD.width

document.querySelectorAll(".object").forEach(obj => {

const x = Number(obj.dataset.x)
const y = Number(obj.dataset.y)
const width = Number(obj.dataset.width)

const scaledWidth = width * scale

obj.style.left = (x * scale - scaledWidth / 2) + "px"
obj.style.top = (y * scale - scaledWidth / 2) + "px"
obj.style.width = scaledWidth + "px"

})

}

window.addEventListener("resize", positionObjects)


// ============================
// LEAVE THIS INIT LAST
// ============================

init()