const { db } = require('../config/firebase');

// Add a new fuel expense record for a user
exports.addExpense = async (req, res) => {
  try {
    const { userId, stationId, fuelType, litersFilled, totalCost, receiptImage } = req.body;

    if (!userId || !totalCost) {
      return res.status(400).json({ error: 'User ID and totalCost are required' });
    }

    const expenseData = {
      userId,
      stationId: stationId || '',
      fuelType: fuelType || '',
      litersFilled: litersFilled || 0,
      totalCost,
      receiptImage: receiptImage || '',
      date: new Date().toISOString()
    };

    const newExpenseRef = db.ref('userExpenses').push();
    await newExpenseRef.set(expenseData);

    res.status(201).json({ message: 'Expense added successfully', expenseId: newExpenseRef.key });
  } catch (error) {
    console.error('Error adding expense:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get expense history for a specific user
exports.getUserExpenses = async (req, res) => {
  try {
    const { uid } = req.params;
    
    const expensesRef = db.ref('userExpenses');
    const expensesSnapshot = await expensesRef.orderByChild('userId').equalTo(uid).once('value');
    
    const expenses = [];
    expensesSnapshot.forEach((childSnapshot) => {
      expenses.push({
        id: childSnapshot.key,
        ...childSnapshot.val()
      });
    });

    res.status(200).json(expenses);
  } catch (error) {
    console.error('Error fetching user expenses:', error);
    res.status(500).json({ error: error.message });
  }
};
