const newTaskBtn = document.getElementById('new-task-btn');
const sidebarPopup = document.getElementById('sidebar-popup');
const closeTaskBtn = document.getElementById('close-task-btn');
const overlay = document.getElementById('overlay');

newTaskBtn.addEventListener('click', (event) => {
    event.preventDefault();
    sidebarPopup.classList.add('show-sidebar');
    overlay.classList.add('show-overlay');
});

closeTaskBtn.addEventListener('click', () => {
    sidebarPopup.classList.remove('show-sidebar');
    overlay.classList.remove('show-overlay');
});

overlay.addEventListener('click', () => {
    sidebarPopup.classList.remove('show-sidebar');
    overlay.classList.remove('show-overlay');
});

function clearFields() {
    document.querySelector('.add-form').reset();
}

function validateForm() {
    var taskName = document.getElementById("taskName").value;

    if (taskName.trim() === "" || !isAlphanumeric(taskName.charAt(0))) {
        document.getElementById("notiAlert").style.display = "block";
        return false;
    }
    return true;
}
function isAlphanumeric(char) {
    return /^[a-zA-Z0-9ก-๙]+$/.test(char);
}
document.getElementById("taskName").addEventListener("focus", function () {
    document.getElementById("notiAlert").style.display = "none";
});
document.addEventListener('DOMContentLoaded', function () {
    const dueDateInput = document.getElementById('dueDate');

    // Function to format the date to "day month" in Thai
    function formatDateToThai(date) {
        const options = { day: 'numeric', month: 'long' };
        return new Date(date).toLocaleDateString('th-TH', options);
    }

    // Event listener for when the user selects a date
    dueDateInput.addEventListener('change', function () {
        const selectedDate = this.value;
        if (selectedDate) {
            // Update the placeholder with the formatted date
            this.placeholder = formatDateToThai(selectedDate);
        }
    });
});

async function confirmDeleteTask(taskId, spaceId) {
    try {
      // Fetch the number of subtasks for the task
      const response = await fetch(`/task/getSubtaskCount/${spaceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskIds: taskId })
      });
  
      const data = await response.json();
      const subtaskCount = data.subtaskCount;
  
      // Show confirmation alert with subtask count
      const confirmMessage = `คุณต้องการลบงานนี้หรือไม่? งานนี้มี ${subtaskCount} งานย่อยที่จะถูกลบด้วย`;
  
      if (confirm(confirmMessage)) {
        // Proceed with deletion if confirmed
        const deleteResponse = await fetch(`/task/deleteTasks/${spaceId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ taskIds: taskId })
        });
  
        if (deleteResponse.ok) {
          alert('งานและงานย่อยถูกลบเรียบร้อยแล้ว');
          location.reload(); // Reload the page to reflect changes
        } else {
          alert('ไม่สามารถลบงานได้');
        }
      }
    } catch (error) {
      console.error('Error:', error);
      alert('เกิดข้อผิดพลาด');
    }
  }
  