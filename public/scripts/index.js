// ===== PARTICLE ANIMATION =====
function createParticles() {
  const container = document.getElementById("particles");
  const particleCount = 25;

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement("div");
    particle.className = "particle";
    particle.style.left = Math.random() * 100 + "%";
    particle.style.animationDuration = Math.random() * 15 + 10 + "s";
    particle.style.animationDelay = Math.random() * 10 + "s";
    particle.style.width = Math.random() * 3 + 2 + "px";
    particle.style.height = particle.style.width;
    particle.style.opacity = Math.random() * 0.4 + 0.1;
    container.appendChild(particle);
  }
}
createParticles();

// ===== DOM ELEMENTS =====
const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const togglePassword = document.getElementById("togglePassword");
const eyeIcon = document.getElementById("eyeIcon");
const eyeOffIcon = document.getElementById("eyeOffIcon");
const rememberMe = document.getElementById("rememberMe");
const errorAlert = document.getElementById("errorAlert");
const successAlert = document.getElementById("successAlert");
const errorText = document.getElementById("errorText");
const successText = document.getElementById("successText");
const roleBadge = document.getElementById("roleBadge");
const emailError = document.getElementById("emailError");
const passwordError = document.getElementById("passwordError");

// ===== PASSWORD TOGGLE =====
togglePassword.addEventListener("click", () => {
  const type = passwordInput.type === "password" ? "text" : "password";
  passwordInput.type = type;
  eyeIcon.style.display = type === "password" ? "block" : "none";
  eyeOffIcon.style.display = type === "password" ? "none" : "block";
});

// ===== VALIDATION =====
function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showFieldError(input, msgEl, show) {
  if (show) {
    input.classList.add("error");
    input.classList.remove("success");
    msgEl.classList.add("show");
  } else {
    input.classList.remove("error");
    input.classList.add("success");
    msgEl.classList.remove("show");
  }
}

function clearFieldError(input, msgEl) {
  input.classList.remove("error", "success");
  msgEl.classList.remove("show");
}

// Real-time validation
emailInput.addEventListener("blur", () => {
  if (emailInput.value) {
    showFieldError(emailInput, emailError, !validateEmail(emailInput.value));
  }
});

emailInput.addEventListener("input", () => {
  if (emailInput.classList.contains("error")) {
    showFieldError(emailInput, emailError, !validateEmail(emailInput.value));
  }
  if (validateEmail(emailInput.value)) {
    emailInput.classList.add("success");
    emailError.classList.remove("show");
  }
});

passwordInput.addEventListener("blur", () => {
  if (passwordInput.value) {
    showFieldError(
      passwordInput,
      passwordError,
      passwordInput.value.length < 1,
    );
  }
});

passwordInput.addEventListener("input", () => {
  if (passwordInput.classList.contains("error")) {
    showFieldError(
      passwordInput,
      passwordError,
      passwordInput.value.length < 1,
    );
  }
  if (passwordInput.value.length > 0) {
    passwordInput.classList.add("success");
    passwordError.classList.remove("show");
  }
});

// ===== ALERTS =====
function showError(message) {
  errorText.textContent = message;
  errorAlert.classList.add("show");
  successAlert.classList.remove("show");
  setTimeout(() => errorAlert.classList.remove("show"), 5000);
}

function showSuccess(message) {
  successText.textContent = message;
  successAlert.classList.add("show");
  errorAlert.classList.remove("show");
}

// ===== ROLE-BASED REDIRECT =====
function getRoleDashboard(role) {
  const dashboards = {
    director: "/dashboard/director",
    admin: "/admin",
    manager: "/dashboard/manager",
    accountant: "/dashboard/accountant",
    hr: "/dashboard/hr",
    procurement: "/dashboard/procurement",
    staff: "/dashboard",
    user: "/dashboard",
  };
  return dashboards[role?.toLowerCase()] || "/dashboard";
}

function getRoleBadgeClass(role) {
  const classes = {
    director: "role-director",
    admin: "role-admin",
    manager: "role-staff",
    accountant: "role-staff",
    hr: "role-staff",
    procurement: "role-staff",
    staff: "role-staff",
  };
  return classes[role?.toLowerCase()] || "role-staff";
}

function getRoleDisplayName(role) {
  const names = {
    director: "Director Access",
    admin: "Administrator",
    manager: "Manager",
    accountant: "Accountant",
    hr: "HR Officer",
    procurement: "Procurement",
    staff: "Staff",
  };
  return names[role?.toLowerCase()] || role;
}

// ===== LOGIN HANDLER =====
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Clear previous alerts
  errorAlert.classList.remove("show");
  successAlert.classList.remove("show");

  // Validate
  let hasError = false;

  if (!emailInput.value || !validateEmail(emailInput.value)) {
    showFieldError(emailInput, emailError, true);
    hasError = true;
  }

  if (!passwordInput.value) {
    showFieldError(passwordInput, passwordError, true);
    hasError = true;
  }

  if (hasError) {
    showError("Please fix the errors above");
    return;
  }

  // Loading state
  loginBtn.classList.add("loading");
  loginBtn.disabled = true;

  const credentials = {
    email: emailInput.value.trim(),
    password: passwordInput.value,
  };

  try {
    // ===== BACKEND API CALL =====
    const response = await fetch("http://localhost:3000/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Login failed");
    }

    // ===== ROLE-BASED AUTHENTICATION =====
    const { token, user } = data;
    const userRole = user?.role || "staff";

    // Store securely
    if (rememberMe.checked) {
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("role", userRole);
    } else {
      sessionStorage.setItem("token", token);
      sessionStorage.setItem("user", JSON.stringify(user));
      sessionStorage.setItem("role", userRole);
    }

    // Show success
    showSuccess(`Welcome back, ${user.firstName || user.name || "User"}!`);

    // Show role badge
    roleBadge.className = `role-badge show ${getRoleBadgeClass(userRole)}`;
    roleBadge.innerHTML = `
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    ${getRoleDisplayName(userRole)}
                `;

    // Redirect based on role
    const dashboard = getRoleDashboard(userRole);

    setTimeout(() => {
      window.location.href = dashboard;
    }, 1500);
  } catch (error) {
    console.error("Login error:", error);
    showError(error.message || "Unable to connect. Please try again.");

    // Clear sensitive fields
    passwordInput.value = "";
    passwordInput.classList.remove("success");
    loginBtn.classList.remove("loading");
    loginBtn.disabled = false;
  }
});

// ===== FORGOT PASSWORD =====
document.getElementById("forgotPassword").addEventListener("click", (e) => {
  e.preventDefault();
  showError("Please contact your system administrator to reset your password.");
});

// ===== HELP BUTTON =====
document.getElementById("helpBtn").addEventListener("click", () => {
  showError("Contact IT Support: support@octoberlibra.com");
});

// ===== AUTO-FILL REMEMBERED USER =====
window.addEventListener("DOMContentLoaded", () => {
  const savedUser = localStorage.getItem("user");
  if (savedUser) {
    try {
      const user = JSON.parse(savedUser);
      if (user.email) {
        emailInput.value = user.email;
        rememberMe.checked = true;
        emailInput.classList.add("success");
      }
    } catch (e) {
      console.log("No saved user found");
    }
  }
});
