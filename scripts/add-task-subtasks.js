/**
 * Manages all subtask-related logic.
 */

import { Utils } from "./add-task-utils.js";

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
    const label = document.createElement("span");
    label.textContent = data.title || data;
    label.className = "subtask-label";
    const iconWrapper = document.createElement("div");
    iconWrapper.className = "subtask-icons";
    li.appendChild(label);
    li.appendChild(iconWrapper);
    this.setupHover(li);
    return li;
  },

  /**
   * Add delayed hover listener for entering edit mode.
   * @param {HTMLLIElement} li - Subtask item
   * @function
   */
  setupHover(li) {
    li.onmouseenter = () => {
      if (li.classList.contains("editing")) return;
      li.editTimeout = setTimeout(() => {
        if (!li.classList.contains("editing")) this.enterEditMode(li);
      }, 600);
    };
    li.onmouseleave = () => {
      if (li.editTimeout) {
        clearTimeout(li.editTimeout);
        delete li.editTimeout;
      }
    };
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
    btn.onclick = () => {
      const newVal = input.value.trim();
      if (newVal) {
        const idx = this.subtasks.findIndex((s) => s.title === oldText);
        if (idx > -1) this.subtasks[idx].title = newVal;
        this.updateLabel(li, newVal);
      }
      li.classList.remove("editing");
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
    btn.src = "./assets/icons/closeXSymbol.svg";
    btn.alt = "Delete";
    btn.className = "subtask-edit-cancel";
    btn.onclick = () => {
      const idx = this.subtasks.findIndex((s) => s.title === oldText);
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
    li.innerHTML = "";
    li.classList.remove("editing");
    const label = document.createElement("span");
    label.textContent = newVal;
    label.className = "subtask-label";
    li.appendChild(label);

    this.setupHover(li);
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
    btns.appendChild(cancel);
    btns.appendChild(confirm);

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
