import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fontSizes, spacing, radii, shadow } from '../theme/theme';
import ScreenHeader from '../components/ScreenHeader';
import { fuelStations } from '../data/mockData';
import {
  getHourlyPredictions,
  getBestTimeToVisit,
  getBulkPredictions,
} from '../services/predictionService';

// Chart hours to display (6 AM – 10 PM)
const CHART_START = 6;
const CHART_END = 22;

export default function PredictionsScreen() {
  const [loading, setLoading] = useState(true);
  const [selectedStation, setSelectedStation] = useState(fuelStations[0]);
  const [hourlyData, setHourlyData] = useState([]);
  const [bestTime, setBestTime] = useState(null);
  const [bulkPredictions, setBulkPredictions] = useState([]);
  const [selectedBar, setSelectedBar] = useState(null);
  const [fadeAnim] = useState(new Animated.Value(0));

  const fetchPredictions = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all prediction data in parallel
      const [hourlyResult, bestTimeResult, bulkResult] = await Promise.all([
        getHourlyPredictions(selectedStation.id, selectedStation.queueCount),
        getBestTimeToVisit(selectedStation.id, selectedStation.queueCount),
        getBulkPredictions(
          fuelStations
            .filter((s) => s.isOpen)
            .map((s) => ({ stationId: s.id, queueCount: s.queueCount }))
        ),
      ]);

      // Filter hourly data to chart range
      const chartData = (hourlyResult.hourlyPredictions || []).filter(
        (h) => h.hour >= CHART_START && h.hour <= CHART_END
      );
      setHourlyData(chartData);
      setBestTime(bestTimeResult);
      setBulkPredictions(bulkResult.predictions || []);
    } catch (e) {
      console.error('Failed to fetch predictions:', e);
    } finally {
      setLoading(false);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [selectedStation]);

  useEffect(() => {
    fetchPredictions();
  }, [fetchPredictions]);

  const maxWait = Math.max(...hourlyData.map((h) => h.estimatedWaitMinutes), 1);

  const getBarColor = (wait) => {
    if (wait < 10) return colors.success;
    if (wait < 25) return colors.warning;
    return colors.danger;
  };

  const getStatusIcon = (status) => {
    if (status === 'LOW') return 'trending-down';
    if (status === 'HIGH') return 'trending-up';
    return 'trending-flat';
  };

  const getStatusColor = (status) => {
    if (status === 'LOW') return colors.success;
    if (status === 'HIGH') return colors.danger;
    return colors.warning;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenHeader title="Fuel Analytics" subtitle="AI-powered predictions" />
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Generating AI predictions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="Fuel Analytics" subtitle="AI-powered predictions" />

      <Animated.ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        style={{ opacity: fadeAnim }}
      >
        {/* ── Hero: Best Time to Visit ────────────────────── */}
        <View style={styles.heroCard}>
          <View style={styles.heroRow}>
            <View style={styles.heroIconCircle}>
              <MaterialIcons name="auto-awesome" size={20} color={colors.primary} />
            </View>
            <View style={styles.aiBadge}>
              <MaterialIcons name="memory" size={10} color={colors.white} />
              <Text style={styles.aiBadgeText}>AI Model</Text>
            </View>
          </View>
          <Text style={styles.heroTitle}>Best time to visit today</Text>
          <Text style={styles.heroValue}>
            {bestTime?.bestTimeWindow?.startLabel || '1:00 PM'} –{' '}
            {bestTime?.bestTimeWindow?.endLabel || '3:00 PM'}
          </Text>
          <Text style={styles.heroSub}>
            {bestTime?.recommendation || 'Predicted shortest queues across nearby stations'}
          </Text>
          {bestTime?.currentPrediction && (
            <View style={styles.heroCurrentWrap}>
              <MaterialIcons name="schedule" size={14} color="rgba(255,255,255,0.8)" />
              <Text style={styles.heroCurrentText}>
                Right now: ~{Math.round(bestTime.currentPrediction.estimatedWaitMinutes)} min wait
              </Text>
            </View>
          )}
        </View>

        {/* ── Station Selector ────────────────────────────── */}
        <Text style={styles.sectionTitle}>Select Station</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.stationChipRow}
        >
          {fuelStations.filter((s) => s.isOpen).map((s) => {
            const active = s.id === selectedStation.id;
            return (
              <TouchableOpacity
                key={s.id}
                style={[styles.stationChip, active && styles.stationChipActive]}
                onPress={() => setSelectedStation(s)}
              >
                <MaterialIcons
                  name="local-gas-station"
                  size={14}
                  color={active ? colors.white : colors.primary}
                />
                <Text style={[styles.stationChipText, active && styles.stationChipTextActive]}>
                  {s.name.split(' - ')[1] || s.name.split(' ').slice(-1)[0]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── Busy Hour Chart ─────────────────────────────── */}
        <Text style={styles.sectionTitle}>Busy Hour Prediction</Text>
        <View style={styles.chartCard}>
          <View style={styles.chartRow}>
            {hourlyData.map((item, i) => {
              const barHeight = Math.max((item.estimatedWaitMinutes / maxWait) * 120, 4);
              const isSelected = selectedBar === i;
              return (
                <TouchableOpacity
                  key={i}
                  style={styles.barWrap}
                  activeOpacity={0.7}
                  onPress={() => setSelectedBar(isSelected ? null : i)}
                >
                  {isSelected && (
                    <View style={styles.barTooltip}>
                      <Text style={styles.barTooltipText}>
                        {Math.round(item.estimatedWaitMinutes)}m
                      </Text>
                    </View>
                  )}
                  <View
                    style={[
                      styles.bar,
                      {
                        height: barHeight,
                        backgroundColor: getBarColor(item.estimatedWaitMinutes),
                        opacity: isSelected ? 1 : 0.85,
                        transform: [{ scaleX: isSelected ? 1.15 : 1 }],
                      },
                    ]}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={styles.chartLabels}>
            {hourlyData.map((item, i) => (
              <Text key={i} style={styles.chartLabel}>
                {i % 2 === 0 ? item.label?.replace(' AM', 'a').replace(' PM', 'p') : ''}
              </Text>
            ))}
          </View>

          {/* Legend */}
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
              <Text style={styles.legendText}>{'<'}10 min</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.warning }]} />
              <Text style={styles.legendText}>10–25 min</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.danger }]} />
              <Text style={styles.legendText}>{'>'}25 min</Text>
            </View>
          </View>

          <Text style={styles.chartCaption}>
            AI-predicted wait times at {selectedStation.name}
          </Text>
        </View>

        {/* ── Queue Comparison ────────────────────────────── */}
        <Text style={styles.sectionTitle}>Station Comparison</Text>
        <View style={styles.comparisonCard}>
          <View style={styles.comparisonHeader}>
            <MaterialIcons name="compare-arrows" size={18} color={colors.primary} />
            <Text style={styles.comparisonTitle}>Predicted Wait Times Now</Text>
          </View>
          {bulkPredictions.slice(0, 5).map((pred, idx) => {
            const station = fuelStations.find((s) => s.id === pred.stationId);
            if (!station) return null;
            const isBest = idx === 0;
            return (
              <View
                key={pred.stationId}
                style={[styles.comparisonRow, isBest && styles.comparisonRowBest]}
              >
                <View style={styles.comparisonLeft}>
                  {isBest && (
                    <View style={styles.bestBadge}>
                      <Text style={styles.bestBadgeText}>BEST</Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.comparisonName} numberOfLines={1}>
                      {station.name}
                    </Text>
                    <Text style={styles.comparisonAddress}>{station.distanceKm} km away</Text>
                  </View>
                </View>
                <View style={styles.comparisonRight}>
                  <Text
                    style={[
                      styles.comparisonWait,
                      { color: getStatusColor(pred.queueStatus) },
                    ]}
                  >
                    ~{Math.round(pred.estimatedWaitMinutes)} min
                  </Text>
                  <MaterialIcons
                    name={getStatusIcon(pred.queueStatus)}
                    size={16}
                    color={getStatusColor(pred.queueStatus)}
                  />
                </View>
              </View>
            );
          })}
        </View>

        {/* ── Queue Trend Analysis ────────────────────────── */}
        <Text style={styles.sectionTitle}>Queue Trend Analysis</Text>
        {fuelStations
          .filter((s) => s.isOpen)
          .slice(0, 4)
          .map((s) => {
            const pred = bulkPredictions.find((p) => p.stationId === s.id);
            const predictedWait = pred ? Math.round(pred.estimatedWaitMinutes) : s.waitMinutes;
            const trend =
              predictedWait > s.waitMinutes + 5
                ? 'RISING'
                : predictedWait < s.waitMinutes - 5
                ? 'FALLING'
                : 'STABLE';
            return (
              <View key={s.id} style={styles.trendRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.trendName}>{s.name}</Text>
                  <View style={styles.trendMetaRow}>
                    <Text style={styles.trendSub}>
                      Now: {s.waitMinutes}min · AI: ~{predictedWait}min
                    </Text>
                  </View>
                </View>
                <View style={styles.trendBadge}>
                  <MaterialIcons
                    name={
                      trend === 'RISING'
                        ? 'trending-up'
                        : trend === 'FALLING'
                        ? 'trending-down'
                        : 'trending-flat'
                    }
                    size={16}
                    color={
                      trend === 'RISING'
                        ? colors.danger
                        : trend === 'FALLING'
                        ? colors.success
                        : colors.warning
                    }
                  />
                </View>
              </View>
            );
          })}

        {/* ── AI Insights ─────────────────────────────────── */}
        <View style={styles.insightCard}>
          <View style={styles.insightHeader}>
            <MaterialIcons name="lightbulb" size={18} color={colors.primary} />
            <Text style={styles.insightTitle}>AI Insights</Text>
          </View>
          <View style={styles.insightItem}>
            <MaterialIcons name="wb-sunny" size={14} color={colors.warning} />
            <Text style={styles.insightText}>
              Morning rush (7–9 AM) shows 80% higher wait times than midday.
            </Text>
          </View>
          <View style={styles.insightItem}>
            <MaterialIcons name="nights-stay" size={14} color="#6C5CE7" />
            <Text style={styles.insightText}>
              Evening peak (5–7 PM) is the busiest period — plan accordingly.
            </Text>
          </View>
          <View style={styles.insightItem}>
            <MaterialIcons name="thumb-up" size={14} color={colors.success} />
            <Text style={styles.insightText}>
              Stations near Kotte have 35% shorter queues after 2 PM.
            </Text>
          </View>
        </View>

        {/* ── Model Info Footer ───────────────────────────── */}
        <View style={styles.modelInfoCard}>
          <MaterialIcons name="memory" size={16} color={colors.textMuted} />
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={styles.modelInfoText}>
              Powered by FuelTrack AI — TFLite Neural Network
            </Text>
            <Text style={styles.modelInfoSub}>
              4-layer Dense model · Updated in real-time
            </Text>
          </View>
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl + 20,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontWeight: '500',
  },

  // ── Hero ──────────────────────────────────────────
  heroCard: {
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadow.button,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  heroIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.pill,
  },
  aiBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: fontSizes.sm,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
  },
  heroValue: {
    fontSize: fontSizes.xl,
    color: colors.white,
    fontWeight: '800',
    marginTop: 4,
  },
  heroSub: {
    fontSize: fontSizes.xs,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 6,
    lineHeight: 16,
  },
  heroCurrentWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.pill,
    alignSelf: 'flex-start',
  },
  heroCurrentText: {
    fontSize: 11,
    color: colors.white,
    fontWeight: '600',
  },

  // ── Station selector ──────────────────────────────
  stationChipRow: {
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  stationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.primaryTint,
  },
  stationChipActive: {
    backgroundColor: colors.primary,
  },
  stationChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  stationChipTextActive: {
    color: colors.white,
  },

  // ── Section ───────────────────────────────────────
  sectionTitle: {
    fontSize: fontSizes.md,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },

  // ── Chart ─────────────────────────────────────────
  chartCard: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 130,
    gap: 4,
  },
  barWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
  },
  bar: {
    width: '70%',
    borderRadius: 4,
    minHeight: 4,
  },
  barTooltip: {
    backgroundColor: colors.textPrimary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  barTooltipText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.white,
  },
  chartLabels: {
    flexDirection: 'row',
    marginTop: 6,
    gap: 4,
  },
  chartLabel: {
    flex: 1,
    fontSize: 8,
    color: colors.textMuted,
    textAlign: 'center',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 9,
    color: colors.textSecondary,
  },
  chartCaption: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },

  // ── Comparison ────────────────────────────────────
  comparisonCard: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  comparisonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.sm,
  },
  comparisonTitle: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  comparisonRowBest: {
    backgroundColor: '#F0FFF4',
    marginHorizontal: -spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radii.sm,
  },
  comparisonLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bestBadge: {
    backgroundColor: colors.success,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  bestBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: 0.5,
  },
  comparisonName: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  comparisonAddress: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 1,
  },
  comparisonRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  comparisonWait: {
    fontSize: fontSizes.sm,
    fontWeight: '800',
  },

  // ── Trend ─────────────────────────────────────────
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  trendName: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  trendMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  trendSub: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
  },
  trendBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Insights ──────────────────────────────────────
  insightCard: {
    backgroundColor: colors.primaryTint,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.sm,
  },
  insightTitle: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  insightText: {
    flex: 1,
    fontSize: fontSizes.xs,
    color: colors.primaryDark,
    lineHeight: 17,
  },

  // ── Model Info ────────────────────────────────────
  modelInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
    padding: spacing.sm + 2,
    marginTop: spacing.lg,
  },
  modelInfoText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  modelInfoSub: {
    fontSize: 9,
    color: colors.textMuted,
    marginTop: 1,
  },
});
