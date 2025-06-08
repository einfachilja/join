// KOMPLETT NEUER CODE - NOCHMAL CHECKEN

const BASE_URL = "https://join467-e19d8-default-rtdb.europe-west1.firebasedatabase.app/users/";
let arrayTasks = [];
let firebaseKey = localStorage.getItem("firebaseKey");

/* ========== WELCOME MESSAGE ========== */
window.addEventListener("DOMContentLoaded", showWelcomeMessage);

function showWelcomeMessage() {
  const name = sessionStorage.getItem("userName") || "Guest";
  const color = sessionStorage.getItem("userColor") || "rgb(41, 171, 226)";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  document.getElementById("welcome-message-text").textContent = `${greeting},`;
  const nameEl = document.getElementById("welcome-username");
  nameEl.textContent = name;
  nameEl.style.color = color;
}

/* ========== LOAD TASKS FROM FIREBASE ========== */
async function loadTasks() {
  try {
    const response = await fetch(`${BASE_URL}${firebaseKey}/tasks.json`);
    const data = await response.json();

    if (!data) {
      arrayTasks = [];
      updateBasicTaskStats([]);
      return;
    }

    arrayTasks = Object.entries(data).map(([firebaseKey, task]) => ({ ...task, firebaseKey }));
    updateBasicTaskStats(arrayTasks);
    updatePriorityAndDeadlineSummary(arrayTasks);
  } catch (error) {
    console.error("Error loading tasks:", error);
  }
}

/* ========== TASK COUNTERS ========== */
function updateBasicTaskStats(tasks) {
  document.getElementById("summary_card_number_todo").textContent = tasks.filter(t => t.status === "todo").length;
  document.getElementById("summary_card_number_in_progress").textContent = tasks.filter(t => t.status === "progress").length;
  document.getElementById("summary_card_number_await_feedback").textContent = tasks.filter(t => t.status === "feedback").length;
  document.getElementById("summary_card_number_done").textContent = tasks.filter(t => t.status === "done").length;
  document.getElementById("summary_card_number_total").textContent = tasks.length;
}

/* ========== PRIORITY & DEADLINE LOGIK ========== */
function updatePriorityAndDeadlineSummary(tasks) {
  // Alle gültigen Aufgaben nach Priorität gruppieren
  const priorities = {
    high: tasks.filter(t => t.priority === "high"),
    medium: tasks.filter(t => t.priority === "medium")
  };

  let selectedTasks = priorities.high.length > 0 ? priorities.high : priorities.medium;
  let selectedPriority = priorities.high.length > 0 ? "high" : "medium";

  // Zeige Anzahl der ausgewählten Aufgaben
  document.getElementById("summary_card_number_priority_high").textContent = selectedTasks.length;

  // Label & Icon aktualisieren
  const priorityLabel = document.getElementById("priority-label");
  if (priorityLabel) priorityLabel.textContent = capitalizeFirstLetter(selectedPriority);

  const priorityIcon = document.getElementById("priority-icon");
  if (priorityIcon) {
    priorityIcon.src =
      selectedPriority === "high"
        ? "./assets/icons/summary-urgent.png"
        : "./assets/icons/medium.svg";
    priorityIcon.alt = selectedPriority;
  }

  // Fälligkeitsdaten extrahieren & filtern
  const deadlines = selectedTasks
    .map(t => convertDateStringToDate(t.dueDate))
    .filter(date => date instanceof Date && !isNaN(date))
    .sort((a, b) => a - b);

  // Zeige frühestes Datum
  const deadlineEl = document.getElementById("upcoming-deadline-date");
  if (deadlines.length > 0 && deadlineEl) {
    const earliestDate = deadlines[0].toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    deadlineEl.textContent = earliestDate;
  } else if (deadlineEl) {
    deadlineEl.textContent = "No upcoming deadline";
  }
}


/* ========== HILFSFUNKTIONEN ========== */
function capitalizeFirstLetter(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function convertDateStringToDate(dateStr) {
  if (!dateStr) return null;

  // Versuche mehrere Formate
  const trimmed = dateStr.trim();

  // Format: DD/MM/YYYY
  const ddmmyyyy = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  const yyyymmdd = /^(\d{4})-(\d{2})-(\d{2})$/;

  if (ddmmyyyy.test(trimmed)) {
    const [day, month, year] = trimmed.split("/");
    return new Date(`${year}-${month}-${day}`);
  } else if (yyyymmdd.test(trimmed)) {
    return new Date(trimmed); // native support
  } else {
    console.warn("Unknown date format:", trimmed);
    return new Date(NaN); // ungültiges Datum
  }
}