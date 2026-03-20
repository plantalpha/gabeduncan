import { sounds } from "./sounds.js"

let games=[]
let filteredGames=[]
let selectedGame=null

const canvas=document.getElementById("wheel")
const ctx=canvas.getContext("2d")

let rotation=0
let lastTick=0

export function loadGames(){

fetch("data/default-games.json")
.then(r=>r.json())
.then(data=>{

games=data
filteredGames=[...games]

drawWheel()

})

}

export function drawWheel(){

if(filteredGames.length===0) return

let radius=250
let center=250

ctx.clearRect(0,0,500,500)

let slice=2*Math.PI/filteredGames.length

filteredGames.forEach((game,i)=>{

let angle=i*slice

ctx.beginPath()
ctx.moveTo(center,center)
ctx.arc(center,center,radius,angle,angle+slice)
ctx.fillStyle="#444"
ctx.fill()

ctx.strokeStyle="#000"
ctx.lineWidth=2
ctx.stroke()

ctx.save()

ctx.translate(center,center)
ctx.rotate(angle+slice/2)

ctx.fillStyle="white"
ctx.font="16px Arial"

let word=game.title.split(" ")[0].toUpperCase()

ctx.textAlign="center"
ctx.fillText(word,150,5)

ctx.restore()

})

}

document.getElementById("spinBtn").onclick=spinWheel

function spinWheel(){

if(filteredGames.length===0) return

sounds.spin.play()

let randomIndex=Math.floor(Math.random()*filteredGames.length)

selectedGame=filteredGames[randomIndex]

let slice=360/filteredGames.length

let spins=Math.floor(Math.random()*4)+6

let target=
rotation+
(360*spins)+
((filteredGames.length-randomIndex)*slice)-
(slice/2)

animateSpin(target)

}

function animateSpin(target){

let start=rotation
let duration=4000
let startTime=null

function animate(time){

if(!startTime) startTime=time

let progress=(time-startTime)/duration

if(progress>1) progress=1

let eased=1-Math.pow(1-progress,4)

rotation=start+(target-start)*eased

canvas.style.transform=`rotate(${rotation}deg)`

if(progress<1){

requestAnimationFrame(animate)

}else{

showResult()

}

}

requestAnimationFrame(animate)

}

function showResult(){

document.getElementById("resultWord").textContent=
selectedGame.title.split(" ")[0].toUpperCase()

document.getElementById("resultFull").textContent=
selectedGame.title

document.getElementById("resultModal").classList.remove("hidden")

}