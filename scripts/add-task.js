// ====== STATE ======

let selectedPriority = "medium";

function stopPropagation(event) {
  event.stopPropagation();
}
const subtasks = [];
let contacts = [];
let assignedTo = null;
let selectedContacts = [];

// ====== INIT ======
window.addEventListener("DOMContentLoaded", () => {
  populateContacts();
});

// ====== DROPDOWN ======

function populateContacts() {
  fetch(
    "https://join467-e19d8-default-rtdb.europe-west1.firebasedatabase.app/users.json"
  )
    .then((res) => res.json())
    .then((data) => {
      contacts = Object.entries(data || {})
        .map(([id, user]) => ({
          name: user?.name?.trim() || null,
          color: user?.color || "gray",
        }))
        .filter((c) => c.name); // nur Kontakte mit gültigem Namen
      sortContactsAlphabetically(contacts);
    })
    .catch((err) => console.error("Could not load contacts:", err));
}

function toggleAssignOptions() {
  renderAssignOptions(contacts);
  const container = document.getElementById("dropdown-assign");
  const containerDropdown = document.getElementById("container-dropdown");
  const input = document.getElementById("assigned-to");
  container.classList.toggle("d-none");
  containerDropdown.classList.toggle("box-shadow");
  input.placeholder == "Select contacts to assign"
    ? ((input.placeholder = ""), changeDropdownArrow(true, "assigned"))
    : ((input.placeholder = "Select contacts to assign"),
      changeDropdownArrow(false, "assigned"));
}

function closeDropdown() {
  document.getElementById("dropdown-assign")?.classList.add("d-none");
  document.getElementById("container-dropdown")?.classList.remove("box-shadow");
  document.getElementById("assigned-to").value = "";
  document.getElementById("assigned-to").placeholder =
    "Select contacts to assign";
  changeDropdownArrow(false, "assigned");
}

function changeDropdownArrow(state, dropdown) {
  const arrow = document.getElementById(`arrow-dropdown-${dropdown}`);
  arrow.src = state
    ? "../assets/icons/arrow_drop_down_mirrored.svg"
    : "../assets/icons/arrow_drop_down.svg";
}

function toggleInputFocus() {
  if (
    !document.getElementById("dropdown-assign").classList.contains("d-none")
  ) {
    document.getElementById("assigned-to").focus();
  }
}
// ====== CONTACT RENDERING ======
function renderAssignOptions(array) {
  const dropDown = document.getElementById("dropdown-assign");
  dropDown.innerHTML = "";
  if (selectedContacts.length === 0) {
    renderDefaultContacts(array, dropDown);
  } else {
    checkForSelectedContacts(array, dropDown);
  }
  checkForScrollableContainer(dropDown);
}

function renderDefaultContacts(array, dropDown) {
  for (let i = 0; i < array.length; i++) {
    let contactName = array[i].name;
    let color = array[i].color;
    renderContactAsDefault(dropDown, contactName, color);
  }
}

function checkForSelectedContacts(array, dropDown) {
  for (let i = 0; i < array.length; i++) {
    let contactName = array[i].name;
    let color = array[i].color;
    if (isInSelectedContacts(contactName)) {
      renderContactAsSelected(dropDown, contactName, color);
    } else {
      renderContactAsDefault(dropDown, contactName, color);
    }
  }
}

function renderContactAsDefault(dropDown, contactName, color) {
  dropDown.innerHTML += returnAssignedContactHTML(contactName, color);
  document.getElementById(`${contactName}`).innerText = contactName;
  document.getElementById(`initials-${contactName}`).innerText =
    getInitials(contactName);
  document.getElementById(`initials-${contactName}`).classList.add(`${color}`);
}

function renderContactAsSelected(dropDown, contactName, color) {
  renderContactAsDefault(dropDown, contactName, color);
  let contactDiv = document.getElementById(`container-${contactName}`);
  let icon = document.getElementById(`icon-${contactName}`);
  toggleSelection(true, contactDiv, icon);
}
function isInSelectedContacts(name) {
  return selectedContacts.some((c) => c.name === name);
}

function selectContact(name, color) {
  let contactDiv = document.getElementById(`container-${name}`);
  let icon = document.getElementById(`icon-${name}`);
  if (!isContactSelected(contactDiv)) {
    toggleSelection(true, contactDiv, icon);
    updateSelectedContacts(true, name, color);
  } else {
    toggleSelection(false, contactDiv, icon);
    updateSelectedContacts(false, name, color);
  }
  displaySelectedContacts();
}

function toggleSelection(state, div, icon) {
  if (state) {
    div.classList.add("selected", "selected-hover", "white");
    icon.src = "../assets/icons/checked.svg";
    icon.classList.add("filter-white");
  } else {
    div.classList.remove("selected", "selected-hover", "white");
    icon.src = "../assets/icons/unchecked.svg";
    icon.classList.remove("filter-white");
  }
}

function isContactSelected(div) {
  return div.classList.contains("selected");
}

function updateSelectedContacts(add, name, color) {
  let obj = { name, color };
  if (add) {
    selectedContacts.push(obj);
    sortContactsAlphabetically(selectedContacts);
  } else {
    selectedContacts = selectedContacts.filter((c) => c.name !== name);
  }
}

function displaySelectedContacts() {
  const container = document.getElementById("container-assigned-contacts");
  container.innerHTML = "";
  selectedContacts.forEach((c) => {
    const initials = getInitials(c.name);
    container.innerHTML += returnAssignedContactPreviewHTML(initials, c.color);
  });
  container.classList.toggle("padding-bottom-8", selectedContacts.length > 8);
}

function checkForScrollableContainer(container) {
  if (contacts.length < 6) {
    container.style.width = "440px";
    Array.from(
      document.getElementsByClassName("container-custom-select-option")
    ).forEach((e) => e.classList.remove("select-option-with-scrollbar"));
  }
}

function getInitials(name) {
  if (!name || typeof name !== "string") return "??";
  return name
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

function sortContactsAlphabetically(arr) {
  arr.sort((a, b) => a.name.localeCompare(b.name));
}

async function createTask() {
  const task = {
    title: document.getElementById("title").value.trim(),
    description: document.getElementById("description").value.trim(),
    dueDate: document.getElementById("dueDate").value.trim(),
    priority: selectedPriority,
    category: document.getElementById("category").value,
    assignedTo: selectedContacts.map((c) => c.name), // mehrere möglich
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

function resetForm() {
  document.getElementById("taskForm").reset();
  document.getElementById("subtaskList").innerHTML = "";
  document.getElementById("assigned-to").value = "";
  document.getElementById("assigned-to").placeholder =
    "Select contacts to assign";
  document.getElementById("container-assigned-contacts").innerHTML = "";
  selectedContacts = [];
  assignedTo = null;
  subtasks.length = 0;
  selectedPriority = "medium";
  setPriority("medium");
  toggleCreateBtn();
}

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

function returnAssignedContactHTML(name, color) {
  const initials = getInitials(name);
  return `
    <div class="container-custom-select-option" id="container-${name}" onclick="selectContact('${name}', '${color}')">
      <div class="flex-align gap-15">
        <div id="initials-${name}" class="initials" style="background-color: ${color}">${initials}</div>
        <span class="name" id="${name}">${name}</span>
      </div>
      <img id="icon-${name}" class="checkbox" src="./assets/icons/unchecked.svg" alt="checkbox">
    </div>
  `;
}

function returnAssignedContactPreviewHTML(initials, color) {
  return `
    <div class="initials" style="background-color: ${color}">${initials}</div>
  `;
}
