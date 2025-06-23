const LOGIN_SUCCESSFUL = "./summary.html";

/**
 * Handles login page load:
 * - Skips loader if user returns from register
 * - Otherwise shows loader animation
 */
function handleLoginPageLoad() {
  const skipLoader = sessionStorage.getItem("skipLoader");

  if (skipLoader === "true") {
    sessionStorage.removeItem("skipLoader");
    document.getElementById("loader").style.display = "none";
    document.getElementById("static-logo").style.display = "block"; 
  } else {
    const loader = document.getElementById("loader");
    loader.classList.remove("d-none");
    initLoaderAnimation();
  }

}

/**
 * Plays loader animation and animates logo
 */
function initLoaderAnimation() {
  const loader = document.getElementById("loader");
  const logo = document.getElementById("animated-logo");

  // Show white logo for small screens
  if (window.innerWidth <= 800) {
    document.getElementById("animated-logo").src =
      "./assets/img/1. join-frontpage/join-logo-white.svg";
  }

  setTimeout(() => {
    // Start animation: shrink and move logo
    if (window.innerWidth <= 800) {
      logo.src = "./assets/img/1. join-frontpage/join-logo.svg";
    }

    logo.classList.add("logo-finished");
    loader.style.background = "transparent";

    setTimeout(() => {
      loader.style.pointerEvents = "none";
    }, 800);
  }, 500);
}

/**
 * Validates login email format
 * @returns {boolean} True if valid or empty, false otherwise
 */
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

/**
 * Shows a temporary message box
 * @param {string} message - Text to display
 * @param {boolean} [isSuccess=false] - True for success, false for error
 */
function showMessage(message, isSuccess = false) {
  const messageBox = document.getElementById("message-box");
  messageBox.textContent = message;
  messageBox.style.backgroundColor = isSuccess
    ? "rgb(42, 54, 71)"
    : "rgb(220, 53, 69)";
  messageBox.classList.remove("d-none");
  messageBox.style.display = "block";

  setTimeout(() => {
    messageBox.classList.add("d-none");
    messageBox.style.display = "none";
  }, 2000);
}

/**
 * Starts login process from form
 */
function login() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!validateLoginEmail()) return;

  fetchUsers(email, password);
}

/**
 * Loads user data and verifies login
 * @param {string} email - Entered email
 * @param {string} password - Entered password
 */
function fetchUsers(email, password) {
  fetch(userfirebaseURL)
    .then((response) => response.json())
    .then((users) => checkLogin(users, email, password))
    .catch(console.error);
}

/**
 * Compares credentials with database
 * @param {Object} users - All users from Firebase
 * @param {string} email - Input email
 * @param {string} password - Input password
 */
function checkLogin(users, email, password) {
  const match = findUserWithKey(users, email);
  if (!match) return showMessage("E-Mail address not found!", false);

  const [firebaseKey, user] = match;
  if (user.password !== password) return showMessage("Incorrect password!", false);

  loginUser(user, firebaseKey);
}

/**
 * Finds a user object by email
 * @param {Object} users - All users
 * @param {string} email - Email to search
 * @returns {[string, Object]|undefined} Firebase key and user
 */
function findUserWithKey(users, email) {
  return Object.entries(users || {}).find(([_, user]) => user.email === email);
}

/**
 * Logs in user and stores session data
 * @param {Object} user - User object
 * @param {string} firebaseKey - User's Firebase key
 */
function loginUser(user, firebaseKey) {
  sessionStorage.setItem("userName", user.name);
  sessionStorage.setItem("email", user.email);
  sessionStorage.setItem("userColor", user.color);
  localStorage.setItem("firebaseKey", firebaseKey);

  showMessage("Login successful!", true);
  setTimeout(() => {
    window.location.href = LOGIN_SUCCESSFUL;
  }, 1500);
}

/**
 * Logs in as guest user
 */
function guestLogin() {
  sessionStorage.setItem("userName", "Guest");
  sessionStorage.setItem("userColor", "rgb(41, 171, 226)");
  sessionStorage.setItem("email", "guest@join-test.de");
  localStorage.setItem("firebaseKey", "guest");

  showMessage("You are logged in as a guest!", true);
  setTimeout(() => {
    window.location.href = "./summary.html";
  }, 2000);
}

/**
 * Toggles password visibility and icon
 * @param {string} inputId - Password input field ID
 * @param {HTMLElement} iconElement - Clicked icon
 */
function togglePasswordWithIcon(inputId, iconElement) {
  const input = document.getElementById(inputId);
  const isVisible = input.type === "text";

  input.type = isVisible ? "password" : "text";
  iconElement.src = isVisible
    ? "./assets/img/2. log-sign-page/visibility_off.svg"
    : "./assets/img/2. log-sign-page/visibility_eye.svg";
}

/**
 * Changes icon while typing in password field
 * @param {HTMLInputElement} input - Target input field
 */
function togglePasswordIcon(input) {
  const icon = input.closest(".input-container").querySelector(".toggle-password");
  if (!icon) return;

  icon.src = input.value.length > 0
    ? "./assets/img/2. log-sign-page/visibility_off.svg"
    : "./assets/img/2. log-sign-page/lock-icon.svg";
}
