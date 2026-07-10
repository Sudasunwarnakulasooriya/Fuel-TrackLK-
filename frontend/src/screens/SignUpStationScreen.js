import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { colors, fontSizes, spacing } from '../theme/theme';
import InputField from '../components/InputField';
import PrimaryButton from '../components/PrimaryButton';
import ScreenHeader from '../components/ScreenHeader';

export default function SignUpStationScreen({ navigation }) {
  const [nameCity, setNameCity] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [location, setLocation] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!email || !nameCity || !registrationNumber) {
      alert('Please fill out the required fields');
      return;
    }
    
    if (password !== confirm) {
      alert('Passwords do not match');
      return;
    }
    
    setLoading(true);
    try {
      const apiUrl = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/users/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const data = await response.json();
      setLoading(false);
      
      if (response.ok) {
        navigation.navigate('Verify', { 
          email, 
          name: nameCity, 
          password, 
          role: 'station', 
          city: nameCity, 
          registrationNumber, 
          location 
        });
      } else {
        alert(data.error || 'Failed to send OTP');
      }
    } catch (error) {
      setLoading(false);
      alert('Error connecting to backend: ' + error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="Register Station" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          
          <Text style={styles.title}>Fuel Station Details</Text>
          <Text style={styles.subtitle}>Enter your official station details to register.</Text>

          <InputField
            label="Name with City"
            icon="storefront"
            placeholder="e.g. CEYPETCO - Colombo 07"
            value={nameCity}
            onChangeText={setNameCity}
            autoCapitalize="words"
          />
          <InputField
            label="Registration Number"
            icon="badge"
            placeholder="Gov issued ID / Reg No"
            value={registrationNumber}
            onChangeText={setRegistrationNumber}
            autoCapitalize="characters"
          />
          <InputField
            label="Location (Address)"
            icon="place"
            placeholder="123 Main St, City"
            value={location}
            onChangeText={setLocation}
          />
          <InputField
            label="Email"
            icon="mail-outline"
            placeholder="station@example.com"
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
            title={loading ? "Sending OTP..." : "Register"}
            onPress={handleSignUp}
            style={{ marginTop: spacing.md }}
            disabled={loading}
          />

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
});
