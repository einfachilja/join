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

function addNewContact() {
  const name = new_contact_name.value.trim();
  const email = new_contact_email.value.trim();
  const phone = new_contact_phone.value.trim();
  if (!name || !email || !phone) return;

  const contact = { name, email, phone, color: getRandomColor() };
  fetch("https://join467-e19d8-default-rtdb.europe-west1.firebasedatabase.app/contacts.json", {
    method: "POST",
    body: JSON.stringify(contact)
  }).then(loadContacts);

  toggleOff();
}

function loadContacts() {
  fetch("https://join467-e19d8-default-rtdb.europe-west1.firebasedatabase.app/contacts.json")
    .then(r => r.json())
    .then(d => {
      contacts = Object.values(d || {});
      renderContacts();
    });
}

function renderContacts() {
  let contactListRef = document.getElementById("all_contacts");
  contactListRef.innerHTML = '';

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
                    ${currentInitial}
                    <div class="alphabet-devider"></div>
                </div>
            `;
    }

    let initials = nameParts[0][0].toUpperCase();
    if (nameParts.length >= 2) {
      initials += nameParts[1][0].toUpperCase();
    }

    contactListRef.innerHTML += `
    <div onclick="styleContactOnclick(this)" class="contact">
        <div class="profile-icon" style="background-color: ${contact.color};">${initials}</div>
        <div class="name-and-email">
            <div class="contact-name">${contact.name}</div>
            <a>${contact.email}</a>
        </div>
    </div>
`;
  });
}

function styleContactOnclick(element) {
  document.querySelectorAll('.contact.open-contact').forEach((element) => {
    element.classList.remove('open-contact');
  });

  element.classList.add('open-contact');
  showContactInfo();
}

function showContactInfo() {
  let contactInfoRef = document.getElementById("open_contact_Template");
  contactInfoRef.innerHTML = ""; 
  contactInfoRef.innerHTML += getOpenContactTemplate(); 
}

// overlay
function toggleOverlay() {
  const overlayRef = document.getElementById("overlay");
  overlayRef.innerHTML = ""; // Clear previous content
  overlayRef.innerHTML += overlayTemplate(); // Inject template

  overlayRef.classList.remove("d_none"); // Show overlay (transparent)

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

function toggleEditOverlay() {
  const overlayRef = document.getElementById("overlay");
  overlayRef.innerHTML = ""; // Clear previous content
  overlayRef.innerHTML += overlayEditTemplate(); // Inject template

  overlayRef.classList.remove("d_none"); // Show overlay (transparent)

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

function dialogPrevention(event) {
  event.stopPropagation();
}

function toggleOff() {
  const overlayRef = document.getElementById("overlay");
  const modal = document.querySelector(".add-new-contact-template");

  if (modal) {
    modal.classList.remove("slide-in"); // slide out modal
  }

  overlayRef.classList.remove("active"); // start fade out

  // Hide the overlay after both animations
  setTimeout(() => {
    overlayRef.classList.add("d_none");
    overlayRef.innerHTML = ""; // optional: clean up
  }, 280); // match fade + slide time
}

window.onload = loadContacts;
