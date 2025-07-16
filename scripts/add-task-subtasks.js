/**
 * Manages all subtask-related logic.
 */

import { Utils } from "./add-task-utils.js";

let isEditingSubtask = false;

export const SubtaskManager = {
  subtasks: [],

  /**
   * Initialize input field event listeners for subtasks.
   * @function
   */
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

  /**
   * Add a new subtask from input.
   * @function
   */
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

  /**
   * Validate the input field for a new subtask.
   * @param {string} text - Input value
   * @param {HTMLElement} iconWrapper - Icon container element
   * @param {HTMLInputElement} input - Input element
   * @returns {boolean} True if input is valid
   * @function
   */
  validateInput(text, iconWrapper, input) {
    if (!text || iconWrapper.classList.contains("hidden")) {
      input.classList.add("error-border");
      return false;
    }
    input.classList.remove("error-border");
    return true;
  },

  /**
   * Reset subtask input field and UI state.
   * @param {HTMLInputElement} input - Input element
   * @param {HTMLElement} subtaskIcons - Icons container
   * @function
   */
  finalizeInput(input, subtaskIcons) {
    input.value = "";
    subtaskIcons.classList.add("hidden");
    document.getElementById("subtask-plus")?.classList.remove("hidden");
  },

  
  /**
   * Create list item element for a subtask.
   * @param {string|object} data - Subtask title or object with title
   * @returns {HTMLLIElement} Subtask list item
   * @function
   */
createSubtaskItem(data) {
  const li = document.createElement("li");
  li.className = "subtask-list-item";

  // 1) Bullet links
  const dot = document.createElement("span");
  dot.className = "subtask-dot";
  dot.textContent = "•";

  // 2) Text-Label
  const label = document.createElement("span");
  label.className = "subtask-label";
  label.textContent = data.title || data;

  // 3) Icon-Wrapper für List‑Item‑Icons
  const iconWrapper = document.createElement("div");
  iconWrapper.className = "subtask-list-icons";

  // 3a) Edit‑Button (Stift)
  const editBtn = document.createElement("button");
  editBtn.type = "button";
  editBtn.className = "subtask-edit-btn";
  editBtn.innerHTML = `<img src="./assets/icons/board/board-edit-icon.svg" alt="Edit">`;
  // ← Klick auf das Stift ruft den Edit‑Mode auf
  editBtn.onclick = e => {
    e.stopPropagation();
    this.enterEditMode(li);
  };

  // 3b) Remove‑Button (Mülleimer)
  const removeBtn = document.createElement("button");
  removeBtn.type = "button";
  removeBtn.className = "subtask-remove-btn";
  removeBtn.innerHTML = `<img src="./assets/icons/board/board-delete-icon.svg" alt="Delete">`;
  // (optional) Klick auf den Mülleimer entfernt das Item
  removeBtn.onclick = e => {
    e.stopPropagation();
    // aus Array löschen
    const title = data.title || data;
    const idx = this.subtasks.findIndex(s => s.title === title);
    if (idx > -1) this.subtasks.splice(idx, 1);
    // aus DOM löschen
    li.remove();
    // Plus‑Icon wieder einblenden
    document.getElementById("subtask-plus")?.classList.remove("hidden");
  };

  iconWrapper.append(editBtn, removeBtn);

  // 4) Alles zusammensetzen
  li.append(dot, label, iconWrapper);

  // schon vorhandene Klick‑Logik (z. B. Doppelklick oder Enter) bleibt erhalten
  this.setupClickToEdit(li);

  return li;
},

  /**
   * Add click listener on label to enter edit mode.
   * @param {HTMLLIElement} li - Subtask item
   * @function
   */
  setupClickToEdit(li) {
    const label = li.querySelector(".subtask-label");
    if (!label) return;
    label.onclick = () => {
      this.enterEditMode(li);
    };
  },

  /**
   * Add delayed hover listener for entering edit mode.
   * @param {HTMLLIElement} li - Subtask item
   * @function
   */
  setupHover(li) {
    this.setupClickToEdit(li);
  },

  /**
   * Activate inline edit mode for a subtask.
   * @param {HTMLLIElement} li - Subtask item
   * @function
   */
  enterEditMode(li) {
    const currentText = this.getLabelText(li);
    if (!currentText) return;

    li.classList.add("editing");
    li.innerHTML = "";

    const input = this.createEditInput(currentText);
    const cancelBtn = this.createCancelBtn(currentText, li);
    const confirmBtn = this.createConfirmBtn(currentText, li, input);

    this.assembleEditUI(li, input, cancelBtn, confirmBtn);
    this.setupClickToEdit(li);
    input.focus();
  },

  /**
   * Get current subtask label text.
   * @param {HTMLLIElement} li - Subtask item
   * @returns {string} Subtask title
   * @function
   */
  getLabelText(li) {
    return li.querySelector(".subtask-label")?.textContent || "";
  },

  /**
   * Create text input element for editing a subtask.
   * @param {string} currentText - Current subtask title
   * @returns {HTMLInputElement} Editable input field
   * @function
   */
  createEditInput(currentText) {
    const input = document.createElement("input");
    input.type = "text";
    input.value = currentText;
    input.className = "subtask-edit-input";
    input.setAttribute("autocomplete", "off");
    input.onkeydown = (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        // Confirm is handled via button, so simulate click
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
    return input;
  },

  /**
   * Create confirm button for subtask editing.
   * @param {string} oldText - Original subtask title
   * @param {HTMLLIElement} li - Subtask item
   * @param {HTMLInputElement} input - Edited input element
   * @returns {HTMLImageElement} Confirm button
   * @function
   */
  createConfirmBtn(oldText, li, input) {
    const btn = document.createElement("img");
    btn.src = "./assets/icons/add-task/add-task-check.svg";
    btn.alt = "Confirm";
    btn.className = "subtask-edit-confirm";
    btn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const newVal = input.value.trim();
      if (!newVal) return;
      const idx = this.subtasks.findIndex((s) => s.title === oldText);
      if (idx > -1) this.subtasks[idx].title = newVal;
      this.updateLabel(li, newVal);
    };
    return btn;
  },

  /**
   * Create cancel/delete button for subtask editing.
   * @param {string} oldText - Original subtask title
   * @param {HTMLLIElement} li - Subtask item
   * @returns {HTMLImageElement} Cancel button
   * @function
   */
  createCancelBtn(oldText, li) {
    const btn = document.createElement("img");
    btn.src = "./assets/icons/board/board-delete-icon.svg";
    btn.alt = "Delete";
    btn.className = "subtask-edit-cancel";
    btn.setAttribute("data-old-title", oldText);
    btn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      isEditingSubtask = true;
      const input = li.querySelector(".subtask-edit-input");
      const currentTitle = input?.value?.trim();
      const idx = this.subtasks.findIndex(
        (s) =>
          s.title === currentTitle ||
          s.title === btn.getAttribute("data-old-title")
      );
      if (idx > -1) this.subtasks.splice(idx, 1);
      li.remove();
      li.classList.remove("editing");
    };
    return btn;
  },

  /**
   * Update subtask label after edit and restore hover.
   * @param {HTMLLIElement} li - Subtask item
   * @param {string} newVal - New title
   * @function
   */
updateLabel(li, newVal) {
  // 1) Datenquelle updaten
  const idx = this.subtasks.findIndex(s => s.title === li._dataOriginal);
  if (idx > -1) this.subtasks[idx].title = newVal;

  // 2) Komplettes neues LI erzeugen
  const newLi = this.createSubtaskItem({ title: newVal });

  // 3) Alten LI im DOM damit ersetzen
  li.replaceWith(newLi);
},

  /**
   * Insert editable UI for subtask editing.
   * @param {HTMLLIElement} li - Subtask item
   * @param {HTMLInputElement} input
   * @param {HTMLElement} cancel
   * @param {HTMLElement} confirm
   * @function
   */
  assembleEditUI(li, input, cancel, confirm) {
    const wrapper = document.createElement("div");
    wrapper.className = "subtask-edit-container";

    const inputWrap = document.createElement("div");
    inputWrap.className = "subtask-input-edit-wrapper";
    inputWrap.appendChild(input);

    const btns = document.createElement("div");
    btns.className = "subtask-edit-buttons";
    // New order and explicit event binding
    btns.appendChild(cancel);
    const divider = document.createElement("img");
    divider.src = "./assets/icons/add-task/add-task-divider.svg";
    divider.alt = "";
    btns.appendChild(divider);
    btns.appendChild(confirm);

    cancel.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const input = li.querySelector(".subtask-edit-input");
      const currentTitle =
        input?.value?.trim() || cancel.getAttribute("data-old-title");
      const idx = this.subtasks.findIndex(
        (s) =>
          s.title === currentTitle ||
          s.title === cancel.getAttribute("data-old-title")
      );
      if (idx > -1) this.subtasks.splice(idx, 1);
      li.remove();
      li.classList.remove("editing");
    };

    wrapper.appendChild(inputWrap);
    wrapper.appendChild(btns);
    li.appendChild(wrapper);
  },

  /**
   * Listen for Enter key to confirm subtask add.
   * @param {KeyboardEvent} e
   * @function
   */
  handleEnterKey(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      const icons = document.getElementById("subtask-icons");
      if (icons && !icons.classList.contains("hidden")) this.addSubtask();
    }
  },

  /**
   * Show/hide subtask icons based on input focus.
   * @function
   */
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

  /**
   * Clear subtask input field manually.
   * @function
   */
  clearInput() {
    document.getElementById("subtask-input").value = "";
    document.getElementById("subtask-icons")?.classList.add("hidden");
    document.getElementById("subtask-plus")?.classList.remove("hidden");
  },

  /**
   * Get a copy of the current subtasks.
   * @returns {Array} List of subtasks
   * @function
   */
  getSubtasks() {
    return [...this.subtasks];
  },

  /**
   * Clear subtask array and UI.
   * @function
   */
  reset() {
    this.subtasks = [];
    const list = document.getElementById("subtask-list");
    if (list) list.innerHTML = "";
    this.clearInput();
  },
};
