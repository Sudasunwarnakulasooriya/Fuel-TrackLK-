const { db, auth } = require('../config/firebase');
const nodemailer = require('nodemailer');
const dns = require('dns');

// Force Node.js to use IPv4 first for all DNS lookups to fix Render's IPv6 ENETUNREACH error
dns.setDefaultResultOrder('ipv4first');
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
  // Force IPv4 to prevent ENETUNREACH on Render's free tier
  family: 4
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
      // If user already exists, prevent overwriting
      if (authError.code === 'auth/email-already-exists') {
        return res.status(400).json({ error: 'An account with this email already exists.' });
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

    // Removed existence check to allow mock users (u1) to save profile pictures
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
    const { email, newPassword, currentPassword, displayName, registrationNumber, location, address } = req.body;

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
    if (location) dbUpdates.location = location;
    if (address) dbUpdates.address = address;
    
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

// Reset Password (using OTP)
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: 'Email, OTP, and new password are required' });
    }

    const encodedEmail = email.replace(/[\.\#\$\[\]]/g, '_');
    const otpSnapshot = await db.ref(`otps/${encodedEmail}`).once('value');

    if (!otpSnapshot.exists()) {
      return res.status(400).json({ error: 'No valid OTP found for this email, or it has expired' });
    }

    const otpData = otpSnapshot.val();
    if (Date.now() > otpData.expiresAt) {
      await db.ref(`otps/${encodedEmail}`).remove();
      return res.status(400).json({ error: 'OTP has expired' });
    }

    if (otpData.otp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    // OTP is valid. Now find the user by email
    const usersSnapshot = await db.ref('users').orderByChild('email').equalTo(email).once('value');
    if (!usersSnapshot.exists()) {
      return res.status(404).json({ error: 'User not found' });
    }

    const users = usersSnapshot.val();
    const uid = Object.keys(users)[0];

    // Update Firebase Auth password if possible, and DB hash
    try {
      await auth.updateUser(uid, { password: newPassword });
    } catch (e) {
      console.warn("Could not update Firebase Auth user password:", e.message);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);
    await db.ref(`users/${uid}`).update({ passwordHash });

    // Clear the OTP
    await db.ref(`otps/${encodedEmail}`).remove();

    res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get all stations
exports.getAllStations = async (req, res) => {
  try {
    const snapshot = await db.ref('users').once('value');
    if (!snapshot.exists()) {
      return res.status(200).json([]);
    }
    
    const users = snapshot.val();
    const stations = Object.keys(users)
      .map(key => ({ id: key, ...users[key] }))
      .filter(user => user.role === 'station')
      .map(station => {
        delete station.passwordHash;
        return station;
      });
      
    res.status(200).json(stations);
  } catch (error) {
    console.error('Error fetching stations:', error);
    res.status(500).json({ error: error.message });
  }
};

// Update station status (fuel, queue)
exports.updateStationStatus = async (req, res) => {
  try {
    const { uid } = req.params;
    const { isOpen, availability, queueStatus, queueCount } = req.body;

    const userSnapshot = await db.ref(`users/${uid}`).once('value');
    if (!userSnapshot.exists()) {
      return res.status(404).json({ error: 'Station not found' });
    }

    const updateData = {
      isOpen: isOpen !== undefined ? isOpen : true,
      lastUpdated: new Date().toISOString()
    };
    
    if (availability) updateData.availability = availability;
    if (queueStatus) updateData.queueStatus = queueStatus;
    if (queueCount) updateData.queueCount = queueCount;

    await db.ref(`users/${uid}`).update(updateData);

    res.status(200).json({ message: 'Station status updated successfully' });
  } catch (error) {
    console.error('Error updating station status:', error);
    res.status(500).json({ error: error.message });
  }
};

// Handle support contact forms
exports.sendSupportEmail = async (req, res) => {
  try {
    const { name, email, message, userRole } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Default recipient is the app owner/smtp user
    const toEmail = process.env.SMTP_USER || 'sudasunwarnakulasooriya@gmail.com';

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: toEmail,
      subject: `New Support Request from Fuel TrackLK App`,
      html: `
        <h3>New Support Request</h3>
        <p><strong>Name:</strong> ${name || 'Unknown'}</p>
        <p><strong>Email:</strong> ${email || 'Not provided'}</p>
        <p><strong>Role:</strong> ${userRole || 'Driver'}</p>
        <hr />
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Support email sent successfully' });
  } catch (error) {
    console.error('Error sending support email:', error);
    res.status(500).json({ error: 'Failed to send support email' });
  }
};

// Toggle a saved station for a user
exports.toggleSavedStation = async (req, res) => {
  try {
    const { uid } = req.params;
    const { stationId } = req.body;

    if (!stationId) {
      return res.status(400).json({ error: 'Station ID is required' });
    }

    const userRef = db.ref(`users/${uid}`);
    const userSnapshot = await userRef.once('value');

    if (!userSnapshot.exists()) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userSnapshot.val();
    let savedStations = userData.savedStations || [];

    if (savedStations.includes(stationId)) {
      // Remove it
      savedStations = savedStations.filter(id => id !== stationId);
    } else {
      // Add it
      savedStations.push(stationId);
    }

    await userRef.update({ savedStations });

    res.status(200).json({
      message: 'Saved stations updated successfully',
      savedStations
    });
  } catch (error) {
    console.error('Error toggling saved station:', error);
    res.status(500).json({ error: error.message });
  }
};