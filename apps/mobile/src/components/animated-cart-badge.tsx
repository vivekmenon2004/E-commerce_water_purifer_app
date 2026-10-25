import React, { useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { router } from 'expo-router';
import { useCart } from '../context/cart-context';
import { Radius } from '../constants/theme';

interface AnimatedCartBadgeProps {
  style?: ViewStyle;
  iconSize?: number;
  showZero?: boolean;
}

export function AnimatedCartBadge({ style, iconSize = 20, showZero = false }: AnimatedCartBadgeProps) {
  const { itemCount, cartBounceTick } = useCart();
  const bounceAnim = useRef(new Animated.Value(1)).current;
  const rippleAnim = useRef(new Animated.Value(0)).current;
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Bounce and ripple animation on add to cart or item count change
    rippleAnim.setValue(0);
    Animated.parallel([
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: 1.35,
          duration: 140,
          useNativeDriver: true,
        }),
        Animated.spring(bounceAnim, {
          toValue: 1,
          friction: 3,
          tension: 60,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(rippleAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [cartBounceTick, itemCount]);

  const hasItems = itemCount > 0;

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      activeOpacity={0.75}
      onPress={() => router.push('/cart' as any)}>
      {/* Ripple ring on add */}
      <Animated.View
        style={[
          styles.rippleRing,
          {
            opacity: rippleAnim.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0.8, 0.4, 0],
            }),
            transform: [
              {
                scale: rippleAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1.8],
                }),
              },
            ],
          },
        ]}
      />

      <Animated.View
        style={{
          transform: [{ scale: bounceAnim }],
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        <Text style={{ fontSize: iconSize }}>🛒</Text>

        {(hasItems || showZero) && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {itemCount > 99 ? '99+' : itemCount}
            </Text>
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
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
  rippleRing: {
    ...StyleSheet.absoluteFill,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(56, 189, 248, 0.35)',
    borderWidth: 1.5,
    borderColor: '#38bdf8',
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#0284c7',
    borderRadius: 12,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#0f172a',
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 4,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
  },
});
