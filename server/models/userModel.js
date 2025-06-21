const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please add a name!"],
    },
    email: {
      type: String,
      unique: true,
      required: [true, "Please add an email!"],
    },
    status: {
      type: String,
      enum: ["verified", "unverified"],
      default: "unverified",
      required: [true, "Please specify user status!"],
    },
    type: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
      required: [true, "Please specify user type!"],
    },
    phoneno: {
      type: String,
      unique: true,
      required: [true, "Please add a phone number!"],
    },
    password: {
      type: String,
      required: [true, "Password is required!"],
    },
    resetPasswordToken: {
      type: String,
      default: null,
    },
    resetPasswordExpires: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Encrypt Password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const User = mongoose.model("User", userSchema);

module.exports = User;
