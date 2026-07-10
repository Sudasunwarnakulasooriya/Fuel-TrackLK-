import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  FlatList,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fontSizes, spacing, radii, shadow } from '../theme/theme';
import { fuelTypes, fuelStations, currentUser } from '../data/mockData';
import FuelStationCard from '../components/FuelStationCard';
import * as Location from 'expo-location';

export default function HomeScreen({ navigation }) {
  const [activeFuel, setActiveFuel] = useState(null);
  const [search, setSearch] = useState('');
  const [locationText, setLocationText] = useState('Locating...');

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationText('Location unavailable');
        return;
      }

      try {
        let location = await Location.getCurrentPositionAsync({});
        let geocode = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        let displayCity = '';
        let displayRegion = '';

        if (geocode && geocode.length > 0) {
          const { city, region, country, district, subregion, name } = geocode[0];
          displayCity = city || district || subregion || name;
          displayRegion = region || country;
        }

        // Fallback to a free geocoding API if expo-location on web fails or returns empty
        if (!displayCity) {
          try {
            const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${location.coords.latitude}&longitude=${location.coords.longitude}&localityLanguage=en`);
            const data = await response.json();
            displayCity = data.city || data.locality || data.principalSubdivision;
            displayRegion = data.principalSubdivision || data.countryName;
          } catch (e) {
            console.error('Fallback geocoding failed', e);
          }
        }

        displayCity = displayCity || 'Unknown Location';
        displayRegion = displayRegion || '';
          
        if (displayRegion && displayRegion !== displayCity) {
          setLocationText(`${displayCity}, ${displayRegion}`);
        } else {
          setLocationText(displayCity);
        }
      } catch (error) {
        console.error('Error fetching location:', error);
        setLocationText('Failed to get location');
      }
    })();
  }, []);

  const filteredStations = fuelStations.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.address.toLowerCase().includes(search.toLowerCase());
    const matchesFuel = !activeFuel || s.availability[activeFuel];
    return matchesSearch && matchesFuel;
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <View>
            <Text style={styles.locationLabel}>Your Location</Text>
            <View style={styles.locationRow}>
              <MaterialIcons name="place" size={16} color={colors.primary} />
              <Text style={styles.locationText}>{locationText}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.bellBtn} onPress={() => navigation.navigate('Notifications')}>
            <MaterialIcons name="notifications-none" size={22} color={colors.textPrimary} />
            <View style={styles.bellDot} />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchRow}>
          <MaterialIcons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search fuel station"
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Categories */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Fuel Types</Text>
          <TouchableOpacity onPress={() => setActiveFuel(null)}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={fuelTypes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm }}
          renderItem={({ item }) => {
            const active = activeFuel === item.id;
            return (
              <TouchableOpacity
                style={[styles.fuelChip, active && styles.fuelChipActive]}
                onPress={() => setActiveFuel(active ? null : item.id)}
              >
                <MaterialIcons
                  name={item.icon}
                  size={18}
                  color={active ? colors.white : item.color}
                />
                <Text style={[styles.fuelChipText, active && styles.fuelChipTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />

        {/* Promo banner */}
        <View style={styles.promoBanner}>
          <View style={{ flex: 1 }}>
            <Text style={styles.promoTag}>AI Prediction</Text>
            <Text style={styles.promoTitle}>Avoid queues with{'\n'}smart predictions</Text>
            <TouchableOpacity
              style={styles.promoBtn}
              onPress={() => navigation.navigate('Predictions')}
            >
              <Text style={styles.promoBtnText}>View Insights</Text>
            </TouchableOpacity>
          </View>
          <MaterialIcons name="insights" size={64} color="rgba(255,255,255,0.35)" />
        </View>

        {/* Station list */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Nearby Fuel Stations</Text>
          <TouchableOpacity onPress={() => navigation.navigate('NearbyStations')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        {filteredStations.map((station) => (
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
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  locationLabel: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  locationText: {
    fontSize: fontSizes.base,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  bellBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellDot: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    height: 50,
    gap: 8,
    marginBottom: spacing.lg,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSizes.base,
    color: colors.textPrimary,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSizes.md,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  seeAll: {
    fontSize: fontSizes.xs,
    color: colors.primary,
    fontWeight: '700',
  },
  fuelChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceMuted,
  },
  fuelChipActive: {
    backgroundColor: colors.primary,
  },
  fuelChipText: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  fuelChipTextActive: {
    color: colors.white,
  },
  promoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryDark,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
    overflow: 'hidden',
    ...shadow.card,
  },
  promoTag: {
    fontSize: fontSizes.xs,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '700',
    marginBottom: 4,
  },
  promoTitle: {
    fontSize: fontSizes.md,
    color: colors.white,
    fontWeight: '800',
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  promoBtn: {
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radii.pill,
    alignSelf: 'flex-start',
  },
  promoBtnText: {
    color: colors.primaryDark,
    fontWeight: '700',
    fontSize: fontSizes.xs,
  },
});
