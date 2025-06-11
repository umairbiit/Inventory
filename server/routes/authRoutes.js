const express = require("express");
const protect = require("../middlewares/authmiddleware");
const {
  logOut,
  loginStatus,
  changePassword,
  login,
  getUserDetails,
} = require("../controllers/userController");
const router = express.Router();

router.post("/login", login);
router.get("/change-password", protect, changePassword);
router.get("/loggedin-status", loginStatus);
router.get("/logout", protect, logOut);
router.get("/user-details", protect, getUserDetails);
