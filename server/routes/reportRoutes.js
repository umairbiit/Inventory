const express = require("express");
const router = express.Router();
const protect = require("../middlewares/authMiddleware");
const { getProfitLoss, getDashboard, getSummary } = require("../controllers/reportController");

router.use(protect);

router.get("/profit-loss", getProfitLoss);
router.get("/dashboard", getDashboard);
router.get("/summary", getSummary);

module.exports = router;
