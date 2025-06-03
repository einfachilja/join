function overlayTemplate() {
  return /*html*/ `
    <div class="add-new-contact-template-section" >
            <div class="add-new-contact-template" onclick="dialogPrevention(event)">
              <div class="add-new-contact-left-section">
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
                  src="./assets/img/contacts-icons/Close.svg"
                  alt="X"
                />

                <main class="add-new-contact-right-section-main">
                  <div class="new-contact-profile-icon">
                    <img
                      src="./assets/img/contacts-icons/add-new-contact-profile-pic.svg"
                      alt=""
                    />
                  </div>
                  <div class="add-new-contact-text">
                    <form class="add-contact-form">
                      <div class="input-group">
                        <input id="new_contact_name" type="text" placeholder="Name" required />
                        <img src="./assets/img/contacts-icons/person.svg" alt="Name Icon" />
                      </div>
                      <div class="input-group">
                        <input id="new_contact_email" type="email" placeholder="Email" required />
                        <img src="./assets/img/contacts-icons/mail.svg" alt="Email Icon" />
                      </div>
                      <div class="input-group">
                        <input id="new_contact_phone" type="tel" placeholder="Phone" required />
                        <img src="./assets/img/contacts-icons/call.svg" alt="Phone Icon" />
                      </div>

                      <div class="form-buttons">
                    <button
                      type="button"
                      class="cancel-btn"
                      onclick="toggleOff()"
                    >
                      Cancel
                        <img class="icon-default" src="./assets/img/contacts-icons/iconoir_cancel.svg" alt="">
                        <img class="icon-hover" src="./assets/img/contacts-icons/iconoir_cancel_blue.svg" alt="">
                    </button>
                    <button onclick="addNewContact()" type="submit" class="create-btn">
                      Create Contact
                      <img src="./assets/img/contacts-icons/check.svg" alt="">
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

function overlayEditTemplate() {
  return /*html*/ `
    <div class="add-new-contact-template-section" >
            <div class="add-new-contact-template" onclick="dialogPrevention(event)">
              <div class="add-new-contact-left-section">
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
                  src="./assets/img/contacts-icons/Close.svg"
                  alt="X"
                />

                <main class="add-new-contact-right-section-main">
                  <div class="new-contact-profile-icon">
                    <img
                      src="./assets/img/contacts-icons/add-new-contact-profile-pic.svg"
                      alt=""
                    />
                  </div>
                  <div class="add-new-contact-text">
                    <form class="add-contact-form">
                      <div class="input-group">
                        <input type="email" placeholder="Name" required />
                        <img src="./assets/img/contacts-icons/person.svg" alt="Name Icon" />
                      </div>
                      <div class="input-group">
                        <input type="email" placeholder="Email" required />
                        <img src="./assets/img/contacts-icons/mail.svg" alt="Email Icon" />
                      </div>
                      <div class="input-group">
                        <input type="tel" placeholder="Phone" required />
                        <img src="./assets/img/contacts-icons/call.svg" alt="Phone Icon" />
                      </div>

                      <div class="form-buttons">
                    <button
                      type="button"
                      class="delete-btn"
                    >
                      Delete
                    </button>
                    <button type="submit" class="save-btn">
                      Save
                      <img src="./assets/img/contacts-icons/check.svg" alt="">
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

function getOpenContactTemplate(){
  return /*html*/ `
  
    `
}