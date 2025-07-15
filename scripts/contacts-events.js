/**
 * Adds a new contact after validation.
 * @param {Event} event - The form submit event.
 */
async function addNewContact(event) {
  event.preventDefault();
  const { name, email, phone } = getContactFormInput("new_contact");
  if (!validateContactForm(false)) return;

  const contact = createContactObject(name, email, phone);
  recentlyAddedContact = contact;

  await getFirebaseKeyAndLoadContacts(contact);
  closeOverlaysAfterAdd();
  openOverlayForRecentlyAdded(contact);
}


/**
 * Saves the edited contact and closes overlay.
 * @param {Event} event - Submit event.
 * @param {string} contactKey - Firebase key.
 */
async function saveEditContact(event, contactKey) {
  event.preventDefault();

  const { name, email, phone } = getContactFormInput("edit_contact");
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
 * Updates a contact in the local list.
 * @param {Object} original - Original contact.
 * @param {Object} updated - Updated contact data.
 */
function updateLocalContact(original, updated) {
  if (!original) return;
  Object.assign(original, updated);
}