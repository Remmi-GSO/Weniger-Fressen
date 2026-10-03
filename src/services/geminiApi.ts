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
  fiber?: number;
  sugar?: number;
  calories100g: number;
  protein100g: number;
  carbs100g: number;
  fat100g: number;
  fiber100g?: number;
  sugar100g?: number;
}

export interface AiMealAnalysisResult {
  mealTitle: string;
  summaryNote?: string;
  items: AiMealComponent[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalFiber?: number;
  totalSugar?: number;
  usedModel?: string;
}

export interface ParsedRecipeIngredient {
  name: string;
  amountGrams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
}

export interface ParsedRecipeResult {
  name: string;
  category: 'bread' | 'meal' | 'snack';
  servingName?: string;
  servingWeightGrams?: number;
  portionCount?: number;
  cookedWeightGrams?: number;
  ingredients: ParsedRecipeIngredient[];
  summaryNote?: string;
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

  const prompt = `Du bist ein hochentwickelter, feinfühliger deutscher Ernährungs- und Lebensmittelexperte.
Analysiere die folgende Mahlzeit (anhand des Fotos und/oder der Beschreibung bzw. des Diktats des Nutzers).
${recipesContext}
Nutzer-Beschreibung / Diktat: "${description.trim() || 'Keine Notiz vorhanden - bitte analysiere das Foto sorgfältig'}"

WICHTIGE ANWEISUNGEN ZUR SPRACH- & INTENTIONS-INTERPRETATION:
Der Nutzer (und seine Familie) neigen dazu, Eingaben anspruchsvoll, umgangssprachlich, zusammengesetzt oder verschachtelt zu formulieren.
Du MUSST die eigentliche Intention erschließen und intelligente Umrechnungen vornehmen:
1. Typische Küchenmaße & Redewendungen:
   - "ein Schuss" (Milch, Sahne, Öl) -> ca. 15-20 ml / g
   - "ein Klecks" (Schmand, Quark, Mayo, Butter) -> ca. 20-25 g
   - "eine Messerspitze" / "eine Prise" -> ca. 1-2 g
   - "ein Esslöffel (EL)" -> Öl ca. 10g (90 kcal), Joghurt/Quark ca. 15g
   - "ein Teelöffel (TL)" -> ca. 5g
   - "eine Handvoll" (Nüsse, Beeren, Spinat) -> ca. 25-30g
   - "ein halber Becher" (Schmand, Joghurt, Quark) -> ca. 100-125g
   - "eine halbe Dose" (Thunfisch, Kichererbsen, Tomaten) -> halbes typisches deutsches Abtropfgewicht (z. B. 75g Thunfisch, 120g Kichererbsen)
   - Obstgrößen: "große Banane" (ca. 130g netto), "kleine Banane" (ca. 90g netto), "mittlere Banane" (ca. 110g netto), "großer Apfel" (ca. 200g)
2. Implizite Zubereitungszutaten:
   - Wenn jemand von "Spiegelei", "Rührei", "gebratenem Fleisch/Gemüse" spricht, berücksichtige verwendetes Anbratfett (z. B. 1 TL bis 1 EL Öl/Butter), sofern nicht explizit "fettfrei" angegeben.
   - Wenn jemand "Brot mit Butter und Käse" sagt, erfasse Brot, Butter (~10g) und Käse (~30g) als separate Komponenten.
3. Berechne für jede Komponente die Nährwerte (Kalorien, Protein, Kohlenhydrate, Fett, Ballaststoffe, Zucker) sowohl für die geschätzte Portionsmenge als auch pro 100g.
4. Gib jeder Komponente eine klare Einheitenbezeichnung (z. B. "2 Spiegeleier (ca. 110g)", "1 Scheibe (ca. 50g)", "1 EL (ca. 10g)").

Antworte ausschließlich im angegebenen JSON-Format:
{
  "mealTitle": "Treffender Mahlzeitentitel (z.B. Frühstück mit Dinkelbrot, Gouda und 2 Spiegeleiern)",
  "summaryNote": "Kurze, feinfühlige Zusammenfassung deiner Schätzung und Umrechnung (1-2 Sätze)",
  "items": [
    {
      "name": "Dinkel-Vollkornbrot",
      "amountGrams": 90,
      "unitLabel": "2 Scheiben (ca. 90g)",
      "calories": 215,
      "protein": 7.5,
      "carbs": 39.0,
      "fat": 1.9,
      "fiber": 6.2,
      "sugar": 1.5,
      "calories100g": 239,
      "protein100g": 8.3,
      "carbs100g": 43.3,
      "fat100g": 2.1,
      "fiber100g": 6.9,
      "sugar100g": 1.7
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
      const fiber = item.fiber !== undefined ? Math.max(0, Math.round(Number(item.fiber) * 10) / 10) : undefined;
      const sugar = item.sugar !== undefined ? Math.max(0, Math.round(Number(item.sugar) * 10) / 10) : undefined;

      const calories100g = Math.round(Number(item.calories100g) || (calories / amountGrams) * 100);
      const protein100g = Math.round((Number(item.protein100g) || (protein / amountGrams) * 100) * 10) / 10;
      const carbs100g = Math.round((Number(item.carbs100g) || (carbs / amountGrams) * 100) * 10) / 10;
      const fat100g = Math.round((Number(item.fat100g) || (fat / amountGrams) * 100) * 10) / 10;
      const fiber100g = item.fiber100g !== undefined
        ? Math.round(Number(item.fiber100g) * 10) / 10
        : fiber !== undefined ? Math.round((fiber / amountGrams) * 100 * 10) / 10 : undefined;
      const sugar100g = item.sugar100g !== undefined
        ? Math.round(Number(item.sugar100g) * 10) / 10
        : sugar !== undefined ? Math.round((sugar / amountGrams) * 100 * 10) / 10 : undefined;

      return {
        id: `ai_comp_${Date.now()}_${index}`,
        name: String(item.name || 'Zutat'),
        amountGrams,
        unitLabel: item.unitLabel ? String(item.unitLabel) : `${amountGrams}g`,
        calories,
        protein,
        carbs,
        fat,
        fiber,
        sugar,
        calories100g,
        protein100g,
        carbs100g,
        fat100g,
        fiber100g,
        sugar100g,
      };
    });

    const totalCalories = items.reduce((sum, it) => sum + it.calories, 0);
    const totalProtein = Math.round(items.reduce((sum, it) => sum + it.protein, 0) * 10) / 10;
    const totalCarbs = Math.round(items.reduce((sum, it) => sum + it.carbs, 0) * 10) / 10;
    const totalFat = Math.round(items.reduce((sum, it) => sum + it.fat, 0) * 10) / 10;
    const totalFiber = Math.round(items.reduce((sum, it) => sum + (it.fiber || 0), 0) * 10) / 10;
    const totalSugar = Math.round(items.reduce((sum, it) => sum + (it.sugar || 0), 0) * 10) / 10;

    return {
      mealTitle: parsed.mealTitle || 'Analysierte Mahlzeit',
      summaryNote: parsed.summaryNote,
      items,
      totalCalories,
      totalProtein,
      totalCarbs,
      totalFat,
      totalFiber,
      totalSugar,
      usedModel: model,
    };
  } catch (err: any) {
    console.error('Gemini meal analysis failed:', err);
    throw err;
  }
}

/**
 * Parses a whole dictated or typed recipe text (German household phrasing, complex ingredients,
 * baking or cooking loss, portions) into structured recipe ingredients and macros.
 */
export async function parseRecipeWithGemini({
  text,
  apiKey,
}: {
  text: string;
  apiKey: string;
}): Promise<ParsedRecipeResult> {
  const cleanText = text.trim();
  if (!cleanText) {
    throw new Error('Bitte gib einen Rezepttext oder eine Zutatenliste ein.');
  }

  const prompt = `Du bist ein präziser deutscher Meisterbäcker und Ernährungswissenschaftler.
Analysiere den folgenden Rezepttext / das Diktat des Nutzers.
Erkenne das Gericht bzw. Brot, alle Zutaten mit Mengen in Gramm und berechne exakte Nährwerte.

Rezept-Text / Diktat des Nutzers:
"""${cleanText}"""

WICHTIGE ANWEISUNGEN:
1. Erkenne den Namen des Gerichts/Brots (z. B. "Blumenkohl-Auflauf mit Gouda", "Dinkel-Sauerteigbrot", "Protein-Haferkekse").
2. Bestimme die Kategorie: "bread" (wenn es ein Brot, Brötchen oder Teiglaib ist), "meal" (gekochtes/gebackenes Hauptgericht), oder "snack".
3. Zerlege das Rezept in ALLE Zutaten:
   - Wandle Küchenmaße exakt in Gramm um:
     * "1 Kopf Blumenkohl" -> ca. 800g (oder wie im Text genannt)
     * "3 Eier" -> ca. 165g (ca. 55g pro Ei M)
     * "2 EL Rapsöl / Olivenöl" -> 20g
     * "1 TL Salz" -> 5g (0 kcal)
     * "350 ml Wasser" -> 350g (0 kcal)
     * "1 Würfel Hefe" -> 42g (ca. 45 kcal)
     * "1 Päckchen Trockenhefe" -> 7g (ca. 25 kcal)
     * "1 Becher Schmand / Sahne" -> 200g
     * "ein Schuss Milch" -> 20g
   - Berechne für jede Zutat realistische Kalorien (kcal), Protein (g), Kohlenhydrate (g), Fett (g), Ballaststoffe (fiber in g) und Zucker (sugar in g).
4. Schätze das fertige Gar-/Backgewicht (cookedWeightGrams):
   - Bei Brot: Rohgewicht abzüglich ca. 12% Backverlust (Wasserverdampfung).
   - Bei gekochten Gerichten: Rohgewicht abzüglich ca. 5% Dämpfverlust.
5. Schätze Portionsanzahl (portionCount) und Portionsgewicht (servingWeightGrams):
   - Bei Brot: servingName "1 Scheibe", servingWeightGrams ca. 50g.
   - Bei Aufläufen / Gerichten: typisch 1 Portion (z. B. 300-450g je nach Portionsanzahl).

Antworte ausschließlich im angegebenen JSON-Format:
{
  "name": "Name des Rezepts",
  "category": "bread",
  "servingName": "1 Scheibe",
  "servingWeightGrams": 50,
  "portionCount": 16,
  "cookedWeightGrams": 850,
  "summaryNote": "Kurze Bestätigung der erkannten Zutaten (1 Satz)",
  "ingredients": [
    {
      "name": "Dinkelmehl Type 630",
      "amountGrams": 500,
      "calories": 1725,
      "protein": 65.0,
      "carbs": 345.0,
      "fat": 6.5,
      "fiber": 17.5,
      "sugar": 3.5
    }
  ]
}`;

  try {
    const { rawText } = await callGeminiApi({
      apiKey,
      parts: [{ text: prompt }],
      temperature: 0.2,
    });

    const parsed = JSON.parse(rawText);
    const rawIngs: any[] = Array.isArray(parsed.ingredients) ? parsed.ingredients : [];

    const ingredients: ParsedRecipeIngredient[] = rawIngs.map((ing) => {
      const amountGrams = Math.max(1, Number(ing.amountGrams) || 50);
      return {
        name: String(ing.name || 'Zutat'),
        amountGrams,
        calories: Math.max(0, Math.round(Number(ing.calories) || 0)),
        protein: Math.max(0, Math.round((Number(ing.protein) || 0) * 10) / 10),
        carbs: Math.max(0, Math.round((Number(ing.carbs) || 0) * 10) / 10),
        fat: Math.max(0, Math.round((Number(ing.fat) || 0) * 10) / 10),
        fiber: ing.fiber !== undefined ? Math.max(0, Math.round(Number(ing.fiber) * 10) / 10) : undefined,
        sugar: ing.sugar !== undefined ? Math.max(0, Math.round(Number(ing.sugar) * 10) / 10) : undefined,
      };
    });

    const category: 'bread' | 'meal' | 'snack' =
      parsed.category === 'bread' || parsed.category === 'snack' ? parsed.category : 'meal';

    return {
      name: String(parsed.name || 'Neues Rezept'),
      category,
      servingName: parsed.servingName || (category === 'bread' ? '1 Scheibe' : '1 Portion'),
      servingWeightGrams: Number(parsed.servingWeightGrams) || (category === 'bread' ? 50 : 250),
      portionCount: Number(parsed.portionCount) || 1,
      cookedWeightGrams: Number(parsed.cookedWeightGrams) || undefined,
      ingredients,
      summaryNote: parsed.summaryNote,
    };
  } catch (err: any) {
    console.error('Gemini recipe parse failed:', err);
    throw err;
  }
}

/**
 * Generates an empathetic, concise, and motivating personal nutrition review
 * for the family / girls based on multi-day tracking metrics.
 */
export async function generateAiReportReview({
  reportSummaryText,
  apiKey,
  userName,
}: {
  reportSummaryText: string;
  apiKey: string;
  userName?: string;
}): Promise<string> {
  const prompt = `Du bist ein feinfühliger, erfahrener und motivierender deutscher Ernährungscoach für die Familie (${userName && userName !== 'Du' ? userName : 'unsere Mädels'}).
Analysiere die folgenden harten Fakten aus dem Ernährungstagebuch:

${reportSummaryText}

AUFGABE:
Schreibe eine persönliche, herzliche, übersichtliche und ermutigende Zusammenfassung (ca. 100-150 Wörter).
1. Hebe 1-2 Dinge hervor, die in dieser Zeit absolut herausragend gelaufen sind (z. B. Proteinzufuhr, frische Zutaten, wenig Zucker).
2. Nenne den 1 wichtigsten Hebel für die nächsten Tage (z. B. Ballaststoffe oder Fette) mit einem ganz konkreten, leckeren Alltags-Vorschlag.
3. Behalte einen positiven, wertschätzenden Ton – ohne Moralkeule oder Dogma!

Antworte ausschließlich im angegebenen JSON-Format:
{
  "coachingText": "Dein motivierender Text hier..."
}`;

  try {
    const { rawText } = await callGeminiApi({
      apiKey,
      parts: [{ text: prompt }],
      temperature: 0.3,
    });
    const parsed = JSON.parse(rawText);
    return parsed.coachingText || rawText;
  } catch (err: any) {
    console.error('Gemini report review failed:', err);
    throw err;
  }
}

