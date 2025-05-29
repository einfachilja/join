let todos = [
  {
    id: 0,
    subject: "User Story",
    title: "Register",
    category: "open",
    description: "Create a register form...",
    progress: "./assets/icons/Progress.png",
    members: "./assets/icons/members.png",
    priority: "./assets/icons/Priority-symbols.png",
  },
  {
    id: 1,
    subject: "Bug",
    title: "Drag & Drop",
    category: "progress",
    description: "Solve bug with board drag & drop...",
    progress: "./assets/icons/Progress.png",
    members: "./assets/icons/members.png",
    priority: "./assets/icons/Priority-symbols.png",
  },
  {
    id: 2,
    subject: "Feature",
    title: "Create gighliting",
    category: "feedback",
    description: "Bla bla bla..",
    progress: "./assets/icons/Progress.png",
    members: "./assets/icons/members.png",
    priority: "./assets/icons/Priority-symbols.png",
  },
  {
    id: 3,
    subject: "User Story",
    title: "Contact & Imprint",
    category: "closed",
    description: "Create a contact form and imprint page...",
    progress: "./assets/icons/Progress.png",
    members: "./assets/icons/members.png",
    priority: "./assets/icons/Priority-symbols.png",
  },
];

let currentDraggedElement;

function updateHTML() {
  let open = todos.filter((t) => t["category"] == "open");

  document.getElementById("open").innerHTML = "";

  for (let index = 0; index < open.length; index++) {
    const element = open[index];
    document.getElementById("open").innerHTML += generateTodoHTML(element);
  }

  let progress = todos.filter((t) => t["category"] == "progress");
  document.getElementById("progress").innerHTML = "";

  for (let index = 0; index < progress.length; index++) {
    const element = progress[index];
    document.getElementById("progress").innerHTML += generateTodoHTML(element);
  }

  let feedback = todos.filter((t) => t["category"] == "feedback");
  document.getElementById("feedback").innerHTML = "";

  for (let index = 0; index < feedback.length; index++) {
    const element = feedback[index];
    document.getElementById("feedback").innerHTML += generateTodoHTML(element);
  }

  let closed = todos.filter((t) => t["category"] == "closed");
  document.getElementById("closed").innerHTML = "";

  for (let index = 0; index < closed.length; index++) {
    const element = closed[index];
    document.getElementById("closed").innerHTML += generateTodoHTML(element);
  }
}

function startDragging(id) {
  currentDraggedElement = id;
}

function generateTodoHTML(element) {
  return `
    <div id="${element["id"]}" draggable="true" ondragstart="startDragging(${element["id"]})">
        <div class="card">
            <span class="card-category">${element["subject"]}</span>
            <span class="card-title">${element["title"]}</span>
            <span class="card-description">${element["description"]}</span>
            <img src="${element["progress"]}" alt="">
                <div class="card-footer">
                  <img src="${element["members"]}" alt="">
                  <img src="${element["priority"]}" alt="">
                </div>
        </div>
    </div>`;
}

function allowDrop(ev) {
  ev.preventDefault();
}

function moveTo(category) {
  todos[currentDraggedElement]["category"] = category;
  updateHTML();
}

function highlight(category) {
  document.getElementById(category).classList.add("drag-area-highlight");
}

function removeHighlight(category) {
  document.getElementById(category).classList.remove("drag-area-highlight");
}
