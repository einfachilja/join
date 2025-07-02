let confirmPasswordTouched = false;

const firstName = document.getElementById("first-name");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const privacy = document.getElementById("privacy-policy");

sessionStorage.removeItem("userName");
sessionStorage.removeItem("userColor");
sessionStorage.removeItem("email");

/**
 * Validates the email input format.
 * @returns {boolean} True if valid, otherwise false.
 */
function isEmailValid() {
  const email = emailInput.value.trim();
  const error = document.getElementById("email-error");
  if (email === "") return error.classList.remove("visible"), false;
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  error.classList.toggle("visible", !valid);
  return valid;
}

/**
 * Validates password length (minimum 8 characters).
 * @returns {boolean} True if valid, otherwise false.
 */
function isPasswordValid() {
  const password = passwordInput.value.trim();
  const error = document.getElementById("password-error");
  if (password === "") return error.classList.remove("visible"), false;
  const valid = password.length >= 8;
  error.classList.toggle("visible", !valid);
  return valid;
}

/**
 * Checks if password and confirmation match.
 * @returns {boolean} True if matching, otherwise false.
 */
function doPasswordsMatch() {
  const password = passwordInput.value.trim();
  const confirm = document.getElementById("confirm-password").value.trim();
  const error = document.getElementById("confirm-password-error");
  if (confirm === "" || !confirmPasswordTouched || password.length < 8 || confirm.length < password.length)
    return error.classList.remove("visible"), false;
  const match = password === confirm;
  error.classList.toggle("visible", !match);
  return match;
}

function checkFormValidity() {
  const name = firstName.value.trim();
  const allValid = name && isEmailValid() && isPasswordValid() && doPasswordsMatch() && privacy.checked;
  document.getElementById("register-btn").disabled = !allValid;
}

/**
 * Registers a new user after validating input and checking for duplicate emails.
 * - Saves user to Firebase
 * - Sets session storage
 * - Redirects to summary page
 * @returns {Promise<void>}
 */
async function registerUser() {
  const name = firstName.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  if (!isEmailValid() || !isPasswordValid() || !doPasswordsMatch() || !privacy.checked) return;
  const res = await fetch(userfirebaseURL);
  const users = await res.json();
  for (let k in users) if (users[k].email === email) {
    showMessage("E-Mail already registered!", false);
    return;
  }
  const color = addColorToUserProfile();
  await fetch(userfirebaseURL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password, color })
  });
  sessionStorage.setItem("userName", name);
  sessionStorage.setItem("userColor", color);
  sessionStorage.setItem("email", email);
  showMessage("You Signed Up successfully", true);
  setTimeout(() => location.href = "./summary.html", 2000);
}

/**
 * Picks a random color for the new user profile.
 * @returns {string} A color string (RGB).
 */
function addColorToUserProfile() {
  const colors = [
    "rgb(255, 122, 0)", "rgb(255, 94, 179)", "rgb(110, 82, 255)", "rgb(147, 39, 255)",
    "rgb(0, 190, 232)", "rgb(31, 215, 193)", "rgb(255, 116, 94)", "rgb(255, 163, 94)",
    "rgb(252, 113, 255)", "rgb(255, 199, 1)", "rgb(0, 56, 255)", "rgb(195, 255, 43)",
    "rgb(255, 230, 43)", "rgb(255, 70, 70)", "rgb(255, 187, 43)",
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Displays a temporary success or error message.
 * @param {string} message - Message text.
 * @param {boolean} [isSuccess=false] - True if success, false if error.
 */
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

function handleEmailInput() {
  isEmailValid();
  checkFormValidity();
}

function handlePasswordInput() {
  isPasswordValid();
  doPasswordsMatch();
  checkFormValidity();
  updatePasswordIcon(passwordInput);
}

function handleConfirmPasswordInput() {
  doPasswordsMatch();
  checkFormValidity();
  updatePasswordIcon(document.getElementById("confirm-password"));
}

/**
 * Updates the password visibility icon.
 * @param {HTMLInputElement} input - The input field element.
 */
function updatePasswordIcon(input) {
  const icon = input.closest(".input-container").querySelector(".toggle-password");
  if (!icon) return;

  if (input.value.length > 0) {
    icon.src = "./assets/icons/index-register/visibility_off.svg";
    icon.style.pointerEvents = "auto";
    icon.style.cursor = "pointer";
  } else {
    icon.src = "./assets/icons/index-register/lock-icon.svg";
    icon.style.pointerEvents = "none";
    icon.style.cursor = "default";
    input.type = "password";
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
    ? "./assets/icons/index-register/visibility_off.svg"
    : "./assets/icons/index-register/visibility_eye.svg";
}
