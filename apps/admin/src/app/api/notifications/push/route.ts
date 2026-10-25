import { NextResponse } from 'next/server';
import { sendServerPushNotification, sendOrderStatusPushNotification } from '@/lib/push-notification-service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, title, message, orderId, status, customerName } = body;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Recipient device token is required' },
        { status: 400 }
      );
    }

    if (orderId && status) {
      const res = await sendOrderStatusPushNotification({
        deviceToken: token,
        orderId,
        customerName: customerName || 'Valued Customer',
        status,
      });
      return NextResponse.json(res);
    }

    if (!title || !message) {
      return NextResponse.json(
        { success: false, error: 'Push notification title and message are required' },
        { status: 400 }
      );
    }

    const res = await sendServerPushNotification({
      to: token,
      title,
      body: message,
      channelId: 'order-updates',
    });

    return NextResponse.json(res);
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { success: false, error: 'Internal push notification error: ' + err.message },
      { status: 500 }
    );
  }
}
