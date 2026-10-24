import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { Spacing, Radius } from '../../constants/theme';
import { useAuth } from '../../context/auth-context';
import { CheckoutService } from '../../lib/checkout-service';
import { Order } from '../../types';

type OrderFilter = 'all' | 'dealer' | 'active' | 'installed' | 'cancelled';

export default function OrderHistoryScreen() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<OrderFilter>('all');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadOrders() {
      if (!user) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const res = await CheckoutService.getCustomerOrders(user.id);
      setOrders(res);
      setLoading(false);
    }

    loadOrders();
  }, [user]);

  const filteredOrders = orders.filter(o => {
    if (filter === 'dealer') return o.userRoleAtPurchase === 'dealer';
    if (filter === 'active') return o.orderStatus === 'placed' || o.orderStatus === 'confirmed' || o.orderStatus === 'dispatched';
    if (filter === 'installed') return o.orderStatus === 'installed';
    if (filter === 'cancelled') return o.orderStatus === 'cancelled';
    return true;
  });

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Text style={styles.backBtnText}>← Back</Text>
            </TouchableOpacity>
            <ThemedText type="title" style={styles.pageTitle}>Order History</ThemedText>
          </View>

          {/* Filter Pills */}
          <View style={styles.filterRow}>
            {[
              { id: 'all', label: 'All Orders' },
              { id: 'dealer', label: '🏢 Wholesale' },
              { id: 'active', label: 'In Progress' },
              { id: 'installed', label: 'Installed' },
              { id: 'cancelled', label: 'Cancelled' },
            ].map(tab => (
              <TouchableOpacity
                key={tab.id}
                style={[styles.filterPill, filter === tab.id && styles.filterPillActive]}
                onPress={() => setFilter(tab.id as OrderFilter)}>
                <Text style={[styles.filterText, filter === tab.id && styles.filterTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {loading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator color="#38bdf8" size="large" />
              <Text style={styles.loadingText}>Fetching order history from Firestore...</Text>
            </View>
          ) : filteredOrders.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>📦</Text>
              <ThemedText type="subtitle" style={styles.emptyTitle}>
                No {filter !== 'all' ? filter : ''} orders found
              </ThemedText>
              <Text style={styles.emptyDesc}>
                Browse our water purifiers and genuine filter cartridges to place your first order.
              </Text>
              <TouchableOpacity style={styles.shopBtn} onPress={() => router.push('/explore' as any)}>
                <Text style={styles.shopBtnText}>Explore Pure Water Catalog →</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.ordersList}>
              {filteredOrders.map(order => {
                const totalItemCount = order.items.reduce((sum, i) => sum + i.quantity, 0);
                const isCancelled = order.orderStatus === 'cancelled';
                const isPaid = order.paymentStatus === 'paid';

                return (
                  <TouchableOpacity
                    key={order.id}
                    style={styles.orderCard}
                    activeOpacity={0.85}
                    onPress={() => router.push(`/orders/${order.id}` as any)}>
                    {/* Top Row */}
                    <View style={styles.orderTopRow}>
                      <View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={styles.orderIdText}>{order.id}</Text>
                          {order.userRoleAtPurchase === 'dealer' && (
                            <View style={{ backgroundColor: '#064e3b', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: '#10b981' }}>
                              <Text style={{ color: '#6ee7b7', fontSize: 10, fontWeight: '800' }}>WHOLESALE</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.orderDateText}>
                          Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </Text>
                      </View>

                      <View style={[
                        styles.statusBadge,
                        isCancelled ? styles.statusCancelled : order.orderStatus === 'installed' ? styles.statusInstalled : styles.statusActive
                      ]}>
                        <Text style={styles.statusText}>
                          {order.orderStatus.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    {/* Thumbnails preview */}
                    <View style={styles.thumbsRow}>
                      {order.items.slice(0, 3).map((item, idx) => (
                        <Image
                          key={idx}
                          source={{ uri: item.imageUrl }}
                          style={styles.thumbImage}
                        />
                      ))}
                      {order.items.length > 3 && (
                        <View style={styles.moreThumbsBox}>
                          <Text style={styles.moreThumbsText}>+{order.items.length - 3}</Text>
                        </View>
                      )}
                      <View style={{ flex: 1, marginLeft: 8 }}>
                        <Text style={styles.itemsSummaryName} numberOfLines={1}>
                          {order.items[0]?.name}
                        </Text>
                        <Text style={styles.itemsCountText}>
                          {totalItemCount} {totalItemCount === 1 ? 'item' : 'items'} in total
                        </Text>
                      </View>
                    </View>

                    {/* Bottom Row */}
                    <View style={styles.orderBottomRow}>
                      <View>
                        <Text style={styles.paymentMethodText}>
                          Payment: {order.paymentMethod.toUpperCase()}{' '}
                          <Text style={{ color: isPaid ? '#10b981' : '#f59e0b' }}>
                            ({order.paymentStatus})
                          </Text>
                        </Text>
                        <Text style={styles.deliveryCityText}>
                          Deliver to: {order.shippingAddress.city} ({order.shippingAddress.postalCode})
                        </Text>
                      </View>

                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.totalAmountText}>
                          ₹{order.totalAmount.toLocaleString('en-IN')}
                        </Text>
                        <Text style={styles.viewDetailLink}>View Details →</Text>
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
  scrollContent: { padding: Spacing.md, paddingBottom: 110 },
  topBar: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  backBtn: { padding: 4 },
  backBtnText: { color: '#38bdf8', fontSize: 13, fontWeight: '700' },
  pageTitle: { fontSize: 22, fontWeight: '800', marginLeft: 16 },

  filterRow: { flexDirection: 'row', gap: 6, marginBottom: Spacing.md, flexWrap: 'wrap' },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  filterPillActive: { backgroundColor: '#0284c7', borderColor: '#38bdf8' },
  filterText: { color: '#94a3b8', fontSize: 11, fontWeight: '600' },
  filterTextActive: { color: '#ffffff' },

  centerBox: { padding: 40, alignItems: 'center' },
  loadingText: { color: '#94a3b8', fontSize: 12, marginTop: 12 },

  emptyCard: {
    backgroundColor: '#1e293b',
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    marginTop: 20,
  },
  emptyIcon: { fontSize: 44, marginBottom: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  emptyDesc: { color: '#94a3b8', fontSize: 12, textAlign: 'center', marginBottom: 16 },
  shopBtn: { backgroundColor: '#0284c7', paddingHorizontal: 16, paddingVertical: 10, borderRadius: Radius.md },
  shopBtnText: { color: '#ffffff', fontSize: 12, fontWeight: '700' },

  ordersList: { gap: Spacing.md },
  orderCard: {
    backgroundColor: '#1e293b',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#334155',
  },
  orderTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  orderIdText: { color: '#38bdf8', fontSize: 14, fontWeight: '800' },
  orderDateText: { color: '#64748b', fontSize: 11, marginTop: 2 },

  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusActive: { backgroundColor: '#075985' },
  statusInstalled: { backgroundColor: '#065f46' },
  statusCancelled: { backgroundColor: '#7f1d1d' },
  statusText: { color: '#ffffff', fontSize: 10, fontWeight: '800', letterSpacing: 0.6 },

  thumbsRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 8 },
  thumbImage: { width: 44, height: 44, borderRadius: 6, backgroundColor: '#0f172a', marginRight: 6 },
  moreThumbsBox: { width: 44, height: 44, borderRadius: 6, backgroundColor: '#334155', justifyContent: 'center', alignItems: 'center' },
  moreThumbsText: { color: '#ffffff', fontSize: 12, fontWeight: '700' },
  itemsSummaryName: { color: '#ffffff', fontSize: 13, fontWeight: '700' },
  itemsCountText: { color: '#94a3b8', fontSize: 11, marginTop: 2 },

  orderBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: 10,
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  paymentMethodText: { color: '#cbd5e1', fontSize: 11, fontWeight: '600' },
  deliveryCityText: { color: '#64748b', fontSize: 10, marginTop: 2 },
  totalAmountText: { color: '#38bdf8', fontSize: 16, fontWeight: '800' },
  viewDetailLink: { color: '#38bdf8', fontSize: 11, fontWeight: '700', marginTop: 2 },
});
