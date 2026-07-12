import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
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
  Platform,
  Keyboard,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fontSizes, spacing, radii, shadow } from '../theme/theme';
import { fuelTypes, currentUser } from '../data/mockData';
import FuelStationCard from '../components/FuelStationCard';
import * as Location from 'expo-location';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const [activeFuel, setActiveFuel] = useState(null);
  const [expandFuelTypes, setExpandFuelTypes] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [locationText, setLocationText] = useState('Locating...');
  const [driverCoords, setDriverCoords] = useState(null);
  const [stations, setStations] = useState([]);
  const [loadingStations, setLoadingStations] = useState(true);
  const [fetchError, setFetchError] = useState(null);

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

  const { unreadCount, monitorNearestStations } = useNotifications();

  const fetchStations = async (silent = false) => {
    if (!silent) setLoadingStations(true);
    try {
      const apiUrl = 'https://fuel-track-backend.onrender.com';
      const res = await fetch(`${apiUrl}/api/users/stations`);
      if (res.ok) {
        const data = await res.json();
        // console.log('Fetched stations:', data); // Silenced to avoid console spam
        setStations(data);
        setFetchError(null);
      } else {
        console.log('Failed to fetch stations, status:', res.status);
        setFetchError(`Server returned status: ${res.status}`);
      }
    } catch (e) {
      console.error('Error fetching stations:', e);
      setFetchError(e.message || 'Network request failed');
    } finally {
      if (!silent) setLoadingStations(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchStations();
    }, [])
  );

  // Background polling for notifications
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchStations(true); // silent fetch
    }, 30000); // 30 seconds

    return () => clearInterval(intervalId);
  }, []);

  // Monitor nearest stations when data changes
  useEffect(() => {
    if (driverCoords && stations.length > 0) {
      monitorNearestStations(driverCoords, stations);
    }
  }, [stations, driverCoords, monitorNearestStations]);

  useEffect(() => {
    let locationSubscription = null;

    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationText('Location unavailable');
        return;
      }

      try {
        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 10000, // 10 seconds
            distanceInterval: 50, // 50 meters
          },
          async (location) => {
            setDriverCoords({ lat: location.coords.latitude, lng: location.coords.longitude });
            
            let geocode = await Location.reverseGeocodeAsync({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            });

            let displayCity = '';
            let displayRegion = '';

            if (geocode && geocode.length > 0) {
              const { city, region, country, district, subregion, name } = geocode[0];
              displayCity = subregion || city || district || name;
              displayRegion = region || country;
            }

            // Fallback to a free geocoding API if expo-location on web fails or returns empty
            if (!displayCity) {
              try {
                const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${location.coords.latitude}&longitude=${location.coords.longitude}&localityLanguage=en`);
                const data = await response.json();
                displayCity = data.locality || data.city || data.principalSubdivision;
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
          }
        );
      } catch (error) {
        console.error('Error setting up location watcher:', error);
        setLocationText('Failed to track location');
      }
    })();

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, []);

  // Map real database stations to FuelStationCard props
  const formattedStations = stations.map(s => {
    return {
      id: s.id,
      name: s.displayName || 'Unknown Station',
      address: s.address || s.city || 'Unknown Address',
      location: s.location,
      distanceKm: driverCoords ? getDistance(driverCoords.lat, driverCoords.lng, s.location?.lat, s.location?.lng) : 'Calc...',
      isOpen: s.isOpen !== undefined ? s.isOpen : true,
      availability: s.availability || {
        petrol92: true,
        petrol95: true,
        diesel: true,
        superdiesel: false,
        kerosene: true,
      },
      queue: s.queueStatus || 'LOW',
      queueCount: s.queueCount || 0,
      lastUpdated: s.lastUpdated ? 'Just now' : 'Unknown',
      image: 'https://images.unsplash.com/photo-1545262810-77515befe149?w=900&q=80',
      rating: '5.0',
      reviews: 1,
      waitMinutes: (s.queueStatus === 'HIGH' ? 45 : (s.queueStatus === 'MEDIUM' ? 15 : 5))
    };
  });

  const filteredStations = formattedStations.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(activeSearch.toLowerCase()) ||
      s.address.toLowerCase().includes(activeSearch.toLowerCase());
    const matchesFuel = !activeFuel || s.availability[activeFuel];
    return matchesSearch && matchesFuel;
  });
  let sortedStations = [...filteredStations];
  if (!activeSearch && !activeFuel) {
    const savedStations = user?.savedStations || [];
    sortedStations.sort((a, b) => {
      const aSaved = savedStations.includes(a.id);
      const bSaved = savedStations.includes(b.id);
      if (aSaved && !bSaved) return -1;
      if (!aSaved && bSaved) return 1;
      return 0;
    });
  }

  const suggestions = (searchQuery && showSuggestions)
    ? formattedStations
        .filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.address.toLowerCase().includes(searchQuery.toLowerCase()))
        .slice(0, 5)
    : [];

  // Use sortedStations in the UI instead of filteredStations
  const stationsToDisplay = sortedStations;

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
            {unreadCount > 0 && (
              <View style={styles.bellDot}>
                <Text style={{color: colors.white, fontSize: 8, fontWeight: 'bold'}}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={{ zIndex: 10 }}>
          <View style={styles.searchRow}>
            <MaterialIcons name="search" size={20} color={colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search fuel station"
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                setShowSuggestions(text.length > 0);
                if (text === '') setActiveSearch('');
              }}
              onSubmitEditing={() => {
                setActiveSearch(searchQuery);
                setShowSuggestions(false);
                Keyboard.dismiss();
              }}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => {
                setActiveSearch(searchQuery);
                setShowSuggestions(false);
                Keyboard.dismiss();
              }} style={{ padding: 4 }}>
                <MaterialIcons name="arrow-forward" size={20} color={colors.primary} />
              </TouchableOpacity>
            )}
          </View>
          {showSuggestions && suggestions.length > 0 && (
            <View style={styles.suggestionsDropdown}>
              {suggestions.map(s => (
                <TouchableOpacity 
                  key={`sugg-${s.id}`}
                  style={styles.suggestionItem}
                  onPress={() => {
                    setSearchQuery(s.name);
                    setActiveSearch(s.name);
                    setShowSuggestions(false);
                    Keyboard.dismiss();
                  }}
                >
                  <MaterialIcons name="location-on" size={16} color={colors.textMuted} />
                  <Text style={styles.suggestionText}>{s.name} - {s.address}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Categories */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Fuel Types</Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {activeFuel && (
              <TouchableOpacity onPress={() => setActiveFuel(null)}>
                <Text style={styles.seeAll}>Clear</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => setExpandFuelTypes(!expandFuelTypes)}>
              <Text style={styles.seeAll}>{expandFuelTypes ? 'Show Less' : 'See All'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {expandFuelTypes ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, paddingBottom: spacing.sm }}>
            {fuelTypes.map((item) => {
              const active = activeFuel === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
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
            })}
          </View>
        ) : (
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
        )}

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
          <TouchableOpacity onPress={() => navigation.navigate('NearbyStations', { stations: formattedStations, driverCoords })}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        {loadingStations ? (
          <Text style={{ textAlign: 'center', marginVertical: 20, color: colors.textMuted }}>Loading stations...</Text>
        ) : fetchError ? (
          <Text style={{ textAlign: 'center', marginVertical: 20, color: colors.error }}>{fetchError}</Text>
        ) : filteredStations.length === 0 ? (
          <View style={{ alignItems: 'center', marginVertical: 40, paddingHorizontal: 20 }}>
            <MaterialIcons name="search-off" size={48} color={colors.textMuted} />
            <Text style={{ textAlign: 'center', marginTop: 12, color: colors.textMuted, fontSize: fontSizes.md }}>
              Couldn't find any stations {activeSearch ? `called "${activeSearch}"` : ''}
            </Text>
          </View>
        ) : (
          stationsToDisplay.map((item) => (
            <FuelStationCard 
              key={item.id.toString()}
              station={item} 
              driverCoords={driverCoords}
              onPress={() => navigation.navigate('StationDetails', { station: item, driverCoords })} 
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
    top: 6,
    right: 8,
    minWidth: 14,
    height: 14,
    paddingHorizontal: 2,
    borderRadius: 7,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.surfaceMuted,
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
  suggestionsDropdown: {
    position: 'absolute',
    top: 55,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderRadius: radii.md,
    ...shadow.card,
    zIndex: 100,
    elevation: 10,
    paddingVertical: spacing.sm,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  suggestionText: {
    fontSize: fontSizes.sm,
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
