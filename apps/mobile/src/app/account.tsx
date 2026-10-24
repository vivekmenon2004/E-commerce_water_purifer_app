import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/context/auth-context';

export default function AccountScreen() {
  const theme = useTheme();
  const { 
    user, 
    isDemoMode, 
    isDealer, 
    isPendingDealer, 
    signIn, 
    signUpCustomer, 
    applyForDealer, 
    signOut, 
    switchDemoPersona 
  } = useAuth();

  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Dealer Application Form State
  const [showDealerForm, setShowDealerForm] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [tradeLicense, setTradeLicense] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [dealerSubmitting, setDealerSubmitting] = useState(false);

  const handleAuthSubmit = async () => {
    setErrorMsg('');
    if (!email || !password) {
      setErrorMsg('Please enter both email and password');
      return;
    }

    setIsSubmitting(true);
    if (authMode === 'signin') {
      const res = await signIn(email, password);
      if (!res.success) setErrorMsg(res.error || 'Login failed');
    } else {
      if (!name || !phone) {
        setErrorMsg('Please provide name and phone number');
        setIsSubmitting(false);
        return;
      }
      const res = await signUpCustomer(name, email, phone, password);
      if (!res.success) setErrorMsg(res.error || 'Registration failed');
    }
    setIsSubmitting(false);
  };

  const handleDealerSubmit = async () => {
    if (!businessName || !gstNumber || !contactPerson || !storeAddress || !city || !state || !pincode) {
      const msg = 'Please fill in all mandatory dealer fields including GST and store address.';
      if (Platform.OS === 'web') alert(msg); else Alert.alert('Incomplete Form', msg);
      return;
    }

    setDealerSubmitting(true);
    const res = await applyForDealer({
      businessName,
      gstNumber,
      tradeLicense,
      contactPerson,
      storeAddress,
      city,
      state,
      pincode,
    });
    setDealerSubmitting(false);

    if (res.success) {
      const okMsg = 'Dealer registration submitted! Status is pending admin approval.';
      if (Platform.OS === 'web') alert(okMsg); else Alert.alert('Request Submitted', okMsg);
      setShowDealerForm(false);
    } else {
      const failMsg = res.error || 'Failed to submit dealer application';
      if (Platform.OS === 'web') alert(failMsg); else Alert.alert('Error', failMsg);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Header */}
          <View style={styles.header}>
            <ThemedText type="subtitle" themeColor="primary" style={styles.badgeText}>
              💧 CALINFCO ACCOUNT
            </ThemedText>
            <ThemedText type="title" style={styles.title}>
              {user ? `Welcome, ${user.name.split(' ')[0]}` : 'Sign In or Register'}
            </ThemedText>
          </View>

          {/* Demo Persona Switcher Banner */}
          {isDemoMode && (
            <View style={styles.demoBanner}>
              <View style={styles.demoBannerHeader}>
                <Text style={styles.demoBannerTag}>DEMO MODE ACTIVE</Text>
                <Text style={styles.demoBannerHint}>Switch Personas Instantly:</Text>
              </View>
              <View style={styles.personaButtonRow}>
                <TouchableOpacity
                  style={[styles.personaBtn, user?.role === 'customer' && user?.dealerStatus === 'none' && styles.personaBtnActive]}
                  onPress={() => switchDemoPersona('customer')}>
                  <Text style={[styles.personaBtnText, user?.role === 'customer' && user?.dealerStatus === 'none' && styles.personaBtnTextActive]}>
                    👤 Customer
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.personaBtn, isPendingDealer && styles.personaBtnActive]}
                  onPress={() => switchDemoPersona('pendingDealer')}>
                  <Text style={[styles.personaBtnText, isPendingDealer && styles.personaBtnTextActive]}>
                    ⏳ Pending Dealer
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.personaBtn, isDealer && styles.personaBtnActive]}
                  onPress={() => switchDemoPersona('approvedDealer')}>
                  <Text style={[styles.personaBtnText, isDealer && styles.personaBtnTextActive]}>
                    🌟 Verified Dealer
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {user ? (
            /* ================= LOGGED IN USER PROFILE ================= */
            <View style={styles.profileSection}>
              {/* Role Card */}
              <View style={[styles.card, isDealer ? styles.cardDealer : styles.cardStandard]}>
                <View style={styles.roleHeaderRow}>
                  <View>
                    <ThemedText type="subtitle" style={styles.userName}>{user.name}</ThemedText>
                    <Text style={styles.userEmail}>{user.email} • {user.phone}</Text>
                  </View>
                  <View style={[styles.roleBadge, isDealer ? styles.badgeDealer : isPendingDealer ? styles.badgePending : styles.badgeCustomer]}>
                    <Text style={styles.roleBadgeText}>
                      {isDealer ? 'VERIFIED DEALER' : isPendingDealer ? 'DEALER PENDING' : 'CUSTOMER'}
                    </Text>
                  </View>
                </View>

                {isDealer && (
                  <View style={styles.dealerPerksBox}>
                    <Text style={styles.perksTitle}>Wholesale Dealership Active</Text>
                    <Text style={styles.perksDesc}>
                      {user.dealerDetails?.businessName} • GST: {user.dealerDetails?.gstNumber}
                    </Text>
                    <View style={styles.perkPills}>
                      <View style={styles.perkPill}><Text style={styles.perkPillText}>✓ 30-45% Wholesale Margin</Text></View>
                      <View style={styles.perkPill}><Text style={styles.perkPillText}>✓ Bulk Spares Pricing</Text></View>
                      <View style={styles.perkPill}><Text style={styles.perkPillText}>✓ Priority Dispatch</Text></View>
                    </View>
                  </View>
                )}

                {isPendingDealer && (
                  <View style={styles.pendingBox}>
                    <Text style={styles.pendingTitle}>⏳ Dealer Application Under Review</Text>
                    <Text style={styles.pendingDesc}>
                      Application for &quot;{user.dealerDetails?.businessName}&quot; (GST: {user.dealerDetails?.gstNumber}) was submitted on {new Date(user.dealerDetails?.requestedAt || '').toLocaleDateString()}.
                    </Text>
                    <Text style={styles.pendingNote}>
                      Our compliance team is verifying your business documents. You will be notified once an administrator approves your account.
                    </Text>
                  </View>
                )}

                <View style={styles.referralRow}>
                  <Text style={styles.referralLabel}>Your Referral Code:</Text>
                  <Text style={styles.referralCode}>{user.referralCode}</Text>
                </View>
              </View>

              {/* Apply for Dealer Request (if standard customer) */}
              {!isDealer && !isPendingDealer && (
                <View style={styles.dealerPromoCard}>
                  <View style={styles.promoHeader}>
                    <Text style={styles.promoIcon}>🏢</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.promoTitle}>Become a Calinfco Authorized Dealer</Text>
                      <Text style={styles.promoSubtitle}>
                        Get wholesale rates on Water Purifiers, Dispensers, Booster Pumps, Filters, and Spares.
                      </Text>
                    </View>
                  </View>

                  {!showDealerForm ? (
                    <TouchableOpacity
                      style={styles.applyBtn}
                      onPress={() => setShowDealerForm(true)}>
                      <Text style={styles.applyBtnText}>Apply for Dealership →</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.dealerForm}>
                      <Text style={styles.formSectionTitle}>Commercial & Business Information</Text>
                      
                      <Text style={styles.inputLabel}>Business / Store Name *</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. Apex Water Technologies & Hardware"
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
                        value={gstNumber}
                        onChangeText={setGstNumber}
                      />

                      <Text style={styles.inputLabel}>Trade License / PAN (Optional)</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. DL-TL-2026-901"
                        placeholderTextColor="#64748b"
                        value={tradeLicense}
                        onChangeText={setTradeLicense}
                      />

                      <Text style={styles.inputLabel}>Contact Person / Authorized Signatory *</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. Ramesh Kumar"
                        placeholderTextColor="#64748b"
                        value={contactPerson}
                        onChangeText={setContactPerson}
                      />

                      <Text style={styles.inputLabel}>Store / Warehouse Address *</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Shop No., Commercial Complex, Road"
                        placeholderTextColor="#64748b"
                        value={storeAddress}
                        onChangeText={setStoreAddress}
                      />

                      <View style={styles.row}>
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

                      <View style={styles.formActionRow}>
                        <TouchableOpacity
                          style={styles.cancelBtn}
                          onPress={() => setShowDealerForm(false)}>
                          <Text style={styles.cancelBtnText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.submitDealerBtn, dealerSubmitting && { opacity: 0.6 }]}
                          disabled={dealerSubmitting}
                          onPress={handleDealerSubmit}>
                          <Text style={styles.submitDealerBtnText}>
                            {dealerSubmitting ? 'Submitting...' : 'Submit Dealer Request'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              )}

              {/* DEALER COMMAND HUB (FOR APPROVED DEALERS) */}
              {isDealer && (
                <View style={[styles.hubCard, { borderColor: '#10b981', borderWidth: 1, backgroundColor: '#064e3b15' }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                    <Text style={{ fontSize: 20, marginRight: 8 }}>🏢</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.hubTitle, { color: '#10b981', marginBottom: 2 }]}>Wholesale Dealer Command Hub</Text>
                      <Text style={{ color: '#94a3b8', fontSize: 11 }}>Active Dealership: {user.dealerDetails?.businessName}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.hubLinksGrid}>
                    <TouchableOpacity
                      style={[styles.hubLink, { borderColor: '#059669', borderWidth: 1 }]}
                      onPress={() => router.push('/dealer-status' as any)}>
                      <Text style={styles.hubLinkIcon}>📋</Text>
                      <Text style={[styles.hubLinkText, { color: '#6ee7b7' }]}>Dealer Certificate</Text>
                      <Text style={styles.hubLinkSub}>Privileges & Status</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.hubLink, { borderColor: '#059669', borderWidth: 1 }]}
                      onPress={() => router.push('/explore' as any)}>
                      <Text style={styles.hubLinkIcon}>🏷️</Text>
                      <Text style={[styles.hubLinkText, { color: '#6ee7b7' }]}>Wholesale Catalog</Text>
                      <Text style={styles.hubLinkSub}>30-45% Margin Rates</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.hubLink, { borderColor: '#059669', borderWidth: 1 }]}
                      onPress={() => router.push('/orders' as any)}>
                      <Text style={styles.hubLinkIcon}>📦</Text>
                      <Text style={[styles.hubLinkText, { color: '#6ee7b7' }]}>Bulk Orders</Text>
                      <Text style={styles.hubLinkSub}>B2B Consignments</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.hubLink, { borderColor: '#059669', borderWidth: 1 }]}
                      onPress={() => router.push('/cart' as any)}>
                      <Text style={styles.hubLinkIcon}>🛒</Text>
                      <Text style={[styles.hubLinkText, { color: '#6ee7b7' }]}>Wholesale Cart</Text>
                      <Text style={styles.hubLinkSub}>Bulk stock check</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Customer Account Navigation Hub */}
              <View style={styles.hubCard}>
                <Text style={styles.hubTitle}>Shopping & Customer Services</Text>
                
                <View style={styles.hubLinksGrid}>
                  <TouchableOpacity
                    style={styles.hubLink}
                    onPress={() => router.push('/orders' as any)}>
                    <Text style={styles.hubLinkIcon}>📦</Text>
                    <Text style={styles.hubLinkText}>My Orders</Text>
                    <Text style={styles.hubLinkSub}>Track & details</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.hubLink}
                    onPress={() => router.push('/dealer-status' as any)}>
                    <Text style={styles.hubLinkIcon}>🏢</Text>
                    <Text style={styles.hubLinkText}>Dealership Portal</Text>
                    <Text style={styles.hubLinkSub}>
                      {isDealer ? 'Verified Active' : isPendingDealer ? 'Under Review ⏳' : 'Apply Wholesale'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.hubLink}
                    onPress={() => router.push('/profile' as any)}>
                    <Text style={styles.hubLinkIcon}>📍</Text>
                    <Text style={styles.hubLinkText}>Addresses & Info</Text>
                    <Text style={styles.hubLinkSub}>OSM Map Pin</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.hubLink}
                    onPress={() => router.push('/cart' as any)}>
                    <Text style={styles.hubLinkIcon}>🛒</Text>
                    <Text style={styles.hubLinkText}>Shopping Cart</Text>
                    <Text style={styles.hubLinkSub}>View active items</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.hubLink}
                    onPress={() => router.push('/wishlist' as any)}>
                    <Text style={styles.hubLinkIcon}>💖</Text>
                    <Text style={styles.hubLinkText}>My Wishlist</Text>
                    <Text style={styles.hubLinkSub}>Saved purifiers</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.hubLink}
                    onPress={() => router.push('/services' as any)}>
                    <Text style={styles.hubLinkIcon}>🔧</Text>
                    <Text style={styles.hubLinkText}>Service & TDS</Text>
                    <Text style={styles.hubLinkSub}>Book installation</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.hubLink}
                    onPress={() => router.push('/explore' as any)}>
                    <Text style={styles.hubLinkIcon}>🚰</Text>
                    <Text style={styles.hubLinkText}>Product Catalog</Text>
                    <Text style={styles.hubLinkSub}>65+ hardware items</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Customer Recent Orders */}
              <View style={styles.ordersCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Text style={styles.hubTitle}>Recent Orders & Installations</Text>
                  <TouchableOpacity onPress={() => router.push('/orders' as any)}>
                    <Text style={{ color: '#38bdf8', fontSize: 11, fontWeight: '700' }}>View All →</Text>
                  </TouchableOpacity>
                </View>
                
                <TouchableOpacity
                  style={styles.orderSnippet}
                  onPress={() => router.push('/orders' as any)}>
                  <View style={styles.orderTopRow}>
                    <Text style={styles.orderId}>View Live Orders in Firestore</Text>
                    <Text style={styles.orderStatusBadge}>Active Tracking</Text>
                  </View>
                  <Text style={styles.orderItemName}>Open complete order history & technician dispatch status</Text>
                  <Text style={styles.orderDate}>Tap to view invoice, delivery address, and status timeline →</Text>
                </TouchableOpacity>
              </View>

              {/* Sign Out Button */}
              <TouchableOpacity style={styles.signOutBtn} onPress={signOut}>
                <Text style={styles.signOutBtnText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* ================= SIGN IN / SIGN UP FORM ================= */
            <View style={styles.authBox}>
              <View style={styles.authTabs}>
                <TouchableOpacity
                  style={[styles.authTab, authMode === 'signin' && styles.authTabActive]}
                  onPress={() => setAuthMode('signin')}>
                  <Text style={[styles.authTabText, authMode === 'signin' && styles.authTabTextActive]}>
                    Sign In
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.authTab, authMode === 'signup' && styles.authTabActive]}
                  onPress={() => setAuthMode('signup')}>
                  <Text style={[styles.authTabText, authMode === 'signup' && styles.authTabTextActive]}>
                    New Customer Register
                  </Text>
                </TouchableOpacity>
              </View>

              {errorMsg !== '' && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
                </View>
              )}

              {authMode === 'signup' && (
                <>
                  <Text style={styles.inputLabel}>Full Name *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your name"
                    placeholderTextColor="#64748b"
                    value={name}
                    onChangeText={setName}
                  />

                  <Text style={styles.inputLabel}>Phone Number *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="+91 98765 43210"
                    placeholderTextColor="#64748b"
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={setPhone}
                  />
                </>
              )}

              <Text style={styles.inputLabel}>Email Address *</Text>
              <TextInput
                style={styles.input}
                placeholder="name@example.com"
                placeholderTextColor="#64748b"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />

              <Text style={styles.inputLabel}>Password *</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#64748b"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />

              <TouchableOpacity
                style={[styles.primaryAuthBtn, isSubmitting && { opacity: 0.6 }]}
                disabled={isSubmitting}
                onPress={handleAuthSubmit}>
                <Text style={styles.primaryAuthBtnText}>
                  {isSubmitting ? 'Processing...' : authMode === 'signin' ? 'Sign In to Calinfco' : 'Create Customer Account'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.primaryAuthBtn, { backgroundColor: '#064e3b', marginTop: 10, borderColor: '#10b981', borderWidth: 1 }]}
                onPress={() => {
                  switchDemoPersona('approvedDealer');
                }}>
                <Text style={styles.primaryAuthBtnText}>
                  🏢 Sign In as Authorized Dealer (Direct B2B)
                </Text>
              </TouchableOpacity>

              <Text style={styles.dealerNote}>
                💡 Want to purchase wholesale? Register as a customer, then submit your business details in the Dealership Portal.
              </Text>
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
  scrollContent: { padding: Spacing.lg, paddingBottom: 100 },
  header: { marginBottom: Spacing.md },
  badgeText: { fontSize: 12, fontWeight: '700', letterSpacing: 1.2, marginBottom: 4 },
  title: { fontSize: 24, fontWeight: '800' },

  // Demo Banner
  demoBanner: {
    backgroundColor: '#0f172a',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#0284c7',
    marginBottom: Spacing.lg,
  },
  demoBannerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  demoBannerTag: { color: '#38bdf8', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  demoBannerHint: { color: '#94a3b8', fontSize: 11 },
  personaButtonRow: { flexDirection: 'row', gap: 6 },
  personaBtn: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: Radius.sm,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  personaBtnActive: { backgroundColor: '#0284c7', borderColor: '#38bdf8' },
  personaBtnText: { color: '#cbd5e1', fontSize: 11, fontWeight: '600' },
  personaBtnTextActive: { color: '#ffffff', fontWeight: '800' },

  // Profile Section
  profileSection: { gap: Spacing.md },
  card: {
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
  },
  cardStandard: { backgroundColor: '#1e293b', borderColor: '#334155' },
  cardDealer: { backgroundColor: '#0c2340', borderColor: '#0284c7' },
  roleHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  userName: { fontSize: 18, color: '#ffffff' },
  userEmail: { fontSize: 13, color: '#94a3b8', marginTop: 2 },
  roleBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeCustomer: { backgroundColor: '#334155' },
  badgePending: { backgroundColor: '#854d0e' },
  badgeDealer: { backgroundColor: '#0369a1' },
  roleBadgeText: { color: '#ffffff', fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },

  dealerPerksBox: {
    marginTop: Spacing.md,
    backgroundColor: 'rgba(2, 132, 199, 0.15)',
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  perksTitle: { color: '#38bdf8', fontSize: 13, fontWeight: '700' },
  perksDesc: { color: '#e2e8f0', fontSize: 12, marginTop: 2, marginBottom: 8 },
  perkPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  perkPill: { backgroundColor: '#0369a1', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  perkPillText: { color: '#ffffff', fontSize: 11, fontWeight: '600' },

  pendingBox: {
    marginTop: Spacing.md,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  pendingTitle: { color: '#fbbf24', fontSize: 13, fontWeight: '700' },
  pendingDesc: { color: '#fef3c7', fontSize: 12, marginTop: 4 },
  pendingNote: { color: '#fcd34d', fontSize: 11, fontStyle: 'italic', marginTop: 6 },

  referralRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  referralLabel: { color: '#94a3b8', fontSize: 12 },
  referralCode: { color: '#38bdf8', fontSize: 13, fontWeight: '800', letterSpacing: 1 },

  // Dealer Promo & Form
  dealerPromoCard: {
    backgroundColor: '#1e293b',
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#334155',
  },
  promoHeader: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  promoIcon: { fontSize: 28 },
  promoTitle: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
  promoSubtitle: { color: '#94a3b8', fontSize: 12, marginTop: 2 },
  applyBtn: {
    marginTop: Spacing.md,
    backgroundColor: '#0284c7',
    paddingVertical: 10,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  applyBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '700' },

  dealerForm: { marginTop: Spacing.md, borderTopWidth: 1, borderTopColor: '#334155', paddingTop: Spacing.md },
  formSectionTitle: { color: '#38bdf8', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginBottom: 10 },
  inputLabel: { color: '#cbd5e1', fontSize: 12, fontWeight: '600', marginBottom: 4, marginTop: 8 },
  input: {
    backgroundColor: '#0f172a',
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#ffffff',
    fontSize: 13,
    borderWidth: 1,
    borderColor: '#334155',
  },
  row: { flexDirection: 'row' },
  formActionRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: Spacing.lg },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: Radius.md },
  cancelBtnText: { color: '#94a3b8', fontSize: 13, fontWeight: '600' },
  submitDealerBtn: { backgroundColor: '#0284c7', paddingVertical: 10, paddingHorizontal: 18, borderRadius: Radius.md },
  submitDealerBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '700' },

  signOutBtn: {
    marginTop: Spacing.lg,
    backgroundColor: '#334155',
    paddingVertical: 12,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  signOutBtnText: { color: '#e2e8f0', fontSize: 13, fontWeight: '700' },

  // Auth Form Box
  authBox: {
    backgroundColor: '#1e293b',
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#334155',
  },
  authTabs: { flexDirection: 'row', backgroundColor: '#0f172a', borderRadius: Radius.md, padding: 3, marginBottom: Spacing.md },
  authTab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: Radius.sm },
  authTabActive: { backgroundColor: '#0284c7' },
  authTabText: { color: '#94a3b8', fontSize: 12, fontWeight: '600' },
  authTabTextActive: { color: '#ffffff', fontWeight: '700' },
  errorBox: { backgroundColor: 'rgba(239, 68, 68, 0.15)', padding: 10, borderRadius: Radius.sm, marginBottom: 10, borderWidth: 1, borderColor: '#ef4444' },
  errorText: { color: '#f87171', fontSize: 12 },
  primaryAuthBtn: { backgroundColor: '#0284c7', borderRadius: Radius.md, paddingVertical: 12, alignItems: 'center', marginTop: Spacing.lg },
  primaryAuthBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
  dealerNote: { color: '#94a3b8', fontSize: 11, marginTop: Spacing.md, textAlign: 'center', lineHeight: 16 },

  // Customer Hub Styles
  hubCard: {
    backgroundColor: '#1e293b',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#334155',
  },
  hubTitle: { color: '#ffffff', fontSize: 13, fontWeight: '800', marginBottom: 10 },
  hubLinksGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  hubLink: {
    width: '48%',
    backgroundColor: '#0f172a',
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#334155',
  },
  hubLinkIcon: { fontSize: 24, marginBottom: 4 },
  hubLinkText: { color: '#ffffff', fontSize: 12, fontWeight: '700' },
  hubLinkSub: { color: '#94a3b8', fontSize: 10, marginTop: 2 },

  // Orders Snippet Card
  ordersCard: {
    backgroundColor: '#1e293b',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 10,
  },
  orderSnippet: {
    backgroundColor: '#0f172a',
    borderRadius: Radius.md,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: '#334155',
  },
  orderTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderId: { color: '#38bdf8', fontSize: 11, fontWeight: '800' },
  orderStatusBadge: {
    color: '#fbbf24',
    fontSize: 10,
    fontWeight: '700',
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  orderItemName: { color: '#e2e8f0', fontSize: 12, fontWeight: '700', marginTop: 4 },
  orderDate: { color: '#94a3b8', fontSize: 10, marginTop: 2 },
});
