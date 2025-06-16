const BASE_URL =
  "https://join467-e19d8-default-rtdb.europe-west1.firebasedatabase.app/";

let contacts = [];

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

let firebaseKey = localStorage.getItem("firebaseKey");

/* ============== ADD CONTACTS ============== */
function addNewContact() {
  const name = new_contact_name.value.trim();
  const email = new_contact_email.value.trim();
  const phone = new_contact_phone.value.trim();
  if (!name || !email || !phone) return;

  const contact = { name, email, phone, color: getRandomColor() };
  fetch(`https://join467-e19d8-default-rtdb.europe-west1.firebasedatabase.app/users/${firebaseKey}/contacts.json`, {
    method: "POST",
    body: JSON.stringify(contact)
  }).then(loadContacts);

  toggleOff();
}


/* ============== SAVE EDIT CONTACT HELPER FUNCTIONS ============== */
function getTrimmedContactInput() {
  return {
    name: document.getElementById("edit_contact_name").value.trim(),
    email: document.getElementById("edit_contact_email").value.trim(),
    phone: document.getElementById("edit_contact_phone").value.trim(),
  };
}

function isValidContactInput(name, email, phone) {
  return (
    name &&
    email &&
    phone &&
    isTelValid("edit_contact_phone") &&
    isEmailValid("edit_contact_email")
  );
}

function buildUpdatedContact(name, email, phone, originalContact) {
  const color = originalContact?.color || getRandomColor();
  return { name, email, phone, color };
}

async function updateContactInFirebase(contactKey, updatedContact) {
  await fetch(`${BASE_URL}users/${firebaseKey}/contacts/${contactKey}.json`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updatedContact),
  });
}

function updateLocalContact(original, updated) {
  if (!original) return;
  Object.assign(original, updated);
}


/* ============== SAVE EDIT CONTACT ============== */
async function saveEditContact(event, contactKey) {
  event.preventDefault();

  const { name, email, phone } = getTrimmedContactInput();
  if (!isValidContactInput(name, email, phone)) return;

  const originalContact = contacts.find((c) => c.firebaseKey === contactKey);
  const updatedContact = buildUpdatedContact(name, email, phone, originalContact);

  try {
    await updateContactInFirebase(contactKey, updatedContact);
    updateLocalContact(originalContact, updatedContact);
    toggleOff();
    renderContacts();
    showContactInfo({ ...updatedContact, firebaseKey: contactKey });
  } catch (error) {
    console.error("Failed to save contact:", error);
  }
}

/* ============== LOAD CONTACTS ============== */
async function loadContacts() {
  try {
    const response = await fetch(
      `https://join467-e19d8-default-rtdb.europe-west1.firebasedatabase.app/users/${firebaseKey}/contacts.json`
    );
    const data = await response.json();

    contacts = [];

    for (let key in data) {
      contacts.push({ ...data[key], firebaseKey: key });
    }

    renderContacts();
  } catch (error) {
    console.error("Failed to load contacts:", error);
  }
}

/* ============== RENDER HELPER FUNCTIONS ============== */


/* ============== RENDER CONTACTS ============== */
function renderContacts() {
  let contactListRef = document.getElementById("all_contacts");
  contactListRef.innerHTML = "";

  // Step 1: Sort contacts alphabetically by first name
  contacts.sort((a, b) => {
    let aName = a.name.trim().toUpperCase();
    let bName = b.name.trim().toUpperCase();
    return aName.localeCompare(bName);
  });

  // Step 2: Group by first letter of first name
  let currentInitial = null;

  contacts.forEach((contact) => {
    const nameParts = contact.name.trim().split(" ");
    const firstNameInitial = nameParts[0][0].toUpperCase();

    if (firstNameInitial !== currentInitial) {
      currentInitial = firstNameInitial;
      contactListRef.innerHTML += `
                <div class="alphabet">
                    <span class="alphabet-span">${currentInitial}</span>
                    <div class="alphabet-devider"></div>
                </div>
            `;
    }

    let initials = nameParts[0][0].toUpperCase();
    if (nameParts.length >= 2) {
      initials += nameParts[1][0].toUpperCase();
    }

    contactListRef.innerHTML += `
    <div onclick="styleContactOnclick(this)"  class="contact">
        <div class="profile-icon" style="background-color: ${contact.color};">${initials}</div>
        <div class="name-and-email">
            <div class="contact-name">${contact.name}</div>
            <a>${contact.email}</a>
        </div>
    </div>
`;
  });
}

/* ========== STYLE CONTACT BUTTON ONCLICK ========== */
function styleContactOnclick(element) {
  document.querySelectorAll(".contact.open-contact").forEach((el) => {
    el.classList.remove("open-contact");
  });

  element.classList.add("open-contact");

  const name = element.querySelector(".contact-name").textContent;
  const contact = contacts.find((c) => c.name === name);
  if (contact) {
    // If mobile view, show overlay
    if (window.innerWidth <= 800) {
      toggleContactInfoOverlay(contact); // new overlay for mobile
    } else {
      showContactInfo(contact); // desktop mode
    }
  }
}

function toggleContactInfoOverlay(contact){
  const overlayRef = document.getElementById("overlay");
  overlayRef.innerHTML = ""; // Clear previous content

  overlayRef.innerHTML += getOpenContactMobileTemplate(contact); // Add new contact info

  overlayRef.classList.remove("d_none"); // Show the overlay
}

/* ============= SHOW CONTACT TEMPLATE ============= */
function showContactInfo(contact) {
  let contactInfoRef = document.getElementById("open_contact_Template");
  contactInfoRef.innerHTML = getOpenContactTemplate(contact);
}

/* ========== DELETE Contact FROM FIREBASE ============== */
async function deleteContact(contactKey) {
  try {
    let response = await fetch(`${BASE_URL}users/${firebaseKey}/contacts/${contactKey}.json`, {
      method: "DELETE",
    });

    if (!response.ok) throw new Error("Delete failed");

    contacts = contacts.filter((c) => c.contactKey !== contactKey);

    const contactInfoRef = document.getElementById("open_contact_Template");
    if (contactInfoRef) {
      contactInfoRef.innerHTML = "";
    }
    toggleOff();
    await loadContacts();
  } catch (error) {
    console.error("Error deleting contact:", error);
  }
}

/* ============= TEL VALIDATION ============= */
function isTelValid(inputId = "new_contact_phone") {
  const phoneInput = document.getElementById(inputId);
  if (!phoneInput) return false;

  const phoneValue = phoneInput.value.trim();
  const phonePattern = /^\+?[0-9\s-]{7,}$/;

  if (!phonePattern.test(phoneValue)) {
    phoneInput.classList.add("invalid");
    return false;
  } else {
    phoneInput.classList.remove("invalid");
    return true;
  }
}

/* ============= EMAIL VALIDATION ============= */
function isEmailValid(inputId = "new_contact_email") {
  const emailInput = document.getElementById(inputId);
  if (!emailInput) return false;

  const emailValue = emailInput.value.trim();
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(emailValue)) {
    emailInput.classList.add("invalid");
    return false;
  } else {
    emailInput.classList.remove("invalid");
    return true;
  }
}

/* =================== OVERLAY ================== */
function toggleOverlay() {
  const overlayRef = document.getElementById("overlay");
  overlayRef.innerHTML = ""; 
  overlayRef.innerHTML += overlayTemplate(); 

  overlayRef.classList.remove("d_none"); 

  // Fade in the overlay background
  setTimeout(() => {
    overlayRef.classList.add("active");
  }, 0);

  // Slide in the modal
  setTimeout(() => {
    const modal = document.querySelector(".add-new-contact-template");
    if (modal) modal.classList.add("slide-in");
  }, 0);
}

function openEditDeleteMenu(contact){
  let openEditDeleteMenuRef = document.getElementById("edit_delete_menu");
  openEditDeleteMenuRef.innerHTML = getEditDeleteMenuTemplate(contact);
}

/* =================== EDIT OVERLAY ================== */
function toggleEditOverlay(contact) {
  const overlayRef = document.getElementById("overlay");
  overlayRef.innerHTML = ""; 

  overlayRef.innerHTML += overlayEditTemplate(
    contact.name,
    contact.email,
    contact.phone,
    contact.firebaseKey
  );

  overlayRef.classList.remove("d_none"); 

  setTimeout(() => overlayRef.classList.add("active"), 0);
  setTimeout(() => {
    const modal = document.querySelector(".add-new-contact-template");
    if (modal) modal.classList.add("slide-in");
  }, 0);
}

function toggleMobileEditOverlay(contact) {
  const overlayRef = document.getElementById("overlay_mobile");
  overlayRef.innerHTML = ""; 

  overlayRef.innerHTML += overlayEditTemplate(
    contact.name,
    contact.email,
    contact.phone,
    contact.firebaseKey
  );

  overlayRef.classList.remove("d_none"); 

  setTimeout(() => overlayRef.classList.add("active"), 0);
  setTimeout(() => {
    const modal = document.querySelector(".add-new-contact-template");
    if (modal) modal.classList.add("slide-in");
  }, 0);
}

function dialogPrevention(event) {
  event.stopPropagation();
}

function toggleOff() {
  const overlayRef = document.getElementById("overlay");
  const modal = document.querySelector(".add-new-contact-template");

  if (modal) {
    modal.classList.remove("slide-in"); 
  }

  overlayRef.classList.remove("active"); 

  setTimeout(() => {
    overlayRef.classList.add("d_none");
    overlayRef.innerHTML = ""; 
  }, 280); 
}

function toggleOffMobile() {
  const overlayRef = document.getElementById("overlay_mobile");
  const modal = document.querySelector(".add-new-contact-template");

  if (modal) {
    modal.classList.remove("slide-in"); 
  }

  overlayRef.classList.remove("active"); 

  setTimeout(() => {
    overlayRef.classList.add("d_none");
    overlayRef.innerHTML = ""; 
  }, 280); 
}

window.onload = loadContacts;


