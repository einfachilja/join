/**
 * Firebase base URL for contact data
 */
const BASE_URL =
  "https://join467-e19d8-default-rtdb.europe-west1.firebasedatabase.app/";

let contacts = [];
let recentlyAddedContact = null;
let firebaseKey = localStorage.getItem("firebaseKey");


/**
 * Starts the app by setting user initials and loading contacts.
 */
function init() {
  setUserInitials();
  loadContacts();
}


/**
 * Validates a form field for required input, email, or phone format.
 * @param {HTMLInputElement} input - The input field element.
 * @param {HTMLElement} error - Element to show error messages.
 * @param {string} fieldName - Name of the field for the error message.
 * @param {boolean} isEmail - If true, validates as email.
 * @param {boolean} isPhone - If true, validates as phone number.
 * @returns {boolean} - True if valid, false if invalid.
 */
function validateField(input, error, fieldName, isEmail, isPhone) {
  const value = input.value.trim();
  let msg = "";
  if (!value) {
    msg = `${fieldName} cannot be empty`;
  } else if (isEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    msg = "Invalid email address";
  } else if (isPhone && !/^\+?[0-9\s-]{7,10}$/.test(value)) {
    msg = "Invalid phone number";
  }

  if (msg) {
    error.textContent = msg;
    error.classList.add("visible");
    input.classList.add("invalid");
    return false;
  } else {
    error.textContent = "";
    error.classList.remove("visible");
    input.classList.remove("invalid");
    return true;
  }
}


/**
 * Validates all contact form fields (add or edit mode).
 * @param {boolean} isEdit - True if validating edit form, false for new form.
 * @returns {boolean} - True if all fields are valid.
 */
function validateContactForm(isEdit) {
  const prefix = isEdit ? "edit_contact_" : "new_contact_";
  const validName = validateField(
    document.getElementById(prefix + "name"),
    document.getElementById((isEdit ? "edit-" : "") + "name-error"),
    "Name", false, false
  );
  const validEmail = validateField(
    document.getElementById(prefix + "email"),
    document.getElementById((isEdit ? "edit-" : "") + "email-error"),
    "Email", true, false
  );
  const validPhone = validateField(
    document.getElementById(prefix + "phone"),
    document.getElementById((isEdit ? "edit-" : "") + "phone-error"),
    "Phone", false, true
  );

  return validName && validEmail && validPhone;
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
 * Creates a contact object from input data.
 * @param {string} name - Contact name.
 * @param {string} email - Contact email.
 * @param {string} phone - Contact phone number.
 * @returns {{name: string, email: string, phone: string, color: string}} - Contact object.
 */
function createContactObject(name, email, phone) {
  return { name, email, phone, color: getRandomColor() };
}


/**
 * Finds the full contact object that matches given info.
 * @param {Object} contact - Contact to search for.
 * @returns {Object|undefined} - Found contact or undefined.
 */
function findFullContact(contact) {
  return contacts.find(
    (c) => c.name === contact.name && c.email === contact.email && c.phone === contact.phone
  );
}


/**
 * Adds a new contact after validation.
 * @param {Event} event - The form submit event.
 */
async function addNewContact(event) {
  event.preventDefault();
  const { name, email, phone } = getNewContactInput();
  if (!validateContactForm(false)) return;

  const contact = createContactObject(name, email, phone);
  recentlyAddedContact = contact;

  await getFirebaseKeyAndLoadContacts(contact);
  closeOverlaysAfterAdd();
  openOverlayForRecentlyAdded(contact);
}


/**
 * Gets new contact input values.
 * @returns {{name: string, email: string, phone: string}} - Trimmed input values.
 */
function getNewContactInput() {
  return {
    name: new_contact_name.value.trim(),
    email: new_contact_email.value.trim(),
    phone: new_contact_phone.value.trim(),
  };
}


/**
 * Closes overlays after a contact is added.
 */
function closeOverlaysAfterAdd() {
  toggleOff();
  toggleOffMobile();
}


/**
 * Opens overlay showing details of the newly added contact.
 * @param {Object} contact - The contact to show.
 */
function openOverlayForRecentlyAdded(contact) {
  const fullContact = findFullContact(contact);
  if (fullContact) {
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
 * Fades in an element and removes it after a delay.
 * @param {HTMLElement} element - Inner element to fade in.
 * @param {HTMLElement} parent - Parent to remove after delay.
 * @param {number} [delay=3000] - Time to wait before removing (ms).
 */
function fadeInAndRemove(element, parent, delay = 3000) {
  setTimeout(() => element.classList.add('visible'), 10);
  setTimeout(() => parent.remove(), delay);
}


/**
 * Shows message after a contact is added.
 */
function showAddedContactMessage() {
  const messageDiv = createContactMessageElement();
  document.body.appendChild(messageDiv.outer);
  fadeInAndRemove(messageDiv.inner, messageDiv.outer);
}


/**
 * Creates the success message HTML element.
 * @returns {{inner: HTMLElement, outer: HTMLElement}} - Message elements.
 */
function createContactMessageElement() {
  const outerDiv = document.createElement('div');
  outerDiv.className = 'created-contact-message-div';

  const innerDiv = document.createElement('div');
  innerDiv.className = 'created-contact-message';
  innerDiv.id = 'created_contact_message';

  appendContactMessageContent(innerDiv);
  outerDiv.appendChild(innerDiv);

  return { inner: innerDiv, outer: outerDiv };
}


/**
 * Adds message HTML to the inner message div.
 * @param {HTMLElement} innerDiv - Message container.
 */
function appendContactMessageContent(innerDiv) {
  const messageHTML = getCreatedContactSuccessfullyMessage();
  const temp = parseHTMLToTempContainer(messageHTML);
  appendMessageContent(innerDiv, temp);
}


/**
 * Converts HTML string to a temporary container.
 * @param {string} html - HTML string.
 * @returns {HTMLElement} - Container with parsed HTML.
 */
function parseHTMLToTempContainer(html) {
  const container = document.createElement('div');
  container.innerHTML = html;
  return container;
}


/**
 * Appends parsed message content to the target element.
 * @param {HTMLElement} target - Element to add content to.
 * @param {HTMLElement} temp - Temp container with content.
 */
function appendMessageContent(target, temp) {
  const child = temp.firstElementChild;
  if (child) {
    while (child.firstChild) {
      target.appendChild(child.firstChild);
    }
  } else {
    target.innerHTML = temp.innerHTML;
  }
}


/**
 * Gets trimmed input values from edit contact form.
 * @returns {{name: string, email: string, phone: string}} - Trimmed values.
 */
function getTrimmedContactInput() {
  return {
    name: document.getElementById("edit_contact_name").value.trim(),
    email: document.getElementById("edit_contact_email").value.trim(),
    phone: document.getElementById("edit_contact_phone").value.trim(),
  };
}


/**
 * Validates name, email, and phone inputs.
 * @param {string} name - Contact name.
 * @param {string} email - Contact email.
 * @param {string} phone - Contact phone number.
 * @param {string} phoneId - ID of phone input.
 * @param {string} phoneErrorId - ID of phone error element.
 * @param {string} emailId - ID of email input.
 * @param {string} emailErrorId - ID of email error element.
 * @returns {boolean} - True if all inputs are valid.
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
 * Updates contact in Firebase database.
 * @param {string} contactKey - Firebase key for contact.
 * @param {Object} updatedContact - Updated contact data.
 */
async function updateContactInFirebase(contactKey, updatedContact) {
  await fetch(`${BASE_URL}users/${firebaseKey}/contacts/${contactKey}.json`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updatedContact),
  });
}


/**
 * Updates a contact in the local list.
 * @param {Object} original - Original contact.
 * @param {Object} updated - Updated contact data.
 */
function updateLocalContact(original, updated) {
  if (!original) return;
  Object.assign(original, updated);
}


/**
 * Gets edit form input values.
 * @returns {{name: string, email: string, phone: string}} - Trimmed values.
 */
function getEditFormData() {
  return getTrimmedContactInput();
}


/**
 * Checks if edit form data is valid.
 * @param {string} name - Name input.
 * @param {string} email - Email input.
 * @param {string} phone - Phone input.
 * @returns {boolean} - True if valid.
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
 * Updates contact and reloads list.
 * @param {string} key - Firebase contact key.
 * @param {Object} updatedContact - Updated contact data.
 */
async function updateContactAndReload(key, updatedContact) {
  await updateContactInFirebase(key, updatedContact);
  await loadContacts();
}


/**
 * Refreshes the UI with updated contact info.
 * @param {Object} contact - Contact to refresh.
 */
function refreshContactDetails(contact) {
  const initials = getInitials(contact.name);
  showContactInfo(contact, initials);

  if (window.innerWidth <= 800) {
    toggleContactInfoOverlay(contact, initials);
  }
}


/**
 * Saves and refreshes contact with new data.
 * @param {string} contactKey - Firebase contact key.
 * @param {Object} updatedContact - Updated contact object.
 */
async function saveAndRefreshContact(contactKey, updatedContact) {
  await updateContactAndReload(contactKey, updatedContact);
  const refreshedContact = contacts.find(c => c.firebaseKey === contactKey);
  refreshContactDetails(refreshedContact);
}


/**
 * Closes edit overlay (mobile or desktop).
 */
function handleCloseEditOverlay() {
  if (window.innerWidth <= 800) {
    toggleOffMobile();
  } else {
    toggleOff();
  }
}


/**
 * Saves the edited contact and closes overlay.
 * @param {Event} event - Submit event.
 * @param {string} contactKey - Firebase key.
 */
async function saveEditContact(event, contactKey) {
  event.preventDefault();

  const { name, email, phone } = getEditFormData();
  if (!validateContactForm(true)) return;

  const originalContact = contacts.find(c => c.firebaseKey === contactKey);
  const updatedContact = buildUpdatedContact(name, email, phone, originalContact);

  try {
    await saveAndRefreshContact(contactKey, updatedContact);
  } catch (error) {
    console.error("Failed to save contact:", error);
  }

  handleCloseEditOverlay();
}


/**
 * Loads contacts from Firebase and displays them.
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
 * Sorts contact list alphabetically.
 * @param {Array} list - List of contacts.
 * @returns {Array} - Sorted list.
 */
function sortContacts(list) {
  return list
    .slice()
    .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
}


/**
 * Gets first letter of a name.
 * @param {string} name - Full name.
 * @returns {string} - Uppercase first letter.
 */
function getFirstLetter(name) {
  return name.trim()[0].toUpperCase();
}


/**
 * Checks if contact is the one just added.
 * @param {Object} contact - Contact to check.
 * @returns {boolean} - True if recently added.
 */
function isRecentlyAdded(contact) {
  return (
    recentlyAddedContact &&
    contact.name === recentlyAddedContact.name &&
    contact.email === recentlyAddedContact.email &&
    contact.phone === recentlyAddedContact.phone
  );
}


/**
 * Removes highlight after a short delay.
 */
function clearHighlightAfterDelay() {
  setTimeout(() => {
    let highlighted = document.querySelector(".contact.highlight");
    if (highlighted) highlighted.classList.remove("highlight");
    recentlyAddedContact = null;
  }, 3000);
}


/**
 * Appends contact to list with initial heading if needed.
 * @param {HTMLElement} contactListRef - Element to append to.
 * @param {Object} contact - Contact to add.
 * @param {Object} currentInitialRef - Tracks current letter.
 */
function appendContactToList(contactListRef, contact, currentInitialRef) {
  const firstInitial = getFirstLetter(contact.name);
  if (firstInitial !== currentInitialRef.value) {
    currentInitialRef.value = firstInitial;
    contactListRef.innerHTML += getFirstInitialAndDevider(firstInitial);
  }

  const initials = getInitials(contact.name);
  const highlight = isRecentlyAdded(contact) ? "highlight" : "";
  contactListRef.innerHTML += getContactBasicTemplate(contact, initials, highlight);
}


/**
 * Renders all contacts in the UI.
 */
function renderContacts() {
  let contactListRef = document.getElementById("all_contacts");
  contactListRef.innerHTML = "";
  let sortedContacts = sortContacts(contacts);
  let currentInitial = { value: null };

  sortedContacts.forEach((contact) =>
    appendContactToList(contactListRef, contact, currentInitial)
  );

  clearHighlightAfterDelay();
}


/**
 * Styles and opens contact when clicked.
 * @param {HTMLElement} element - Clicked element.
 * @param {string} initials - Initials of contact.
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


/**
 * Shows contact info in mobile overlay.
 * @param {Object} contact - Contact to show.
 * @param {string} initials - Contact initials.
 */
function toggleContactInfoOverlay(contact, initials) {
  const overlayRef = document.getElementById("overlay");
  overlayRef.innerHTML = getOpenContactMobileTemplate(contact, initials);
  overlayRef.classList.remove("d_none");
}


/**
 * Shows contact info in desktop view.
 * @param {Object} contact - Contact to show.
 * @param {string} initials - Contact initials.
 */
function showContactInfo(contact, initials) {
  let contactInfoRef = document.getElementById("open_contact_Template");
  contactInfoRef.innerHTML = getOpenContactTemplate(contact, initials);
}


/**
 * Deletes a contact from Firebase.
 * @param {string} contactKey - Firebase key to delete.
 */
async function deleteContact(contactKey) {
  try {
    const response = await fetch(
      `${BASE_URL}users/${firebaseKey}/contacts/${contactKey}.json`,
      { method: "DELETE" }
    );
    if (!response.ok) throw new Error("Delete failed");

    contacts = contacts.filter((c) => c.firebaseKey !== contactKey);

    clearContactUIElements();

    toggleOff();
    await loadContacts();
  } catch (error) {
    console.error("Error deleting contact:", error);
    alert("Failed to delete contact. Please try again."); // Optional user feedback
  }
}


/**
 * Clears contact details from the UI.
 */
function clearContactUIElements() {
  const contactInfoRef = document.getElementById("open_contact_Template");
  if (contactInfoRef) contactInfoRef.innerHTML = "";

  const mobileOverlay = document.getElementById("user_contact_information_section_mobile");
  if (mobileOverlay) mobileOverlay.remove();

  const mobileMenu = document.getElementById("edit_delete_menu");
  if (mobileMenu) mobileMenu.innerHTML = "";
}


/**
 * Validates the email input field.
 * @param {string} [inputId="new_contact_email"] - ID of email input.
 * @param {string} [errorId="email-error"] - ID of error element.
 * @returns {boolean} - True if valid.
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


/**
 * Validates the phone input field.
 * @param {string} [inputId="new_contact_phone"] - ID of phone input.
 * @param {string} [errorId="phone-error"] - ID of error element.
 * @returns {boolean} - True if valid.
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


/**
 * Opens the overlay to add a contact.
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
 * Opens menu for editing or deleting a contact.
 * @param {Object} contact - Contact for the menu.
 */
function openEditDeleteMenu(contact) {
  document.getElementById("edit_delete_menu").innerHTML =
    getEditDeleteMenuTemplate(contact);
}


/**
 * Opens overlay for editing contact (desktop).
 * @param {Object} contact - Contact to edit.
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
 * Closes the edit/delete menu.
 */
function closeEditDeleteMenu() {
  const menuRef = document.getElementById("edit_delete_menu");
  if (menuRef) menuRef.innerHTML = "";
}


/**
 * Opens overlay for editing contact (mobile).
 * @param {Object} contact - Contact to edit.
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
 * Prevents closing overlay when clicking inside.
 * @param {Event} event - The click event.
 */
function dialogPrevention(event) {
  event.stopPropagation();
}


/**
 * Closes the desktop overlay.
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


/**
 * Closes the mobile overlay.
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
 * Opens contact details using templates.
 * @param {Object} contact - Contact to show.
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