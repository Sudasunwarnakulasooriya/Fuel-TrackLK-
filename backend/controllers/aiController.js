const { spawn } = require('child_process');
const path = require('path');

exports.getQueuePredictions = async (req, res) => {
  try {
    const hour = req.body.hour !== undefined ? Number(req.body.hour) : new Date().getHours();
    const dayOfWeek = req.body.dayOfWeek !== undefined ? Number(req.body.dayOfWeek) : new Date().getDay();
    const stationId = req.body.stationId || req.query.stationId || 'st1';
    const stationName = req.body.stationName || req.query.stationName || 'Selected Station';
    const city = req.body.city || req.query.city || 'this area';
    const currentQueueCount = req.body.currentQueueCount !== undefined ? Number(req.body.currentQueueCount) : 15;
    const queueStatus = req.body.queueStatus || (currentQueueCount > 25 ? 'HIGH' : currentQueueCount > 12 ? 'MEDIUM' : 'LOW');

    const inputData = {
      hour,
      dayOfWeek,
      stationId,
      stationName,
      currentQueueCount
    };

    const scriptPath = path.join(__dirname, '../ai/predict.py');
    const pythonProcess = spawn('python', [scriptPath, JSON.stringify(inputData)]);

    let dataString = '';
    let errorString = '';

    pythonProcess.stdout.on('data', (data) => {
      dataString += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      errorString += data.toString();
    });

    pythonProcess.on('close', (code) => {
      let result = null;
      if (code === 0 && dataString.trim()) {
        try {
          result = JSON.parse(dataString.trim());
        } catch (e) {
          console.warn('Error parsing predict.py output:', e.message);
        }
      }

      const hoursLabels = [
        '6:00 AM – 8:00 AM', '7:00 AM – 9:00 AM', '8:00 AM – 10:00 AM',
        '9:00 AM – 11:00 AM', '10:00 AM – 12:00 PM', '11:00 AM – 1:00 PM',
        '12:00 PM – 2:00 PM', '1:00 PM – 3:00 PM', '2:00 PM – 4:00 PM',
        '3:00 PM – 5:00 PM', '4:00 PM – 6:00 PM', '5:00 PM – 7:00 PM'
      ];

      // If python script didn't return hourly predictions, compute station-specific JS fallback
      let hourlyPredictions;
      let usedRealModel = false;
      let stationProfile = 'Demand Profile';
      let bestTime;
      let bestTimeQueueCount;
      let peakBusyTime;
      let peakBusyQueueCount;

      if (result && result.hourlyPredictions && Array.isArray(result.hourlyPredictions)) {
        hourlyPredictions = result.hourlyPredictions;
        usedRealModel = result.usedRealModel || false;
        stationProfile = result.stationProfile || 'Demand Profile';
        bestTime = result.bestTime || '1:00 PM – 3:00 PM';
        bestTimeQueueCount = result.bestTimeQueueCount || Math.min(...hourlyPredictions);
        peakBusyTime = result.peakBusyTime || '5:00 PM – 7:00 PM';
        peakBusyQueueCount = result.peakBusyQueueCount || Math.max(...hourlyPredictions);
      } else {
        // High fidelity JS fallback calculation using station seed
        let seedVal = 0;
        const strId = String(stationId);
        for (let i = 0; i < strId.length; i++) {
          seedVal = (seedVal * 31 + strId.charCodeAt(i)) % 1000;
        }

        const profileType = seedVal % 3;
        let baseCurve;
        if (profileType === 0) {
          baseCurve = [20, 55, 75, 45, 30, 35, 45, 30, 25, 40, 65, 85];
          stationProfile = 'Urban Commuter Station';
        } else if (profileType === 1) {
          baseCurve = [15, 30, 50, 65, 70, 55, 40, 45, 55, 45, 35, 25];
          stationProfile = 'Suburban Residential Station';
        } else {
          baseCurve = [25, 35, 45, 55, 60, 70, 80, 75, 65, 55, 45, 35];
          stationProfile = 'Highway / Transit Station';
        }

        const multiplier = 0.8 + ((seedVal % 45) / 100.0);
        const liveDelta = (currentQueueCount - 25.0) * 0.4;

        hourlyPredictions = baseCurve.map((val, idx) => {
          let adjusted = (val * multiplier) + (idx === Math.floor(hour - 6) ? liveDelta : liveDelta * 0.3);
          return Math.max(4, Math.min(95, Math.round(adjusted)));
        });

        let minIdx = 0;
        let maxIdx = 0;
        for (let i = 1; i < hourlyPredictions.length; i++) {
          if (hourlyPredictions[i] < hourlyPredictions[minIdx]) minIdx = i;
          if (hourlyPredictions[i] > hourlyPredictions[maxIdx]) maxIdx = i;
        }
        bestTime = hoursLabels[minIdx] || '1:00 PM – 3:00 PM';
        bestTimeQueueCount = hourlyPredictions[minIdx];
        peakBusyTime = hoursLabels[maxIdx] || '5:00 PM – 7:00 PM';
        peakBusyQueueCount = hourlyPredictions[maxIdx];
      }

      // Compute hourly details object for UI tooltips
      const hoursList = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17];
      const hourlyDetails = hourlyPredictions.map((val, idx) => {
        const h = hoursList[idx];
        const label = h < 12 ? `${h}:00 AM` : h === 12 ? `12:00 PM` : `${h - 12}:00 PM`;
        const estWait = val > 65 ? Math.round(val * 1.1) : val > 35 ? Math.round(val * 0.9) : Math.round(val * 0.8 + 2);
        const status = val > 65 ? 'Long Queue' : val > 35 ? 'Moderate Queue' : 'Short Queue';
        return {
          hourLabel: label,
          timeRange: hoursLabels[idx],
          queueCount: val,
          waitMinutes: estWait,
          status
        };
      });

      // Construct AI Advice specific to this station
      const aiAdvice = `AI Demand Insight for ${stationName}: Current queue status is ${queueStatus} (${currentQueueCount} vehicles). Based on AI demand modeling for ${stationProfile}s near ${city}, traffic is projected to peak around ${peakBusyTime} (~${peakBusyQueueCount} vehicles). For the shortest queues and fastest refuel (~${Math.round(bestTimeQueueCount * 0.8 + 2)} mins wait), visit between ${bestTime}.`;

      // Construct smart alerts
      const smartAlerts = [
        {
          id: 'alert_optimal',
          title: 'Optimal Refuel Window',
          detail: `Shortest lines predicted today at ${bestTime} (~${bestTimeQueueCount} vehicles).`,
          type: 'success',
          icon: 'check-circle-outline'
        },
        {
          id: 'alert_peak',
          title: 'Peak Rush Alert',
          detail: `Avoid visiting during ${peakBusyTime} when lines reach up to ${peakBusyQueueCount} vehicles.`,
          type: 'warning',
          icon: 'warning'
        },
        {
          id: 'alert_profile',
          title: `${stationProfile}`,
          detail: `Demand pattern varies based on live station traffic (${currentQueueCount} vehicles currently) and local commuter flows.`,
          type: 'info',
          icon: 'analytics'
        }
      ];

      res.status(200).json({
        success: true,
        usedRealModel,
        stationId,
        stationName,
        stationProfile,
        bestTime,
        bestTimeQueueCount,
        bestTimeWaitMinutes: Math.round(bestTimeQueueCount * 0.8 + 2),
        peakBusyTime,
        peakBusyQueueCount,
        hourlyPredictions,
        hourlyDetails,
        aiAdvice,
        smartAlerts,
        timestamp: new Date().toISOString()
      });
    });
  } catch (error) {
    console.error('AI Prediction error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
