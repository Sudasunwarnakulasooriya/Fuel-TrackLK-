import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fontSizes, spacing, radii } from '../theme/theme';
import ScreenHeader from '../components/ScreenHeader';
import PrimaryButton from '../components/PrimaryButton';
import { GlobalAlertRef } from '../components/GlobalAlert';

export default function GeneralSettingsScreen({ navigation }) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [dataSaver, setDataSaver] = useState(false);
  const [language, setLanguage] = useState('English');

  const handleSave = () => {
    GlobalAlertRef.current?.alert('Success', 'General settings saved successfully!', () => {
      navigation.goBack();
    });
  };

  const handleLanguageSelect = () => {
    // In a real app, this would open a modal or dropdown to select language.
    // For this mockup, we just cycle between some languages.
    if (language === 'English') setLanguage('Sinhala');
    else if (language === 'Sinhala') setLanguage('Tamil');
    else setLanguage('English');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="General Settings" showBack onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.iconCircle, { backgroundColor: '#E0E7FF' }]}>
                  <MaterialIcons name="dark-mode" size={20} color="#4F46E5" />
                </View>
                <View>
                  <Text style={styles.settingLabel}>Dark Mode</Text>
                  <Text style={styles.settingDesc}>Enable dark theme</Text>
                </View>
              </View>
              <Switch
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.white}
                ios_backgroundColor={colors.border}
                onValueChange={() => setIsDarkMode(!isDarkMode)}
                value={isDarkMode}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.card}>
            <TouchableOpacity style={[styles.settingRow, styles.borderBottom]} onPress={handleLanguageSelect}>
              <View style={styles.settingLeft}>
                <View style={[styles.iconCircle, { backgroundColor: '#FEF3C7' }]}>
                  <MaterialIcons name="language" size={20} color="#D97706" />
                </View>
                <View>
                  <Text style={styles.settingLabel}>Language</Text>
                  <Text style={styles.settingDesc}>App language</Text>
                </View>
              </View>
              <View style={styles.valueRow}>
                <Text style={styles.settingValue}>{language}</Text>
                <MaterialIcons name="chevron-right" size={20} color={colors.textMuted} />
              </View>
            </TouchableOpacity>

            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.iconCircle, { backgroundColor: '#DCFCE7' }]}>
                  <MaterialIcons name="data-usage" size={20} color="#16A34A" />
                </View>
                <View>
                  <Text style={styles.settingLabel}>Data Saver</Text>
                  <Text style={styles.settingDesc}>Reduce image quality to save data</Text>
                </View>
              </View>
              <Switch
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.white}
                ios_backgroundColor={colors.border}
                onValueChange={() => setDataSaver(!dataSaver)}
                value={dataSaver}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Storage</Text>
          <View style={styles.card}>
            <TouchableOpacity 
              style={styles.settingRow} 
              onPress={() => GlobalAlertRef.current?.alert('Notice', 'App cache has been cleared.')}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.iconCircle, { backgroundColor: '#FEE2E2' }]}>
                  <MaterialIcons name="delete-outline" size={20} color="#DC2626" />
                </View>
                <View>
                  <Text style={styles.settingLabel}>Clear Cache</Text>
                  <Text style={styles.settingDesc}>Free up storage space</Text>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton title="Save Changes" onPress={handleSave} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingLabel: {
    fontSize: fontSizes.base,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  settingDesc: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  settingValue: {
    fontSize: fontSizes.sm,
    color: colors.primary,
    fontWeight: '600',
  },
  footer: {
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
