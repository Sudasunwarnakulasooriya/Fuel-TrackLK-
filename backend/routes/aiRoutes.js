const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

// POST & GET /api/ai/predict
router.post('/predict', aiController.getQueuePredictions);
router.get('/predict', aiController.getQueuePredictions);

module.exports = router;
