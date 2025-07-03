/**
 * Redirects the user back to the previous page if it is not the help page.
 * If the previous page is the help page or not available, redirects to the summary page instead.
 * 
 * @returns {boolean} Always returns false to prevent default link behavior if used in an event.
 */
function returnToPrevPage() {
  if (document.referrer && !document.referrer.includes("help.html")) {
    window.location.href = document.referrer;
  } else {
    window.location.href = "./summary.html";
  }
  return false;
}
