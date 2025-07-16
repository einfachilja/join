const BASE_URL = "https://join467-e19d8-default-rtdb.europe-west1.firebasedatabase.app/users/";
let arrayTasks = [];
let firebaseKey = localStorage.getItem("firebaseKey");

function showWelcomeMessage() {
  const name = sessionStorage.getItem("userName") || "Guest",
    displayName = name === "Guest" ? "" : name;
  const color = sessionStorage.getItem("userColor") || "rgb(41, 171, 226)",
    hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  if (window.innerWidth <= 1040) {
    if (!localStorage.getItem("mobileWelcomeShown")) {
      showMobileWelcomeOverlay(greeting, displayName, color);
      localStorage.setItem("mobileWelcomeShown", "true");
    }
  } else {
    showDesktopWelcomeMessage(greeting, displayName, color);
  }
}

/**
 * Shows welcome overlay on mobile view.
 * @param {string} greeting - Greeting text (e.g. "Good morning").
 * @param {string} name - User's name.
 * @param {string} color - Color for username text.
 */
function showMobileWelcomeOverlay(greeting, name, color) {
  const overlay = document.getElementById("mobile-welcome-overlay");
  const overlayText = document.getElementById("mobile-welcome-overlay-text");
  const overlayName = document.getElementById("mobile-welcome-overlay-username");

  overlay.classList.remove("d_none");
  overlayText.textContent = greeting;
  overlayName.textContent = name;
  overlayName.style.color = color;

  const main = document.querySelector("main");
  main.style.display = "none";

  setTimeout(() => {
    overlay.classList.add("d_none");
    main.style.display = "";
  }, 2000);
}

/**
 * Displays the welcome message on desktop view.
 * @param {string} greeting - Greeting text.
 * @param {string} name - User's name.
 * @param {string} color - Color for username text.
 */
function showDesktopWelcomeMessage(greeting, name, color) {
  document.getElementById("welcome-message-text").textContent = greeting;
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

    arrayTasks = [];
    for (const key in data) {
      arrayTasks.push({ ...data[key], firebaseKey: key });
    }

    updateBasicTaskStats(arrayTasks);
    updatePriorityAndDeadlineSummary(arrayTasks);
  } catch (error) {
    console.error("Error loading tasks:", error);
  }
}

/**
 * Updates the number of tasks for each status and total.
 * @param {Array} tasks - Array of task objects.
 */
function updateBasicTaskStats(tasks) {
  const counters = {
    todo: "summary_card_number_todo",
    progress: "summary_card_number_in_progress",
    feedback: "summary_card_number_await_feedback",
    done: "summary_card_number_done",
  };

  for (const status in counters) {
    const elementId = counters[status];
    document.getElementById(elementId).textContent = tasks.filter(t => t.status === status).length;
  }

  document.getElementById("summary_card_number_total").textContent = tasks.length;
}

/**
 * Updates priority display and nearest deadline summary.
 * @param {Array} tasks - Array of task objects.
 */
function updatePriorityAndDeadlineSummary(tasks) {
  const { priority, tasks: relevantTasks } = getRelevantPriorityTasks(tasks);

  updatePriorityUI(priority, relevantTasks.length);
  updateEarliestDeadline(relevantTasks);
}

/**
 * Filters open tasks and returns relevant ones by priority.
 * @param {Array} tasks - Array of task objects.
 * @returns {Object} An object with priority and filtered task list.
 */
function getRelevantPriorityTasks(tasks) {
  const open = tasks.filter(t => t.status !== "done");
  const high = open.filter(t => t.priority === "urgent");
  const medium = open.filter(t => t.priority === "medium");
  const low = open.filter(t => t.priority === "low");

  if (high.length > 0) return { priority: "urgent", tasks: high };
  if (medium.length > 0) return { priority: "medium", tasks: medium };
  if (low.length > 0) return { priority: "low", tasks: low };
  return { priority: null, tasks: [] };
}

/**
 * Updates the UI with priority icon, label and count.
 * @param {string|null} priority - "urgent", "medium", or null.
 * @param {number} count - Number of tasks with the priority.
 */
function updatePriorityUI(priority, count) {
  if (!priority) {
    setPriorityElements("none", "", "0", "priority-background");
    return;
  }

  const config = {
    urgent: "summary-urgent.svg",
    medium: "summary-medium.svg",
    low: "summary-low.svg",
  };

  const label = priority.charAt(0).toUpperCase() + priority.slice(1);
  const icon = `./assets/icons/summary/${config[priority]}?${Date.now()}`;
  const className = `priority-background priority-${priority}`;
  setPriorityElements("inline", label, count, className, icon, priority);
}

/**
 * Sets UI elements for displaying task priority.
 *
 * @param {string} display - CSS display value for the icon (e.g. "inline", "none").
 * @param {string} text - Label text for the priority level.
 * @param {string|number} count - Number of tasks with the given priority.
 * @param {string} className - CSS class to apply to the priority wrapper.
 * @param {string} [iconSrc=""] - Optional path to the priority icon.
 * @param {string} [alt=""] - Optional alt text for the priority icon.
 */
function setPriorityElements(display, text, count, className, iconSrc = "", alt = "") {
  const icon = document.getElementById("priority-icon");
  const label = document.getElementById("priority-label");
  const number = document.getElementById("summary_card_number_priority_high");
  const wrapper = document.getElementById("priority-wrapper");

  icon.style.display = display;
  label.textContent = text;
  number.textContent = count;
  wrapper.className = className;
  if (iconSrc) {
    icon.src = iconSrc;
    icon.alt = alt;
  }
}

/**
 * Finds and displays the nearest upcoming deadline.
 * @param {Array} tasks - Array of task objects.
 */
function updateEarliestDeadline(tasks) {
  const deadlineEl = document.getElementById("upcoming-deadline-date");
  const sublineEl = document.querySelector(".summary-date-subline");

  const dates = tasks
    .filter(t => t.status !== "done" && t.dueDate)
    .map(t => convertDateStringToDate(t.dueDate))
    .filter(d => d instanceof Date && !isNaN(d))
    .sort((a, b) => a - b);

  if (dates.length === 0) {
    deadlineEl.textContent = "No upcoming deadline";
    sublineEl.textContent = "";
    return;
  }

  deadlineEl.textContent = dates[0].toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  sublineEl.textContent = "Upcoming Deadline";
}




/**
 * Converts a date string to a valid JavaScript Date object.
 * Supports "dd/mm/yyyy" and "yyyy-mm-dd" formats.
 * @param {string} dateStr - The date string to convert.
 * @returns {Date|null} JavaScript Date object or null if invalid.
 */
function convertDateStringToDate(dateStr) {
  if (!dateStr) return null;

  const trimmed = dateStr.trim();
  const ddmmyyyy = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  const yyyymmdd = /^(\d{4})-(\d{2})-(\d{2})$/;

  if (ddmmyyyy.test(trimmed)) {
    const [day, month, year] = trimmed.split("/");
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  } else if (yyyymmdd.test(trimmed)) {
    return new Date(trimmed);
  } else {
    console.warn("Unknown date format:", trimmed);
    return new Date(NaN);
  }
}

