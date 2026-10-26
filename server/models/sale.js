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

    // ✅ Payment History (New)
    payments: [
      {
        amount: { type: Number, required: true },
        date: { type: Date, default: Date.now },
        note: { type: String, default: "" },
      },
    ],

    // ✅ Payment Status
    paymentStatus: {
      type: String,
      enum: ["paid", "partial", "unpaid"],
      default: "unpaid",
    },

    // No schema default here on purpose: a default is also applied when an
    // existing document that lacks the field is loaded, which made legacy
    // sales (dated only by `date`) look like they were made "now". New sales
    // get saleDate in the pre("validate") hook below instead.
    saleDate: {
      type: Date,
    },

    // Legacy field: older sales were dated by `date` only. Kept read-only so
    // those documents still resolve to their real date.
    date: {
      type: Date,
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

// Indexes used by the sales list, reports and dashboard aggregations
SaleSchema.index({ user: 1, saleDate: -1 });
SaleSchema.index({ user: 1, paymentStatus: 1 });

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

// 🔹 Effective sale date for any document: saleDate ?? date ?? createdAt
SaleSchema.statics.effectiveDate = (s) =>
  (s && (s.saleDate || s.date || s.createdAt)) || null;

// 🔹 Loaded legacy documents: resolve saleDate from date/createdAt (never "now")
SaleSchema.post("init", function () {
  if (!this.saleDate) {
    const d = this.date || this.createdAt;
    if (d) this.saleDate = d;
  }
});

// 🔹 New documents: saleDate defaults to the creation time
SaleSchema.pre("validate", function (next) {
  if (!this.saleDate) this.saleDate = this.date || (this.isNew ? new Date() : this.createdAt);
  next();
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
