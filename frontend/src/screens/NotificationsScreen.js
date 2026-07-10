import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fontSizes, spacing, radii } from '../theme/theme';
import ScreenHeader from '../components/ScreenHeader';

const NOTIFICATIONS = [
  {
    id: 'n1',
    icon: 'local-gas-station',
    title: 'Fuel supply arrived',
    body: 'Ceylon Petroleum - Rajagiriya just received a new fuel delivery.',
    time: '5 min ago',
    color: '#3BB273',
  },
  {
    id: 'n2',
    icon: 'schedule',
    title: 'Best time to visit',
    body: 'Queues near Pita Kotte are predicted to drop after 1:00 PM today.',
    time: '1 hr ago',
    color: '#F2655C',
  },
  {
    id: 'n3',
    icon: 'warning-amber',
    title: 'Long queue alert',
    body: 'Sino Lanka Filling Station is reporting a 45 min wait time.',
    time: '3 hr ago',
    color: '#F2A93B',
  },
  {
    id: 'n4',
    icon: 'check-circle-outline',
    title: 'Report confirmed',
    body: 'Thanks! Your queue report for Lanka IOC - Kotte was verified.',
    time: 'Yesterday',
    color: '#3BB273',
  },
];

export default function NotificationsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="Notifications" />
      <ScrollView contentContainerStyle={styles.scroll}>
        {NOTIFICATIONS.map((n) => (
          <View key={n.id} style={styles.row}>
            <View style={[styles.iconCircle, { backgroundColor: `${n.color}1A` }]}>
              <MaterialIcons name={n.icon} size={18} color={n.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{n.title}</Text>
              <Text style={styles.body}>{n.body}</Text>
              <Text style={styles.time}>{n.time}</Text>
            </View>
          </View>
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
  row: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  body: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 17,
  },
  time: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 4,
  },
});
