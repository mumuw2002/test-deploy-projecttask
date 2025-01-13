document.addEventListener('DOMContentLoaded', function() {
    var taskNameInput = document.getElementById("taskName");

    // Add an event listener to the input field to check as the user types
    taskNameInput.addEventListener('input', async function() {
        var taskName = taskNameInput.value.trim();

        // Clear previous alerts
        document.getElementById("notiAlert").style.display = "none";
        document.getElementById("notiAlertName").style.display = "none";
        
        // Check if the task name is empty or contains non-alphanumeric characters
        if (taskName === "" || !isAlphanumeric(taskName)) {
            document.getElementById("notiAlert").style.display = "block"; // Show the general alert
            return;
        }

        // Check if the task name is duplicated asynchronously
        var duplicated = await isDuplicated(taskName);
        if (duplicated) {
            document.getElementById("notiAlertName").style.display = "block"; // Show the duplication alert
        }
    });
});

// Helper function to check if a string is alphanumeric (allows Thai characters)
function isAlphanumeric(text) {
    return /^[a-zA-Z0-9ก-๙]+$/.test(text);
}

function isDuplicated(taskName) {
    return new Promise((resolve, reject) => {
        fetch('/checkTaskName', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ taskName: taskName })
        })
        .then(response => response.json())
        .then(data => {
            resolve(data.duplicated); // `data.duplicated` should be true or false
        })
        .catch(error => {
            console.error('Error checking task name duplication:', error);
            resolve(false); // Assume not duplicated if there's an error
        });
    });
}