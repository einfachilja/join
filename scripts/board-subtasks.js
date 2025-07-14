/**
 * Renders the subtasks of a task as HTML list items.
 *
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
 *
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
 *
 * @param {Array<string|Object>} subtasks - An array of subtasks.
 * @returns {Array<Object>} An array of subtask objects with title and completed status.
 */
function convertSubtasksToObjects(subtasks) {
    return subtasks.map(sub => typeof sub === 'string' ? { title: sub, completed: false } : sub);
}

/**
 * Toggles a subtask's completion state and updates Firebase and UI accordingly.
 *
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
 *
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
 * Creates a row element for an editable subtask.
 * @param {Object|string} sub - The subtask object or string.
 * @param {number} idx - The index of the subtask.
 * @param {Array<Object>} subtaskArr - The array of subtasks.
 * @param {Function} rerender - The rerender callback.
 * @param {HTMLElement} container - The parent container.
 * @returns {HTMLElement} The subtask row element.
 */
function createSubtaskRow(sub, idx, subtaskArr, rerender, container) {
    let row = document.createElement('div');
    row.className = 'subtask-list-row';
    let input = createSubtaskRowInput(sub, idx, subtaskArr);
    let editBtn = createSubtaskRowEditButton(input);
    let removeBtn = createSubtaskRowRemoveButton(idx, subtaskArr, rerender);
    let dot = createSubtaskRowDot();
    row.appendChild(dot);
    row.appendChild(input);
    row.appendChild(editBtn);
    row.appendChild(removeBtn);
    row.ondblclick = () => {
        input.activateEdit();
    };
    return row;
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
 * Creates an input element for a subtask and attaches all logic.
 * @param {string} text - The subtask text.
 * @param {HTMLLIElement} li - The parent list item element.
 * @returns {HTMLInputElement} The configured input element.
 */
function createSubtaskInputElem(text, li) {
  let input = document.createElement("input");
  input.type = "text";
  input.value = text;
  input.className = "subtask-list-editinput";
  input.readOnly = true;
  addSubtaskInputElemEvents(input, li);
  return input;
}

/**
 * Creates the button element for adding a subtask.
 * @returns {HTMLButtonElement} The add button element.
 */
function createAddSubtaskButton() {
  let addBtn = document.createElement('button');
  addBtn.type = 'button';
  addBtn.id = 'add-subtask-btn';
  addBtn.textContent = '+';
  addBtn.className = 'add-subtask-btn';
  return addBtn;
}

/**
 * Creates the input element for editing a subtask row.
 * @param {Object|string} sub - The subtask object or string.
 * @param {number} idx - The index of the subtask in the array.
 * @param {Array<Object>} subtaskArr - The array of subtasks.
 * @returns {HTMLInputElement} The input element.
 */
function createSubtaskRowInput(sub, idx, subtaskArr) {
  let input = document.createElement('input');
  input.type = 'text';
  input.value = typeof sub === 'string' ? sub : sub.title;
  input.className = 'subtask-list-editinput';
  input.readOnly = true;
  input.activateEdit = () => { input.readOnly = false; input.focus(); input.setSelectionRange(0, input.value.length); };
  input.onblur = () => { if (input.value.trim() !== '') subtaskArr[idx].title = input.value.trim(); input.readOnly = true; };
  input.onkeydown = (e) => { if (e.key === 'Enter') input.blur(); };
  return input;
}

/**
 * Creates the edit button for a subtask row.
 * @param {HTMLInputElement} input - The input element to activate edit on.
 * @returns {HTMLButtonElement} The edit button element.
 */
function createSubtaskRowEditButton(input) {
  let editBtn = document.createElement('button');
  editBtn.type = 'button';
  editBtn.className = 'subtask-edit-btn';
  editBtn.innerHTML = `<img src="assets/icons/board/board-edit-icon.svg">`;
  editBtn.title = 'Bearbeiten';
  editBtn.onclick = (e) => {
    e.preventDefault();
    input.activateEdit();
  };
  return editBtn;
}

/**
 * Creates the remove button for a subtask row.
 * @param {number} idx - The index of the subtask.
 * @param {Array<Object>} subtaskArr - The array of subtasks.
 * @param {Function} rerender - The rerender callback.
 * @returns {HTMLButtonElement} The remove button element.
 */
function createSubtaskRowRemoveButton(idx, subtaskArr, rerender) {
  let removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'subtask-remove-btn';
  removeBtn.innerHTML = `<img src="assets/icons/board/board-delete-icon.svg">`;
  removeBtn.onclick = (e) => {
    e.preventDefault();
    subtaskArr.splice(idx, 1);
    rerender();
  };
  return removeBtn;
}

/**
 * Creates the dot element for a subtask row.
 * @returns {HTMLElement} The dot span element.
 */
function createSubtaskRowDot() {
  let dot = document.createElement('span');
  dot.className = 'subtask-dot';
  dot.textContent = '•';
  return dot;
}

/**
 * Creates a list item DOM element for a subtask, including edit/remove actions.
 * @param {string} text - The subtask text.
 * @returns {HTMLLIElement} The subtask list item element.
 */
function createSubtaskListItem(text) {
  let li = document.createElement("li");
  li.className = "subtask-list-item";
  li.appendChild(createSubtaskDot());
  let input = createSubtaskInputElem(text, li);
  li.appendChild(input);
  li.appendChild(createEditBtn(input));
  li.appendChild(createRemoveBtn(li));
  li.ondblclick = () => input.activateEdit();
  return li;
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
 * Creates the edit button for a subtask.
 * @param {HTMLInputElement} input - The input to activate editing.
 * @returns {HTMLButtonElement} The edit button.
 */
function createEditBtn(input) {
  let editBtn = document.createElement("button");
  editBtn.type = "button";
  editBtn.className = "subtask-edit-btn";
  editBtn.innerHTML = `<img src="assets/icons/board/board-edit-icon.svg">`;
  editBtn.title = "Bearbeiten";
  editBtn.onclick = (e) => {
    e.preventDefault();
    input.activateEdit();
  };
  return editBtn;
}

/**
 * Creates the remove button for a subtask.
 * @param {HTMLLIElement} li - The list item to remove.
 * @returns {HTMLButtonElement} The remove button.
 */
function createRemoveBtn(li) {
  let removeBtn = document.createElement("button");
  removeBtn.type = "button";
  removeBtn.className = "subtask-remove-btn";
  removeBtn.innerHTML = `<img src="assets/icons/board/board-delete-icon.svg">`;
  removeBtn.onclick = (e) => {
    e.preventDefault();
    li.remove();
  };
  return removeBtn;
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