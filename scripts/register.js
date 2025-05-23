let confirmPasswordTouched = false;


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

/* Toggles password visibility on lock icon click */
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

/* Enables or disables the submit button */
function checkFormValidity() {
  const name = document.getElementById("first-name").value.trim();
  const emailValid = isEmailValid();
  const passwordValid = isPasswordValid();
  const passwordsMatch = doPasswordsMatch();
  const privacyPolicy = document.getElementById("privacy-policy").checked;

  const allValid = name && emailValid && passwordValid && passwordsMatch && privacyPolicy;
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

/* Saves a new user to the Firebase Realtime Database + Displays a message */
function saveUser(name, email, password) {
  fetch(userfirebaseURL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password}),
  })
    .then(() => {
      showMessage("You Signed Up successfully", true);
      setTimeout(() => window.location.href = "./index.html", 2000);
    })
    .catch(console.error);
}

/* Displays a message */
function showMessage(message, isSuccess = false) {
  const messageBox = document.getElementById("message-box");

  messageBox.textContent = message;
  messageBox.style.backgroundColor = isSuccess ? "rgb(42, 54, 71)" : "rgb(220, 53, 69)";
  messageBox.classList.add("visible");
  messageBox.classList.remove("d-none");

  setTimeout(() => {
    messageBox.classList.remove("visible");
    messageBox.classList.add("d-none");
  }, 2000);
}

/* Handles input in the email field */
function handleEmailInput() {
  isEmailValid();
  checkFormValidity();
}


/* Handles input in the password field */
function handlePasswordInput() {
  isPasswordValid(); 
  doPasswordsMatch();
  checkFormValidity();
}


/* Handles input in the confirm-password field */
function handleConfirmPasswordInput() {
  doPasswordsMatch();
  checkFormValidity();
}


/* Adds an input or change event listener */
function addInputListener(id, handler, event = "input") {
  const el = document.getElementById(id);
  if (el) {
    el.addEventListener(event, handler);
  }
}


/* Adds a focus event listener */
function addFocusListener(id, handler) {
  const el = document.getElementById(id);
  if (el) {
    el.addEventListener("focus", handler);
  }
}

/* Initializes all listeners and setup */
function init() {
  initInputValidation();
  initPasswordVisibilityToggle();
}

/* Sets up all validation-related event listeners */
function initInputValidation() {
  addInputListener("first-name", checkFormValidity);
  addInputListener("email", handleEmailInput);
  addInputListener("password", handlePasswordInput);
  addInputListener("confirm-password", handleConfirmPasswordInput);
  addFocusListener("confirm-password", () => confirmPasswordTouched = true);
  addInputListener("privacy-policy", checkFormValidity, "change");
}

// Start everything
init();