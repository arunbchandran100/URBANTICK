
    // Validation functions
    function validateFullName() {
    const fullName = document.getElementById("fullName").value;
    const fullNameError = document.getElementById("fullName-error");
    const regex = /^[A-Za-z\s]+$/;

    if (!regex.test(fullName)) {
        fullNameError.textContent = "Only alphabets are allowed.";
    } else {
        fullNameError.textContent = "";
    }
    }


    function validateEmail() {
    const email = document.getElementById("email").value;
    const emailError = document.getElementById("email-error");

    // Check if email starts with a number
    const startsWithNumber = /^[0-9]/.test(email);
    
    if (startsWithNumber) {
        emailError.textContent = "Email ID cannot start with a number.";
        return; // Return early if this condition is met
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
    const regex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,16}$/;

    if (!regex.test(password)) {
        passwordError.textContent = "Password must be 8-16 characters long, and include a number, uppercase, lowercase, and special character.";
    } else {
        passwordError.textContent = "";
    }
    }

    function validateConfirmPassword() {
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const confirmPasswordError = document.getElementById("confirmPassword-error");

    if (confirmPassword !== password) {
        confirmPasswordError.textContent = "Passwords do not match.";
    } else {
        confirmPasswordError.textContent = "";
    }
    }

    function validateForm() {
    validateFullName();
    validateEmail();
    validatePassword();
    validateConfirmPassword();

    // Check if any error message is still displayed
    const errors = document.querySelectorAll(".error-text");
    for (let error of errors) {
        if (error.textContent !== "") return false;
    }
    return true;
    }

    // Real-time validation
    document.getElementById("fullName").addEventListener("input", validateFullName);
    document.getElementById("email").addEventListener("input", validateEmail);
    document.getElementById("password").addEventListener("input", validatePassword);
    document.getElementById("confirmPassword").addEventListener("input", validateConfirmPassword);

    // Toggle password visibility
    function togglePasswordVisibility(id) {
    const passwordField = document.getElementById(id);
    if (passwordField.type === "password") {
        passwordField.type = "text";
    } else {
        passwordField.type = "password";
    }
    }





    
