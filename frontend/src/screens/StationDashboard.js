import { GlobalAlertRef } from '../components/GlobalAlert';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Switch, TouchableOpacity, TextInput, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fontSizes, spacing, radii } from '../theme/theme';
import { useAuth } from '../context/AuthContext';
import PrimaryButton from '../components/PrimaryButton';

const FUEL_TYPES = [
  { id: 'petrol92', label: 'Petrol 92', icon: 'local-gas-station' },
  { id: 'petrol95', label: 'Petrol 95', icon: 'local-gas-station' },
  { id: 'diesel', label: 'Diesel', icon: 'local-shipping' },
  { id: 'superdiesel', label: 'Super Diesel', icon: 'local-shipping' },
  { id: 'kerosene', label: 'Kerosene', icon: 'opacity' },
];

const QUEUE_OPTIONS = [
  { id: 'LOW', label: 'Short', color: colors.success },
  { id: 'MEDIUM', label: 'Moderate', color: colors.warning },
  { id: 'HIGH', label: 'Long', color: colors.danger },
];

export default function StationDashboard() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(true);
  
  // Fuel Availability State
  const [availability, setAvailability] = useState({
    petrol92: true,
    petrol95: true,
    diesel: true,
    superdiesel: false,
    kerosene: true,
  });

  // Queue State
  const [queueStatus, setQueueStatus] = useState('MEDIUM');
  const [queueCount, setQueueCount] = useState('15');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch current station status on mount
    const fetchStatus = async () => {
      try {
        const apiUrl = 'https://fuel-track-backend.onrender.com';
        const res = await fetch(`${apiUrl}/api/users/${user.uid}`);
        if (res.ok) {
          const data = await res.json();
          if (data.isOpen !== undefined) setIsOpen(data.isOpen);
          if (data.availability) setAvailability(data.availability);
          if (data.queueStatus) setQueueStatus(data.queueStatus);
          if (data.queueCount) setQueueCount(data.queueCount);
        }
      } catch (e) {
        console.error('Error fetching station status', e);
      }
    };
    if (user?.uid) fetchStatus();
  }, [user]);

  const toggleFuel = (id) => {
    setAvailability((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const apiUrl = 'https://fuel-track-backend.onrender.com';
      const res = await fetch(`${apiUrl}/api/users/${user.uid}/station-status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isOpen,
          availability,
          queueStatus,
          queueCount
        })
      });
      if (res.ok) {
        GlobalAlertRef.current?.alert('Notice', 'Station updates saved successfully!');
      } else {
        GlobalAlertRef.current?.alert('Notice', 'Failed to save updates');
      }
    } catch (e) {
      console.error(e);
      GlobalAlertRef.current?.alert('Notice', 'Error saving updates');
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Station Dashboard</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          <Text style={styles.stationName}>{user?.name || 'Fuel Station'}</Text>
          <Text style={styles.stationInfo}>{user?.email}</Text>
          
          <View style={styles.statusButtonsWrap}>
            <TouchableOpacity 
              style={[styles.statusBtn, isOpen && styles.statusBtnOpen]}
              onPress={() => setIsOpen(true)}
              activeOpacity={0.8}
            >
              <MaterialIcons name="check-circle" size={18} color={isOpen ? colors.white : colors.success} />
              <Text style={[styles.statusBtnText, { color: isOpen ? colors.white : colors.success }]}>Open</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.statusBtn, !isOpen && styles.statusBtnClosed]}
              onPress={() => setIsOpen(false)}
              activeOpacity={0.8}
            >
              <MaterialIcons name="cancel" size={18} color={!isOpen ? colors.white : colors.danger} />
              <Text style={[styles.statusBtnText, { color: !isOpen ? colors.white : colors.danger }]}>Closed</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Fuel Availability */}
        <Text style={styles.sectionTitle}>Fuel Availability</Text>
        <View style={styles.card}>
          {FUEL_TYPES.map((fuel, index) => {
            const isAvailable = availability[fuel.id];
            return (
              <View
                key={fuel.id}
                style={[
                  styles.fuelRow,
                  index === FUEL_TYPES.length - 1 && { borderBottomWidth: 0 },
                ]}
              >
                <View style={styles.fuelRowLeft}>
                  <View style={[styles.iconCircle, { backgroundColor: isAvailable ? colors.primaryTint : colors.surfaceMuted }]}>
                    <MaterialIcons name={fuel.icon} size={20} color={isAvailable ? colors.primary : colors.textMuted} />
                  </View>
                  <Text style={styles.fuelLabel}>{fuel.label}</Text>
                </View>
                <View style={styles.fuelRowRight}>
                  <Text style={[styles.statusText, { color: isAvailable ? colors.success : colors.textMuted }]}>
                    {isAvailable ? 'Available' : 'Out of Stock'}
                  </Text>
                  <Switch
                    value={isAvailable}
                    onValueChange={() => toggleFuel(fuel.id)}
                    trackColor={{ false: colors.surfaceMuted, true: colors.primaryTint }}
                    thumbColor={isAvailable ? colors.primary : colors.textMuted}
                  />
                </View>
              </View>
            );
          })}
        </View>

        {/* Queue Management */}
        <Text style={styles.sectionTitle}>Queue Management</Text>
        <View style={styles.card}>
          <Text style={styles.inputLabel}>Current Queue Status</Text>
          <View style={styles.queueSegmentWrap}>
            {QUEUE_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.id}
                style={[
                  styles.queueSegmentBtn,
                  queueStatus === opt.id && { backgroundColor: opt.color, borderColor: opt.color },
                ]}
                onPress={() => setQueueStatus(opt.id)}
              >
                <Text
                  style={[
                    styles.queueSegmentText,
                    queueStatus === opt.id && { color: colors.white },
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Vehicles</Text>
            <TextInput
              style={styles.textInput}
              value={queueCount}
              onChangeText={setQueueCount}
              keyboardType="numeric"
              placeholder="e.g. 15"
            />
          </View>
        </View>

        <PrimaryButton
          title={loading ? "Saving..." : "Save Changes"}
          onPress={handleSave}
          disabled={loading}
          style={styles.saveBtn}
          icon={<MaterialIcons name="save" size={20} color={colors.white} />}
        />

        {/* Informational Estimate Box */}
        <View style={styles.estTimeBox}>
          <MaterialIcons name="info-outline" size={18} color={colors.primary} />
          <Text style={styles.estTimeText}>
            Estimated wait time is automatically calculated based on queue status.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: fontSizes.lg,
    fontWeight: '800',
    color: colors.primary,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  statusCard: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: radii.lg,
    marginBottom: spacing.xl,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  stationName: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  stationInfo: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  statusButtonsWrap: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statusBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.sm + 2,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  statusBtnOpen: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  statusBtnClosed: {
    backgroundColor: colors.danger,
    borderColor: colors.danger,
  },
  statusBtnText: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: fontSizes.md,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.xl,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  fuelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  fuelRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fuelLabel: {
    fontSize: fontSizes.base,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  fuelRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusText: {
    fontSize: fontSizes.xs,
    fontWeight: '600',
  },
  inputLabel: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  queueSegmentWrap: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
    marginTop: spacing.xs,
  },
  queueSegmentBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  queueSegmentText: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  inputGroup: {
    flex: 1,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSizes.base,
    color: colors.textPrimary,
    backgroundColor: colors.surfaceMuted,
  },
  saveBtn: {
    marginTop: spacing.sm,
  },
  estTimeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primaryTint,
    padding: spacing.md,
    borderRadius: radii.md,
    marginTop: spacing.lg,
  },
  estTimeText: {
    flex: 1,
    fontSize: fontSizes.xs,
    color: colors.primaryDark,
    lineHeight: 18,
  }
});
