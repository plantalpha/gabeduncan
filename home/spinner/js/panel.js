import {
getCurrentGames,
getCompletedGames,
saveCurrentGames,
saveCompletedGames
} from "./storage.js"

export function updatePanel(){

let current=getCurrentGames()
let completed=getCompletedGames()

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