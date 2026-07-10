const express = require('express');
const router = express.Router();
const predictionController = require('../controllers/predictionController');

// POST /api/predictions/station — Single station prediction
router.post('/station', predictionController.getStationPrediction);

// POST /api/predictions/bulk — Multi-station predictions
router.post('/bulk', predictionController.getBulkPredictions);

// GET /api/predictions/hourly/:stationId — Hourly predictions chart data
router.get('/hourly/:stationId', predictionController.getHourlyPredictions);

// GET /api/predictions/best-time/:stationId — Best time to visit
router.get('/best-time/:stationId', predictionController.getBestTime);

module.exports = router;
