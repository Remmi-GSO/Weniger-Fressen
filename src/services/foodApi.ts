import { COMMON_FOODS } from '../data/commonFoods';
import { SUPERMARKET_CATALOG } from '../data/supermarketCatalog';
import { type RecipeCategory } from '../db/db';

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
  servingName?: string;
  servingWeightGrams?: number;
  packageWeightGrams?: number; // Gesamtgewicht der Packung/des Glases/der Pizza/Dose
  containerType?: 'jar' | 'can' | 'pack' | 'pizza' | 'bottle' | 'cup' | 'general';
  imageUrl?: string;
  barcode?: string;
  source?: 'local' | 'supermarket' | 'online' | 'ai' | 'recipe';
  recipeData?: any;
  totalDishWeight?: number;
  cookedWeight?: number;
  totalRawWeight?: number;
  recipeCategory?: RecipeCategory;
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
 * Parses total package weight and container type from raw product data
 */
export function parsePackageGrams(quantityStr?: string, raw?: any): { weight?: number; type: 'jar' | 'can' | 'pack' | 'pizza' | 'bottle' | 'cup' | 'general' } {
  const name = (raw?.product_name_de || raw?.product_name || raw?.generic_name || '').toLowerCase();
  const packaging = (raw?.packaging || raw?.packaging_text || '').toLowerCase();
  const fullText = `${quantityStr || ''} ${packaging} ${name}`;

  let type: 'jar' | 'can' | 'pack' | 'pizza' | 'bottle' | 'cup' | 'general' = 'general';
  if (fullText.includes('glas') || fullText.includes('jar') || fullText.includes('gläschen')) {
    type = 'jar';
  } else if (fullText.includes('dose') || fullText.includes('can') || fullText.includes('büchse') || fullText.includes('konserve') || fullText.includes('tuna') || fullText.includes('thunfisch')) {
    type = 'can';
  } else if (fullText.includes('pizza') || fullText.includes('flammkuchen')) {
    type = 'pizza';
  } else if (fullText.includes('becher') || fullText.includes('cup') || fullText.includes('tasse') || fullText.includes('joghurt')) {
    type = 'cup';
  } else if (fullText.includes('flasche') || fullText.includes('bottle')) {
    type = 'bottle';
  } else if (fullText.includes('beutel') || fullText.includes('packung') || fullText.includes('tüte') || fullText.includes('bag') || fullText.includes('pack')) {
    type = 'pack';
  }

  // 1. Drained weight (Abtropfgewicht) for pickled items / jars / canned veggies
  if (raw?.drained_weight) {
    const drained = parseServingGrams(String(raw.drained_weight));
    if (drained && drained > 0) {
      return { weight: Math.round(drained), type };
    }
  }

  // 2. Specific product quantity in numbers
  if (raw?.product_quantity && Number(raw.product_quantity) > 0) {
    return { weight: Math.round(Number(raw.product_quantity)), type };
  }
  if (raw?.net_weight_value && Number(raw.net_weight_value) > 0) {
    return { weight: Math.round(Number(raw.net_weight_value)), type };
  }

  // 3. String matching on combined quantity text e.g. "400 g", "400g", "0.4 kg", "450 g e"
  const textToCheck = `${quantityStr || ''} ${raw?.quantity || ''} ${raw?.serving_size || ''} ${packaging} ${name}`;
  const kgMatch = textToCheck.match(/(\d+(?:[.,]\d+)?)\s*kg\b/i);
  if (kgMatch && kgMatch[1]) {
    const kg = parseFloat(kgMatch[1].replace(',', '.'));
    if (kg >= 0.05 && kg <= 10) {
      return { weight: Math.round(kg * 1000), type };
    }
  }
  const gMatch = textToCheck.match(/(\d+(?:[.,]\d+)?)\s*(?:g|ml|gramm)\b/i);
  if (gMatch && gMatch[1]) {
    const val = parseFloat(gMatch[1].replace(',', '.'));
    if (val >= 20 && val <= 5000) {
      return { weight: Math.round(val), type };
    }
  }

  return { weight: undefined, type };
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

  // Extract calories: Check direct 100g, prepared 100g, values, and fallback to kJ
  let kcal = 0;
  const kcalCandidates = [
    nutriments['energy-kcal_100g'],
    nutriments['energy-kcal_prepared_100g'],
    nutriments['energy-kcal_value'],
    nutriments['energy-kcal_prepared_value'],
    nutriments['energy-kcal'],
    nutriments['energy-kcal_prepared'],
    nutriments['energy_kcal_100g'],
    nutriments['energy_kcal'],
  ];

  for (const c of kcalCandidates) {
    if (c !== undefined && c !== null && !isNaN(Number(c)) && Number(c) > 0) {
      kcal = Number(c);
      break;
    }
  }

  // If kcal is still 0, check kJ fields
  if (kcal <= 0) {
    const kjCandidates = [
      nutriments['energy-kj_100g'],
      nutriments['energy-kj_prepared_100g'],
      nutriments['energy-kj_value'],
      nutriments['energy-kj_prepared_value'],
      nutriments['energy_prepared_100g'],
      nutriments.energy_100g,
      nutriments.energy_value,
    ];

    for (const kj of kjCandidates) {
      if (kj !== undefined && kj !== null && !isNaN(Number(kj)) && Number(kj) > 0) {
        if (nutriments.energy_unit === 'kcal' || nutriments['energy_prepared_unit'] === 'kcal') {
          kcal = Number(kj);
        } else {
          kcal = Math.round(Number(kj) / 4.184);
        }
        break;
      }
    }
  }

  // Helper to extract first valid nutrient value (supports raw and _prepared)
  const extractNutrient = (keys: string[]): number | undefined => {
    for (const k of keys) {
      const v = nutriments[k];
      if (v !== undefined && v !== null && !isNaN(Number(v))) {
        return Number(v);
      }
    }
    return undefined;
  };

  let protein = extractNutrient([
    'proteins_100g',
    'proteins_prepared_100g',
    'proteins_value',
    'proteins_prepared_value',
    'proteins',
  ]) ?? 0;
  protein = Math.round(protein * 10) / 10;

  let carbs = extractNutrient([
    'carbohydrates_100g',
    'carbohydrates_prepared_100g',
    'carbohydrates_value',
    'carbohydrates_prepared_value',
    'carbohydrates',
  ]) ?? 0;
  carbs = Math.round(carbs * 10) / 10;

  let fat = extractNutrient([
    'fat_100g',
    'fat_prepared_100g',
    'fat_value',
    'fat_prepared_value',
    'fat',
  ]) ?? 0;
  fat = Math.round(fat * 10) / 10;

  const rawFiber = extractNutrient([
    'fiber_100g',
    'fiber_prepared_100g',
    'fiber_value',
    'fiber_prepared_value',
    'fiber',
  ]);
  let fiber = rawFiber !== undefined ? Math.round(rawFiber * 10) / 10 : undefined;

  const rawSugar = extractNutrient([
    'sugars_100g',
    'sugars_prepared_100g',
    'sugars_value',
    'sugars_prepared_value',
    'sugars',
  ]);
  let sugar = rawSugar !== undefined ? Math.round(rawSugar * 10) / 10 : undefined;

  // Atwater Macro Calculation Fallback:
  // If calories is 0 but macronutrients are present (e.g. frozen beans / vegetables)
  if (kcal <= 0 && (protein > 0 || carbs > 0 || fat > 0)) {
    kcal = Math.round(protein * 4 + carbs * 4 + fat * 9 + (fiber || 0) * 2);
  }

  // German Supermarket Staple Fallback:
  // If OpenFoodFacts has a completely empty record (0 across all fields),
  // infer nutritional profile from verified standard staples so user never gets broken 0 kcal.
  if (kcal <= 0 && protein <= 0 && carbs <= 0 && fat <= 0) {
    const n = name.toLowerCase();
    if (n.includes('bohne') || n.includes('prinzess')) {
      kcal = 31; protein = 2.0; carbs = 3.4; fat = 0.2; fiber = 2.8;
    } else if (n.includes('erbse')) {
      kcal = 81; protein = 5.4; carbs = 14.5; fat = 0.4; fiber = 5.7;
    } else if (n.includes('spinat')) {
      kcal = 23; protein = 2.9; carbs = 0.8; fat = 0.4; fiber = 2.2;
    } else if (n.includes('brokkoli') || n.includes('broccoli')) {
      kcal = 34; protein = 2.8; carbs = 4.0; fat = 0.4; fiber = 2.6;
    } else if (n.includes('blumenkohl')) {
      kcal = 25; protein = 1.9; carbs = 2.3; fat = 0.3; fiber = 2.9;
    } else if (n.includes('möhre') || n.includes('karotte')) {
      kcal = 39; protein = 0.9; carbs = 6.8; fat = 0.2; fiber = 3.0;
    } else if (n.includes('kartoffel')) {
      kcal = 77; protein = 2.0; carbs = 17.0; fat = 0.1; fiber = 2.1;
    } else if (n.includes('haferflocken')) {
      kcal = 370; protein = 13.5; carbs = 58.7; fat = 7.0; fiber = 10.0;
    } else if (n.includes('magerquark')) {
      kcal = 68; protein = 12.0; carbs = 4.0; fat = 0.2;
    }
  }

  const servingSize = raw.serving_size || undefined;
  const servingWeightGrams = parseServingGrams(servingSize) || (raw.serving_quantity ? Number(raw.serving_quantity) : undefined);

  // Extract package weight and container type
  const { weight: packageWeightGrams, type: containerType } = parsePackageGrams(raw.quantity, raw);

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
    packageWeightGrams,
    containerType,
    imageUrl,
    barcode: barcode || raw.code,
    source: 'online',
  };
}

/**
 * Normalizes German strings (umlauts ä->ae, ö->oe, ü->ue, ß->ss) for resilient matching
 */
export function normalizeGermanSearch(str: string): string {
  return str
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Searches local verified food database & supermarket catalog (instant, offline)
 * and merges with Open Food Facts
 */
export async function searchFoodProducts(query: string, page = 1): Promise<FoodProduct[]> {
  const cleanQuery = query.trim().toLowerCase();
  if (!cleanQuery || cleanQuery.length < 2) return [];

  const queryTokens = cleanQuery.split(/\s+/).filter(Boolean);
  const normQuery = normalizeGermanSearch(cleanQuery);
  const normTokens = normQuery.split(/\s+/).filter(Boolean);

  // 1. Instant local search from ALL_LOCAL_FOODS (Supermarket + Basics)
  const localMatches = ALL_LOCAL_FOODS.filter((item) => {
    const nameLower = item.name.toLowerCase();
    const brandLower = (item.brand || '').toLowerCase();
    const normName = normalizeGermanSearch(item.name);
    const normBrand = normalizeGermanSearch(item.brand || '');

    return (
      queryTokens.every((token) => nameLower.includes(token) || brandLower.includes(token)) ||
      normTokens.every((token) => normName.includes(token) || normBrand.includes(token))
    );
  });

  // Relevance ranking: exact startsWith and brand priority first
  localMatches.sort((a, b) => {
    const aNorm = normalizeGermanSearch(a.name);
    const bNorm = normalizeGermanSearch(b.name);
    const aNameStarts = a.name.toLowerCase().startsWith(cleanQuery) || aNorm.startsWith(normQuery) ? -2 : 0;
    const bNameStarts = b.name.toLowerCase().startsWith(cleanQuery) || bNorm.startsWith(normQuery) ? -2 : 0;
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
