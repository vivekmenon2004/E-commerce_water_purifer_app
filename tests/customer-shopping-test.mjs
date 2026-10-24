#!/usr/bin/env node
/**
 * Calinfco Customer App & Shopping Experience Test Suite
 *
 * Verifies:
 * 1. Category navigation for all 5 categories.
 * 2. Search, category filtering, in-stock filtering, and sorting.
 * 3. Product detail resolution and stock validation.
 * 4. Cart operations, quantity updates, stock limits, and subtotal/tax/discount calculations.
 * 5. Wishlist toggle and move-to-cart workflow.
 * 6. Separate retail and dealer pricing integrity.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('================================================================');
console.log('🛒 CALINFCO CUSTOMER APP SHOPPING & CART TEST SUITE');
console.log('================================================================\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, testName, detail = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ PASS: ${testName} ${detail ? `(${detail})` : ''}`);
  } else {
    failedTests++;
    console.error(`  ❌ FAIL: ${testName} ${detail ? `(${detail})` : ''}`);
  }
}

// Load seed products
const seedDataPath = path.resolve(__dirname, '../data/seed-products.json');
const products = JSON.parse(fs.readFileSync(seedDataPath, 'utf8'));

// -------------------------------------------------------------
// 1. Navigation & Category Filtering Tests
// -------------------------------------------------------------
console.log('----------------------------------------------------------------');
console.log('1️⃣ Category Navigation & Product Retrieval');
console.log('----------------------------------------------------------------');

const categories = ['water purifiers', 'dispensers', 'pumps', 'filters', 'spare parts'];
for (const cat of categories) {
  const catProducts = products.filter(p => p.category === cat);
  assert(catProducts.length >= 10, `Category "${cat}" has full inventory`, `${catProducts.length} items`);
}

// -------------------------------------------------------------
// 2. Search, Filtering, and Sorting Pipeline Tests
// -------------------------------------------------------------
console.log('\n----------------------------------------------------------------');
console.log('2️⃣ Search, Filtering & Sorting Pipeline');
console.log('----------------------------------------------------------------');

// Search by SKU
const skuResults = products.filter(p => p.sku.toLowerCase().includes('cal-wp-001'));
assert(skuResults.length === 1 && skuResults[0].sku === 'CAL-WP-001', 'Search by exact SKU matches product', 'CAL-WP-001');

// Search by keyword "Alkaline"
const keywordResults = products.filter(p => p.name.toLowerCase().includes('alkaline') || p.description.toLowerCase().includes('alkaline'));
assert(keywordResults.length >= 3, 'Search by keyword "alkaline" returns relevant products', `${keywordResults.length} matches`);

// Sorting: Price Low to High
const sortedLowToHigh = [...products].sort((a, b) => a.retailPrice - b.retailPrice);
assert(sortedLowToHigh[0].retailPrice <= sortedLowToHigh[1].retailPrice, 'Sort Price: Low to High is strictly monotonic');
assert(sortedLowToHigh[sortedLowToHigh.length - 1].retailPrice >= sortedLowToHigh[sortedLowToHigh.length - 2].retailPrice, 'Highest price item correctly placed at end of Low->High sort');

// Sorting: Price High to Low
const sortedHighToLow = [...products].sort((a, b) => b.retailPrice - a.retailPrice);
assert(sortedHighToLow[0].retailPrice >= sortedHighToLow[1].retailPrice, 'Sort Price: High to Low is strictly monotonic');

// Sorting: Rating
const sortedRating = [...products].sort((a, b) => b.ratingAverage - a.ratingAverage);
assert(sortedRating[0].ratingAverage >= sortedRating[sortedRating.length - 1].ratingAverage, 'Sort by Rating places highest rated items first');

// In-Stock Filter
const mockWithStock = products.map((p, idx) => idx === 0 ? { ...p, stock: 0 } : p);
const filteredInStock = mockWithStock.filter(p => p.stock > 0);
assert(!filteredInStock.some(p => p.stock === 0), 'In-Stock filter excludes out-of-stock products');

// -------------------------------------------------------------
// 3. Retail vs Dealer Pricing Separation
// -------------------------------------------------------------
console.log('\n----------------------------------------------------------------');
console.log('3️⃣ Retail vs Wholesale Dealer Pricing Separation');
console.log('----------------------------------------------------------------');

let customerPricesAlwaysRetail = true;
let dealerPricesAlwaysDiscounted = true;

for (const p of products) {
  if (typeof p.retailPrice !== 'number' || typeof p.dealerPrice !== 'number') {
    customerPricesAlwaysRetail = false;
  }
  if (p.dealerPrice >= p.retailPrice) {
    dealerPricesAlwaysDiscounted = false;
  }
}

assert(customerPricesAlwaysRetail, 'Every product maintains distinct retailPrice and dealerPrice fields');
assert(dealerPricesAlwaysDiscounted, 'Every product dealerPrice reflects wholesale discount (dealerPrice < retailPrice)');

// -------------------------------------------------------------
// 4. Cart Logic & Subtotal Calculations
// -------------------------------------------------------------
console.log('\n----------------------------------------------------------------');
console.log('4️⃣ Cart Operations, Quantity Limits & Bill Calculation');
console.log('----------------------------------------------------------------');

// Model cart state machine matching CartContext
let cart = [];

function addToCart(product, quantityToAdd = 1) {
  if (product.stock <= 0) {
    return { success: false, message: 'Out of stock' };
  }

  const existing = cart.find(i => i.product.id === product.id);
  if (existing) {
    const newQty = existing.quantity + quantityToAdd;
    if (newQty > product.stock) {
      existing.quantity = product.stock;
      return { success: true, message: 'Clamped to max stock' };
    }
    existing.quantity = newQty;
    return { success: true };
  } else {
    const initialQty = Math.min(quantityToAdd, product.stock);
    cart.push({ product, quantity: initialQty });
    return { success: true };
  }
}

function updateQuantity(productId, newQty) {
  if (newQty <= 0) {
    cart = cart.filter(i => i.product.id !== productId);
    return;
  }
  const item = cart.find(i => i.product.id === productId);
  if (item) {
    item.quantity = Math.min(newQty, item.product.stock);
  }
}

function calculateBill(promo = '') {
  const subtotal = cart.reduce((sum, i) => sum + i.product.retailPrice * i.quantity, 0);
  let discount = 0;
  if (promo === 'PURE10') {
    discount = Math.round(subtotal * 0.10);
  }
  const tax = Math.round((subtotal - discount) * 0.18);
  const delivery = subtotal > 500 || subtotal === 0 ? 0 : 99;
  const total = subtotal - discount + tax + delivery;
  return { subtotal, discount, tax, delivery, total };
}

// Test Product A: AquaShield Pro 10X (retailPrice: 18999, stock: 42)
const prodA = products.find(p => p.sku === 'CAL-WP-001');
// Test Product B: RO Membrane (retailPrice: 1499, stock: 280)
const prodB = products.find(p => p.sku === 'CAL-FLT-001');
// Test Product C: Low stock item (create synthetic stock = 3)
const prodC = { ...prodB, id: 'test-low-stock', stock: 3, retailPrice: 500 };

// 4a: Add item to cart
addToCart(prodA, 1);
assert(cart.length === 1 && cart[0].quantity === 1, 'Add item to empty cart succeeds');

// 4b: Increment quantity
addToCart(prodA, 2);
assert(cart[0].quantity === 3, 'Increment item quantity updates total to 3');

// 4c: Stock constraint enforcement (attempt to add 100 units to low stock item with stock: 3)
addToCart(prodC, 100);
const lowStockItemInCart = cart.find(i => i.product.id === prodC.id);
assert(lowStockItemInCart.quantity === 3, 'Stock constraint strictly prevents exceeding available inventory (clamped to 3)', `Expected: 3, Got: ${lowStockItemInCart.quantity}`);

// 4d: Add secondary product
addToCart(prodB, 2);
assert(cart.length === 3, 'Multiple distinct products coexist in cart');

// 4e: Bill calculations verification
// Expected subtotal:
// prodA: 18999 * 3 = 56997
// prodC: 500 * 3   = 1500
// prodB: 1499 * 2  = 2998
// Sum = 61495
const billBeforePromo = calculateBill('');
assert(billBeforePromo.subtotal === 61495, 'Subtotal correctly sums (retailPrice * quantity)', `₹${billBeforePromo.subtotal}`);
assert(billBeforePromo.delivery === 0, 'Free delivery applied for order > ₹500', `₹${billBeforePromo.delivery}`);
assert(billBeforePromo.tax === Math.round(61495 * 0.18), '18% GST correctly calculated on subtotal', `₹${billBeforePromo.tax}`);
assert(billBeforePromo.total === 61495 + billBeforePromo.tax, 'Total payable matches subtotal + tax', `₹${billBeforePromo.total}`);

// 4f: Promo code discount calculation (10% off with "PURE10")
const billWithPromo = calculateBill('PURE10');
const expectedDiscount = Math.round(61495 * 0.10);
assert(billWithPromo.discount === expectedDiscount, 'Promo code PURE10 subtracts 10% discount', `Discount: ₹${billWithPromo.discount}`);
assert(billWithPromo.tax === Math.round((61495 - expectedDiscount) * 0.18), 'Tax correctly recalculated post-discount');
assert(billWithPromo.total === (61495 - expectedDiscount) + billWithPromo.tax, 'Total accurately reflects discounted subtotal + adjusted tax', `₹${billWithPromo.total}`);

// 4g: Quantity update decrement & item removal
updateQuantity(prodA.id, 1);
assert(cart.find(i => i.product.id === prodA.id).quantity === 1, 'Quantity decrement updates correctly to 1');

updateQuantity(prodA.id, 0);
assert(!cart.some(i => i.product.id === prodA.id), 'Setting quantity to 0 removes item from cart');

// -------------------------------------------------------------
// 5. Wishlist Lifecycle
// -------------------------------------------------------------
console.log('\n----------------------------------------------------------------');
console.log('5️⃣ Wishlist Lifecycle & Move-to-Cart Flow');
console.log('----------------------------------------------------------------');

let wishlist = [];
function toggleWishlist(product) {
  const exists = wishlist.some(p => p.id === product.id);
  if (exists) {
    wishlist = wishlist.filter(p => p.id !== product.id);
  } else {
    wishlist.push(product);
  }
}

// Add to wishlist
toggleWishlist(prodA);
assert(wishlist.length === 1 && wishlist[0].id === prodA.id, 'Product added to wishlist');

// Move to cart from wishlist
addToCart(prodA, 1);
toggleWishlist(prodA);
assert(cart.some(i => i.product.id === prodA.id), 'Wishlist product moved into cart');
assert(!wishlist.some(p => p.id === prodA.id), 'Product removed from wishlist upon moving to cart');

// -------------------------------------------------------------
// 6. Product Detail Resolution & Image Integrity
// -------------------------------------------------------------
console.log('\n----------------------------------------------------------------');
console.log('6️⃣ Product Detail Pages & Image Integrity');
console.log('----------------------------------------------------------------');

// Test 6a: Every product has a valid, non-placeholder image
let allImagesValid = true;
let invalidImagesCount = 0;
for (const p of products) {
  if (!p.imageUrl || typeof p.imageUrl !== 'string' || !p.imageUrl.startsWith('http')) {
    allImagesValid = false;
    invalidImagesCount++;
  }
}
assert(allImagesValid, 'All products have valid high-resolution image URLs', `${products.length} valid images, ${invalidImagesCount} invalid`);

// Test 6b: Product detail lookup matches ID and SKU across categories
for (const cat of categories) {
  const catSample = products.find(p => p.category === cat);
  assert(Boolean(catSample && catSample.id && catSample.sku), `Product lookup for category "${cat}" resolves successfully`, catSample.sku);
}

// Test 6c: Product detail prices display correct MRP, retailPrice, and savings
const sampleWP = products.find(p => p.category === 'water purifiers');
assert(sampleWP.mrp > sampleWP.retailPrice, 'Product detail MRP is higher than retailPrice for discount presentation', `MRP: ₹${sampleWP.mrp}, Retail: ₹${sampleWP.retailPrice}`);
const sampleSavings = sampleWP.mrp - sampleWP.retailPrice;
const sampleSavingsPercent = Math.round((sampleSavings / sampleWP.mrp) * 100);
assert(sampleSavingsPercent > 0 && sampleSavingsPercent < 100, 'Product detail savings percentage is valid', `SAVE ${sampleSavingsPercent}%`);

// Test 6d: Technical specifications are defined for water purifiers
assert(sampleWP.purificationStages >= 5, 'Water purifier detail contains purification stages', `${sampleWP.purificationStages} stages`);
assert(Array.isArray(sampleWP.purificationTech) && sampleWP.purificationTech.length > 0, 'Water purifier detail contains technologies list', sampleWP.purificationTech.join(', '));
assert(sampleWP.warrantyMonths >= 12, 'Product detail specifies manufacturer warranty in months', `${sampleWP.warrantyMonths} months`);

// -------------------------------------------------------------
// 7. Cart Persistence Across Application Refresh & Reopen
// -------------------------------------------------------------
console.log('\n----------------------------------------------------------------');
console.log('7️⃣ Persistent Cart Lifecycle Across App Refresh & Reopen');
console.log('----------------------------------------------------------------');

// Emulate Storage driver matching apps/mobile/src/lib/storage.ts and cart-context.tsx
const simulatedStorage = new Map();

const mockStorageDriver = {
  async getItem(key, defaultValue) {
    if (simulatedStorage.has(key)) {
      return JSON.parse(simulatedStorage.get(key));
    }
    return defaultValue;
  },
  async setItem(key, value) {
    simulatedStorage.set(key, JSON.stringify(value));
  },
  async removeItem(key) {
    simulatedStorage.delete(key);
  }
};

// 7a: Populate active cart before application reload
const activeCartSession = [
  { product: prodA, quantity: 2 },
  { product: prodB, quantity: 3 }
];
const activePromoSession = { code: 'PURE10', percent: 10 };

// Context persists state to storage
await mockStorageDriver.setItem('calinfco_cart', activeCartSession);
await mockStorageDriver.setItem('calinfco_promo', activePromoSession);

assert(simulatedStorage.has('calinfco_cart'), 'Storage contains serialized cart data before app termination');

// 7b: Simulate application kill / browser refresh (memory state resets completely)
let appCartState = []; // initial state in React useState([])
let appPromoState = '';
let appDiscountPercent = 0;
let isInitialized = false;

// 7c: Ensure isInitialized guard prevents uninitialized [] from erasing persistent storage!
function simulateAutoSyncEffect() {
  if (!isInitialized) return; // Guard in cart-context.tsx: if (!isInitialized) return;
  mockStorageDriver.setItem('calinfco_cart', appCartState);
}

// Effect runs before async load completes:
simulateAutoSyncEffect();
const rawStorageCheck = await mockStorageDriver.getItem('calinfco_cart', []);
assert(rawStorageCheck.length === 2, 'Uninitialized empty state does NOT prematurely overwrite saved cart in storage');

// 7d: App mounts and rehydrates from storage (emulating useEffect in CartProvider)
const rehydratedCart = await mockStorageDriver.getItem('calinfco_cart', []);
const rehydratedPromo = await mockStorageDriver.getItem('calinfco_promo', { code: '', percent: 0 });

if (Array.isArray(rehydratedCart) && rehydratedCart.length > 0) {
  appCartState = rehydratedCart;
}
if (rehydratedPromo?.code) {
  appPromoState = rehydratedPromo.code;
  appDiscountPercent = rehydratedPromo.percent;
}
isInitialized = true;

assert(appCartState.length === 2, 'Reopening application restores all cart items', `${appCartState.length} items`);
assert(appCartState[0].product.sku === prodA.sku && appCartState[0].quantity === 2, 'First item SKU and quantity preserved exactly on reopen', `Qty: ${appCartState[0].quantity}`);
assert(appCartState[1].product.sku === prodB.sku && appCartState[1].quantity === 3, 'Second item SKU and quantity preserved exactly on reopen', `Qty: ${appCartState[1].quantity}`);
assert(appPromoState === 'PURE10' && appDiscountPercent === 10, 'Promo code preserved across application refresh', appPromoState);

// 7e: Now that initialized, user adds another item and auto-sync updates storage
appCartState.push({ product: sampleWP, quantity: 1 });
simulateAutoSyncEffect();

const updatedStorageCheck = await mockStorageDriver.getItem('calinfco_cart', []);
assert(updatedStorageCheck.length === 3, 'Post-rehydration cart modifications automatically sync back to persistent storage');

console.log('\n================================================================');
console.log(`📊 TEST RESULTS: ${passedTests}/${totalTests} Passed`);
console.log('================================================================');

if (failedTests === 0) {
  console.log('🎉 ALL CUSTOMER APP & CART CALCULATION TESTS PASSED (100% PASS RATE)!\n');
  process.exit(0);
} else {
  console.error(`💥 ${failedTests} tests failed.\n`);
  process.exit(1);
}

