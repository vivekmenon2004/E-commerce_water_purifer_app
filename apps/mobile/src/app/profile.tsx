import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { ThemedText } from '../components/themed-text';
import { ThemedView } from '../components/themed-view';
import { Spacing, Radius } from '../constants/theme';
import { useAuth } from '../context/auth-context';
import { OsmAddressPicker } from '../components/osm-address-picker';
import { UserAddress } from '../types';

export default function ProfileScreen() {
  const { user, updateProfile, addAddress, deleteAddress, setDefaultAddress } = useAuth();

  const [name, setName] = useState<string>(user?.name || '');
  const [phone, setPhone] = useState<string>(user?.phone || '');
  const [isSavingProfile, setIsSavingProfile] = useState<boolean>(false);
  const [profileMsg, setProfileMsg] = useState<{ text: string; isError: boolean } | null>(null);

  const [showAddressPicker, setShowAddressPicker] = useState<boolean>(false);

  if (!user) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.centerBox}>
            <Text style={styles.iconBig}>👤</Text>
            <ThemedText type="title">Please Sign In</ThemedText>
            <Text style={styles.subText}>Sign in to view and edit your profile and delivery addresses.</Text>
            <TouchableOpacity style={styles.loginBtn} onPress={() => router.push('/account' as any)}>
              <Text style={styles.loginBtnText}>Go to Login →</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      setProfileMsg({ text: 'Name cannot be empty', isError: true });
      return;
    }

    setIsSavingProfile(true);
    setProfileMsg(null);

    const res = await updateProfile(name.trim(), phone.trim());
    setIsSavingProfile(false);

    if (res.success) {
      setProfileMsg({ text: 'Profile details saved successfully!', isError: false });
      setTimeout(() => setProfileMsg(null), 3000);
    } else {
      setProfileMsg({ text: res.error || 'Failed to update profile', isError: true });
    }
  };

  const handleAddAddress = async (addr: Omit<UserAddress, 'id'>) => {
    const res = await addAddress(addr);
    if (res.success) {
      setShowAddressPicker(false);
    }
  };

  const handleDeleteAddress = async (addrId: string) => {
    await deleteAddress(addrId);
  };

  const handleSetDefault = async (addrId: string) => {
    await setDefaultAddress(addrId);
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Top Bar */}
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Text style={styles.backBtnText}>← Back</Text>
            </TouchableOpacity>
            <ThemedText type="title" style={styles.pageTitle}>Customer Profile</ThemedText>
          </View>

          {/* Feedback */}
          {profileMsg && (
            <View style={[styles.msgBox, profileMsg.isError ? styles.msgBoxError : styles.msgBoxSuccess]}>
              <Text style={styles.msgText}>{profileMsg.text}</Text>
            </View>
          )}

          {/* SECTION 1: PROFILE DETAILS */}
          <View style={styles.card}>
            <Text style={styles.cardHeaderTitle}>Personal Information</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.fieldLabel}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Your full name"
                placeholderTextColor="#64748b"
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.fieldLabel}>Email Address (Verified)</Text>
              <TextInput
                style={[styles.input, styles.inputDisabled]}
                value={user.email}
                editable={false}
              />
              <Text style={styles.helperText}>Email is linked to your Firebase authentication account</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.fieldLabel}>Phone Number</Text>
              <TextInput
                style={styles.input}
                placeholder="+91 98765 43210"
                placeholderTextColor="#64748b"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </View>

            <View style={styles.roleRow}>
              <Text style={styles.fieldLabel}>Account Role:</Text>
              <Text style={styles.roleBadge}>{user.role.toUpperCase()}</Text>
            </View>

            <TouchableOpacity
              style={[styles.saveProfileBtn, isSavingProfile && { opacity: 0.6 }]}
              disabled={isSavingProfile}
              onPress={handleSaveProfile}>
              {isSavingProfile ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.saveProfileBtnText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* SECTION 2: DELIVERY ADDRESS BOOK */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardHeaderTitle}>Saved Delivery Addresses</Text>
              <TouchableOpacity onPress={() => setShowAddressPicker(!showAddressPicker)}>
                <Text style={styles.changeActionText}>
                  {showAddressPicker ? 'Close' : '+ Add Address'}
                </Text>
              </TouchableOpacity>
            </View>

            {showAddressPicker && (
              <OsmAddressPicker
                onSaveAddress={handleAddAddress}
                onCancel={() => setShowAddressPicker(false)}
                submitButtonText="Save to Address Book"
              />
            )}

            {(user.addresses || []).length === 0 && !showAddressPicker ? (
              <View style={styles.noAddressBox}>
                <Text style={styles.noAddressText}>No saved addresses yet.</Text>
                <TouchableOpacity
                  style={styles.addFirstAddrBtn}
                  onPress={() => setShowAddressPicker(true)}>
                  <Text style={styles.addFirstAddrBtnText}>+ Add Delivery Address (with Map Pin)</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.addressList}>
                {(user.addresses || []).map(addr => (
                  <View key={addr.id} style={styles.addressItemCard}>
                    <View style={styles.addressItemHeader}>
                      <View style={styles.labelRow}>
                        <Text style={styles.addressLabelBadge}>{addr.label || 'Home'}</Text>
                        {addr.isDefault && <Text style={styles.defaultBadge}>DEFAULT</Text>}
                      </View>

                      <View style={styles.itemActions}>
                        {!addr.isDefault && (
                          <TouchableOpacity
                            style={styles.actionLinkBtn}
                            onPress={() => handleSetDefault(addr.id)}>
                            <Text style={styles.actionLinkText}>Make Default</Text>
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity
                          style={styles.actionLinkBtn}
                          onPress={() => handleDeleteAddress(addr.id)}>
                          <Text style={[styles.actionLinkText, { color: '#ef4444' }]}>Delete</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {addr.recipientName ? (
                      <Text style={styles.recipientText}>{addr.recipientName}</Text>
                    ) : null}

                    <Text style={styles.fullAddressText}>
                      {addr.street}, {addr.area ? `${addr.area}, ` : ''}{addr.city}, {addr.state} - {addr.postalCode}
                    </Text>

                    {addr.landmark ? (
                      <Text style={styles.landmarkText}>Landmark: {addr.landmark}</Text>
                    ) : null}

                    {addr.phone ? (
                      <Text style={styles.phoneText}>📞 {addr.phone}</Text>
                    ) : null}

                    {addr.latitude && addr.longitude ? (
                      <Text style={styles.osmCoordsText}>
                        📍 OpenStreetMap Coordinates: {addr.latitude.toFixed(4)}° N, {addr.longitude.toFixed(4)}° E
                      </Text>
                    ) : null}
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Quick Hub Navigation */}
          <View style={styles.quickNavCard}>
            <TouchableOpacity
              style={styles.navRowItem}
              onPress={() => router.push('/orders' as any)}>
              <Text style={styles.navRowIcon}>📦</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.navRowTitle}>My Orders</Text>
                <Text style={styles.navRowDesc}>Track shipment, view invoices and order history</Text>
              </View>
              <Text style={styles.navRowArrow}>→</Text>
            </TouchableOpacity>

            <View style={styles.navDivider} />

            <TouchableOpacity
              style={styles.navRowItem}
              onPress={() => router.push('/services' as any)}>
              <Text style={styles.navRowIcon}>🛠️</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.navRowTitle}>Book Technician / AMC</Text>
                <Text style={styles.navRowDesc}>Installation, water TDS tests, filter service</Text>
              </View>
              <Text style={styles.navRowArrow}>→</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: { padding: Spacing.md, paddingBottom: 110 },
  topBar: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  backBtn: { padding: 4 },
  backBtnText: { color: '#38bdf8', fontSize: 13, fontWeight: '700' },
  pageTitle: { fontSize: 22, fontWeight: '800', marginLeft: 16 },

  msgBox: { padding: 10, borderRadius: Radius.md, marginBottom: Spacing.md },
  msgBoxSuccess: { backgroundColor: '#065f46' },
  msgBoxError: { backgroundColor: '#7f1d1d' },
  msgText: { color: '#ffffff', fontSize: 12, fontWeight: '700', textAlign: 'center' },

  card: {
    backgroundColor: '#1e293b',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: Spacing.md,
  },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardHeaderTitle: { color: '#ffffff', fontSize: 15, fontWeight: '800', marginBottom: 10 },
  changeActionText: { color: '#38bdf8', fontSize: 12, fontWeight: '700' },

  inputGroup: { marginBottom: 10 },
  fieldLabel: { color: '#cbd5e1', fontSize: 11, fontWeight: '600', marginBottom: 4 },
  input: {
    backgroundColor: '#0f172a',
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#ffffff',
    fontSize: 13,
    borderWidth: 1,
    borderColor: '#334155',
  },
  inputDisabled: { opacity: 0.6, color: '#94a3b8' },
  helperText: { color: '#64748b', fontSize: 10, marginTop: 2 },

  roleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 6 },
  roleBadge: { backgroundColor: '#0284c7', color: '#ffffff', fontSize: 10, fontWeight: '800', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },

  saveProfileBtn: { backgroundColor: '#0284c7', paddingVertical: 10, borderRadius: Radius.md, alignItems: 'center', marginTop: 10 },
  saveProfileBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '700' },

  noAddressBox: { padding: 20, alignItems: 'center' },
  noAddressText: { color: '#64748b', fontSize: 12, marginBottom: 8 },
  addFirstAddrBtn: { backgroundColor: '#0284c7', paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.md },
  addFirstAddrBtnText: { color: '#ffffff', fontSize: 12, fontWeight: '700' },

  addressList: { gap: 10 },
  addressItemCard: {
    backgroundColor: '#0f172a',
    borderRadius: Radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  addressItemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  labelRow: { flexDirection: 'row', gap: 6 },
  addressLabelBadge: { backgroundColor: '#0284c7', color: '#ffffff', fontSize: 10, fontWeight: '800', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  defaultBadge: { backgroundColor: '#065f46', color: '#10b981', fontSize: 10, fontWeight: '800', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  itemActions: { flexDirection: 'row', gap: 10 },
  actionLinkBtn: { padding: 2 },
  actionLinkText: { color: '#38bdf8', fontSize: 11, fontWeight: '700' },

  recipientText: { color: '#ffffff', fontSize: 13, fontWeight: '700' },
  fullAddressText: { color: '#cbd5e1', fontSize: 12, lineHeight: 16, marginTop: 2 },
  landmarkText: { color: '#94a3b8', fontSize: 11, marginTop: 2 },
  phoneText: { color: '#94a3b8', fontSize: 11, marginTop: 2 },
  osmCoordsText: { color: '#38bdf8', fontSize: 10, marginTop: 4, fontWeight: '600' },

  quickNavCard: {
    backgroundColor: '#1e293b',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#334155',
  },
  navRowItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  navRowIcon: { fontSize: 24 },
  navRowTitle: { color: '#ffffff', fontSize: 13, fontWeight: '700' },
  navRowDesc: { color: '#64748b', fontSize: 11, marginTop: 2 },
  navRowArrow: { color: '#38bdf8', fontSize: 16, fontWeight: '800' },
  navDivider: { height: 1, backgroundColor: '#334155', marginVertical: 4 },

  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  iconBig: { fontSize: 44, marginBottom: 8 },
  subText: { color: '#94a3b8', fontSize: 12, textAlign: 'center', marginVertical: 8 },
  loginBtn: { backgroundColor: '#0284c7', paddingHorizontal: 16, paddingVertical: 10, borderRadius: Radius.md },
  loginBtnText: { color: '#ffffff', fontSize: 12, fontWeight: '700' },
});
