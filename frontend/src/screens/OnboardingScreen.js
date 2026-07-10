import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fontSizes, spacing, radii } from '../theme/theme';
import PrimaryButton from '../components/PrimaryButton';

export default function OnboardingScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.skip} onPress={() => navigation.replace('Login')}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <View style={styles.illustrationWrap}>
        <View style={styles.bigCircle}>
          <MaterialIcons name="local-gas-station" size={120} color={colors.primary} />
        </View>
        <View style={[styles.floatIcon, styles.float1]}>
          <MaterialIcons name="place" size={20} color={colors.primary} />
        </View>
        <View style={[styles.floatIcon, styles.float2]}>
          <MaterialIcons name="notifications" size={18} color={colors.primary} />
        </View>
        <View style={[styles.floatIcon, styles.float3]}>
          <MaterialIcons name="bolt" size={18} color={colors.primary} />
        </View>
      </View>

      <View style={styles.dots}>
        <View style={[styles.dot, styles.dotActive]} />
        <View style={styles.dot} />
        <View style={styles.dot} />
      </View>

      <Text style={styles.title}>Find fuel easily</Text>
      <Text style={styles.body}>
        We help you locate nearby fuel stations, check live availability, and avoid long queues — all in real time.
      </Text>

      <PrimaryButton
        title="Get Started"
        onPress={() => navigation.replace('Login')}
        style={{ marginTop: spacing.lg }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
  },
  skip: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primaryTint,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: radii.pill,
    marginTop: spacing.sm,
  },
  skipText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: fontSizes.sm,
  },
  illustrationWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigCircle: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatIcon: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  float1: { top: 10, left: 30 },
  float2: { top: 40, right: 20 },
  float3: { bottom: 20, left: 50 },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginBottom: spacing.lg,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  dotActive: {
    width: 22,
    backgroundColor: colors.primary,
  },
  title: {
    fontSize: fontSizes.xl,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  body: {
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.sm,
  },
});
