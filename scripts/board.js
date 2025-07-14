let arrayTasks = [];
let addTaskDefaultStatus = "todo";
let firebaseKey = localStorage.getItem("firebaseKey");
let lastCreatedTaskKey = null;
let currentDraggedElement;
let selectedPriority = "medium";
let subtasks = [];
let contacts = [];
let selectedContacts = [];
let selectedCategory = "";

/**
 * Loads all tasks and contacts for the current user and updates the board UI.
 *
 * @returns {Promise<void>}
 */
async function loadTasks() {
  let responseJson = await fetchTasksFromFirebase(firebaseKey);
  await fetchContactsAndStore(firebaseKey);
  arrayTasks = normalizeTasks(responseJson);
  await fetchContacts();
  updateHTML(arrayTasks);
}

/**
 * Creates and returns a label element for the assigned-to dropdown.
 * @returns {HTMLElement} The label element.
 */
function createLabel() {
  let label = document.createElement('span');
  label.textContent = 'Assigned to';
  label.className = 'overlay-card-label';
  return label;
}

/**
 * Positions the assigned circles wrapper after the dropdown.
 * @param {HTMLElement} wrapper
 * @param {HTMLElement} assignedListContainer
 */
function positionCirclesWrapper(wrapper, assignedListContainer) {
  let dropdown = document.getElementById('assigned-dropdown');
  if (dropdown && wrapper.previousSibling !== dropdown) {
    assignedListContainer.insertBefore(wrapper, dropdown.nextSibling);
  }
}

/**
 * Updates the visibility of the assigned circles wrapper.
 * @param {HTMLElement} wrapper
 * @param {Array<string>} selectedContacts
 */
function updateCirclesVisibility(wrapper, selectedContacts) {
  wrapper.style.display = selectedContacts.length === 0 ? "none" : "flex";
}

/**
 * Updates the content of the assigned circles wrapper with selected contacts.
 * @param {HTMLElement} wrapper
 * @param {Array<string>} selectedContacts
 * @param {Array<Object>} contacts
 */
/**
 * Updates the content of the assigned circles wrapper with selected contacts.
 * Renders up to four visible contact circles, and a "+N" circle if more are hidden.
 * @param {HTMLElement} wrapper - The wrapper element to update.
 * @param {Array<string>} selectedContacts - Array of selected contact names.
 * @param {Array<Object>} contacts - All available contact objects.
 */
function updateCirclesContent(wrapper, selectedContacts, contacts) {
  wrapper.innerHTML = '';
  let validContacts = getValidContacts(selectedContacts, contacts);
  let visibleContacts = validContacts.slice(0, 4);
  let hiddenCount = validContacts.length - visibleContacts.length;
  renderVisibleContacts(wrapper, visibleContacts);
  renderHiddenCount(wrapper, hiddenCount);
}

/**
 * Creates the text input for adding a new subtask.
 * @returns {HTMLInputElement} The input element.
 */
function createSubtaskInput() {
  let input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Add new subtask';
  input.id = 'add-subtask-input';
  input.className = 'add-subtask-input';
  return input;
}

/**
 * Saves the edited task data back to Firebase and refreshes the UI.
 *
 * @param {string} taskKey - The Firebase key of the task being edited.
 */
async function saveEditTask(taskKey) {
  let task = arrayTasks.find(t => t.firebaseKey === taskKey);
  if (!task) return;
  disableEditMode();
  let updatedTask = getUpdatedTaskFromEdit(task, taskKey);
  try {
    await updateTaskInFirebase(taskKey, updatedTask);
    updateTaskLocally(taskKey, updatedTask);
    reloadUIAfterEdit(taskKey, { noAnimation: true });
  } catch (error) {
    console.error("Fehler beim Bearbeiten des Tasks:", error);
  }
}

/**
 * Disables editing mode on the overlay card and restores the default view.
 */
function disableEditMode() {
  document.getElementById("overlay_card_title").contentEditable = "false";
  document.getElementById("overlay_card_description").contentEditable = "false";
  document.getElementById("due_date").contentEditable = "false";
  let titleLabel = document.getElementById("overlay_card_title_label");
  if (titleLabel) titleLabel.remove();
  let descLabel = document.getElementById("overlay_card_description_label");
  if (descLabel) descLabel.remove();
}

/**
 * Collects all updated values from the edit form and returns a new task object.
 * @param {Object} task - The original task object.
 * @param {string} taskKey - The Firebase key of the task.
 * @returns {Object} The updated task object.
 */
function getUpdatedTaskFromEdit(task, taskKey) {
  let newTitle = getEditedTitle();
  let newDescription = getEditedDescription();
  let newDueDate = getEditedDueDate();
  let newPriority = getEditedPriority(task.priority);
  let newAssignedTo = getEditedAssignedTo(task.assignedTo);
  let newSubtasks = getEditedSubtasks(task.subtask);
  return { ...task, title: newTitle, description: newDescription, dueDate: newDueDate, priority: newPriority, assignedTo: newAssignedTo, subtask: newSubtasks };
}

/**
 * Gets the edited title from the overlay input.
 * @returns {string} The new title.
 */
function getEditedTitle() {
  return document.getElementById("overlay_card_title").innerHTML;
}

/**
 * Gets the edited description from the overlay input.
 * @returns {string} The new description.
 */
function getEditedDescription() {
  return document.getElementById("overlay_card_description").innerHTML;
}

/**
 * Gets the edited due date from the overlay input.
 * @returns {string} The new due date.
 */
function getEditedDueDate() {
  return getNewDueDate();
}

/**
 * Gets the edited priority from the overlay selection.
 * @param {string} defaultPriority - The fallback priority if not changed.
 * @returns {string} The selected or default priority.
 */
function getEditedPriority(defaultPriority) {
  let priorityWrapper = document.getElementById('priority-edit-buttons');
  if (priorityWrapper && priorityWrapper.dataset.selectedPriority) {
    return priorityWrapper.dataset.selectedPriority;
  }
  return defaultPriority;
}

/**
 * Gets the edited assigned contacts from the overlay dropdown.
 * @param {Array<string>} defaultAssignedTo - The fallback assigned contacts.
 * @returns {Array<string>} The selected or default assigned contacts.
 */
function getEditedAssignedTo(defaultAssignedTo) {
  return typeof window.getAssignedOverlaySelection === 'function'
    ? window.getAssignedOverlaySelection()
    : defaultAssignedTo;
}

/**
 * Gets the edited subtasks from the overlay editor.
 * @param {Array<Object>} defaultSubtasks - The fallback subtasks.
 * @returns {Array<Object>} The edited or default subtasks.
 */
function getEditedSubtasks(defaultSubtasks) {
  return typeof window.getEditedSubtasks === 'function'
    ? window.getEditedSubtasks()
    : defaultSubtasks;
}

/**
 * Gets the new due date string from the date input or fallback from overlay.
 * @returns {string} The new due date string.
 */
function getNewDueDate() {
  let dueDateInput = document.getElementById("due_date_input");
  if (dueDateInput) {
    let [y, m, d] = dueDateInput.value.split("-");
    if (y && m && d) return `${d}/${m}/${y}`;
  }
  let rawDueDate = document.getElementById("due_date").innerHTML;
  let match = rawDueDate.match(/(\d{2}\/\d{2}\/\d{4}|\d{4}-\d{2}-\d{2})/);
  return match ? match[0] : "";
}

/**
 * Updates the local arrayTasks with the edited task.
 * @param {string} taskKey - The Firebase key of the task.
 * @param {Object} updatedTask - The updated task data.
 */
function updateTaskLocally(taskKey, updatedTask) {
  arrayTasks = arrayTasks.map(t => t.firebaseKey === taskKey ? updatedTask : t);
}

/**
 * Refreshes the board UI after editing a task and reopens the overlay card.
 * @param {string} taskKey - The Firebase key of the task.
 * @param {Object} [options={}] - Options for reopening the card.
 */
function reloadUIAfterEdit(taskKey, options = {}) {
  updateHTML();
  openBoardCard(taskKey, options);
}

/**
 * Opens the add task overlay and sets a default status.
 * @param {string} status - The status to assign the new task.
 */
function openAddTaskForStatus(status) {
  addTaskDefaultStatus = status;
  openAddTaskOverlay();
}

/**
 * Opens and initializes the add task overlay modal.
 */
function openAddTaskOverlay() {
  showAddTaskOverlay();
  renderAddTaskModal();
  addAddTaskOverlayEventListeners();
  initAddTaskOverlayLogic();
}

/**
 * Shows the add task overlay and disables background scrolling.
 */
function showAddTaskOverlay() {
  let overlay = document.getElementById("add_task_overlay");
  overlay.classList.remove("d-none");
  document.getElementById("html").style.overflow = "hidden";
}

/**
 * Renders the content of the add task modal and initializes the animation.
 */
function renderAddTaskModal() {
  let overlay = document.getElementById("add_task_overlay");
  overlay.innerHTML = getAddTaskOverlay();
  updateHTML();
  setTimeout(() => {
    let modal = document.querySelector('.board-add-task-modal');
    if (modal) modal.classList.add('open');
  }, 10);
}

/**
 * Adds event listeners to handle clicks outside the add task overlay/modal.
 */
function addAddTaskOverlayEventListeners() {
  setTimeout(() => {
    document.addEventListener('mousedown', handleAddTaskOverlayClickOutside);
  }, 0);
}

/**
 * Closes the add task overlay. Handles animation if modal is open.
 */
function closeAddTaskOverlay() {
  let modal = document.querySelector('.board-add-task-modal');
  if (modal) {
    closeAddTaskModalWithAnimation();
  } else {
    hideAndResetAddTaskOverlay();
  }
  resetAddTaskDefaultStatus();
  removeAddTaskOverlayEventListener();
}

/**
 * Closes the add task modal with animation and then hides and resets overlay.
 */
function closeAddTaskModalWithAnimation() {
  let modal = document.querySelector('.board-add-task-modal');
  modal.classList.remove('open');
  setTimeout(hideAndResetAddTaskOverlay, 400);
}

/**
 * Hides and resets the add task overlay content and restores scroll.
 */
function hideAndResetAddTaskOverlay() {
  let overlay = document.getElementById("add_task_overlay");
  if (overlay) {
    overlay.classList.add("d-none");
    document.getElementById("html").style.overflow = "";
    overlay.innerHTML = "";
  }
}

/**
 * Resets the default status for new tasks to 'todo'.
 */
function resetAddTaskDefaultStatus() {
  addTaskDefaultStatus = "todo";
}

/**
 * Removes the add task overlay's outside click event listener.
 */
function removeAddTaskOverlayEventListener() {
  document.removeEventListener('mousedown', handleAddTaskOverlayClickOutside);
}

/**
 * Handles click outside of the add task modal and closes the overlay.
 * @param {Event} event - The mousedown event.
 */
function handleAddTaskOverlayClickOutside(event) {
  let modal = document.querySelector('.board-add-task-modal');
  if (!modal) return;
  if (!modal.contains(event.target)) {
    closeAddTaskOverlay();
  }
}

/**
 * Handles outside clicks to close dropdowns for contacts and category.
 * @param {Event} event - The mousedown event.
 */
document.addEventListener("mousedown", function (event) {
  closeDropdownIfClickedOutside(
    "dropdown-content",
    "dropdown-toggle",
    "visible",
    "open",
    event
  );
  closeDropdownIfClickedOutside(
    "category-content",
    "category-toggle",
    "visible",
    "open",
    event
  );
});

/**
 * Closes a dropdown if a click was outside its content or toggle element.
 * @param {string} contentId - The content DOM id.
 * @param {string} toggleId - The toggle DOM id.
 * @param {string} visibleClass - The CSS class indicating visibility.
 * @param {string} openClass - The CSS class for an open toggle.
 * @param {Event} event - The mousedown event.
 */
function closeDropdownIfClickedOutside(contentId, toggleId, visibleClass, openClass, event) {
  let content = document.getElementById(contentId);
  let toggle = document.getElementById(toggleId);
  if (content && toggle && content.classList.contains(visibleClass)) {
    if (!content.contains(event.target) && !toggle.contains(event.target)) {
      content.classList.remove(visibleClass);
      toggle.classList.remove(openClass);
    }
  }
}

/**
 * Selects the given priority, updates UI, and submit button state.
 * @param {string} prio - The selected priority.
 */
function selectPriority(prio) {
  selectedPriority = prio;
  document.querySelectorAll("#buttons-prio button").forEach((b) => {
    b.classList.toggle("selected", b.dataset.prio === prio);
  });
  updateSubmitState();
}

/**
 * Creates a dropdown item for a category and click handler.
 * @param {string} category - The category name.
 * @param {HTMLElement} content - The dropdown content element.
 * @returns {HTMLElement}
 */
function createCategoryDropdownItem(category, content) {
  let item = document.createElement("div");
  item.className = "dropdown-item category-item";
  item.innerHTML = `<span class="category-name">${category}</span>`;
  item.onclick = () => {
    handleCategoryClick(category, content);
  };
  return item;
}

/**
 * Handles click on a category dropdown item.
 * @param {string} category - The category name.
 * @param {HTMLElement} content - The dropdown content element.
 */
function handleCategoryClick(category, content) {
  selectCategory(category);
  content.classList.remove("visible");
  document.getElementById("category-toggle").classList.remove("open");
  updateSubmitState();
}

/**
 * Handles pressing Enter in the subtask input, triggers addSubtask if icons visible.
 * @param {KeyboardEvent} e - The keydown event.
 */
function handleSubtaskEnter(e) {
  if (e.key === "Enter") {
    e.preventDefault();
    let subtaskIcons = document.getElementById("subtask-icons");
    if (subtaskIcons && !subtaskIcons.classList.contains("hidden")) {
      addSubtask();
    }
  }
}

/**
 * Updates the category UI to display the selected category icon.
 */
function updateCategoryUI() {
  let box = document.getElementById("selected-category");
  if (!box) return;
  clearCategoryBox(box);
  if (selectedCategory) {
    let icon = createCategoryIcon(selectedCategory);
    box.appendChild(icon);
  }
}

/**
 * Validates all main form fields: title, due date, and category.
 * @returns {boolean} True if valid, false otherwise.
 */
function validateForm() {
  let titleEl = document.getElementById("title");
  let dueDateEl = document.getElementById("dueDate");
  let categoryToggle = document.getElementById("category-toggle");

  let titleValid = isInputFilled(titleEl);
  let dueDateValid = isInputFilled(dueDateEl);
  let categoryValid = isCategorySelected();

  showTitleError(titleEl, titleValid);
  showDueDateError(dueDateEl, dueDateValid);
  showCategoryError(categoryToggle, categoryValid);

  return titleValid && dueDateValid && categoryValid;
}

/**
 * Shows or hides the title error state and error message.
 * @param {HTMLElement} titleEl - The title input element.
 * @param {boolean} isValid - Whether the title is valid.
 */
function showTitleError(titleEl, isValid) {
  let titleError = document.getElementById("error-title");
  titleEl.classList.toggle("error", !isValid);
  if (titleError) titleError.classList.toggle("visible", !isValid);
}

/**
 * Shows or hides the due date error state and error message.
 * @param {HTMLElement} dueDateEl - The due date input element.
 * @param {boolean} isValid - Whether the due date is valid.
 */
function showDueDateError(dueDateEl, isValid) {
  let dueDateError = document.getElementById("error-dueDate");
  dueDateEl.classList.toggle("error-border", !isValid);
  if (dueDateError) dueDateError.classList.toggle("visible", !isValid);
}

/**
 * Shows or hides the category error state and error message.
 * @param {HTMLElement} categoryToggle - The category toggle element.
 * @param {boolean} isValid - Whether the category is valid.
 */
function showCategoryError(categoryToggle, isValid) {
  let categoryError = document.getElementById("error-category");
  categoryToggle.classList.toggle("error-border", !isValid);
  if (categoryError) categoryError.classList.toggle("visible", !isValid);
}

/**
 * Enables or disables the submit button based on form state.
 */
function updateSubmitState() {
  let button = document.getElementById("submit-task-btn");
  if (button) button.disabled = false;
}

/**
 * Resets all main form fields and UI state.
 */
function resetForm() {
  resetTitle();
  resetDescription();
  resetDueDate();
  resetPriority();
  resetContacts();
  resetCategory();
  resetSubtasks();
}

/**
 * Resets the title input field.
 */
function resetTitle() {
  let title = document.getElementById("title");
  if (title) title.value = "";
}

/**
 * Resets the description input field.
 */
function resetDescription() {
  let description = document.getElementById("description");
  if (description) description.value = "";
}

/**
 * Resets the due date input field.
 */
function resetDueDate() {
  let dueDate = document.getElementById("dueDate");
  if (dueDate) dueDate.value = "";
}

/**
 * Resets the priority selection to the default value.
 */
function resetPriority() {
  selectedPriority = "medium";
  selectPriority("medium");
}

/**
 * Clears all selected contacts and updates the UI.
 */
function resetContacts() {
  selectedContacts = [];
  updateSelectedContactsUI();
}

/**
 * Clears the selected category and resets UI.
 */
function resetCategory() {
  selectedCategory = "";
  let categoryPlaceholder = document.querySelector("#category-toggle span");
  if (categoryPlaceholder) categoryPlaceholder.textContent = "Select category";
}

/**
 * Clears all subtasks and resets the subtask input and list.
 */
function resetSubtasks() {
  clearSubtasksArray();
  clearSubtasksList();
  clearSubtaskInput();
  hideSubtaskIcons();
  showSubtaskPlus();
}

/**
 * Empties the subtasks array.
 */
function clearSubtasksArray() {
  subtasks.length = 0;
}

/**
 * Clears the subtask list display.
 */
function clearSubtasksList() {
  let subtaskList = document.getElementById("subtask-list");
  if (subtaskList) subtaskList.innerHTML = "";
}

/**
 * Hides the subtask action icons.
 */
function hideSubtaskIcons() {
  let subtaskIcons = document.getElementById("subtask-icons");
  if (subtaskIcons) subtaskIcons.classList.add("hidden");
}

/**
 * Shows the subtask "plus" (add) icon.
 */
function showSubtaskPlus() {
  let subtaskPlus = document.getElementById("subtask-plus");
  if (subtaskPlus) subtaskPlus.classList.remove("hidden");
}

/**
 * Sets up date input validation, ensures only today or future dates are selectable.
 */
function setupDateValidation() {
  setTimeout(() => {
    let dateInput = document.getElementById("dueDate");
    let errorText = document.getElementById("error-dueDate");
    if (!dateInput || !errorText) return;
    setMinDateToday(dateInput);
    addDateInputListener(dateInput, errorText);
  }, 100);
}

/**
 * Sets the minimum date of the date input to today.
 * @param {HTMLInputElement} dateInput - The date input element.
 */
function setMinDateToday(dateInput) {
  let today = new Date().toISOString().split("T")[0];
  dateInput.min = today;
}

/**
 * Adds an input event listener to the date input to clear errors when user changes date.
 * @param {HTMLInputElement} dateInput - The date input element.
 * @param {HTMLElement} errorText - The error message element.
 */
function addDateInputListener(dateInput, errorText) {
  dateInput.addEventListener("input", () => {
    dateInput.classList.remove("error-border");
    errorText.classList.remove("visible");
  });
}

/**
 * Creates a new task based on form input and stores it in Firebase.
 */
async function createTask() {
  if (!validateForm()) return;
  let task = buildTaskObject();
  await saveTaskToFirebase(task);
  closeAddTaskOverlay();
  showTaskAddedOverlay();
  await reloadAndHighlightNewTask();
}

/**
 * Shows the "task added" overlay for a short duration.
 */
function showTaskAddedOverlay() {
  let overlay = document.getElementById("task-added-overlay");
  if (!overlay) return;
  overlay.style.display = "flex";
  overlay.classList.add("show");
  setTimeout(() => {
    overlay.classList.remove("show");
    setTimeout(() => {
      overlay.style.display = "none";
    }, 200);
  }, 2500);
}

/**
 * Builds and returns a task object from current form input values.
 * @returns {Object} The task object.
 */
function buildTaskObject() {
  return {
    title: getInputValue("title"),
    description: getInputValue("description"),
    dueDate: getInputValue("dueDate"),
    priority: selectedPriority,
    assignedTo: selectedContacts.map((c) => c.name),
    category: selectedCategory,
    subtask: subtasks.map(st => ({ title: st, completed: false })),
    createdAt: new Date().toISOString(),
    status: addTaskDefaultStatus,
  };
}

/**
 * Saves a new task to Firebase.
 * @param {Object} task - The task object to save.
 * @returns {Promise<void>}
 */
async function saveTaskToFirebase(task) {
  await fetch(
    `${BASE_URL}${firebaseKey}/tasks.json`,
    {
      method: "POST",
      body: JSON.stringify(task),
    }
  );
}

/**
 * Reloads the tasks from Firebase and highlights the most recently created task.
 * @returns {Promise<void>}
 */
async function reloadAndHighlightNewTask() {
  await loadTasks();
  setTimeout(() => {
    highlightLastCreatedTask();
  }, 100);
}

/**
 * Highlights the most recently created task on the board for a short duration.
 */
function highlightLastCreatedTask() {
  let lastTask = arrayTasks[arrayTasks.length - 1];
  if (lastTask && lastTask.firebaseKey) {
    lastCreatedTaskKey = lastTask.firebaseKey;
    updateHTML();
    setTimeout(() => {
      let newTaskEl = document.getElementById(lastCreatedTaskKey);
      if (newTaskEl) {
        newTaskEl.classList.remove("task-blink");
      }
      lastCreatedTaskKey = null;
    }, 2000);
  }
}

/**
 * Sets up all event listeners for the add task form, including dropdowns, category, and subtask input.
 */
function setupEventListeners() {
  setupDropdownListeners();
  setupCategoryListeners();
  setupSubtaskInputListeners();
}

/**
 * Sets up event listeners for the assigned-to dropdown (open/close and stop propagation).
 */
function setupDropdownListeners() {
  let dropdownToggle = document.getElementById("dropdown-toggle");
  if (dropdownToggle) {
    dropdownToggle.addEventListener("click", toggleAssignDropdown);
  }
  let dropdownContent = document.getElementById("dropdown-content");
  if (dropdownContent) {
    dropdownContent.addEventListener("click", e => e.stopPropagation());
  }
}

/**
 * Sets up event listeners for the category dropdown.
 */
function setupCategoryListeners() {
  let categoryToggle = document.getElementById("category-toggle");
  if (categoryToggle) {
    categoryToggle.addEventListener("click", toggleCategoryDropdown);
  }
}

/**
 * Sets up event listeners for the subtask input field (show/hide icons, handle Enter key).
 */
function setupSubtaskInputListeners() {
  let subtaskInput = document.getElementById("subtask-input");
  if (!subtaskInput) return;
  subtaskInput.addEventListener("input", showOrHideSubtaskIcons);
  subtaskInput.addEventListener("keydown", handleSubtaskEnter);
}

/**
 * Initializes the logic for the add task overlay: loads contacts, sets up listeners, validates date, and resets form.
 */
function initAddTaskOverlayLogic() {
  fetchContacts();
  setupEventListeners();
  setupDateValidation();
  resetForm();
}

/**
 * Handles the click on a move task menu option: moves task and closes menu.
 * @param {string} taskKey - The Firebase key of the task.
 * @param {string} statusKey - The new status to move to.
 */
function handleMoveTaskOptionClick(taskKey, statusKey) {
  currentDraggedElement = taskKey;
  moveTo(statusKey);
  closeMoveTaskMenu();
}

/**
 * Adds drag & drop highlight listeners to all board columns for visual feedback.
 */
function addDragHighlightListeners() {
  getBoardColumns().forEach(el => {
    setupDragEventsForColumn(el);
  });
}

/**
 * Returns an array of all board column elements.
 * @returns {Array<HTMLElement>}
 */
function getBoardColumns() {
  return ['todo', 'progress', 'feedback', 'done']
    .map(id => document.getElementById(id))
    .filter(Boolean);
}

/**
 * Sets up all drag event listeners for a given board column.
 * @param {HTMLElement} el - The board column element.
 */
function setupDragEventsForColumn(el) {
  el.addEventListener('dragover', ev => handleDragOver(ev, el));
  el.addEventListener('dragleave', () => handleDragLeave(el));
  el.addEventListener('drop', ev => handleDrop(ev, el));
}

/**
 * Handles the dragover event for a board column.
 * @param {DragEvent} ev
 * @param {HTMLElement} el
 */
function handleDragOver(ev, el) {
  ev.preventDefault();
  el.classList.add('highlight');
}

/**
 * Handles the dragleave event for a board column.
 * @param {HTMLElement} el
 */
function handleDragLeave(el) {
  el.classList.remove('highlight');
}

/**
 * Handles the drop event for a board column.
 * @param {DragEvent} ev
 * @param {HTMLElement} el
 */
function handleDrop(ev, el) {
  ev.preventDefault();
  let draggedEl = document.getElementById(currentDraggedElement);
  if (draggedEl && !el.contains(draggedEl)) {
    el.appendChild(draggedEl);
  }
  removeAllHighlights();
}

/**
 * Removes the highlight class from all board columns.
 */
function removeAllHighlights() {
  getBoardColumns().forEach(el => el.classList.remove('highlight'));
}

/**
 * Adds drag & drop highlight listeners to all board columns for visual feedback after DOM load.
 * Runs automatically when the DOM is ready.
 */
window.addEventListener('DOMContentLoaded', addDragHighlightListeners);