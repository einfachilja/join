/**
 * Finds a contact by name from the local contacts array.
 *
 * @param {string} name - The name of the contact.
 * @returns {Object|null} The contact object or null if not found.
 */
function getContactByName(name) {
    return contacts.find(c => c.name === name) || null;
}

/**
 * Returns the initials of a given name string.
 *
 * @param {string} name - The full name of a contact.
 * @returns {string} The uppercase initials extracted from the name.
 */
function getInitials(name) {
    if (!name) return "";
    let nameParts = name.trim().split(" ");
    if (nameParts.length === 1) {
        return nameParts[0][0].toUpperCase();
    } else {
        return (
            nameParts[0][0].toUpperCase() +
            nameParts[nameParts.length - 1][0].toUpperCase()
        );
    }
}

/**
 * Filters out invalid or non-existent contact names.
 * @param {Array<string>} list
 * @returns {Array<string>}
 */
function filterValidContacts(list) {
    return list.filter(name =>
        !!name && typeof name === 'string' && getContactByName(name)
    );
}

/**
 * Returns the CSS class name for a given category.
 *
 * @param {string} category - The task category.
 * @returns {string} The corresponding CSS class.
 */
function getCategoryClass(category) {
    if (category === "User Story") return "category-user";
    if (category === "Technical Task") return "category-technical";
    return "";
}

/**
 * Returns the CSS class for overlay based on task category.
 * @param {Object} task
 * @returns {string}
 */
function getOverlayCategoryClass(task) {
    if (!task) return "";
    if (task.category === "User Story") return "category-user";
    if (task.category === "Technical Task") return "category-technical";
    return "";
}

/**
 * Returns HTML for the "+X" hidden assigned indicator.
 * @param {Array<string>} all
 * @param {Array<string>} visible
 * @returns {string}
 */
function getHiddenCountHTML(all, visible) {
    let hiddenCount = all.length - visible.length;
    if (hiddenCount > 0) {
        return `<div class="assigned-circle">+${hiddenCount}</div>`;
    }
    return "";
}

/**
 * Finds a task in arrayTasks by its firebaseKey.
 * @param {string} firebaseKey
 * @returns {Object} The task object or null.
 */
function findTaskByKey(firebaseKey) {
    return arrayTasks.find(t => t.firebaseKey === firebaseKey) || null;
}

/**
 * Returns the path to the icon associated with the given priority.
 *
 * @param {string} priority - The task priority ("low", "medium", "urgent").
 * @returns {string} The icon path.
 */
function getPriorityIcon(priority) {
    if (!priority) return "";
    switch (priority.toLowerCase()) {
        case "low": return "./assets/icons/board/board-priority-low.svg";
        case "medium": return "./assets/icons/board/board-priority-medium.svg";
        case "urgent": return "./assets/icons/board/board-priority-urgent.svg";
        default: return "";
    }
}

/**
 * Extracts all display properties needed for the task card from the task object.
 * @param {Object} element - The task object.
 * @returns {Object} Card properties for rendering.
 */
function extractCardProps(element) {
    let category = getCardCategory(element);
    let categoryClass = getCategoryClass(category);
    let priority = getCardPriority(element);
    let priorityIcon = getPriorityIcon(priority);
    let assignedList = getAssignedList(element);
    let subtasksArr = getSubtasksArray(element);
    let subtaskProgressHTML = generateSubtaskProgress(subtasksArr);
    let title = getCardTitle(element);
    let description = getCardDescription(element);
    return { firebaseKey: element.firebaseKey, category, categoryClass, priority, priorityIcon, assignedList, subtaskProgressHTML, title, description };
}

/**
 * Extracts the category from a task object.
 *
 * @param {Object} element - The task object.
 * @returns {string} The task category or an empty string.
 */
function getCardCategory(element) {
    return typeof element.category === 'string' ? element.category : '';
}

/**
 * Extracts the priority from a task object.
 *
 * @param {Object} element - The task object.
 * @returns {string} The task priority or 'low' as default.
 */
function getCardPriority(element) {
    return typeof element.priority === 'string' ? element.priority : 'low';
}

/**
 * Extracts and formats the assigned user list from a task object.
 *
 * @param {Object} element - The task object.
 * @returns {Array<string>} An array of assigned user names.
 */
function getAssignedList(element) {
    if (Array.isArray(element.assignedTo)) {
        return element.assignedTo.filter(name => !!name && typeof name === 'string');
    } else if (typeof element.assignedTo === "string") {
        return element.assignedTo.split(",").map(name => name.trim()).filter(Boolean);
    }
    return [];
}

/**
 * Extracts the subtasks array from a task object.
 *
 * @param {Object} element - The task object.
 * @returns {Array<Object>} An array of subtask objects.
 */
function getSubtasksArray(element) {
    return Array.isArray(element.subtask) ? element.subtask : [];
}

/**
 * Extracts the title from a task object.
 *
 * @param {Object} element - The task object.
 * @returns {string} The task title or an empty string.
 */
function getCardTitle(element) {
    return typeof element.title === 'string' ? element.title : '';
}

/**
 * Extracts the description from a task object.
 *
 * @param {Object} element - The task object.
 * @returns {string} The task description or an empty string.
 */
function getCardDescription(element) {
    return typeof element.description === 'string' ? element.description : '';
}

/**
 * Generates HTML for a subtask progress bar.
 *
 * @param {Array<Object>} subtasksArr - Array of subtasks with completion status.
 * @returns {string} HTML string for the progress bar.
 */
function generateSubtaskProgress(subtasksArr) {
    let total = subtasksArr.length;
    let completed = subtasksArr.filter(sub => typeof sub === "object" && sub.completed).length;
    let percent = total > 0 ? (completed / total) * 100 : 0;
    if (total === 0) return "";
    return getSubtaskProgressHTML(completed, total, percent);
}

/**
 * Generates HTML for assigned user circles (up to 3 visible).
 * @param {Array<string>} assignedList - List of assigned user names.
 * @returns {string} HTML string for the assigned circles.
 */
function generateAssignedCircles(assignedList) {
    if (!Array.isArray(assignedList)) return "";
    let validList = filterValidContacts(assignedList);
    let visibleContacts = validList.slice(0, 3);
    let circlesHTML = visibleContacts.map(name => assignedCircleHTML(name)).join("");
    circlesHTML += getHiddenCountHTML(validList, visibleContacts);
    return circlesHTML;
}

/**
 * Returns HTML for a single assigned contact circle.
 * @param {string} name
 * @returns {string}
 */
function assignedCircleHTML(name) {
    let contact = getContactByName(name);
    let color = contact?.color || "#ccc";
    return getAssignedCircleHTML(name, color);
}

/**
 * Renders the assigned contacts as HTML elements.
 *
 * @param {Array<string>} assignedTo - The names of assigned contacts.
 * @returns {string} HTML string for the assigned contact list.
 */
function renderAssignedList(assignedTo) {
    if (!Array.isArray(assignedTo)) return "";
    return assignedTo.map(name => {
        let contact = getContactByName(name);
        if (!contact) return '';
        let color = contact.color || "#ccc";
        return getAssignedEntryHTML(name, color);
    }).join("");
}

/**
 * Toggles the completion status of a subtask at a given index.
 *
 * @param {Array<Object>} subtasks - The array of subtasks.
 * @param {number} index - The index of the subtask to toggle.
 */
function toggleSubtaskCompleted(subtasks, index) {
    if (Array.isArray(subtasks) && subtasks[index]) {
        subtasks[index].completed = !subtasks[index].completed;
    }
}

/**
 * Returns the initials for a contact’s name.
 * @param {string} name - The contact’s full name.
 * @returns {string}
 */
function getContactInitials(name) {
    return name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase();
}

/**
 * Validates the subtask input field and icons, sets error border if invalid.
 * @param {string} text - The subtask text to validate.
 * @param {HTMLElement} subtaskIcons - The icons wrapper element.
 * @param {HTMLInputElement} input - The subtask input element.
 * @returns {boolean} True if valid, false otherwise.
 */
function validateSubtaskInput(text, subtaskIcons, input) {
    if (!text || subtaskIcons.classList.contains("hidden")) {
        input.classList.add("error-border");
        return false;
    }
    input.classList.remove("error-border");
    return true;
}

/**
 * Returns the initials for the given category string.
 * @param {string} category - The category name.
 * @returns {string} The initials in uppercase.
 */
function getCategoryInitials(category) {
    return category
        .split(" ")
        .map((word) => word[0])
        .join("")
        .toUpperCase();
}

/**
 * Checks if a text input is filled.
 * @param {HTMLInputElement} inputEl - The input element.
 * @returns {boolean}
 */
function isInputFilled(inputEl) {
    return inputEl.value.trim() !== "";
}

/**
 * Checks if a category is currently selected.
 * @returns {boolean}
 */
function isCategorySelected() {
    return selectedCategory && selectedCategory.trim() !== "";
}

/**
 * Clears all content from the category dropdown.
 * @param {HTMLElement} content - The dropdown content element.
 */
function clearCategoryContent(content) {
    content.innerHTML = "";
}

/**
 * Returns a list of all available categories.
 * @returns {Array<string>}
 */
function getCategoryList() {
    return ["Technical Task", "User Story"];
}

/**
 * Clears the category display box.
 * @param {HTMLElement} box - The container for the category icon.
 */
function clearCategoryBox(box) {
    box.innerHTML = "";
}

/**
 * Creates a category icon DOM element with the given category initials.
 * @param {string} category - The category name.
 * @returns {HTMLDivElement} The icon element.
 */
function createCategoryIcon(category) {
    let div = document.createElement("div");
    div.className = "profile-icon";
    div.style.background = "#2a3647";
    div.textContent = getCategoryInitials(category);
    return div;
}

/**
 * Gets the trimmed value from an input field by id.
 * @param {string} id - The DOM element id.
 * @returns {string} The input value or empty string.
 */
function getInputValue(id) {
    let el = document.getElementById(id);
    return el ? el.value.trim() : "";
}

/**
 * Returns only valid contact names that exist in the contacts array.
 * @param {Array<string>} selectedContacts - Array of selected contact names.
 * @param {Array<Object>} contacts - All available contact objects.
 * @returns {Array<string>} Array of valid contact names.
 */
function getValidContacts(selectedContacts, contacts) {
    return selectedContacts.filter(name => contacts.find(c => c.name === name));
}

/**
 * Gets or creates the wrapper element for assigned circles.
 * @param {HTMLElement} assignedListContainer
 * @returns {HTMLElement} The wrapper element.
 */
function getOrCreateCirclesWrapper(assignedListContainer) {
    let wrapper = document.getElementById('assigned-selected-circles');
    if (!wrapper) {
        wrapper = document.createElement('div');
        wrapper.id = 'assigned-selected-circles';
        wrapper.className = 'selected-initials-wrapper';
        assignedListContainer.appendChild(wrapper);
    }
    return wrapper;
}

/**
 * Renders up to four visible contact circles into the wrapper.
 * @param {HTMLElement} wrapper - The wrapper element to append circles to.
 * @param {Array<string>} visibleContacts - Array of up to four contact names.
 */
function renderVisibleContacts(wrapper, visibleContacts) {
    visibleContacts.forEach(name => {
        let contact = getContactByName(name);
        if (!contact) return;
        wrapper.appendChild(createInitialCircle(contact));
    });
}

/**
 * Renders a "+N" circle if contacts are hidden.
 * @param {HTMLElement} wrapper - The wrapper element to append the indicator to.
 * @param {number} hiddenCount - The number of hidden contacts.
 */
function renderHiddenCount(wrapper, hiddenCount) {
    if (hiddenCount > 0) {
        let moreDiv = document.createElement('div');
        moreDiv.className = 'initial-circle';
        moreDiv.style.backgroundColor = '#ccc';
        moreDiv.textContent = `+${hiddenCount}`;
        wrapper.appendChild(moreDiv);
    }
}

/**
 * Creates a colored initial circle for a given contact.
 * @param {Object} contact - The contact object.
 * @returns {HTMLDivElement} The circle element.
 */
function createInitialCircle(contact) {
    let div = document.createElement('div');
    div.className = 'initial-circle';
    div.style.backgroundColor = contact.color || '#ccc';
    div.textContent = getInitials(contact.name);
    return div;
}