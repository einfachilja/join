const BASE_URL = "https://join467-e19d8-default-rtdb.europe-west1.firebasedatabase.app/users/";

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
 * Loads all tasks and contacts for the current user and updates the board UI.
 *
 * @returns {Promise<void>}
 */
async function loadTasks() {
  let responseJson = await fetchTasksFromFirebase(firebaseKey);
  await fetchContactsAndStore(firebaseKey);
  arrayTasks = normalizeTasks(responseJson);
  await fetchContacts();
  updateHTML(arrayTasks);
}

/**
 * Fetches tasks from Firebase for a specific user.
 *
 * @param {string} userKey - The Firebase user key.
 * @returns {Promise<Object>} A promise resolving to the task data.
 */
async function fetchTasksFromFirebase(userKey) {
  let response = await fetch(`${BASE_URL}${userKey}/tasks.json`);
  let data = await response.json();
  return data;
}

/**
 * Fetches contacts for a user and stores them in localStorage under `firebaseUsers`.
 *
 * @param {string} userKey - The Firebase user key.
 * @returns {Promise<void>}
 */
async function fetchContactsAndStore(userKey) {
  let response = await fetch(`${BASE_URL}${userKey}/contacts.json`);
  let data = await response.json();
  if (data) {
    let users = JSON.parse(localStorage.getItem('firebaseUsers')) || {};
    users[userKey] = users[userKey] || {};
    users[userKey]['contacts'] = data;
    localStorage.setItem('firebaseUsers', JSON.stringify(users));
  }
}

/**
 * Converts raw Firebase task data into a normalized task array.
 *
 * @param {Object} responseJson - The raw task data from Firebase.
 * @returns {Array<Object>} An array of normalized task objects.
 */
function normalizeTasks(responseJson) {
  if (!responseJson) return [];
  return Object.entries(responseJson).map(([firebaseKey, task]) => ({
    firebaseKey,
    ...task
  }));
}

/**
 * Fetches all contacts for the current user from Firebase and stores them in the `contacts` array.
 *
 * @returns {Promise<void>} A promise that resolves when contacts are successfully fetched and stored.
 */
async function fetchContacts() {
  let response = await fetch(`${BASE_URL}${firebaseKey}/contacts.json`);
  let data = await response.json();
  contacts = Object.values(data || {})
    .filter(u => u && typeof u.name === "string" && u.name.trim())
    .map(u => ({
      name: u.name.trim(),
      color: u.color || "#888"
    }));
  updateHTML();
}

/**
 * Deletes a task from Firebase and updates the local task array and UI.
 *
 * @param {string} taskKey - The Firebase key of the task to delete.
 * @returns {Promise<void>}
 */
async function deleteTask(taskKey) {
  try {
    let response = await fetch(`${BASE_URL}${firebaseKey}/tasks/${taskKey}.json`, {
      method: "DELETE",
    });
    if (!response.ok) {
      throw new Error("Löschen fehlgeschlagen");
    }
    arrayTasks = arrayTasks.filter((task) => task.firebaseKey !== taskKey);
    closeBoardCard();
    updateHTML();
  } catch (error) {
    console.error("Fehler beim Löschen des Tasks:", error);
  }
}


/**
 * Moves the currently dragged task to the specified status and updates it in Firebase.
 *
 * @param {string} status - The new status to assign to the dragged task (e.g., "todo", "progress").
 * @returns {Promise<void>} A promise that resolves after the task status has been updated.
 */
async function moveTo(status) {
  let idx = arrayTasks.findIndex(t => t.firebaseKey === currentDraggedElement);
  if (idx === -1) return alert("Aufgabe wurde nicht gefunden!");
  let [task] = arrayTasks.splice(idx, 1);
  task.status = status;
  arrayTasks.push(task);
  await updateTaskStatusInFirebase(task, status);
  updateHTML();
}

/**
 * Updates the status of a task in Firebase.
 *
 * @param {Object} task - The task object to update.
 * @param {string} status - The new status to assign.
 * @returns {Promise<void>}
 */
async function updateTaskStatusInFirebase(task, status) {
  await fetch(
    `${BASE_URL}${firebaseKey}/tasks/${task.firebaseKey}.json`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    }
  );
}

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
 * Generates the full HTML for a task card in the board.
 * @param {Object} element - The task object.
 * @returns {string} HTML string of the task card.
 */
function generateTodoHTML(element) {
  let props = extractCardProps(element);
  return buildCardHTML(
    props.firebaseKey, props.category, props.categoryClass, props.priority, props.priorityIcon, props.assignedList, props.subtaskProgressHTML, props.title, props.description);
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
 * Marks a task element as currently being dragged.
 *
 * @param {string} firebaseKey - The key of the dragged task.
 */
function startDragging(firebaseKey) {
  currentDraggedElement = firebaseKey;
  let taskElement = document.getElementById(firebaseKey);
  taskElement.classList.add("dragging");
}

/**
 * Removes the dragging CSS class from a task element.
 *
 * @param {string} firebaseKey - The key of the task.
 */
function stopDragging(firebaseKey) {
  let taskElement = document.getElementById(firebaseKey);
  if (taskElement) {
    taskElement.classList.remove("dragging");
  }
}

/**
 * Handles the drop target behavior and appends the dragged element if valid.
 *
 * @param {DragEvent} ev - The drop event.
 */
function allowDrop(ev) {
  ev.preventDefault();
  let target = ev.currentTarget;
  let draggedEl = document.getElementById(currentDraggedElement);
  if (draggedEl && !target.contains(draggedEl)) {
    target.appendChild(draggedEl);
  }
}

/**
 * Adds a highlight class to a task column.
 *
 * @param {string} status - The status column ID.
 */
function highlight(status) {
  document.getElementById(status).classList.add("drag-area-highlight");
}

/**
 * Removes the highlight class from a task column.
 *
 * @param {string} status - The status column ID.
 */
function removeHighlight(status) {
  document.getElementById(status).classList.remove("drag-area-highlight");
}

/**
 * Filters and returns tasks by their status.
 *
 * @param {string} status - The status to filter tasks by.
 * @returns {Array<Object>} An array of tasks with the given status.
 */
function getTasksByStatus(status) {
  return arrayTasks.filter(t =>
    t && typeof t.status === 'string'
      ? t.status === status
      : status === 'todo'
  );
}

/**
 * Renders a section of the board with tasks or an empty message.
 *
 * @param {string} sectionId - The DOM ID of the section.
 * @param {Array<Object>} tasks - The list of tasks to render.
 * @param {string} emptyMessage - The message to show when no tasks are present.
 */
function renderSection(sectionId, tasks, emptyMessage) {
  let section = document.getElementById(sectionId);
  section.innerHTML = "";
  if (tasks.length === 0) {
    section.innerHTML = `<span class="empty-message">${emptyMessage}</span>`;
  } else {
    for (let task of tasks) {
      section.innerHTML += generateTodoHTML(task);
    }
  }
}

/**
 * Adds click event listeners to all task sections for opening task cards.
 */
function addCardClickListeners() {
  ['todo', 'progress', 'feedback', 'done'].forEach(sectionId => {
    let section = document.getElementById(sectionId);
    if (!section) return;
    section.onclick = null;
    section.addEventListener('click', function (event) {
      let card = event.target.closest('.card');
      if (card && card.id) openBoardCard(card.id);
    });
  });
}

/**
 * Updates the entire board UI with the current tasks.
 */
function updateHTML() {
  renderSection("todo", getTasksByStatus("todo"), "No Tasks");
  renderSection("progress", getTasksByStatus("progress"), "No Tasks");
  renderSection("feedback", getTasksByStatus("feedback"), "No Tasks");
  renderSection("done", getTasksByStatus("done"), "No Tasks");
  addCardClickListeners();
}

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
 * Finds a task in arrayTasks by its firebaseKey.
 * @param {string} firebaseKey
 * @returns {Object} The task object or null.
 */
function findTaskByKey(firebaseKey) {
  return arrayTasks.find(t => t.firebaseKey === firebaseKey) || null;
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
 * Renders the subtasks of a task as HTML list items.
 *
 * @param {Object} task - The task object containing subtasks.
 * @returns {string} HTML string of rendered subtasks.
 */
function renderSubtasks(task) {
  if (!Array.isArray(task.subtask)) return "";
  return task.subtask.map((sub, idx) => {
    let title = typeof sub === 'string' ? sub : sub.title;
    let checked = typeof sub === 'object' && sub.completed ? 'checked' : '';
    let id = `subtask-${task.firebaseKey}-${idx}`;
    return getSubtaskItemHTML(title, checked, id, task.firebaseKey, idx);
  }).join("");
}

/**
 * Updates the subtask list and progress bar in the overlay for a given task.
 *
 * @param {Object} task - The task object to update the overlay for.
 */
function updateOverlaySubtasks(task) {
  let subtaskList = document.querySelector('.subtask-list ul');
  if (subtaskList) {
    subtaskList.classList.add('subtask-list-not-edit');
    subtaskList.innerHTML = renderSubtasks(task);
  }
  let progressBar = document.querySelector('.subtask-progress-bar');
  if (progressBar) {
    let subtasksArr = Array.isArray(task.subtask) ? task.subtask : [];
    let total = subtasksArr.length;
    let completed = subtasksArr.filter(sub => typeof sub === "object" && sub.completed).length;
    let percent = total > 0 ? (completed / total) * 100 : 0;
    progressBar.style.width = percent + "%";
    progressBar.textContent = `${completed}/${total} Done`;
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
 * Converts an array of strings or objects into valid subtask objects.
 *
 * @param {Array<string|Object>} subtasks - An array of subtasks.
 * @returns {Array<Object>} An array of subtask objects with title and completed status.
 */
function convertSubtasksToObjects(subtasks) {
  return subtasks.map(sub => typeof sub === 'string' ? { title: sub, completed: false } : sub);
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
 * Saves the updated subtask array to Firebase for a specific task.
 *
 * @param {string} taskKey - The Firebase key of the task.
 * @param {Array<Object>} subtasks - The array of updated subtask objects.
 * @returns {Promise<void>}
 */
async function saveSubtasksToFirebase(taskKey, subtasks) {
  await fetch(`${BASE_URL}${firebaseKey}/tasks/${taskKey}/subtask.json`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(subtasks)
  });
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
 * Gets the CSS class for overlay based on the task category.
 * @param {Object} task - The task object.
 * @returns {string} The category CSS class.
 */
function getOverlayCategoryClass(task) {
  if (!task) return "";
  if (task.category === "User Story") return "category-user";
  if (task.category === "Technical Task") return "category-technical";
  return "";
}

/**
 * Blurs the checkbox input element of a subtask after toggling.
 *
 * @param {string} taskKey - The Firebase key of the task.
 * @param {number} index - The index of the subtask.
 */
function blurCheckbox(taskKey, index) {
  setTimeout(() => {
    let checkboxId = `subtask-${taskKey}-${index}`;
    let checkbox = document.getElementById(checkboxId);
    if (checkbox) checkbox.blur();
  }, 0);
}

/**
 * Toggles a subtask's completion state and updates Firebase and UI accordingly.
 *
 * @param {string} taskKey - The Firebase key of the task.
 * @param {number} index - The index of the subtask.
 */
async function toggleSubtask(taskKey, index) {
  let task = arrayTasks.find(t => t.firebaseKey === taskKey);
  if (!task || !Array.isArray(task.subtask)) return;
  task.subtask = convertSubtasksToObjects(task.subtask);
  toggleSubtaskCompleted(task.subtask, index);
  try {
    await saveSubtasksToFirebase(taskKey, task.subtask);
    updateHTML();
    updateOverlaySubtasks(task);
    blurCheckbox(taskKey, index);
  } catch (error) {
    console.error("Fehler beim Aktualisieren des Subtasks:", error);
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
 * Hides the board overlay from view.
 */
function hideBoardOverlay() {
  document.getElementById("board_overlay").classList.add("d-none");
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
 * Closes all open assigned-to dropdown lists.
 */
function closeAllAssignedDropdowns() {
  document.querySelectorAll('.assigned-dropdown-list.open').forEach(el => {
    el.classList.remove('open');
  });
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
 * Sets up event handlers for the assigned-to dropdown.
 * @param {HTMLElement} toggle - The dropdown toggle element.
 * @param {HTMLElement} list - The dropdown list element.
 */
function setupAssignedDropdownEvents(toggle, list) {
  addToggleClickHandler(toggle, list);
  addGlobalDropdownCloseHandler();
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
 * @param {HTMLElement} wrapper
 * @param {Array<string>} selectedContacts
 * @param {Array<Object>} contacts
 */
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
 * Returns only valid contact names that exist in the contacts array.
 * @param {Array<string>} selectedContacts - Array of selected contact names.
 * @param {Array<Object>} contacts - All available contact objects.
 * @returns {Array<string>} Array of valid contact names.
 */
function getValidContacts(selectedContacts, contacts) {
  return selectedContacts.filter(name => contacts.find(c => c.name === name));
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
 * Initializes the editable subtask list inside the overlay card.
 */
function setupSubtasksEdit() {
  let subtaskList = document.querySelector('.subtask-list ul');
  if (!subtaskList || document.getElementById('subtasks-edit-container')) return;
  let { container, input, addBtn } = createSubtasksEditContainer();
  let subtasks = getSubtasksOfCurrentTask();
  function rerender() {
    renderSubtasksList(subtasks, container, rerender);
  }
  addBtn.onclick = () => handleAddSubtask(subtasks, input, container, rerender);
  rerender();
  subtaskList.innerHTML = '';
  subtaskList.appendChild(container);
  window.getEditedSubtasks = () => subtasks;
}

/**
 * Gets the subtasks array for the currently open task in the overlay.
 * @returns {Array<Object>} The array of subtask objects.
 */
function getSubtasksOfCurrentTask() {
  let taskKey = document.getElementById('board_overlay_card').dataset.firebaseKey;
  let task = arrayTasks.find(t => t.firebaseKey === taskKey);
  return Array.isArray(task.subtask) ? task.subtask : [];
}

/**
 * Creates the container and input/button elements for editing subtasks.
 * @returns {Object} The created elements: container, input, addBtn.
 */
function createSubtasksEditContainer() {
  let container = document.createElement('div');
  container.id = 'subtasks-edit-container';
  container.className = 'subtasks-edit-container';
  let inputWrapper = document.createElement('div');
  inputWrapper.className = 'subtask-input-wrapper';
  let input = createSubtaskInput();
  let addBtn = createAddSubtaskButton();
  inputWrapper.appendChild(input);
  inputWrapper.appendChild(addBtn);
  container.appendChild(inputWrapper);
  return { container, input, addBtn };
}

/**
 * Creates the text input for adding a new subtask.
 * @returns {HTMLInputElement} The input element.
 */
function createSubtaskInput() {
  let input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Add new subtask';
  input.id = 'add-subtask-input';
  input.className = 'add-subtask-input';
  return input;
}

/**
 * Creates the button element for adding a subtask.
 * @returns {HTMLButtonElement} The add button element.
 */
function createAddSubtaskButton() {
  let addBtn = document.createElement('button');
  addBtn.type = 'button';
  addBtn.id = 'add-subtask-btn';
  addBtn.textContent = '+';
  addBtn.className = 'add-subtask-btn';
  return addBtn;
}

/**
 * Renders the editable list of subtasks inside the edit container.
 * @param {Array<Object>} subtaskArr - The array of subtasks.
 * @param {HTMLElement} container - The container element to render into.
 * @param {Function} rerender - The function to rerender the list.
 */
function renderSubtasksList(subtaskArr, container, rerender) {
  let listDiv = document.getElementById('subtask-list-edit');
  if (!listDiv) {
    listDiv = document.createElement('div');
    listDiv.id = 'subtask-list-edit';
    container.appendChild(listDiv);
  }
  listDiv.innerHTML = '';
  subtaskArr.forEach((sub, idx) => {
    let row = createSubtaskRow(sub, idx, subtaskArr, rerender, container);
    listDiv.appendChild(row);
  });
}

/**
 * Creates a row element for an editable subtask.
 * @param {Object|string} sub - The subtask object or string.
 * @param {number} idx - The index of the subtask.
 * @param {Array<Object>} subtaskArr - The array of subtasks.
 * @param {Function} rerender - The rerender callback.
 * @param {HTMLElement} container - The parent container.
 * @returns {HTMLElement} The subtask row element.
 */
function createSubtaskRow(sub, idx, subtaskArr, rerender, container) {
  let row = document.createElement('div');
  row.className = 'subtask-list-row';
  let input = createSubtaskRowInput(sub, idx, subtaskArr);
  let editBtn = createSubtaskRowEditButton(input);
  let removeBtn = createSubtaskRowRemoveButton(idx, subtaskArr, rerender);
  let dot = createSubtaskRowDot();
  row.appendChild(dot);
  row.appendChild(input);
  row.appendChild(editBtn);
  row.appendChild(removeBtn);
  row.ondblclick = () => {
    input.activateEdit();
  };
  return row;
}

/**
 * Creates the input element for editing a subtask row.
 * @param {Object|string} sub - The subtask object or string.
 * @param {number} idx - The index of the subtask in the array.
 * @param {Array<Object>} subtaskArr - The array of subtasks.
 * @returns {HTMLInputElement} The input element.
 */
function createSubtaskRowInput(sub, idx, subtaskArr) {
  let input = document.createElement('input');
  input.type = 'text';
  input.value = typeof sub === 'string' ? sub : sub.title;
  input.className = 'subtask-list-editinput';
  input.readOnly = true;
  input.activateEdit = () => { input.readOnly = false; input.focus(); input.setSelectionRange(0, input.value.length); };
  input.onblur = () => { if (input.value.trim() !== '') subtaskArr[idx].title = input.value.trim(); input.readOnly = true; };
  input.onkeydown = (e) => { if (e.key === 'Enter') input.blur(); };
  return input;
}

/**
 * Creates the edit button for a subtask row.
 * @param {HTMLInputElement} input - The input element to activate edit on.
 * @returns {HTMLButtonElement} The edit button element.
 */
function createSubtaskRowEditButton(input) {
  let editBtn = document.createElement('button');
  editBtn.type = 'button';
  editBtn.className = 'subtask-edit-btn';
  editBtn.innerHTML = `<img src="assets/icons/board/board-edit-icon.svg">`;
  editBtn.title = 'Bearbeiten';
  editBtn.onclick = (e) => {
    e.preventDefault();
    input.activateEdit();
  };
  return editBtn;
}

/**
 * Creates the remove button for a subtask row.
 * @param {number} idx - The index of the subtask.
 * @param {Array<Object>} subtaskArr - The array of subtasks.
 * @param {Function} rerender - The rerender callback.
 * @returns {HTMLButtonElement} The remove button element.
 */
function createSubtaskRowRemoveButton(idx, subtaskArr, rerender) {
  let removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'subtask-remove-btn';
  removeBtn.innerHTML = `<img src="assets/icons/board/board-delete-icon.svg">`;
  removeBtn.onclick = (e) => {
    e.preventDefault();
    subtaskArr.splice(idx, 1);
    rerender();
  };
  return removeBtn;
}

/**
 * Creates the dot element for a subtask row.
 * @returns {HTMLElement} The dot span element.
 */
function createSubtaskRowDot() {
  let dot = document.createElement('span');
  dot.className = 'subtask-dot';
  dot.textContent = '•';
  return dot;
}

/**
 * Handles adding a new subtask to the subtasks array and rerenders the list.
 * @param {Array<Object>} subtasks - The subtasks array.
 * @param {HTMLInputElement} input - The input element for new subtask.
 * @param {HTMLElement} container - The container element.
 * @param {Function} rerender - The rerender callback.
 */
function handleAddSubtask(subtasks, input, container, rerender) {
  let val = input.value.trim();
  if (val) {
    subtasks.push({ title: val, completed: false });
    rerender();
    input.value = '';
  }
}

/**
 * Saves the edited task data back to Firebase and refreshes the UI.
 *
 * @param {string} taskKey - The Firebase key of the task being edited.
 */
async function saveEditTask(taskKey) {
  let task = arrayTasks.find(t => t.firebaseKey === taskKey);
  if (!task) return;
  disableEditMode();
  let updatedTask = getUpdatedTaskFromEdit(task, taskKey);
  try {
    await updateTaskInFirebase(taskKey, updatedTask);
    updateTaskLocally(taskKey, updatedTask);
    reloadUIAfterEdit(taskKey, { noAnimation: true });
  } catch (error) {
    console.error("Fehler beim Bearbeiten des Tasks:", error);
  }
}

/**
 * Disables editing mode on the overlay card and restores the default view.
 */
function disableEditMode() {
  document.getElementById("overlay_card_title").contentEditable = "false";
  document.getElementById("overlay_card_description").contentEditable = "false";
  document.getElementById("due_date").contentEditable = "false";
  let titleLabel = document.getElementById("overlay_card_title_label");
  if (titleLabel) titleLabel.remove();
  let descLabel = document.getElementById("overlay_card_description_label");
  if (descLabel) descLabel.remove();
}

/**
 * Collects all updated values from the edit form and returns a new task object.
 * @param {Object} task - The original task object.
 * @param {string} taskKey - The Firebase key of the task.
 * @returns {Object} The updated task object.
 */
function getUpdatedTaskFromEdit(task, taskKey) {
  let newTitle = getEditedTitle();
  let newDescription = getEditedDescription();
  let newDueDate = getEditedDueDate();
  let newPriority = getEditedPriority(task.priority);
  let newAssignedTo = getEditedAssignedTo(task.assignedTo);
  let newSubtasks = getEditedSubtasks(task.subtask);
  return { ...task, title: newTitle, description: newDescription, dueDate: newDueDate, priority: newPriority, assignedTo: newAssignedTo, subtask: newSubtasks };
}

/**
 * Gets the edited title from the overlay input.
 * @returns {string} The new title.
 */
function getEditedTitle() {
  return document.getElementById("overlay_card_title").innerHTML;
}

/**
 * Gets the edited description from the overlay input.
 * @returns {string} The new description.
 */
function getEditedDescription() {
  return document.getElementById("overlay_card_description").innerHTML;
}

/**
 * Gets the edited due date from the overlay input.
 * @returns {string} The new due date.
 */
function getEditedDueDate() {
  return getNewDueDate();
}

/**
 * Gets the edited priority from the overlay selection.
 * @param {string} defaultPriority - The fallback priority if not changed.
 * @returns {string} The selected or default priority.
 */
function getEditedPriority(defaultPriority) {
  let priorityWrapper = document.getElementById('priority-edit-buttons');
  if (priorityWrapper && priorityWrapper.dataset.selectedPriority) {
    return priorityWrapper.dataset.selectedPriority;
  }
  return defaultPriority;
}

/**
 * Gets the edited assigned contacts from the overlay dropdown.
 * @param {Array<string>} defaultAssignedTo - The fallback assigned contacts.
 * @returns {Array<string>} The selected or default assigned contacts.
 */
function getEditedAssignedTo(defaultAssignedTo) {
  return typeof window.getAssignedOverlaySelection === 'function'
    ? window.getAssignedOverlaySelection()
    : defaultAssignedTo;
}

/**
 * Gets the edited subtasks from the overlay editor.
 * @param {Array<Object>} defaultSubtasks - The fallback subtasks.
 * @returns {Array<Object>} The edited or default subtasks.
 */
function getEditedSubtasks(defaultSubtasks) {
  return typeof window.getEditedSubtasks === 'function'
    ? window.getEditedSubtasks()
    : defaultSubtasks;
}

/**
 * Gets the new due date string from the date input or fallback from overlay.
 * @returns {string} The new due date string.
 */
function getNewDueDate() {
  let dueDateInput = document.getElementById("due_date_input");
  if (dueDateInput) {
    let [y, m, d] = dueDateInput.value.split("-");
    if (y && m && d) return `${d}/${m}/${y}`;
  }
  let rawDueDate = document.getElementById("due_date").innerHTML;
  let match = rawDueDate.match(/(\d{2}\/\d{2}\/\d{4}|\d{4}-\d{2}-\d{2})/);
  return match ? match[0] : "";
}

/**
 * Updates a task in Firebase with new values.
 * @param {string} taskKey - The Firebase key of the task.
 * @param {Object} updatedTask - The updated task data.
 * @returns {Promise<void>}
 */
async function updateTaskInFirebase(taskKey, updatedTask) {
  await fetch(`${BASE_URL}${firebaseKey}/tasks/${taskKey}.json`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updatedTask)
  });
}

/**
 * Updates the local arrayTasks with the edited task.
 * @param {string} taskKey - The Firebase key of the task.
 * @param {Object} updatedTask - The updated task data.
 */
function updateTaskLocally(taskKey, updatedTask) {
  arrayTasks = arrayTasks.map(t => t.firebaseKey === taskKey ? updatedTask : t);
}

/**
 * Refreshes the board UI after editing a task and reopens the overlay card.
 * @param {string} taskKey - The Firebase key of the task.
 * @param {Object} [options={}] - Options for reopening the card.
 */
function reloadUIAfterEdit(taskKey, options = {}) {
  updateHTML();
  openBoardCard(taskKey, options);
}

/**
 * Executes a search over all tasks based on title and description input.
 */
function searchTask() {
  let inputValue = getSearchInputValue();
  let foundTasks = filterTasksBySearch(arrayTasks, inputValue);
  clearBoardSections();
  if (foundTasks.length > 0) {
    renderTasksToBoard(foundTasks);
  } else {
    ["todo", "progress", "feedback", "done"].forEach(section => {
      document.getElementById(section).innerHTML = `
        <span class="empty-message no-results">No results found</span>
      `;
    });
  }
}

/**
 * Gets the normalized, lowercase value from the search input field.
 * @returns {string} The trimmed, lowercase search value.
 */
function getSearchInputValue() {
  let inputRef = document.getElementById("input_find_task");
  return inputRef.value.trim().toLowerCase();
}

/**
 * Filters tasks by search value, checking title and description.
 * @param {Array<Object>} tasks - The list of tasks to filter.
 * @param {string} searchValue - The lowercase search string.
 * @returns {Array<Object>} The filtered tasks.
 */
function filterTasksBySearch(tasks, searchValue) {
  return tasks.filter(task => {
    let titleMatch = task.title && task.title.toLowerCase().includes(searchValue);
    let descriptionMatch = task.description && task.description.toLowerCase().includes(searchValue);
    return titleMatch || descriptionMatch;
  });
}

/**
 * Clears all board sections (todo, progress, feedback, done).
 */
function clearBoardSections() {
  ["todo", "progress", "feedback", "done"].forEach(section => {
    document.getElementById(section).innerHTML = "";
  });
}

/**
 * Renders tasks into their corresponding board sections based on status.
 * @param {Array<Object>} tasks - The tasks to render.
 */
function renderTasksToBoard(tasks) {
  tasks.forEach(task => {
    if (["todo", "progress", "feedback", "done"].includes(task.status)) {
      document.getElementById(task.status).innerHTML += generateTodoHTML(task);
    }
  });
}

/**
 * Opens the add task overlay and sets a default status.
 * @param {string} status - The status to assign the new task.
 */
function openAddTaskForStatus(status) {
  addTaskDefaultStatus = status;
  openAddTaskOverlay();
}

/**
 * Opens and initializes the add task overlay modal.
 */
function openAddTaskOverlay() {
  showAddTaskOverlay();
  renderAddTaskModal();
  addAddTaskOverlayEventListeners();
  initAddTaskOverlayLogic();
}

/**
 * Shows the add task overlay and disables background scrolling.
 */
function showAddTaskOverlay() {
  let overlay = document.getElementById("add_task_overlay");
  overlay.classList.remove("d-none");
  document.getElementById("html").style.overflow = "hidden";
}

/**
 * Renders the content of the add task modal and initializes the animation.
 */
function renderAddTaskModal() {
  let overlay = document.getElementById("add_task_overlay");
  overlay.innerHTML = getAddTaskOverlay();
  updateHTML();
  setTimeout(() => {
    let modal = document.querySelector('.board-add-task-modal');
    if (modal) modal.classList.add('open');
  }, 10);
}

/**
 * Adds event listeners to handle clicks outside the add task overlay/modal.
 */
function addAddTaskOverlayEventListeners() {
  setTimeout(() => {
    document.addEventListener('mousedown', handleAddTaskOverlayClickOutside);
  }, 0);
}

/**
 * Closes the add task overlay. Handles animation if modal is open.
 */
function closeAddTaskOverlay() {
  let modal = document.querySelector('.board-add-task-modal');
  if (modal) {
    closeAddTaskModalWithAnimation();
  } else {
    hideAndResetAddTaskOverlay();
  }
  resetAddTaskDefaultStatus();
  removeAddTaskOverlayEventListener();
}

/**
 * Closes the add task modal with animation and then hides and resets overlay.
 */
function closeAddTaskModalWithAnimation() {
  let modal = document.querySelector('.board-add-task-modal');
  modal.classList.remove('open');
  setTimeout(hideAndResetAddTaskOverlay, 400);
}

/**
 * Hides and resets the add task overlay content and restores scroll.
 */
function hideAndResetAddTaskOverlay() {
  let overlay = document.getElementById("add_task_overlay");
  if (overlay) {
    overlay.classList.add("d-none");
    document.getElementById("html").style.overflow = "";
    overlay.innerHTML = "";
  }
}

/**
 * Resets the default status for new tasks to 'todo'.
 */
function resetAddTaskDefaultStatus() {
  addTaskDefaultStatus = "todo";
}

/**
 * Removes the add task overlay's outside click event listener.
 */
function removeAddTaskOverlayEventListener() {
  document.removeEventListener('mousedown', handleAddTaskOverlayClickOutside);
}

/**
 * Handles click outside of the add task modal and closes the overlay.
 * @param {Event} event - The mousedown event.
 */
function handleAddTaskOverlayClickOutside(event) {
  let modal = document.querySelector('.board-add-task-modal');
  if (!modal) return;
  if (!modal.contains(event.target)) {
    closeAddTaskOverlay();
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
 * Selects the given priority, updates UI, and submit button state.
 * @param {string} prio - The selected priority.
 */
function selectPriority(prio) {
  selectedPriority = prio;
  document.querySelectorAll("#buttons-prio button").forEach((b) => {
    b.classList.toggle("selected", b.dataset.prio === prio);
  });
  updateSubmitState();
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
 * Creates a dropdown item for a category and click handler.
 * @param {string} category - The category name.
 * @param {HTMLElement} content - The dropdown content element.
 * @returns {HTMLElement}
 */
function createCategoryDropdownItem(category, content) {
  let item = document.createElement("div");
  item.className = "dropdown-item category-item";
  item.innerHTML = `<span class="category-name">${category}</span>`;
  item.onclick = () => {
    handleCategoryClick(category, content);
  };
  return item;
}

/**
 * Handles click on a category dropdown item.
 * @param {string} category - The category name.
 * @param {HTMLElement} content - The dropdown content element.
 */
function handleCategoryClick(category, content) {
  selectCategory(category);
  content.classList.remove("visible");
  document.getElementById("category-toggle").classList.remove("open");
  updateSubmitState();
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
 * Adds a new subtask from the input field, validates, appends to the list, and resets UI.
 */
function addSubtask() {
  let input = document.getElementById("subtask-input");
  let subtaskIcons = document.getElementById("subtask-icons");
  let text = input.value.trim();
  if (!validateSubtaskInput(text, subtaskIcons, input)) return;
  subtasks.push(text);
  let li = createSubtaskListItem(text);
  document.getElementById("subtask-list").appendChild(li);
  finalizeSubtaskInput(input, subtaskIcons);
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
 * Creates a list item DOM element for a subtask, including edit/remove actions.
 * @param {string} text - The subtask text.
 * @returns {HTMLLIElement} The subtask list item element.
 */
function createSubtaskListItem(text) {
  let li = document.createElement("li");
  li.className = "subtask-list-item";
  li.appendChild(createSubtaskDot());
  let input = createSubtaskInputElem(text, li);
  li.appendChild(input);
  li.appendChild(createEditBtn(input));
  li.appendChild(createRemoveBtn(li));
  li.ondblclick = () => input.activateEdit();
  return li;
}

/**
 * Creates the dot element for a subtask.
 * @returns {HTMLSpanElement} The dot element.
 */
function createSubtaskDot() {
  let dot = document.createElement("span");
  dot.className = "subtask-dot";
  dot.textContent = "•";
  return dot;
}

/**
 * Creates an input element for a subtask and attaches all logic.
 * @param {string} text - The subtask text.
 * @param {HTMLLIElement} li - The parent list item element.
 * @returns {HTMLInputElement} The configured input element.
 */
function createSubtaskInputElem(text, li) {
  let input = document.createElement("input");
  input.type = "text";
  input.value = text;
  input.className = "subtask-list-editinput";
  input.readOnly = true;
  addSubtaskInputElemEvents(input, li);
  return input;
}

/**
 * Attaches editing, blur, and keydown logic to a subtask input element.
 * @param {HTMLInputElement} input - The input element.
 * @param {HTMLLIElement} li - The parent list item element.
 */
function addSubtaskInputElemEvents(input, li) {
  input.activateEdit = () => {
    input.readOnly = false;
    input.focus();
    input.setSelectionRange(0, input.value.length);
  };
  input.onblur = () => {
    if (input.value.trim() === "") {
      li.remove();
      return;
    }
    input.readOnly = true;
  };
  input.onkeydown = (e) => {
    if (e.key === "Enter") input.blur();
  };
}

/**
 * Creates the edit button for a subtask.
 * @param {HTMLInputElement} input - The input to activate editing.
 * @returns {HTMLButtonElement} The edit button.
 */
function createEditBtn(input) {
  let editBtn = document.createElement("button");
  editBtn.type = "button";
  editBtn.className = "subtask-edit-btn";
  editBtn.innerHTML = `<img src="assets/icons/board/board-edit-icon.svg">`;
  editBtn.title = "Bearbeiten";
  editBtn.onclick = (e) => {
    e.preventDefault();
    input.activateEdit();
  };
  return editBtn;
}

/**
 * Creates the remove button for a subtask.
 * @param {HTMLLIElement} li - The list item to remove.
 * @returns {HTMLButtonElement} The remove button.
 */
function createRemoveBtn(li) {
  let removeBtn = document.createElement("button");
  removeBtn.type = "button";
  removeBtn.className = "subtask-remove-btn";
  removeBtn.innerHTML = `<img src="assets/icons/board/board-delete-icon.svg">`;
  removeBtn.onclick = (e) => {
    e.preventDefault();
    li.remove();
  };
  return removeBtn;
}

/**
 * Finalizes the subtask input field: resets, hides icons, updates submit state.
 * @param {HTMLInputElement} input - The subtask input element.
 * @param {HTMLElement} subtaskIcons - The icons wrapper element.
 */
function finalizeSubtaskInput(input, subtaskIcons) {
  updateSubmitState();
  input.value = "";
  subtaskIcons.classList.add("hidden");
  let subtaskPlus = document.getElementById("subtask-plus");
  if (subtaskPlus) subtaskPlus.classList.remove("hidden");
}

/**
 * Handles pressing Enter in the subtask input, triggers addSubtask if icons visible.
 * @param {KeyboardEvent} e - The keydown event.
 */
function handleSubtaskEnter(e) {
  if (e.key === "Enter") {
    e.preventDefault();
    let subtaskIcons = document.getElementById("subtask-icons");
    if (subtaskIcons && !subtaskIcons.classList.contains("hidden")) {
      addSubtask();
    }
  }
}

/**
 * Shows or hides the subtask action icons depending on input focus and value.
 */
function toggleSubtaskIcons() {
  let input = document.getElementById("subtask-input");
  let confirmIcon = document.getElementById("subtask-confirm");
  let defaultIcon = document.getElementById("subtask-plus");
  let cancelIcon = document.getElementById("subtask-cancel");
  let isActive = document.activeElement === input;
  confirmIcon?.classList.toggle("hidden", !isActive);
  cancelIcon?.classList.toggle("hidden", !isActive);
  defaultIcon?.classList.toggle("hidden", isActive);
}

/**
 * Clears the subtask input, hides icons, shows the add ("plus") icon.
 */
function clearSubtaskInput() {
  let subtaskInput = document.getElementById("subtask-input");
  let subtaskIcons = document.getElementById("subtask-icons");
  let subtaskPlus = document.getElementById("subtask-plus");
  if (subtaskInput) subtaskInput.value = "";
  if (subtaskIcons) subtaskIcons.classList.add("hidden");
  if (subtaskPlus) subtaskPlus.classList.remove("hidden");
}

/**
 * Updates the category UI to display the selected category icon.
 */
function updateCategoryUI() {
  let box = document.getElementById("selected-category");
  if (!box) return;
  clearCategoryBox(box);
  if (selectedCategory) {
    let icon = createCategoryIcon(selectedCategory);
    box.appendChild(icon);
  }
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
 * Validates all main form fields: title, due date, and category.
 * @returns {boolean} True if valid, false otherwise.
 */
function validateForm() {
  let titleEl = document.getElementById("title");
  let dueDateEl = document.getElementById("dueDate");
  let categoryToggle = document.getElementById("category-toggle");

  let titleValid = isInputFilled(titleEl);
  let dueDateValid = isInputFilled(dueDateEl);
  let categoryValid = isCategorySelected();

  showTitleError(titleEl, titleValid);
  showDueDateError(dueDateEl, dueDateValid);
  showCategoryError(categoryToggle, categoryValid);

  return titleValid && dueDateValid && categoryValid;
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
 * Shows or hides the title error state and error message.
 * @param {HTMLElement} titleEl - The title input element.
 * @param {boolean} isValid - Whether the title is valid.
 */
function showTitleError(titleEl, isValid) {
  let titleError = document.getElementById("error-title");
  titleEl.classList.toggle("error", !isValid);
  if (titleError) titleError.classList.toggle("visible", !isValid);
}

/**
 * Shows or hides the due date error state and error message.
 * @param {HTMLElement} dueDateEl - The due date input element.
 * @param {boolean} isValid - Whether the due date is valid.
 */
function showDueDateError(dueDateEl, isValid) {
  let dueDateError = document.getElementById("error-dueDate");
  dueDateEl.classList.toggle("error-border", !isValid);
  if (dueDateError) dueDateError.classList.toggle("visible", !isValid);
}

/**
 * Shows or hides the category error state and error message.
 * @param {HTMLElement} categoryToggle - The category toggle element.
 * @param {boolean} isValid - Whether the category is valid.
 */
function showCategoryError(categoryToggle, isValid) {
  let categoryError = document.getElementById("error-category");
  categoryToggle.classList.toggle("error-border", !isValid);
  if (categoryError) categoryError.classList.toggle("visible", !isValid);
}

/**
 * Enables or disables the submit button based on form state.
 */
function updateSubmitState() {
  let button = document.getElementById("submit-task-btn");
  if (button) button.disabled = false;
}

/**
 * Resets all main form fields and UI state.
 */
function resetForm() {
  resetTitle();
  resetDescription();
  resetDueDate();
  resetPriority();
  resetContacts();
  resetCategory();
  resetSubtasks();
}

/**
 * Resets the title input field.
 */
function resetTitle() {
  let title = document.getElementById("title");
  if (title) title.value = "";
}

/**
 * Resets the description input field.
 */
function resetDescription() {
  let description = document.getElementById("description");
  if (description) description.value = "";
}

/**
 * Resets the due date input field.
 */
function resetDueDate() {
  let dueDate = document.getElementById("dueDate");
  if (dueDate) dueDate.value = "";
}

/**
 * Resets the priority selection to the default value.
 */
function resetPriority() {
  selectedPriority = "medium";
  selectPriority("medium");
}

/**
 * Clears all selected contacts and updates the UI.
 */
function resetContacts() {
  selectedContacts = [];
  updateSelectedContactsUI();
}

/**
 * Clears the selected category and resets UI.
 */
function resetCategory() {
  selectedCategory = "";
  let categoryPlaceholder = document.querySelector("#category-toggle span");
  if (categoryPlaceholder) categoryPlaceholder.textContent = "Select category";
}

/**
 * Clears all subtasks and resets the subtask input and list.
 */
function resetSubtasks() {
  clearSubtasksArray();
  clearSubtasksList();
  clearSubtaskInput();
  hideSubtaskIcons();
  showSubtaskPlus();
}

/**
 * Empties the subtasks array.
 */
function clearSubtasksArray() {
  subtasks.length = 0;
}

/**
 * Clears the subtask list display.
 */
function clearSubtasksList() {
  let subtaskList = document.getElementById("subtask-list");
  if (subtaskList) subtaskList.innerHTML = "";
}

/**
 * Hides the subtask action icons.
 */
function hideSubtaskIcons() {
  let subtaskIcons = document.getElementById("subtask-icons");
  if (subtaskIcons) subtaskIcons.classList.add("hidden");
}

/**
 * Shows the subtask "plus" (add) icon.
 */
function showSubtaskPlus() {
  let subtaskPlus = document.getElementById("subtask-plus");
  if (subtaskPlus) subtaskPlus.classList.remove("hidden");
}

/**
 * Sets up date input validation, ensures only today or future dates are selectable.
 */
function setupDateValidation() {
  setTimeout(() => {
    let dateInput = document.getElementById("dueDate");
    let errorText = document.getElementById("error-dueDate");
    if (!dateInput || !errorText) return;
    setMinDateToday(dateInput);
    addDateInputListener(dateInput, errorText);
  }, 100);
}

/**
 * Sets the minimum date of the date input to today.
 * @param {HTMLInputElement} dateInput - The date input element.
 */
function setMinDateToday(dateInput) {
  let today = new Date().toISOString().split("T")[0];
  dateInput.min = today;
}

/**
 * Adds an input event listener to the date input to clear errors when user changes date.
 * @param {HTMLInputElement} dateInput - The date input element.
 * @param {HTMLElement} errorText - The error message element.
 */
function addDateInputListener(dateInput, errorText) {
  dateInput.addEventListener("input", () => {
    dateInput.classList.remove("error-border");
    errorText.classList.remove("visible");
  });
}

/**
 * Creates a new task based on form input and stores it in Firebase.
 */
async function createTask() {
  if (!validateForm()) return;
  let task = buildTaskObject();
  await saveTaskToFirebase(task);
  closeAddTaskOverlay();
  showTaskAddedOverlay();
  await reloadAndHighlightNewTask();
}

/**
 * Shows the "task added" overlay for a short duration.
 */
function showTaskAddedOverlay() {
  let overlay = document.getElementById("task-added-overlay");
  if (!overlay) return;
  overlay.style.display = "flex";
  overlay.classList.add("show");
  setTimeout(() => {
    overlay.classList.remove("show");
    setTimeout(() => {
      overlay.style.display = "none";
    }, 200);
  }, 2500);
}

/**
 * Builds and returns a task object from current form input values.
 * @returns {Object} The task object.
 */
function buildTaskObject() {
  return {
    title: getInputValue("title"),
    description: getInputValue("description"),
    dueDate: getInputValue("dueDate"),
    priority: selectedPriority,
    assignedTo: selectedContacts.map((c) => c.name),
    category: selectedCategory,
    subtask: subtasks.map(st => ({ title: st, completed: false })),
    createdAt: new Date().toISOString(),
    status: addTaskDefaultStatus,
  };
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
 * Saves a new task to Firebase.
 * @param {Object} task - The task object to save.
 * @returns {Promise<void>}
 */
async function saveTaskToFirebase(task) {
  await fetch(
    `${BASE_URL}${firebaseKey}/tasks.json`,
    {
      method: "POST",
      body: JSON.stringify(task),
    }
  );
}

/**
 * Reloads the tasks from Firebase and highlights the most recently created task.
 * @returns {Promise<void>}
 */
async function reloadAndHighlightNewTask() {
  await loadTasks();
  setTimeout(() => {
    highlightLastCreatedTask();
  }, 100);
}

/**
 * Highlights the most recently created task on the board for a short duration.
 */
function highlightLastCreatedTask() {
  let lastTask = arrayTasks[arrayTasks.length - 1];
  if (lastTask && lastTask.firebaseKey) {
    lastCreatedTaskKey = lastTask.firebaseKey;
    updateHTML();
    setTimeout(() => {
      let newTaskEl = document.getElementById(lastCreatedTaskKey);
      if (newTaskEl) {
        newTaskEl.classList.remove("task-blink");
      }
      lastCreatedTaskKey = null;
    }, 2000);
  }
}

/**
 * Sets up all event listeners for the add task form, including dropdowns, category, and subtask input.
 */
function setupEventListeners() {
  setupDropdownListeners();
  setupCategoryListeners();
  setupSubtaskInputListeners();
}

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
 * Sets up event listeners for the category dropdown.
 */
function setupCategoryListeners() {
  let categoryToggle = document.getElementById("category-toggle");
  if (categoryToggle) {
    categoryToggle.addEventListener("click", toggleCategoryDropdown);
  }
}

/**
 * Sets up event listeners for the subtask input field (show/hide icons, handle Enter key).
 */
function setupSubtaskInputListeners() {
  let subtaskInput = document.getElementById("subtask-input");
  if (!subtaskInput) return;
  subtaskInput.addEventListener("input", showOrHideSubtaskIcons);
  subtaskInput.addEventListener("keydown", handleSubtaskEnter);
}

/**
 * Shows or hides the subtask action icons depending on input value.
 */
function showOrHideSubtaskIcons() {
  let input = document.getElementById("subtask-input");
  let iconWrapper = document.getElementById("subtask-icons");
  if (!input || !iconWrapper) return;
  if (input.value.trim().length > 0) {
    iconWrapper.classList.remove("hidden");
  } else {
    iconWrapper.classList.add("hidden");
  }
}

/**
 * Initializes the logic for the add task overlay: loads contacts, sets up listeners, validates date, and resets form.
 */
function initAddTaskOverlayLogic() {
  fetchContacts();
  setupEventListeners();
  setupDateValidation();
  resetForm();
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
 * Handles the click on a move task menu option: moves task and closes menu.
 * @param {string} taskKey - The Firebase key of the task.
 * @param {string} statusKey - The new status to move to.
 */
function handleMoveTaskOptionClick(taskKey, statusKey) {
  currentDraggedElement = taskKey;
  moveTo(statusKey);
  closeMoveTaskMenu();
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
 * Returns the complete HTML string for the open board card overlay.
 * @param {string} categoryClass - The CSS class for the category.
 * @param {Object} task - The task object.
 * @returns {string} HTML string for the board card overlay.
 */
function getOpenBoardCardTemplate(categoryClass, task) {
  let priorityIcon = getPriorityIcon(task.priority);
  let assignedHTML = renderAssignedList(task.assignedTo);
  let subtaskHTML = renderSubtasks(task);
  return getOpenBoardCardHTML(task, categoryClass, priorityIcon, assignedHTML, subtaskHTML);
}

/**
 * Returns the HTML string for the priority selection buttons.
 * @param {string} currentPriority - The currently selected priority ("urgent", "medium", "low").
 * @returns {string} HTML string for the priority buttons.
 */
function getPriorityButtonsHTML(currentPriority) {
  let priorities = [
    { value: 'urgent', label: 'Urgent', icon: './assets/icons/board/board-priority-urgent.svg' },
    { value: 'medium', label: 'Medium', icon: './assets/icons/board/board-priority-medium.svg' },
    { value: 'low', label: 'Low', icon: './assets/icons/board/board-priority-low.svg' }
  ];
  return priorities.map(p => getPriorityButtonHTML(p, currentPriority)).join('');
}

/**
 * Closes the move task dropdown menu when the window is resized.
 */
window.addEventListener('resize', closeMoveTaskMenu);

/**
 * Adds drag & drop highlight listeners to all board columns for visual feedback.
 */
function addDragHighlightListeners() {
  getBoardColumns().forEach(el => {
    setupDragEventsForColumn(el);
  });
}

/**
 * Returns an array of all board column elements.
 * @returns {Array<HTMLElement>}
 */
function getBoardColumns() {
  return ['todo', 'progress', 'feedback', 'done']
    .map(id => document.getElementById(id))
    .filter(Boolean);
}

/**
 * Sets up all drag event listeners for a given board column.
 * @param {HTMLElement} el - The board column element.
 */
function setupDragEventsForColumn(el) {
  el.addEventListener('dragover', ev => handleDragOver(ev, el));
  el.addEventListener('dragleave', () => handleDragLeave(el));
  el.addEventListener('drop', ev => handleDrop(ev, el));
}

/**
 * Handles the dragover event for a board column.
 * @param {DragEvent} ev
 * @param {HTMLElement} el
 */
function handleDragOver(ev, el) {
  ev.preventDefault();
  el.classList.add('highlight');
}

/**
 * Handles the dragleave event for a board column.
 * @param {HTMLElement} el
 */
function handleDragLeave(el) {
  el.classList.remove('highlight');
}

/**
 * Handles the drop event for a board column.
 * @param {DragEvent} ev
 * @param {HTMLElement} el
 */
function handleDrop(ev, el) {
  ev.preventDefault();
  let draggedEl = document.getElementById(currentDraggedElement);
  if (draggedEl && !el.contains(draggedEl)) {
    el.appendChild(draggedEl);
  }
  removeAllHighlights();
}

/**
 * Removes the highlight class from all board columns.
 */
function removeAllHighlights() {
  getBoardColumns().forEach(el => el.classList.remove('highlight'));
}

/**
 * Adds drag & drop highlight listeners to all board columns for visual feedback after DOM load.
 * Runs automatically when the DOM is ready.
 */
window.addEventListener('DOMContentLoaded', addDragHighlightListeners);