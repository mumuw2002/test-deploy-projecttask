const tableContainer = document.querySelector('.table-responsive');
const header = document.querySelector('.table-head');

tableContainer.addEventListener('scroll', function () {
    if (tableContainer.scrollTop > 0) {
        header.classList.add('shadow');
    } else {
        header.classList.remove('shadow');
    }
});

document.addEventListener('click', function (event) {
    var input = document.getElementById('taskName');
    var toggleButton = document.getElementById('toggleInput');
    if (event.target === toggleButton) {
        if (input.style.display === 'none') {
            input.value = '';
            input.style.display = 'inline-block';
            setTimeout(function () {
                input.style.opacity = '1';
                input.focus();
            }, 10);
            toggleButton.classList.add('clicked');
        } else {
            input.style.opacity = '0';
            setTimeout(function () {
                input.style.display = 'none';
            }, 300);
            toggleButton.classList.remove('clicked');
        }
    } else if (input.style.display === 'inline-block' && !input.contains(event.target) && event.target !== input) {
        input.style.opacity = '0';
        setTimeout(function () {
            input.style.display = 'none';
        }, 300);
        toggleButton.classList.remove('clicked');
    }
});

document.addEventListener('DOMContentLoaded', function () {
    var selectionInfo = document.getElementById('selectionInfo');
    var checkboxes = document.querySelectorAll('.checkbox');
    selectionInfo.style.bottom = '-100px';

    function updateSelectedCount() {
        var selectedCount = 0;
        checkboxes.forEach(function (checkbox) {
            if (checkbox.checked) {
                selectedCount++;
            }
        });

        if (selectedCount > 0) {
            selectionInfo.style.bottom = '35px';
        } else {
            selectionInfo.style.bottom = '-100px';
        }

        document.getElementById('selectedCount').textContent = selectedCount;
    }

    function toggleAllCheckboxes() {
        var checkAllCheckbox = document.getElementById('check-all');
        checkboxes.forEach(function (checkbox) {
            checkbox.checked = checkAllCheckbox.checked;
        });
        updateSelectedCount();
    }

    function deleteSelected() {
        var selectedTaskIds = [];
        checkboxes.forEach(function (checkbox) {
            if (checkbox.checked) {
                selectedTaskIds.push(checkbox.getAttribute('data-task-id'));
            }
        });

        if (selectedTaskIds.length > 0) {
            fetch('/deleteSelectedTasks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ taskIds: selectedTaskIds })
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Failed to delete tasks');
                    }
                    return response.json();
                })
                .then(data => {
                    console.log(data.message);
                    // Optionally, update UI or refresh task list
                    checkboxes.forEach(function (checkbox) {
                        checkbox.checked = false;
                    });
                    updateSelectedCount();
                })
                .catch(error => {
                    console.error('Error deleting tasks:', error);
                    // Handle error
                });
        }
    }

    var checkAllCheckbox = document.getElementById('check-all');
    checkAllCheckbox.addEventListener('click', toggleAllCheckboxes);

    checkboxes.forEach(function (checkbox) {
        checkbox.addEventListener('change', updateSelectedCount);
    });

    var deleteButton = document.querySelector('#selectionInfo button');
    deleteButton.addEventListener('click', deleteSelected);

    var closeButton = document.querySelector('#selectionInfo .bx-x');
    closeButton.addEventListener('click', function () {
        selectionInfo.style.bottom = '-100px';
        checkboxes.forEach(function (checkbox) {
            checkbox.checked = false;
        });

        checkAllCheckbox.checked = false;
    });

    var toggleSelectionInfo = document.getElementById('toggleSelectionInfo');
    toggleSelectionInfo.addEventListener('click', function () {
        checkboxes.forEach(function (checkbox) {
            checkbox.checked = false;
        });
        updateSelectedCount();
    });
});

document.getElementById('deleteTasksForm').addEventListener('submit', function (e) {
    // Get the selected tasks
    var selectedTasks = document.querySelectorAll('input[type="checkbox"]:checked');

    // Get the task IDs
    var taskIds = Array.from(selectedTasks).map(function (task) {
        return task.getAttribute('data-task-id');
    });

    // Set the value of the "taskIds" input field
    document.getElementById('taskIds').value = taskIds.join(',');

    // If no tasks are selected, prevent form submission
    if (taskIds.length === 0) {
        e.preventDefault();
        alert('Please select at least one task to delete.');
    }
});
