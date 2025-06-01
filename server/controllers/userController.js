const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const loginStatus = asyncHandler(async (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    res.json(false);
  }
  const verified = jwt.verify(token, process.env.JWT_SECRET);
  if (verified) {
    const user = await User.findById(verified.id).select("-password");
    if (user) {
      res.json({
        verified: true,
        id: verified.id,
        status: user.status,
        user: user,
        token: token,
      });
    }
  }

  return res.json(false);
});

const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const user = await User.findById(verified.id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const isMatch = await bcrypt.compare(oldPassword, user.password);
  if (!isMatch) {
    return res.status(400).json({ message: "Old password is incorrect" });
  }

  user.password = newPassword;
  await user.save();

  return res.status(200).json({ message: "Password changed successfully" });
});

const logOut = asyncHandler(async (req, res) => {
  res.cookie("token", "", {
    path: "/",
    httpOnly: true,
    expires: new Date(0),
    sameSite: "none",
    secure: true,
  });
  return res.status(200).json({ message: "Successfully Logged Out" });
});

module.exports = {
  changePassword,
  loginStatus,
  logOut,
};
