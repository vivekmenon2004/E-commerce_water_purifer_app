import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing, Radius, BottomTabInset, MaxContentWidth } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function ServicesScreen() {
  const theme = useTheme();
  const [serviceType, setServiceType] = useState('water_test');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!address || !phone) {
      Alert.alert('Required Fields', 'Please enter your service address and phone number.');
      return;
    }
    setIsSubmitted(true);
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}>
          
          <View style={styles.header}>
            <ThemedText style={styles.title}>Book Technician Service</ThemedText>
            <ThemedText style={{ color: theme.textSecondary, fontSize: 13, marginTop: 4 }}>
              Doorstep water testing, installation & genuine filter replacement by certified technicians
            </ThemedText>
          </View>

          {isSubmitted ? (
            <View style={[styles.successCard, { backgroundColor: theme.badgeBackground, borderColor: theme.tdsOptimal }]}>
              <Text style={styles.successIcon}>✅</Text>
              <Text style={[styles.successTitle, { color: theme.tdsOptimal }]}>
                Service Request Dispatched!
              </Text>
              <Text style={[styles.successDesc, { color: theme.textSecondary }]}>
                A certified Calinfco technician has been assigned to your area. We will call you at {phone} within 30 minutes to confirm your doorstep visit slot.
              </Text>
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: theme.primary, marginTop: 16 }]}
                onPress={() => {
                  setIsSubmitted(false);
                  router.push('/');
                }}>
                <Text style={styles.primaryButtonText}>Return to Home</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
              <Text style={[styles.label, { color: theme.text }]}>Select Service Type</Text>
              <View style={styles.typeOptions}>
                {[
                  { id: 'water_test', label: '💧 Free Water TDS Test' },
                  { id: 'installation', label: '🛠️ New Purifier Installation' },
                  { id: 'filter_change', label: '🔄 Filter Cartridge Change' },
                  { id: 'repair', label: '🔧 Repair / Leakage Check' },
                ].map(opt => (
                  <TouchableOpacity
                    key={opt.id}
                    onPress={() => setServiceType(opt.id)}
                    style={[
                      styles.optionButton,
                      serviceType === opt.id
                        ? { backgroundColor: theme.primaryMuted, borderColor: theme.primary }
                        : { borderColor: theme.border },
                    ]}>
                    <Text
                      style={[
                        styles.optionText,
                        { color: serviceType === opt.id ? theme.primaryDark : theme.text },
                      ]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.label, { color: theme.text, marginTop: 16 }]}>Phone Number</Text>
              <TextInput
                style={[styles.input, { borderColor: theme.border, color: theme.text }]}
                placeholder="+91 98765 43210"
                placeholderTextColor={theme.textMuted}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />

              <Text style={[styles.label, { color: theme.text, marginTop: 16 }]}>Service Address & Landmark</Text>
              <TextInput
                style={[styles.input, styles.textArea, { borderColor: theme.border, color: theme.text }]}
                placeholder="House / Flat No, Street, Apartment Name, PIN code"
                placeholderTextColor={theme.textMuted}
                multiline
                numberOfLines={3}
                value={address}
                onChangeText={setAddress}
              />

              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: theme.primary, marginTop: 24 }]}
                activeOpacity={0.85}
                onPress={handleSubmit}>
                <Text style={styles.primaryButtonText}>Confirm Technician Visit</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: BottomTabInset + Spacing.xl,
    maxWidth: MaxContentWidth,
    width: '100%',
  },
  header: {
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0077B6',
  },
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  typeOptions: {
    gap: 8,
  },
  optionButton: {
    padding: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  optionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: 12,
    fontSize: 14,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  primaryButton: {
    paddingVertical: 14,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  successCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  successIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  successDesc: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});
