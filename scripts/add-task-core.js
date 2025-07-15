/**
 * Initialize Add Task page: event bindings, dropdowns, date input, etc.
 * @namespace AddTaskCore
 */

import { DropdownController } from "./add-task-dropdowns.js";
import { SubtaskManager } from "./add-task-subtasks.js";
import { FirebaseService } from "./add-task-firebase.js";

export const AddTaskCore = {
  /**
   * Initialize the Add Task page.
   * Sets up event listeners, dropdowns, date picker, and form submission.
   * @function
   */
  init() {
    this.setupDOMDefaults();
    this.setupDatePicker();
    this.setDefaultPriority();
    FirebaseService.fetchContacts();
    DropdownController.setupDropdownEvents();
    SubtaskManager.setupSubtaskEvents();
    this.setupAssignedFocus();
    this.setupOutsideClickEvents();
    this.setupSubmit();
    this.setupInputListeners();
    this.setupDropdownListeners();
    this.setupCancelButton();
  },

  setupInputListeners() {
    const titleInput = document.getElementById("title");
    if (titleInput) {
      titleInput.oninput = () => {
        titleInput.classList.remove("error");
        document.getElementById("error-title")?.classList.remove("visible");
      };
    }
    const dueDateInput = document.getElementById("dueDate");
    if (dueDateInput) {
      dueDateInput.oninput = () => {
        dueDateInput.classList.remove("error-border");
        document.getElementById("error-dueDate")?.classList.remove("visible");
      };
    }
  },

  setupDropdownListeners() {
    const catToggle = document.getElementById("category-toggle");
    if (catToggle) {
      catToggle.onclick = (e) => {
        catToggle.classList.remove("error-border");
        document.getElementById("error-category")?.classList.remove("visible");
        DropdownController.toggleCategoryDropdown(e);
      };
    }
    const prioButtons = document.querySelectorAll("#buttons-prio button");
    prioButtons.forEach((btn) => {
      btn.onclick = () => this.selectPriority(btn.dataset.prio);
    });
    const subtaskConfirmBtn = document.getElementById("subtask-confirm");
    if (subtaskConfirmBtn) {
      subtaskConfirmBtn.onclick = () => SubtaskManager.addSubtask();
    }
    const subtaskCancelBtn = document.getElementById("subtask-cancel");
    if (subtaskCancelBtn) {
      subtaskCancelBtn.onclick = () => SubtaskManager.clearInput();
    }
  },

  setupCancelButton() {
    const cancelBtn = document.getElementById("cancel-task-btn");
    if (cancelBtn) {
      cancelBtn.onclick = () => this.resetForm();
    }
  },

  /**
   * Set default placeholder and empty state for due date input.
   * @function
   */
  setupDOMDefaults() {
    const dueDate = document.getElementById("due-date");
    if (dueDate) {
      dueDate.value = "";
      dueDate.placeholder = "tt.mm.jjjj";
    }
  },

  /**
   * Set up date picker input behavior.
   * Changes type from text to date on focus, restricts past dates.
   * @function
   */
  setupDatePicker() {
    const input = document.getElementById("dueDate");
    if (!input) return;

    input.placeholder = "dd/mm/yyyy";
    input.type = "text";

    input.onfocus = () => this.handleDateFocus(input);
    input.onblur = () => this.resetDatePlaceholder(input);
  },

  /**
   * Handle focus event on due date input.
   * @param {HTMLInputElement} input The due date input element.
   * @function
   */
  handleDateFocus(input) {
    input.type = "date";
    input.min = new Date().toISOString().split("T")[0];
    input.focus();
    input.onchange = () => this.handleDateChange(input);
  },

  /**
   * Validate and format date after change.
   * Prevents past dates.
   * @param {HTMLInputElement} input The due date input element.
   * @function
   */
  handleDateChange(input) {
    const selectedDate = new Date(input.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate.setHours(0, 0, 0, 0) < today.getTime()) {
      return this.rejectPastDate(input);
    }

    const [y, m, d] = input.value?.split("-") ?? [];
    if (!d || !m || !y) {
      return this.rejectPastDate(input);
    }

    const formatted = `${d.padStart(2, "0")}/${m.padStart(2, "0")}/${y}`;
    setTimeout(() => {
      input.type = "text";
      input.value = formatted;
    }, 0);
  },

  /**
   * Reset date input on invalid past date.
   * @param {HTMLInputElement} input The due date input element.
   * @function
   */
  rejectPastDate(input) {
    input.type = "text";
    input.placeholder = "dd/mm/yyyy";
    input.value = "";
    input.classList.add("error-border");
    document.getElementById("error-dueDate")?.classList.add("visible");
  },

  /**
   * Reset placeholder if date input is empty.
   * @param {HTMLInputElement} input The due date input element.
   * @function
   */
  resetDatePlaceholder(input) {
    if (!input.value) {
      input.type = "text";
      input.placeholder = "dd/mm/yyyy";
    }
  },

  /**
   * Set the default priority button selection to medium.
   * @function
   */
  setDefaultPriority() {
    const prioGroup = document.getElementById("buttons-prio");
    if (!prioGroup) return;
    prioGroup.querySelectorAll("button").forEach((btn) => {
      if (btn.dataset.prio === "medium") btn.classList.add("selected");
    });
  },

  /**
   * Add blue outline when assigned-to input is focused.
   * @function
   */
  setupAssignedFocus() {
    const input = document.getElementById("assigned-to-input");
    const toggle = document.getElementById("dropdown-toggle");
    if (input && toggle) {
      input.onclick = () => toggle.classList.add("focused");
      document.onclick = (e) => {
        if (!toggle.contains(e.target)) toggle.classList.remove("focused");
      };
    }
  },

  /**
   * Close dropdowns when clicking outside their containers.
   * @function
   */
  setupOutsideClickEvents() {
    document.onclick = (e) => {
      const catWrap = document.getElementById("category-wrapper");
      const assWrap = document.getElementById("dropdown-wrapper");

      if (catWrap && !catWrap.contains(e.target)) {
        document.getElementById("category-toggle")?.classList.remove("open");
        document
          .getElementById("category-content")
          ?.classList.remove("visible");
      }

      if (assWrap && !assWrap.contains(e.target)) {
        document.getElementById("dropdown-toggle")?.classList.remove("open");
        document
          .getElementById("dropdown-content")
          ?.classList.remove("visible");
      }
    };
  },

  /**
   * Handle Create Task button click and trigger form validation + Firebase submit.
   * @function
   */
  setupSubmit() {
    const btn = document.getElementById("submit-task-btn");
    if (!btn) return;
    btn.disabled = false;
    btn.onclick = (e) => {
      e.preventDefault();
      if (this.validateForm()) {
        FirebaseService.submitTaskToFirebase().then(() => {
          FirebaseService.showTaskAddedPopup();
          setTimeout(() => (window.location.href = "./board.html"), 2000);
        });
      }
    };
  },

  /**
   * Validate required fields before task submission.
   * @returns {boolean} True if form is valid, else false.
   * @function
   */
  validateForm() {
    const title = document.getElementById("title");
    const dueDate = document.getElementById("dueDate");
    const catToggle = document.getElementById("category-toggle");

    const titleError = document.getElementById("error-title");
    const dateError = document.getElementById("error-dueDate");
    const catError = document.getElementById("error-category");

    const validTitle = title.value.trim() !== "";
    const validDate = dueDate.value.trim() !== "";
    const validCat = DropdownController.selectedCategory !== "";

    title.classList.toggle("error", !validTitle);
    titleError.classList.toggle("visible", !validTitle);

    dueDate.classList.toggle("error-border", !validDate);
    dateError.classList.toggle("visible", !validDate);

    catToggle.classList.toggle("error-border", !validCat);
    catError.classList.toggle("visible", !validCat);

    return validTitle && validDate && validCat;
  },

  /**
   * Highlight selected priority button.
   * @param {string} prio - Priority level ('low', 'medium', 'urgent')
   * @function
   */
  selectPriority(prio) {
    const prioButtons = document.querySelectorAll("#buttons-prio button");
    prioButtons.forEach((btn) => {
      btn.classList.toggle("selected", btn.dataset.prio === prio);
    });
  },

  /**
   * Reset all form fields, dropdowns and subtasks to default state.
   * @function
   */
  resetForm() {
    // Clear text inputs
    const title = document.getElementById("title");
    const description = document.getElementById("description");
    const dueDate = document.getElementById("dueDate");

    if (title) title.value = "";
    if (description) description.value = "";
    if (dueDate) dueDate.value = "";

    // Remove error messages and classes
    document.getElementById("error-title")?.classList.remove("visible");
    document.getElementById("error-dueDate")?.classList.remove("visible");
    document.getElementById("error-category")?.classList.remove("visible");

    title?.classList.remove("error");
    dueDate?.classList.remove("error-border");
    document
      .getElementById("category-toggle")
      ?.classList.remove("error-border");

    // Reset category dropdown
    DropdownController.selectedCategory = "";
    const catPlaceholder = document.querySelector("#category-toggle span");
    if (catPlaceholder) catPlaceholder.textContent = "Select category";

    // Reset assigned contacts
    DropdownController.selectedContacts = [];
    DropdownController.updateSelectedContactsUI();
    DropdownController.renderAssignOptions();

    // Reset priority to medium
    this.selectPriority("medium");

    // Reset subtasks and related UI
    SubtaskManager.subtasks = [];

    const subtaskList = document.getElementById("subtask-list");
    if (subtaskList) {
      subtaskList.innerHTML = "";
    }

    const subtaskInput = document.getElementById("subtask-input");
    if (subtaskInput) {
      subtaskInput.value = "";
    }
    const subtaskIcons = document.getElementById("subtask-icons");
    const subtaskPlus = document.getElementById("subtask-plus");
    if (subtaskIcons) subtaskIcons.classList.add("hidden");
    if (subtaskPlus) subtaskPlus.classList.remove("hidden");
    if (subtaskInput) subtaskInput.classList.remove("error-border");
  },
};
