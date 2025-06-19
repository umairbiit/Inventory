const jwt = require("jsonwebtoken");
const sendEmail = require("../utils/sendEmail");
const loadHtmlTemplate = require("../utils/loadHtmlTemplate");

const sendVerificationEmail = async (user) => {
  const token = jwt.sign({ id: user._id }, process.env.EMAIL_SECRET, {
    expiresIn: "1d",
  });

  const link = `${process.env.FRONTEND_URL}/verify-email/${token}`;

  const html = loadHtmlTemplate("verification", {
    name: user.name,
    link: link,
  });

  await sendEmail({
    to: user.email,
    subject: "Verify your Email - MERN Auth Boilerplate",
    html,
  });
};

module.exports = sendVerificationEmail;
