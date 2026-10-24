#!/usr/bin/env node
/**
 * Calinfco Water Purifiers - Secure Admin Provisioning CLI Tool
 *
 * Securely assigns the 'admin' role and sets custom user claims (admin: true)
 * using the trusted Firebase Admin SDK.
 *
 * Security Note:
 *   Clients can NEVER self-assign the admin role. Admin status must be granted
 *   via this trusted server-side script or directly within the Firebase Console.
 *
 * Usage:
 *   node scripts/provision-admin.mjs --email admin@calinfco.com
 *   node scripts/provision-admin.mjs --uid <AUTH_UID>
 */

import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
function getArg(flag) {
  const index = args.indexOf(flag);
  return index !== -1 && args[index + 1] ? args[index + 1] : null;
}

const targetEmail = getArg('--email');
const targetUid = getArg('--uid');

console.log('---------------------------------------------------------');
console.log('🔐 Calinfco Trusted Admin Provisioning Tool');
console.log('---------------------------------------------------------');

if (!targetEmail && !targetUid) {
  console.log('Usage:');
  console.log('  node scripts/provision-admin.mjs --email <admin-email>');
  console.log('  node scripts/provision-admin.mjs --uid <firebase-auth-uid>');
  console.log('\nExample:');
  console.log('  node scripts/provision-admin.mjs --email admin@calinfco.com\n');
  process.exit(1);
}

async function provisionAdmin() {
  const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || 
    path.resolve(process.cwd(), 'service-account.json');

  let adminSDK;
  try {
    adminSDK = await import('firebase-admin');
  } catch (err) {
    console.error('❌ "firebase-admin" is required for server-side CLI provisioning.');
    console.log('   Install with: npm install --save-dev firebase-admin');
    console.log('\n📖 Alternative: You can provision directly in the Firebase Console:');
    console.log('   1. Open Firebase Console -> Firestore Database -> users collection');
    console.log('   2. Select the user document by UID and set field "role": "admin"');
    console.log('   See docs/ADMIN_PROVISIONING.md for full step-by-step instructions.');
    process.exit(0);
  }

  const { initializeApp, cert, getApps } = adminSDK.default || adminSDK;
  const { getAuth } = await import('firebase-admin/auth');
  const { getFirestore } = await import('firebase-admin/firestore');

  let app;
  if (fs.existsSync(serviceAccountPath)) {
    console.log(`🔑 Loading service account credentials from: ${serviceAccountPath}`);
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    app = getApps().length === 0 ? initializeApp({ credential: cert(serviceAccount) }) : getApps()[0];
  } else if (process.env.FIREBASE_CONFIG) {
    app = getApps().length === 0 ? initializeApp() : getApps()[0];
  } else {
    console.warn('⚠️ No service-account.json or GOOGLE_APPLICATION_CREDENTIALS found.');
    console.log('\n📋 Follow the Firebase Console Manual Provisioning Steps:');
    console.log('   1. Go to Firebase Console -> Authentication -> Users');
    console.log(`   2. Find user: ${targetEmail || targetUid}`);
    console.log('   3. Copy their User UID');
    console.log('   4. Go to Firestore Database -> "users" collection -> document {UID}');
    console.log('   5. Set field: "role" = "admin" (string)');
    console.log('   6. Done! The user is now securely authorized as Admin.');
    console.log('\nRefer to docs/ADMIN_PROVISIONING.md for complete details.');
    process.exit(0);
  }

  const auth = getAuth(app);
  const db = getFirestore(app);

  try {
    let userRecord;
    if (targetUid) {
      userRecord = await auth.getUser(targetUid);
    } else {
      userRecord = await auth.getUserByEmail(targetEmail);
    }

    console.log(`👤 Found user: ${userRecord.email} (UID: ${userRecord.uid})`);

    // 1. Set Custom User Claims: { admin: true }
    await auth.setCustomUserClaims(userRecord.uid, {
      ...userRecord.customClaims,
      admin: true,
    });
    console.log('✅ Set custom claim { admin: true } on Firebase Auth record.');

    // 2. Upsert Firestore document in 'users' collection
    const userDocRef = db.collection('users').doc(userRecord.uid);
    await userDocRef.set({
      id: userRecord.uid,
      email: userRecord.email,
      name: userRecord.displayName || 'Calinfco Administrator',
      role: 'admin',
      dealerStatus: 'none',
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    console.log(`✅ Updated Firestore document users/${userRecord.uid} with role: 'admin'.`);
    console.log('\n🎉 Admin account successfully provisioned!');
  } catch (err) {
    console.error('❌ Provisioning failed:', err.message);
  }
}

provisionAdmin();
