let arrayTasks = [];
let addTaskDefaultStatus = "todo";
let firebaseKey = localStorage.getItem("firebaseKey");
let lastCreatedTaskKey = null;
let currentDraggedElement;
let selectedPriority = "medium";
let subtasks = [];
let contacts = [];
let selectedContacts = [];
let selectedCategory = "";


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
 * Gets the initial assigned contacts for a given task key.
 * @param {string} taskKey - The Firebase key of the task.
 * @returns {Array<string>} Array of assigned contact names.
 */
function getInitialAssignedContacts(taskKey) {
    let task = arrayTasks.find(t => t.firebaseKey === taskKey);
    return [...(task?.assignedTo || [])];
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