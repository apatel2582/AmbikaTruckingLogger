// Main application entry point
import * as api from "./api.js";
import * as ui from "./ui.js";
import * as auth from "./auth.js";
import * as transactions from "./transactions.js";
import * as settings from "./settings.js";
import * as users from "./users.js";

// --- Core Application State ---
let currentUser = null;
let currentSandRate = null;

// --- Initialization and Routing ---

/**
 * Initializes the application based on the current page and user session.
 */
async function initializeApp() {
  console.log(`Initializing app on page: ${window.location.pathname}`);

  // Check for persistent notifications from sessionStorage first
  const loginNotificationData = sessionStorage.getItem("authNotification");
  const logoutNotificationData = sessionStorage.getItem("logoutNotification");

  // Attempt to get current user session
  try {
    const data = await api.getCurrentUser();
    currentUser = data.user; // Will be null if not logged in or error
    console.log("initializeApp: User session data retrieved:", currentUser);
  } catch (error) {
    currentUser = null; // Ensure currentUser is null on error
    console.log(
      `initializeApp: No active session or error checking session: ${error.message}`
    );
  }

  // Pass context to modules that need it
  users.setUserContext(currentUser);
  settings.setSettingsContext(currentUser);
  // transactions module gets context updated after rate fetch

  // --- Page Routing Logic ---
  const isLoginPage =
    window.location.pathname.endsWith("/") ||
    window.location.pathname.endsWith("index.html");
  const isDashboardPage = window.location.pathname.endsWith("dashboard.html");

  console.log(
    `Routing check: currentUser=${!!currentUser}, isLoginPage=${isLoginPage}, isDashboardPage=${isDashboardPage}`
  );

  if (currentUser) {
    // User IS Logged In
    if (isLoginPage) {
      console.log("User logged in, redirecting from Login page to Dashboard.");
      window.location.href = "dashboard.html";
      return; // Stop further execution on this page
    } else if (isDashboardPage) {
      console.log("User logged in and on Dashboard page. Setting up UI.");
      // Clear any logout message from previous session
      sessionStorage.removeItem("logoutNotification");
      // Display login success message if it exists
      if (loginNotificationData) {
        const notification = JSON.parse(loginNotificationData);
        // Use the persistent flag
        ui.showNotification(notification.message, notification.type, true);
        // Remove from storage so it doesn't show again on reload
        sessionStorage.removeItem("authNotification");
      }
      await setupDashboard(); // Fetch necessary data and configure dashboard UI
    }
  } else {
    // User is NOT Logged In
    if (isDashboardPage) {
      console.log(
        "User not logged in, redirecting from Dashboard to Login page."
      );
      window.location.href = "index.html";
      return; // Stop further execution on this page
    } else if (isLoginPage) {
      console.log(
        "User not logged in and on Login page. Setting up listeners."
      );
      // Clear any login message from previous session
      sessionStorage.removeItem("authNotification");
      // Display logout success message if it exists
      if (logoutNotificationData) {
        const notification = JSON.parse(logoutNotificationData);
        // Use the persistent flag
        ui.showNotification(notification.message, notification.type, true);
        // Remove from storage so it doesn't show again on reload
        sessionStorage.removeItem("logoutNotification");
      }
      // Only setup login/register listeners
      setupLoginRegisterListeners();
    } else {
      // Unknown page or state, redirect to login
      console.warn(
        "User not logged in and not on login page. Redirecting to login."
      );
      window.location.href = "index.html";
      return;
    }
  }
  console.log("App initialization sequence finished.");
}

/**
 * Sets up the dashboard UI after confirming user is logged in.
 */
async function setupDashboard() {
  // Populate dashboard elements that depend only on currentUser
  if (ui.usernameDisplayEl) {
    ui.usernameDisplayEl.textContent = currentUser.username;
  }
  if (ui.profileFullnameInputEl)
    ui.profileFullnameInputEl.value = currentUser.fullName || "";
  if (ui.profileContactInputEl)
    ui.profileContactInputEl.value = currentUser.contactNumber || "";

  // Pre-fill driver name in log entry form if available
  const driverNameInput = document.getElementById("driver-name");
  if (driverNameInput && currentUser.fullName) {
    driverNameInput.value = currentUser.fullName;
  } else if (driverNameInput && currentUser.username !== "master") {
    // Fallback to username if full name isn't set and user isn't master
    driverNameInput.value = currentUser.username;
  }

  // Fetch essential dashboard data (sand rate)
  try {
    currentSandRate = await settings.fetchAndUpdateSandRate();
    transactions.setTransactionContext(currentUser, currentSandRate); // Pass context now
  } catch (error) {
    console.error(
      "Failed to initialize dashboard due to sand rate fetch error:",
      error
    );
    ui.showNotification(error.message, "error");
    // Decide if app is usable without rate, maybe disable entry form?
    transactions.setTransactionContext(currentUser, null); // Indicate rate is unavailable
  }

  // Show/Hide sections based on user role
  if (currentUser.isMaster) {
    console.log("Master user detected, showing admin sections.");
    if (ui.entryFormDivEl) ui.entryFormDivEl.style.display = "none";
    if (ui.receiptDivEl) ui.receiptDivEl.style.display = "none"; // Hide receipt initially
    if (ui.exportCsvButtonEl)
      ui.exportCsvButtonEl.style.display = "inline-block";
    if (ui.rateManagementDivEl) ui.rateManagementDivEl.style.display = "block";
    if (ui.userManagementDivEl) ui.userManagementDivEl.style.display = "block";
    users.loadUsers(); // Load user list for master
  } else {
    console.log("Regular user detected, showing driver sections.");
    if (ui.entryFormDivEl) ui.entryFormDivEl.style.display = "block";
    if (ui.exportCsvButtonEl) ui.exportCsvButtonEl.style.display = "none";
    if (ui.receiptDivEl) ui.receiptDivEl.style.display = "none"; // Hide receipt initially
    if (ui.rateManagementDivEl) ui.rateManagementDivEl.style.display = "none";
    if (ui.userManagementDivEl) ui.userManagementDivEl.style.display = "none";
  }

  // Always show profile section, but collapsed by default
  if (ui.profileSectionDivEl) ui.profileSectionDivEl.style.display = "block";
  if (ui.profileFormContentEl) ui.profileFormContentEl.style.display = "none"; // Start collapsed
  if (ui.profileToggleHeadingEl)
    ui.profileToggleHeadingEl.innerHTML = `My Profile &#9662;`; // Down arrow

  // Load transaction records
  transactions.loadPastRecords();

  // Setup ALL dashboard event listeners
  setupDashboardListeners();
  console.log(`Dashboard setup complete for user ${currentUser.username}.`);
}

// --- Event Listener Setup ---

/**
 * Sets up event listeners specific to the Login/Register page.
 */
function setupLoginRegisterListeners() {
  console.log("Setting up Login/Register listeners...");
  if (ui.loginFormEl) {
    ui.loginFormEl.addEventListener("submit", auth.handleLogin);
  }
  if (ui.actualRegisterFormEl) {
    // Make sure the ID is on the form itself if using getElementById
    // If selecting via parent, ensure parent exists.
    ui.actualRegisterFormEl.addEventListener("submit", auth.handleRegister);
  }
  if (ui.showRegisterLinkEl) {
    ui.showRegisterLinkEl.addEventListener("click", (e) => {
      e.preventDefault();
      if (ui.loginFormContainer) ui.loginFormContainer.style.display = "none";
      if (ui.registerFormContainer)
        ui.registerFormContainer.style.display = "block";
    });
  }
  if (ui.showLoginLinkEl) {
    ui.showLoginLinkEl.addEventListener("click", (e) => {
      e.preventDefault();
      if (ui.registerFormContainer)
        ui.registerFormContainer.style.display = "none";
      if (ui.loginFormContainer) ui.loginFormContainer.style.display = "block";
    });
  }
  console.log("Login/Register listeners setup complete.");
}

/**
 * Sets up event listeners specific to the Dashboard page.
 */
function setupDashboardListeners() {
  console.log("Setting up Dashboard listeners...");
  // General
  if (ui.logoutButtonEl) {
    ui.logoutButtonEl.addEventListener("click", auth.handleLogout);
  }

  // Profile
  if (ui.profileToggleHeadingEl) {
    ui.profileToggleHeadingEl.addEventListener("click", () => {
      if (ui.profileFormContentEl) {
        const isHidden = ui.profileFormContentEl.style.display === "none";
        ui.profileFormContentEl.style.display = isHidden ? "block" : "none";
        ui.profileToggleHeadingEl.innerHTML = `My Profile ${
          isHidden ? "&#9652;" : "&#9662;"
        }`; // Toggle arrow
      }
    });
  }
  if (ui.profileUpdateFormEl) {
    ui.profileUpdateFormEl.addEventListener(
      "submit",
      users.handleProfileUpdate
    );
  }
  if (ui.passwordChangeFormEl) {
    ui.passwordChangeFormEl.addEventListener(
      "submit",
      users.handlePasswordChange
    );
  }
  if (ui.usernameChangeFormEl) {
    ui.usernameChangeFormEl.addEventListener(
      "submit",
      users.handleUsernameChange
    );
  }

  // Transactions
  if (ui.entryFormEl) {
    ui.entryFormEl.addEventListener("submit", transactions.handleNewEntry);
  }
  if (ui.exportCsvButtonEl) {
    ui.exportCsvButtonEl.addEventListener("click", transactions.exportCSV);
  }
  // Note: Listeners for dynamically created print buttons are added in transactions.loadPastRecords

  // Settings (Master)
  if (ui.rateUpdateFormEl) {
    ui.rateUpdateFormEl.addEventListener("submit", settings.handleRateUpdate);
  }

  // User Management (Master)
  if (ui.addUserFormEl) {
    ui.addUserFormEl.addEventListener("submit", users.handleAddUser);
  }
  // Note: Listeners for dynamically created user action buttons are added in users.loadUsers

  // Filter listeners
  const transactionFilterField = document.getElementById(
    "transaction-filter-field"
  );
  const transactionFilterValue = document.getElementById(
    "transaction-filter-value"
  );
  const userFilterField = document.getElementById("user-filter-field");
  const userFilterValue = document.getElementById("user-filter-value");

  const applyTransactionFilter = () => {
    if (transactionFilterField && transactionFilterValue) {
      // Debounce or throttle this if performance becomes an issue
      transactions.filterAndDisplayTransactions(
        transactionFilterField.value,
        transactionFilterValue.value
      );
    }
  };
  const applyUserFilter = () => {
    if (userFilterField && userFilterValue) {
      // Debounce or throttle this if performance becomes an issue
      users.filterAndDisplayUsers(userFilterField.value, userFilterValue.value);
    }
  };

  if (transactionFilterField)
    transactionFilterField.addEventListener("change", applyTransactionFilter);
  if (transactionFilterValue)
    transactionFilterValue.addEventListener("input", applyTransactionFilter); // Use 'input' for real-time filtering
  if (userFilterField)
    userFilterField.addEventListener("change", applyUserFilter);
  if (userFilterValue)
    userFilterValue.addEventListener("input", applyUserFilter); // Use 'input' for real-time filtering

  console.log("Dashboard listeners setup complete.");
}

// --- Run Initialization ---
// Use DOMContentLoaded to ensure HTML is parsed, then run async init
document.addEventListener("DOMContentLoaded", initializeApp);
