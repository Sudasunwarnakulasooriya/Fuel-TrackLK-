import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fontSizes, spacing, radii } from '../theme/theme';
import ScreenHeader from '../components/ScreenHeader';

// Mock report history data
const REPORT_HISTORY = [
  { id: '1', station: 'Ceylon Petroleum - Rajagiriya', fuelType: 'Petrol 92', queueStatus: 'Short queue (8 mins)', date: 'Oct 24, 2026 - 10:30 AM', confirmed: true },
  { id: '2', station: 'Lanka IOC - Battaramulla', fuelType: 'Diesel', queueStatus: 'Long queue (45 mins)', date: 'Oct 22, 2026 - 02:15 PM', confirmed: true },
  { id: '3', station: 'Laughs - Nawala', fuelType: 'Petrol 95', queueStatus: 'No queue', date: 'Oct 20, 2026 - 09:00 AM', confirmed: false },
];

export default function ReportHistoryScreen({ navigation }) {
  const renderItem = ({ item }) => (
    <View style={styles.historyCard}>
      <View style={styles.cardHeader}>
        <View style={styles.stationInfo}>
          <MaterialIcons name="local-gas-station" size={20} color={colors.primary} />
          <Text style={styles.stationName} numberOfLines={1}>{item.station}</Text>
        </View>
        {item.confirmed ? (
          <View style={styles.statusBadge}>
            <MaterialIcons name="verified" size={12} color={colors.success} />
            <Text style={styles.statusText}>Verified</Text>
          </View>
        ) : (
          <View style={[styles.statusBadge, { backgroundColor: colors.warning + '20' }]}>
            <MaterialIcons name="pending" size={12} color={colors.warning} />
            <Text style={[styles.statusText, { color: colors.warning }]}>Pending</Text>
          </View>
        )}
      </View>

      <View style={styles.divider} />

      <View style={styles.detailsRow}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Fuel Type</Text>
          <Text style={styles.detailValue}>{item.fuelType}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Queue Reported</Text>
          <Text style={styles.detailValue}>{item.queueStatus}</Text>
        </View>
      </View>

      <Text style={styles.dateText}>{item.date}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="Report History" onBack={() => navigation.goBack()} />
      <FlatList
        data={REPORT_HISTORY}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="history" size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>You haven't made any reports yet.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  listContainer: { padding: spacing.lg, paddingBottom: spacing.xxl },
  historyCard: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  stationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  stationName: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.success + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  statusText: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    color: colors.success,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  dateText: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    marginTop: spacing.md,
    textAlign: 'right',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
});
