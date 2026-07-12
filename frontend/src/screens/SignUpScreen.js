import { GlobalAlertRef } from '../components/GlobalAlert';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { colors, fontSizes, spacing, radii } from '../theme/theme';
import InputField from '../components/InputField';
import PrimaryButton from '../components/PrimaryButton';
import ScreenHeader from '../components/ScreenHeader';

export default function SignUpScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!email) {
      GlobalAlertRef.current?.alert('Notice', 'Please enter an email address');
      return;
    }
    
    setLoading(true);
    try {
      // Use localhost for web, 10.0.2.2 for Android emulator
      const apiUrl = 'https://fuel-track-backend.onrender.com';
      const response = await fetch(`${apiUrl}/api/users/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const data = await response.json();
      setLoading(false);
      
      if (response.ok) {
        navigation.navigate('Verify', { email, name, password });
      } else {
        GlobalAlertRef.current?.alert('Notice', data.error || 'Failed to send OTP');
      }
    } catch (error) {
      setLoading(false);
      GlobalAlertRef.current?.alert('Notice', 'Error connecting to backend: ' + error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="Register Driver" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Driver Details</Text>
          <Text style={styles.subtitle}>Enter your details to create an account.</Text>

          <InputField
            label="Full Name"
            icon="person-outline"
            placeholder="W.D.C.S. Gunathunga"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
          <InputField
            label="Email"
            icon="mail-outline"
            placeholder="you@gmail.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />
          <InputField
            label="Password"
            icon="lock-outline"
            placeholder="••••••••"
            secure
            value={password}
            onChangeText={setPassword}
          />
          <InputField
            label="Confirm password"
            icon="lock-outline"
            placeholder="••••••••"
            secure
            value={confirm}
            onChangeText={setConfirm}
          />

          <PrimaryButton
            title={loading ? "Sending OTP..." : "Sign up"}
            onPress={handleSignUp}
            style={{ marginTop: spacing.sm }}
            disabled={loading}
          />

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.socialRow}>
            <TouchableOpacity style={styles.socialBtn}>
              <FontAwesome name="google" size={16} color="#EA4335" />
              <Text style={styles.socialText}>Google</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialBtn}>
              <FontAwesome name="facebook" size={16} color="#1877F2" />
              <Text style={styles.socialText}>Facebook</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.footerLink}>Log in</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.brandFooterWrap}>
            <View style={styles.brandUnderline} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingBottom: spacing.xl,
  },
  title: {
    fontSize: fontSizes.xl,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    marginHorizontal: spacing.sm,
    color: colors.textMuted,
    fontSize: fontSizes.xs,
    fontWeight: '700',
  },
  socialRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  socialBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  socialText: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  footerText: {
    color: colors.textSecondary,
    fontSize: fontSizes.sm,
  },
  footerLink: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: fontSizes.sm,
  },
  brandFooterWrap: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  brandUnderline: {
    width: 60,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.primaryTint,
  },
});
