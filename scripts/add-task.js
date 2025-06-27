// Helper to format date to DD/MM/YYYY
function formatDateToDDMMYYYY(dateString) {
  if (!dateString) return "";
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) return dateString; // already formatted
  const [year, month, day] = dateString.split("-");
  if (year && month && day) return `${day}/${month}/${year}`;
  return dateString;
}
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
  if (!document.getElementById("category-wrapper").contains(e.target)) {
    document.getElementById("category-toggle")?.classList.remove("open");
    document.getElementById("category-content")?.classList.remove("visible");
  }

  const dropdown = document.getElementById("dropdown-wrapper");
  const content = document.getElementById("dropdown-content");
  if (
    dropdown &&
    content &&
    !dropdown.contains(e.target) &&
    !content.contains(e.target)
  ) {
    closeDropdown();
  }
});

// ==== ADDITIONAL HANDLERS (moved up) ====
function handleAssignedToClick(e) {
  e.stopPropagation();
  toggleAssignDropdown(e);
}

function handleAssignedToInput(e) {
  const value = e.target.value.trim().toLowerCase();
  renderAssignOptions(value);
}

function setupDateValidation() {
  setTimeout(() => {
    const dateInput = document.getElementById("dueDate");
    const errorText = document.getElementById("error-dueDate");
    if (!dateInput || !errorText) return;

    const today = new Date().toISOString().split("T")[0];
    dateInput.min = today;

    // Only remove error styling on input, do not add error-border preemptively
    dateInput.addEventListener("input", () => {
      dateInput.classList.remove("error-border");
      errorText.classList.remove("visible");
    });
  }, 100);
}

function hideDateError(input, error) {
  input.style.border = "";
  error.classList.remove("visible");
}
// ==== INIT ====
document.addEventListener("DOMContentLoaded", () => {
  // Force the placeholder for the date input immediately on page load
  document.getElementById("due-date") &&
    (document.getElementById("due-date").value = "");
  document.getElementById("due-date") &&
    (document.getElementById("due-date").placeholder = "tt.mm.jjjj");
  // Ensure dueDate input has correct placeholder format before any listeners
  const dueDateInput = document.getElementById("dueDate");
  if (dueDateInput) {
    dueDateInput.placeholder = "dd/mm/yyyy";
  }

  document
    .getElementById("buttons-prio")
    .querySelectorAll("button")
    .forEach((btn) => {
      if (btn.dataset.prio === "medium") btn.classList.add("selected");
    });
  fetchContacts();
  setupEventListeners();
  document.getElementById("subtask-list")?.classList.add("subtask-list");

  // Custom date input formatting and validation
  // Placeholder is now handled above
  setupDateValidation();

  // Format date input as dd/mm/yyyy on display (custom formatting)
  if (dueDateInput) {
    dueDateInput.addEventListener("change", function (event) {
      const selectedDate = new Date(event.target.value);
      if (!isNaN(selectedDate)) {
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
        const day = String(selectedDate.getDate()).padStart(2, "0");
        // Set hidden input value in ISO format for form submission
        const dueDateHidden = document.getElementById("dueDateHidden");
        if (dueDateHidden) {
          dueDateHidden.value = `${year}-${month}-${day}`;
        }
        // Set display value as dd/mm/yyyy for visual purposes
        const formattedDate = `${day}/${month}/${year}`;
        // REPLACEMENT: store formatted date in data attribute, and set input value as ISO
        dateInput = this;
        dateInput.setAttribute("data-formatted", formattedDate);
        const [d, m, y] = formattedDate.split("/");
        const isoDate = `${y}-${m}-${d}`;
        dateInput.value = isoDate;
      }
    });
    dueDateInput.addEventListener("focus", function () {
      // On focus, revert to date type if possible for picker
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(this.value)) {
        // Convert dd/mm/yyyy to yyyy-mm-dd for date input
        const [day, month, year] = this.value.split("/");
        this.type = "date";
        this.value = `${year}-${month}-${day}`;
      } else {
        this.type = "date";
      }
    });
    dueDateInput.addEventListener("blur", function () {
      // On blur, if value is still yyyy-mm-dd, format visually
      if (/^\d{4}-\d{2}-\d{2}$/.test(this.value)) {
        const [year, month, day] = this.value.split("-");
        this.type = "text";
        this.value = `${day}/${month}/${year}`;
      } else if (!this.value) {
        this.type = "text";
      }
    });
  }
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
  // Remove "blur" listener for dueDate, as we now handle formatting/validation on "change"
  document
    .getElementById("category-toggle")
    .addEventListener("click", toggleCategoryDropdown);

  // Prevent dropdown from closing when clicking inside the dropdown-content (e.g., search)
  document
    .getElementById("dropdown-content")
    ?.addEventListener("click", (e) => {
      e.stopPropagation(); // prevent dropdown from closing when clicking inside
    });

  // Subtask input/icons logic
  const subtaskInput = document.getElementById("subtask-input");
  if (subtaskInput) {
    subtaskInput.addEventListener("input", () => {
      const value = subtaskInput.value.trim();
      const iconWrapper = document.getElementById("subtask-icons");

      if (value.length > 0) {
        iconWrapper.classList.remove("hidden");
      } else {
        iconWrapper.classList.add("hidden");
      }
    });
    subtaskInput.addEventListener("keydown", handleSubtaskEnter);
  }
}

// ==== PRIORITY ====

// ==== ASSIGN-DROPDOWN ====
function toggleAssignDropdown(event) {
  event.stopPropagation();
  console.log("toggleAssignDropdown ausgelöst");

  const tog = document.getElementById("dropdown-toggle");
  const dd = document.getElementById("dropdown-content");

  if (!tog || !dd) {
    console.error("Dropdown-Elemente fehlen!");
    return;
  }

  tog.classList.toggle("open");
  dd.classList.toggle("visible");

  console.log("Dropdown sichtbar?", dd.classList.contains("visible"));
  console.log("Kontakte geladen?", contacts.length);

  if (dd.innerHTML === "") {
    renderAssignOptions();
  }
}

// Render the options in the assign dropdown, split into helpers for clarity
function renderAssignOptions(filter = "") {
  const dd = document.getElementById("dropdown-content");
  clearAssignDropdownContent(dd);
  const filteredContacts = contacts.filter((c) =>
    c.name.toLowerCase().includes(filter)
  );
  filteredContacts.forEach((c) => {
    const item = createContactDropdownItem(c, filter);
    dd.appendChild(item);
  });
}

// Remove all nodes except the search input from the dropdown
function clearAssignDropdownContent(dd) {
  const nodes = Array.from(dd.childNodes).filter((n) => n.tagName !== "INPUT");
  nodes.forEach((n) => n.remove());
}

// Create the DOM node for a contact dropdown item
function createContactDropdownItem(contact, filter) {
  const item = document.createElement("div");
  item.className = "contact-item";
  item.innerHTML = `
    <span class="profile-icon" style="background:${contact.color}">
      ${getContactInitials(contact.name)}
    </span>
    <span>${contact.name}</span>
    <input type="checkbox" ${
      selectedContacts.some((s) => s.name === contact.name) ? "checked" : ""
    }/>
  `;
  setupContactCheckbox(item, contact, filter);
  setupContactItemClick(item);
  return item;
}

// Get initials for a contact
function getContactInitials(name) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

// Add event listener for the checkbox in the contact dropdown item
function setupContactCheckbox(item, contact, filter) {
  const checkbox = item.querySelector("input[type='checkbox']");
  checkbox.addEventListener("click", (event) => {
    event.stopPropagation();
    const idx = selectedContacts.findIndex((s) => s.name === contact.name);
    if (checkbox.checked && idx === -1) {
      selectedContacts.push(contact);
    } else if (!checkbox.checked && idx >= 0) {
      selectedContacts.splice(idx, 1);
      if (selectedContacts.length === 0) {
        closeDropdown();
      }
    }
    updateSelectedContactsUI();
    renderAssignOptions(filter);
    updateSubmitState();
  });
}

// Add event listener for clicking on the contact dropdown item itself
function setupContactItemClick(item) {
  const checkbox = item.querySelector("input[type='checkbox']");
  item.addEventListener("click", (event) => {
    if (event.target.tagName.toLowerCase() === "input") return;
    event.stopPropagation();
    checkbox.checked = !checkbox.checked;
    const clickEvent = new Event("click", { bubbles: true });
    checkbox.dispatchEvent(clickEvent);
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
// Add a new subtask to the list and UI, split into helpers
function addSubtask() {
  const input = document.getElementById("subtask-input");
  const subtaskIcons = document.getElementById("subtask-icons");
  const text = input.value.trim();
  if (!validateSubtaskInput(text, subtaskIcons, input)) return;
  subtasks.push(text);
  const li = createSubtaskListItem(text);
  document.getElementById("subtask-list").appendChild(li);
  finalizeSubtaskInput(input, subtaskIcons);
}

// Validate subtask input
function validateSubtaskInput(text, subtaskIcons, input) {
  if (!text || subtaskIcons.classList.contains("hidden")) {
    input.classList.add("error-border");
    return false;
  }
  input.classList.remove("error-border");
  return true;
}

// Create a subtask list item element
function createSubtaskListItem(text) {
  const li = document.createElement("li");
  li.className = "subtask-list-item";
  const label = document.createElement("span");
  label.textContent = text;
  label.className = "subtask-label";
  const iconWrapper = document.createElement("div");
  iconWrapper.className = "subtask-icons";
  li.appendChild(label);
  li.appendChild(iconWrapper);
  li.addEventListener("dblclick", () => {
    enterEditMode(li);
  });
  return li;
}

// Finalize subtask input UI state
function finalizeSubtaskInput(input, subtaskIcons) {
  updateSubmitState();
  input.value = "";
  subtaskIcons.classList.add("hidden");
  const subtaskPlus = document.getElementById("subtask-plus");
  if (subtaskPlus) subtaskPlus.classList.remove("hidden");
}

// Enter edit mode for a subtask, split into helpers
function enterEditMode(subtaskElement) {
  const currentText = getSubtaskCurrentText(subtaskElement);
  if (!currentText) return;
  subtaskElement.innerHTML = "";
  const input = createSubtaskEditInput(currentText);
  const cancelBtn = createSubtaskCancelBtn(currentText, subtaskElement);
  const confirmBtn = createSubtaskConfirmBtn(
    currentText,
    subtaskElement,
    input
  );
  assembleSubtaskEditUI(subtaskElement, input, cancelBtn, confirmBtn);
  input.focus();
}

// Get current subtask label text
function getSubtaskCurrentText(subtaskElement) {
  return subtaskElement.querySelector(".subtask-label")?.textContent || "";
}

// Create input for editing subtask
function createSubtaskEditInput(currentText) {
  const input = document.createElement("input");
  input.type = "text";
  input.value = currentText;
  input.classList.add("subtask-edit-input");
  return input;
}

// Create cancel button for subtask edit
function createSubtaskCancelBtn(currentText, subtaskElement) {
  const cancelBtn = document.createElement("img");
  cancelBtn.src = "./assets/icons/closeXSymbol.svg";
  cancelBtn.alt = "Delete";
  cancelBtn.className = "subtask-edit-cancel";
  cancelBtn.addEventListener("click", () => {
    const index = subtasks.indexOf(currentText);
    if (index > -1) {
      subtasks.splice(index, 1);
    }
    subtaskElement.remove();
    updateSubmitState();
  });
  return cancelBtn;
}

// Create confirm button for subtask edit
function createSubtaskConfirmBtn(currentText, subtaskElement, input) {
  const confirmBtn = document.createElement("img");
  confirmBtn.src = "./assets/icons/checked.svg";
  confirmBtn.alt = "Confirm";
  confirmBtn.className = "subtask-edit-confirm";
  confirmBtn.addEventListener("click", () => {
    const newValue = input.value.trim();
    if (newValue) {
      subtasks[subtasks.indexOf(currentText)] = newValue;
      updateSubtaskLabel(subtaskElement, newValue);
    }
  });
  return confirmBtn;
}

// Update subtask label after editing
function updateSubtaskLabel(subtaskElement, newValue) {
  subtaskElement.innerHTML = "";
  const label = document.createElement("span");
  label.textContent = newValue;
  label.className = "subtask-label";
  subtaskElement.appendChild(label);
  subtaskElement.addEventListener("dblclick", () => {
    enterEditMode(subtaskElement);
  });
}

// Assemble the edit UI for subtask
function assembleSubtaskEditUI(subtaskElement, input, cancelBtn, confirmBtn) {
  const wrapper = document.createElement("div");
  wrapper.classList.add("subtask-edit-container");
  const inputWrapper = document.createElement("div");
  inputWrapper.classList.add("subtask-input-edit-wrapper");
  inputWrapper.appendChild(input);
  const buttonContainer = document.createElement("div");
  buttonContainer.classList.add("subtask-edit-buttons");
  buttonContainer.appendChild(cancelBtn);
  buttonContainer.appendChild(confirmBtn);
  wrapper.appendChild(inputWrapper);
  wrapper.appendChild(buttonContainer);
  subtaskElement.appendChild(wrapper);
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
// validateDate is not used anywhere except inside validateForm

// ==== SUBMIT-STATE ====
function updateSubmitState() {
  const button = document.getElementById("submit-task-btn");
  if (button) {
    button.disabled = false;
  }
}

function validateForm() {
  const titleEl = document.getElementById("title");
  const dueDateEl = document.getElementById("dueDate");
  const categoryToggle = document.getElementById("category-toggle");
  const titleError = document.getElementById("error-title");
  const dueDateError = document.getElementById("error-dueDate");
  const categoryError = document.getElementById("error-category");

  const title = titleEl.value.trim();
  const dueDate = dueDateEl.value.trim();
  const category = selectedCategory;

  const titleValid = title !== "";
  const dueDateValid = dueDate !== "";
  const categoryValid = category !== "";

  titleEl.classList.toggle("error", !titleValid);
  if (titleError) {
    titleError.classList.toggle("visible", !titleValid);
  }
  dueDateEl.classList.toggle("error-border", !dueDateValid);
  if (dueDateError) {
    dueDateError.classList.toggle("visible", !dueDateValid);
  }
  categoryToggle.classList.toggle("error-border", !categoryValid);
  if (categoryError) {
    categoryError.classList.toggle("visible", !categoryValid);
  }

  return titleValid && dueDateValid && categoryValid;
}

// ==== RESET ====
function resetForm() {
  document.getElementById("title").value = "";
  document.getElementById("description").value = "";
  document.getElementById("dueDate").value = "";
  selectedPriority = "medium";
  selectPriority("medium");

  selectedContacts = [];
  updateSelectedContactsUI();

  selectedCategory = "";
  const categoryPlaceholder = document.querySelector("#category-toggle span");
  if (categoryPlaceholder) categoryPlaceholder.textContent = "Select category";

  subtasks.length = 0;
  const subtaskList = document.getElementById("subtask-list");
  if (subtaskList) subtaskList.innerHTML = "";

  const subtaskInput = document.getElementById("subtask-input");
  if (subtaskInput) subtaskInput.value = "";

  const subtaskIcons = document.getElementById("subtask-icons");
  if (subtaskIcons) subtaskIcons.classList.add("hidden");

  const subtaskPlus = document.getElementById("subtask-plus");
  if (subtaskPlus) subtaskPlus.classList.remove("hidden");
}

// ==== CREATE TASK ====
async function createTask() {
  if (!validateForm()) return;
  const dueDateValue = document.getElementById("dueDate").value;
  const formattedDate = dueDateValue;
  const task = {
    title: document.getElementById("title").value.trim(),
    description: document.getElementById("description").value.trim(),
    dueDate: formattedDate,
    priority: selectedPriority,
    assignedTo: selectedContacts.map((c) => c.name),
    category: selectedCategory,
    subtasks,
    createdAt: new Date().toISOString(),
    status: "todo",
  };
  console.log("Creating task with data:", task);

  const response = await fetch(
    `https://join467-e19d8-default-rtdb.europe-west1.firebasedatabase.app/users/${firebaseKey}/tasks.json`,
    {
      method: "POST",
      body: JSON.stringify(task),
    }
  );
  await saveTaskToFirebaseBoard(task);
  showTaskAddedPopup();
  setTimeout(() => {
    if (typeof renderBoardTasks === "function") {
      renderBoardTasks();
    }
    resetForm();
  }, 2000);
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
    // Only add if confirm button is visible (i.e., explicit confirmation)
    const subtaskIcons = document.getElementById("subtask-icons");
    if (subtaskIcons && !subtaskIcons.classList.contains("hidden")) {
      addSubtask();
    }
  }
}

// ==== CLEAR SUBTASK INPUT ====
function clearSubtaskInput() {
  const subtaskInput = document.getElementById("subtask-input");
  const subtaskIcons = document.getElementById("subtask-icons");
  const subtaskPlus = document.getElementById("subtask-plus");

  subtaskInput.value = "";
  subtaskIcons.classList.add("hidden");
  subtaskPlus.classList.remove("hidden");
}

document.addEventListener("DOMContentLoaded", () => {
  const button = document.getElementById("submit-task-btn");
  if (button) {
    button.disabled = false;
  }
});

// --- Custom Date Picker Helper ---
/**
 * Makes a text input act as a date picker on focus, and revert if empty on blur.
 * Usage: <input type="text" onfocus="showDatePicker(this)" ...>
 */
function showDatePicker(input) {
  input.type = "date";
  input.focus();

  input.addEventListener(
    "change",
    () => {
      if (input.value) {
        const date = new Date(input.value);
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();

        // Delay to avoid native validation error
        setTimeout(() => {
          input.type = "text";
          input.value = `${day}/${month}/${year}`;
        }, 0);
      } else {
        setTimeout(() => {
          input.type = "text";
          input.placeholder = "dd/mm/yyyy";
          input.value = "";
        }, 0);
      }
    },
    { once: true }
  );

  input.addEventListener(
    "blur",
    () => {
      if (!input.value) {
        input.type = "text";
        input.placeholder = "dd/mm/yyyy";
      }
    },
    { once: true }
  );
}
