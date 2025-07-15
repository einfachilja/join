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
 * Closes overlays after a contact is added.
 */
function closeOverlaysAfterAdd() {
  toggleOff();
  toggleOffMobile();
}