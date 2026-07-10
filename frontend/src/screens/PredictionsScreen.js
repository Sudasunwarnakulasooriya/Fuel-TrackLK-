import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fontSizes, spacing, radii } from '../theme/theme';
import ScreenHeader from '../components/ScreenHeader';
import { fuelStations } from '../data/mockData';

const HOURLY_BUSY = [30, 45, 60, 40, 35, 55, 80, 90, 70, 50, 35, 25];
const HOURS = ['6a', '7a', '8a', '9a', '10a', '11a', '12p', '1p', '2p', '3p', '4p', '5p'];

export default function PredictionsScreen() {
  const maxVal = Math.max(...HOURLY_BUSY);

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="Fuel Analytics" subtitle="AI-powered predictions" />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <MaterialIcons name="auto-awesome" size={22} color={colors.white} />
          <Text style={styles.heroTitle}>Best time to visit today</Text>
          <Text style={styles.heroValue}>1:00 PM – 3:00 PM</Text>
          <Text style={styles.heroSub}>Predicted shortest queues across nearby stations</Text>
        </View>

        <Text style={styles.sectionTitle}>Busy Hour Prediction</Text>
        <View style={styles.chartCard}>
          <View style={styles.chartRow}>
            {HOURLY_BUSY.map((val, i) => (
              <View key={i} style={styles.barWrap}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: (val / maxVal) * 100,
                      backgroundColor: val > 70 ? colors.danger : val > 45 ? colors.warning : colors.success,
                    },
                  ]}
                />
              </View>
            ))}
          </View>
          <View style={styles.chartLabels}>
            {HOURS.map((h, i) => (
              <Text key={i} style={styles.chartLabel}>{i % 2 === 0 ? h : ''}</Text>
            ))}
          </View>
          <Text style={styles.chartCaption}>Predicted traffic levels at nearby stations today</Text>
        </View>

        <Text style={styles.sectionTitle}>Queue Trend Analysis</Text>
        {fuelStations.slice(0, 3).map((s) => (
          <View key={s.id} style={styles.trendRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.trendName}>{s.name}</Text>
              <Text style={styles.trendSub}>{s.queueCount} vehicles · updated {s.lastUpdated}</Text>
            </View>
            <View style={styles.trendBadge}>
              <MaterialIcons
                name={s.queue === 'HIGH' ? 'trending-up' : s.queue === 'LOW' ? 'trending-down' : 'trending-flat'}
                size={16}
                color={s.queue === 'HIGH' ? colors.danger : s.queue === 'LOW' ? colors.success : colors.warning}
              />
            </View>
          </View>
        ))}

        <View style={styles.insightCard}>
          <MaterialIcons name="lightbulb-outline" size={18} color={colors.primary} />
          <Text style={styles.insightText}>
            Demand pattern: stations near Kotte and Rajagiriya tend to get busiest right after working hours, between 5:30 PM and 7:00 PM.
          </Text>
        </View>
      </ScrollView>
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
    paddingBottom: spacing.xxl,
  },
  heroCard: {
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
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
    marginTop: 6,
  },
  sectionTitle: {
    fontSize: fontSizes.md,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
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
    height: 110,
    gap: 6,
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
  chartCaption: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
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
  trendSub: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  trendBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightCard: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: colors.primaryTint,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginTop: spacing.lg,
    alignItems: 'flex-start',
  },
  insightText: {
    flex: 1,
    fontSize: fontSizes.sm,
    color: colors.primaryDark,
    lineHeight: 19,
  },
});
