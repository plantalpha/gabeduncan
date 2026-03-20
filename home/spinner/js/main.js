import { loadGames } from "./spinner.js"
import { setupFilters } from "./filters.js"
import { updatePanel } from "./panel.js"

document.addEventListener("DOMContentLoaded", () => {

loadGames()

setupFilters()

updatePanel()

})