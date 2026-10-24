import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing, Radius } from '@/constants/theme';
import { useCart } from '@/context/cart-context';
import { useAuth } from '@/context/auth-context';

export default function CartScreen() {
  const {
    cart,
    updateQuantity,
    removeFromCart,
    clearCart,
    subtotal,
    discount,
    estimatedTax,
    deliveryFee,
    total,
    itemCount,
    promoCode,
    applyPromoCode,
    removePromoCode,
    isInitialized,
  } = useCart();

  const { user, isDealer, isPendingDealer } = useAuth();
  const [promoInput, setPromoInput] = useState('');
  const [promoMsg, setPromoMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState<string | null>(null);

  const handleApplyPromo = () => {
    if (!promoInput.trim()) return;
    const res = applyPromoCode(promoInput);
    setPromoMsg({ text: res.message, isError: !res.success });
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    router.push('/checkout' as any);
  };

  if (!isInitialized) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color="#0284c7" />
          <ThemedText style={{ marginTop: 12, color: '#94a3b8' }}>Loading your cart...</ThemedText>
        </SafeAreaView>
      </ThemedView>
    );
  }

  if (orderPlaced) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.successBox}>
            <View style={styles.successIconBubble}>
              <Text style={styles.successIcon}>✓</Text>
            </View>
            <ThemedText type="title" style={styles.successTitle}>
              Order Placed Successfully!
            </ThemedText>
            <Text style={styles.orderIdBadge}>Order ID: {orderPlaced}</Text>
            <Text style={styles.successSubtitle}>
              Thank you for choosing Calinfco. A confirmation notification has been dispatched to{' '}
              <Text style={{ color: '#38bdf8', fontWeight: 'bold' }}>
                {user ? user.email : 'your registered email'}
              </Text>.
            </Text>

            <View style={styles.successCard}>
              <Text style={styles.cardHeader}>Doorstep Installation & Delivery</Text>
              <Text style={styles.cardDesc}>
                A certified Calinfco service technician will contact you within 24 hours to schedule installation and conduct free raw water TDS testing.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.continueBtn}
              onPress={() => {
                setOrderPlaced(null);
                router.push('/explore' as any);
              }}>
              <Text style={styles.continueBtnText}>Continue Shopping →</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <ThemedText type="subtitle" themeColor="primary" style={styles.badgeText}>
              {isDealer ? '🏢 WHOLESALE DEALER CART' : '🛒 YOUR SHOPPING CART'}
            </ThemedText>
            <View style={styles.titleRow}>
              <ThemedText type="title" style={styles.title}>
                {isDealer ? 'Wholesale Cart' : 'Cart Summary'}
              </ThemedText>
              <View style={[styles.countBadge, isDealer && { backgroundColor: '#065f46' }]}>
                <Text style={styles.countBadgeText}>{itemCount} {isDealer ? 'units' : 'items'}</Text>
              </View>
            </View>
          </View>

          {/* Dealer Wholesale Active Banner */}
          {isDealer && (
            <View style={{ backgroundColor: '#064e3b', borderWidth: 1, borderColor: '#10b981', borderRadius: 12, padding: 12, marginBottom: 16, flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 24, marginRight: 10 }}>🏢</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#6ee7b7', fontWeight: 'bold', fontSize: 14 }}>Verified Dealership Wholesale Active</Text>
                <Text style={{ color: '#a7f3d0', fontSize: 12 }}>Special wholesale pricing and bulk stock validation active on all items.</Text>
              </View>
            </View>
          )}

          {isPendingDealer && (
            <View style={{ backgroundColor: '#451a03', borderWidth: 1, borderColor: '#f59e0b', borderRadius: 12, padding: 12, marginBottom: 16, flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 24, marginRight: 10 }}>⏳</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#fcd34d', fontWeight: 'bold', fontSize: 14 }}>Dealer Application Under Review</Text>
                <Text style={{ color: '#fef3c7', fontSize: 12 }}>Pending admin verification. Standard retail prices apply until approved.</Text>
              </View>
            </View>
          )}

          {cart.length === 0 ? (
            /* ================= EMPTY STATE ================= */
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>💧</Text>
              <ThemedText type="subtitle" style={styles.emptyTitle}>
                Your cart is currently empty
              </ThemedText>
              <Text style={styles.emptyDesc}>
                Browse our pure water purifiers, dispensers, pumps, and genuine replacement filter cartridges.
              </Text>
              <TouchableOpacity
                style={styles.shopNowBtn}
                onPress={() => router.push('/explore' as any)}>
                <Text style={styles.shopNowBtnText}>Browse Product Catalog →</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* ================= CART ITEMS LIST ================= */
            <View style={styles.contentWrap}>
              <View style={styles.itemsList}>
                {cart.map(item => {
                  const isMaxStock = item.quantity >= item.product.stock;

                  return (
                    <View key={item.product.id} style={styles.itemCard}>
                      <Image
                        source={{ uri: item.product.imageUrl }}
                        style={styles.itemImage}
                        resizeMode="cover"
                      />

                      <View style={styles.itemInfo}>
                        <View style={styles.itemTopRow}>
                          <Text style={styles.itemSku}>{item.product.sku}</Text>
                          <TouchableOpacity
                            onPress={() => removeFromCart(item.product.id)}
                            style={styles.removeBtn}>
                            <Text style={styles.removeBtnText}>✕ Remove</Text>
                          </TouchableOpacity>
                        </View>

                        <Text style={styles.itemName} numberOfLines={2}>
                          {item.product.name}
                        </Text>

                        <Text style={styles.unitPrice}>
                          ₹{(isDealer ? item.product.dealerPrice : item.product.retailPrice).toLocaleString('en-IN')}{' '}
                          <Text style={styles.mrpText}>
                            ₹{item.product.mrp.toLocaleString('en-IN')}
                          </Text>
                          {isDealer && (
                            <Text style={{ color: '#10b981', fontWeight: '700', fontSize: 12 }}> [Wholesale]</Text>
                          )}
                        </Text>

                        {/* Stock warning */}
                        {isMaxStock && (
                          <Text style={styles.stockLimitWarn}>
                            Max available stock reached ({item.product.stock} units)
                          </Text>
                        )}

                        {/* Quantity controls */}
                        <View style={styles.quantityRow}>
                          <View style={styles.stepper}>
                            <TouchableOpacity
                              style={styles.stepperBtn}
                              onPress={() => updateQuantity(item.product.id, item.quantity - 1)}>
                              <Text style={styles.stepperBtnText}>−</Text>
                            </TouchableOpacity>

                            <View style={styles.stepperValue}>
                              <Text style={styles.stepperValueText}>{item.quantity}</Text>
                            </View>

                            <TouchableOpacity
                              style={[styles.stepperBtn, isMaxStock && styles.stepperBtnDisabled]}
                              disabled={isMaxStock}
                              onPress={() => updateQuantity(item.product.id, item.quantity + 1)}>
                              <Text style={[styles.stepperBtnText, isMaxStock && styles.disabledText]}>
                                +
                              </Text>
                            </TouchableOpacity>
                          </View>

                          <Text style={styles.itemTotalPrice}>
                            ₹{((isDealer ? item.product.dealerPrice : item.product.retailPrice) * item.quantity).toLocaleString('en-IN')}
                          </Text>
                        </View>

                        {/* Bulk Controls for Dealers */}
                        {isDealer && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 6 }}>
                            <Text style={{ fontSize: 11, color: '#94a3b8', fontWeight: '600' }}>Bulk:</Text>
                            {[5, 10, 25].map(step => (
                              <TouchableOpacity
                                key={step}
                                style={{ backgroundColor: '#0284c7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}
                                onPress={() => updateQuantity(item.product.id, Math.min(item.product.stock, item.quantity + step))}>
                                <Text style={{ color: '#ffffff', fontSize: 11, fontWeight: '700' }}>+{step}</Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>

              {/* Promo Code Input */}
              <View style={styles.promoCard}>
                <Text style={styles.cardHeader}>Have a Promotional Coupon?</Text>
                {!promoCode ? (
                  <View style={styles.promoInputRow}>
                    <TextInput
                      style={styles.promoInput}
                      placeholder="Enter promo code (e.g. PURE10)"
                      placeholderTextColor="#64748b"
                      autoCapitalize="characters"
                      value={promoInput}
                      onChangeText={setPromoInput}
                    />
                    <TouchableOpacity style={styles.applyPromoBtn} onPress={handleApplyPromo}>
                      <Text style={styles.applyPromoBtnText}>Apply</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.appliedPromoRow}>
                    <Text style={styles.appliedPromoText}>
                      ✓ Coupon <Text style={{ fontWeight: 'bold' }}>{promoCode}</Text> Active (-₹{discount.toLocaleString('en-IN')})
                    </Text>
                    <TouchableOpacity onPress={removePromoCode}>
                      <Text style={styles.removePromoText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {promoMsg && (
                  <Text style={[styles.promoFeedback, promoMsg.isError ? styles.feedbackError : styles.feedbackSuccess]}>
                    {promoMsg.text}
                  </Text>
                )}
              </View>

              {/* Order Bill Summary */}
              <View style={styles.billCard}>
                <Text style={styles.cardHeader}>Price Details ({itemCount} items)</Text>

                <View style={styles.billRow}>
                  <Text style={styles.billLabel}>Items Subtotal</Text>
                  <Text style={styles.billValue}>₹{subtotal.toLocaleString('en-IN')}</Text>
                </View>

                {discount > 0 && (
                  <View style={styles.billRow}>
                    <Text style={[styles.billLabel, { color: '#10b981' }]}>Promotional Discount</Text>
                    <Text style={[styles.billValue, { color: '#10b981' }]}>-₹{discount.toLocaleString('en-IN')}</Text>
                  </View>
                )}

                <View style={styles.billRow}>
                  <Text style={styles.billLabel}>Estimated GST (18%)</Text>
                  <Text style={styles.billValue}>+₹{estimatedTax.toLocaleString('en-IN')}</Text>
                </View>

                <View style={styles.billRow}>
                  <Text style={styles.billLabel}>Doorstep Delivery & Handling</Text>
                  <Text style={[styles.billValue, deliveryFee === 0 && { color: '#10b981' }]}>
                    {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
                  </Text>
                </View>

                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total Payable</Text>
                  <Text style={styles.totalValue}>₹{total.toLocaleString('en-IN')}</Text>
                </View>

                <TouchableOpacity
                  style={[styles.checkoutBtn, isCheckingOut && { opacity: 0.6 }]}
                  disabled={isCheckingOut}
                  onPress={handleCheckout}>
                  <Text style={styles.checkoutBtnText}>
                    {isCheckingOut ? 'Processing Order...' : `Proceed to Checkout (₹${total.toLocaleString('en-IN')})`}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.clearBtn} onPress={clearCart}>
                  <Text style={styles.clearBtnText}>Clear Cart</Text>
                </TouchableOpacity>
              </View>
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

  emptyState: {
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
  shopNowBtn: { backgroundColor: '#0284c7', paddingHorizontal: 20, paddingVertical: 12, borderRadius: Radius.md },
  shopNowBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },

  contentWrap: { gap: Spacing.md },
  itemsList: { gap: Spacing.md },
  itemCard: {
    backgroundColor: '#1e293b',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#334155',
    flexDirection: 'row',
    gap: 12,
  },
  itemImage: { width: 85, height: 85, borderRadius: Radius.md, backgroundColor: '#0f172a' },
  itemInfo: { flex: 1, justifyContent: 'space-between' },
  itemTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemSku: { color: '#38bdf8', fontSize: 10, fontWeight: '800' },
  removeBtn: { padding: 4 },
  removeBtnText: { color: '#f87171', fontSize: 11, fontWeight: '600' },
  itemName: { color: '#ffffff', fontSize: 14, fontWeight: '700', marginVertical: 2 },
  unitPrice: { color: '#38bdf8', fontSize: 13, fontWeight: '700' },
  mrpText: { color: '#64748b', fontSize: 11, textDecorationLine: 'line-through' },
  stockLimitWarn: { color: '#fbbf24', fontSize: 10, fontWeight: '600', marginTop: 2 },

  quantityRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  stepper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a', borderRadius: Radius.sm, borderWidth: 1, borderColor: '#334155' },
  stepperBtn: { paddingHorizontal: 12, paddingVertical: 6 },
  stepperBtnDisabled: { opacity: 0.3 },
  stepperBtnText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  disabledText: { color: '#64748b' },
  stepperValue: { paddingHorizontal: 10 },
  stepperValueText: { color: '#38bdf8', fontSize: 13, fontWeight: '700' },
  itemTotalPrice: { color: '#ffffff', fontSize: 15, fontWeight: '800' },

  // Promo Card
  promoCard: { backgroundColor: '#1e293b', borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1, borderColor: '#334155' },
  cardHeader: { color: '#ffffff', fontSize: 13, fontWeight: '700', marginBottom: 10 },
  promoInputRow: { flexDirection: 'row', gap: 8 },
  promoInput: {
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
  applyPromoBtn: { backgroundColor: '#0284c7', paddingHorizontal: 16, justifyContent: 'center', borderRadius: Radius.md },
  applyPromoBtnText: { color: '#ffffff', fontSize: 12, fontWeight: '700' },
  appliedPromoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  appliedPromoText: { color: '#10b981', fontSize: 12 },
  removePromoText: { color: '#f87171', fontSize: 11, fontWeight: '700' },
  promoFeedback: { fontSize: 11, marginTop: 6 },
  feedbackError: { color: '#f87171' },
  feedbackSuccess: { color: '#10b981' },

  // Bill Card
  billCard: { backgroundColor: '#1e293b', borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1, borderColor: '#334155' },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 4 },
  billLabel: { color: '#94a3b8', fontSize: 12 },
  billValue: { color: '#e2e8f0', fontSize: 12, fontWeight: '600' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  totalLabel: { color: '#ffffff', fontSize: 14, fontWeight: '800' },
  totalValue: { color: '#38bdf8', fontSize: 20, fontWeight: '900' },

  checkoutBtn: {
    backgroundColor: '#0284c7',
    borderRadius: Radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  checkoutBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '800' },
  clearBtn: { alignItems: 'center', marginTop: 10 },
  clearBtnText: { color: '#64748b', fontSize: 11, fontWeight: '600' },

  // Success Box
  successBox: {
    backgroundColor: '#1e293b',
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#10b981',
    marginTop: Spacing.lg,
  },
  successIconBubble: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 2,
    borderColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  successIcon: { color: '#10b981', fontSize: 28, fontWeight: 'bold' },
  successTitle: { fontSize: 20, fontWeight: '800', textAlign: 'center', marginBottom: 6 },
  orderIdBadge: { color: '#38bdf8', fontSize: 13, fontWeight: '800', marginBottom: 8 },
  successSubtitle: { color: '#94a3b8', fontSize: 12, textAlign: 'center', lineHeight: 18, marginBottom: Spacing.lg },
  successCard: { backgroundColor: '#0f172a', borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.lg, width: '100%' },
  cardDesc: { color: '#94a3b8', fontSize: 11, lineHeight: 16, marginTop: 4 },
  continueBtn: { backgroundColor: '#0284c7', paddingVertical: 12, paddingHorizontal: 24, borderRadius: Radius.md },
  continueBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '700' },
});
