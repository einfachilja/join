/**
 * Renders the subtasks of a task as HTML list items.
 * @param {Object} task - The task object containing subtasks.
 * @returns {string} HTML string of rendered subtasks.
 */
function renderSubtasks(task) {
  if (!Array.isArray(task.subtask)) return "";
  return task.subtask.map((sub, idx) => {
    let title = typeof sub === 'string' ? sub : sub.title;
    let checked = typeof sub === 'object' && sub.completed ? 'checked' : '';
    let id = `subtask-${task.firebaseKey}-${idx}`;
    return getSubtaskItemHTML(title, checked, id, task.firebaseKey, idx);
  }).join("");
}

/**
 * Updates the subtask list and progress bar in the overlay for a given task.
 * @param {Object} task - The task object to update the overlay for.
 */
function updateOverlaySubtasks(task) {
  let subtaskList = document.querySelector('.subtask-list ul');
  if (subtaskList) {
    subtaskList.classList.add('subtask-list-not-edit');
    subtaskList.innerHTML = renderSubtasks(task);
  }
  let progressBar = document.querySelector('.subtask-progress-bar');
  if (progressBar) {
    let subtasksArr = Array.isArray(task.subtask) ? task.subtask : [];
    let total = subtasksArr.length;
    let completed = subtasksArr.filter(sub => typeof sub === "object" && sub.completed).length;
    let percent = total > 0 ? (completed / total) * 100 : 0;
    progressBar.style.width = percent + "%";
    progressBar.textContent = `${completed}/${total} Done`;
  }
}

/**
 * Converts an array of strings or objects into valid subtask objects.
 * @param {Array<string|Object>} subtasks - An array of subtasks.
 * @returns {Array<Object>} An array of subtask objects with title and completed status.
 */
function convertSubtasksToObjects(subtasks) {
  return subtasks.map(sub => typeof sub === 'string' ? { title: sub, completed: false } : sub);
}

/**
 * Toggles a subtask's completion state and updates Firebase and UI accordingly.
 * @param {string} taskKey - The Firebase key of the task.
 * @param {number} index - The index of the subtask.
 */
async function toggleSubtask(taskKey, index) {
  let task = arrayTasks.find(t => t.firebaseKey === taskKey);
  if (!task || !Array.isArray(task.subtask)) return;
  task.subtask = convertSubtasksToObjects(task.subtask);
  toggleSubtaskCompleted(task.subtask, index);
  try {
    await saveSubtasksToFirebase(taskKey, task.subtask);
    updateHTML();
    updateOverlaySubtasks(task);
    blurCheckbox(taskKey, index);
  } catch (error) {
    console.error("Fehler beim Aktualisieren des Subtasks:", error);
  }
}

/**
 * Blurs the checkbox input element of a subtask after toggling.
 * @param {string} taskKey - The Firebase key of the task.
 * @param {number} index - The index of the subtask.
 */
function blurCheckbox(taskKey, index) {
  setTimeout(() => {
    let checkboxId = `subtask-${taskKey}-${index}`;
    let checkbox = document.getElementById(checkboxId);
    if (checkbox) checkbox.blur();
  }, 0);
}

/**
 * Initializes the editable subtask list inside the overlay card.
 */
function setupSubtasksEdit() {
  let subtaskList = document.querySelector('.subtask-list ul');
  if (!subtaskList || document.getElementById('subtasks-edit-container')) return;
  let { container, input, addBtn } = createSubtasksEditContainer();
  let subtasks = getSubtasksOfCurrentTask();
  function rerender() {
    renderSubtasksList(subtasks, container, rerender);
  }
  addBtn.onclick = () => handleAddSubtask(subtasks, input, container, rerender);
  rerender();
  subtaskList.innerHTML = '';
  subtaskList.appendChild(container);
  window.getEditedSubtasks = () => subtasks;
}

/**
 * Gets the subtasks array for the currently open task in the overlay.
 * @returns {Array<Object>} The array of subtask objects.
 */
function getSubtasksOfCurrentTask() {
  let taskKey = document.getElementById('board_overlay_card').dataset.firebaseKey;
  let task = arrayTasks.find(t => t.firebaseKey === taskKey);
  return Array.isArray(task.subtask) ? task.subtask : [];
}

/**
 * Creates the container and input/button elements for editing subtasks.
 * @returns {Object} The created elements: container, input, addBtn.
 */
function createSubtasksEditContainer() {
  let container = document.createElement('div');
  container.id = 'subtasks-edit-container';
  container.className = 'subtasks-edit-container';
  let inputWrapper = document.createElement('div');
  inputWrapper.className = 'subtask-input-wrapper';
  let input = createSubtaskInput();
  let addBtn = createAddSubtaskButton();
  // Add Enter key event to add subtask
  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      addBtn.click();
    }
  });
  inputWrapper.appendChild(input);
  inputWrapper.appendChild(addBtn);
  container.appendChild(inputWrapper);
  return { container, input, addBtn };
}

/**
 * Renders the editable list of subtasks inside the edit container.
 * @param {Array<Object>} subtaskArr - The array of subtasks.
 * @param {HTMLElement} container - The container element to render into.
 * @param {Function} rerender - The function to rerender the list.
 */
function renderSubtasksList(subtaskArr, container, rerender) {
  let listDiv = document.getElementById('subtask-list-edit');
  if (!listDiv) {
    listDiv = document.createElement('div');
    listDiv.id = 'subtask-list-edit';
    container.appendChild(listDiv);
  }
  listDiv.innerHTML = '';
  subtaskArr.forEach((sub, idx) => {
    let row = createSubtaskRow(sub, idx, subtaskArr, rerender, container);
    listDiv.appendChild(row);
  });
}

/**
 * Handles adding a new subtask to the subtasks array and rerenders the list.
 * @param {Array<Object>} subtasks - The subtasks array.
 * @param {HTMLInputElement} input - The input element for new subtask.
 * @param {HTMLElement} container - The container element.
 * @param {Function} rerender - The rerender callback.
 */
function handleAddSubtask(subtasks, input, container, rerender) {
  let val = input.value.trim();
  if (val) {
    subtasks.push({ title: val, completed: false });
    rerender();
    input.value = '';
  }
}

/**
 * Creates the dot element for a subtask.
 * @returns {HTMLSpanElement} The dot element.
 */
function createSubtaskDot() {
  let dot = document.createElement("span");
  dot.className = "subtask-dot";
  dot.textContent = "•";
  return dot;
}

/**
 * Attaches editing, blur, and keydown logic to a subtask input element.
 * @param {HTMLInputElement} input - The input element.
 * @param {HTMLLIElement} li - The parent list item element.
 */
function addSubtaskInputElemEvents(input, li) {
  input.activateEdit = () => {
    input.readOnly = false;
    input.focus();
    input.setSelectionRange(0, input.value.length);
  };
  input.onblur = () => {
    if (input.value.trim() === "") {
      li.remove();
      return;
    }
    input.readOnly = true;
  };
  input.onkeydown = (e) => {
    if (e.key === "Enter") input.blur();
  };
}

/**
 * Adds a new subtask from the input field, validates, appends to the list, and resets UI.
 */
function addSubtask() {
  let input = document.getElementById("subtask-input");
  let subtaskIcons = document.getElementById("subtask-icons");
  let text = input.value.trim();
  if (!validateSubtaskInput(text, subtaskIcons, input)) return;
  subtasks.push(text);
  let li = createSubtaskListItem(text);
  document.getElementById("subtask-list").appendChild(li);
  finalizeSubtaskInput(input, subtaskIcons);
}

/**
 * Finalizes the subtask input field: resets, hides icons, updates submit state.
 * @param {HTMLInputElement} input - The subtask input element.
 * @param {HTMLElement} subtaskIcons - The icons wrapper element.
 */
function finalizeSubtaskInput(input, subtaskIcons) {
  updateSubmitState();
  input.value = "";
  subtaskIcons.classList.add("hidden");
  let subtaskPlus = document.getElementById("subtask-plus");
  if (subtaskPlus) subtaskPlus.classList.remove("hidden");
}

/**
 * Shows or hides the subtask action icons depending on input focus and value.
 */
function toggleSubtaskIcons() {
  let input = document.getElementById("subtask-input");
  let confirmIcon = document.getElementById("subtask-confirm");
  let defaultIcon = document.getElementById("subtask-plus");
  let cancelIcon = document.getElementById("subtask-cancel");
  let isActive = document.activeElement === input;
  confirmIcon?.classList.toggle("hidden", !isActive);
  cancelIcon?.classList.toggle("hidden", !isActive);
  defaultIcon?.classList.toggle("hidden", isActive);
}

/**
 * Clears the subtask input, hides icons, shows the add ("plus") icon.
 */
function clearSubtaskInput() {
  let subtaskInput = document.getElementById("subtask-input");
  let subtaskIcons = document.getElementById("subtask-icons");
  let subtaskPlus = document.getElementById("subtask-plus");
  if (subtaskInput) subtaskInput.value = "";
  if (subtaskIcons) subtaskIcons.classList.add("hidden");
  if (subtaskPlus) subtaskPlus.classList.remove("hidden");
}

/**
 * Shows or hides the subtask action icons depending on input value.
 */
function showOrHideSubtaskIcons() {
  let input = document.getElementById("subtask-input");
  let iconWrapper = document.getElementById("subtask-icons");
  if (!input || !iconWrapper) return;
  if (input.value.trim().length > 0) {
    iconWrapper.classList.remove("hidden");
  } else {
    iconWrapper.classList.add("hidden");
  }
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
 * Sets up event listeners for the subtask input field (show/hide icons, handle Enter key).
 */
function setupSubtaskInputListeners() {
  let subtaskInput = document.getElementById("subtask-input");
  if (!subtaskInput) return;
  subtaskInput.addEventListener("input", showOrHideSubtaskIcons);
  subtaskInput.addEventListener("keydown", handleSubtaskEnter);
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
 * Generates HTML for a subtask progress bar.
 *
 * @param {Array<Object>} subtasksArr - Array of subtasks with completion status.
 * @returns {string} HTML string for the progress bar.
 */
function generateSubtaskProgress(subtasksArr) {
  let total = subtasksArr.length;
  let completed = subtasksArr.filter(sub => typeof sub === "object" && sub.completed).length;
  let percent = total > 0 ? (completed / total) * 100 : 0;
  if (total === 0) return "";
  return getSubtaskProgressHTML(completed, total, percent);
}

/**
 * Toggles the completion status of a subtask at a given index.
 *
 * @param {Array<Object>} subtasks - The array of subtasks.
 * @param {number} index - The index of the subtask to toggle.
 */
function toggleSubtaskCompleted(subtasks, index) {
  if (Array.isArray(subtasks) && subtasks[index]) {
    subtasks[index].completed = !subtasks[index].completed;
  }
}