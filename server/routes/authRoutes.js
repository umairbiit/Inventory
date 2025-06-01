const express = require("express");
const protect = require("../middlewares/authmiddleware");
const {
  logOut,
  loginStatus,
  changePassword,
} = require("../controllers/userController");
const router = express.Router();

router.get("/change-password", protect, changePassword);
router.get("/loggedin-status", loginStatus);
router.get("/logout", protect, logOut);
