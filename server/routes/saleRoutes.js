const express = require("express");
const router = express.Router();
const protect = require("../middlewares/authMiddleware");
const {
  createSale,
  getSales,
  deleteSale,
} = require("../controllers/saleController");

// All routes protected
router.use(protect);

router.post("/", createSale);
router.get("/", getSales);
router.delete("/:id", deleteSale);

module.exports = router;
