import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fontSizes, spacing, radii } from '../theme/theme';
import ScreenHeader from '../components/ScreenHeader';
import PrimaryButton from '../components/PrimaryButton';
import { useAuth } from '../context/AuthContext';

export default function AddressesScreen({ navigation }) {
  const { user } = useAuth();
  const [savedStations, setSavedStations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSaved = async () => {
      try {
        const apiUrl = 'https://fuel-track-backend.onrender.com';
        const res = await fetch(`${apiUrl}/api/users/stations`);
        if (res.ok) {
          const allStations = await res.json();
          const userSavedIds = user?.savedStations || [];
          const filtered = allStations.filter(s => userSavedIds.includes(s.id));
          setSavedStations(filtered);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSaved();
  }, [user?.savedStations]);

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="Saved Locations" />

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          {savedStations.length === 0 ? (
            <Text style={{ textAlign: 'center', marginTop: 20, color: colors.textMuted }}>No saved stations yet.</Text>
          ) : (
            savedStations.map((station) => (
              <TouchableOpacity 
                key={station.id} 
                style={styles.row}
                onPress={() => navigation.navigate('StationDetails', { 
                  station: { ...station, image: 'https://images.unsplash.com/photo-1545262810-77515befe149?w=900&q=80', availability: station.availability || { petrol92: true, petrol95: true, diesel: true, superdiesel: false, kerosene: true }, rating: '5.0', reviews: 1, waitMinutes: 5, distanceKm: 'Calc...' },
                  driverCoords: null 
                })}
              >
                <View style={styles.iconCircle}>
                  <MaterialIcons name="local-gas-station" size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>{station.displayName || 'Unknown Station'}</Text>
                  <Text style={styles.address}>{station.address || station.city || 'Unknown Address'}</Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}

      <View style={styles.bottomBar}>
        <PrimaryButton title="Explore Stations" onPress={() => navigation.navigate('Home')} />
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
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: fontSizes.base,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  address: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  bottomBar: {
    padding: spacing.lg,
  },
});
