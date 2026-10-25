import React, { useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  Pressable,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useCart } from '../context/cart-context';
import { Radius, Spacing } from '../constants/theme';

export function CartFloatingToast() {
  const { lastAddedNotification, dismissNotification, itemCount, subtotal } = useCart();
  const insets = useSafeAreaInsets();

  const translateY = useRef(new Animated.Value(-140)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;
  const progressAnim = useRef(new Animated.Value(1)).current;
  const hideTimerRef = useRef<any>(null);

  useEffect(() => {
    if (!lastAddedNotification) {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -140,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    // Cancel existing timers and reset progress
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    progressAnim.setValue(1);

    // Spring in animation
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        tension: 65,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        tension: 70,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Progress bar animation
    Animated.timing(progressAnim, {
      toValue: 0,
      duration: 3400,
      useNativeDriver: false, // width needs non-native driver
    }).start();

    // Auto dismiss after 3.5 seconds
    hideTimerRef.current = setTimeout(() => {
      dismissNotification();
    }, 3500);

    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [lastAddedNotification?.id]);

  if (!lastAddedNotification) return null;

  const { product, quantity } = lastAddedNotification;

  const handleViewCart = () => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    dismissNotification();
    router.push('/cart' as any);
  };

  const topOffset = Math.max(insets.top + 8, Platform.OS === 'web' ? 16 : 40);

  return (
    <View
      pointerEvents="box-none"
      style={[styles.overlayWrapper, { top: topOffset }]}>
      <Animated.View
        style={[
          styles.container,
          {
            opacity,
            transform: [{ translateY }, { scale }],
          },
        ]}>
        <View style={styles.contentRow}>
          {/* Product Thumbnail with Success Badge */}
          <View style={styles.imageWrap}>
            <Image
              source={{ uri: product.imageUrl }}
              style={styles.thumbnail}
              resizeMode="cover"
            />
            <View style={styles.checkmarkBadge}>
              <Text style={styles.checkmarkText}>✓</Text>
            </View>
          </View>

          {/* Details */}
          <View style={styles.infoWrap}>
            <View style={styles.badgeLine}>
              <Text style={styles.headerTag}>💧 ADDED TO CART</Text>
              <Text style={styles.skuTag}>{product.sku}</Text>
            </View>
            <Text style={styles.productName} numberOfLines={1}>
              {product.name}
            </Text>
            <Text style={styles.subtext}>
              Qty: <Text style={styles.boldQty}>+{quantity}</Text> • Cart ({itemCount} {itemCount === 1 ? 'item' : 'items'}): ₹{subtotal.toLocaleString('en-IN')}
            </Text>
          </View>

          {/* Actions */}
          <View style={styles.actionsWrap}>
            <TouchableOpacity
              style={styles.viewCartBtn}
              activeOpacity={0.8}
              onPress={handleViewCart}>
              <Text style={styles.viewCartBtnText}>View Cart →</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.closeBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              onPress={dismissNotification}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressBar,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlayWrapper: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 999999,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 9999,
  },
  container: {
    width: '100%',
    maxWidth: 620,
    backgroundColor: '#0a192f',
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: '#0284c7',
    overflow: 'hidden',
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 12,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  imageWrap: {
    position: 'relative',
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: Radius.md - 2,
  },
  checkmarkBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#10b981',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#0a192f',
  },
  checkmarkText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
  },
  infoWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  badgeLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  headerTag: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  skuTag: {
    color: '#64748b',
    fontSize: 9,
    fontWeight: '700',
  },
  productName: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  subtext: {
    color: '#94a3b8',
    fontSize: 11,
  },
  boldQty: {
    color: '#38bdf8',
    fontWeight: '800',
  },
  actionsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  viewCartBtn: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#38bdf8',
  },
  viewCartBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 6,
    borderRadius: Radius.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  closeBtnText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
  },
  progressTrack: {
    height: 3,
    backgroundColor: 'rgba(2, 132, 199, 0.2)',
    width: '100%',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#38bdf8',
  },
});
