const { db, auth } = require('../config/firebase');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');

// Setup Nodemailer transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Register a new user or add profile data after Firebase Auth
exports.registerUser = async (req, res) => {
  try {
    const { email, password, displayName, role, city, registrationNumber, location } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // 1. Create the user in Firebase Auth
    let userRecord;
    try {
      userRecord = await auth.createUser({
        email,
        password,
        displayName: displayName || '',
      });
    } catch (authError) {
      // If user already exists, we might want to just update the DB, or fail
      if (authError.code === 'auth/email-already-exists') {
        userRecord = await auth.getUserByEmail(email);
      } else {
        throw authError;
      }
    }

    const uid = userRecord.uid;
    const userRef = db.ref(`users/${uid}`);

    // Hash the password securely
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const userData = {
      email,
      displayName: displayName || '',
      role: role || 'driver',
      createdAt: new Date().toISOString(),
      passwordHash,
    };

    if (role === 'station') {
      userData.city = city || '';
      userData.registrationNumber = registrationNumber || '';
      userData.location = location || '';
    }

    // 2. Save additional details to Realtime Database
    await userRef.set(userData);
    
    // Don't send password hash to client
    const responseData = { ...userData };
    delete responseData.passwordHash;

    res.status(201).json({
      message: 'User registered successfully',
      uid,
      user: responseData
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: error.message });
  }
};

// Login user (Prototype approach using Admin SDK for email lookup)
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Since this is a prototype and we don't have client SDK password verification configured,
    // we fetch the user by email to retrieve their uid and verify their password hash manually.
    const userRecord = await auth.getUserByEmail(email);
    
    // Fetch profile from RTDB
    const userSnapshot = await db.ref(`users/${userRecord.uid}`).once('value');
    
    if (!userSnapshot.exists()) {
      return res.status(404).json({ error: 'User profile not found in database' });
    }

    const userData = userSnapshot.val();
    
    if (!userData.passwordHash) {
      return res.status(401).json({ error: 'Account requires password reset/re-registration (legacy format).' });
    }

    const isMatch = await bcrypt.compare(password, userData.passwordHash);
    
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid password' });
    }
    
    const responseData = { ...userData };
    delete responseData.passwordHash;
    
    res.status(200).json({
      message: 'Login successful',
      uid: userRecord.uid,
      user: responseData
    });
  } catch (error) {
    console.error('Error logging in:', error);
    if (error.code === 'auth/user-not-found') {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(500).json({ error: error.message });
  }
};

// Get user profile
exports.getUserProfile = async (req, res) => {
  try {
    const { uid } = req.params;

    const userSnapshot = await db.ref(`users/${uid}`).once('value');

    if (!userSnapshot.exists()) {
      return res.status(404).json({ error: 'User not found' });
    }

    const responseData = { ...userSnapshot.val() };
    delete responseData.passwordHash;

    res.status(200).json(responseData);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: error.message });
  }
};

// Update user profile
exports.updateUserProfile = async (req, res) => {
  try {
    const { uid } = req.params;
    const updateData = req.body;

    const userSnapshot = await db.ref(`users/${uid}`).once('value');

    if (!userSnapshot.exists()) {
      return res.status(404).json({ error: 'User not found' });
    }

    await db.ref(`users/${uid}`).update(updateData);

    res.status(200).json({
      message: 'User profile updated successfully',
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ error: error.message });
  }
};

// Securely Update Email/Password
exports.secureUpdate = async (req, res) => {
  try {
    const { uid } = req.params;
    const { email, newPassword, currentPassword, displayName, registrationNumber } = req.body;

    // 1. Verify current user via login simulation
    // We fetch the current user's email and hash from DB
    const userSnapshot = await db.ref(`users/${uid}`).once('value');
    if (!userSnapshot.exists()) {
      return res.status(404).json({ error: 'User not found in database' });
    }
    
    const currentUser = userSnapshot.val();
    const currentUserEmail = currentUser.email;

    if (!currentPassword) {
      return res.status(401).json({ error: 'Current password is required to make security changes' });
    }

    if (currentUser.passwordHash) {
      const isMatch = await bcrypt.compare(currentPassword, currentUser.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid current password' });
      }
    } else {
      return res.status(401).json({ error: 'Legacy account cannot be updated this way' });
    }

    // 2. Update Firebase Auth (Email and Password)
    const updateParams = {};
    if (email && email !== currentUserEmail) updateParams.email = email;
    if (newPassword) updateParams.password = newPassword;

    if (Object.keys(updateParams).length > 0) {
      await auth.updateUser(uid, updateParams);
    }

    // 3. Update Realtime Database
    const dbUpdates = {
      displayName: displayName || userSnapshot.val().displayName,
    };
    if (email) dbUpdates.email = email;
    if (registrationNumber) dbUpdates.registrationNumber = registrationNumber;
    
    if (newPassword) {
      const salt = await bcrypt.genSalt(10);
      dbUpdates.passwordHash = await bcrypt.hash(newPassword, salt);
    }

    await db.ref(`users/${uid}`).update(dbUpdates);

    res.status(200).json({ message: 'Account securely updated' });

  } catch (error) {
    console.error('Error in secure update:', error);
    res.status(500).json({ error: error.message });
  }
};

// Send OTP for email verification
exports.sendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    const encodedEmail = email.replace(/[\.\#\$\[\]]/g, '_');

    const otpRef = db.ref(`otps/${encodedEmail}`);

    await otpRef.set({
      otp,
      email,
      expiresAt: Date.now() + 5 * 60 * 1000,
      createdAt: new Date().toISOString(),
    });

    const mailOptions = {
      from: `"Fuel Tracker App" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Your Verification Code',
      text: `Your verification code is: ${otp}. It will expire in 5 minutes.`,
      html: `
        <h3>Welcome to Fuel Tracker!</h3>
        <p>Your verification code is:</p>
        <h2>${otp}</h2>
        <p>It will expire in 5 minutes.</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      message: 'OTP sent successfully',
    });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ error: error.message });
  }
};

// Verify OTP
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        error: 'Email and OTP are required',
      });
    }

    const encodedEmail = email.replace(/[\.\#\$\[\]]/g, '_');

    const otpSnapshot = await db.ref(`otps/${encodedEmail}`).once('value');

    if (!otpSnapshot.exists()) {
      return res.status(400).json({
        error: 'No OTP found for this email, or it has expired',
      });
    }

    const otpData = otpSnapshot.val();

    if (Date.now() > otpData.expiresAt) {
      await db.ref(`otps/${encodedEmail}`).remove();

      return res.status(400).json({
        error: 'OTP has expired',
      });
    }

    if (otpData.otp !== otp) {
      return res.status(400).json({
        error: 'Invalid OTP',
      });
    }

    await db.ref(`otps/${encodedEmail}`).remove();

    res.status(200).json({
      message: 'OTP verified successfully',
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ error: error.message });
  }
};