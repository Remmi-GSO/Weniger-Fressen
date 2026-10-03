import { type FoodProduct } from './foodApi';

export interface GeminiNutritionResponse {
  name: string;
  brand?: string;
  calories100g: number;
  protein100g: number;
  carbs100g: number;
  fat100g: number;
  fiber100g?: number;
  servingSize?: string;
  servingWeightGrams?: number;
  confidenceNote?: string;
}

export interface AiMealComponent {
  id: string;
  name: string;
  amountGrams: number;
  unitLabel?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  calories100g: number;
  protein100g: number;
  carbs100g: number;
  fat100g: number;
}

export interface AiMealAnalysisResult {
  mealTitle: string;
  summaryNote?: string;
  items: AiMealComponent[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  usedModel?: string;
}

/**
 * Budget-friendly & free-tier optimized Gemini models.
 * Google recommends gemini-3.8-flash and gemini-3.5-flash-lite for ultra-low latency,
 * zero/minimal cost and generous free tier quotas.
 */
export const CANDIDATE_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.5-flash-lite',
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
];

let cachedWorkingModel: string | null = null;

export function getActiveGeminiModel(): string {
  return cachedWorkingModel || CANDIDATE_MODELS[0];
}

/**
 * Executes a Gemini request with automatic graceful fallback across models.
 * Prevents 404 deprecation errors for new/unprovisioned models and protects user budget.
 */
async function callGeminiApi({
  apiKey,
  parts,
  temperature = 0.2,
}: {
  apiKey: string;
  parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }>;
  temperature?: number;
}): Promise<{ rawText: string; model: string }> {
  const cleanKey = apiKey.trim();
  if (!cleanKey) {
    throw new Error('Kein Gemini API-Key hinterlegt. Bitte trage deinen kostenlosen Key in den Einstellungen ein.');
  }

  const modelsToTry = cachedWorkingModel
    ? [cachedWorkingModel, ...CANDIDATE_MODELS.filter((m) => m !== cachedWorkingModel)]
    : CANDIDATE_MODELS;

  let lastError: Error | null = null;

  for (const model of modelsToTry) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${cleanKey}`;
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature,
          },
        }),
      });

      if (res.ok) {
        cachedWorkingModel = model;
        const data = await res.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawText) {
          throw new Error('Keine Antwort von Gemini erhalten.');
        }
        return { rawText, model };
      }

      const errJson = await res.json().catch(() => ({}));
      const msg = errJson?.error?.message || res.statusText;

      // Check if model is deprecated or not available for this project/user (404)
      const isModelUnavailable =
        res.status === 404 ||
        msg.includes('is no longer available') ||
        msg.includes('not found') ||
        msg.includes('not supported') ||
        msg.includes('deprecated');

      if (isModelUnavailable) {
        console.warn(`Gemini-Modell ${model} nicht verfügbar (${msg}), versuche nächstes Modell...`);
        lastError = new Error(`Gemini API Fehler (${res.status}): ${msg}`);
        continue;
      }

      // If budget / quota (429) or invalid key (400 / 403), throw immediately with helpful German guidance
      if (res.status === 429) {
        throw new Error('Gemini API-Limit erreicht (429). Bitte warte einen kurzen Moment und versuche es erneut (im kostenlosen Kontingent von Google).');
      }
      if (res.status === 400 || res.status === 403) {
        throw new Error(`Gemini API-Key ungültig oder Berechtigung verweigert (${res.status}): ${msg}`);
      }

      throw new Error(`Gemini API Fehler (${res.status}): ${msg}`);
    } catch (err: any) {
      if (err.message?.includes('Gemini API-Limit') || err.message?.includes('Gemini API-Key')) {
        throw err;
      }
      lastError = err;
    }
  }

  throw lastError || new Error('Kein kompatibles Gemini-Modell gefunden.');
}

/**
 * Queries Gemini with structured JSON output to identify any food,
 * supermarket branded product, bakery item, or meal with accurate German nutrition facts.
 */
export async function queryFoodWithGemini(
  query: string,
  apiKey: string
): Promise<FoodProduct | null> {
  const prompt = `Du bist ein präziser Experte für Lebensmittel-Nährwerte und den deutschen Lebensmitteleinzelhandel (Supermärkte wie Rewe, Edeka, Aldi, Lidl, Kaufland sowie Bäckereien und bekannte Herstellermarken wie Harry, Lieken Urkorn, Golden Toast, Barilla, Alpro, Rügenwalder Mühle usw.).

Der Nutzer sucht nach: "${query}".

Bestimme die exakten oder typischen Nährwerte pro 100g für dieses Lebensmittel bzw. diese Supermarktpackung in Deutschland.
Gebe die typische Portionsgröße an (z. B. "1 Scheibe (ca. 45g)", "1 Becher (ca. 250g)", "1 Riegel (ca. 40g)").

Antworte ausschließlich im angegebenen JSON-Format:
{
  "name": "Vollständiger Produktname",
  "brand": "Marke / Supermarkt (oder Bäckerei/Standard)",
  "calories100g": 240,
  "protein100g": 8.5,
  "carbs100g": 44.0,
  "fat100g": 2.5,
  "fiber100g": 6.0,
  "servingSize": "1 Scheibe (ca. 45g)",
  "servingWeightGrams": 45
}`;

  try {
    const { rawText } = await callGeminiApi({
      apiKey,
      parts: [{ text: prompt }],
      temperature: 0.2,
    });

    const parsed: GeminiNutritionResponse = JSON.parse(rawText);

    return {
      id: `ai_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: parsed.name,
      brand: parsed.brand || 'KI-Recherche',
      calories100g: Math.round(parsed.calories100g),
      protein100g: Math.round(parsed.protein100g * 10) / 10,
      carbs100g: Math.round(parsed.carbs100g * 10) / 10,
      fat100g: Math.round(parsed.fat100g * 10) / 10,
      fiber100g: parsed.fiber100g ? Math.round(parsed.fiber100g * 10) / 10 : undefined,
      servingSize: parsed.servingSize,
      servingWeightGrams: parsed.servingWeightGrams,
    };
  } catch (err: any) {
    console.error('Gemini food query failed:', err);
    throw err;
  }
}

/**
 * Analyzes a full meal photo, voice description, or text with Gemini Flash.
 * Returns structured ingredients/components with realistic portions, calories, and macros.
 */
export async function analyzeMealWithGemini({
  description = '',
  imageBase64,
  imageMimeType = 'image/jpeg',
  apiKey,
  userRecipes,
}: {
  description?: string;
  imageBase64?: string;
  imageMimeType?: string;
  apiKey: string;
  userRecipes?: Array<{
    name: string;
    calories100g: number;
    protein100g: number;
    carbs100g: number;
    fat100g: number;
    servingWeightGrams?: number;
  }>;
}): Promise<AiMealAnalysisResult> {
  const recipesContext = userRecipes && userRecipes.length > 0
    ? `\nBekannte Rezepte des Nutzers in der App:\n${userRecipes.map(r => `- ${r.name}: ${r.calories100g} kcal/100g, Protein: ${r.protein100g}g, KH: ${r.carbs100g}g, Fett: ${r.fat100g}g${r.servingWeightGrams ? ` (Portion ca. ${r.servingWeightGrams}g)` : ''}`).join('\n')}\nWenn der Nutzer eines dieser Rezepte erwähnt (z. B. "selbstgebackenes Brot" oder einen ähnlichen Namen), verwende bevorzugt dessen genaue Nährwerte.\n`
    : '';

  const prompt = `Du bist ein präziser deutscher Ernährungsexperte.
Analysiere die folgende Mahlzeit (anhand des Fotos und/oder der Beschreibung des Nutzers).
${recipesContext}
Nutzer-Beschreibung / Diktat: "${description.trim() || 'Keine Notiz vorhanden - bitte analysiere das Foto sorgfältig'}"

AUFGABE:
1. Zerlege die Mahlzeit in alle erkennbaren Einzelkomponenten (z. B. "Dinkelbrot", "Butter", "Gouda", "Gekochtes Ei", "Kaffee mit Milch").
2. Schätze für jede Komponente das realistische Portionsgewicht in Gramm.
3. Berechne für jede Komponente die Kalorien (kcal) sowie Makronährstoffe (Protein, Kohlenhydrate, Fett) sowohl für diese Portionsgröße als auch umgerechnet auf 100g.
4. Gib jeder Komponente eine verständliche Einheiten-Bezeichnung (z. B. "2 Scheiben (ca. 90g)", "1 Ei (ca. 55g)", "1 Tasse (ca. 150ml)").

Antworte ausschließlich im angegebenen JSON-Format:
{
  "mealTitle": "Treffender Mahlzeitentitel (z.B. Frühstück mit Dinkelbrot, Gouda und Ei)",
  "summaryNote": "Kurze, freundliche Erklärung deiner Schätzung (1-2 Sätze)",
  "items": [
    {
      "name": "Dinkelbrot",
      "amountGrams": 90,
      "unitLabel": "2 Scheiben",
      "calories": 215,
      "protein": 7.5,
      "carbs": 39.0,
      "fat": 1.9,
      "calories100g": 239,
      "protein100g": 8.3,
      "carbs100g": 43.3,
      "fat100g": 2.1
    }
  ]
}`;

  const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [
    { text: prompt },
  ];

  if (imageBase64) {
    parts.push({
      inlineData: {
        mimeType: imageMimeType,
        data: imageBase64,
      },
    });
  }

  try {
    const { rawText, model } = await callGeminiApi({
      apiKey,
      parts,
      temperature: 0.2,
    });

    const parsed = JSON.parse(rawText);
    const rawItems: any[] = Array.isArray(parsed.items) ? parsed.items : [];

    const items: AiMealComponent[] = rawItems.map((item, index) => {
      const amountGrams = Math.max(1, Number(item.amountGrams) || 100);
      const calories = Math.max(0, Math.round(Number(item.calories) || 0));
      const protein = Math.max(0, Math.round((Number(item.protein) || 0) * 10) / 10);
      const carbs = Math.max(0, Math.round((Number(item.carbs) || 0) * 10) / 10);
      const fat = Math.max(0, Math.round((Number(item.fat) || 0) * 10) / 10);

      const calories100g = Math.round(Number(item.calories100g) || (calories / amountGrams) * 100);
      const protein100g = Math.round((Number(item.protein100g) || (protein / amountGrams) * 100) * 10) / 10;
      const carbs100g = Math.round((Number(item.carbs100g) || (carbs / amountGrams) * 100) * 10) / 10;
      const fat100g = Math.round((Number(item.fat100g) || (fat / amountGrams) * 100) * 10) / 10;

      return {
        id: `ai_comp_${Date.now()}_${index}`,
        name: String(item.name || 'Zutat'),
        amountGrams,
        unitLabel: item.unitLabel ? String(item.unitLabel) : `${amountGrams}g`,
        calories,
        protein,
        carbs,
        fat,
        calories100g,
        protein100g,
        carbs100g,
        fat100g,
      };
    });

    const totalCalories = items.reduce((sum, it) => sum + it.calories, 0);
    const totalProtein = Math.round(items.reduce((sum, it) => sum + it.protein, 0) * 10) / 10;
    const totalCarbs = Math.round(items.reduce((sum, it) => sum + it.carbs, 0) * 10) / 10;
    const totalFat = Math.round(items.reduce((sum, it) => sum + it.fat, 0) * 10) / 10;

    return {
      mealTitle: parsed.mealTitle || 'Analysierte Mahlzeit',
      summaryNote: parsed.summaryNote,
      items,
      totalCalories,
      totalProtein,
      totalCarbs,
      totalFat,
      usedModel: model,
    };
  } catch (err: any) {
    console.error('Gemini meal analysis failed:', err);
    throw err;
  }
}
