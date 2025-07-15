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

/**
 * Creates a colored circle for an assigned contact.
 * @param {string} initials - The initials of the contact.
 * @param {string} color - The color for the circle.
 * @returns {HTMLElement} The circle element.
 */
function createAssignedCircle(initials, color) {
    let circle = document.createElement('span');
    circle.className = 'assigned-circle';
    circle.style.backgroundColor = color || '#ccc';
    circle.textContent = initials;
    return circle;
}

/**
 * Creates a checkbox for an assigned contact.
 * @param {boolean} isChecked - Whether the checkbox is checked.
 * @param {Function} toggleContact - Function to toggle contact selection.
 * @param {string} name - The contact name.
 * @returns {HTMLElement} The checkbox input element.
 */
function createAssignedCheckbox(isChecked, toggleContact, name) {
    let checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'assigned-checkbox';
    checkbox.checked = isChecked;
    checkbox.onclick = (e) => {
        e.stopPropagation();
        toggleContact(name);
    };
    return checkbox;
}

/**
 * Creates a dropdown item for an assigned contact.
 * @param {Object} contact - The contact object.
 * @param {Array<string>} selectedContacts - Currently selected contact names.
 * @param {Function} toggleContact - Function to toggle contact selection.
 * @returns {HTMLElement} The dropdown item element.
 */
function createAssignedItem(contact, selectedContacts, toggleContact) {
    let initials = getInitials(contact.name);
    let isChecked = selectedContacts.includes(contact.name);
    let item = document.createElement('div');
    item.className = 'assigned-item' + (isChecked ? ' selected' : '');
    item.onclick = () => toggleContact(contact.name);
    let circle = createAssignedCircle(initials, contact.color);
    let name = document.createElement('span');
    name.className = 'assigned-name';
    name.textContent = contact.name;
    let checkbox = createAssignedCheckbox(isChecked, toggleContact, contact.name);
    item.appendChild(circle);
    item.appendChild(name);
    item.appendChild(checkbox);
    return item;
}

/**
 * Creates and returns the assigned-to dropdown container element.
 * @returns {HTMLElement} The dropdown element.
 */
function createDropdown() {
    let dropdown = document.createElement('div');
    dropdown.id = 'assigned-dropdown';
    dropdown.className = 'assigned-dropdown';
    return dropdown;
}

/**
 * Creates and returns the dropdown list element for assigned contacts.
 * @returns {HTMLElement} The list element.
 */
function createList() {
    let list = document.createElement('div');
    list.id = 'assigned-dropdown-list';
    list.className = 'assigned-dropdown-list';
    list.classList.remove('open');
    return list;
}

/**
 * Creates and returns the toggle element for the assigned-to dropdown.
 * @returns {HTMLElement} The toggle element.
 */
function createToggle() {
    let toggle = document.createElement('div');
    toggle.className = 'assigned-dropdown-toggle';
    return toggle;
}

/**
 * Creates and returns the placeholder element for the assigned-to dropdown.
 * @returns {HTMLElement} The placeholder element.
 */
function createPlaceholder() {
    let placeholder = document.createElement('span');
    placeholder.id = 'assigned-placeholder';
    placeholder.textContent = 'Select contacts to assign';
    return placeholder;
}

/**
 * Creates and returns the arrow element for the assigned-to dropdown.
 * @returns {HTMLElement} The arrow element.
 */
function createArrow() {
    let arrow = document.createElement('span');
    arrow.className = 'dropdown-arrow';
    return arrow;
}

/**
 * Adds a click handler to the toggle to open/close the dropdown list.
 * @param {HTMLElement} toggle - The dropdown toggle element.
 * @param {HTMLElement} list - The dropdown list element.
 */
function addToggleClickHandler(toggle, list) {
    if (!toggle._dropdownClickHandlerAdded) {
        toggle.addEventListener('click', function (event) {
            event.stopPropagation();
            let isOpen = list.classList.contains('open');
            closeAllAssignedDropdowns();
            if (!isOpen) {
                list.classList.add('open');
            }
        });
        toggle._dropdownClickHandlerAdded = true;
    }
}

/**
 * Adds a global click handler to close dropdowns when clicking outside.
 */
function addGlobalDropdownCloseHandler() {
    if (!window._assignedDropdownClickHandler) {
        document.addEventListener('click', function (event) {
            document.querySelectorAll('.assigned-dropdown').forEach(dropdown => {
                let list = dropdown.querySelector('.assigned-dropdown-list');
                if (list && list.classList.contains('open') && !dropdown.contains(event.target)) {
                    list.classList.remove('open');
                }
            });
        });
        window._assignedDropdownClickHandler = true;
    }
}

/**
 * Closes all open assigned-to dropdown lists.
 */
function closeAllAssignedDropdowns() {
    document.querySelectorAll('.assigned-dropdown-list.open').forEach(el => {
        el.classList.remove('open');
    });
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