import { COMMON_FOODS } from '../data/commonFoods';
import { SUPERMARKET_CATALOG } from '../data/supermarketCatalog';

export interface FoodProduct {
  id: string;
  name: string;
  brand?: string;
  calories100g: number;
  protein100g: number;
  carbs100g: number;
  fat100g: number;
  fiber100g?: number;
  sugar100g?: number;
  servingSize?: string;
  servingWeightGrams?: number;
  imageUrl?: string;
  barcode?: string;
  source?: 'local' | 'supermarket' | 'online' | 'ai' | 'recipe';
}

// Master unified catalog for instant zero-latency local lookups
export const ALL_LOCAL_FOODS: FoodProduct[] = [
  ...SUPERMARKET_CATALOG.map((item) => ({ ...item, source: 'supermarket' as const })),
  ...COMMON_FOODS.map((item) => ({ ...item, source: 'local' as const })),
];

/**
 * Parses numeric serving weight in grams from strings like "30 g", "1 Portion (45g)", "250 ml"
 */
export function parseServingGrams(servingStr?: string): number | undefined {
  if (!servingStr) return undefined;
  const match = servingStr.match(/(\d+(?:[.,]\d+)?)\s*(?:g|ml|gramm)/i);
  if (match && match[1]) {
    const val = parseFloat(match[1].replace(',', '.'));
    return val > 0 ? val : undefined;
  }
  return undefined;
}

/**
 * Normalizes raw Open Food Facts product data into a clean, safe FoodProduct
 */
export function normalizeProduct(raw: any, barcode?: string): FoodProduct | null {
  if (!raw) return null;

  const name =
    raw.product_name_de ||
    raw.product_name ||
    raw.product_name_en ||
    raw.generic_name_de ||
    raw.generic_name ||
    'Unbenanntes Produkt';

  const brand = raw.brands || raw.brand_owner || undefined;
  const nutriments = raw.nutriments || {};

  // Extract calories: prefer energy-kcal_100g, fallback to energy_100g in kJ / 4.184
  let kcal = 0;
  if (nutriments['energy-kcal_100g'] !== undefined && nutriments['energy-kcal_100g'] !== null) {
    kcal = Number(nutriments['energy-kcal_100g']);
  } else if (nutriments['energy-kcal'] !== undefined && nutriments['energy-kcal'] !== null) {
    kcal = Number(nutriments['energy-kcal']);
  } else if (nutriments.energy_100g) {
    kcal = Math.round(Number(nutriments.energy_100g) / 4.184);
  }

  const protein = Math.round((Number(nutriments.proteins_100g) || 0) * 10) / 10;
  const carbs = Math.round((Number(nutriments.carbohydrates_100g) || 0) * 10) / 10;
  const fat = Math.round((Number(nutriments.fat_100g) || 0) * 10) / 10;
  const fiber = nutriments.fiber_100g !== undefined ? Math.round(Number(nutriments.fiber_100g) * 10) / 10 : undefined;
  const sugar = nutriments.sugars_100g !== undefined ? Math.round(Number(nutriments.sugars_100g) * 10) / 10 : undefined;

  const servingSize = raw.serving_size || undefined;
  const servingWeightGrams = parseServingGrams(servingSize) || (raw.serving_quantity ? Number(raw.serving_quantity) : undefined);

  const imageUrl =
    raw.image_front_small_url ||
    raw.image_small_url ||
    raw.image_front_url ||
    raw.image_url ||
    undefined;

  return {
    id: barcode || raw.code || raw.id || String(Math.random()),
    name: name.trim(),
    brand: brand ? brand.trim() : undefined,
    calories100g: Math.round(kcal),
    protein100g: Math.max(0, protein),
    carbs100g: Math.max(0, carbs),
    fat100g: Math.max(0, fat),
    fiber100g: fiber,
    sugar100g: sugar,
    servingSize,
    servingWeightGrams,
    imageUrl,
    barcode: barcode || raw.code,
    source: 'online',
  };
}

/**
 * Searches local verified food database & supermarket catalog (instant, offline)
 * and merges with Open Food Facts
 */
export async function searchFoodProducts(query: string, page = 1): Promise<FoodProduct[]> {
  const cleanQuery = query.trim().toLowerCase();
  if (!cleanQuery || cleanQuery.length < 2) return [];

  const queryTokens = cleanQuery.split(/\s+/).filter(Boolean);

  // 1. Instant local search from ALL_LOCAL_FOODS (Supermarket + Basics)
  const localMatches = ALL_LOCAL_FOODS.filter((item) => {
    const nameLower = item.name.toLowerCase();
    const brandLower = (item.brand || '').toLowerCase();
    return queryTokens.every((token) => nameLower.includes(token) || brandLower.includes(token));
  });

  // Relevance ranking: exact startsWith and brand priority first
  localMatches.sort((a, b) => {
    const aNameStarts = a.name.toLowerCase().startsWith(cleanQuery) ? -2 : 0;
    const bNameStarts = b.name.toLowerCase().startsWith(cleanQuery) ? -2 : 0;
    const aBrandStarts = (a.brand || '').toLowerCase().startsWith(cleanQuery) ? -1 : 0;
    const bBrandStarts = (b.brand || '').toLowerCase().startsWith(cleanQuery) ? -1 : 0;
    return (aNameStarts + aBrandStarts) - (bNameStarts + bBrandStarts);
  });

  // 2. Fetch Open Food Facts online search
  let remoteMatches: FoodProduct[] = [];
  try {
    const url = `https://de.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
      cleanQuery
    )}&search_simple=1&action=process&json=1&page_size=20&page=${page}&lc=de`;

    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('json')) {
        const data = await res.json();
        if (data.products && Array.isArray(data.products)) {
          for (const raw of data.products) {
            const normalized = normalizeProduct(raw);
            if (normalized && (normalized.calories100g > 0 || normalized.protein100g > 0)) {
              remoteMatches.push(normalized);
            }
          }
        }
      }
    }
  } catch (err) {
    // Network / CORS / 503 fallback - silent resilience
  }

  // 3. Combine results (Local verified items first, then remote brand items)
  const combined: FoodProduct[] = [...localMatches];
  const existingNames = new Set(localMatches.map((m) => m.name.toLowerCase()));

  for (const rem of remoteMatches) {
    const key = rem.name.toLowerCase();
    if (!existingNames.has(key)) {
      combined.push(rem);
      existingNames.add(key);
    }
  }

  return combined;
}

/**
 * Fetches a single product from local database or Open Food Facts by barcode
 */
export async function fetchProductByBarcode(barcode: string): Promise<FoodProduct | null> {
  const cleanBarcode = barcode.trim().replace(/\D/g, '');
  if (!cleanBarcode) return null;

  // 1. Check local catalog first
  const localMatch = ALL_LOCAL_FOODS.find((f) => f.barcode === cleanBarcode);
  if (localMatch) return localMatch;

  // 2. Query Open Food Facts API v2
  const url = `https://world.openfoodfacts.org/api/v2/product/${cleanBarcode}.json`;

  try {
    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json();
    if (data.status === 1 && data.product) {
      return normalizeProduct(data.product, cleanBarcode);
    }
    return null;
  } catch (err) {
    console.error('Failed to fetch barcode from Open Food Facts:', err);
    return null;
  }
}
