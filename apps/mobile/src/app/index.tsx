import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing, Radius } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useCart } from '@/context/cart-context';
import { SEED_PRODUCTS, PRODUCT_CATEGORIES } from '@/constants/seed-data';

export default function HomeScreen() {
  const { user, isDealer } = useAuth();
  const { itemCount, wishlist, addToCart } = useCart();
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Pick top featured items
  const featuredPurifiers = SEED_PRODUCTS.filter(p => p.category === 'water purifiers').slice(0, 4);
  const featuredSpares = SEED_PRODUCTS.filter(p => p.category === 'filters' || p.category === 'spare parts').slice(0, 4);

  const handleQuickAdd = (product: any) => {
    const res = addToCart(product, 1);
    setToastMsg(res.message);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const CATEGORY_CARDS = [
    { id: 'water purifiers', title: 'Water Purifiers', icon: '🚰', desc: 'RO+UV+UF & Alkaline' },
    { id: 'dispensers', title: 'Dispensers', icon: '🧊', desc: 'Hot, Cold & Touchless' },
    { id: 'pumps', title: 'Booster Pumps', icon: '⚡', desc: '24V/36V High PSI Pumps' },
    { id: 'filters', title: 'Filter Cartridges', icon: '🔬', desc: 'Membranes & Mineralizers' },
    { id: 'spare parts', title: 'Spare Parts', icon: '🔧', desc: 'Valves, Faucets & Meters' },
  ];

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}>
          
          {/* Header Bar */}
          <View style={styles.header}>
            <View>
              <ThemedText type="subtitle" themeColor="primary" style={styles.badgeText}>
                💧 CALINFCO PURE WATER
              </ThemedText>
              <ThemedText type="title" style={styles.title}>
                {user ? `Hello, ${user.name.split(' ')[0]}` : 'Pure Living Starts Here'}
              </ThemedText>
            </View>

            {/* Quick Header Actions */}
            <View style={styles.headerIcons}>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => router.push('/wishlist' as any)}>
                <Text style={styles.iconEmoji}>💖</Text>
                {wishlist.length > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeCount}>{wishlist.length}</Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => router.push('/cart' as any)}>
                <Text style={styles.iconEmoji}>🛒</Text>
                {itemCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeCount}>{itemCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Toast Message */}
          {toastMsg && (
            <View style={styles.toastBox}>
              <Text style={styles.toastText}>✓ {toastMsg}</Text>
            </View>
          )}

          {/* Hero Banner */}
          <View style={styles.heroBanner}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>AQUASHIELD 10X SERIES</Text>
            </View>
            <ThemedText type="title" style={styles.heroTitle}>
              Pristine 10-Stage Water Purification
            </ThemedText>
            <Text style={styles.heroDesc}>
              Borewell and tanker water purified with Active Copper Infusion, Bio-Alkaline mineralizer, and real-time TDS optimization.
            </Text>
            <View style={styles.heroActionRow}>
              <TouchableOpacity
                style={styles.heroPrimaryBtn}
                onPress={() => router.push('/explore' as any)}>
                <Text style={styles.heroPrimaryBtnText}>Explore Catalog →</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.heroSecondaryBtn}
                onPress={() => router.push('/services' as any)}>
                <Text style={styles.heroSecondaryBtnText}>Book Water Test 🧪</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Category Navigation Grid */}
          <View style={styles.sectionHeader}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Browse by Category
            </ThemedText>
            <TouchableOpacity onPress={() => router.push('/explore' as any)}>
              <Text style={styles.seeAllText}>View All 65+ →</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}>
            {CATEGORY_CARDS.map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={styles.categoryCard}
                onPress={() => router.push({ pathname: '/explore', params: { category: cat.id } } as any)}>
                <Text style={styles.categoryIcon}>{cat.icon}</Text>
                <Text style={styles.categoryTitle}>{cat.title}</Text>
                <Text style={styles.categorySub}>{cat.desc}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Live TDS Water Quality Checker Widget */}
          <View style={styles.tdsWidget}>
            <View style={styles.tdsHeader}>
              <Text style={styles.tdsTitle}>💧 Pure Water Quality Meter</Text>
              <View style={styles.tdsStatusPill}>
                <Text style={styles.tdsStatusText}>Pristine (92 PPM)</Text>
              </View>
            </View>
            <Text style={styles.tdsBody}>
              Ideal drinking water TDS is between 50 to 150 ppm. Need your water tested at home? Our technicians carry digital titanium probes.
            </Text>
            <TouchableOpacity
              style={styles.tdsCta}
              onPress={() => router.push('/services' as any)}>
              <Text style={styles.tdsCtaText}>Schedule Free Doorstep Water Inspection →</Text>
            </TouchableOpacity>
          </View>

          {/* Featured Purifiers Grid */}
          <View style={styles.sectionHeader}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Featured Water Purifiers
            </ThemedText>
            <TouchableOpacity onPress={() => router.push('/explore' as any)}>
              <Text style={styles.seeAllText}>More →</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.grid}>
            {featuredPurifiers.map(p => {
              const activePrice = isDealer ? p.dealerPrice : p.retailPrice;

              return (
                <TouchableOpacity
                  key={p.id}
                  style={styles.card}
                  activeOpacity={0.88}
                  onPress={() => router.push(`/product/${p.id}` as any)}>
                  <Image source={{ uri: p.imageUrl }} style={styles.cardImage} resizeMode="cover" />
                  <View style={styles.cardContent}>
                    <Text style={styles.cardSku}>{p.sku}</Text>
                    <Text style={styles.cardTitle} numberOfLines={2}>{p.name}</Text>
                    <Text style={styles.cardRating}>★ {p.ratingAverage} ({p.ratingCount})</Text>

                    <View style={styles.cardPriceRow}>
                      <View>
                        <Text style={styles.cardPrice}>₹{activePrice.toLocaleString('en-IN')}</Text>
                        <Text style={styles.cardMrp}>₹{p.mrp.toLocaleString('en-IN')}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.quickAddBtn}
                        onPress={() => handleQuickAdd(p)}>
                        <Text style={styles.quickAddBtnText}>+ Add</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Genuine Replacement Filters & Spares */}
          <View style={styles.sectionHeader}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Replacement Filters & Spare Parts
            </ThemedText>
            <TouchableOpacity onPress={() => router.push({ pathname: '/explore', params: { category: 'filters' } } as any)}>
              <Text style={styles.seeAllText}>All Spares →</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.sparesList}>
            {featuredSpares.map(p => (
              <TouchableOpacity
                key={p.id}
                style={styles.spareItem}
                onPress={() => router.push(`/product/${p.id}` as any)}>
                <Image source={{ uri: p.imageUrl }} style={styles.spareImg} resizeMode="cover" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.spareSku}>{p.sku} • {p.category.toUpperCase()}</Text>
                  <Text style={styles.spareName} numberOfLines={1}>{p.name}</Text>
                  <Text style={styles.sparePrice}>₹{p.retailPrice.toLocaleString('en-IN')}</Text>
                </View>
                <TouchableOpacity
                  style={styles.quickAddSpare}
                  onPress={() => handleQuickAdd(p)}>
                  <Text style={styles.quickAddSpareText}>🛒</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>

        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: { padding: Spacing.lg, paddingBottom: 110 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  badgeText: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2, marginBottom: 2 },
  title: { fontSize: 22, fontWeight: '800' },
  headerIcons: { flexDirection: 'row', gap: 10 },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: Radius.md,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  iconEmoji: { fontSize: 18 },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#0284c7',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeCount: { color: '#ffffff', fontSize: 10, fontWeight: 'bold' },

  toastBox: { backgroundColor: '#065f46', borderRadius: Radius.md, padding: Spacing.sm, marginBottom: Spacing.md, alignItems: 'center' },
  toastText: { color: '#ffffff', fontSize: 12, fontWeight: '700' },

  heroBanner: {
    backgroundColor: '#082f49',
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#0284c7',
    marginBottom: Spacing.lg,
  },
  heroBadge: { backgroundColor: 'rgba(2, 132, 199, 0.3)', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginBottom: 8 },
  heroBadgeText: { color: '#38bdf8', fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  heroTitle: { fontSize: 20, fontWeight: '900', color: '#ffffff', marginBottom: 6 },
  heroDesc: { color: '#94a3b8', fontSize: 12, lineHeight: 18, marginBottom: Spacing.md },
  heroActionRow: { flexDirection: 'row', gap: 10 },
  heroPrimaryBtn: { backgroundColor: '#0284c7', paddingVertical: 10, paddingHorizontal: 16, borderRadius: Radius.md },
  heroPrimaryBtnText: { color: '#ffffff', fontSize: 12, fontWeight: '700' },
  heroSecondaryBtn: { backgroundColor: '#1e293b', paddingVertical: 10, paddingHorizontal: 14, borderRadius: Radius.md, borderWidth: 1, borderColor: '#334155' },
  heroSecondaryBtnText: { color: '#38bdf8', fontSize: 12, fontWeight: '700' },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.md, marginBottom: Spacing.sm },
  sectionTitle: { fontSize: 16, fontWeight: '800' },
  seeAllText: { color: '#38bdf8', fontSize: 12, fontWeight: '700' },

  categoryScroll: { gap: 10, paddingBottom: 6 },
  categoryCard: {
    width: 140,
    backgroundColor: '#1e293b',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  categoryIcon: { fontSize: 32, marginBottom: 6 },
  categoryTitle: { color: '#ffffff', fontSize: 13, fontWeight: '700', textAlign: 'center' },
  categorySub: { color: '#94a3b8', fontSize: 10, textAlign: 'center', marginTop: 2 },

  tdsWidget: {
    backgroundColor: '#1e293b',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#10b981',
    marginVertical: Spacing.lg,
  },
  tdsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  tdsTitle: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
  tdsStatusPill: { backgroundColor: 'rgba(16, 185, 129, 0.2)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  tdsStatusText: { color: '#10b981', fontSize: 11, fontWeight: '700' },
  tdsBody: { color: '#94a3b8', fontSize: 12, lineHeight: 17, marginBottom: 8 },
  tdsCta: { backgroundColor: '#0f172a', padding: 8, borderRadius: Radius.sm, alignItems: 'center' },
  tdsCtaText: { color: '#38bdf8', fontSize: 11, fontWeight: '700' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: {
    width: '48%',
    backgroundColor: '#1e293b',
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardImage: { width: '100%', height: 120, backgroundColor: '#0f172a' },
  cardContent: { padding: Spacing.sm },
  cardSku: { color: '#38bdf8', fontSize: 10, fontWeight: '800' },
  cardTitle: { color: '#ffffff', fontSize: 13, fontWeight: '700', marginVertical: 2 },
  cardRating: { color: '#fbbf24', fontSize: 11, fontWeight: '600' },
  cardPriceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 8 },
  cardPrice: { color: '#38bdf8', fontSize: 14, fontWeight: '800' },
  cardMrp: { color: '#64748b', fontSize: 10, textDecorationLine: 'line-through' },
  quickAddBtn: { backgroundColor: '#0284c7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.sm },
  quickAddBtnText: { color: '#ffffff', fontSize: 11, fontWeight: '700' },

  sparesList: { gap: 8 },
  spareItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: Radius.md,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 10,
  },
  spareImg: { width: 55, height: 55, borderRadius: Radius.sm, backgroundColor: '#0f172a' },
  spareSku: { color: '#38bdf8', fontSize: 9, fontWeight: '800' },
  spareName: { color: '#ffffff', fontSize: 13, fontWeight: '700' },
  sparePrice: { color: '#38bdf8', fontSize: 12, fontWeight: '800' },
  quickAddSpare: { padding: 8, backgroundColor: '#0284c7', borderRadius: Radius.sm },
  quickAddSpareText: { fontSize: 14 },
});
