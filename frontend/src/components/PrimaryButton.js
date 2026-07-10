import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { colors, radii, fontSizes, spacing, shadow } from '../theme/theme';

export default function PrimaryButton({
  title,
  onPress,
  variant = 'primary', // 'primary' | 'outline' | 'ghost' | 'light'
  loading = false,
  disabled = false,
  icon = null,
  style,
}) {
  const isOutline = variant === 'outline';
  const isGhost = variant === 'ghost';
  const isLight = variant === 'light';

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      disabled={disabled || loading}
      onPress={onPress}
      style={[
        styles.base,
        isOutline && styles.outline,
        isGhost && styles.ghost,
        isLight && styles.light,
        !isOutline && !isGhost && !isLight && styles.primary,
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isOutline || isGhost ? colors.primary : colors.white} />
      ) : (
        <View style={styles.content}>
          {icon}
          <Text
            style={[
              styles.text,
              (isOutline || isGhost) && styles.textDark,
              isLight && styles.textPrimaryColor,
            ]}
          >
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 54,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  primary: {
    backgroundColor: colors.primary,
    ...shadow.button,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  ghost: {
    backgroundColor: colors.surfaceMuted,
  },
  light: {
    backgroundColor: colors.primaryTint,
  },
  disabled: {
    opacity: 0.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  text: {
    color: colors.white,
    fontSize: fontSizes.base,
    fontWeight: '700',
  },
  textDark: {
    color: colors.textPrimary,
  },
  textPrimaryColor: {
    color: colors.primary,
  },
});
