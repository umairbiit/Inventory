const express = require("express");
const protect = require("../middlewares/authmiddleware");
const { logOut } = require("../controllers/userController");
const router = express.Router();

router.get("/logout", protect, logOut);
