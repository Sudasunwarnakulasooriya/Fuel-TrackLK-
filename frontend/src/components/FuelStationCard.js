import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, radii, fontSizes, spacing, shadow } from '../theme/theme';
import { queueStatus } from '../data/mockData';
import { getStationPrediction } from '../services/predictionService';

export default function FuelStationCard({ station, onPress }) {
  const status = queueStatus[station.queue];
  const [predictedWait, setPredictedWait] = useState(null);

  useEffect(() => {
    if (station.isOpen) {
      getStationPrediction(station.id, station.queueCount)
        .then((result) => {
          if (result?.prediction) {
            setPredictedWait(Math.round(result.prediction.estimatedWaitMinutes));
          }
        })
        .catch(() => {});
    }
  }, [station.id]);

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={styles.card}>
      <Image source={{ uri: station.image }} style={styles.image} />
      <View style={styles.info}>
        <View style={styles.topRow}>
          <Text style={styles.name} numberOfLines={1}>{station.name}</Text>
          <View style={[styles.openBadge, { backgroundColor: station.isOpen ? colors.primaryTint : colors.surfaceMuted }]}>
            <Text style={[styles.openText, { color: station.isOpen ? colors.primary : colors.textMuted }]}>
              {station.isOpen ? 'Open' : 'Closed'}
            </Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <MaterialIcons name="place" size={14} color={colors.textSecondary} />
          <Text style={styles.metaText}>{station.distanceKm} km · {station.address}</Text>
        </View>

        <View style={styles.bottomRow}>
          <View style={styles.queueRow}>
            <View style={[styles.dot, { backgroundColor: status.color }]} />
            <Text style={styles.queueText}>{status.label} · {station.waitMinutes} min</Text>
          </View>
          <View style={styles.rightBadges}>
            {predictedWait !== null && (
              <View style={styles.aiBadge}>
                <MaterialIcons name="auto-awesome" size={9} color={colors.primary} />
                <Text style={styles.aiBadgeText}>AI ~{predictedWait}m</Text>
              </View>
            )}
            <View style={styles.ratingRow}>
              <MaterialIcons name="star" size={14} color="#F2A93B" />
              <Text style={styles.ratingText}>{station.rating}</Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadow.card,
  },
  image: {
    width: 92,
    height: '100%',
    minHeight: 110,
  },
  info: {
    flex: 1,
    padding: spacing.sm + 4,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  name: {
    flex: 1,
    fontSize: fontSizes.base,
    fontWeight: '700',
    color: colors.textPrimary,
    marginRight: 6,
  },
  openBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.pill,
  },
  openText: {
    fontSize: 10,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  metaText: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    flex: 1,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  queueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  queueText: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  rightBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.primaryTint,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.pill,
  },
  aiBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.primary,
  },
});
