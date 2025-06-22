let confirmPasswordTouched = false;

// Clear any previous guest session
sessionStorage.removeItem("userName");
sessionStorage.removeItem("userColor");
sessionStorage.removeItem("email");

/**
 * Validates the email input format.
 * @returns {boolean} True if valid, otherwise false.
 */
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

/**
 * Validates password length (minimum 8 characters).
 * @returns {boolean} True if valid, otherwise false.
 */
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

/**
 * Checks if password and confirmation match.
 * @returns {boolean} True if matching, otherwise false.
 */
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

/**
 * Determines if password matching should be skipped.
 * @param {string} password - The main password.
 * @param {string} confirm - The confirmation input.
 * @returns {boolean} True if check should be skipped.
 */
function shouldSkipPasswordMatchCheck(password, confirm) {
  return (
    confirm === "" ||
    !confirmPasswordTouched ||
    password.length < 8 ||
    confirm.length < password.length
  );
}

/**
 * Enables or disables the sign-up button based on form validity.
 */
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

/**
 * Starts user registration if all inputs are valid.
 */
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

/**
 * Picks a random color for the new user profile.
 * @returns {string} A color string (RGB).
 */
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

/**
 * Saves a new user to Firebase and shows confirmation.
 * @param {string} name - The user's name.
 * @param {string} email - The user's email.
 * @param {string} password - The user's password.
 */
function saveUser(name, email, password) {
  const color = addColorToUserProfile();
  fetch(userfirebaseURL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password, color }),
  })
    .then(() => {
      sessionStorage.setItem("userName", name);
      sessionStorage.setItem("userColor", color);
      sessionStorage.setItem("email", email);

      showMessage("You Signed Up successfully", true);
      setTimeout(() => (window.location.href = "./summary.html"), 2000);
    })
    .catch(console.error);
}

/**
 * Displays a temporary success or error message.
 * @param {string} message - Message text.
 * @param {boolean} [isSuccess=false] - True if success, false if error.
 */
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

/**
 * Handles email input event.
 */
function handleEmailInput() {
  isEmailValid();
  checkFormValidity();
}

/**
 * Handles password input event.
 */
function handlePasswordInput() {
  isPasswordValid();
  doPasswordsMatch();
  checkFormValidity();
}

/**
 * Handles confirm password input event.
 */
function handleConfirmPasswordInput() {
  doPasswordsMatch();
  checkFormValidity();
}

/**
 * Updates the password visibility icon.
 * @param {HTMLInputElement} input - The input field element.
 */
function updatePasswordIcon(input) {
  const icon = input.closest(".input-container").querySelector(".toggle-password");
  if (!icon) return;

  if (input.value.length > 0) {
    icon.src = "./assets/img/2. log-sign-page/visibility_off.svg";
  } else {
    icon.src = "./assets/img/2. log-sign-page/lock-icon.svg";
  }
}

/**
 * Toggles password field visibility and icon.
 * @param {string} inputId - ID of the input field.
 * @param {HTMLElement} icon - Icon element to update.
 */
function togglePasswordWithIcon(inputId, icon) {
  const input = document.getElementById(inputId);
  if (!input) return;

  const isVisible = input.type === "text";
  input.type = isVisible ? "password" : "text";

  icon.src = isVisible
    ? "./assets/img/2. log-sign-page/visibility_off.svg"
    : "./assets/img/2. log-sign-page/visibility_eye.svg";
}

