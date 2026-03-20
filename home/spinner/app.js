window.onload = () => {

let games=[]
let filteredGames=[]
let selectedGame=null
let lastTick = 0

const tickSound = new Audio("sounds/tick.mp3")
const canvas=document.getElementById("wheel")
const ctx=canvas.getContext("2d")

let rotation=0

const spinSound=new Audio("sounds/spin.mp3")
const acceptSound=new Audio("sounds/accept.mp3")
const rerollSound=new Audio("sounds/reroll.mp3")
const completeSound=new Audio("sounds/complete.mp3")

fetch("data/default-games.json")
.then(r=>r.json())
.then(data=>{

games=data
filteredGames=[...games]

generateFilters()
drawWheel()

})

function drawWheel(){

if(filteredGames.length === 0) return

let radius=250
let center=250

ctx.clearRect(0,0,500,500)

let slice=2*Math.PI/filteredGames.length

filteredGames.forEach((game,i)=>{

let angle=i*slice

ctx.beginPath()
ctx.moveTo(center,center)
ctx.arc(center,center,radius,angle,angle+slice)
ctx.fillStyle = getTagColor(game.tags)
ctx.fill()
ctx.strokeStyle = "#000"
ctx.lineWidth = 2
ctx.stroke()

ctx.save()

ctx.translate(center,center)
ctx.rotate(angle+slice/2)

ctx.fillStyle="white"
ctx.font="16px Arial"
ctx.shadowColor = "black"
ctx.shadowBlur = 4

let word=game.title.split(" ")[0].toUpperCase()

ctx.textAlign = "center"
ctx.fillText(word,150,5)

ctx.restore()

})

}

const SPIN_DURATION = 4000
const MIN_SPINS = 6
const MAX_SPINS = 10

document.getElementById("spinBtn").onclick = () => {

console.log("SPIN BUTTON PRESSED")

if(filteredGames.length === 0) return

lastTick = -1

spinSound.play()

let randomIndex = Math.floor(Math.random() * filteredGames.length)

selectedGame = filteredGames[randomIndex]

console.log("Selected Game:", selectedGame)

let slice = 360 / filteredGames.length

let spins = Math.floor(Math.random() * (MAX_SPINS - MIN_SPINS + 1)) + MIN_SPINS

let targetRotation =
rotation +
(360 * spins) +
((filteredGames.length - randomIndex) * slice) -
(slice / 2)

animateSpin(targetRotation)

}

function animateSpin(target){

if(filteredGames.length === 0) return    
let start = rotation
let duration = SPIN_DURATION
let startTime = null

function animate(time){

if(!startTime) startTime = time

let progress = (time - startTime) / duration

if(progress > 1) progress = 1

let eased = 1 - Math.pow(1 - progress, 4)

rotation = start + (target - start) * eased

canvas.style.transform = `rotate(${rotation}deg)`

let slice = 360 / filteredGames.length
let tick = Math.floor((rotation % 360) / slice)

if(tick !== lastTick){

lastTick = tick

tickSound.currentTime = 0
tickSound.play()

}

if(progress < 1){

requestAnimationFrame(animate)

}else{

console.log("Spin finished")

rotation = target
canvas.style.transform = `rotate(${rotation}deg)`

setTimeout(() => {
showResult()
}, 100)

}

}

requestAnimationFrame(animate)

}

function easeOut(t){
return 1-Math.pow(1-t,3)
}

function showResult(){

console.log("RESULT:", selectedGame)

if(!selectedGame){
alert("No game selected")
return
}

const modal = document.getElementById("resultModal")

document.getElementById("resultWord").textContent =
selectedGame.title.split(" ")[0].toUpperCase()

document.getElementById("resultFull").textContent =
selectedGame.title

modal.classList.remove("hidden")

}

document.getElementById("cancelBtn").onclick=()=>{
document.getElementById("resultModal").classList.add("hidden")
}

document.getElementById("rerollBtn").onclick=()=>{
rerollSound.play()
document.getElementById("resultModal").classList.add("hidden")
document.getElementById("spinBtn").click()
}

document.getElementById("acceptBtn").onclick=()=>{

acceptSound.play()

let current=JSON.parse(localStorage.getItem("currentGames")||"[]")

current.push({
title:selectedGame.title,
playtime:0
})

localStorage.setItem("currentGames",JSON.stringify(current))

document.getElementById("resultModal").classList.add("hidden")

updatePanel()

}

/* colored wedges based on tags */

function getTagColor(tags){

const colors = {
horror:"#8b0000",
platformer:"#1e90ff",
puzzle:"#f4b400",
retro:"#9b59b6",
story:"#2ecc71",
psychological:"#e67e22",
short:"#16a085"
}

if(tags.length === 1){
return colors[tags[0]] || "#555"
}

let grad = ctx.createLinearGradient(0,0,300,300)

tags.forEach((tag,i)=>{
let c = colors[tag] || "#555"
grad.addColorStop(i/(tags.length-1),c)
})

return grad

}

/* end colored wedges */

function generateFilters(){

let tagCounts = {}

games.forEach(g=>{
g.tags.forEach(t=>{
if(!tagCounts[t]) tagCounts[t] = 0
tagCounts[t]++
})
})

let filtersDiv = document.getElementById("filters")

filtersDiv.innerHTML = "<b>Filters:</b> "

Object.entries(tagCounts).forEach(([tag,count])=>{

let label = document.createElement("label")

label.innerHTML = `
<input type="checkbox" value="${tag}" checked>
${tag} (${count})
`

filtersDiv.appendChild(label)

})

let refresh = document.createElement("button")

refresh.innerText = "Refresh"

refresh.onclick = () => {

applyFilters()

}

filtersDiv.appendChild(refresh)

filtersDiv.querySelectorAll("input").forEach(cb=>{

cb.onchange = applyFilters

})

}

function applyFilters(){

let checked = [...document.querySelectorAll("#filters input:checked")]
.map(cb => cb.value)

if(checked.length === 0){
filteredGames = [...games]
}else{

filteredGames = games.filter(g =>

g.tags.some(tag => checked.includes(tag))

)

}

drawWheel()

}

document.getElementById("currentGameBtn").onclick=()=>{

document.getElementById("gamePanel").classList.toggle("hidden")

}

document.getElementById("closePanel").onclick=()=>{

document.getElementById("gamePanel").classList.add("hidden")

}

function updatePanel(){

let current=JSON.parse(localStorage.getItem("currentGames")||"[]")
let completed=JSON.parse(localStorage.getItem("completedGames")||"[]")

let currentDiv=document.getElementById("currentGames")
let completedDiv=document.getElementById("completedGames")

currentDiv.innerHTML=""
completedDiv.innerHTML=""

current.forEach((g,i)=>{

let div=document.createElement("div")

div.innerHTML=`
<b>${g.title}</b><br>
<button onclick="completeGame(${i})">Complete</button>
`

currentDiv.appendChild(div)

})

completed.forEach(g=>{

let div=document.createElement("div")

div.innerHTML=`
<b>${g.title}</b><br>
⭐ ${g.rating}<br>
${g.notes}
`

completedDiv.appendChild(div)

})

}

let completingIndex = null

function completeGame(index){

let current = JSON.parse(localStorage.getItem("currentGames")||"[]")

let game = current[index]

completingIndex = index

document.getElementById("completeTitle").textContent = game.title

document.getElementById("ratingInput").value = ""
document.getElementById("notesInput").value = ""

document.getElementById("completeModal").classList.remove("hidden")

}

window.onload = () => {

document.getElementById("saveComplete").onclick = () => {

let rating = document.getElementById("ratingInput").value
let notes = document.getElementById("notesInput").value

let current = JSON.parse(localStorage.getItem("currentGames")||"[]")
let completed = JSON.parse(localStorage.getItem("completedGames")||"[]")

let game = current[completingIndex]

completed.push({
title:game.title,
rating:rating,
notes:notes
})

current.splice(completingIndex,1)

localStorage.setItem("currentGames",JSON.stringify(current))
localStorage.setItem("completedGames",JSON.stringify(completed))

document.getElementById("completeModal").classList.add("hidden")

completeSound.play()

updatePanel()

}

document.getElementById("cancelComplete").onclick = () => {

document.getElementById("completeModal").classList.add("hidden")

}

}

document.getElementById("loadList").onclick=()=>{
document.getElementById("fileInput").click()
}

document.getElementById("fileInput").onchange=(e)=>{

let file=e.target.files[0]

let reader=new FileReader()

reader.onload=()=>{

games=JSON.parse(reader.result)
filteredGames=[...games]

generateFilters()
drawWheel()

}

reader.readAsText(file)

}

updatePanel()


}