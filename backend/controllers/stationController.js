const { db } = require('../config/firebase');

// Add a new fuel station
exports.addStation = async (req, res) => {
  try {
    const { name, location, address, contactNumber, facilities } = req.body;

    const newStationRef = db.ref('fuelStations').push();
    const stationData = {
      id: newStationRef.key,
      name,
      location: location || { lat: 0, lng: 0 },
      address: address || '',
      contactNumber: contactNumber || '',
      facilities: facilities || [], // Array of facilities e.g. ['washroom', 'minimart']
      createdAt: new Date().toISOString()
    };

    await newStationRef.set(stationData);
    res.status(201).json({ message: 'Station added successfully', station: stationData });
  } catch (error) {
    console.error('Error adding station:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get all fuel stations
exports.getAllStations = async (req, res) => {
  try {
    const stationsSnapshot = await db.ref('fuelStations').once('value');
    const stations = [];
    
    stationsSnapshot.forEach((childSnapshot) => {
      stations.push({
        id: childSnapshot.key,
        ...childSnapshot.val()
      });
    });

    res.status(200).json(stations);
  } catch (error) {
    console.error('Error fetching stations:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get specific station details
exports.getStationById = async (req, res) => {
  try {
    const { id } = req.params;
    const stationSnapshot = await db.ref(`fuelStations/${id}`).once('value');
    
    if (!stationSnapshot.exists()) {
      return res.status(404).json({ error: 'Station not found' });
    }

    res.status(200).json({ id: stationSnapshot.key, ...stationSnapshot.val() });
  } catch (error) {
    console.error('Error fetching station details:', error);
    res.status(500).json({ error: error.message });
  }
};
