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
    /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,16}$/;

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

let timer; 

let otpTimer;
let otpTimeout;


function disableFields() {
  document.getElementById("fullName").disabled = true;
  document.getElementById("email").disabled = true;
  document.getElementById("password").disabled = true;
  document.getElementById("confirmPassword").disabled = true;
}

function enableFields() {
  document.getElementById("fullName").disabled = false;
  document.getElementById("email").disabled = false;
  document.getElementById("password").disabled = false;
  document.getElementById("confirmPassword").disabled = false;
}


// -------------------------------------------------------

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
      swal("", data.message, "success");

      document.getElementById("google-auth-div").style.display = "none";
      document.getElementById("otp-section").style.display = "block"; // Show OTP input section
      document.getElementById("fullName").disabled = true;
      document.getElementById("email").disabled = true;
      document.getElementById("password").disabled = true;

      console.log("starting timer at handleSignup");
      startTimer(30);
    } else {
      document.getElementById("email-error").textContent = data.message;
    }
  } catch (error) {
    console.log('error')
  }
}

async function handleResendOTP(event) {
  event.preventDefault();

  const email = document.getElementById("email").value;

  try {
    const response = await fetch("/user/resend-otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();
    if (response.status === 200) {
      swal("", data.message, "success");

      startTimer(30); 
    } else {
      document.getElementById("otp-error").textContent = data.message;
    }
  } catch (error) {
    document.getElementById("otp-error").textContent =
      "An error occurred while resending OTP. Please try again.";
  }
}



function startTimer(duration) {
  let timeRemaining = duration;
  const timerDisplay = document.getElementById("timer");
  const resendButton = document.getElementById("resend-otp");

  resendButton.style.display = 'none';
  console.log("timer started");
  timer = setInterval(() => {
    if (timeRemaining <= 0) {
      clearInterval(timer);
      timerDisplay.textContent = "You can now resend the OTP.";
      
      resendButton.style.display = 'block';
    } else {
      timeRemaining--;
      timerDisplay.textContent = `Resend OTP in ${timeRemaining} seconds.`;
    }
  }, 1000);
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
      swal("", data.message, "success");

      window.location.href = "/home";
    } else {
      document.getElementById("otp-error").textContent = data.message;
    }
  } catch (error) {
    document.getElementById("otp-error").textContent =
      "An error occurred during OTP verification. Please try again.";
  }
}
