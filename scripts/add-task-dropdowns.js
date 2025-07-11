/**
 * Dropdown controller for 'Assigned to' and 'Category' fields.
 */

import { Utils } from "./add-task-utils.js";

/**
 * Generate HTML for assigned contacts circles with max visible and "+X" indicator.
 * @param {string[]} assignedList
 * @returns {string}
 */
function generateAssignedCircles(assignedList) {
  if (!Array.isArray(assignedList)) return "";
  assignedList = assignedList.filter((name) => {
    if (!name || typeof name !== "string") return false;
    let contact = DropdownController.getContactByName(name);
    return !!contact;
  });
  let maxVisible = 4;
  let visibleContacts = assignedList.slice(0, maxVisible);
  let hiddenCount = assignedList.length - visibleContacts.length;

  let circlesHTML = visibleContacts
    .map((name) => {
      let contact = DropdownController.getContactByName(name);
      if (!contact) return "";
      let color = contact.color || "#ccc";
      return DropdownController.getAssignedCircleHTML(name, color);
    })
    .join("");

  if (hiddenCount > 0) {
    circlesHTML += `<div class="assigned-circle overflow-indicator profile-icon">+${hiddenCount}</div>`;
  }

  return circlesHTML;
}

export const DropdownController = {
  contacts: [],
  selectedContacts: [],
  selectedCategory: "",

  /**
   * Initialize dropdown event listeners for Assigned To and Category fields.
   * @function
   */
  setupDropdownEvents() {
    this.setupAssignDropdownEvents();
    this.setupCategoryDropdownEvents();

    const dropdownContent = document.getElementById("dropdown-content");
    if (dropdownContent) {
      dropdownContent.onclick = Utils.stopPropagation;
    }
  },

  /**
   * Setup event listeners for the Assigned To dropdown.
   */
  setupAssignDropdownEvents() {
    const assignToggle = document.getElementById("dropdown-toggle");
    if (assignToggle) {
      assignToggle.onclick = this.toggleAssignDropdown.bind(this);
    }
    const assignInput = document.getElementById("assigned-to-input");
    if (assignInput) {
      assignInput.oninput = (e) => {
        this.renderAssignOptions(e.target.value.toLowerCase());
      };
    }
  },

  /**
   * Setup event listeners for the Category dropdown.
   */
  setupCategoryDropdownEvents() {
    const categoryToggle = document.getElementById("category-toggle");
    if (categoryToggle) {
      categoryToggle.onclick = this.toggleCategoryDropdown.bind(this);
    }
  },

  /**
   * Handle click on the assigned-to field.
   * @param {MouseEvent} e
   * @function
   */
  handleAssignedToClick(e) {
    Utils.stopPropagation(e);
    this.toggleAssignDropdown(e);
  },

  /**
   * Toggle visibility of the Assigned To dropdown.
   * @param {MouseEvent} e
   * @function
   */
  toggleAssignDropdown(e) {
    Utils.stopPropagation(e);
    const tog = document.getElementById("dropdown-toggle");
    const dd = document.getElementById("dropdown-content");
    if (!tog || !dd) return;
    tog.classList.toggle("open");
    dd.classList.toggle("visible");
    if (dd.innerHTML === "") this.renderAssignOptions();
  },

  /**
   * Render the list of contacts in the dropdown, filtered by input.
   * @param {string} [filter=""]
   * @function
   */
  renderAssignOptions(filter = "") {
    const dd = document.getElementById("dropdown-content");
    if (!dd) return;

    this.clearOldAssignOptions(dd);

    this.contacts
      .filter((c) => c.name.toLowerCase().includes(filter))
      .forEach((c) =>
        dd.appendChild(this.createContactDropdownItem(c, filter))
      );
  },

  /**
   * Remove old contact options from the dropdown container.
   * @param {HTMLElement} container
   * @function
   */
  clearOldAssignOptions(container) {
    Array.from(container.childNodes)
      .filter((n) => n.tagName !== "INPUT")
      .forEach((n) => n.remove());
  },

  /**
   * Create a contact item for the dropdown.
   * @param {Object} contact Contact object with name and color.
   * @param {string} filter Current filter string to re-render options.
   * @returns {HTMLElement} The contact item element.
   */
  createContactDropdownItem(contact, filter) {
    const item = document.createElement("div");
    item.className = "contact-item";

    const profileIcon = this.createProfileIcon(contact);
    const nameSpan = this.createNameSpan(contact);
    const checkbox = this.createContactCheckbox(contact, filter, item);

    item.appendChild(profileIcon);
    item.appendChild(nameSpan);
    item.appendChild(checkbox);

    if (this.selectedContacts.some((s) => s.name === contact.name))
      item.classList.add("selected");

    this.setupContactItemClick(item);

    return item;
  },

  /**
   * Create profile icon span for a contact.
   * @param {Object} contact Contact object.
   * @returns {HTMLSpanElement} The profile icon span element.
   */
  createProfileIcon(contact) {
    const span = document.createElement("span");
    span.className = "profile-icon";
    span.style.background = contact.color;
    span.textContent = this.getInitials(contact.name);
    return span;
  },

  /**
   * Create name span element for a contact.
   * @param {Object} contact Contact object.
   * @returns {HTMLSpanElement} The name span element.
   */
  createNameSpan(contact) {
    const span = document.createElement("span");
    span.textContent = contact.name;
    return span;
  },

  /**
   * Create checkbox input for a contact item.
   * @param {Object} contact Contact object.
   * @param {string} filter Current filter for re-rendering.
   * @param {HTMLElement} item The contact item element.
   * @returns {HTMLInputElement} The checkbox input element.
   */
  createContactCheckbox(contact, filter, item) {
    const input = document.createElement("input");
    input.type = "checkbox";
    if (this.selectedContacts.some((s) => s.name === contact.name)) {
      input.checked = true;
    }

    input.onclick = (e) => {
      e.stopPropagation();
      const idx = this.selectedContacts.findIndex(
        (s) => s.name === contact.name
      );
      if (input.checked && idx === -1) this.selectedContacts.push(contact);
      else if (!input.checked && idx >= 0) {
        this.selectedContacts.splice(idx, 1);
        if (this.selectedContacts.length === 0) this.closeDropdown();
      }
      this.updateSelectedContactsUI();
      this.renderAssignOptions(filter);
    };

    return input;
  },

  /**
   * Get initials from a name string.
   * @param {string} name
   * @returns {string}
   * @function
   */
  getInitials(name) {
    if (!name) return "";
    const nameParts = name.trim().split(" ");
    if (nameParts.length === 1) {
      return nameParts[0][0].toUpperCase();
    } else {
      return (
        nameParts[0][0].toUpperCase() +
        nameParts[nameParts.length - 1][0].toUpperCase()
      );
    }
  },

  /**
   * Handle checkbox click for a contact item.
   * @param {HTMLElement} item
   * @param {Object} contact
   * @param {string} filter
   * @function
   */
  setupContactCheckbox(item, contact, filter) {
    const checkbox = item.querySelector("input[type='checkbox']");
    checkbox.onclick = (e) => {
      Utils.stopPropagation(e);
      const idx = this.selectedContacts.findIndex(
        (s) => s.name === contact.name
      );
      if (checkbox.checked && idx === -1) this.selectedContacts.push(contact);
      else if (!checkbox.checked && idx >= 0) {
        this.selectedContacts.splice(idx, 1);
        if (this.selectedContacts.length === 0) this.closeDropdown();
      }
      this.updateSelectedContactsUI();
      this.renderAssignOptions(filter);
    };
  },

  /**
   * Make entire contact item clickable to toggle checkbox.
   * @param {HTMLElement} item
   * @function
   */
  setupContactItemClick(item) {
    const checkbox = item.querySelector("input[type='checkbox']");
    item.onclick = function (e) {
      if (e.target.tagName.toLowerCase() === "input") return;
      Utils.stopPropagation(e);
      checkbox.checked = !checkbox.checked;
      checkbox.dispatchEvent(new Event("click", { bubbles: true }));
    };
  },

  /**
   * Close the Assigned To dropdown.
   * @function
   */
  closeDropdown() {
    document.getElementById("dropdown-content")?.classList.remove("visible");
    document.getElementById("dropdown-toggle")?.classList.remove("open");
  },

  /**
   * Update the preview UI showing selected contacts.
   * @function
   */
  updateSelectedContactsUI() {
    const box = document.getElementById("selected-contacts");
    if (!box) return;

    const assignedList = this.selectedContacts.map((c) => c.name);
    box.innerHTML = generateAssignedCircles(assignedList);
  },

  /**
   * Toggle and render the Category dropdown options.
   * @param {MouseEvent} e
   * @function
   */
  toggleCategoryDropdown(e) {
    Utils.stopPropagation(e);
    const toggle = document.getElementById("category-toggle");
    const content = document.getElementById("category-content");
    toggle.classList.toggle("open");
    content.classList.toggle("visible");
    if (content.innerHTML.trim() === "") this.renderCategoryOptions();
  },

  /**
   * Render all selectable category options.
   * @function
   */
  renderCategoryOptions() {
    const content = document.getElementById("category-content");
    content.innerHTML = "";
    ["Technical Task", "User Story"].forEach((category) => {
      const item = document.createElement("div");
      item.className = "dropdown-item category-item";
      item.innerHTML = `<span class="category-name">${category}</span>`;
      item.onclick = () => {
        this.selectCategory(category);
        content.classList.remove("visible");
        document.getElementById("category-toggle").classList.remove("open");
      };
      content.appendChild(item);
    });
  },

  /**
   * Set the selected category and update the UI.
   * @param {string} category
   * @function
   */
  selectCategory(category) {
    this.selectedCategory = category;
    const placeholder = document.querySelector("#category-toggle span");
    if (placeholder) placeholder.textContent = category;
  },
  /**
   * Get a contact by name.
   * @param {string} name
   * @returns {Object|undefined}
   */
  getContactByName(name) {
    return this.contacts.find((c) => c.name === name);
  },

  /**
   * Get assigned circle HTML for a contact.
   * @param {string} name
   * @param {string} color
   * @returns {string}
   */
  getAssignedCircleHTML(name, color) {
    const initials = this.getInitials(name);
    return `<div class="assigned-circle profile-icon" style="background:${color}">${initials}</div>`;
  },
};
