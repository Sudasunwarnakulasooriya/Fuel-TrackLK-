const express = require('express');
const router = express.Router();
const stationController = require('../controllers/stationController');

// POST /api/stations
router.post('/', stationController.addStation);

// GET /api/stations
router.get('/', stationController.getAllStations);

// GET /api/stations/:id
router.get('/:id', stationController.getStationById);

module.exports = router;
