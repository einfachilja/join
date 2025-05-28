 /* // Check the current hour and set the greeting message accordingly
function greetUser() {
  let greetRef = document.getElementById('greets');
  let hour = new Date().getHours();

    if (hour < 12) {
      greetRef.innerHTML = "Good morning";
    }
    else if (hour < 18) {
      greetRef.innerHTML = "Good afternoon";
    }
    else {
      greetRef.innerHTML = "Good evening";
    }
}

*/

window.addEventListener("DOMContentLoaded", showWelcomeMessage);

function showWelcomeMessage() {
  const name = sessionStorage.getItem("userName") || "Guest";
  const color = sessionStorage.getItem("userColor") || "rgb(41, 171, 226)"; 
  const hour = new Date().getHours();

  const greeting =
    hour < 12 ? "Good morning" :
    hour < 18 ? "Good afternoon" :
                "Good evening";

  document.getElementById("welcome-message-text").textContent = `${greeting},`;
  
  const nameEl = document.getElementById("welcome-username");
  nameEl.textContent = name;
  nameEl.style.color = color;
}
