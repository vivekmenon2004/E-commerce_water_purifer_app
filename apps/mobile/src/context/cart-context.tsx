import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from '../types';
import { Storage } from '../lib/storage';

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartContextType {
  cart: CartItem[];
  wishlist: Product[];
  addToCart: (product: Product, quantity?: number) => { success: boolean; message: string };
  updateQuantity: (productId: string, quantity: number) => { success: boolean; message?: string };
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  toggleWishlist: (product: Product) => void;
  isInWishlist: (productId: string) => boolean;
  subtotal: number;
  discount: number;
  estimatedTax: number;
  deliveryFee: number;
  total: number;
  itemCount: number;
  promoCode: string;
  applyPromoCode: (code: string) => { success: boolean; message: string };
  removePromoCode: () => void;
}

const CartContext = createContext<CartContextType>({} as CartContextType);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [promoCode, setPromoCode] = useState<string>('');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // Restore cart, wishlist, and promo from persistent storage on mount
  useEffect(() => {
    async function loadPersistedData() {
      try {
        const savedCart = await Storage.getItem<CartItem[]>('calinfco_cart', []);
        const savedWishlist = await Storage.getItem<Product[]>('calinfco_wishlist', []);
        const savedPromo = await Storage.getItem<{ code: string; percent: number }>('calinfco_promo', { code: '', percent: 0 });

        if (Array.isArray(savedCart) && savedCart.length > 0) setCart(savedCart);
        if (Array.isArray(savedWishlist) && savedWishlist.length > 0) setWishlist(savedWishlist);
        if (savedPromo?.code) {
          setPromoCode(savedPromo.code);
          setDiscountPercent(savedPromo.percent);
        }
      } catch (err) {
        console.warn('[CartContext] Error loading persisted cart state:', err);
      } finally {
        setIsInitialized(true);
      }
    }
    loadPersistedData();
  }, []);

  // Save changes to persistent storage
  useEffect(() => {
    if (!isInitialized) return;
    Storage.setItem('calinfco_cart', cart);
  }, [cart, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    Storage.setItem('calinfco_wishlist', wishlist);
  }, [wishlist, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    Storage.setItem('calinfco_promo', { code: promoCode, percent: discountPercent });
  }, [promoCode, discountPercent, isInitialized]);

  const addToCart = (product: Product, quantityToAdd: number = 1) => {
    if (product.stock <= 0) {
      return { success: false, message: 'Sorry, this product is currently out of stock.' };
    }

    let message = 'Added to your cart';
    let success = true;

    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        const newQty = existing.quantity + quantityToAdd;
        if (newQty > product.stock) {
          message = `Only ${product.stock} units available in stock. Cart adjusted to maximum.`;
          return prev.map(item =>
            item.product.id === product.id ? { ...item, quantity: product.stock } : item
          );
        }
        return prev.map(item =>
          item.product.id === product.id ? { ...item, quantity: newQty } : item
        );
      } else {
        const initialQty = Math.min(quantityToAdd, product.stock);
        if (quantityToAdd > product.stock) {
          message = `Only ${product.stock} units available in stock. Added ${product.stock} to cart.`;
        }
        return [...prev, { product, quantity: initialQty }];
      }
    });

    return { success, message };
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return { success: true, message: 'Item removed from cart' };
    }

    let warning: string | undefined;

    setCart(prev =>
      prev.map(item => {
        if (item.product.id === productId) {
          if (newQuantity > item.product.stock) {
            warning = `Only ${item.product.stock} units available in stock.`;
            return { ...item, quantity: item.product.stock };
          }
          return { ...item, quantity: newQuantity };
        }
        return item;
      })
    );

    return { success: true, message: warning };
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setPromoCode('');
    setDiscountPercent(0);
  };

  const toggleWishlist = (product: Product) => {
    setWishlist(prev => {
      const exists = prev.some(p => p.id === product.id);
      if (exists) {
        return prev.filter(p => p.id !== product.id);
      }
      return [...prev, product];
    });
  };

  const isInWishlist = (productId: string) => {
    return wishlist.some(p => p.id === productId);
  };

  const applyPromoCode = (code: string) => {
    const trimmed = code.trim().toUpperCase();
    if (trimmed === 'PURE10') {
      setPromoCode('PURE10');
      setDiscountPercent(10);
      return { success: true, message: 'Promo code PURE10 applied! 10% discount added.' };
    } else if (trimmed === 'CALINFCO500') {
      setPromoCode('CALINFCO500');
      setDiscountPercent(15);
      return { success: true, message: 'Promo code CALINFCO500 applied! 15% discount added.' };
    }
    return { success: false, message: 'Invalid promo code. Try "PURE10" for 10% off.' };
  };

  const removePromoCode = () => {
    setPromoCode('');
    setDiscountPercent(0);
  };

  // Calculations
  const subtotal = cart.reduce(
    (sum, item) => sum + item.product.retailPrice * item.quantity,
    0
  );
  const discount = Math.round(subtotal * (discountPercent / 100));
  const estimatedTax = Math.round((subtotal - discount) * 0.18); // 18% GST
  const deliveryFee = subtotal > 500 || subtotal === 0 ? 0 : 99;
  const total = Math.max(0, subtotal - discount + estimatedTax + deliveryFee);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        wishlist,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        toggleWishlist,
        isInWishlist,
        subtotal,
        discount,
        estimatedTax,
        deliveryFee,
        total,
        itemCount,
        promoCode,
        applyPromoCode,
        removePromoCode,
      }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
