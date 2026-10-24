import React from 'react';
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
import { useCart } from '@/context/cart-context';

export default function WishlistScreen() {
  const { wishlist, toggleWishlist, addToCart } = useCart();

  const handleMoveToCart = (product: any) => {
    addToCart(product, 1);
    toggleWishlist(product);
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <ThemedText type="subtitle" themeColor="primary" style={styles.badgeText}>
              💖 SAVED ITEMS
            </ThemedText>
            <View style={styles.titleRow}>
              <ThemedText type="title" style={styles.title}>
                My Wishlist
              </ThemedText>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{wishlist.length} saved</Text>
              </View>
            </View>
          </View>

          {wishlist.length === 0 ? (
            /* Empty State */
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>💙</Text>
              <ThemedText type="subtitle" style={styles.emptyTitle}>
                Your wishlist is empty
              </ThemedText>
              <Text style={styles.emptyDesc}>
                Save purifiers, dispensers, or filter replacement cartridges you want to track or buy later.
              </Text>
              <TouchableOpacity
                style={styles.browseBtn}
                onPress={() => router.push('/explore' as any)}>
                <Text style={styles.browseBtnText}>Explore Products →</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.list}>
              {wishlist.map(product => {
                const inStock = product.stock > 0;

                return (
                  <View key={product.id} style={styles.productCard}>
                    <Image
                      source={{ uri: product.imageUrl }}
                      style={styles.image}
                      resizeMode="cover"
                    />

                    <View style={styles.info}>
                      <View style={styles.topRow}>
                        <Text style={styles.skuText}>{product.sku}</Text>
                        <TouchableOpacity
                          onPress={() => toggleWishlist(product)}
                          style={styles.removeBtn}>
                          <Text style={styles.removeBtnText}>✕ Remove</Text>
                        </TouchableOpacity>
                      </View>

                      <Text style={styles.name} numberOfLines={2}>
                        {product.name}
                      </Text>

                      <View style={styles.priceRow}>
                        <Text style={styles.price}>₹{product.retailPrice.toLocaleString('en-IN')}</Text>
                        <Text style={styles.mrp}>₹{product.mrp.toLocaleString('en-IN')}</Text>
                      </View>

                      <Text style={[styles.stockText, !inStock && { color: '#ef4444' }]}>
                        {inStock ? `✓ In Stock (${product.stock} units)` : 'Out of Stock'}
                      </Text>

                      <TouchableOpacity
                        style={[styles.moveToCartBtn, !inStock && { opacity: 0.5 }]}
                        disabled={!inStock}
                        onPress={() => handleMoveToCart(product)}>
                        <Text style={styles.moveToCartBtnText}>
                          {inStock ? 'Move to Cart 🛒' : 'Out of Stock'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
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
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '800' },
  countBadge: { backgroundColor: '#0284c7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  countBadgeText: { color: '#ffffff', fontSize: 11, fontWeight: '700' },

  emptyCard: {
    backgroundColor: '#1e293b',
    borderRadius: Radius.lg,
    padding: Spacing.xxl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    marginTop: Spacing.xl,
  },
  emptyIcon: { fontSize: 50, marginBottom: Spacing.md },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptyDesc: { color: '#94a3b8', fontSize: 13, textAlign: 'center', lineHeight: 18, marginBottom: Spacing.lg },
  browseBtn: { backgroundColor: '#0284c7', paddingHorizontal: 20, paddingVertical: 12, borderRadius: Radius.md },
  browseBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },

  list: { gap: Spacing.md },
  productCard: {
    backgroundColor: '#1e293b',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#334155',
    flexDirection: 'row',
    gap: 12,
  },
  image: { width: 90, height: 90, borderRadius: Radius.md, backgroundColor: '#0f172a' },
  info: { flex: 1, justifyContent: 'space-between' },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  skuText: { color: '#38bdf8', fontSize: 10, fontWeight: '800' },
  removeBtn: { padding: 4 },
  removeBtnText: { color: '#f87171', fontSize: 11, fontWeight: '600' },
  name: { color: '#ffffff', fontSize: 14, fontWeight: '700', marginVertical: 2 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  price: { color: '#38bdf8', fontSize: 14, fontWeight: '800' },
  mrp: { color: '#64748b', fontSize: 11, textDecorationLine: 'line-through' },
  stockText: { color: '#10b981', fontSize: 11, fontWeight: '600', marginVertical: 2 },
  moveToCartBtn: {
    backgroundColor: '#0284c7',
    paddingVertical: 8,
    borderRadius: Radius.sm,
    alignItems: 'center',
    marginTop: 6,
  },
  moveToCartBtnText: { color: '#ffffff', fontSize: 12, fontWeight: '700' },
});
