let firebaseKey = localStorage.getItem("firebaseKey");

// ==== STATE ====
let selectedPriority = "medium";
const subtasks = [];
let contacts = [];
let selectedContacts = [];
let selectedCategory = "";

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
  document.getElementById("subtask-list")?.classList.add("subtask-list");
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
  document
    .getElementById("category-toggle")
    .addEventListener("click", toggleCategoryDropdown);

  // Subtask input/plus/buttons logic with null checks
  const subtaskInput = document.getElementById("subtask-input");
  const subtaskPlus = document.getElementById("subtask-plus");
  const subtaskButtons = document.getElementById("subtask-buttons");
  const subtaskCancel = document.getElementById("subtask-cancel");
  const subtaskConfirm = document.getElementById("subtask-confirm");

  if (
    subtaskInput &&
    subtaskPlus &&
    subtaskButtons &&
    subtaskCancel &&
    subtaskConfirm
  ) {
    subtaskInput.addEventListener("focus", () => {
      subtaskButtons.classList.remove("hidden");
      subtaskPlus.classList.add("hidden");
    });

    subtaskInput.addEventListener("blur", () => {
      if (!subtaskInput.value.trim()) {
        setTimeout(() => {
          subtaskButtons.classList.add("hidden");
          subtaskPlus.classList.remove("hidden");
        }, 100);
      }
    });

    subtaskPlus.addEventListener("click", () => {
      subtaskInput.focus();
    });

    subtaskCancel.addEventListener("click", () => {
      subtaskInput.value = "";
      subtaskButtons.classList.add("hidden");
      subtaskPlus.classList.remove("hidden");
    });

    subtaskConfirm.addEventListener("click", addSubtask);
    subtaskInput.addEventListener("keydown", handleSubtaskEnter);
  }
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

    const checkbox = item.querySelector("input[type='checkbox']");
    checkbox.addEventListener("click", (event) => {
      event.stopPropagation(); // prevent dropdown from closing
      const idx = selectedContacts.findIndex((s) => s.name === c.name);
      if (checkbox.checked && idx === -1) {
        selectedContacts.push(c);
      } else if (!checkbox.checked && idx >= 0) {
        selectedContacts.splice(idx, 1);
        if (selectedContacts.length === 0) {
          closeDropdown();
        }
      }
      updateSelectedContactsUI();
      renderAssignOptions();
      updateSubmitState();
    });

    // Make the entire contact card clickable (except the checkbox itself)
    item.addEventListener("click", (event) => {
      if (event.target.tagName.toLowerCase() === "input") return;
      event.stopPropagation();
      checkbox.checked = !checkbox.checked;
      const clickEvent = new Event("click", { bubbles: true });
      checkbox.dispatchEvent(clickEvent);
    });

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
  const input = document.getElementById("subtask-input");
  const text = input.value.trim();
  if (!text) {
    input.classList.add("error-border");
    return;
  }

  input.classList.remove("error-border");
  subtasks.push(text);

  const li = document.createElement("li");
  li.className = "subtask-list-item";

  const label = document.createElement("span");
  label.textContent = text;
  label.className = "subtask-label";

  // Icons
  const iconWrapper = document.createElement("div");
  iconWrapper.className = "subtask-icons";

  // Delete (Papierkorb) Icon
  const deleteIcon = document.createElement("img");
  deleteIcon.src = "./assets/icons/board-delete-icon.svg";
  deleteIcon.alt = "Delete";
  deleteIcon.className = "delete-subtask";

  iconWrapper.appendChild(deleteIcon);

  li.appendChild(label);
  li.appendChild(iconWrapper);
  document.getElementById("subtask-list").appendChild(li);

  // Papierkorb-Event
  deleteIcon.addEventListener("click", () => {
    const index = subtasks.indexOf(text);
    if (index > -1) subtasks.splice(index, 1);
    li.remove();
    updateSubmitState();
  });

  updateSubmitState();
  input.value = "";
}

function enterEditMode(li, label, oldValue) {
  const input = document.createElement("input");
  input.type = "text";
  input.value = oldValue;
  input.className = "subtask-edit-input";

  const iconWrapper = document.createElement("div");
  iconWrapper.className = "subtask-icons";

  const cancelIcon = document.createElement("img");
  cancelIcon.src = "./assets/icons/board-delete-icon.svg";
  cancelIcon.alt = "Cancel";
  cancelIcon.className = "cancel-subtask";

  const confirmIcon = document.createElement("img");
  confirmIcon.src = "./assets/icons/checked.svg";
  confirmIcon.alt = "Confirm";
  confirmIcon.className = "confirm-subtask";

  iconWrapper.appendChild(cancelIcon);
  iconWrapper.appendChild(confirmIcon);

  const editWrapper = document.createElement("li");
  editWrapper.className = "subtask-list-item";
  editWrapper.appendChild(input);
  editWrapper.appendChild(iconWrapper);

  li.replaceWith(editWrapper);

  cancelIcon.addEventListener("click", () => {
    editWrapper.replaceWith(li);
  });

  confirmIcon.addEventListener("click", () => {
    const newValue = input.value.trim();
    if (!newValue) return;
    const index = subtasks.indexOf(oldValue);
    if (index > -1) subtasks[index] = newValue;
    label.textContent = newValue;
    editWrapper.replaceWith(li);
    updateSubmitState();
  });
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
  const categoryToggle = document.getElementById("category-toggle");
  const placeholder = document.getElementById("assigned-to-placeholder");
  const button = document.getElementById("submit-task-btn");

  if (!titleEl || !dueDateEl || !categoryToggle || !placeholder || !button)
    return;

  const title = titleEl.value.trim();
  const dueDate = dueDateEl.value.trim();
  const category = selectedCategory;

  const titleValid = title !== "";
  const dueDateValid = dueDate !== "";
  const categoryValid = category !== "";
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
  categoryToggle.classList.toggle("error-border", !categoryValid);

  // Assigned visual feedback
  placeholder.classList.toggle("error-border", !assignedValid);
}

// ==== RESET ====
function resetForm() {
  document.getElementById("task-form").reset();
  document.getElementById("subtask-list").innerHTML = "";
  selectedContacts = [];
  selectedCategory = "";
  updateSelectedContactsUI();
  selectPriority("medium");
  updateCategoryUI();
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
    category: selectedCategory,
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
  event.stopPropagation();
  const toggle = document.getElementById("category-toggle");
  const content = document.getElementById("category-content");

  toggle.classList.toggle("open");
  content.classList.toggle("visible");

  if (content.innerHTML.trim() === "") renderCategoryOptions();
}

function renderCategoryOptions() {
  const content = document.getElementById("category-content");
  content.innerHTML = "";
  const categories = ["Technical Task", "User Story"];

  categories.forEach((category) => {
    const item = document.createElement("div");
    item.className = "dropdown-item category-item";
    item.innerHTML = `<span class="category-name">${category}</span>`;
    item.onclick = (ja) => {
      selectCategory(category);
      content.classList.remove("visible");
      document.getElementById("category-toggle").classList.remove("open");
      updateSubmitState();
    };
    content.appendChild(item);
  });
}

function selectCategory(category) {
  selectedCategory = category;
  const placeholder = document.querySelector("#category-toggle span");
  placeholder.textContent = category;
}

function updateCategoryUI() {
  const box = document.getElementById("selected-category");
  if (!box) return;
  box.innerHTML = "";
  if (selectedCategory) {
    const el = document.createElement("div");
    el.className = "profile-icon";
    el.style.background = "#2a3647";
    el.textContent = selectedCategory
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase();
    box.appendChild(el);
  }
}

// Update global click event for both dropdowns
document.addEventListener("click", (e) => {
  if (!document.getElementById("category-wrapper").contains(e.target)) {
    document.getElementById("category-toggle")?.classList.remove("open");
    document.getElementById("category-content")?.classList.remove("visible");
  }

  if (!document.getElementById("dropdown-wrapper").contains(e.target)) {
    closeDropdown();
  }
});

function toggleSubtaskIcons() {
  const input = document.getElementById("subtask-input");
  const confirmIcon = document.getElementById("subtask-confirm");
  const defaultIcon = document.getElementById("subtask-plus");
  const cancelIcon = document.getElementById("subtask-cancel");

  const isActive = document.activeElement === input;

  confirmIcon?.classList.toggle("hidden", !isActive);
  cancelIcon?.classList.toggle("hidden", !isActive);
  defaultIcon?.classList.toggle("hidden", isActive);
}

function handleSubtaskEnter(e) {
  if (e.key === "Enter") {
    e.preventDefault();
    addSubtask();
  }
}
