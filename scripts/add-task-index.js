/**
 * Entry point for initializing the Add Task page.
 * Loads user initials and starts the Add Task logic.
 * @file
 */

import { AddTaskCore } from "./add-task-core.js";

/**
 * On window load, set user initials and initialize Add Task logic.
 */
window.onload = () => {
  if (typeof setUserInitials === "function") {
    setUserInitials(); // Set user initials in the header (from desktop-template.js)
  }
  AddTaskCore.init(); // Initialize all Add Task logic and events
};
