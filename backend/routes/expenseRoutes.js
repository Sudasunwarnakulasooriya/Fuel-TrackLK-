const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');

// POST /api/expenses
router.post('/', expenseController.addExpense);

// GET /api/expenses/users/:uid
router.get('/users/:uid', expenseController.getUserExpenses);

module.exports = router;
