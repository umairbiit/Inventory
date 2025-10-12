const mongoose = require("mongoose");
const { Schema } = mongoose;

const SaleItemSchema = new Schema(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    salePrice: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const SaleSchema = new Schema(
  {
    invoiceNumber: {
      type: String,
      required: true, // or false if you want it optional
      unique: true, // optional, but good to prevent duplicates
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },

    // ✅ Sale Items
    items: {
      type: [SaleItemSchema],
      validate: (arr) => Array.isArray(arr) && arr.length > 0,
    },

    // ✅ How much the customer paid at the time of sale
    initialPayment: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ✅ Total received so far (can include later installments)
    paymentReceived: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ✅ Payment Status
    paymentStatus: {
      type: String,
      enum: ["paid", "partial", "unpaid"],
      default: "unpaid",
    },

    date: {
      type: Date,
      default: Date.now,
    },

    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// 🔹 Virtual totalAmount
SaleSchema.virtual("totalAmount").get(function () {
  return (this.items || []).reduce(
    (sum, it) => sum + it.quantity * it.salePrice,
    0
  );
});

// 🔹 Virtual balance (how much still due)
SaleSchema.virtual("balance").get(function () {
  // paymentReceived should at least include initialPayment
  const received = Math.max(this.paymentReceived || 0, 0);
  return Math.max(this.totalAmount - received, 0);
});

// 🔹 Before save: automatically set paymentReceived if not set
SaleSchema.pre("save", function (next) {
  // ensure paymentReceived includes initialPayment at least once
  if (this.isNew && this.initialPayment > 0 && this.paymentReceived === 0) {
    this.paymentReceived = this.initialPayment;
  }

  // now set status
  if (this.paymentReceived >= this.totalAmount) {
    this.paymentStatus = "paid";
  } else if (this.paymentReceived > 0) {
    this.paymentStatus = "partial";
  } else {
    this.paymentStatus = "unpaid";
  }
  next();
});

module.exports = mongoose.models.Sale || mongoose.model("Sale", SaleSchema);
