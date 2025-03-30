// Module for UI related functions (DOM manipulation, notifications, etc.)

// --- Constants ---
const COMPANY_NAME = "Ambika Trucking";
const COMPANY_ADDRESS = "Uchharel, Bardoli, GJ, IN - 394335";

// --- DOM Element References ---
// Login/Register Page
export const loginFormEl = document.getElementById("login-actual-form");
export const registerFormContainer = document.getElementById("register-form");
export const actualRegisterFormEl =
  registerFormContainer?.querySelector("form");
export const showRegisterLinkEl = document.getElementById("show-register");
export const showLoginLinkEl = document.getElementById("show-login");
export const loginFormContainer = document.getElementById("login-form"); // Needed for toggling
export const loginNotificationAreaEl = document.getElementById(
  "login-notification-area"
); // Added for login page notifications

// Dashboard Page - General
export const usernameDisplayEl = document.getElementById("username-display");
export const logoutButtonEl = document.getElementById("logout-button");
export const notificationAreaEl = document.getElementById("notification-area"); // Added

// Dashboard Page - Profile
export const profileSectionDivEl = document.getElementById("profile-section");
export const profileUpdateFormEl = document.getElementById(
  "profile-update-form"
);
export const profileFullnameInputEl =
  document.getElementById("profile-fullname");
export const profileContactInputEl = document.getElementById("profile-contact");
export const profileToggleHeadingEl = document.getElementById("profile-toggle");
export const profileFormContentEl = document.getElementById(
  "profile-form-content"
);
export const passwordChangeFormEl = document.getElementById(
  "password-change-form"
);
export const usernameChangeFormEl = document.getElementById(
  "username-change-form"
);

// Dashboard Page - Log Entry & Receipt
export const entryFormDivEl = document.getElementById("log-entry-form");
export const entryFormEl = document.getElementById("entry-form");
export const receiptDivEl = document.getElementById("receipt");
export const receiptContentEl = document.getElementById("receipt-content");

// Dashboard Page - Past Transactions
export const recordsBodyEl = document.getElementById("records-body");
export const exportCsvButtonEl = document.getElementById("export-csv-button");

// Dashboard Page - Rate Management (Master)
export const rateManagementDivEl = document.getElementById("rate-management");
export const currentRateDisplayEl = document.getElementById(
  "current-rate-display"
);
export const rateUpdateFormEl = document.getElementById("rate-update-form");
export const newRateInputEl = document.getElementById("new-rate");

// Dashboard Page - User Management (Master)
export const userManagementDivEl = document.getElementById("user-management");
export const addUserFormEl = document.getElementById("add-user-form");
export const usersTableBodyEl = document.getElementById("users-body");

// Dashboard Page - Confirmation Modal
export const confirmationModalEl =
  document.getElementById("confirmation-modal");
export const modalTitleEl = document.getElementById("modal-title");
export const modalMessageEl = document.getElementById("modal-message");
export const modalConfirmButtonEl = document.getElementById(
  "modal-confirm-button"
);
export const modalCancelButtonEl = document.getElementById(
  "modal-cancel-button"
);
export const modalBackdropEl =
  confirmationModalEl?.querySelector(".modal-backdrop"); // Select backdrop within modal

// Dashboard Page - Input Modal
export const inputModalEl = document.getElementById("input-modal");
export const inputModalTitleEl = document.getElementById("input-modal-title");
export const inputModalMessageEl = document.getElementById(
  "input-modal-message"
);
export const inputModalFieldEl = document.getElementById("input-modal-field");
export const inputModalErrorEl = document.getElementById("input-modal-error");
export const inputModalConfirmButtonEl = document.getElementById(
  "input-modal-confirm-button"
);
export const inputModalCancelButtonEl = document.getElementById(
  "input-modal-cancel-button"
);
export const inputModalBackdropEl =
  inputModalEl?.querySelector(".modal-backdrop");

// --- UI Update Functions ---

/**
 * Displays a notification message to the user.
 * @param {string} message - The message to display.
 * @param {'success' | 'error' | 'info'} [type="info"] - The type of message.
 * @param {boolean} [persistent=false] - If true, notification will not auto-dismiss.
 */
export function showNotification(message, type = "info", persistent = false) {
  // Determine the correct container based on which page we might be on
  const targetNotificationArea = notificationAreaEl || loginNotificationAreaEl; // Use exported references

  if (!targetNotificationArea) {
    // Fallback if no notification area is found on the current page
    console.warn("Notification area not found, falling back to alert.");
    alert(message);
    return;
  }

  const notification = document.createElement("div");
  // Add classes for styling: base class and type-specific class
  notification.classList.add("notification", `notification-${type}`);
  notification.textContent = message;

  // Add a close button (optional but good practice)
  const closeButton = document.createElement("button");
  closeButton.textContent = "×"; // Multiplication sign as 'X'
  closeButton.classList.add("notification-close");
  closeButton.onclick = () => {
    notification.remove();
  };
  notification.appendChild(closeButton);

  targetNotificationArea.prepend(notification); // Use the correct target container

  // Allow manual closing via the button (update the existing onclick)
  // Ensure closeButton is the one appended earlier
  const appendedCloseButton = notification.querySelector(".notification-close");
  let notificationTimeout = null; // Define timeout variable outside the if block

  // Only set the auto-dismiss timeout if the notification is NOT persistent
  if (!persistent) {
    notificationTimeout = setTimeout(() => {
      // Assign to the outer variable
      // Add a class to trigger fade-out animation (defined in CSS)
      notification.classList.add("fade-out");

      // Function to remove the element safely
      const removeNotification = () => {
        // Check if the element still exists before trying to remove
        if (notification.parentNode) {
          notification.remove();
        }
        // Clear the main timeout if it hasn't fired yet (e.g., if closed manually)
        clearTimeout(notificationTimeout);
      };

      // Remove the element after the animation completes
      notification.addEventListener("transitionend", removeNotification, {
        once: true,
      }); // Use {once: true} for cleanup

      // As a fallback if transitionend doesn't fire (e.g., no animation defined or element removed before transition)
      // Ensure this fallback respects the full 5-second display time + fade time
      setTimeout(removeNotification, 5500); // 5000ms display + 500ms fade
    }, 5000); // Start fade-out after 5 seconds

    // Update manual close button for non-persistent notifications
    if (appendedCloseButton) {
      appendedCloseButton.onclick = () => {
        // Add fade-out effect on manual close
        notification.classList.add("fade-out");
        // Remove after fade
        setTimeout(() => {
          if (notification.parentNode) {
            notification.remove();
          }
          // Crucially, clear the auto-dismiss timeout if it exists
          if (notificationTimeout) {
            clearTimeout(notificationTimeout);
          }
        }, 500); // Match fade duration
      };
    }
  } else {
    // For persistent notifications, the close button just removes directly
    if (appendedCloseButton) {
      appendedCloseButton.onclick = () => {
        if (notification.parentNode) {
          notification.remove();
        }
        // No timeout to clear for persistent notifications
      };
    }
  }
}

/**
 * Toggles the visibility of a loading spinner for a form.
 * TODO: Implement actual spinner logic.
 * @param {string} formId - The ID of the form associated with the spinner.
 * @param {boolean} isLoading - Whether to show or hide the spinner.
 */
export function toggleFormLoading(formId, isLoading) {
  // Placeholder for spinner logic (e.g., find spinner element by convention)
  const spinner = document.getElementById(`${formId}-spinner`); // Assuming spinner ID convention
  const button = document.querySelector(`#${formId} button[type="submit"]`);
  if (spinner) {
    spinner.style.display = isLoading ? "block" : "none";
  }
  if (button) {
    button.disabled = isLoading;
  }
  console.log(`Toggling loading for ${formId}: ${isLoading}`);
}

/**
 * Displays the generated receipt and triggers printing.
 * @param {object} record - The transaction record data.
 * @param {Date | null} timestampObj - The timestamp object (if available, otherwise parsed from record).
 * @param {number} rateUsed - The sand rate used for calculation.
 */
export function displayAndPrintRecord(record, timestampObj = null, rateUsed) {
  console.log(
    "Formatting record for printing:",
    record,
    "Rate used:",
    rateUsed
  );
  const timestamp = timestampObj || new Date(record.timestamp);
  // Normalize keys (handle data from form vs data from API)
  const initialWeight = parseFloat(
    record.initialWeight ?? record.initial_weight
  ).toFixed(2);
  const finalWeight = parseFloat(
    record.finalWeight ?? record.final_weight
  ).toFixed(2);
  const sandWeight = parseFloat(
    record.sandWeight ?? record.sand_weight
  ).toFixed(2);
  const billAmount = parseFloat(
    record.billAmount ?? record.bill_amount
  ).toFixed(2);
  const transactionId = record.transactionId ?? record.transaction_id;
  const truckNumber = record.truckNumber ?? record.truck_number;
  const driverName = record.driverName ?? record.driver_name;

  const receiptHTML = `
      <div class="receipt-header"><h2>${COMPANY_NAME}</h2><p>${COMPANY_ADDRESS}</p></div> <hr class="receipt-hr">
      <div class="receipt-details"> <p><strong>Date:</strong> ${timestamp.toLocaleString()}</p> <p><strong>Transaction ID:</strong> ${transactionId}</p> <p><strong>Truck Number:</strong> ${truckNumber}</p> <p><strong>Driver Name:</strong> ${driverName}</p> </div> <hr class="receipt-hr">
      <div class="receipt-items"> <table> <tr><td>Initial Weight:</td><td class="num-col">${initialWeight} Tonnes</td></tr> <tr><td>Final Weight:</td><td class="num-col">${finalWeight} Tonnes</td></tr> <tr><td><strong>Sand Weight:</strong></td><td class="num-col"><strong>${sandWeight} Tonnes</strong></td></tr> </table> </div> <hr class="receipt-hr">
      <div class="receipt-summary"> <table> <tr><td>Rate:</td><td class="num-col">${rateUsed.toFixed(
        2
      )} INR/Tonne</td></tr> <tr><td><strong>Total Bill:</strong></td><td class="num-col"><strong>${billAmount} INR</strong></td></tr> </table> </div> <hr class="receipt-hr">`;

  if (receiptContentEl && receiptDivEl) {
    receiptContentEl.innerHTML = receiptHTML;
    receiptDivEl.style.display = "block";
    // Use a short delay to ensure content is rendered before printing
    setTimeout(() => {
      console.log("Calling window.print() after delay.");
      printReceipt();
    }, 100);
  } else {
    console.error("Receipt display elements not found.");
  }
}

/**
 * Triggers the browser's print dialog.
 */
export function printReceipt() {
  window.print();
}

/**
 * Updates the display of the current sand rate.
 * @param {number | string} rate - The rate value or an error message.
 */
export function updateSandRateDisplay(rate) {
  if (currentRateDisplayEl) {
    if (typeof rate === "number") {
      currentRateDisplayEl.textContent = rate.toFixed(2);
    } else {
      currentRateDisplayEl.textContent = rate; // Display error message
    }
  }
}

/**
 * Updates the transaction table with new records.
 * @param {Array<object>} records - Array of transaction records.
 * @param {Map<string, object>} recordsMap - Map to store records by ID for printing.
 * @param {number | null} currentSandRate - The current sand rate for print button context.
 * @param {string} [filterText=""] - Text to filter the records by.
 * @param {Map<string, object>} recordsMap - Map to store records by ID for printing.
 * @param {number | null} currentSandRate - The current sand rate for print button context.
 * @param {string} [filterField="all"] - The field to filter by ('all', 'transaction_id', etc.).
 * @param {string} [filterValue=""] - The value to filter for.
 */
export function updateTransactionsTable(
  records,
  recordsMap,
  currentSandRate,
  filterField = "all",
  filterValue = ""
) {
  if (!recordsBodyEl) return;
  recordsBodyEl.innerHTML = ""; // Clear existing rows

  const lowerFilterValue = filterValue.toLowerCase().trim();

  const filteredRecords = records.filter((record) => {
    if (!lowerFilterValue) return true; // Show all if filter value is empty

    const transactionId = record.transaction_id || "";
    const truckNumber = record.truck_number || "";
    const driverName = record.driver_name || "";

    if (filterField === "all") {
      // Search across multiple fields if 'all' is selected
      return (
        transactionId.toLowerCase().includes(lowerFilterValue) ||
        truckNumber.toLowerCase().includes(lowerFilterValue) ||
        driverName.toLowerCase().includes(lowerFilterValue)
      );
    } else if (record.hasOwnProperty(filterField)) {
      // Check if property exists
      // Search only in the specified field
      // Ensure the field exists and convert to string before searching
      return String(record[filterField])
        .toLowerCase()
        .includes(lowerFilterValue);
    } else {
      return false; // Field doesn't exist on record
    }
  });

  if (filteredRecords.length === 0) {
    recordsBodyEl.innerHTML =
      '<tr><td colspan="7">No transactions match your filter.</td></tr>'; // Updated message
    return;
  }

  filteredRecords.forEach((record) => {
    // Use filteredRecords
    // Ensure weights/amounts are numbers for consistency
    record.initial_weight = parseFloat(record.initial_weight);
    record.final_weight = parseFloat(record.final_weight);
    record.sand_weight = parseFloat(record.sand_weight);
    record.bill_amount = parseFloat(record.bill_amount);
    recordsMap.set(record.transaction_id, record); // Store for printing

    const row = recordsBodyEl.insertRow();
    const timestamp = new Date(record.timestamp).toLocaleString();
    row.insertCell().textContent = timestamp;
    row.insertCell().textContent = record.transaction_id;
    row.insertCell().textContent = record.truck_number;
    row.insertCell().textContent = record.driver_name;
    row.insertCell().textContent = record.sand_weight.toFixed(2);
    row.insertCell().textContent = record.bill_amount.toFixed(2);

    // Add Print Button
    const actionCell = row.insertCell();
    const printButton = document.createElement("button");
    printButton.textContent = "Print";
    printButton.classList.add("print-row-button"); // Add class for potential styling/selection
    printButton.dataset.transactionId = record.transaction_id;
    // Add event listener in the main app module or transactions module where recordsMap is accessible
    actionCell.appendChild(printButton);
  });
}

/**
 * Updates the users table (for master view).
 * @param {Array<object>} users - Array of user objects.
 * @param {string} [filterField="all"] - The field to filter by ('all', 'username', etc.).
 * @param {string} [filterValue=""] - The value to filter for.
 */
export function updateUsersTable(users, filterField = "all", filterValue = "") {
  if (!usersTableBodyEl) return;
  usersTableBodyEl.innerHTML = ""; // Clear existing rows

  const lowerFilterValue = filterValue.toLowerCase().trim();

  const filteredUsers = users.filter((user) => {
    if (!lowerFilterValue) return true; // Show all if filter value is empty

    const username = user.username || "";
    const fullName = user.full_name || "";
    const contact = user.contact_number || "";

    if (filterField === "all") {
      // Search across multiple fields if 'all' is selected
      return (
        username.toLowerCase().includes(lowerFilterValue) ||
        fullName.toLowerCase().includes(lowerFilterValue) ||
        contact.toLowerCase().includes(lowerFilterValue)
      );
    } else if (user.hasOwnProperty(filterField)) {
      // Check if property exists
      // Search only in the specified field
      return String(user[filterField]).toLowerCase().includes(lowerFilterValue);
    } else {
      return false; // Field doesn't exist on record
    }
  });

  if (filteredUsers.length === 0) {
    usersTableBodyEl.innerHTML =
      '<tr><td colspan="5">No users match your filter.</td></tr>'; // Updated message
    return;
  }

  filteredUsers.forEach((user) => {
    // Use filteredUsers
    const row = usersTableBodyEl.insertRow();
    row.insertCell().textContent = user.id;
    row.insertCell().textContent = user.username;
    row.insertCell().textContent = user.full_name || "-";
    row.insertCell().textContent = user.contact_number || "-";

    // Add Action Buttons
    const actionCell = row.insertCell();
    const changeUserButton = document.createElement("button");
    changeUserButton.textContent = "Change User";
    changeUserButton.classList.add("change-user-button");
    changeUserButton.dataset.userId = user.id;
    changeUserButton.dataset.username = user.username;
    actionCell.appendChild(changeUserButton);

    const resetButton = document.createElement("button");
    resetButton.textContent = "Reset Pwd";
    resetButton.classList.add("reset-pwd-button");
    resetButton.dataset.userId = user.id;
    resetButton.dataset.username = user.username;
    actionCell.appendChild(resetButton);

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.classList.add("delete-user-button");
    deleteButton.dataset.userId = user.id;
    deleteButton.dataset.username = user.username;
    actionCell.appendChild(deleteButton);
    // Add event listeners in the main app module or users module
  });
}

/**
 * Shows a confirmation modal and returns a promise that resolves with true/false.
 * @param {string} message - The confirmation message to display.
 * @param {string} [title="Confirm Action"] - The title for the modal.
 * @returns {Promise<boolean>} - True if confirmed, false if cancelled.
 */
export function showConfirmationModal(message, title = "Confirm Action") {
  return new Promise((resolve) => {
    if (
      !confirmationModalEl ||
      !modalTitleEl ||
      !modalMessageEl ||
      !modalConfirmButtonEl ||
      !modalCancelButtonEl ||
      !modalBackdropEl
    ) {
      console.error("Modal elements not found. Falling back to confirm().");
      // Fallback to browser confirm if modal elements are missing
      resolve(confirm(`${title}\n\n${message}`)); // Basic fallback
      return;
    }

    // Set modal content
    modalTitleEl.textContent = title;
    modalMessageEl.textContent = message;

    // Ensure buttons are clean before adding listeners
    const newConfirmButton = modalConfirmButtonEl.cloneNode(true);
    modalConfirmButtonEl.parentNode.replaceChild(
      newConfirmButton,
      modalConfirmButtonEl
    );
    modalConfirmButtonEl = newConfirmButton; // Update reference

    const newCancelButton = modalCancelButtonEl.cloneNode(true);
    modalCancelButtonEl.parentNode.replaceChild(
      newCancelButton,
      modalCancelButtonEl
    );
    modalCancelButtonEl = newCancelButton; // Update reference

    const newBackdrop = modalBackdropEl.cloneNode(true);
    modalBackdropEl.parentNode.replaceChild(newBackdrop, modalBackdropEl);
    modalBackdropEl = newBackdrop; // Update reference

    // Function to close modal and resolve promise
    const closeModal = (result) => {
      confirmationModalEl.style.display = "none";
      resolve(result);
    };

    // Add event listeners
    modalConfirmButtonEl.onclick = () => closeModal(true);
    modalCancelButtonEl.onclick = () => closeModal(false);
    modalBackdropEl.onclick = () => closeModal(false); // Close on backdrop click

    // Show the modal
    confirmationModalEl.style.display = "block";
  });
}

/**
 * Shows a modal with an input field and returns a promise resolving with the input value or null.
 * @param {string} message - The message/prompt to display above the input.
 * @param {string} [title="Enter Value"] - The title for the modal.
 * @param {string} [inputType="text"] - The type for the input field (e.g., 'text', 'password').
 * @param {function(string): string|null} [validator=null] - Optional validation function. Returns error message or null if valid.
 * @returns {Promise<string|null>} - The validated input value if confirmed, otherwise null.
 */
export function showInputModal(
  message,
  title = "Enter Value",
  inputType = "text",
  validator = null
) {
  return new Promise((resolve) => {
    if (
      !inputModalEl ||
      !inputModalTitleEl ||
      !inputModalMessageEl ||
      !inputModalFieldEl ||
      !inputModalErrorEl ||
      !inputModalConfirmButtonEl ||
      !inputModalCancelButtonEl ||
      !inputModalBackdropEl
    ) {
      console.error(
        "Input modal elements not found. Falling back to prompt()."
      );
      // Fallback to browser prompt if modal elements are missing
      const value = prompt(`${title}\n\n${message}`);
      // Basic validation fallback
      if (value === null) {
        // Cancelled
        resolve(null);
      } else if (validator) {
        const error = validator(value);
        if (error) {
          alert(`Invalid input: ${error}`);
          resolve(null); // Treat validation failure as cancellation in fallback
        } else {
          resolve(value);
        }
      } else {
        resolve(value); // No validator
      }
      return;
    }

    // Set modal content
    inputModalTitleEl.textContent = title;
    inputModalMessageEl.textContent = message;
    inputModalFieldEl.type = inputType;
    inputModalFieldEl.value = ""; // Clear previous input
    inputModalErrorEl.textContent = ""; // Clear previous errors
    inputModalErrorEl.style.display = "none";
    inputModalFieldEl.classList.remove("input-error"); // Ensure error style is removed

    // Ensure buttons are clean before adding listeners
    // Cloning removes old listeners
    let currentConfirmButton = document.getElementById(
      "input-modal-confirm-button"
    );
    let currentCancelButton = document.getElementById(
      "input-modal-cancel-button"
    );
    let currentBackdrop = inputModalEl.querySelector(".modal-backdrop");

    const newConfirmButton = currentConfirmButton.cloneNode(true);
    currentConfirmButton.parentNode.replaceChild(
      newConfirmButton,
      currentConfirmButton
    );

    const newCancelButton = currentCancelButton.cloneNode(true);
    currentCancelButton.parentNode.replaceChild(
      newCancelButton,
      currentCancelButton
    );

    const newBackdrop = currentBackdrop.cloneNode(true);
    currentBackdrop.parentNode.replaceChild(newBackdrop, currentBackdrop);

    // Function to close modal and resolve promise
    const closeModal = (value) => {
      inputModalEl.style.display = "none";
      resolve(value);
    };

    // Add event listeners to the *new* buttons
    newConfirmButton.onclick = () => {
      const value = inputModalFieldEl.value;
      let error = null;
      if (validator) {
        error = validator(value);
      }

      if (error) {
        inputModalErrorEl.textContent = error;
        inputModalErrorEl.style.display = "block";
        inputModalFieldEl.classList.add("input-error"); // Add error class
      } else {
        inputModalErrorEl.textContent = "";
        inputModalErrorEl.style.display = "none";
        inputModalFieldEl.classList.remove("input-error"); // Remove error class
        closeModal(value);
      }
    };
    newCancelButton.onclick = () => closeModal(null);
    newBackdrop.onclick = () => closeModal(null); // Close on backdrop click

    // Also allow Enter key to confirm
    inputModalFieldEl.onkeydown = (e) => {
      if (e.key === "Enter") {
        e.preventDefault(); // Prevent potential form submission if wrapped in form
        newConfirmButton.click(); // Trigger confirm button click
      }
    };

    // Show the modal and focus the input
    inputModalEl.style.display = "block";
    inputModalFieldEl.focus();
  });
}

console.log("UI module loaded.");
