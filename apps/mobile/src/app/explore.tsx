import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing, Radius, BottomTabInset, MaxContentWidth } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function ExploreScreen() {
  const theme = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'purifiers' | 'filters' | 'amc'>('all');

  const CATALOG_ITEMS = [
    {
      id: 'purifier-1',
      category: 'purifiers',
      title: 'AquaShield Pro 10X RO+UV+UF+Alkaline',
      specs: '10-Stage | Copper+Zinc Mineral | 10L Tank',
      price: '₹18,999',
      tag: 'Best Seller',
    },
    {
      id: 'purifier-2',
      category: 'purifiers',
      title: 'HydroPure Under-Sink RO System',
      specs: '8-Stage Compact | Kitchen Countertop / Under-sink',
      price: '₹15,499',
      tag: 'Under-Sink',
    },
    {
      id: 'purifier-3',
      category: 'purifiers',
      title: 'EcoMineral RO+UV Smart Controller',
      specs: '7-Stage | Ideal for Municipal water < 1000 ppm',
      price: '₹12,999',
      tag: 'Popular',
    },
    {
      id: 'filter-1',
      category: 'filters',
      title: 'Calinfco Annual Filter Replacement Pack',
      specs: 'Includes Spun Sediment, Carbon Block, Post Carbon + RO Membrane',
      price: '₹2,499',
      tag: 'Service Kit',
    },
    {
      id: 'filter-2',
      category: 'filters',
      title: 'Alkaline Mineral Cartridge & Copper Infuser',
      specs: 'Enriches water with essential Calcium, Magnesium & pH balance',
      price: '₹1,199',
      tag: 'Upgrade',
    },
    {
      id: 'amc-1',
      category: 'amc',
      title: 'Comprehensive Peace-of-Mind AMC (1 Year)',
      specs: '2 Free Filter Replacements + 3 Preventive Maintenance Visits + Breakdown support',
      price: '₹3,999 / yr',
      tag: 'Full Protection',
    },
  ];

  const filteredItems = selectedCategory === 'all'
    ? CATALOG_ITEMS
    : CATALOG_ITEMS.filter(item => item.category === selectedCategory);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}>
          
          <View style={styles.header}>
            <ThemedText style={styles.title}>Purifier & Filter Store</ThemedText>
            <ThemedText style={{ color: theme.textSecondary, fontSize: 13, marginTop: 4 }}>
              Certified RO systems, genuine replacement cartridges and AMC plans
            </ThemedText>
          </View>

          {/* Category Filter Chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            {[
              { id: 'all', label: 'All Products' },
              { id: 'purifiers', label: '🚰 Water Purifiers' },
              { id: 'filters', label: '🔄 Replacement Filters' },
              { id: 'amc', label: '🛡️ AMC Subscriptions' },
            ].map(cat => (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setSelectedCategory(cat.id as any)}
                style={[
                  styles.chip,
                  selectedCategory === cat.id
                    ? { backgroundColor: theme.primary, borderColor: theme.primary }
                    : { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                ]}>
                <Text
                  style={[
                    styles.chipText,
                    { color: selectedCategory === cat.id ? '#FFFFFF' : theme.text },
                  ]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Product Items */}
          <View style={styles.list}>
            {filteredItems.map(item => (
              <View
                key={item.id}
                style={[
                  styles.card,
                  { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                ]}>
                <View style={styles.cardHeader}>
                  <View style={[styles.badge, { backgroundColor: theme.primaryMuted }]}>
                    <Text style={[styles.badgeText, { color: theme.primary }]}>{item.tag}</Text>
                  </View>
                  <Text style={[styles.price, { color: theme.primaryDark }]}>{item.price}</Text>
                </View>

                <Text style={[styles.itemTitle, { color: theme.text }]}>{item.title}</Text>
                <Text style={[styles.itemSpecs, { color: theme.textSecondary }]}>{item.specs}</Text>

                <View style={styles.cardActionRow}>
                  <TouchableOpacity
                    style={[styles.buyBtn, { backgroundColor: theme.primary }]}
                    onPress={() => router.push('/services')}>
                    <Text style={styles.buyBtnText}>
                      {item.category === 'amc' ? 'Subscribe Plan' : 'Order with Free Installation'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
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
  chipScroll: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
    marginRight: 8,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  list: {
    gap: Spacing.md,
  },
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  price: {
    fontSize: 18,
    fontWeight: '800',
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  itemSpecs: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
  cardActionRow: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 10,
  },
  buyBtn: {
    borderRadius: Radius.md,
    paddingVertical: 10,
    alignItems: 'center',
  },
  buyBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
