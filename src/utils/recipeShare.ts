import LZString from 'lz-string';
import { type CustomRecipe } from '../db/db';

interface MinifiedIngredient {
  n: string; // name
  g: number; // amountGrams
  c: number; // calories
  p: number; // protein
  cb: number; // carbs
  f: number; // fat
}

interface MinifiedRecipePayload {
  n: string; // name
  c: 'bread' | 'meal' | 'drink' | 'snack';
  rw: number; // totalRawWeight
  cw: number; // cookedWeight
  sn: string; // servingName
  sw: number; // servingWeightGrams
  cal: number; // calories100g
  p: number; // protein100g
  cb: number; // carbs100g
  f: number; // fat100g
  fib?: number; // fiber100g
  sug?: number; // sugar100g
  ing?: MinifiedIngredient[];
}

/**
 * Encodes a CustomRecipe into a tiny, URL-safe LZ-String token
 */
export function encodeRecipeToPayload(recipe: CustomRecipe): string {
  const minified: MinifiedRecipePayload = {
    n: recipe.name,
    c: recipe.category,
    rw: recipe.totalRawWeight,
    cw: recipe.cookedWeight,
    sn: recipe.servingName,
    sw: recipe.servingWeightGrams,
    cal: recipe.calories100g,
    p: recipe.protein100g,
    cb: recipe.carbs100g,
    f: recipe.fat100g,
    fib: recipe.fiber100g,
    sug: recipe.sugar100g,
    ing: recipe.ingredients?.map((i) => ({
      n: i.name,
      g: i.amountGrams,
      c: i.calories,
      p: i.protein,
      cb: i.carbs,
      f: i.fat,
    })),
  };
  return LZString.compressToEncodedURIComponent(JSON.stringify(minified));
}

/**
 * Decodes a compressed token back into a CustomRecipe
 */
export function decodePayloadToRecipe(compressed: string): Omit<CustomRecipe, 'id'> | null {
  try {
    let cleanCode = compressed.trim();
    if (cleanCode.includes('#recipe=')) {
      cleanCode = cleanCode.split('#recipe=')[1];
    } else if (cleanCode.includes('recipe=')) {
      cleanCode = cleanCode.split('recipe=')[1];
    }
    // Remove potential trailing url params or hash
    cleanCode = cleanCode.split('&')[0];

    const jsonStr = LZString.decompressFromEncodedURIComponent(cleanCode);
    if (!jsonStr) return null;
    const min: MinifiedRecipePayload = JSON.parse(jsonStr);
    if (!min.n || min.cal === undefined) return null;

    return {
      name: min.n,
      category: min.c || 'bread',
      totalRawWeight: min.rw || 0,
      cookedWeight: min.cw || min.rw || 0,
      servingName: min.sn || (min.c === 'bread' ? '1 Scheibe' : min.c === 'drink' ? '1 Glas' : '1 Portion'),
      servingWeightGrams: min.sw || (min.c === 'drink' ? 250 : min.c === 'bread' ? 50 : 250),
      calories100g: min.cal,
      protein100g: min.p || 0,
      carbs100g: min.cb || 0,
      fat100g: min.f || 0,
      fiber100g: min.fib || 0,
      sugar100g: min.sug || 0,
      ingredients: min.ing
        ? min.ing.map((i) => ({
            name: i.n,
            amountGrams: i.g,
            calories: i.c,
            protein: i.p,
            carbs: i.cb,
            fat: i.f,
          }))
        : [],
      createdAt: Date.now(),
    };
  } catch (err) {
    console.error('Failed to decode recipe payload', err);
    return null;
  }
}

/**
 * Generates an easy shareable link (works via WhatsApp, SMS, or QR code)
 */
export function generateShareUrl(recipe: CustomRecipe): string {
  const token = encodeRecipeToPayload(recipe);
  const baseUrl = window.location.origin + window.location.pathname;
  return `${baseUrl}#recipe=${token}`;
}
