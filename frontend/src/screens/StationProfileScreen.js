import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Image, Platform, ActivityIndicator, Modal } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fontSizes, spacing, radii } from '../theme/theme';
import { useAuth } from '../context/AuthContext';

const MENU_ITEMS = [
  { id: 'account', label: 'Manage Station Account', icon: 'store', screen: 'ManageAccount' },
  { id: 'reviews', label: 'Station Reviews', icon: 'star-rate', screen: 'StationReviews' },
  { id: 'notifications', label: 'Notification Settings', icon: 'notifications-none', screen: 'NotificationSettings' },
  { id: 'help', label: 'Help & Support', icon: 'help-outline', screen: 'HelpSupport' },
];

export default function StationProfileScreen({ navigation }) {
  const { logout, user, setUser } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);

  const pickImage = async () => {
    try {
      setErrorMessage(null);
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        setErrorMessage('Sorry, we need camera roll permissions to make this work!');
        return;
      }

      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.3,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
        setUser({ ...user, avatar: base64Image });
        
        setUploading(true);
        const apiUrl = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';
        const res = await fetch(`${apiUrl}/api/users/${user.uid || user.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ avatar: base64Image }),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to save profile picture');
        }
      }
    } catch (error) {
      console.error(error);
      setErrorMessage(error.message || 'Error saving profile picture');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = async () => {
    try {
      setErrorMessage(null);
      setUser({ ...user, avatar: null });
      
      setUploading(true);
      const apiUrl = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/users/${user.uid || user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar: null }),
      });
      
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to remove profile picture');
      }
    } catch (error) {
      console.error(error);
      setErrorMessage(error.message || 'Error removing profile picture');
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Station Profile</Text>

        {errorMessage && (
          <View style={styles.errorContainer}>
            <MaterialIcons name="error-outline" size={20} color={colors.white} />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        <View style={styles.profileCard}>
          <TouchableOpacity onPress={() => setImageModalVisible(true)} style={styles.avatarContainer}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <MaterialIcons name="local-gas-station" size={32} color={colors.white} />
              </View>
            )}
            <View style={styles.editBadge}>
              {uploading ? (
                 <ActivityIndicator size="small" color={colors.white} />
              ) : (
                 <MaterialIcons name="edit" size={12} color={colors.white} />
              )}
            </View>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{user?.name || 'Fuel Station'}</Text>
            <Text style={styles.email}>{user?.email || 'station@example.com'}</Text>
            {user?.registrationNumber && (
              <Text style={styles.regNo}>Reg No: {user.registrationNumber}</Text>
            )}
          </View>
        </View>

        <View style={styles.menuCard}>
          {MENU_ITEMS.map((item, i) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.menuRow, i === MENU_ITEMS.length - 1 && styles.menuRowLast]}
              onPress={() => item.screen && navigation.navigate(item.screen)}
            >
              <View style={styles.menuLeft}>
                <View style={styles.menuIconCircle}>
                  <MaterialIcons name={item.icon} size={18} color={colors.primary} />
                </View>
                <Text style={styles.menuLabel}>{item.label}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.signOutBtn} onPress={logout}>
          <MaterialIcons name="logout" size={18} color={colors.danger} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        animationType="fade"
        transparent={true}
        visible={imageModalVisible}
        onRequestClose={() => setImageModalVisible(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setImageModalVisible(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Profile Picture</Text>
            
            <TouchableOpacity style={styles.modalOption} onPress={() => {
              setImageModalVisible(false);
              pickImage();
            }}>
              <MaterialIcons name="photo-library" size={24} color={colors.primary} />
              <Text style={styles.modalOptionText}>Upload New Picture</Text>
            </TouchableOpacity>

            {user?.avatar && (
              <>
                <View style={styles.modalDivider} />
                <TouchableOpacity style={styles.modalOption} onPress={() => {
                  setImageModalVisible(false);
                  removeImage();
                }}>
                  <MaterialIcons name="delete-outline" size={24} color={colors.danger} />
                  <Text style={[styles.modalOptionText, { color: colors.danger }]}>Remove Picture</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
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
    paddingBottom: spacing.xxl,
  },
  title: {
    fontSize: fontSizes.xl,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.danger,
    padding: spacing.md,
    borderRadius: radii.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  errorText: {
    color: colors.white,
    fontSize: fontSizes.sm,
    flex: 1,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryTint,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.sm + 4,
    marginBottom: spacing.lg,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  name: {
    fontSize: fontSizes.base,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  email: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  regNo: {
    fontSize: fontSizes.xs,
    color: colors.primaryDark,
    fontWeight: '600',
    marginTop: 4,
  },
  menuCard: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.lg,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  menuRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 5,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuRowLast: {
    borderBottomWidth: 0,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: spacing.sm + 4,
  },
  signOutText: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: colors.danger,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.lg,
    width: '80%',
    maxWidth: 340,
  },
  modalTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  modalOptionText: {
    fontSize: fontSizes.base,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  modalDivider: {
    height: 1,
    backgroundColor: colors.border,
  },
});
