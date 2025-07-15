/**
 * Creates the dot element for a subtask row.
 * @returns {HTMLElement} The dot span element.
 */
function createSubtaskRowDot() {
    let dot = document.createElement('span');
    dot.className = 'subtask-dot';
    dot.textContent = '•';
    return dot;
}

/**
 * Creates an input element for a subtask and attaches all logic.
 * @param {string} text - The subtask text.
 * @param {HTMLLIElement} li - The parent list item element.
 * @returns {HTMLInputElement} The configured input element.
 */
function createSubtaskInputElem(text, li) {
    let input = document.createElement("input");
    input.type = "text";
    input.value = text;
    input.className = "subtask-list-editinput";
    input.readOnly = true;
    addSubtaskInputElemEvents(input, li);
    return input;
}

/**
 * Creates the button element for adding a subtask.
 * @returns {HTMLButtonElement} The add button element.
 */
function createAddSubtaskButton() {
    let addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.id = 'add-subtask-btn';
    addBtn.textContent = '+';
    addBtn.className = 'add-subtask-btn';
    return addBtn;
}

/**
 * Creates the input element for editing a subtask row.
 * @param {Object|string} sub - The subtask object or string.
 * @param {number} idx - The index of the subtask in the array.
 * @param {Array<Object>} subtaskArr - The array of subtasks.
 * @returns {HTMLInputElement} The input element.
 */
function createSubtaskRowInput(sub, idx, subtaskArr) {
    let input = document.createElement('input');
    input.type = 'text';
    input.value = typeof sub === 'string' ? sub : sub.title;
    input.className = 'subtask-list-editinput';
    input.readOnly = true;
    input.activateEdit = () => { input.readOnly = false; input.focus(); input.setSelectionRange(0, input.value.length); };
    input.onblur = () => { if (input.value.trim() !== '') subtaskArr[idx].title = input.value.trim(); input.readOnly = true; };
    input.onkeydown = (e) => { if (e.key === 'Enter') input.blur(); };
    return input;
}

/**
 * Creates the edit button for a subtask row.
 * @param {HTMLInputElement} input - The input element to activate edit on.
 * @returns {HTMLButtonElement} The edit button element.
 */
function createSubtaskRowEditButton(input) {
    let editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'subtask-edit-btn';
    editBtn.innerHTML = `<img src="assets/icons/board/board-edit-icon.svg">`;
    editBtn.title = 'Bearbeiten';
    editBtn.onclick = (e) => {
        e.preventDefault();
        input.activateEdit();
    };
    return editBtn;
}

/**
 * Creates the remove button for a subtask row.
 * @param {number} idx - The index of the subtask.
 * @param {Array<Object>} subtaskArr - The array of subtasks.
 * @param {Function} rerender - The rerender callback.
 * @returns {HTMLButtonElement} The remove button element.
 */
function createSubtaskRowRemoveButton(idx, subtaskArr, rerender) {
    let removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'subtask-remove-btn';
    removeBtn.innerHTML = `<img src="assets/icons/board/board-delete-icon.svg">`;
    removeBtn.onclick = (e) => {
        e.preventDefault();
        subtaskArr.splice(idx, 1);
        rerender();
    };
    return removeBtn;
}

/**
 * Creates a row element for an editable subtask.
 * @param {Object|string} sub - The subtask object or string.
 * @param {number} idx - The index of the subtask.
 * @param {Array<Object>} subtaskArr - The array of subtasks.
 * @param {Function} rerender - The rerender callback.
 * @param {HTMLElement} container - The parent container.
 * @returns {HTMLElement} The subtask row element.
 */
function createSubtaskRow(sub, idx, subtaskArr, rerender, container) {
    let row = document.createElement('div');
    row.className = 'subtask-list-row';
    let input = createSubtaskRowInput(sub, idx, subtaskArr);
    let editBtn = createSubtaskRowEditButton(input);
    let removeBtn = createSubtaskRowRemoveButton(idx, subtaskArr, rerender);
    let dot = createSubtaskRowDot();
    row.appendChild(dot);
    row.appendChild(input);
    row.appendChild(editBtn);
    row.appendChild(removeBtn);
    row.ondblclick = () => {
        input.activateEdit();
    };
    return row;
}

/**
 * Creates a list item DOM element for a subtask, including edit/remove actions.
 * @param {string} text - The subtask text.
 * @returns {HTMLLIElement} The subtask list item element.
 */
function createSubtaskListItem(text) {
    let li = document.createElement("li");
    li.className = "subtask-list-item";
    li.appendChild(createSubtaskDot());
    let input = createSubtaskInputElem(text, li);
    li.appendChild(input);
    li.appendChild(createEditBtn(input));
    li.appendChild(createRemoveBtn(li));
    li.ondblclick = () => input.activateEdit();
    return li;
}

/**
 * Creates the edit button for a subtask.
 * @param {HTMLInputElement} input - The input to activate editing.
 * @returns {HTMLButtonElement} The edit button.
 */
function createEditBtn(input) {
    let editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.className = "subtask-edit-btn";
    editBtn.innerHTML = `<img src="assets/icons/board/board-edit-icon.svg">`;
    editBtn.title = "Bearbeiten";
    editBtn.onclick = (e) => {
        e.preventDefault();
        input.activateEdit();
    };
    return editBtn;
}

/**
 * Creates the remove button for a subtask.
 * @param {HTMLLIElement} li - The list item to remove.
 * @returns {HTMLButtonElement} The remove button.
 */
function createRemoveBtn(li) {
    let removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "subtask-remove-btn";
    removeBtn.innerHTML = `<img src="assets/icons/board/board-delete-icon.svg">`;
    removeBtn.onclick = (e) => {
        e.preventDefault();
        li.remove();
    };
    return removeBtn;
}

/**
 * Creates the text input for adding a new subtask.
 * @returns {HTMLInputElement} The input element.
 */
function createSubtaskInput() {
    let input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Add new subtask';
    input.id = 'add-subtask-input';
    input.className = 'add-subtask-input';
    return input;
}