import { GlobalAlertRef } from '../components/GlobalAlert';
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fontSizes, spacing, radii } from '../theme/theme';
import ScreenHeader from '../components/ScreenHeader';
import PrimaryButton from '../components/PrimaryButton';

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
          <PrimaryButton title="Contact Support" onPress={() => GlobalAlertRef.current?.alert('Notice', 'Contact Form Modal')} />
        </View>

      </ScrollView>
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
});
