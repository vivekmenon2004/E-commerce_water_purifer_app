import { NextResponse } from 'next/server';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, isDemoMode } from '@/lib/firebase';
import { dispatchDealerStatusNotifications } from '@/lib/notification-dispatcher';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const body = await request.json();
    const { status, reason, dealerName, contactPerson, email, phone } = body;

    if (!userId || !status || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Valid userId and status (approved | rejected) are required' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    let recipientBusiness = dealerName || 'Authorized Dealership';
    let recipientPerson = contactPerson || dealerName || 'Valued Partner';
    let recipientEmail = email || '';
    let recipientPhone = phone || '';
    let deviceToken = body.deviceToken;

    // In live Firestore mode, update dealer status and fetch device push token
    if (!isDemoMode && db) {
      try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const uData = userSnap.data();
          recipientBusiness = uData.dealerDetails?.businessName || dealerName || recipientBusiness;
          recipientPerson = uData.dealerDetails?.ownerName || uData.name || contactPerson || recipientPerson;
          recipientEmail = uData.email || email || recipientEmail;
          recipientPhone = uData.phone || phone || recipientPhone;
          deviceToken = deviceToken || uData.devicePushToken || uData.fcmToken;

          if (status === 'approved') {
            await updateDoc(userRef, {
              role: 'dealer',
              dealerStatus: 'approved',
              'dealerDetails.reviewedAt': now,
              'dealerDetails.reviewedBy': 'admin',
              updatedAt: now,
            });
          } else {
            await updateDoc(userRef, {
              dealerStatus: 'rejected',
              'dealerDetails.rejectionReason': reason || 'Documentation requirements not met',
              'dealerDetails.reviewedAt': now,
              'dealerDetails.reviewedBy': 'admin',
              updatedAt: now,
            });
          }
        }
      } catch (err) {
        console.warn(`[Server Dealer Status] Firestore update warning for user ${userId}:`, err);
      }
    }

    // Trigger multi-channel notifications (Push, Email, SMS) from trusted server logic
    const dispatchResults = await dispatchDealerStatusNotifications({
      dealerName: recipientBusiness,
      contactPerson: recipientPerson,
      email: recipientEmail,
      phone: recipientPhone,
      deviceToken,
      status: status as 'approved' | 'rejected',
      notes: reason,
    });

    return NextResponse.json({
      success: true,
      userId,
      status,
      updatedAt: now,
      notifications: dispatchResults,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { success: false, error: 'Server error updating dealer status: ' + err.message },
      { status: 500 }
    );
  }
}
