import { type AiMealComponent } from '../services/geminiApi';

/**
 * Sanitizes and recalibrates AI-generated meal components against realistic German household
 * measurements (spoons, cups, tubs, packages).
 *
 * LLMs frequently overestimate dry goods (oats, seeds, protein powder) by treating a tablespoon
 * as 30g (standard fluid ounce / scoop confusion) instead of the actual ~10g.
 * Similarly, "ein Päckchen Quark" in a breakfast bowl is the standard 250g portion, not a 500g family tub.
 */
export function sanitizeMealComponents(
  items: AiMealComponent[],
  rawInput: string
): AiMealComponent[] {
  if (!items || items.length === 0) return items;

  const rawLower = (rawInput || '').toLowerCase();

  return items.map((item) => {
    const nameLower = item.name.toLowerCase();
    const unitLower = (item.unitLabel || '').toLowerCase();
    let targetGrams: number | null = null;
    let newUnitLabel = item.unitLabel;

    // Helper: Parse number of spoons from raw user speech or AI's unitLabel
    const findSpoonCount = (keywords: string[]): number | null => {
      // 1. Check unitLabel first (e.g. "3 Esslöffel", "2 EL", "3 Löffel")
      const unitMatch = unitLower.match(/(\d+)\s*(?:esslöffel|el|löffel)/);
      if (unitMatch) {
        return parseInt(unitMatch[1], 10);
      }

      // 2. Check raw input around the ingredient's keywords
      for (const kw of keywords) {
        // e.g. "3 esslöffel haferflocken", "3 el haferflocken", "3 löffel haferflocken"
        const regexBefore = new RegExp(`(\\d+)\\s*(?:esslöffel|el|löffel|gehäufte?\\s*el)\\s*(?:von\\s*)?(?:fein(?:en?)?\\s*)?(?:${kw})`, 'i');
        const matchBefore = rawLower.match(regexBefore);
        if (matchBefore) return parseInt(matchBefore[1], 10);

        // e.g. "haferflocken 3 esslöffel", "haferflocken, 3 el"
        const regexAfter = new RegExp(`(?:${kw})[^,.]*?(\\d+)\\s*(?:esslöffel|el|löffel)`, 'i');
        const matchAfter = rawLower.match(regexAfter);
        if (matchAfter) return parseInt(matchAfter[1], 10);
      }

      // Word numerals in German: ein/eine/zwei/drei/vier
      const wordsMap: Record<string, number> = {
        ein: 1, eine: 1, einen: 1,
        zwei: 2,
        drei: 3,
        vier: 4,
        fünf: 5,
        sechs: 6,
      };
      for (const [w, num] of Object.entries(wordsMap)) {
        for (const kw of keywords) {
          const regexWord = new RegExp(`(?:${w})\\s*(?:esslöffel|el|löffel)\\s*(?:von\\s*)?(?:${kw})`, 'i');
          if (regexWord.test(rawLower)) return num;
        }
      }

      return null;
    };

    // 1. HAFERFLOCKEN & MÜSLI (Realität: 1 gehäufter EL = ca. 10g, gestrichen 8g)
    if (nameLower.includes('haferflocke') || nameLower.includes('müsli') || (nameLower.includes('flocken') && !nameLower.includes('fleisch'))) {
      const spoons = findSpoonCount(['haferflocke', 'müsli', 'flocke']);
      if (spoons && spoons > 0) {
        const realisticGrams = spoons * 10;
        // If AI hallucinated a high value like 30g/spoon (e.g. 90g for 3 spoons instead of 30g)
        if (item.amountGrams > spoons * 16) {
          targetGrams = realisticGrams;
          newUnitLabel = `${spoons} EL (${realisticGrams}g)`;
        }
      }
    }

    // 2. CHIASAMEN, LEINSAMEN, FLOHSAMEN, SESAM, MOHN (Realität: 1 EL = ca. 10g, 1 TL = ca. 4-5g)
    if (nameLower.includes('chia') || nameLower.includes('leinsamen') || nameLower.includes('flohsamen') || nameLower.includes('sesam') || nameLower.includes('samen')) {
      const spoons = findSpoonCount(['chia', 'leinsamen', 'flohsamen', 'sesam', 'samen']);
      if (spoons && spoons > 0) {
        const realisticGrams = spoons * 10;
        if (item.amountGrams > spoons * 15) {
          targetGrams = realisticGrams;
          newUnitLabel = `${spoons} EL (${realisticGrams}g)`;
        }
      } else if (!rawLower.includes(`${item.amountGrams}g`) && !rawLower.includes(`${item.amountGrams} g`) && item.amountGrams > 30) {
        // Fallback: If no grams specified and seeds > 30g, normal serving is 20g
        targetGrams = 20;
        newUnitLabel = 'ca. 2 EL (20g)';
      }
    }

    // 3. PROTEINPULVER / EIWEISSPULVER (Realität: 1 EL aus Besteckschublade = ca. 10-12g, 1 Messlöffel/Scoop = ca. 25-30g)
    if (nameLower.includes('protein') || nameLower.includes('eiweiß') || nameLower.includes('whey') || nameLower.includes('casein')) {
      const hasScoop = rawLower.includes('scoop') || rawLower.includes('messlöffel') || unitLower.includes('scoop') || unitLower.includes('messlöffel');
      if (!hasScoop) {
        const spoons = findSpoonCount(['protein', 'eiweiß', 'whey', 'casein']);
        if (spoons && spoons > 0) {
          const realisticGrams = spoons * 11; // 2 EL = 22g, 1 EL = 11g
          if (item.amountGrams > spoons * 18) {
            targetGrams = realisticGrams;
            newUnitLabel = `${spoons} EL (${realisticGrams}g)`;
          }
        }
      }
    }

    // 4. MAGERQUARK / QUARK (Realität: "ein Päckchen / Packung" im Frühstück ist 250g; 500g ist ein riesiges halbes Kilo)
    if (nameLower.includes('magerquark') || nameLower.includes('speisequark') || (nameLower.includes('quark') && !nameLower.includes('tasche'))) {
      const mentionsPackage = rawLower.includes('päckchen') || rawLower.includes('packung') || rawLower.includes('schälchen') || rawLower.includes('becher') || unitLower.includes('päckchen') || unitLower.includes('packung');
      const mentions500g = rawLower.includes('500') || rawLower.includes('groß') || rawLower.includes('ganzes pfund') || rawLower.includes('halbes kilo');
      if (mentionsPackage && !mentions500g && item.amountGrams >= 450) {
        targetGrams = 250;
        newUnitLabel = '1 Päckchen / Becher (250g)';
      }
    }

    // 5. TEELÖFFEL (TL) FÜR BELIEBIGE ZUTATEN (Realität: 1 TL = 4-5g)
    const tspMatch = unitLower.match(/(\d+)\s*(?:teelöffel|tl)/);
    if (tspMatch) {
      const tspCount = parseInt(tspMatch[1], 10);
      if (tspCount > 0 && item.amountGrams > tspCount * 10) {
        targetGrams = tspCount * 5;
        newUnitLabel = `${tspCount} TL (${targetGrams}g)`;
      }
    }

    // 6. ÖLE (Realität: 1 EL = ca. 10-12g, 1 TL = ca. 4g)
    if (nameLower.includes('öl') || nameLower.includes('olivenöl') || nameLower.includes('rapsöl') || nameLower.includes('leinöl')) {
      const spoons = findSpoonCount(['öl', 'olivenöl', 'rapsöl', 'leinöl']);
      if (spoons && spoons > 0 && item.amountGrams > spoons * 18) {
        targetGrams = spoons * 11;
        newUnitLabel = `${spoons} EL (${targetGrams}g)`;
      }
    }

    // Apply recalibration if a realistic correction was determined
    if (targetGrams !== null && targetGrams > 0 && targetGrams !== item.amountGrams) {
      const ratio = targetGrams / 100;
      return {
        ...item,
        amountGrams: targetGrams,
        unitLabel: newUnitLabel,
        calories: Math.round(item.calories100g * ratio),
        protein: Math.round(item.protein100g * ratio * 10) / 10,
        carbs: Math.round(item.carbs100g * ratio * 10) / 10,
        fat: Math.round(item.fat100g * ratio * 10) / 10,
        fiber: item.fiber100g !== undefined ? Math.round(item.fiber100g * ratio * 10) / 10 : item.fiber,
        sugar: item.sugar100g !== undefined ? Math.round(item.sugar100g * ratio * 10) / 10 : item.sugar,
      };
    }

    return item;
  });
}
