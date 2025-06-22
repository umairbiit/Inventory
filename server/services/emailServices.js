const jwt = require("jsonwebtoken");
const sendEmail = require("../utils/sendEmail");
const loadHtmlTemplate = require("../utils/loadHtmlTemplate");

const sendVerificationEmail = async (user) => {
  const token = jwt.sign({ id: user._id }, process.env.EMAIL_SECRET, {
    expiresIn: "1d",
  });

  const link = `${process.env.FRONTEND_URL}/verify-email/${token}`;

  const html = loadHtmlTemplate("verificationEmail", {
    name: user.name,
    link: link,
  });

  await sendEmail({
    to: user.email,
    subject: "Verify your Email - MERN Auth Boilerplate",
    html,
  });
};

const sendVerifySuccessEmail = async (user) => {
  const html = loadHtmlTemplate("verifySuccessEmail", {
    name: user.name,
  });

  await sendEmail({
    to: user.email,
    subject: "Email Verified Successfully - MERN Auth Boilerplate",
    html,
  });
};

const sendPasswordResetEmail = async (user) => {
  const token = jwt.sign({ id: user._id }, process.env.EMAIL_SECRET, {
    expiresIn: "15m",
  });

  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

  const html = loadHtmlTemplate("passwordResetEmail", {
    name: user.name,
    link: resetLink,
  });

  await sendEmail({
    to: user.email,
    subject: "Reset Your Password - MERN Auth Boilerplate",
    html,
  });
};

const sendResetSuccessEmail = async (user) => {
  const html = loadHtmlTemplate("resetSuccessEmail", {
    name: user.name,
  });

  await sendEmail({
    to: user.email,
    subject: "Password Reset Successful - MERN Auth Boilerplate",
    html,
  });
};

module.exports = {
  sendVerificationEmail,
  sendVerifySuccessEmail,
  sendPasswordResetEmail,
  sendResetSuccessEmail,
};
