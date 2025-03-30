const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "..", "..", "database.db"); // Adjust path relative to this file's location
let db = null; // Initialize db as null

function initializeDatabase(callback) {
  db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error("Error opening database:", err.message);
      if (callback) callback(err); // Pass error to callback
      return;
    }
    console.log("Connected to the SQLite database.");
    setupDatabaseSchema((setupErr) => {
      if (setupErr) {
        console.error("Error setting up database schema:", setupErr.message);
        if (callback) callback(setupErr);
      } else {
        console.log("Database schema setup complete.");
        if (callback) callback(null, db); // Pass db object on success
      }
    });
  });
}

function setupDatabaseSchema(callback) {
  if (!db) {
    return callback(new Error("Database not initialized."));
  }
  db.serialize(() => {
    // Users Table
    db.run(
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        full_name TEXT,
        contact_number TEXT
      )`,
      (err) => {
        if (err) return callback(err);
        console.log("Users table checked/created.");
      }
    );
    // Transactions Table
    db.run(
      `CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        transaction_id TEXT UNIQUE NOT NULL,
        user_id INTEGER NOT NULL,
        timestamp TEXT NOT NULL,
        truck_number TEXT NOT NULL,
        driver_name TEXT NOT NULL,
        initial_weight REAL NOT NULL,
        final_weight REAL NOT NULL,
        sand_weight REAL NOT NULL,
        bill_amount REAL NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )`,
      (err) => {
        if (err) return callback(err);
        console.log("Transactions table checked/created.");
      }
    );
    // Sessions Table
    db.run(
      `CREATE TABLE IF NOT EXISTS sessions (
          sid TEXT PRIMARY KEY,
          sess TEXT NOT NULL,
          expire INTEGER NOT NULL
      )`,
      (err) => {
        if (err) return callback(err);
        console.log("Sessions table checked/created.");
      }
    );
    // Settings Table
    db.run(
      `CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
      )`,
      (err) => {
        if (err) return callback(err);
        console.log("Settings table checked/created.");
        // Initialize default rate if not set
        db.run(
          `INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`,
          ["sandRate", "2000"],
          (insertErr) => {
            if (insertErr) return callback(insertErr);
            console.log("Default sandRate setting checked/initialized.");
            callback(null); // Signal schema setup completion
          }
        );
      }
    );
  });
}

// Function to get the database instance
function getDb() {
  if (!db) {
    throw new Error(
      "Database has not been initialized. Call initializeDatabase first."
    );
  }
  return db;
}

module.exports = { initializeDatabase, getDb };
