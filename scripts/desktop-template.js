/**
 * Toggles the sub-menu visibility by adding or removing CSS classes.
 * It shows the menu if hidden and hides it if already shown.
 */
function openSubMenu(event) {
  event.stopPropagation(); 
  const subMenuRef = document.getElementById('sub_menu');
  subMenuRef.classList.toggle('d_none');
  subMenuRef.classList.toggle('sub-menu');
}

function closeSubMenuIfOpen(event) {
  const subMenu = document.getElementById('sub_menu');
  const profile = document.querySelector('.user-profile');

  if (!subMenu.classList.contains('d_none') &&
      !subMenu.contains(event.target) &&
      !profile.contains(event.target)) {
    subMenu.classList.add('d_none');
    subMenu.classList.remove('sub-menu');
  }
}


/**
 * Sets the user's initials in the profile area based on the name stored in sessionStorage.
 * If the user is a guest, it displays "G". If a custom color is saved, it applies that color to the initials.
 */
function setUserInitials() {
  const userName = sessionStorage.getItem("userName") || "Guest";
  const initialsField = document.getElementById("user-initials");
  const profileCircle = document.querySelector(".user-profile");
  if (!initialsField || !profileCircle) return;

  const nameParts = userName.trim().split(" ");
  const initials = userName.toLowerCase() === "guest"
    ? "G"
    : (nameParts[0][0] + (nameParts.length > 1 ? nameParts.at(-1)[0] : "")).toUpperCase();

  initialsField.textContent = initials;

  const userColor = sessionStorage.getItem("userColor");
  if (userColor) initialsField.style.color = userColor;
}