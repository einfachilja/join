/**
 * Formats a date string from YYYY-MM-DD to DD/MM/YYYY.
 * @param {string} dateString - The input date string, e.g., "2024-06-01".
 * @returns {string} The formatted date string in DD/MM/YYYY format.
 */
function formatDateToDDMMYYYY(dateString) {
  if (!dateString) return "";
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) return dateString;
  const [year, month, day] = dateString.split("-");
  if (year && month && day) return `${day}/${month}/${year}`;
  return dateString;
}
let firebaseKey = localStorage.getItem("firebaseKey");

// ==== STATE ====
let selectedPriority = "medium";
const subtask = [];
let contacts = [];
let selectedContacts = [];
let selectedCategory = "";

// ==== HELPERS ====
/**
 * Stops the propagation of the given event.
 * @param {Event} [e=window.event] - The event to stop propagation for.
 */
function stopPropagation(e = window.event) {
  if (e && typeof e.stopPropagation === "function") e.stopPropagation();
}
/**
 * Closes the assignment dropdown by removing visibility classes.
 */
function closeDropdown() {
  document.getElementById("dropdown-content")?.classList.remove("visible");
  document.getElementById("dropdown-toggle")?.classList.remove("open");
}
/**
 * Selects a priority and updates UI accordingly.
 * @param {string} prio - The priority to select ("low", "medium", "high").
 */
function selectPriority(prio) {
  selectedPriority = prio;
  document
    .querySelectorAll("#buttons-prio button")
    .forEach((b) => b.classList.toggle("selected", b.dataset.prio === prio));
  updateSubmitState();
}

// ==== INIT ====
/**
 * Initializes the Add Task page by setting up DOM defaults, event listeners, and fetching contacts.
 */
function initAddTaskPage() {
  setupDOMDefaults();
  setupDueDatePicker();
  setDefaultPriority();
  fetchContacts();
  setupEventListeners();
  initializeUIStates();
}

/**
 * Initializes UI states such as subtask list, date validation, submit button, and assigned input focus.
 */
function initializeUIStates() {
  markSubtaskList();
  setupDateValidation();
  enableSubmitButton();
  setupAssignedInputFocus();
}

/**
 * Sets up default DOM values for the due date input.
 */
function setupDOMDefaults() {
  const dueDateInputAlt = document.getElementById("due-date");
  if (dueDateInputAlt) {
    dueDateInputAlt.value = "";
    dueDateInputAlt.placeholder = "tt.mm.jjjj";
  }
}

/**
 * Sets up the due date picker input with placeholder and event.
 */
function setupDueDatePicker() {
  const dueDateInput = document.getElementById("dueDate");
  if (dueDateInput) {
    dueDateInput.placeholder = "dd/mm/yyyy";
    dueDateInput.type = "text";
    dueDateInput.addEventListener("focus", () => showDatePicker(dueDateInput));
  }
}

/**
 * Sets the default priority selection to "medium".
 */
function setDefaultPriority() {
  const buttonsPrio = document.getElementById("buttons-prio");
  if (buttonsPrio) {
    buttonsPrio.querySelectorAll("button").forEach((btn) => {
      if (btn.dataset.prio === "medium") btn.classList.add("selected");
    });
  }
}

/**
 * Adds the "subtask-list" class to the subtask list element.
 */
function markSubtaskList() {
  document.getElementById("subtask-list")?.classList.add("subtask-list");
}

/**
 * Enables the submit button if it exists.
 */
function enableSubmitButton() {
  const submitBtn = document.getElementById("submit-task-btn");
  if (submitBtn) submitBtn.disabled = false;
}

/**
 * Sets up focus and blur event listeners for the assigned-to input.
 */
function setupAssignedInputFocus() {
  const assignedInput = document.getElementById("assigned-to-input");
  const dropdownToggle = document.getElementById("dropdown-toggle");
  if (assignedInput && dropdownToggle) {
    assignedInput.addEventListener("click", () =>
      dropdownToggle.classList.add("focused")
    );
    document.addEventListener("click", (e) => {
      if (!dropdownToggle.contains(e.target))
        dropdownToggle.classList.remove("focused");
    });
  }
}

/**
 * Handles click event on the assigned-to input, opening the dropdown.
 * @param {Event} e - The click event.
 */
function handleAssignedToClick(e) {
  e.stopPropagation();
  toggleAssignDropdown(e);
}
/**
 * Handles input event for filtering assign options.
 * @param {Event} e - The input event.
 */
function handleAssignedToInput(e) {
  renderAssignOptions(e.target.value.trim().toLowerCase());
}
/**
 * Sets up validation on the due date input and error message.
 */
function setupDateValidation() {
  setTimeout(() => {
    const dateInput = document.getElementById("dueDate");
    const errorText = document.getElementById("error-dueDate");
    if (!dateInput || !errorText) return;
    dateInput.min = new Date().toISOString().split("T")[0];
    dateInput.addEventListener("input", () => {
      dateInput.classList.remove("error-border");
      errorText.classList.remove("visible");
    });
  }, 100);
}
/**
 * Hides the date error UI for the given input and error element.
 * @param {HTMLElement} input - The date input element.
 * @param {HTMLElement} error - The error element.
 */
function hideDateError(input, error) {
  input.style.border = "";
  error.classList.remove("visible");
}
document.addEventListener("DOMContentLoaded", initAddTaskPage);

// ==== FETCH CONTACTS ====
/**
 * Fetches contacts from Firebase and populates the contacts array.
 * @returns {Promise<void>}
 */
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
  } catch (err) {}
}

// ==== EVENTS ====
/**
 * Sets up all essential event listeners for dropdowns, subtasks, and outside clicks.
 */
function setupEventListeners() {
  setupDropdownEvents();
  setupSubtaskEvents();
  setupOutsideClickEvents();
}

/**
 * Sets up event listeners for assignment and category dropdown toggles.
 */
function setupDropdownEvents() {
  const dropdownToggle = document.getElementById("dropdown-toggle");
  const categoryToggle = document.getElementById("category-toggle");
  const dropdownContent = document.getElementById("dropdown-content");
  dropdownToggle?.addEventListener("click", toggleAssignDropdown);
  categoryToggle?.addEventListener("click", toggleCategoryDropdown);
  dropdownContent?.addEventListener("click", (e) => e.stopPropagation());
}

/**
 * Sets up event listeners for subtask input and icons.
 */
function setupSubtaskEvents() {
  const subtaskInput = document.getElementById("subtask-input");
  if (subtaskInput) {
    subtaskInput.addEventListener("input", () => {
      toggleSubtaskIcons();
      const iconWrapper = document.getElementById("subtask-icons");
      iconWrapper?.classList.toggle(
        "hidden",
        subtaskInput.value.trim().length === 0
      );
    });
    subtaskInput.addEventListener("focus", toggleSubtaskIcons);
    subtaskInput.addEventListener("keydown", handleSubtaskEnter);
  }
}

/**
 * Sets up event listeners to close dropdowns when clicking outside.
 */
function setupOutsideClickEvents() {
  document.addEventListener("click", (e) => {
    if (!document.getElementById("category-wrapper").contains(e.target)) {
      document.getElementById("category-toggle")?.classList.remove("open");
      document.getElementById("category-content")?.classList.remove("visible");
    }
    if (!document.getElementById("dropdown-wrapper").contains(e.target)) {
      closeDropdown();
    }
  });
}
// ==== SUBTASK ICONS TOGGLE ====
/**
 * Toggles the visibility of subtask icons depending on input focus.
 */
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

// ==== ASSIGN-DROPDOWN ====
/**
 * Toggles the assignment dropdown open/closed and renders options if needed.
 * @param {Event} event - The click event.
 */
function toggleAssignDropdown(event) {
  event.stopPropagation();
  const tog = document.getElementById("dropdown-toggle");
  const dd = document.getElementById("dropdown-content");
  if (!tog || !dd) return;
  tog.classList.toggle("open");
  dd.classList.toggle("visible");
  if (dd.innerHTML === "") renderAssignOptions();
}

/**
 * Renders the assignment options dropdown, filtered by the input string.
 * @param {string} [filter=""] - Optional filter string for contact names.
 */
function renderAssignOptions(filter = "") {
  const dd = document.getElementById("dropdown-content");
  if (!dd) return;
  clearOldAssignOptions(dd);
  contacts
    .filter((c) => c.name.toLowerCase().includes(filter))
    .forEach((c) => dd.appendChild(createContactDropdownItem(c, filter)));
}

/**
 * Removes all child nodes from the dropdown except the input.
 * @param {HTMLElement} container - The dropdown container element.
 */
function clearOldAssignOptions(container) {
  Array.from(container.childNodes)
    .filter((n) => n.tagName !== "INPUT")
    .forEach((n) => n.remove());
}
/**
 * Creates a dropdown item element for a contact.
 * @param {{name: string, color: string}} contact - The contact object.
 * @param {string} filter - The filter string.
 * @returns {HTMLElement} The contact dropdown item element.
 */
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
  if (selectedContacts.some((s) => s.name === contact.name))
    item.classList.add("selected");
  return item;
}
/**
 * Gets the initials from a contact name.
 * @param {string} name - The contact's full name.
 * @returns {string} The initials in uppercase.
 */
function getContactInitials(name) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}
/**
 * Sets up the checkbox click event for a contact dropdown item.
 * @param {HTMLElement} item - The contact item element.
 * @param {{name: string, color: string}} contact - The contact object.
 * @param {string} filter - The filter string.
 */
function setupContactCheckbox(item, contact, filter) {
  const checkbox = item.querySelector("input[type='checkbox']");
  checkbox.addEventListener("click", (event) => {
    event.stopPropagation();
    const idx = selectedContacts.findIndex((s) => s.name === contact.name);
    if (checkbox.checked && idx === -1) selectedContacts.push(contact);
    else if (!checkbox.checked && idx >= 0) {
      selectedContacts.splice(idx, 1);
      if (selectedContacts.length === 0) closeDropdown();
    }
    updateSelectedContactsUI();
    renderAssignOptions(filter);
    updateSubmitState();
  });
}
/**
 * Sets up the click event for a contact item to toggle its checkbox.
 * @param {HTMLElement} item - The contact item element.
 */
function setupContactItemClick(item) {
  const checkbox = item.querySelector("input[type='checkbox']");
  item.addEventListener("click", (event) => {
    if (event.target.tagName.toLowerCase() === "input") return;
    event.stopPropagation();
    checkbox.checked = !checkbox.checked;
    checkbox.dispatchEvent(new Event("click", { bubbles: true }));
  });
}
/**
 * Updates the UI to show selected contacts as icons.
 */
function updateSelectedContactsUI() {
  const box = document.getElementById("selected-contacts");
  if (!box) return;
  box.innerHTML = "";
  selectedContacts.forEach((c) => {
    const el = document.createElement("div");
    el.className = "profile-icon";
    el.style.background = c.color;
    el.textContent = getContactInitials(c.name);
    box.appendChild(el);
  });
}

// ==== SUBTASKS ====
/**
 * Adds a subtask to the subtasks list and updates the UI.
 */
function addSubtask() {
  const input = document.getElementById("subtask-input");
  const subtaskIcons = document.getElementById("subtask-icons");
  const text = input.value.trim();
  if (!validateSubtaskInput(text, subtaskIcons, input)) return;
  subtask.push({ title: text, completed: false });
  document
    .getElementById("subtask-list")
    .appendChild(createSubtaskListItem(text));
  finalizeSubtaskInput(input, subtaskIcons);
}
/**
 * Validates the subtask input field and UI state.
 * @param {string} text - The input text.
 * @param {HTMLElement} subtaskIcons - The subtask icons wrapper.
 * @param {HTMLElement} input - The subtask input element.
 * @returns {boolean} True if valid, false otherwise.
 */
function validateSubtaskInput(text, subtaskIcons, input) {
  if (!text || subtaskIcons.classList.contains("hidden")) {
    input.classList.add("error-border");
    return false;
  }
  input.classList.remove("error-border");
  return true;
}
/**
 * Creates a subtask list item element.
 * @param {string|{title: string}} text - The subtask text or object.
 * @returns {HTMLElement} The list item element for the subtask.
 */
function createSubtaskListItem(text) {
  const li = document.createElement("li");
  li.className = "subtask-list-item";
  const label = document.createElement("span");
  label.textContent = text.title || text;
  label.className = "subtask-label";
  const iconWrapper = document.createElement("div");
  iconWrapper.className = "subtask-icons";
  li.appendChild(label);
  li.appendChild(iconWrapper);
  li.addEventListener("dblclick", () => enterEditMode(li));
  return li;
}
/**
 * Finalizes subtask input by resetting input and icons.
 * @param {HTMLElement} input - The subtask input element.
 * @param {HTMLElement} subtaskIcons - The subtask icons wrapper.
 */
function finalizeSubtaskInput(input, subtaskIcons) {
  updateSubmitState();
  input.value = "";
  subtaskIcons.classList.add("hidden");
  document.getElementById("subtask-plus")?.classList.remove("hidden");
}
/**
 * Enters edit mode for a subtask element, allowing inline editing.
 * @param {HTMLElement} subtaskElement - The subtask list item element.
 */
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
/**
 * Gets the current text of a subtask element.
 * @param {HTMLElement} subtaskElement - The subtask list item element.
 * @returns {string} The current subtask text.
 */
function getSubtaskCurrentText(subtaskElement) {
  return subtaskElement.querySelector(".subtask-label")?.textContent || "";
}
/**
 * Creates an input element for subtask editing.
 * @param {string} currentText - The current subtask text.
 * @returns {HTMLInputElement} The input element for editing.
 */
function createSubtaskEditInput(currentText) {
  const input = document.createElement("input");
  input.type = "text";
  input.value = currentText;
  input.classList.add("subtask-edit-input");
  return input;
}
/**
 * Creates a confirm button for subtask editing.
 * @param {string} currentText - The current subtask text.
 * @param {HTMLElement} subtaskElement - The subtask list item element.
 * @param {HTMLInputElement} input - The input element for editing.
 * @returns {HTMLImageElement} The confirm button image element.
 */
function createSubtaskConfirmBtn(currentText, subtaskElement, input) {
  const confirmBtn = document.createElement("img");
  confirmBtn.src = "./assets/icons/checked.svg";
  confirmBtn.alt = "Confirm";
  confirmBtn.className = "subtask-edit-confirm";
  confirmBtn.addEventListener("click", () => {
    const newValue = input.value.trim();
    if (newValue) {
      const index = subtask.findIndex((s) => s.title === currentText);
      if (index > -1) {
        subtask[index].title = newValue;
        updateSubtaskLabel(subtaskElement, newValue);
      }
    }
  });
  return confirmBtn;
}
/**
 * Creates a cancel button for subtask editing.
 * @param {string} currentText - The current subtask text.
 * @param {HTMLElement} subtaskElement - The subtask list item element.
 * @returns {HTMLImageElement} The cancel button image element.
 */
function createSubtaskCancelBtn(currentText, subtaskElement) {
  const cancelBtn = document.createElement("img");
  cancelBtn.src = "./assets/icons/closeXSymbol.svg";
  cancelBtn.alt = "Delete";
  cancelBtn.className = "subtask-edit-cancel";
  cancelBtn.addEventListener("click", () => {
    const index = subtask.findIndex((s) => s.title === currentText);
    if (index > -1) subtask.splice(index, 1);
    subtaskElement.remove();
    updateSubmitState();
  });
  return cancelBtn;
}
/**
 * Updates the subtask label to the new value and re-enables edit on double click.
 * @param {HTMLElement} subtaskElement - The subtask list item element.
 * @param {string} newValue - The new subtask text.
 */
function updateSubtaskLabel(subtaskElement, newValue) {
  subtaskElement.innerHTML = "";
  const label = document.createElement("span");
  label.textContent = newValue;
  label.className = "subtask-label";
  subtaskElement.appendChild(label);
  subtaskElement.addEventListener("dblclick", () =>
    enterEditMode(subtaskElement)
  );
}
/**
 * Assembles the UI for subtask edit mode.
 * @param {HTMLElement} subtaskElement - The subtask list item element.
 * @param {HTMLInputElement} input - The editing input element.
 * @param {HTMLImageElement} cancelBtn - The cancel button element.
 * @param {HTMLImageElement} confirmBtn - The confirm button element.
 */
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

// ==== VALIDATION ====
/**
 * Validates the task title input and shows/hides error messages.
 * @returns {boolean} True if valid, false otherwise.
 */
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

/**
 * Updates the submit button state (always enables it here).
 */
function updateSubmitState() {
  const button = document.getElementById("submit-task-btn");
  if (button) button.disabled = false;
}
/**
 * Validates the form fields for title, due date, and category.
 * @returns {boolean} True if all fields are valid, false otherwise.
 */
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
  if (titleError) titleError.classList.toggle("visible", !titleValid);
  dueDateEl.classList.toggle("error-border", !dueDateValid);
  if (dueDateError) dueDateError.classList.toggle("visible", !dueDateValid);
  categoryToggle.classList.toggle("error-border", !categoryValid);
  if (categoryError) categoryError.classList.toggle("visible", !categoryValid);
  return titleValid && dueDateValid && categoryValid;
}

/**
 * Resets the add task form and related UI components.
 */
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
  subtask.length = 0;
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
/**
 * Creates a new task, saves it to Firebase, and updates the UI.
 * @returns {Promise<void>}
 */
async function createTask() {
  if (!validateForm()) return;
  const dueDateValue = document.getElementById("dueDate").value;
  const task = {
    title: document.getElementById("title").value.trim(),
    description: document.getElementById("description").value.trim(),
    dueDate: dueDateValue,
    priority: selectedPriority,
    assignedTo: selectedContacts.map((c) => c.name),
    category: selectedCategory,
    subtask,
    createdAt: new Date().toISOString(),
    status: "todo",
  };
  await fetch(
    `https://join467-e19d8-default-rtdb.europe-west1.firebasedatabase.app/users/${firebaseKey}/tasks.json`,
    {
      method: "POST",
      body: JSON.stringify(task),
    }
  );
  showTaskAddedPopup();
  setTimeout(() => {
    if (typeof renderBoardTasks === "function") renderBoardTasks();
    resetForm();
  }, 2000);
}

/**
 * Shows a confirmation popup that a task was added to the board.
 */
function showTaskAddedPopup() {
  const popup = document.createElement("div");
  popup.innerHTML = `<img src="./assets/icons/board.svg" alt="board icon"> Task added to Board`;
  popup.className = "task-toast";
  document.body.appendChild(popup);
  setTimeout(() => popup.remove(), 2500);
}
// Save task to board list
async function saveTaskToFirebaseBoard(task) {
  try {
    await fetch(
      `https://join467-e19d8-default-rtdb.europe-west1.firebasedatabase.app/users/${firebaseKey}/boardTasks.json`,
      {
        method: "POST",
        body: JSON.stringify(task),
      }
    );
  } catch (error) {}
}

// ==== CATEGORY ====
/**
 * Toggles the category dropdown open/closed and renders options if needed.
 * @param {Event} event - The click event.
 */
function toggleCategoryDropdown(event) {
  event.stopPropagation();
  const toggle = document.getElementById("category-toggle");
  const content = document.getElementById("category-content");
  toggle.classList.toggle("open");
  content.classList.toggle("visible");
  if (content.innerHTML.trim() === "") renderCategoryOptions();
}
/**
 * Renders the available category options in the dropdown.
 */
function renderCategoryOptions() {
  const content = document.getElementById("category-content");
  content.innerHTML = "";
  ["Technical Task", "User Story"].forEach((category) => {
    const item = document.createElement("div");
    item.className = "dropdown-item category-item";
    item.innerHTML = `<span class="category-name">${category}</span>`;
    item.onclick = () => {
      selectCategory(category);
      content.classList.remove("visible");
      document.getElementById("category-toggle").classList.remove("open");
      updateSubmitState();
    };
    content.appendChild(item);
  });
}
/**
 * Selects a category and updates the UI.
 * @param {string} category - The category to select.
 */
function selectCategory(category) {
  selectedCategory = category;
  const placeholder = document.querySelector("#category-toggle span");
  placeholder.textContent = category;
}
/**
 * Updates the category UI to display the selected category.
 */
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
/**
 * Handles Enter key event for subtask input to add a subtask.
 * @param {KeyboardEvent} e - The keyboard event.
 */
function handleSubtaskEnter(e) {
  if (e.key === "Enter") {
    e.preventDefault();
    const subtaskIcons = document.getElementById("subtask-icons");
    if (subtaskIcons && !subtaskIcons.classList.contains("hidden"))
      addSubtask();
  }
}
/**
 * Clears the subtask input and resets icons.
 */
function clearSubtaskInput() {
  const subtaskInput = document.getElementById("subtask-input");
  const subtaskIcons = document.getElementById("subtask-icons");
  const subtaskPlus = document.getElementById("subtask-plus");
  subtaskInput.value = "";
  subtaskIcons.classList.add("hidden");
  subtaskPlus.classList.remove("hidden");
}

// --- Custom Date Picker Helper ---
/**
 * Shows the native date picker for the input and formats the result.
 * @param {HTMLInputElement} input - The input element to attach the picker to.
 */
function showDatePicker(input) {
  input.type = "date";
  input.focus();
  input.addEventListener(
    "change",
    () => {
      const [year, month, day] = input.value?.split("-") ?? [];
      if (
        !day ||
        !month ||
        !year ||
        isNaN(+day) ||
        isNaN(+month) ||
        isNaN(+year)
      ) {
        input.type = "text";
        input.placeholder = "dd/mm/yyyy";
        input.value = "";
        return;
      }
      const formatted = `${day.padStart(2, "0")}/${month.padStart(
        2,
        "0"
      )}/${year}`;
      setTimeout(() => {
        input.type = "text";
        input.value = formatted;
      }, 0);
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

// ==== SAVE UPDATED SUBTASKS ====
async function saveUpdatedSubtasks(taskKey) {
  const task = arrayTasks.find((t) => t.firebaseKey === taskKey);
  if (!task || !Array.isArray(task.subtask)) return;
  try {
    await fetch(
      `https://join467-e19d8-default-rtdb.europe-west1.firebasedatabase.app/users/${firebaseKey}/tasks/${taskKey}/subtask.json`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(task.subtask),
      }
    );
  } catch (error) {}
}
