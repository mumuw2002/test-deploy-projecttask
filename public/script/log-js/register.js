document.querySelectorAll('.password-toggle-icon').forEach(icon => {
  icon.addEventListener('click', function() {
      const inputId = this.getAttribute('data-target');
      togglePasswordVisibility(inputId, this);
  });
});

function togglePasswordVisibility(inputId, icon) {
  const inputField = document.getElementById(inputId);
  const isPasswordVisible = inputField.type === 'text';

  // สลับระหว่าง text และ password
  inputField.type = isPasswordVisible ? 'password' : 'text';

  // สลับไอคอน
  icon.classList.toggle('fa-eye', isPasswordVisible);
  icon.classList.toggle('fa-eye-slash', !isPasswordVisible);
}
