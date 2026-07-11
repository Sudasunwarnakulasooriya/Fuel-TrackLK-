import React, { useState, useImperativeHandle } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, fontSizes, radii, spacing } from '../theme/theme';

export const GlobalAlertRef = React.createRef();

export default function GlobalAlert() {
  const [visible, setVisible] = useState(false);
  const [type, setType] = useState('alert');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [onConfirm, setOnConfirm] = useState(null);
  const [onCancel, setOnCancel] = useState(null);

  useImperativeHandle(GlobalAlertRef, () => ({
    alert: (t, m, onConfirmCallback = null) => {
      setType('alert');
      setTitle(t || 'Alert');
      setMessage(m || '');
      setOnConfirm(() => onConfirmCallback);
      setVisible(true);
    },
    confirm: (t, m, onConfirmCallback, onCancelCallback = null) => {
      setType('confirm');
      setTitle(t || 'Confirm');
      setMessage(m || '');
      setOnConfirm(() => onConfirmCallback);
      setOnCancel(() => onCancelCallback);
      setVisible(true);
    }
  }));

  if (!visible) return null;

  const handleClose = () => {
    setVisible(false);
    if (onConfirm && type === 'alert') {
      onConfirm();
    }
  };

  const handleConfirmAction = () => {
    setVisible(false);
    if (onConfirm) onConfirm();
  };

  const handleCancelAction = () => {
    setVisible(false);
    if (onCancel) onCancel();
  };

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}
          
          {type === 'alert' ? (
            <TouchableOpacity onPress={handleClose} style={styles.button}>
              <Text style={styles.buttonText}>OK</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.buttonRow}>
              <TouchableOpacity onPress={handleCancelAction} style={styles.cancelButton}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleConfirmAction} style={styles.confirmButton}>
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  dialog: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.xl,
    width: '80%',
    maxWidth: 340,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: fontSizes.lg,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  message: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 20,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.md,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: colors.white,
    fontSize: fontSizes.md,
    fontWeight: '700',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: colors.textPrimary,
    fontSize: fontSizes.md,
    fontWeight: '700',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: colors.danger,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: colors.white,
    fontSize: fontSizes.md,
    fontWeight: '700',
  },
});
