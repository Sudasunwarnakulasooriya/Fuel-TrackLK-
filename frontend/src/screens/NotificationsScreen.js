import React, { useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fontSizes, spacing, radii } from '../theme/theme';
import ScreenHeader from '../components/ScreenHeader';
import { useNotifications } from '../context/NotificationContext';

export default function NotificationsScreen() {
  const { notifications, markAllAsRead } = useNotifications();

  useEffect(() => {
    markAllAsRead();
  }, [markAllAsRead]);
  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="Notifications" />
      <ScrollView contentContainerStyle={styles.scroll}>
        {notifications.length === 0 ? (
          <Text style={{ textAlign: 'center', marginTop: 40, color: colors.textMuted }}>
            No new notifications
          </Text>
        ) : (
          notifications.map((n) => (
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
