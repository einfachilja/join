const BASE_URL = "https://join-1f08e-default-rtdb.europe-west1.firebasedatabase.app";

async function loginUser(path = "") {
    let email = document.getElementById("email").value.trim();
    let password = document.getElementById("password").value.trim();

    if (!email || !password) {
        alert("Please fill in both email and password.");
        return;
    }

    try {
        const response = await fetch(BASE_URL + path + '.json');

        console.log("Response object:", response);

        if (!response.ok) {
            throw new Error("Network response was not ok");
        }

        const data = await response.json();
        console.log("User data from Firebase:", data);

        if (!data) {
            alert("No users found.");
            return;
        }

        const users = Object.values(data);

        const user = users.find(user =>
            user.email.toLowerCase().trim() === email.toLowerCase().trim() &&
            user.password === password
        );

        if (user) {
            alert("Login successful!");
            window.location.href = "summary.html";
        } else {
            alert("Invalid email or password.");
        }
    } catch (error) {
        console.error("Error during login:", error);
        alert("An error occurred while logging in:\n" + error.message);
    }
}