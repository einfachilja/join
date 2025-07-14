/**
 * Sets up the editable assigned-to dropdown in the overlay card.
 */
function setupAssignedDropdown() {
    let assignedListContainer = document.querySelector('.assigned-list');
    if (!assignedListContainer || document.getElementById('assigned-dropdown')) return;
    let { dropdown, list, toggle, placeholder, arrow } = createAssignedDropdownElements(assignedListContainer);
    setupAssignedDropdownEvents(toggle, list);
    const { contacts, selectedContacts } = initAssignedDropdownState();
    renderAndSetupAssignedDropdown(contacts, selectedContacts, list, assignedListContainer);
}

/**
 * Initializes the state for the overlay assigned-to dropdown.
 * @returns {{contacts: Array, selectedContacts: Object}}
 */
function initAssignedDropdownState() {
    let contacts = fetchAssignedContacts();
    let taskKey = document.getElementById('board_overlay_card').dataset.firebaseKey;
    let selectedContacts = { value: getInitialAssignedContacts(taskKey) };
    return { contacts, selectedContacts };
}

/**
 * Fetches assigned contacts for the current user from localStorage.
 * @returns {Array<Object>} The array of contact objects.
 */
function fetchAssignedContacts() {
    let userKey = localStorage.getItem('firebaseKey');
    let usersData = JSON.parse(localStorage.getItem('firebaseUsers')) || {};
    return Object.values(usersData[userKey]?.contacts || {});
}

/**
 * Gets the initial assigned contacts for a given task key.
 * @param {string} taskKey - The Firebase key of the task.
 * @returns {Array<string>} Array of assigned contact names.
 */
function getInitialAssignedContacts(taskKey) {
    let task = arrayTasks.find(t => t.firebaseKey === taskKey);
    return [...(task?.assignedTo || [])];
}

/**
 * Creates and appends all necessary elements for the assigned-to dropdown.
 * @param {HTMLElement} assignedListContainer - The container for the assigned-to list.
 * @returns {Object} Elements of the dropdown: dropdown, list, toggle, placeholder, arrow.
 */
function createAssignedDropdownElements(assignedListContainer) {
    assignedListContainer.innerHTML = '';
    let label = createLabel();
    let dropdown = createDropdown();
    let list = createList();
    let toggle = createToggle();
    let placeholder = createPlaceholder();
    let arrow = createArrow();
    toggle.appendChild(placeholder);
    toggle.appendChild(arrow);
    dropdown.appendChild(toggle);
    dropdown.appendChild(list);
    assignedListContainer.appendChild(label);
    assignedListContainer.appendChild(dropdown);
    return { dropdown, list, toggle, placeholder, arrow };
}

/**
 * Sets up event handlers for the assigned-to dropdown.
 * @param {HTMLElement} toggle - The dropdown toggle element.
 * @param {HTMLElement} list - The dropdown list element.
 */
function setupAssignedDropdownEvents(toggle, list) {
    addToggleClickHandler(toggle, list);
    addGlobalDropdownCloseHandler();
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
 * Sets up events and renders the assigned dropdown list and circles.
 * @param {Array} contacts
 * @param {Object} selectedContacts
 * @param {HTMLElement} list
 * @param {HTMLElement} assignedListContainer
 */
function renderAndSetupAssignedDropdown(contacts, selectedContacts, list, assignedListContainer) {
    function onToggleContact(name) {
        handleAssignedContactToggle(
            name, contacts, list, assignedListContainer,
            selectedContacts, renderAssignedSelectedCircles, renderAssignedDropdownList
        );
    }
    renderAssignedDropdownList(
        contacts, selectedContacts.value, list, onToggleContact, renderAssignedSelectedCircles
    );
    renderAssignedSelectedCircles(selectedContacts.value, contacts, assignedListContainer);
    window.getAssignedOverlaySelection = () => selectedContacts.value;
}

/**
 * Toggles the selection of a contact in the assigned-to list.
 * @param {string} name - The name of the contact.
 * @param {Array<string>} selectedContacts - The current selected contacts.
 * @returns {Array<string>} The updated array of selected contacts.
 */
function toggleContactSelection(name, selectedContacts) {
    if (selectedContacts.includes(name)) {
        return selectedContacts.filter(n => n !== name);
    } else {
        return [...selectedContacts, name];
    }
}

/**
 * Renders the assigned dropdown list with contacts and selection state.
 * @param {Array<Object>} contacts - All contact objects.
 * @param {Array<string>} selectedContacts - Currently selected contact names.
 * @param {HTMLElement} list - The dropdown list element.
 * @param {Function} toggleContact - Function to toggle contact selection.
 * @param {Function} renderAssignedSelectedCircles - Function to render selected circles.
 */
function renderAssignedDropdownList(contacts, selectedContacts, list, toggleContact, renderAssignedSelectedCircles) {
    list.innerHTML = '';
    contacts.forEach(contact => {
        let item = createAssignedItem(contact, selectedContacts, toggleContact);
        list.appendChild(item);
    });
    renderAssignedSelectedCircles(selectedContacts, contacts, list.parentElement.parentElement);
}

/**
 * Renders the selected assigned contact circles below the dropdown.
 * @param {Array<string>} selectedContacts - Array of selected contact names.
 * @param {Array<Object>} contacts - All contact objects.
 * @param {HTMLElement} assignedListContainer - The container for the assigned circles.
 */
function renderAssignedSelectedCircles(selectedContacts, contacts, assignedListContainer) {
    let wrapper = getOrCreateCirclesWrapper(assignedListContainer);
    positionCirclesWrapper(wrapper, assignedListContainer);
    updateCirclesVisibility(wrapper, selectedContacts);
    updateCirclesContent(wrapper, selectedContacts, contacts);
}

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
 * Toggles visibility of the category dropdown.
 * @param {Event} event - The click event.
 */
function toggleCategoryDropdown(event) {
    event.stopPropagation();
    let toggle = document.getElementById("category-toggle");
    let content = document.getElementById("category-content");
    toggle.classList.toggle("open");
    content.classList.toggle("visible");
    if (content.innerHTML.trim() === "") renderCategoryOptions();
}

/**
 * Renders all available category options in the category dropdown.
 */
function renderCategoryOptions() {
    let content = document.getElementById("category-content");
    clearCategoryContent(content);
    let categories = getCategoryList();
    categories.forEach(category => {
        let item = createCategoryDropdownItem(category, content);
        content.appendChild(item);
    });
}

/**
 * Marks a category as selected and updates the UI.
 * @param {string} category - The selected category.
 */
function selectCategory(category) {
    selectedCategory = category;
    let placeholder = document.querySelector("#category-toggle span");
    if (placeholder) placeholder.textContent = category;
}

/**
 * Opens the move task dropdown menu for a board card, allowing status change.
 * @param {string} taskKey - The Firebase key of the task to move.
 * @param {Event} event - The event that triggered the menu.
 */
function openMoveTaskMenu(taskKey, event) {
    event.stopPropagation();
    closeMoveTaskMenu();

    let btn = event.currentTarget;
    let card = btn.closest('.card');
    if (!card) return;

    let dropdown = createMoveTaskDropdownMenu(taskKey);
    positionMoveTaskDropdown(dropdown, btn, card);

    document.body.appendChild(dropdown);
    window._moveTaskDropdown = dropdown;

    addMoveTaskDropdownCleanup(dropdown);
}

/**
 * Creates the move task dropdown menu element with available status options.
 * @param {string} taskKey - The Firebase key of the task.
 * @returns {HTMLElement} The dropdown menu element.
 */
function createMoveTaskDropdownMenu(taskKey) {
    let dropdown = document.createElement('div');
    dropdown.className = 'move-task-dropdown-menu';
    let statuses = [
        { key: 'todo', label: 'To do' },
        { key: 'progress', label: 'In progress' },
        { key: 'feedback', label: 'Await feedback' },
        { key: 'done', label: 'Done' }
    ];
    let currentTask = arrayTasks.find(t => t.firebaseKey === taskKey);
    let currentStatus = currentTask ? currentTask.status : null;

    statuses.forEach(s => {
        if (s.key === currentStatus) return;
        let option = document.createElement('div');
        option.className = 'move-task-dropdown-option';
        option.textContent = s.label;
        option.onclick = function (e) {
            e.stopPropagation();
            handleMoveTaskOptionClick(taskKey, s.key);
        };
        dropdown.appendChild(option);
    });

    return dropdown;
}

/**
 * Positions the move task dropdown menu relative to the button and card.
 * @param {HTMLElement} dropdown - The dropdown menu element.
 * @param {HTMLElement} btn - The button triggering the menu.
 * @param {HTMLElement} card - The card element.
 */
function positionMoveTaskDropdown(dropdown, btn, card) {
    let btnRect = btn.getBoundingClientRect();
    let left = btnRect.left + window.scrollX;
    let top = btnRect.bottom + window.scrollY + 4;
    if (left + 160 > window.innerWidth) left = window.innerWidth - 170;
    if (top + 180 > window.innerHeight + window.scrollY)
        top = btnRect.top + window.scrollY - 180;
    dropdown.style.left = left + 'px';
    dropdown.style.top = top + 'px';
}

/**
 * Adds cleanup handlers for the move task dropdown (outside click, scroll).
 * @param {HTMLElement} dropdown - The dropdown menu element.
 */
function addMoveTaskDropdownCleanup(dropdown) {
    function handleOutside(e) {
        if (dropdown.contains(e.target)) return;
        closeMoveTaskMenu();
    }
    function handleScroll() {
        closeMoveTaskMenu();
    }
    document.addEventListener('mousedown', handleOutside, { capture: true });
    document.addEventListener('touchstart', handleOutside, { capture: true });
    window.addEventListener('scroll', handleScroll, { passive: true });
    window._moveTaskDropdownCleanup = function () {
        document.removeEventListener('mousedown', handleOutside, { capture: true });
        document.removeEventListener('touchstart', handleOutside, { capture: true });
        window.removeEventListener('scroll', handleScroll, { passive: true });
    };
}

/**
 * Closes and removes the move task dropdown menu and its event listeners.
 */
function closeMoveTaskMenu() {
    if (window._moveTaskDropdown) {
        window._moveTaskDropdown.remove();
        window._moveTaskDropdown = null;
    }
    if (typeof window._moveTaskDropdownCleanup === 'function') {
        window._moveTaskDropdownCleanup();
        window._moveTaskDropdownCleanup = null;
    }
}

/**
 * Closes the move task dropdown menu when the window is resized.
 */
window.addEventListener('resize', closeMoveTaskMenu);