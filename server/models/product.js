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
    stock: {
      type: Number,
      default: 0, // current stock quantity
      min: 0,
    },
    category: {
      type: String,
      default: "General",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Product", productSchema);
