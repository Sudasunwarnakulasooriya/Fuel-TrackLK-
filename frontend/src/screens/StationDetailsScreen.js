import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, SafeAreaView, Modal, TextInput, ActivityIndicator, FlatList, Alert, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fontSizes, spacing, radii, shadow } from '../theme/theme';
import { fuelTypes, queueStatus } from '../data/mockData';
import PrimaryButton from '../components/PrimaryButton';
import { useAuth } from '../context/AuthContext';
import * as Location from 'expo-location';
import { GlobalAlertRef } from '../components/GlobalAlert';

export default function StationDetailsScreen({ route, navigation }) {
  const { station, driverCoords } = route.params;
  const { user } = useAuth();
  const status = queueStatus[station.queue] || queueStatus['LOW'];

  const [reviewsModalVisible, setReviewsModalVisible] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [editingReviewId, setEditingReviewId] = useState(null);
  
  // Real-time rating values if updated locally
  const [currentRating, setCurrentRating] = useState(station.rating || "0.0");
  const [currentReviewCount, setCurrentReviewCount] = useState(station.reviews || 0);

  const [realDistance, setRealDistance] = useState(station.distanceKm || 'Calc...');
  const [travelTime, setTravelTime] = useState('Calc...');

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371; 
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const fetchRouteData = async (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return;
    try {
      const res = await fetch(`http://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=false`);
      const data = await res.json();

      if (data.routes && data.routes.length > 0) {
        const distanceMeters = data.routes[0].distance;
        const durationSeconds = data.routes[0].duration;

        const distanceKm = distanceMeters / 1000;
        const timeMins = Math.round(durationSeconds / 60);

        setRealDistance(distanceKm.toFixed(1) + ' km');
        setTravelTime(timeMins > 0 ? `${timeMins} min` : '< 1 min');
      } else {
         // Fallback to Haversine
         const dist = calculateDistance(lat1, lon1, lat2, lon2);
         if (dist !== null) {
           setRealDistance(dist.toFixed(1) + ' km');
           const timeMins = Math.round(dist * 2);
           setTravelTime(timeMins > 0 ? `${timeMins} min` : '< 1 min');
         }
      }
    } catch (err) {
      console.log('OSRM routing error:', err);
      // Fallback
      const dist = calculateDistance(lat1, lon1, lat2, lon2);
      if (dist !== null) {
        setRealDistance(dist.toFixed(1) + ' km');
        const timeMins = Math.round(dist * 2);
        setTravelTime(timeMins > 0 ? `${timeMins} min` : '< 1 min');
      }
    }
  };

  useEffect(() => {
    // Immediately calculate using driverCoords from HomeScreen for instantly snappy UI
    if (driverCoords && station.location) {
      fetchRouteData(driverCoords.lat, driverCoords.lng, station.location.lat, station.location.lng);
    }

    let locationSubscription = null;

    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      try {
        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 10000,
            distanceInterval: 50,
          },
          (location) => {
            const lat1 = location.coords.latitude;
            const lon1 = location.coords.longitude;
            const lat2 = station.location?.lat;
            const lon2 = station.location?.lng;
            fetchRouteData(lat1, lon1, lat2, lon2);
          }
        );
      } catch (error) {
        console.error('Error watching location:', error);
      }
    })();

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, [station.location, driverCoords]);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoadingReviews(true);
      const apiUrl = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/stations/${station.id}/reviews`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data);
        
        if (data.length > 0) {
          const totalRating = data.reduce((sum, r) => sum + r.rating, 0);
          setCurrentRating((totalRating / data.length).toFixed(1));
          setCurrentReviewCount(data.length);
        } else {
          setCurrentRating('0.0');
          setCurrentReviewCount(0);
        }
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoadingReviews(false);
    }
  };

  const submitReview = async () => {
    if (newRating === 0) {
      Alert.alert('Rating Required', 'Please select a star rating.');
      return;
    }

    try {
      setSubmittingReview(true);
      const apiUrl = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';
      
      const method = editingReviewId ? 'PUT' : 'POST';
      const endpoint = editingReviewId 
        ? `${apiUrl}/api/stations/${station.id}/reviews/${editingReviewId}`
        : `${apiUrl}/api/stations/${station.id}/reviews`;

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.uid || 'anonymous',
          userName: user?.displayName || 'Driver',
          rating: newRating,
          comment: newComment
        })
      });

      if (res.ok) {
        const data = await res.json();
        
        if (editingReviewId) {
          // Update the existing review in the list
          setReviews(reviews.map(r => r.id === editingReviewId ? data.review : r));
          
          // Re-fetch to get correct average rating from backend
          fetchReviews();
          Alert.alert('Success', 'Your review has been updated!');
        } else {
          setReviews([data.review, ...reviews]);
          fetchReviews(); // Re-fetch to guarantee correct sync
          Alert.alert('Success', 'Your review has been added!');
        }

        setNewRating(0);
        setNewComment('');
        setEditingReviewId(null);
      } else {
        const err = await res.json();
        Alert.alert('Error', err.error || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      Alert.alert('Error', 'Network error while submitting review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleEditReview = (review) => {
    setEditingReviewId(review.id);
    setNewRating(review.rating);
    setNewComment(review.comment || '');
  };

  const cancelEdit = () => {
    setEditingReviewId(null);
    setNewRating(0);
    setNewComment('');
  };

  const deleteReview = async (reviewId) => {
    const doDelete = async () => {
      try {
        setLoadingReviews(true);
        const apiUrl = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';
        const res = await fetch(`${apiUrl}/api/stations/${station.id}/reviews/${reviewId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user?.uid })
        });

        if (res.ok) {
          setReviews(reviews.filter(r => r.id !== reviewId));
          fetchReviews(); // To update the average stats
          if (editingReviewId === reviewId) {
            cancelEdit();
          }
        } else {
          const err = await res.json();
          Alert.alert('Error', err.error || 'Failed to delete review');
        }
      } catch (error) {
        console.error('Error deleting review:', error);
        Alert.alert('Error', 'Network error while deleting review');
      } finally {
        setLoadingReviews(false);
      }
    };

    GlobalAlertRef.current?.confirm(
      "Delete Review",
      "Are you sure you want to delete your review?",
      doDelete
    );
  };


  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        <View style={styles.heroWrap}>
          <Image source={{ uri: station.image }} style={styles.hero} />
          <View style={styles.heroOverlay} />
          <SafeAreaView style={styles.heroTopBar}>
            <TouchableOpacity style={styles.circleBtn} onPress={() => navigation.goBack()}>
              <MaterialIcons name="arrow-back" size={20} color={colors.white} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.circleBtn}>
              <MaterialIcons name="favorite-border" size={20} color={colors.white} />
            </TouchableOpacity>
          </SafeAreaView>
          <View style={styles.heroBottomBadge}>
            <View style={[styles.statusDot, { backgroundColor: status.color }]} />
            <Text style={styles.heroBottomText}>{status.label}</Text>
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{station.name}</Text>
              <View style={styles.metaRow}>
                <MaterialIcons name="place" size={14} color={colors.textSecondary} />
                <Text style={styles.metaText}>{station.address}</Text>
              </View>
            </View>
            <View style={[styles.openPill, { backgroundColor: station.isOpen ? colors.primaryTint : colors.surfaceMuted }]}>
              <Text style={[styles.openPillText, { color: station.isOpen ? colors.primary : colors.textMuted }]}>
                {station.isOpen ? 'Open Now' : 'Closed'}
              </Text>
            </View>
          </View>

          {/* Stats row */}
          <View style={styles.statsRow}>
            <TouchableOpacity style={styles.statBox} onPress={() => setReviewsModalVisible(true)}>
              <MaterialIcons name="star" size={18} color="#F2A93B" />
              <Text style={styles.statValue}>{currentRating}</Text>
              <Text style={styles.statLabel}>{currentReviewCount} reviews</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <MaterialIcons name="directions-car" size={18} color={colors.primary} />
              <Text style={styles.statValue}>{realDistance}</Text>
              <Text style={styles.statLabel}>away</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <MaterialIcons name="hourglass-bottom" size={18} color={colors.primary} />
              <Text style={styles.statValue}>{travelTime}</Text>
              <Text style={styles.statLabel}>travel time</Text>
            </View>
          </View>

          {/* Availability */}
          <Text style={styles.sectionTitle}>Fuel Availability</Text>
          <View style={styles.fuelGrid}>
            {fuelTypes.map((type) => {
              const available = station.availability ? station.availability[type.id] : false;
              return (
                <View key={type.id} style={styles.fuelItem}>
                  <View
                    style={[
                      styles.fuelIconCircle,
                      { backgroundColor: available ? colors.primaryTint : colors.surfaceMuted },
                    ]}
                  >
                    <MaterialIcons
                      name={type.icon}
                      size={18}
                      color={available ? colors.primary : colors.textMuted}
                    />
                  </View>
                  <Text style={styles.fuelItemLabel}>{type.label}</Text>
                  <Text style={[styles.fuelItemStatus, { color: available ? colors.success : colors.danger }]}>
                    {available ? 'Available' : 'Out of stock'}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Queue info card */}
          <View style={styles.queueCard}>
            <View>
              <Text style={styles.queueCardLabel}>Current Queue</Text>
              <Text style={styles.queueCardValue}>{station.queueCount} vehicles</Text>
            </View>
            <View style={styles.queueCardRight}>
              <Text style={styles.queueCardUpdated}>Updated {station.lastUpdated}</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Best time to visit</Text>
          <View style={styles.predictionCard}>
            <MaterialIcons name="auto-awesome" size={20} color={colors.primary} />
            <Text style={styles.predictionText}>
              AI prediction: queues are usually shortest between 1:00 PM – 3:00 PM today.
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <PrimaryButton
          title="Navigate"
          variant="outline"
          icon={<MaterialIcons name="navigation" size={18} color={colors.textPrimary} />}
          style={{ flex: 1 }}
          onPress={() => navigation.navigate('TrackQueue', { stationId: station.id })}
        />
      </View>

      {/* Reviews Modal */}
      <Modal
        visible={reviewsModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setReviewsModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setReviewsModalVisible(false)} style={styles.closeBtn}>
              <MaterialIcons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Reviews</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.addReviewSection}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.addReviewTitle}>{editingReviewId ? "Edit Review" : "Leave a Review"}</Text>
              {editingReviewId && (
                <TouchableOpacity onPress={cancelEdit}>
                  <Text style={{ color: colors.danger, fontSize: fontSizes.sm, fontWeight: '600' }}>Cancel</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setNewRating(star)}>
                  <MaterialIcons
                    name={star <= newRating ? "star" : "star-border"}
                    size={32}
                    color="#F2A93B"
                  />
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.reviewInput}
              placeholder="Write your comment here..."
              value={newComment}
              onChangeText={setNewComment}
              multiline
              numberOfLines={3}
            />
            <PrimaryButton
              title={submittingReview ? "Submitting..." : (editingReviewId ? "Update Review" : "Submit Review")}
              onPress={submitReview}
              disabled={submittingReview}
              style={{ marginTop: spacing.sm }}
            />
          </View>

          <View style={styles.reviewsListContainer}>
            <Text style={styles.sectionTitle}>Past Reviews</Text>
            {loadingReviews ? (
              <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
            ) : reviews.length === 0 ? (
              <Text style={styles.noReviewsText}>No reviews yet. Be the first!</Text>
            ) : (
              <FlatList
                data={reviews}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: spacing.xxl }}
                renderItem={({ item }) => (
                  <View style={styles.reviewCard}>
                    <View style={styles.reviewHeader}>
                      <View style={styles.reviewAvatar}>
                        <Text style={styles.reviewAvatarText}>{item.userName ? item.userName.charAt(0).toUpperCase() : 'U'}</Text>
                      </View>
                      <View style={styles.reviewMeta}>
                        <Text style={styles.reviewAuthor}>{item.userName || 'Anonymous'}</Text>
                        <View style={{ flexDirection: 'row' }}>
                          {[...Array(5)].map((_, i) => (
                            <MaterialIcons
                              key={i}
                              name={i < item.rating ? "star" : "star-border"}
                              size={14}
                              color="#F2A93B"
                            />
                          ))}
                        </View>
                      </View>
                      <View style={styles.reviewDateContainer}>
                        <Text style={styles.reviewDate}>
                          {new Date(item.createdAt).toLocaleDateString()}
                        </Text>
                        {item.updatedAt && (
                          <Text style={styles.editedTag}>(Edited)</Text>
                        )}
                      </View>
                      {item.userId === user?.uid && (
                        <View style={styles.reviewActions}>
                          <TouchableOpacity onPress={() => handleEditReview(item)} style={styles.actionBtn}>
                            <MaterialIcons name="edit" size={16} color={colors.primary} />
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => deleteReview(item.id)} style={styles.actionBtn}>
                            <MaterialIcons name="delete-outline" size={16} color={colors.danger} />
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                    {!!item.comment && (
                      <Text style={styles.reviewCommentText}>{item.comment}</Text>
                    )}
                  </View>
                )}
              />
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  heroWrap: {
    height: 280,
    position: 'relative',
  },
  hero: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  heroTopBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  circleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBottomBadge: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radii.pill,
    ...shadow.card,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  heroBottomText: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  body: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  name: {
    fontSize: fontSizes.lg,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  metaText: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    flex: 1,
  },
  openPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.pill,
  },
  openPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
    ...shadow.card,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.border,
  },
  statValue: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 2,
  },
  statLabel: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  sectionTitle: {
    fontSize: fontSizes.md,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  fuelGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: spacing.lg,
  },
  fuelItem: {
    width: '31%',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingVertical: spacing.sm + 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fuelIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  fuelItemLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  fuelItemStatus: {
    fontSize: 9,
    fontWeight: '700',
    marginTop: 2,
  },
  queueCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.primaryTint,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  queueCardLabel: {
    fontSize: fontSizes.xs,
    color: colors.primaryDark,
  },
  queueCardValue: {
    fontSize: fontSizes.md,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  queueCardRight: {
    alignItems: 'flex-end',
  },
  queueCardUpdated: {
    fontSize: 10,
    color: colors.primaryDark,
    opacity: 0.7,
    marginBottom: 4,
  },
  reportLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reportLinkText: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    color: colors.primary,
  },
  predictionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  predictionText: {
    flex: 1,
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
    lineHeight: 19,
  },
  bottomBar: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.white,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  modalTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  closeBtn: {
    padding: 4,
  },
  addReviewSection: {
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  addReviewTitle: {
    fontSize: fontSizes.md,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: spacing.md,
  },
  reviewInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  reviewsListContainer: {
    flex: 1,
    padding: spacing.lg,
  },
  noReviewsText: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  reviewCard: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: radii.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  reviewAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  reviewAvatarText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: fontSizes.md,
  },
  reviewMeta: {
    flex: 1,
  },
  reviewAuthor: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  reviewDate: {
    fontSize: 10,
    color: colors.textMuted,
  },
  reviewCommentText: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  reviewDateContainer: {
    alignItems: 'flex-end',
  },
  editedTag: {
    fontSize: 9,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginTop: 2,
  },
  reviewActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginLeft: spacing.sm,
  },
  actionBtn: {
    padding: 4,
  }
});
