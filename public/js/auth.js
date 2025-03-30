// Module for authentication logic (login, register, logout)
import * as api from "./api.js";
import * as ui from "./ui.js";

/**
 * Handles the login form submission.
 * @param {Event} event - The form submission event.
 */
export async function handleLogin(event) {
  console.log("handleLogin function started"); // Diagnostic log
  event.preventDefault();
  const form = event.target;
  const formId = form.id; // e.g., "login-actual-form"
  const username = form.elements["login-username"].value;
  const password = form.elements["login-password"].value;

  if (!username || !password) {
    ui.showNotification("Please enter both username and password.", "error");
    return;
  }

  ui.toggleFormLoading(formId, true);
  try {
    const result = await api.login(username, password);
    // Store success message for display after redirect
    sessionStorage.setItem(
      "authNotification",
      JSON.stringify({
        message: result.message,
        type: "success",
        context: "login",
      })
    );
    // Clear any lingering logout message
    sessionStorage.removeItem("logoutNotification");
    window.location.href = "dashboard.html";
  } catch (error) {
    console.error("Login failed:", error);
    ui.showNotification(`Login failed: ${error.message}`, "error");
  } finally {
    // Ensure the button is always re-enabled, regardless of success or failure
    ui.toggleFormLoading(formId, false);
  }
}

/**
 * Handles the registration form submission.
 * @param {Event} event - The form submission event.
 */
export async function handleRegister(event) {
  event.preventDefault();
  const form = event.target;
  const formId = form.id; // Assuming the form itself has an ID like "register-actual-form"
  const username = form.elements["register-username"].value;
  const password = form.elements["register-password"].value;
  // These might not exist on the simple register form, handle gracefully
  const fullName = form.elements["register-fullname"]?.value || null;
  const contactNumber = form.elements["register-contact"]?.value || null;

  if (!username || !password) {
    ui.showNotification("Please enter both username and password.", "error");
    return;
  }

  ui.toggleFormLoading(formId, true);
  try {
    const result = await api.register(
      username,
      password,
      fullName,
      contactNumber
    );
    ui.showNotification(result.message, "success");
    // Switch back to login form view
    if (ui.registerFormContainer)
      ui.registerFormContainer.style.display = "none";
    if (ui.loginFormContainer) ui.loginFormContainer.style.display = "block";
    form.reset();
  } catch (error) {
    console.error("Registration failed:", error);
    ui.showNotification(`Registration failed: ${error.message}`, "error");
  } finally {
    ui.toggleFormLoading(formId, false);
  }
}

/**
 * Handles the logout button click.
 */
export async function handleLogout() {
  console.log("Attempting logout...");
  try {
    const result = await api.logout();
    // Store success message for display after redirect
    sessionStorage.setItem(
      "logoutNotification",
      JSON.stringify({
        message: result.message,
        type: "success",
        context: "logout",
      })
    );
    // Clear any lingering login message
    sessionStorage.removeItem("authNotification");
    window.location.href = "index.html";
  } catch (error) {
    console.error("Logout failed:", error);
    ui.showNotification(`Logout failed: ${error.message}`, "error");
  }
}

console.log("Auth module loaded.");
