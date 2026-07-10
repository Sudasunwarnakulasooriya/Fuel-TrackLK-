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
  Alert,
  Modal
} from 'react-native';
import { colors, fontSizes, spacing, radii } from '../theme/theme';
import ScreenHeader from '../components/ScreenHeader';
import InputField from '../components/InputField';
import PrimaryButton from '../components/PrimaryButton';
import { useAuth } from '../context/AuthContext';

export default function ManageAccountScreen({ navigation }) {
  const { user, setUser } = useAuth();
  
  const [name, setName] = useState(user.name || user.displayName || '');
  const [vehicle, setVehicle] = useState(user.vehicle || user.registrationNumber || '');
  const [email, setEmail] = useState(user.email || '');
  const [newPassword, setNewPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  
  // Verification Modal State
  const [verifyVisible, setVerifyVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');

  const handleSaveBasicInfo = async () => {
    // Save basic info directly to backend
    setLoading(true);
    try {
      const apiUrl = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/users/${user.uid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: name, registrationNumber: vehicle })
      });
      
      if (response.ok) {
        setUser((prev) => ({ ...prev, name, displayName: name, vehicle, registrationNumber: vehicle }));
        alert('Basic details updated!');
        navigation.goBack();
      } else {
        alert('Failed to update details');
      }
    } catch (e) {
      console.error(e);
      alert('Error updating details');
    }
    setLoading(false);
  };

  const initiateSecureSave = () => {
    // Only require password if email or password is being changed
    if (email !== user.email || newPassword.length > 0) {
      setVerifyVisible(true);
    } else {
      handleSaveBasicInfo();
    }
  };

  const handleSecureSave = async () => {
    if (!currentPassword) {
      alert('Please enter your current password');
      return;
    }
    
    setLoading(true);
    try {
      const apiUrl = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/users/${user.uid}/secure-update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          newPassword, 
          currentPassword,
          displayName: name,
          registrationNumber: vehicle
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setUser((prev) => ({ 
          ...prev, 
          email,
          name, 
          displayName: name, 
          vehicle, 
          registrationNumber: vehicle 
        }));
        setVerifyVisible(false);
        setCurrentPassword('');
        setNewPassword('');
        alert('Account successfully updated!');
        navigation.goBack();
      } else {
        alert(data.error || 'Verification failed');
      }
    } catch (e) {
      console.error(e);
      alert('Error communicating with server');
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="Manage Account" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll}>
          
          <Text style={styles.sectionTitle}>Basic Information</Text>
          <InputField
            label="Full Name"
            icon="person-outline"
            value={name}
            onChangeText={setName}
          />
          <InputField
            label="Vehicle Registration Number"
            icon="directions-car"
            value={vehicle}
            onChangeText={setVehicle}
          />

          <View style={styles.divider} />
          
          <Text style={styles.sectionTitle}>Security (Requires Verification)</Text>
          <InputField
            label="Email Address"
            icon="mail-outline"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />
          <InputField
            label="New Password"
            icon="lock-outline"
            placeholder="Leave blank to keep current"
            value={newPassword}
            onChangeText={setNewPassword}
            secure
          />

          <PrimaryButton
            title={loading ? 'Saving...' : 'Save Changes'}
            onPress={initiateSecureSave}
            disabled={loading}
            style={{ marginTop: spacing.xl }}
          />

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Verification Modal */}
      <Modal visible={verifyVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Verify Identity</Text>
            <Text style={styles.modalText}>Please enter your current password to save security changes.</Text>
            
            <InputField
              label="Current Password"
              icon="lock"
              secure
              value={currentPassword}
              onChangeText={setCurrentPassword}
            />
            
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setVerifyVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleSecureSave} disabled={loading}>
                <Text style={styles.confirmBtnText}>{loading ? 'Verifying...' : 'Confirm'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  scroll: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xxl },
  sectionTitle: { fontSize: fontSizes.md, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.md },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.xl },
  modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', padding: spacing.lg },
  modalContainer: { backgroundColor: colors.surface, padding: spacing.xl, borderRadius: radii.lg },
  modalTitle: { fontSize: fontSizes.lg, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.sm },
  modalText: { fontSize: fontSizes.sm, color: colors.textSecondary, marginBottom: spacing.lg },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.md, marginTop: spacing.lg },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: radii.md, backgroundColor: colors.surfaceMuted },
  cancelBtnText: { color: colors.textPrimary, fontWeight: '600' },
  confirmBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: radii.md, backgroundColor: colors.primary },
  confirmBtnText: { color: colors.white, fontWeight: '600' },
});
