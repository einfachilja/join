const BASE_URL =
  "https://join467-e19d8-default-rtdb.europe-west1.firebasedatabase.app/users/";

let arrayTasks = [];
let firebaseKey = localStorage.getItem("firebaseKey");
console.log("firebaseKey:", firebaseKey); // Debug-Ausgabe

/* ========== LOAD TASKS FROM FIREBASE ========== */
async function loadTasks() {
  let response = await fetch(`${BASE_URL}${firebaseKey}/tasks.json`);
  let responseJson = await response.json();

  if (!responseJson) {
    arrayTasks = [];
    updateHTML([]);
    return;
  }

  arrayTasks = Object.entries(responseJson).map(([firebaseKey, task]) => {
    return { ...task, firebaseKey };
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

function generateTodoHTML(element) {
  let categoryClass = "";
  if (element.subject === "User Story") {
    categoryClass = "category-user";
  } else if (element.subject === "Technical Task") {
    categoryClass = "category-technical";
  }

  let priorityIcon = "";
  if (element.priority && element.priority.toLowerCase() === "low") {
    priorityIcon = "./assets/icons/board-priority-low.svg";
  } else if (element.priority && element.priority.toLowerCase() === "medium") {
    priorityIcon = "./assets/icons/board-priority-medium.svg";
  } else if (element.priority && element.priority.toLowerCase() === "high") {
    priorityIcon = "./assets/icons/board-priority-high.svg";
  }

  return `
    <div id="${element.firebaseKey}" draggable="true" ondragstart="startDragging('${element.firebaseKey}')" ondragend="stopDragging('${element.firebaseKey}')" onclick="openBoardCard('${element.firebaseKey}')">
        <div class="card">
            <span class="card-category ${categoryClass}"  ${element.subject}">${element.subject}</span>
            <span class="card-title">${element.title}</span>
            <span class="card-description">${element.description}</span>
                <div class="card-footer">
                  <div>${element.assignedTo}</div>
                  <div><img src="${priorityIcon}" alt="${element.priority}"></div>
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
  let todo = arrayTasks.filter((t) => t["status"] == "todo");
  let progress = arrayTasks.filter((t) => t["status"] == "progress");
  let feedback = arrayTasks.filter((t) => t["status"] == "feedback");
  let done = arrayTasks.filter((t) => t["status"] == "done");

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
    document.getElementById("progress").innerHTML = `<span class="empty-message">No Tasks in <br> In progress</span>`;
  } else {
    for (let element of progress) {
      document.getElementById("progress").innerHTML += generateTodoHTML(element);
    }
  }

  if (feedback.length === 0) {
    document.getElementById("feedback").innerHTML = `<span class="empty-message">No Tasks in <br> Await feedback</span>`;
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
  if (task.subject === "User Story") {
    categoryClass = "category-user";
  } else if (task.subject === "Technical Task") {
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
  } else if (task.priority && task.priority.toLowerCase() === "high") {
    priorityIcon = "./assets/icons/board-priority-high.svg";
  }
  return /*html*/ `
    <div id="board_overlay_card" class="board-overlay-card" onclick="onclickProtection(event)">
      <span id="overlay_card_category" class="overlay-card-category ${categoryClass}">${task.subject}</span>
      <span id="overlay_card_title" class="overlay-card-title">${task.title}</span>
      <span id="overlay_card_description" class="overlay-card-description">${task.description}</span>
      <span id="due_date">Due date: ${task.dueDate}</span>
      <span>Priority: ${task.priority} <img src="${priorityIcon}" alt="${task.priority}" /></span>
      <div>
        Assigned to: <span>${task.assignedTo}</span>
      </div>
      <div>
        <span>Subtasks:</span>
        <div>
          ${task.subtask}
        </div>
      </div>
      <div id="overlay_card_footer" class="overlay-card-footer">
        <div id="delete_btn" class="delete-btn" onclick="deleteTask('${task.firebaseKey}')"><img src="./assets/icons/board-delete-icon.svg" alt="">Delete</div>
        <img id="seperator" src="./assets/icons/board-separator-icon.svg" alt="">
        <div id="edit_btn" class="edit-btn" onclick="editTask()"><img src="./assets/icons/board-edit-icon.svg" alt="">Edit</div>
        <div id="ok_btn" class="ok-btn d-none" onclick="saveEditTask('${task.firebaseKey}')">Ok</div>
      </div>
     
    </div>`;
}

function closeBoardCard() {
  document.getElementById("board_overlay").classList.add("d-none");
  document.getElementById("board_overlay_card").classList.remove("board-overlay-card-show");
  document.getElementById("board_overlay_card").classList.add("board-overlay-card-hide");
  document.getElementById("html").style.overflow = "";
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
  document.getElementById("overlay_card_title").style.border = "1px solid rgba(0, 0, 0, 0.1)";
  document.getElementById("overlay_card_title").style.borderRadius = "10px";

  document.getElementById("overlay_card_description").contentEditable = "true";
  document.getElementById("overlay_card_description").style.border = "1px solid rgba(0, 0, 0, 0.1)";
  document.getElementById("overlay_card_description").style.borderRadius = "10px";

  document.getElementById("due_date").contentEditable = "true";
  document.getElementById("due_date").style.border = "1px solid rgba(0, 0, 0, 0.1)";
  document.getElementById("due_date").style.borderRadius = "10px";
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

  const newTitle = document.getElementById("overlay_card_title").innerHTML;
  const newDescription = document.getElementById("overlay_card_description").innerHTML;
  const rawDueDate = document.getElementById("due_date").innerHTML; /*NEU */
  const match = rawDueDate.match(/(\d{2}\/\d{2}\/\d{4}|\d{4}-\d{2}-\d{2})/); /*NEU */
  const newDueDate = match ? match[0] : ""; /*NEU */

  const updatedTask = {
    ...task,
    title: newTitle,
    description: newDescription,
    dueDate: newDueDate,
    // priority: newPriority,
    // assignedTo: newAssignedTo,
    // subtask: newSubtask
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
    let priorityMatch = task.priority && task.priority.toLowerCase().includes(inputValue);
    let statusMatch = task.status && task.status.toLowerCase().includes(inputValue);
    let subjectMatch = task.subject && task.subject.toLowerCase().includes(inputValue);
    let subtaskMatch = task.subtask && Array.isArray(task.subtask) && task.subtask.some(sub => sub.toLowerCase().includes(inputValue));
    let assignedToMatch = task.assignedTo && Array.isArray(task.assignedTo) && task.assignedTo.some(name => name.toLowerCase().includes(inputValue));
    let dueDateMatch = task.dueDate && task.dueDate.toLowerCase().includes(inputValue);
    return titleMatch || descriptionMatch || priorityMatch || statusMatch || subjectMatch || subtaskMatch || assignedToMatch || dueDateMatch;
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
      document.getElementById(section).innerHTML = `<span>Keine Ergebnisse in ${section}</span>`;
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
      "subject": "User Story",
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

function getaddTaskOverlay() {
  return `     
          <div class="add-task-modal">
            <h2>Add Task</h2>
            <form id="task-form" onsubmit="return false;">
              <div class="form-cols">
                <!-- linke Spalte -->
                <div class="col-left">
                  <label for="title"
                    >Title <span class="red_star">*</span></label
                  >
                  <input id="title" type="text" placeholder="e.g. Build UI" />

                  <label for="description">Description</label>
                  <textarea
                    id="description"
                    placeholder="e.g. Implement form validations"
                  ></textarea>

                  <label for="dueDate"
                    >Due Date <span class="red_star">*</span></label
                  >
                  <div class="date-wrapper">
                    <input
                      id="dueDate"
                      class="date-input"
                      type="date"
                      placeholder="DD/MM/YYYY"
                      onblur="validateDate(); updateSubmitState();"
                    />
                    <img
                      src="./assets/icons/calendar.svg"
                      class="calendar-icon"
                      alt="Kalender"
                      onclick="openDatepicker()"
                    />
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
                      Urgent <img src="./assets/icons/urgent.svg" alt="" />
                    </button>
                    <button
                      type="button"
                      data-prio="medium"
                      class="selected"
                      onclick="selectPriority('medium')"
                    >
                      Medium <img src="./assets/icons/medium.svg" alt="" />
                    </button>
                    <button
                      type="button"
                      data-prio="low"
                      onclick="selectPriority('low')"
                    >
                      Low <img src="./assets/icons/low.svg" alt="" />
                    </button>
                  </div>

                  <label>Assigned to</label>
                  <div id="dropdown-wrapper">
                    <div
                      id="dropdown-toggle"
                      onclick="toggleAssignDropdown()"
                    >
                      <span id="assigned-to-placeholder">Select contacts</span>
                      <div class="dropdown-arrow"></div>
                    </div>
                    <div id="dropdown-content" class="dropdown-content"></div>
                  </div>
                  <div id="selected-contacts" class="selected-contacts"></div>

                  <label>Subtasks</label>
                  <div class="subtask-input">
                    <input
                      id="subtask-input"
                      type="text"
                      placeholder="Add new subtask"
                      onkeypress="if(event.key==='Enter'){ addSubtask(); event.preventDefault(); }"
                    />
                    <button type="button" onclick="addSubtask()">+</button>
                  </div>
                  <ul id="subtask-list"></ul>
                </div>
              </div>

              <div class="form-actions">
                <button type="button" onclick="resetForm()">Cancel</button>
                <button
                  id="submit-task-btn"
                  type="button"
                  onclick="createTask()"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        `;
}

// ==== CREATE TASK ====
async function createTask() {
  fetch(`https://join467-e19d8-default-rtdb.europe-west1.firebasedatabase.app/users/${firebaseKey}/tasks.json`, {
    method: "POST",
    body: JSON.stringify({
      status: "todo",
      subject: "User Story"
    })
  })
}