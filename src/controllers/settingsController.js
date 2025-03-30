const { getDb } = require("../db/database");
// NOTE: Removed 'const db = getDb();' from top level

// Get the current sand rate
const getSandRate = (req, res) => {
  const db = getDb(); // Get DB instance inside the function
  db.get(
    `SELECT value FROM settings WHERE key = ?`,
    ["sandRate"],
    (err, row) => {
      if (err) {
        console.error("Error fetching sandRate:", err.message);
        return res.status(500).json({ message: "Failed to retrieve rate." });
      }
      if (!row) {
        console.error("Sand rate setting not found in database!");
        return res
          .status(404)
          .json({ message: "Sand rate setting not found." });
      }
      res.status(200).json({ sandRate: parseFloat(row.value) });
    }
  );
};

// Update the sand rate (Master only)
const updateSandRate = (req, res) => {
  const db = getDb(); // Get DB instance inside the function
  const { newRate } = req.body;
  const rateValue = parseFloat(newRate);

  if (isNaN(rateValue) || rateValue <= 0) {
    return res
      .status(400)
      .json({ message: "Invalid rate provided. Must be a positive number." });
  }

  db.run(
    `UPDATE settings SET value = ? WHERE key = ?`,
    [rateValue.toString(), "sandRate"],
    function (err) {
      if (err) {
        console.error("Error updating sandRate:", err.message);
        return res.status(500).json({ message: "Failed to update rate." });
      }
      if (this.changes === 0) {
        console.warn(
          "sandRate setting key not found for update, attempting insert."
        );
        db.run(
          `INSERT INTO settings (key, value) VALUES (?, ?)`,
          ["sandRate", rateValue.toString()],
          (insertErr) => {
            if (insertErr) {
              console.error(
                "Error inserting sandRate after failed update:",
                insertErr.message
              );
              return res.status(500).json({ message: "Failed to set rate." });
            }
            console.log(`Sand rate inserted as: ${rateValue}`);
            res
              .status(200)
              .json({
                message: "Sand rate set successfully.",
                newRate: rateValue,
              });
          }
        );
      } else {
        console.log(`Sand rate updated to: ${rateValue}`);
        res
          .status(200)
          .json({
            message: "Sand rate updated successfully.",
            newRate: rateValue,
          });
      }
    }
  );
};

module.exports = {
  getSandRate,
  updateSandRate,
};
