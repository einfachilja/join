function returnToPrevPage() {
  // Check if there is a previous page in the history
  if (document.referrer && !document.referrer.includes("help.html")) {
    // Redirect to the previous page
    window.location.href = document.referrer;
  }
  // If there is no referrer, redirect to a default page
  else {
    window.location.href = "./summary.html";
  }
  return false;
}
