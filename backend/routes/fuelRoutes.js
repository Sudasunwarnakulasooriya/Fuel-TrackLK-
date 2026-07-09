const express = require('express');
const router = express.Router();
const fuelController = require('../controllers/fuelController');

// PUT /api/fuel/stations/:id/availability
router.put('/stations/:id/availability', fuelController.updateFuelAvailability);

// GET /api/fuel/stations/:id/availability
router.get('/stations/:id/availability', fuelController.getFuelAvailability);

// POST /api/fuel/prices
router.post('/prices', fuelController.addFuelPrice);

// GET /api/fuel/prices
router.get('/prices', fuelController.getFuelPrices);

module.exports = router;
