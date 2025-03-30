const bcrypt = require("bcrypt");
const { getDb } = require("../db/database");
// NOTE: Ensure 'const db = getDb();' is NOT at the top level

// List all non-master users (Master only)
const listUsers = (req, res) => {
  const db = getDb(); // Get DB instance inside the function
  db.all(
    `SELECT id, username, full_name, contact_number FROM users WHERE username != ? ORDER BY username`,
    ["master"],
    (err, rows) => {
      if (err) {
        console.error("Error fetching users:", err.message);
        return res.status(500).json({ message: "Failed to retrieve users." });
      }
      res.status(200).json(rows);
    }
  );
};

// Add a new user (Master only)
const addUser = async (req, res) => {
  const db = getDb(); // Get DB instance inside the function
  const { username, password, fullName, contactNumber } = req.body;
  if (!username || !password)
    return res
      .status(400)
      .json({ message: "Username and password are required." });
  if (username.toLowerCase() === "master")
    return res.status(400).json({ message: "Cannot add another master user." });

  db.get(
    "SELECT username FROM users WHERE username = ?",
    [username],
    async (err, row) => {
      if (err) {
        console.error("DB error add user check:", err.message);
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
              console.error("DB error add user insert:", err.message);
              return res.status(500).json({ message: "Failed to add user." });
            }
            console.log(
              `Master user added driver ${username} with ID: ${this.lastID}`
            );
            res
              .status(201)
              .json({
                message: "Driver added successfully.",
                newUser: {
                  id: this.lastID,
                  username: username,
                  fullName: fullName,
                  contactNumber: contactNumber,
                },
              });
          }
        );
      } catch (hashError) {
        console.error("Error hashing password:", hashError);
        res.status(500).json({ message: "Server error." });
      }
    }
  );
};

// Delete a user (Master only)
const deleteUser = (req, res) => {
  const db = getDb(); // Get DB instance inside the function
  const userIdToDelete = parseInt(req.params.id, 10);
  if (isNaN(userIdToDelete))
    return res.status(400).json({ message: "Invalid user ID." });

  db.get(
    `SELECT COUNT(*) as count FROM transactions WHERE user_id = ?`,
    [userIdToDelete],
    (err, row) => {
      if (err) {
        console.error("Error checking user transactions:", err.message);
        return res.status(500).json({ message: "Server error." });
      }
      if (row && row.count > 0)
        return res
          .status(400)
          .json({ message: "Cannot delete user with existing transactions." });

      db.run(
        `DELETE FROM users WHERE id = ? AND username != ?`,
        [userIdToDelete, "master"],
        function (err) {
          if (err) {
            console.error("Error deleting user:", err.message);
            return res.status(500).json({ message: "Failed to delete user." });
          }
          if (this.changes === 0)
            return res
              .status(404)
              .json({ message: "User not found or cannot be deleted." });
          console.log(`Master user deleted user ID: ${userIdToDelete}`);
          res.status(200).json({ message: "User deleted successfully." });
        }
      );
    }
  );
};

// Update profile for the logged-in user
const updateProfile = (req, res) => {
  const db = getDb(); // Get DB instance inside the function
  const { fullName, contactNumber } = req.body;
  const userId = req.session.user.id;
  db.run(
    `UPDATE users SET full_name = ?, contact_number = ? WHERE id = ?`,
    [fullName || null, contactNumber || null, userId],
    function (err) {
      if (err) {
        console.error("Error updating profile:", err.message);
        return res.status(500).json({ message: "Failed to update profile." });
      }
      if (this.changes === 0) {
        return res.status(404).json({ message: "User not found." });
      }
      console.log(`User ${userId} updated profile.`);
      req.session.user.fullName = fullName || null;
      req.session.user.contactNumber = contactNumber || null;
      res
        .status(200)
        .json({
          message: "Profile updated successfully.",
          user: req.session.user,
        });
    }
  );
};

// Logged-in user changes their own password
const changePassword = (req, res) => {
  const db = getDb(); // Get DB instance inside the function
  const { currentPassword, newPassword, confirmPassword } = req.body;
  const userId = req.session.user.id;

  if (!currentPassword || !newPassword || !confirmPassword)
    return res
      .status(400)
      .json({ message: "All password fields are required." });
  if (newPassword !== confirmPassword)
    return res.status(400).json({ message: "New passwords do not match." });
  if (newPassword.length < 4)
    return res
      .status(400)
      .json({ message: "New password must be at least 4 characters long." });

  db.get(
    `SELECT password_hash FROM users WHERE id = ?`,
    [userId],
    async (err, user) => {
      if (err) {
        console.error("DB error getting current hash:", err.message);
        return res.status(500).json({ message: "Server error." });
      }
      if (!user) {
        return res.status(404).json({ message: "User not found." });
      }
      try {
        const match = await bcrypt.compare(currentPassword, user.password_hash);
        if (!match) {
          return res
            .status(401)
            .json({ message: "Incorrect current password." });
        }
        const newPasswordHash = await bcrypt.hash(newPassword, 10);
        db.run(
          `UPDATE users SET password_hash = ? WHERE id = ?`,
          [newPasswordHash, userId],
          function (err) {
            if (err) {
              console.error("Error updating password in DB:", err.message);
              return res
                .status(500)
                .json({ message: "Failed to update password." });
            }
            console.log(`User ${userId} changed their password successfully.`);
            res.status(200).json({ message: "Password updated successfully." });
          }
        );
      } catch (error) {
        console.error("Error during password change process:", error);
        res
          .status(500)
          .json({ message: "Server error during password change." });
      }
    }
  );
};

// Master changes another user's password
const resetPassword = async (req, res) => {
  const db = getDb(); // Get DB instance inside the function
  const userIdToUpdate = parseInt(req.params.id, 10);
  const { newPassword } = req.body;
  if (isNaN(userIdToUpdate))
    return res.status(400).json({ message: "Invalid user ID." });
  if (!newPassword)
    return res.status(400).json({ message: "New password is required." });

  try {
    const passwordHash = await bcrypt.hash(newPassword, 10);
    db.run(
      `UPDATE users SET password_hash = ? WHERE id = ? AND username != ?`,
      [passwordHash, userIdToUpdate, "master"],
      function (err) {
        if (err) {
          console.error("Error updating user password:", err.message);
          return res
            .status(500)
            .json({ message: "Failed to update password." });
        }
        if (this.changes === 0) {
          return res
            .status(404)
            .json({ message: "User not found or cannot be updated." });
        }
        console.log(
          `Master user updated password for user ID: ${userIdToUpdate}`
        );
        res
          .status(200)
          .json({ message: "User password updated successfully." });
      }
    );
  } catch (hashError) {
    console.error("Error hashing new password:", hashError);
    res
      .status(500)
      .json({ message: "Server error during password processing." });
  }
};

// Logged-in user changes their own username
const changeUsernameSelf = (req, res) => {
  const db = getDb(); // Get DB instance inside the function
  const { newUsername, currentPassword } = req.body;
  const userId = req.session.user.id;

  if (!newUsername || !currentPassword) {
    return res
      .status(400)
      .json({ message: "New username and current password are required." });
  }
  if (newUsername.toLowerCase() === "master") {
    return res
      .status(400)
      .json({ message: 'Cannot change username to "master".' });
  }
  if (newUsername === req.session.user.username) {
    return res
      .status(400)
      .json({
        message: "New username cannot be the same as the current username.",
      });
  }

  db.get(
    `SELECT id FROM users WHERE username = ?`,
    [newUsername],
    async (err, existingUser) => {
      if (err) {
        console.error("DB error checking username:", err.message);
        return res.status(500).json({ message: "Server error." });
      }
      if (existingUser) {
        return res
          .status(409)
          .json({ message: "New username is already taken." });
      }

      db.get(
        `SELECT password_hash FROM users WHERE id = ?`,
        [userId],
        async (err, currentUserDb) => {
          // Renamed to avoid conflict
          if (err) {
            console.error("DB error verifying password:", err.message);
            return res.status(500).json({ message: "Server error." });
          }
          if (!currentUserDb) {
            return res.status(404).json({ message: "Current user not found." });
          }

          try {
            const match = await bcrypt.compare(
              currentPassword,
              currentUserDb.password_hash
            );
            if (!match) {
              return res
                .status(401)
                .json({ message: "Incorrect current password." });
            }

            db.run(
              `UPDATE users SET username = ? WHERE id = ?`,
              [newUsername, userId],
              function (err) {
                if (err) {
                  console.error("Error updating username:", err.message);
                  return res
                    .status(500)
                    .json({ message: "Failed to update username." });
                }
                if (this.changes === 0) {
                  return res.status(404).json({ message: "User not found." });
                }

                console.log(
                  `User ${userId} changed username to ${newUsername}`
                );
                req.session.user.username = newUsername; // Update session
                res
                  .status(200)
                  .json({
                    message: "Username updated successfully.",
                    user: req.session.user,
                  });
              }
            );
          } catch (error) {
            console.error("Error during username change:", error);
            res
              .status(500)
              .json({ message: "Server error during username change." });
          }
        }
      );
    }
  );
};

// Master changes another user's username
const changeUsernameMaster = (req, res) => {
  const db = getDb(); // Get DB instance inside the function
  const userIdToUpdate = parseInt(req.params.id, 10);
  const { newUsername } = req.body;

  if (isNaN(userIdToUpdate))
    return res.status(400).json({ message: "Invalid user ID." });
  if (!newUsername)
    return res.status(400).json({ message: "New username is required." });
  if (newUsername.toLowerCase() === "master")
    return res
      .status(400)
      .json({ message: 'Cannot change username to "master".' });

  db.get(
    `SELECT id FROM users WHERE username = ? AND id != ?`,
    [newUsername, userIdToUpdate],
    (err, existingUser) => {
      if (err) {
        console.error("DB error checking username:", err.message);
        return res.status(500).json({ message: "Server error." });
      }
      if (existingUser) {
        return res
          .status(409)
          .json({ message: "New username is already taken." });
      }

      db.run(
        `UPDATE users SET username = ? WHERE id = ? AND username != ?`,
        [newUsername, userIdToUpdate, "master"],
        function (err) {
          if (err) {
            console.error("Error updating username:", err.message);
            return res
              .status(500)
              .json({ message: "Failed to update username." });
          }
          if (this.changes === 0) {
            return res
              .status(404)
              .json({ message: "User not found or cannot be updated." });
          }

          console.log(
            `Master user changed username for ID ${userIdToUpdate} to ${newUsername}`
          );
          res.status(200).json({ message: "Username updated successfully." });
        }
      );
    }
  );
};

module.exports = {
  listUsers,
  addUser,
  deleteUser,
  updateProfile,
  changePassword,
  resetPassword,
  changeUsernameSelf,
  changeUsernameMaster,
};
