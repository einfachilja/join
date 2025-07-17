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

    statuses.forEach(s => appendMoveTaskDropdownOption(dropdown, taskKey, s, currentStatus));

    return dropdown;
}

/**
 * Appends a status option to the move task dropdown menu if it's not the current status.
 * @param {HTMLElement} dropdown - The dropdown menu element.
 * @param {string} taskKey - The Firebase key of the task.
 * @param {Object} statusObj - The status object with key and label.
 * @param {string|null} currentStatus - The current status of the task.
 */
function appendMoveTaskDropdownOption(dropdown, taskKey, statusObj, currentStatus) {
    if (statusObj.key === currentStatus) return;
    let option = document.createElement('div');
    option.className = 'move-task-dropdown-option';
    option.textContent = statusObj.label;
    option.onclick = function (e) {
        e.stopPropagation();
        handleMoveTaskOptionClick(taskKey, statusObj.key);
    };
    dropdown.appendChild(option);
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