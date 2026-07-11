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

// Add a review to a station
exports.addReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, userName, rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Valid rating between 1 and 5 is required' });
    }

    // Stations are stored as users with role='station'
    const stationRef = db.ref(`users/${id}`);
    const stationSnapshot = await stationRef.once('value');
    
    if (!stationSnapshot.exists() || stationSnapshot.val().role !== 'station') {
      return res.status(404).json({ error: 'Station not found' });
    }

    const station = stationSnapshot.val();
    
    // Add new review
    const newReviewRef = db.ref(`users/${id}/reviewsList`).push();
    const reviewData = {
      id: newReviewRef.key,
      userId: userId || 'anonymous',
      userName: userName || 'Anonymous',
      rating: Number(rating),
      comment: comment || '',
      createdAt: new Date().toISOString()
    };
    await newReviewRef.set(reviewData);

    // Recalculate average rating
    let currentReviews = station.reviews || 0;
    let currentRating = station.rating || 0.0;
    
    const newReviewsCount = currentReviews + 1;
    const newRating = ((currentRating * currentReviews) + Number(rating)) / newReviewsCount;

    await stationRef.update({
      rating: Number(newRating.toFixed(1)),
      reviews: newReviewsCount
    });

    res.status(201).json({ message: 'Review added successfully', review: reviewData });
  } catch (error) {
    console.error('Error adding review:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get reviews for a station
exports.getReviews = async (req, res) => {
  try {
    const { id } = req.params;
    const reviewsSnapshot = await db.ref(`users/${id}/reviewsList`).once('value');
    
    if (!reviewsSnapshot.exists()) {
      return res.status(200).json([]);
    }

    const reviews = [];
    reviewsSnapshot.forEach((child) => {
      reviews.push(child.val());
    });

    // Sort by newest first
    reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: error.message });
  }
};

// Update a review
exports.updateReview = async (req, res) => {
  try {
    const { id, reviewId } = req.params;
    const { rating, comment, userId } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Valid rating between 1 and 5 is required' });
    }

    const stationRef = db.ref(`users/${id}`);
    const stationSnapshot = await stationRef.once('value');
    
    if (!stationSnapshot.exists() || stationSnapshot.val().role !== 'station') {
      return res.status(404).json({ error: 'Station not found' });
    }

    const reviewRef = db.ref(`users/${id}/reviewsList/${reviewId}`);
    const reviewSnapshot = await reviewRef.once('value');

    if (!reviewSnapshot.exists()) {
      return res.status(404).json({ error: 'Review not found' });
    }

    const oldReview = reviewSnapshot.val();

    // Verify ownership
    if (oldReview.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized to edit this review' });
    }

    const station = stationSnapshot.val();
    let currentReviews = station.reviews || 0;
    let currentRating = station.rating || 0.0;

    // Recalculate rating
    const newRating = ((currentRating * currentReviews) - oldReview.rating + Number(rating)) / currentReviews;

    await stationRef.update({
      rating: Number(newRating.toFixed(1))
    });

    // Update review data
    const updatedReview = {
      ...oldReview,
      rating: Number(rating),
      comment: comment || '',
      updatedAt: new Date().toISOString()
    };
    
    await reviewRef.update(updatedReview);

    res.status(200).json({ message: 'Review updated successfully', review: updatedReview });
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({ error: error.message });
  }
};

// Delete a review
exports.deleteReview = async (req, res) => {
  try {
    const { id, reviewId } = req.params;
    const { userId } = req.body; // Can also pass as query param or from auth token

    const stationRef = db.ref(`users/${id}`);
    const stationSnapshot = await stationRef.once('value');
    
    if (!stationSnapshot.exists() || stationSnapshot.val().role !== 'station') {
      return res.status(404).json({ error: 'Station not found' });
    }

    const reviewRef = db.ref(`users/${id}/reviewsList/${reviewId}`);
    const reviewSnapshot = await reviewRef.once('value');

    if (!reviewSnapshot.exists()) {
      return res.status(404).json({ error: 'Review not found' });
    }

    const oldReview = reviewSnapshot.val();

    // Verify ownership
    if (userId && oldReview.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized to delete this review' });
    }

    const station = stationSnapshot.val();
    let currentReviews = station.reviews || 0;
    let currentRating = station.rating || 0.0;

    // Recalculate rating
    const newReviewsCount = Math.max(0, currentReviews - 1);
    let newRating = 0.0;
    if (newReviewsCount > 0) {
      newRating = ((currentRating * currentReviews) - oldReview.rating) / newReviewsCount;
    }

    await stationRef.update({
      rating: Number(newRating.toFixed(1)),
      reviews: newReviewsCount
    });

    await reviewRef.remove();

    res.status(200).json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ error: error.message });
  }
};
