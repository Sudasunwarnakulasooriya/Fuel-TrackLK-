import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fontSizes, spacing, radii } from '../theme/theme';
import InputField from '../components/InputField';
import PrimaryButton from '../components/PrimaryButton';
import { GlobalAlertRef } from '../components/GlobalAlert';

export default function ForgotPasswordScreen({ navigation }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const apiUrl = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';

  const handleSendOtp = async () => {
    if (!email) {
      GlobalAlertRef.current?.alert('Notice', 'Please enter your email address');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${apiUrl}/api/users/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        GlobalAlertRef.current?.alert('Error', data.error || 'Failed to send OTP');
        return;
      }

      setStep(2);
    } catch (error) {
      setLoading(false);
      GlobalAlertRef.current?.alert('Error', 'Could not connect to server');
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 4) {
      GlobalAlertRef.current?.alert('Notice', 'Please enter a valid 4-digit code');
      return;
    }
    // We intentionally don't call the verify-otp API here because the 
    // verify-otp endpoint deletes the OTP from the database upon success,
    // which would cause the final reset-password step to fail.
    // We will verify the OTP simultaneously with resetting the password in step 3.
    setStep(3);
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      GlobalAlertRef.current?.alert('Notice', 'Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      GlobalAlertRef.current?.alert('Notice', 'Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${apiUrl}/api/users/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword })
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        GlobalAlertRef.current?.alert('Error', data.error || 'Failed to reset password');
        return;
      }

      GlobalAlertRef.current?.alert('Success', 'Your password has been reset successfully. Please log in.');
      navigation.replace('Login');
    } catch (error) {
      setLoading(false);
      GlobalAlertRef.current?.alert('Error', 'Could not connect to server');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>

          <Text style={styles.title}>
            {step === 1 && 'Reset Password'}
            {step === 2 && 'Verify OTP'}
            {step === 3 && 'New Password'}
          </Text>
          <Text style={styles.subtitle}>
            {step === 1 && 'Enter the email address associated with your account. We will send you a 4-digit code.'}
            {step === 2 && `Enter the 4-digit code we sent to ${email}.`}
            {step === 3 && 'Create a new, strong password for your account.'}
          </Text>

          {step === 1 && (
            <>
              <InputField
                label="Email Address"
                icon="email"
                placeholder="you@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <PrimaryButton
                title={loading ? "Sending..." : "Send Code"}
                onPress={handleSendOtp}
                disabled={loading}
                style={{ marginTop: spacing.md }}
              />
            </>
          )}

          {step === 2 && (
            <>
              <InputField
                label="4-Digit Code"
                icon="lock-outline"
                placeholder="1234"
                value={otp}
                onChangeText={setOtp}
                keyboardType="numeric"
                maxLength={4}
              />
              <PrimaryButton
                title={loading ? "Verifying..." : "Verify Code"}
                onPress={handleVerifyOtp}
                disabled={loading}
                style={{ marginTop: spacing.md }}
              />
            </>
          )}

          {step === 3 && (
            <>
              <InputField
                label="New Password"
                icon="lock-outline"
                placeholder="********"
                value={newPassword}
                onChangeText={setNewPassword}
                secure
              />
              <InputField
                label="Confirm Password"
                icon="lock-outline"
                placeholder="********"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secure
              />
              <PrimaryButton
                title={loading ? "Confirming..." : "Confirm"}
                onPress={handleResetPassword}
                disabled={loading}
                style={{ marginTop: spacing.md }}
              />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxl,
  },
  backButton: {
    marginBottom: spacing.lg,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: fontSizes.xxl,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
});
