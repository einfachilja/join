/**
 * Opens a task card in an overlay based on its Firebase key.
 *
 * @param {string} firebaseKey - The Firebase key of the task.
 * @param {Object} [options={}] - Additional options for rendering the card.
 */
/**
 * Opens a task card in an overlay based on its Firebase key.
 *
 * @param {string} firebaseKey - The Firebase key of the task.
 * @param {Object} [options={}] - Additional options for rendering the card.
 */
function openBoardCard(firebaseKey, options = {}) {
    const overlayElement = document.getElementById("board_overlay");
    const task = findTaskByKey(firebaseKey);
    const categoryClass = getOverlayCategoryClass(task);
    showOverlay(overlayElement, categoryClass, task);
    handleOverlayAnimation(options);
    updateHTML();
}

/**
 * Shows the overlay element with the card template.
 * @param {HTMLElement} overlayElement
 * @param {string} categoryClass
 * @param {Object} task
 */
function showOverlay(overlayElement, categoryClass, task) {
    if (!overlayElement || !task) return;
    overlayElement.classList.remove("d-none");
    document.getElementById("html").style.overflow = "hidden";
    overlayElement.innerHTML = getOpenBoardCardTemplate(categoryClass, task);
}

/**
 * Handles the opening animation for the overlay card.
 * @param {Object} options
 */
function handleOverlayAnimation(options = {}) {
    const card = document.querySelector('.board-overlay-card');
    if (!card) return;
    if (options.noAnimation) {
        card.classList.add('open');
    } else {
        setTimeout(() => {
            card.classList.add('open');
        }, 10);
    }
}

/**
 * Renders the task details in an overlay card based on the given task object.
 *
 * @param {Object} task - The task object to render.
 */
/**
 * Renders the board overlay with the given task.
 * @param {Object} task - The task object to render.
 */
function renderBoardOverlay(task) {
    let boardOverlayRef = document.getElementById("board_overlay");
    if (!boardOverlayRef || !task) return;
    let categoryClass = getOverlayCategoryClass(task);
    boardOverlayRef.innerHTML = getOpenBoardCardTemplate(categoryClass, task);
    animateOverlayCard();
    lockHtmlScroll();
    showBoardOverlay(boardOverlayRef);
}

/**
 * Closes the currently open board card, either with or without animation.
 */
function closeBoardCard() {
    if (window._assignedDropdownCleanup) window._assignedDropdownCleanup();
    let card = document.querySelector('.board-overlay-card');
    if (card) {
        removeOverlayAnimation(card);
        closeOverlayWithDelay(400);
    } else {
        closeOverlayImmediately();
    }
}

/**
 * Switches the overlay card into edit mode by setting up editable fields and inputs.
 */
function editTask() {
    editTaskUI();
    addTitleLabel();
    addDescriptionLabel();
    addDueDateLabelAndInput();
    setupPriorityEdit();
    setupAssignedDropdown();
    setupSubtasksEdit();
}

/**
 * Configures the UI for editing a task (hiding buttons, enabling contentEditable).
 */
function editTaskUI() {
    document.getElementById("ok_btn").classList.remove("d-none");
    document.getElementById("delete_btn").classList.add("d-none");
    document.getElementById("edit_btn").classList.add("d-none");
    document.getElementById("seperator").classList.add("d-none");
    document.getElementById("overlay_card_category").classList.add("d-none");
    document.getElementById("board_overlay_card").classList.add("board-overlay-card-edit");
    document.getElementById("overlay_card_title").contentEditable = "true";
    document.getElementById("overlay_card_description").contentEditable = "true";
}

/**
 * Adds a label above the title input in the overlay card if not already present.
 */
function addTitleLabel() {
    let titleElement = document.getElementById("overlay_card_title");
    if (!document.getElementById("overlay_card_title_label")) {
        let titleLabel = document.createElement("span");
        titleLabel.textContent = "Title";
        titleLabel.id = "overlay_card_title_label";
        titleLabel.className = "overlay-card-label";
        titleElement.parentNode.insertBefore(titleLabel, titleElement);
    }
}

/**
 * Adds a label above the description input in the overlay card if not already present.
 */
function addDescriptionLabel() {
    let descElement = document.getElementById("overlay_card_description");
    if (!document.getElementById("overlay_card_description_label")) {
        let descLabel = document.createElement("span");
        descLabel.textContent = "Description";
        descLabel.id = "overlay_card_description_label";
        descLabel.className = "overlay-card-label";
        descElement.parentNode.insertBefore(descLabel, descElement);
    }
}

/**
 * Adds a due date label and input field to the overlay card for editing the due date.
 */
function addDueDateLabelAndInput() {
    let dueDateSpan = document.getElementById("due_date");
    if (dueDateSpan && !document.getElementById("due_date_input")) {
        let currentDueDate = extractDueDateText(dueDateSpan);
        let formattedDate = formatDateForInput(currentDueDate);
        addDueDateLabel(dueDateSpan);
        addDueDateInput(dueDateSpan, formattedDate);
    }
}

/**
 * Extracts the due date text from a span element.
 * @param {HTMLElement} dueDateSpan - The span containing the due date.
 * @returns {string} The extracted due date string.
 */
function extractDueDateText(dueDateSpan) {
    let match = dueDateSpan.innerText.match(/(\d{2}\/\d{2}\/\d{4}|\d{4}-\d{2}-\d{2})/);
    return match ? match[0] : "";
}

/**
 * Formats a date string for use in a date input field.
 * @param {string} dateStr - The date string to format.
 * @returns {string} The formatted date string in yyyy-mm-dd.
 */
function formatDateForInput(dateStr) {
    if (dateStr.match(/\d{2}\/\d{2}\/\d{4}/)) {
        let [d, m, y] = dateStr.split("/");
        return `${y}-${m}-${d}`;
    }
    return dateStr;
}

/**
 * Adds a label above the due date span if not already present.
 * @param {HTMLElement} dueDateSpan - The due date span element.
 */
function addDueDateLabel(dueDateSpan) {
    if (!document.getElementById("overlay_card_due_date_label")) {
        let dueLabel = document.createElement("span");
        dueLabel.textContent = "Due Date";
        dueLabel.id = "overlay_card_due_date_label";
        dueLabel.className = "overlay-card-label";
        dueDateSpan.parentNode.insertBefore(dueLabel, dueDateSpan);
    }
}

/**
 * Adds a date input field to the due date span for editing.
 * @param {HTMLElement} dueDateSpan - The due date span element.
 * @param {string} formattedDate - The date value for the input field.
 */
function addDueDateInput(dueDateSpan, formattedDate) {
    let input = document.createElement("input");
    input.type = "date";
    input.id = "due_date_input";
    input.className = "overlay-card-date-input";
    input.value = formattedDate;
    let today = new Date().toISOString().split("T")[0];
    input.min = today;
    dueDateSpan.innerHTML = "";
    dueDateSpan.appendChild(input);
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