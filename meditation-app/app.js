// ====== Dummy Login ======
function dummyLogin() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  if (username === "bob1" && password === "bob'spasswrd") {
    // Store login
    localStorage.setItem("loggedInUser", username);

    // Reveal all functional tabs
    revealTabs();

    // Confetti + sound
    const confetti = document.getElementById("confetti");
    confetti.classList.remove("hidden");
    document.getElementById("yay-sound").play();

    setTimeout(() => {
      confetti.classList.add("hidden");
    }, 3000);

  } else {
    // Error mark + sound
    const errorMark = document.getElementById("error-mark");
    errorMark.classList.remove("hidden");
    document.getElementById("noo-sound").play();

    setTimeout(() => {
      errorMark.classList.add("hidden");
    }, 2000);
  }
}

// ====== Reveal / Hide Tabs ======
function revealTabs() {
  document.querySelectorAll(".tab[data-tab]").forEach(tab => {
    tab.style.display = "inline-block";    // show tab
  });
}

function hideTabs() {
  document.querySelectorAll(".tab[data-tab]").forEach(tab => {
    tab.style.display = "none";            // hide tab
  });
}

// ====== Logout Modal ======
function openLogoutModal() {
  document.getElementById("logout-modal").classList.remove("hidden");
}

function closeLogoutModal() {
  document.getElementById("logout-modal").classList.add("hidden");
}

function confirmLogout() {
  localStorage.removeItem("loggedInUser");
  hideTabs();
  window.location.href = "https://gabeduncan.com";
}

// ====== Initial Page Load ======
document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("loggedInUser")) {
    revealTabs();
  } else {
    hideTabs();
  }
});

// ====== Close Modal Clicking Outside ======
window.addEventListener("click", e => {
  const modal = document.getElementById("logout-modal");
  if (!modal.classList.contains("hidden") && e.target === modal) {
    closeLogoutModal();
  }
});
