/**
 * Validates a form field for required input, email, or phone format.
 * @param {HTMLInputElement} input - The input field element.
 * @param {HTMLElement} error - Element to show error messages.
 * @param {string} fieldName - Name of the field for the error message.
 * @param {boolean} isEmail - If true, validates as email.
 * @param {boolean} isPhone - If true, validates as phone number.
 * @returns {boolean} - True if valid, false if invalid.
 */
function validateField(input, error, fieldName, isEmail, isPhone) {
  const value = input.value.trim();
  let msg = "";
  if (!value) {
    msg = `${fieldName} cannot be empty`;
  } else if (isEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    msg = "Invalid email address";
  } else if (isPhone && !/^\+?[0-9\s-]{7,10}$/.test(value)) {
    msg = "Invalid phone number";
  }

  if (msg) {
    error.textContent = msg;
    error.classList.add("visible");
    input.classList.add("invalid");
    return false;
  } else {
    error.textContent = "";
    error.classList.remove("visible");
    input.classList.remove("invalid");
    return true;
  }
}


/**
 * Validates all contact form fields (add or edit mode).
 * @param {boolean} isEdit - True if validating edit form, false for new form.
 * @returns {boolean} - True if all fields are valid.
 */
function validateContactForm(isEdit) {
  const prefix = isEdit ? "edit_contact_" : "new_contact_";
  const validName = validateField(
    document.getElementById(prefix + "name"),
    document.getElementById((isEdit ? "edit-" : "") + "name-error"),
    "Name", false, false
  );
  const validEmail = validateField(
    document.getElementById(prefix + "email"),
    document.getElementById((isEdit ? "edit-" : "") + "email-error"),
    "Email", true, false
  );
  const validPhone = validateField(
    document.getElementById(prefix + "phone"),
    document.getElementById((isEdit ? "edit-" : "") + "phone-error"),
    "Phone", false, true
  );

  return validName && validEmail && validPhone;
}


/**
 * Validates an input field against a regex pattern and updates UI accordingly.
 * @param {string} inputId - The ID of the input field.
 * @param {string} errorId - The ID of the associated error element.
 * @param {RegExp} pattern - The regular expression to validate against.
 * @param {string} errorMsg - The message to show when invalid.
 * @returns {boolean} - True if input is valid, false otherwise.
 */
function validateInputPattern(inputId, errorId, pattern, errorMsg) {
  const input = document.getElementById(inputId);
  const error = document.getElementById(errorId);
  const value = input.value.trim();

  if (!value) {
    input.classList.remove("invalid");
    error.classList.remove("visible");
    error.textContent = "";
    return false;
  }

  const isValid = pattern.test(value);
  input.value = value;
  input.classList.toggle("invalid", !isValid);
  error.textContent = isValid ? "" : errorMsg;
  error.classList.toggle("visible", !isValid);

  return isValid;
}


/**
 * Validates the email input field.
 * @param {string} [inputId="new_contact_email"] - ID of email input.
 * @param {string} [errorId="email-error"] - ID of error element.
 * @returns {boolean} - True if valid.
 */
function isEmailValid(inputId = "new_contact_email", errorId = "email-error") {
  return validateInputPattern(
    inputId,
    errorId,
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    "Invalid email address"
  );
}


/**
 * Validates the phone input field.
 * @param {string} [inputId="new_contact_phone"] - ID of phone input.
 * @param {string} [errorId="phone-error"] - ID of error element.
 * @returns {boolean} - True if valid.
 */
function isPhoneValid(inputId = "new_contact_phone", errorId = "phone-error") {
  const input = document.getElementById(inputId);
  const error = document.getElementById(errorId);
  if (!input || !error) return false;

  const rawValue = input.value;
  const hasLetters = /[a-zA-Z]/.test(rawValue);
  let cleanedValue = rawValue.replace(/[^0-9\s-\+]/g, "").slice(0, 10);
  input.value = cleanedValue;

  if (cleanedValue === "") {
    error.classList.remove("visible");
    input.classList.remove("invalid");
    error.textContent = "";
    return false;
  }

  const pattern = /^\+?[0-9\s-]{7,13}$/;
  const isValid = !hasLetters && pattern.test(cleanedValue);

  input.classList.toggle("invalid", !isValid);
  error.textContent = isValid ? "" : "Invalid phone number";
  error.classList.toggle("visible", !isValid);

  return isValid;
}


/**
 * Validates name, email, and phone inputs.
 * @param {string} name - Contact name.
 * @param {string} email - Contact email.
 * @param {string} phone - Contact phone number.
 * @param {string} phoneId - ID of phone input.
 * @param {string} phoneErrorId - ID of phone error element.
 * @param {string} emailId - ID of email input.
 * @param {string} emailErrorId - ID of email error element.
 * @returns {boolean} - True if all inputs are valid.
 */
function isValidContactInput(
  name,
  email,
  phone,
  phoneId = "new_contact_phone",
  phoneErrorId = "phone-error",
  emailId = "new_contact_email",
  emailErrorId = "email-error"
) {
  return (
    name &&
    email &&
    phone &&
    isPhoneValid(phoneId, phoneErrorId) &&
    isEmailValid(emailId, emailErrorId)
  );
}


/**
 * Checks if edit form data is valid.
 * @param {string} name - Name input.
 * @param {string} email - Email input.
 * @param {string} phone - Phone input.
 * @returns {boolean} - True if valid.
 */
function isEditFormValid(name, email, phone) {
  return isValidContactInput(
    name,
    email,
    phone,
    "edit_contact_phone",
    "edit-phone-error",
    "edit_contact_email",
    "edit-email-error"
  );
}