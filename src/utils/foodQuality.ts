import { type DiaryEntry, type FoodFocusSettings } from '../db/db';

export interface FoodQualityWarning {
  key: keyof FoodFocusSettings;
  title: string;
  icon: string;
  count: number;
  matchedFoods: string[];
  recommendation: string;
}

export interface FoodQualityAssessment {
  activeWarnings: FoodQualityWarning[];
  praises: string[];
  nextMealName: string;
  hasItemsToday: boolean;
  overallTip: string | null;
}

const KEYWORDS: Record<keyof FoodFocusSettings, string[]> = {
  sugar: [
    'zucker', 'schokolade', 'keks', 'kuchen', 'muffin', 'torte', 'cola', 'fanta', 'sprite',
    'limonade', 'limo', 'eistee', 'energy', 'gummibärchen', 'haribo', 'bonbon', 'nutella',
    'marmelade', 'sirup', 'honig', 'donut', 'croissant', 'gebäck', 'eiscreme', 'dessert',
    'pudding', 'süßig', 'riegel', 'waffel', 'schoko', 'marzipan', 'milchschnitte', 'kinderriegel',
    'hanuta', 'duplo', 'brownie', 'cookies', 'nutella'
  ],
  unhealthyFat: [
    'pommes', 'chips', 'frittiert', 'fritteuse', 'burger', 'currywurst', 'mayo', 'mayonnaise',
    'remoulade', 'blätterteig', 'schmalz', 'bacon', 'speck', 'palmöl', 'fritiert', 'nuggets',
    'kroketten', 'frittierte', 'frittiertes', 'döner', 'bratwurst'
  ],
  cheese: [
    'käse', 'gouda', 'emmentaler', 'parmesan', 'feta', 'mozzarella', 'cheddar', 'brie',
    'camembert', 'raclette', 'fondue', 'gorgonzola', 'schafskäse', 'ziegenkäse', 'überbacken',
    'gratin', 'frischkäse', 'pecorino', 'halloumi', 'bergkäse', 'schmelzkäse', 'edamer'
  ],
  processedMeat: [
    'salami', 'schinken', 'wiener', 'würstchen', 'wurst', 'leberkäse', 'mortadella',
    'bratwurst', 'bockwurst', 'cabanossi', 'mettwurst', 'leberwurst', 'bacon', 'teewurst',
    'fleischwurst', 'serrano', 'prosciutto', 'chorizo', 'speck'
  ],
  cholesterol: [
    'ei', 'eier', 'rührei', 'spiegelei', 'omelett', 'gekochtes ei', 'garnele', 'garnelen',
    'krabbe', 'krabben', 'scampi', 'meeresfrüchte', 'leber', 'innereien'
  ],
  fiber: [
    'weißbrot', 'toast', 'toastbrot', 'croissant', 'helle brötchen', 'baguette', 'weizenbrötchen'
  ],
  salt: [
    'chips', 'salzstange', 'salzstangen', 'brezel', 'salzig', 'cracker', 'fertiggericht',
    'fertigsuppe', 'sojasauce', 'ramen', 'instant'
  ],
};

const FIBER_RICH_KEYWORDS = [
  'vollkorn', 'dinkel', 'hafer', 'haferflocken', 'müsli', 'gemüse', 'salat', 'brokkoli',
  'karotte', 'spinat', 'bohnen', 'linsen', 'kichererbsen', 'chiasamen', 'leinsamen', 'beeren',
  'apfel', 'paprika', 'tomate', 'gurke', 'blumenkohl', 'zucchini', 'sauerkraut'
];

export function assessFoodQuality(
  entries: DiaryEntry[],
  focusSettings?: FoodFocusSettings
): FoodQualityAssessment {
  if (!entries || entries.length === 0) {
    return {
      activeWarnings: [],
      praises: [],
      nextMealName: 'Frühstück',
      hasItemsToday: false,
      overallTip: null,
    };
  }

  const focus: FoodFocusSettings = focusSettings || {
    sugar: true,
    unhealthyFat: true,
    cheese: true,
    processedMeat: true,
    cholesterol: false,
    fiber: true,
    salt: false,
  };

  // Determine next planned meal
  const hasBreakfast = entries.some((e) => e.mealType === 'breakfast');
  const hasLunch = entries.some((e) => e.mealType === 'lunch');
  const hasDinner = entries.some((e) => e.mealType === 'dinner');

  let nextMealName = 'Abendessen';
  if (!hasBreakfast) nextMealName = 'Frühstück';
  else if (!hasLunch) nextMealName = 'Mittagessen';
  else if (!hasDinner) nextMealName = 'Abendessen';
  else nextMealName = 'Abend-Snack / Morgen';

  const warnings: FoodQualityWarning[] = [];
  const praises: string[] = [];

  // Helper to match foods
  const findMatches = (key: keyof FoodFocusSettings): string[] => {
    const list = KEYWORDS[key] || [];
    const matched: string[] = [];

    for (const entry of entries) {
      const lower = entry.name.toLowerCase();
      // If it's a snack labeled as Nascherei, also consider it for sugar/fat
      if (entry.isSnackNibble && (key === 'sugar' || key === 'unhealthyFat')) {
        matched.push(entry.name);
        continue;
      }
      for (const kw of list) {
        if (lower.includes(kw)) {
          if (!matched.includes(entry.name)) {
            matched.push(entry.name);
          }
          break;
        }
      }
    }
    return matched;
  };

  // 1. Industriezucker
  if (focus.sugar) {
    const matched = findMatches('sugar');
    if (matched.length > 0) {
      warnings.push({
        key: 'sugar',
        title: 'Industriezucker & Süßwaren',
        icon: '🍬',
        count: matched.length,
        matchedFoods: matched,
        recommendation: `Du hattest heute schon reichlich Industriezucker (${matched.slice(0, 2).join(', ')}). Bitte achte beim ${nextMealName} darauf, etwas Herzhaftes ohne Zucker zu wählen, damit dein Blutzucker stabil bleibt.`,
      });
    } else if (entries.length >= 2) {
      praises.push('Zuckerfrei geblieben: Bisher kein Industriezucker geloggt! 🍬❌');
    }
  }

  // 2. Ungesunde Fette & Frittiertes
  if (focus.unhealthyFat) {
    const matched = findMatches('unhealthyFat');
    if (matched.length > 0) {
      warnings.push({
        key: 'unhealthyFat',
        title: 'Ungesunde Fette & Frittiertes',
        icon: '🧈',
        count: matched.length,
        matchedFoods: matched,
        recommendation: `Heute waren schon gesättigte oder frittierte Fette dabei (${matched.slice(0, 2).join(', ')}). Greife beim ${nextMealName} lieber zu leichten, ungesättigten Fetten wie etwas Olivenöl, Avocado oder Nüssen.`,
      });
    }
  }

  // 3. Käse-Bremse
  if (focus.cheese) {
    const matched = findMatches('cheese');
    if (matched.length >= 2) {
      warnings.push({
        key: 'cheese',
        title: 'Käse- & Schmelzkäse-Bremse',
        icon: '🧀',
        count: matched.length,
        matchedFoods: matched,
        recommendation: `Käse war heute schon mehrfach dabei (${matched.slice(0, 2).join(', ')}). Spar dir zum ${nextMealName} das Überbacken oder Extra-Käse für eine leichtere Verdauung.`,
      });
    } else if (matched.length === 1 && nextMealName === 'Abendessen') {
      // Gentle reminder if dinner is next
      warnings.push({
        key: 'cheese',
        title: 'Käse im Blick behalten',
        icon: '🧀',
        count: 1,
        matchedFoods: matched,
        recommendation: `Du hattest heute schon Käse (${matched[0]}). Wenn du magst, wähle fürs ${nextMealName} eine käsefreie Beilage als Ausgleich.`,
      });
    }
  }

  // 4. Stark verarbeitetes Fleisch
  if (focus.processedMeat) {
    const matched = findMatches('processedMeat');
    if (matched.length > 0) {
      warnings.push({
        key: 'processedMeat',
        title: 'Verarbeitete Wurst & Pökelwaren',
        icon: '🌭',
        count: matched.length,
        matchedFoods: matched,
        recommendation: `Heute gab es bereits verarbeitete Wurst (${matched.slice(0, 2).join(', ')}). Wähle zum ${nextMealName} lieber mageres Geflügel, Fisch, Ei, Tofu oder Hülsenfrüchte.`,
      });
    }
  }

  // 5. Cholesterin & Eier
  if (focus.cholesterol) {
    const matched = findMatches('cholesterol');
    if (matched.length >= 2) {
      warnings.push({
        key: 'cholesterol',
        title: 'Cholesterin & tierische Fette',
        icon: '🥚',
        count: matched.length,
        matchedFoods: matched,
        recommendation: `Heute waren schon mehrere cholesterinreiche Zutaten dabei (${matched.slice(0, 2).join(', ')}). Halte tierische Fette für den Rest des Tages bewusst moderat.`,
      });
    }
  }

  // 6. Ballaststoffe
  if (focus.fiber && entries.length >= 2) {
    const hasFiber = entries.some((e) => {
      const lower = e.name.toLowerCase();
      return FIBER_RICH_KEYWORDS.some((kw) => lower.includes(kw));
    });

    if (!hasFiber) {
      warnings.push({
        key: 'fiber',
        title: 'Ballaststoff-Mangel',
        icon: '🌾',
        count: 1,
        matchedFoods: [],
        recommendation: `Bisher gab es heute kaum Ballaststoffe. Eine Portion frisches Gemüse, Rohkost oder Vollkorn zum ${nextMealName} tut deinem Darm gut und hält dich nachhaltig satt.`,
      });
    } else {
      praises.push('Super: Ballaststoffreiche Lebensmittel auf deinem Speiseplan! 🥦🌾');
    }
  }

  // 7. Salzgehalt
  if (focus.salt) {
    const matched = findMatches('salt');
    if (matched.length > 0) {
      warnings.push({
        key: 'salt',
        title: 'Hoher Salzgehalt',
        icon: '🧂',
        count: matched.length,
        matchedFoods: matched,
        recommendation: `Das Essen heute war recht salzreich (${matched.slice(0, 2).join(', ')}). Achte beim ${nextMealName} auf frische Kräuter statt Salz und trink 1–2 Gläser Wasser extra.`,
      });
    }
  }

  // Compile overall headline tip (prioritize top warning)
  let overallTip: string | null = null;
  if (warnings.length > 0) {
    overallTip = warnings[0].recommendation;
  } else if (entries.length >= 2 && praises.length > 0) {
    overallTip = `Klasse Auswahl! Du hast heute alle deine Fokus-Filter beachtet. Mach weiter so! ✨`;
  }

  return {
    activeWarnings: warnings,
    praises,
    nextMealName,
    hasItemsToday: true,
    overallTip,
  };
}
