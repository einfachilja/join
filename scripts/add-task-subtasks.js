import { Utils } from "./add-task-utils.js";

let isEditingSubtask = false;

export const SubtaskManager = {
  subtasks: [],
  /** Sets up event handlers for subtask input */
  setupSubtaskEvents() {
    const input = document.getElementById("subtask-input");
    if (!input) return;
    input.oninput = () => {
      this.toggleIcons();
      const iconWrapper = document.getElementById("subtask-icons");
      iconWrapper?.classList.toggle("hidden", input.value.trim().length === 0);
    };
    input.onfocus = this.toggleIcons;
    input.onkeydown = this.handleEnterKey.bind(this);
  },
  /** Adds a new subtask from input */
  addSubtask() {
    const input = document.getElementById("subtask-input");
    const subtaskIcons = document.getElementById("subtask-icons");
    const text = input.value.trim();
    if (!this.validateInput(text, subtaskIcons, input)) return;
    this.subtasks.push({ title: text, completed: false });
    document
      .getElementById("subtask-list")
      .appendChild(this.createSubtaskItem(text));
    this.finalizeInput(input, subtaskIcons);
  },
  /** Validates input text and icon visibility */
  validateInput(text, iconWrapper, input) {
    if (!text || iconWrapper.classList.contains("hidden")) {
      input.classList.add("error-border");
      return false;
    }
    input.classList.remove("error-border");
    return true;
  },
  /** Resets input and hides subtask icons */
  finalizeInput(input, subtaskIcons) {
    input.value = "";
    subtaskIcons.classList.add("hidden");
    document.getElementById("subtask-plus")?.classList.remove("hidden");
  },
  /** Creates a subtask list item */
  createSubtaskItem(data) {
    return createSubtaskItemHelper(this, data);
  },
  /** Creates the dot element */
  createDot() {
    const dot = document.createElement("span");
    dot.className = "subtask-dot";
    dot.textContent = "•";
    return dot;
  },
  /** Creates the label element */
  createLabel(data) {
    const label = document.createElement("span");
    label.className = "subtask-label";
    label.textContent = data.title || data;
    return label;
  },
  /** Creates the edit button */
  createEditButton(li) {
    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.className = "subtask-edit-btn";
    editBtn.innerHTML = `<img src="./assets/icons/board/board-edit-icon.svg" alt="Edit">`;
    editBtn.onclick = (e) => {
      e.stopPropagation();
      this.enterEditMode(li);
    };
    return editBtn;
  },
  /** Creates the remove button */
  createRemoveButton(data, li) {
    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "subtask-remove-btn";
    removeBtn.innerHTML = `<img src="./assets/icons/board/board-delete-icon.svg" alt="Delete">`;
    removeBtn.onclick = (e) => {
      e.stopPropagation();
      const title = data.title || data;
      const idx = this.subtasks.findIndex((s) => s.title === title);
      if (idx > -1) this.subtasks.splice(idx, 1);
      li.remove();
      document.getElementById("subtask-plus")?.classList.remove("hidden");
    };
    return removeBtn;
  },
  /** Builds container for edit and remove buttons */
  buildIconWrapper(editBtn, removeBtn) {
    const iconWrapper = document.createElement("div");
    iconWrapper.className = "subtask-list-icons";
    iconWrapper.append(editBtn, removeBtn);
    return iconWrapper;
  },
  /** Sets click handler on label to enter edit mode */
  setupClickToEdit(li) {
    const label = li.querySelector(".subtask-label");
    if (!label) return;
    label.onclick = () => {
      this.enterEditMode(li);
    };
  },
  /** Sets up hover behavior */
  setupHover(li) {
    this.setupClickToEdit(li);
  },
  /** Enters edit mode for a subtask */
  enterEditMode(li) {
    return enterEditModeHelper(this, li);
  },
  /** Retrieves label text */
  getLabelText(li) {
    return li.querySelector(".subtask-label")?.textContent || "";
  },
  /** Creates input element for editing */
  createEditInput(currentText) {
    const input = document.createElement("input");
    input.type = "text";
    input.value = currentText;
    input.className = "subtask-edit-input";
    input.setAttribute("autocomplete", "off");
    handleEditInputKeydown(input, currentText);
    return input;
  },
  /** Creates confirm button for editing */
  createConfirmBtn(oldText, li, input) {
    const btn = document.createElement("img");
    btn.src = "./assets/icons/add-task/add-task-check.svg";
    btn.alt = "Confirm";
    btn.className = "subtask-edit-confirm";
    handleConfirmBtnClick(btn, oldText, li, input);
    return btn;
  },
  /** Creates cancel button for editing */
  createCancelBtn(oldText, li) {
    const btn = document.createElement("img");
    btn.src = "./assets/icons/board/board-delete-icon.svg";
    btn.alt = "Delete";
    btn.className = "subtask-edit-cancel";
    btn.setAttribute("data-old-title", oldText);
    handleCancelBtnClick(btn, li);
    return btn;
  },
  /** Updates label text and subtask data */
  updateLabel(li, newVal) {
    this.updateSubtaskData(li, newVal);
    this.replaceListItem(li, newVal);
  },
  /** Updates subtask data array */
  updateSubtaskData(li, newVal) {
    const idx = this.subtasks.findIndex((s) => s.title === li._dataOriginal);
    if (idx > -1) this.subtasks[idx].title = newVal;
  },
  /** Replaces list item with updated data */
  replaceListItem(li, newVal) {
    const newLi = this.createSubtaskItem({ title: newVal });
    li.replaceWith(newLi);
  },
  /** Assembles edit UI inside list item */
  assembleEditUI(li, input, cancel, confirm) {
    const wrapper = this.createEditContainer();
    const inputWrap = this.createInputWrapper(input);
    const btns = this.createEditButtonsWrapper(cancel, confirm);
    this.setupCancelClick(cancel, li);
    wrapper.appendChild(inputWrap);
    wrapper.appendChild(btns);
    li.appendChild(wrapper);
  },
  /** Creates container for edit UI */
  createEditContainer() {
    const wrapper = document.createElement("div");
    wrapper.className = "subtask-edit-container";
    return wrapper;
  },
  /** Creates wrapper for edit input */
  createInputWrapper(input) {
    const inputWrap = document.createElement("div");
    inputWrap.className = "subtask-input-edit-wrapper";
    inputWrap.appendChild(input);
    return inputWrap;
  },
  /** Creates wrapper for cancel and confirm buttons */
  createEditButtonsWrapper(cancel, confirm) {
    const btns = document.createElement("div");
    btns.className = "subtask-edit-buttons";
    btns.appendChild(cancel);
    const divider = document.createElement("img");
    divider.src = "./assets/icons/add-task/add-task-divider.svg";
    divider.alt = "";
    btns.appendChild(divider);
    btns.appendChild(confirm);
    return btns;
  },
  /** Sets up cancel button click handler */
  setupCancelClick(cancel, li) {
    cancelBtnClickHandler(cancel, li);
  },
  /** Handles Enter key to add subtask */
  handleEnterKey(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      const icons = document.getElementById("subtask-icons");
      if (icons && !icons.classList.contains("hidden")) this.addSubtask();
    }
  },
  /** Toggles confirm, cancel, and plus icons visibility */
  toggleIcons() {
    const input = document.getElementById("subtask-input");
    const confirm = document.getElementById("subtask-confirm");
    const cancel = document.getElementById("subtask-cancel");
    const plus = document.getElementById("subtask-plus");
    const isActive = document.activeElement === input;
    confirm?.classList.toggle("hidden", !isActive);
    cancel?.classList.toggle("hidden", !isActive);
    plus?.classList.toggle("hidden", isActive);
  },
  /** Clears input field and resets icons */
  clearInput() {
    document.getElementById("subtask-input").value = "";
    document.getElementById("subtask-icons")?.classList.add("hidden");
    document.getElementById("subtask-plus")?.classList.remove("hidden");
  },
  /** Returns a copy of subtasks */
  getSubtasks() {
    return [...this.subtasks];
  },
  /** Resets subtasks and clears input */
  reset() {
    this.subtasks = [];
    const list = document.getElementById("subtask-list");
    if (list) list.innerHTML = "";
    this.clearInput();
  },
};
/** Creates a subtask list item */
function createSubtaskItemHelper(ctx, data) {
  const li = document.createElement("li");
  li.className = "subtask-list-item";
  const { dot, label, editBtn, removeBtn, iconWrapper } =
    buildSubtaskItemElements(ctx, li, data);
  li.append(dot, label, iconWrapper);
  ctx.setupClickToEdit(li);
  return li;
}
/** Enters edit mode for a subtask */
function enterEditModeHelper(ctx, li) {
  const currentText = ctx.getLabelText(li);
  if (!currentText) return;
  injectEditModeUI(ctx, li, currentText);
}
// --- Extracted helper functions ---
/** Handles keydown in edit input */
function handleEditInputKeydown(input, currentText) {
  input.onkeydown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const confirmBtn = input
        .closest("li")
        ?.querySelector(".subtask-edit-confirm");
      confirmBtn?.click();
    }
    if (e.key === "Escape") {
      e.preventDefault();
      const li = input.closest("li");
      if (li) {
        SubtaskManager.updateLabel(li, currentText);
      }
    }
  };
}
/** Handles cancel button click */
function handleCancelBtnClick(btn, li) {
  btn.onclick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    isEditingSubtask = true;
    const input = li.querySelector(".subtask-edit-input");
    const currentTitle = input?.value?.trim();
    const idx = SubtaskManager.subtasks.findIndex(
      (s) =>
        s.title === currentTitle ||
        s.title === btn.getAttribute("data-old-title")
    );
    if (idx > -1) SubtaskManager.subtasks.splice(idx, 1);
    li.remove();
    li.classList.remove("editing");
  };
}
/** Handles confirm button click */
function handleConfirmBtnClick(btn, oldText, li, input) {
  btn.onclick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const newVal = input.value.trim();
    if (!newVal) return;
    const idx = SubtaskManager.subtasks.findIndex((s) => s.title === oldText);
    if (idx > -1) SubtaskManager.subtasks[idx].title = newVal;
    SubtaskManager.updateLabel(li, newVal);
  };
}
/** Handles cancel button click (duplicate) */
function cancelBtnClickHandler(cancel, li) {
  cancel.onclick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const input = li.querySelector(".subtask-edit-input");
    const currentTitle =
      input?.value?.trim() || cancel.getAttribute("data-old-title");
    const idx = SubtaskManager.subtasks.findIndex(
      (s) =>
        s.title === currentTitle ||
        s.title === cancel.getAttribute("data-old-title")
    );
    if (idx > -1) SubtaskManager.subtasks.splice(idx, 1);
    li.remove();
    li.classList.remove("editing");
  };
}
/** Builds subtask item elements */
function buildSubtaskItemElements(ctx, li, data) {
  const dot = ctx.createDot();
  const label = ctx.createLabel(data);
  const editBtn = ctx.createEditButton(li);
  const removeBtn = ctx.createRemoveButton(data, li);
  const iconWrapper = ctx.buildIconWrapper(editBtn, removeBtn);
  return { dot, label, editBtn, removeBtn, iconWrapper };
}
/** Injects edit mode UI */
function injectEditModeUI(ctx, li, currentText) {
  li.classList.add("editing");
  li.innerHTML = "";
  const input = ctx.createEditInput(currentText);
  const cancelBtn = ctx.createCancelBtn(currentText, li);
  const confirmBtn = ctx.createConfirmBtn(currentText, li, input);
  ctx.assembleEditUI(li, input, cancelBtn, confirmBtn);
  ctx.setupClickToEdit(li);
  input.focus();
}
