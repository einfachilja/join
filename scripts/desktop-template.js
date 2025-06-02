<<<<<<< HEAD
function openSubMenu(){
    let supMenuRef = document.getElementById('sub_menu');
    supMenuRef.classList.toggle('d_none');
    supMenuRef.classList.toggle('sub-menu');
}

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

window.addEventListener("load", () => {
  setUserInitials();
});
=======
function openSubMenu() {
  let supMenuRef = document.getElementById("sub_menu");
  supMenuRef.classList.toggle("d_none");
  supMenuRef.classList.toggle("sub-menu");
}
>>>>>>> 56777d8 (chore: apply Prettier formatting to scripts)
