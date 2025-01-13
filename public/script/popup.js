document.addEventListener("DOMContentLoaded", function () {
    const newTaskBtn = document.getElementById('new-task-btn');
    const closeTaskBtn = document.getElementById('close-task-btn');
    const subNameInput = document.getElementById("SubName");

    // Handle new task button click
    if (newTaskBtn) {
        newTaskBtn.addEventListener('click', function (event) {
            event.preventDefault();
            const sidebarPopup = document.getElementById('sidebar-popup');
            const overlay = document.getElementById('overlay');

            if (sidebarPopup && overlay) {
                sidebarPopup.classList.toggle('show-sidebar');
                overlay.classList.toggle('show-overlay');
            }
        });
    }

    // Handle close task button click
    if (closeTaskBtn) {
        closeTaskBtn.addEventListener("click", function () {
            const sidebarPopup = document.getElementById("sidebar-popup");
            const overlay = document.getElementById("overlay");

            if (sidebarPopup && overlay) {
                sidebarPopup.classList.remove("show-sidebar");
                sidebarPopup.classList.add("hide-sidebar");
                overlay.classList.remove("show-overlay");
                overlay.classList.add("hide-overlay");
            }
        });
    }

    // Input validation and focus
    if (subNameInput) {
        subNameInput.addEventListener("focus", function () {
            const notiAlert = document.getElementById("notiAlert");
            if (notiAlert) {
                notiAlert.style.display = "none";
            }
        });
    }

    // Input validation and clear fields functions
    window.validateForm = function () {
        const subName = subNameInput ? subNameInput.value : "";
        const notiAlert = document.getElementById("notiAlert");

        if (subName.trim() === "" || !isAlphanumeric(subName.charAt(0))) {
            if (notiAlert) {
                notiAlert.style.display = "block";
            }
            return false;
        }
        return true;
    };

    window.clearFields = function () {
        if (subNameInput) {
            subNameInput.value = "";
        }
        const subDescriptionInput = document.getElementById("SubDescription");
        if (subDescriptionInput) {
            subDescriptionInput.value = "";
        }
        const notiSubName = document.getElementById("notiSubName");
        if (notiSubName) {
            notiSubName.style.display = "none";
        }
    };

    function isAlphanumeric(char) {
        return /^[a-zA-Z0-9ก-๙]+$/.test(char);
    }
});

// add-popup
document.addEventListener("DOMContentLoaded", function () {
    const spaceNameInput = document.getElementById("SpaceName");
    const spaceDescriptionInput = document.getElementById("SpaceDescription");
    const notiAlert = document.getElementById("notiAlert");
    const descAlert = document.getElementById("descAlert");

    // Hide notifications initially
    notiAlert.style.display = "none";
    descAlert.style.display = "none";

    // Validation function
    window.validateForm = function () {
        let isValid = true;

        // Validate SpaceName - no special characters allowed
        if (!validateSpaceName(spaceNameInput.value)) {
            notiAlert.style.display = "block";
            isValid = false;
        } else {
            notiAlert.style.display = "none";
        }

        if (spaceDescriptionInput.value.trim() !== "" && spaceDescriptionInput.value.trim().length < 10) {
            descAlert.style.display = "block";
            isValid = false;
        } else {
            descAlert.style.display = "none";
        }

        return isValid;
    };
    function validateSpaceName(spaceName) {
        return /^[a-zA-Z0-9ก-๙\s]+$/.test(spaceName.trim());
    }
});

function clearFields() {
    document.getElementById("subjectForm").reset();
    document.getElementById("notiAlert").style.display = "none";
    document.getElementById("descAlert").style.display = "none";
}