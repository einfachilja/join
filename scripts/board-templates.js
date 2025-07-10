function getAddTaskOverlay() {
  return `          <div class="board-add-task-modal">
            <div class="board-add-task-header">
            <h1 class="h1-add-task">Add Task</h1>
            <img class="board-close-icon" src="./assets/icons/board/board-close.svg" onclick="closeAddTaskOverlay()">
             </div>
            <form id="task-form" onsubmit="return false;">
              <div class="form-cols">
                <!-- linke Spalte -->
                <div class="col-left">
                  <label for="title"
                    >Title <span class="red_star">*</span></label
                  >
                  <input
                    id="title"
                    type="text"
                    placeholder="Enter a title"
                    onkeyup="updateSubmitState()"
                  />
                  <div class="error-message" id="error-title">
                    This field is required
                  </div>

                  <label for="description">Description</label>
                  <textarea
                    id="description"
                    placeholder="Enter a description"
                  ></textarea>

                  <label for="dueDate"
                    >Due Date <span class="red_star">*</span></label
                  >
                  <div class="date-input-wrapper">
                    <input
                      id="dueDate"
                      class="overlay-card-date-input"
                      type="date"
                      placeholder="dd/mm/yyyy"
                    />
                    
                  </div>
                  <div class="error-message" id="error-dueDate">
                    This field is required
                  </div>
                </div>

                <!-- mittlerer Separator -->
                <div class="add_task_mid_box"></div>

                <!-- rechte Spalte -->
                <div class="col-right">
                  <label>Priority</label>
                  <div id="buttons-prio" class="priority-buttons">
                    <button
                      type="button"
                      data-prio="urgent"
                      onclick="selectPriority('urgent')"
                    >
                      Urgent <img src="./assets/icons/add-task/add-task-urgent.svg" alt="" />
                    </button>
                    <button
                      type="button"
                      data-prio="medium"
                      class="selected"
                      onclick="selectPriority('medium')"
                    >
                      Medium <img src="./assets/icons/add-task/add-task-medium.svg" alt="" />
                    </button>
                    <button
                      type="button"
                      data-prio="low"
                      onclick="selectPriority('low')"
                    >
                      Low <img src="./assets/icons/add-task/add-task-low.svg" alt="">
                    </button>
                  </div>
                  <div class="error-message" id="error-priority">
                    This field is required
                  </div>

                  <label>Assigned to</label>
                  <div class="custom-dropdown-wrapper" id="dropdown-wrapper">
                    <div id="dropdown-toggle" tabindex="0" role="button">
                      <input
                        id="assigned-to-input"
                        type="text"
                        placeholder="Select contacts"
                        oninput="handleAssignedToInput(event)"
                        onclick="handleAssignedToClick(event)"
                      />
                      <div class="dropdown-arrow"></div>
                    </div>
                    <div id="dropdown-content" class="dropdown-content"></div>
                  </div>
                  <div id="selected-contacts" class="selected-contacts"></div>
                  <div class="error-message" id="error-assignedTo">
                    This field is required
                  </div>

                  <label>Category <span class="red_star">*</span></label>
                  <div class="custom-dropdown-wrapper" id="category-wrapper">
                    <div id="category-toggle">
                      <span id="selected-category-placeholder"
                        >Select category</span
                      >
                      <div id="category-arrow" class="dropdown-arrow"></div>
                    </div>
                    <div id="category-content"></div>
                  </div>
                  <input type="hidden" id="category" value="" />
                  <div class="error-message" id="error-category">
                    This field is required
                  </div>

                  <label>Subtasks</label>
                  <div class="subtask-input-container">
                    <div class="subtasks-container">
                      <div class="subtask-input-wrapper">
                        <div class="subtask-input-field">
                          <input
                            id="subtask-input"
                            type="text"
                            placeholder="Add new subtask"
                            onfocus="toggleSubtaskIcons()"
                            oninput="toggleSubtaskIcons()"
                            onkeydown="handleSubtaskEnter(event)"
                          />
                          <div id="subtask-icons" class="subtask-icons hidden">
                            <img
                              id="subtask-cancel"
                              src="./assets/icons/add-task/add-task-closeXSymbol.svg"
                              alt="Cancel"
                              onclick="clearSubtaskInput()"
                            />
                            <div class="divider"></div>
                            <img
                              id="subtask-confirm"
                              src="./assets/icons/add-task/add-task-check.svg"
                              alt="Confirm"
                              onclick="addSubtask()"
                            />
                          </div>
                          <img
                            id="subtask-plus"
                            class="subtask-plus"
                            src="./assets/icons/add-task/add-task-add+symbol.svg"
                            alt="Add"
                            onclick="toggleSubtaskIcons()"
                          />
                        </div>
                      </div>

                      <ul id="subtask-list" class="subtask-list"></ul>
                    </div>
                  </div>
                </div>
              </div>
              <div class="form-actions">
              <p class="legend-required">
                <span class="red_star">*</span>This field is required
              </p>
                <button id="cancel-task-btn" type="button" onclick="closeAddTaskOverlay()">Cancel</button>
                <button
                  id="submit-task-btn"
                  type="button"
                  onclick="createTask()"
                >
                  Create Task
                  <img class="add-task-icon" src="./assets/icons/add-task/add-task-check.svg" alt="">
                </button>
              </div>
            </form>
          </div>`;
}

function buildCardHTML(firebaseKey, category, categoryClass, priority, priorityIcon, assignedList, subtaskProgressHTML, title, description) {
  return `
    <div draggable="true" ondragstart="startDragging('${firebaseKey}')" ondragend="stopDragging('${firebaseKey}')">
      <div class="card${firebaseKey === lastCreatedTaskKey ? ' task-blink' : ''}" id="${firebaseKey}">
        <div class="card-header">
          <span class="card-category ${categoryClass}" ${category ? `title="${category}"` : ''}>${category}</span>
          <button class="card-header-move-arrow-btn" title="Move Task" type="button" onclick="openMoveTaskMenu('${firebaseKey}', event)">
            <img class="card-header-move-arrow" src="./assets/icons/board/board-move-arrow.svg" alt="Move Task" />
          </button>
        </div>
        <span class="card-title">${title}</span>
        <span class="card-description">${description}</span>
        ${subtaskProgressHTML}
        <div class="card-footer">
          <div class="assigned-container">
            ${generateAssignedCircles(assignedList)}
          </div>
          <div class="priority-container"><img src="${priorityIcon}" alt="${priority}"></div>
        </div>
      </div>
    </div>`;
}

function getOpenBoardCardHTML(task, categoryClass, priorityIcon, assignedHTML, subtaskHTML) {
  return `
    <div id="board_overlay_card" class="board-overlay-card" data-firebase-key="${task.firebaseKey}" onclick="onclickProtection(event)">
      <div class="board-overlay-card-header edit-mode">
        <span id="overlay_card_category" class="overlay-card-category ${categoryClass}">${task.category}</span>
        <img class="board-close-icon" src="./assets/icons/board/board-close.svg" onclick="closeBoardCard()">
      </div>
      <span id="overlay_card_title" class="overlay-card-title">${task.title}</span>
      <span id="overlay_card_description" class="overlay-card-description">${task.description}</span>
      <span class="due-date-headline" id="due_date"><span class="overlay-headline-color">Due date:</span><span>${task.dueDate}</span></span>
      <span class="priority-headline"><span class="overlay-headline-color">Priority:</span>
        <span class="priority-container">${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}<img src="${priorityIcon}" alt="${task.priority}"/></span>
      </span>
      <div class="assigned-list">
        <span class="assigned-to-headline overlay-headline-color">Assigned To:</span>
        <div class="assigned-list-area">
        ${assignedHTML}
        </div>
      </div>
      <div class="subtask-list">
        <span class="overlay-headline-color overlay-subtasks-label">Subtasks</span>
        <div>
        <ul>
        <div class="subtask-list-not-edit">
          ${subtaskHTML}
          <div>
        </ul>
      </div>
      <div id="overlay_card_footer" class="overlay-card-footer">
        <div id="delete_btn" class="delete-btn" onclick="deleteTask('${task.firebaseKey}')"><div class="delete-btn-icon"></div>Delete</div>
        <img id="seperator" src="./assets/icons/board/board-separator-icon.svg" alt="">
        <div id="edit_btn" class="edit-btn" onclick="editTask()"><div class="edit-btn-icon"></div>Edit</div>
        <div id="ok_btn" class="ok-btn d-none" onclick="saveEditTask('${task.firebaseKey}')">Ok
        <img src="./assets/icons/board/board-check.svg"></div>
      </div>
    </div>`;
}

function getPriorityButtonHTML(priorityObj, currentPriority) {
  return `
    <button 
      type="button" 
      class="priority-edit-btn${currentPriority === priorityObj.value ? ' selected' : ''}" 
      data-priority="${priorityObj.value}" 
      onclick="selectOverlayPriority('${priorityObj.value}', this)">
      ${priorityObj.label} <img src="${priorityObj.icon}" alt="${priorityObj.label}" />
    </button>
  `;
}

function getAssignedEntryHTML(name, color) {
  return `
    <div class="assigned-entry">
      <span class="assigned-circle" style="background-color: ${color};">${getInitials(name)}</span>
      <span class="assigned-name">${name}</span>
    </div>`;
}

function getSubtaskItemHTML(title, checked, id, firebaseKey, idx) {
  return `
    <div class="subtask-item">
      <input type="checkbox" id="${id}" ${checked} onchange="toggleSubtask('${firebaseKey}', ${idx})" />
      <label for="${id}">${title}</label>
    </div>`;
}

function getAssignedCircleHTML(name, color) {
  return `<span class="assigned-circle" style="background-color: ${color};">${getInitials(name)}</span>`;
}

function getSubtaskProgressHTML(completed, total, percent) {
  return `
    <div class="card-subtask-progress">
      <div class="subtask-progress-bar-bg">
        <div class="subtask-progress-bar-fill" style="width: ${percent}%;"></div>
      </div>
      <span class="subtask-progress-text">${completed}/${total} Subtasks</span>
    </div>`;
}