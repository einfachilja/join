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
