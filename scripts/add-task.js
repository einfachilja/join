// scripts/add-task.js
let selectedPriority = 'medium';
const subtasks = [];

/** Button aktivieren, wenn Pflichtfelder ok sind */
function toggleCreateBtn() {
  const title = document.getElementById('title').value.trim();
  const due   = document.getElementById('dueDate').value.trim();
  const cat   = document.getElementById('category').value;
  const btn   = document.getElementById('createBtn');
  btn.disabled = !(title && isValidDate(due) && cat);
}

/** Prüft DD/MM/YYYY */
function isValidDate(str) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(str);
  if (!m) return false;
  const [_, d, mo, y] = m.map(Number);
  const dt = new Date(y, mo - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === mo - 1 && dt.getDate() === d;
}

/** markiert fehlerhaftes Datum */
function validateDate() {
  const el = document.getElementById('dueDate');
  isValidDate(el.value.trim()) ? el.classList.remove('input-error') : el.classList.add('input-error');
}

/** Priority setzen */
function setPriority(prio) {
  selectedPriority = prio;
  document.querySelectorAll('#prioGroup button').forEach(b => {
    b.classList.toggle('active', b.dataset.value === prio);
  });
}

/** Dropdown umschalten */
function toggleDropdown(ev) {
  ev.stopPropagation();
  document.getElementById('assignedList').classList.toggle('hidden');
}

/** Subtask hinzufügen */
function addSubtask() {
  const inp = document.getElementById('subtaskInput');
  const txt = inp.value.trim();
  if (!txt) return;
  subtasks.push(txt);
  const li = document.createElement('li');
  li.textContent = txt;
  document.getElementById('subtaskList').appendChild(li);
  inp.value = '';
}

/** Neues Task-Objekt bauen */
function createTask() {
  const task = {
    title:       document.getElementById('title').value.trim(),
    description: document.getElementById('description').value.trim(),
    dueDate:     document.getElementById('dueDate').value.trim(),
    priority:    selectedPriority,
    category:    document.getElementById('category').value,
    subtasks:    [...subtasks]
    // assignedTo: … später mit Firebase füllen
  };
  console.log('Task fertig:', task);
  alert('Task in Konsole erstellt.');
}
