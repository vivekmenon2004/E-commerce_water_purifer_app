import { NextResponse } from 'next/server';
import { doc, setDoc } from 'firebase/firestore';
import { db, isDemoMode } from '@/lib/firebase';

// Server-side in-memory idempotency registry (persists across requests in runtime)
const processedPayments = new Map<string, any>();
const processedIdempotencyKeys = new Map<string, any>();

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
      subtotal,
      discount = 0,
      tax = 0,
      deliveryFee = 0,
      totalAmount,
      paymentMethod = 'upi',
      paymentStatus = 'paid',
      shippingAddress,
      idempotencyKey,
      paymentDetails,
      deliveryNotes,
    } = body;

    if (!customerId || !items || !Array.isArray(items) || items.length === 0 || !shippingAddress) {
      return NextResponse.json(
        { success: false, error: 'Missing required order fields' },
        { status: 400 }
      );
    }

    // 1. Idempotency Check (Prevent duplicate order creation after payment callbacks)
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

    // 2. Generate Order Record
    const orderId = `ORD-${Date.now().toString().slice(-6)}`;
    const now = new Date().toISOString();

    const newOrder = {
      id: orderId,
      customerId,
      customerName,
      customerEmail,
      customerPhone,
      userRoleAtPurchase,
      items,
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

    // 3. Register in idempotency cache
    if (idempotencyKey) {
      processedIdempotencyKeys.set(idempotencyKey, newOrder);
    }
    if (paymentId) {
      processedPayments.set(paymentId, newOrder);
    }

    // 4. Save to Firestore if connected
    if (!isDemoMode && db) {
      try {
        const orderRef = doc(db as any, 'orders', orderId);
        await setDoc(orderRef, newOrder);
      } catch (dbErr) {
        console.warn('[Admin API] Could not write order to Firestore, cached in runtime:', dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      isDuplicate: false,
      orderId: newOrder.id,
      order: newOrder,
      message: 'Order placed successfully',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Order creation failed' },
      { status: 500 }
    );
  }
}
