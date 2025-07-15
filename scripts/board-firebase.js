// board-firebase.js

const BASE_URL = "https://join467-e19d8-default-rtdb.europe-west1.firebasedatabase.app/users/";

/**
 * Fetches tasks from Firebase for a specific user.
 */
async function fetchTasksFromFirebase(userKey) {
    let response = await fetch(`${BASE_URL}${userKey}/tasks.json`);
    let data = await response.json();
    return data;
}

/**
 * Converts raw Firebase task data into a normalized task array.
 */
function normalizeTasks(responseJson) {
    if (!responseJson) return [];
    return Object.entries(responseJson).map(([firebaseKey, task]) => ({
        firebaseKey,
        ...task
    }));
}

/**
 * Fetches contacts for a user and stores them in localStorage under `firebaseUsers`.
 */
async function fetchContactsAndStore(userKey) {
    let response = await fetch(`${BASE_URL}${userKey}/contacts.json`);
    let data = await response.json();
    if (data) {
        let users = JSON.parse(localStorage.getItem('firebaseUsers')) || {};
        users[userKey] = users[userKey] || {};
        users[userKey]['contacts'] = data;
        localStorage.setItem('firebaseUsers', JSON.stringify(users));
    }
}

/**
 * Fetches all contacts for the current user from Firebase and stores them in the `contacts` array.
 */
async function fetchContacts() {
    let response = await fetch(`${BASE_URL}${firebaseKey}/contacts.json`);
    let data = await response.json();
    contacts = Object.values(data || {})
        .filter(u => u && typeof u.name === "string" && u.name.trim())
        .map(u => ({
            name: u.name.trim(),
            color: u.color || "#888"
        }));
    updateHTML();
}

/**
 * Updates the status of a task in Firebase.
 */
async function updateTaskStatusInFirebase(task, status) {
    await fetch(
        `${BASE_URL}${firebaseKey}/tasks/${task.firebaseKey}.json`,
        {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status })
        }
    );
}

/**
 * Updates a task in Firebase with new values.
 */
async function updateTaskInFirebase(taskKey, updatedTask) {
    await fetch(`${BASE_URL}${firebaseKey}/tasks/${taskKey}.json`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedTask)
    });
}

/**
 * Saves the updated subtask array to Firebase for a specific task.
 */
async function saveSubtasksToFirebase(taskKey, subtasks) {
    await fetch(`${BASE_URL}${firebaseKey}/tasks/${taskKey}/subtask.json`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subtasks)
    });
}

/**
 * Deletes a task from Firebase and updates the local task array and UI.
 */
async function deleteTask(taskKey) {
    try {
        let response = await fetch(`${BASE_URL}${firebaseKey}/tasks/${taskKey}.json`, {
            method: "DELETE",
        });
        if (!response.ok) {
            throw new Error("Löschen fehlgeschlagen");
        }
        arrayTasks = arrayTasks.filter((task) => task.firebaseKey !== taskKey);
        closeBoardCard();
        updateHTML();
    } catch (error) {
        console.error("Fehler beim Löschen des Tasks:", error);
    }
}

/**
 * Loads all tasks and contacts for the current user and updates the board UI.
 *
 * @returns {Promise<void>}
 */
async function loadTasks() {
    let responseJson = await fetchTasksFromFirebase(firebaseKey);
    await fetchContactsAndStore(firebaseKey);
    arrayTasks = normalizeTasks(responseJson);
    await fetchContacts();
    updateHTML(arrayTasks);
}

/**
 * Saves a new task to Firebase.
 * @param {Object} task - The task object to save.
 * @returns {Promise<void>}
 */
async function saveTaskToFirebase(task) {
    await fetch(
        `${BASE_URL}${firebaseKey}/tasks.json`,
        {
            method: "POST",
            body: JSON.stringify(task),
        }
    );
}
