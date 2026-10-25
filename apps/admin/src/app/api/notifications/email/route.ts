import { NextResponse } from 'next/server';
import { sendEmailNotification, sendOrderStatusEmail } from '@/lib/email-service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { toEmail, toName, subject, orderId, status, customerName, templateParams } = body;

    if (!toEmail) {
      return NextResponse.json(
        { success: false, error: 'Recipient email address (toEmail) is required' },
        { status: 400 }
      );
    }

    if (orderId && status) {
      const res = await sendOrderStatusEmail({
        orderId,
        customerName: customerName || toName || 'Valued Customer',
        customerEmail: toEmail,
        newStatus: status,
        trackingNotes: templateParams?.trackingNotes,
      });
      return NextResponse.json(res);
    }

    if (!subject) {
      return NextResponse.json(
        { success: false, error: 'Subject or order details required' },
        { status: 400 }
      );
    }

    const res = await sendEmailNotification({
      toEmail,
      toName: toName || 'Customer',
      subject,
      templateParams: templateParams || {},
    });

    return NextResponse.json(res);
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { success: false, error: 'Internal email gateway error: ' + err.message },
      { status: 500 }
    );
  }
}
