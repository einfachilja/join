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
 * Adds the 'open' animation class to the overlay card after a short delay.
 */
function animateOverlayCard() {
    let cardRef = document.querySelector('.board-overlay-card');
    if (cardRef) setTimeout(() => cardRef.classList.add('open'), 10);
}

/**
 * Locks HTML scrolling (overflow hidden).
 */
function lockHtmlScroll() {
    document.getElementById("html").style.overflow = "hidden";
}

/**
 * Shows the board overlay and resets its scroll position.
 * @param {HTMLElement} overlay - The overlay element.
 */
function showBoardOverlay(overlay) {
    overlay.classList.remove("d-none");
    overlay.scrollTop = 0;
}

/**
 * Hides the board overlay from view.
 */
function hideBoardOverlay() {
    document.getElementById("board_overlay").classList.add("d-none");
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
 * Removes the opening animation class from the overlay card.
 *
 * @param {HTMLElement} card - The overlay card element.
 */
function removeOverlayAnimation(card) {
    card.classList.remove('open');
}

/**
 * Closes the overlay after a delay and updates the board UI.
 *
 * @param {number} ms - The delay in milliseconds before closing.
 */
function closeOverlayWithDelay(ms) {
    setTimeout(() => {
        hideBoardOverlay();
        resetHtmlOverflow();
        removeOverlayLabels();
        updateHTML();
    }, ms);
}

/**
 * Immediately closes the overlay without delay and updates the board UI.
 */
function closeOverlayImmediately() {
    hideBoardOverlay();
    resetHtmlOverflow();
    removeOverlayLabels();
    updateHTML();
}

/**
 * Resets the document overflow style to default.
 */
function resetHtmlOverflow() {
    document.getElementById("html").style.overflow = "";
}

/**
 * Removes title and description labels from the overlay card.
 */
function removeOverlayLabels() {
    let titleLabel = document.getElementById("overlay_card_title_label");
    if (titleLabel) titleLabel.remove();
    let descLabel = document.getElementById("overlay_card_description_label");
    if (descLabel) descLabel.remove();
}

/**
 * Prevents event propagation for click events.
 * @param {Event} event - The click event to stop propagation for.
 */
function onclickProtection(event) {
    event.stopPropagation();
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