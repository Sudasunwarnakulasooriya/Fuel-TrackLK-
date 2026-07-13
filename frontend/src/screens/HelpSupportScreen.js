import { GlobalAlertRef } from '../components/GlobalAlert';
import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Modal, TextInput, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fontSizes, spacing, radii } from '../theme/theme';
import ScreenHeader from '../components/ScreenHeader';
import PrimaryButton from '../components/PrimaryButton';
import { useAuth } from '../context/AuthContext';

const FAQS = [
  {
    question: 'How do I report a queue?',
    answer: 'Tap the "+" button at the bottom of the screen to open the report form. You can select your fuel type and enter the current queue length.',
  },
  {
    question: 'How are AI predictions generated?',
    answer: 'Our AI uses historical data, weather patterns, and community reports to predict the best times to refuel.',
  },
  {
    question: 'Why was my report unverified?',
    answer: 'Reports require a minimum number of corroborating community reports to receive a verified badge.',
  }
];

export default function HelpSupportScreen({ navigation }) {
  const { user } = useAuth();
  const [modalVisible, setModalVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSendSupport = async () => {
    if (!message.trim()) {
      GlobalAlertRef.current?.alert('Notice', 'Please enter a message before sending.');
      return;
    }

    setSending(true);
    try {
      const apiUrl = 'https://fuel-track-backend.onrender.com';
      const res = await fetch(`${apiUrl}/api/users/support`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: user?.name,
          email: user?.email,
          userRole: user?.role,
          message: message.trim()
        })
      });

      if (res.ok) {
        setModalVisible(false);
        setMessage('');
        GlobalAlertRef.current?.alert('Success', 'Your support request has been sent! We will get back to you soon.');
      } else {
        GlobalAlertRef.current?.alert('Error', 'Failed to send message. Please try again later.');
      }
    } catch (error) {
      console.error(error);
      GlobalAlertRef.current?.alert('Error', 'Network error. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="Help & Support" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll}>
        
        <View style={styles.header}>
          <MaterialIcons name="support-agent" size={64} color={colors.primary} />
          <Text style={styles.title}>How can we help you?</Text>
        </View>

        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        
        {FAQS.map((faq, index) => (
          <View key={index} style={styles.faqCard}>
            <Text style={styles.question}>{faq.question}</Text>
            <Text style={styles.answer}>{faq.answer}</Text>
          </View>
        ))}

        <View style={styles.contactSection}>
          <Text style={styles.contactText}>Still need help? Reach out to our support team.</Text>
          <PrimaryButton title="Contact Support" onPress={() => setModalVisible(true)} />
        </View>

      </ScrollView>

      {/* Contact Support Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
              <MaterialIcons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Contact Support</Text>
            <View style={{ width: 24 }} />
          </View>
          
          <ScrollView style={styles.modalContent} contentContainerStyle={{ paddingBottom: spacing.xxl }}>
            <Text style={styles.modalSubtitle}>How can we help you today?</Text>
            
            <TextInput
              style={styles.messageInput}
              placeholder="Describe your issue or ask a question..."
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              value={message}
              onChangeText={setMessage}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelBtn} 
                onPress={() => setModalVisible(false)}
                disabled={sending}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <PrimaryButton 
                title={sending ? "Sending..." : "Send Message"} 
                onPress={handleSendSupport} 
                style={styles.sendBtn}
                disabled={sending}
                icon={<MaterialIcons name="send" size={18} color={colors.white} />}
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  title: {
    fontSize: fontSizes.lg,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSizes.md,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  faqCard: {
    backgroundColor: colors.surfaceMuted,
    padding: spacing.md,
    borderRadius: radii.md,
    marginBottom: spacing.md,
  },
  question: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  answer: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  contactSection: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  contactText: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
  },
  closeBtn: {
    padding: spacing.xs,
  },
  modalTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  modalContent: {
    flex: 1,
    padding: spacing.lg,
  },
  modalSubtitle: {
    fontSize: fontSizes.md,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  messageInput: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
    minHeight: 150,
    marginBottom: spacing.xl,
  },
  modalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: fontSizes.md,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  sendBtn: {
    flex: 2,
  }
});
