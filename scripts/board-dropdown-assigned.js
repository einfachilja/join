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
 * Positions the assigned circles wrapper after the dropdown.
 * @param {HTMLElement} wrapper
 * @param {HTMLElement} assignedListContainer
 */
function positionCirclesWrapper(wrapper, assignedListContainer) {
    let dropdown = document.getElementById('assigned-dropdown');
    if (dropdown && wrapper.previousSibling !== dropdown) {
        assignedListContainer.insertBefore(wrapper, dropdown.nextSibling);
    }
}

/**
 * Updates the visibility of the assigned circles wrapper.
 * @param {HTMLElement} wrapper
 * @param {Array<string>} selectedContacts
 */
function updateCirclesVisibility(wrapper, selectedContacts) {
    wrapper.style.display = selectedContacts.length === 0 ? "none" : "flex";
}

/**
 * Updates the content of the assigned circles wrapper with selected contacts.
 * Renders up to four visible contact circles, and a "+N" circle if more are hidden.
 * @param {HTMLElement} wrapper - The wrapper element to update.
 * @param {Array<string>} selectedContacts - Array of selected contact names.
 * @param {Array<Object>} contacts - All available contact objects.
 */
function updateCirclesContent(wrapper, selectedContacts, contacts) {
    wrapper.innerHTML = '';
    let validContacts = getValidContacts(selectedContacts, contacts);
    let visibleContacts = validContacts.slice(0, 4);
    let hiddenCount = validContacts.length - visibleContacts.length;
    renderVisibleContacts(wrapper, visibleContacts);
    renderHiddenCount(wrapper, hiddenCount);
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