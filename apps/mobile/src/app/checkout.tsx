import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { ThemedText } from '../components/themed-text';
import { ThemedView } from '../components/themed-view';
import { Spacing, Radius } from '../constants/theme';
import { useCart } from '../context/cart-context';
import { useAuth } from '../context/auth-context';
import { OsmAddressPicker } from '../components/osm-address-picker';
import { CheckoutService, ValidationResult } from '../lib/checkout-service';
import { UserAddress, OrderItem } from '../types';

export default function CheckoutScreen() {
  const { cart, subtotal, discount, estimatedTax, deliveryFee, total, promoCode, clearCart, isInitialized } = useCart();
  const { user, addAddress, isDealer } = useAuth();

  // State
  const [selectedAddress, setSelectedAddress] = useState<UserAddress | null>(null);
  const [showAddressPicker, setShowAddressPicker] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod' | 'dealer_credit'>('razorpay');
  const [installationSlot, setInstallationSlot] = useState<string>('Next Day Morning (9 AM - 12 PM)');
  const [deliveryNotes, setDeliveryNotes] = useState<string>('');

  const [isValidating, setIsValidating] = useState<boolean>(true);
  const [validatedData, setValidatedData] = useState<ValidationResult['verifiedSummary'] | null>(null);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Mock Payment Dialog state for Razorpay Test Mode simulation
  const [mockPaymentModal, setMockPaymentModal] = useState<{
    visible: boolean;
    orderId: string;
    keyId: string;
    amount: number;
  } | null>(null);

  // 1. Initial address selection
  useEffect(() => {
    if (user?.addresses && user.addresses.length > 0) {
      const defaultAddr = user.addresses.find(a => a.isDefault) || user.addresses[0];
      setSelectedAddress(defaultAddr);
    } else {
      setShowAddressPicker(true);
    }
  }, [user]);

  // 2. Validate Cart Items on mount
  useEffect(() => {
    async function runValidation() {
      if (cart.length === 0) {
        setIsValidating(false);
        return;
      }

      setIsValidating(true);
      const isApprovedDealer = user?.role === 'dealer' && user?.dealerStatus === 'approved';
      const itemsPayload = cart.map(item => ({
        productId: item.product.id,
        sku: item.product.sku,
        quantity: item.quantity,
      }));

      const res = await CheckoutService.validateCartItems(
        itemsPayload,
        promoCode,
        isApprovedDealer ? 'dealer' : 'customer',
        user?.id
      );

      if (res.warnings && res.warnings.length > 0) {
        setValidationWarnings(res.warnings);
      }
      setValidatedData(res.verifiedSummary);
      setIsValidating(false);
    }

    runValidation();
  }, [cart, promoCode, user]);

  const handleAddNewAddress = async (addrData: Omit<UserAddress, 'id'>) => {
    const res = await addAddress(addrData);
    if (res.success && res.address) {
      setSelectedAddress(res.address);
      setShowAddressPicker(false);
    }
  };

  const executeOrderCreation = async (paymentDetails: any) => {
    if (!user || !selectedAddress) return;

    const isApprovedDealer = user?.role === 'dealer' && user?.dealerStatus === 'approved';
    const itemsToSave: OrderItem[] = (validatedData?.items || cart.map(i => {
      const price = isApprovedDealer ? i.product.dealerPrice : i.product.retailPrice;
      return {
        productId: i.product.id,
        sku: i.product.sku,
        name: i.product.name,
        category: i.product.category,
        unitPrice: price,
        mrp: i.product.mrp,
        quantity: i.quantity,
        total: price * i.quantity,
        imageUrl: i.product.imageUrl,
      };
    }));

    const orderPayload = {
      customerId: user.id,
      customerName: user.name || selectedAddress.recipientName || 'Valued Customer',
      customerEmail: user.email,
      customerPhone: selectedAddress.phone || user.phone || '+91 98765 00000',
      userRoleAtPurchase: (isApprovedDealer ? 'dealer' : 'customer') as any,
      items: itemsToSave,
      subtotal: validatedData?.subtotal || subtotal,
      discount: validatedData?.discount || discount,
      tax: validatedData?.tax || estimatedTax,
      deliveryFee: validatedData?.deliveryFee ?? deliveryFee,
      totalAmount: validatedData?.totalAmount || total,
      paymentMethod,
      paymentStatus: (paymentMethod === 'cod' || paymentMethod === 'dealer_credit' ? 'pending' : 'paid') as any,
      orderStatus: 'placed' as any,
      shippingAddress: selectedAddress,
      idempotencyKey: `idem_${user.id}_${Date.now()}`,
      paymentDetails,
      deliveryNotes: `${deliveryNotes} | Preferred Slot: ${installationSlot}`.trim(),
    };

    const res = await CheckoutService.saveOrder(orderPayload);
    setIsProcessing(false);

    if (res.success) {
      clearCart();
      router.replace(`/orders/${res.orderId}` as any);
    } else {
      setCheckoutError('Could not save order. Please check your connectivity and try again.');
    }
  };

  const handleInitiatePayment = async () => {
    if (!selectedAddress) {
      setCheckoutError('Please select or add a delivery address.');
      return;
    }

    if (cart.length === 0) {
      setCheckoutError('Your cart is empty.');
      return;
    }

    setCheckoutError(null);
    setIsProcessing(true);

    const finalAmount = validatedData?.totalAmount || total;

    // A. Cash on Delivery or Dealer Credit Flow
    if (paymentMethod === 'cod' || paymentMethod === 'dealer_credit') {
      await executeOrderCreation({
        isMock: false,
        type: paymentMethod === 'dealer_credit' ? 'dealer_credit_net30' : 'cash_on_delivery',
        paidAt: null,
      });
      return;
    }

    // B. Razorpay Test Mode Flow
    try {
      const razorpayOrder = await CheckoutService.createRazorpayOrder(finalAmount);

      // Open Razorpay Simulator Modal
      setMockPaymentModal({
        visible: true,
        orderId: razorpayOrder.orderId,
        keyId: razorpayOrder.keyId,
        amount: finalAmount,
      });
    } catch (err: any) {
      setIsProcessing(false);
      setCheckoutError(err.message || 'Payment initiation failed');
    }
  };

  const handleSimulatePaymentOutcome = async (success: boolean) => {
    if (!mockPaymentModal) return;

    const { orderId } = mockPaymentModal;
    setMockPaymentModal(null);

    if (!success) {
      setIsProcessing(false);
      setCheckoutError('Razorpay Payment was cancelled or rejected in test mode.');
      return;
    }

    // Simulate payment callback verification
    const mockPaymentId = `pay_mock_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
    const mockSignature = `mock_sig_${mockPaymentId}`;

    const verifyRes = await CheckoutService.verifyPaymentSignature(
      orderId,
      mockPaymentId,
      mockSignature,
      true
    );

    if (verifyRes.verified) {
      await executeOrderCreation({
        razorpayOrderId: orderId,
        razorpayPaymentId: mockPaymentId,
        signature: mockSignature,
        isMock: true,
        paidAt: new Date().toISOString(),
      });
    } else {
      setIsProcessing(false);
      setCheckoutError('Payment signature verification failed.');
    }
  };

  if (!isInitialized) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.emptyContainer}>
            <ActivityIndicator size="large" color="#38bdf8" />
            <Text style={[styles.emptyDesc, { marginTop: 12 }]}>Loading your cart...</Text>
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  if (cart.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🛒</Text>
            <ThemedText type="title">Your Cart is Empty</ThemedText>
            <Text style={styles.emptyDesc}>Add water purifiers or spares to your cart to checkout.</Text>
            <TouchableOpacity style={styles.returnBtn} onPress={() => router.push('/explore' as any)}>
              <Text style={styles.returnBtnText}>Browse Products →</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  const billTotal = validatedData?.totalAmount || total;
  const billSubtotal = validatedData?.subtotal || subtotal;
  const billDiscount = validatedData?.discount || discount;
  const billTax = validatedData?.tax || estimatedTax;
  const billDelivery = validatedData?.deliveryFee ?? deliveryFee;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Top Bar */}
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Text style={styles.backBtnText}>← Back to Cart</Text>
            </TouchableOpacity>
            <Text style={styles.topTitle}>Secure Checkout</Text>
          </View>

          {/* Validation Banner */}
          {isValidating && (
            <View style={styles.validatingBox}>
              <ActivityIndicator size="small" color="#38bdf8" />
              <Text style={styles.validatingText}>Verifying catalog prices and live stock...</Text>
            </View>
          )}

          {validationWarnings.length > 0 && (
            <View style={styles.warningBox}>
              {validationWarnings.map((w, idx) => (
                <Text key={idx} style={styles.warningText}>⚠️ {w}</Text>
              ))}
            </View>
          )}

          {checkoutError && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>❌ {checkoutError}</Text>
            </View>
          )}

          {/* SECTION 1: DELIVERY ADDRESS */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardHeaderTitle}>1. Delivery & Installation Address</Text>
              <TouchableOpacity onPress={() => setShowAddressPicker(true)}>
                <Text style={styles.changeActionText}>+ New Address</Text>
              </TouchableOpacity>
            </View>

            {selectedAddress && !showAddressPicker ? (
              <View style={styles.selectedAddressBox}>
                <View style={styles.addressTagRow}>
                  <Text style={styles.addressTag}>{selectedAddress.label || 'Home'}</Text>
                  {selectedAddress.isDefault && (
                    <Text style={styles.defaultBadge}>DEFAULT</Text>
                  )}
                </View>
                <Text style={styles.addressRecipient}>
                  {selectedAddress.recipientName || user?.name || 'Customer'}
                </Text>
                <Text style={styles.addressStreet}>
                  {selectedAddress.street}, {selectedAddress.area ? `${selectedAddress.area}, ` : ''}
                  {selectedAddress.city}, {selectedAddress.state} - {selectedAddress.postalCode}
                </Text>
                {selectedAddress.phone && (
                  <Text style={styles.addressPhone}>📞 {selectedAddress.phone}</Text>
                )}
                {selectedAddress.latitude && selectedAddress.longitude && (
                  <Text style={styles.osmPinText}>
                    📍 OpenStreetMap Pin: {selectedAddress.latitude.toFixed(4)}°N, {selectedAddress.longitude.toFixed(4)}°E
                  </Text>
                )}

                {/* Other saved addresses selector */}
                {(user?.addresses?.length || 0) > 1 && (
                  <View style={styles.switchAddressWrap}>
                    <Text style={styles.switchLabel}>Switch Address:</Text>
                    <View style={styles.addressChips}>
                      {user!.addresses.map(a => (
                        <TouchableOpacity
                          key={a.id}
                          style={[styles.addrChip, selectedAddress.id === a.id && styles.addrChipActive]}
                          onPress={() => setSelectedAddress(a)}>
                          <Text style={[styles.addrChipText, selectedAddress.id === a.id && styles.addrChipTextActive]}>
                            {a.label || a.city}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            ) : null}

            {/* Address Picker (OSM Map + Manual Form) */}
            {showAddressPicker && (
              <OsmAddressPicker
                onSaveAddress={handleAddNewAddress}
                onCancel={selectedAddress ? () => setShowAddressPicker(false) : undefined}
                submitButtonText="Deliver to this Address"
              />
            )}
          </View>

          {/* SECTION 2: INSTALLATION & DELIVERY PREFERENCES */}
          <View style={styles.card}>
            <Text style={styles.cardHeaderTitle}>2. Installation & Schedule</Text>
            <Text style={styles.cardSubtitle}>
              Calinfco certified service engineer will install your purifier and conduct free raw water TDS tests.
            </Text>

            <View style={styles.slotsList}>
              {[
                'Next Day Morning (9 AM - 12 PM)',
                'Next Day Afternoon (1 PM - 4 PM)',
                'Next Day Evening (5 PM - 8 PM)',
                'Weekend Slot (Saturday 10 AM - 1 PM)',
              ].map(slot => (
                <TouchableOpacity
                  key={slot}
                  style={[styles.slotOption, installationSlot === slot && styles.slotOptionActive]}
                  onPress={() => setInstallationSlot(slot)}>
                  <View style={[styles.radioCircle, installationSlot === slot && styles.radioCircleActive]}>
                    {installationSlot === slot && <View style={styles.radioDot} />}
                  </View>
                  <Text style={[styles.slotText, installationSlot === slot && styles.slotTextActive]}>
                    {slot}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.notesWrap}>
              <Text style={styles.fieldLabel}>Special Delivery / Installation Notes:</Text>
              <TextInput
                style={styles.notesInput}
                placeholder="e.g. Ring bell twice, water inlet is on the right wall"
                placeholderTextColor="#64748b"
                value={deliveryNotes}
                onChangeText={setDeliveryNotes}
              />
            </View>
          </View>

          {/* SECTION 3: ORDER ITEMS SUMMARY */}
          <View style={styles.card}>
            <Text style={styles.cardHeaderTitle}>3. Review Items ({cart.length})</Text>
            <View style={styles.itemsSummaryList}>
              {cart.map(item => {
                const itemUnitPrice = isDealer ? item.product.dealerPrice : item.product.retailPrice;
                const itemLineTotal = itemUnitPrice * item.quantity;
                return (
                  <View key={item.product.id} style={styles.itemSummaryRow}>
                    <Image source={{ uri: item.product.imageUrl }} style={styles.itemThumb} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemNameText} numberOfLines={1}>{item.product.name}</Text>
                      <Text style={styles.itemMetaText}>
                        Qty: {item.quantity} × ₹{itemUnitPrice.toLocaleString('en-IN')}{' '}
                        {isDealer && <Text style={{ color: '#10b981', fontWeight: 'bold' }}>[Wholesale]</Text>}
                      </Text>
                    </View>
                    <Text style={styles.itemPriceTotal}>
                      ₹{itemLineTotal.toLocaleString('en-IN')}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* SECTION 4: PAYMENT METHOD (RAZORPAY TEST MODE, COD & DEALER CREDIT) */}
          <View style={styles.card}>
            <Text style={styles.cardHeaderTitle}>4. Payment Method</Text>

            {/* Dealer Credit Card (For Approved Dealers) */}
            {isDealer && (
              <TouchableOpacity
                style={[styles.payOption, paymentMethod === 'dealer_credit' && styles.payOptionActive, { marginBottom: 10, borderColor: '#10b981' }]}
                onPress={() => setPaymentMethod('dealer_credit')}>
                <View style={styles.payOptionHeader}>
                  <View style={[styles.radioCircle, paymentMethod === 'dealer_credit' && styles.radioCircleActive]}>
                    {paymentMethod === 'dealer_credit' && <View style={styles.radioDot} />}
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <View style={styles.payBadgeRow}>
                      <Text style={styles.payOptionTitle}>🏢 B2B 30-Day Dealer Credit Line</Text>
                      <View style={[styles.testModeBadge, { backgroundColor: '#10b981' }]}>
                        <Text style={styles.testModeBadgeText}>APPROVED DEALER</Text>
                      </View>
                    </View>
                    <Text style={styles.payOptionDesc}>
                      Authorized Net-30 payment terms. Bulk invoice dispatched with consignment.
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}

            {/* Razorpay Test Mode Card */}
            <TouchableOpacity
              style={[styles.payOption, paymentMethod === 'razorpay' && styles.payOptionActive]}
              onPress={() => setPaymentMethod('razorpay')}>
              <View style={styles.payOptionHeader}>
                <View style={[styles.radioCircle, paymentMethod === 'razorpay' && styles.radioCircleActive]}>
                  {paymentMethod === 'razorpay' && <View style={styles.radioDot} />}
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <View style={styles.payBadgeRow}>
                    <Text style={styles.payOptionTitle}>Razorpay Online Payment</Text>
                    <View style={styles.testModeBadge}>
                      <Text style={styles.testModeBadgeText}>TEST MODE</Text>
                    </View>
                  </View>
                  <Text style={styles.payOptionDesc}>
                    UPI (GPay/PhonePe), Credit & Debit Cards, Netbanking
                  </Text>
                  <Text style={styles.secureServerNotice}>
                    🔒 Secure server order creation & signature verification. Mock payment fallback active if test keys are unconfigured.
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Cash on Delivery Card */}
            <TouchableOpacity
              style={[styles.payOption, paymentMethod === 'cod' && styles.payOptionActive, { marginTop: 10 }]}
              onPress={() => setPaymentMethod('cod')}>
              <View style={styles.payOptionHeader}>
                <View style={[styles.radioCircle, paymentMethod === 'cod' && styles.radioCircleActive]}>
                  {paymentMethod === 'cod' && <View style={styles.radioDot} />}
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.payOptionTitle}>Cash on Delivery (COD)</Text>
                  <Text style={styles.payOptionDesc}>
                    Pay after installation and free TDS purity testing
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* SECTION 5: FINAL BILL & CHECKOUT BUTTON */}
          <View style={styles.billCard}>
            <Text style={styles.cardHeaderTitle}>Price Breakdown</Text>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Subtotal</Text>
              <Text style={styles.billVal}>₹{billSubtotal.toLocaleString('en-IN')}</Text>
            </View>
            {billDiscount > 0 && (
              <View style={styles.billRow}>
                <Text style={[styles.billLabel, { color: '#10b981' }]}>Promotional Discount ({promoCode})</Text>
                <Text style={[styles.billVal, { color: '#10b981' }]}>-₹{billDiscount.toLocaleString('en-IN')}</Text>
              </View>
            )}
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>GST (18%)</Text>
              <Text style={styles.billVal}>+₹{billTax.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Doorstep Delivery & TDS Test</Text>
              <Text style={[styles.billVal, { color: '#10b981' }]}>
                {billDelivery === 0 ? 'FREE' : `₹${billDelivery}`}
              </Text>
            </View>
            <View style={styles.totalDivider} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Payable</Text>
              <Text style={styles.totalAmount}>₹{billTotal.toLocaleString('en-IN')}</Text>
            </View>

            <TouchableOpacity
              style={[styles.placeOrderBtn, isProcessing && { opacity: 0.7 }]}
              disabled={isProcessing}
              onPress={handleInitiatePayment}>
              {isProcessing ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.placeOrderBtnText}>
                  {paymentMethod === 'razorpay'
                    ? `Pay & Place Order (₹${billTotal.toLocaleString('en-IN')})`
                    : `Confirm COD Order (₹${billTotal.toLocaleString('en-IN')})`}
                </Text>
              )}
            </TouchableOpacity>
            <Text style={styles.guaranteeText}>
              🛡️ 100% Genuine Calinfco Products • Direct Manufacturer Warranty
            </Text>
          </View>
        </ScrollView>

        {/* Razorpay Test Mode Simulator Dialog */}
        <Modal
          visible={Boolean(mockPaymentModal?.visible)}
          transparent
          animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalBrand}>Razorpay Checkout</Text>
                <View style={styles.testPill}>
                  <Text style={styles.testPillText}>TEST MODE</Text>
                </View>
              </View>

              <Text style={styles.modalAmount}>₹{mockPaymentModal?.amount.toLocaleString('en-IN')}</Text>
              <Text style={styles.modalSub}>Order ID: {mockPaymentModal?.orderId}</Text>
              <Text style={styles.modalNotice}>
                This is a simulated Razorpay test gateway for developer verification. Select an outcome to test payment handling:
              </Text>

              <TouchableOpacity
                style={styles.simulateSuccessBtn}
                onPress={() => handleSimulatePaymentOutcome(true)}>
                <Text style={styles.simulateSuccessText}>✓ Simulate Payment Success</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.simulateFailBtn}
                onPress={() => handleSimulatePaymentOutcome(false)}>
                <Text style={styles.simulateFailText}>✕ Simulate Payment Failure</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: 120,
    maxWidth: 1000,
    width: '100%',
    alignSelf: 'center',
  },
  topBar: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  backBtn: { padding: 4 },
  backBtnText: { color: '#38bdf8', fontSize: 13, fontWeight: '700' },
  topTitle: { color: '#ffffff', fontSize: 18, fontWeight: '800', marginLeft: 16 },

  validatingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0f172a',
    padding: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#38bdf8',
    marginBottom: Spacing.md,
  },
  validatingText: { color: '#38bdf8', fontSize: 12 },

  warningBox: { backgroundColor: '#451a03', padding: 10, borderRadius: Radius.md, marginBottom: Spacing.md },
  warningText: { color: '#fde047', fontSize: 12 },
  errorBox: { backgroundColor: '#450a0a', padding: 10, borderRadius: Radius.md, marginBottom: Spacing.md },
  errorText: { color: '#f87171', fontSize: 12, fontWeight: '700' },

  card: {
    backgroundColor: '#1e293b',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: Spacing.md,
  },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardHeaderTitle: { color: '#ffffff', fontSize: 15, fontWeight: '800' },
  changeActionText: { color: '#38bdf8', fontSize: 12, fontWeight: '700' },
  cardSubtitle: { color: '#94a3b8', fontSize: 12, marginBottom: 12, lineHeight: 16 },

  selectedAddressBox: { backgroundColor: '#0f172a', padding: 12, borderRadius: Radius.md, borderWidth: 1, borderColor: '#334155' },
  addressTagRow: { flexDirection: 'row', gap: 6, marginBottom: 4 },
  addressTag: { backgroundColor: '#0284c7', color: '#ffffff', fontSize: 10, fontWeight: '800', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  defaultBadge: { backgroundColor: '#065f46', color: '#10b981', fontSize: 10, fontWeight: '800', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  addressRecipient: { color: '#ffffff', fontSize: 14, fontWeight: '700', marginTop: 4 },
  addressStreet: { color: '#cbd5e1', fontSize: 12, marginTop: 2, lineHeight: 16 },
  addressPhone: { color: '#94a3b8', fontSize: 11, marginTop: 4 },
  osmPinText: { color: '#38bdf8', fontSize: 10, fontWeight: '600', marginTop: 4 },

  switchAddressWrap: { marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#334155' },
  switchLabel: { color: '#64748b', fontSize: 10, marginBottom: 4 },
  addressChips: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  addrChip: { backgroundColor: '#1e293b', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#334155' },
  addrChipActive: { backgroundColor: '#0284c7', borderColor: '#38bdf8' },
  addrChipText: { color: '#94a3b8', fontSize: 11 },
  addrChipTextActive: { color: '#ffffff', fontWeight: '700' },

  slotsList: { gap: 8 },
  slotOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: Radius.md,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
  },
  slotOptionActive: { borderColor: '#38bdf8', backgroundColor: 'rgba(56, 189, 248, 0.08)' },
  radioCircle: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: '#64748b', justifyContent: 'center', alignItems: 'center' },
  radioCircleActive: { borderColor: '#38bdf8' },
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#38bdf8' },
  slotText: { color: '#94a3b8', fontSize: 12, marginLeft: 10 },
  slotTextActive: { color: '#ffffff', fontWeight: '700' },

  notesWrap: { marginTop: 12 },
  fieldLabel: { color: '#cbd5e1', fontSize: 11, fontWeight: '600', marginBottom: 4 },
  notesInput: {
    backgroundColor: '#0f172a',
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#ffffff',
    fontSize: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },

  itemsSummaryList: { gap: 8, marginTop: 4 },
  itemSummaryRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  itemThumb: { width: 44, height: 44, borderRadius: 6, backgroundColor: '#0f172a' },
  itemNameText: { color: '#ffffff', fontSize: 12, fontWeight: '700' },
  itemMetaText: { color: '#64748b', fontSize: 11 },
  itemPriceTotal: { color: '#38bdf8', fontSize: 13, fontWeight: '800' },

  payOption: {
    backgroundColor: '#0f172a',
    borderRadius: Radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  payOptionActive: { borderColor: '#38bdf8', backgroundColor: 'rgba(56, 189, 248, 0.08)' },
  payOptionHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  payBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  payOptionTitle: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
  testModeBadge: { backgroundColor: '#ca8a04', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  testModeBadgeText: { color: '#ffffff', fontSize: 9, fontWeight: '800' },
  payOptionDesc: { color: '#94a3b8', fontSize: 11, marginTop: 2 },
  secureServerNotice: { color: '#38bdf8', fontSize: 10, marginTop: 4 },

  billCard: {
    backgroundColor: '#1e293b',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#334155',
  },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 4 },
  billLabel: { color: '#94a3b8', fontSize: 12 },
  billVal: { color: '#e2e8f0', fontSize: 12, fontWeight: '600' },
  totalDivider: { height: 1, backgroundColor: '#334155', marginVertical: 8 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  totalLabel: { color: '#ffffff', fontSize: 15, fontWeight: '800' },
  totalAmount: { color: '#38bdf8', fontSize: 22, fontWeight: '900' },
  placeOrderBtn: { backgroundColor: '#0284c7', paddingVertical: 14, borderRadius: Radius.md, alignItems: 'center' },
  placeOrderBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '800' },
  guaranteeText: { color: '#64748b', fontSize: 10, textAlign: 'center', marginTop: 8 },

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyDesc: { color: '#94a3b8', fontSize: 13, textAlign: 'center', marginVertical: 8 },
  returnBtn: { backgroundColor: '#0284c7', paddingHorizontal: 16, paddingVertical: 10, borderRadius: Radius.md, marginTop: 8 },
  returnBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '700' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalBox: { width: '100%', maxWidth: 400, backgroundColor: '#1e293b', borderRadius: Radius.xl, padding: Spacing.xl, borderWidth: 1, borderColor: '#334155' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalBrand: { color: '#ffffff', fontSize: 18, fontWeight: '800' },
  testPill: { backgroundColor: '#ca8a04', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  testPillText: { color: '#ffffff', fontSize: 10, fontWeight: '800' },
  modalAmount: { color: '#38bdf8', fontSize: 26, fontWeight: '900', marginBottom: 4 },
  modalSub: { color: '#64748b', fontSize: 11, marginBottom: 12 },
  modalNotice: { color: '#cbd5e1', fontSize: 12, lineHeight: 18, marginBottom: Spacing.lg },
  simulateSuccessBtn: { backgroundColor: '#059669', paddingVertical: 12, borderRadius: Radius.md, alignItems: 'center', marginBottom: 10 },
  simulateSuccessText: { color: '#ffffff', fontSize: 13, fontWeight: '800' },
  simulateFailBtn: { backgroundColor: '#dc2626', paddingVertical: 12, borderRadius: Radius.md, alignItems: 'center' },
  simulateFailText: { color: '#ffffff', fontSize: 13, fontWeight: '800' },
});
