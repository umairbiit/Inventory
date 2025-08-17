const express = require("express");
const router = express.Router();
const protect = require("../middlewares/authMiddleware");
const {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
} = require("../controllers/expenseController");

// All routes protected
router.use(protect);

router.post("/", createExpense); // create
router.get("/", getExpenses); // get all
router.get("/:id", getExpenseById); // get one
router.put("/:id", updateExpense); // update
router.delete("/:id", deleteExpense); // delete

module.exports = router;
