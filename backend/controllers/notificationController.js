const { messaging } = require('../config/firebase');

// Send push notification via FCM
exports.sendNotification = async (req, res) => {
  try {
    const { token, title, body, data } = req.body;

    if (!token || !title || !body) {
      return res.status(400).json({ error: 'FCM token, title, and body are required' });
    }

    const message = {
      notification: {
        title,
        body
      },
      data: data || {},
      token
    };

    // If messaging is initialized and service account is valid
    if(messaging) {
      const response = await messaging.send(message);
      res.status(200).json({ message: 'Notification sent successfully', messageId: response });
    } else {
      res.status(500).json({ error: 'Firebase messaging is not configured properly' });
    }

  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({ error: error.message });
  }
};
