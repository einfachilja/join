const BASE_URL =
  "https://join-1f08e-default-rtdb.europe-west1.firebasedatabase.app";

async function registerUser(path = "") {
  let username = document.getElementById("username");
  let email = document.getElementById("email");
  let password = document.getElementById("password");
  let confirmPassword = document.getElementById("confirm_password");

  if (password.value !== confirmPassword.value) {
    alert("Passwörter stimmen nicht überein!"); // MUSS NOCH BEARBEITET WERDEN!
    return;
  }

  let response = await fetch(BASE_URL + path + ".json", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: username.value,
      email: email.value,
      password: password.value,
    }),
  });

  if (response.ok) {
    window.location.href = "/index.html";
  } else {
    alert("Fehler beim Senden"); // MUSS NOCH BEARBEITET WERDEN!
  }

  username.value = "";
  email.value = "";
  password.value = "";
  confirmPassword.value = "";

  return (responseToJson = await response.json());
}
