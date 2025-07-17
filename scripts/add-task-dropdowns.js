/**
 * Dropdown controller for 'Assigned to' and 'Category' fields.
 */

import { Utils } from "./add-task-utils.js";

/**
 * Filter assigned list to only valid contacts.
 * @param {string[]} assignedList - List of assigned contact names.
 * @returns {string[]} Filtered list of valid contact names.
 */
function filterValidAssigned(assignedList) {
  return assignedList.filter((name) => {
    if (!name || typeof name !== "string") return false;
    return !!DropdownController.getContactByName(name);
  });
}

/**
 * Generate HTML for assigned contacts circles with max visible and "+X" indicator.
 * @param {string[]} assignedList - List of assigned contact names.
 * @returns {string} HTML string of assigned contact circles.
 */

function generateAssignedCircles(assignedList) {
  if (!Array.isArray(assignedList)) return "";
  assignedList = filterValidAssigned(assignedList);
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

/**
 * Append contact elements to the contact item.
 * @param {HTMLElement} item - The contact item element.
 * @param {HTMLElement} profileIcon - Profile icon element.
 * @param {HTMLElement} nameSpan - Name span element.
 * @param {HTMLElement} checkbox - Checkbox input element.
 */
function appendContactElements(item, profileIcon, nameSpan, checkbox) {
  item.appendChild(profileIcon);
  item.appendChild(nameSpan);
  item.appendChild(checkbox);
}

/**
 * Handle checkbox click for a contact item.
 * @param {HTMLInputElement} input - Checkbox input element.
 * @param {Object} contact - Contact object.
 * @param {string} filter - Current filter string.
 */
function handleCheckboxClick(input, contact, filter) {
  const idx = DropdownController.selectedContacts.findIndex(
    (s) => s.name === contact.name
  );
  if (input.checked && idx === -1)
    DropdownController.selectedContacts.push(contact);
  else if (!input.checked && idx >= 0) {
    DropdownController.selectedContacts.splice(idx, 1);
    if (DropdownController.selectedContacts.length === 0)
      DropdownController.closeDropdown();
  }
  DropdownController.updateSelectedContactsUI();
  DropdownController.renderAssignOptions(filter);
}

/**
 * Append filtered contacts to the container.
 * @param {HTMLElement} container - Container element to append contacts.
 * @param {Object[]} contacts - Array of contact objects.
 * @param {string} filter - Filter string to match contact names.
 */
function appendFilteredContacts(container, contacts, filter) {
  contacts
    .filter((c) => c.name.toLowerCase().includes(filter))
    .forEach((c) =>
      container.appendChild(
        DropdownController.createContactDropdownItem(c, filter)
      )
    );
}

/**
 * Create category dropdown item element.
 * @param {string} category - Category name.
 * @param {Object} controller - DropdownController instance.
 * @returns {HTMLElement} Category item element.
 */
function createCategoryItem(category, controller) {
  const item = document.createElement("div");
  item.className = "dropdown-item category-item";
  item.innerHTML = `<span class="category-name">${category}</span>`;
  item.onclick = () => {
    controller.selectCategory(category);
    document.getElementById("category-content").classList.remove("visible");
    document.getElementById("category-toggle").classList.remove("open");
  };
  return item;
}
export const DropdownController = {
  contacts: [],
  selectedContacts: [],
  selectedCategory: "",

  /**
   * Initialize dropdown event listeners for Assigned To and Category fields.
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
   * @param {MouseEvent} e - Click event.
   */
  handleAssignedToClick(e) {
    Utils.stopPropagation(e);
    this.toggleAssignDropdown(e);
  },

  /**
   * Toggle visibility of the Assigned To dropdown.
   * @param {MouseEvent} e - Click event.
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
   * @param {string} [filter=""] - Filter string.
   */
  renderAssignOptions(filter = "") {
    const dd = document.getElementById("dropdown-content");
    if (!dd) return;
    this.clearOldAssignOptions(dd);
    appendFilteredContacts(dd, this.contacts, filter);
  },

  /**
   * Remove old contact options from the dropdown container.
   * @param {HTMLElement} container - Dropdown container element.
   */
  clearOldAssignOptions(container) {
    Array.from(container.childNodes)
      .filter((n) => n.tagName !== "INPUT")
      .forEach((n) => n.remove());
  },

  /**
   * Create a contact item for the dropdown.
   * @param {Object} contact - Contact object with name and color.
   * @param {string} filter - Current filter string.
   * @returns {HTMLElement} The contact item element.
   */
  createContactDropdownItem(contact, filter) {
    const item = document.createElement("div");
    item.className = "contact-item";
    const profileIcon = this.createProfileIcon(contact);
    const nameSpan = this.createNameSpan(contact);
    const checkbox = this.createContactCheckbox(contact, filter, item);
    appendContactElements(item, profileIcon, nameSpan, checkbox);
    if (this.selectedContacts.some((s) => s.name === contact.name))
      item.classList.add("selected");
    this.setupContactItemClick(item);
    return item;
  },

  /**
   * Create profile icon span for a contact.
   * @param {Object} contact - Contact object.
   * @returns {HTMLSpanElement} Profile icon span element.
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
   * @param {Object} contact - Contact object.
   * @returns {HTMLSpanElement} Name span element.
   */
  createNameSpan(contact) {
    const span = document.createElement("span");
    span.textContent = contact.name;
    return span;
  },

  /**
   * Create checkbox input for a contact item.
   * @param {Object} contact - Contact object.
   * @param {string} filter - Current filter string.
   * @param {HTMLElement} item - Contact item element.
   * @returns {HTMLInputElement} Checkbox input element.
   */
  createContactCheckbox(contact, filter, item) {
    const input = document.createElement("input");
    input.type = "checkbox";
    if (this.selectedContacts.some((s) => s.name === contact.name)) {
      input.checked = true;
    }
    input.onclick = (e) => {
      e.stopPropagation();
      handleCheckboxClick(input, contact, filter);
    };
    return input;
  },

  /**
   * Get initials from a name string.
   * @param {string} name - Full name string.
   * @returns {string} Initials.
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
   * Setup checkbox click handler for a contact item.
   * @param {HTMLElement} item - Contact item element.
   * @param {Object} contact - Contact object.
   * @param {string} filter - Current filter string.
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
   * @param {HTMLElement} item - Contact item element.
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
   */
  closeDropdown() {
    document.getElementById("dropdown-content")?.classList.remove("visible");
    document.getElementById("dropdown-toggle")?.classList.remove("open");
  },

  /**
   * Update the preview UI showing selected contacts.
   */
  updateSelectedContactsUI() {
    const box = document.getElementById("selected-contacts");
    if (!box) return;
    const assignedList = this.selectedContacts.map((c) => c.name);
    box.innerHTML = generateAssignedCircles(assignedList);
  },

  /**
   * Toggle and render the Category dropdown options.
   * @param {MouseEvent} e - Click event.
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
   */
  renderCategoryOptions() {
    const content = document.getElementById("category-content");
    content.innerHTML = "";
    ["Technical Task", "User Story"].forEach((cat) => {
      content.appendChild(createCategoryItem(cat, this));
    });
  },

  /**
   * Set the selected category and update the UI.
   * @param {string} category - Selected category name.
   */
  selectCategory(category) {
    this.selectedCategory = category;
    const placeholder = document.querySelector("#category-toggle span");
    if (placeholder) placeholder.textContent = category;
  },

  /**
   * Get a contact by name.
   * @param {string} name - Contact name.
   * @returns {Object|undefined} Contact object or undefined.
   */
  getContactByName(name) {
    return this.contacts.find((c) => c.name === name);
  },

  /**
   * Get assigned circle HTML for a contact.
   * @param {string} name - Contact name.
   * @param {string} color - Background color.
   * @returns {string} HTML string for assigned circle.
   */

  getAssignedCircleHTML(name, color) {
    const initials = this.getInitials(name);
    return `<div class="assigned-circle profile-icon" style="background:${color}">${initials}</div>`;
  },
};
