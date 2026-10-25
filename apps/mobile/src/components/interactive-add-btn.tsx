import React, { useState, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
  GestureResponderEvent,
} from 'react-native';
import { Radius } from '../constants/theme';
import { Product } from '../types';
import { useCart } from '../context/cart-context';

interface InteractiveAddBtnProps {
  product: Product;
  quantity?: number;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  onAdded?: (product: Product, quantity: number) => void;
}

export function InteractiveAddBtn({
  product,
  quantity = 1,
  size = 'md',
  label,
  style,
  textStyle,
  onAdded,
}: InteractiveAddBtnProps) {
  const { addToCart } = useCart();
  const [justAdded, setJustAdded] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<any>(null);

  const inStock = product.stock > 0;

  const handlePress = (e: GestureResponderEvent) => {
    e.stopPropagation?.();
    if (!inStock) return;

    // Trigger button spring animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.91,
        duration: 90,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 70,
        useNativeDriver: true,
      }),
    ]).start();

    // Call addToCart
    addToCart(product, quantity);
    onAdded?.(product, quantity);

    // Switch to added feedback state
    setJustAdded(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setJustAdded(false);
    }, 1800);
  };

  const getButtonText = () => {
    if (!inStock) return 'Out of Stock';
    if (justAdded) return '✓ Added!';
    if (label) return label;
    if (size === 'sm') return '+ Add';
    return 'Add to Cart 🛒';
  };

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
      <TouchableOpacity
        activeOpacity={0.85}
        disabled={!inStock}
        style={[
          styles.baseBtn,
          size === 'sm' && styles.btnSm,
          size === 'md' && styles.btnMd,
          size === 'lg' && styles.btnLg,
          justAdded && styles.btnAdded,
          !inStock && styles.btnDisabled,
        ]}
        onPress={handlePress}>
        <Text
          style={[
            styles.baseText,
            size === 'sm' && styles.textSm,
            size === 'md' && styles.textMd,
            size === 'lg' && styles.textLg,
            justAdded && styles.textAdded,
            !inStock && styles.textDisabled,
            textStyle,
          ]}>
          {getButtonText()}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  baseBtn: {
    backgroundColor: '#0284c7',
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#38bdf8',
  },
  btnSm: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.sm,
  },
  btnMd: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: Radius.md,
  },
  btnLg: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: Radius.lg,
  },
  btnAdded: {
    backgroundColor: '#059669',
    borderColor: '#34d399',
  },
  btnDisabled: {
    backgroundColor: '#334155',
    borderColor: '#475569',
  },
  baseText: {
    color: '#ffffff',
    fontWeight: '800',
    textAlign: 'center',
  },
  textSm: {
    fontSize: 11,
  },
  textMd: {
    fontSize: 13,
  },
  textLg: {
    fontSize: 15,
  },
  textAdded: {
    color: '#ffffff',
  },
  textDisabled: {
    color: '#94a3b8',
  },
});
