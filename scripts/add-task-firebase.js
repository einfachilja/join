/**
 * Firebase operations for Add Task.
 * @namespace FirebaseService
 */
import { DropdownController } from "./add-task-dropdowns.js";
import { SubtaskManager } from "./add-task-subtasks.js";

export const FirebaseService = {
  /**
   * Firebase auth key from local storage.
   * @type {string}
   */

  firebaseKey: localStorage.getItem("firebaseKey"),
  /**
   * Fetch contacts from Firebase and update dropdown.
   * @async
   */
  async fetchContacts() {
    try {
      const res = await fetch(
        `https://join467-e19d8-default-rtdb.europe-west1.firebasedatabase.app/users/${this.firebaseKey}/contacts.json`
      );
      const data = await res.json();
      DropdownController.contacts = Object.entries(data || {})
        .filter(([_, u]) => u && typeof u.name === "string" && u.name.trim())
        .map(([_, u]) => ({
          name: u.name.trim(),
          color: u.color || "#888",
        }));
    } catch (err) {
      console.error("Failed to fetch contacts", err);
    }
  },

  /**
   * Create task object from form data.
   * @param {string} [status] - Task status
   * @returns {Object} Task data
   */
  createTaskObject(status) {
    return {
      title: document.getElementById("title").value.trim(),
      description: document.getElementById("description").value.trim(),
      dueDate: document.getElementById("dueDate").value,
      priority: this.getSelectedPriority(),
      assignedTo: DropdownController.selectedContacts.map((c) => c.name),
      category: DropdownController.selectedCategory,
      subtask: SubtaskManager.getSubtasks(),
      createdAt: new Date().toISOString(),
      status: status || "todo",
    };
  },

  /**
   * Get selected priority from UI.
   * @returns {string} Priority ('low', 'medium', 'urgent')
   */
  getSelectedPriority() {
    const selected = document.querySelector("#buttons-prio .selected");
    return selected ? selected.dataset.prio : "medium";
  },

  /**
   * Send task to Firebase.
   * @async
   * @param {string} status - Task status
   */
  async submitTaskToFirebase(status) {
    const task = this.createTaskObject(status);
    try {
      await fetch(
        `https://join467-e19d8-default-rtdb.europe-west1.firebasedatabase.app/users/${this.firebaseKey}/tasks.json`,
        {
          method: "POST",
          body: JSON.stringify(task),
        }
      );
    } catch (err) {
      console.error("Error saving task", err);
    }
  },

  /**
   * Show confirmation popup after task creation.
   */
  showTaskAddedPopup() {
    const popup = document.createElement("div");
    popup.innerHTML = `<img src="./assets/icons/board.svg" alt="board icon"> Task added to Board`;
    popup.className = "task-toast";
    document.body.appendChild(popup);
    setTimeout(() => popup.remove(), 2500);
  },
};
