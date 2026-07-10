import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Switch } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fontSizes, spacing, radii } from '../theme/theme';
import ScreenHeader from '../components/ScreenHeader';

export default function NotificationSettingsScreen({ navigation }) {
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [promoEnabled, setPromoEnabled] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="Notification Settings" onBack={() => navigation.goBack()} />
      <View style={styles.content}>
        
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Push Notifications</Text>
            <Text style={styles.settingDesc}>Receive live alerts for queue updates and nearby fuel availability.</Text>
          </View>
          <Switch
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.white}
            onValueChange={setPushEnabled}
            value={pushEnabled}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Email Alerts</Text>
            <Text style={styles.settingDesc}>Get weekly summaries and account security alerts via email.</Text>
          </View>
          <Switch
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.white}
            onValueChange={setEmailEnabled}
            value={emailEnabled}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Promotional Offers</Text>
            <Text style={styles.settingDesc}>Receive special discounts and offers from our partners.</Text>
          </View>
          <Switch
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.white}
            onValueChange={setPromoEnabled}
            value={promoEnabled}
          />
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  content: { padding: spacing.lg },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  settingInfo: {
    flex: 1,
    paddingRight: spacing.lg,
  },
  settingTitle: {
    fontSize: fontSizes.md,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  settingDesc: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.lg,
  },
});
