const BASE_URL = "https://join467-e19d8-default-rtdb.europe-west1.firebasedatabase.app/users/";

let arrayTasks = [];
let addTaskDefaultStatus = "todo";
let firebaseKey = localStorage.getItem("firebaseKey");
let lastCreatedTaskKey = null;
let currentDraggedElement;

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

/* ========== OPEN BOARD CARD OVERLAY ========== */
function openBoardCard(firebaseKey) {
  let boardOverlayRef = document.getElementById("board_overlay");
  let task = arrayTasks.find((t) => t.firebaseKey === firebaseKey);
  let categoryClass = "";
  if (task.category === "User Story") {
    categoryClass = "category-user";
  } else if (task.category === "Technical Task") {
    categoryClass = "category-technical";
  }
  document.getElementById("board_overlay").classList.remove("d-none");
  document.getElementById("html").style.overflow = "hidden";
  boardOverlayRef.innerHTML = getOpenBoardCardTemplate(categoryClass, task);
  // Animation: .open-Klasse nach kurzem Timeout immer hinzufügen
  setTimeout(() => {
    const card = document.querySelector('.board-overlay-card');
    if (card) {
      card.classList.add('open');
    }
  }, 10);
  updateHTML();
}

/* ========== GENERATE BOARD CARD OVERLAY HTML ========== */
function getOpenBoardCardTemplate(categoryClass, task) {
  let priorityIcon = "";
  if (task.priority && task.priority.toLowerCase() === "low") {
    priorityIcon = "./assets/icons/board/board-priority-low.svg";
  } else if (task.priority && task.priority.toLowerCase() === "medium") {
    priorityIcon = "./assets/icons/board/board-priority-medium.svg";
  } else if (task.priority && task.priority.toLowerCase() === "urgent") {
    priorityIcon = "./assets/icons/board/board-priority-urgent.svg";
  }
  return /*html*/ `
    <div id="board_overlay_card" class="board-overlay-card" data-firebase-key="${task.firebaseKey}" onclick="onclickProtection(event)">
      <div class="board-overlay-card-header edit-mode">
      <span id="overlay_card_category" class="overlay-card-category ${categoryClass}">${task.category}</span>
      <img class="board-close-icon " src="./assets/icons/board/board-close.svg" onclick="closeBoardCard()">
      </div>
      <span id="overlay_card_title" class="overlay-card-title">${task.title}</span>
      <span id="overlay_card_description" class="overlay-card-description">${task.description}</span>
      <span class="due-date-headline" id="due_date"><span class="overlay-headline-color">Due date:</span><span>${task.dueDate}</span></span>
      <span class="priority-headline"><span class="overlay-headline-color">Priority:</span>
      <span class="priority-container">${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}<img src="${priorityIcon}" alt="${task.priority}"/></span></span>
      <div class="assigned-list">
        <span class="assigned-to-headline overlay-headline-color">Assigned To:</span>
        ${Array.isArray(task.assignedTo)
      ? task.assignedTo.map(name => {
        const contact = getContactByName(name);
        if (!contact) return ''; // Nicht existierende Kontakte überspringen
        const color = contact.color || "#ccc";
        return `
                <div class="assigned-entry">
                  <span class="assigned-circle" style="background-color: ${color};">${getInitials(name)}</span>
                  <span class="assigned-name">${name}</span>
                </div>`;
      }).join("")
      : ""}
      </div>
      <div class="subtask-list">
        <span class="overlay-headline-color overlay-subtasks-label">Subtasks</span>
        <ul>
          ${Array.isArray(task.subtask)
      ? task.subtask.map((sub, idx) => {
        const title = typeof sub === 'string' ? sub : sub.title;
        const checked = typeof sub === 'object' && sub.completed ? 'checked' : '';
        const id = `subtask-${task.firebaseKey}-${idx}`;
        return `
            <div class="subtask-item">
              <input type="checkbox" id="${id}" ${checked} onchange="toggleSubtask('${task.firebaseKey}', ${idx})" />
              <label for="${id}">${title}</label>
            </div>`;
      }).join("")
      : ""}
        </ul>
      </div>
      <div id="overlay_card_footer" class="overlay-card-footer">
        <div id="delete_btn" class="delete-btn" onclick="deleteTask('${task.firebaseKey}')"><div class="delete-btn-icon"></div>Delete</div>
        <img id="seperator" src="./assets/icons/board/board-separator-icon.svg" alt="">
        <div id="edit_btn" class="edit-btn" onclick="editTask()"><div class="edit-btn-icon"></div>Edit</div>
        <div id="ok_btn" class="ok-btn d-none" onclick="saveEditTask('${task.firebaseKey}')">Ok
        <img src="./assets/icons/board/board-check.svg"</div>
      </div>
    </div>`;
}

/* ========== GENERATE PRIORITY BUTTONS HTML (OVERLAY EDIT MODE) ========== */
function getPriorityButtonsHTML(currentPriority) {
  const priorities = [
    { value: 'urgent', label: 'Urgent', icon: './assets/icons/board/board-priority-urgent.svg' },
    { value: 'medium', label: 'Medium', icon: './assets/icons/board/board-priority-medium.svg' },
    { value: 'low', label: 'Low', icon: './assets/icons/board/board-priority-low.svg' }
  ];
  return priorities.map(p => `
    <button 
      type="button" 
      class="priority-edit-btn${currentPriority === p.value ? ' selected' : ''}" 
      data-priority="${p.value}" 
      onclick="selectOverlayPriority('${p.value}', this)">
      ${p.label} <img src="${p.icon}" alt="${p.label}" />
    </button>
  `).join('');
}

/* ========== SELECT PRIORITY IN BOARD CARD OVERLAY EDIT MODE ========== */
function selectOverlayPriority(priority, btn) {
  document.querySelectorAll('.priority-edit-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  document.getElementById('priority-edit-buttons').dataset.selectedPriority = priority;
}


/* ========== TOGGLE SUBTASK COMPLETION & UPDATE FIREBASE ========== */
async function toggleSubtask(taskKey, index) {
  let task = arrayTasks.find(t => t.firebaseKey === taskKey);
  if (!task || !Array.isArray(task.subtask)) return;
  // Convert string subtasks to objects for backward compatibility
  task.subtask = task.subtask.map(sub => typeof sub === 'string' ? { title: sub, completed: false } : sub);
  // Toggle the completed flag
  task.subtask[index].completed = !task.subtask[index].completed;
  try {
    // Persist updated subtasks array to Firebase
    await fetch(`${BASE_URL}${firebaseKey}/tasks/${taskKey}/subtask.json`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(task.subtask)
    });
    const boardOverlayRef = document.getElementById("board_overlay");
    // const task = arrayTasks.find(t => t.firebaseKey === taskKey); // task already defined above
    if (boardOverlayRef && task) {
      updateHTML();
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
      // Fokus von der Checkbox entfernen
      setTimeout(() => {
        const checkboxId = `subtask-${taskKey}-${index}`;
        const checkbox = document.getElementById(checkboxId);
        if (checkbox) checkbox.blur();
      }, 0);
    }
  } catch (error) {
    console.error("Fehler beim Aktualisieren des Subtasks:", error);
  }
}

/* ========== CLOSE BOARD CARD OVERLAY ========== */
function closeBoardCard() {
  if (window._assignedDropdownCleanup) window._assignedDropdownCleanup();
  const card = document.querySelector('.board-overlay-card');
  if (card) {
    card.classList.remove('open');
    setTimeout(() => {
      document.getElementById("board_overlay").classList.add("d-none");
      document.getElementById("html").style.overflow = "";
      // Remove labels if they exist
      let titleLabel = document.getElementById("overlay_card_title_label");
      if (titleLabel) titleLabel.remove();
      let descLabel = document.getElementById("overlay_card_description_label");
      if (descLabel) descLabel.remove();
      updateHTML();
    }, 400);
  } else {
    document.getElementById("board_overlay").classList.add("d-none");
    document.getElementById("html").style.overflow = "";
    let titleLabel = document.getElementById("overlay_card_title_label");
    if (titleLabel) titleLabel.remove();
    let descLabel = document.getElementById("overlay_card_description_label");
    if (descLabel) descLabel.remove();
    updateHTML();
  }
}

/* ========== OVERLAY CLICK PROTECTION ========== */
function onclickProtection(event) {
  event.stopPropagation();
}

/* ========== EDIT TASK IN OVERLAY ========== */
function editTask() {
  document.getElementById("ok_btn").classList.remove("d-none");
  document.getElementById("delete_btn").classList.add("d-none");
  document.getElementById("edit_btn").classList.add("d-none");
  document.getElementById("seperator").classList.add("d-none");
  document.getElementById("overlay_card_category").classList.add("d-none");
  document.getElementById("board_overlay_card").classList.add("board-overlay-card-edit");
  document.getElementById("overlay_card_title").contentEditable = "true";
  document.getElementById("overlay_card_description").contentEditable = "true";

  // Insert label "Title" above the editable title
  let titleElement = document.getElementById("overlay_card_title");
  if (!document.getElementById("overlay_card_title_label")) {
    let titleLabel = document.createElement("span");
    titleLabel.textContent = "Title";
    titleLabel.id = "overlay_card_title_label";
    titleLabel.className = "overlay-card-label";
    titleElement.parentNode.insertBefore(titleLabel, titleElement);
  }
  // Insert label "Description" above the editable description
  let descElement = document.getElementById("overlay_card_description");
  if (!document.getElementById("overlay_card_description_label")) {
    let descLabel = document.createElement("span");
    descLabel.textContent = "Description";
    descLabel.id = "overlay_card_description_label";
    descLabel.className = "overlay-card-label";
    descElement.parentNode.insertBefore(descLabel, descElement);
  }

  // ==== HIER kommt dein neues Due Date Label ====
  let dueDateSpan = document.getElementById("due_date");
  if (dueDateSpan && !document.getElementById("due_date_input")) {
    // Aktuelles Datum extrahieren
    let match = dueDateSpan.innerText.match(/(\d{2}\/\d{2}\/\d{4}|\d{4}-\d{2}-\d{2})/);
    let currentDueDate = match ? match[0] : "";
    let formattedDate = "";
    if (currentDueDate.match(/\d{2}\/\d{2}\/\d{4}/)) {
      let [d, m, y] = currentDueDate.split("/");
      formattedDate = `${y}-${m}-${d}`;
    } else {
      formattedDate = currentDueDate;
    }
    // Neues Label erzeugen
    if (!document.getElementById("overlay_card_due_date_label")) {
      let dueLabel = document.createElement("span");
      dueLabel.textContent = "Due Date";
      dueLabel.id = "overlay_card_due_date_label";
      dueLabel.className = "overlay-card-label";
      dueDateSpan.parentNode.insertBefore(dueLabel, dueDateSpan);
    }
    // Input erzeugen und ersetzen
    let input = document.createElement("input");
    input.type = "date";
    input.id = "due_date_input";
    input.className = "overlay-card-date-input";
    input.value = formattedDate;
    dueDateSpan.innerHTML = "";
    dueDateSpan.appendChild(input);
  }

  // Priority bearbeiten
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

  // Custom Dropdown für "Assigned To"
  const assignedListContainer = document.querySelector('.assigned-list');
  if (assignedListContainer && !document.getElementById('assigned-dropdown')) {
    assignedListContainer.innerHTML = '';
    // Label
    const labelA = document.createElement('span');
    labelA.textContent = 'Assigned to';
    labelA.className = 'overlay-card-label';
    assignedListContainer.appendChild(labelA);

    // Dropdown-Toggle
    const dropdown = document.createElement('div');
    dropdown.id = 'assigned-dropdown';
    dropdown.className = 'assigned-dropdown';

    // Dropdown-Liste
    const list = document.createElement('div');
    list.id = 'assigned-dropdown-list';
    list.className = 'assigned-dropdown-list'; // entferne zusätzliche Klassen
    list.classList.remove('open'); // diese Zeile sicherheitshalber beibehalten

    const toggle = document.createElement('div');
    toggle.className = 'assigned-dropdown-toggle';
    // Ersetze onclick durch robusten EventListener mit Outside-Handling, nur einmal registrieren!
    if (!toggle._dropdownClickHandlerAdded) {
      toggle.addEventListener('click', function (event) {
        event.stopPropagation();
        const isOpen = list.classList.contains('open');
        closeAllDropdowns(); // schließt andere ggf. offene Dropdowns
        if (!isOpen) {
          list.classList.add('open');
        }
      });
      toggle._dropdownClickHandlerAdded = true;
    }

    // Hilfsfunktion zum Schließen aller Dropdowns
    function closeAllDropdowns() {
      document.querySelectorAll('.assigned-dropdown-list.open').forEach(el => {
        el.classList.remove('open');
      });
    }

    // Outside-Click-Handler nur einmal global hinzufügen
    if (!window._assignedDropdownClickHandler) {
      document.addEventListener('click', function (event) {
        // Finde alle offenen Dropdowns und schließe, wenn außerhalb geklickt wurde
        document.querySelectorAll('.assigned-dropdown').forEach(dropdown => {
          const list = dropdown.querySelector('.assigned-dropdown-list');
          if (list && list.classList.contains('open') && !dropdown.contains(event.target)) {
            list.classList.remove('open');
          }
        });
      });
      window._assignedDropdownClickHandler = true;
    }

    const placeholder = document.createElement('span');
    placeholder.id = 'assigned-placeholder';
    placeholder.textContent = 'Select contacts to assign';

    const arrow = document.createElement('span');
    arrow.className = 'dropdown-arrow';

    toggle.appendChild(placeholder);
    toggle.appendChild(arrow);

    dropdown.appendChild(toggle);
    dropdown.appendChild(list);
    assignedListContainer.appendChild(dropdown);

    // Kontakte aus localStorage holen
    const userKey = localStorage.getItem('firebaseKey');
    const usersData = JSON.parse(localStorage.getItem('firebaseUsers')) || {};
    const contacts = Object.values(usersData[userKey]?.contacts || {});
    const taskKey = document.getElementById('board_overlay_card').dataset.firebaseKey;
    const task = arrayTasks.find(t => t.firebaseKey === taskKey);
    let selectedContacts = [...(task.assignedTo || [])];



    function toggleContact(name) {
      if (selectedContacts.includes(name)) {
        selectedContacts = selectedContacts.filter(n => n !== name);
      } else {
        selectedContacts.push(name);
      }
      renderAssignedDropdown();
      // Outside-Click schließt Dropdown
      function handleDropdownClickOutside(e) {
        const dropdown = document.getElementById('assigned-dropdown');
        if (dropdown && !dropdown.contains(e.target)) {
          list.classList.remove('open');
        }
      }
      document.addEventListener('mousedown', handleDropdownClickOutside);

      // Cleanup-Funktion merken, um Event Listener später zu entfernen
      if (!window._assignedDropdownCleanup) {
        window._assignedDropdownCleanup = () => {
          document.removeEventListener('mousedown', handleDropdownClickOutside);
        };
      }
    }

    function renderAssignedDropdown() {
      list.innerHTML = '';
      contacts.forEach(contact => {
        const initials = getInitials(contact.name);
        const isChecked = selectedContacts.includes(contact.name);

        const item = document.createElement('div');
        item.className = 'assigned-item' + (isChecked ? ' selected' : '');
        item.onclick = () => toggleContact(contact.name);

        const circle = document.createElement('span');
        circle.className = 'assigned-circle';
        circle.style.backgroundColor = contact.color || '#ccc';
        circle.textContent = initials;

        const name = document.createElement('span');
        name.className = 'assigned-name';
        name.textContent = contact.name;

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'assigned-checkbox';
        checkbox.checked = isChecked;
        checkbox.onclick = (e) => {
          e.stopPropagation();
          toggleContact(contact.name);
        };

        item.appendChild(circle);
        item.appendChild(name);
        item.appendChild(checkbox);

        list.appendChild(item);
      });
      // Placeholder immer gleich lassen
      placeholder.textContent = 'Select contacts to assign';
      // Reihenfolge: Erst Dropdown, dann Kreise!
      // Wichtig: assignedListContainer.appendChild(dropdown) wurde bereits vor dem ersten renderAssignedSelectedCircles aufgerufen.
      renderAssignedSelectedCircles();
      // --- Entferne automatisches Öffnen des Dropdowns beim Rendern ---
      // entfernt: list.classList.add('open'); // Dropdown soll initial geschlossen bleiben!
    }

    // Funktion zum Rendern der ausgewählten Kreise (NEU gemäß Vorgabe)
    function renderAssignedSelectedCircles() {
      let wrapper = document.getElementById('assigned-selected-circles');
      if (!wrapper) {
        wrapper = document.createElement('div');
        wrapper.id = 'assigned-selected-circles';
        wrapper.className = 'selected-initials-wrapper';
        // WICHTIG: Nicht als Kind von dropdown/list, sondern direkt NACH dropdown!
        assignedListContainer.appendChild(wrapper);
      } else {
        // Falls wrapper aktuell NICHT direkt nach dropdown steht, positioniere es um
        const dropdown = document.getElementById('assigned-dropdown');
        if (dropdown && wrapper.previousSibling !== dropdown) {
          assignedListContainer.insertBefore(wrapper, dropdown.nextSibling);
        }
      }
      // Sichtbarkeit abhängig von ausgewählten Kontakten
      if (selectedContacts.length === 0) {
        wrapper.style.display = "none";
        return;
      } else {
        wrapper.style.display = "flex";
      }
      wrapper.innerHTML = '';
      selectedContacts.forEach(name => {
        const contact = contacts.find(c => c.name === name);
        if (!contact) return; // ausgelöschte Kontakte überspringen
        const initials = getInitials(contact.name);
        const color = contact.color || '#ccc';
        const div = document.createElement('div');
        div.className = 'initial-circle';
        div.style.backgroundColor = color;
        div.textContent = initials;
        wrapper.appendChild(div);
      });
    }

    // Update Save/Edit Logik (AssignedTo für saveEditTask)
    assignedListContainer.dataset.selectedContacts = JSON.stringify(selectedContacts);
    renderAssignedDropdown();

    // Save Selected auf global speichern, damit saveEditTask das findet
    window.getAssignedOverlaySelection = () => selectedContacts;
  }

  // === Subtasks Edit: Input-Feld & Listendarstellung wie Screenshot ===
  const subtaskList = document.querySelector('.subtask-list ul');
  if (subtaskList && !document.getElementById('subtasks-edit-container')) {
    // Container für Subtasks-Edit
    const container = document.createElement('div');
    container.id = 'subtasks-edit-container';
    container.className = 'subtasks-edit-container';

    // Inputfeld und + Button oben wie im Screenshot
    const inputWrapper = document.createElement('div');
    inputWrapper.className = 'subtask-input-wrapper';

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Add new subtask';
    input.id = 'add-subtask-input';
    input.className = 'add-subtask-input';

    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.id = 'add-subtask-btn';
    addBtn.textContent = '+';
    addBtn.className = 'add-subtask-btn';

    inputWrapper.appendChild(input);
    inputWrapper.appendChild(addBtn);
    container.appendChild(inputWrapper);

    // Bestehende Subtasks auslesen
    const taskKey = document.getElementById('board_overlay_card').dataset.firebaseKey;
    const task = arrayTasks.find(t => t.firebaseKey === taskKey);
    let subtasks = Array.isArray(task.subtask) ? task.subtask : [];

    // NEUE renderSubtasksList-Funktion und Initialaufruf gemäß Instruktion
    function renderSubtasksList(subtaskArr) {
      let listDiv = document.getElementById('subtask-list-edit');
      if (!listDiv) {
        listDiv = document.createElement('div');
        listDiv.id = 'subtask-list-edit';
        container.appendChild(listDiv);
      }
      listDiv.innerHTML = '';
      subtaskArr.forEach((sub, idx) => {
        const row = document.createElement('div');
        row.className = 'subtask-list-row';

        // Sofort als Inputfeld anzeigen
        const input = document.createElement('input');
        input.type = 'text';
        input.value = typeof sub === 'string' ? sub : sub.title;
        input.className = 'subtask-list-editinput';
        input.readOnly = true; // Input zunächst nicht editierbar

        // Funktion für Editieren (Input aktivieren und fokussieren)
        function activateEdit() {
          input.readOnly = false;
          input.focus();
          // Markiere den Text (optional)
          input.setSelectionRange(0, input.value.length);
        }

        input.onblur = () => {
          if (input.value.trim() !== '') {
            subtaskArr[idx].title = input.value.trim();
          }
          input.readOnly = true; // Nach Bearbeitung wieder nicht editierbar
        };
        input.onkeydown = (e) => {
          if (e.key === 'Enter') input.blur();
        };

        // Löschen-Button
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'subtask-remove-btn';
        removeBtn.innerHTML = `<img src="assets/icons/board/board-delete-icon.svg">`;
        removeBtn.onclick = (e) => {
          e.preventDefault();
          subtaskArr.splice(idx, 1);
          renderSubtasksList(subtaskArr);
        };

        // Edit-Button (Stift)
        const editBtn = document.createElement('button');
        editBtn.type = 'button';
        editBtn.className = 'subtask-edit-btn';
        editBtn.innerHTML = `<img src="assets/icons/board/board-edit-icon.svg">`;
        editBtn.title = 'Bearbeiten';
        editBtn.onclick = (e) => {
          e.preventDefault();
          activateEdit();
        };

        const dot = document.createElement('span');
        dot.className = 'subtask-dot';
        dot.textContent = '•';

        row.appendChild(dot);
        row.appendChild(input);
        row.appendChild(editBtn);
        row.appendChild(removeBtn);

        listDiv.appendChild(row);
      });
    }
    renderSubtasksList(subtasks);

    // Beim Klick auf + neuen Subtask zur Liste hinzufügen
    addBtn.onclick = () => {
      const val = input.value.trim();
      if (val) {
        subtasks.push({ title: val, completed: false });
        renderSubtasksList(subtasks);
        input.value = '';
      }
    };

    // Im UI einfügen (anstelle alter .subtask-list ul)
    subtaskList.innerHTML = '';
    subtaskList.appendChild(container);

    // Speichern-Hook (für saveEditTask): Aktuelle Subtask-Liste global speichern
    window.getEditedSubtasks = () => subtasks;
  }
}

/* ========== EDIT TASK IN FIREBASE ========== */
/* ========== SAVE EDITED TASK IN FIREBASE ========== */
async function saveEditTask(taskKey) {
  let task = arrayTasks.find(t => t.firebaseKey === taskKey);
  if (!task) {
    console.warn("Task nicht gefunden für ID:", taskKey);
    return;
  }

  document.getElementById("overlay_card_title").contentEditable = "false";
  document.getElementById("overlay_card_description").contentEditable = "false";
  document.getElementById("due_date").contentEditable = "false";
  // Remove labels if they exist
  let titleLabel = document.getElementById("overlay_card_title_label");
  if (titleLabel) titleLabel.remove();
  let descLabel = document.getElementById("overlay_card_description_label");
  if (descLabel) descLabel.remove();

  // Priority aus dem Edit-Block holen
  let newPriority = task.priority;
  const priorityWrapper = document.getElementById('priority-edit-buttons');
  if (priorityWrapper && priorityWrapper.dataset.selectedPriority) {
    newPriority = priorityWrapper.dataset.selectedPriority;
  }

  const newTitle = document.getElementById("overlay_card_title").innerHTML;
  const newDescription = document.getElementById("overlay_card_description").innerHTML;

  let dueDateInput = document.getElementById("due_date_input");
  let newDueDate = "";
  if (dueDateInput) {
    // YYYY-MM-DD zu DD/MM/YYYY konvertieren
    let [y, m, d] = dueDateInput.value.split("-");
    if (y && m && d) {
      newDueDate = `${d}/${m}/${y}`;
    }
  } else {
    // Fallback, falls kein Input vorhanden
    const rawDueDate = document.getElementById("due_date").innerHTML;
    const match = rawDueDate.match(/(\d{2}\/\d{2}\/\d{4}|\d{4}-\d{2}-\d{2})/);
    newDueDate = match ? match[0] : ""; xw
  }

  // Assigned To aus Custom Dropdown holen
  let newAssignedTo = task.assignedTo;
  if (typeof window.getAssignedOverlaySelection === 'function') {
    newAssignedTo = window.getAssignedOverlaySelection();
  }

  // Subtasks aus Input-Liste wie im Screenshot holen
  let newSubtasks = [];
  if (typeof window.getEditedSubtasks === 'function') {
    newSubtasks = window.getEditedSubtasks();
  } else if (task.subtask) {
    newSubtasks = task.subtask;
  }

  const updatedTask = {
    ...task,
    title: newTitle,
    description: newDescription,
    dueDate: newDueDate,
    priority: newPriority,
    assignedTo: newAssignedTo,
    subtask: newSubtasks
  };

  try {
    await fetch(`${BASE_URL}${firebaseKey}/tasks/${task.firebaseKey}.json`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(updatedTask)
    });

    // Lokales Array aktualisieren
    arrayTasks = arrayTasks.map(t => t.firebaseKey === taskKey ? updatedTask : t);
    updateHTML();
    // Overlay mit aktualisierten Daten neu laden (direkter Aufruf)
    openBoardCard(taskKey);
  } catch (error) {
    console.error("Fehler beim Bearbeiten des Tasks:", error);
  }
}

/* ========== SEARCH TASKS FUNCTION ========== */
function searchTask() {
  let inputFindTaskRef = document.getElementById("input_find_task");
  let inputValue = inputFindTaskRef.value.trim().toLowerCase();

  let foundTasks = arrayTasks.filter(task => {
    let titleMatch = task.title && task.title.toLowerCase().includes(inputValue);
    let descriptionMatch = task.description && task.description.toLowerCase().includes(inputValue);
    return titleMatch || descriptionMatch;
  });

  if (foundTasks.length > 0) {
    console.log("Gefundene Tasks:", foundTasks);
    const sections = ["todo", "progress", "feedback", "done"];
    sections.forEach(section => {
      document.getElementById(section).innerHTML = "";
    });

    for (let task of foundTasks) {
      if (sections.includes(task.status)) {
        document.getElementById(task.status).innerHTML += generateTodoHTML(task);
      }
    }
  } else {
    const sections = ["todo", "progress", "feedback", "done"];
    sections.forEach(section => {
      document.getElementById(section).innerHTML = "";
    });
    console.log("Keine Tasks gefunden mit dem Suchbegriff:", inputValue);
  }
}

/* ========== OPEN ADD TASK OVERLAY FOR STATUS ========== */
function openAddTaskForStatus(status) {
  addTaskDefaultStatus = status;
  openAddTaskOverlay();
}

/* ========== OPEN ADD TASK OVERLAY ========== */
function openAddTaskOverlay() {
  let addTaskOverlayRef = document.getElementById("add_task_overlay");
  document.getElementById("add_task_overlay").classList.remove("d-none");
  // Add modal open animation after rendering
  setTimeout(() => {
    const modal = document.querySelector('.board-add-task-modal');
    if (modal) modal.classList.add('open');
  }, 10);
  document.getElementById("html").style.overflow = "hidden";

  addTaskOverlayRef.innerHTML = getAddTaskOverlay();
  updateHTML();

  // Add click outside listener after overlay is open
  setTimeout(() => {
    document.addEventListener('mousedown', handleAddTaskOverlayClickOutside);
  }, 0);

  initAddTaskOverlayLogic();
}

/* ========== CLOSE ADD TASK OVERLAY ========== */
function closeAddTaskOverlay() {
  const modal = document.querySelector('.board-add-task-modal');
  if (modal) {
    modal.classList.remove('open');
    setTimeout(() => {
      let overlay = document.getElementById("add_task_overlay");
      if (overlay) {
        overlay.classList.add("d-none");
        document.getElementById("html").style.overflow = "";
        overlay.innerHTML = "";
      }
    }, 400); // exakt so lang wie die CSS-Transition!
  } else {
    let overlay = document.getElementById("add_task_overlay");
    if (overlay) {
      overlay.classList.add("d-none");
      document.getElementById("html").style.overflow = "";
      overlay.innerHTML = "";
    }
  }
  addTaskDefaultStatus = "todo";
  document.removeEventListener('mousedown', handleAddTaskOverlayClickOutside);
}

/* ========== HANDLE CLICK OUTSIDE ADD TASK OVERLAY ========== */
function handleAddTaskOverlayClickOutside(event) {
  const modal = document.querySelector('.board-add-task-modal');
  if (!modal) return;
  if (!modal.contains(event.target)) {
    closeAddTaskOverlay();
  }
}

/* ========== GENERATE ADD TASK OVERLAY HTML ========== */
function getAddTaskOverlay() {
  return `          <div class="board-add-task-modal">
            <div class="board-add-task-header">
            <h1 class="h1-add-task">Add Task</h1>
            <img class="board-close-icon" src="./assets/icons/board/board-close.svg" onclick="closeAddTaskOverlay()">
             </div>
            <form id="task-form" onsubmit="return false;">
              <div class="form-cols">
                <!-- linke Spalte -->
                <div class="col-left">
                  <label for="title"
                    >Title <span class="red_star">*</span></label
                  >
                  <input
                    id="title"
                    type="text"
                    placeholder="Enter a title"
                    onkeyup="updateSubmitState()"
                  />
                  <div class="error-message" id="error-title">
                    This field is required
                  </div>

                  <label for="description">Description</label>
                  <textarea
                    id="description"
                    placeholder="Enter a description"
                  ></textarea>

                  <label for="dueDate"
                    >Due Date <span class="red_star">*</span></label
                  >
                  <div class="date-input-wrapper">
                    <input
                      id="dueDate"
                      class="overlay-card-date-input"
                      type="date"
                      placeholder="dd/mm/yyyy"
                    />
                    
                  </div>
                  <div class="error-message" id="error-dueDate">
                    This field is required
                  </div>
                </div>

                <!-- mittlerer Separator -->
                <div class="add_task_mid_box"></div>

                <!-- rechte Spalte -->
                <div class="col-right">
                  <label>Priority</label>
                  <div id="buttons-prio" class="priority-buttons">
                    <button
                      type="button"
                      data-prio="urgent"
                      onclick="selectPriority('urgent')"
                    >
                      Urgent <img src="./assets/icons/add-task/add-task-urgent.svg" alt="" />
                    </button>
                    <button
                      type="button"
                      data-prio="medium"
                      class="selected"
                      onclick="selectPriority('medium')"
                    >
                      Medium <img src="./assets/icons/add-task/add-task-medium.svg" alt="" />
                    </button>
                    <button
                      type="button"
                      data-prio="low"
                      onclick="selectPriority('low')"
                    >
                      Low <img src="./assets/icons/add-task/add-task-low.svg" alt="">
                    </button>
                  </div>
                  <div class="error-message" id="error-priority">
                    This field is required
                  </div>

                  <label>Assigned to</label>
                  <div class="custom-dropdown-wrapper" id="dropdown-wrapper">
                    <div id="dropdown-toggle" tabindex="0" role="button">
                      <input
                        id="assigned-to-input"
                        type="text"
                        placeholder="Select contacts"
                        oninput="handleAssignedToInput(event)"
                        onclick="handleAssignedToClick(event)"
                      />
                      <div class="dropdown-arrow"></div>
                    </div>
                    <div id="dropdown-content" class="dropdown-content"></div>
                  </div>
                  <div id="selected-contacts" class="selected-contacts"></div>
                  <div class="error-message" id="error-assignedTo">
                    This field is required
                  </div>

                  <label>Category <span class="red_star">*</span></label>
                  <div class="custom-dropdown-wrapper" id="category-wrapper">
                    <div id="category-toggle">
                      <span id="selected-category-placeholder"
                        >Select category</span
                      >
                      <div id="category-arrow" class="dropdown-arrow"></div>
                    </div>
                    <div id="category-content"></div>
                  </div>
                  <input type="hidden" id="category" value="" />
                  <div class="error-message" id="error-category">
                    This field is required
                  </div>

                  <label>Subtasks</label>
                  <div class="subtask-input-container">
                    <div class="subtasks-container">
                      <div class="subtask-input-wrapper">
                        <div class="subtask-input-field">
                          <input
                            id="subtask-input"
                            type="text"
                            placeholder="Add new subtask"
                            onfocus="toggleSubtaskIcons()"
                            oninput="toggleSubtaskIcons()"
                            onkeydown="handleSubtaskEnter(event)"
                          />
                          <div id="subtask-icons" class="subtask-icons hidden">
                            <img
                              id="subtask-cancel"
                              src="./assets/icons/add-task/add-task-closeXSymbol.svg"
                              alt="Cancel"
                              onclick="clearSubtaskInput()"
                            />
                            <div class="divider"></div>
                            <img
                              id="subtask-confirm"
                              src="./assets/icons/add-task/add-task-checked.svg"
                              alt="Confirm"
                              onclick="addSubtask()"
                            />
                          </div>
                          <img
                            id="subtask-plus"
                            class="subtask-plus"
                            src="./assets/icons/add-task/add-task-add+symbol.svg"
                            alt="Add"
                            onclick="toggleSubtaskIcons()"
                          />
                        </div>
                      </div>

                      <ul id="subtask-list" class="subtask-list"></ul>
                    </div>
                  </div>
                </div>
              </div>
              <div class="form-actions">
              <p class="legend-required">
                <span class="red_star">*</span>This field is required
              </p>
                <button id="cancel-task-btn" type="button" onclick="closeAddTaskOverlay()">Cancel</button>
                <button
                  id="submit-task-btn"
                  type="button"
                  onclick="createTask()"
                >
                  Create Task
                  <img class="add-task-icon" src="./assets/icons/add-task/add-task-check.svg" alt="">
                </button>
              </div>
            </form>
          </div>`;
}
// ==== STATE & HELPERS (Add-Task-Funktionalität) ====
// Diese Blöcke stammen aus add-task.js und sind für das Add-Task-Modal im Board nötig.
/* ========== ADD TASK STATE ========== */
let selectedPriority = "medium";
const subtasks = [];
let contacts = [];
let selectedContacts = [];
let selectedCategory = "";

// Globaler EventListener zum Schließen des Dropdowns bei Klick außerhalb
/* ========== CLOSE DROPDOWNS ON OUTSIDE CLICK (ADD TASK) ========== */
document.addEventListener("mousedown", function (event) {
  const dropdown = document.getElementById("dropdown-content");
  const toggle = document.getElementById("dropdown-toggle");

  if (dropdown && toggle) {
    const isClickInside = dropdown.contains(event.target) || toggle.contains(event.target);
    if (!isClickInside) {
      dropdown.classList.remove("visible");
      toggle.classList.remove("open");
    }
  }

  // Category-Dropdown: Schließen wenn außerhalb geklickt wird
  const catDropdown = document.getElementById("category-content");
  const catToggle = document.getElementById("category-toggle");
  if (catDropdown && catToggle) {
    const isCatClickInside = catDropdown.contains(event.target) || catToggle.contains(event.target);
    if (!isCatClickInside) {
      catDropdown.classList.remove("visible");
      catToggle.classList.remove("open");
    }
  }
});

/* ========== SELECT PRIORITY (ADD TASK) ========== */
function selectPriority(prio) {
  selectedPriority = prio;
  document.querySelectorAll("#buttons-prio button").forEach((b) => {
    b.classList.toggle("selected", b.dataset.prio === prio);
  });
  updateSubmitState();
}

/* ========== ASSIGNED TO DROPDOWN HANDLERS (ADD TASK) ========== */
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
  // Hintergrund setzen, wenn ausgewählt
  if (selectedContacts.some((s) => s.name === contact.name)) {
    item.classList.add('contact-selected');
  }
  item.innerHTML = `
    <span class="profile-icon" style="background:${contact.color}">
      ${getContactInitials(contact.name)}
    </span>
    <span>${contact.name}</span>
    <input type="checkbox" ${selectedContacts.some((s) => s.name === contact.name) ? "checked" : ""
    }/>
  `;
  setupContactCheckbox(item, contact, filter);
  setupContactItemClick(item);
  return item;
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

/* ========== CATEGORY DROPDOWN HANDLERS (ADD TASK) ========== */
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
  content.innerHTML = "";
  const categories = ["Technical Task", "User Story"];
  categories.forEach((category) => {
    const item = document.createElement("div");
    item.className = "dropdown-item category-item";
    item.innerHTML = `<span class="category-name">${category}</span>`;
    item.onclick = () => {
      selectCategory(category);
      content.classList.remove("visible");
      document.getElementById("category-toggle").classList.remove("open");
      updateSubmitState();
    };
    content.appendChild(item);
  });
}
function selectCategory(category) {
  selectedCategory = category;
  const placeholder = document.querySelector("#category-toggle span");
  if (placeholder) placeholder.textContent = category;
}

/* ========== SUBTASKS HANDLERS (ADD TASK) ========== */
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

// Kategorie-UI für Chip (optional)
/* ========== UPDATE CATEGORY UI CHIP (OPTIONAL) ========== */
function updateCategoryUI() {
  const box = document.getElementById("selected-category");
  if (!box) return;
  box.innerHTML = "";
  if (selectedCategory) {
    const el = document.createElement("div");
    el.className = "profile-icon";
    el.style.background = "#2a3647";
    el.textContent = selectedCategory
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase();
    box.appendChild(el);
  }
}

/* ========== FORM VALIDATION & RESET (ADD TASK) ========== */
function validateForm() {
  const titleEl = document.getElementById("title");
  const dueDateEl = document.getElementById("dueDate");
  const categoryToggle = document.getElementById("category-toggle");
  const titleError = document.getElementById("error-title");
  const dueDateError = document.getElementById("error-dueDate");
  const categoryError = document.getElementById("error-category");
  const title = titleEl.value.trim();
  const dueDate = dueDateEl.value.trim();
  const category = selectedCategory;
  const titleValid = title !== "";
  const dueDateValid = dueDate !== "";
  const categoryValid = category !== "";
  titleEl.classList.toggle("error", !titleValid);
  if (titleError) titleError.classList.toggle("visible", !titleValid);
  dueDateEl.classList.toggle("error-border", !dueDateValid);
  if (dueDateError) dueDateError.classList.toggle("visible", !dueDateValid);
  categoryToggle.classList.toggle("error-border", !categoryValid);
  if (categoryError) categoryError.classList.toggle("visible", !categoryValid);
  return titleValid && dueDateValid && categoryValid;
}
function updateSubmitState() {
  const button = document.getElementById("submit-task-btn");
  if (button) button.disabled = false;
}
function resetForm() {
  document.getElementById("title").value = "";
  document.getElementById("description").value = "";
  document.getElementById("dueDate").value = "";
  selectedPriority = "medium";
  selectPriority("medium");
  selectedContacts = [];
  updateSelectedContactsUI();
  selectedCategory = "";
  const categoryPlaceholder = document.querySelector("#category-toggle span");
  if (categoryPlaceholder) categoryPlaceholder.textContent = "Select category";
  subtasks.length = 0;
  const subtaskList = document.getElementById("subtask-list");
  if (subtaskList) subtaskList.innerHTML = "";
  const subtaskInput = document.getElementById("subtask-input");
  if (subtaskInput) subtaskInput.value = "";
  const subtaskIcons = document.getElementById("subtask-icons");
  if (subtaskIcons) subtaskIcons.classList.add("hidden");
  const subtaskPlus = document.getElementById("subtask-plus");
  if (subtaskPlus) subtaskPlus.classList.remove("hidden");
}

/* ========== DATE VALIDATION (ADD TASK) ========== */
function setupDateValidation() {
  setTimeout(() => {
    const dateInput = document.getElementById("dueDate");
    const errorText = document.getElementById("error-dueDate");
    if (!dateInput || !errorText) return;
    const today = new Date().toISOString().split("T")[0];
    dateInput.min = today;
    dateInput.addEventListener("input", () => {
      dateInput.classList.remove("error-border");
      errorText.classList.remove("visible");
    });
  }, 100);
}

/* ========== CREATE TASK IN FIREBASE ========== */
async function createTask() {
  if (!validateForm()) return;
  const dueDateValue = document.getElementById("dueDate").value;
  const formattedDate = dueDateValue;
  const task = {
    title: document.getElementById("title").value.trim(),
    description: document.getElementById("description").value.trim(),
    dueDate: formattedDate,
    priority: selectedPriority,
    assignedTo: selectedContacts.map((c) => c.name),
    category: selectedCategory,
    subtask: subtasks.map(st => ({ title: st, completed: false })),
    createdAt: new Date().toISOString(),
    status: addTaskDefaultStatus,
  };
  await fetch(
    `https://join467-e19d8-default-rtdb.europe-west1.firebasedatabase.app/users/${firebaseKey}/tasks.json`,
    {
      method: "POST",
      body: JSON.stringify(task),
    }
  );
  closeAddTaskOverlay();
  await loadTasks();
  setTimeout(() => {
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
  }, 100);
}

/* ========== INIT EVENT LISTENERS FOR ADD TASK OVERLAY ========== */
function setupEventListeners() {
  document
    .getElementById("dropdown-toggle")
    .addEventListener("click", toggleAssignDropdown);
  document
    .getElementById("category-toggle")
    .addEventListener("click", toggleCategoryDropdown);
  document
    .getElementById("dropdown-content")
    ?.addEventListener("click", (e) => {
      e.stopPropagation();
    });
  const subtaskInput = document.getElementById("subtask-input");
  if (subtaskInput) {
    subtaskInput.addEventListener("input", () => {
      const value = subtaskInput.value.trim();
      const iconWrapper = document.getElementById("subtask-icons");
      if (value.length > 0) {
        iconWrapper.classList.remove("hidden");
      } else {
        iconWrapper.classList.add("hidden");
      }
    });
    subtaskInput.addEventListener("keydown", handleSubtaskEnter);
  }
}

/* ========== INIT ADD TASK OVERLAY LOGIC ========== */
function initAddTaskOverlayLogic() {
  fetchContacts();
  setupEventListeners();
  setupDateValidation();
  resetForm();
}
/* ========== OPEN MOVE TASK MENU DROPDOWN ========== */
function openMoveTaskMenu(taskKey, event) {
  event.stopPropagation();
  // Remove any existing dropdowns
  closeMoveTaskMenu();

  // Find the move arrow button (the one just clicked)
  let btn = event.currentTarget;
  // Find the closest .card element
  let card = btn.closest('.card');
  if (!card) return;

  // Create dropdown container
  const dropdown = document.createElement('div');
  dropdown.className = 'move-task-dropdown-menu';

  // Status options
  const statuses = [
    { key: 'todo', label: 'To do' },
    { key: 'progress', label: 'In progress' },
    { key: 'feedback', label: 'Await feedback' },
    { key: 'done', label: 'Done' }
  ];

  // Find the current task
  const currentTask = arrayTasks.find(t => t.firebaseKey === taskKey);
  const currentStatus = currentTask ? currentTask.status : null;

  // Handler for option click
  function handleMoveClick(statusKey) {
    currentDraggedElement = taskKey; // set for moveTo
    moveTo(statusKey);
    closeMoveTaskMenu();
  }

  // Build menu options: exclude current status
  statuses.forEach(s => {
    if (s.key === currentStatus) return; // Skip the current status
    const option = document.createElement('div');
    option.className = 'move-task-dropdown-option';
    option.textContent = s.label;
    option.onclick = function (e) {
      e.stopPropagation();
      handleMoveClick(s.key);
    };
    dropdown.appendChild(option);
  });

  // Position dropdown: below the button, or fallback to card top right
  // Get button position relative to page
  const btnRect = btn.getBoundingClientRect();
  const cardRect = card.getBoundingClientRect();
  // Use scrollX/Y for page scroll offset
  let left = btnRect.left + window.scrollX;
  let top = btnRect.bottom + window.scrollY + 4; // 4px below button
  // If would overflow right, adjust
  if (left + 160 > window.innerWidth) {
    left = window.innerWidth - 170;
  }
  // If would overflow bottom, show above
  if (top + 180 > window.innerHeight + window.scrollY) {
    top = btnRect.top + window.scrollY - 180;
  }
  dropdown.style.left = left + 'px';
  dropdown.style.top = top + 'px';

  // Add to body for absolute positioning
  document.body.appendChild(dropdown);

  // Store reference for later removal
  window._moveTaskDropdown = dropdown;

  // Close on outside click/touch
  function handleOutside(e) {
    // Don't close if click inside dropdown
    if (dropdown.contains(e.target)) return;
    closeMoveTaskMenu();
  }
  document.addEventListener('mousedown', handleOutside, { capture: true });
  document.addEventListener('touchstart', handleOutside, { capture: true });

  // Also close when scrolling
  function handleScroll() {
    closeMoveTaskMenu();
  }
  window.addEventListener('scroll', handleScroll, { passive: true });

  // Save cleanup for later
  window._moveTaskDropdownCleanup = function () {
    document.removeEventListener('mousedown', handleOutside, { capture: true });
    document.removeEventListener('touchstart', handleOutside, { capture: true });
    window.removeEventListener('scroll', handleScroll, { passive: true });
  };
}

/* ========== CLOSE MOVE TASK MENU DROPDOWN ========== */
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

// Also close on resize for safety
window.addEventListener('resize', closeMoveTaskMenu);