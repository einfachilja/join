// scripts/add-task.js

// state
let selectedPriority = "medium"; // default
const subtasks = [];
let contacts = [];
let assignedTo = null;

// priority logic
function setPriority(prio) {
  selectedPriority = prio;
  document
    .querySelectorAll("#prioGroup button")
    .forEach((b) => b.classList.toggle("active", b.dataset.value === prio));
}

// dropdown logic
function toggleDropdown(ev) {
  ev.stopPropagation();
  document.getElementById("assignedList").classList.toggle("hidden");
}
function closeDropdown() {
  document.getElementById("assignedList").classList.add("hidden");
}

// fetch contacts
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

// select contact
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

// subtask logic
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

// --- Date Validation & Error State ---
function validateDate() {
  const el = document.getElementById("dueDate");
  if (el.type === "date") {
    // always valid if non-empty
    el.classList.toggle("input-error", !el.value);
  } else {
    el.classList.toggle("input-error", !isValidDate(el.value.trim()));
  }
}

// --- Form Button Enable/Disable ---
function toggleCreateBtn() {
  const title = document.getElementById("title").value.trim();
  const dueEl = document.getElementById("dueDate");
  const dueVal = dueEl.value;
  const cat = document.getElementById("category").value;
  const btn = document.getElementById("createBtn");

  // for date-input just check non-empty, else use isValidDate
  const dateOk = dueEl.type === "date" ? !!dueVal : isValidDate(dueVal);
  btn.disabled = !(title && dateOk && cat && assignedTo);
}

// create task
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
  alert("Task logged to console.");
}

// init
setPriority("medium");
populateContacts();
