import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Spacing, Radius } from '../constants/theme';
import { UserAddress } from '../types';

interface OsmAddressPickerProps {
  initialAddress?: Partial<UserAddress>;
  onSaveAddress: (address: Omit<UserAddress, 'id'>) => void;
  onCancel?: () => void;
  submitButtonText?: string;
}

export function OsmAddressPicker({
  initialAddress,
  onSaveAddress,
  onCancel,
  submitButtonText = 'Save Address',
}: OsmAddressPickerProps) {
  const [label, setLabel] = useState<string>(initialAddress?.label || 'Home');
  const [recipientName, setRecipientName] = useState<string>(initialAddress?.recipientName || '');
  const [phone, setPhone] = useState<string>(initialAddress?.phone || '');
  const [street, setStreet] = useState<string>(initialAddress?.street || '');
  const [area, setArea] = useState<string>(initialAddress?.area || '');
  const [city, setCity] = useState<string>(initialAddress?.city || 'Bengaluru');
  const [state, setState] = useState<string>(initialAddress?.state || 'Karnataka');
  const [postalCode, setPostalCode] = useState<string>(initialAddress?.postalCode || '560001');
  const [landmark, setLandmark] = useState<string>(initialAddress?.landmark || '');
  const [isDefault, setIsDefault] = useState<boolean>(initialAddress?.isDefault ?? true);

  // Map coordinates (default to Bengaluru center: 12.9716, 77.5946)
  const [latitude, setLatitude] = useState<number>(initialAddress?.latitude || 12.9716);
  const [longitude, setLongitude] = useState<number>(initialAddress?.longitude || 77.5946);
  const [isGeocoding, setIsGeocoding] = useState<boolean>(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [osmQuery, setOsmQuery] = useState<string>('');

  // Search OpenStreetMap via Nominatim
  const handleOsmSearch = async () => {
    const query = osmQuery.trim() || `${area} ${city} ${postalCode}`.trim();
    if (!query) {
      setGeoError('Please enter a landmark or location query');
      return;
    }

    setIsGeocoding(true);
    setGeoError(null);

    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        query + ', India'
      )}&limit=1`;
      const res = await fetch(url, {
        headers: {
          'Accept-Language': 'en',
          'User-Agent': 'CalinfcoWaterPurifierApp/1.0',
        },
      });

      if (res.ok) {
        const results = await res.json();
        if (results && results.length > 0) {
          const match = results[0];
          const lat = parseFloat(match.lat);
          const lon = parseFloat(match.lon);
          setLatitude(lat);
          setLongitude(lon);

          // Parse display name to augment city/area if empty
          const parts = (match.display_name || '').split(',').map((s: string) => s.trim());
          if (parts.length >= 2 && !area) setArea(parts[0]);
          if (parts.length >= 3 && !city) setCity(parts[1]);
        } else {
          setGeoError('Location not found on OpenStreetMap. You can enter details manually.');
        }
      } else {
        setGeoError('OpenStreetMap service busy. Please enter address manually.');
      }
    } catch (e) {
      setGeoError('OpenStreetMap offline. Using manual entry fallback.');
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleSave = () => {
    if (!street.trim() || !city.trim() || !postalCode.trim()) {
      setGeoError('Please enter Street/Flat, City, and Postal PIN code.');
      return;
    }

    onSaveAddress({
      label,
      recipientName: recipientName.trim(),
      phone: phone.trim(),
      street: street.trim(),
      area: area.trim(),
      city: city.trim(),
      state: state.trim(),
      postalCode: postalCode.trim(),
      landmark: landmark.trim(),
      isDefault,
      latitude,
      longitude,
    });
  };

  // OSM static map tile bounding box for preview
  const osmEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${longitude - 0.008}%2C${latitude - 0.008}%2C${longitude + 0.008}%2C${latitude + 0.008}&layer=mapnik&marker=${latitude}%2C${longitude}`;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.title}>📍 Delivery Address & Pin</Text>
        <Text style={styles.osmAttribution}>Powered by OpenStreetMap</Text>
      </View>

      {/* OpenStreetMap Preview */}
      <View style={styles.mapContainer}>
        {Platform.OS === 'web' ? (
          <iframe
            title="OpenStreetMap Location Preview"
            src={osmEmbedUrl}
            style={{
              width: '100%',
              height: '100%',
              border: 0,
              borderRadius: Radius.md,
            }}
          />
        ) : (
          <View style={styles.nativeMapFallback}>
            <Text style={styles.nativeMapIcon}>🗺️</Text>
            <Text style={styles.nativeMapTitle}>OpenStreetMap Pin Coordinates</Text>
            <Text style={styles.coordsText}>
              Lat: {latitude.toFixed(4)}° N, Lon: {longitude.toFixed(4)}° E
            </Text>
            <Text style={styles.nativeMapHint}>
              Pin will guide Calinfco delivery engineer directly to your door
            </Text>
          </View>
        )}

        <View style={styles.coordsOverlay}>
          <Text style={styles.coordsOverlayText}>
            📌 {latitude.toFixed(4)}°, {longitude.toFixed(4)}°
          </Text>
        </View>
      </View>

      {/* OSM Search Bar */}
      <View style={styles.searchSection}>
        <Text style={styles.fieldLabel}>Locate on OpenStreetMap:</Text>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search locality, landmark, or area (e.g. Indiranagar, Bengaluru)"
            placeholderTextColor="#64748b"
            value={osmQuery}
            onChangeText={setOsmQuery}
          />
          <TouchableOpacity
            style={[styles.searchBtn, isGeocoding && { opacity: 0.7 }]}
            onPress={handleOsmSearch}
            disabled={isGeocoding}>
            {isGeocoding ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.searchBtnText}>Locate</Text>
            )}
          </TouchableOpacity>
        </View>
        {geoError && <Text style={styles.errorText}>⚠️ {geoError}</Text>}
      </View>

      {/* Manual Entry Fallback Form */}
      <View style={styles.formSection}>
        <Text style={styles.sectionHeader}>Address Details (Manual Entry Fallback)</Text>

        {/* Address Label Pills */}
        <View style={styles.labelRow}>
          {['Home', 'Office', 'Other'].map(type => (
            <TouchableOpacity
              key={type}
              style={[styles.typePill, label === type && styles.typePillActive]}
              onPress={() => setLabel(type)}>
              <Text style={[styles.typePillText, label === type && styles.typePillTextActive]}>
                {type === 'Home' ? '🏠 Home' : type === 'Office' ? '🏢 Office' : '📍 Other'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.fieldLabel}>Recipient Name:</Text>
          <TextInput
            style={styles.input}
            placeholder="Full Name (e.g. Priya Sundaram)"
            placeholderTextColor="#64748b"
            value={recipientName}
            onChangeText={setRecipientName}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.fieldLabel}>Contact Phone:</Text>
          <TextInput
            style={styles.input}
            placeholder="10-digit mobile number"
            placeholderTextColor="#64748b"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.fieldLabel}>Flat / House / Building *:</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Flat 402, Lotus Residency"
            placeholderTextColor="#64748b"
            value={street}
            onChangeText={setStreet}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.fieldLabel}>Street / Area / Locality:</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 12th Main, HAL 2nd Stage"
            placeholderTextColor="#64748b"
            value={area}
            onChangeText={setArea}
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.fieldLabel}>City *:</Text>
            <TextInput
              style={styles.input}
              placeholder="City"
              placeholderTextColor="#64748b"
              value={city}
              onChangeText={setCity}
            />
          </View>

          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.fieldLabel}>PIN Code *:</Text>
            <TextInput
              style={styles.input}
              placeholder="6-digit PIN"
              placeholderTextColor="#64748b"
              keyboardType="numeric"
              maxLength={6}
              value={postalCode}
              onChangeText={setPostalCode}
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.fieldLabel}>State:</Text>
            <TextInput
              style={styles.input}
              placeholder="State"
              placeholderTextColor="#64748b"
              value={state}
              onChangeText={setState}
            />
          </View>

          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.fieldLabel}>Landmark:</Text>
            <TextInput
              style={styles.input}
              placeholder="Near Metro / Water Tank"
              placeholderTextColor="#64748b"
              value={landmark}
              onChangeText={setLandmark}
            />
          </View>
        </View>

        {/* Default Address Checkbox */}
        <TouchableOpacity
          style={styles.defaultCheckRow}
          onPress={() => setIsDefault(!isDefault)}>
          <View style={[styles.checkbox, isDefault && styles.checkboxActive]}>
            {isDefault && <Text style={styles.checkTick}>✓</Text>}
          </View>
          <Text style={styles.defaultCheckLabel}>Set as default delivery address</Text>
        </TouchableOpacity>
      </View>

      {/* Actions */}
      <View style={styles.actionsRow}>
        {onCancel && (
          <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>{submitButtonText}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1e293b',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#334155',
    marginVertical: Spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  title: { color: '#ffffff', fontSize: 16, fontWeight: '800' },
  osmAttribution: { color: '#38bdf8', fontSize: 10, fontWeight: '600' },

  mapContainer: {
    height: 160,
    backgroundColor: '#0f172a',
    borderRadius: Radius.md,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: Spacing.md,
  },
  nativeMapFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: '#0f172a',
  },
  nativeMapIcon: { fontSize: 32, marginBottom: 4 },
  nativeMapTitle: { color: '#ffffff', fontSize: 13, fontWeight: '700' },
  coordsText: { color: '#38bdf8', fontSize: 12, fontWeight: '600', marginTop: 2 },
  nativeMapHint: { color: '#64748b', fontSize: 10, textAlign: 'center', marginTop: 4 },

  coordsOverlay: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  coordsOverlayText: { color: '#ffffff', fontSize: 10, fontWeight: '700' },

  searchSection: { marginBottom: Spacing.md },
  searchRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  searchInput: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#ffffff',
    fontSize: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  searchBtn: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 14,
    justifyContent: 'center',
    borderRadius: Radius.md,
  },
  searchBtnText: { color: '#ffffff', fontSize: 12, fontWeight: '700' },
  errorText: { color: '#fbbf24', fontSize: 11, marginTop: 4 },

  formSection: { gap: 10 },
  sectionHeader: { color: '#94a3b8', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },

  labelRow: { flexDirection: 'row', gap: 8, marginVertical: 4 },
  typePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
  },
  typePillActive: { backgroundColor: '#0284c7', borderColor: '#38bdf8' },
  typePillText: { color: '#94a3b8', fontSize: 11, fontWeight: '600' },
  typePillTextActive: { color: '#ffffff' },

  inputGroup: { gap: 4 },
  fieldLabel: { color: '#cbd5e1', fontSize: 11, fontWeight: '600' },
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
  row: { flexDirection: 'row' },

  defaultCheckRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#64748b',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
  checkboxActive: { backgroundColor: '#0284c7', borderColor: '#38bdf8' },
  checkTick: { color: '#ffffff', fontSize: 12, fontWeight: 'bold' },
  defaultCheckLabel: { color: '#cbd5e1', fontSize: 12 },

  actionsRow: { flexDirection: 'row', gap: 10, marginTop: Spacing.md },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#334155',
    paddingVertical: 10,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  cancelBtnText: { color: '#ffffff', fontSize: 12, fontWeight: '700' },
  saveBtn: {
    flex: 2,
    backgroundColor: '#0284c7',
    paddingVertical: 10,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  saveBtnText: { color: '#ffffff', fontSize: 12, fontWeight: '700' },
});
