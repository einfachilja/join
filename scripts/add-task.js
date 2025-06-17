let firebaseKey = localStorage.getItem("firebaseKey");

// ==== STATE ====
let selectedPriority = "medium";
const subtasks = [];
let contacts = [];
let selectedContacts = [];

// ====== Helfer zum Stoppen der Klick-Propagation ======
function stopPropagation(e = window.event) {
  if (e && typeof e.stopPropagation === "function") {
    e.stopPropagation();
  }
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
function renderAssignOptions() {
  const dd = document.getElementById("dropdown-content");
  dd.innerHTML = "";
  contacts.forEach((c) => {
    const item = document.createElement("div");
    item.className = "contact-item";
    item.innerHTML = `
  <span class="profile-icon" style="background:${c.color}">
    ${c.name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()}
  </span>
  <span>${c.name}</span>
  <input type="checkbox" ${
    selectedContacts.some((s) => s.name === c.name) ? "checked" : ""
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
    el.className = "profile-icon";
    el.style.background = c.color;
    el.textContent = c.name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase();
    box.appendChild(el);
  });
}

// ==== SUBTASK ====
function addSubtask() {
  const inp = document.getElementById("subtask-input");
  const txt = inp.value.trim();
  if (!txt) {
    inp.classList.add("error-border");
    return;
  }
  inp.classList.remove("error-border");
  subtasks.push(txt);

  const li = document.createElement("li");
  li.className = "subtask-item";
  li.innerHTML = `
    <input value="${txt}" readonly>
    <div class="subtask-icons">
      <img src="./assets/icons/closeXSymbol.svg" class="delete-subtask" alt="delete subtask">
      <img src="./assets/icons/checked.svg" class="edit-subtask" alt="confirm subtask">
    </div>
  `;
  li.querySelector(".delete-subtask").addEventListener("click", () => {
    const index = subtasks.indexOf(txt);
    if (index > -1) subtasks.splice(index, 1);
    li.remove();
    updateSubmitState();
  });

  document.getElementById("subtask-list").appendChild(li);
  inp.value = "";
  updateSubmitState();
}

function validateTitle() {
  const title = document.getElementById("title");
  const titleError = document.getElementById("error-title");

  if (title.value.trim() === "") {
    title.classList.add("error");
    titleError.classList.add("visible");
    return false;
  } else {
    title.classList.remove("error");
    titleError.classList.remove("visible");
    return true;
  }
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
  const titleEl = document.getElementById("title");
  const dueDateEl = document.getElementById("dueDate");
  const categoryEl = document.getElementById("category");
  const placeholder = document.getElementById("assigned-to-placeholder");
  const button = document.getElementById("submit-task-btn");

  if (!titleEl || !dueDateEl || !categoryEl || !placeholder || !button) return;

  const title = titleEl.value.trim();
  const dueDate = dueDateEl.value.trim();
  const category = categoryEl.value;

  const titleValid = title !== "";
  const dueDateValid = dueDate !== "";
  const categoryValid = category !== "" && category !== "disabled";
  const assignedValid = selectedContacts.length > 0;

  button.disabled = !(
    titleValid &&
    dueDateValid &&
    categoryValid &&
    assignedValid
  );

  // Title visual feedback
  titleEl.classList.toggle("error", !titleValid);
  const titleError = document.getElementById("error-title");
  if (titleError) {
    titleError.classList.toggle("visible", !titleValid);
  }

  // Due Date visual feedback
  dueDateEl.classList.toggle("error-border", !dueDateValid);

  // Category visual feedback
  categoryEl.classList.toggle("error-border", !categoryValid);

  // Assigned visual feedback
  placeholder.classList.toggle("error-border", !assignedValid);
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
    status: "todo",
  };

  const response = await fetch(
    `https://join467-e19d8-default-rtdb.europe-west1.firebasedatabase.app/users/${firebaseKey}/tasks.json`,
    {
      method: "POST",
      body: JSON.stringify(task),
    }
  );
  await saveTaskToFirebaseBoard(task);
  resetForm();
  showTaskAddedPopup();
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

/**
 * Shows confirmation toast
 */
function showTaskAddedPopup() {
  const popup = document.createElement("div");
  popup.innerHTML = `<img src="./assets/icons/board.svg" alt="board icon"> Task added to Board`;
  popup.className = "task-toast";
  document.body.appendChild(popup);
  setTimeout(() => popup.remove(), 2500);
}

/**
 * Saves task to board list
 */
async function saveTaskToFirebaseBoard(task) {
  try {
    await fetch(
      `https://join467-e19d8-default-rtdb.europe-west1.firebasedatabase.app/users/${firebaseKey}/boardTasks.json`,
      {
        method: "POST",
        body: JSON.stringify(task),
      }
    );
  } catch (error) {
    console.error("Board task save error:", error);
  }
}

// ==== CATEGORY DROPDOWN ====
function toggleCategoryDropdown(event) {
  stopPropagation(event);
  const toggle = document.getElementById("category-dropdown-toggle");
  const content = document.getElementById("category-dropdown-content");

  toggle.classList.toggle("open");
  content.classList.toggle("visible");
}

function selectCategory(category) {
  const placeholder = document.getElementById("selected-category-placeholder");
  const hiddenInput = document.getElementById("category");

  placeholder.textContent = category;
  hiddenInput.value = category;

  document.getElementById("category-dropdown-toggle")?.classList.remove("open");
  document
    .getElementById("category-dropdown-content")
    ?.classList.remove("visible");

  updateSubmitState();
}

document.addEventListener("click", (e) => {
  if (
    !document.getElementById("category-dropdown-wrapper").contains(e.target)
  ) {
    document
      .getElementById("category-dropdown-toggle")
      ?.classList.remove("open");
    document
      .getElementById("category-dropdown-content")
      ?.classList.remove("visible");
  }
});
