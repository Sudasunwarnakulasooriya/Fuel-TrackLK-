import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { colors, fontSizes, radii, shadow, spacing } from '../theme/theme';

const TAB_ICONS = {
  Home: 'home',
  Nearby: 'place',
  Report: 'add',
  Predictions: 'insights',
  Profile: 'person',
};

export default function CustomTabBar({ state, descriptors, navigation }) {
  const [qrImage, setQrImage] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const loadQr = async () => {
      try {
        const savedQr = await AsyncStorage.getItem('userQrCode');
        if (savedQr) setQrImage(savedQr);
      } catch (e) {
        console.error("Failed to load QR code", e);
      }
    };
    loadQr();
  }, []);

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
    setModalVisible(false);
  };

  return (
    <>
      <View style={styles.wrapper}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const isCenter = route.name === 'Report';

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          if (isCenter) {
            return (
              <TouchableOpacity
                key={route.key}
                onPress={() => setModalVisible(true)}
                style={styles.centerBtn}
                activeOpacity={0.85}
                hitSlop={{ top: 28, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialIcons name={qrImage ? "qr-code" : "add"} size={28} color={colors.white} />
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity key={route.key} onPress={onPress} style={styles.tabItem}>
              <MaterialIcons
                name={TAB_ICONS[route.name]}
                size={22}
                color={isFocused ? colors.primary : colors.textMuted}
              />
              <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
                {options.title || route.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {!qrImage ? (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Add your QR here</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <MaterialIcons name="close" size={24} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.modalSubTitle}>(jpeg / png)</Text>
                
                <TouchableOpacity style={styles.uploadBtn} onPress={handlePickImage}>
                  <MaterialIcons name="cloud-upload" size={24} color={colors.white} />
                  <Text style={styles.uploadBtnText}>Upload QR Photo</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.modalTitle}>Your QR Code</Text>
                
                <Image source={{ uri: qrImage }} style={styles.qrDisplay} resizeMode="contain" />
                
                <View style={styles.modalActions}>
                  <TouchableOpacity style={styles.removeBtn} onPress={removeQr}>
                    <MaterialIcons name="delete-outline" size={20} color={colors.danger} />
                    <Text style={styles.removeBtnText}>Remove</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.closeBtn} onPress={() => setModalVisible(false)}>
                    <Text style={styles.closeBtnText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
    paddingBottom: 22,
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  tabLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: colors.primary,
  },
  centerBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -28,
    ...shadow.button,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.xl,
    alignItems: 'center',
    ...shadow.card,
  },
  modalHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  modalTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  modalSubTitle: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.md,
    gap: spacing.sm,
  },
  uploadBtnText: {
    color: colors.white,
    fontSize: fontSizes.base,
    fontWeight: '700',
  },
  qrDisplay: {
    width: 250,
    height: 250,
    borderRadius: radii.sm,
    marginVertical: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalActions: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  removeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: spacing.sm,
  },
  removeBtnText: {
    color: colors.danger,
    fontWeight: '600',
    fontSize: fontSizes.sm,
  },
  closeBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.md,
  },
  closeBtnText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: fontSizes.sm,
  },
});
