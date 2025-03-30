const express = require("express");
const path = require("path");
const session = require("express-session");
const SQLiteStore = require("connect-sqlite3")(session);
const { initializeDatabase, getDb } = require("./src/db/database"); // Import initialize and getDb

// Import Routers
const authRoutes = require("./src/routes/authRoutes");
const transactionRoutes = require("./src/routes/transactionRoutes");
const settingsRoutes = require("./src/routes/settingsRoutes");
const userRoutes = require("./src/routes/userRoutes");

const app = express();
const port = 3000;

// Initialize Database First
initializeDatabase((err, dbInstance) => {
  // Capture the db instance if needed later
  if (err) {
    console.error("FATAL: Database initialization failed. Exiting.", err);
    process.exit(1);
  }

  console.log("Database initialized successfully.");

  // --- Middleware ---
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Session Configuration
  app.use(
    session({
      store: new SQLiteStore({
        db: "database.db",
        dir: __dirname,
        table: "sessions",
      }),
      secret: "a-very-insecure-secret-key-replace-me", // CHANGE THIS!
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 1000 * 60 * 60 * 24, // 1 day
        secure: false,
        httpOnly: true,
      },
    })
  );

  // Static Files
  app.use(express.static(path.join(__dirname, "public")));

  // --- Mount Routers ---
  // Auth routes remain at root
  app.use("/", authRoutes);

  // Mount other API routes under /api
  app.use("/api", transactionRoutes); // Becomes /api/transactions, /api/export/csv
  app.use("/api", settingsRoutes); // Becomes /api/settings/sandRate
  app.use("/api", userRoutes); // Becomes /api/users, /api/profile etc.

  // --- Basic Page Routes ---
  // Root path is handled by authRoutes
  // Dashboard route is handled by authRoutes (redirects if not logged in)

  // --- Server Start ---
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });

  // Graceful shutdown
  process.on("SIGINT", () => {
    console.log("SIGINT signal received: closing HTTP server");
    const db = getDb(); // Get db instance for closing
    db.close((err) => {
      if (err) {
        console.error("Error closing database:", err.message);
      } else {
        console.log("Database connection closed.");
      }
      process.exit(0);
    });
  });
}); // End of initializeDatabase callback
