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
 * Shows contact info in desktop view.
 * @param {Object} contact - Contact to show.
 * @param {string} initials - Contact initials.
 */
function showContactInfo(contact, initials) {
  let contactInfoRef = document.getElementById("open_contact_Template");
  contactInfoRef.innerHTML = getOpenContactTemplate(contact, initials);
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


/**
 * Shows message after a contact is added.
 */
function showAddedContactMessage() {
  const messageDiv = createContactMessageElement();
  document.body.appendChild(messageDiv.outer);
  fadeInAndRemove(messageDiv.inner, messageDiv.outer);
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