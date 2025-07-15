/**
 * Firebase base URL for contact data
 */
const BASE_URL =
  "https://join467-e19d8-default-rtdb.europe-west1.firebasedatabase.app/";

let contacts = [];
let recentlyAddedContact = null;
let firebaseKey = localStorage.getItem("firebaseKey");


/**
 * Starts the app by setting user initials and loading contacts.
 */
function init() {
  setUserInitials();
  loadContacts();
}