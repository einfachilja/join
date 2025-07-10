/**
 * Dropdown controller for 'Assigned to' and 'Category' fields.
 */

import { Utils } from "./add-task-utils.js";

export const DropdownController = {
  contacts: [],
  selectedContacts: [],
  selectedCategory: "",

  /**
   * Initialize dropdown event listeners for Assigned To and Category fields.
   * @function
   */
  setupDropdownEvents() {
    const assignToggle = document.getElementById("dropdown-toggle");
    const categoryToggle = document.getElementById("category-toggle");
    const dropdownContent = document.getElementById("dropdown-content");

    if (assignToggle)
      assignToggle.onclick = this.toggleAssignDropdown.bind(this);
    const assignInput = document.getElementById("assigned-to-input");
    if (assignInput) {
      assignInput.addEventListener("input", (e) => {
        this.renderAssignOptions(e.target.value.toLowerCase());
      });
    }
    if (categoryToggle)
      categoryToggle.onclick = this.toggleCategoryDropdown.bind(this);
    if (dropdownContent) {
      dropdownContent.onclick = Utils.stopPropagation;
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
   * @param {Object} contact
   * @param {string} filter
   * @returns {HTMLElement}
   * @function
   */
  createContactDropdownItem(contact, filter) {
    const item = document.createElement("div");
    item.className = "contact-item";
    item.innerHTML = `
      <span class="profile-icon" style="background:${contact.color}">
        ${this.getInitials(contact.name)}
      </span>
      <span>${contact.name}</span>
      <input type="checkbox" ${
        this.selectedContacts.some((s) => s.name === contact.name)
          ? "checked"
          : ""
      }/>
    `;
    this.setupContactCheckbox(item, contact, filter);
    this.setupContactItemClick(item);
    if (this.selectedContacts.some((s) => s.name === contact.name))
      item.classList.add("selected");
    return item;
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
    box.innerHTML = "";
    this.selectedContacts.forEach((c) => {
      const el = document.createElement("div");
      el.className = "profile-icon";
      el.style.background = c.color;
      el.textContent = this.getInitials(c.name);
      box.appendChild(el);
    });
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
};
