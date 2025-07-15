/**
 * Replaces the static priority display with editable buttons for setting task priority.
 */
function setupPriorityEdit() {
    let priorityHeadline = document.querySelector('.priority-headline');
    if (priorityHeadline && !document.getElementById('priority-edit-buttons')) {
        let taskKey = document.getElementById('board_overlay_card').dataset.firebaseKey;
        let task = arrayTasks.find(t => t.firebaseKey === taskKey);
        let wrapper = document.createElement('div');
        wrapper.id = 'priority-edit-buttons';
        wrapper.innerHTML = getPriorityButtonsHTML(task.priority.toLowerCase());
        let labelP = document.createElement('span');
        labelP.textContent = 'Priority';
        labelP.id = 'overlay_card_priority_label';
        labelP.className = 'overlay-card-label';
        priorityHeadline.parentNode.insertBefore(labelP, priorityHeadline);
        priorityHeadline.innerHTML = '';
        priorityHeadline.appendChild(wrapper);
    }
}

/**
 * Updates the selected priority in the overlay and highlights the corresponding button.
 *
 * @param {string} priority - The selected priority level.
 * @param {HTMLElement} btn - The button element representing the selected priority.
 */
function selectOverlayPriority(priority, btn) {
    document.querySelectorAll('.priority-edit-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    document.getElementById('priority-edit-buttons').dataset.selectedPriority = priority;
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