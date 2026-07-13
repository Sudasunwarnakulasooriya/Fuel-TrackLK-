import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Platform, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fontSizes, spacing, radii, shadow } from '../theme/theme';
import ScreenHeader from '../components/ScreenHeader';
import { fuelStations as mockStations } from '../data/mockData';

const DEFAULT_HOURLY_BUSY = [20, 35, 55, 40, 30, 35, 45, 30, 25, 40, 65, 80];
const HOURS = ['6a', '7a', '8a', '9a', '10a', '11a', '12p', '1p', '2p', '3p', '4p', '5p'];
const HOURS_FULL = [
  '6:00 AM – 8:00 AM', '7:00 AM – 9:00 AM', '8:00 AM – 10:00 AM',
  '9:00 AM – 11:00 AM', '10:00 AM – 12:00 PM', '11:00 AM – 1:00 PM',
  '12:00 PM – 2:00 PM', '1:00 PM – 3:00 PM', '2:00 PM – 4:00 PM',
  '3:00 PM – 5:00 PM', '4:00 PM – 6:00 PM', '5:00 PM – 7:00 PM'
];

export default function PredictionsScreen() {
  const [stations, setStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [selectedHourIndex, setSelectedHourIndex] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);

  const [predictionData, setPredictionData] = useState({
    bestTime: '1:00 PM – 3:00 PM',
    bestTimeQueueCount: 6,
    bestTimeWaitMinutes: 8,
    peakBusyTime: '5:00 PM – 7:00 PM',
    peakBusyQueueCount: 65,
    stationProfile: 'Urban Commuter Station',
    hourlyBusy: DEFAULT_HOURLY_BUSY,
    hourlyDetails: DEFAULT_HOURLY_BUSY.map((val, idx) => ({
      hourLabel: HOURS[idx],
      timeRange: HOURS_FULL[idx],
      queueCount: val,
      waitMinutes: Math.round(val * 0.8 + 2),
      status: val > 65 ? 'Long Queue' : val > 35 ? 'Moderate Queue' : 'Short Queue'
    })),
    insightText: 'Select any fuel station above or in the list below to generate real-time, AI-powered traffic forecasts and custom refuel tips.',
    smartAlerts: [
      { id: 'a1', title: 'Optimal Window', detail: 'Queues are usually shortest between 1:00 PM – 3:00 PM.', type: 'success', icon: 'check-circle-outline' },
      { id: 'a2', title: 'Peak Rush Alert', detail: 'Expect heavy traffic after working hours around 5:30 PM – 7:00 PM.', type: 'warning', icon: 'warning' },
    ]
  });

  const fetchLiveStations = async (silent = false) => {
    try {
      if (!silent && !stations.length) setLoading(true);
      const apiUrl = 'https://fuel-track-backend.onrender.com';
      const res = await fetch(`${apiUrl}/api/users/stations`);
      
      let liveStationsList = [];
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          liveStationsList = data.map(s => ({
            id: s.id,
            name: s.displayName || 'Unknown Station',
            address: s.address || s.city || 'Unknown Address',
            location: s.location,
            isOpen: s.isOpen !== undefined ? s.isOpen : true,
            availability: s.availability || { petrol92: true, petrol95: true, diesel: true, superdiesel: false, kerosene: true },
            queue: s.queueStatus || (s.queueCount > 25 ? 'HIGH' : s.queueCount > 12 ? 'MEDIUM' : 'LOW'),
            queueCount: s.queueCount !== undefined ? s.queueCount : 12,
            lastUpdated: s.lastUpdated ? 'Just now' : 'Updated recently',
            waitMinutes: s.queueStatus === 'HIGH' ? 45 : s.queueStatus === 'MEDIUM' ? 18 : 6
          }));
        }
      }

      // If database has fewer stations or fails, combine/fallback cleanly so user always has real selectable items
      if (liveStationsList.length === 0) {
        liveStationsList = mockStations.map(s => ({
          id: s.id,
          name: s.name,
          address: s.address,
          location: { lat: s.lat, lng: s.lng },
          isOpen: s.isOpen,
          availability: s.availability,
          queue: s.queue,
          queueCount: s.queueCount,
          lastUpdated: s.lastUpdated,
          waitMinutes: s.waitMinutes
        }));
      }

      setStations(liveStationsList);

      // Select active station if not already selected or if current selection is missing
      if (!selectedStation && liveStationsList.length > 0) {
        const firstActive = liveStationsList[0];
        setSelectedStation(firstActive);
        fetchAIPredictions(firstActive);
      } else if (selectedStation) {
        // Keep selectedStation updated with fresh queue counts
        const updatedSelected = liveStationsList.find(s => s.id === selectedStation.id) || selectedStation;
        setSelectedStation(updatedSelected);
        if (!silent) fetchAIPredictions(updatedSelected);
      }
    } catch (e) {
      console.log('Error fetching stations in PredictionsScreen:', e.message);
      if (stations.length === 0) {
        setStations(mockStations);
        setSelectedStation(mockStations[0]);
        fetchAIPredictions(mockStations[0]);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchLiveStations();
    }, [])
  );

  const fetchAIPredictions = async (targetStation) => {
    if (!targetStation) return;
    try {
      setLoading(true);
      const apiUrl = 'https://fuel-track-backend.onrender.com';
      const currentHour = new Date().getHours();
      const dayOfWeek = new Date().getDay();

      const response = await fetch(`${apiUrl}/api/ai/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hour: currentHour,
          dayOfWeek: dayOfWeek,
          stationId: targetStation.id,
          stationName: targetStation.name,
          city: targetStation.address,
          currentQueueCount: targetStation.queueCount || 10,
          queueStatus: targetStation.queue
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.success) {
          setPredictionData({
            bestTime: data.bestTime || '1:00 PM – 3:00 PM',
            bestTimeQueueCount: data.bestTimeQueueCount || 6,
            bestTimeWaitMinutes: data.bestTimeWaitMinutes || 8,
            peakBusyTime: data.peakBusyTime || '5:00 PM – 7:00 PM',
            peakBusyQueueCount: data.peakBusyQueueCount || 65,
            stationProfile: data.stationProfile || 'Demand Profile',
            hourlyBusy: data.hourlyPredictions || DEFAULT_HOURLY_BUSY,
            hourlyDetails: data.hourlyDetails || DEFAULT_HOURLY_BUSY.map((val, idx) => ({
              hourLabel: HOURS[idx],
              timeRange: HOURS_FULL[idx],
              queueCount: val,
              waitMinutes: Math.round(val * 0.8 + 2),
              status: val > 65 ? 'Long Queue' : val > 35 ? 'Moderate Queue' : 'Short Queue'
            })),
            insightText: data.aiAdvice || `Demand pattern for ${targetStation.name}: shortest queues predicted around ${data.bestTime}.`,
            smartAlerts: data.smartAlerts || predictionData.smartAlerts
          });
        }
      }
    } catch (error) {
      console.log('Error fetching station AI predictions:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const onSelectStation = (station) => {
    setSelectedStation(station);
    setSelectedHourIndex(null);
    fetchAIPredictions(station);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLiveStations(false);
    setRefreshing(false);
  };

  const maxVal = Math.max(...(predictionData.hourlyBusy || DEFAULT_HOURLY_BUSY), 10);
  const currentInspectIndex = selectedHourIndex !== null ? selectedHourIndex : Math.min(Math.floor(Math.max(0, new Date().getHours() - 6)), 11);
  const inspectedHourData = predictionData.hourlyDetails && predictionData.hourlyDetails[currentInspectIndex] ? predictionData.hourlyDetails[currentInspectIndex] : {
    hourLabel: HOURS[currentInspectIndex] || '12p',
    timeRange: HOURS_FULL[currentInspectIndex] || '12:00 PM – 2:00 PM',
    queueCount: (predictionData.hourlyBusy || DEFAULT_HOURLY_BUSY)[currentInspectIndex] || 30,
    waitMinutes: Math.round(((predictionData.hourlyBusy || DEFAULT_HOURLY_BUSY)[currentInspectIndex] || 30) * 0.8 + 2),
    status: ((predictionData.hourlyBusy || DEFAULT_HOURLY_BUSY)[currentInspectIndex] || 30) > 65 ? 'Long Queue' : ((predictionData.hourlyBusy || DEFAULT_HOURLY_BUSY)[currentInspectIndex] || 30) > 35 ? 'Moderate Queue' : 'Short Queue'
  };

  // Calculate regional average queue across live stations for comparison
  const regionalAvgQueue = stations.length > 0
    ? Math.round(stations.reduce((acc, s) => acc + (Number(s.queueCount) || 0), 0) / stations.length)
    : 18;
  const currentStationQueue = Number(selectedStation?.queueCount) || 0;
  const diffPercent = regionalAvgQueue > 0 ? Math.round(((currentStationQueue - regionalAvgQueue) / regionalAvgQueue) * 100) : 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="Fuel Analytics" subtitle="Station-specific AI predictions & queue trends" />

      {/* Station Selector Bar */}
      <View style={styles.stationSelectorContainer}>
        <Text style={styles.selectorTitle}>Select Station for AI Analysis:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stationChipsScroll}>
          {stations.map((s) => {
            const isSelected = selectedStation && selectedStation.id === s.id;
            const dotColor = s.queue === 'HIGH' ? colors.danger : s.queue === 'MEDIUM' ? colors.warning : colors.success;
            return (
              <TouchableOpacity
                key={s.id}
                style={[styles.stationChip, isSelected && styles.stationChipActive]}
                onPress={() => onSelectStation(s)}
              >
                <View style={[styles.queueDot, { backgroundColor: dotColor }]} />
                <Text style={[styles.stationChipText, isSelected && styles.stationChipTextActive]} numberOfLines={1}>
                  {s.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        {/* Hero Card for Selected Station */}
        <View style={styles.heroCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <MaterialIcons name="auto-awesome" size={20} color={colors.white} />
              <Text style={styles.heroStationBadge} numberOfLines={1}>
                {selectedStation ? selectedStation.name : 'All Stations'}
              </Text>
            </View>
            {loading && <ActivityIndicator size="small" color={colors.white} />}
          </View>

          <Text style={styles.heroTitle}>Best time to visit today</Text>
          <Text style={styles.heroValue}>{predictionData.bestTime}</Text>
          <Text style={styles.heroSub}>Predicted shortest line specifically at this station</Text>

          <View style={styles.heroStatsRow}>
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatValue}>~{predictionData.bestTimeWaitMinutes} mins</Text>
              <Text style={styles.heroStatLabel}>Est. Wait Time</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatValue}>~{predictionData.bestTimeQueueCount} vehicles</Text>
              <Text style={styles.heroStatLabel}>Shortest Queue</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatValue} numberOfLines={1}>{predictionData.stationProfile.split(' ')[0]}</Text>
              <Text style={styles.heroStatLabel}>Profile Type</Text>
            </View>
          </View>
        </View>

        {/* Live Station Comparison Pill */}
        {selectedStation && (
          <View style={styles.comparisonCard}>
            <MaterialIcons
              name={diffPercent <= 0 ? 'trending-down' : 'trending-up'}
              size={22}
              color={diffPercent <= 0 ? colors.success : colors.danger}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.comparisonTitle}>Live Queue vs. Regional Average</Text>
              <Text style={styles.comparisonText}>
                {selectedStation.name} is currently at <Text style={{ fontWeight: '700', color: colors.textPrimary }}>{currentStationQueue} vehicles</Text>, which is{' '}
                <Text style={{ fontWeight: '700', color: diffPercent <= 0 ? colors.success : colors.danger }}>
                  {Math.abs(diffPercent)}% {diffPercent <= 0 ? 'shorter' : 'longer'}
                </Text>{' '}
                than the area average ({regionalAvgQueue} vehicles).
              </Text>
            </View>
          </View>
        )}

        {/* Busy Hour Prediction Chart */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Busy Hour Prediction</Text>
          <Text style={styles.sectionHint}>Tap bar to inspect</Text>
        </View>

        <View style={styles.chartCard}>
          <View style={styles.chartRow}>
            {(predictionData.hourlyBusy || DEFAULT_HOURLY_BUSY).map((val, i) => {
              const isSelectedHour = selectedHourIndex === i;
              const barColor = val > 65 ? colors.danger : val > 35 ? colors.warning : colors.success;
              return (
                <TouchableOpacity
                  key={i}
                  style={styles.barWrap}
                  activeOpacity={0.7}
                  onPress={() => setSelectedHourIndex(i)}
                >
                  {isSelectedHour && <View style={styles.barIndicatorDot} />}
                  <View
                    style={[
                      styles.bar,
                      {
                        height: Math.max(8, (val / maxVal) * 105),
                        backgroundColor: isSelectedHour ? colors.primary : barColor,
                        opacity: selectedHourIndex !== null && !isSelectedHour ? 0.5 : 1,
                      },
                    ]}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={styles.chartLabels}>
            {HOURS.map((h, i) => (
              <Text
                key={i}
                style={[
                  styles.chartLabel,
                  selectedHourIndex === i && { color: colors.primary, fontWeight: '700' }
                ]}
              >
                {i % 2 === 0 ? h : ''}
              </Text>
            ))}
          </View>

          {/* Interactive Inspection Tooltip Box */}
          <View style={styles.tooltipBox}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.tooltipTime}>{inspectedHourData.timeRange}</Text>
              <View style={[styles.statusBadge, {
                backgroundColor: inspectedHourData.status === 'Long Queue' ? colors.danger : inspectedHourData.status === 'Moderate Queue' ? colors.warning : colors.success
              }]}>
                <Text style={styles.statusBadgeText}>{inspectedHourData.status}</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
              <Text style={styles.tooltipDetail}>Predicted Queue: <Text style={{ fontWeight: '700', color: colors.textPrimary }}>~{inspectedHourData.queueCount} vehicles</Text></Text>
              <Text style={styles.tooltipDetail}>Est. Wait: <Text style={{ fontWeight: '700', color: colors.textPrimary }}>~{inspectedHourData.waitMinutes} mins</Text></Text>
            </View>
          </View>

          <Text style={styles.chartCaption}>
            Showing specific hourly traffic projection for {selectedStation?.name || 'selected station'}
          </Text>
        </View>

        {/* AI Insight Highlight */}
        <View style={styles.insightCard}>
          <MaterialIcons name="lightbulb-outline" size={22} color={colors.primary} style={{ marginTop: 2 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.insightTitle}>AI Demand Insight</Text>
            <Text style={styles.insightText}>{predictionData.insightText}</Text>
          </View>
        </View>

        {/* Smart AI Alerts */}
        <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>Smart AI Alerts & Tips</Text>
        {predictionData.smartAlerts && predictionData.smartAlerts.map((alert, idx) => (
          <View key={alert.id || idx} style={[styles.alertCard, { borderLeftColor: alert.type === 'success' ? colors.success : alert.type === 'warning' ? colors.warning : colors.primary }]}>
            <MaterialIcons
              name={alert.icon || (alert.type === 'success' ? 'check-circle' : alert.type === 'warning' ? 'warning' : 'info')}
              size={22}
              color={alert.type === 'success' ? colors.success : alert.type === 'warning' ? colors.warning : colors.primary}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.alertTitle}>{alert.title}</Text>
              <Text style={styles.alertDetail}>{alert.detail}</Text>
            </View>
          </View>
        ))}

        {/* Queue Trend Analysis - LIVE DATABASE STATIONS */}
        <View style={[styles.sectionHeaderRow, { marginTop: spacing.lg }]}>
          <Text style={styles.sectionTitle}>Queue Trend Analysis</Text>
          <Text style={styles.sectionHint}>Live registered stations</Text>
        </View>
        <Text style={styles.trendHelperText}>Tap any station below to instantly load its specific AI prediction model & hourly curve above.</Text>

        {stations.map((s) => {
          const isSelected = selectedStation && selectedStation.id === s.id;
          const badgeColor = s.queue === 'HIGH' ? colors.danger : s.queue === 'MEDIUM' ? colors.warning : colors.success;
          return (
            <TouchableOpacity
              key={s.id}
              style={[styles.trendRow, isSelected && styles.trendRowSelected]}
              onPress={() => onSelectStation(s)}
              activeOpacity={0.7}
            >
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[styles.trendName, isSelected && { color: colors.primary }]}>{s.name}</Text>
                  {isSelected && (
                    <View style={styles.analyzingBadge}>
                      <Text style={styles.analyzingBadgeText}>Analyzing</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.trendSub}>{s.address}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 }}>
                  <Text style={styles.trendMetaText}>
                    <Text style={{ fontWeight: '700', color: badgeColor }}>{s.queueCount} vehicles</Text> in line
                  </Text>
                  <Text style={styles.trendMetaText}>· Est. wait <Text style={{ fontWeight: '700' }}>~{s.waitMinutes} min</Text></Text>
                  <Text style={styles.trendMetaText}>· {s.lastUpdated}</Text>
                </View>
              </View>
              <View style={[styles.trendBadge, { borderColor: badgeColor, borderWidth: 1.5 }]}>
                <MaterialIcons
                  name={s.queue === 'HIGH' ? 'trending-up' : s.queue === 'LOW' ? 'trending-down' : 'trending-flat'}
                  size={18}
                  color={badgeColor}
                />
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  stationSelectorContainer: {
    backgroundColor: colors.surfaceMuted,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  selectorTitle: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    color: colors.textSecondary,
    paddingHorizontal: spacing.lg,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  stationChipsScroll: {
    paddingHorizontal: spacing.lg,
    gap: 8,
  },
  stationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stationChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  queueDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stationChipText: {
    fontSize: fontSizes.xs,
    fontWeight: '600',
    color: colors.textPrimary,
    maxWidth: 160,
  },
  stationChipTextActive: {
    color: colors.white,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  heroCard: {
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadow.card,
  },
  heroStationBadge: {
    fontSize: fontSizes.xs,
    color: colors.white,
    fontWeight: '700',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radii.pill,
  },
  heroTitle: {
    fontSize: fontSizes.sm,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
    marginTop: spacing.sm,
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
    marginTop: 4,
  },
  heroStatsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: radii.md,
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginTop: spacing.md,
    alignItems: 'center',
  },
  heroStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  heroStatValue: {
    fontSize: fontSizes.sm,
    fontWeight: '800',
    color: colors.white,
  },
  heroStatLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  heroStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  comparisonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  comparisonTitle: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  comparisonText: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    lineHeight: 17,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    fontSize: fontSizes.md,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  sectionHint: {
    fontSize: fontSizes.xs,
    color: colors.primary,
    fontWeight: '600',
  },
  chartCard: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 115,
    gap: 6,
  },
  barWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
  },
  barIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginBottom: 4,
  },
  bar: {
    width: '75%',
    borderRadius: 4,
  },
  chartLabels: {
    flexDirection: 'row',
    marginTop: 6,
    gap: 6,
  },
  chartLabel: {
    flex: 1,
    fontSize: 9,
    color: colors.textMuted,
    textAlign: 'center',
  },
  tooltipBox: {
    backgroundColor: colors.white,
    borderRadius: radii.md,
    padding: 10,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tooltipTime: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.pill,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.white,
  },
  tooltipDetail: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
  },
  chartCaption: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  insightCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: colors.primaryTint,
    borderRadius: radii.lg,
    padding: spacing.md,
    alignItems: 'flex-start',
  },
  insightTitle: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: colors.primaryDark,
    marginBottom: 4,
  },
  insightText: {
    fontSize: fontSizes.sm,
    color: colors.primaryDark,
    lineHeight: 19,
  },
  alertCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
    padding: spacing.md,
    marginTop: spacing.sm,
    borderLeftWidth: 4,
    alignItems: 'center',
  },
  alertTitle: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  alertDetail: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  trendHelperText: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    borderRadius: radii.sm,
  },
  trendRowSelected: {
    backgroundColor: colors.primaryTint,
    borderColor: colors.primaryLight,
  },
  trendName: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  trendSub: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  trendMetaText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  trendBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  analyzingBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.pill,
  },
  analyzingBadgeText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: '700',
  },
});
