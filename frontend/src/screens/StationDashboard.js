import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fontSizes, spacing, radii } from '../theme/theme';
import { useAuth } from '../context/AuthContext';

export default function StationDashboard() {
  const { user, logout } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Station Dashboard</Text>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <MaterialIcons name="logout" size={24} color={colors.danger} />
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        <View style={styles.card}>
          <Text style={styles.stationName}>{user?.name || 'Fuel Station'}</Text>
          <Text style={styles.stationInfo}>{user?.email}</Text>
          {user?.registrationNumber && <Text style={styles.stationInfo}>Reg No: {user.registrationNumber}</Text>}
        </View>

        <Text style={styles.welcome}>Welcome to the FuelTrack LK Station Portal.</Text>
        <Text style={styles.subtitle}>
          Here you will be able to manage your station's fuel availability, view incoming queues, and manage reports.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  logoutBtn: {
    padding: spacing.xs,
  },
  body: {
    flex: 1,
    padding: spacing.lg,
  },
  card: {
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
    fontSize: fontSizes.xl,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  stationInfo: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  welcome: {
    fontSize: fontSizes.base,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    lineHeight: 22,
  },
});
