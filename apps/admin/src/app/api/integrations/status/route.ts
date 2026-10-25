import { NextResponse } from 'next/server';
import { isPushConfigured } from '@/lib/push-notification-service';
import { isEmailConfigured } from '@/lib/email-service';
import { isSmsConfigured } from '@/lib/sms-service';
import { isDemoMode } from '@/lib/firebase';

export async function GET() {
  return NextResponse.json({
    timestamp: new Date().toISOString(),
    integrations: {
      push: {
        name: 'Android FCM & Expo Push',
        configured: isPushConfigured(),
        status: isPushConfigured() ? 'configured' : 'unconfigured',
        details: isPushConfigured()
          ? 'FCM server key or Expo gateway active'
          : 'Missing FCM_SERVER_KEY / EXPO_ACCESS_TOKEN (device tokens registered will queue)',
      },
      email: {
        name: 'EmailJS Transactional Email',
        configured: isEmailConfigured(),
        status: isEmailConfigured() ? 'configured' : 'unconfigured',
        details: isEmailConfigured()
          ? 'EmailJS service, template, and public key verified'
          : 'Missing EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, or EMAILJS_PUBLIC_KEY',
      },
      sms: {
        name: 'TextBee SMS Gateway',
        configured: isSmsConfigured(),
        status: isSmsConfigured() ? 'configured' : 'unconfigured',
        details: isSmsConfigured()
          ? 'TextBee API key and device ID verified'
          : 'Missing TEXTBEE_API_KEY or TEXTBEE_DEVICE_ID in server environment',
      },
      osm: {
        name: 'OpenStreetMap & Nominatim Geocoder',
        configured: true,
        status: 'configured',
        details: 'Zero-cost OpenStreetMap API with client-side fallback manual entry',
      },
      database: {
        name: 'Firebase Firestore',
        configured: !isDemoMode,
        status: !isDemoMode ? 'configured' : 'demo_mode',
        details: !isDemoMode
          ? 'Live Firestore database connected'
          : 'Running in resilient demo memory mode (configure FIREBASE_API_KEY for live persistence)',
      },
    },
  });
}
