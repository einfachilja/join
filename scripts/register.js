let confirmPasswordTouched = false;

/* Alte Sessiondaten (von Gast) löschen*/
sessionStorage.removeItem("userName");
sessionStorage.removeItem("userColor");
sessionStorage.removeItem("email");

/* Validates the email input format */
function isEmailValid() {
  const email = document.getElementById("email").value.trim();
  const error = document.getElementById("email-error");

  if (email === "") {
    error.classList.remove("visible");
    return false;
  }

  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  error.classList.toggle("visible", !valid);
  return valid;
}

/* Validates the password length */
function isPasswordValid() {
  const password = document.getElementById("password").value.trim();
  const error = document.getElementById("password-error");

  if (password === "") {
    error.classList.remove("visible");
    return false;
  }

  const valid = password.length >= 8;
  error.classList.toggle("visible", !valid);
  return valid;
}

/* Validates that both passwords match */
function doPasswordsMatch() {
  const password = document.getElementById("password").value.trim();
  const confirm = document.getElementById("confirm-password").value.trim();
  const error = document.getElementById("confirm-password-error");

  if (shouldSkipPasswordMatchCheck(password, confirm)) {
    error.classList.remove("visible");
    return false;
  }

  const matches = password === confirm;
  error.classList.toggle("visible", !matches);
  return matches;
}

/* Skips match check if fields aren't ready */
function shouldSkipPasswordMatchCheck(password, confirm) {
  return (
    confirm === "" ||
    !confirmPasswordTouched ||
    password.length < 8 ||
    confirm.length < password.length
  );
}

/* Enables or disables the submit button */
function checkFormValidity() {
  const name = document.getElementById("first-name").value.trim();
  const emailValid = isEmailValid();
  const passwordValid = isPasswordValid();
  const passwordsMatch = doPasswordsMatch();
  const privacyPolicy = document.getElementById("privacy-policy").checked;

  const allValid =
    name && emailValid && passwordValid && passwordsMatch && privacyPolicy;
  document.getElementById("register-btn").disabled = !allValid;
}

/* Starts the registration process */
function registerUser() {
  const name = document.getElementById("first-name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  const emailValid = isEmailValid();
  const passwordValid = isPasswordValid();
  const match = doPasswordsMatch();
  const privacy = document.getElementById("privacy-policy").checked;

  if (!emailValid || !passwordValid || !match || !privacy) {
    return;
  }

  saveUser(name, email, password);
}

// adds a random color to the user profile
function addColorToUserProfile() {
  const colors = [
    "rgb(255, 122, 0)",
    "rgb(255, 94, 179)",
    "rgb(110, 82, 255)",
    "rgb(147, 39, 255)",
    "rgb(0, 190, 232)",
    "rgb(31, 215, 193)",
    "rgb(255, 116, 94)",
    "rgb(255, 163, 94)",
    "rgb(252, 113, 255)",
    "rgb(255, 199, 1)",
    "rgb(0, 56, 255)",
    "rgb(195, 255, 43)",
    "rgb(255, 230, 43)",
    "rgb(255, 70, 70)",
    "rgb(255, 187, 43)",
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

/* Saves a new user to the Firebase Realtime Database + Displays a message */
function saveUser(name, email, password) {
  const color = addColorToUserProfile();
  fetch(userfirebaseURL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password, color }),
  })
    .then(() => {
      // Session speichern, damit summary.js korrekt begrüßt
      sessionStorage.setItem("userName", name);
      sessionStorage.setItem("userColor", color);
      sessionStorage.setItem("email", email);

      showMessage("You Signed Up successfully", true);
      setTimeout(() => (window.location.href = "./summary.html"), 2000);
    })
    .catch(console.error);
}

/* Displays a message */
function showMessage(message, isSuccess = false) {
  const messageBox = document.getElementById("message-box");

  messageBox.textContent = message;
  messageBox.style.backgroundColor = isSuccess
    ? "rgb(42, 54, 71)"
    : "rgb(220, 53, 69)";
  messageBox.classList.add("visible");
  messageBox.classList.remove("d-none");

  setTimeout(() => {
    messageBox.classList.remove("visible");
    messageBox.classList.add("d-none");
  }, 2000);
}

function handleEmailInput() {
  isEmailValid();
  checkFormValidity();
}

function handlePasswordInput() {
  isPasswordValid();
  doPasswordsMatch();
  checkFormValidity();
}

function handleConfirmPasswordInput() {
  doPasswordsMatch();
  checkFormValidity();
}

function updatePasswordIcon(input) {
  const icon = input.closest(".input-container").querySelector(".toggle-password");
  if (!icon) return;

  if (input.value.length > 0) {
    icon.src = "./assets/img/2. log-sign-page/visibility_off.svg";
  } else {
    icon.src = "./assets/img/2. log-sign-page/lock-icon.svg";
  }
}

function togglePasswordWithIcon(inputId, icon) {
  const input = document.getElementById(inputId);
  if (!input) return;

  const isVisible = input.type === "text";
  input.type = isVisible ? "password" : "text";

  icon.src = isVisible
    ? "./assets/img/2. log-sign-page/visibility_off.svg"
    : "./assets/img/2. log-sign-page/visibility_eye.svg";
}
