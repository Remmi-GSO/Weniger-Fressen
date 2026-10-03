/**
 * Intelligent helper to estimate and extract dietary fiber (Ballaststoffe) and sugar (Zucker)
 * when not explicitly provided by the product database or when logging custom items.
 */

export function estimateFiber(name: string = '', grams: number = 100, calories: number = 0): number {
  const n = name.toLowerCase();

  // High fiber staples (per 100g)
  if (n.includes('chia') || n.includes('leinsamen') || n.includes('flohsamen')) {
    return Math.round((grams * 0.30) * 10) / 10;
  }
  if (n.includes('haferflocke') || n.includes('müsli') || n.includes('kleie') || n.includes('vollkorn')) {
    return Math.round((grams * 0.09) * 10) / 10;
  }
  if (n.includes('dinkel') || n.includes('roggen') || n.includes('brot') || n.includes('pumpernickel')) {
    return Math.round((grams * 0.065) * 10) / 10;
  }
  if (n.includes('linse') || n.includes('bohne') || n.includes('kichererbse') || n.includes('erbse')) {
    return Math.round((grams * 0.075) * 10) / 10;
  }
  if (n.includes('beere') || n.includes('erdbeere') || n.includes('himbeere') || n.includes('heidelbeere')) {
    return Math.round((grams * 0.045) * 10) / 10;
  }
  if (n.includes('apfel') || n.includes('birne') || n.includes('orange') || n.includes('banane')) {
    return Math.round((grams * 0.024) * 10) / 10;
  }
  if (n.includes('blumenkohl') || n.includes('brokkoli') || n.includes('karotte') || n.includes('möhre') || n.includes('salat') || n.includes('rucola') || n.includes('spinat') || n.includes('gemüse') || n.includes('kohl') || n.includes('zucchini')) {
    return Math.round((grams * 0.03) * 10) / 10;
  }
  if (n.includes('nuss') || n.includes('nüsse') || n.includes('mandel') || n.includes('cashew') || n.includes('walnuss')) {
    return Math.round((grams * 0.07) * 10) / 10;
  }
  if (n.includes('kartoffel') || n.includes('süßkartoffel')) {
    return Math.round((grams * 0.02) * 10) / 10;
  }
  if (n.includes('nudel') || n.includes('pasta') || n.includes('reis')) {
    return Math.round((grams * 0.025) * 10) / 10;
  }

  // Animal products contain virtually 0g fiber
  if (n.includes('fleisch') || n.includes('hähnchen') || n.includes('rind') || n.includes('schwein') || n.includes('fisch') || n.includes('lachs') || n.includes('thunfisch') || n.includes('ei ') || n.includes('eier') || n.includes('käse') || n.includes('quark') || n.includes('milch') || n.includes('butter') || n.includes('öl')) {
    return 0;
  }

  // General estimation based on calories for mixed meals (~1.5g per 100 kcal)
  if (calories > 0) {
    return Math.round((calories / 100) * 1.4 * 10) / 10;
  }

  return Math.round(grams * 0.015 * 10) / 10;
}

export function estimateSugar(name: string = '', grams: number = 100, carbs: number = 0): number {
  const n = name.toLowerCase();

  // Fresh low-sugar vegetables & salads (must check BEFORE snacks and beverages)
  if (
    n.includes('rucola') ||
    n.includes('salat') ||
    n.includes('blumenkohl') ||
    n.includes('brokkoli') ||
    n.includes('spinat') ||
    n.includes('gurke') ||
    n.includes('zucchini') ||
    n.includes('pilz') ||
    n.includes('champignon')
  ) {
    return Math.round(Math.min(grams * 0.018, carbs > 0 ? carbs * 0.8 : grams * 0.018) * 10) / 10;
  }

  // Pure / high sugar items
  if (n.includes('zucker') || n.includes('honig') || n.includes('sirup')) {
    return Math.round(grams * 0.85 * 10) / 10;
  }
  const isCola = (/\b(cola|coca[- ]?cola|pepsi|coke|kola)\b/i.test(n) || n.includes('coca-cola') || (n.includes('cola') && !n.includes('rucola')));
  if (
    n.includes('marmelade') ||
    n.includes('nutella') ||
    n.includes('schoko') ||
    n.includes('keks') ||
    n.includes('kuchen') ||
    n.includes('bonbon') ||
    n.includes('gummibär') ||
    isCola ||
    n.includes('limo') ||
    n.includes('eis')
  ) {
    return Math.round(Math.min(grams * 0.5, carbs > 0 ? carbs * 0.85 : grams * 0.5) * 10) / 10;
  }
  if (n.includes('banane') || n.includes('traube') || n.includes('saft') || n.includes('smoothie')) {
    return Math.round(Math.min(grams * 0.12, carbs > 0 ? carbs * 0.75 : grams * 0.12) * 10) / 10;
  }
  if (n.includes('apfel') || n.includes('birne') || n.includes('orange') || n.includes('mandarine')) {
    return Math.round(Math.min(grams * 0.09, carbs > 0 ? carbs * 0.7 : grams * 0.09) * 10) / 10;
  }
  if (n.includes('milch') || n.includes('joghurt') || n.includes('quark')) {
    return Math.round(Math.min(grams * 0.04, carbs > 0 ? carbs : grams * 0.04) * 10) / 10;
  }
  if (n.includes('brot') || n.includes('brötchen') || n.includes('nudel') || n.includes('reis') || n.includes('haferflocke') || n.includes('kartoffel')) {
    // Starch with low simple sugars
    return Math.round(Math.min(grams * 0.02, carbs * 0.05) * 10) / 10;
  }

  // Low/no sugar items
  if (n.includes('fleisch') || n.includes('fisch') || n.includes('ei') || n.includes('öl') || n.includes('butter')) {
    return 0;
  }

  // Fallback: estimate ~25% of carbs if carbs are known
  if (carbs > 0) {
    return Math.round(carbs * 0.25 * 10) / 10;
  }

  return 0;
}
