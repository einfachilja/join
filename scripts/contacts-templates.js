/**
 * Returns the HTML string for the overlay to add a new contact.
 * Used when creating a new contact form popup.
 *
 * @returns {string} HTML template for the add contact overlay.
 */
function overlayTemplate() {
  return /*html*/ `
    <div class="add-new-contact-template-section" >
            <div class="add-new-contact-template" onclick="dialogPrevention(event)">
              <div class="add-new-contact-left-section">
                <img onclick="toggleOff()"
                  class="add-new-contact-template-x-mobile"
                  src="./assets/icons/contacts/close-white.svg"
                  alt="X"
                />
                <div class="logo-section">
                  <img src="./assets/icons/logo.svg" alt="logo" />
                </div>
                <div class="add-new-contact-template-left-text">
                  <h2>Add contact</h2>
                  <p>Tasks are better with a team!</p>
                </div>
                <div class="contact-template-vector"></div>
              </div>

              <div class="add-new-contact-right-section">
                <img onclick="toggleOff()"
                  class="add-new-contact-template-x"
                  src="./assets/icons/contacts/Close.svg"
                  alt="X"
                />

                <main class="add-new-contact-right-section-main">
                  <div class="new-contact-profile-icon-section">
                    <img class="new-contact-profile-icon"
                      src="./assets/icons/contacts/add-new-contact-profile-pic.svg"
                      alt=""
                    />
                  </div>
                  <div class="add-new-contact-text">
                    <form novalidate class="add-contact-form" onsubmit="event.preventDefault(); if (validateContactForm(false)) addNewContact(event);">
                      <div class="input-group">
                        <input id="new_contact_name" type="text" placeholder="Name" maxlength="26" />
                        <img src="./assets/icons/contacts/person.svg" alt="Name Icon" />
                      </div>
                      <small id="name-error" class="error-message"></small>
                      <div class="input-group">
                        <input id="new_contact_email" type="email" placeholder="Email" onblur="isEmailValid('new_contact_email', 'email-error')"  />
                        <img src="./assets/icons/contacts/mail.svg" alt="Email Icon" />
                      </div>
                      <small id="email-error" class="error-message"></small>
                      <div class="input-group">
                        <input id="new_contact_phone" type="tel" maxlength="13" placeholder="Phone" oninput="isPhoneValid('new_contact_phone', 'phone-error')" />
                        <img src="./assets/icons/contacts/call.svg" alt="Phone Icon" />
                      </div>
                      <small id="phone-error" class="error-message"></small>

                      <div class="form-buttons">
                    <button
                      type="button"
                      class="cancel-btn"
                      onclick="toggleOff()"
                    >
                      Cancel
                        <img class="icon-default" src="./assets/icons/contacts/iconoir_cancel.svg" alt="">
                        <img class="icon-hover" src="./assets/icons/contacts/iconoir_cancel_blue.svg" alt="">
                    </button>
                    <button type="submit" class="create-btn">
                      Create Contact
                      <img src="./assets/icons/contacts/check.svg" alt="">
                    </button>
                  </div>
                    </form>
                  </div>
                </main>
              </div>
            </div>
          </div>
          `;
}

/**
 * Returns the HTML string for the overlay to edit an existing contact.
 * Pre-fills the form with the contact's current data.
 *
 * @param {string} name - The contact's name.
 * @param {string} email - The contact's email.
 * @param {string} phone - The contact's phone number.
 * @param {string} firebaseKey - The contact's unique ID from Firebase.
 * @returns {string} HTML template for editing a contact.
 */
function overlayEditTemplate(name, email, phone, firebaseKey) {
  return /*html*/ `
    <div class="add-new-contact-template-section" >
      <div class="add-new-contact-template" onclick="dialogPrevention(event)">
        <div class="add-new-contact-left-section">
          <img onclick="toggleOffMobile()"
            class="add-new-contact-template-x-mobile"
            src="./assets/icons/contacts/close-white.svg"
            alt="X"
          />
          <div class="logo-section">
            <img src="./assets/icons/logo.svg" alt="logo" />
          </div>
          <div class="add-new-contact-template-left-text">
            <h2>Edit contact</h2>
          </div>
          <div class="contact-template-vector"></div>
        </div>

        <div class="add-new-contact-right-section">
          <img onclick="toggleOff()"
            class="add-new-contact-template-x"
            src="./assets/icons/contacts/Close.svg"
            alt="X"
          />

          <main class="add-new-contact-right-section-main">
            <div class="new-contact-profile-icon-section">
              <img class="new-contact-profile-icon"
                src="./assets/icons/contacts/add-new-contact-profile-pic.svg"
                alt=""
              />
            </div>
            <div class="add-new-contact-text">
              <form novalidate class="add-contact-form" onsubmit="event.preventDefault(); if (validateContactForm(true)) saveEditContact(event, '${firebaseKey}');">
                <div class="input-group">
                  <input id="edit_contact_name" type="text" placeholder="Name" value="${name}" maxlength="26" />
                  <img src="./assets/icons/contacts/person.svg" alt="Name Icon" />
                </div>
                <small id="edit-name-error" class="error-message"></small>
                <div class="input-group">
                  <input id="edit_contact_email" type="email" placeholder="Email" value="${email}" onblur="isEmailValid('new_contact_email', 'email-error')" />
                  <img src="./assets/icons/contacts/mail.svg" alt="Email Icon" />
                </div>
                <small id="edit-email-error" class="error-message"></small>
                <div class="input-group">
                  <input id="edit_contact_phone" value="${phone}" type="tel" maxlength="13" placeholder="Phone" oninput="isPhoneValid('new_contact_phone', 'phone-error')"/>
                  <img src="./assets/icons/contacts/call.svg" alt="Phone Icon" />
                </div>
                <small id="edit-phone-error" class="error-message"></small>

                <div class="form-buttons">
                  <button
                    type="button"
                    class="delete-btn"
                    onclick="deleteContact('${firebaseKey}')"
                  >
                    Delete
                  </button>
                  <button type="submit" class="save-btn">
                    Save
                    <img src="./assets/icons/contacts/check.svg" alt="">
                  </button>
                </div>
              </form>
            </div>
          </main>
        </div>
      </div>
    </div>
  `;
}

/**
 * Returns the HTML string to show full contact details in the desktop view.
 * Includes name, email, phone, and buttons to edit or delete the contact.
 *
 * @param {Object} contact - The contact object with all its data.
 * @param {string} initials - The generated initials for the profile icon.
 * @returns {string} HTML template to display the contact's detailed info.
 */
function getOpenContactTemplate(contact, initials) {
  return /*html*/ `
    <div class="my-contact-information-section">
      <div class="profile-badge-and-name">
        <div class="my-profile-icon" style="background-color: ${
          contact.color
        };">${initials}</div>

        <div class="name-section">
          <span class="user-name">${contact.name}</span>

          <div class="edit-delete-section">
            <button onclick='toggleEditOverlay(${JSON.stringify(
              contact
            )})' class="edit-delete-sub-section">
              <img class="icon-default" src="./assets/icons/contacts/edit.svg" />
              <img class="icon-hover" src="./assets/icons/contacts/edit-blue.svg" />
              <span>Edit</span>
            </button>

            <button onclick='deleteContact("${
              contact.firebaseKey
            }")' class="edit-delete-sub-section">
              <img class="icon-default" src="./assets/icons/contacts/delete.svg" />
              <img class="icon-hover" src="./assets/icons/contacts/delete-blue.svg" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      </div>

      <div class="Contact-information-div">
        <span>Contact Information</span>
      </div>

      <div class="email-and-phone-section">
        <div class="email-and-phone-sub-section">
          <div>Email</div>
          <a href="mailto:${contact.email}">${contact.email}</a>
        </div>

        <div class="email-and-phone-sub-section">
          <div>Phone</div>
          <a href="tel:${contact.phone}">${contact.phone}</a>
        </div>
      </div>
    </div>
  `;
}

/**
 * Returns the HTML string for the mobile contact details view.
 * Shows full info in a mobile layout, including buttons to edit/delete.
 *
 * @param {Object} contact - The contact object with all its data.
 * @param {string} initials - The contact's initials for the icon.
 * @returns {string} HTML template for contact info on mobile view.
 */
function getOpenContactMobileTemplate(contact, initials) {
  return /*html*/ `
    <div class="my-contact-information-section-mobile" id="user_contact_information_section_mobile" onclick="dialogPrevention(event)">
      <div class="my-contact-information-section-mobile-content">
        <div class="my-contact-info-mobile-header">
          <div class="my-contact-info-mobile-header-content">
            <div class="header-div-mobile">
              <span class="Contacts-span">Contacts</span>
              <span class="better-with-a-team-span">Better with a team</span>
              <img src="./assets/icons/contacts/blue-line-mobile.svg" alt="">
            </div>
            <div class="arrow-left-mobile">
              <a href="contacts.html">
                <img class="arrow-mobile" src="./assets/icons/arrow-left-line.svg" alt="Go Back" />
              </a>
            </div>
          </div>
        </div>

        <div class="user-contact-informtion">
          <div class="profile-badge-and-name">
            <div class="my-profile-icon" style="background-color: ${
              contact.color
            };">${initials}</div>
            <span class="user-name">${contact.name}</span>
          </div>

          <div class="email-and-phone-section">
            <div class="Contact-information-div">
              <span>Contact Information</span>
            </div>

            <div class="email-and-phone-sub-section">
              <div class="email-and-phone-span">Email</div>
              <a href="mailto:${contact.email}">${contact.email}</a>
            </div>

            <div class="email-and-phone-sub-section">
              <div class="email-and-phone-span">Phone</div>
              <a href="tel:${contact.phone}">${contact.phone}</a>
            </div>
          </div>
        </div>

        <div class="add-new-contact-button">
          <button onclick='openEditDeleteMenu(${JSON.stringify(contact)})'>
            <img src="./assets/icons/contacts/edit-delete-menu.svg" alt="edit-delete-menu" />
          </button>
        </div>
        <div id="edit_delete_menu"></div>
      </div>
    </div>
  `;
}

/**
 * Returns the HTML string for the edit/delete popup menu (on mobile).
 * Appears when clicking the 3-dot button on a mobile contact.
 *
 * @param {Object} contact - The contact object to edit or delete.
 * @returns {string} HTML template for the mobile edit/delete menu.
 */
function getEditDeleteMenuTemplate(contact) {
  return /*html*/ `
  <div id="edit_delete_menu" class="edit-delete-menu">
            <button onclick='toggleMobileEditOverlay(${JSON.stringify(
              contact
            )})' class="edit-delete-sub-section">
              <img class="icon-default" src="./assets/icons/contacts/edit.svg" />
              <img class="icon-hover" src="./assets/icons/contacts/edit-blue.svg" />
              <span>Edit</span>
            </button>

            <button class="edit-delete-sub-section" onclick="deleteContact('${
              contact.firebaseKey
            }')">
              <img class="icon-default" src="./assets/icons/contacts/delete.svg" />
              <img class="icon-hover" src="./assets/icons/contacts/delete-blue.svg" />
              <span>Delete</span>
            </button>
          </div>
  `;
}

/**
 * Returns the HTML string for the success message after creating a contact.
 * Message is shown briefly after successfully adding a new contact.
 *
 * @returns {string} HTML for the success notification.
 */
function getCreatedContactSuccessfullyMessage() {
  return /*html*/ `
  <div id="created_contact_message" class="created-contact-message-div">
    <span class="created-contact-message">Contact successfully created</span>
  </div>
  `;
}

/**
 * Returns the HTML string for an alphabet divider between contact groups.
 * Used when listing contacts grouped by first letter of their name.
 *
 * @param {string} currentInitial - The first letter of the group.
 * @returns {string} HTML for the letter divider.
 */
function getFirstInitialAndDevider(currentInitial) {
  return /*html*/ `
        <div class="alphabet">
          <span class="alphabet-span">${currentInitial}</span>
          <div class="alphabet-devider"></div>
        </div>
      `;
}

/**
 * Returns the HTML for a contact card in the list view.
 * Shows initials, name, and email in a basic style.
 *
 * @param {Object} contact - The contact object.
 * @param {string} initials - The initials of the contact.
 * @param {string} highlight - An optional class to highlight the contact.
 * @returns {string} HTML for a single contact in the list.
 */
function getContactBasicTemplate(contact, initials, highlight) {
  return /*html*/ `
    <div onclick="styleContactOnclick(this, '${initials}')" class="contact ${highlight}">
      <div class="profile-icon" style="background-color: ${contact.color};">${initials}</div>
      <div class="name-and-email">
        <div class="contact-name">${contact.name}</div>
        <a>${contact.email}</a>
      </div>
    </div>
  `;
}
