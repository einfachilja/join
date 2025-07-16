const LOGIN_SUCCESSFUL = "./summary.html";

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

  const passwordField = document.getElementById("password");
  if (passwordField) {
  togglePasswordIcon(passwordField);
  }

}

function initLoaderAnimation() {
  const loader = document.getElementById("loader");
  const logo = document.getElementById("animated-logo");
  const staticLogo = document.getElementById("static-logo");

  if (window.innerWidth <= 800) {
    logo.src = "./assets/icons/index-register/join-logo-white.svg";
  }

  setTimeout(() => {
    if (window.innerWidth <= 800) {
      logo.src = "./assets/icons/index-register/join-logo.svg";
    }
    logo.classList.add("logo-finished");
    loader.style.background = "transparent";

    setTimeout(() => {
      loader.style.display = "none";
      staticLogo.style.display = "block";
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

  sessionStorage.setItem("showWelcomeOnLogin", "true");

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

  sessionStorage.setItem("showWelcomeOnLogin", "true");

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
    ? "./assets/icons/index-register/visibility_off.svg"
    : "./assets/icons/index-register/visibility_eye.svg";
}

/**
 * Changes icon while typing in password field
 * @param {HTMLInputElement} input - Target input field
 */
function togglePasswordIcon(input) {
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
