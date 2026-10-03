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

/**
 * Queries Gemini 2.5 Flash with structured JSON output to identify any food,
 * supermarket branded product, bakery item, or meal with accurate German nutrition facts.
 */
export async function queryFoodWithGemini(
  query: string,
  apiKey: string
): Promise<FoodProduct | null> {
  const cleanKey = apiKey.trim();
  if (!cleanKey) {
    throw new Error('Kein Gemini API-Key hinterlegt.');
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${cleanKey}`;

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
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      const msg = errJson?.error?.message || res.statusText;
      throw new Error(`Gemini API Fehler (${res.status}): ${msg}`);
    }

    const data = await res.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) return null;

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
