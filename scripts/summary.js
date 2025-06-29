const BASE_URL =
  "https://join467-e19d8-default-rtdb.europe-west1.firebasedatabase.app/users/";
let arrayTasks = []; // gespeicherte Aufgaben aus Firebase
let firebaseKey = localStorage.getItem("firebaseKey"); // Benutzer-spezifischer Key für Firebase

window.addEventListener("DOMContentLoaded", showWelcomeMessage); // Begrüßung anzeigen beim Laden

function showWelcomeMessage() {
  const name = sessionStorage.getItem("userName") || "Guest";
  const color = sessionStorage.getItem("userColor") || "rgb(41, 171, 226)";
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  // === MOBILE OVERLAY (bis 1040px) ===
  if (window.innerWidth <= 1040) {
    const overlay = document.getElementById("mobile-welcome-overlay");
    const overlayText = document.getElementById("mobile-welcome-overlay-text");
    const overlayName = document.getElementById("mobile-welcome-overlay-username");
    const main = document.querySelector("main");

    overlay.classList.remove("d_none");
    overlayText.textContent = `${greeting}`;
    overlayName.textContent = name;
    overlayName.style.color = color;

    main.style.display = "none";
    setTimeout(() => {
      overlay.classList.add("d_none");
      main.style.display = "";
    }, 1500);
  }

  // === DESKTOP BEGRÜSSUNG ===
  const welcomeText = document.getElementById("welcome-message-text");
  const welcomeName = document.getElementById("welcome-username");

  if (welcomeText && welcomeName) {
    welcomeText.textContent = `${greeting}`;
    welcomeName.textContent = name;
    welcomeName.style.color = color;
  }

// === USER-PROFILE KREIS (Initialen + Hintergrund) ===
const profileEl = document.querySelector(".user-profile");
const initialsEl = document.getElementById("user-initials");

if (profileEl && initialsEl) {
  const initials = (name.match(/\b\w/g) || []).join("").toUpperCase().slice(0, 2);
  initialsEl.textContent = initials;
  profileEl.style.backgroundColor = color;

  // 🧼 Entferne alte Styles, damit kein color überschreibt
  initialsEl.removeAttribute("style");

  // ✅ Setze weiße Schriftfarbe und erzwinge sie mit !important
  initialsEl.style.setProperty("color", "#ffffff", "important");
}
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
    arrayTasks = Object.entries(data).map(([firebaseKey, task]) => ({
      ...task,
      firebaseKey,
    }));
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
    document.getElementById(elementId).textContent = tasks.filter(
      (t) => t.status === status
    ).length;
  }

  // Gesamtanzahl der Aufgaben
  document.getElementById("summary_card_number_total").textContent =
    tasks.length;
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
  const open = tasks.filter((t) => t.status !== "done");

  const high = open.filter((t) => t.priority === "urgent");
  const medium = open.filter((t) => t.priority === "medium");

  if (high.length > 0) return { priority: "urgent", tasks: high };
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
    number.textContent = "0";
    return;
  }

  icon.style.display = "inline";
  const ts = Date.now();
  icon.src =
    priority === "urgent"
      ? `./assets/icons/summary-urgent.png?${ts}`
      : `./assets/icons/medium.svg?${ts}`;
  icon.alt = priority;

  label.textContent = priority === "urgent" ? "Urgent" : "Medium";
  number.textContent = count;
}

// Hilfsfunktion: finde frühestes gültiges Fälligkeitsdatum
function updateEarliestDeadline(tasks) {
  const deadlines = tasks
    .filter((t) => t.status !== "done") // erledigte Tasks ausschließen
    .map((t) => convertDateStringToDate(t.dueDate))
    .filter((date) => date instanceof Date && !isNaN(date)) // nur gültige Daten
    .sort((a, b) => a - b);

  const deadlineEl = document.getElementById("upcoming-deadline-date");
  if (deadlineEl) {
    deadlineEl.textContent =
      deadlines.length > 0
        ? deadlines[0].toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
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
