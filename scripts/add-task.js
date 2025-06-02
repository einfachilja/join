// scripts/add-task.js

// state
let selectedPriority = "medium"; // default priority
const subtasks = [];
let contacts = []; // will hold fetched contacts
let assignedTo = null; // ID of selected contact

/**
 * Set selected priority and update button classes.
 * English: sets the clicked priority button to active.
 */
function setPriority(prio) {
  selectedPriority = prio;
  document
    .querySelectorAll("#prioGroup button")
    .forEach((b) => b.classList.toggle("active", b.dataset.value === prio));
}

/**
 * Toggle dropdown visibility for "Assigned to".
 * English: prevents event from bubbling and toggles class.
 */
function toggleDropdown(ev) {
  ev.stopPropagation();
  document.getElementById("assignedList").classList.toggle("hidden");
}

/**
 * Close the dropdown when clicking outside.
 * English: always hide the list.
 */
function closeDropdown() {
  document.getElementById("assignedList").classList.add("hidden");
}

/**
 * Fetch all contacts from Firebase and populate the dropdown.
 * English: transforms response into array and appends <li> items.
 */
function populateContacts() {
  fetch(
    "https://join467-e19d8-default-rtdb.europe-west1.firebasedatabase.app/users.json",
  )
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then((data) => {
      // English: convert object of users to array with id+name
      contacts = Object.entries(data || {}).map(([id, user]) => ({
        id,
        name: user.name,
      }));
      const ul = document.getElementById("assignedList");
      ul.innerHTML = ""; // clear previous
      contacts.forEach((c) => {
        const li = document.createElement("li");
        li.textContent = c.name;
        li.dataset.id = c.id;
        li.onclick = () => selectContact(c);
        ul.appendChild(li);
      });
    })
    .catch((err) => console.error("Could not load contacts:", err));
}

/**
 * Handle selecting a contact: set label and close dropdown.
 * English: update assignedTo and refresh create-button state.
 */
function selectContact(contact) {
  assignedTo = contact.id;
  const label = document.getElementById("assignedLabel");
  label.textContent = contact.name; // English: show selected name
  const arrow = document.createElement("span");
  arrow.className = "dropdown-arrow";
  arrow.textContent = "⌄"; // English: re-add arrow icon
  label.appendChild(arrow);
  document.getElementById("assignedList").classList.add("hidden");
  toggleCreateBtn(); // English: check if form can be submitted now
}

/**
 * Add a new subtask to the list and clear input.
 * English: push to array and append <li> element.
 */
function addSubtask() {
  const inp = document.getElementById("subtaskInput");
  const txt = inp.value.trim();
  if (!txt) return; // English: do nothing on empty
  subtasks.push(txt);
  const li = document.createElement("li");
  li.textContent = txt;
  document.getElementById("subtaskList").appendChild(li);
  inp.value = "";
}

/**
 * Validate the date input: if empty or invalid, add error class.
 * English: if type=date, only check non-empty; else regex.
 */
function validateDate() {
  const el = document.getElementById("dueDate");
  if (el.type === "date") {
    el.classList.toggle("input-error", !el.value);
  } else {
    el.classList.toggle("input-error", !isValidDate(el.value.trim()));
  }
}

/**
 * Check toggle of Create Task button.
 * English: enable only if title + date + category + assignedTo are set.
 */
function toggleCreateBtn() {
  const title = document.getElementById("title").value.trim();
  const dueEl = document.getElementById("dueDate");
  const dueVal = dueEl.value;
  const cat = document.getElementById("category").value;
  const btn = document.getElementById("createBtn");

  // for type=date, just require non-empty
  const dateOk = dueEl.type === "date" ? !!dueVal : isValidDate(dueVal);
  btn.disabled = !(title && dateOk && cat && assignedTo);
}

/**
 * Regex check for DD/MM/YYYY.
 * English: validate string matches logical calendar date.
 */
function isValidDate(str) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(str);
  if (!m) return false;
  const [_, d, mo, y] = m.map(Number);
  const dt = new Date(y, mo - 1, d);
  return (
    dt.getFullYear() === y && dt.getMonth() === mo - 1 && dt.getDate() === d
  );
}

/**
 * Build the task object and log to console.
 * English: simply assemble fields; actual push to backend not implemented here.
 */
function createTask() {
  const task = {
    title: document.getElementById("title").value.trim(),
    description: document.getElementById("description").value.trim(),
    dueDate: document.getElementById("dueDate").value.trim(),
    priority: selectedPriority,
    category: document.getElementById("category").value,
    assignedTo,
    subtasks: [...subtasks],
  };
  console.log("Task ready:", task);
  alert("Task logged to console."); // English: user feedback
}

// --- Initialize on load ---
setPriority("medium"); // English: default priority selection
populateContacts(); // English: fetch and render contacts dropdown
