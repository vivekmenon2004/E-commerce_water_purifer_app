import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing, Radius } from '@/constants/theme';
import { db, isDemoMode } from '@/lib/firebase';
import { SEED_PRODUCTS } from '@/constants/seed-data';
import { useCart } from '@/context/cart-context';
import { useAuth } from '@/context/auth-context';
import { Product } from '@/types';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { addToCart, toggleWishlist, isInWishlist } = useCart();
  const { isDealer } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [addedToast, setAddedToast] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProduct() {
      if (!id) return;
      setLoading(true);

      // Check seed products first
      const seedMatch = SEED_PRODUCTS.find(p => p.id === id || p.sku.toLowerCase() === id.toLowerCase());

      if (isDemoMode || !db) {
        setProduct(seedMatch || null);
        setLoading(false);
        return;
      }

      try {
        const docRef = doc(db as any, 'products', id);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setProduct({ id: snap.id, ...snap.data() } as Product);
        } else {
          setProduct(seedMatch || null);
        }
      } catch (err) {
        console.warn('Error fetching product from firestore, using fallback:', err);
        setProduct(seedMatch || null);
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.centerContainer}>
            <Text style={styles.loadingSpinner}>💧</Text>
            <ThemedText type="subtitle">Loading product details...</ThemedText>
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  if (!product) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.centerContainer}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <ThemedText type="title" style={{ marginBottom: 8 }}>Product Not Found</ThemedText>
            <Text style={styles.errorDesc}>
              The product you are looking for may have been retired or does not exist.
            </Text>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => router.push('/explore' as any)}>
              <Text style={styles.backBtnText}>← Return to Catalog</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  const isFavorited = isInWishlist(product.id);
  const inStock = product.stock > 0;
  const isMaxStockSelected = quantity >= product.stock;
  const activePrice = isDealer ? product.dealerPrice : product.retailPrice;
  const savings = product.mrp - activePrice;
  const savingsPercent = Math.round((savings / product.mrp) * 100);

  const handleAddToCart = () => {
    const res = addToCart(product, quantity);
    setAddedToast(res.message);
    setTimeout(() => setAddedToast(null), 3000);
  };

  const handleBuyNow = () => {
    addToCart(product, quantity);
    router.push('/cart' as any);
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Top Bar Navigation */}
          <View style={styles.navBar}>
            <TouchableOpacity
              style={styles.backLink}
              onPress={() => router.back()}>
              <Text style={styles.backLinkText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.skuHeader}>{product.sku}</Text>
          </View>

          {/* Toast Notification */}
          {addedToast && (
            <View style={styles.toastBox}>
              <Text style={styles.toastText}>✓ {addedToast}</Text>
            </View>
          )}

          {/* Product Hero Image */}
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: product.imageUrl }}
              style={styles.heroImage}
              resizeMode="cover"
            />
            <TouchableOpacity
              style={[styles.wishlistBubble, isFavorited && styles.wishlistBubbleActive]}
              onPress={() => toggleWishlist(product)}>
              <Text style={styles.wishlistIcon}>{isFavorited ? '❤️' : '🤍'}</Text>
            </TouchableOpacity>

            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{product.category.toUpperCase()}</Text>
            </View>
          </View>

          {/* Product Details Header */}
          <View style={styles.detailSection}>
            <ThemedText type="title" style={styles.productTitle}>
              {product.name}
            </ThemedText>

            <View style={styles.ratingRow}>
              <Text style={styles.ratingStars}>★ {product.ratingAverage}</Text>
              <Text style={styles.ratingCount}>({product.ratingCount} verified customer ratings)</Text>
            </View>

            {/* Pricing Section */}
            <View style={styles.priceCard}>
              <Text style={styles.priceTierLabel}>
                {isDealer ? 'Wholesale Authorized Dealer Price' : 'Special Retail Price'}
              </Text>
              <View style={styles.priceMainRow}>
                <Text style={styles.priceAmount}>₹{activePrice.toLocaleString('en-IN')}</Text>
                <Text style={styles.mrpAmount}>₹{product.mrp.toLocaleString('en-IN')}</Text>
                <View style={styles.savingsPill}>
                  <Text style={styles.savingsPillText}>SAVE {savingsPercent}%</Text>
                </View>
              </View>
              <Text style={styles.taxInclusiveText}>Inclusive of all taxes & free doorstep delivery</Text>
            </View>

            {/* Stock Availability */}
            <View style={styles.stockStatusRow}>
              <View style={[styles.stockDot, !inStock && styles.stockDotOut]} />
              <Text style={[styles.stockStatusText, !inStock && { color: '#ef4444' }]}>
                {inStock ? `In Stock (${product.stock} units available)` : 'Currently Out of Stock'}
              </Text>
            </View>

            {/* Quantity Stepper */}
            {inStock && (
              <View style={styles.quantitySection}>
                <Text style={styles.quantityLabel}>Select Quantity:</Text>
                <View style={styles.stepperWrap}>
                  <TouchableOpacity
                    style={[styles.stepBtn, quantity <= 1 && styles.stepBtnDisabled]}
                    disabled={quantity <= 1}
                    onPress={() => setQuantity(q => Math.max(1, q - 1))}>
                    <Text style={styles.stepBtnText}>−</Text>
                  </TouchableOpacity>

                  <View style={styles.qtyBox}>
                    <Text style={styles.qtyBoxText}>{quantity}</Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.stepBtn, isMaxStockSelected && styles.stepBtnDisabled]}
                    disabled={isMaxStockSelected}
                    onPress={() => setQuantity(q => Math.min(product.stock, q + 1))}>
                    <Text style={styles.stepBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
                {isMaxStockSelected && (
                  <Text style={styles.maxStockHint}>Maximum available stock reached</Text>
                )}
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.addToCartBtn, !inStock && styles.btnDisabled]}
                disabled={!inStock}
                onPress={handleAddToCart}>
                <Text style={styles.addToCartBtnText}>Add to Cart 🛒</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.buyNowBtn, !inStock && styles.btnDisabled]}
                disabled={!inStock}
                onPress={handleBuyNow}>
                <Text style={styles.buyNowBtnText}>Buy Now ⚡</Text>
              </TouchableOpacity>
            </View>

            {/* Specifications Card */}
            <View style={styles.specsCard}>
              <Text style={styles.specsTitle}>Technical Specifications</Text>

              {product.purificationStages && (
                <View style={styles.specRow}>
                  <Text style={styles.specKey}>Purification Stages</Text>
                  <Text style={styles.specValue}>{product.purificationStages} Stages</Text>
                </View>
              )}

              {product.purificationTech && product.purificationTech.length > 0 && (
                <View style={styles.specRow}>
                  <Text style={styles.specKey}>Technologies</Text>
                  <Text style={styles.specValue}>{product.purificationTech.join(', ')}</Text>
                </View>
              )}

              {product.tankCapacityLiters && (
                <View style={styles.specRow}>
                  <Text style={styles.specKey}>Storage Tank</Text>
                  <Text style={styles.specValue}>{product.tankCapacityLiters} Liters (Food Grade)</Text>
                </View>
              )}

              {product.waterSourceSuitability && (
                <View style={styles.specRow}>
                  <Text style={styles.specKey}>Water Source Suitability</Text>
                  <Text style={styles.specValue}>{product.waterSourceSuitability}</Text>
                </View>
              )}

              <View style={styles.specRow}>
                <Text style={styles.specKey}>Manufacturer Warranty</Text>
                <Text style={styles.specValue}>{product.warrantyMonths} Months On-Site</Text>
              </View>
            </View>

            {/* Description Card */}
            <View style={styles.descCard}>
              <Text style={styles.specsTitle}>Product Overview</Text>
              <Text style={styles.descBody}>{product.description}</Text>
            </View>

            {/* Trust Badges */}
            <View style={styles.trustGrid}>
              <View style={styles.trustItem}>
                <Text style={styles.trustIcon}>🛡️</Text>
                <Text style={styles.trustTitle}>100% Genuine</Text>
                <Text style={styles.trustSubtitle}>Direct from Calinfco</Text>
              </View>
              <View style={styles.trustItem}>
                <Text style={styles.trustIcon}>🚚</Text>
                <Text style={styles.trustTitle}>Free Installation</Text>
                <Text style={styles.trustSubtitle}>By certified engineer</Text>
              </View>
              <View style={styles.trustItem}>
                <Text style={styles.trustIcon}>🧪</Text>
                <Text style={styles.trustTitle}>Free TDS Test</Text>
                <Text style={styles.trustSubtitle}>Pre & post inspection</Text>
              </View>
            </View>

          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: { paddingBottom: 110 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  loadingSpinner: { fontSize: 40, marginBottom: 12 },
  errorIcon: { fontSize: 50, marginBottom: 12 },
  errorDesc: { color: '#94a3b8', fontSize: 13, textAlign: 'center', lineHeight: 18, marginBottom: Spacing.lg },
  backBtn: { backgroundColor: '#0284c7', paddingHorizontal: 20, paddingVertical: 12, borderRadius: Radius.md },
  backBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '700' },

  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backLink: { padding: 4 },
  backLinkText: { color: '#38bdf8', fontSize: 14, fontWeight: '700' },
  skuHeader: { color: '#64748b', fontSize: 11, fontWeight: '800' },

  toastBox: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    backgroundColor: '#065f46',
    borderRadius: Radius.md,
    padding: Spacing.sm,
    alignItems: 'center',
  },
  toastText: { color: '#ffffff', fontSize: 12, fontWeight: '700' },

  imageContainer: { width: '100%', height: 260, position: 'relative', backgroundColor: '#0f172a' },
  heroImage: { width: '100%', height: '100%' },
  wishlistBubble: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  wishlistBubbleActive: { backgroundColor: 'rgba(239, 68, 68, 0.2)' },
  wishlistIcon: { fontSize: 20 },
  categoryBadge: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    backgroundColor: 'rgba(2, 132, 199, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryBadgeText: { color: '#ffffff', fontSize: 11, fontWeight: '800', letterSpacing: 0.8 },

  detailSection: { padding: Spacing.lg, gap: Spacing.md },
  productTitle: { fontSize: 20, fontWeight: '800' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ratingStars: { color: '#fbbf24', fontSize: 13, fontWeight: '800' },
  ratingCount: { color: '#94a3b8', fontSize: 12 },

  priceCard: {
    backgroundColor: '#1e293b',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#334155',
  },
  priceTierLabel: { color: '#94a3b8', fontSize: 11, textTransform: 'uppercase', marginBottom: 4 },
  priceMainRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
  priceAmount: { color: '#38bdf8', fontSize: 24, fontWeight: '900' },
  mrpAmount: { color: '#64748b', fontSize: 14, textDecorationLine: 'line-through' },
  savingsPill: { backgroundColor: '#065f46', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  savingsPillText: { color: '#ffffff', fontSize: 10, fontWeight: '800' },
  taxInclusiveText: { color: '#94a3b8', fontSize: 11, marginTop: 4 },

  stockStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stockDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10b981' },
  stockDotOut: { backgroundColor: '#ef4444' },
  stockStatusText: { color: '#10b981', fontSize: 12, fontWeight: '700' },

  quantitySection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#334155',
  },
  quantityLabel: { color: '#cbd5e1', fontSize: 13, fontWeight: '600' },
  stepperWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a', borderRadius: Radius.sm, borderWidth: 1, borderColor: '#334155' },
  stepBtn: { paddingHorizontal: 14, paddingVertical: 6 },
  stepBtnDisabled: { opacity: 0.3 },
  stepBtnText: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },
  qtyBox: { paddingHorizontal: 14 },
  qtyBoxText: { color: '#38bdf8', fontSize: 14, fontWeight: '800' },
  maxStockHint: { color: '#fbbf24', fontSize: 11, marginTop: 4 },

  actionRow: { flexDirection: 'row', gap: 12, marginTop: Spacing.sm },
  addToCartBtn: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderWidth: 1.5,
    borderColor: '#0284c7',
    paddingVertical: 14,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  addToCartBtnText: { color: '#38bdf8', fontSize: 14, fontWeight: '800' },
  buyNowBtn: {
    flex: 1,
    backgroundColor: '#0284c7',
    paddingVertical: 14,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  buyNowBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '800' },
  btnDisabled: { opacity: 0.4 },

  specsCard: {
    backgroundColor: '#1e293b',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#334155',
  },
  specsTitle: { color: '#ffffff', fontSize: 14, fontWeight: '800', marginBottom: 12 },
  specRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#334155' },
  specKey: { color: '#94a3b8', fontSize: 12 },
  specValue: { color: '#e2e8f0', fontSize: 12, fontWeight: '700' },

  descCard: {
    backgroundColor: '#1e293b',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#334155',
  },
  descBody: { color: '#94a3b8', fontSize: 13, lineHeight: 20 },

  trustGrid: { flexDirection: 'row', gap: 8 },
  trustItem: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: Radius.md,
    padding: Spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  trustIcon: { fontSize: 22, marginBottom: 4 },
  trustTitle: { color: '#ffffff', fontSize: 11, fontWeight: '700', textAlign: 'center' },
  trustSubtitle: { color: '#64748b', fontSize: 9, textAlign: 'center', marginTop: 2 },
});
