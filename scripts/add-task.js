// scripts/add-task.js

// state
let selectedPriority = "medium"; // default priority
const subtasks = [];
let contacts = []; // will hold fetched contacts
let assignedTo = null; // ID of selected contact

/**
 * Set selected priority and update button classes.
 */
function setPriority(prio) {
  selectedPriority = prio;
  document
    .querySelectorAll("#prioGroup button")
    .forEach((b) => b.classList.toggle("active", b.dataset.value === prio));
}

/**
 * Toggle dropdown visibility for "Assigned to".
 */
function toggleDropdown(ev) {
  ev.stopPropagation();
  document.getElementById("assignedList").classList.toggle("hidden");
}

/**
 * Close dropdown when clicking outside.
 */
function closeDropdown() {
  document.getElementById("assignedList").classList.add("hidden");
}

/**
 * Fetch all contacts from Firebase and populate the dropdown.
 */
function populateContacts() {
  fetch(
    "https://join467-e19d8-default-rtdb.europe-west1.firebasedatabase.app/users.json"
  )
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then((data) => {
      contacts = Object.entries(data || {}).map(([id, user]) => ({
        id,
        name: user.name,
      }));

      const ul = document.getElementById("assignedList");
      ul.innerHTML = "";

      if (contacts.length === 0) {
        const li = document.createElement("li");
        li.textContent = "No contacts found.";
        li.style.color = "#999";
        li.style.pointerEvents = "none";
        ul.appendChild(li);
        return;
      }

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
 * Handle selecting a contact.
 */
function selectContact(contact) {
  assignedTo = contact.id;
  const label = document.getElementById("assignedLabel");
  label.textContent = contact.name;
  const arrow = document.createElement("span");
  arrow.className = "dropdown-arrow";
  arrow.textContent = "⌄";
  label.appendChild(arrow);
  document.getElementById("assignedList").classList.add("hidden");
  toggleCreateBtn();
}

/**
 * Add a new subtask.
 */
function addSubtask() {
  const inp = document.getElementById("subtaskInput");
  const txt = inp.value.trim();
  if (!txt) return;
  subtasks.push(txt);
  const li = document.createElement("li");
  li.textContent = txt;
  document.getElementById("subtaskList").appendChild(li);
  inp.value = "";
}

/**
 * Validate the date input.
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
 * Toggle create button activation.
 */
function toggleCreateBtn() {
  const title = document.getElementById("title").value.trim();
  const dueEl = document.getElementById("dueDate");
  const dueVal = dueEl.value;
  const cat = document.getElementById("category").value;
  const btn = document.getElementById("createBtn");
  const dateOk = dueEl.type === "date" ? !!dueVal : isValidDate(dueVal);
  btn.disabled = !(title && dateOk && cat && assignedTo);
}

/**
 * Regex date validation (optional fallback).
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
 * Send task to backend (Firebase).
 */
async function sendTaskToBackend(task) {
  const response = await fetch(
    "https://join467-e19d8-default-rtdb.europe-west1.firebasedatabase.app/tasks.json",
    {
      method: "POST",
      body: JSON.stringify(task),
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  return response.ok;
}

/**
 * Create and submit the task.
 */
async function createTask() {
  const task = {
    title: document.getElementById("title").value.trim(),
    description: document.getElementById("description").value.trim(),
    dueDate: document.getElementById("dueDate").value.trim(),
    priority: selectedPriority,
    category: document.getElementById("category").value,
    assignedTo,
    subtasks: [...subtasks],
    createdAt: new Date().toISOString(),
  };

  console.log("Task ready:", task);

  // --- OPTIONAL BACKEND SEND ---
  const success = await sendTaskToBackend(task);
  if (success) {
    alert("Task successfully created!");
    resetForm();
  } else {
    alert("Task could not be saved. Please try again.");
  }
}

/**
 * Reset all form inputs, dropdowns, and subtasks.
 */
function resetForm() {
  document.getElementById("taskForm").reset();
  document.getElementById("subtaskList").innerHTML = "";
  subtasks.length = 0;
  assignedTo = null;
  selectedPriority = "medium";
  setPriority("medium");
  document.getElementById("assignedLabel").innerHTML =
    "Select contacts <span class='dropdown-arrow'>⌄</span>";
  toggleCreateBtn();
}

// --- Initialize on load ---
setPriority("medium");
populateContacts();
