const BASE_URL = "https://join467-e19d8-default-rtdb.europe-west1.firebasedatabase.app/users/";

let arrayTasks = [];
let firebaseKey = localStorage.getItem("firebaseKey");
console.log("firebaseKey:", firebaseKey); // Debug-Ausgabe

/* ========== SHOW WELCOME MESSAGE ========== */
window.addEventListener("DOMContentLoaded", showWelcomeMessage);

function showWelcomeMessage() {
  const name = sessionStorage.getItem("userName") || "Guest";
  const color = sessionStorage.getItem("userColor") || "rgb(41, 171, 226)";
  const hour = new Date().getHours();

  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  document.getElementById("welcome-message-text").textContent = `${greeting},`;

  const nameEl = document.getElementById("welcome-username");
  nameEl.textContent = name;
  nameEl.style.color = color;
}

/* ========== LOAD TASKS FROM FIREBASE ========== */
async function loadTasks() {
  let response = await fetch(`${BASE_URL}${firebaseKey}/tasks.json`);
  let responseJson = await response.json();

  if (!responseJson) {
    arrayTasks = [];
    updateHTML([]);
    return;
  }

  arrayTasks = Object.entries(responseJson).map(([firebaseKey, task]) => {
    return { ...task, firebaseKey };
  });

  countTaskStatus(arrayTasks);
}

/* ========== COUNT TASKS STATUS FROM ARRAY ========== */
function countTaskStatus(arrayTasks) {
  let sumTotalTasks = arrayTasks.length;
  let sumStatusTodo = arrayTasks.filter((task) => task.status == "todo");
  let sumStatusInProgress = arrayTasks.filter((task) => task.status == "progress");
  let sumStatusAwaitFeedback = arrayTasks.filter((task) => task.status == "feedback");
  let sumStatusDone = arrayTasks.filter((task) => task.status == "done");
  let sumPriorityHigh = arrayTasks.filter((task) => task.priority == "high");

  document.getElementById("summary_card_number_todo").innerHTML = sumStatusTodo.length;
  document.getElementById("summary_card_number_in_progress").innerHTML = sumStatusInProgress.length;
  document.getElementById("summary_card_number_await_feedback").innerHTML = sumStatusAwaitFeedback.length;
  document.getElementById("summary_card_number_done").innerHTML = sumStatusDone.length;
  document.getElementById("summary_card_number_total").innerHTML = sumTotalTasks;
  document.getElementById("summary_card_number_priority_high").innerHTML = sumPriorityHigh.length;
}