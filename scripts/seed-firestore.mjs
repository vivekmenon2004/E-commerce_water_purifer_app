#!/usr/bin/env node
/**
 * Calinfco Water Purifiers - Repeatable Firestore Product & Mock Collection Seed Script
 *
 * Seeds 65 realistic products across:
 * - water purifiers (15)
 * - dispensers (12)
 * - pumps (12)
 * - filters (14)
 * - spare parts (12)
 *
 * Usage:
 *   node scripts/seed-firestore.mjs [--dry-run] [--emulator]
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const seedDataPath = path.resolve(__dirname, '../data/seed-products.json');
const products = JSON.parse(fs.readFileSync(seedDataPath, 'utf8'));

const isDryRun = process.argv.includes('--dry-run');
const isEmulator = process.argv.includes('--emulator');

console.log('----------------------------------------------------');
console.log('💧 Calinfco Firestore Repeatable Product Seeder');
console.log('----------------------------------------------------');
console.log(`📦 Loaded ${products.length} products from ${seedDataPath}`);

// 1. Validation check
const categoryCounts = {};
let validationFailed = false;

for (const p of products) {
  categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;

  if (!p.id || !p.sku || !p.name || !p.category || !p.description || !p.imageUrl) {
    console.error(`❌ Product validation failed: Missing required fields in ${JSON.stringify(p)}`);
    validationFailed = true;
  }

  if (typeof p.retailPrice !== 'number' || typeof p.dealerPrice !== 'number' || typeof p.stock !== 'number') {
    console.error(`❌ Product validation failed: Invalid pricing or stock in ${p.sku}`);
    validationFailed = true;
  }

  if (p.dealerPrice >= p.retailPrice) {
    console.warn(`⚠️ Warning: Dealer price is not lower than retail price for ${p.sku}`);
  }
}

if (validationFailed) {
  process.exit(1);
}

console.log('\n📊 Category breakdown:');
for (const [cat, count] of Object.entries(categoryCounts)) {
  console.log(`   - ${cat.padEnd(18)}: ${count} products`);
}

if (isDryRun) {
  console.log('\n✅ Dry run completed successfully! All 65 products validated.');
  process.exit(0);
}

// 2. Perform Firestore seeding
async function runSeed() {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'calinfco-water-purifiers';
  const apiKey = process.env.FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

  if (isEmulator) {
    process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080';
    console.log(`\n🔌 Connecting to local Firestore Emulator at ${process.env.FIRESTORE_EMULATOR_HOST}...`);
  }

  try {
    const { initializeApp } = await import('firebase/app');
    const { getFirestore, doc, setDoc, connectFirestoreEmulator } = await import('firebase/firestore');

    const app = initializeApp({
      apiKey: apiKey || 'demo-calinfco-api-key',
      projectId: projectId,
      authDomain: `${projectId}.firebaseapp.com`,
    });

    const db = getFirestore(app);

    if (isEmulator) {
      connectFirestoreEmulator(db, '127.0.0.1', 8080);
    }

    console.log(`\n🚀 Seeding ${products.length} products to collection "products"...`);
    let written = 0;

    for (const product of products) {
      const docRef = doc(db, 'products', product.id);
      await setDoc(docRef, {
        ...product,
        updatedAt: new Date().toISOString(),
        createdAt: product.createdAt || new Date().toISOString(),
      }, { merge: true });

      written++;
      process.stdout.write(`\r   Progress: [${written}/${products.length}] ${product.sku} - ${product.name.slice(0, 30)}...`);
    }

    console.log(`\n\n✅ Successfully seeded ${written} products into Cloud Firestore!`);
  } catch (err) {
    console.error('\n❌ Could not connect to live Firestore instance:', err.message);
    console.log('\n💡 Note: To run this against your live Firebase project:');
    console.log('   1. Ensure your .env.local contains NEXT_PUBLIC_FIREBASE_API_KEY & NEXT_PUBLIC_FIREBASE_PROJECT_ID');
    console.log('   2. Or run with local emulator: node scripts/seed-firestore.mjs --emulator');
    console.log('   3. Both apps also automatically fall back to the embedded 65-product seed dataset in Demo Mode!');
  }
}

runSeed();
