import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    costPrice: {
      type: Number,
      required: [true, "Cost price is required"],
      min: 0,
    },
    salePrice: {
      type: Number,
      required: [true, "Sale price is required"],
      min: 0,
    },
    retailPrice: {
      type: Number,
      required: [true, "Retail price is required"],
      min: 0,
    },
    stock: {
      type: Number,
      default: 0, // current stock quantity
      min: 0,
    },
    category: {
      type: String,
      default: "General",
    },
    expirationDate: {
      type: Date,
      default: null,
    },
    datePurchased: {
      type: Date,
      default: null,
    },
    batchNumber: {
      type: String,
      default: "",
    },
    imported: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Product || mongoose.model("Product", productSchema);
