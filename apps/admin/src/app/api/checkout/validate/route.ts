import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';

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
    const { items, promoCode, userRole = 'customer' } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { valid: false, errors: ['Cart is empty or invalid'] },
        { status: 400 }
      );
    }

    const authoritativeProducts = getAuthoritativeProducts();
    const errors: string[] = [];
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
        errors.push(
          `Requested quantity (${requestedQty}) for "${product.name}" exceeds available inventory (${verifiedStock}). Clamped to ${approvedQty}.`
        );
      }

      // Authoritative pricing: strictly enforce server price
      const verifiedUnitPrice = userRole === 'dealer' ? product.dealerPrice : product.retailPrice;
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
      return NextResponse.json({ valid: false, errors }, { status: 422 });
    }

    // Server-side calculation of promo discount
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
      valid: errors.length === 0,
      warnings: errors,
      verifiedSummary: {
        items: verifiedItems,
        subtotal,
        discount,
        tax,
        deliveryFee,
        totalAmount,
        promoCode: cleanPromo,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { valid: false, errors: [err.message || 'Server validation error'] },
      { status: 500 }
    );
  }
}
