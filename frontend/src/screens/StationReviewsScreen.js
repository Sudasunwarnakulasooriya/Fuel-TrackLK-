import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, ActivityIndicator, TouchableOpacity, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fontSizes, spacing, radii } from '../theme/theme';
import { useAuth } from '../context/AuthContext';
import ScreenHeader from '../components/ScreenHeader';

export default function StationReviewsScreen({ navigation }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [avgRating, setAvgRating] = useState('0.0');
  const [reviewCount, setReviewCount] = useState(0);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const apiUrl = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/stations/${user.uid}/reviews`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data);
        
        if (data.length > 0) {
          const totalRating = data.reduce((sum, r) => sum + r.rating, 0);
          setAvgRating((totalRating / data.length).toFixed(1));
          setReviewCount(data.length);
        } else {
          setAvgRating('0.0');
          setReviewCount(0);
        }
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderReview = ({ item }) => (
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
        <Text style={styles.reviewDate}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
      {!!item.comment && (
        <Text style={styles.reviewCommentText}>{item.comment}</Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="Station Reviews" onBack={() => navigation.goBack()} />
      <View style={styles.content}>
        
        {!loading && reviews.length > 0 && (
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryTitle}>Overall Rating</Text>
            <View style={styles.summaryRow}>
              <MaterialIcons name="star" size={36} color="#F2A93B" />
              <Text style={styles.summaryAvg}>{avgRating}</Text>
            </View>
            <Text style={styles.summaryCount}>Based on {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}</Text>
          </View>
        )}

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xl }} />
        ) : reviews.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="star-outline" size={64} color={colors.border} />
            <Text style={styles.emptyText}>No reviews yet.</Text>
            <Text style={styles.emptySubtext}>When drivers leave reviews, they will appear here.</Text>
          </View>
        ) : (
          <FlatList
            data={reviews}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
            renderItem={renderReview}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  listContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyText: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  emptySubtext: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
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
  summaryContainer: {
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.xl,
    margin: spacing.lg,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryTitle: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  summaryAvg: {
    fontSize: 48,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  summaryCount: {
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
  }
});
