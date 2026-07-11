import { GlobalAlertRef } from '../components/GlobalAlert';
import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
import { useAuth } from '../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [savedCredential, setSavedCredential] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, setUser } = useAuth();

  useEffect(() => {
    const loadCredentials = async () => {
      try {
        const savedEmail = await AsyncStorage.getItem('savedEmail');
        const savedPassword = await AsyncStorage.getItem('savedPassword');
        if (savedEmail && savedPassword) {
          setSavedCredential({ email: savedEmail, password: savedPassword });
          // Note: We don't automatically fill them now, we just suggest them.
          // But if a credential is saved, we can tick the "Remember me" box by default.
          setRemember(true);
        }
      } catch (error) {
        console.error('Failed to load credentials', error);
      }
    };
    loadCredentials();
  }, []);

  const handleLogin = async () => {
    try {
      setLoading(true);
      const apiUrl = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';
      
      const response = await fetch(`${apiUrl}/api/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      
      if (!response.ok) {
        setLoading(false);
        GlobalAlertRef.current?.alert('Notice', data.error || 'Failed to login');
        return;
      }

      if (remember) {
        await AsyncStorage.setItem('savedEmail', email);
        await AsyncStorage.setItem('savedPassword', password);
        setSavedCredential({ email, password });
      } else {
        await AsyncStorage.removeItem('savedEmail');
        await AsyncStorage.removeItem('savedPassword');
        setSavedCredential(null);
      }
      
      // Update the user context with the fetched user data
      setUser((prev) => ({
        ...prev,
        ...data.user,
        name: data.user.displayName || data.user.name || prev.name,
        email: data.user.email || prev.email,
        role: data.user.role || prev.role,
        registrationNumber: data.user.registrationNumber || prev.registrationNumber,
        uid: data.uid
      }));

      setLoading(false);
      login();
    } catch (error) {
      setLoading(false);
      console.error('Failed to login', error);
      GlobalAlertRef.current?.alert('Notice', 'Error connecting to backend');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Log in</Text>
          <Text style={styles.brand}>FuelTrack LK</Text>

          <View style={{ zIndex: 10, position: 'relative' }}>
            <InputField
              label="Email"
              icon="mail-outline"
              placeholder="you@gmail.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
              onFocus={() => {
                if (savedCredential) setShowSuggestions(true);
              }}
              onBlur={() => {
                setTimeout(() => setShowSuggestions(false), 200);
              }}
            />
            {showSuggestions && savedCredential && (
              <View style={styles.suggestionDropdown}>
                <TouchableOpacity 
                  style={styles.suggestionItem}
                  onPress={() => {
                    setEmail(savedCredential.email);
                    setPassword(savedCredential.password);
                    setShowSuggestions(false);
                  }}
                >
                  <MaterialIcons name="account-circle" size={24} color={colors.textSecondary} style={{ marginRight: 12 }} />
                  <View>
                    <Text style={styles.suggestionEmail}>{savedCredential.email}</Text>
                    <Text style={styles.suggestionPassword}>••••••••</Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}
          </View>
          <InputField
            label="Password"
            icon="lock-outline"
            placeholder="••••••••"
            secure
            value={password}
            onChangeText={setPassword}
            autoComplete="password"
            textContentType="password"
          />

          <View style={styles.optionsRow}>
            <TouchableOpacity style={styles.rememberRow} onPress={() => setRemember(!remember)}>
              <View style={[styles.checkbox, remember && styles.checkboxActive]}>
                {remember && <MaterialIcons name="check" size={13} color={colors.white} />}
              </View>
              <Text style={styles.rememberText}>Remember me</Text>
            </TouchableOpacity>
            <TouchableOpacity>
              <Text style={styles.forgotText}>Forgot your password?</Text>
            </TouchableOpacity>
          </View>

          <PrimaryButton
            title={loading ? "Logging in..." : "Log in"}
            onPress={handleLogin}
            disabled={loading}
            style={{ marginTop: spacing.md }}
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
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('RoleSelection')}>
              <Text style={styles.footerLink}>Sign up</Text>
            </TouchableOpacity>
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
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  title: {
    fontSize: fontSizes.xl,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  brand: {
    fontSize: fontSizes.sm,
    color: colors.primary,
    fontWeight: '700',
    marginBottom: spacing.lg,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  rememberText: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
  },
  forgotText: {
    fontSize: fontSizes.xs,
    color: colors.primary,
    fontWeight: '700',
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
  suggestionDropdown: {
    position: 'absolute',
    top: 80,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 1,
    borderColor: colors.border,
    zIndex: 100,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  suggestionEmail: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  suggestionPassword: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
    letterSpacing: 2,
  },
});
