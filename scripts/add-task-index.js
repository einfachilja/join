/**
 * Entry point for initializing the Add Task page.
 * Loads user initials and starts the Add Task logic.
 * @file
 */
import { DropdownController } from "./add-task-dropdowns.js";

/**
 * Initialize dropdown events when DOM is ready.
 * @listens document:DOMContentLoaded
 */
document.addEventListener("DOMContentLoaded", () => {
  DropdownController.setupDropdownEvents();
});
import { AddTaskCore } from "./add-task-core.js";

/**
 * On window load, set user initials and initialize Add Task logic.
 * @listens window:onload
 */
window.onload = () => {
  if (typeof setUserInitials === "function") {
    setUserInitials();
  }
  AddTaskCore.init();
};
