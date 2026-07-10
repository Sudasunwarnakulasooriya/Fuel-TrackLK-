import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, fontSizes, spacing, radii } from '../theme/theme';

export default function ScreenHeader({ title, subtitle, onBack, right, light = false }) {
  const navigation = useNavigation();

  const handleBack = () => {
    if (onBack) return onBack();
    if (navigation.canGoBack()) navigation.goBack();
  };

  return (
    <View style={styles.row}>
      <TouchableOpacity
        onPress={handleBack}
        style={[styles.backBtn, light && styles.backBtnLight]}
      >
        <MaterialIcons name="arrow-back" size={20} color={light ? colors.white : colors.textPrimary} />
      </TouchableOpacity>

      <View style={styles.titleWrap}>
        <Text style={[styles.title, light && styles.titleLight]} numberOfLines={1}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.subtitle, light && styles.subtitleLight]} numberOfLines={1}>{subtitle}</Text>
        ) : null}
      </View>

      <View style={styles.rightWrap}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnLight: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  titleWrap: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: fontSizes.md,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  titleLight: {
    color: colors.white,
  },
  subtitle: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    marginTop: 1,
  },
  subtitleLight: {
    color: 'rgba(255,255,255,0.8)',
  },
  rightWrap: {
    width: 38,
    alignItems: 'flex-end',
  },
});
