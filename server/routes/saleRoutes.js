const express = require("express");
const router = express.Router();
const protect = require("../middlewares/authMiddleware");
const {
  createSale,
  getSales,
  deleteSale,
  updateSalePayment
} = require("../controllers/saleController");

// All routes protected
router.use(protect);

router.post("/", createSale);
router.get("/", getSales);
router.delete("/:id", deleteSale);
router.patch("/:id/payment", updateSalePayment);

module.exports = router;
