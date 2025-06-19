const express = require("express");
const protect = require("../middlewares/authmiddleware");
const {
  logOut,
  loginStatus,
  changePassword,
  login,
  getUserDetails,
  registerAdmin,
  registerUser,
} = require("../controllers/authController");
const router = express.Router();

router.post("/auth/register/admin", registerAdmin);
router.post("/register", registerUser);
router.post("/login", login);
router.get("/change-password", protect, changePassword);
router.get("/loggedin-status", loginStatus);
router.get("/logout", protect, logOut);
router.get("/user-details", protect, getUserDetails);

module.exports = router;
