const bcrypt = require("bcrypt");
const { getDb } = require("../db/database"); // Import getDb

// NOTE: Removed 'const db = getDb();' from top level

// Handle new user registration
const registerUser = async (req, res) => {
  const db = getDb(); // Get DB instance inside the function
  const { username, password, fullName, contactNumber } = req.body;
  if (!username || !password)
    return res
      .status(400)
      .json({ message: "Username and password are required." });
  if (username.toLowerCase() === "master")
    return res
      .status(400)
      .json({ message: "Cannot register with this username." });

  db.get(
    "SELECT username FROM users WHERE username = ?",
    [username],
    async (err, row) => {
      if (err) {
        console.error("DB error reg check:", err.message);
        return res.status(500).json({ message: "Server error." });
      }
      if (row)
        return res.status(409).json({ message: "Username already exists." });
      try {
        const passwordHash = await bcrypt.hash(password, 10);
        db.run(
          "INSERT INTO users (username, password_hash, full_name, contact_number) VALUES (?, ?, ?, ?)",
          [username, passwordHash, fullName || null, contactNumber || null],
          function (err) {
            if (err) {
              console.error("DB error user insert:", err.message);
              return res
                .status(500)
                .json({ message: "Failed to register user." });
            }
            console.log(`User ${username} registered with ID: ${this.lastID}`);
            res
              .status(201)
              .json({ message: "User registered successfully. Please login." });
          }
        );
      } catch (hashError) {
        console.error("Error hashing password:", hashError);
        res.status(500).json({ message: "Server error." });
      }
    }
  );
};

// Handle user login
const loginUser = (req, res) => {
  const db = getDb(); // Get DB instance inside the function
  const { username, password } = req.body;
  if (!username || !password)
    return res
      .status(400)
      .json({ message: "Username and password are required." });
  db.get(
    "SELECT * FROM users WHERE username = ?",
    [username],
    async (err, user) => {
      if (err) {
        console.error("DB error login:", err.message);
        return res.status(500).json({ message: "Server error." });
      }
      if (!user)
        return res
          .status(401)
          .json({ message: "Invalid username or password." });
      try {
        const match = await bcrypt.compare(password, user.password_hash);
        if (match) {
          req.session.user = {
            id: user.id,
            username: user.username,
            isMaster: user.username === "master",
            fullName: user.full_name || null,
            contactNumber: user.contact_number || null,
          };
          console.log("Session created for user:", req.session.user);
          res.status(200).json({ message: "Login successful." });
        } else {
          res.status(401).json({ message: "Invalid username or password." });
        }
      } catch (compareError) {
        console.error("Error comparing passwords:", compareError);
        res.status(500).json({ message: "Server error." });
      }
    }
  );
};

// Handle user logout
const logoutUser = (req, res) => {
  // No DB needed for logout, just session
  if (req.session.user) {
    const username = req.session.user.username;
    req.session.destroy((err) => {
      if (err) {
        console.error("Session destruction error:", err);
        return res.status(500).json({ message: "Could not log out." });
      }
      console.log(`User ${username} logged out.`);
      res.clearCookie("connect.sid");
      res.status(200).json({ message: "Logout successful." });
    });
  } else {
    res.status(400).json({ message: "Not logged in." });
  }
};

// Get current user session data
const getCurrentUser = (req, res) => {
  const db = getDb(); // Get DB instance inside the function
  if (req.session.user) {
    db.get(
      `SELECT id, username, full_name, contact_number FROM users WHERE id = ?`,
      [req.session.user.id],
      (err, userRow) => {
        if (err || !userRow) {
          console.error(
            "Error fetching user data for session check:",
            err?.message
          );
          req.session.destroy(() => {
            res.clearCookie("connect.sid");
            res.status(401).json({ user: null });
          });
        } else {
          req.session.user.fullName = userRow.full_name || null;
          req.session.user.contactNumber = userRow.contact_number || null;
          req.session.user.isMaster = userRow.username === "master";
          res.status(200).json({ user: req.session.user });
        }
      }
    );
  } else {
    res.status(401).json({ user: null });
  }
};

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
};
