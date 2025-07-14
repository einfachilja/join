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
 * Handles toggling a contact in the assigned-to dropdown and rerendering.
 * @param {string} name - The contact name.
 * @param {Array<Object>} contacts - All contact objects.
 * @param {HTMLElement} list - The dropdown list element.
 * @param {HTMLElement} assignedListContainer - The container for assigned list.
 * @param {Object} selectedContacts - Object with a value property for selected contacts.
 * @param {Function} renderAssignedSelectedCircles - Function to render selected circles.
 * @param {Function} renderAssignedDropdownList - Function to render dropdown list.
 */
function handleAssignedContactToggle(name, contacts, list, assignedListContainer, selectedContacts, renderAssignedSelectedCircles, renderAssignedDropdownList) {
    selectedContacts.value = toggleContactSelection(name, selectedContacts.value);
    renderAssignedDropdownList(contacts, selectedContacts.value, list, (n) =>
        handleAssignedContactToggle(n, contacts, list, assignedListContainer, selectedContacts, renderAssignedSelectedCircles, renderAssignedDropdownList), renderAssignedSelectedCircles);
    renderAssignedSelectedCircles(selectedContacts.value, contacts, assignedListContainer);
}

/**
 * Handles click on the assigned-to input, toggling the dropdown.
 * @param {Event} e - The click event.
 */
function handleAssignedToClick(e) {
    e.stopPropagation();
    toggleAssignDropdown(e);
}

/**
 * Handles input in the assigned-to search box and renders filtered options.
 * @param {Event} e - The input event.
 */
function handleAssignedToInput(e) {
    let value = e.target.value.trim().toLowerCase();
    renderAssignOptions(value);
}

/**
 * Toggles visibility of the assigned contacts dropdown.
 * @param {Event} event - The click event.
 */
function toggleAssignDropdown(event) {
    event.stopPropagation();
    let tog = document.getElementById("dropdown-toggle");
    let dd = document.getElementById("dropdown-content");
    if (!tog || !dd) return;
    tog.classList.toggle("open");
    dd.classList.toggle("visible");
    if (dd.innerHTML === "") renderAssignOptions();
}

/**
 * Renders contact dropdown options, filtered by the provided string.
 * @param {string} [filter=""] - The filter string for searching contacts.
 */
function renderAssignOptions(filter = "") {
    let dd = document.getElementById("dropdown-content");
    clearAssignDropdownContent(dd);
    let filteredContacts = contacts.filter((c) =>
        c.name.toLowerCase().includes(filter)
    );
    filteredContacts.forEach((c) => {
        let item = createContactDropdownItem(c, filter);
        dd.appendChild(item);
    });
}

/**
 * Clears all items from the assign dropdown except the input box.
 * @param {HTMLElement} dd - The dropdown element.
 */
function clearAssignDropdownContent(dd) {
    let nodes = Array.from(dd.childNodes).filter((n) => n.tagName !== "INPUT");
    nodes.forEach((n) => n.remove());
}

/**
 * Creates a dropdown item for a contact, including icon, name, and checkbox.
 * @param {Object} contact - The contact object.
 * @param {string} filter - The current filter string.
 * @returns {HTMLElement}
 */
function createContactDropdownItem(contact, filter) {
    let item = document.createElement("div");
    item.className = "contact-item";
    if (isContactSelected(contact)) {
        item.classList.add("contact-selected");
    }
    item.appendChild(createProfileIcon(contact));
    item.appendChild(createContactName(contact));
    item.appendChild(createContactCheckbox(contact));
    setupContactCheckbox(item, contact, filter);
    setupContactItemClick(item);
    return item;
}

/**
 * Returns true if the contact is currently selected for assignment.
 * @param {Object} contact - The contact object.
 * @returns {boolean}
 */
function isContactSelected(contact) {
    return selectedContacts.some((s) => s.name === contact.name);
}

/**
 * Creates a colored profile icon span for the contact.
 * @param {Object} contact - The contact object.
 * @returns {HTMLElement}
 */
function createProfileIcon(contact) {
    let span = document.createElement("span");
    span.className = "profile-icon";
    span.style.background = contact.color;
    span.textContent = getContactInitials(contact.name);
    return span;
}

/**
 * Creates a span element for the contact’s name.
 * @param {Object} contact - The contact object.
 * @returns {HTMLElement}
 */
function createContactName(contact) {
    let span = document.createElement("span");
    span.textContent = contact.name;
    return span;
}

/**
 * Creates a checkbox input for a contact.
 * @param {Object} contact - The contact object.
 * @returns {HTMLInputElement}
 */
function createContactCheckbox(contact) {
    let checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = isContactSelected(contact);
    return checkbox;
}

/**
 * Sets up the checkbox event for a contact dropdown item.
 * @param {HTMLElement} item - The item element.
 * @param {Object} contact - The contact object.
 * @param {string} filter - The current filter string.
 */
function setupContactCheckbox(item, contact, filter) {
    let checkbox = item.querySelector("input[type='checkbox']");
    checkbox.addEventListener("click", (event) => {
        event.stopPropagation();
        let idx = selectedContacts.findIndex((s) => s.name === contact.name);
        if (checkbox.checked && idx === -1) {
            selectedContacts.push(contact);
        } else if (!checkbox.checked && idx >= 0) {
            selectedContacts.splice(idx, 1);
            if (selectedContacts.length === 0) closeDropdown();
        }
        updateSelectedContactsUI();
        renderAssignOptions(filter);
        updateSubmitState();
    });
}

/**
 * Adds click behavior for selecting/deselecting a contact item.
 * @param {HTMLElement} item - The dropdown item.
 */
function setupContactItemClick(item) {
    let checkbox = item.querySelector("input[type='checkbox']");
    item.addEventListener("click", (event) => {
        if (event.target.tagName.toLowerCase() === "input") return;
        event.stopPropagation();
        checkbox.checked = !checkbox.checked;
        let clickEvent = new Event("click", { bubbles: true });
        checkbox.dispatchEvent(clickEvent);
    });
}

/**
 * Updates the UI display of selected contacts (profile icons).
 */
function updateSelectedContactsUI() {
    let box = document.getElementById("selected-contacts");
    if (!box) return;
    box.innerHTML = "";
    selectedContacts.forEach((c) => {
        let el = document.createElement("div");
        el.className = "profile-icon";
        el.style.background = c.color;
        el.textContent = getContactInitials(c.name);
        box.appendChild(el);
    });
}

/**
 * Closes the assigned contacts dropdown.
 */
function closeDropdown() {
    document.getElementById("dropdown-content")?.classList.remove("visible");
    document.getElementById("dropdown-toggle")?.classList.remove("open");
}