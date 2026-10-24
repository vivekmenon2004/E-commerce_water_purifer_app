import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { doc, getDoc } from 'firebase/firestore';
import { db, isDemoMode, INITIAL_DEMO_USERS } from '@/lib/firebase';

// Load authoritative seed products for server-side trusted price & stock verification
function getAuthoritativeProducts() {
  try {
    const seedPath = path.resolve(process.cwd(), '../../data/seed-products.json');
    if (fs.existsSync(seedPath)) {
      return JSON.parse(fs.readFileSync(seedPath, 'utf8'));
    }
  } catch (e) {
    console.warn('[Server Validate] Could not read local seed-products.json:', e);
  }
  return [];
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items, promoCode, userRole = 'customer', customerId } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { valid: false, errors: ['Cart is empty or invalid'] },
        { status: 400 }
      );
    }

    // 1. Authoritative Role & Dealer Approval Verification
    // ZERO TRUST: Never trust userRole passed from client.
    let isVerifiedDealer = false;
    let userDealerStatus = 'none';

    if (customerId) {
      if (!isDemoMode && db) {
        try {
          const userSnap = await getDoc(doc(db, 'users', customerId));
          if (userSnap.exists()) {
            const data = userSnap.data();
            userDealerStatus = data.dealerStatus || 'none';
            isVerifiedDealer = data.role === 'dealer' && data.dealerStatus === 'approved';
          }
        } catch (err) {
          console.warn('[Server Validate] Error checking Firestore user role:', err);
        }
      } else {
        const demoUser = INITIAL_DEMO_USERS.find(u => u.id === customerId);
        if (demoUser) {
          userDealerStatus = demoUser.dealerStatus || 'none';
          isVerifiedDealer = demoUser.role === 'dealer' && demoUser.dealerStatus === 'approved';
        }
      }
    }

    const errors: string[] = [];
    const warnings: string[] = [];

    // If client claimed dealer prices but is NOT an approved dealer, strictly refuse wholesale pricing
    if (userRole === 'dealer' && !isVerifiedDealer) {
      warnings.push(
        `Wholesale dealer pricing requires an approved dealer account. Status: "${userDealerStatus}". Standard retail pricing applied.`
      );
    }

    const effectiveRole: 'customer' | 'dealer' = isVerifiedDealer ? 'dealer' : 'customer';

    // 2. Validate Products, Pricing & Stock
    const authoritativeProducts = getAuthoritativeProducts();
    const verifiedItems: any[] = [];
    let subtotal = 0;

    for (const item of items) {
      const product = authoritativeProducts.find(
        (p: any) => p.id === item.productId || p.sku === item.sku
      );

      if (!product) {
        errors.push(`Product "${item.name || item.sku}" is not found in the verified catalog.`);
        continue;
      }

      if (!product.isActive) {
        errors.push(`Product "${product.name}" is currently inactive.`);
        continue;
      }

      if (product.stock <= 0) {
        errors.push(`Product "${product.name}" is completely out of stock.`);
        continue;
      }

      const verifiedStock = product.stock;
      const requestedQty = Math.max(1, Number(item.quantity) || 1);
      const approvedQty = Math.min(requestedQty, verifiedStock);

      if (requestedQty > verifiedStock) {
        warnings.push(
          `Requested quantity (${requestedQty}) for "${product.name}" exceeds warehouse inventory (${verifiedStock}). Clamped to ${approvedQty}.`
        );
      }

      // Authoritative pricing: strictly enforce server price
      const verifiedUnitPrice = effectiveRole === 'dealer' ? product.dealerPrice : product.retailPrice;
      const lineTotal = verifiedUnitPrice * approvedQty;

      subtotal += lineTotal;

      verifiedItems.push({
        productId: product.id,
        sku: product.sku,
        name: product.name,
        category: product.category,
        unitPrice: verifiedUnitPrice,
        mrp: product.mrp,
        quantity: approvedQty,
        total: lineTotal,
        imageUrl: product.imageUrl,
      });
    }

    if (errors.length > 0 && verifiedItems.length === 0) {
      return NextResponse.json({ valid: false, errors, warnings }, { status: 422 });
    }

    // 3. Server-side Calculation of Promo Discount & Taxes
    let discount = 0;
    const cleanPromo = (promoCode || '').toString().trim().toUpperCase();
    if (cleanPromo === 'PURE10') {
      discount = Math.round(subtotal * 0.10);
    } else if (cleanPromo === 'CALINFCO500') {
      discount = Math.round(subtotal * 0.15);
    }

    const discountedBase = Math.max(0, subtotal - discount);
    const tax = Math.round(discountedBase * 0.18); // 18% GST
    const deliveryFee = subtotal > 500 || subtotal === 0 ? 0 : 99;
    const totalAmount = discountedBase + tax + deliveryFee;

    return NextResponse.json({
      valid: true,
      effectiveRole,
      isVerifiedDealer,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
      verifiedSummary: {
        items: verifiedItems,
        subtotal,
        discount,
        tax,
        deliveryFee,
        totalAmount,
        itemCount: verifiedItems.reduce((acc, i) => acc + i.quantity, 0),
        currency: 'INR',
        validatedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('[Server Validate Error]:', error);
    return NextResponse.json(
      { valid: false, errors: ['Failed to validate cart with server: ' + error.message] },
      { status: 500 }
    );
  }
}
