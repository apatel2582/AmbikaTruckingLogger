// Module for transaction handling (add, load, display, export)
import * as api from "./api.js";
import * as ui from "./ui.js";

// State needed from app.js (will be passed in or managed differently)
let currentUser = null;
let currentSandRate = null;
const recordsMap = new Map(); // Keep track of records for printing
let allFetchedTransactions = []; // Store all fetched records locally

// Function to update local state (called from app.js)
export function setTransactionContext(user, rate) {
  currentUser = user;
  currentSandRate = rate;
}
export function updateLocalSandRate(rate) {
  currentSandRate = rate;
}

/**
 * Handles the new log entry form submission.
 * @param {Event} event - The form submission event.
 */
export async function handleNewEntry(event) {
  event.preventDefault();
  const form = event.target;
  const formId = form.id; // e.g., "entry-form"

  console.log("New entry submission...");
  if (!currentUser || currentUser.isMaster) {
    ui.showNotification(
      "Only logged-in drivers can create new entries.",
      "error"
    );
    return;
  }
  if (currentSandRate === null) {
    // This shouldn't happen if initialization is correct, but as a fallback:
    ui.showNotification(
      "Sand rate not available. Cannot calculate bill.",
      "error"
    );
    console.error("Attempted to add entry without sand rate.");
    return;
  }

  const truckNumber = form.elements["truck-number"].value;
  const driverName = form.elements["driver-name"].value;
  const initialWeight = parseFloat(form.elements["initial-weight"].value);
  const finalWeight = parseFloat(form.elements["final-weight"].value);

  if (
    isNaN(initialWeight) ||
    isNaN(finalWeight) ||
    finalWeight <= initialWeight
  ) {
    ui.showNotification(
      "Please enter valid weights. Final weight must be greater than initial weight.",
      "error"
    );
    return;
  }

  const sandWeight = finalWeight - initialWeight;
  const billAmount = sandWeight * currentSandRate;
  const transactionId = `TXN-${Date.now()}`; // Generate client-side ID
  const timestamp = new Date();

  const entryData = {
    transactionId,
    timestamp: timestamp.toISOString(),
    truckNumber,
    driverName,
    initialWeight,
    finalWeight,
    sandWeight: sandWeight.toFixed(2),
    billAmount: billAmount.toFixed(2),
  };

  console.log(
    "Sending Entry Data (using rate " + currentSandRate + "):",
    entryData
  );
  ui.toggleFormLoading(formId, true);
  try {
    const result = await api.addTransaction(entryData);
    console.log("Transaction saved:", result);
    ui.showNotification(result.message, "success");
    ui.displayAndPrintRecord(entryData, timestamp, currentSandRate); // Use UI function
    if (ui.entryFormEl) ui.entryFormEl.reset();
    loadPastRecords(); // Refresh the list
  } catch (error) {
    console.error("Error saving transaction:", error);
    ui.showNotification(
      `Failed to save transaction: ${error.message}`,
      "error"
    );
  } finally {
    ui.toggleFormLoading(formId, false);
  }
}

/**
 * Loads past transaction records from the API and updates the table.
 */
export async function loadPastRecords() {
  console.log("Loading past records...");
  if (!ui.recordsBodyEl) return; // Don't run if table doesn't exist

  if (!currentUser) {
    ui.recordsBodyEl.innerHTML =
      '<tr><td colspan="7">Please login to view records.</td></tr>';
    return;
  }

  try {
    // Fetch all records and store them locally
    allFetchedTransactions = await api.getTransactions();
    // Initial display with no filter
    filterAndDisplayTransactions("");

    // Note: Event listeners for print buttons are now added within filterAndDisplayTransactions
    // because the buttons are recreated each time the table is updated.
  } catch (error) {
    console.error("Error loading past records:", error);
    if (ui.recordsBodyEl) {
      ui.recordsBodyEl.innerHTML = `<tr><td colspan="7">Error loading records: ${error.message}</td></tr>`;
    }
    ui.showNotification(`Error loading records: ${error.message}`, "error");
  }
}

/**
 * Filters the locally stored transactions and updates the table display.
 * @param {string} [filterField="all"] - The field to filter by.
 * @param {string} [filterValue=""] - The value to filter for.
 */
export function filterAndDisplayTransactions(
  filterField = "all",
  filterValue = ""
) {
  console.log(
    `Filtering transactions by ${filterField} with: "${filterValue}"`
  );
  if (!ui.recordsBodyEl) return;

  recordsMap.clear(); // Clear map before repopulating
  // Call the UI function to update the table with filtered data
  ui.updateTransactionsTable(
    allFetchedTransactions,
    recordsMap,
    currentSandRate,
    filterField,
    filterValue
  );

  // Re-add event listeners for the newly created print buttons
  // Clone/replace is important to avoid duplicate listeners if filter text changes rapidly
  document.querySelectorAll(".print-row-button").forEach((button) => {
    const newButton = button.cloneNode(true);
    button.parentNode.replaceChild(newButton, button);
    newButton.addEventListener("click", handlePrintButtonClick);
  });
}

/**
 * Handles clicks on dynamically added print buttons in the transaction table.
 * @param {Event} event
 */
function handlePrintButtonClick(event) {
  const button = event.target;
  const txnId = button.dataset.transactionId;
  const recordToPrint = recordsMap.get(txnId);
  if (recordToPrint) {
    // Pass the rate that was likely used (or current as fallback)
    ui.displayAndPrintRecord(recordToPrint, null, currentSandRate || 2000);
  } else {
    console.error("Could not find record data for ID:", txnId);
    ui.showNotification(
      "Error: Could not retrieve record data for printing.",
      "error"
    );
  }
}

/**
 * Triggers the CSV export by navigating the browser.
 */
export function exportCSV() {
  if (!currentUser || !currentUser.isMaster) {
    ui.showNotification("Only the master user can export CSV.", "error");
    return;
  }
  console.log("Triggering CSV export...");
  window.location.href = "/api/export/csv"; // Direct navigation
}

console.log("Transactions module loaded.");
