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
import { router, useLocalSearchParams } from 'expo-router';
import { collection, getDocs, query, where } from 'firebase/firestore';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing, Radius } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useCart } from '@/context/cart-context';
import { db, isDemoMode } from '@/lib/firebase';
import { SEED_PRODUCTS, PRODUCT_CATEGORIES } from '@/constants/seed-data';
import { Product } from '@/types';

type SortOption = 'featured' | 'priceAsc' | 'priceDesc' | 'rating';

export default function ExploreScreen() {
  const { user, isDealer } = useAuth();
  const { addToCart, toggleWishlist, isInWishlist } = useCart();
  const params = useLocalSearchParams<{ category?: string }>();

  const [selectedCategory, setSelectedCategory] = useState<string>(params.category || 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [products, setProducts] = useState<Product[]>(SEED_PRODUCTS);
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    if (params.category) {
      setSelectedCategory(params.category);
    }
  }, [params.category]);

  useEffect(() => {
    async function fetchProducts() {
      if (isDemoMode || !db) {
        setProducts(SEED_PRODUCTS);
        return;
      }

      setLoading(true);
      try {
        const prodRef = collection(db as any, 'products');
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

  const handleQuickAdd = (product: Product, e: any) => {
    e.stopPropagation?.();
    const res = addToCart(product, 1);
    setToastMsg(res.message);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const handleToggleWishlist = (product: Product, e: any) => {
    e.stopPropagation?.();
    toggleWishlist(product);
  };

  // Filter and Sort Pipeline
  let filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'all' || p.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch = searchQuery === '' || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStock = inStockOnly ? p.stock > 0 : true;
    return matchesCategory && matchesSearch && matchesStock;
  });

  // Sorting
  filteredProducts.sort((a, b) => {
    const priceA = isDealer ? a.dealerPrice : a.retailPrice;
    const priceB = isDealer ? b.dealerPrice : b.retailPrice;

    if (sortBy === 'priceAsc') return priceA - priceB;
    if (sortBy === 'priceDesc') return priceB - priceA;
    if (sortBy === 'rating') return b.ratingAverage - a.ratingAverage;
    return 0; // featured default
  });

  const resetFilters = () => {
    setSelectedCategory('all');
    setSearchQuery('');
    setSortBy('featured');
    setInStockOnly(false);
  };

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

          {/* Quick Toast */}
          {toastMsg && (
            <View style={styles.toastBox}>
              <Text style={styles.toastText}>✓ {toastMsg}</Text>
            </View>
          )}

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

          {/* Sort & Filter Bar */}
          <View style={styles.filterSortRow}>
            <View style={styles.sortPills}>
              <Text style={styles.sortLabel}>Sort:</Text>
              <TouchableOpacity
                style={[styles.sortPill, sortBy === 'featured' && styles.sortPillActive]}
                onPress={() => setSortBy('featured')}>
                <Text style={[styles.sortPillText, sortBy === 'featured' && styles.sortPillTextActive]}>Featured</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.sortPill, sortBy === 'priceAsc' && styles.sortPillActive]}
                onPress={() => setSortBy('priceAsc')}>
                <Text style={[styles.sortPillText, sortBy === 'priceAsc' && styles.sortPillTextActive]}>Price: Low</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.sortPill, sortBy === 'priceDesc' && styles.sortPillActive]}
                onPress={() => setSortBy('priceDesc')}>
                <Text style={[styles.sortPillText, sortBy === 'priceDesc' && styles.sortPillTextActive]}>Price: High</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.sortPill, sortBy === 'rating' && styles.sortPillActive]}
                onPress={() => setSortBy('rating')}>
                <Text style={[styles.sortPillText, sortBy === 'rating' && styles.sortPillTextActive]}>★ Rating</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.stockToggle, inStockOnly && styles.stockToggleActive]}
              onPress={() => setInStockOnly(!inStockOnly)}>
              <Text style={[styles.stockToggleText, inStockOnly && styles.stockToggleTextActive]}>
                {inStockOnly ? '✓ In Stock' : 'In Stock Only'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Results Count */}
          <View style={styles.countRow}>
            <Text style={styles.countText}>
              Showing <Text style={{ color: '#38bdf8', fontWeight: '700' }}>{filteredProducts.length}</Text> products
            </Text>
          </View>

          {/* Loading State */}
          {loading && (
            <View style={styles.loadingBox}>
              <Text style={styles.loadingIcon}>💧</Text>
              <Text style={styles.loadingText}>Fetching products from Firestore...</Text>
            </View>
          )}

          {/* Empty State */}
          {!loading && filteredProducts.length === 0 && (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <ThemedText type="subtitle" style={styles.emptyTitle}>
                No products match your search or filters
              </ThemedText>
              <Text style={styles.emptyDesc}>
                Try adjusting your search terms or clearing selected category filters.
              </Text>
              <TouchableOpacity style={styles.resetBtn} onPress={resetFilters}>
                <Text style={styles.resetBtnText}>Reset All Filters</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Products Grid / List */}
          {!loading && (
            <View style={styles.productList}>
              {filteredProducts.map(product => {
                const activePrice = isDealer ? product.dealerPrice : product.retailPrice;
                const savings = product.mrp - activePrice;
                const savingsPercent = Math.round((savings / product.mrp) * 100);
                const isFavorited = isInWishlist(product.id);
                const inStock = product.stock > 0;

                return (
                  <TouchableOpacity
                    key={product.id}
                    style={styles.productCard}
                    activeOpacity={0.85}
                    onPress={() => router.push(`/product/${product.id}` as any)}>
                    {/* Image */}
                    <View style={styles.imageWrap}>
                      <Image
                        source={{ uri: product.imageUrl }}
                        style={styles.productImage}
                        resizeMode="cover"
                      />

                      <TouchableOpacity
                        style={[styles.wishlistBtn, isFavorited && styles.wishlistBtnActive]}
                        onPress={(e) => handleToggleWishlist(product, e)}>
                        <Text style={styles.wishlistBtnIcon}>{isFavorited ? '❤️' : '🤍'}</Text>
                      </TouchableOpacity>
                    </View>

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
                        <Text style={[styles.stockText, !inStock && { color: '#ef4444' }]}>
                          {inStock ? (product.stock > 10 ? `In Stock (${product.stock})` : `Low Stock: ${product.stock}`) : 'Out of Stock'}
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

                      {/* Card Action Row */}
                      <View style={styles.cardFooter}>
                        <TouchableOpacity
                          style={[styles.cardAddToCartBtn, !inStock && styles.btnDisabled]}
                          disabled={!inStock}
                          onPress={(e) => handleQuickAdd(product, e)}>
                          <Text style={styles.cardAddToCartBtnText}>
                            {inStock ? 'Add to Cart 🛒' : 'Out of Stock'}
                          </Text>
                        </TouchableOpacity>

                        <Text style={styles.viewDetailHint}>View Details →</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
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
  scrollContent: { padding: Spacing.lg, paddingBottom: 110 },
  header: { marginBottom: Spacing.md },
  badgeText: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2, marginBottom: 4 },
  title: { fontSize: 24, fontWeight: '800' },
  subtitle: { fontSize: 13, color: '#94a3b8', marginTop: 4 },

  toastBox: {
    backgroundColor: '#065f46',
    borderRadius: Radius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
    alignItems: 'center',
  },
  toastText: { color: '#ffffff', fontSize: 12, fontWeight: '700' },

  searchContainer: { marginBottom: Spacing.sm },
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

  filterSortRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: Spacing.sm,
    flexWrap: 'wrap',
    gap: 8,
  },
  sortPills: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  sortLabel: { color: '#64748b', fontSize: 11, fontWeight: '600' },
  sortPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.sm, backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#334155' },
  sortPillActive: { backgroundColor: '#0284c7', borderColor: '#38bdf8' },
  sortPillText: { color: '#94a3b8', fontSize: 11, fontWeight: '600' },
  sortPillTextActive: { color: '#ffffff' },

  stockToggle: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.sm, backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#334155' },
  stockToggleActive: { backgroundColor: 'rgba(16, 185, 129, 0.2)', borderColor: '#10b981' },
  stockToggleText: { color: '#94a3b8', fontSize: 11, fontWeight: '600' },
  stockToggleTextActive: { color: '#10b981' },

  countRow: { marginBottom: Spacing.sm },
  countText: { color: '#64748b', fontSize: 12 },

  loadingBox: { padding: Spacing.xxl, alignItems: 'center' },
  loadingIcon: { fontSize: 36, marginBottom: 8 },
  loadingText: { color: '#94a3b8', fontSize: 13 },

  emptyCard: {
    backgroundColor: '#1e293b',
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    marginVertical: Spacing.lg,
  },
  emptyIcon: { fontSize: 44, marginBottom: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '700', textAlign: 'center', marginBottom: 4 },
  emptyDesc: { color: '#94a3b8', fontSize: 12, textAlign: 'center', marginBottom: Spacing.md },
  resetBtn: { backgroundColor: '#0284c7', paddingHorizontal: 16, paddingVertical: 10, borderRadius: Radius.md },
  resetBtnText: { color: '#ffffff', fontSize: 12, fontWeight: '700' },

  productList: { gap: Spacing.md },
  productCard: {
    backgroundColor: '#1e293b',
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
  },
  imageWrap: { position: 'relative', width: '100%', height: 160, backgroundColor: '#0f172a' },
  productImage: { width: '100%', height: '100%' },
  wishlistBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  wishlistBtnActive: { backgroundColor: 'rgba(239, 68, 68, 0.2)' },
  wishlistBtnIcon: { fontSize: 16 },

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

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(51, 65, 85, 0.6)',
  },
  cardAddToCartBtn: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.sm,
  },
  btnDisabled: { opacity: 0.4 },
  cardAddToCartBtnText: { color: '#ffffff', fontSize: 12, fontWeight: '700' },
  viewDetailHint: { color: '#38bdf8', fontSize: 11, fontWeight: '700' },
});
