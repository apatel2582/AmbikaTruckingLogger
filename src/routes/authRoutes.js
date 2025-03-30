const express = require("express");
const authController = require("../controllers/authController");
// No need for requireLogin/requireMaster here as these are public/login-specific

const router = express.Router();

// Public routes
router.post("/register", authController.registerUser);
router.post("/login", authController.loginUser);
router.post("/logout", authController.logoutUser); // Logout needs to be accessible

// API route to check session status
router.get("/api/user", authController.getCurrentUser); // This implicitly checks login via session existence

module.exports = router;
