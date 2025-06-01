const BASE_URL =
  "https://join467-e19d8-default-rtdb.europe-west1.firebasedatabase.app/";

let arrayTasks = [];

async function loadTasks(path = "tasks") {
  let response = await fetch(BASE_URL + path + ".json");
  let responseJson = await response.json();

  // console.log(responseJson); // z.B. ein Objekt mit vielen Einträgen

  arrayTasks = Object.entries(responseJson).map(([firebaseKey, task]) => {
    return { ...task, firebaseKey };
  });

  if (responseJson) {
    for (let task of arrayTasks) {
      // console.log(task); // hier bekommst du jeden einzelnen Task
    }
  } else {
    console.log("Keine Tasks gefunden");
  }

  updateHTML(arrayTasks);
}

let currentDraggedElement;

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

function moveTo(status) {
  let task = arrayTasks.find((t) => t.firebaseKey === currentDraggedElement);
  if (task) {
    task.status = status;
    updateHTML();
  } else {
    console.warn("Task nicht gefunden für ID:", currentDraggedElement);
  }
}

function highlight(status) {
  document.getElementById(status).classList.add("drag-area-highlight");
}

function removeHighlight(status) {
  document.getElementById(status).classList.remove("drag-area-highlight");
}

function openBoardCard(firebaseKey) {
  document.getElementById('board_overlay').classList.remove('board-overlay-card-hide');
  document.getElementById('board_overlay').classList.add('board-overlay-card-show');
  document.getElementById('html').style.overflow = "hidden";
  let boardOverlayRef = document.getElementById('board_overlay');

  let task = arrayTasks.find(t => t.firebaseKey === firebaseKey);

  boardOverlayRef.innerHTML = /*html*/ `
    <div id="board_overlay_card" class="board-overlay-card" onclick="onclickProtection(event)">
      <span class="overlay-card-category">${task.subject}</span>
      <span class="overlay-card-title">${task.title}</span>
      <span class="overlay-card-description">${task.description}</span>
      <span>Due date: ${task.dueDate}</span>
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
        <div onclick="deleteTask('${task.firebaseKey}')"><img src="./assets/icons/board-delete-icon.svg" alt="">Delete</div>
        <img src="./assets/icons/board-separator-icon.svg" alt="">
        <div><img src="./assets/icons/board-edit-icon.svg" alt="">Edit</div>
      </div>
    </div>`;

  updateHTML();
}

function closeBoardCard() {
  document.getElementById('board_overlay').classList.remove('board-overlay-card-show');
  document.getElementById('board_overlay').classList.add('board-overlay-card-hide');
  document.getElementById('html').style.overflow = "";
  updateHTML();
}

function onclickProtection(event) {
  event.stopPropagation();
}

async function deleteTask(firebaseKey) {
  try {
    let response = await fetch(`${BASE_URL}tasks/${firebaseKey}.json`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Löschen fehlgeschlagen");
    }

    // Task aus arrayTasks entfernen
    arrayTasks = arrayTasks.filter(task => task.firebaseKey !== firebaseKey);

    // Overlay schließen und UI aktualisieren
    closeBoardCard();
    updateHTML();
  } catch (error) {
    console.error("Fehler beim Löschen des Tasks:", error);
  }
}
