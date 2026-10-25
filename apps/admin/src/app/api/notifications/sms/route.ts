import { NextResponse } from 'next/server';
import { sendSmsNotification, sendOrderStatusSms } from '@/lib/sms-service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, message, orderId, status } = body;

    if (!phone) {
      return NextResponse.json(
        { success: false, error: 'Recipient phone number is required' },
        { status: 400 }
      );
    }

    if (orderId && status) {
      const res = await sendOrderStatusSms({
        phone,
        orderId,
        status,
      });
      return NextResponse.json(res);
    }

    if (!message) {
      return NextResponse.json(
        { success: false, error: 'Message body or order details required' },
        { status: 400 }
      );
    }

    const res = await sendSmsNotification({
      recipientPhone: phone,
      messageText: message,
    });

    return NextResponse.json(res);
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { success: false, error: 'Internal SMS gateway error: ' + err.message },
      { status: 500 }
    );
  }
}
