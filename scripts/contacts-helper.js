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
 * Gets first letter of a name.
 * @param {string} name - Full name.
 * @returns {string} - Uppercase first letter.
 */
function getFirstLetter(name) {
  return name.trim()[0].toUpperCase();
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
 * Gets new contact input values.
 * @returns {{name: string, email: string, phone: string}} - Trimmed input values.
 */
function getContactFormInput(prefix) {
  return {
    name: document.getElementById(`${prefix}_name`).value.trim(),
    email: document.getElementById(`${prefix}_email`).value.trim(),
    phone: document.getElementById(`${prefix}_phone`).value.trim(),
  };
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