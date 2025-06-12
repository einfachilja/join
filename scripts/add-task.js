let firebaseKey = localStorage.getItem("firebaseKey");

// ==== STATE ====
let selectedPriority = "medium";
const subtasks = [];
let contacts = [];
let selectedContacts = [];

// ====== Helfer zum Stoppen der Klick-Propagation ======
function stopPropagation(e) {
  e.stopPropagation();
}

// ====== Dropdown schließen, wenn irgendwo im Body geklickt wird ======
function closeDropdown() {
  document.getElementById("dropdown-content")?.classList.remove("visible");
  document.getElementById("dropdown-toggle")?.classList.remove("open");
}

// ====== Priority-Button auswählen ======
function selectPriority(prio) {
  selectedPriority = prio;
  document.querySelectorAll("#buttons-prio button").forEach((b) => {
    b.classList.toggle("selected", b.dataset.prio === prio);
  });
  updateSubmitState();
}

// ====== Assign-Dropdown toggle ======
function toggleAssignDropdown() {
  event.stopPropagation();
  document.getElementById("dropdown-toggle").classList.toggle("open");
  document.getElementById("dropdown-content").classList.toggle("visible");
  if (!document.getElementById("dropdown-content").innerHTML) {
    renderAssignOptions();
  }

}

// schließe Dropdown, wenn außerhalb geklickt
document.addEventListener("click", (e) => {
  if (!document.getElementById("dropdown-wrapper").contains(e.target)) {
    closeDropdown();
  }
});

// ==== INIT ====
document.addEventListener("DOMContentLoaded", () => {
  document
    .getElementById("buttons-prio")
    .querySelectorAll("button")
    .forEach((btn) => {
      if (btn.dataset.prio === "medium") btn.classList.add("selected");
    });
  fetchContacts();
  setupEventListeners();
});

// ==== FETCH CONTACTS ====
async function fetchContacts() {
  try {
    const res = await fetch(
      `https://join467-e19d8-default-rtdb.europe-west1.firebasedatabase.app/users/${firebaseKey}/contacts.json`
    );
    const data = await res.json();
    contacts = Object.entries(data || {})
      .filter(([_, u]) => u && typeof u.name === "string" && u.name.trim())
      .map(([_, u]) => ({
        name: u.name.trim(),
        color: u.color || "#888",
      }));
  } catch (err) {
    console.error("Contacts fetch error:", err);
  }
}

// ==== EVENTS ====
function setupEventListeners() {
  document
    .getElementById("dropdown-toggle")
    .addEventListener("click", toggleAssignDropdown);
  document
    .getElementById("dueDate")
    .addEventListener("blur", () => validateDate() && updateSubmitState());
}

// ==== PRIORITY ====
function selectPriority(prio) {
  selectedPriority = prio;
  document
    .querySelectorAll("#buttons-prio button")
    .forEach((b) => b.classList.toggle("selected", b.dataset.prio === prio));
  updateSubmitState();
}

// ==== ASSIGN-DROPDOWN ====
function toggleAssignDropdown(event) {
  event.stopPropagation();
  const tog = document.getElementById("dropdown-toggle");
  const dd = document.getElementById("dropdown-content");
  tog.classList.toggle("open");
  dd.classList.toggle("visible");
  if (dd.innerHTML === "") renderAssignOptions();
}
document.addEventListener("click", (e) => {
  if (!document.getElementById("dropdown-wrapper").contains(e.target)) {
    document.getElementById("dropdown-toggle").classList.remove("open");
    document.getElementById("dropdown-content").classList.remove("visible");
  }
});

function renderAssignOptions() {
  const dd = document.getElementById("dropdown-content");
  dd.innerHTML = "";
  contacts.forEach((c) => {
    const item = document.createElement("div");
    item.className = "contact-item";
    item.innerHTML = `
      <span class="initials-circle" style="background:${c.color}">${c.name
        .split(" ")
        .map((w) => w[0])
        .join("")}</span>
      <span>${c.name}</span>
      <input type="checkbox" ${selectedContacts.some((s) => s.name === c.name) ? "checked" : ""
      }/>
    `;
    item.onclick = () => {
      const idx = selectedContacts.findIndex((s) => s.name === c.name);
      if (idx >= 0) selectedContacts.splice(idx, 1);
      else selectedContacts.push(c);
      updateSelectedContactsUI();
      renderAssignOptions();
      updateSubmitState();
    };
    dd.appendChild(item);
  });
}

function updateSelectedContactsUI() {
  const box = document.getElementById("selected-contacts");
  box.innerHTML = "";
  selectedContacts.forEach((c) => {
    const el = document.createElement("div");
    el.className = "initials-circle";
    el.style.background = c.color;
    el.textContent = c.name
      .split(" ")
      .map((w) => w[0])
      .join("");
    box.appendChild(el);
  });
}

// ==== SUBTASK ====
function addSubtask() {
  const inp = document.getElementById("subtask-input");
  const txt = inp.value.trim();
  if (!txt) return;
  subtasks.push(txt);
  const li = document.createElement("li");
  li.textContent = txt;
  document.getElementById("subtask-list").appendChild(li);
  inp.value = "";
  updateSubmitState();
}

// ==== DATE VALIDATION ====
function validateDate() {
  const el = document.getElementById("dueDate");
  if (!el.value) {
    el.classList.add("error-border");
    return false;
  }
  el.classList.remove("error-border");
  return true;
}

// ==== SUBMIT-STATE ====
function updateSubmitState() {
  const ok =
    document.getElementById("title").value.trim() !== "" &&
    validateDate() &&
    selectedContacts.length > 0;
  document.getElementById("submit-task-btn").disabled = !ok;
}

// ==== RESET ====
function resetForm() {
  document.getElementById("task-form").reset();
  document.getElementById("subtask-list").innerHTML = "";
  selectedContacts = [];
  updateSelectedContactsUI();
  selectPriority("medium");
  updateSubmitState();
}

// ==== CREATE TASK ====
async function createTask() {
  const task = {
    title: document.getElementById("title").value.trim(),
    description: document.getElementById("description").value.trim(),
    dueDate: document.getElementById("dueDate").value,
    priority: selectedPriority,
    assignedTo: selectedContacts.map((c) => c.name),
    subtasks,
    createdAt: new Date().toISOString(),
    status: "todo"
  };

  fetch(`https://join467-e19d8-default-rtdb.europe-west1.firebasedatabase.app/users/${firebaseKey}/tasks.json`, {
    method: "POST",
    body: JSON.stringify(task)
  })
  resetForm();
}

/**
 * Öffnet den nativen Datepicker
 */
function openDatepicker() {
  const el = document.getElementById("dueDate");
  if (typeof el.showPicker === "function") {
    // moderner Chromium-Browser
    el.showPicker();
  } else {
    // Safari, Firefox, iOS etc.
    el.focus();
  }
}