const gallery = document.getElementById("gallery")
const zoom = document.getElementById("zoom")
const reloadBtn = document.getElementById("reload")
const randomBtn = document.getElementById("randomBtn")

const viewer = document.getElementById("viewer")
const viewerImg = document.getElementById("viewerImg")
const prev = document.getElementById("prev")
const next = document.getElementById("next")

let images = []
let current = 0


/* CLEAN IMAGE URLS */
function cleanURL(url){

// remove ?query parameters
url = url.split("?")[0]

// remove /revision/... sections
url = url.replace(/\/revision\/.*$/,"")

return url

}

/* zoom control */

zoom.oninput = () => {
gallery.style.gridTemplateColumns =
`repeat(${zoom.value}, 1fr)`
}

/* load image list */

async function loadImages(){

const res = await fetch("images.txt?nocache=" + Date.now())
const text = await res.text()

images = text.split("\n").filter(x=>x.trim()).map(cleanURL)

images.forEach((url,i)=>{

const div = document.createElement("div")
div.className = "thumb"

const img = document.createElement("img")
img.loading = "lazy"
img.src = url
img.onerror = ()=>{ img.style.display="none" }

div.appendChild(img)

div.onclick = ()=>{
openViewer(i)
}

gallery.appendChild(div)

})

}

function openViewer(i){

current = i
viewer.style.display = "flex"
viewerImg.src = images[i]

}

/* navigation */

function show(i){

if(i<0) i = images.length-1
if(i>=images.length) i = 0

current = i
viewerImg.src = images[i]

}

prev.onclick = ()=>show(current-1)
next.onclick = ()=>show(current+1)

/* keyboard controls */

document.addEventListener("keydown",e=>{

if(viewer.style.display!=="flex") return

if(e.key==="ArrowRight") show(current+1)
if(e.key==="ArrowLeft") show(current-1)
if(e.key==="Escape") viewer.style.display="none"

})

viewer.onclick = e=>{
if(e.target===viewer)
viewer.style.display="none"
}

loadImages()

/* reload button */

reloadBtn.onclick = () => {

gallery.innerHTML = ""     // remove existing thumbnails
images = []                // reset list

loadImages()

}

/* random button */

randomBtn.onclick = () => {

if(images.length === 0) return

const i = Math.floor(Math.random() * images.length)

openViewer(i)

}