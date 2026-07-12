import { GlobalAlertRef } from '../components/GlobalAlert';
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fontSizes, spacing, radii } from '../theme/theme';
import ScreenHeader from '../components/ScreenHeader';
import InputField from '../components/InputField';
import PrimaryButton from '../components/PrimaryButton';
import { useAuth } from '../context/AuthContext';

// Dynamically load MapView to prevent crashes on the Web
let MapView, Marker;
if (Platform.OS !== 'web') {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Marker = Maps.Marker;
} else {
  MapView = ({ children, style }) => (
    <View style={[style, { backgroundColor: '#e1e4e8', justifyContent: 'center', alignItems: 'center' }]}>
      <Text style={{ color: '#666' }}>Interactive Map not supported on Web.</Text>
      <Text style={{ color: '#666' }}>Please use Expo Go on your mobile device.</Text>
    </View>
  );
  Marker = () => null;
}

export default function ManageAccountScreen({ navigation }) {
  const { user, setUser } = useAuth();
  
  const [name, setName] = useState(user.name || user.displayName || '');
  // Clear the "Car . CAB-4521" mock data if it's a station
  const defaultVehicle = user.role === 'station' 
    ? (user.registrationNumber && user.registrationNumber.includes('Car') ? '' : (user.registrationNumber || '')) 
    : (user.vehicle || user.registrationNumber || '');
    
  const [vehicle, setVehicle] = useState(defaultVehicle);
  const [email, setEmail] = useState(user.email || '');
  const [newPassword, setNewPassword] = useState('');
  
  // Station Location State
  const [locationStr, setLocationStr] = useState(user.address || '');
  const defaultLat = user.location?.lat || 6.9271;
  const defaultLng = user.location?.lng || 79.8612;
  const [coordinates, setCoordinates] = useState({ lat: defaultLat, lng: defaultLng });
  const [mapModalVisible, setMapModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const [loading, setLoading] = useState(false);
  
  // Verification Modal State
  const [verifyVisible, setVerifyVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');

  const searchTimeout = useRef(null);

  // Map Search
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

  const handleSaveBasicInfo = async () => {
    // Save basic info directly to backend
    setLoading(true);
    try {
      const apiUrl = 'https://fuel-track-backend.onrender.com';
      const bodyParams = { displayName: name, registrationNumber: vehicle };
      if (user.role === 'station') {
        bodyParams.location = coordinates;
        bodyParams.address = locationStr;
      }

      const response = await fetch(`${apiUrl}/api/users/${user.uid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyParams)
      });
      
      if (response.ok) {
        setUser((prev) => ({ 
          ...prev, 
          name, 
          displayName: name, 
          vehicle, 
          registrationNumber: vehicle,
          ...(user.role === 'station' && { location: coordinates, address: locationStr })
        }));
        GlobalAlertRef.current?.alert('Notice', 'Basic details updated!');
        navigation.goBack();
      } else {
        GlobalAlertRef.current?.alert('Notice', 'Failed to update details');
      }
    } catch (e) {
      console.error(e);
      GlobalAlertRef.current?.alert('Notice', 'Error updating details');
    }
    setLoading(false);
  };

  const initiateSecureSave = () => {
    // Only require password if email or password is being changed
    if (email !== user.email || newPassword.length > 0) {
      setVerifyVisible(true);
    } else {
      handleSaveBasicInfo();
    }
  };

  const handleSecureSave = async () => {
    if (!currentPassword) {
      GlobalAlertRef.current?.alert('Notice', 'Please enter your current password');
      return;
    }
    
    setLoading(true);
    try {
      const apiUrl = 'https://fuel-track-backend.onrender.com';
      
      const bodyParams = { 
        email, 
        newPassword, 
        currentPassword,
        displayName: name,
        registrationNumber: vehicle
      };

      if (user.role === 'station') {
        bodyParams.location = coordinates;
        bodyParams.address = locationStr;
      }

      const response = await fetch(`${apiUrl}/api/users/${user.uid}/secure-update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyParams)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setUser((prev) => ({ 
          ...prev, 
          email,
          name, 
          displayName: name, 
          vehicle, 
          registrationNumber: vehicle,
          ...(user.role === 'station' && { location: coordinates, address: locationStr })
        }));
        setVerifyVisible(false);
        setCurrentPassword('');
        setNewPassword('');
        GlobalAlertRef.current?.alert('Notice', 'Account successfully updated!');
        navigation.goBack();
      } else {
        GlobalAlertRef.current?.alert('Notice', data.error || 'Verification failed');
      }
    } catch (e) {
      console.error(e);
      GlobalAlertRef.current?.alert('Notice', 'Error communicating with server');
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title={user.role === 'station' ? "Manage Station Account" : "Manage Account"} onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll}>
          
          <Text style={styles.sectionTitle}>Basic Information</Text>
          <InputField
            label={user.role === 'station' ? "Station Name with City" : "Full Name"}
            icon={user.role === 'station' ? "storefront" : "person-outline"}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
          
          {user.role === 'station' && (
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Station Location (Address)</Text>
              <TouchableOpacity 
                style={styles.locationSelector}
                onPress={() => setMapModalVisible(true)}
              >
                <MaterialIcons name="place" size={20} color={colors.textSecondary} />
                <Text style={[styles.locationText, !locationStr && styles.locationPlaceholder]} numberOfLines={1}>
                  {locationStr || "Update station location..."}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {user.role === 'station' && (
            <InputField
              label="Station Registration Number"
              icon="badge"
              value={vehicle}
              onChangeText={setVehicle}
              autoCapitalize="characters"
            />
          )}

          <View style={styles.divider} />
          
          <Text style={styles.sectionTitle}>Security (Requires Verification)</Text>
          <InputField
            label="Email Address"
            icon="mail-outline"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />
          <InputField
            label="New Password"
            icon="lock-outline"
            placeholder="Leave blank to keep current"
            value={newPassword}
            onChangeText={setNewPassword}
            secure
          />

          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={styles.btnCancel} 
              onPress={() => navigation.goBack()}
              disabled={loading}
            >
              <Text style={styles.btnCancelText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.btnSave, loading && { opacity: 0.7 }]} 
              onPress={initiateSecureSave}
              disabled={loading}
            >
              <Text style={styles.btnSaveText}>{loading ? 'Saving...' : 'Save Changes'}</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Verification Modal */}
      <Modal visible={verifyVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Verify Identity</Text>
            <Text style={styles.modalText}>Please enter your current password to save security changes.</Text>
            
            <InputField
              label="Current Password"
              icon="lock"
              secure
              value={currentPassword}
              onChangeText={setCurrentPassword}
            />
            
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setVerifyVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleSecureSave} disabled={loading}>
                <Text style={styles.confirmBtnText}>{loading ? 'Verifying...' : 'Confirm'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Map Autocomplete Modal for Station Location Update */}
      <Modal
        visible={mapModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setMapModalVisible(false)}
      >
        <SafeAreaView style={styles.mapModalContainer}>
          <View style={styles.mapModalHeader}>
            <TouchableOpacity onPress={() => setMapModalVisible(false)} style={styles.closeBtn}>
              <MaterialIcons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.mapModalTitle}>Update Location</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <MaterialIcons name="search" size={20} color={colors.textSecondary} />
              <TextInput 
                style={styles.searchInput}
                placeholder="Search new location..."
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
                // Allows user to drag map to pin-point
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

          <View style={styles.mapModalFooter}>
            <PrimaryButton 
              title="Confirm New Location" 
              onPress={() => setMapModalVisible(false)} 
            />
          </View>
        </SafeAreaView>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  scroll: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xxl },
  sectionTitle: { fontSize: fontSizes.md, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.md },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.xl },
  
  // Custom Input for Location
  inputContainer: { marginBottom: spacing.md },
  inputLabel: { fontSize: fontSizes.xs, fontWeight: '600', color: colors.textSecondary, marginBottom: spacing.xs },
  locationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    paddingHorizontal: spacing.md,
    height: 52,
    borderRadius: radii.md,
  },
  locationText: { flex: 1, marginLeft: spacing.sm, fontSize: fontSizes.base, color: colors.textPrimary },
  locationPlaceholder: { color: colors.textSecondary },

  // Buttons Row
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
    gap: spacing.md
  },
  btnCancel: {
    flex: 1,
    height: 54,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnCancelText: {
    color: colors.textPrimary,
    fontSize: fontSizes.base,
    fontWeight: '700'
  },
  btnSave: {
    flex: 1.5,
    height: 54,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  btnSaveText: {
    color: colors.white,
    fontSize: fontSizes.base,
    fontWeight: '700'
  },

  // Verify Modal
  modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', padding: spacing.lg },
  modalContainer: { backgroundColor: colors.surface, padding: spacing.xl, borderRadius: radii.lg },
  modalTitle: { fontSize: fontSizes.lg, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.sm },
  modalText: { fontSize: fontSizes.sm, color: colors.textSecondary, marginBottom: spacing.lg },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.md, marginTop: spacing.lg },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: radii.md, backgroundColor: colors.surfaceMuted },
  cancelBtnText: { color: colors.textPrimary, fontWeight: '600' },
  confirmBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: radii.md, backgroundColor: colors.primary },
  confirmBtnText: { color: colors.white, fontWeight: '600' },

  // Map Modal
  mapModalContainer: { flex: 1, backgroundColor: colors.white },
  mapModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeBtn: { padding: spacing.xs },
  mapModalTitle: { fontSize: fontSizes.lg, fontWeight: '700', color: colors.textPrimary },
  searchContainer: { padding: spacing.md, zIndex: 10, backgroundColor: colors.white },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    height: 50,
  },
  searchInput: { flex: 1, marginLeft: spacing.sm, fontSize: fontSizes.base, color: colors.textPrimary },
  suggestionsList: {
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.xs,
    maxHeight: 200,
    position: 'absolute',
    top: 65, left: spacing.md, right: spacing.md,
    overflow: 'hidden'
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  suggestionText: { marginLeft: spacing.sm, fontSize: fontSizes.sm, color: colors.textPrimary },
  mapWrapper: { flex: 1, position: 'relative' },
  map: { flex: 1 },
  mapPinHelper: {
    position: 'absolute',
    top: spacing.md,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
  },
  mapPinText: { color: colors.white, fontSize: fontSizes.xs, fontWeight: '600' },
  mapModalFooter: { padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border }
});
