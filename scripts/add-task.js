// Format date to DD/MM/YYYY
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
function stopPropagation(e = window.event) {
  if (e && typeof e.stopPropagation === "function") e.stopPropagation();
}
function closeDropdown() {
  document.getElementById("dropdown-content")?.classList.remove("visible");
  document.getElementById("dropdown-toggle")?.classList.remove("open");
}
function selectPriority(prio) {
  selectedPriority = prio;
  document
    .querySelectorAll("#buttons-prio button")
    .forEach((b) => b.classList.toggle("selected", b.dataset.prio === prio));
  updateSubmitState();
}

// ==== INIT ====
function initAddTaskPage() {
  setupDOMDefaults();
  setupDueDatePicker();
  setDefaultPriority();
  fetchContacts();
  setupEventListeners();
  initializeUIStates();
}

function initializeUIStates() {
  markSubtaskList();
  setupDateValidation();
  enableSubmitButton();
  setupAssignedInputFocus();
}

function setupDOMDefaults() {
  const dueDateInputAlt = document.getElementById("due-date");
  if (dueDateInputAlt) {
    dueDateInputAlt.value = "";
    dueDateInputAlt.placeholder = "tt.mm.jjjj";
  }
}

function setupDueDatePicker() {
  const dueDateInput = document.getElementById("dueDate");
  if (dueDateInput) {
    dueDateInput.placeholder = "dd/mm/yyyy";
    dueDateInput.type = "text";
    dueDateInput.addEventListener("focus", () => showDatePicker(dueDateInput));
  }
}

function setDefaultPriority() {
  const buttonsPrio = document.getElementById("buttons-prio");
  if (buttonsPrio) {
    buttonsPrio.querySelectorAll("button").forEach((btn) => {
      if (btn.dataset.prio === "medium") btn.classList.add("selected");
    });
  }
}

function markSubtaskList() {
  document.getElementById("subtask-list")?.classList.add("subtask-list");
}

function enableSubmitButton() {
  const submitBtn = document.getElementById("submit-task-btn");
  if (submitBtn) submitBtn.disabled = false;
}

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

function handleAssignedToClick(e) {
  e.stopPropagation();
  toggleAssignDropdown(e);
}
function handleAssignedToInput(e) {
  renderAssignOptions(e.target.value.trim().toLowerCase());
}
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
function hideDateError(input, error) {
  input.style.border = "";
  error.classList.remove("visible");
}
document.addEventListener("DOMContentLoaded", initAddTaskPage);

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
  } catch (err) { }
}

// ==== EVENTS ====
function setupEventListeners() {
  setupDropdownEvents();
  setupSubtaskEvents();
  setupOutsideClickEvents();
}

function setupDropdownEvents() {
  const dropdownToggle = document.getElementById("dropdown-toggle");
  const categoryToggle = document.getElementById("category-toggle");
  const dropdownContent = document.getElementById("dropdown-content");
  dropdownToggle?.addEventListener("click", toggleAssignDropdown);
  categoryToggle?.addEventListener("click", toggleCategoryDropdown);
  dropdownContent?.addEventListener("click", (e) => e.stopPropagation());
}

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
function toggleAssignDropdown(event) {
  event.stopPropagation();
  const tog = document.getElementById("dropdown-toggle");
  const dd = document.getElementById("dropdown-content");
  if (!tog || !dd) return;
  tog.classList.toggle("open");
  dd.classList.toggle("visible");
  if (dd.innerHTML === "") renderAssignOptions();
}

function renderAssignOptions(filter = "") {
  const dd = document.getElementById("dropdown-content");
  if (!dd) return;
  clearOldAssignOptions(dd);
  contacts
    .filter((c) => c.name.toLowerCase().includes(filter))
    .forEach((c) => dd.appendChild(createContactDropdownItem(c, filter)));
}

function clearOldAssignOptions(container) {
  Array.from(container.childNodes)
    .filter((n) => n.tagName !== "INPUT")
    .forEach((n) => n.remove());
}
function createContactDropdownItem(contact, filter) {
  const item = document.createElement("div");
  item.className = "contact-item";
  item.innerHTML = `
    <span class="profile-icon" style="background:${contact.color}">
      ${getContactInitials(contact.name)}
    </span>
    <span>${contact.name}</span>
    <input type="checkbox" ${selectedContacts.some((s) => s.name === contact.name) ? "checked" : ""
    }/>
  `;
  setupContactCheckbox(item, contact, filter);
  setupContactItemClick(item);
  if (selectedContacts.some((s) => s.name === contact.name))
    item.classList.add("selected");
  return item;
}
function getContactInitials(name) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}
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
function setupContactItemClick(item) {
  const checkbox = item.querySelector("input[type='checkbox']");
  item.addEventListener("click", (event) => {
    if (event.target.tagName.toLowerCase() === "input") return;
    event.stopPropagation();
    checkbox.checked = !checkbox.checked;
    checkbox.dispatchEvent(new Event("click", { bubbles: true }));
  });
}
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

// ==== SUBTASK ====
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
function validateSubtaskInput(text, subtaskIcons, input) {
  if (!text || subtaskIcons.classList.contains("hidden")) {
    input.classList.add("error-border");
    return false;
  }
  input.classList.remove("error-border");
  return true;
}
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
function finalizeSubtaskInput(input, subtaskIcons) {
  updateSubmitState();
  input.value = "";
  subtaskIcons.classList.add("hidden");
  document.getElementById("subtask-plus")?.classList.remove("hidden");
}
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
function getSubtaskCurrentText(subtaskElement) {
  return subtaskElement.querySelector(".subtask-label")?.textContent || "";
}
function createSubtaskEditInput(currentText) {
  const input = document.createElement("input");
  input.type = "text";
  input.value = currentText;
  input.classList.add("subtask-edit-input");
  return input;
}
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

function updateSubmitState() {
  const button = document.getElementById("submit-task-btn");
  if (button) button.disabled = false;
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
  if (titleError) titleError.classList.toggle("visible", !titleValid);
  dueDateEl.classList.toggle("error-border", !dueDateValid);
  if (dueDateError) dueDateError.classList.toggle("visible", !dueDateValid);
  categoryToggle.classList.toggle("error-border", !categoryValid);
  if (categoryError) categoryError.classList.toggle("visible", !categoryValid);
  return titleValid && dueDateValid && categoryValid;
}

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

// Show confirmation toast
function showTaskAddedPopup() {
  const popup = document.createElement("div");
  popup.innerHTML = `<img src="./assets/icons/board.svg" alt="board icon"> Task added to Board`;
  popup.className = "task-toast";
  document.body.appendChild(popup);
  setTimeout(() => popup.remove(), 2500);
}

// ==== CATEGORY ====
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
function handleSubtaskEnter(e) {
  if (e.key === "Enter") {
    e.preventDefault();
    const subtaskIcons = document.getElementById("subtask-icons");
    if (subtaskIcons && !subtaskIcons.classList.contains("hidden"))
      addSubtask();
  }
}
function clearSubtaskInput() {
  const subtaskInput = document.getElementById("subtask-input");
  const subtaskIcons = document.getElementById("subtask-icons");
  const subtaskPlus = document.getElementById("subtask-plus");
  subtaskInput.value = "";
  subtaskIcons.classList.add("hidden");
  subtaskPlus.classList.remove("hidden");
}

// --- Custom Date Picker Helper ---
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
async function saveUpdatedSubtask(taskKey) {
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
  } catch (error) { }
}
