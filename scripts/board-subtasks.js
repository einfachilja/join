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