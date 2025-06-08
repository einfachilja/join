const BASE_URL = "https://join467-e19d8-default-rtdb.europe-west1.firebasedatabase.app/users/";
let arrayTasks = []; // gespeicherte Aufgaben aus Firebase
let firebaseKey = localStorage.getItem("firebaseKey"); // Benutzer-spezifischer Key für Firebase

window.addEventListener("DOMContentLoaded", showWelcomeMessage); // Begrüßung anzeigen beim Laden

function showWelcomeMessage() {
  const name = sessionStorage.getItem("userName") || "Guest";
  const color = sessionStorage.getItem("userColor") || "rgb(41, 171, 226)";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  // Begrüßungstext und Benutzername einfügen
  document.getElementById("welcome-message-text").textContent = `${greeting},`;
  const nameEl = document.getElementById("welcome-username");
  nameEl.textContent = name;
  nameEl.style.color = color;
}

async function loadTasks() {
  try {
    const response = await fetch(`${BASE_URL}${firebaseKey}/tasks.json`);
    const data = await response.json();

    if (!data) {
      arrayTasks = [];
      updateBasicTaskStats([]);
      return;
    }

    // Tasks in ein Array umwandeln
    arrayTasks = Object.entries(data).map(([firebaseKey, task]) => ({ ...task, firebaseKey }));
    updateBasicTaskStats(arrayTasks);
    updatePriorityAndDeadlineSummary(arrayTasks);
  } catch (error) {
    console.error("Error loading tasks:", error);
  }
}

// ========== STATISTIKEN: TASK-STATUS ==========
function updateBasicTaskStats(tasks) {
 
  const counters = {
    todo: "summary_card_number_todo",
    progress: "summary_card_number_in_progress",
    feedback: "summary_card_number_await_feedback",
    done: "summary_card_number_done",
  };

  // Alle Zähler aktualisieren
  for (const [status, elementId] of Object.entries(counters)) {
    document.getElementById(elementId).textContent = tasks.filter(t => t.status === status).length;
  }

  // Gesamtanzahl der Aufgaben
  document.getElementById("summary_card_number_total").textContent = tasks.length;
}

// ========== PRIORITÄT & FÄLLIGKEIT ==========
function updatePriorityAndDeadlineSummary(tasks) {
  // Wichtige Aufgaben: zuerst high, dann medium
  const selected = getRelevantPriorityTasks(tasks);

  // UI-Elemente aktualisieren
  updatePriorityUI(selected.priority, selected.tasks.length);
  updateEarliestDeadline(selected.tasks);
}

// Hilfsfunktion: finde relevante Aufgaben nach Priorität
function getRelevantPriorityTasks(tasks) {
  const high = tasks.filter(t => t.priority === "high");
  const medium = tasks.filter(t => t.priority === "medium");

  if (high.length > 0) return { priority: "high", tasks: high };
  if (medium.length > 0) return { priority: "medium", tasks: medium };
  return { priority: null, tasks: [] }; 
}


// Hilfsfunktion: UI-Anzeige der Priorität (Text + Icon)
function updatePriorityUI(priority, count) {
  const label = document.getElementById("priority-label");
  const icon = document.getElementById("priority-icon");
  const number = document.getElementById("summary_card_number_priority_high");

  if (!priority) {
    icon.style.display = "none";
    label.textContent = "";
    number.textContent = "";
    return;
  }

  icon.style.display = "inline";
  const timestamp = new Date().getTime();
  icon.src = priority === "high"
    ? `./assets/icons/summary-urgent.png?${timestamp}`
    : `./assets/icons/medium.svg?${timestamp}`;
  icon.alt = priority;

  label.textContent = priority === "high" ? "Urgent" : "Medium";
  number.textContent = count;
}




// Hilfsfunktion: finde frühestes gültiges Fälligkeitsdatum
function updateEarliestDeadline(tasks) {
  const deadlines = tasks
    .map(t => convertDateStringToDate(t.dueDate))
    .filter(date => date instanceof Date && !isNaN(date)) // nur gültige Daten
    .sort((a, b) => a - b); // aufsteigend sortieren

  const deadlineEl = document.getElementById("upcoming-deadline-date");
  if (deadlineEl) {
    deadlineEl.textContent = deadlines.length > 0
      ? deadlines[0].toLocaleDateString("en-US", {
          year: "numeric", month: "long", day: "numeric"
        })
      : "No upcoming deadline";
  }
}

function capitalizeFirstLetter(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Datumsstring in ein gültiges Date-Objekt konvertieren
function convertDateStringToDate(dateStr) {
  if (!dateStr) return null;

  const trimmed = dateStr.trim();
  const ddmmyyyy = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  const yyyymmdd = /^(\d{4})-(\d{2})-(\d{2})$/;

  if (ddmmyyyy.test(trimmed)) {
    const [day, month, year] = trimmed.split("/");
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day)); // ← das ist sicher!
  } else if (yyyymmdd.test(trimmed)) {
    return new Date(trimmed);
  } else {
    console.warn("Unknown date format:", trimmed);
    return new Date(NaN);
  }
}


