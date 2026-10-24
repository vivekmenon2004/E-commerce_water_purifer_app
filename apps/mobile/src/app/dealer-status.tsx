import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { ThemedText } from '../components/themed-text';
import { ThemedView } from '../components/themed-view';
import { Spacing, Radius } from '../constants/theme';
import { useAuth } from '../context/auth-context';

export default function DealerStatusScreen() {
  const { user, isDealer, isPendingDealer, applyForDealer, switchDemoPersona, isDemoMode } = useAuth();

  // Application Form State
  const [businessName, setBusinessName] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [tradeLicense, setTradeLicense] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isReapplying, setIsReapplying] = useState(false);

  const handleSubmitApplication = async () => {
    setErrorMessage(null);

    if (!businessName || !gstNumber || !contactPerson || !storeAddress || !city || !state || !pincode) {
      const msg = 'Please fill in all mandatory business fields (Business Name, GSTIN, Contact, Address, City, State, PIN).';
      setErrorMessage(msg);
      if (Platform.OS === 'web') alert(msg); else Alert.alert('Incomplete Form', msg);
      return;
    }

    if (gstNumber.trim().length !== 15) {
      const msg = 'GST Number must be exactly 15 characters (e.g., 29AAAAA0000A1Z5).';
      setErrorMessage(msg);
      if (Platform.OS === 'web') alert(msg); else Alert.alert('Invalid GST Number', msg);
      return;
    }

    setIsSubmitting(true);
    const res = await applyForDealer({
      businessName: businessName.trim(),
      gstNumber: gstNumber.trim().toUpperCase(),
      tradeLicense: tradeLicense.trim() || undefined,
      contactPerson: contactPerson.trim(),
      storeAddress: storeAddress.trim(),
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
    });
    setIsSubmitting(false);

    if (res.success) {
      setIsReapplying(false);
      const okMsg = 'Your dealer application has been submitted successfully and is now pending admin approval.';
      if (Platform.OS === 'web') alert(okMsg); else Alert.alert('Application Submitted', okMsg);
    } else {
      setErrorMessage(res.error || 'Failed to submit application');
    }
  };

  const dealerStatus = user?.dealerStatus || 'none';

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Top Bar Navigation */}
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Text style={styles.backBtnText}>← Back</Text>
            </TouchableOpacity>
            <ThemedText type="title" style={styles.pageTitle}>Dealership Portal</ThemedText>
          </View>

          {/* Quick Demo Switcher if in demo mode */}
          {isDemoMode && (
            <View style={styles.demoBar}>
              <Text style={styles.demoTitle}>DEMO ROLE PREVIEW:</Text>
              <View style={styles.demoBtnRow}>
                <TouchableOpacity
                  style={[styles.demoChip, dealerStatus === 'none' && styles.demoChipActive]}
                  onPress={() => switchDemoPersona('customer')}>
                  <Text style={[styles.demoChipText, dealerStatus === 'none' && styles.demoChipTextActive]}>
                    👤 Customer
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.demoChip, isPendingDealer && styles.demoChipActive]}
                  onPress={() => switchDemoPersona('pendingDealer')}>
                  <Text style={[styles.demoChipText, isPendingDealer && styles.demoChipTextActive]}>
                    ⏳ Pending Dealer
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.demoChip, isDealer && styles.demoChipActive]}
                  onPress={() => switchDemoPersona('approvedDealer')}>
                  <Text style={[styles.demoChipText, isDealer && styles.demoChipTextActive]}>
                    🌟 Approved Dealer
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* STATE 1: APPROVED DEALER */}
          {isDealer && (
            <View style={styles.approvedWrap}>
              <View style={styles.statusHeroCard}>
                <View style={styles.statusHeroHeader}>
                  <Text style={styles.heroBadgeIcon}>🌟</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.heroBadgeTitle}>VERIFIED AUTHORIZED DEALER</Text>
                    <Text style={styles.heroBusinessName}>{user?.dealerDetails?.businessName || 'Authorized Dealership'}</Text>
                  </View>
                  <View style={styles.verifiedPill}>
                    <Text style={styles.verifiedPillText}>ACTIVE</Text>
                  </View>
                </View>

                <View style={styles.certDivider} />

                <View style={styles.certDetailsGrid}>
                  <View style={styles.certItem}>
                    <Text style={styles.certLabel}>GSTIN</Text>
                    <Text style={styles.certValue}>{user?.dealerDetails?.gstNumber || '36CCCCC2222C1Z8'}</Text>
                  </View>
                  <View style={styles.certItem}>
                    <Text style={styles.certLabel}>Trade License</Text>
                    <Text style={styles.certValue}>{user?.dealerDetails?.tradeLicense || 'TS-HYD-7712'}</Text>
                  </View>
                  <View style={styles.certItem}>
                    <Text style={styles.certLabel}>Signatory</Text>
                    <Text style={styles.certValue}>{user?.dealerDetails?.contactPerson || user?.name}</Text>
                  </View>
                  <View style={styles.certItem}>
                    <Text style={styles.certLabel}>Store / Hub</Text>
                    <Text style={styles.certValue}>{user?.dealerDetails?.city}, {user?.dealerDetails?.state}</Text>
                  </View>
                </View>
              </View>

              {/* Wholesale Benefits */}
              <View style={styles.benefitsCard}>
                <Text style={styles.sectionHeaderTitle}>Unlocked Dealership Privileges</Text>
                <View style={styles.benefitsList}>
                  <View style={styles.benefitRow}>
                    <Text style={styles.benefitCheck}>✓</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.benefitTitle}>Wholesale Pricing Unlocked</Text>
                      <Text style={styles.benefitDesc}>30-45% margin below retail price across purifiers, dispensers, pumps, and spares.</Text>
                    </View>
                  </View>
                  <View style={styles.benefitRow}>
                    <Text style={styles.benefitCheck}>✓</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.benefitTitle}>Bulk Order & Custom Quantity Controls</Text>
                      <Text style={styles.benefitDesc}>Convenient quick presets (+5, +10, +25) with live warehouse stock verification.</Text>
                    </View>
                  </View>
                  <View style={styles.benefitRow}>
                    <Text style={styles.benefitCheck}>✓</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.benefitTitle}>B2B 30-Day Dealer Credit Line</Text>
                      <Text style={styles.benefitDesc}>Consignment billing terms with GST input tax credit tax invoice generation.</Text>
                    </View>
                  </View>
                  <View style={styles.benefitRow}>
                    <Text style={styles.benefitCheck}>✓</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.benefitTitle}>Priority Technical Dispatch</Text>
                      <Text style={styles.benefitDesc}>Priority technician support for commercial client installations.</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionGrid}>
                <TouchableOpacity
                  style={styles.actionBtnPrimary}
                  onPress={() => router.push('/explore' as any)}>
                  <Text style={styles.actionBtnPrimaryText}>Explore Wholesale Catalog →</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionBtnSecondary}
                  onPress={() => router.push('/orders' as any)}>
                  <Text style={styles.actionBtnSecondaryText}>View Wholesale Orders 📦</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* STATE 2: PENDING APPROVAL */}
          {isPendingDealer && !isDealer && (
            <View style={styles.pendingWrap}>
              <View style={styles.pendingCard}>
                <View style={styles.pendingHeaderRow}>
                  <Text style={styles.pendingIcon}>⏳</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.pendingStatusTitle}>Application Under Review</Text>
                    <Text style={styles.pendingStatusSub}>Status: PENDING ADMIN APPROVAL</Text>
                  </View>
                </View>

                <Text style={styles.pendingNoticeBody}>
                  Your application for <Text style={{ color: '#f59e0b', fontWeight: 'bold' }}>&quot;{user?.dealerDetails?.businessName}&quot;</Text> (GSTIN: {user?.dealerDetails?.gstNumber}) was submitted on {new Date(user?.dealerDetails?.requestedAt || '').toLocaleDateString('en-IN')}.
                </Text>

                {/* Important Compliance Warning */}
                <View style={styles.complianceAlertBox}>
                  <Text style={styles.complianceAlertIcon}>⚠️</Text>
                  <Text style={styles.complianceAlertText}>
                    <Text style={{ fontWeight: 'bold' }}>Policy Enforcement:</Text> In compliance with Calinfco B2B governance, accounts with pending dealer status are strictly restricted to standard retail prices and cannot place dealer credit orders until verification is confirmed by an administrator.
                  </Text>
                </View>

                {/* Timeline */}
                <View style={styles.timelineBox}>
                  <Text style={styles.timelineTitle}>Verification Timeline</Text>
                  <View style={styles.timelineStep}>
                    <View style={[styles.timelineDot, styles.timelineDotDone]} />
                    <View style={styles.timelineContent}>
                      <Text style={styles.stepTitle}>1. Application Submitted</Text>
                      <Text style={styles.stepDesc}>Details and GST documents received.</Text>
                    </View>
                  </View>

                  <View style={styles.timelineStep}>
                    <View style={[styles.timelineDot, styles.timelineDotActive]} />
                    <View style={styles.timelineContent}>
                      <Text style={styles.stepTitle}>2. Compliance Review (In Progress)</Text>
                      <Text style={styles.stepDesc}>Admin verification of GSTIN, Trade License, and commercial store.</Text>
                    </View>
                  </View>

                  <View style={styles.timelineStep}>
                    <View style={styles.timelineDot} />
                    <View style={styles.timelineContent}>
                      <Text style={styles.stepTitle}>3. Dealership Activation</Text>
                      <Text style={styles.stepDesc}>Wholesale pricing and credit terms automatically unlock.</Text>
                    </View>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.browseRetailBtn}
                  onPress={() => router.push('/explore' as any)}>
                  <Text style={styles.browseRetailBtnText}>Browse Retail Catalog in Meantime →</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* STATE 3: REJECTED STATE */}
          {dealerStatus === 'rejected' && !isReapplying && (
            <View style={styles.rejectedWrap}>
              <View style={styles.rejectedCard}>
                <Text style={styles.rejectedIcon}>✕</Text>
                <ThemedText type="subtitle" style={styles.rejectedTitle}>Application Not Approved</ThemedText>
                <Text style={styles.rejectedReason}>
                  Reason: {user?.dealerDetails?.rejectionReason || 'Incomplete GSTIN or commercial documentation.'}
                </Text>
                <Text style={styles.rejectedHelp}>
                  You may update your business details, correct any discrepancy, and re-submit your application for re-evaluation.
                </Text>

                <TouchableOpacity
                  style={styles.reapplyBtn}
                  onPress={() => setIsReapplying(true)}>
                  <Text style={styles.reapplyBtnText}>Update & Re-Submit Application</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* STATE 4: NOT APPLIED OR REAPPLYING */}
          {((dealerStatus === 'none' && !isDealer && !isPendingDealer) || isReapplying) && (
            <View style={styles.formWrap}>
              <View style={styles.promoIntroCard}>
                <Text style={styles.promoIntroIcon}>🏢</Text>
                <ThemedText type="title" style={styles.promoIntroTitle}>Apply for Calinfco Dealership</ThemedText>
                <Text style={styles.promoIntroDesc}>
                  Join India&apos;s fastest growing pure water purifier network. Access wholesale dealer pricing (up to 45% off retail), bulk quantity discounts, and 30-day credit terms.
                </Text>
              </View>

              {errorMessage && (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorText}>⚠️ {errorMessage}</Text>
                </View>
              )}

              <View style={styles.formCard}>
                <Text style={styles.formCardTitle}>Commercial & Tax Details</Text>

                <Text style={styles.inputLabel}>Business / Store Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. PureTech Water Systems & Appliances"
                  placeholderTextColor="#64748b"
                  value={businessName}
                  onChangeText={setBusinessName}
                />

                <Text style={styles.inputLabel}>GST Number (15 Digits) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 29AAAAA0000A1Z5"
                  placeholderTextColor="#64748b"
                  autoCapitalize="characters"
                  maxLength={15}
                  value={gstNumber}
                  onChangeText={setGstNumber}
                />

                <Text style={styles.inputLabel}>Trade License / Commercial PAN</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. TL-2026-9042"
                  placeholderTextColor="#64748b"
                  value={tradeLicense}
                  onChangeText={setTradeLicense}
                />

                <Text style={styles.inputLabel}>Authorized Signatory / Contact Person *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Ramesh Kumar"
                  placeholderTextColor="#64748b"
                  value={contactPerson}
                  onChangeText={setContactPerson}
                />

                <Text style={styles.inputLabel}>Commercial Store / Warehouse Address *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Shop No., Commercial Market, Road"
                  placeholderTextColor="#64748b"
                  value={storeAddress}
                  onChangeText={setStoreAddress}
                />

                <View style={styles.cityStateRow}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.inputLabel}>City *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. Bengaluru"
                      placeholderTextColor="#64748b"
                      value={city}
                      onChangeText={setCity}
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={styles.inputLabel}>State *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. Karnataka"
                      placeholderTextColor="#64748b"
                      value={state}
                      onChangeText={setState}
                    />
                  </View>
                </View>

                <Text style={styles.inputLabel}>PIN Code *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="6 Digits"
                  placeholderTextColor="#64748b"
                  keyboardType="number-pad"
                  maxLength={6}
                  value={pincode}
                  onChangeText={setPincode}
                />

                <TouchableOpacity
                  style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
                  disabled={isSubmitting}
                  onPress={handleSubmitApplication}>
                  {isSubmitting ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={styles.submitBtnText}>Submit Dealership Application 🏢</Text>
                  )}
                </TouchableOpacity>

                {isReapplying && (
                  <TouchableOpacity
                    style={styles.cancelReapplyBtn}
                    onPress={() => setIsReapplying(false)}>
                    <Text style={styles.cancelReapplyBtnText}>Cancel</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: { padding: Spacing.md, paddingBottom: 110 },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: 12,
  },
  backBtn: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.md,
  },
  backBtnText: { color: '#38bdf8', fontSize: 13, fontWeight: '700' },
  pageTitle: { fontSize: 22, fontWeight: '800' },

  demoBar: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: Radius.md,
    padding: 10,
    marginBottom: Spacing.md,
  },
  demoTitle: { color: '#94a3b8', fontSize: 10, fontWeight: '800', letterSpacing: 0.5, marginBottom: 6 },
  demoBtnRow: { flexDirection: 'row', gap: 6 },
  demoChip: {
    flex: 1,
    backgroundColor: '#1e293b',
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
  },
  demoChipActive: { backgroundColor: '#0284c7' },
  demoChipText: { color: '#94a3b8', fontSize: 11, fontWeight: '600' },
  demoChipTextActive: { color: '#ffffff', fontWeight: '800' },

  // Approved
  approvedWrap: { gap: Spacing.md },
  statusHeroCard: {
    backgroundColor: '#064e3b',
    borderWidth: 1,
    borderColor: '#10b981',
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  statusHeroHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  heroBadgeIcon: { fontSize: 32 },
  heroBadgeTitle: { color: '#6ee7b7', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  heroBusinessName: { color: '#ffffff', fontSize: 18, fontWeight: '800', marginTop: 2 },
  verifiedPill: {
    backgroundColor: '#10b981',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  verifiedPillText: { color: '#022c22', fontSize: 11, fontWeight: '900' },
  certDivider: { height: 1, backgroundColor: '#059669', marginVertical: 14 },
  certDetailsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  certItem: { width: '47%' },
  certLabel: { color: '#a7f3d0', fontSize: 11, textTransform: 'uppercase', fontWeight: '700' },
  certValue: { color: '#ffffff', fontSize: 13, fontWeight: '700', marginTop: 2 },

  benefitsCard: {
    backgroundColor: '#1e293b',
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  sectionHeaderTitle: { color: '#ffffff', fontSize: 16, fontWeight: '800', marginBottom: 14 },
  benefitsList: { gap: 12 },
  benefitRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  benefitCheck: {
    color: '#10b981',
    fontSize: 14,
    fontWeight: '900',
    backgroundColor: '#064e3b',
    width: 22,
    height: 22,
    textAlign: 'center',
    borderRadius: 11,
    lineHeight: 22,
  },
  benefitTitle: { color: '#f1f5f9', fontSize: 13, fontWeight: '700' },
  benefitDesc: { color: '#94a3b8', fontSize: 12, lineHeight: 16, marginTop: 2 },

  actionGrid: { gap: 10 },
  actionBtnPrimary: {
    backgroundColor: '#0284c7',
    paddingVertical: 14,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  actionBtnPrimaryText: { color: '#ffffff', fontSize: 14, fontWeight: '800' },
  actionBtnSecondary: {
    backgroundColor: '#334155',
    paddingVertical: 12,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  actionBtnSecondaryText: { color: '#e2e8f0', fontSize: 13, fontWeight: '700' },

  // Pending
  pendingWrap: {},
  pendingCard: {
    backgroundColor: '#1e293b',
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  pendingHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  pendingIcon: { fontSize: 32 },
  pendingStatusTitle: { color: '#f59e0b', fontSize: 18, fontWeight: '800' },
  pendingStatusSub: { color: '#fcd34d', fontSize: 11, fontWeight: '700', marginTop: 2 },
  pendingNoticeBody: { color: '#cbd5e1', fontSize: 13, lineHeight: 19, marginBottom: 14 },

  complianceAlertBox: {
    backgroundColor: '#451a03',
    borderWidth: 1,
    borderColor: '#d97706',
    borderRadius: Radius.md,
    padding: 12,
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  complianceAlertIcon: { fontSize: 18 },
  complianceAlertText: { color: '#fef3c7', fontSize: 12, lineHeight: 17, flex: 1 },

  timelineBox: { backgroundColor: '#0f172a', borderRadius: Radius.md, padding: 14, marginBottom: 16 },
  timelineTitle: { color: '#94a3b8', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', marginBottom: 12 },
  timelineStep: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  timelineDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#475569',
    marginTop: 2,
  },
  timelineDotDone: { backgroundColor: '#10b981' },
  timelineDotActive: { backgroundColor: '#f59e0b', borderWidth: 2, borderColor: '#fef3c7' },
  timelineContent: { flex: 1 },
  stepTitle: { color: '#ffffff', fontSize: 13, fontWeight: '700' },
  stepDesc: { color: '#64748b', fontSize: 11, marginTop: 1 },

  browseRetailBtn: {
    backgroundColor: '#0284c7',
    paddingVertical: 12,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  browseRetailBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '700' },

  // Rejected
  rejectedWrap: {},
  rejectedCard: {
    backgroundColor: '#450a0a',
    borderWidth: 1,
    borderColor: '#ef4444',
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  rejectedIcon: { fontSize: 40, color: '#ef4444', marginBottom: 8 },
  rejectedTitle: { color: '#fca5a5', fontSize: 18, fontWeight: '800' },
  rejectedReason: { color: '#ffffff', fontSize: 13, fontWeight: '600', textAlign: 'center', marginVertical: 8 },
  rejectedHelp: { color: '#f87171', fontSize: 12, textAlign: 'center', lineHeight: 16, marginBottom: 16 },
  reapplyBtn: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: Radius.md,
  },
  reapplyBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '700' },

  // Form
  formWrap: {},
  promoIntroCard: {
    backgroundColor: '#1e293b',
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  promoIntroIcon: { fontSize: 32, marginBottom: 8 },
  promoIntroTitle: { fontSize: 18, fontWeight: '800', marginBottom: 6 },
  promoIntroDesc: { color: '#94a3b8', fontSize: 13, lineHeight: 18 },

  errorBanner: {
    backgroundColor: '#450a0a',
    borderWidth: 1,
    borderColor: '#ef4444',
    borderRadius: Radius.md,
    padding: 10,
    marginBottom: Spacing.md,
  },
  errorText: { color: '#fca5a5', fontSize: 12, fontWeight: '600' },

  formCard: {
    backgroundColor: '#1e293b',
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  formCardTitle: { color: '#ffffff', fontSize: 15, fontWeight: '800', marginBottom: 14 },
  inputLabel: { color: '#cbd5e1', fontSize: 12, fontWeight: '700', marginBottom: 4, marginTop: 8 },
  input: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#ffffff',
    fontSize: 13,
  },
  cityStateRow: { flexDirection: 'row' },
  submitBtn: {
    backgroundColor: '#0284c7',
    paddingVertical: 14,
    borderRadius: Radius.md,
    alignItems: 'center',
    marginTop: 18,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '800' },
  cancelReapplyBtn: {
    marginTop: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  cancelReapplyBtnText: { color: '#94a3b8', fontSize: 13 },
});
