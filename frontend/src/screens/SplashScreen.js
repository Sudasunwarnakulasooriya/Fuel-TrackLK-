import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fontSizes, spacing } from '../theme/theme';

export default function SplashScreen({ navigation }) {
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    const timer = setTimeout(() => {
      navigation.replace('Onboarding');
    }, 1400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoWrap, { opacity: fade }]}>
        <View style={styles.iconCircle}>
          <MaterialIcons name="local-gas-station" size={56} color={colors.primary} />
        </View>
        <Text style={styles.title}>FuelTrack{'\n'}LK</Text>
        <Text style={styles.subtitle}>Smart Fuel & Queue Tracking</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrap: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSizes.xxl,
    fontWeight: '800',
    color: colors.white,
    textAlign: 'center',
    lineHeight: 36,
  },
  subtitle: {
    fontSize: fontSizes.sm,
    color: 'rgba(255,255,255,0.85)',
    marginTop: spacing.sm,
    fontWeight: '500',
  },
});
