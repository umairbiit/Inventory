const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "24h",
  });
};

// Login Controller
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find the user by email
  const user = await User.findOne({ email });

  if (!user) {
    return res.status(400).json({ message: "Invalid email or password" });
  }

  // Check if password matches
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).json({ message: "Invalid email or password" });
  }

  // Generate JWT token
  const token = generateToken(user._id);

  // Set cookie with token
  res.cookie("token", token, {
    path: "/",
    httpOnly: true,
    expires:
      user.type === "user"
        ? new Date(Date.now() + 1000 * 86400) // 24 hours
        : new Date(Date.now() + 1000 * 7200), // 2 hours
    sameSite: "none",
    secure: true,
  });

  // Return user data without password
  return res.status(200).json({
    message: "Login successful",
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      type: user.type,
      phoneno: user.phoneno,
    },
    token,
  });
});

// Middleware to check if the user is logged in
// and to verify the JWT token
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

// Change Password Controller
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

// Log Out Controller
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
  login,
  changePassword,
  loginStatus,
  logOut,
};
