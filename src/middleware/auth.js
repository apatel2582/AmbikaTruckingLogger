// Middleware to check if user is logged in
const requireLogin = (req, res, next) => {
  // Use optional chaining
  if (!req.session?.user) {
    // Check session and user existence
    console.log("Auth Middleware: Authentication required for:", req.path);
    // Redirect to login page for browser requests, send JSON for API requests
    if (req.accepts("html", "json") === "html") {
      return res.redirect("/"); // Redirect browser requests to login
    } else {
      return res
        .status(401)
        .json({ message: "Authentication required. Please login." });
    }
  }
  next(); // User is authenticated, proceed
};

// Middleware to check if user is master
const requireMaster = (req, res, next) => {
  // Use optional chaining
  if (!req.session?.user?.isMaster) {
    console.log("Auth Middleware: Master access required for:", req.path);
    // Redirect or send error based on request type
    if (req.accepts("html", "json") === "html") {
      // Maybe redirect to dashboard with an error message? Or just show forbidden.
      return res.status(403).send("Forbidden: Master access required.");
    } else {
      return res
        .status(403)
        .json({ message: "Forbidden: Master access required." });
    }
  }
  next(); // User is master, proceed
};

module.exports = { requireLogin, requireMaster };
