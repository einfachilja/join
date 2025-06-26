const BASE_URL =
  "https://join467-e19d8-default-rtdb.europe-west1.firebasedatabase.app/users/";

// Neue Funktion zum Laden der Kontakte und Speichern im localStorage
async function fetchContactsAndStore(userKey) {
  const url = `https://join467-e19d8-default-rtdb.europe-west1.firebasedatabase.app/users/${userKey}/contacts.json`;

  try {
    const response = await fetch(url);
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

let arrayTasks = [];
let firebaseKey = localStorage.getItem("firebaseKey");
console.log("firebaseKey:", firebaseKey); // Debug-Ausgabe

/* ========== LOAD TASKS FROM FIREBASE ========== */
async function loadTasks() {
  let response = await fetch(`${BASE_URL}${firebaseKey}/tasks.json`);
  let responseJson = await response.json();
  await fetchContactsAndStore(firebaseKey);

  if (!responseJson) {
    arrayTasks = [];
    updateHTML([]);
    return;
  }

  // Fallback/default logic: Setze sinnvolle Defaults für fehlende Felder
  arrayTasks = Object.entries(responseJson).map(([firebaseKey, task]) => {
    return {
      firebaseKey,
      title: typeof task.title === 'string' ? task.title : '',
      description: typeof task.description === 'string' ? task.description : '',
      dueDate: typeof task.dueDate === 'string' ? task.dueDate : '',
      priority: typeof task.priority === 'string' ? task.priority : 'low',
      status: typeof task.status === 'string' ? task.status : 'todo',
      category: typeof task.category === 'string' ? task.category : '',
      assignedTo: Array.isArray(task.assignedTo)
        ? task.assignedTo
        : (typeof task.assignedTo === 'string'
          ? task.assignedTo.split(',').map(n => n.trim()).filter(Boolean)
          : []),
      subtask: Array.isArray(task.subtask)
        ? task.subtask
        : (typeof task.subtask === 'string'
          ? [{ title: task.subtask, completed: false }]
          : []),
      // Kopiere ggf. weitere Felder
      ...task
    };
  });
  updateHTML(arrayTasks);
}

/* ========== DELETE TASK FROM FIREBASE ========== */
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

/* ========== MOVE TASK STATUS IN FIREBASE ========== */
async function moveTo(status) {
  let task = arrayTasks.find((t) => t.firebaseKey === currentDraggedElement);
  if (task) {
    task.status = status;

    try {
      await fetch(`${BASE_URL}${firebaseKey}/tasks/${task.firebaseKey}.json`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: status }),
      });
    } catch (error) {
      console.error("Fehler beim Aktualisieren des Status in Firebase:", error);
    }

    updateHTML();
  } else {
    console.warn("Task nicht gefunden für ID:", currentDraggedElement);
  }
}

let currentDraggedElement;

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


function getContactByName(name) {
  // Beispiel: Holt den aktuellen User aus dem localStorage
  let currentUser = localStorage.getItem("firebaseKey");
  let userData = JSON.parse(localStorage.getItem("firebaseUsers"));
  if (!userData || !userData[currentUser] || !userData[currentUser].contacts) return null;

  for (let key in userData[currentUser].contacts) {
    if (userData[currentUser].contacts[key].name === name) {
      return userData[currentUser].contacts[key];
    }
  }
  return null;
}

function getInitials(name) {
  if (!name || typeof name !== 'string') return '';
  return name.split(" ").map(n => n[0]).join("").toUpperCase();
}

function generateTodoHTML(element) {
  // Fallback-Logik: Setze Defaults für fehlende Felder
  const category = typeof element.category === 'string' ? element.category : '';
  let categoryClass = "";
  if (category === "User Story") {
    categoryClass = "category-user";
  } else if (category === "Technical Task") {
    categoryClass = "category-technical";
  }

  const priority = typeof element.priority === 'string' ? element.priority : 'low';
  let priorityIcon = "";
  if (priority.toLowerCase() === "low") {
    priorityIcon = "./assets/icons/board-priority-low.svg";
  } else if (priority.toLowerCase() === "medium") {
    priorityIcon = "./assets/icons/board-priority-medium.svg";
  } else if (priority.toLowerCase() === "urgent") {
    priorityIcon = "./assets/icons/board-priority-high.svg";
  }

  // assignedTo kann String oder Array sein, fallback zu []
  let assignedList = [];
  if (Array.isArray(element.assignedTo)) {
    assignedList = element.assignedTo.filter(name => !!name && typeof name === 'string');
  } else if (typeof element.assignedTo === "string") {
    assignedList = element.assignedTo.split(",").map(name => name.trim()).filter(Boolean);
  }

  // ==== Subtasks tracking ====
  let totalSubtasks = 0;
  let completedSubtasks = 0;
  let subtasksArr = [];
  if (Array.isArray(element.subtask)) {
    subtasksArr = element.subtask;
    totalSubtasks = subtasksArr.length;
    completedSubtasks = subtasksArr.filter(
      sub => typeof sub === "object" ? sub.completed : false
    ).length;
  }
  let progressPercent = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

  // Fallback für title/description
  const title = typeof element.title === 'string' ? element.title : '';
  const description = typeof element.description === 'string' ? element.description : '';

  return `
    <div id="${element.firebaseKey}" draggable="true" ondragstart="startDragging('${element.firebaseKey}')" ondragend="stopDragging('${element.firebaseKey}')" onclick="openBoardCard('${element.firebaseKey}')">
        <div class="card">
            <span class="card-category ${categoryClass}" ${category ? `title="${category}"` : ''}>${category}</span>
            <span class="card-title">${title}</span>
            <span class="card-description">${description}</span>
            <div class="card-subtask-progress">
              <div class="subtask-progress-bar-bg">
                <div class="subtask-progress-bar-fill" style="width: ${progressPercent}%;"></div>
              </div>
              <span class="subtask-progress-text">${completedSubtasks}/${totalSubtasks} Subtasks</span>
            </div>
                <div class="card-footer">
                  <div class="assigned-container">
                    ${Array.isArray(assignedList)
      ? assignedList.map(name => {
        let contact = getContactByName(name);
        let color = contact && contact.color ? contact.color : "#ccc";
        return `<span class="assigned-circle" style="background-color: ${color};">${getInitials(name)}</span>`;
      }).join("")
      : ""}
                  </div>
                  <div class="priority-container"><img src="${priorityIcon}" alt="${priority}"></div>
                </div>
        </div>
    </div>`;
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

/* ========== UPDATE BOARD PAGE ========== */
function updateHTML() {
  // Fallback/Default-Logik: handle tasks with missing or undefined fields robustly
  let todo = arrayTasks.filter((t) => (t && typeof t.status === 'string' ? t.status : 'todo') === "todo");
  let progress = arrayTasks.filter((t) => (t && typeof t.status === 'string' ? t.status : '') === "progress");
  let feedback = arrayTasks.filter((t) => (t && typeof t.status === 'string' ? t.status : '') === "feedback");
  let done = arrayTasks.filter((t) => (t && typeof t.status === 'string' ? t.status : '') === "done");

  document.getElementById("todo").innerHTML = "";
  document.getElementById("progress").innerHTML = "";
  document.getElementById("feedback").innerHTML = "";
  document.getElementById("done").innerHTML = "";

  if (todo.length === 0) {
    document.getElementById("todo").innerHTML = `<span class="empty-message">No Tasks in To do</span>`;
  } else {
    for (let element of todo) {
      document.getElementById("todo").innerHTML += generateTodoHTML(element);
    }
  }

  if (progress.length === 0) {
    document.getElementById("progress").innerHTML = `<span class="empty-message">No Tasks In progress</span>`;
  } else {
    for (let element of progress) {
      document.getElementById("progress").innerHTML += generateTodoHTML(element);
    }
  }

  if (feedback.length === 0) {
    document.getElementById("feedback").innerHTML = `<span class="empty-message">No Tasks in Await feedback</span>`;
  } else {
    for (let element of feedback) {
      document.getElementById("feedback").innerHTML += generateTodoHTML(element);
    }
  }

  if (done.length === 0) {
    document.getElementById("done").innerHTML = `<span class="empty-message">No Tasks in Done</span>`;
  } else {
    for (let element of done) {
      document.getElementById("done").innerHTML += generateTodoHTML(element);
    }
  }
}

/* ========== OPEN AND CLOSE OVERLAY ========== */
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

  updateHTML();
}

function getOpenBoardCardTemplate(categoryClass, task) {
  let priorityIcon = "";
  if (task.priority && task.priority.toLowerCase() === "low") {
    priorityIcon = "./assets/icons/board-priority-low.svg";
  } else if (task.priority && task.priority.toLowerCase() === "medium") {
    priorityIcon = "./assets/icons/board-priority-medium.svg";
  } else if (task.priority && task.priority.toLowerCase() === "urgent") {
    priorityIcon = "./assets/icons/board-priority-high.svg";
  }
  return /*html*/ `
    <div id="board_overlay_card" class="board-overlay-card" data-firebase-key="${task.firebaseKey}" onclick="onclickProtection(event)">
      <span id="overlay_card_category" class="overlay-card-category ${categoryClass}">${task.category}</span>
      <span id="overlay_card_title" class="overlay-card-title">${task.title}</span>
      <span id="overlay_card_description" class="overlay-card-description">${task.description}</span>
      <span class="due-date-headline" id="due_date">Due date: <span>${task.dueDate}</span></span>
      <span class="priority-headline">Priority: <span class="priority-container">${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}<img src="${priorityIcon}" alt="${task.priority}"/></span></span>
      <div class="assigned-list">
        <span>Assigned To:</span>
        ${Array.isArray(task.assignedTo)
      ? task.assignedTo.map(name => {
        const contact = getContactByName(name);
        const color = contact?.color || "#ccc";
        return `
                <div class="assigned-entry">
                  <span class="assigned-circle" style="background-color: ${color};">${getInitials(name)}</span>
                  <span class="assigned-name">${name}</span>
                </div>`;
      }).join("")
      : ""}
      </div>
      <div class="subtask-list">
        <span>Subtasks:</span>
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
        <div id="delete_btn" class="delete-btn" onclick="deleteTask('${task.firebaseKey}')"><img src="./assets/icons/board-delete-icon.svg" alt="">Delete</div>
        <img id="seperator" src="./assets/icons/board-separator-icon.svg" alt="">
        <div id="edit_btn" class="edit-btn" onclick="editTask()"><img src="./assets/icons/board-edit-icon.svg" alt="">Edit</div>
        <div id="ok_btn" class="ok-btn d-none" onclick="saveEditTask('${task.firebaseKey}')">Ok</div>
      </div>
    </div>`;
}

// Generate HTML for priority buttons in edit mode
function getPriorityButtonsHTML(currentPriority) {
  const priorities = [
    { value: 'urgent', label: 'Urgent', icon: './assets/icons/urgent.svg' },
    { value: 'medium', label: 'Medium', icon: './assets/icons/medium.svg' },
    { value: 'low', label: 'Low', icon: './assets/icons/low.svg' }
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

// Handle priority button selection in overlay edit mode
function selectOverlayPriority(priority, btn) {
  document.querySelectorAll('.priority-edit-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  document.getElementById('priority-edit-buttons').dataset.selectedPriority = priority;
}


// ========== TOGGLE SUBTASK COMPLETION & UPDATE FIREBASE ==========
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
    // Refresh UI
    updateHTML();
    openBoardCard(taskKey);
  } catch (error) {
    console.error("Fehler beim Aktualisieren des Subtasks:", error);
  }
}

function closeBoardCard() {
  if (window._assignedDropdownCleanup) window._assignedDropdownCleanup();
  document.getElementById("board_overlay").classList.add("d-none");
  document.getElementById("board_overlay_card").classList.remove("board-overlay-card-show");
  document.getElementById("board_overlay_card").classList.add("board-overlay-card-hide");
  document.getElementById("html").style.overflow = "";
  // Remove labels if they exist
  let titleLabel = document.getElementById("overlay_card_title_label");
  if (titleLabel) titleLabel.remove();
  let descLabel = document.getElementById("overlay_card_description_label");
  if (descLabel) descLabel.remove();
  updateHTML();
}

function onclickProtection(event) {
  event.stopPropagation();
}


function editTask() {
  document.getElementById("ok_btn").classList.remove("d-none");
  document.getElementById("delete_btn").classList.add("d-none");
  document.getElementById("edit_btn").classList.add("d-none");
  document.getElementById("seperator").classList.add("d-none");
  document.getElementById("overlay_card_category").classList.add("d-none");

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

    const toggle = document.createElement('div');
    toggle.className = 'assigned-dropdown-toggle';
    toggle.onclick = function () {
      list.classList.toggle('open');
    };

    const placeholder = document.createElement('span');
    placeholder.id = 'assigned-placeholder';
    placeholder.textContent = 'Select contacts to assign';

    const arrow = document.createElement('span');
    arrow.className = 'dropdown-arrow';

    toggle.appendChild(placeholder);
    toggle.appendChild(arrow);

    // Dropdown-Liste
    const list = document.createElement('div');
    list.id = 'assigned-dropdown-list';
    list.className = 'assigned-dropdown-list';

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

    // Initialen-Hilfsfunktion
    function getInitials(name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }

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
        const initials = contact ? getInitials(contact.name) : '';
        const color = contact && contact.color ? contact.color : '#ccc';
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
        removeBtn.innerHTML = `<img src="assets/icons/board-delete-icon.svg">`;
        removeBtn.onclick = (e) => {
          e.preventDefault();
          subtaskArr.splice(idx, 1);
          renderSubtasksList(subtaskArr);
        };

        // Edit-Button (Stift)
        const editBtn = document.createElement('button');
        editBtn.type = 'button';
        editBtn.className = 'subtask-edit-btn';
        editBtn.innerHTML = `<img src="assets/icons/board-edit-icon.svg">`;
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

    console.log("task.firebaseKey:", task.firebaseKey);

    // Lokales Array aktualisieren
    arrayTasks = arrayTasks.map(t => t.firebaseKey === taskKey ? updatedTask : t);
    updateHTML();
    openBoardCard(taskKey); // Overlay mit aktualisierten Daten neu laden
  } catch (error) {
    console.error("Fehler beim Bearbeiten des Tasks:", error);
  }
}

/* ========== SEARCH FUNCTION ========== */
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

/* ========== ADD NEW TASK TO BOARD ========== */
async function createTask() {
  let response = await fetch(`${BASE_URL}${firebaseKey}/tasks.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      "title": "New test title",
      "description": "New test description",
      "priority": "low",
      "status": "todo",
      "category": "User Story",
      "subtask": ["Subtask1", "Subtask 2", "Subtask 3"],
      "assignedTo": ["User 1", "User 2", "User 3"],
      "dueDate": "31/12/2025"
    })
  });
  let responseJson = await response.json();
  await loadTasks();
  return responseJson;
}

function openAddTaskOverlay() {
  let addTaskOverlayRef = document.getElementById("add_task_overlay");
  document.getElementById("add_task_overlay").classList.remove("d-none");
  document.getElementById("html").style.overflow = "hidden";

  addTaskOverlayRef.innerHTML = getaddTaskOverlay();
  updateHTML();
}

// ==== CREATE TASK ====
async function createTask() {
  fetch(`https://join467-e19d8-default-rtdb.europe-west1.firebasedatabase.app/users/${firebaseKey}/tasks.json`, {
    method: "POST",
    body: JSON.stringify({
      status: "todo",
      category: "User Story"
    })
  })
}