import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fontSizes, spacing, radii } from '../theme/theme';
import { fuelStations, fuelTypes } from '../data/mockData';
import ScreenHeader from '../components/ScreenHeader';
import PrimaryButton from '../components/PrimaryButton';

const QUEUE_LEVELS = [
  { id: 'LOW', label: 'Short', sub: 'Under 10 min', color: '#3BB273', icon: 'sentiment-satisfied' },
  { id: 'MEDIUM', label: 'Moderate', sub: '10–25 min', color: '#F2A93B', icon: 'sentiment-neutral' },
  { id: 'HIGH', label: 'Long', sub: '25+ min', color: '#E6483C', icon: 'sentiment-dissatisfied' },
];

export default function ReportQueueScreen({ route, navigation }) {
  const { stationId } = route.params;
  const station = fuelStations.find((s) => s.id === stationId) || fuelStations[0];

  const [queueLevel, setQueueLevel] = useState(null);
  const [stockStatus, setStockStatus] = useState({});
  const [vehicleCount, setVehicleCount] = useState(null);

  const toggleStock = (fuelId) => {
    setStockStatus((prev) => ({ ...prev, [fuelId]: !prev[fuelId] }));
  };

  const canSubmit = !!queueLevel;

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="Report Queue" subtitle={station.name} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>How long is the queue?</Text>
        <View style={styles.queueOptions}>
          {QUEUE_LEVELS.map((level) => {
            const active = queueLevel === level.id;
            return (
              <TouchableOpacity
                key={level.id}
                style={[styles.queueOption, active && { borderColor: level.color, backgroundColor: `${level.color}15` }]}
                onPress={() => setQueueLevel(level.id)}
              >
                <MaterialIcons name={level.icon} size={26} color={level.color} />
                <Text style={styles.queueOptionLabel}>{level.label}</Text>
                <Text style={styles.queueOptionSub}>{level.sub}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>Which fuel types are available?</Text>
        <View style={styles.stockList}>
          {fuelTypes.map((type) => {
            const checked = !!stockStatus[type.id];
            return (
              <TouchableOpacity key={type.id} style={styles.stockRow} onPress={() => toggleStock(type.id)}>
                <View style={styles.stockLeft}>
                  <MaterialIcons name={type.icon} size={18} color={type.color} />
                  <Text style={styles.stockLabel}>{type.label}</Text>
                </View>
                <View style={[styles.checkbox, checked && styles.checkboxActive]}>
                  {checked && <MaterialIcons name="check" size={14} color={colors.white} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>Number of vehicles in line</Text>
        <View style={styles.counterRow}>
          {[5, 10, 20, 30, '40+'].map((n) => {
            const active = vehicleCount === n;
            return (
              <TouchableOpacity
                key={n}
                style={[styles.countChip, active && styles.countChipActive]}
                onPress={() => setVehicleCount(n)}
              >
                <Text style={[styles.countChipText, active && styles.countChipTextActive]}>{n}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <Text style={styles.helperText}>Select the closest estimate of vehicles currently waiting in line.</Text>

        <View style={styles.disclaimerCard}>
          <MaterialIcons name="info-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.disclaimerText}>
            Your report helps other drivers and improves AI predictions for this station. Reports are anonymous.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <PrimaryButton
          title="Submit Report"
          disabled={!canSubmit}
          onPress={() =>
            navigation.navigate('Success', {
              title: 'Report submitted!',
              message: 'Thanks for helping the community. Your queue report has been recorded for this station.',
              buttonLabel: 'Back to Home',
              nextScreen: 'MainTabs',
            })
          }
        />
      </View>
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
    paddingBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSizes.base,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  queueOptions: {
    flexDirection: 'row',
    gap: 10,
  },
  queueOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    gap: 4,
  },
  queueOptionLabel: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 2,
  },
  queueOptionSub: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  stockList: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.lg,
    overflow: 'hidden',
  },
  stockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  stockLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stockLabel: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  counterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  countChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceMuted,
  },
  countChipText: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  countChipActive: {
    backgroundColor: colors.primary,
  },
  countChipTextActive: {
    color: colors.white,
  },
  helperText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 6,
  },
  disclaimerCard: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
    padding: spacing.sm + 2,
    marginTop: spacing.lg,
    alignItems: 'flex-start',
  },
  disclaimerText: {
    flex: 1,
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  bottomBar: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
