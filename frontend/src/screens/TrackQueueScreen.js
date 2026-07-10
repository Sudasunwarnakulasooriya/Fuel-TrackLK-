import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fontSizes, spacing, radii, shadow } from '../theme/theme';
import { fuelStations } from '../data/mockData';

export default function TrackQueueScreen({ route, navigation }) {
  const { stationId } = route.params;
  const station = fuelStations.find((s) => s.id === stationId) || fuelStations[0];

  return (
    <View style={styles.container}>
      {/* Fake map background */}
      <View style={styles.mapBg}>
        {Array.from({ length: 6 }).map((_, i) => (
          <View key={i} style={[styles.mapLineH, { top: 60 + i * 80 }]} />
        ))}
        {Array.from({ length: 5 }).map((_, i) => (
          <View key={i} style={[styles.mapLineV, { left: 50 + i * 70 }]} />
        ))}

        <View style={styles.routeLine} />

        <View style={[styles.pin, styles.pinStation]}>
          <MaterialIcons name="local-gas-station" size={18} color={colors.white} />
        </View>
        <View style={[styles.pin, styles.pinUser]}>
          <MaterialIcons name="my-location" size={14} color={colors.white} />
        </View>
      </View>

      <SafeAreaView style={styles.topBar}>
        <TouchableOpacity style={styles.circleBtn} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.topTitleWrap}>
          <Text style={styles.topTitle}>Live Queue Tracking</Text>
        </View>
        <TouchableOpacity style={styles.circleBtn}>
          <MaterialIcons name="layers" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
      </SafeAreaView>

      <View style={styles.sheet}>
        <View style={styles.sheetHandle} />

        <View style={styles.etaRow}>
          <View style={styles.etaIconCircle}>
            <MaterialIcons name="schedule" size={22} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.etaTime}>{station.waitMinutes}-{station.waitMinutes + 5} min</Text>
            <Text style={styles.etaLabel}>Estimated wait at {station.name}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.stationRow}>
          <Image source={{ uri: station.image }} style={styles.stationThumb} />
          <View style={{ flex: 1 }}>
            <Text style={styles.stationName}>{station.name}</Text>
            <Text style={styles.stationAddress}>{station.address}</Text>
          </View>
          <TouchableOpacity style={styles.callBtn}>
            <MaterialIcons name="call" size={18} color={colors.white} />
          </TouchableOpacity>
        </View>

        <View style={styles.queueStatsRow}>
          <View style={styles.queueStat}>
            <Text style={styles.queueStatValue}>{station.queueCount}</Text>
            <Text style={styles.queueStatLabel}>vehicles ahead</Text>
          </View>
          <View style={styles.queueStat}>
            <Text style={styles.queueStatValue}>{station.distanceKm} km</Text>
            <Text style={styles.queueStatLabel}>distance</Text>
          </View>
          <View style={styles.queueStat}>
            <Text style={styles.queueStatValue}>{station.lastUpdated}</Text>
            <Text style={styles.queueStatLabel}>last update</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EFEAE3',
  },
  mapBg: {
    flex: 1,
    overflow: 'hidden',
  },
  mapLineH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#DED7CC',
  },
  mapLineV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: '#DED7CC',
  },
  routeLine: {
    position: 'absolute',
    top: 140,
    left: 90,
    width: 160,
    height: 220,
    borderWidth: 3,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    borderRadius: 80,
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  pin: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.white,
    ...shadow.card,
  },
  pinStation: {
    backgroundColor: colors.primary,
    top: 130,
    left: 75,
  },
  pinUser: {
    backgroundColor: colors.textPrimary,
    width: 28,
    height: 28,
    borderRadius: 14,
    bottom: 230,
    right: 80,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
  },
  topTitleWrap: {
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radii.pill,
    ...shadow.card,
  },
  topTitle: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    ...shadow.card,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  etaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  etaIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  etaTime: {
    fontSize: fontSizes.lg,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  etaLabel: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  stationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: spacing.md,
  },
  stationThumb: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
  },
  stationName: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  stationAddress: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  callBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  queueStatsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.lg,
    paddingVertical: spacing.sm + 4,
  },
  queueStat: {
    flex: 1,
    alignItems: 'center',
  },
  queueStatValue: {
    fontSize: fontSizes.base,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  queueStatLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
