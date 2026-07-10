import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fontSizes, spacing, radii } from '../theme/theme';
import ScreenHeader from '../components/ScreenHeader';
import { useAuth } from '../context/AuthContext';
import PrimaryButton from '../components/PrimaryButton';

export default function MyVehiclesScreen({ navigation }) {
  const { user } = useAuth();
  
  // Use the registered vehicle or a mock one if not available
  const VEHICLES = [
    { 
      id: '1', 
      type: 'Car', 
      regNumber: user.registrationNumber || user.vehicle || 'CAB-4521', 
      fuelType: 'Petrol 92',
      isPrimary: true 
    }
  ];

  const renderItem = ({ item }) => (
    <View style={styles.vehicleCard}>
      <View style={styles.vehicleIconContainer}>
        <MaterialIcons name="directions-car" size={28} color={colors.primary} />
      </View>
      <View style={styles.vehicleInfo}>
        <Text style={styles.vehicleTitle}>{item.regNumber}</Text>
        <Text style={styles.vehicleSubtitle}>{item.type} • {item.fuelType}</Text>
      </View>
      {item.isPrimary && (
        <View style={styles.primaryBadge}>
          <Text style={styles.primaryText}>Primary</Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="My Vehicles" onBack={() => navigation.goBack()} />
      <FlatList
        data={VEHICLES}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        renderItem={renderItem}
      />
      <View style={styles.footer}>
        <PrimaryButton title="Add New Vehicle" onPress={() => alert('Add Vehicle Modal')} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  listContainer: { padding: spacing.lg, paddingBottom: spacing.xxl },
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  vehicleIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleTitle: {
    fontSize: fontSizes.md,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  vehicleSubtitle: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  primaryBadge: {
    backgroundColor: colors.success + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  primaryText: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    color: colors.success,
  },
  footer: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
