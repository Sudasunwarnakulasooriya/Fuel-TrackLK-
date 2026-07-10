import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, SafeAreaView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fontSizes, spacing, radii, shadow } from '../theme/theme';
import { fuelStations, fuelTypes, queueStatus } from '../data/mockData';
import PrimaryButton from '../components/PrimaryButton';
import { getHourlyPredictions, getBestTimeToVisit } from '../services/predictionService';

export default function StationDetailsScreen({ route, navigation }) {
  const { stationId } = route.params;
  const station = fuelStations.find((s) => s.id === stationId) || fuelStations[0];
  const status = queueStatus[station.queue];

  const [bestTime, setBestTime] = useState(null);
  const [miniChartData, setMiniChartData] = useState([]);

  useEffect(() => {
    async function fetchPredictions() {
      try {
        const [btResult, hourlyResult] = await Promise.all([
          getBestTimeToVisit(station.id, station.queueCount),
          getHourlyPredictions(station.id, station.queueCount),
        ]);
        setBestTime(btResult);
        // Get 6AM–10PM for mini chart
        const chartData = (hourlyResult.hourlyPredictions || []).filter(
          (h) => h.hour >= 6 && h.hour <= 22
        );
        setMiniChartData(chartData);
      } catch (e) {
        console.warn('Prediction fetch failed:', e);
      }
    }
    fetchPredictions();
  }, [station.id]);

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
            <View style={styles.statBox}>
              <MaterialIcons name="star" size={18} color="#F2A93B" />
              <Text style={styles.statValue}>{station.rating}</Text>
              <Text style={styles.statLabel}>{station.reviews} reviews</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <MaterialIcons name="directions-car" size={18} color={colors.primary} />
              <Text style={styles.statValue}>{station.distanceKm} km</Text>
              <Text style={styles.statLabel}>away</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <MaterialIcons name="hourglass-bottom" size={18} color={colors.primary} />
              <Text style={styles.statValue}>{station.waitMinutes} min</Text>
              <Text style={styles.statLabel}>wait time</Text>
            </View>
          </View>

          {/* Availability */}
          <Text style={styles.sectionTitle}>Fuel Availability</Text>
          <View style={styles.fuelGrid}>
            {fuelTypes.map((type) => {
              const available = station.availability[type.id];
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
              <TouchableOpacity
                style={styles.reportLink}
                onPress={() => navigation.navigate('ReportQueue', { stationId: station.id })}
              >
                <Text style={styles.reportLinkText}>Report queue</Text>
                <MaterialIcons name="arrow-forward" size={14} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.sectionTitle}>AI Queue Prediction</Text>
          <View style={styles.predictionCard}>
            <View style={styles.predictionHeader}>
              <View style={styles.predictionIconCircle}>
                <MaterialIcons name="auto-awesome" size={16} color={colors.primary} />
              </View>
              <View style={styles.predictionAiBadge}>
                <MaterialIcons name="memory" size={9} color={colors.white} />
                <Text style={styles.predictionAiBadgeText}>AI</Text>
              </View>
            </View>
            <Text style={styles.predictionLabel}>Best time to visit today</Text>
            <Text style={styles.predictionTimeValue}>
              {bestTime?.bestTimeWindow?.startLabel || '1:00 PM'} –{' '}
              {bestTime?.bestTimeWindow?.endLabel || '3:00 PM'}
            </Text>
            <Text style={styles.predictionText}>
              {bestTime?.recommendation || 'AI prediction: queues are usually shortest in the afternoon.'}
            </Text>
          </View>

          {/* Mini Hourly Chart */}
          {miniChartData.length > 0 && (
            <View style={styles.miniChartCard}>
              <Text style={styles.miniChartTitle}>Today's Queue Forecast</Text>
              <View style={styles.miniChartRow}>
                {miniChartData.map((item, i) => {
                  const maxW = Math.max(...miniChartData.map(d => d.estimatedWaitMinutes), 1);
                  const barH = Math.max((item.estimatedWaitMinutes / maxW) * 50, 2);
                  const barColor = item.estimatedWaitMinutes < 10 ? colors.success
                    : item.estimatedWaitMinutes < 25 ? colors.warning : colors.danger;
                  return (
                    <View key={i} style={styles.miniBarWrap}>
                      <View style={[styles.miniBar, { height: barH, backgroundColor: barColor }]} />
                    </View>
                  );
                })}
              </View>
              <View style={styles.miniChartLabels}>
                <Text style={styles.miniChartLabel}>6AM</Text>
                <Text style={styles.miniChartLabel}>12PM</Text>
                <Text style={styles.miniChartLabel}>6PM</Text>
                <Text style={styles.miniChartLabel}>10PM</Text>
              </View>
            </View>
          )}
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
        <PrimaryButton
          title="Report Queue"
          style={{ flex: 1.4 }}
          onPress={() => navigation.navigate('ReportQueue', { stationId: station.id })}
        />
      </View>
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
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  predictionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  predictionIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  predictionAiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.primary,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radii.pill,
  },
  predictionAiBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: 0.5,
  },
  predictionLabel: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  predictionTimeValue: {
    fontSize: fontSizes.lg,
    fontWeight: '800',
    color: colors.textPrimary,
    marginVertical: 2,
  },
  predictionText: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    lineHeight: 17,
  },
  miniChartCard: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  miniChartTitle: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  miniChartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 55,
    gap: 2,
  },
  miniBarWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
  },
  miniBar: {
    width: '65%',
    borderRadius: 2,
    minHeight: 2,
  },
  miniChartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  miniChartLabel: {
    fontSize: 8,
    color: colors.textMuted,
  },
  bottomBar: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.white,
  },
});
