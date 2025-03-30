const express = require("express");
const userController = require("../controllers/userController");
const { requireLogin, requireMaster } = require("../middleware/auth");

const router = express.Router();

// Profile routes (require login) - Mounted under /api in server.js
router.put("/profile", requireLogin, userController.updateProfile); // Path is now relative to /api
router.put(
  "/profile/username", // Path is now relative to /api
  requireLogin,
  userController.changeUsernameSelf
);
router.put(
  "/profile/password", // Path is now relative to /api
  requireLogin,
  userController.changePassword
);

// User management routes (require master) - Mounted under /api in server.js
router.get("/users", requireMaster, userController.listUsers); // Path is now relative to /api
router.post("/users", requireMaster, userController.addUser); // Path is now relative to /api
router.delete("/users/:id", requireMaster, userController.deleteUser); // Path is now relative to /api
router.put(
  "/users/:id/password", // Path is now relative to /api
  requireMaster,
  userController.resetPassword
);
router.put(
  "/users/:id/username", // Path is now relative to /api
  requireMaster,
  userController.changeUsernameMaster
);

module.exports = router;
