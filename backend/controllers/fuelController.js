const { db } = require('../config/firebase');

// Update fuel availability for a station
exports.updateFuelAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { fuelType, isAvailable, litersAvailable, updatedBy } = req.body;

    const availabilityRef = db.ref(`fuelAvailability/${id}/${fuelType}`);
    await availabilityRef.update({
      isAvailable,
      litersAvailable: litersAvailable || 0,
      updatedAt: new Date().toISOString(),
      updatedBy: updatedBy || 'admin'
    });

    res.status(200).json({ message: 'Fuel availability updated successfully' });
  } catch (error) {
    console.error('Error updating fuel availability:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get current availability for a station
exports.getFuelAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const availabilitySnapshot = await db.ref(`fuelAvailability/${id}`).once('value');
    
    if (!availabilitySnapshot.exists()) {
      return res.status(200).json({});
    }

    res.status(200).json(availabilitySnapshot.val());
  } catch (error) {
    console.error('Error fetching fuel availability:', error);
    res.status(500).json({ error: error.message });
  }
};

// Add new fuel price record
exports.addFuelPrice = async (req, res) => {
  try {
    const { fuelType, pricePerLiter, effectiveDate } = req.body;
    
    const newPriceRef = db.ref('fuelPrices').push();
    const priceData = {
      fuelType,
      pricePerLiter,
      effectiveDate: effectiveDate || new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    await newPriceRef.set(priceData);
    res.status(201).json({ message: 'Fuel price added successfully', price: priceData });
  } catch (error) {
    console.error('Error adding fuel price:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get current fuel prices
exports.getFuelPrices = async (req, res) => {
  try {
    const pricesSnapshot = await db.ref('fuelPrices').once('value');
    const prices = [];
    
    pricesSnapshot.forEach((childSnapshot) => {
      prices.push({
        id: childSnapshot.key,
        ...childSnapshot.val()
      });
    });

    res.status(200).json(prices);
  } catch (error) {
    console.error('Error fetching fuel prices:', error);
    res.status(500).json({ error: error.message });
  }
};
