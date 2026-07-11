const express = require('express');
const router = express.Router();
const stationController = require('../controllers/stationController');

// POST /api/stations
router.post('/', stationController.addStation);

// GET /api/stations
router.get('/', stationController.getAllStations);

// GET /api/stations/:id
router.get('/:id', stationController.getStationById);

// POST /api/stations/:id/reviews
router.post('/:id/reviews', stationController.addReview);

// GET /api/stations/:id/reviews
router.get('/:id/reviews', stationController.getReviews);

// PUT /api/stations/:id/reviews/:reviewId
router.put('/:id/reviews/:reviewId', stationController.updateReview);

// DELETE /api/stations/:id/reviews/:reviewId
router.delete('/:id/reviews/:reviewId', stationController.deleteReview);

module.exports = router;
