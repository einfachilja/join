/**
 * Firebase base URL for contact data
 */
const BASE_URL =
  "https://join467-e19d8-default-rtdb.europe-west1.firebasedatabase.app/";

let contacts = [];
let recentlyAddedContact = null;
let firebaseKey = localStorage.getItem("firebaseKey");


/**
 * @file contacts.js
 * This script handles the contacts functionality including adding, editing, deleting,
 * and displaying contacts. It interacts with Firebase for data storage.
 */
function init() {
  setUserInitials();
  loadContacts();
}


/**
 * Validate Add/Edit Contact form
 * @param {boolean} isEdit - true for edit form, false for new contact form
 */
function validateContactForm(isEdit) {
  const prefix = isEdit ? "edit_contact_" : "new_contact_";
  const fields = ["name", "email", "phone"];
  let valid = true;
  fields.forEach((field) => {
    const input = document.getElementById(prefix + field);
    const error = document.getElementById(
      (isEdit ? "edit-" : "") + field + "-error"
    );
    const value = input.value.trim();
    let msg = "";
    if (!value) {
      msg = field.charAt(0).toUpperCase() + field.slice(1) + " cannot be empty";
    } else if (field === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      msg = "Invalid email address";
    } else if (field === "phone" && !/^\+?[0-9\s-]{7,10}$/.test(value)) {
      msg = "Invalid phone number";
    }
    if (msg) {
      error.textContent = msg;
      error.classList.add("visible");
      input.classList.add("invalid");
      valid = false;
    } else {
      error.textContent = "";
      error.classList.remove("visible");
      input.classList.remove("invalid");
    }
  });
  return valid;
}


/**
 * Returns a random HSL color
 * @returns {string}
 */
function getRandomColor() {
  const colors = [
    "hsl(28, 100%, 50%)",
    "hsl(85, 76%, 53%)",
    "hsl(200, 100%, 50%)",
    "hsl(328, 99%, 68%)",
    "hsl(360, 99%, 64%)",
    "hsl(227, 100%, 50%)",
    "hsl(270, 100%, 58%)",
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}


/**
 * Gets initials from name
 * @param {string} name
 * @returns {string}
 */
function getInitials(name) {
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
}


/**
 * Sends contact to Firebase and reloads
 * @param {Object} contact
 */
async function getFirebaseKeyAndLoadContacts(contact) {
  await fetch(`${BASE_URL}users/${firebaseKey}/contacts.json`, {
    method: "POST",
    body: JSON.stringify(contact),
  });
  await loadContacts();
}


/**
 * Adds new contact and opens details
 * @param {Event} event
 */
async function addNewContact(event) {
  event.preventDefault();
  const name = new_contact_name.value.trim();
  const email = new_contact_email.value.trim();
  const phone = new_contact_phone.value.trim();
  if (!validateContactForm(false)) return;

  const contact = { name, email, phone, color: getRandomColor() };
  recentlyAddedContact = contact;

  await getFirebaseKeyAndLoadContacts(contact);

  toggleOff();
  toggleOffMobile();

  const fullContact = contacts.find(
    (c) =>
      c.name === contact.name &&
      c.email === contact.email &&
      c.phone === contact.phone
  );

  if (fullContact) {
    const initials = getInitials(fullContact.name);
    showContactInfo(fullContact, initials);
    openContactOverlay(fullContact);
    showAddedContactMessage();
  }
}


/**
 * Opens contact details for mobile or desktop
 * @param {Object} contact
 */
function openContactOverlay(contact) {
  const initials = getInitials(contact.name);
  if (window.innerWidth <= 768) {
    document.body.insertAdjacentHTML(
      "beforeend",
      getOpenContactMobileTemplate(contact, initials)
    );
  } else {
    document.getElementById("open_contact_Template").innerHTML =
      getOpenContactTemplate(contact, initials);
  }
}


/**
 * Shows success message when contact is added
 */
function showAddedContactMessage() {
  let container = document.getElementById("user_contact_information_section_mobile");

  if (!container) {
    container = document.createElement("div");
    container.id = "user_contact_information_section_mobile";
    document.body.appendChild(container); 
  }

  container.innerHTML = getCreatedContactSuccessfullyMessage();

  const message = document.getElementById("created_contact_message");

  setTimeout(() => {
    message.classList.add("visible");
  }, 10);

  setTimeout(() => {
    message.classList.remove("visible");
  }, 2500);

  setTimeout(() => {
    message.remove();
  }, 3000);
}


/**
 * Gets trimmed input values from contact form
 * @returns {{name: string, email: string, phone: string}}
 */
function getTrimmedContactInput() {
  return {
    name: document.getElementById("edit_contact_name").value.trim(),
    email: document.getElementById("edit_contact_email").value.trim(),
    phone: document.getElementById("edit_contact_phone").value.trim(),
  };
}


/**
 * Validates contact inputs
 */
function isValidContactInput(
  name,
  email,
  phone,
  phoneId = "new_contact_phone",
  phoneErrorId = "phone-error",
  emailId = "new_contact_email",
  emailErrorId = "email-error"
) {
  return (
    name &&
    email &&
    phone &&
    isPhoneValid(phoneId, phoneErrorId) &&
    isEmailValid(emailId, emailErrorId)
  );
}


/**
 * Builds updated contact object
 * @param {string} name
 * @param {string} email
 * @param {string} phone
 * @param {Object} originalContact
 * @returns {{name: string, email: string, phone: string, color: string}}
 */
function buildUpdatedContact(name, email, phone, originalContact) {
  const color = originalContact?.color || getRandomColor();
  return { name, email, phone, color };
}


/**
 * Saves updated contact to Firebase
 */
async function updateContactInFirebase(contactKey, updatedContact) {
  await fetch(`${BASE_URL}users/${firebaseKey}/contacts/${contactKey}.json`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updatedContact),
  });
}


/**
 * Updates local contact object with new data
 * @param {Object} original - Original contact object
 * @param {Object} updated - Updated contact data
 */
function updateLocalContact(original, updated) {
  if (!original) return;
  Object.assign(original, updated);
}


/**
 * Gets trimmed input values from edit form
 * @returns {{name: string, email: string, phone: string}}
 */
function getEditFormData() {
  return getTrimmedContactInput();
}


/**
 * Checks if the edit form inputs are valid
 * @param {string} name
 * @param {string} email
 * @param {string} phone
 * @returns {boolean}
 */
function isEditFormValid(name, email, phone) {
  return isValidContactInput(
    name,
    email,
    phone,
    "edit_contact_phone",
    "edit-phone-error",
    "edit_contact_email",
    "edit-email-error"
  );
}


/**
 * Updates contact data in Firebase and reloads contacts list
 * @param {string} key
 * @param {Object} updatedContact
 */
async function updateContactAndReload(key, updatedContact) {
  await updateContactInFirebase(key, updatedContact);
  await loadContacts();
}


/**
 * Refreshes the contact details on desktop and mobile views
 * @param {Object} contact
 */
function refreshContactDetails(contact) {
  const initials = getInitials(contact.name);
  showContactInfo(contact, initials);

  if (window.innerWidth <= 800) {
    toggleContactInfoOverlay(contact, initials);
  }
}


/**
 * Saves edited contact after validation
 * @param {Event} event
 * @param {string} contactKey
 */
async function saveEditContact(event, contactKey) {
  event.preventDefault();

  const { name, email, phone } = getEditFormData();

  if (!validateContactForm(true)) return;

  const originalContact = contacts.find((c) => c.firebaseKey === contactKey);
  const updatedContact = buildUpdatedContact(
    name,
    email,
    phone,
    originalContact
  );

  try {
    await updateContactAndReload(contactKey, updatedContact);

    const refreshedContact = contacts.find((c) => c.firebaseKey === contactKey);

    refreshContactDetails(refreshedContact);
  } catch (error) {
    console.error("Failed to save contact:", error);
  }

  if (window.innerWidth <= 800) {
    toggleOffMobile();
  } else {
    toggleOff();
  }
}


/**
 * Loads all contacts from Firebase
 */
async function loadContacts() {
  try {
    const response = await fetch(
      `${BASE_URL}users/${firebaseKey}/contacts.json`
    );
    const data = await response.json();

    contacts = [];
    if (data) {
      for (let key in data) {
        contacts.push({ ...data[key], firebaseKey: key });
      }
    }

    renderContacts();
  } catch (error) {
    console.error("Failed to load contacts:", error);
  }
}


/**
 * Sorts contacts alphabetically by name
 * @param {Array} list - Array of contact objects
 * @returns {Array} - Sorted array of contacts
 */
function sortContacts(list) {
  return list
    .slice()
    .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
}


/** * Gets the first letter of a name
 * @param {string} name
 * @returns {string} - First letter in uppercase
 */
function getFirstLetter(name) {
  return name.trim()[0].toUpperCase();
}


/** * Checks if the contact is the one recently added
 * @param {Object} contact - Contact object to check
 * @returns {boolean} - True if the contact matches the recently added one
 */
function isRecentlyAdded(contact) {
  return (
    recentlyAddedContact &&
    contact.name === recentlyAddedContact.name &&
    contact.email === recentlyAddedContact.email &&
    contact.phone === recentlyAddedContact.phone
  );
}


/** * Clears the highlight from the recently added contact after a delay
 */ 
function clearHighlightAfterDelay() {
  setTimeout(() => {
    let highlighted = document.querySelector(".contact.highlight");
    if (highlighted) highlighted.classList.remove("highlight");
    recentlyAddedContact = null;
  }, 3000);
}


/**
 * Renders all contacts and highlights the new one
 */
function renderContacts() {
  let contactListRef = document.getElementById("all_contacts");
  contactListRef.innerHTML = "";

  let sortedContacts = sortContacts(contacts);
  let currentInitial = null;

  sortedContacts.forEach((contact) => {
    let firstInitial = getFirstLetter(contact.name);
    if (firstInitial !== currentInitial) {
      currentInitial = firstInitial;
      contactListRef.innerHTML += getFirstInitialAndDevider(currentInitial);
    }
    let initials = getInitials(contact.name);
    let highlight = isRecentlyAdded(contact) ? "highlight" : "";
    contactListRef.innerHTML += getContactBasicTemplate(
      contact,
      initials,
      highlight
    );
  });

  clearHighlightAfterDelay();
}


/**
 * Styles the contact element on click
 * @param {HTMLElement} element - The contact element clicked
 * @param {string} initials - Initials of the contact
 */
function styleContactOnclick(element, initials) {
  document
    .querySelectorAll(".contact.open-contact")
    .forEach((el) => el.classList.remove("open-contact"));
  element.classList.add("open-contact");

  const name = element.querySelector(".contact-name").textContent;
  const contact = contacts.find((c) => c.name === name);
  if (contact) {
    if (window.innerWidth <= 800) {
      toggleContactInfoOverlay(contact, initials);
    } else {
      showContactInfo(contact, initials);
    }
  }
}


/** * Toggles the contact info overlay for mobile view
 * @param {Object} contact - Contact  object to display
 * @param {string} initials - Initials of the contact
 */
function toggleContactInfoOverlay(contact, initials) {
  const overlayRef = document.getElementById("overlay");
  overlayRef.innerHTML = getOpenContactMobileTemplate(contact, initials);
  overlayRef.classList.remove("d_none");
}


/**
 * Displays contact information in the desktop view
 * @param {Object} contact - Contact object to display
 * @param {string} initials - Initials of the contact
 */
function showContactInfo(contact, initials) {
  let contactInfoRef = document.getElementById("open_contact_Template");
  contactInfoRef.innerHTML = getOpenContactTemplate(contact, initials);
}


/**
 * Deletes contact from Firebase and reloads
 */
async function deleteContact(contactKey) {
  try {
    const response = await fetch(
      `${BASE_URL}users/${firebaseKey}/contacts/${contactKey}.json`,
      { method: "DELETE" }
    );
    if (!response.ok) throw new Error("Delete failed");

    contacts = contacts.filter((c) => c.firebaseKey !== contactKey);

    const contactInfoRef = document.getElementById("open_contact_Template");
    if (contactInfoRef) contactInfoRef.innerHTML = "";

    const mobileOverlay = document.getElementById(
      "user_contact_information_section_mobile"
    );
    if (mobileOverlay) {
      mobileOverlay.remove();
    }

    const mobileMenu = document.getElementById("edit_delete_menu");
    if (mobileMenu) {
      mobileMenu.innerHTML = "";
    }

    toggleOff();
    await loadContacts();
  } catch (error) {
    console.error("Error deleting contact:", error);
  }
}


/** * Validates email input
 * @param {string} inputId - ID of the email input
 * @param {string} errorId - ID of the error message element
 * @returns {boolean} - True if valid, false otherwise
 */
function isEmailValid(inputId = "new_contact_email", errorId = "email-error") {
  const emailInput = document.getElementById(inputId);
  const error = document.getElementById(errorId);

  if (!emailInput || !error) {
    console.warn(`Element not found: ${!emailInput ? inputId : errorId}`);
    return false;
  }

  const email = emailInput.value.trim();

  if (email === "") {
    error.classList.remove("visible");
    emailInput.classList.remove("invalid");
    return false;
  }

  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  error.classList.toggle("visible", !valid);
  emailInput.classList.toggle("invalid", !valid);
  return valid;
}


/** * Validates phone input
 * @param {string} inputId - ID of the phone input
 * @param {string} errorId - ID of the error message element
 * @returns {boolean} - True if valid, false otherwise
 */
function isPhoneValid(inputId = "new_contact_phone", errorId = "phone-error") {
  const phoneInput = document.getElementById(inputId);
  const error = document.getElementById(errorId);
  const phone = phoneInput.value.trim();
  phoneInput.value = phone.replace(/[^0-9\s-]/g, "").slice(0, 10);
  if (phone === "") {
    error.classList.remove("visible");
    phoneInput.classList.remove("invalid");
    return false;
  }
  const valid = /^\+?[0-9\s-]{7,10}$/.test(phone);
  error.classList.toggle("visible", !valid);
  phoneInput.classList.toggle("invalid", !valid);
  return valid;
}


/** * Toggles the overlay for adding a new contact
 */
function toggleOverlay() {
  const overlayRef = document.getElementById("overlay");
  overlayRef.innerHTML = overlayTemplate();

  isEmailValid("new_contact_email", "email-error");
  isPhoneValid("new_contact_phone", "phone-error");

  overlayRef.classList.remove("d_none");
  setTimeout(() => overlayRef.classList.add("active"), 0);
  setTimeout(() => {
    const modal = document.querySelector(".add-new-contact-template");
    if (modal) modal.classList.add("slide-in");
  }, 0);
}


/**
 * Opens the edit/delete menu for a contact
 * @param {Object} contact - Contact object to edit or delete
 */
function openEditDeleteMenu(contact) {
  document.getElementById("edit_delete_menu").innerHTML =
    getEditDeleteMenuTemplate(contact);
}


/**
 * Toggles the edit overlay for a contact
 * @param {Object} contact - Contact object to edit
 */
function toggleEditOverlay(contact) {
  const overlayRef = document.getElementById("overlay");
  overlayRef.innerHTML = overlayEditTemplate(
    contact.name,
    contact.email,
    contact.phone,
    contact.firebaseKey
  );

  isEmailValid("edit_contact_email", "edit-email-error");
  isPhoneValid("edit_contact_phone", "edit-phone-error");

  overlayRef.classList.remove("d_none");
  setTimeout(() => overlayRef.classList.add("active"), 0);
  setTimeout(() => {
    const modal = document.querySelector(".add-new-contact-template");
    if (modal) modal.classList.add("slide-in");
  }, 0);
}


/**
 * Closes the edit/delete menu
 */
function closeEditDeleteMenu() {
  const menuRef = document.getElementById("edit_delete_menu");
  if (menuRef) menuRef.innerHTML = "";
}


/**
 * Toggles the mobile edit overlay for a contact
 * @param {Object} contact - Contact object to edit
 */
function toggleMobileEditOverlay(contact) {
  closeEditDeleteMenu();
  const overlayRef = document.getElementById("overlay_mobile");
  overlayRef.innerHTML = overlayEditTemplate(
    contact.name,
    contact.email,
    contact.phone,
    contact.firebaseKey
  );

  isEmailValid("edit_contact_email", "edit-email-error");
  isPhoneValid("edit_contact_phone", "edit-phone-error");

  overlayRef.classList.remove("d_none");
  setTimeout(() => overlayRef.classList.add("active"), 0);
  setTimeout(() => {
    const modal = document.querySelector(".add-new-contact-template");
    if (modal) modal.classList.add("slide-in");
  }, 0);
}


/**
 * Prevents dialog propagation to avoid closing the overlay
 * @param {Event} event - The event object
 */
function dialogPrevention(event) {
  event.stopPropagation();
}


/** * Closes the overlay and removes the modal
 */
function toggleOff() {
  const overlayRef = document.getElementById("overlay");
  const modal = document.querySelector(".add-new-contact-template");
  if (modal) modal.classList.remove("slide-in");
  overlayRef.classList.remove("active");
  setTimeout(() => {
    overlayRef.classList.add("d_none");
    overlayRef.innerHTML = "";
  }, 300);
}


/** * Closes the mobile overlay and removes the modal
 */
function toggleOffMobile() {
  const overlayRef = document.getElementById("overlay_mobile");
  const modal = document.querySelector(".add-new-contact-template");
  if (modal) modal.classList.remove("slide-in");
  overlayRef.classList.remove("active");
  setTimeout(() => {
    overlayRef.classList.add("d_none");
    overlayRef.innerHTML = "";
  }, 300);
}


/**
 * Opens the contact templates for displaying contact details
 * @param {Object} contact - Contact object to display
 */
function OpenContactTemplates(contact) {
  const initials = getInitials(contact.name);
  document.getElementById("open_contact_Template").innerHTML =
    getOpenContactTemplate(contact, initials);
  document.getElementById("overlay").innerHTML = getOpenContactMobileTemplate(
    contact,
    initials
  );
}