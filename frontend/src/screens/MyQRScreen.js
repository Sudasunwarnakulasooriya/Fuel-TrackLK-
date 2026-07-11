import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import { colors, fontSizes, spacing, radii, shadow } from '../theme/theme';
import PrimaryButton from '../components/PrimaryButton';

export default function MyQRScreen({ navigation }) {
  const [qrImage, setQrImage] = useState(null);

  useFocusEffect(
    useCallback(() => {
      const loadQr = async () => {
        try {
          const savedQr = await AsyncStorage.getItem('userQrCode');
          if (savedQr) setQrImage(savedQr);
        } catch (e) {
          console.error("Failed to load QR code", e);
        }
      };
      loadQr();
    }, [])
  );

  const handlePickImage = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        setQrImage(uri);
        await AsyncStorage.setItem('userQrCode', uri);
      }
    } catch (error) {
      console.log('ImagePicker Error:', error);
    }
  };

  const removeQr = async () => {
    setQrImage(null);
    await AsyncStorage.removeItem('userQrCode');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My QR Code</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {qrImage ? (
          <View style={styles.qrContainer}>
            <Image source={{ uri: qrImage }} style={styles.qrImage} />
            <Text style={styles.subtitle}>Present this QR code at the fuel station.</Text>
            
            <View style={styles.actionRow}>
              <PrimaryButton 
                title="Change QR" 
                onPress={handlePickImage} 
                style={styles.changeBtn} 
              />
              <TouchableOpacity style={styles.removeBtn} onPress={removeQr}>
                <Text style={styles.removeText}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="qr-code-scanner" size={80} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No QR Code Found</Text>
            <Text style={styles.emptySubtitle}>You haven't added your vehicle's QR code yet. Add it now for faster refuelling.</Text>
            
            <PrimaryButton 
              title="Add QR Code" 
              onPress={handlePickImage} 
              style={{ marginTop: spacing.xl, width: '100%' }}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    ...shadow.sm,
    zIndex: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  qrContainer: {
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.xl,
    borderRadius: radii.xl,
    ...shadow.md,
  },
  qrImage: {
    width: 250,
    height: 250,
    borderRadius: radii.md,
    marginBottom: spacing.lg,
  },
  subtitle: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  actionRow: {
    width: '100%',
    gap: spacing.md,
  },
  changeBtn: {
    width: '100%',
  },
  removeBtn: {
    width: '100%',
    paddingVertical: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.dangerTint,
    borderRadius: radii.md,
  },
  removeText: {
    color: colors.danger,
    fontSize: fontSizes.base,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    fontSize: fontSizes.xl,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
