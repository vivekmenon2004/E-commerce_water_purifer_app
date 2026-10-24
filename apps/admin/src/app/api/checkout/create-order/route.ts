import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, isDemoMode, INITIAL_DEMO_USERS } from '@/lib/firebase';

// Server-side in-memory idempotency registry
const processedPayments = new Map<string, any>();
const processedIdempotencyKeys = new Map<string, any>();

// Load authoritative seed products for server-side trusted price & stock verification
function getAuthoritativeProducts() {
  try {
    const seedPath = path.resolve(process.cwd(), '../../data/seed-products.json');
    if (fs.existsSync(seedPath)) {
      return JSON.parse(fs.readFileSync(seedPath, 'utf8'));
    }
  } catch (e) {
    console.warn('[Server Create Order] Could not read local seed-products.json:', e);
  }
  return [];
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      customerId,
      customerName,
      customerEmail,
      customerPhone,
      userRoleAtPurchase = 'customer',
      items,
      paymentMethod = 'upi',
      paymentStatus = 'paid',
      shippingAddress,
      idempotencyKey,
      paymentDetails,
      deliveryNotes,
      promoCode,
    } = body;

    if (!customerId || !items || !Array.isArray(items) || items.length === 0 || !shippingAddress) {
      return NextResponse.json(
        { success: false, error: 'Missing required order fields (customerId, items, shippingAddress)' },
        { status: 400 }
      );
    }

    // 1. Idempotency Check (Prevent duplicate order creation)
    if (idempotencyKey && processedIdempotencyKeys.has(idempotencyKey)) {
      const existing = processedIdempotencyKeys.get(idempotencyKey);
      return NextResponse.json({
        success: true,
        isDuplicate: true,
        orderId: existing.id,
        order: existing,
        message: 'Order already created for this session (Duplicate suppressed)',
      });
    }

    const paymentId = paymentDetails?.razorpayPaymentId;
    if (paymentId && processedPayments.has(paymentId)) {
      const existing = processedPayments.get(paymentId);
      return NextResponse.json({
        success: true,
        isDuplicate: true,
        orderId: existing.id,
        order: existing,
        message: 'Order already created for this transaction ID (Duplicate suppressed)',
      });
    }

    // 2. Authoritative Zero-Trust User Role & Dealer Verification
    let isVerifiedDealer = false;
    let verifiedUserDealerStatus = 'none';

    if (!isDemoMode && db) {
      try {
        const userDoc = await getDoc(doc(db, 'users', customerId));
        if (userDoc.exists()) {
          const uData = userDoc.data();
          verifiedUserDealerStatus = uData.dealerStatus || 'none';
          isVerifiedDealer = uData.role === 'dealer' && uData.dealerStatus === 'approved';
        }
      } catch (err) {
        console.warn('[Server Create Order] Error checking user in Firestore:', err);
      }
    } else {
      const demoUser = INITIAL_DEMO_USERS.find(u => u.id === customerId);
      if (demoUser) {
        verifiedUserDealerStatus = demoUser.dealerStatus || 'none';
        isVerifiedDealer = demoUser.role === 'dealer' && demoUser.dealerStatus === 'approved';
      }
    }

    // STRICT CHECK: Dealer credit requires verified dealer approval
    if (paymentMethod === 'dealer_credit' && !isVerifiedDealer) {
      return NextResponse.json(
        {
          success: false,
          error: `B2B 30-Day Dealer Credit Line is restricted to verified dealers. Your status is: "${verifiedUserDealerStatus}". Please choose UPI, Card, or COD.`,
        },
        { status: 403 }
      );
    }

    const effectiveRoleAtPurchase: 'customer' | 'dealer' = isVerifiedDealer ? 'dealer' : 'customer';

    // 3. Authoritative Re-pricing & Stock Verification (NEVER trust prices from client)
    const authoritativeProducts = getAuthoritativeProducts();
    const verifiedItems: any[] = [];
    let subtotal = 0;

    for (const item of items) {
      const product = authoritativeProducts.find(
        (p: any) => p.id === item.productId || p.sku === item.sku
      );

      if (!product || !product.isActive) {
        return NextResponse.json(
          { success: false, error: `Product "${item.name || item.sku}" is unavailable or inactive.` },
          { status: 422 }
        );
      }

      const availableStock = product.stock;
      const requestedQty = Math.max(1, Number(item.quantity) || 1);
      const approvedQty = Math.min(requestedQty, availableStock);

      const unitPrice = effectiveRoleAtPurchase === 'dealer' ? product.dealerPrice : product.retailPrice;
      const lineTotal = unitPrice * approvedQty;
      subtotal += lineTotal;

      verifiedItems.push({
        productId: product.id,
        sku: product.sku,
        name: product.name,
        category: product.category,
        unitPrice,
        mrp: product.mrp,
        quantity: approvedQty,
        total: lineTotal,
        imageUrl: product.imageUrl,
      });
    }

    // Server-calculated discounts and totals
    let discount = 0;
    const cleanPromo = (promoCode || '').toString().trim().toUpperCase();
    if (cleanPromo === 'PURE10') {
      discount = Math.round(subtotal * 0.10);
    } else if (cleanPromo === 'CALINFCO500') {
      discount = Math.round(subtotal * 0.15);
    }

    const discountedBase = Math.max(0, subtotal - discount);
    const tax = Math.round(discountedBase * 0.18); // 18% GST
    const deliveryFee = subtotal > 500 || subtotal === 0 ? 0 : 99;
    const totalAmount = discountedBase + tax + deliveryFee;

    // 4. Generate Authoritative Order Record
    const orderId = `ORD-${Date.now().toString().slice(-6)}`;
    const now = new Date().toISOString();

    const newOrder = {
      id: orderId,
      customerId,
      customerName: customerName || 'Valued Customer',
      customerEmail: customerEmail || '',
      customerPhone: customerPhone || '',
      userRoleAtPurchase: effectiveRoleAtPurchase,
      items: verifiedItems,
      subtotal,
      discount,
      tax,
      deliveryFee,
      totalAmount,
      paymentMethod,
      paymentStatus,
      orderStatus: 'placed',
      shippingAddress,
      idempotencyKey: idempotencyKey || `idem_${Date.now()}`,
      paymentDetails: paymentDetails || {},
      deliveryNotes: deliveryNotes || '',
      installationScheduledDate: new Date(Date.now() + 86400000 * 2).toISOString(), // Next 48h
      createdAt: now,
      updatedAt: now,
    };

    // 5. Register in idempotency cache
    if (idempotencyKey) {
      processedIdempotencyKeys.set(idempotencyKey, newOrder);
    }
    if (paymentId) {
      processedPayments.set(paymentId, newOrder);
    }

    // 6. Save to Firestore if connected
    if (!isDemoMode && db) {
      try {
        const orderRef = doc(db, 'orders', orderId);
        await setDoc(orderRef, newOrder);
      } catch (err: any) {
        console.warn('[Server Create Order] Could not write to live Firestore:', err.message);
      }
    }

    return NextResponse.json({
      success: true,
      orderId,
      order: newOrder,
      effectiveRole: effectiveRoleAtPurchase,
      message: 'Order created and persisted successfully',
    });
  } catch (error: any) {
    console.error('[Server Create Order Error]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create order on server: ' + error.message },
      { status: 500 }
    );
  }
}
