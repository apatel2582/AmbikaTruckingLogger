// Module for user management (list, add, delete, reset pwd) and profile updates
import * as api from "./api.js";
import * as ui from "./ui.js";

// State needed from app.js
let currentUser = null;
let allFetchedUsers = []; // Store fetched users locally

// Function to update local state (called from app.js)
export function setUserContext(user) {
  currentUser = user;
}

// --- Profile Management Functions (Self-Service) ---

/**
 * Handles the profile update form submission.
 * @param {Event} event - The form submission event.
 */
export async function handleProfileUpdate(event) {
  event.preventDefault();
  const form = event.target;
  const formId = form.id; // e.g., "profile-update-form"

  if (!currentUser) {
    ui.showNotification(
      "You must be logged in to update your profile.",
      "error"
    );
    return;
  }

  const fullName = ui.profileFullnameInputEl?.value;
  const contactNumber = ui.profileContactInputEl?.value;
  console.log(`Attempting to update profile for user ID: ${currentUser.id}`);

  ui.toggleFormLoading(formId, true);
  try {
    // The API returns the updated user object in the result
    const result = await api.updateProfile(fullName, contactNumber);
    ui.showNotification(result.message, "success");
    // Update the local currentUser state (important!)
    currentUser = result.user;
    // Optionally update UI elements if needed immediately (though app.js might handle this)
    if (ui.usernameDisplayEl)
      ui.usernameDisplayEl.textContent = currentUser.username; // Update welcome msg if name changed (though unlikely here)
    console.log("Profile updated, new currentUser state:", currentUser);
    // Potentially notify app.js about the state change
    // app.updateCurrentUserState(currentUser);
  } catch (error) {
    console.error("Error updating profile:", error);
    ui.showNotification(`Failed to update profile: ${error.message}`, "error");
  } finally {
    ui.toggleFormLoading(formId, false);
  }
}

/**
 * Handles the self-service password change form submission.
 * @param {Event} event - The form submission event.
 */
export async function handlePasswordChange(event) {
  event.preventDefault();
  const form = event.target;
  const formId = form.id; // e.g., "password-change-form"

  if (!currentUser) {
    ui.showNotification(
      "You must be logged in to change your password.",
      "error"
    );
    return;
  }

  const currentPassword = form.elements["current-password"].value;
  const newPassword = form.elements["new-password"].value;
  const confirmPassword = form.elements["confirm-password"].value;

  if (!currentPassword || !newPassword || !confirmPassword) {
    ui.showNotification("Please fill in all password fields.", "error");
    return;
  }
  if (newPassword !== confirmPassword) {
    ui.showNotification("New passwords do not match.", "error");
    return;
  }
  // Consider adding password complexity rules here if desired
  if (newPassword.length < 4) {
    ui.showNotification(
      "New password must be at least 4 characters long.",
      "error"
    );
    return;
  }

  console.log(`Attempting password change for user ID: ${currentUser.id}`);
  ui.toggleFormLoading(formId, true);
  try {
    const result = await api.changeSelfPassword(
      currentPassword,
      newPassword,
      confirmPassword
    );
    ui.showNotification(result.message, "success");
    if (ui.passwordChangeFormEl) ui.passwordChangeFormEl.reset();
  } catch (error) {
    console.error("Error changing password:", error);
    ui.showNotification(`Failed to change password: ${error.message}`, "error");
  } finally {
    ui.toggleFormLoading(formId, false);
  }
}

/**
 * Handles the self-service username change form submission.
 * @param {Event} event - The form submission event.
 */
export async function handleUsernameChange(event) {
  event.preventDefault();
  const form = event.target;
  const formId = form.id; // e.g., "username-change-form"

  if (!currentUser) {
    ui.showNotification(
      "You must be logged in to change your username.",
      "error"
    );
    return;
  }

  const newUsername = form.elements["new-username"].value;
  const currentPassword = form.elements["current-password-for-username"].value;

  if (!newUsername || !currentPassword) {
    ui.showNotification(
      "Please enter the new username and your current password.",
      "error"
    );
    return;
  }
  if (newUsername === currentUser.username) {
    ui.showNotification(
      "New username cannot be the same as the current username.",
      "error"
    );
    return;
  }
  if (newUsername.toLowerCase() === "master") {
    ui.showNotification('Cannot change username to "master".', "error");
    return;
  }

  console.log(
    `Attempting username change for user ID: ${currentUser.id} to ${newUsername}`
  );
  ui.toggleFormLoading(formId, true);
  try {
    const result = await api.changeSelfUsername(newUsername, currentPassword);
    ui.showNotification(result.message, "success");
    if (ui.usernameChangeFormEl) ui.usernameChangeFormEl.reset();
    // Update local state and UI
    currentUser = result.user;
    if (ui.usernameDisplayEl)
      ui.usernameDisplayEl.textContent = currentUser.username;
    console.log("Username updated, new currentUser state:", currentUser);
    // Potentially notify app.js about the state change
    // app.updateCurrentUserState(currentUser);
  } catch (error) {
    console.error("Error changing username:", error);
    ui.showNotification(`Failed to change username: ${error.message}`, "error");
  } finally {
    ui.toggleFormLoading(formId, false);
  }
}

// --- User Administration Functions (Master Only) ---

/**
 * Loads the list of users (excluding master) and populates the table.
 */
export async function loadUsers() {
  if (!ui.usersTableBodyEl || !currentUser || !currentUser.isMaster) {
    return; // Don't run if table doesn't exist or user isn't master
  }
  console.log("Loading users for master view...");
  try {
    // Fetch all users and store locally
    allFetchedUsers = await api.getUsers();
    // Initial display with no filter
    filterAndDisplayUsers("");

    // Note: Event listeners are now added in filterAndDisplayUsers
  } catch (error) {
    console.error("Error loading users:", error);
    if (ui.usersTableBodyEl) {
      ui.usersTableBodyEl.innerHTML = `<tr><td colspan="5">Error loading users: ${error.message}</td></tr>`;
    }
    ui.showNotification(`Error loading users: ${error.message}`, "error");
  }
}

/**
 * Filters the locally stored users and updates the table display.
 * @param {string} [filterField="all"] - The field to filter by.
 * @param {string} [filterValue=""] - The value to filter for.
 */
export function filterAndDisplayUsers(filterField = "all", filterValue = "") {
  console.log(`Filtering users by ${filterField} with: "${filterValue}"`);
  if (!ui.usersTableBodyEl) return;

  // Call the UI function to update the table with filtered data
  ui.updateUsersTable(allFetchedUsers, filterField, filterValue);

  // Re-add event listeners for the newly created action buttons
  document.querySelectorAll(".change-user-button").forEach((button) => {
    const newButton = button.cloneNode(true);
    button.parentNode.replaceChild(newButton, button);
    newButton.addEventListener("click", handleChangeUsernameMaster);
  });
  document.querySelectorAll(".reset-pwd-button").forEach((button) => {
    const newButton = button.cloneNode(true);
    button.parentNode.replaceChild(newButton, button);
    newButton.addEventListener("click", handleResetPassword);
  });
  document.querySelectorAll(".delete-user-button").forEach((button) => {
    const newButton = button.cloneNode(true);
    button.parentNode.replaceChild(newButton, button);
    newButton.addEventListener("click", handleDeleteUser);
  });
}

/**
 * Handles the add user form submission (Master only).
 * @param {Event} event - The form submission event.
 */
export async function handleAddUser(event) {
  event.preventDefault();
  const form = event.target;
  const formId = form.id; // e.g., "add-user-form"

  if (!currentUser || !currentUser.isMaster) {
    ui.showNotification("Only the master user can add drivers.", "error");
    return;
  }

  const username = form.elements["add-username"].value;
  const password = form.elements["add-password"].value;
  const fullName = form.elements["add-fullname"]?.value || null;
  const contactNumber = form.elements["add-contact"]?.value || null;

  if (!username || !password) {
    ui.showNotification(
      "Please enter both username and password for the new driver.",
      "error"
    );
    return;
  }
  // Add validation for username != 'master' if needed (backend already does it)

  console.log(`Attempting to add driver: ${username}`);
  ui.toggleFormLoading(formId, true);
  try {
    const result = await api.addUser(
      username,
      password,
      fullName,
      contactNumber
    );
    ui.showNotification(result.message, "success");
    if (ui.addUserFormEl) ui.addUserFormEl.reset();
    loadUsers(); // Refresh the user list
  } catch (error) {
    console.error("Error adding user:", error);
    ui.showNotification(`Failed to add driver: ${error.message}`, "error");
  } finally {
    ui.toggleFormLoading(formId, false);
  }
}

/**
 * Handles the delete user button click (Master only).
 * @param {Event} event - The button click event.
 */
export async function handleDeleteUser(event) {
  if (!currentUser || !currentUser.isMaster) {
    ui.showNotification("Only the master user can delete drivers.", "error");
    return;
  }
  const button = event.target;
  const userIdToDelete = button.dataset.userId;
  const usernameToDelete = button.dataset.username;

  if (!userIdToDelete || !usernameToDelete) {
    console.error("Missing user ID or username on delete button.");
    return;
  }

  // Use the custom confirmation modal
  const confirmed = await ui.showConfirmationModal(
    `Are you sure you want to delete the user "${usernameToDelete}" (ID: ${userIdToDelete})? This cannot be undone.`,
    "Confirm User Deletion"
  );

  if (!confirmed) {
    ui.showNotification("User deletion cancelled.", "info");
    return;
  }

  console.log(`Attempting to delete user ID: ${userIdToDelete}`);
  // Consider adding loading state to the button/row
  try {
    const result = await api.deleteUser(userIdToDelete);
    ui.showNotification(result.message, "success");
    loadUsers(); // Refresh the list
  } catch (error) {
    console.error("Error deleting user:", error);
    ui.showNotification(`Failed to delete user: ${error.message}`, "error");
  } finally {
    // Remove loading state
  }
}

/**
 * Handles the reset password button click (Master only).
 * @param {Event} event - The button click event.
 */
export async function handleResetPassword(event) {
  if (!currentUser || !currentUser.isMaster) {
    ui.showNotification("Only the master user can reset passwords.", "error");
    return;
  }
  const button = event.target;
  const userIdToReset = button.dataset.userId;
  const usernameToReset = button.dataset.username;

  // Use input modal for password
  const newPassword = await ui.showInputModal(
    `Enter new password for user "${usernameToReset}" (ID: ${userIdToReset}):`,
    "Reset User Password",
    "password", // Input type
    (value) => {
      // Validator function
      if (!value) return "Password cannot be empty.";
      if (value.length < 4)
        return "Password must be at least 4 characters long.";
      return null; // Valid
    }
  );

  if (newPassword === null) {
    // User cancelled the modal
    ui.showNotification("Password reset cancelled.", "info");
    return;
  }

  console.log(`Attempting to reset password for user ID: ${userIdToReset}`);
  // Consider adding loading state
  try {
    const result = await api.resetUserPassword(userIdToReset, newPassword);
    ui.showNotification(result.message, "success");
  } catch (error) {
    console.error("Error resetting password:", error);
    ui.showNotification(`Failed to reset password: ${error.message}`, "error");
  } finally {
    // Remove loading state
  }
}

/**
 * Handles the change username button click in the user list (Master only).
 * @param {Event} event - The button click event.
 */
export async function handleChangeUsernameMaster(event) {
  if (!currentUser || !currentUser.isMaster) {
    ui.showNotification("Only the master user can change usernames.", "error");
    return;
  }
  const button = event.target;
  const userIdToChange = button.dataset.userId;
  const usernameToChange = button.dataset.username;

  // Use input modal for username
  const newUsername = await ui.showInputModal(
    `Enter new username for user "${usernameToChange}" (ID: ${userIdToChange}):`,
    "Change Username",
    "text", // Input type
    (value) => {
      // Validator function
      if (!value) return "Username cannot be empty.";
      if (value.toLowerCase() === "master")
        return 'Cannot change username to "master".';
      if (value === usernameToChange)
        return "New username cannot be the same as the current username.";
      // Add other validation if needed (e.g., length, characters)
      return null; // Valid
    }
  );

  if (newUsername === null) {
    // User cancelled the modal
    ui.showNotification("Username change cancelled.", "info");
    return;
  }

  // This console log is correct, the duplicate below needs removing.
  console.log(
    `Attempting to change username for user ID: ${userIdToChange} to ${newUsername}`
  );
  // Consider adding loading state
  try {
    const result = await api.changeMasterUsername(userIdToChange, newUsername);
    ui.showNotification(result.message, "success");
    loadUsers(); // Refresh the list
  } catch (error) {
    console.error("Error changing username:", error);
    ui.showNotification(`Failed to change username: ${error.message}`, "error");
  } finally {
    // Remove loading state
  }
}

console.log("Users module loaded.");
