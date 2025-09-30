const express = require("express");
const router = express.Router();
const {
  createProduct,
  getProducts,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");
const protect = require("../middlewares/authMiddleware");

// Only protect create, update, delete routes
router.post("/", protect, createProduct);
router.get("/", getProducts); // open route
router.put("/:id", protect, updateProduct);
router.delete("/:id", protect, deleteProduct);

module.exports = router;
