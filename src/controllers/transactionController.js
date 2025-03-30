const { getDb } = require("../db/database");
// NOTE: Removed 'const db = getDb();' from top level

// Get transactions (filtered by session user unless master)
const getTransactions = (req, res) => {
  const db = getDb(); // Get DB instance inside the function
  const loggedInUser = req.session.user;
  let targetUserId = null;

  if (!loggedInUser.isMaster) {
    targetUserId = loggedInUser.id;
  }

  let sql = `SELECT
               id, transaction_id, user_id, timestamp, truck_number, driver_name,
               initial_weight, final_weight, sand_weight, bill_amount
             FROM transactions`;
  const params = [];

  if (targetUserId) {
    sql += ` WHERE user_id = ? ORDER BY timestamp DESC`;
    params.push(targetUserId);
    console.log(`Fetching transactions for user ID: ${targetUserId}`);
  } else {
    sql += ` ORDER BY timestamp DESC`;
    console.log("Fetching all transactions (master view).");
  }

  db.all(sql, params, (err, rows) => {
    if (err) {
      console.error("DB error fetching transactions:", err.message);
      return res
        .status(500)
        .json({ message: "Failed to retrieve transactions." });
    }
    res.status(200).json(rows);
  });
};

// Add a new transaction
const addTransaction = (req, res) => {
  const db = getDb(); // Get DB instance inside the function
  if (req.session.user.isMaster) {
    return res
      .status(403)
      .json({ message: "Master users cannot create transactions." });
  }

  const userId = req.session.user.id;
  const {
    transactionId,
    timestamp,
    truckNumber,
    driverName,
    initialWeight,
    finalWeight,
    sandWeight,
    billAmount,
  } = req.body;

  if (
    !transactionId ||
    !timestamp ||
    !truckNumber ||
    !driverName ||
    initialWeight == null ||
    finalWeight == null ||
    sandWeight == null ||
    billAmount == null
  ) {
    return res
      .status(400)
      .json({ message: "Missing required transaction data." });
  }

  const sql = `INSERT INTO transactions (
                    transaction_id, user_id, timestamp, truck_number, driver_name,
                    initial_weight, final_weight, sand_weight, bill_amount
                 ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  const params = [
    transactionId,
    userId,
    timestamp,
    truckNumber,
    driverName,
    initialWeight,
    finalWeight,
    sandWeight,
    billAmount,
  ];

  db.run(sql, params, function (err) {
    if (err) {
      console.error("DB error saving transaction:", err.message);
      if (err.message.includes("UNIQUE constraint failed")) {
        return res
          .status(409)
          .json({ message: "Transaction ID already exists." });
      }
      return res.status(500).json({ message: "Failed to save transaction." });
    }
    console.log(
      `Transaction ${transactionId} saved successfully by user ${userId}`
    );
    res
      .status(201)
      .json({ message: "Transaction saved successfully.", id: this.lastID });
  });
};

// Export transactions as CSV (Master only)
const exportTransactionsCSV = (req, res) => {
  const db = getDb(); // Get DB instance inside the function
  const sql = `SELECT
                    t.transaction_id, t.timestamp, u.username AS logged_by_user,
                    t.truck_number, t.driver_name, t.initial_weight, t.final_weight,
                    t.sand_weight, t.bill_amount
                 FROM transactions t
                 JOIN users u ON t.user_id = u.id
                 ORDER BY t.timestamp ASC`;
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error("DB error exporting CSV:", err.message);
      return res.status(500).json({ message: "Failed to export data." });
    }
    if (!rows || rows.length === 0) {
      return res.status(404).send("No transaction data to export.");
    }
    const headers = [
      "Transaction ID",
      "Timestamp",
      "Logged By User",
      "Truck Number",
      "Driver Name",
      "Initial Weight (T)",
      "Final Weight (T)",
      "Sand Weight (T)",
      "Bill Amount (INR)",
    ];
    const csvRows = rows.map((row) =>
      [
        `"${row.transaction_id}"`,
        `"${new Date(row.timestamp).toLocaleString()}"`,
        `"${row.logged_by_user}"`,
        `"${row.truck_number}"`,
        `"${row.driver_name}"`,
        row.initial_weight,
        row.final_weight,
        row.sand_weight,
        row.bill_amount,
      ].join(",")
    );
    const csvString = [headers.join(","), ...csvRows].join("\r\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="ambika_trucking_transactions.csv"'
    );
    res.status(200).send(csvString);
  });
};

module.exports = {
  getTransactions,
  addTransaction,
  exportTransactionsCSV,
};
