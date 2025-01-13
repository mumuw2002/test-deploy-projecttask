window.onload = function () {
    window.scrollTo(0, 0);
};

document.getElementById('new-task-btn').addEventListener('click', function (event) {
    event.preventDefault();
    document.getElementById('sidebar-popup').classList.toggle('show-sidebar');
    document.getElementById('overlay').classList.toggle('show-overlay');
});

document.getElementById("close-task-btn").addEventListener("click", function () {
    document.getElementById("sidebar-popup").classList.remove("show-sidebar");
    document.getElementById("sidebar-popup").classList.add("hide-sidebar");
    document.getElementById("overlay").classList.remove("show-overlay");
    document.getElementById("overlay").classList.add("hide-overlay");
});

// Function to display calendar on input click
document.getElementById('datepicker').addEventListener('click', function () {
    this.type = 'date';
    this.focus();
});

$(document).ready(function () {
    $('#datepicker').datepicker({
        dateFormat: 'dd/mm/yy', // Set the date format
        changeMonth: true, // Enable month selection
        changeYear: true // Enable year selection
    });
});

function clearFields() {
    document.getElementById("taskName").value = "";
    document.getElementById("datepicker").value = "";
    document.getElementById("taskTag").value = "";
    document.getElementById("detail").value = "";
}