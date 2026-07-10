import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fontSizes, spacing, radii } from '../theme/theme';
import { fuelStations } from '../data/mockData';
import FuelStationCard from '../components/FuelStationCard';
import ScreenHeader from '../components/ScreenHeader';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'open', label: 'Open Now' },
  { id: 'low', label: 'Short Queue' },
  { id: 'near', label: 'Nearest' },
];

export default function NearbyStationsScreen({ navigation }) {
  const [filter, setFilter] = useState('all');

  let stations = [...fuelStations];
  if (filter === 'open') stations = stations.filter((s) => s.isOpen);
  if (filter === 'low') stations = stations.filter((s) => s.queue === 'LOW');
  if (filter === 'near') stations = stations.sort((a, b) => a.distanceKm - b.distanceKm);

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="Nearby Fuel Stations" />

      <View style={styles.filterRow}>
        {FILTERS.map((f) => {
          const active = filter === f.id;
          return (
            <TouchableOpacity
              key={f.id}
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => setFilter(f.id)}
            >
              <Text style={[styles.filterText, active && styles.filterTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        <View style={styles.mapPreview}>
          <MaterialIcons name="map" size={28} color={colors.primary} />
          <Text style={styles.mapPreviewText}>{stations.length} stations near you</Text>
        </View>

        {stations.map((station) => (
          <FuelStationCard
            key={station.id}
            station={station}
            onPress={() => navigation.navigate('StationDetails', { stationId: station.id })}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceMuted,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
  },
  filterText: {
    fontSize: fontSizes.xs,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  filterTextActive: {
    color: colors.white,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  mapPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.primaryTint,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  mapPreviewText: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: colors.primaryDark,
  },
});
