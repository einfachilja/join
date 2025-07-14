/**
 * Updates the entire board UI with the current tasks.
 */
function updateHTML() {
    renderSection("todo", getTasksByStatus("todo"), "No Tasks");
    renderSection("progress", getTasksByStatus("progress"), "No Tasks");
    renderSection("feedback", getTasksByStatus("feedback"), "No Tasks");
    renderSection("done", getTasksByStatus("done"), "No Tasks");
    addCardClickListeners();
}

/**
 * Renders a section of the board with tasks or an empty message.
 *
 * @param {string} sectionId - The DOM ID of the section.
 * @param {Array<Object>} tasks - The list of tasks to render.
 * @param {string} emptyMessage - The message to show when no tasks are present.
 */
function renderSection(sectionId, tasks, emptyMessage) {
    let section = document.getElementById(sectionId);
    section.innerHTML = "";
    if (tasks.length === 0) {
        section.innerHTML = `<span class="empty-message">${emptyMessage}</span>`;
    } else {
        for (let task of tasks) {
            section.innerHTML += generateTodoHTML(task);
        }
    }
}

/**
 * Filters and returns tasks by their status.
 *
 * @param {string} status - The status to filter tasks by.
 * @returns {Array<Object>} An array of tasks with the given status.
 */
function getTasksByStatus(status) {
    return arrayTasks.filter(t =>
        t && typeof t.status === 'string'
            ? t.status === status
            : status === 'todo'
    );
}

/**
 * Adds click event listeners to all task sections for opening task cards.
 */
function addCardClickListeners() {
    ['todo', 'progress', 'feedback', 'done'].forEach(sectionId => {
        let section = document.getElementById(sectionId);
        if (!section) return;
        section.onclick = null;
        section.addEventListener('click', function (event) {
            let card = event.target.closest('.card');
            if (card && card.id) openBoardCard(card.id);
        });
    });
}

/**
 * Renders tasks into their corresponding board sections based on status.
 * @param {Array<Object>} tasks - The tasks to render.
 */
function renderTasksToBoard(tasks) {
    tasks.forEach(task => {
        if (["todo", "progress", "feedback", "done"].includes(task.status)) {
            document.getElementById(task.status).innerHTML += generateTodoHTML(task);
        }
    });
}

/**
 * Clears all board sections (todo, progress, feedback, done).
 */
function clearBoardSections() {
    ["todo", "progress", "feedback", "done"].forEach(section => {
        document.getElementById(section).innerHTML = "";
    });
}

/**
 * Marks a task element as currently being dragged.
 *
 * @param {string} firebaseKey - The key of the dragged task.
 */
function startDragging(firebaseKey) {
    currentDraggedElement = firebaseKey;
    let taskElement = document.getElementById(firebaseKey);
    taskElement.classList.add("dragging");
}

/**
 * Removes the dragging CSS class from a task element.
 *
 * @param {string} firebaseKey - The key of the task.
 */
function stopDragging(firebaseKey) {
    let taskElement = document.getElementById(firebaseKey);
    if (taskElement) {
        taskElement.classList.remove("dragging");
    }
}

/**
 * Handles the drop target behavior and appends the dragged element if valid.
 *
 * @param {DragEvent} ev - The drop event.
 */
function allowDrop(ev) {
    ev.preventDefault();
    let target = ev.currentTarget;
    let draggedEl = document.getElementById(currentDraggedElement);
    if (draggedEl && !target.contains(draggedEl)) {
        target.appendChild(draggedEl);
    }
}

/**
 * Adds a highlight class to a task column.
 *
 * @param {string} status - The status column ID.
 */
function highlight(status) {
    document.getElementById(status).classList.add("drag-area-highlight");
}

/**
 * Drag & Drop: Remove highlight.
 */
function removeHighlight(status) {
    document.getElementById(status).classList.remove("drag-area-highlight");
}

/**
 * Moves the currently dragged task to the specified status and updates it in Firebase.
 *
 * @param {string} status - The new status to assign to the dragged task (e.g., "todo", "progress").
 * @returns {Promise<void>} A promise that resolves after the task status has been updated.
 */
async function moveTo(status) {
    let idx = arrayTasks.findIndex(t => t.firebaseKey === currentDraggedElement);
    if (idx === -1) return alert("Aufgabe wurde nicht gefunden!");
    let [task] = arrayTasks.splice(idx, 1);
    task.status = status;
    arrayTasks.push(task);
    await updateTaskStatusInFirebase(task, status);
    updateHTML();
}

/**
 * Executes a search over all tasks based on title and description input.
 */
function searchTask() {
    let inputValue = getSearchInputValue();
    let foundTasks = filterTasksBySearch(arrayTasks, inputValue);
    clearBoardSections();
    if (foundTasks.length > 0) {
        renderTasksToBoard(foundTasks);
    } else {
        ["todo", "progress", "feedback", "done"].forEach(section => {
            document.getElementById(section).innerHTML = `
        <span class="empty-message no-results">No results found</span>
      `;
        });
    }
}

/**
 * Gets the normalized, lowercase value from the search input field.
 * @returns {string} The trimmed, lowercase search value.
 */
function getSearchInputValue() {
    let inputRef = document.getElementById("input_find_task");
    return inputRef.value.trim().toLowerCase();
}

/**
 * Filters tasks by search value, checking title and description.
 * @param {Array<Object>} tasks - The list of tasks to filter.
 * @param {string} searchValue - The lowercase search string.
 * @returns {Array<Object>} The filtered tasks.
 */
function filterTasksBySearch(tasks, searchValue) {
    return tasks.filter(task => {
        let titleMatch = task.title && task.title.toLowerCase().includes(searchValue);
        let descriptionMatch = task.description && task.description.toLowerCase().includes(searchValue);
        return titleMatch || descriptionMatch;
    });
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
