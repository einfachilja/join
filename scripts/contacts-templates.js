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
                  <img src="./assets/img/logo.svg" alt="logo" />
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
                    <form class="add-contact-form" onsubmit="addNewContact(event)">
                      <div class="input-group">
                        <input id="new_contact_name" type="text" placeholder="Name" maxlength="26" required />
                        <img src="./assets/icons/contacts/person.svg" alt="Name Icon" />
                      </div>
                      <div class="input-group">
                        <input id="new_contact_email" type="email" placeholder="Email" oninput="isEmailValid('new_contact_email', 'email-error')" required />
                        <img src="./assets/icons/contacts/mail.svg" alt="Email Icon" />
                      </div>
                      <small id="email-error" class="error-message">
                        Please enter a valid email address.
                      </small>
                      <div class="input-group">
                        <input id="new_contact_phone" type="tel" maxlength="10" oninput="isPhoneValid('new_contact_phone', 'phone-error')" placeholder="Phone" />

                        <img src="./assets/icons/contacts/call.svg" alt="Phone Icon" />
                      </div>
                      <small id="phone-error" class="error-message">Please enter a valid number.</small>

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
            <img src="./assets/img/logo.svg" alt="logo" />
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
              <form class="add-contact-form" onsubmit="saveEditContact(event, '${firebaseKey}')">
                <div class="input-group">
                  <input id="edit_contact_name" type="text" placeholder="Name" value="${name}" maxlength="26" required />
                  <img src="./assets/icons/contacts/person.svg" alt="Name Icon" />
                </div>
                <div class="input-group">
                  <input id="edit_contact_email" type="email" placeholder="Email" value="${email}" oninput="isEmailValid('edit_contact_email', 'edit-email-error')" required />
                  <img src="./assets/icons/contacts/mail.svg" alt="Email Icon" />
                </div>
                <small id="edit-email-error" class="error-message">
                  Please enter a valid email address.
                </small>
                <div class="input-group">
                  <input id="edit_contact_phone" value="${phone}" type="tel" maxlength="10" oninput="isPhoneValid('edit_contact_phone', 'edit-phone-error')" placeholder="Phone" />
                  <img src="./assets/icons/contacts/call.svg" alt="Phone Icon" />
                </div>
                <small id="edit-phone-error" class="error-message">Please enter a valid number.</small>

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


function getOpenContactTemplate(contact, initials) {
  return /*html*/ `
    <div class="my-contact-information-section">
      <div class="profile-badge-and-name">
        <div class="my-profile-icon" style="background-color: ${contact.color};">${initials}</div>

        <div class="name-section">
          <span class="user-name">${contact.name}</span>

          <div class="edit-delete-section">
            <button onclick='toggleEditOverlay(${JSON.stringify(contact)})' class="edit-delete-sub-section">
              <img class="icon-default" src="./assets/icons/contacts/edit.svg" />
              <img class="icon-hover" src="./assets/icons/contacts/edit-blue.svg" />
              <span>Edit</span>
            </button>

            <button onclick='deleteContact("${contact.firebaseKey}")' class="edit-delete-sub-section">
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
                <img class="arrow-mobile" src="./assets/img/arrow-left-line.svg" alt="Go Back" />
              </a>
            </div>
          </div>
        </div>

        <div class="user-contact-informtion">
          <div class="profile-badge-and-name">
            <div class="my-profile-icon" style="background-color: ${contact.color};">${initials}</div>
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


function getEditDeleteMenuTemplate(contact) {
  return /*html*/ `
  <div id="edit_delete_menu" class="edit-delete-menu">
            <button onclick='toggleMobileEditOverlay(${JSON.stringify(contact)})' class="edit-delete-sub-section">
              <img class="icon-default" src="./assets/icons/contacts/edit.svg" />
              <img class="icon-hover" src="./assets/icons/contacts/edit-blue.svg" />
              <span>Edit</span>
            </button>

            <button class="edit-delete-sub-section" onclick='deleteContact("${contact.firebaseKey}")'>
              <img class="icon-default" src="./assets/icons/contacts/delete.svg" />
              <img class="icon-hover" src="./assets/icons/contacts/delete-blue.svg" />
              <span>Delete</span>
            </button>
          </div>
  `
}


function getCreatedContactSuccessfullyMessage(){
  return /*html*/ `
  <div id="created_contact_message" class="created-contact-message-div d_none">
    <span class="created-contact-message">Contact successfully created</span>
  </div>
  `
}


function getFirstInitialAndDevider(currentInitial){
  return /*html*/ `
        <div class="alphabet">
          <span class="alphabet-span">${currentInitial}</span>
          <div class="alphabet-devider"></div>
        </div>
      `
}


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
