const express = require('express');
const router = express.Router();
const queueController = require('../controllers/queueController');

// POST /api/queues/reports
router.post('/reports', queueController.submitQueueReport);

// GET /api/queues/stations/:id/reports
router.get('/stations/:id/reports', queueController.getQueueReportsForStation);

module.exports = router;
