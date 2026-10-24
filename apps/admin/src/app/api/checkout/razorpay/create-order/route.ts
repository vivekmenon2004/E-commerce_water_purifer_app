import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount, currency = 'INR', receipt, notes = {} } = body;

    const amountInPaise = Math.round(Number(amount) * 100);
    if (!amountInPaise || amountInPaise <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid order amount' },
        { status: 400 }
      );
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    // Check if live Razorpay test keys are provided
    if (keyId && keySecret) {
      try {
        const credentials = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
        const res = await fetch('https://api.razorpay.com/v1/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${credentials}`,
          },
          body: JSON.stringify({
            amount: amountInPaise,
            currency,
            receipt: receipt || `rcpt_${Date.now()}`,
            notes,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          console.warn('[Razorpay API] Live order creation error:', errData);
          throw new Error(errData?.error?.description || 'Razorpay order creation failed');
        }

        const data = await res.json();
        return NextResponse.json({
          success: true,
          isMock: false,
          keyId: keyId, // Public key ID is safe to return to client
          orderId: data.id,
          amount: data.amount,
          currency: data.currency,
          receipt: data.receipt,
        });
      } catch (liveErr: any) {
        console.warn('[Razorpay API] Falling back to labeled mock mode:', liveErr.message);
        // Fall back gracefully to mock mode if sandbox API fails or network issue
      }
    }

    // Clearly labeled mock-payment fallback
    const mockOrderId = `order_mock_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
    const mockKeyId = keyId || 'rzp_test_mock_calinfco';

    return NextResponse.json({
      success: true,
      isMock: true,
      keyId: mockKeyId,
      orderId: mockOrderId,
      amount: amountInPaise,
      currency,
      receipt: receipt || `rcpt_mock_${Date.now()}`,
      message: 'Razorpay Test Mode: Mock payment fallback active (RAZORPAY_KEY_SECRET is not configured or in sandbox mode)',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Razorpay order creation failed' },
      { status: 500 }
    );
  }
}
