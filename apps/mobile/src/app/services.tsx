import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { ThemedText } from '../components/themed-text';
import { ThemedView } from '../components/themed-view';
import { Spacing, Radius } from '../constants/theme';
import { useAuth } from '../context/auth-context';
import { CheckoutService } from '../lib/checkout-service';
import { OsmAddressPicker } from '../components/osm-address-picker';
import { ServiceRequest, ServiceRequestType, UserAddress } from '../types';

export default function ServicesScreen() {
  const { user, addAddress } = useAuth();

  const [activeTab, setActiveTab] = useState<'book' | 'history'>('book');
  const [serviceType, setServiceType] = useState<ServiceRequestType>('installation');
  const [customerName, setCustomerName] = useState<string>(user?.name || '');
  const [phone, setPhone] = useState<string>(user?.phone || '');
  const [alternatePhone, setAlternatePhone] = useState<string>('');
  const [purifierModel, setPurifierModel] = useState<string>('');
  const [issueDescription, setIssueDescription] = useState<string>('');
  const [preferredDate, setPreferredDate] = useState<string>('Tomorrow');
  const [preferredSlot, setPreferredSlot] = useState<string>('Morning (09:00 - 12:00)');

  // Address
  const [selectedAddress, setSelectedAddress] = useState<UserAddress | null>(null);
  const [showAddressPicker, setShowAddressPicker] = useState<boolean>(false);

  // States
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedTicket, setSubmittedTicket] = useState<ServiceRequest | null>(null);

  // History
  const [myTickets, setMyTickets] = useState<ServiceRequest[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);

  useEffect(() => {
    if (user?.name && !customerName) setCustomerName(user.name);
    if (user?.phone && !phone) setPhone(user.phone);

    if (user?.addresses && user.addresses.length > 0) {
      const def = user.addresses.find(a => a.isDefault) || user.addresses[0];
      setSelectedAddress(def);
    }
  }, [user]);

  const fetchTickets = async () => {
    if (!user) return;
    setLoadingHistory(true);
    const tickets = await CheckoutService.getCustomerServiceRequests(user.id);
    setMyTickets(tickets);
    setLoadingHistory(false);
  };

  useEffect(() => {
    if (activeTab === 'history') {
      fetchTickets();
    }
  }, [activeTab, user]);

  const handleAddNewAddress = async (addrData: Omit<UserAddress, 'id'>) => {
    const res = await addAddress(addrData);
    if (res.success && res.address) {
      setSelectedAddress(res.address);
      setShowAddressPicker(false);
    }
  };

  const handleSubmitService = async () => {
    if (!phone.trim()) {
      setSubmitError('Please enter a valid phone number for the technician visit.');
      return;
    }

    if (!selectedAddress) {
      setSubmitError('Please select or specify the service address.');
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);

    const fullAddressString = `${selectedAddress.street}, ${selectedAddress.area ? `${selectedAddress.area}, ` : ''}${selectedAddress.city}, ${selectedAddress.state} - ${selectedAddress.postalCode}`;

    const res = await CheckoutService.createServiceRequest({
      customerId: user?.id || `guest_${Date.now()}`,
      customerName: customerName || 'Valued Customer',
      customerPhone: phone,
      alternatePhone: alternatePhone || undefined,
      customerAddress: fullAddressString,
      addressDetails: selectedAddress,
      requestType: serviceType,
      priority: serviceType === 'repair' ? 'high' : 'medium',
      scheduledSlot: `${preferredDate} | ${preferredSlot}`,
      preferredDate,
      purifierModel: purifierModel || 'Calinfco RO / Universal Purifier',
      issueDescription: issueDescription || `${serviceType.replace('_', ' ')} request`,
    });

    setIsSubmitting(false);

    if (res.success) {
      setSubmittedTicket(res.request);
    } else {
      setSubmitError('Failed to dispatch service ticket. Please try again.');
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <ThemedText type="subtitle" themeColor="primary" style={styles.badgeText}>
              🛠️ CERTIFIED TECHNICIAN DISPATCH
            </ThemedText>
            <ThemedText type="title" style={styles.title}>
              Doorstep Service & AMC
            </ThemedText>
            <Text style={styles.subtitle}>
              Free TDS testing, RO membrane service, installation & filter cartridges with 100% genuine parts
            </Text>
          </View>

          {/* Navigation Tabs */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'book' && styles.tabBtnActive]}
              onPress={() => setActiveTab('book')}>
              <Text style={[styles.tabBtnText, activeTab === 'book' && styles.tabBtnTextActive]}>
                Book Technician
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'history' && styles.tabBtnActive]}
              onPress={() => setActiveTab('history')}>
              <Text style={[styles.tabBtnText, activeTab === 'history' && styles.tabBtnTextActive]}>
                My Service Requests
              </Text>
            </TouchableOpacity>
          </View>

          {/* ================= TAB 1: BOOK TECHNICIAN ================= */}
          {activeTab === 'book' && (
            <>
              {submittedTicket ? (
                /* Success Card */
                <View style={styles.successCard}>
                  <View style={styles.successIconCircle}>
                    <Text style={styles.successCheck}>✓</Text>
                  </View>
                  <Text style={styles.successTitle}>Service Ticket Dispatched!</Text>
                  <Text style={styles.ticketIdBadge}>Ticket #{submittedTicket.id}</Text>
                  <Text style={styles.successMessage}>
                    A certified Calinfco service technician has been assigned to your area. We will call you at{' '}
                    <Text style={{ color: '#38bdf8', fontWeight: 'bold' }}>{submittedTicket.customerPhone}</Text> to
                    confirm your arrival slot.
                  </Text>

                  <View style={styles.ticketDetailsBox}>
                    <View style={styles.ticketRow}>
                      <Text style={styles.ticketKey}>Service Type:</Text>
                      <Text style={styles.ticketVal}>{submittedTicket.requestType.replace('_', ' ').toUpperCase()}</Text>
                    </View>
                    <View style={styles.ticketRow}>
                      <Text style={styles.ticketKey}>Slot:</Text>
                      <Text style={styles.ticketVal}>{submittedTicket.scheduledSlot}</Text>
                    </View>
                    <View style={styles.ticketRow}>
                      <Text style={styles.ticketKey}>Status:</Text>
                      <Text style={[styles.ticketVal, { color: '#10b981' }]}>OPEN (DISPATCHED)</Text>
                    </View>
                    <View style={styles.ticketRow}>
                      <Text style={styles.ticketKey}>Address:</Text>
                      <Text style={[styles.ticketVal, { flex: 1, textAlign: 'right' }]} numberOfLines={2}>
                        {submittedTicket.customerAddress}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.successActionRow}>
                    <TouchableOpacity
                      style={styles.viewHistoryBtn}
                      onPress={() => {
                        setSubmittedTicket(null);
                        setActiveTab('history');
                      }}>
                      <Text style={styles.viewHistoryBtnText}>View My Requests</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.bookAnotherBtn}
                      onPress={() => setSubmittedTicket(null)}>
                      <Text style={styles.bookAnotherBtnText}>Book Another Service</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                /* Booking Form */
                <View style={styles.formContainer}>
                  {submitError && (
                    <View style={styles.errorBox}>
                      <Text style={styles.errorText}>❌ {submitError}</Text>
                    </View>
                  )}

                  {/* 1. Service Type Selector */}
                  <View style={styles.card}>
                    <Text style={styles.sectionTitle}>1. Select Service Category</Text>
                    <View style={styles.typesGrid}>
                      {[
                        { id: 'installation', title: '🛠️ Free New Purifier Installation', desc: 'Doorstep mounting, inlet piping & free TDS check' },
                        { id: 'water_test', title: '💧 Comprehensive Raw Water TDS Test', desc: 'PPM test, hardness, pH and purification consultation' },
                        { id: 'filter_replacement', title: '🔄 Filter & RO Membrane Replacement', desc: '100% genuine carbon, sediment & RO membrane swap' },
                        { id: 'repair', title: '🔧 Repair & Leakage Troubleshooting', desc: 'Booster pump fix, auto-cut repair & valve leakage' },
                        { id: 'amc_visit', title: '🛡️ Annual Maintenance (AMC) Inspection', desc: 'Periodic checkup, sanitization & performance tune' },
                      ].map(opt => (
                        <TouchableOpacity
                          key={opt.id}
                          style={[styles.typeOptionCard, serviceType === opt.id && styles.typeOptionActive]}
                          onPress={() => setServiceType(opt.id as ServiceRequestType)}>
                          <View style={styles.typeHeader}>
                            <Text style={styles.typeOptionTitle}>{opt.title}</Text>
                            <View style={[styles.radioCircle, serviceType === opt.id && styles.radioCircleActive]}>
                              {serviceType === opt.id && <View style={styles.radioDot} />}
                            </View>
                          </View>
                          <Text style={styles.typeOptionDesc}>{opt.desc}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* 2. Address Selection */}
                  <View style={styles.card}>
                    <View style={styles.cardHeaderRow}>
                      <Text style={styles.sectionTitle}>2. Service Address</Text>
                      <TouchableOpacity onPress={() => setShowAddressPicker(!showAddressPicker)}>
                        <Text style={styles.changeActionText}>
                          {showAddressPicker ? 'Cancel' : '+ Add Address'}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {selectedAddress && !showAddressPicker && (
                      <View style={styles.selectedAddressCard}>
                        <Text style={styles.addressName}>
                          {selectedAddress.recipientName || user?.name || 'Customer Address'}
                        </Text>
                        <Text style={styles.addressDesc}>
                          {selectedAddress.street}, {selectedAddress.city} - {selectedAddress.postalCode}
                        </Text>
                        {selectedAddress.latitude && selectedAddress.longitude && (
                          <Text style={styles.osmPinText}>
                            📍 OpenStreetMap Pin: {selectedAddress.latitude.toFixed(4)}°, {selectedAddress.longitude.toFixed(4)}°
                          </Text>
                        )}
                      </View>
                    )}

                    {showAddressPicker && (
                      <OsmAddressPicker
                        onSaveAddress={handleAddNewAddress}
                        onCancel={() => setShowAddressPicker(false)}
                        submitButtonText="Use for Technician Visit"
                      />
                    )}
                  </View>

                  {/* 3. Schedule & Contact Details */}
                  <View style={styles.card}>
                    <Text style={styles.sectionTitle}>3. Preferred Date & Time</Text>

                    <Text style={styles.fieldLabel}>Date Preference:</Text>
                    <View style={styles.datePills}>
                      {['Tomorrow', 'In 2 Days', 'This Weekend', 'Urgent Today'].map(d => (
                        <TouchableOpacity
                          key={d}
                          style={[styles.datePill, preferredDate === d && styles.datePillActive]}
                          onPress={() => setPreferredDate(d)}>
                          <Text style={[styles.datePillText, preferredDate === d && styles.datePillTextActive]}>
                            {d}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Time Slot:</Text>
                    <View style={styles.slotGrid}>
                      {[
                        'Morning (09:00 - 12:00)',
                        'Afternoon (12:00 - 15:00)',
                        'Evening (15:00 - 18:00)',
                      ].map(s => (
                        <TouchableOpacity
                          key={s}
                          style={[styles.slotCard, preferredSlot === s && styles.slotCardActive]}
                          onPress={() => setPreferredSlot(s)}>
                          <Text style={[styles.slotCardText, preferredSlot === s && styles.slotCardTextActive]}>
                            {s}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* 4. Equipment & Notes */}
                  <View style={styles.card}>
                    <Text style={styles.sectionTitle}>4. Contact & Purifier Details</Text>

                    <View style={styles.inputGroup}>
                      <Text style={styles.fieldLabel}>Primary Phone *:</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="+91 98765 43210"
                        placeholderTextColor="#64748b"
                        keyboardType="phone-pad"
                        value={phone}
                        onChangeText={setPhone}
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.fieldLabel}>Alternate Contact (Optional):</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="+91 91234 56789"
                        placeholderTextColor="#64748b"
                        keyboardType="phone-pad"
                        value={alternatePhone}
                        onChangeText={setAlternatePhone}
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.fieldLabel}>Purifier Model / Brand:</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. Calinfco AquaShield Pro 10X / Kent Grand"
                        placeholderTextColor="#64748b"
                        value={purifierModel}
                        onChangeText={setPurifierModel}
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.fieldLabel}>Problem Description / Notes:</Text>
                      <TextInput
                        style={[styles.input, { height: 70, textAlignVertical: 'top' }]}
                        placeholder="e.g. Low water flow, membrane due for replacement, leak under sink"
                        placeholderTextColor="#64748b"
                        multiline
                        value={issueDescription}
                        onChangeText={setIssueDescription}
                      />
                    </View>

                    <TouchableOpacity
                      style={[styles.submitBtn, isSubmitting && { opacity: 0.6 }]}
                      disabled={isSubmitting}
                      onPress={handleSubmitService}>
                      {isSubmitting ? (
                        <ActivityIndicator color="#ffffff" />
                      ) : (
                        <Text style={styles.submitBtnText}>Dispatch Certified Technician ⚡</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </>
          )}

          {/* ================= TAB 2: SERVICE HISTORY ================= */}
          {activeTab === 'history' && (
            <View style={styles.historyContainer}>
              {loadingHistory ? (
                <View style={styles.centerBox}>
                  <ActivityIndicator color="#38bdf8" size="large" />
                  <Text style={styles.loadingText}>Fetching active tickets from Firestore...</Text>
                </View>
              ) : myTickets.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyIcon}>🛠️</Text>
                  <ThemedText type="subtitle" style={styles.emptyTitle}>No service requests found</ThemedText>
                  <Text style={styles.emptyDesc}>
                    You haven't requested any technician visits yet. Need installation or TDS testing?
                  </Text>
                  <TouchableOpacity
                    style={styles.bookNowBtn}
                    onPress={() => setActiveTab('book')}>
                    <Text style={styles.bookNowBtnText}>Book a Technician Visit →</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.ticketsList}>
                  {myTickets.map(t => (
                    <View key={t.id} style={styles.ticketCard}>
                      <View style={styles.ticketCardHeader}>
                        <View>
                          <Text style={styles.ticketCardId}>{t.id}</Text>
                          <Text style={styles.ticketCardType}>
                            {t.requestType.replace('_', ' ').toUpperCase()}
                          </Text>
                        </View>
                        <View style={[
                          styles.ticketStatusBadge,
                          t.status === 'completed' ? styles.statusCompleted : styles.statusOpen
                        ]}>
                          <Text style={styles.ticketStatusText}>{t.status.toUpperCase()}</Text>
                        </View>
                      </View>

                      <Text style={styles.ticketSlotText}>📅 Scheduled: {t.scheduledSlot}</Text>
                      <Text style={styles.ticketAddressText} numberOfLines={2}>📍 {t.customerAddress}</Text>

                      {t.technicianName && (
                        <View style={styles.techAssignedBox}>
                          <Text style={styles.techAssignedText}>
                            👷 Assigned Engineer: <Text style={{ fontWeight: 'bold' }}>{t.technicianName}</Text>
                          </Text>
                        </View>
                      )}

                      {t.tdsReadingAfterPpm && (
                        <View style={styles.tdsBox}>
                          <Text style={styles.tdsText}>
                            💧 TDS Certified: {t.tdsReadingAfterPpm} PPM (Optimal Mineral Range)
                          </Text>
                        </View>
                      )}

                      <Text style={styles.ticketCreatedText}>
                        Requested on {new Date(t.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
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
  header: { marginBottom: Spacing.md },
  badgeText: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2, marginBottom: 4 },
  title: { fontSize: 24, fontWeight: '800' },
  subtitle: { fontSize: 13, color: '#94a3b8', marginTop: 4, lineHeight: 18 },

  tabBar: { flexDirection: 'row', gap: 10, marginBottom: Spacing.md },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#1e293b',
    borderRadius: Radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  tabBtnActive: { backgroundColor: '#0284c7', borderColor: '#38bdf8' },
  tabBtnText: { color: '#94a3b8', fontSize: 12, fontWeight: '700' },
  tabBtnTextActive: { color: '#ffffff' },

  formContainer: { gap: Spacing.md },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { color: '#ffffff', fontSize: 14, fontWeight: '800', marginBottom: 10 },
  changeActionText: { color: '#38bdf8', fontSize: 12, fontWeight: '700' },

  typesGrid: { gap: 8 },
  typeOptionCard: {
    backgroundColor: '#0f172a',
    borderRadius: Radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  typeOptionActive: { borderColor: '#38bdf8', backgroundColor: 'rgba(56, 189, 248, 0.08)' },
  typeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  typeOptionTitle: { color: '#ffffff', fontSize: 13, fontWeight: '700', flex: 1 },
  typeOptionDesc: { color: '#94a3b8', fontSize: 11, marginTop: 4, lineHeight: 15 },
  radioCircle: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: '#64748b', justifyContent: 'center', alignItems: 'center' },
  radioCircleActive: { borderColor: '#38bdf8' },
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#38bdf8' },

  selectedAddressCard: { backgroundColor: '#0f172a', padding: 12, borderRadius: Radius.md, borderWidth: 1, borderColor: '#334155' },
  addressName: { color: '#ffffff', fontSize: 13, fontWeight: '700' },
  addressDesc: { color: '#cbd5e1', fontSize: 11, marginTop: 2, lineHeight: 16 },
  osmPinText: { color: '#38bdf8', fontSize: 10, marginTop: 4, fontWeight: '600' },

  fieldLabel: { color: '#cbd5e1', fontSize: 11, fontWeight: '600', marginBottom: 6 },
  datePills: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  datePill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#334155' },
  datePillActive: { backgroundColor: '#0284c7', borderColor: '#38bdf8' },
  datePillText: { color: '#94a3b8', fontSize: 11 },
  datePillTextActive: { color: '#ffffff', fontWeight: '700' },

  slotGrid: { gap: 6 },
  slotCard: { padding: 10, borderRadius: Radius.md, backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#334155' },
  slotCardActive: { backgroundColor: 'rgba(56, 189, 248, 0.08)', borderColor: '#38bdf8' },
  slotCardText: { color: '#cbd5e1', fontSize: 12 },
  slotCardTextActive: { color: '#38bdf8', fontWeight: '700' },

  inputGroup: { marginBottom: 10 },
  input: {
    backgroundColor: '#0f172a',
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#ffffff',
    fontSize: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },

  submitBtn: { backgroundColor: '#0284c7', paddingVertical: 14, borderRadius: Radius.md, alignItems: 'center', marginTop: 10 },
  submitBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '800' },

  errorBox: { backgroundColor: '#450a0a', padding: 10, borderRadius: Radius.md, marginBottom: Spacing.md },
  errorText: { color: '#f87171', fontSize: 12, fontWeight: '700' },

  // Success Card
  successCard: {
    backgroundColor: '#1e293b',
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#10b981',
  },
  successIconCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(16, 185, 129, 0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  successCheck: { color: '#10b981', fontSize: 28, fontWeight: 'bold' },
  successTitle: { color: '#ffffff', fontSize: 20, fontWeight: '800', textAlign: 'center' },
  ticketIdBadge: { color: '#38bdf8', fontSize: 13, fontWeight: '800', marginVertical: 6 },
  successMessage: { color: '#94a3b8', fontSize: 12, textAlign: 'center', lineHeight: 18, marginBottom: 16 },

  ticketDetailsBox: { backgroundColor: '#0f172a', borderRadius: Radius.md, padding: 12, width: '100%', gap: 8, marginBottom: 16 },
  ticketRow: { flexDirection: 'row', justifyContent: 'space-between' },
  ticketKey: { color: '#64748b', fontSize: 11 },
  ticketVal: { color: '#e2e8f0', fontSize: 11, fontWeight: '700' },

  successActionRow: { flexDirection: 'row', gap: 10, width: '100%' },
  viewHistoryBtn: { flex: 1, backgroundColor: '#0284c7', paddingVertical: 10, borderRadius: Radius.md, alignItems: 'center' },
  viewHistoryBtnText: { color: '#ffffff', fontSize: 12, fontWeight: '700' },
  bookAnotherBtn: { flex: 1, backgroundColor: '#334155', paddingVertical: 10, borderRadius: Radius.md, alignItems: 'center' },
  bookAnotherBtnText: { color: '#ffffff', fontSize: 12, fontWeight: '700' },

  // History Tab
  historyContainer: { gap: Spacing.md },
  centerBox: { padding: 40, alignItems: 'center' },
  loadingText: { color: '#94a3b8', fontSize: 12, marginTop: 12 },

  emptyCard: { backgroundColor: '#1e293b', borderRadius: Radius.lg, padding: Spacing.xl, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  emptyIcon: { fontSize: 40, marginBottom: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  emptyDesc: { color: '#94a3b8', fontSize: 12, textAlign: 'center', marginBottom: 16 },
  bookNowBtn: { backgroundColor: '#0284c7', paddingHorizontal: 16, paddingVertical: 10, borderRadius: Radius.md },
  bookNowBtnText: { color: '#ffffff', fontSize: 12, fontWeight: '700' },

  ticketsList: { gap: 12 },
  ticketCard: { backgroundColor: '#1e293b', borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1, borderColor: '#334155' },
  ticketCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  ticketCardId: { color: '#38bdf8', fontSize: 14, fontWeight: '800' },
  ticketCardType: { color: '#ffffff', fontSize: 12, fontWeight: '700', marginTop: 2 },
  ticketStatusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusOpen: { backgroundColor: '#075985' },
  statusCompleted: { backgroundColor: '#065f46' },
  ticketStatusText: { color: '#ffffff', fontSize: 10, fontWeight: '800' },
  ticketSlotText: { color: '#cbd5e1', fontSize: 12, marginBottom: 4 },
  ticketAddressText: { color: '#94a3b8', fontSize: 11, lineHeight: 16 },
  techAssignedBox: { backgroundColor: '#0f172a', padding: 8, borderRadius: Radius.sm, marginTop: 8 },
  techAssignedText: { color: '#38bdf8', fontSize: 11 },
  tdsBox: { backgroundColor: '#064e3b', padding: 8, borderRadius: Radius.sm, marginTop: 6 },
  tdsText: { color: '#10b981', fontSize: 11, fontWeight: '700' },
  ticketCreatedText: { color: '#64748b', fontSize: 10, marginTop: 8 },
});
