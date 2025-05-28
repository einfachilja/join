// overlay
function toggleOverlay() {
    const overlayRef = document.getElementById('overlay');
    overlayRef.innerHTML = ""; // Clear previous content
    overlayRef.innerHTML += overlayTemplate(); // Inject template

    overlayRef.classList.remove('d_none'); // Show overlay (transparent)
    
    // Fade in the overlay background
    setTimeout(() => {
        overlayRef.classList.add('active');
    }, 0);

    // Slide in the modal
    setTimeout(() => {
        const modal = document.querySelector('.add-new-contact-template');
        if (modal) modal.classList.add('slide-in');
    }, 0);
}

function toggleEditOverlay() {
    const overlayRef = document.getElementById('overlay');
    overlayRef.innerHTML = ""; // Clear previous content
    overlayRef.innerHTML += overlayEditTemplate(); // Inject template

    overlayRef.classList.remove('d_none'); // Show overlay (transparent)
    
    // Fade in the overlay background
    setTimeout(() => {
        overlayRef.classList.add('active');
    }, 0);

    // Slide in the modal
    setTimeout(() => {
        const modal = document.querySelector('.add-new-contact-template');
        if (modal) modal.classList.add('slide-in');
    }, 0);
}

function dialogPrevention(event) {
    event.stopPropagation();
}

function toggleOff() {
    const overlayRef = document.getElementById('overlay');
    const modal = document.querySelector('.add-new-contact-template');

    if (modal) {
        modal.classList.remove('slide-in'); // slide out modal
    }

    overlayRef.classList.remove('active'); // start fade out

    // Hide the overlay after both animations
    setTimeout(() => {
        overlayRef.classList.add('d_none');
        overlayRef.innerHTML = ""; // optional: clean up
    }, 280); // match fade + slide time
}
