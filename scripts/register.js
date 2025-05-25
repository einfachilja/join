const BASE_URL = "https://join-1f08e-default-rtdb.europe-west1.firebasedatabase.app";

// <== Diese Funktion registriert einen neuen Benutzer, indem sie dessen Benutzernamen, E-Mail und Passwort an eine Firebase Realtime Database sendet. ==>
async function registerUser(path = "") {

  let username = document.getElementById("username").value;
  let email = document.getElementById("email").value;
  let password = document.getElementById("password").value;
  let password2 = document.getElementById("password2").value;
  let checkbox = document.getElementById("checkbox").checked;

  // <== Überprüfen, ob alle Validierungen bestanden wurden ==>
  let isUsernameValid = checkUsername(username);
  let isEmailValid = checkEmail(email);
  let isPasswordValid = checkPassword(password);
  let isPassword2Valid = checkPassword2(password2);
  let isPasswordMatch = checkPasswordMatch(password, password2);
  let isCheckboxChecked = checkCheckbox(checkbox);

  if (!isUsernameValid || !isEmailValid || !isPasswordValid || !isPassword2Valid || !isPasswordMatch || !isCheckboxChecked) {
    return; // <== Registrierung abbrechen ==>
  } else {
    // <== Sende die Registrierungsdaten an die Firebase Realtime Database ==>
    try {
      let response = await fetch(BASE_URL + path + ".json", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "username": username,
          "email": email,
          "password": password
        })
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      let responseDataJson = await response.json();
      console.log("User registered successfully:", responseDataJson)
      // <== Overlay mit Erfolgsmeldung anzeigen ==>
      document.getElementById('overlay_success_registration').classList.remove('d-none');
      // <== Timeout, um zu index.html weiterzuleiten ==>
      setTimeout(() => {
        document.getElementById('overlay_success_registration').classList.add('d-none');
        // <== Nach 3 Sekunden zu index.html weiterleiten ==>
        window.location.href = "index.html"; // <== ANPASSEN OVERLAY ==>
      }, 1000);
    } catch (error) {
      console.error("Error registering user:", error);
    }

  }
}

// <== Username prüfen ==>
function checkUsername(username) {
  if (!username) {
    document.getElementById('error_username').innerHTML = "Please enter username.";
    document.getElementById('username').style.border = "1px solid red";
    return false;
  } else {
    document.getElementById('error_username').innerHTML = "";
    document.getElementById('username').style.border = "";
    return true;
  }
}

// <== Email prüfen ==>
function checkEmail(email) {
  if (!email) {
    document.getElementById('error_email').innerHTML = "Please enter email.";
    document.getElementById('email').style.border = "1px solid red";
    return false;
  }
  // <== Email-Format prüfen ==>
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    document.getElementById('error_email').innerHTML = "Please enter a valid email address."
    document.getElementById('email').style.border = "1px solid red";
    return false;
  }
  else {
    document.getElementById('error_email').innerHTML = "";
    document.getElementById('email').style.border = "";
    return true;
  }
}

// <== Passwort prüfen ==>
function checkPassword(password) {
  if (!password) {
    document.getElementById('error_password').innerHTML = "Please enter password.";
    document.getElementById('password').style.border = "1px solid red";
    return false;
  } else {
    document.getElementById('error_password').innerHTML = "";
    document.getElementById('password').style.border = "";
    return true;
  }
}

// <== Passwort2 prüfen ==>
function checkPassword2(password2) {
  if (!password2) {
    document.getElementById('error_password2').innerHTML = "Please confirm password.";
    document.getElementById('password2').style.border = "1px solid red";
    return false;
  } else {
    document.getElementById('error_password2').innerHTML = "";
    document.getElementById('password2').style.border = "";
    return true;
  }
}

// <== Passwort-Vergleich ==>
function checkPasswordMatch(password, password2) {
  if (password && password2 && password !== password2) {
    document.getElementById('error_password2').innerHTML = "Passwords do not match.";
    document.getElementById('password2').style.border = "1px solid red";
    return false;
  } else if (password && password2) {
    document.getElementById('error_password2').innerHTML = "";
    document.getElementById('password2').style.border = "";
    return true;
  }
}

// <== Checkbox prüfen ==>
function checkCheckbox(checkbox) {
  if (!checkbox) {
    document.getElementById('error_checkbox').innerHTML = "Please accept the terms and conditions.";
    document.getElementById('checkbox').style.outline = "1px solid red";
    return false;
  } else {
    document.getElementById('error_checkbox').innerHTML = "";
    document.getElementById('checkbox').style.outline = "";
    return true;
  }
}
