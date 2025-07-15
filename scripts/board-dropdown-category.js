/**
 * Toggles visibility of the category dropdown.
 * @param {Event} event - The click event.
 */
function toggleCategoryDropdown(event) {
    event.stopPropagation();
    let toggle = document.getElementById("category-toggle");
    let content = document.getElementById("category-content");
    toggle.classList.toggle("open");
    content.classList.toggle("visible");
    if (content.innerHTML.trim() === "") renderCategoryOptions();
}

/**
 * Renders all available category options in the category dropdown.
 */
function renderCategoryOptions() {
    let content = document.getElementById("category-content");
    clearCategoryContent(content);
    let categories = getCategoryList();
    categories.forEach(category => {
        let item = createCategoryDropdownItem(category, content);
        content.appendChild(item);
    });
}

/**
 * Creates a dropdown item for a category and click handler.
 * @param {string} category - The category name.
 * @param {HTMLElement} content - The dropdown content element.
 * @returns {HTMLElement}
 */
function createCategoryDropdownItem(category, content) {
    let item = document.createElement("div");
    item.className = "dropdown-item category-item";
    item.innerHTML = `<span class="category-name">${category}</span>`;
    item.onclick = () => {
        handleCategoryClick(category, content);
    };
    return item;
}

/**
 * Handles click on a category dropdown item.
 * @param {string} category - The category name.
 * @param {HTMLElement} content - The dropdown content element.
 */
function handleCategoryClick(category, content) {
    selectCategory(category);
    content.classList.remove("visible");
    document.getElementById("category-toggle").classList.remove("open");
    updateSubmitState();
}

/**
 * Marks a category as selected and updates the UI.
 * @param {string} category - The selected category.
 */
function selectCategory(category) {
    selectedCategory = category;
    let placeholder = document.querySelector("#category-toggle span");
    if (placeholder) placeholder.textContent = category;
}

/**
 * Sets up event listeners for the category dropdown.
 */
function setupCategoryListeners() {
    let categoryToggle = document.getElementById("category-toggle");
    if (categoryToggle) {
        categoryToggle.addEventListener("click", toggleCategoryDropdown);
    }
}