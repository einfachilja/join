/**
 * Utility functions used across the Add Task module.
 */
export const Utils = {
  /**
   * Format a date string from 'YYYY-MM-DD' to 'DD/MM/YYYY'.
   * @param {string} dateString - Date string to format
   * @returns {string} Formatted date string
   * @function
   */
  formatDateToDDMMYYYY(dateString) {
    if (!dateString) return "";
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) return dateString;
    const [year, month, day] = dateString.split("-");
    if (year && month && day) return `${day}/${month}/${year}`;
    return dateString;
  },
  /**
   * Stop event propagation for the given event.
   * @param {Event} [e=window.event] - Event to stop
   * @function
   */
  stopPropagation(e = window.event) {
    if (e && typeof e.stopPropagation === "function") e.stopPropagation();
  },
};
