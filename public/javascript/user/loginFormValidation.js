// Validation for Login 
function validateEmail() {
  const email = document.getElementById("email").value;
  const emailError = document.getElementById("email-error");

  const startsWithNumber = /^[0-9]/.test(email);

  if (startsWithNumber) {
    emailError.textContent = "Email ID cannot start with a number.";
    return; 
  }

  const regex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;

  if (!regex.test(email)) {
    emailError.textContent = "Enter a valid email address.";
  } else {
    emailError.textContent = "";
  }
}

function validatePassword() {
  const password = document.getElementById("password").value;
  const passwordError = document.getElementById("password-error");
  const regex =
    /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,16}$/;

  if (!regex.test(password)) {
    passwordError.textContent =
      "Password must be 8-16 characters long, and include a number, uppercase, lowercase, and special character.";
  } else {
    passwordError.textContent = "";
  }
}

function validateForm() {
  validateEmail();
  validatePassword();

  const errors = document.querySelectorAll(".error-text");
  for (let error of errors) {
    if (error.textContent !== "") return false;
  }
  return true;
}

document.getElementById("email").addEventListener("input", validateEmail);
document.getElementById("password").addEventListener("input", validatePassword);

// Toggle password visibility
function togglePasswordVisibility(id) {
  const passwordField = document.getElementById(id);
  if (passwordField.type === "password") {
    passwordField.type = "text";
  } else {
    passwordField.type = "password";
  }
}




