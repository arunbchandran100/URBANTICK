// Validation functions
function validateFullName() {
  const fullName = document.getElementById("fullName").value;
  const fullNameError = document.getElementById("fullName-error");
  const regex = /^[A-Za-z\s]+$/;

  if (!regex.test(fullName)) {
    fullNameError.textContent = "Only alphabets are allowed.";
    return false;
  } else {
    fullNameError.textContent = "";
    return true;
    }
}

function validateEmail() {
  const email = document.getElementById("email").value;
  const emailError = document.getElementById("email-error");

  // Check if email starts with a number
  const startsWithNumber = /^[0-9]/.test(email);

  if (startsWithNumber) {
    emailError.textContent = "Email ID cannot start with a number.";
    return false;
  }

  const regex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;

  if (!regex.test(email)) {
    emailError.textContent = "Enter a valid email address.";
    return false;
  } else {
    emailError.textContent = "";
    return true;
  }
}

function validatePassword() {
  const password = document.getElementById("password").value;
  const passwordError = document.getElementById("password-error");
  const regex =
    /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,16}$/;

  if (!regex.test(password)) {
    passwordError.textContent =
      "Password must be 8-16 characters long, and include a number, uppercase, lowercase, and special character.";
    return false;
  } else {
    passwordError.textContent = "";
    return true;
  }
}

function validateConfirmPassword() {
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;
  const confirmPasswordError = document.getElementById("confirmPassword-error");

  if (confirmPassword !== password) {
    confirmPasswordError.textContent = "Passwords do not match.";
    return false;
  } else {
    confirmPasswordError.textContent = "";
    return true;
  }
}

function validateForm() {
  const isFullNameValid = validateFullName();
  const isEmailValid = validateEmail();
  const isPasswordValid = validatePassword();
  const isConfirmPasswordValid = validateConfirmPassword();

  return (
    isFullNameValid && isEmailValid && isPasswordValid && isConfirmPasswordValid
  );
}

// Real-time validation
document.getElementById("fullName").addEventListener("input", validateFullName);
document.getElementById("email").addEventListener("input", validateEmail);
document.getElementById("password").addEventListener("input", validatePassword);
document
  .getElementById("confirmPassword")
  .addEventListener("input", validateConfirmPassword);

// Toggle password visibility
function togglePasswordVisibility(id) {
  const passwordField = document.getElementById(id);
  if (passwordField.type === "password") {
    passwordField.type = "text";
  } else {
    passwordField.type = "password";
  }
}

// Handle signup
async function handleSignup(event) {
  event.preventDefault();

  const isFormValid = validateForm();
  if (!isFormValid) {
    return;
  }

  const fullName = document.getElementById("fullName").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const response = await fetch("/user/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fullName, email, password }),
    });

    const data = await response.json();
    if (response.status === 200) {
      alert(data.message);
      document.getElementById("otp-section").style.display = "block"; // Show OTP input section
    } else {
      document.getElementById("email-error").textContent = data.message;
    }
  } catch (error) {
    document.getElementById("email-error").textContent =
      "An error occurred during signup. Please try again.";
  }
}


async function handleOTPVerification(event) {
  event.preventDefault();

  const email = document.getElementById("email").value;
  const otp = document.getElementById("otp").value;
  const fullName = document.getElementById("fullName").value;
  const password = document.getElementById("password").value;

  try {
    const response = await fetch("/user/verify-otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, otp, fullName, password }),
    });

    const data = await response.json();
    if (response.status === 201) {
      alert(data.message);
      window.location.href = "/user/login";
    } else {
      document.getElementById("otp-error").textContent = data.message;
    }
  } catch (error) {
    document.getElementById("otp-error").textContent =
      "An error occurred during OTP verification. Please try again.";
  }
}








