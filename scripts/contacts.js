let contacts = [];

// Function to add a new contact

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
  let newContactName = document.getElementById("new_contact_name").value;
  let newContactEmail = document.getElementById("new_contact_email").value;
  let newContactPhone = document.getElementById("new_contact_phone").value;
  if (newContactName && newContactEmail && newContactPhone) {
    contacts.push({
      name: newContactName,
      email: newContactEmail,
      phone: newContactPhone,
      color: getRandomColor(), //
    });
    toggleOff(); // Close the overlay after adding the contact
  }
  document.getElementById("new_contact_name").value = "";
  document.getElementById("new_contact_email").value = "";
  document.getElementById("new_contact_phone").value = "";
  renderContacts(); // Refresh the contact list
}

function renderContacts() {
  let contactListRef = document.getElementById("all_contacts");

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

    // If we encounter a new initial, render an alphabet header
    if (firstNameInitial !== currentInitial) {
      currentInitial = firstNameInitial;
      contactListRef.innerHTML += `
                <div class="alphabet">
                    ${currentInitial}
                    <div class="alphabet-devider"></div>
                </div>
            `;
    }

    // Extract initials for profile icon
    let initials = nameParts[0][0].toUpperCase();
    if (nameParts.length >= 2) {
      initials += nameParts[1][0].toUpperCase();
    }

    // Add the contact HTML
    contactListRef.innerHTML += `
    <div class="contact">
        <div class="profile-icon" style="background-color: ${contact.color};">${initials}</div>
        <div class="name-and-email">
            <div class="contact-name">${contact.name}</div>
            <a href="mailto:${contact.email}">${contact.email}</a>
        </div>
    </div>
`;
  });
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
