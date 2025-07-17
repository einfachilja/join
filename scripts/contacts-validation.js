/**
 * Validates a generic input field for required, email, or phone number formats.
 * @param {HTMLInputElement} input - The input element to validate.
 * @param {HTMLElement} error - The error display element.
 * @param {string} fieldName - The name of the field (used in error messages).
 * @param {boolean} isEmail - Whether the field should be validated as an email.
 * @param {boolean} isPhone - Whether the field should be validated as a phone number.
 * @returns {boolean} True if the input is valid, false otherwise.
 */
function validateField(input, error, fieldName, isEmail, isPhone) {
  const value = input.value.trim();
  const errorMsg = getValidationMessage(value, fieldName, isEmail, isPhone);

  if (errorMsg) {
    showError(input, error, errorMsg);
    return false;
  } else {
    clearError(input, error);
    return true;
  }
}


/**
 * Generates an appropriate error message for the input based on validation rules.
 * @param {string} value - The trimmed input value.
 * @param {string} fieldName - The name of the field (used in the message).
 * @param {boolean} isEmail - Whether to validate as an email address.
 * @param {boolean} isPhone - Whether to validate as a phone number.
 * @returns {string} The error message or an empty string if valid.
 */
function getValidationMessage(value, fieldName, isEmail, isPhone) {
  if (!value) {
    return `${fieldName} cannot be empty`;
  }
  if (isEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return "Invalid email address";
  }
  if (isPhone && !/^\+?[0-9\s-]{7,10}$/.test(value)) {
    return "Invalid phone number";
  }
  return "";
}


/**
 * Displays an error message and marks the input as invalid.
 * @param {HTMLInputElement} input - The input element to mark.
 * @param {HTMLElement} error - The element to show the error message in.
 * @param {string} message - The message to display.
 */
function showError(input, error, message) {
  error.textContent = message;
  error.classList.add("visible");
  input.classList.add("invalid");
}


/**
 * Clears any displayed error and removes invalid styles.
 * @param {HTMLInputElement} input - The input element to update.
 * @param {HTMLElement} error - The element showing the error message.
 */
function clearError(input, error) {
  error.textContent = "";
  error.classList.remove("visible");
  input.classList.remove("invalid");
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
    "Name",
    false,
    false
  );
  const validEmail = validateField(
    document.getElementById(prefix + "email"),
    document.getElementById((isEdit ? "edit-" : "") + "email-error"),
    "Email",
    true,
    false
  );
  const validPhone = validateField(
    document.getElementById(prefix + "phone"),
    document.getElementById((isEdit ? "edit-" : "") + "phone-error"),
    "Phone",
    false,
    true
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
 * Validates a phone number input field and displays an error if invalid.
 * @param {string} [inputId="new_contact_phone"] - The ID of the input element.
 * @param {string} [errorId="phone-error"] - The ID of the error message element.
 * @returns {boolean} True if the phone number is valid, false otherwise.
 */
function isPhoneValid(inputId = "new_contact_phone", errorId = "phone-error") {
  const input = document.getElementById(inputId);
  const error = document.getElementById(errorId);
  if (!input || !error) return false;

  const rawValue = input.value;
  const hasLetters = /[a-zA-Z]/.test(rawValue);
  const cleanedValue = cleanPhone(rawValue);
  input.value = cleanedValue;

  if (!cleanedValue) return clearError(input, error);

  const isValid = !hasLetters && isPhoneFormatValid(cleanedValue);
  setValidationState(input, error, isValid);

  return isValid;
}


/**
 * Removes unwanted characters from the phone number and trims it to a maximum of 10 characters.
 * @param {string} value - The raw input string.
 * @returns {string} The cleaned phone number string.
 */
function cleanPhone(value) {
  return value.replace(/[^0-9\s-\+]/g, "").slice(0, 10);
}


/**
 * Validates the cleaned phone number format.
 * @param {string} value - The cleaned phone number.
 * @returns {boolean} True if the phone number format is valid, false otherwise.
 */
function isPhoneFormatValid(value) {
  return /^\+?[0-9\s-]{7,13}$/.test(value);
}


/**
 * Clears the error state and message from the input and error elements.
 * @param {HTMLInputElement} input - The phone number input element.
 * @param {HTMLElement} error - The error message element.
 * @returns {boolean} Always returns false.
 */
function clearError(input, error) {
  error.classList.remove("visible");
  input.classList.remove("invalid");
  error.textContent = "";
  return false;
}


/**
 * Sets the input and error elements based on the validity of the input.
 * @param {HTMLInputElement} input - The phone number input element.
 * @param {HTMLElement} error - The error message element.
 * @param {boolean} isValid - Whether the phone number is valid.
 */
function setValidationState(input, error, isValid) {
  input.classList.toggle("invalid", !isValid);
  error.textContent = isValid ? "" : "Invalid phone number";
  error.classList.toggle("visible", !isValid);
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