const express = require("express");
const router = express.Router();
const protect = require("../middlewares/authMiddleware");
const { getProfitLoss } = require("../controllers/reportController");

router.use(protect);

router.get("/profit-loss", getProfitLoss);

module.exports = router;
