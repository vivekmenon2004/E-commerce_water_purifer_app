import { NextResponse } from 'next/server';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { db, isDemoMode } from '@/lib/firebase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, pushToken, nativeFcmToken, devicePlatform } = body;

    const effectiveToken = pushToken || body.token;

    if (!userId || !effectiveToken) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: userId and token / pushToken' },
        { status: 400 }
      );
    }

    const payload = {
      devicePushToken: effectiveToken,
      pushToken: effectiveToken,
      nativeFcmToken: nativeFcmToken || null,
      devicePlatform: devicePlatform || body.platform || 'android',
      pushTokenUpdatedAt: new Date().toISOString(),
    };

    if (!isDemoMode && db) {
      try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, payload);
      } catch {
        const userRef = doc(db, 'users', userId);
        await setDoc(userRef, payload, { merge: true });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Device push token registered securely on server',
      tokenSaved: {
        userId,
        platform: devicePlatform || 'android',
        timestamp: payload.pushTokenUpdatedAt,
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { success: false, error: 'Failed to save device token: ' + err.message },
      { status: 500 }
    );
  }
}
