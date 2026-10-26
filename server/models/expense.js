const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: 0,
    },
    // No schema default (it would also be applied when loading an old
    // document without a date, making it look like it was spent "now").
    // New expenses get the current time in the pre("validate") hook below.
    date: {
      type: Date,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true, // optional: track who created it
    },
  },
  { timestamps: true }
);

expenseSchema.index({ user: 1, date: -1 });

// Loaded documents without a date resolve to their creation time
expenseSchema.post("init", function () {
  if (!this.date && this.createdAt) this.date = this.createdAt;
});

// New documents: date defaults to now
expenseSchema.pre("validate", function (next) {
  if (!this.date) this.date = this.isNew ? new Date() : this.createdAt || new Date();
  next();
});

module.exports = mongoose.model("Expense", expenseSchema);
