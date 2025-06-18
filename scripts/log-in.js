const LOGIN_SUCCESSFUL = "./summary.html";

window.onload = function () {
  initLoaderAnimation();
  initInputListeners();
  initPasswordVisibilityToggle();
  initLivePasswordIconChange();
};

// Blendet den Loader nach kurzer Zeit aus
function initLoaderAnimation() {
  const loader = document.getElementById("loader");

  setTimeout(() => {
    loader.style.opacity = "0";

    setTimeout(() => {
      loader.style.display = "none";
    }, 1000);
  }, 500);
}

// Prüft, ob die eingegebene E-Mail eine gültige Syntax hat
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

// Zeigt temporäre Erfolg- oder Fehlermeldungen an
function showMessage(message, isSuccess = false) {
  const messageBox = document.getElementById("message-box");
  messageBox.textContent = message;
  messageBox.style.backgroundColor = isSuccess
    ? "rgb(42, 54, 71)"   // dunkelblau für Erfolg
    : "rgb(220, 53, 69)"; // rot für Fehler
  messageBox.classList.remove("d-none");
  messageBox.style.display = "block";

  setTimeout(() => {
    messageBox.classList.add("d-none");
    messageBox.style.display = "none";
  }, 2000);
}

// Startet den Login-Prozess, sobald das Formular abgeschickt wird
function login() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!validateLoginEmail()) return;

  fetchUsers(email, password);
}

// Holt alle registrierten User aus der Datenbank
function fetchUsers(email, password) {
  fetch(userfirebaseURL)
    .then((response) => response.json())
    .then((users) => checkLogin(users, email, password))
    .catch(console.error);
}

// Überprüft Login-Daten gegen die Datenbank
function checkLogin(users, email, password) {
  const match = findUserWithKey(users, email);
  if (!match) return showMessage("E-Mail address not found!", false);

  const [firebaseKey, user] = match;
  if (user.password !== password) return showMessage("Incorrect password!", false);

  loginUser(user, firebaseKey);
}

// Findet den passenden Benutzer mit dessen Firebase-Key
function findUserWithKey(users, email) {
  return Object.entries(users || {}).find(([_, user]) => user.email === email);
}

// Führt alle Schritte nach erfolgreichem Login aus
function loginUser(user, firebaseKey) {
  sessionStorage.setItem("userName", user.name);
  sessionStorage.setItem("email", user.email);
  sessionStorage.setItem("userColor", user.color);
  localStorage.setItem("firebaseKey", firebaseKey); // WICHTIG: Nutzer-spezifischer Zugriff später für Task und Contacts

  showMessage("Login successful!", true);
  setTimeout(() => {
    window.location.href = LOGIN_SUCCESSFUL;
  }, 1500);
}

// Speichert eine Gast-Session ohne Registrierung
function guestLogin() {
  sessionStorage.setItem("userName", "Guest");
  sessionStorage.setItem("userColor", "rgb(41, 171, 226)");
  sessionStorage.setItem("email", "guest@join-test.de");
  localStorage.setItem("firebaseKey", "guest"); // wird genutzt, um Gast-Daten zuzuordnen

  showMessage("You are logged in as a guest!", true);
  setTimeout(() => {
    window.location.href = "./summary.html";
  }, 2000);
}

// Aktiviert Umschalten von Passwort-Sichtbarkeit
function initPasswordVisibilityToggle() {
  document.querySelectorAll(".toggle-password").forEach((icon) => {
    icon.addEventListener("click", () => {
      const targetId = icon.getAttribute("data-target");
      togglePasswordWithIcon(targetId, icon);
    });
  });
}

// Schaltet die Sichtbarkeit des Passwortfeldes um und wechselt das Icon zwischen „Sichtbar“ und „Versteckt“.
function togglePasswordWithIcon(inputId, iconElement) {
  const input = document.getElementById(inputId);
  const isVisible = input.type === "text";

  input.type = isVisible ? "password" : "text";
  iconElement.src = isVisible
    ? "./assets/img/2. log-sign-page/visibility_off.svg"
    : "./assets/img/2. log-sign-page/visibility_eye.svg";
}

// Ändert das Passwort-Icon dynamisch beim Tippen:
function initLivePasswordIconChange() {
  document.querySelectorAll("input[type='password']").forEach((input) => {
    input.addEventListener("input", () => {
      const icon = input.closest(".input-container").querySelector(".toggle-password");
      if (!icon) return;

      if (input.value.length > 0) {
        icon.src = "./assets/img/2. log-sign-page/visibility_off.svg";
      } else {
        icon.src = "./assets/img/2. log-sign-page/lock-icon.svg";
      }
    });
  });
}

// Initialisiert Event Listener für das Formular und den Gast-Login
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

// Vereinfachter EventListener-Wrapper für Inputs
function addInputListener(id, handler, event = "input") {
  const el = document.getElementById(id);
  if (el) {
    el.addEventListener(event, handler);
  }
}
