import { type FoodProduct } from './foodApi';
import { sanitizeMealComponents } from '../utils/portionSanitizer';

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

export interface AiAnswerResult {
  headline: string;
  answerText: string;
  keyPoints?: string[];
  actionSuggestion?: string;
}

export interface AiWorkoutResult {
  activityName: string;
  durationMinutes: number;
  caloriesBurned: number;
  intensity?: 'gentle' | 'moderate' | 'brisk' | 'intense';
}

export interface AiMealAnalysisResult {
  intent?: 'meal' | 'qa' | 'recipe' | 'workout';
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
  qaAnswer?: AiAnswerResult;
  workoutData?: AiWorkoutResult;
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
    category?: string;
    servingName?: string;
    servingWeightGrams?: number;
    calories100g: number;
    protein100g: number;
    carbs100g: number;
    fat100g: number;
    fiber100g?: number;
    sugar100g?: number;
  }>;
}): Promise<AiMealAnalysisResult> {
  const recipesContext = userRecipes && userRecipes.length > 0
    ? `\nGespeicherte Rezepte des Nutzers in der App (aus der lokalen Rezept-Datenbank):\n${userRecipes.map(r => 
        `- [Kategorie: ${r.category || 'allgemein'}] "${r.name}": ${r.calories100g} kcal/100g (Protein: ${r.protein100g}g, KH: ${r.carbs100g}g, Fett: ${r.fat100g}g${r.fiber100g ? `, Ballaststoffe: ${r.fiber100g}g` : ''})${r.servingWeightGrams ? `, Portion/Scheibe "${r.servingName || 'Scheibe'}" ca. ${r.servingWeightGrams}g (= ${Math.round((r.calories100g * r.servingWeightGrams) / 100)} kcal)` : ''}`
      ).join('\n')}

WICHTIGE VORRANG-REGEL FÜR SELBSTGEMACHTES / SELBSTGEBACKENES (INSBESONDERE BROT):
- Wenn der Nutzer "selbstgebackenes Brot", "selbstgemachtes Brot", "unser Brot", "mein Brot" oder "eine Scheibe Brot" erwähnt und oben in den Rezepten ein Brotrezept (Kategorie 'bread' oder mit 'Brot' im Namen) hinterlegt ist, MUSST DU ZWINGEND UND AUSNAHMSLOS dieses gespeicherte Brotrezept verwenden!
- Verwende als Portionsgröße genau das Scheibengewicht aus dem Rezept (z. B. ca. 50g pro Scheibe) und übernimm exakt dessen Nährwerte pro 100g.
- Verwende in diesem Fall NIEMALS generische Supermarkt-Brotwerte, denn der Nutzer backt sein eigenes Brot und hat es eigens dafür in der App berechnet und abgespeichert!
- Dasselbe gilt für selbstgekochte Mahlzeiten, Aufläufe oder Smoothies aus der Liste oben: Bevorzuge immer die gespeicherten Rezeptwerte des Nutzers vor Pauschalschätzungen.\n`
    : `\nHinweis zu selbstgebackenem Brot: Falls der Nutzer "selbstgebackenes Brot" erwähnt, gehe von vollwertigem, nahrhaftem Dinkel-/Sauerteigbrot aus (ca. 225 kcal/100g, ca. 50g pro Scheibe), nicht von einfachem Toastbrot.\n`;

  const prompt = `Du bist ein hochentwickelter deutscher Ernährungs- und Lebensmittelexperte sowie persönlicher KI-Coach ("Universal Magic Assistant").
Analysiere die Eingabe des Nutzers (Foto und/oder Beschreibung bzw. Diktat):
${recipesContext}
Nutzer-Eingabe / Diktat: "${description.trim() || 'Keine Notiz vorhanden - bitte analysiere das Foto sorgfältig'}"

ERKENNE ZUERST DIE INTENTION DES NUTZERS ("intent"):

FALL 1: "qa" (Ernährungsfrage / Wissensfrage / Beratung / Erklärung)
Wenn der Nutzer eine Frage stellt oder um Erklärung bittet (z. B. "Wie kommt der Zucker aus meinen Johannisbeeren?", "Warum stagniert mein Gewicht?", "Ist Skyr besser als Magerquark?", "Erkläre mir...", "Was bedeutet...", "Wie viel Eiweiß brauche ich?"):
- Setze "intent": "qa"
- Erstelle ein ausführliches "qaAnswer"-Objekt mit klarer Überschrift ("headline"), fundierter, verständlicher und ermutigender Erklärung ("answerText" in Fließtext mit 2-4 Absätzen, verständlich für den Alltag!), 2-4 prägnanten Stichpunkten ("keyPoints") und einem konkreten Praxistipp ("actionSuggestion").
- "items": [] (keine erfundenen Mahlzeitkomponenten!)
- "mealTitle": Kurzer Thementitel (z. B. "Zucker in Johannisbeeren erklärt")
- "summaryNote": Kurze Zusammenfassung

FALL 2: "workout" (Sport- & Aktivitäts-Erfassung)
Wenn der Nutzer eine Trainingseinheit beschreibt (z. B. "40 Minuten zügig auf dem Crosstrainer", "5 km Joggen in 30 Minuten", "1 Stunde Krafttraining"):
- Setze "intent": "workout"
- Erstelle "workoutData" mit { activityName, durationMinutes, caloriesBurned, intensity: "gentle"|"moderate"|"brisk"|"intense" }
- "items": []

FALL 3: "recipe" (Rezept-Kreations-Wunsch)
Wenn der Nutzer ein neues Rezept kreieren möchte (z. B. "Erstelle ein Rezept mit...", "Schnelles Rezept für 400 kcal..."):
- Setze "intent": "recipe"
- Berechne die Zutaten als "items", gib Zubereitungsschritte in "summaryNote"

FALL 4: "meal" (Standard: Mahlzeit gegessen oder Foto analysieren)
Wenn der Nutzer beschreibt, was er gegessen/getrunken hat oder ein Foto vorliegt:
- Setze "intent": "meal"
- Vorrangregel: Selbstgebackenes Brot & gespeicherte Rezepte zwingend verwenden!
- VERBINDLICHE DEUTSCHE KÜCHEN- UND HAUSHALTSMASSE (EXTREM WICHTIG - VERMEIDE 3-FACHE ÜBERSCHÄTZUNGEN!):
  * Haferflocken / Müsli / Getreideflocken: 1 Esslöffel (EL) = ca. 10g (3 EL = 30g, NIEMALS 90g!)
  * Chiasamen / Leinsamen / Flohsamenschalen / Sesam: 1 Esslöffel (EL) = ca. 10g, 1 TL = ca. 4-5g (2 EL = 20g, NIEMALS 60g!)
  * Eiweißpulver / Proteinpulver:
    - 1 normaler Esslöffel (EL) aus dem Besteckkasten = ca. 10-12g (2 EL = ca. 20-24g, NIEMALS 60g!)
    - 1 Dosier-Scoop / Messlöffel = ca. 25-30g (NUR wenn der Nutzer explizit "Scoop" oder "Messlöffel" sagt!)
  * Magerquark / Quark / Skyr:
    - "ein Päckchen Quark" / "eine Packung Magerquark" (im Frühstück / Müsli): Standard ist 250g (das klassische kleine Päckchen / 250g-Schale oder halbe Packung). Nimm 500g NUR wenn der Nutzer explizit "500g" oder "eine große 500g Packung" sagt!
  * Nüsse / Kerne: 1 EL = ca. 12-15g, 1 Handvoll = ca. 25-30g
  * Beeren / Obst: 1 Handvoll Beeren = ca. 40-50g, 1 Apfel = ca. 150g, 1 Banane = ca. 115g
  * Öle (Olivenöl, Rapsöl): 1 TL = 4g, 1 EL = 10-12g
  * Joghurt / Quark auf dem Löffel: 1 gehäufter EL = ca. 25-30g
  * Milch im Kaffee / Müsli: ein Schuss = 15-20ml, Glas = 200ml
- Berechne für jede Komponente Portionsmengen und Nährwerte.

Antworte ausschließlich im angegebenen JSON-Format:
{
  "intent": "qa" | "meal" | "recipe" | "workout",
  "mealTitle": "Treffender Titel",
  "summaryNote": "Ausführliche Erklärung oder Zusammenfassung",
  "qaAnswer": {
    "headline": "Prägnante Überschrift (z.B. 'Natürlicher Fruchtzucker in Johannisbeeren')",
    "answerText": "Ausführliche, gut lesbare und fundierte Antwort mit Absätzen.",
    "keyPoints": ["Punkt 1", "Punkt 2", "Punkt 3"],
    "actionSuggestion": "Konkreter Tipp für die Praxis"
  },
  "workoutData": {
    "activityName": "Crosstrainer",
    "durationMinutes": 40,
    "caloriesBurned": 320,
    "intensity": "brisk"
  },
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

    const sanitizedItems = sanitizeMealComponents(items, description);

    const totalCalories = sanitizedItems.reduce((sum, it) => sum + it.calories, 0);
    const totalProtein = Math.round(sanitizedItems.reduce((sum, it) => sum + it.protein, 0) * 10) / 10;
    const totalCarbs = Math.round(sanitizedItems.reduce((sum, it) => sum + it.carbs, 0) * 10) / 10;
    const totalFat = Math.round(sanitizedItems.reduce((sum, it) => sum + it.fat, 0) * 10) / 10;
    const totalFiber = Math.round(sanitizedItems.reduce((sum, it) => sum + (it.fiber || 0), 0) * 10) / 10;
    const totalSugar = Math.round(sanitizedItems.reduce((sum, it) => sum + (it.sugar || 0), 0) * 10) / 10;

    const parsedIntent: 'meal' | 'qa' | 'recipe' | 'workout' =
      parsed.intent === 'qa' || parsed.intent === 'recipe' || parsed.intent === 'workout'
        ? parsed.intent
        : (parsed.qaAnswer ? 'qa' : parsed.workoutData ? 'workout' : 'meal');

    return {
      intent: parsedIntent,
      mealTitle: parsed.mealTitle || (parsedIntent === 'qa' ? (parsed.qaAnswer?.headline || 'Ernährungs-Antwort') : 'Analysierte Mahlzeit'),
      summaryNote: parsed.summaryNote || (parsedIntent === 'qa' ? parsed.qaAnswer?.answerText : undefined),
      items: sanitizedItems,
      totalCalories,
      totalProtein,
      totalCarbs,
      totalFat,
      totalFiber,
      totalSugar,
      usedModel: model,
      qaAnswer: parsed.qaAnswer ? {
        headline: String(parsed.qaAnswer.headline || 'Antwort deines Ernährungs-Assistenten'),
        answerText: String(parsed.qaAnswer.answerText || parsed.summaryNote || ''),
        keyPoints: Array.isArray(parsed.qaAnswer.keyPoints) ? parsed.qaAnswer.keyPoints.map(String) : [],
        actionSuggestion: parsed.qaAnswer.actionSuggestion ? String(parsed.qaAnswer.actionSuggestion) : undefined,
      } : undefined,
      workoutData: parsed.workoutData ? {
        activityName: String(parsed.workoutData.activityName || 'Workout'),
        durationMinutes: Math.max(1, Number(parsed.workoutData.durationMinutes) || 30),
        caloriesBurned: Math.max(1, Math.round(Number(parsed.workoutData.caloriesBurned) || 200)),
        intensity: parsed.workoutData.intensity || 'moderate',
      } : undefined,
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
     * "Haferflocken / Müsli": 1 EL = 10g (3 EL = 30g, NIEMALS 90g!)
     * "Chiasamen / Leinsamen / Flohsamenschalen": 1 EL = 10g, 1 TL = 4-5g (2 EL = 20g, NIEMALS 60g!)
     * "Proteinpulver / Eiweißpulver": 1 EL = 10-12g, 1 Messlöffel/Scoop = 25-30g
     * "Magerquark / Quark": "1 Päckchen / Becher" = 250g (falls nicht 500g genannt)
     * "1 Kopf Blumenkohl" -> ca. 800g (oder wie im Text genannt)
     * "3 Eier" -> ca. 165g (ca. 55g pro Ei M)
     * "2 EL Rapsöl / Olivenöl" -> 20-24g
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

export interface AiChefRecipeResult {
  name: string;
  category: 'bread' | 'breakfast' | 'meal' | 'salad' | 'drink' | 'snack';
  servingName: string;
  servingWeightGrams: number;
  portionCount: number;
  cookedWeightGrams?: number;
  prepTimeMinutes?: number;
  instructions: string[];
  ingredients: ParsedRecipeIngredient[];
  tags?: string[];
  summaryNote?: string;
}

/**
 * Generates an inspiring, healthy, and precise recipe from free speech or user ideas
 * using Gemini Flash. Includes exact weights, macro calculation, and instructions.
 */
export async function generateRecipeWithAiChef({
  userPrompt,
  apiKey,
}: {
  userPrompt: string;
  apiKey: string;
}): Promise<AiChefRecipeResult> {
  const prompt = `Du bist ein leidenschaftlicher Spitzenkoch und herzlicher deutscher Ernährungsexperte.
Der Nutzer wünscht sich ein Rezept:
"${userPrompt}"

AUFGABE:
Kreiere ein alltagstaugliches, köstliches und genau kalkuliertes Rezept.
1. Vergib einen appetitanregenden Namen ("name").
2. Wähle die beste Rubrik ("category"): "bread" (Brot/Backen), "breakfast" (Frühstück/Bowls/Pancakes), "meal" (Hauptgerichte/One-Pot), "salad" (Salate/Beilagen), "drink" (Smoothies/Shakes/Drinks) oder "snack" (Snacks/Desserts).
3. Bestimme die Portionen ("portionCount", z.B. 1, 2 oder 4; bei Brot ca. 16 Scheiben) und Portionsname ("servingName", z.B. "1 Scheibe", "1 Portion", "1 Glas", "1 Schüssel").
4. Gib realistische Zubereitungszeit in Minuten ("prepTimeMinutes", z.B. 20).
5. Definiere alle Zutaten mit exakter Grammangabe ("amountGrams") und verlässlichen Makros (Kalorien, Eiweiß, Kohlenhydrate, Fett, Ballaststoffe, Zucker).
6. Verfasse eine leicht verständliche, nummerierte Schritt-für-Schritt-Anleitung ("instructions", Array aus 2-5 Strings, z.B. ["1. Gemüse waschen und würfeln.", "2. Fleisch scharf anbraten...", "3. Mit Gewürzen abschmecken und 10 Min köcheln lassen."]).
7. Bei Brot/Backen: Berechne Backverlust (ca. 12-15% weniger als Rohgewicht) und setze "cookedWeightGrams".

Antworte ausschließlich im angegebenen JSON-Format:
{
  "name": "Rezeptname",
  "category": "meal",
  "servingName": "1 Portion",
  "servingWeightGrams": 350,
  "portionCount": 2,
  "cookedWeightGrams": 700,
  "prepTimeMinutes": 25,
  "instructions": [
    "1. Schritt eins...",
    "2. Schritt zwei...",
    "3. Schritt drei..."
  ],
  "tags": ["High-Protein", "Schnell"],
  "summaryNote": "Ein knackiges Pfannengericht mit viel Eiweiß und wenig Aufwand.",
  "ingredients": [
    {
      "name": "Hähnchenbrustfilet",
      "amountGrams": 300,
      "calories": 330,
      "protein": 69.0,
      "carbs": 0.0,
      "fat": 4.5,
      "fiber": 0.0,
      "sugar": 0.0
    }
  ]
}`;

  try {
    const { rawText } = await callGeminiApi({
      apiKey,
      parts: [{ text: prompt }],
      temperature: 0.3,
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

    const validCats = ['bread', 'breakfast', 'meal', 'salad', 'drink', 'snack'] as const;
    const category = validCats.includes(parsed.category) ? parsed.category : 'meal';

    const rawInstructions = Array.isArray(parsed.instructions)
      ? parsed.instructions.map((s: any) => String(s).trim()).filter(Boolean)
      : typeof parsed.instructions === 'string'
      ? parsed.instructions.split('\n').map((s: string) => s.trim()).filter(Boolean)
      : [];

    return {
      name: String(parsed.name || 'KI-Rezept-Idee'),
      category,
      servingName: String(parsed.servingName || (category === 'bread' ? '1 Scheibe' : category === 'drink' ? '1 Glas' : '1 Portion')),
      servingWeightGrams: Math.max(1, Number(parsed.servingWeightGrams) || (category === 'bread' ? 50 : 250)),
      portionCount: Math.max(1, Number(parsed.portionCount) || 1),
      cookedWeightGrams: parsed.cookedWeightGrams ? Math.max(1, Number(parsed.cookedWeightGrams)) : undefined,
      prepTimeMinutes: parsed.prepTimeMinutes ? Math.max(1, Number(parsed.prepTimeMinutes)) : undefined,
      instructions: rawInstructions,
      ingredients,
      tags: Array.isArray(parsed.tags) ? parsed.tags.map(String) : [],
      summaryNote: parsed.summaryNote ? String(parsed.summaryNote) : undefined,
    };
  } catch (err: any) {
    console.error('Gemini AI chef recipe failed:', err);
    throw err;
  }
}

export interface AiSnackSuggestionItem {
  name: string;
  amountGrams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
}

export interface AiSnackSuggestion {
  id: string;
  name: string;
  portionDescription: string;
  totalGrams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  reasonWhy: string;
  ingredients: AiSnackSuggestionItem[];
}

export interface AiSnackResponse {
  introNote: string;
  suggestions: AiSnackSuggestion[];
}

/**
 * Recommends healthy, satisfying snack ideas fitting the user's remaining calorie and protein budget.
 * Returns structured items with full macros that can be 1-tap logged to diary or saved as custom recipes.
 */
export async function suggestSnacksWithGemini({
  remainingCalories,
  remainingProtein,
  userPrompt,
  apiKey,
  userRecipes,
}: {
  remainingCalories: number;
  remainingProtein?: number;
  userPrompt?: string;
  apiKey: string;
  userRecipes?: Array<{ name: string; category?: string }>;
}): Promise<AiSnackResponse> {
  const recipesContext = userRecipes && userRecipes.length > 0
    ? `\nGespeicherte Rezepte des Nutzers (z.B. eigenes Brot): ${userRecipes.map(r => r.name).join(', ')}\n`
    : '';

  const budgetTarget = Math.max(80, remainingCalories);

  const prompt = `Du bist ein feinfühliger deutscher Ernährungsberater und Koch.
Der Nutzer möchte gesunde, alltagstaugliche Snack-Vorschläge.

AKTUELLES KALORIENBUDGET DES NUTZERS:
- Verbleibende Kalorien für heute: ca. ${budgetTarget} kcal
${remainingProtein ? `- Noch benötigtes Protein heute: ca. ${remainingProtein} g` : ''}
${userPrompt ? `- Spezifischer Wunsch / Diktat des Nutzers: "${userPrompt}"` : ''}
${recipesContext}

AUFGABE:
1. Erstelle 2 bis 3 abwechslungsreiche, alltagstaugliche Snack-Ideen (z. B. Quark-Bowls, Gemüse mit Dip, Nüsse mit Obst, Vollkornbrot-Snack, etc.).
2. JEDER Snack MUSS genau in das Restbudget von maximal ${budgetTarget} kcal passen (ideal zwischen ${Math.min(100, budgetTarget)} kcal und ${budgetTarget} kcal).
3. Berechne für jeden Snack alle Zutaten mit exakter Grammangabe und korrekten Nährwerten (Kalorien, Protein, Kohlenhydrate, Fett, Ballaststoffe, Zucker).
4. Schreibe eine kurze, appetitliche Begründung ("reasonWhy", 1 Satz), warum dieser Snack ideal ist (z. B. "Liefert 22g Protein für langanhaltende Sättigung und ist in 2 Minuten fertig.").

Antworte ausschließlich im angegebenen JSON-Format:
{
  "introNote": "Hier sind 3 gesunde Snack-Ideen, die genau in dein Restbudget von ${budgetTarget} kcal passen:",
  "suggestions": [
    {
      "name": "Beeren-Quark mit Mandelsplittern",
      "portionDescription": "1 Schale (ca. 240g)",
      "totalGrams": 240,
      "calories": 195,
      "protein": 22.0,
      "carbs": 16.5,
      "fat": 4.2,
      "fiber": 4.0,
      "sugar": 8.0,
      "reasonWhy": "Liefert 22g wertvolles Protein bei nur 195 kcal und ist in 2 Minuten zubereitet.",
      "ingredients": [
        {
          "name": "Magerquark",
          "amountGrams": 150,
          "calories": 102,
          "protein": 18.0,
          "carbs": 6.0,
          "fat": 0.5,
          "fiber": 0.0,
          "sugar": 6.0
        },
        {
          "name": "Heidelbeeren (frisch)",
          "amountGrams": 80,
          "calories": 46,
          "protein": 0.6,
          "carbs": 9.5,
          "fat": 0.5,
          "fiber": 2.5,
          "sugar": 8.0
        },
        {
          "name": "Gehackte Mandeln",
          "amountGrams": 10,
          "calories": 59,
          "protein": 2.1,
          "carbs": 0.6,
          "fat": 5.0,
          "fiber": 1.4,
          "sugar": 0.4
        }
      ]
    }
  ]
}`;

  try {
    const { rawText } = await callGeminiApi({
      apiKey,
      parts: [{ text: prompt }],
      temperature: 0.3,
    });

    const parsed = JSON.parse(rawText);
    const rawSuggestions: any[] = Array.isArray(parsed.suggestions) ? parsed.suggestions : [];

    const suggestions: AiSnackSuggestion[] = rawSuggestions.map((s, idx) => {
      const rawIngs: any[] = Array.isArray(s.ingredients) ? s.ingredients : [];
      const ingredients: AiSnackSuggestionItem[] = rawIngs.map((ing) => ({
        name: String(ing.name || 'Zutat'),
        amountGrams: Math.max(1, Number(ing.amountGrams) || 50),
        calories: Math.max(0, Math.round(Number(ing.calories) || 0)),
        protein: Math.max(0, Math.round((Number(ing.protein) || 0) * 10) / 10),
        carbs: Math.max(0, Math.round((Number(ing.carbs) || 0) * 10) / 10),
        fat: Math.max(0, Math.round((Number(ing.fat) || 0) * 10) / 10),
        fiber: ing.fiber !== undefined ? Math.max(0, Math.round(Number(ing.fiber) * 10) / 10) : undefined,
        sugar: ing.sugar !== undefined ? Math.max(0, Math.round(Number(ing.sugar) * 10) / 10) : undefined,
      }));

      const totalGrams = Number(s.totalGrams) || ingredients.reduce((sum, it) => sum + it.amountGrams, 0);
      const calories = Number(s.calories) || ingredients.reduce((sum, it) => sum + it.calories, 0);
      const protein = Number(s.protein) || Math.round(ingredients.reduce((sum, it) => sum + it.protein, 0) * 10) / 10;
      const carbs = Number(s.carbs) || Math.round(ingredients.reduce((sum, it) => sum + it.carbs, 0) * 10) / 10;
      const fat = Number(s.fat) || Math.round(ingredients.reduce((sum, it) => sum + it.fat, 0) * 10) / 10;

      return {
        id: `snack_${Date.now()}_${idx}`,
        name: String(s.name || `Snack-Idee ${idx + 1}`),
        portionDescription: String(s.portionDescription || `${totalGrams}g Portion`),
        totalGrams,
        calories,
        protein,
        carbs,
        fat,
        fiber: s.fiber !== undefined ? Number(s.fiber) : undefined,
        sugar: s.sugar !== undefined ? Number(s.sugar) : undefined,
        reasonWhy: String(s.reasonWhy || 'Schneller und ausgewogener Snack.'),
        ingredients,
      };
    });

    return {
      introNote: String(parsed.introNote || `Hier sind gesunde Snack-Ideen für dein Restbudget (${budgetTarget} kcal):`),
      suggestions,
    };
  } catch (err: any) {
    console.error('Gemini snack suggestion failed:', err);
    throw err;
  }
}

