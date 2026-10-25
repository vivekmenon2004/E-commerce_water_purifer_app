import { NextResponse } from 'next/server';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, isDemoMode } from '@/lib/firebase';
import { dispatchOrderStatusNotifications } from '@/lib/notification-dispatcher';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    const body = await request.json();
    const { status, trackingNotes, customerName, customerEmail, customerPhone } = body;

    if (!orderId || !status) {
      return NextResponse.json(
        { success: false, error: 'Order ID and status are required' },
        { status: 400 }
      );
    }

    const updatedTimestamp = new Date().toISOString();
    let recipientName = customerName || 'Valued Customer';
    let recipientEmail = customerEmail || '';
    let recipientPhone = customerPhone || '';
    let deviceToken = body.deviceToken;

    // If connected to live Firestore, update and pull latest customer/device info
    if (!isDemoMode && db) {
      try {
        const orderRef = doc(db, 'orders', orderId);
        const orderSnap = await getDoc(orderRef);

        if (orderSnap.exists()) {
          const orderData = orderSnap.data();
          recipientName = customerName || orderData.customerName || recipientName;
          recipientEmail = customerEmail || orderData.customerEmail || recipientEmail;
          recipientPhone = customerPhone || orderData.customerPhone || recipientPhone;

          // Attempt to find deviceToken from customer document if not known
          if (!deviceToken && orderData.customerId) {
            try {
              const custDoc = await getDoc(doc(db, 'users', orderData.customerId));
              if (custDoc.exists()) {
                deviceToken = custDoc.data()?.devicePushToken || custDoc.data()?.fcmToken;
              }
            } catch {
              // Non-blocking
            }
          }

          // Update order status in Firestore
          await updateDoc(orderRef, {
            orderStatus: status,
            updatedAt: updatedTimestamp,
            ...(trackingNotes ? { trackingNotes } : {}),
          });
        }
      } catch (err) {
        console.warn(`[Server Order Status] Firestore update warning for ${orderId}:`, err);
      }
    }

    // Trigger multi-channel notifications (Push, Email, SMS) from trusted server logic
    const dispatchResults = await dispatchOrderStatusNotifications({
      orderId,
      customerName: recipientName,
      customerEmail: recipientEmail,
      customerPhone: recipientPhone,
      deviceToken,
      newStatus: status,
      trackingNotes,
    });

    return NextResponse.json({
      success: true,
      orderId,
      status,
      updatedAt: updatedTimestamp,
      notifications: dispatchResults,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { success: false, error: 'Server error updating order status: ' + err.message },
      { status: 500 }
    );
  }
}
