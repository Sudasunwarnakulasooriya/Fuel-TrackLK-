import { GlobalAlertRef } from '../components/GlobalAlert';
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
// Dynamically load MapView to prevent crashes on the Web
let MapView, Marker;
if (Platform.OS !== 'web') {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Marker = Maps.Marker;
} else {
  // Dummy components for Web fallback
  MapView = ({ children, style }) => (
    <View style={[style, { backgroundColor: '#e1e4e8', justifyContent: 'center', alignItems: 'center' }]}>
      <Text style={{ color: '#666' }}>Interactive Map not supported on Web.</Text>
      <Text style={{ color: '#666' }}>Please use Expo Go on your mobile device.</Text>
    </View>
  );
  Marker = () => null;
}
import { colors, fontSizes, spacing, radii } from '../theme/theme';
import InputField from '../components/InputField';
import PrimaryButton from '../components/PrimaryButton';
import ScreenHeader from '../components/ScreenHeader';

export default function SignUpStationScreen({ navigation }) {
  const [nameCity, setNameCity] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  
  // Location state
  const [locationStr, setLocationStr] = useState('');
  const [coordinates, setCoordinates] = useState({ lat: 6.9271, lng: 79.8612 }); // Default to Colombo
  const [mapModalVisible, setMapModalVisible] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeout = useRef(null);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const [loading, setLoading] = useState(false);

  // Search using Nominatim (OpenStreetMap API)
  const searchLocation = (text) => {
    setSearchQuery(text);
    
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    
    if (text.length > 2) {
      setIsSearching(true);
      searchTimeout.current = setTimeout(async () => {
        try {
          // Switch to Photon API (OSM-based) because Nominatim aggressively IP-bans web clients
          const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(text)}&limit=5`);
          if (res.ok) {
            const data = await res.json();
            if (data.features) {
              const formattedData = data.features.map(f => {
                const p = f.properties;
                const addressParts = [p.name, p.street, p.city, p.county, p.state].filter(Boolean);
                return {
                  lat: f.geometry.coordinates[1],
                  lon: f.geometry.coordinates[0],
                  display_name: addressParts.join(', ')
                };
              });
              setSuggestions(formattedData);
            } else {
              setSuggestions([]);
            }
          } else {
            console.log("Photon error", res.status);
          }
        } catch (err) {
          console.log("Error fetching location", err);
        }
        setIsSearching(false);
      }, 800); // 800ms debounce
    } else {
      setSuggestions([]);
      setIsSearching(false);
    }
  };

  const selectSuggestion = (item) => {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    setCoordinates({ lat, lng });
    setLocationStr(item.display_name);
    setSuggestions([]);
    setSearchQuery(item.display_name);
  };

  const handleSignUp = async () => {
    if (!email || !nameCity || !registrationNumber || !locationStr) {
      GlobalAlertRef.current?.alert('Notice', 'Please fill out the required fields');
      return;
    }
    
    if (password !== confirm) {
      GlobalAlertRef.current?.alert('Notice', 'Passwords do not match');
      return;
    }
    
    setLoading(true);
    try {
      const apiUrl = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/users/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const data = await response.json();
      setLoading(false);
      
      if (response.ok) {
        navigation.navigate('Verify', { 
          email, 
          name: nameCity, 
          password, 
          role: 'station', 
          city: nameCity, 
          registrationNumber, 
          location: coordinates,
          address: locationStr
        });
      } else {
        GlobalAlertRef.current?.alert('Notice', data.error || 'Failed to send OTP');
      }
    } catch (error) {
      setLoading(false);
      GlobalAlertRef.current?.alert('Notice', 'Error connecting to backend: ' + error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="Register Station" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          
          <Text style={styles.title}>Fuel Station Details</Text>
          <Text style={styles.subtitle}>Enter your official station details to register.</Text>

          <InputField
            label="Name with City"
            icon="storefront"
            placeholder="e.g. CEYPETCO - Colombo 07"
            value={nameCity}
            onChangeText={setNameCity}
            autoCapitalize="words"
          />
          <InputField
            label="Registration Number"
            icon="badge"
            placeholder="Gov issued ID / Reg No"
            value={registrationNumber}
            onChangeText={setRegistrationNumber}
            autoCapitalize="characters"
          />
          
          {/* Custom Location Field */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Location (Address)</Text>
            <TouchableOpacity 
              style={styles.locationSelector}
              onPress={() => setMapModalVisible(true)}
            >
              <MaterialIcons name="place" size={20} color={colors.textSecondary} />
              <Text style={[styles.locationText, !locationStr && styles.locationPlaceholder]} numberOfLines={1}>
                {locationStr || "Select station location..."}
              </Text>
            </TouchableOpacity>
          </View>

          <InputField
            label="Email"
            icon="mail-outline"
            placeholder="station@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />
          <InputField
            label="Password"
            icon="lock-outline"
            placeholder="••••••••"
            secure
            value={password}
            onChangeText={setPassword}
          />
          <InputField
            label="Confirm password"
            icon="lock-outline"
            placeholder="••••••••"
            secure
            value={confirm}
            onChangeText={setConfirm}
          />

          <PrimaryButton
            title={loading ? "Sending OTP..." : "Register"}
            onPress={handleSignUp}
            style={{ marginTop: spacing.md }}
            disabled={loading}
          />

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Map Autocomplete Modal */}
      <Modal
        visible={mapModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setMapModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setMapModalVisible(false)} style={styles.closeBtn}>
              <MaterialIcons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Set Location</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <MaterialIcons name="search" size={20} color={colors.textSecondary} />
              <TextInput 
                style={styles.searchInput}
                placeholder="Search location..."
                value={searchQuery}
                onChangeText={searchLocation}
              />
              {isSearching && <ActivityIndicator size="small" color={colors.primary} />}
            </View>

            {suggestions.length > 0 && (
              <View style={styles.suggestionsList}>
                {suggestions.map((item, index) => (
                  <TouchableOpacity 
                    key={index} 
                    style={styles.suggestionItem}
                    onPress={() => selectSuggestion(item)}
                  >
                    <MaterialIcons name="place" size={20} color={colors.textSecondary} />
                    <Text style={styles.suggestionText} numberOfLines={2}>
                      {item.display_name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.mapWrapper}>
            <MapView
              style={styles.map}
              region={{
                latitude: coordinates.lat,
                longitude: coordinates.lng,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }}
              onRegionChangeComplete={(region) => {
                // Allows user to drag map to pin-point if no active suggestion is selected
                if (suggestions.length === 0) {
                  setCoordinates({ lat: region.latitude, lng: region.longitude });
                }
              }}
            >
              <Marker coordinate={{ latitude: coordinates.lat, longitude: coordinates.lng }} />
            </MapView>
            <View style={styles.mapPinHelper}>
              <Text style={styles.mapPinText}>Drag map to adjust exact pin location</Text>
            </View>
          </View>

          <View style={styles.modalFooter}>
            <PrimaryButton 
              title="Confirm Location" 
              onPress={() => setMapModalVisible(false)} 
            />
          </View>
        </SafeAreaView>
      </Modal>

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
  title: {
    fontSize: fontSizes.xl,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  inputContainer: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: fontSizes.xs,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  locationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    paddingHorizontal: spacing.md,
    height: 52,
    borderRadius: radii.md,
  },
  locationText: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: fontSizes.base,
    color: colors.textPrimary,
  },
  locationPlaceholder: {
    color: colors.textSecondary,
  },
  
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: colors.white,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeBtn: {
    padding: spacing.xs,
  },
  modalTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  searchContainer: {
    padding: spacing.md,
    zIndex: 10,
    backgroundColor: colors.white,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    height: 50,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: fontSizes.base,
    color: colors.textPrimary,
  },
  suggestionsList: {
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.xs,
    maxHeight: 200,
    overflow: 'hidden',
    position: 'absolute',
    top: 65,
    left: spacing.md,
    right: spacing.md,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  suggestionText: {
    marginLeft: spacing.sm,
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
  },
  mapWrapper: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  mapPinHelper: {
    position: 'absolute',
    top: spacing.md,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
  },
  mapPinText: {
    color: colors.white,
    fontSize: fontSizes.xs,
    fontWeight: '600',
  },
  modalFooter: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  }
});
