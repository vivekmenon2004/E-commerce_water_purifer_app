import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  TextInput,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';

import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { Spacing, Radius } from '../../constants/theme';
import { useAuth } from '../../context/auth-context';
import { CheckoutService } from '../../lib/checkout-service';
import { Order } from '../../types';

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [cancelModalVisible, setCancelModalVisible] = useState<boolean>(false);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [isCancelling, setIsCancelling] = useState<boolean>(false);
  const [cancelFeedback, setCancelFeedback] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrder() {
      if (!id || !user) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const orders = await CheckoutService.getCustomerOrders(user.id);
      const found = orders.find(o => o.id === id);
      setOrder(found || null);
      setLoading(false);
    }

    fetchOrder();
  }, [id, user]);

  const handleConfirmCancel = async () => {
    if (!order || !user) return;
    setIsCancelling(true);
    setCancelFeedback(null);

    const res = await CheckoutService.cancelOrder(order.id, user.id, cancelReason || 'Customer requested cancellation');
    setIsCancelling(false);

    if (res.success) {
      setOrder(prev => prev ? { ...prev, orderStatus: 'cancelled', cancellationReason: cancelReason } : null);
      setCancelModalVisible(false);
    } else {
      setCancelFeedback(res.message);
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.centerBox}>
            <ActivityIndicator color="#38bdf8" size="large" />
            <Text style={styles.loadingText}>Loading order details...</Text>
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  if (!order) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.centerBox}>
            <Text style={styles.notFoundIcon}>⚠️</Text>
            <ThemedText type="title">Order Not Found</ThemedText>
            <Text style={styles.notFoundDesc}>
              The order reference {id} could not be retrieved.
            </Text>
            <TouchableOpacity style={styles.returnBtn} onPress={() => router.push('/orders' as any)}>
              <Text style={styles.returnBtnText}>← Return to Order History</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  const isCancellable = order.orderStatus === 'placed' || order.orderStatus === 'confirmed';
  const isCancelled = order.orderStatus === 'cancelled';

  const steps = [
    { key: 'placed', label: 'Order Placed', desc: 'Received & Verified' },
    { key: 'confirmed', label: 'Confirmed', desc: 'Technician Assigned' },
    { key: 'dispatched', label: 'Dispatched', desc: 'En Route to Location' },
    { key: 'installed', label: 'Installed', desc: 'TDS Tested & Certified' },
  ];

  const currentStepIndex = isCancelled
    ? -1
    : steps.findIndex(s => s.key === order.orderStatus);

  // OSM Preview URL
  const lat = order.shippingAddress.latitude || 12.9716;
  const lon = order.shippingAddress.longitude || 77.5946;
  const osmEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lon - 0.008}%2C${lat - 0.008}%2C${lon + 0.008}%2C${lat + 0.008}&layer=mapnik&marker=${lat}%2C${lon}`;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Text style={styles.backBtnText}>← All Orders</Text>
            </TouchableOpacity>
            <View style={styles.headerInfo}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <ThemedText type="title" style={styles.orderTitle}>{order.id}</ThemedText>
                {order.userRoleAtPurchase === 'dealer' && (
                  <View style={{ backgroundColor: '#064e3b', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: '#10b981' }}>
                    <Text style={{ color: '#6ee7b7', fontSize: 11, fontWeight: '800' }}>🏢 WHOLESALE B2B</Text>
                  </View>
                )}
              </View>
              <Text style={styles.orderDate}>
                Placed on {new Date(order.createdAt).toLocaleString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          </View>

          {/* STATUS TIMELINE */}
          <View style={styles.card}>
            <Text style={styles.cardHeaderTitle}>Delivery & Installation Status</Text>

            {isCancelled ? (
              <View style={styles.cancelledBox}>
                <Text style={styles.cancelledIcon}>✕</Text>
                <View>
                  <Text style={styles.cancelledTitle}>Order Cancelled</Text>
                  <Text style={styles.cancelledReason}>
                    Reason: {order.cancellationReason || 'Cancelled by customer'}
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.timelineWrap}>
                {steps.map((st, idx) => {
                  const isCompleted = idx <= currentStepIndex;
                  const isCurrent = idx === currentStepIndex;

                  return (
                    <View key={st.key} style={styles.timelineStep}>
                      <View style={styles.timelineLeft}>
                        <View style={[
                          styles.timelineDot,
                          isCompleted && styles.timelineDotDone,
                          isCurrent && styles.timelineDotCurrent,
                        ]}>
                          <Text style={styles.timelineDotText}>{isCompleted ? '✓' : idx + 1}</Text>
                        </View>
                        {idx < steps.length - 1 && (
                          <View style={[styles.timelineLine, isCompleted && styles.timelineLineDone]} />
                        )}
                      </View>
                      <View style={styles.timelineContent}>
                        <Text style={[styles.stepLabel, isCompleted && styles.stepLabelDone]}>
                          {st.label}
                        </Text>
                        <Text style={styles.stepDesc}>{st.desc}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {order.installationScheduledDate && !isCancelled && (
              <View style={styles.scheduledInfoBox}>
                <Text style={styles.scheduledInfoTitle}>🛠️ Scheduled Installation & TDS Test:</Text>
                <Text style={styles.scheduledInfoText}>
                  Within 24-48 hours. A certified Calinfco service engineer will contact you prior to arrival.
                </Text>
              </View>
            )}
          </View>

          {/* LINE ITEMS */}
          <View style={styles.card}>
            <Text style={styles.cardHeaderTitle}>Items in this Order ({order.items.length})</Text>
            <View style={styles.itemsList}>
              {order.items.map((item, idx) => (
                <View key={idx} style={styles.itemRow}>
                  <Image source={{ uri: item.imageUrl }} style={styles.itemThumb} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                    <Text style={styles.itemSku}>SKU: {item.sku} • {item.category}</Text>
                    <Text style={styles.itemQtyPrice}>
                      Qty: {item.quantity} × ₹{item.unitPrice.toLocaleString('en-IN')}{' '}
                      {order.userRoleAtPurchase === 'dealer' && (
                        <Text style={{ color: '#10b981', fontWeight: 'bold' }}>[Wholesale Price]</Text>
                      )}
                    </Text>
                  </View>
                  <Text style={styles.itemTotal}>₹{item.total.toLocaleString('en-IN')}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* SHIPPING ADDRESS & OPENSTREETMAP PREVIEW */}
          <View style={styles.card}>
            <View style={styles.addressTitleRow}>
              <Text style={styles.cardHeaderTitle}>Delivery Address</Text>
              <Text style={styles.osmBadge}>OpenStreetMap Coordinates</Text>
            </View>

            <View style={styles.mapWrap}>
              {Platform.OS === 'web' ? (
                <iframe
                  title="OpenStreetMap Order Location"
                  src={osmEmbedUrl}
                  style={{ width: '100%', height: '100%', border: 0, borderRadius: Radius.md }}
                />
              ) : (
                <View style={styles.nativeMapBox}>
                  <Text style={styles.nativeMapPin}>📍</Text>
                  <Text style={styles.nativeMapCoord}>
                    {lat.toFixed(4)}° N, {lon.toFixed(4)}° E
                  </Text>
                  <Text style={styles.nativeMapSub}>OpenStreetMap Pin Verified</Text>
                </View>
              )}
            </View>

            <View style={styles.addressInfoBox}>
              <Text style={styles.recipientName}>
                {order.shippingAddress.recipientName || order.customerName}
              </Text>
              <Text style={styles.addressStreet}>
                {order.shippingAddress.street}, {order.shippingAddress.area ? `${order.shippingAddress.area}, ` : ''}
                {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.postalCode}
              </Text>
              {order.shippingAddress.phone && (
                <Text style={styles.addressPhone}>Contact: {order.shippingAddress.phone}</Text>
              )}
              {order.deliveryNotes && (
                <Text style={styles.deliveryNotes}>Notes: {order.deliveryNotes}</Text>
              )}
            </View>
          </View>

          {/* PAYMENT DETAILS */}
          <View style={styles.card}>
            <Text style={styles.cardHeaderTitle}>Payment Information</Text>
            <View style={styles.paymentInfoRow}>
              <Text style={styles.paymentKey}>Payment Method:</Text>
              <Text style={styles.paymentVal}>
                {order.paymentMethod === 'razorpay'
                  ? 'Razorpay Online (UPI/Card)'
                  : order.paymentMethod === 'dealer_credit'
                  ? '🏢 B2B 30-Day Dealer Credit Line'
                  : 'Cash on Delivery (COD)'}
              </Text>
            </View>

            <View style={styles.paymentInfoRow}>
              <Text style={styles.paymentKey}>Payment Status:</Text>
              <Text style={[styles.paymentVal, { color: order.paymentStatus === 'paid' ? '#10b981' : '#f59e0b' }]}>
                {order.paymentStatus.toUpperCase()}
              </Text>
            </View>

            {order.paymentDetails?.razorpayPaymentId && (
              <View style={styles.paymentInfoRow}>
                <Text style={styles.paymentKey}>Transaction ID:</Text>
                <Text style={styles.paymentVal}>{order.paymentDetails.razorpayPaymentId}</Text>
              </View>
            )}

            {order.paymentDetails?.isMock && (
              <View style={styles.mockBanner}>
                <Text style={styles.mockBannerText}>
                  ℹ️ Processed in Razorpay Developer Test / Mock Mode
                </Text>
              </View>
            )}
          </View>

          {/* PRICE BREAKDOWN */}
          <View style={styles.billCard}>
            <Text style={styles.cardHeaderTitle}>Price Breakdown</Text>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Items Subtotal</Text>
              <Text style={styles.billVal}>₹{order.subtotal.toLocaleString('en-IN')}</Text>
            </View>
            {order.discount > 0 && (
              <View style={styles.billRow}>
                <Text style={[styles.billLabel, { color: '#10b981' }]}>Promotional Discount</Text>
                <Text style={[styles.billVal, { color: '#10b981' }]}>-₹{order.discount.toLocaleString('en-IN')}</Text>
              </View>
            )}
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>GST (18%)</Text>
              <Text style={styles.billVal}>+₹{order.tax.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Doorstep Delivery & TDS Test</Text>
              <Text style={[styles.billVal, { color: '#10b981' }]}>
                {order.deliveryFee === 0 || !order.deliveryFee ? 'FREE' : `₹${order.deliveryFee}`}
              </Text>
            </View>
            <View style={styles.totalDivider} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalAmount}>₹{order.totalAmount.toLocaleString('en-IN')}</Text>
            </View>
          </View>

          {/* ACTIONS: CANCEL ORDER */}
          {isCancellable && (
            <TouchableOpacity
              style={styles.cancelOrderBtn}
              onPress={() => setCancelModalVisible(true)}>
              <Text style={styles.cancelOrderBtnText}>Cancel Order</Text>
            </TouchableOpacity>
          )}

          {/* CANCELLATION MODAL */}
          <Modal visible={cancelModalVisible} transparent animationType="fade">
            <View style={styles.modalOverlay}>
              <View style={styles.modalBox}>
                <Text style={styles.modalTitle}>Cancel Order {order.id}</Text>
                <Text style={styles.modalSubtitle}>
                  Are you sure you want to cancel this order? If prepaid, refunds are processed within 3-5 business days.
                </Text>

                <TextInput
                  style={styles.cancelInput}
                  placeholder="Reason for cancellation (optional)"
                  placeholderTextColor="#64748b"
                  value={cancelReason}
                  onChangeText={setCancelReason}
                />

                {cancelFeedback && (
                  <Text style={styles.feedbackError}>{cancelFeedback}</Text>
                )}

                <View style={styles.modalActionRow}>
                  <TouchableOpacity
                    style={styles.modalBackBtn}
                    onPress={() => setCancelModalVisible(false)}>
                    <Text style={styles.modalBackBtnText}>Keep Order</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalConfirmBtn}
                    disabled={isCancelling}
                    onPress={handleConfirmCancel}>
                    {isCancelling ? (
                      <ActivityIndicator color="#ffffff" size="small" />
                    ) : (
                      <Text style={styles.modalConfirmBtnText}>Confirm Cancellation</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: { padding: Spacing.md, paddingBottom: 110 },
  topBar: { marginBottom: Spacing.md },
  backBtn: { paddingVertical: 4 },
  backBtnText: { color: '#38bdf8', fontSize: 13, fontWeight: '700' },
  headerInfo: { marginTop: 6 },
  orderTitle: { fontSize: 22, fontWeight: '800' },
  orderDate: { color: '#64748b', fontSize: 12, marginTop: 2 },

  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  loadingText: { color: '#94a3b8', fontSize: 13, marginTop: 12 },
  notFoundIcon: { fontSize: 48, marginBottom: 8 },
  notFoundDesc: { color: '#94a3b8', fontSize: 13, textAlign: 'center', marginVertical: 8 },
  returnBtn: { backgroundColor: '#0284c7', paddingHorizontal: 16, paddingVertical: 10, borderRadius: Radius.md, marginTop: 8 },
  returnBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '700' },

  card: {
    backgroundColor: '#1e293b',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: Spacing.md,
  },
  cardHeaderTitle: { color: '#ffffff', fontSize: 15, fontWeight: '800', marginBottom: 12 },

  cancelledBox: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#450a0a', padding: 12, borderRadius: Radius.md },
  cancelledIcon: { fontSize: 20, color: '#f87171', fontWeight: 'bold' },
  cancelledTitle: { color: '#f87171', fontSize: 14, fontWeight: '700' },
  cancelledReason: { color: '#fca5a5', fontSize: 12, marginTop: 2 },

  timelineWrap: { gap: 12, paddingVertical: 4 },
  timelineStep: { flexDirection: 'row', alignItems: 'flex-start' },
  timelineLeft: { alignItems: 'center', width: 28 },
  timelineDot: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#334155', justifyContent: 'center', alignItems: 'center' },
  timelineDotDone: { backgroundColor: '#0284c7' },
  timelineDotCurrent: { backgroundColor: '#10b981' },
  timelineDotText: { color: '#ffffff', fontSize: 10, fontWeight: '800' },
  timelineLine: { width: 2, height: 24, backgroundColor: '#334155', marginVertical: 2 },
  timelineLineDone: { backgroundColor: '#0284c7' },
  timelineContent: { marginLeft: 12, flex: 1 },
  stepLabel: { color: '#64748b', fontSize: 13, fontWeight: '700' },
  stepLabelDone: { color: '#ffffff' },
  stepDesc: { color: '#94a3b8', fontSize: 11, marginTop: 1 },

  scheduledInfoBox: { marginTop: 12, backgroundColor: '#0f172a', padding: 10, borderRadius: Radius.md, borderWidth: 1, borderColor: '#334155' },
  scheduledInfoTitle: { color: '#38bdf8', fontSize: 11, fontWeight: '800' },
  scheduledInfoText: { color: '#cbd5e1', fontSize: 11, marginTop: 2, lineHeight: 16 },

  itemsList: { gap: 10 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  itemThumb: { width: 50, height: 50, borderRadius: 6, backgroundColor: '#0f172a' },
  itemName: { color: '#ffffff', fontSize: 13, fontWeight: '700' },
  itemSku: { color: '#64748b', fontSize: 10, marginTop: 2 },
  itemQtyPrice: { color: '#94a3b8', fontSize: 11, marginTop: 2 },
  itemTotal: { color: '#38bdf8', fontSize: 14, fontWeight: '800' },

  addressTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  osmBadge: { color: '#38bdf8', fontSize: 10, fontWeight: '700' },
  mapWrap: { height: 130, backgroundColor: '#0f172a', borderRadius: Radius.md, overflow: 'hidden', borderWidth: 1, borderColor: '#334155', marginBottom: 10 },
  nativeMapBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  nativeMapPin: { fontSize: 24 },
  nativeMapCoord: { color: '#ffffff', fontSize: 11, fontWeight: '700', marginTop: 4 },
  nativeMapSub: { color: '#64748b', fontSize: 10 },

  addressInfoBox: { gap: 2 },
  recipientName: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
  addressStreet: { color: '#cbd5e1', fontSize: 12, lineHeight: 17 },
  addressPhone: { color: '#94a3b8', fontSize: 11, marginTop: 2 },
  deliveryNotes: { color: '#fbbf24', fontSize: 11, marginTop: 4 },

  paymentInfoRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 4 },
  paymentKey: { color: '#94a3b8', fontSize: 12 },
  paymentVal: { color: '#ffffff', fontSize: 12, fontWeight: '700' },
  mockBanner: { backgroundColor: '#0f172a', padding: 8, borderRadius: Radius.sm, marginTop: 8, borderWidth: 1, borderColor: '#ca8a04' },
  mockBannerText: { color: '#fde047', fontSize: 10, textAlign: 'center' },

  billCard: { backgroundColor: '#1e293b', borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1, borderColor: '#334155', marginBottom: Spacing.md },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 4 },
  billLabel: { color: '#94a3b8', fontSize: 12 },
  billVal: { color: '#e2e8f0', fontSize: 12, fontWeight: '600' },
  totalDivider: { height: 1, backgroundColor: '#334155', marginVertical: 8 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { color: '#ffffff', fontSize: 15, fontWeight: '800' },
  totalAmount: { color: '#38bdf8', fontSize: 20, fontWeight: '900' },

  cancelOrderBtn: { paddingVertical: 12, borderRadius: Radius.md, borderWidth: 1, borderColor: '#ef4444', alignItems: 'center', marginBottom: 20 },
  cancelOrderBtnText: { color: '#ef4444', fontSize: 13, fontWeight: '700' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalBox: { width: '100%', maxWidth: 400, backgroundColor: '#1e293b', borderRadius: Radius.xl, padding: Spacing.xl, borderWidth: 1, borderColor: '#334155' },
  modalTitle: { color: '#ffffff', fontSize: 18, fontWeight: '800', marginBottom: 6 },
  modalSubtitle: { color: '#94a3b8', fontSize: 12, lineHeight: 18, marginBottom: 12 },
  cancelInput: { backgroundColor: '#0f172a', borderRadius: Radius.md, paddingHorizontal: 12, paddingVertical: 8, color: '#ffffff', fontSize: 12, borderWidth: 1, borderColor: '#334155', marginBottom: 12 },
  feedbackError: { color: '#f87171', fontSize: 11, marginBottom: 10 },
  modalActionRow: { flexDirection: 'row', gap: 10 },
  modalBackBtn: { flex: 1, backgroundColor: '#334155', paddingVertical: 10, borderRadius: Radius.md, alignItems: 'center' },
  modalBackBtnText: { color: '#ffffff', fontSize: 12, fontWeight: '700' },
  modalConfirmBtn: { flex: 1, backgroundColor: '#dc2626', paddingVertical: 10, borderRadius: Radius.md, alignItems: 'center' },
  modalConfirmBtnText: { color: '#ffffff', fontSize: 12, fontWeight: '700' },
});
