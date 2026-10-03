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
}

/**
 * Analyzes a full meal photo, voice description, or text with Gemini 2.5 Flash.
 * Returns structured ingredients/components with realistic portions, calories, and macros.
 */
export async function analyzeMealWithGemini({
  description = '',
  imageBase64,
  imageMimeType = 'image/jpeg',
  apiKey,
}: {
  description?: string;
  imageBase64?: string;
  imageMimeType?: string;
  apiKey: string;
}): Promise<AiMealAnalysisResult> {
  const cleanKey = apiKey.trim();
  if (!cleanKey) {
    throw new Error('Kein Gemini API-Key hinterlegt. Bitte trage deinen Key in den Einstellungen ein.');
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${cleanKey}`;

  const prompt = `Du bist ein präziser deutscher Ernährungsexperte.
Analysiere die folgende Mahlzeit (anhand des Fotos und/oder der Beschreibung des Nutzers).

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
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts,
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
    if (!rawText) {
      throw new Error('Keine Antwort von Gemini erhalten.');
    }

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
    };
  } catch (err: any) {
    console.error('Gemini meal analysis failed:', err);
    throw err;
  }
}

