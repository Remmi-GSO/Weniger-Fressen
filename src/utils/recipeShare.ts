import LZString from 'lz-string';
import { type CustomRecipe } from '../db/db';
import { compressDataUrl } from './imageCompress';

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
  c: 'bread' | 'breakfast' | 'meal' | 'salad' | 'drink' | 'snack';
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
  pt?: number; // prepTimeMinutes
  ins?: string[]; // instructions
  ing?: MinifiedIngredient[];
  img?: string; // compressed recipe photo thumbnail
}

export interface EncodeRecipeOptions {
  includeImage?: boolean;
}

/**
 * Encodes a CustomRecipe into a tiny, URL-safe LZ-String token.
 * Includes the recipe photo if present (and not explicitly disabled).
 */
export function encodeRecipeToPayload(
  recipe: CustomRecipe,
  options: EncodeRecipeOptions = { includeImage: true }
): string {
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
    pt: recipe.prepTimeMinutes,
    ins: recipe.instructions,
    ing: recipe.ingredients?.map((i) => ({
      n: i.name,
      g: i.amountGrams,
      c: i.calories,
      p: i.protein,
      cb: i.carbs,
      f: i.fat,
    })),
    img: options.includeImage !== false ? recipe.imageUrl : undefined,
  };
  return LZString.compressToEncodedURIComponent(JSON.stringify(minified));
}

/**
 * Decodes a compressed token back into a CustomRecipe including its photo.
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
      instructions: min.ins || [],
      prepTimeMinutes: min.pt || undefined,
      imageUrl: min.img || undefined,
      createdAt: Date.now(),
    };
  } catch (err) {
    console.error('Failed to decode recipe payload', err);
    return null;
  }
}

/**
 * Generates an easy shareable link (works via WhatsApp, SMS, or QR code).
 * Automatically optimizes and compresses the photo if present.
 */
export async function generateShareUrl(
  recipe: CustomRecipe,
  options: EncodeRecipeOptions = { includeImage: true }
): Promise<string> {
  let recipeToEncode = recipe;

  if (options.includeImage !== false && recipe.imageUrl) {
    try {
      const compressedThumb = await compressDataUrl(recipe.imageUrl, 260, 0.65);
      recipeToEncode = {
        ...recipe,
        imageUrl: compressedThumb,
      };
    } catch {
      recipeToEncode = recipe;
    }
  }

  const token = encodeRecipeToPayload(recipeToEncode, options);
  const baseUrl = window.location.origin + window.location.pathname;
  return `${baseUrl}#recipe=${token}`;
}

/**
 * Synchronous variant without on-the-fly compression (used as fast fallback).
 */
export function generateShareUrlSync(
  recipe: CustomRecipe,
  options: EncodeRecipeOptions = { includeImage: true }
): string {
  const token = encodeRecipeToPayload(recipe, options);
  const baseUrl = window.location.origin + window.location.pathname;
  return `${baseUrl}#recipe=${token}`;
}
