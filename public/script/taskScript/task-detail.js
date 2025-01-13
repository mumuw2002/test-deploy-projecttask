// Task status update
// Task status update
document.querySelectorAll('.taskStatuses .dropdown-item').forEach(item => {
    item.addEventListener('click', async function (e) {
        e.preventDefault();
        const selectedStatus = this.getAttribute('data-status');
        const taskId = document.getElementById('taskId').value;

        // Update the displayed status in the UI
        document.querySelector('.taskStatuses .nav-link').textContent = selectedStatus;

        try {
            const response = await fetch('/updateTask', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    taskId, 
                    taskStatuses: selectedStatus,
                    // Ensure other fields are sent if needed, like taskPriority or taskDetail
                }),
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            window.location.reload(); // Reload the page to reflect changes
        } catch (error) {
            console.error('Error updating task status:', error);
        }
    });
});


document.getElementById('nextStatus').addEventListener('click', async function () {
    const currentStatus = document.querySelector('.taskStatuses .nav-link').textContent.trim();
    const taskId = document.getElementById('taskId').value;
    const statusOrder = ['กำลังทำ', 'เสร็จสิ้น', 'แก้ไข'];
    const currentIndex = statusOrder.indexOf(currentStatus);
    const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length];

    document.querySelector('.taskStatuses .nav-link').textContent = nextStatus;

    try {
        const response = await fetch('/updateTask', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ taskId, taskStatuses: nextStatus }),
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        window.location.reload(); // Reload the page
    } catch (error) {
        console.error('Error updating task status:', error);
    }
});

// Task priority update
document.querySelectorAll('.taskPriority .dropdown-item').forEach(item => {
    item.addEventListener('click', async function (e) {
        e.preventDefault();
        const selectedPriority = this.getAttribute('data-priority');
        const taskId = document.getElementById('taskId').value;

        // Update visible text and hidden input value
        document.querySelector('.taskPriority .nav-link').textContent = selectedPriority;
        document.getElementById('taskPriority').value = selectedPriority;

        try {
            const response = await fetch('/updateTask', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ taskId, taskPriority: selectedPriority }),
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            window.location.reload(); // Auto-refresh the page on success
        } catch (error) {
            console.error('Error updating task priority:', error);
        }
    });
});

// Close button event
document.getElementById('close_btn').addEventListener('click', function () {
    const urlParams = new URLSearchParams(window.location.search);
    const spacesId = urlParams.get('spacesId');
    window.location.href = `/space/item/${spacesId}/task_list`;
});


/// Due Date
// Function to convert date to Thai format
function formatDateToThai(date) {
    const thaiMonths = [
        'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
        'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    const day = date.getDate();
    const month = thaiMonths[date.getMonth()];
    const year = date.getFullYear() + 543; // Convert to Buddhist year

    return `${day} ${month} ${year}`;
}

// Initialize Flatpickr when clicking on the dueDateText
document.getElementById('dueDateText').addEventListener('click', function () {
    const dueDateInput = document.getElementById('dueDateInput');

    // Initialize Flatpickr on the hidden input
    flatpickr(dueDateInput, {
        locale: "th", 
        dateFormat: "Y-m-d", 
        minDate: "today", // Prevent selection of dates before today
        onChange: function(selectedDates, dateStr) {
            const selectedDate = new Date(dateStr);
            document.getElementById('dueDateText').innerText = formatDateToThai(selectedDate);
            dueDateInput.value = dateStr; // Update the hidden input value
            updateDueDate(dateStr); // Send the new due date to the server
        }
    });

    dueDateInput._flatpickr.open(); // Open the date picker
});

// Function to send updated due date to server and log activity
async function updateDueDate(dueDateValue) {
    const taskId = document.getElementById('taskId').value;
    const selectedDate = new Date(dueDateValue);
    const currentDate = new Date();

    // Remove time part from both dates for accurate comparison
    selectedDate.setHours(0, 0, 0, 0);
    currentDate.setHours(0, 0, 0, 0);

    // Check if the selected date is tomorrow
    const isTomorrow = selectedDate.getTime() === new Date(currentDate.getTime() + 86400000).getTime();
    let logMessage = '';

    if (isTomorrow) {
        logMessage = 'วันครบกำหนดของงานถูกเปลี่ยนเป็นวันพรุ่งนี้';
    } else {
        // Format the due date to Thai format for the activity log
        const formattedDueDate = formatDateToThai(selectedDate);
        logMessage = `วันครบกำหนดของงานถูกเปลี่ยนเป็น ${formattedDueDate}`;
    }

    try {
        const response = await fetch('/updateDueDate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ taskId, dueDate: dueDateValue, logMessage }),
        });

        if (!response.ok) {
            throw new Error('Failed to update due date');
        }

        // Auto-refresh the page on success
        window.location.reload();  
    } catch (error) {
        console.error(error);
        alert('Error updating due date. Please try again.');
    }
}

// Handle form submission (for other fields like taskName, taskDetail)
document.getElementById('updateTaskForm').addEventListener('submit', async function (event) {
    event.preventDefault(); 

    const formData = new FormData(event.target);
    
    try {
        const response = await fetch('/updateTask', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error('Failed to update task');
        }

        window.location.reload();  
    } catch (error) {
        console.error('Error updating task:', error);
    }
});


/// Due Time
// Function to format time to 24-hour format
function formatTimeTo24Hour(time) {
    const hours = time.getHours().toString().padStart(2, '0');
    const minutes = time.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

// Function to send updated due time to server and log activity
async function updateDueTime(dueTimeValue) {
    const taskId = document.getElementById('taskId').value;
    const selectedTime = new Date(`1970-01-01T${dueTimeValue}:00Z`); // Parse time value

    let logMessage = '';
    
    if (dueTimeValue) {
        // Format the time for the log
        const formattedTime = formatTimeTo24Hour(selectedTime);
        logMessage = `เวลาครบกำหนดของงานถูกเปลี่ยนเป็น ${formattedTime}`;
    } else {
        logMessage = 'งานนี้ไม่มีเวลาครบกำหนด (ตลอดทั้งวัน)';
    }

    try {
        const response = await fetch('/updateDueTime', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ taskId, dueTime: dueTimeValue, logMessage }),
        });

        if (!response.ok) {
            throw new Error('Failed to update due time');
        }

        // Auto-refresh the page on success
        window.location.reload();  
    } catch (error) {
        console.error(error);
        alert('Error updating due time. Please try again.');
    }
}

document.getElementById('dueTimeSelect').addEventListener('change', function() {
    const dueTimeForm = document.getElementById('updateDueTimeForm');

    fetch(dueTimeForm.action, {
        method: dueTimeForm.method,
        body: new URLSearchParams(new FormData(dueTimeForm)),
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
    })
    .then(response => response.json())  // Handle the JSON response from the backend
    .then(data => {
        if (data.success) {
            // If the request is successful, reload the page
            window.location.reload();
        }
    })
    .catch(error => console.error('Error:', error));
});