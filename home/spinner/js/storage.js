export function getCurrentGames(){

return JSON.parse(localStorage.getItem("currentGames") || "[]")

}

export function saveCurrentGames(list){

localStorage.setItem("currentGames",JSON.stringify(list))

}

export function getCompletedGames(){

return JSON.parse(localStorage.getItem("completedGames") || "[]")

}

export function saveCompletedGames(list){

localStorage.setItem("completedGames",JSON.stringify(list))

}