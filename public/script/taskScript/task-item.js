const taskName = document.getElementById('taskName-text');
const taskNameInput = document.getElementById('taskName');
taskName.addEventListener('click', function () {
    taskName.style.display = 'none';
    taskNameInput.style.display = 'block';
    const textLength = taskNameInput.value.length;
    taskNameInput.value = taskName.textContent.trim();
    taskNameInput.focus();
    // Set the cursor position to the end of the word
    taskNameInput.setSelectionRange(textLength, textLength);
});

// Get form and select elements
const updateTaskForm = document.getElementById('updateTaskForm');
const taskTypeSelect = document.getElementById('taskType');
const taskStatusSelect = document.getElementById('taskStatuses');
const taskPrioritySelect = document.getElementById('taskPriority');

// Event listener for task type select change
taskTypeSelect.addEventListener('change', function () {
    updateTaskForm.submit(); // Submit the form when task type changes
});

// Event listener for task status select change
taskStatusSelect.addEventListener('change', function () {
    updateTaskForm.submit(); // Submit the form when task status changes
});

// Event listener for task priority select change
taskPrioritySelect.addEventListener('change', function () {
    updateTaskForm.submit(); // Submit the form when task priority changes
});