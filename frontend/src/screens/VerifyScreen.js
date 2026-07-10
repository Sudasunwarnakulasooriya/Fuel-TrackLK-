import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, Platform, Modal, TouchableOpacity } from 'react-native';
import { colors, fontSizes, spacing, radii } from '../theme/theme';
import ScreenHeader from '../components/ScreenHeader';
import PrimaryButton from '../components/PrimaryButton';
import { useAuth } from '../context/AuthContext';

export default function VerifyScreen({ route, navigation }) {
  const [code, setCode] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [errorVisible, setErrorVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const inputs = useRef([]);
  const { setUser, login } = useAuth();

  const showError = (msg) => {
    setErrorMessage(msg);
    setErrorVisible(true);
  };

  // Extract email passed from SignUpScreen or SignUpStationScreen
  const { email, name, password, role, city, registrationNumber, location, address } = route.params || {};

  const handleChange = (text, index) => {
    const next = [...code];
    next[index] = text;
    setCode(next);
    if (text && index < 3) inputs.current[index + 1]?.focus();
  };

  const handleVerify = async () => {
    const otpString = code.join('');
    if (otpString.length < 4) {
      showError('Please enter the 4-digit code');
      return;
    }

    if (!email) {
      showError('Email not found. Please try signing up again.');
      return;
    }

    setLoading(true);
    try {
      const apiUrl = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/users/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otpString })
      });

      const data = await response.json();
      setLoading(false);

      if (response.ok) {
        // Now register the user on the backend
        const registerResponse = await fetch(`${apiUrl}/api/users/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            password,
            displayName: name,
            role: role || 'driver',
            city,
            registrationNumber,
            location,
            address
          })
        });

        const registerData = await registerResponse.json();

        if (registerResponse.ok) {
          // Update mock user context with signup details
          setUser((prev) => ({
            ...prev,
            name: name || prev.name,
            email: email || prev.email,
            role: role || prev.role || 'driver',
            registrationNumber: registrationNumber || prev.registrationNumber,
            location: location || prev.location,
            address: address || prev.address,
            city: city || prev.city,
            uid: registerData.uid
          }));
          // Note: we can optionally call login() here if we want them to skip SuccessScreen
          
          navigation.navigate('VerifySuccess');
        } else {
          showError(registerData.error || 'Failed to register user account');
        }
      } else {
        showError(data.error || 'Failed to verify OTP');
      }
    } catch (error) {
      setLoading(false);
      showError('Error connecting to backend: ' + error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="Verify account" onBack={() => navigation.goBack()} />

      <View style={styles.body}>
        <Text style={styles.title}>Welcome again!</Text>
        <Text style={styles.subtitle}>
          Enter the 4-digit code sent to your email to verify your FuelTrack LK account.
        </Text>

        <View style={styles.codeRow}>
          {code.map((digit, i) => (
            <TextInput
              key={i}
              ref={(r) => (inputs.current[i] = r)}
              style={[styles.codeBox, digit && styles.codeBoxFilled]}
              value={digit}
              onChangeText={(t) => handleChange(t.replace(/[^0-9]/g, ''), i)}
              onKeyPress={({ nativeEvent }) => {
                if (nativeEvent.key === 'Backspace' && !digit && i > 0) {
                  inputs.current[i - 1]?.focus();
                }
              }}
              keyboardType="number-pad"
              maxLength={1}
            />
          ))}
        </View>

        <Text style={styles.resendText}>
          Didn't get a code? <Text style={styles.resendLink}>Resend</Text>
        </Text>

        <PrimaryButton
          title={loading ? "Verifying..." : "Confirm"}
          onPress={handleVerify}
          style={{ marginTop: spacing.xl }}
          disabled={loading}
        />
      </View>

      <Modal
        animationType="fade"
        transparent={true}
        visible={errorVisible}
        onRequestClose={() => setErrorVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Error</Text>
            <Text style={styles.modalMessage}>{errorMessage}</Text>
            <TouchableOpacity style={styles.modalButton} onPress={() => setErrorVisible(false)}>
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  body: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  title: {
    fontSize: fontSizes.xl,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.xl,
  },
  codeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  codeBox: {
    width: 64,
    height: 64,
    borderRadius: radii.md,
    backgroundColor: colors.inputBackground,
    textAlign: 'center',
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  codeBoxFilled: {
    backgroundColor: colors.primaryTint,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  resendText: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: fontSizes.sm,
  },
  resendLink: {
    color: colors.primary,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.xl,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: colors.danger,
    marginBottom: spacing.sm,
  },
  modalMessage: {
    fontSize: fontSizes.base,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  modalButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.pill,
    width: '100%',
    alignItems: 'center',
  },
  modalButtonText: {
    color: colors.white,
    fontSize: fontSizes.base,
    fontWeight: '700',
  },
});
