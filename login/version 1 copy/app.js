function dummyLogin() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  if (username === "bob1" && password === "bob'spasswrd") {
    localStorage.setItem("loggedInUser", username);

    // Unlock tabs
    document.querySelectorAll(".tab.hidden").forEach(tab => {
      tab.classList.remove("hidden");
    });

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

function openLogoutModal() {
  document.getElementById("logout-modal").classList.remove("hidden");
}
function closeLogoutModal() {
  document.getElementById("logout-modal").classList.add("hidden");
}
function confirmLogout() {
  localStorage.removeItem("loggedInUser");
  window.location.href = "https://gabeduncan.com";
}

// Hide/show tabs depending on login
function checkLogin() {
  const loggedIn = localStorage.getItem("loggedInUser");

  if (loggedIn) {
    document.querySelectorAll(".tab[data-tab]").forEach(tab => {
      tab.classList.remove("hidden"); // reveal tabs
    });
  } else {
    document.querySelectorAll(".tab[data-tab]").forEach(tab => {
      tab.classList.add("hidden"); // keep them hidden
    });
  }
}

document.addEventListener("DOMContentLoaded", checkLogin);

// Close modal if click outside
window.addEventListener("click", e => {
  const modal = document.getElementById("logout-modal");
  if (!modal.classList.contains("hidden") && e.target === modal) {
    closeLogoutModal();
  }
});
