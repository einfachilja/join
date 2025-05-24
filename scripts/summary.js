  // Check the current hour and set the greeting message accordingly
function greetUser() {
  let greetRef = document.getElementById('greets');
  let hour = new Date().getHours();

    if (hour < 12) {
      greetRef.innerHTML = "Good morning";
    }
    else if (hour < 18) {
      greetRef.innerHTML = "Good afternoon";
    }
    else {
      greetRef.innerHTML = "Good evening";
    }
}