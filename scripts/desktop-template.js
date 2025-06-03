function openSubMenu(){
    let supMenuRef = document.getElementById('sub_menu');
    supMenuRef.classList.toggle('d_none');
    supMenuRef.classList.toggle('sub-menu');
}

function setUserInitials() {
  const name = sessionStorage.getItem("userName") || "Guest";
  const initialsElement = document.getElementById("user-initials");

  if (!initialsElement) return;

  if (name.toLowerCase() === "guest") {
    initialsElement.textContent = "G";
    return;
  }

  const parts = name.trim().split(" ").filter(Boolean);
  
  if (parts.length === 1) {
    initialsElement.textContent = parts[0].charAt(0).toUpperCase();
  } else {
    const firstInitial = parts[0].charAt(0).toUpperCase();
    const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase();
    initialsElement.textContent = firstInitial + lastInitial;
  }
}

window.addEventListener("load", () => {
  setUserInitials();
});
