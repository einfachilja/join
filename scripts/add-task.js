// ====== STATE ======
let selectedPriority = "medium";
const subtasks = [];
let contacts = [];
let assignedTo = null;

// ====== INIT ======
window.addEventListener("DOMContentLoaded", () => {
  populateContacts();
  document
    .getElementById("assigned-selected")
    .addEventListener("click", toggleDropdown);
});
document.body.addEventListener("click", closeDropdown);

// ====== PRIORITY BUTTONS ======
function setPriority(prio) {
  document.querySelectorAll(".button-prio").forEach((btn) => {
    btn.classList.remove("selected", "urgent", "medium", "low");
  });
  const selectedBtn = document.getElementById(prio);
  selectedBtn.classList.add("selected", prio);
  selectedPriority = prio;
}

// ====== ASSIGNED TO DROPDOWN ======
function toggleDropdown(ev) {
  ev.stopPropagation();
  document.getElementById("assignedList")?.classList.toggle("hidden");
}

function closeDropdown() {
  document.getElementById("assignedList")?.classList.add("hidden");
}

function populateContacts() {
  fetch(
    "https://join467-e19d8-default-rtdb.europe-west1.firebasedatabase.app/users.json"
  )
    .then((res) => res.json())
    .then((data) => {
      contacts = Object.entries(data || {})
        .filter(([_, user]) => user && user.name?.trim())
        .map(([id, user]) => ({ id, name: user.name }));

      const ul = document.getElementById("assignedList");
      ul.innerHTML = "";

      contacts.forEach((c) => {
        const li = document.createElement("li");
        li.classList.add("assigned-item");
        li.setAttribute("data-id", c.id);
        li.innerHTML = `
          <span class="circle-icon">${getInitials(c.name)}</span>
          <span class="assigned-name">${c.name}</span>
        `;
        li.addEventListener("click", () => selectContact(c));
        ul.appendChild(li);
      });
    })
    .catch((err) => console.error("Could not load contacts:", err));
}

function selectContact(contact) {
  assignedTo = contact.id;

  // Reset all items
  document.querySelectorAll(".assigned-item").forEach((li) => {
    li.classList.remove("selected");
    li.querySelector(".assigned-check")?.remove();
  });

  // Mark selected
  const matchingLi = [...document.querySelectorAll(".assigned-item")].find(
    (li) => li.dataset.id === contact.id
  );
  if (matchingLi) {
    matchingLi.classList.add("selected");
    const checkIcon = document.createElement("img");
    checkIcon.src = "./assets/icons/checked.svg";
    checkIcon.alt = "checked";
    checkIcon.classList.add("assigned-check");
    matchingLi.appendChild(checkIcon);
  }

  // Update visual box
  const wrapper = document.getElementById("assigned-selected");
  wrapper.innerHTML = `
    <span class="circle-icon">${getInitials(contact.name)}</span>
    <span class="assigned-name">${contact.name}</span>
  `;
  wrapper.addEventListener("click", toggleDropdown);

  document.getElementById("assignedList").classList.add("hidden");
  toggleCreateBtn();
}

function getInitials(name) {
  if (!name || typeof name !== "string") return "??";
  return name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

// ====== SUBTASKS ======
function addSubtask() {
  const inp = document.getElementById("subtaskInput");
  const txt = inp.value.trim();
  if (!txt) return;
  subtasks.push(txt);
  const li = document.createElement("li");
  li.textContent = txt;
  document.getElementById("subtaskList").appendChild(li);
  inp.value = "";
}

// ====== DATE CHECK ======
function validateDate() {
  const el = document.getElementById("dueDate");
  if (el.type === "date") {
    el.classList.toggle("input-error", !el.value);
  } else {
    el.classList.toggle("input-error", !isValidDate(el.value.trim()));
  }
}

function isValidDate(str) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(str);
  if (!m) return false;
  const [_, d, mo, y] = m.map(Number);
  const dt = new Date(y, mo - 1, d);
  return (
    dt.getFullYear() === y && dt.getMonth() === mo - 1 && dt.getDate() === d
  );
}

// ====== BUTTON ENABLE ======
function toggleCreateBtn() {
  const title = document.getElementById("title").value.trim();
  const dueEl = document.getElementById("dueDate");
  const catEl = document.getElementById("category");
  const btn = document.getElementById("createBtn");
  const dateOk =
    dueEl.type === "date" ? !!dueEl.value : isValidDate(dueEl.value);
  const categoryOk = catEl && catEl.value;
  btn.disabled = !(title && dateOk && categoryOk && assignedTo);
}

// ====== CREATE TASK ======
async function createTask() {
  const task = {
    title: document.getElementById("title").value.trim(),
    description: document.getElementById("description").value.trim(),
    dueDate: document.getElementById("dueDate").value.trim(),
    priority: selectedPriority,
    category: document.getElementById("category").value,
    assignedTo,
    subtasks: [...subtasks],
    createdAt: new Date().toISOString(),
  };

  const success = await sendTaskToBackend(task);
  if (success) {
    alert("Task successfully created!");
    resetForm();
  } else {
    alert("Task could not be saved. Please try again.");
  }
}

async function sendTaskToBackend(task) {
  const res = await fetch(
    "https://join467-e19d8-default-rtdb.europe-west1.firebasedatabase.app/tasks.json",
    {
      method: "POST",
      body: JSON.stringify(task),
      headers: { "Content-Type": "application/json" },
    }
  );
  return res.ok;
}

// ====== RESET FORM ======
function resetForm() {
  document.getElementById("taskForm").reset();
  document.getElementById("subtaskList").innerHTML = "";
  subtasks.length = 0;
  assignedTo = null;
  selectedPriority = "medium";
  setPriority("medium");
  toggleCreateBtn();

  const wrapper = document.getElementById("assigned-selected");
  wrapper.innerHTML = `
    <span class="circle-icon">AA</span>
    <span class="assigned-name">Select contacts</span>
  `;
  wrapper.addEventListener("click", toggleDropdown);
}
