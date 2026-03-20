// popupFix.js

(function(){

console.log("Popup Fix Loaded")

const spinBtn = document.getElementById("spinBtn")
const modal = document.getElementById("resultModal")
const word = document.getElementById("resultWord")
const full = document.getElementById("resultFull")

if(!spinBtn){
console.log("Spin button not found")
return
}

spinBtn.addEventListener("click", () => {

console.log("PopupFix watching spin")

// wait for wheel to finish spinning
setTimeout(() => {

if(typeof selectedGame !== "undefined" && selectedGame){

console.log("PopupFix forcing result popup", selectedGame)

word.textContent =
selectedGame.title.split(" ")[0].toUpperCase()

full.textContent =
selectedGame.title

modal.classList.remove("hidden")

}else{

console.log("PopupFix: selectedGame missing")

}

}, 4200) // slightly longer than spin time

})

})()