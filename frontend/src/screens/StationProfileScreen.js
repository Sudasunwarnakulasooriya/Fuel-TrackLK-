import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fontSizes, spacing, radii } from '../theme/theme';
import { useAuth } from '../context/AuthContext';

const MENU_ITEMS = [
  { id: 'account', label: 'Manage Station Account', icon: 'store', screen: 'ManageAccount' },
  { id: 'reviews', label: 'Station Reviews', icon: 'star-rate', screen: 'StationReviews' },
  { id: 'notifications', label: 'Notification Settings', icon: 'notifications-none', screen: 'NotificationSettings' },
  { id: 'help', label: 'Help & Support', icon: 'help-outline', screen: 'HelpSupport' },
];

export default function StationProfileScreen({ navigation }) {
  const { logout, user } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Station Profile</Text>

        <View style={styles.profileCard}>
          <View style={styles.avatarPlaceholder}>
            <MaterialIcons name="local-gas-station" size={32} color={colors.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{user?.name || 'Fuel Station'}</Text>
            <Text style={styles.email}>{user?.email || 'station@example.com'}</Text>
            {user?.registrationNumber && (
              <Text style={styles.regNo}>Reg No: {user.registrationNumber}</Text>
            )}
          </View>
        </View>

        <View style={styles.menuCard}>
          {MENU_ITEMS.map((item, i) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.menuRow, i === MENU_ITEMS.length - 1 && styles.menuRowLast]}
              onPress={() => item.screen && navigation.navigate(item.screen)}
            >
              <View style={styles.menuLeft}>
                <View style={styles.menuIconCircle}>
                  <MaterialIcons name={item.icon} size={18} color={colors.primary} />
                </View>
                <Text style={styles.menuLabel}>{item.label}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.signOutBtn} onPress={logout}>
          <MaterialIcons name="logout" size={18} color={colors.danger} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
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
  title: {
    fontSize: fontSizes.xl,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryTint,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.sm + 4,
    marginBottom: spacing.lg,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: fontSizes.base,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  email: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  regNo: {
    fontSize: fontSizes.xs,
    color: colors.primaryDark,
    fontWeight: '600',
    marginTop: 4,
  },
  menuCard: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.lg,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  menuRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 5,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuRowLast: {
    borderBottomWidth: 0,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: spacing.sm + 4,
  },
  signOutText: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: colors.danger,
  },
});
