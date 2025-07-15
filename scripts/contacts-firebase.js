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
 * Updates contact and reloads list.
 * @param {string} key - Firebase contact key.
 * @param {Object} updatedContact - Updated contact data.
 */
async function updateContactAndReload(key, updatedContact) {
  await updateContactInFirebase(key, updatedContact);
  await loadContacts();
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
    alert("Failed to delete contact. Please try again.");
  }
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