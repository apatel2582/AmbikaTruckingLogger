const express = require("express");
const transactionController = require("../controllers/transactionController");
const { requireLogin, requireMaster } = require("../middleware/auth"); // Import middleware

const router = express.Router();

// Apply requireLogin to all transaction routes
router.use(requireLogin);

// Define transaction routes
router.get("/transactions", transactionController.getTransactions); // GET /transactions (handles filtering internally)
router.post("/transactions", transactionController.addTransaction); // POST /transactions

// Define CSV export route (requires master)
router.get(
  "/export/csv",
  requireMaster,
  transactionController.exportTransactionsCSV
); // GET /export/csv

module.exports = router;
