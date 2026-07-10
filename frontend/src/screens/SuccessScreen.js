import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fontSizes, spacing } from '../theme/theme';
import PrimaryButton from '../components/PrimaryButton';

export default function SuccessScreen({ navigation, route }) {
  const {
    title = 'Success!',
    message = 'Your action was completed successfully.',
    buttonLabel = 'Continue',
    nextScreen = 'MainTabs',
  } = route?.params || {};

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.body}>
        <View style={styles.iconCircleOuter}>
          <View style={styles.iconCircleInner}>
            <MaterialIcons name="check" size={48} color={colors.white} />
          </View>
        </View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
      </View>

      <PrimaryButton
        title={buttonLabel}
        variant="light"
        onPress={() => navigation.reset({ index: 0, routes: [{ name: nextScreen }] })}
        style={styles.button}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleOuter: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  iconCircleInner: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: fontSizes.xl,
    fontWeight: '800',
    color: colors.white,
    marginBottom: spacing.sm,
  },
  message: {
    fontSize: fontSizes.sm,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
    lineHeight: 20,
  },
  button: {
    backgroundColor: colors.white,
  },
});
