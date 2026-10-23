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

export default function HomeScreen() {
  const theme = useTheme();
  const [activeFilterTab, setActiveFilterTab] = useState<'all' | 'ro' | 'uv' | 'alkaline'>('all');

  const FEATURED_PURIFIERS = [
    {
      id: 'calinfco-aquashield-pro',
      name: 'AquaShield Pro 10X',
      tagline: '10-Stage RO + UV + UF + Copper Alkaline',
      price: '₹18,999',
      originalPrice: '₹24,999',
      badge: 'Best Seller',
      rating: '4.9 ★ (1,240+)',
      stages: '10 Stages',
      tank: '10L Storage',
      suitableFor: 'TDS up to 2500 ppm',
    },
    {
      id: 'calinfco-hydro-pure-compact',
      name: 'HydroPure Under-Sink',
      tagline: '8-Stage Compact RO + Mineral Enhancer',
      price: '₹15,499',
      originalPrice: '₹19,999',
      badge: 'Modern Kitchen',
      rating: '4.8 ★ (820+)',
      stages: '8 Stages',
      tank: '8L Storage',
      suitableFor: 'Borewell & Municipal',
    },
    {
      id: 'calinfco-eco-mineralizer',
      name: 'EcoMineral RO+UV',
      tagline: 'Smart TDS Controller with Active Carbon',
      price: '₹12,999',
      originalPrice: '₹16,500',
      badge: 'Value Pick',
      rating: '4.7 ★ (650+)',
      stages: '7 Stages',
      tank: '7L Storage',
      suitableFor: 'Municipal Water',
    },
  ];

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}>
          
          {/* Header */}
          <View style={styles.header}>
            <View>
              <ThemedText style={styles.brandTitle}>CALINFCO</ThemedText>
              <ThemedText style={styles.brandSubtitle}>Pure Water Technologies</ThemedText>
            </View>
            <View style={[styles.purityBadge, { backgroundColor: theme.badgeBackground }]}>
              <View style={[styles.statusDot, { backgroundColor: theme.tdsOptimal }]} />
              <Text style={[styles.purityBadgeText, { color: theme.tdsOptimal }]}>
                100% PURE
              </Text>
            </View>
          </View>

          {/* Water Quality & Filter Status Dashboard Card */}
          <View style={[styles.card, styles.purityCard, { borderColor: theme.border }]}>
            <View style={styles.cardHeaderRow}>
              <View>
                <Text style={styles.purityCardOverline}>LIVE PURITY MONITOR</Text>
                <Text style={styles.purityCardTitle}>Home Water Quality Index</Text>
              </View>
              <View style={[styles.statusPill, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                <Text style={[styles.statusPillText, { color: theme.tdsOptimal }]}>PRISTINE</Text>
              </View>
            </View>

            <View style={styles.metricsRow}>
              <View style={styles.metricItem}>
                <Text style={styles.metricValue}>78</Text>
                <Text style={styles.metricUnit}>ppm TDS</Text>
                <Text style={styles.metricLabel}>Safe Drinkable</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricItem}>
                <Text style={styles.metricValue}>7.4</Text>
                <Text style={styles.metricUnit}>pH Level</Text>
                <Text style={styles.metricLabel}>Alkaline Rich</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricItem}>
                <Text style={styles.metricValue}>92%</Text>
                <Text style={styles.metricUnit}>Life Left</Text>
                <Text style={styles.metricLabel}>RO Filter Cartridge</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.actionBannerButton, { backgroundColor: theme.primary }]}
              activeOpacity={0.85}
              onPress={() => router.push('/services')}>
              <Text style={styles.actionBannerButtonText}>Book Free Doorstep Water TDS Test →</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Services Strip */}
          <View style={styles.sectionHeader}>
            <ThemedText type="smallBold" style={styles.sectionTitle}>
              Express Services & Care
            </ThemedText>
          </View>

          <View style={styles.servicesGrid}>
            <Pressable
              style={[styles.serviceCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
              onPress={() => router.push('/services')}>
              <Text style={styles.serviceIcon}>💧</Text>
              <Text style={[styles.serviceTitle, { color: theme.text }]}>Free TDS Test</Text>
              <Text style={[styles.serviceDesc, { color: theme.textSecondary }]}>Doorstep water purity analysis</Text>
            </Pressable>

            <Pressable
              style={[styles.serviceCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
              onPress={() => router.push('/explore')}>
              <Text style={styles.serviceIcon}>🔄</Text>
              <Text style={[styles.serviceTitle, { color: theme.text }]}>Replace Filter</Text>
              <Text style={[styles.serviceDesc, { color: theme.textSecondary }]}>Genuine sediment & carbon kits</Text>
            </Pressable>

            <Pressable
              style={[styles.serviceCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
              onPress={() => router.push('/services')}>
              <Text style={styles.serviceIcon}>🛡️</Text>
              <Text style={[styles.serviceTitle, { color: theme.text }]}>Annual AMC</Text>
              <Text style={[styles.serviceDesc, { color: theme.textSecondary }]}>Free filter changes & warranty</Text>
            </Pressable>

            <Pressable
              style={[styles.serviceCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
              onPress={() => router.push('/services')}>
              <Text style={styles.serviceIcon}>🔧</Text>
              <Text style={[styles.serviceTitle, { color: theme.text }]}>Technician Visit</Text>
              <Text style={[styles.serviceDesc, { color: theme.textSecondary }]}>Same-day repair & installation</Text>
            </Pressable>
          </View>

          {/* Purifiers Catalog Section */}
          <View style={styles.sectionHeaderWithLink}>
            <View>
              <ThemedText type="smallBold" style={styles.sectionTitle}>
                Featured Water Purifiers
              </ThemedText>
              <ThemedText style={{ color: theme.textSecondary, fontSize: 13 }}>
                Multi-stage purification tailored for Indian water conditions
              </ThemedText>
            </View>
            <TouchableOpacity onPress={() => router.push('/explore')}>
              <Text style={[styles.viewAllText, { color: theme.primary }]}>View All →</Text>
            </TouchableOpacity>
          </View>

          {/* Product Cards */}
          {FEATURED_PURIFIERS.map((item) => (
            <View
              key={item.id}
              style={[
                styles.card,
                styles.productCard,
                { backgroundColor: theme.backgroundElement, borderColor: theme.border },
              ]}>
              <View style={styles.productBadgeRow}>
                <View style={[styles.productBadge, { backgroundColor: theme.primaryMuted }]}>
                  <Text style={[styles.productBadgeText, { color: theme.primary }]}>{item.badge}</Text>
                </View>
                <Text style={[styles.productRating, { color: theme.textSecondary }]}>{item.rating}</Text>
              </View>

              <Text style={[styles.productName, { color: theme.text }]}>{item.name}</Text>
              <Text style={[styles.productTagline, { color: theme.textSecondary }]}>{item.tagline}</Text>

              <View style={styles.specsRow}>
                <View style={[styles.specTag, { backgroundColor: theme.background }]}>
                  <Text style={[styles.specTagText, { color: theme.textSecondary }]}>⚙️ {item.stages}</Text>
                </View>
                <View style={[styles.specTag, { backgroundColor: theme.background }]}>
                  <Text style={[styles.specTagText, { color: theme.textSecondary }]}>🚰 {item.tank}</Text>
                </View>
                <View style={[styles.specTag, { backgroundColor: theme.background }]}>
                  <Text style={[styles.specTagText, { color: theme.textSecondary }]}>⚡ {item.suitableFor}</Text>
                </View>
              </View>

              <View style={styles.productFooter}>
                <View>
                  <Text style={[styles.productPrice, { color: theme.primaryDark }]}>{item.price}</Text>
                  <Text style={[styles.productOriginalPrice, { color: theme.textMuted }]}>{item.originalPrice}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.orderButton, { backgroundColor: theme.primary }]}
                  activeOpacity={0.8}
                  onPress={() => router.push('/explore')}>
                  <Text style={styles.orderButtonText}>View Specs & Buy</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {/* Guarantee Footer Strip */}
          <View style={[styles.trustStrip, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <Text style={styles.trustItem}>✓ Free Installation</Text>
            <Text style={styles.trustItem}>✓ 1-Year Comprehensive Warranty</Text>
            <Text style={styles.trustItem}>✓ 100% Food-Grade RO Tank</Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: '#0077B6',
  },
  brandSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  purityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.full,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  purityBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  purityCard: {
    backgroundColor: '#0A2540',
    borderColor: '#1E3A5F',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  purityCardOverline: {
    fontSize: 11,
    fontWeight: '700',
    color: '#38BDF8',
    letterSpacing: 1,
    marginBottom: 2,
  },
  purityCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  metricUnit: {
    fontSize: 11,
    color: '#38BDF8',
    fontWeight: '600',
    marginTop: 2,
  },
  metricLabel: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  actionBannerButton: {
    borderRadius: Radius.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  actionBannerButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  sectionHeader: {
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  sectionHeaderWithLink: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '700',
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  serviceCard: {
    width: '48%',
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.md,
  },
  serviceIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  serviceTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  serviceDesc: {
    fontSize: 11,
    lineHeight: 15,
  },
  productCard: {
    marginBottom: Spacing.md,
  },
  productBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  productBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  productBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  productRating: {
    fontSize: 12,
    fontWeight: '600',
  },
  productName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  productTagline: {
    fontSize: 13,
    marginBottom: 12,
  },
  specsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  specTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  specTagText: {
    fontSize: 11,
    fontWeight: '500',
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 12,
  },
  productPrice: {
    fontSize: 20,
    fontWeight: '800',
  },
  productOriginalPrice: {
    fontSize: 12,
    textDecorationLine: 'line-through',
  },
  orderButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radius.md,
  },
  orderButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  trustStrip: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.sm,
    marginTop: Spacing.sm,
  },
  trustItem: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
});
