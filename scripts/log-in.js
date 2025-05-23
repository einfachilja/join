/* ========== GLOBAL ========== */
const LOGIN_SUCCESSFUL = "./index.html";

/* ========== INIT ========== */
window.onload = function () {
  initLoaderAnimation();
  initInputListeners();
  initPasswordVisibilityToggle();
};

/* ========== LOADER LOGO ANIMATION ========== */
function initLoaderAnimation() {
  const loader = document.getElementById("loader");

  setTimeout(() => {
    loader.style.opacity = "0";

    setTimeout(() => {
      loader.style.display = "none";
    }, 1000);
  }, 500);
}


/* ========== VALIDATION ========== */
function validateLoginEmail() {
  const emailInput = document.getElementById("email");
  const error = document.getElementById("login-email-error");
  const email = emailInput.value.trim();

  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  if (!email || isValid) {
    error.classList.remove("visible");
    return isValid;
  } else {
    error.textContent = "Please enter a valid email address.";
    error.classList.add("visible");
    return false;
  }
}

/* ========== MESSAGE DISPLAY ========== */
function showMessage(message, isSuccess = false) {
  const messageBox = document.getElementById("message-box");
  messageBox.textContent = message;
  messageBox.style.backgroundColor = isSuccess ? "rgb(42, 54, 71)" : "rgb(220, 53, 69)";
  messageBox.classList.remove("d-none");
  messageBox.style.display = "block";

  setTimeout(() => {
    messageBox.classList.add("d-none");
    messageBox.style.display = "none";
  }, 2000);
}

/* ========== LOGIN PROCESS ========== */
function login() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  const emailValid = validateLoginEmail();
  if (!emailValid) return;

  fetchUsers(email, password);
}

function fetchUsers(email, password) {
  fetch(userfirebaseURL)
    .then(response => response.json())
    .then(users => checkLogin(users, email, password))
    .catch(console.error);
}

function checkLogin(users, email, password) {
  const userList = Object.values(users || {});
  const user = userList.find(u => u.email === email);

  if (!user) {
    showMessage("E-Mail address not found!", false);
    return;
  }

  if (user.password !== password) {
    showMessage("Incorrect password!", false);
    return;
  }

  showMessage("Login successful!", true);
  sessionStorage.setItem("userName", user.name);
  sessionStorage.setItem("email", user.email); // SessionStorage für später relevant, wenn es auf die Join Main Seite geht.

  setTimeout(() => {
    window.location.href = LOGIN_SUCCESSFUL;
  }, 1500);
}

/* ========== GUEST LOGIN ========== */
function guestLogin() {
  sessionStorage.setItem("userName", "Guest");
  sessionStorage.setItem("email", "guest@join-test.de");
 // SessionStorage für später relevant, wenn es auf die Join Main Seite geht.
  showMessage("You are logged in as a guest!", true);

  setTimeout(() => {
    window.location.href = LOGIN_SUCCESSFUL; 
  }, 2000);
}

/* ========== PASSWORD VISIBILITY ========== */
function initPasswordVisibilityToggle() {
  document.querySelectorAll(".toggle-password").forEach(icon => {
    icon.addEventListener("click", () => {
      const targetId = icon.getAttribute("data-target");
      const input = document.getElementById(targetId);
      if (input) {
        input.type = input.type === "password" ? "text" : "password";
      }
    });
  });
}

/* ========== EVENT LISTENERS ========== */
function initInputListeners() {
  const loginForm = document.querySelector(".log-in-form");
  const guestBtn = document.querySelector(".guest-log-in-button");

  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      login();
    });
  }

  if (guestBtn) {
    guestBtn.addEventListener("click", guestLogin);
  }

  addInputListener("email", validateLoginEmail);
}

function addInputListener(id, handler, event = "input") {
  const el = document.getElementById(id);
  if (el) {
    el.addEventListener(event, handler);
  }
}

