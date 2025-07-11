import { DropdownController } from "./add-task-dropdowns.js";
import { SubtaskManager } from "./add-task-subtasks.js";
import { FirebaseService } from "./add-task-firebase.js";

export const AddTaskCore = {
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

    const catToggle = document.getElementById("category-toggle");
    if (catToggle) {
      catToggle.onclick = function (e) {
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

    const cancelBtn = document.getElementById("cancel-task-btn");
    if (cancelBtn) {
      cancelBtn.onclick = () => this.resetForm();
    }
  },

  setupDOMDefaults() {
    const dueDate = document.getElementById("due-date");
    if (dueDate) {
      dueDate.value = "";
      dueDate.placeholder = "tt.mm.jjjj";
    }
  },

  setupDatePicker() {
    const input = document.getElementById("dueDate");
    if (!input) return;

    input.placeholder = "dd/mm/yyyy";
    input.type = "text";

    input.onfocus = () => this.handleDateFocus(input);
    input.onblur = () => this.resetDatePlaceholder(input);
  },

  handleDateFocus(input) {
    input.type = "date";
    const today = new Date().toISOString().split("T")[0];
    input.setAttribute("min", today);
    input.focus();
    input.onchange = () => this.handleDateChange(input);
  },

  handleDateChange(input) {
    const selectedDate = new Date(input.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
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

  rejectPastDate(input) {
    input.type = "text";
    input.placeholder = "dd/mm/yyyy";
    input.value = "";
    input.classList.add("error-border");
    document.getElementById("error-dueDate")?.classList.add("visible");
  },

  resetDatePlaceholder(input) {
    if (!input.value) {
      input.type = "text";
      input.placeholder = "dd/mm/yyyy";
    }
  },

  setDefaultPriority() {
    const prioGroup = document.getElementById("buttons-prio");
    if (!prioGroup) return;
    prioGroup.querySelectorAll("button").forEach((btn) => {
      if (btn.dataset.prio === "medium") btn.classList.add("selected");
    });
  },

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

  setupSubmit() {
    const form = document.getElementById("task-form");
    if (!form) return;

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const dueDateInput = document.getElementById("dueDate");
      const value = dueDateInput?.value?.trim();

      if (value && /^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
        const [dd, mm, yyyy] = value.split("/");
        const selected = new Date(`${yyyy}-${mm}-${dd}T00:00:00`);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (selected < today) {
          dueDateInput.classList.add("error-border");
          document.getElementById("error-dueDate")?.classList.add("visible");
          return;
        }
      }

      if (this.validateForm()) {
        FirebaseService.submitTaskToFirebase().then(() => {
          FirebaseService.showTaskAddedPopup();
          setTimeout(() => (window.location.href = "./board.html"), 2000);
        });
      }
    });
  },

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

  selectPriority(prio) {
    const prioButtons = document.querySelectorAll("#buttons-prio button");
    prioButtons.forEach((btn) => {
      btn.classList.toggle("selected", btn.dataset.prio === prio);
    });
  },

  resetForm() {
    const title = document.getElementById("title");
    const description = document.getElementById("description");
    const dueDate = document.getElementById("dueDate");

    if (title) title.value = "";
    if (description) description.value = "";
    if (dueDate) dueDate.value = "";

    document.getElementById("error-title")?.classList.remove("visible");
    document.getElementById("error-dueDate")?.classList.remove("visible");
    document.getElementById("error-category")?.classList.remove("visible");

    title?.classList.remove("error");
    dueDate?.classList.remove("error-border");
    document
      .getElementById("category-toggle")
      ?.classList.remove("error-border");

    DropdownController.selectedCategory = "";
    const catPlaceholder = document.querySelector("#category-toggle span");
    if (catPlaceholder) catPlaceholder.textContent = "Select category";

    DropdownController.selectedContacts = [];
    DropdownController.updateSelectedContactsUI();

    this.selectPriority("medium");

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
