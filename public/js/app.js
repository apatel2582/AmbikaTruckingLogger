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

// --- Helper Functions ---

/**
 * Checks sessionStorage for login/logout messages and displays them persistently.
 * Clears the message from storage after displaying.
 * Clears the *other* type of message to prevent showing stale messages.
 * @param {boolean} isLoggedIn - The current login status determined by initializeApp.
 * @param {boolean} isLoginPage - Whether the current page is the login page.
 */
function displayPersistentNotifications(isLoggedIn, isLoginPage) {
  const loginNotificationData = sessionStorage.getItem("authNotification");
  const logoutNotificationData = sessionStorage.getItem("logoutNotification");

  if (isLoggedIn && !isLoginPage) {
    // On Dashboard
    sessionStorage.removeItem("logoutNotification"); // Clear any old logout message
    if (loginNotificationData) {
      try {
        const notification = JSON.parse(loginNotificationData);
        ui.showNotification(notification.message, notification.type, true);
        sessionStorage.removeItem("authNotification"); // Clear after display
      } catch (e) {
        console.error("Error parsing login notification data:", e);
        sessionStorage.removeItem("authNotification"); // Clear corrupted data
      }
    }
  } else if (!isLoggedIn && isLoginPage) {
    // On Login Page
    sessionStorage.removeItem("authNotification"); // Clear any old login message
    if (logoutNotificationData) {
      try {
        const notification = JSON.parse(logoutNotificationData);
        ui.showNotification(notification.message, notification.type, true);
        sessionStorage.removeItem("logoutNotification"); // Clear after display
      } catch (e) {
        console.error("Error parsing logout notification data:", e);
        sessionStorage.removeItem("logoutNotification"); // Clear corrupted data
      }
    }
  } else {
    // Clear both if on an unexpected page or state mismatch
    sessionStorage.removeItem("authNotification");
    sessionStorage.removeItem("logoutNotification");
  }
}

/**
 * Populates static elements on the dashboard based on currentUser.
 */
function populateDashboardStatic() {
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

  // Always show profile section, but collapsed by default
  if (ui.profileSectionDivEl) ui.profileSectionDivEl.style.display = "block";
  if (ui.profileFormContentEl) ui.profileFormContentEl.style.display = "none"; // Start collapsed
  if (ui.profileToggleHeadingEl)
    ui.profileToggleHeadingEl.innerHTML = `My Profile &#9662;`; // Down arrow
}

/**
 * Fetches essential data needed for the dashboard (e.g., sand rate).
 */
async function fetchDashboardData() {
  try {
    currentSandRate = await settings.fetchAndUpdateSandRate();
    transactions.setTransactionContext(currentUser, currentSandRate); // Pass context now
  } catch (error) {
    console.error(
      "Failed to initialize dashboard due to sand rate fetch error:",
      error
    );
    ui.showNotification(error.message, "error");
    transactions.setTransactionContext(currentUser, null); // Indicate rate is unavailable
  }
}

/**
 * Shows/hides UI sections based on the current user's role (master or driver).
 */
function configureRoleSpecificUI() {
  if (!currentUser) return; // Should not happen if called correctly

  // Use optional chaining and toggle class
  const toggleHidden = (element, hide) =>
    element?.classList.toggle("hidden", hide);

  const isMaster = currentUser.isMaster;
  console.log(
    isMaster
      ? "Master user detected, showing admin sections."
      : "Regular user detected, showing driver sections."
  );

  toggleHidden(ui.entryFormDivEl, isMaster); // Hide for master
  toggleHidden(ui.receiptDivEl, true); // Always hide initially
  toggleHidden(ui.exportCsvButtonEl, !isMaster); // Hide for non-master
  toggleHidden(ui.rateManagementDivEl, !isMaster); // Hide for non-master
  toggleHidden(ui.userManagementDivEl, !isMaster); // Hide for non-master
}

/**
 * Loads dynamic table data (transactions, users for master).
 */
function loadDashboardTables() {
  transactions.loadPastRecords();
  // Use optional chaining
  if (currentUser?.isMaster) {
    users.loadUsers(); // Load user list only for master
  }
}

// --- Initialization and Routing ---

/**
 * Initializes the application based on the current page and user session.
 */
async function initializeApp() {
  console.log(`Initializing app on page: ${window.location.pathname}`);

  // Attempt to get current user session
  try {
    const data = await api.getCurrentUser();
    currentUser = data.user; // Will be null if not logged in or error
    console.log("initializeApp: User session data retrieved:", currentUser);
  } catch (error) {
    // Error is already logged in api.js if it's unexpected
    currentUser = null; // Ensure currentUser is null on error
    // No need to log the expected 401 error here anymore
  }

  // Pass context to modules that need it (before routing potentially redirects)
  users.setUserContext(currentUser);
  settings.setSettingsContext(currentUser);
  // transactions module gets context updated after rate fetch in setupDashboard

  // --- Page Routing Logic ---
  const isLoginPage =
    window.location.pathname.endsWith("/") ||
    window.location.pathname.endsWith("index.html");
  const isDashboardPage = window.location.pathname.endsWith("dashboard.html");

  console.log(
    `Routing check: currentUser=${!!currentUser}, isLoginPage=${isLoginPage}, isDashboardPage=${isDashboardPage}`
  );

  // Display persistent notifications *after* determining login status and page
  displayPersistentNotifications(!!currentUser, isLoginPage);

  if (currentUser) {
    // User IS Logged In
    if (isLoginPage) {
      console.log("User logged in, redirecting from Login page to Dashboard.");
      window.location.href = "dashboard.html";
      return; // Stop further execution on this page
    } else if (isDashboardPage) {
      console.log("User logged in and on Dashboard page. Setting up UI.");
      await setupDashboard(); // Setup dashboard UI and fetch data
    }
    // No need for outer else here, conditions cover all cases
  } else if (isDashboardPage) {
    // User is NOT Logged In and on Dashboard
    console.log(
      "User not logged in, redirecting from Dashboard to Login page."
    );
    window.location.href = "index.html";
    return; // Stop further execution on this page
  } else if (isLoginPage) {
    // User is NOT Logged In and on Login Page
    console.log("User not logged in and on Login page. Setting up listeners.");
    // Only setup login/register listeners
    setupLoginRegisterListeners();
  } else {
    // User is NOT Logged In and NOT on Login/Dashboard
    // Unknown page or state, redirect to login
    console.warn(
      "User not logged in and not on login page. Redirecting to login."
    );
    window.location.href = "index.html";
    return;
  }
}
console.log("App initialization sequence finished.");

/**
 * Sets up the dashboard UI after confirming user is logged in.
 * Calls helper functions to populate static elements, fetch data, configure roles, load tables, and set listeners.
 */
async function setupDashboard() {
  populateDashboardStatic();
  await fetchDashboardData(); // Fetch rate, pass context to transactions
  configureRoleSpecificUI();
  loadDashboardTables();
  setupDashboardListeners(); // Setup listeners after UI is configured
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
      ui.loginFormContainer?.classList.add("hidden");
      ui.registerFormContainer?.classList.remove("hidden");
    });
  }
  if (ui.showLoginLinkEl) {
    ui.showLoginLinkEl.addEventListener("click", (e) => {
      e.preventDefault();
      ui.registerFormContainer?.classList.add("hidden");
      ui.loginFormContainer?.classList.remove("hidden");
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
      const isHidden = ui.profileFormContentEl?.classList.toggle("hidden");
      // Update arrow based on new hidden state (isHidden is true if class was added, false if removed)
      ui.profileToggleHeadingEl.innerHTML = `My Profile ${
        isHidden ? "&#9662;" : "&#9652;"
      }`;
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
