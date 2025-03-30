// Module for settings management (sand rate)
import * as api from "./api.js";
import * as ui from "./ui.js";

// State needed from app.js
let currentUser = null;

// Function to update local state (called from app.js)
export function setSettingsContext(user) {
  currentUser = user;
}

/**
 * Fetches the current sand rate from the API.
 * Updates the UI display directly for simplicity here, but could also just return the value.
 * @returns {Promise<number>} The fetched sand rate.
 * @throws {Error} If fetching fails.
 */
export async function fetchAndUpdateSandRate() {
  console.log("Fetching sand rate...");
  try {
    const data = await api.getSandRate();
    const rate = data.sandRate;
    console.log("Fetched sand rate:", rate);
    ui.updateSandRateDisplay(rate); // Update UI
    return rate; // Return the value for app state
  } catch (error) {
    console.error("Error fetching sand rate:", error);
    const fallbackRate = 2000; // Define a fallback rate
    ui.updateSandRateDisplay(`Error (${fallbackRate.toFixed(2)})`); // Update UI with error state
    // Decide whether to throw or return fallback
    // Throwing makes the caller aware of the failure
    throw new Error(
      `Failed to fetch sand rate: ${error.message}. Using fallback might be inaccurate.`
    );
    // return fallbackRate; // Alternative: return fallback
  }
}

/**
 * Handles the rate update form submission (Master only).
 * @param {Event} event - The form submission event.
 */
export async function handleRateUpdate(event) {
  event.preventDefault();
  const form = event.target;
  const formId = form.id; // e.g., "rate-update-form"

  if (!currentUser || !currentUser.isMaster) {
    ui.showNotification("Only the master user can update the rate.", "error");
    return;
  }

  const newRateValue = ui.newRateInputEl?.value;
  if (
    newRateValue === null ||
    newRateValue === undefined ||
    newRateValue.trim() === ""
  ) {
    ui.showNotification("Please enter a new rate value.", "error");
    return;
  }

  const rate = parseFloat(newRateValue);
  if (isNaN(rate) || rate <= 0) {
    ui.showNotification(
      "Invalid rate provided. Must be a positive number.",
      "error"
    );
    return;
  }

  console.log(`Attempting to update rate to: ${rate}`);
  ui.toggleFormLoading(formId, true);
  try {
    const result = await api.updateSandRate(rate);
    ui.showNotification(result.message, "success");
    ui.updateSandRateDisplay(result.newRate); // Update display
    if (ui.rateUpdateFormEl) ui.rateUpdateFormEl.reset();
    // Notify app.js or other modules if the rate change needs broader state update
    // For now, transactions.js fetches rate if needed or uses its local copy
    // Potentially call a function here to update the rate in transactions.js
    // import { updateLocalSandRate } from './transactions.js'; // Example
    // updateLocalSandRate(result.newRate); // Example
  } catch (error) {
    console.error("Error updating rate:", error);
    ui.showNotification(`Failed to update rate: ${error.message}`, "error");
  } finally {
    ui.toggleFormLoading(formId, false);
  }
}

console.log("Settings module loaded.");
