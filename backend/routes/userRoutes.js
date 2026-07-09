const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// POST /api/users/register
router.post('/register', userController.registerUser);

// POST /api/users/login
router.post('/login', userController.loginUser);

// POST /api/users/send-otp
router.post('/send-otp', userController.sendOtp);

// POST /api/users/verify-otp
router.post('/verify-otp', userController.verifyOtp);


// GET /api/users/:uid
router.get('/:uid', userController.getUserProfile);

// PUT /api/users/:uid
router.put('/:uid', userController.updateUserProfile);

// POST /api/users/:uid/secure-update
router.post('/:uid/secure-update', userController.secureUpdate);

module.exports = router;
