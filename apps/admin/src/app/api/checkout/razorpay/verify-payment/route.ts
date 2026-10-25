import { NextResponse } from 'next/server';
import crypto from 'node:crypto';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, isMock } = body;

    if (!razorpayOrderId || !razorpayPaymentId) {
      return NextResponse.json(
        { verified: false, error: 'Missing payment verification credentials' },
        { status: 400 }
      );
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    // 1. Live verification if keySecret is available and transaction is not mock
    if (keySecret && !isMock) {
      const generatedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex');

      const isMatch = crypto.timingSafeEqual(
        Buffer.from(generatedSignature),
        Buffer.from(razorpaySignature || '')
      );

      if (isMatch) {
        return NextResponse.json({
          verified: true,
          isMock: false,
          paymentId: razorpayPaymentId,
          orderId: razorpayOrderId,
          message: 'Razorpay signature verified successfully',
        });
      } else {
        return NextResponse.json(
          { verified: false, error: 'Razorpay signature mismatch' },
          { status: 400 }
        );
      }
    }

    // 2. Labeled Mock Payment verification
    // Mock signature follows format: mock_sig_<paymentId> or starts with mock_sig_
    const isMockValid =
      isMock ||
      razorpayOrderId.startsWith('order_mock_') ||
      (razorpaySignature && razorpaySignature.startsWith('mock_sig_'));

    if (isMockValid) {
      return NextResponse.json({
        verified: true,
        isMock: true,
        paymentId: razorpayPaymentId,
        orderId: razorpayOrderId,
        message: 'Mock payment verified successfully (Test fallback mode)',
      });
    }

    return NextResponse.json(
      { verified: false, error: 'Payment verification failed' },
      { status: 400 }
    );
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json(
      { verified: false, error: error.message || 'Signature verification error' },
      { status: 500 }
    );
  }
}
