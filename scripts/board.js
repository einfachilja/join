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

  console.log(responseJson);

  arrayTasks = Object.entries(responseJson).map(([firebaseKey, task]) => {
    return { ...task, firebaseKey };
  });
  console.log("Geladene Tasks:", arrayTasks);
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
}

function generateTodoHTML(element) {
  return `
    <div id="${element.firebaseKey}" draggable="true" ondragstart="startDragging('${element.firebaseKey}')" onclick="openBoardCard('${element.firebaseKey}')">
        <div class="card">
            <span class="card-category">${element.subject}</span>
            <span class="card-title">${element.title}</span>
            <span class="card-description">${element.description}</span>
                <div class="card-footer">
                  <div>${element.assignedTo}</div>
                  <div>${element.priority}</div>
                </div>
        </div>
    </div>`;
}

function allowDrop(ev) {
  ev.preventDefault();
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

  document.getElementById("todo").innerHTML = "";

  for (let index = 0; index < todo.length; index++) {
    let element = todo[index];
    document.getElementById("todo").innerHTML += generateTodoHTML(element);
  }

  let progress = arrayTasks.filter((t) => t["status"] == "progress");
  document.getElementById("progress").innerHTML = "";

  for (let index = 0; index < progress.length; index++) {
    let element = progress[index];
    document.getElementById("progress").innerHTML += generateTodoHTML(element);
  }

  let feedback = arrayTasks.filter((t) => t["status"] == "feedback");
  document.getElementById("feedback").innerHTML = "";

  for (let index = 0; index < feedback.length; index++) {
    let element = feedback[index];
    document.getElementById("feedback").innerHTML += generateTodoHTML(element);
  }

  let done = arrayTasks.filter((t) => t["status"] == "done");
  document.getElementById("done").innerHTML = "";

  for (let index = 0; index < done.length; index++) {
    let element = done[index];
    document.getElementById("done").innerHTML += generateTodoHTML(element);
  }
}

/* ========== OPEN AND CLOSE OVERLAY ========== */
function openBoardCard(firebaseKey) {
  document
    .getElementById("board_overlay")
    .classList.remove("board-overlay-card-hide");
  document
    .getElementById("board_overlay")
    .classList.add("board-overlay-card-show");
  document.getElementById("html").style.overflow = "hidden";
  let boardOverlayRef = document.getElementById("board_overlay");

  let task = arrayTasks.find((t) => t.firebaseKey === firebaseKey);

  boardOverlayRef.innerHTML = /*html*/ `
    <div id="board_overlay_card" class="board-overlay-card" onclick="onclickProtection(event)">
      <span class="overlay-card-category">${task.subject}</span>
      <span id="overlay_card_title" class="overlay-card-title">${task.title}</span>
      <span id="overlay_card_description" class="overlay-card-description">${task.description}</span>
      <span id="due_date">Due date: ${task.dueDate}</span>
      <span>Priority:${task.priority}</span>
      <div>
        <span>Assigned to:</span>
          ${task.assignedTo}
      </div>
      <div>
        <span>Subtasks:</span>
        <div>
          ${task.subtask}
        </div>
      </div>
      <div class="overlay-card-footer">
        <div id="delete_btn" onclick="deleteTask('${task.firebaseKey}')"><img src="./assets/icons/board-delete-icon.svg" alt="">Delete</div>
        <img src="./assets/icons/board-separator-icon.svg" alt="">
        <div id="edit_btn" onclick="editTask()"><img src="./assets/icons/board-edit-icon.svg" alt="">Edit</div>
        <div onclick="saveEditTask('${task.firebaseKey}')"><img src="./assets/icons/board-edit-icon.svg" alt="">OK</div>
      </div>
     
    </div>`;

  updateHTML();
}

function closeBoardCard() {
  document
    .getElementById("board_overlay")
    .classList.remove("board-overlay-card-show");
  document
    .getElementById("board_overlay")
    .classList.add("board-overlay-card-hide");
  document.getElementById("html").style.overflow = "";
  updateHTML();
}

function onclickProtection(event) {
  event.stopPropagation();
}


function editTask() {

  document.getElementById("overlay_card_title").contentEditable = "true";
  document.getElementById("overlay_card_title").style.border = "1px solid rgba(0, 0, 0, 0.1)";
  document.getElementById("overlay_card_title").style.borderRadius = "10px";


  document.getElementById("overlay_card_description").contentEditable = "true";
  document.getElementById("overlay_card_description").style.border = "1px solid rgba(0, 0, 0, 0.1)";
  document.getElementById("overlay_card_description").style.borderRadius = "10px";

  document.getElementById("delete_btn").classList.add("d-none");
  document.getElementById("edit_btn").classList.add("d-none");
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

  const updatedTask = {
    ...task,
    title: newTitle,
    description: newDescription,
    // dueDate: newDueDate,
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


// function countTaskStatus(arrayTasks) {

//   let sumTotalTasks = arrayTasks.length;
//   let sumStatusTodo = arrayTasks.filter((task) => task.status == "todo");
//   let sumStatusInProgress = arrayTasks.filter((task) => task.status == "progress");
//   let sumStatusAwaitFeedback = arrayTasks.filter((task) => task.status == "feedback");
//   let sumStatusDone = arrayTasks.filter((task) => task.status == "done");

//   console.log("Gesamt Tasks: ", sumTotalTasks);
//   console.log("Todo-Tasks: ", sumStatusTodo.length);
//   console.log("In Progress-Tasks: ", sumStatusInProgress.length);
//   console.log("Await feedback-Tasks: ", sumStatusAwaitFeedback.length);
//   console.log("Done-Tasks: ", sumStatusDone.length);
// }
