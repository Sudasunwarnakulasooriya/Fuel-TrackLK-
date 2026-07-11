import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fontSizes, spacing, radii } from '../theme/theme';
import FuelStationCard from '../components/FuelStationCard';
import ScreenHeader from '../components/ScreenHeader';
import * as Location from 'expo-location';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'open', label: 'Open Now' },
  { id: 'low', label: 'Short Queue' },
  { id: 'near', label: 'Nearest' },
];

export default function NearbyStationsScreen({ route, navigation }) {
  const [filter, setFilter] = useState('all');
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [driverCoords, setDriverCoords] = useState(null);

  const { stations: passedStations } = route.params || {};

  // Haversine formula for distance
  const getDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 'Unknown';
    const R = 6371; 
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    return d.toFixed(1) + ' km';
  };

  React.useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      try {
        let location = await Location.getCurrentPositionAsync({});
        setDriverCoords({ lat: location.coords.latitude, lng: location.coords.longitude });
      } catch (error) {
        console.error('Error fetching location:', error);
      }
    })();
  }, []);

  React.useEffect(() => {
    if (passedStations && passedStations.length > 0) {
      setStations(passedStations);
      setLoading(false);
      return;
    }

    const fetchStations = async () => {
      setLoading(true);
      try {
        const apiUrl = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';
        const res = await fetch(`${apiUrl}/api/users/stations`);
        if (res.ok) {
          const data = await res.json();
          const formattedStations = data.map(s => {
            return {
              id: s.id,
              name: s.displayName || 'Unknown Station',
              address: s.address || s.city || 'Unknown Address',
              distanceKm: driverCoords ? getDistance(driverCoords.lat, driverCoords.lng, s.location?.lat, s.location?.lng) : 'Calc...',
              isOpen: s.isOpen !== undefined ? s.isOpen : true,
              availability: s.availability || { petrol92: true, petrol95: true, diesel: true, superdiesel: false, kerosene: true },
              queue: s.queueStatus || 'LOW',
              queueCount: s.queueCount || 0,
              lastUpdated: s.lastUpdated ? 'Just now' : 'Unknown',
              image: 'https://images.unsplash.com/photo-1545262810-77515befe149?w=900&q=80',
              rating: '5.0',
              reviews: 1,
              waitMinutes: (s.queueStatus === 'HIGH' ? 45 : (s.queueStatus === 'MEDIUM' ? 15 : 5))
            };
          });
          setStations(formattedStations);
        }
      } catch (e) {
        console.error('Error fetching stations in Nearby:', e);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStations();
  }, [passedStations, driverCoords]);

  let filteredStations = [...stations];
  if (filter === 'open') filteredStations = filteredStations.filter((s) => s.isOpen);
  if (filter === 'low') filteredStations = filteredStations.filter((s) => s.queue === 'LOW');
  if (filter === 'near') filteredStations = filteredStations.sort((a, b) => {
    const distA = parseFloat(a.distanceKm) || Infinity;
    const distB = parseFloat(b.distanceKm) || Infinity;
    return distA - distB;
  });

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
          <Text style={styles.mapPreviewText}>{filteredStations.length} stations near you</Text>
        </View>

        {loading ? (
          <Text style={{ textAlign: 'center', marginTop: 40, color: colors.textMuted }}>Loading stations...</Text>
        ) : filteredStations.length === 0 ? (
          <Text style={{ textAlign: 'center', marginTop: 40, color: colors.textMuted }}>No stations found.</Text>
        ) : (
          filteredStations.map((station) => (
            <FuelStationCard
              key={station.id}
              station={station}
              driverCoords={driverCoords}
              onPress={() => navigation.navigate('StationDetails', { station, driverCoords })}
            />
          ))
        )}
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
