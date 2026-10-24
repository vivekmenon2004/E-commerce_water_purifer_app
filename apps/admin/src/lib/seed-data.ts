import { Product } from './types';
import seedProductsJson from '../../../../data/seed-products.json';

export const SEED_PRODUCTS: Product[] = (seedProductsJson as any[]).map((p) => ({
  ...p,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}));

export const DEFAULT_CATEGORIES = [
  'all',
  'water purifiers',
  'dispensers',
  'pumps',
  'filters',
  'spare parts',
] as const;
