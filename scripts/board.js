const BASE_URL = "https://join467-e19d8-default-rtdb.europe-west1.firebasedatabase.app/users/";

let arrayTasks = [];
let addTaskDefaultStatus = "todo";
let firebaseKey = localStorage.getItem("firebaseKey");
let lastCreatedTaskKey = null;
let currentDraggedElement;
let selectedPriority = "medium";
const subtasks = [];
let contacts = [];
let selectedContacts = [];
let selectedCategory = "";

async function loadTasks() {
  const responseJson = await fetchTasksFromFirebase(firebaseKey);
  await fetchContactsAndStore(firebaseKey);
  arrayTasks = normalizeTasks(responseJson);
  await fetchContacts();
  updateHTML(arrayTasks);
}

async function fetchTasksFromFirebase(userKey) {
  const response = await fetch(`${BASE_URL}${userKey}/tasks.json`);
  const data = await response.json();
  return data;
}

async function fetchContactsAndStore(userKey) {
  try {
    const response = await fetch(`${BASE_URL}${userKey}/contacts.json`);
    const data = await response.json();

    if (data) {
      let users = JSON.parse(localStorage.getItem('firebaseUsers')) || {};
      users[userKey] = users[userKey] || {};
      users[userKey]['contacts'] = data;
      localStorage.setItem('firebaseUsers', JSON.stringify(users));
    }
  } catch (error) {
    console.error("Fehler beim Abrufen der Kontakte:", error);
  }
}

function normalizeTasks(responseJson) {
  if (!responseJson) return [];
  return Object.entries(responseJson).map(([firebaseKey, task]) => ({
    firebaseKey,
    ...task
  }));
}

async function fetchContacts() {
  try {
    const response = await fetch(`${BASE_URL}${firebaseKey}/contacts.json`);
    const data = await response.json();
    contacts = Object.values(data || {})
      .filter(u => u && typeof u.name === "string" && u.name.trim())
      .map(u => ({
        name: u.name.trim(),
        color: u.color || "#888"
      }));
    updateHTML();
  } catch (err) {
    console.error("Contacts fetch error:", err);
  }
}

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

async function moveTo(status) {
  let task = arrayTasks.find(t => t.firebaseKey === currentDraggedElement);
  if (!task) {
    alert("Aufgabe wurde nicht gefunden!");
    return;
  }
  task.status = status;
  try {
    await fetch(`${BASE_URL}${firebaseKey}/tasks/${task.firebaseKey}.json`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: status })
    });
  } catch (error) {
    alert("Fehler beim Speichern des Status!");
    console.error(error);
  }
  updateHTML();
}

function getContactByName(name) {
  return contacts.find(c => c.name === name) || null;
}

function getInitials(name) {
  if (!name || typeof name !== 'string') return '';
  return name.split(" ").map(n => n[0]).join("").toUpperCase();
}

function getCategoryClass(category) {
  if (category === "User Story") return "category-user";
  if (category === "Technical Task") return "category-technical";
  return "";
}

function getPriorityIcon(priority) {
  switch ((priority || '').toLowerCase()) {
    case "low": return "./assets/icons/board/board-priority-low.svg";
    case "medium": return "./assets/icons/board/board-priority-medium.svg";
    case "urgent": return "./assets/icons/board/board-priority-urgent.svg";
    default: return "./assets/icons/board/board-priority-low.svg";
  }
}

function generateAssignedCircles(assignedList) {
  if (!Array.isArray(assignedList)) return "";
  return assignedList.map(name => {
    const contact = getContactByName(name);
    if (!contact) return '';
    const color = contact.color || "#ccc";
    return `<span class="assigned-circle" style="background-color: ${color};">${getInitials(name)}</span>`;
  }).join("");
}

function generateSubtaskProgress(subtasksArr) {
  const total = subtasksArr.length;
  const completed = subtasksArr.filter(sub => typeof sub === "object" && sub.completed).length;
  const percent = total > 0 ? (completed / total) * 100 : 0;
  if (total === 0) return "";
  return `
    <div class="card-subtask-progress">
      <div class="subtask-progress-bar-bg">
        <div class="subtask-progress-bar-fill" style="width: ${percent}%;"></div>
      </div>
      <span class="subtask-progress-text">${completed}/${total} Subtasks</span>
    </div>`;
}

function generateTodoHTML(element) {
  const category = typeof element.category === 'string' ? element.category : '';
  const categoryClass = getCategoryClass(category);
  const priority = typeof element.priority === 'string' ? element.priority : 'low';
  const priorityIcon = getPriorityIcon(priority);

  let assignedList = [];
  if (Array.isArray(element.assignedTo)) {
    assignedList = element.assignedTo.filter(name => !!name && typeof name === 'string');
  } else if (typeof element.assignedTo === "string") {
    assignedList = element.assignedTo.split(",").map(name => name.trim()).filter(Boolean);
  }

  let subtasksArr = Array.isArray(element.subtask) ? element.subtask : [];
  const subtaskProgressHTML = generateSubtaskProgress(subtasksArr);

  const title = typeof element.title === 'string' ? element.title : '';
  const description = typeof element.description === 'string' ? element.description : '';

  return `
    <div draggable="true" ondragstart="startDragging('${element.firebaseKey}')" ondragend="stopDragging('${element.firebaseKey}')">
      <div class="card${element.firebaseKey === lastCreatedTaskKey ? ' task-blink' : ''}" id="${element.firebaseKey}">
        <div class="card-header">
          <span class="card-category ${categoryClass}" ${category ? `title="${category}"` : ''}>${category}</span>
          <button class="card-header-move-arrow-btn" title="Move Task" type="button" onclick="openMoveTaskMenu('${element.firebaseKey}', event)">
            <img class="card-header-move-arrow" src="./assets/icons/board/board-move-arrow.svg" alt="Move Task" />
          </button>
        </div>
        <span class="card-title">${title}</span>
        <span class="card-description">${description}</span>
        ${subtaskProgressHTML}
        <div class="card-footer">
          <div class="assigned-container">
            ${generateAssignedCircles(assignedList)}
          </div>
          <div class="priority-container"><img src="${priorityIcon}" alt="${priority}"></div>
        </div>
      </div>
    </div>`;
}

function startDragging(firebaseKey) {
  currentDraggedElement = firebaseKey;
  const taskElement = document.getElementById(firebaseKey);
  taskElement.classList.add("dragging");
}

function stopDragging(firebaseKey) {
  const taskElement = document.getElementById(firebaseKey);
  if (taskElement) {
    taskElement.classList.remove("dragging");
  }
}

function allowDrop(ev) {
  ev.preventDefault();
  const target = ev.currentTarget;
  const draggedEl = document.getElementById(currentDraggedElement);
  if (draggedEl && !target.contains(draggedEl)) {
    target.appendChild(draggedEl);
  }
}

function highlight(status) {
  document.getElementById(status).classList.add("drag-area-highlight");
}

function removeHighlight(status) {
  document.getElementById(status).classList.remove("drag-area-highlight");
}

function getTasksByStatus(status) {
  return arrayTasks.filter(t =>
    t && typeof t.status === 'string'
      ? t.status === status
      : status === 'todo'
  );
}

function renderSection(sectionId, tasks, emptyMessage) {
  const section = document.getElementById(sectionId);
  section.innerHTML = "";
  if (tasks.length === 0) {
    section.innerHTML = `<span class="empty-message">${emptyMessage}</span>`;
  } else {
    for (let task of tasks) {
      section.innerHTML += generateTodoHTML(task);
    }
  }
}

function addCardClickListeners() {
  ['todo', 'progress', 'feedback', 'done'].forEach(sectionId => {
    const section = document.getElementById(sectionId);
    if (!section) return;
    section.onclick = null;
    section.addEventListener('click', function (event) {
      const card = event.target.closest('.card');
      if (card && card.id) openBoardCard(card.id);
    });
  });
}

function updateHTML() {
  renderSection("todo", getTasksByStatus("todo"), "No Tasks in To do");
  renderSection("progress", getTasksByStatus("progress"), "No Tasks In progress");
  renderSection("feedback", getTasksByStatus("feedback"), "No Tasks in Await feedback");
  renderSection("done", getTasksByStatus("done"), "No Tasks in Done");
  addCardClickListeners();
}

function openBoardCard(firebaseKey) {
  const overlayElement = document.getElementById("board_overlay");
  const task = arrayTasks.find(t => t.firebaseKey === firebaseKey);
  let categoryClass = "";
  if (task.category === "User Story") categoryClass = "category-user";
  else if (task.category === "Technical Task") categoryClass = "category-technical";
  overlayElement.classList.remove("d-none");
  document.getElementById("html").style.overflow = "hidden";
  overlayElement.innerHTML = getOpenBoardCardTemplate(categoryClass, task);
  setTimeout(() => {
    const card = document.querySelector('.board-overlay-card');
    if (card) card.classList.add('open');
  }, 10);
  updateHTML();
}

function getPriorityIcon(priority) {
  if (!priority) return "";
  switch (priority.toLowerCase()) {
    case "low": return "./assets/icons/board/board-priority-low.svg";
    case "medium": return "./assets/icons/board/board-priority-medium.svg";
    case "urgent": return "./assets/icons/board/board-priority-urgent.svg";
    default: return "";
  }
}

function renderAssignedList(assignedTo) {
  if (!Array.isArray(assignedTo)) return "";
  return assignedTo.map(name => {
    const contact = getContactByName(name);
    if (!contact) return '';
    const color = contact.color || "#ccc";
    return `
      <div class="assigned-entry">
        <span class="assigned-circle" style="background-color: ${color};">${getInitials(name)}</span>
        <span class="assigned-name">${name}</span>
      </div>`;
  }).join("");
}

function renderSubtasks(task) {
  if (!Array.isArray(task.subtask)) return "";
  return task.subtask.map((sub, idx) => {
    const title = typeof sub === 'string' ? sub : sub.title;
    const checked = typeof sub === 'object' && sub.completed ? 'checked' : '';
    const id = `subtask-${task.firebaseKey}-${idx}`;
    return `
      <div class="subtask-item">
        <input type="checkbox" id="${id}" ${checked} onchange="toggleSubtask('${task.firebaseKey}', ${idx})" />
        <label for="${id}">${title}</label>
      </div>`;
  }).join("");
}

function selectOverlayPriority(priority, btn) {
  document.querySelectorAll('.priority-edit-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  document.getElementById('priority-edit-buttons').dataset.selectedPriority = priority;
}

function convertSubtasksToObjects(subtasks) {
  return subtasks.map(sub => typeof sub === 'string' ? { title: sub, completed: false } : sub);
}

function toggleSubtaskCompleted(subtasks, index) {
  if (Array.isArray(subtasks) && subtasks[index]) {
    subtasks[index].completed = !subtasks[index].completed;
  }
}

async function saveSubtasksToFirebase(taskKey, subtasks) {
  await fetch(`${BASE_URL}${firebaseKey}/tasks/${taskKey}/subtask.json`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(subtasks)
  });
}

function renderBoardOverlay(task) {
  const boardOverlayRef = document.getElementById("board_overlay");
  if (boardOverlayRef && task) {
    const categoryClass = task.category === "User Story"
      ? "category-user"
      : task.category === "Technical Task"
        ? "category-technical"
        : "";
    boardOverlayRef.innerHTML = getOpenBoardCardTemplate(categoryClass, task);
    // Ensure card re-renders and animation matches openBoardCard
    const cardRef = document.querySelector('.board-overlay-card');
    if (cardRef) {
      setTimeout(() => {
        cardRef.classList.add('open');
      }, 10);
    }
    document.getElementById("html").style.overflow = "hidden";
    boardOverlayRef.classList.remove("d-none");
    boardOverlayRef.scrollTop = 0;
  }
}

function blurCheckbox(taskKey, index) {
  setTimeout(() => {
    const checkboxId = `subtask-${taskKey}-${index}`;
    const checkbox = document.getElementById(checkboxId);
    if (checkbox) checkbox.blur();
  }, 0);
}

async function toggleSubtask(taskKey, index) {
  let task = arrayTasks.find(t => t.firebaseKey === taskKey);
  if (!task || !Array.isArray(task.subtask)) return;

  // Schritt 1: Konvertieren
  task.subtask = convertSubtasksToObjects(task.subtask);

  // Schritt 2: Toggle
  toggleSubtaskCompleted(task.subtask, index);

  // Schritt 3: Speichern
  try {
    await saveSubtasksToFirebase(taskKey, task.subtask);

    // Schritt 4: UI-Update
    updateHTML();
    renderBoardOverlay(task);
    // Schritt 5: Fokus entfernen
    blurCheckbox(taskKey, index);

  } catch (error) {
    console.error("Fehler beim Aktualisieren des Subtasks:", error);
  }
}

function removeOverlayAnimation(card) {
  card.classList.remove('open');
}

function hideBoardOverlay() {
  document.getElementById("board_overlay").classList.add("d-none");
}

function resetHtmlOverflow() {
  document.getElementById("html").style.overflow = "";
}

function removeOverlayLabels() {
  let titleLabel = document.getElementById("overlay_card_title_label");
  if (titleLabel) titleLabel.remove();
  let descLabel = document.getElementById("overlay_card_description_label");
  if (descLabel) descLabel.remove();
}

function closeOverlayWithDelay(ms) {
  setTimeout(() => {
    hideBoardOverlay();
    resetHtmlOverflow();
    removeOverlayLabels();
    updateHTML();
  }, ms);
}

function closeOverlayImmediately() {
  hideBoardOverlay();
  resetHtmlOverflow();
  removeOverlayLabels();
  updateHTML();
}

function closeBoardCard() {
  if (window._assignedDropdownCleanup) window._assignedDropdownCleanup();
  const card = document.querySelector('.board-overlay-card');
  if (card) {
    removeOverlayAnimation(card);
    closeOverlayWithDelay(400);
  } else {
    closeOverlayImmediately();
  }
}

function onclickProtection(event) {
  event.stopPropagation();
}

function editTask() {
  editTaskUI();
  addTitleLabel();
  addDescriptionLabel();
  addDueDateLabelAndInput();
  setupPriorityEdit();
  setupAssignedDropdown();
  setupSubtasksEdit();
}

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

function extractDueDateText(dueDateSpan) {
  let match = dueDateSpan.innerText.match(/(\d{2}\/\d{2}\/\d{4}|\d{4}-\d{2}-\d{2})/);
  return match ? match[0] : "";
}

function formatDateForInput(dateStr) {
  if (dateStr.match(/\d{2}\/\d{2}\/\d{4}/)) {
    let [d, m, y] = dateStr.split("/");
    return `${y}-${m}-${d}`;
  }
  return dateStr;
}

function addDueDateLabel(dueDateSpan) {
  if (!document.getElementById("overlay_card_due_date_label")) {
    let dueLabel = document.createElement("span");
    dueLabel.textContent = "Due Date";
    dueLabel.id = "overlay_card_due_date_label";
    dueLabel.className = "overlay-card-label";
    dueDateSpan.parentNode.insertBefore(dueLabel, dueDateSpan);
  }
}

function addDueDateInput(dueDateSpan, formattedDate) {
  let input = document.createElement("input");
  input.type = "date";
  input.id = "due_date_input";
  input.className = "overlay-card-date-input";
  input.value = formattedDate;
  dueDateSpan.innerHTML = "";
  dueDateSpan.appendChild(input);
}

function addDueDateLabelAndInput() {
  let dueDateSpan = document.getElementById("due_date");
  if (dueDateSpan && !document.getElementById("due_date_input")) {
    let currentDueDate = extractDueDateText(dueDateSpan);
    let formattedDate = formatDateForInput(currentDueDate);
    addDueDateLabel(dueDateSpan);
    addDueDateInput(dueDateSpan, formattedDate);
  }
}

function setupPriorityEdit() {
  const priorityHeadline = document.querySelector('.priority-headline');
  if (priorityHeadline && !document.getElementById('priority-edit-buttons')) {
    const taskKey = document.getElementById('board_overlay_card').dataset.firebaseKey;
    const task = arrayTasks.find(t => t.firebaseKey === taskKey);
    const wrapper = document.createElement('div');
    wrapper.id = 'priority-edit-buttons';
    wrapper.innerHTML = getPriorityButtonsHTML(task.priority.toLowerCase());
    const labelP = document.createElement('span');
    labelP.textContent = 'Priority';
    labelP.id = 'overlay_card_priority_label';
    labelP.className = 'overlay-card-label';
    priorityHeadline.parentNode.insertBefore(labelP, priorityHeadline);
    priorityHeadline.innerHTML = '';
    priorityHeadline.appendChild(wrapper);
  }
}

function createLabel() {
  const label = document.createElement('span');
  label.textContent = 'Assigned to';
  label.className = 'overlay-card-label';
  return label;
}

function createDropdown() {
  const dropdown = document.createElement('div');
  dropdown.id = 'assigned-dropdown';
  dropdown.className = 'assigned-dropdown';
  return dropdown;
}

function createList() {
  const list = document.createElement('div');
  list.id = 'assigned-dropdown-list';
  list.className = 'assigned-dropdown-list';
  list.classList.remove('open');
  return list;
}

function createToggle() {
  const toggle = document.createElement('div');
  toggle.className = 'assigned-dropdown-toggle';
  return toggle;
}

function createPlaceholder() {
  const placeholder = document.createElement('span');
  placeholder.id = 'assigned-placeholder';
  placeholder.textContent = 'Select contacts to assign';
  return placeholder;
}

function createArrow() {
  const arrow = document.createElement('span');
  arrow.className = 'dropdown-arrow';
  return arrow;
}

function createAssignedDropdownElements(assignedListContainer) {
  assignedListContainer.innerHTML = '';
  const label = createLabel();
  const dropdown = createDropdown();
  const list = createList();
  const toggle = createToggle();
  const placeholder = createPlaceholder();
  const arrow = createArrow();

  toggle.appendChild(placeholder);
  toggle.appendChild(arrow);
  dropdown.appendChild(toggle);
  dropdown.appendChild(list);
  assignedListContainer.appendChild(label);
  assignedListContainer.appendChild(dropdown);

  return { dropdown, list, toggle, placeholder, arrow };
}

function addToggleClickHandler(toggle, list) {
  if (!toggle._dropdownClickHandlerAdded) {
    toggle.addEventListener('click', function (event) {
      event.stopPropagation();
      const isOpen = list.classList.contains('open');
      closeAllAssignedDropdowns();
      if (!isOpen) {
        list.classList.add('open');
      }
    });
    toggle._dropdownClickHandlerAdded = true;
  }
}

function closeAllAssignedDropdowns() {
  document.querySelectorAll('.assigned-dropdown-list.open').forEach(el => {
    el.classList.remove('open');
  });
}

function addGlobalDropdownCloseHandler() {
  if (!window._assignedDropdownClickHandler) {
    document.addEventListener('click', function (event) {
      document.querySelectorAll('.assigned-dropdown').forEach(dropdown => {
        const list = dropdown.querySelector('.assigned-dropdown-list');
        if (list && list.classList.contains('open') && !dropdown.contains(event.target)) {
          list.classList.remove('open');
        }
      });
    });
    window._assignedDropdownClickHandler = true;
  }
}

function setupAssignedDropdownEvents(toggle, list) {
  addToggleClickHandler(toggle, list);
  addGlobalDropdownCloseHandler();
}

function fetchAssignedContacts() {
  const userKey = localStorage.getItem('firebaseKey');
  const usersData = JSON.parse(localStorage.getItem('firebaseUsers')) || {};
  return Object.values(usersData[userKey]?.contacts || {});
}

function getInitialAssignedContacts(taskKey) {
  const task = arrayTasks.find(t => t.firebaseKey === taskKey);
  return [...(task?.assignedTo || [])];
}

function toggleContactSelection(name, selectedContacts) {
  if (selectedContacts.includes(name)) {
    return selectedContacts.filter(n => n !== name);
  } else {
    return [...selectedContacts, name];
  }
}

function renderAssignedDropdownList(contacts, selectedContacts, list, toggleContact, renderAssignedSelectedCircles) {
  list.innerHTML = '';
  contacts.forEach(contact => {
    const item = createAssignedItem(contact, selectedContacts, toggleContact);
    list.appendChild(item);
  });
  renderAssignedSelectedCircles(selectedContacts, contacts, list.parentElement.parentElement);
}

function createAssignedItem(contact, selectedContacts, toggleContact) {
  const initials = getInitials(contact.name);
  const isChecked = selectedContacts.includes(contact.name);
  const item = document.createElement('div');
  item.className = 'assigned-item' + (isChecked ? ' selected' : '');
  item.onclick = () => toggleContact(contact.name);
  const circle = createAssignedCircle(initials, contact.color);
  const name = document.createElement('span');
  name.className = 'assigned-name';
  name.textContent = contact.name;
  const checkbox = createAssignedCheckbox(isChecked, toggleContact, contact.name);
  item.appendChild(circle);
  item.appendChild(name);
  item.appendChild(checkbox);
  return item;
}

function createAssignedCircle(initials, color) {
  const circle = document.createElement('span');
  circle.className = 'assigned-circle';
  circle.style.backgroundColor = color || '#ccc';
  circle.textContent = initials;
  return circle;
}

function createAssignedCheckbox(isChecked, toggleContact, name) {
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'assigned-checkbox';
  checkbox.checked = isChecked;
  checkbox.onclick = (e) => {
    e.stopPropagation();
    toggleContact(name);
  };
  return checkbox;
}

function renderAssignedSelectedCircles(selectedContacts, contacts, assignedListContainer) {
  const wrapper = getOrCreateCirclesWrapper(assignedListContainer);
  positionCirclesWrapper(wrapper, assignedListContainer);
  updateCirclesVisibility(wrapper, selectedContacts);
  updateCirclesContent(wrapper, selectedContacts, contacts);
}

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

function positionCirclesWrapper(wrapper, assignedListContainer) {
  const dropdown = document.getElementById('assigned-dropdown');
  if (dropdown && wrapper.previousSibling !== dropdown) {
    assignedListContainer.insertBefore(wrapper, dropdown.nextSibling);
  }
}

function updateCirclesVisibility(wrapper, selectedContacts) {
  wrapper.style.display = selectedContacts.length === 0 ? "none" : "flex";
}

function updateCirclesContent(wrapper, selectedContacts, contacts) {
  wrapper.innerHTML = '';
  selectedContacts.forEach(name => {
    const contact = contacts.find(c => c.name === name);
    if (!contact) return;
    const initials = getInitials(contact.name);
    const color = contact.color || '#ccc';
    const div = document.createElement('div');
    div.className = 'initial-circle';
    div.style.backgroundColor = color;
    div.textContent = initials;
    wrapper.appendChild(div);
  });
}

function handleAssignedContactToggle(name, contacts, list, assignedListContainer, selectedContacts, renderAssignedSelectedCircles, renderAssignedDropdownList) {
  selectedContacts.value = toggleContactSelection(name, selectedContacts.value);
  renderAssignedDropdownList(contacts, selectedContacts.value, list, (n) =>
    handleAssignedContactToggle(n, contacts, list, assignedListContainer, selectedContacts, renderAssignedSelectedCircles, renderAssignedDropdownList), renderAssignedSelectedCircles);
  renderAssignedSelectedCircles(selectedContacts.value, contacts, assignedListContainer);
}

function setupAssignedDropdown() {
  const assignedListContainer = document.querySelector('.assigned-list');
  if (!assignedListContainer || document.getElementById('assigned-dropdown')) return;

  const { dropdown, list, toggle, placeholder, arrow } = createAssignedDropdownElements(assignedListContainer);
  setupAssignedDropdownEvents(toggle, list);
  const contacts = fetchAssignedContacts();
  const taskKey = document.getElementById('board_overlay_card').dataset.firebaseKey;
  const selectedContacts = { value: getInitialAssignedContacts(taskKey) };

  function onToggleContact(name) {
    handleAssignedContactToggle(name, contacts, list, assignedListContainer, selectedContacts, renderAssignedSelectedCircles, renderAssignedDropdownList);
  }

  renderAssignedDropdownList(contacts, selectedContacts.value, list, onToggleContact, renderAssignedSelectedCircles);
  renderAssignedSelectedCircles(selectedContacts.value, contacts, assignedListContainer);
  window.getAssignedOverlaySelection = () => selectedContacts.value;
}

function setupSubtasksEdit() {
  const subtaskList = document.querySelector('.subtask-list ul');
  if (!subtaskList || document.getElementById('subtasks-edit-container')) return;
  const { container, input, addBtn } = createSubtasksEditContainer();
  const subtasks = getSubtasksOfCurrentTask();
  function rerender() {
    renderSubtasksList(subtasks, container, rerender);
  }
  addBtn.onclick = () => handleAddSubtask(subtasks, input, container, rerender);
  rerender();
  subtaskList.innerHTML = '';
  subtaskList.appendChild(container);
  window.getEditedSubtasks = () => subtasks;
}

function getSubtasksOfCurrentTask() {
  const taskKey = document.getElementById('board_overlay_card').dataset.firebaseKey;
  const task = arrayTasks.find(t => t.firebaseKey === taskKey);
  return Array.isArray(task.subtask) ? task.subtask : [];
}

function createSubtasksEditContainer() {
  const container = document.createElement('div');
  container.id = 'subtasks-edit-container';
  container.className = 'subtasks-edit-container';
  const inputWrapper = document.createElement('div');
  inputWrapper.className = 'subtask-input-wrapper';
  const input = createSubtaskInput();
  const addBtn = createAddSubtaskButton();
  inputWrapper.appendChild(input);
  inputWrapper.appendChild(addBtn);
  container.appendChild(inputWrapper);
  return { container, input, addBtn };
}

function createSubtaskInput() {
  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Add new subtask';
  input.id = 'add-subtask-input';
  input.className = 'add-subtask-input';
  return input;
}

function createAddSubtaskButton() {
  const addBtn = document.createElement('button');
  addBtn.type = 'button';
  addBtn.id = 'add-subtask-btn';
  addBtn.textContent = '+';
  addBtn.className = 'add-subtask-btn';
  return addBtn;
}

function renderSubtasksList(subtaskArr, container, rerender) {
  let listDiv = document.getElementById('subtask-list-edit');
  if (!listDiv) {
    listDiv = document.createElement('div');
    listDiv.id = 'subtask-list-edit';
    container.appendChild(listDiv);
  }
  listDiv.innerHTML = '';
  subtaskArr.forEach((sub, idx) => {
    const row = createSubtaskRow(sub, idx, subtaskArr, rerender, container);
    listDiv.appendChild(row);
  });
}

function createSubtaskRow(sub, idx, subtaskArr, rerender, container) {
  const row = document.createElement('div');
  row.className = 'subtask-list-row';
  const input = createSubtaskRowInput(sub, idx, subtaskArr);
  const editBtn = createSubtaskRowEditButton(input);
  const removeBtn = createSubtaskRowRemoveButton(idx, subtaskArr, rerender);
  const dot = createSubtaskRowDot();
  row.appendChild(dot);
  row.appendChild(input);
  row.appendChild(editBtn);
  row.appendChild(removeBtn);
  return row;
}

function createSubtaskRowInput(sub, idx, subtaskArr) {
  const input = document.createElement('input');
  input.type = 'text';
  input.value = typeof sub === 'string' ? sub : sub.title;
  input.className = 'subtask-list-editinput';
  input.readOnly = true;
  input.activateEdit = () => {
    input.readOnly = false;
    input.focus();
    input.setSelectionRange(0, input.value.length);
  };
  input.onblur = () => {
    if (input.value.trim() !== '') {
      subtaskArr[idx].title = input.value.trim();
    }
    input.readOnly = true;
  };
  input.onkeydown = (e) => {
    if (e.key === 'Enter') input.blur();
  };
  return input;
}

function createSubtaskRowEditButton(input) {
  const editBtn = document.createElement('button');
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

function createSubtaskRowRemoveButton(idx, subtaskArr, rerender) {
  const removeBtn = document.createElement('button');
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

function createSubtaskRowDot() {
  const dot = document.createElement('span');
  dot.className = 'subtask-dot';
  dot.textContent = '•';
  return dot;
}

function handleAddSubtask(subtasks, input, container, rerender) {
  const val = input.value.trim();
  if (val) {
    subtasks.push({ title: val, completed: false });
    rerender();
    input.value = '';
  }
}

async function saveEditTask(taskKey) {
  let task = arrayTasks.find(t => t.firebaseKey === taskKey);
  if (!task) return;
  disableEditMode();
  const updatedTask = getUpdatedTaskFromEdit(task, taskKey);
  try {
    await updateTaskInFirebase(taskKey, updatedTask);
    updateTaskLocally(taskKey, updatedTask);
    reloadUIAfterEdit(taskKey);
  } catch (error) {
    console.error("Fehler beim Bearbeiten des Tasks:", error);
  }
}

function disableEditMode() {
  document.getElementById("overlay_card_title").contentEditable = "false";
  document.getElementById("overlay_card_description").contentEditable = "false";
  document.getElementById("due_date").contentEditable = "false";
  let titleLabel = document.getElementById("overlay_card_title_label");
  if (titleLabel) titleLabel.remove();
  let descLabel = document.getElementById("overlay_card_description_label");
  if (descLabel) descLabel.remove();
}

function getUpdatedTaskFromEdit(task, taskKey) {
  const newTitle = getEditedTitle();
  const newDescription = getEditedDescription();
  const newDueDate = getEditedDueDate();
  const newPriority = getEditedPriority(task.priority);
  const newAssignedTo = getEditedAssignedTo(task.assignedTo);
  const newSubtasks = getEditedSubtasks(task.subtask);

  return {
    ...task,
    title: newTitle,
    description: newDescription,
    dueDate: newDueDate,
    priority: newPriority,
    assignedTo: newAssignedTo,
    subtask: newSubtasks
  };
}

function getEditedTitle() {
  return document.getElementById("overlay_card_title").innerHTML;
}

function getEditedDescription() {
  return document.getElementById("overlay_card_description").innerHTML;
}

function getEditedDueDate() {
  return getNewDueDate();
}

function getEditedPriority(defaultPriority) {
  const priorityWrapper = document.getElementById('priority-edit-buttons');
  if (priorityWrapper && priorityWrapper.dataset.selectedPriority) {
    return priorityWrapper.dataset.selectedPriority;
  }
  return defaultPriority;
}

function getEditedAssignedTo(defaultAssignedTo) {
  return typeof window.getAssignedOverlaySelection === 'function'
    ? window.getAssignedOverlaySelection()
    : defaultAssignedTo;
}

function getEditedSubtasks(defaultSubtasks) {
  return typeof window.getEditedSubtasks === 'function'
    ? window.getEditedSubtasks()
    : defaultSubtasks;
}

function getNewDueDate() {
  let dueDateInput = document.getElementById("due_date_input");
  if (dueDateInput) {
    let [y, m, d] = dueDateInput.value.split("-");
    if (y && m && d) return `${d}/${m}/${y}`;
  }
  const rawDueDate = document.getElementById("due_date").innerHTML;
  const match = rawDueDate.match(/(\d{2}\/\d{2}\/\d{4}|\d{4}-\d{2}-\d{2})/);
  return match ? match[0] : "";
}

async function updateTaskInFirebase(taskKey, updatedTask) {
  await fetch(`${BASE_URL}${firebaseKey}/tasks/${taskKey}.json`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updatedTask)
  });
}

function updateTaskLocally(taskKey, updatedTask) {
  arrayTasks = arrayTasks.map(t => t.firebaseKey === taskKey ? updatedTask : t);
}

function reloadUIAfterEdit(taskKey) {
  updateHTML();
  openBoardCard(taskKey);
}

function searchTask() {
  const inputValue = getSearchInputValue();
  const foundTasks = filterTasksBySearch(arrayTasks, inputValue);

  clearBoardSections();

  if (foundTasks.length > 0) {
    renderTasksToBoard(foundTasks);
    console.log("Gefundene Tasks:", foundTasks);
  } else {
    console.log("Keine Tasks gefunden mit dem Suchbegriff:", inputValue);
  }
}

function getSearchInputValue() {
  const inputRef = document.getElementById("input_find_task");
  return inputRef.value.trim().toLowerCase();
}

function filterTasksBySearch(tasks, searchValue) {
  return tasks.filter(task => {
    const titleMatch = task.title && task.title.toLowerCase().includes(searchValue);
    const descriptionMatch = task.description && task.description.toLowerCase().includes(searchValue);
    return titleMatch || descriptionMatch;
  });
}

function clearBoardSections() {
  ["todo", "progress", "feedback", "done"].forEach(section => {
    document.getElementById(section).innerHTML = "";
  });
}

function renderTasksToBoard(tasks) {
  tasks.forEach(task => {
    if (["todo", "progress", "feedback", "done"].includes(task.status)) {
      document.getElementById(task.status).innerHTML += generateTodoHTML(task);
    }
  });
}

function openAddTaskForStatus(status) {
  addTaskDefaultStatus = status;
  openAddTaskOverlay();
}

function openAddTaskOverlay() {
  showAddTaskOverlay();
  renderAddTaskModal();
  addAddTaskOverlayEventListeners();
  initAddTaskOverlayLogic();
}

function showAddTaskOverlay() {
  const overlay = document.getElementById("add_task_overlay");
  overlay.classList.remove("d-none");
  document.getElementById("html").style.overflow = "hidden";
}

function renderAddTaskModal() {
  const overlay = document.getElementById("add_task_overlay");
  overlay.innerHTML = getAddTaskOverlay();
  updateHTML();
  setTimeout(() => {
    const modal = document.querySelector('.board-add-task-modal');
    if (modal) modal.classList.add('open');
  }, 10);
}

function addAddTaskOverlayEventListeners() {
  setTimeout(() => {
    document.addEventListener('mousedown', handleAddTaskOverlayClickOutside);
  }, 0);
}

function closeAddTaskOverlay() {
  const modal = document.querySelector('.board-add-task-modal');
  if (modal) {
    closeAddTaskModalWithAnimation();
  } else {
    hideAndResetAddTaskOverlay();
  }
  resetAddTaskDefaultStatus();
  removeAddTaskOverlayEventListener();
}

function closeAddTaskModalWithAnimation() {
  const modal = document.querySelector('.board-add-task-modal');
  modal.classList.remove('open');
  setTimeout(hideAndResetAddTaskOverlay, 400); // passend zur CSS-Transition
}

function hideAndResetAddTaskOverlay() {
  const overlay = document.getElementById("add_task_overlay");
  if (overlay) {
    overlay.classList.add("d-none");
    document.getElementById("html").style.overflow = "";
    overlay.innerHTML = "";
  }
}

function resetAddTaskDefaultStatus() {
  addTaskDefaultStatus = "todo";
}

function removeAddTaskOverlayEventListener() {
  document.removeEventListener('mousedown', handleAddTaskOverlayClickOutside);
}

function handleAddTaskOverlayClickOutside(event) {
  const modal = document.querySelector('.board-add-task-modal');
  if (!modal) return;
  if (!modal.contains(event.target)) {
    closeAddTaskOverlay();
  }
}

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

function closeDropdownIfClickedOutside(contentId, toggleId, visibleClass, openClass, event) {
  const content = document.getElementById(contentId);
  const toggle = document.getElementById(toggleId);
  if (content && toggle && content.classList.contains(visibleClass)) {
    if (!content.contains(event.target) && !toggle.contains(event.target)) {
      content.classList.remove(visibleClass);
      toggle.classList.remove(openClass);
    }
  }
}

function selectPriority(prio) {
  selectedPriority = prio;
  document.querySelectorAll("#buttons-prio button").forEach((b) => {
    b.classList.toggle("selected", b.dataset.prio === prio);
  });
  updateSubmitState();
}

function handleAssignedToClick(e) {
  e.stopPropagation();
  toggleAssignDropdown(e);
}

function handleAssignedToInput(e) {
  const value = e.target.value.trim().toLowerCase();
  renderAssignOptions(value);
}

function toggleAssignDropdown(event) {
  event.stopPropagation();
  const tog = document.getElementById("dropdown-toggle");
  const dd = document.getElementById("dropdown-content");
  if (!tog || !dd) return;
  tog.classList.toggle("open");
  dd.classList.toggle("visible");
  if (dd.innerHTML === "") renderAssignOptions();
}

function renderAssignOptions(filter = "") {
  const dd = document.getElementById("dropdown-content");
  clearAssignDropdownContent(dd);
  const filteredContacts = contacts.filter((c) =>
    c.name.toLowerCase().includes(filter)
  );
  filteredContacts.forEach((c) => {
    const item = createContactDropdownItem(c, filter);
    dd.appendChild(item);
  });
}

function clearAssignDropdownContent(dd) {
  const nodes = Array.from(dd.childNodes).filter((n) => n.tagName !== "INPUT");
  nodes.forEach((n) => n.remove());
}

function createContactDropdownItem(contact, filter) {
  const item = document.createElement("div");
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

function isContactSelected(contact) {
  return selectedContacts.some((s) => s.name === contact.name);
}

function createProfileIcon(contact) {
  const span = document.createElement("span");
  span.className = "profile-icon";
  span.style.background = contact.color;
  span.textContent = getContactInitials(contact.name);
  return span;
}

function createContactName(contact) {
  const span = document.createElement("span");
  span.textContent = contact.name;
  return span;
}

function createContactCheckbox(contact) {
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = isContactSelected(contact);
  return checkbox;
}

function getContactInitials(name) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function setupContactCheckbox(item, contact, filter) {
  const checkbox = item.querySelector("input[type='checkbox']");
  checkbox.addEventListener("click", (event) => {
    event.stopPropagation();
    const idx = selectedContacts.findIndex((s) => s.name === contact.name);
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

function setupContactItemClick(item) {
  const checkbox = item.querySelector("input[type='checkbox']");
  item.addEventListener("click", (event) => {
    if (event.target.tagName.toLowerCase() === "input") return;
    event.stopPropagation();
    checkbox.checked = !checkbox.checked;
    const clickEvent = new Event("click", { bubbles: true });
    checkbox.dispatchEvent(clickEvent);
  });
}

function updateSelectedContactsUI() {
  const box = document.getElementById("selected-contacts");
  if (!box) return;
  box.innerHTML = "";
  selectedContacts.forEach((c) => {
    const el = document.createElement("div");
    el.className = "profile-icon";
    el.style.background = c.color;
    el.textContent = getContactInitials(c.name);
    box.appendChild(el);
  });
}

function closeDropdown() {
  document.getElementById("dropdown-content")?.classList.remove("visible");
  document.getElementById("dropdown-toggle")?.classList.remove("open");
}

function toggleCategoryDropdown(event) {
  event.stopPropagation();
  const toggle = document.getElementById("category-toggle");
  const content = document.getElementById("category-content");
  toggle.classList.toggle("open");
  content.classList.toggle("visible");
  if (content.innerHTML.trim() === "") renderCategoryOptions();
}

function renderCategoryOptions() {
  const content = document.getElementById("category-content");
  clearCategoryContent(content);
  const categories = getCategoryList();
  categories.forEach(category => {
    const item = createCategoryDropdownItem(category, content);
    content.appendChild(item);
  });
}

function clearCategoryContent(content) {
  content.innerHTML = "";
}

function getCategoryList() {
  return ["Technical Task", "User Story"];
}

function createCategoryDropdownItem(category, content) {
  const item = document.createElement("div");
  item.className = "dropdown-item category-item";
  item.innerHTML = `<span class="category-name">${category}</span>`;
  item.onclick = () => {
    handleCategoryClick(category, content);
  };
  return item;
}

function handleCategoryClick(category, content) {
  selectCategory(category);
  content.classList.remove("visible");
  document.getElementById("category-toggle").classList.remove("open");
  updateSubmitState();
}

function selectCategory(category) {
  selectedCategory = category;
  const placeholder = document.querySelector("#category-toggle span");
  if (placeholder) placeholder.textContent = category;
}


function addSubtask() {
  const input = document.getElementById("subtask-input");
  const subtaskIcons = document.getElementById("subtask-icons");
  const text = input.value.trim();
  if (!validateSubtaskInput(text, subtaskIcons, input)) return;
  subtasks.push(text);
  const li = createSubtaskListItem(text);
  document.getElementById("subtask-list").appendChild(li);
  finalizeSubtaskInput(input, subtaskIcons);
}

function validateSubtaskInput(text, subtaskIcons, input) {
  if (!text || subtaskIcons.classList.contains("hidden")) {
    input.classList.add("error-border");
    return false;
  }
  input.classList.remove("error-border");
  return true;
}

function createSubtaskListItem(text) {
  const li = document.createElement("li");
  li.className = "subtask-list-item";
  const label = document.createElement("span");
  label.textContent = text;
  label.className = "subtask-label";
  const iconWrapper = document.createElement("div");
  iconWrapper.className = "subtask-icons";
  li.appendChild(label);
  li.appendChild(iconWrapper);
  return li;
}

function finalizeSubtaskInput(input, subtaskIcons) {
  updateSubmitState();
  input.value = "";
  subtaskIcons.classList.add("hidden");
  const subtaskPlus = document.getElementById("subtask-plus");
  if (subtaskPlus) subtaskPlus.classList.remove("hidden");
}

function handleSubtaskEnter(e) {
  if (e.key === "Enter") {
    e.preventDefault();
    const subtaskIcons = document.getElementById("subtask-icons");
    if (subtaskIcons && !subtaskIcons.classList.contains("hidden")) {
      addSubtask();
    }
  }
}

function toggleSubtaskIcons() {
  const input = document.getElementById("subtask-input");
  const confirmIcon = document.getElementById("subtask-confirm");
  const defaultIcon = document.getElementById("subtask-plus");
  const cancelIcon = document.getElementById("subtask-cancel");
  const isActive = document.activeElement === input;
  confirmIcon?.classList.toggle("hidden", !isActive);
  cancelIcon?.classList.toggle("hidden", !isActive);
  defaultIcon?.classList.toggle("hidden", isActive);
}

function clearSubtaskInput() {
  const subtaskInput = document.getElementById("subtask-input");
  const subtaskIcons = document.getElementById("subtask-icons");
  const subtaskPlus = document.getElementById("subtask-plus");
  subtaskInput.value = "";
  subtaskIcons.classList.add("hidden");
  subtaskPlus.classList.remove("hidden");
}

function updateCategoryUI() {
  const box = document.getElementById("selected-category");
  if (!box) return;
  clearCategoryBox(box);
  if (selectedCategory) {
    const icon = createCategoryIcon(selectedCategory);
    box.appendChild(icon);
  }
}

function clearCategoryBox(box) {
  box.innerHTML = "";
}

function createCategoryIcon(category) {
  const div = document.createElement("div");
  div.className = "profile-icon";
  div.style.background = "#2a3647";
  div.textContent = getCategoryInitials(category);
  return div;
}

function getCategoryInitials(category) {
  return category
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

function validateForm() {
  const titleEl = document.getElementById("title");
  const dueDateEl = document.getElementById("dueDate");
  const categoryToggle = document.getElementById("category-toggle");

  const titleValid = isInputFilled(titleEl);
  const dueDateValid = isInputFilled(dueDateEl);
  const categoryValid = isCategorySelected();

  showTitleError(titleEl, titleValid);
  showDueDateError(dueDateEl, dueDateValid);
  showCategoryError(categoryToggle, categoryValid);

  return titleValid && dueDateValid && categoryValid;
}

function isInputFilled(inputEl) {
  return inputEl.value.trim() !== "";
}

function isCategorySelected() {
  return selectedCategory && selectedCategory.trim() !== "";
}

function showTitleError(titleEl, isValid) {
  const titleError = document.getElementById("error-title");
  titleEl.classList.toggle("error", !isValid);
  if (titleError) titleError.classList.toggle("visible", !isValid);
}

function showDueDateError(dueDateEl, isValid) {
  const dueDateError = document.getElementById("error-dueDate");
  dueDateEl.classList.toggle("error-border", !isValid);
  if (dueDateError) dueDateError.classList.toggle("visible", !isValid);
}

function showCategoryError(categoryToggle, isValid) {
  const categoryError = document.getElementById("error-category");
  categoryToggle.classList.toggle("error-border", !isValid);
  if (categoryError) categoryError.classList.toggle("visible", !isValid);
}

function updateSubmitState() {
  const button = document.getElementById("submit-task-btn");
  if (button) button.disabled = false;
}

function resetForm() {
  resetTitle();
  resetDescription();
  resetDueDate();
  resetPriority();
  resetContacts();
  resetCategory();
  resetSubtasks();
}

function resetTitle() {
  const title = document.getElementById("title");
  if (title) title.value = "";
}

function resetDescription() {
  const description = document.getElementById("description");
  if (description) description.value = "";
}

function resetDueDate() {
  const dueDate = document.getElementById("dueDate");
  if (dueDate) dueDate.value = "";
}

function resetPriority() {
  selectedPriority = "medium";
  selectPriority("medium");
}

function resetContacts() {
  selectedContacts = [];
  updateSelectedContactsUI();
}

function resetCategory() {
  selectedCategory = "";
  const categoryPlaceholder = document.querySelector("#category-toggle span");
  if (categoryPlaceholder) categoryPlaceholder.textContent = "Select category";
}

function resetSubtasks() {
  clearSubtasksArray();
  clearSubtasksList();
  clearSubtaskInput();
  hideSubtaskIcons();
  showSubtaskPlus();
}

function clearSubtasksArray() {
  subtasks.length = 0;
}

function clearSubtasksList() {
  const subtaskList = document.getElementById("subtask-list");
  if (subtaskList) subtaskList.innerHTML = "";
}

function clearSubtaskInput() {
  const subtaskInput = document.getElementById("subtask-input");
  if (subtaskInput) subtaskInput.value = "";
}

function hideSubtaskIcons() {
  const subtaskIcons = document.getElementById("subtask-icons");
  if (subtaskIcons) subtaskIcons.classList.add("hidden");
}

function showSubtaskPlus() {
  const subtaskPlus = document.getElementById("subtask-plus");
  if (subtaskPlus) subtaskPlus.classList.remove("hidden");
}

function setupDateValidation() {
  setTimeout(() => {
    const dateInput = document.getElementById("dueDate");
    const errorText = document.getElementById("error-dueDate");
    if (!dateInput || !errorText) return;
    setMinDateToday(dateInput);
    addDateInputListener(dateInput, errorText);
  }, 100);
}

function setMinDateToday(dateInput) {
  const today = new Date().toISOString().split("T")[0];
  dateInput.min = today;
}

function addDateInputListener(dateInput, errorText) {
  dateInput.addEventListener("input", () => {
    dateInput.classList.remove("error-border");
    errorText.classList.remove("visible");
  });
}

async function createTask() {
  if (!validateForm()) return;
  const task = buildTaskObject();
  await saveTaskToFirebase(task);
  closeAddTaskOverlay();
  await reloadAndHighlightNewTask();
}

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

function getInputValue(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : "";
}

async function saveTaskToFirebase(task) {
  await fetch(
    `${BASE_URL}${firebaseKey}/tasks.json`,
    {
      method: "POST",
      body: JSON.stringify(task),
    }
  );
}

async function reloadAndHighlightNewTask() {
  await loadTasks();
  setTimeout(() => {
    highlightLastCreatedTask();
  }, 100);
}

function highlightLastCreatedTask() {
  const lastTask = arrayTasks[arrayTasks.length - 1];
  if (lastTask && lastTask.firebaseKey) {
    lastCreatedTaskKey = lastTask.firebaseKey;
    updateHTML();
    setTimeout(() => {
      const newTaskEl = document.getElementById(lastCreatedTaskKey);
      if (newTaskEl) {
        newTaskEl.classList.remove("task-blink");
      }
      lastCreatedTaskKey = null;
    }, 2000);
  }
}

function setupEventListeners() {
  setupDropdownListeners();
  setupCategoryListeners();
  setupSubtaskInputListeners();
}

function setupDropdownListeners() {
  const dropdownToggle = document.getElementById("dropdown-toggle");
  if (dropdownToggle) {
    dropdownToggle.addEventListener("click", toggleAssignDropdown);
  }
  const dropdownContent = document.getElementById("dropdown-content");
  if (dropdownContent) {
    dropdownContent.addEventListener("click", e => e.stopPropagation());
  }
}

function setupCategoryListeners() {
  const categoryToggle = document.getElementById("category-toggle");
  if (categoryToggle) {
    categoryToggle.addEventListener("click", toggleCategoryDropdown);
  }
}

function setupSubtaskInputListeners() {
  const subtaskInput = document.getElementById("subtask-input");
  if (!subtaskInput) return;
  subtaskInput.addEventListener("input", showOrHideSubtaskIcons);
  subtaskInput.addEventListener("keydown", handleSubtaskEnter);
}

function showOrHideSubtaskIcons() {
  const input = document.getElementById("subtask-input");
  const iconWrapper = document.getElementById("subtask-icons");
  if (!input || !iconWrapper) return;
  if (input.value.trim().length > 0) {
    iconWrapper.classList.remove("hidden");
  } else {
    iconWrapper.classList.add("hidden");
  }
}

function initAddTaskOverlayLogic() {
  fetchContacts();
  setupEventListeners();
  setupDateValidation();
  resetForm();
}

function openMoveTaskMenu(taskKey, event) {
  event.stopPropagation();
  closeMoveTaskMenu();

  const btn = event.currentTarget;
  const card = btn.closest('.card');
  if (!card) return;

  const dropdown = createMoveTaskDropdownMenu(taskKey);
  positionMoveTaskDropdown(dropdown, btn, card);

  document.body.appendChild(dropdown);
  window._moveTaskDropdown = dropdown;

  addMoveTaskDropdownCleanup(dropdown);
}

function createMoveTaskDropdownMenu(taskKey) {
  const dropdown = document.createElement('div');
  dropdown.className = 'move-task-dropdown-menu';
  const statuses = [
    { key: 'todo', label: 'To do' },
    { key: 'progress', label: 'In progress' },
    { key: 'feedback', label: 'Await feedback' },
    { key: 'done', label: 'Done' }
  ];
  const currentTask = arrayTasks.find(t => t.firebaseKey === taskKey);
  const currentStatus = currentTask ? currentTask.status : null;

  statuses.forEach(s => {
    if (s.key === currentStatus) return;
    const option = document.createElement('div');
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

function positionMoveTaskDropdown(dropdown, btn, card) {
  const btnRect = btn.getBoundingClientRect();
  let left = btnRect.left + window.scrollX;
  let top = btnRect.bottom + window.scrollY + 4;
  if (left + 160 > window.innerWidth) left = window.innerWidth - 170;
  if (top + 180 > window.innerHeight + window.scrollY)
    top = btnRect.top + window.scrollY - 180;
  dropdown.style.left = left + 'px';
  dropdown.style.top = top + 'px';
}

function handleMoveTaskOptionClick(taskKey, statusKey) {
  currentDraggedElement = taskKey;
  moveTo(statusKey);
  closeMoveTaskMenu();
}

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

window.addEventListener('resize', closeMoveTaskMenu);