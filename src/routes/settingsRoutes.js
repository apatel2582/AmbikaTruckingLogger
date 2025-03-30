const express = require("express");
const settingsController = require("../controllers/settingsController");
const { requireLogin, requireMaster } = require("../middleware/auth");

const router = express.Router();

// Apply requireLogin to get rate (any logged-in user can see it)
router.get(
  "/settings/sandRate", // Removed /api prefix
  requireLogin,
  settingsController.getSandRate
);

// Apply requireMaster to update rate
router.put(
  "/settings/sandRate", // Removed /api prefix
  requireMaster,
  settingsController.updateSandRate
);

module.exports = router;
