// Module for handling API calls to the backend

/**
 * Performs a fetch request and handles common logic like setting headers,
 * stringifying body, checking response status, and parsing JSON.
 * @param {string} url - The endpoint URL.
 * @param {object} options - Fetch options (method, body, etc.).
 * @returns {Promise<object>} - The parsed JSON response.
 * @throws {Error} - Throws an error if the fetch fails or the response is not ok.
 */
async function request(url, options = {}) {
  options.headers = {
    "Content-Type": "application/json",
    ...options.headers, // Allow overriding/adding headers
  };

  // Corrected line: Use && instead of &amp;&amp;
  if (options.body && typeof options.body !== "string") {
    options.body = JSON.stringify(options.body);
  }

  console.log(
    `API Request: ${options.method || "GET"} ${url}`,
    options.body ? `Body: ${options.body}` : ""
  );

  try {
    const response = await fetch(url, options);
    console.log(
      `API Response: ${response.status} ${response.statusText} for ${url}`
    );

    // Try parsing JSON even for errors, as the body might contain error details
    let responseData;
    try {
      // Handle potential empty responses (e.g., 204 No Content)
      if (response.status === 204) {
        responseData = { message: "Operation successful (No Content)" };
      } else {
        responseData = await response.json();
      }
    } catch (e) {
      // If JSON parsing fails, use the status text or a generic error
      responseData = {
        message: response.statusText || `HTTP error ${response.status}`,
      };
    }

    if (!response.ok) {
      // Throw an error with the message and status code
      const error = new Error(
        responseData.message || `HTTP error! status: ${response.status}`
      );
      error.status = response.status; // Attach status code to the error object
      throw error;
    }

    console.log("API Response Data:", responseData);
    return responseData;
  } catch (error) {
    console.error(`API Error during fetch to ${url}:`, error);
    // Re-throw the error so the calling function can handle it
    throw error;
  }
}

// --- Auth ---
export const login = (username, password) =>
  request("/login", { method: "POST", body: { username, password } });
export const register = (username, password, fullName, contactNumber) =>
  request("/register", {
    method: "POST",
    body: { username, password, fullName, contactNumber },
  });
export const logout = () => request("/logout", { method: "POST" });
// Special handling for getCurrentUser to treat 401 as logged out, not an error
export const getCurrentUser = async () => {
  try {
    return await request("/api/user"); // GET is default
  } catch (error) {
    if (error.status === 401) {
      // It's expected that a logged-out user will get 401
      console.log("getCurrentUser: Received 401, returning { user: null }");
      return { user: null };
    }
    // Re-throw other unexpected errors
    console.error("getCurrentUser: Unexpected error:", error); // Log unexpected errors
    throw error;
  }
};

// --- Transactions ---
export const getTransactions = () => request("/api/transactions");
export const addTransaction = (entryData) =>
  request("/api/transactions", { method: "POST", body: entryData });
// Note: CSV export is handled by direct navigation, not fetch, so no function here.

// --- Settings ---
export const getSandRate = () => request("/api/settings/sandRate");
export const updateSandRate = (newRate) =>
  request("/api/settings/sandRate", { method: "PUT", body: { newRate } });

// --- Users ---
export const getUsers = () => request("/api/users");
export const addUser = (username, password, fullName, contactNumber) =>
  request("/api/users", {
    method: "POST",
    body: { username, password, fullName, contactNumber },
  });
export const deleteUser = (userId) =>
  request(`/api/users/${userId}`, { method: "DELETE" });
export const resetUserPassword = (userId, newPassword) =>
  request(`/api/users/${userId}/password`, {
    method: "PUT",
    body: { newPassword },
  });
export const changeMasterUsername = (userId, newUsername) =>
  request(`/api/users/${userId}/username`, {
    method: "PUT",
    body: { newUsername },
  });

// --- Profile ---
export const updateProfile = (fullName, contactNumber) =>
  request("/api/profile", { method: "PUT", body: { fullName, contactNumber } });
export const changeSelfPassword = (
  currentPassword,
  newPassword,
  confirmPassword
) =>
  request("/api/profile/password", {
    method: "PUT",
    body: { currentPassword, newPassword, confirmPassword },
  });
export const changeSelfUsername = (newUsername, currentPassword) =>
  request("/api/profile/username", {
    method: "PUT",
    body: { newUsername, currentPassword },
  });

console.log("API module loaded and functions defined.");
