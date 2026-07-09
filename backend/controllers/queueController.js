const { db } = require('../config/firebase');

// Submit a new queue report
exports.submitQueueReport = async (req, res) => {
  try {
    const { stationId, userId, fuelType, vehicleType, estimatedWaitTime, queueLength } = req.body;

    const reportData = {
      stationId,
      userId,
      fuelType,
      vehicleType,
      estimatedWaitTime: estimatedWaitTime || 0, // in minutes
      queueLength: queueLength || 'short', // short, medium, long
      reportedAt: new Date().toISOString()
    };

    const newReportRef = db.ref('queueReports').push();
    await newReportRef.set(reportData);

    // Additionally, you could update the station's latest queue status here
    await db.ref(`fuelStations/${stationId}/latestQueueStatus`).update({
      estimatedWaitTime: reportData.estimatedWaitTime,
      queueLength: reportData.queueLength,
      lastUpdated: reportData.reportedAt
    });

    res.status(201).json({ message: 'Queue report submitted successfully', reportId: newReportRef.key });
  } catch (error) {
    console.error('Error submitting queue report:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get queue reports for a specific station
exports.getQueueReportsForStation = async (req, res) => {
  try {
    const { stationId } = req.params;
    
    // We can filter reports by stationId
    const reportsRef = db.ref('queueReports');
    const reportsSnapshot = await reportsRef.orderByChild('stationId').equalTo(stationId).once('value');
    
    const reports = [];
    reportsSnapshot.forEach((childSnapshot) => {
      reports.push({
        id: childSnapshot.key,
        ...childSnapshot.val()
      });
    });

    res.status(200).json(reports);
  } catch (error) {
    console.error('Error fetching queue reports:', error);
    res.status(500).json({ error: error.message });
  }
};
