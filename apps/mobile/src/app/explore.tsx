import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, getDocs, query, where } from 'firebase/firestore';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing, Radius } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { db, isDemoMode } from '@/lib/firebase';
import { SEED_PRODUCTS, PRODUCT_CATEGORIES } from '@/constants/seed-data';
import { Product, ProductCategory } from '@/types';

export default function ExploreScreen() {
  const { user, isDealer } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>(SEED_PRODUCTS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchProducts() {
      if (isDemoMode || !db) {
        setProducts(SEED_PRODUCTS);
        return;
      }

      setLoading(true);
      try {
        const prodRef = collection(db, 'products');
        const q = query(prodRef, where('isActive', '==', true));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const fetched: Product[] = [];
          snap.forEach(docSnap => fetched.push({ id: docSnap.id, ...docSnap.data() } as Product));
          setProducts(fetched);
        } else {
          setProducts(SEED_PRODUCTS);
        }
      } catch (err) {
        console.warn('Using seed products fallback due to firestore error:', err);
        setProducts(SEED_PRODUCTS);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'all' || p.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch = searchQuery === '' || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}>
          
          {/* Header */}
          <View style={styles.header}>
            <ThemedText type="subtitle" themeColor="primary" style={styles.badgeText}>
              💧 COMPLETE HARDWARE & SPARES CATALOG
            </ThemedText>
            <ThemedText type="title" style={styles.title}>
              Pure Water Products
            </ThemedText>
            <Text style={styles.subtitle}>
              65+ verified products with direct manufacturer warranty
            </Text>
          </View>

          {/* Pricing Status Notice */}
          <View style={[styles.pricingNotice, isDealer ? styles.dealerNotice : styles.retailNotice]}>
            <View style={styles.noticeHeader}>
              <Text style={styles.noticeIcon}>{isDealer ? '🌟' : '🏷️'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.noticeTitle}>
                  {isDealer ? 'Wholesale Dealer Pricing Active' : 'Retail Customer Pricing'}
                </Text>
                <Text style={styles.noticeSubtitle}>
                  {isDealer 
                    ? `Account: ${user?.dealerDetails?.businessName || user?.name} • Tier: Verified Authorized Dealer`
                    : 'Wholesale prices are available for verified dealers. Apply in your Account tab.'}
                </Text>
              </View>
            </View>
          </View>

          {/* Search Box */}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search by product name, SKU (e.g. CAL-WP-001) or tech..."
              placeholderTextColor="#64748b"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Category Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}>
            {PRODUCT_CATEGORIES.map(cat => {
              const isSelected = selectedCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoryPill, isSelected && styles.categoryPillActive]}
                  onPress={() => setSelectedCategory(cat)}>
                  <Text style={[styles.categoryText, isSelected && styles.categoryTextActive]}>
                    {cat.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Results Count */}
          <View style={styles.countRow}>
            <Text style={styles.countText}>
              Showing <Text style={{ color: '#38bdf8', fontWeight: '700' }}>{filteredProducts.length}</Text> products
            </Text>
          </View>

          {/* Products Grid / List */}
          <View style={styles.productList}>
            {filteredProducts.map(product => {
              const activePrice = isDealer ? product.dealerPrice : product.retailPrice;
              const savings = product.mrp - activePrice;
              const savingsPercent = Math.round((savings / product.mrp) * 100);

              return (
                <View key={product.id} style={styles.productCard}>
                  {/* Image */}
                  <Image
                    source={{ uri: product.imageUrl }}
                    style={styles.productImage}
                    resizeMode="cover"
                  />

                  {/* Body */}
                  <View style={styles.cardBody}>
                    <View style={styles.cardTopRow}>
                      <Text style={styles.skuBadge}>{product.sku}</Text>
                      <Text style={styles.catBadge}>{product.category.toUpperCase()}</Text>
                    </View>

                    <Text style={styles.productName} numberOfLines={2}>
                      {product.name}
                    </Text>

                    <Text style={styles.productDesc} numberOfLines={2}>
                      {product.description}
                    </Text>

                    {/* Stock & Rating */}
                    <View style={styles.metaRow}>
                      <Text style={styles.ratingText}>★ {product.ratingAverage} ({product.ratingCount})</Text>
                      <Text style={styles.stockText}>
                        {product.stock > 10 ? `In Stock (${product.stock})` : `Low Stock: ${product.stock} left`}
                      </Text>
                    </View>

                    {/* Price Block */}
                    <View style={styles.priceRow}>
                      <View>
                        <Text style={styles.priceLabel}>
                          {isDealer ? 'Wholesale Dealer Price' : 'Special Retail Price'}
                        </Text>
                        <View style={styles.priceGroup}>
                          <Text style={styles.mainPrice}>₹{activePrice.toLocaleString('en-IN')}</Text>
                          <Text style={styles.mrpStrike}>₹{product.mrp.toLocaleString('en-IN')}</Text>
                        </View>
                      </View>

                      <View style={[styles.savingsBadge, isDealer && styles.dealerSavings]}>
                        <Text style={styles.savingsText}>SAVE {savingsPercent}%</Text>
                      </View>
                    </View>

                    {/* Dealer comparison info for normal customer */}
                    {!isDealer && (
                      <View style={styles.dealerHint}>
                        <Text style={styles.dealerHintText}>
                          Dealer Wholesale: ₹{product.dealerPrice.toLocaleString('en-IN')} (Authorized partners only)
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
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
  header: { marginBottom: Spacing.md },
  badgeText: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2, marginBottom: 4 },
  title: { fontSize: 24, fontWeight: '800' },
  subtitle: { fontSize: 13, color: '#94a3b8', marginTop: 4 },

  pricingNotice: {
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
  },
  retailNotice: { backgroundColor: '#1e293b', borderColor: '#334155' },
  dealerNotice: { backgroundColor: '#082f49', borderColor: '#0284c7' },
  noticeHeader: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  noticeIcon: { fontSize: 22 },
  noticeTitle: { color: '#ffffff', fontSize: 13, fontWeight: '700' },
  noticeSubtitle: { color: '#94a3b8', fontSize: 11, marginTop: 2 },

  searchContainer: { marginBottom: Spacing.md },
  searchInput: {
    backgroundColor: '#1e293b',
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#ffffff',
    fontSize: 13,
    borderWidth: 1,
    borderColor: '#334155',
  },

  categoryScroll: { gap: 8, paddingBottom: 6 },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  categoryPillActive: { backgroundColor: '#0284c7', borderColor: '#38bdf8' },
  categoryText: { color: '#94a3b8', fontSize: 11, fontWeight: '700' },
  categoryTextActive: { color: '#ffffff' },

  countRow: { marginVertical: Spacing.sm },
  countText: { color: '#64748b', fontSize: 12 },

  productList: { gap: Spacing.md },
  productCard: {
    backgroundColor: '#1e293b',
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
  },
  productImage: { width: '100%', height: 160 },
  cardBody: { padding: Spacing.md },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  skuBadge: { color: '#38bdf8', fontSize: 11, fontWeight: '800', letterSpacing: 0.8 },
  catBadge: { color: '#94a3b8', fontSize: 10, fontWeight: '700' },
  productName: { color: '#ffffff', fontSize: 16, fontWeight: '700', marginBottom: 4 },
  productDesc: { color: '#94a3b8', fontSize: 12, lineHeight: 17, marginBottom: 8 },

  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  ratingText: { color: '#fbbf24', fontSize: 11, fontWeight: '600' },
  stockText: { color: '#10b981', fontSize: 11, fontWeight: '600' },

  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: 8, borderTopWidth: 1, borderTopColor: '#334155' },
  priceLabel: { color: '#94a3b8', fontSize: 10, textTransform: 'uppercase', marginBottom: 2 },
  priceGroup: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  mainPrice: { color: '#38bdf8', fontSize: 18, fontWeight: '800' },
  mrpStrike: { color: '#64748b', fontSize: 12, textDecorationLine: 'line-through' },
  savingsBadge: { backgroundColor: '#065f46', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  dealerSavings: { backgroundColor: '#075985' },
  savingsText: { color: '#ffffff', fontSize: 10, fontWeight: '800' },

  dealerHint: {
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(51, 65, 85, 0.4)',
  },
  dealerHintText: { color: '#64748b', fontSize: 10, fontStyle: 'italic' },
});
