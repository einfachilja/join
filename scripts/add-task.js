let selectedPriority = 'medium';
const subtasks = [];

function setPriority(prio) {
  selectedPriority = prio;
  document.querySelectorAll('#prioGroup button').forEach(b => {
    b.classList.toggle('active', b.dataset.value === prio);
  });
}

setPriority('medium');

/** enable create button when required fields valid */
function toggleCreateBtn() {
  const title = document.getElementById('title').value.trim();
  const due   = document.getElementById('dueDate').value.trim();
  const cat   = document.getElementById('category').value;
  const btn   = document.getElementById('createBtn');
  btn.disabled = !(title && isValidDate(due) && cat);
}

/** check DD/MM/YYYY format */
function isValidDate(str) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(str);
  if (!m) return false;
  const [_, d, mo, y] = m.map(Number);
  const dt = new Date(y, mo - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === mo - 1 && dt.getDate() === d;
}

/** mark invalid date */
function validateDate() {
  const el = document.getElementById('dueDate');
  isValidDate(el.value.trim()) ? el.classList.remove('input-error') : el.classList.add('input-error');
}

/** toggle assigned dropdown */
function toggleDropdown(ev) {
  ev.stopPropagation();
  document.getElementById('assignedList').classList.toggle('hidden');
}

/** add a new subtask */
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

/** build task object */
function createTask() {
  const task = {
    title:       document.getElementById('title').value.trim(),
    description: document.getElementById('description').value.trim(),
    dueDate:     document.getElementById('dueDate').value.trim(),
    priority:    selectedPriority,
    category:    document.getElementById('category').value,
    subtasks:    [...subtasks]
    // assignedTo: … fill later with Firebase
  };
  console.log('Task ready:', task);
  alert('Task logged to console.');
}
