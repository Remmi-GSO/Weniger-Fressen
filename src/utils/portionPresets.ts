import { type FoodProduct } from '../services/foodApi';

export interface PortionPreset {
  id: string;
  label: string; // e.g. "Klein", "Mittel", "Groß", "1 Scheibe", "1 TL"
  subtitle?: string; // e.g. "ca. 85g"
  grams: number;
  icon?: string;
  isDefault?: boolean;
}

/**
 * Returns intuitive, realistic household portion presets for any food item.
 * Eliminates the need to weigh common items like bananas, apples, eggs, bread, oils, etc.
 */
export function getPortionPresets(product: FoodProduct | null | undefined): PortionPreset[] {
  if (!product) return [];

  const name = (product.name || '').toLowerCase();
  const brand = (product.brand || '').toLowerCase();
  const id = (product.id || '').toLowerCase();
  const servingSize = (product.servingSize || '').toLowerCase();

  // 0. SELBSTGEMACHTE REZEPTE (Gerichte, Mahlzeiten, Aufläufe, Drinks, Brote)
  if (product.source === 'recipe' || product.recipeData || id.startsWith('recipe-')) {
    const isBread = product.recipeCategory === 'bread' || name.includes('brot') || servingSize.includes('scheibe');
    const isDrink = product.recipeCategory === 'drink' || name.includes('shake') || name.includes('smoothie');
    const totalWeight = Math.round(
      product.totalDishWeight ||
      product.cookedWeight ||
      product.recipeData?.cookedWeight ||
      product.recipeData?.totalRawWeight ||
      product.servingWeightGrams ||
      1000
    );

    if (isBread) {
      const sliceG = product.servingWeightGrams || 50;
      return [
        { id: 'rec_bread_1', label: '1 Scheibe', subtitle: `ca. ${sliceG}g`, grams: sliceG, icon: '🍞', isDefault: true },
        { id: 'rec_bread_2', label: '2 Scheiben', subtitle: `ca. ${sliceG * 2}g`, grams: sliceG * 2, icon: '🍞' },
        { id: 'rec_bread_3', label: '3 Scheiben', subtitle: `ca. ${sliceG * 3}g`, grams: sliceG * 3, icon: '🍞' },
        { id: 'rec_bread_half', label: '1/2 Laib', subtitle: `ca. ${Math.round(totalWeight / 2)}g`, grams: Math.round(totalWeight / 2), icon: '🍞' },
        { id: 'rec_bread_full', label: 'Ganzer Laib', subtitle: `ca. ${totalWeight}g`, grams: totalWeight, icon: '🍞' },
      ];
    }

    if (isDrink) {
      return [
        { id: 'rec_drink_glass', label: '1 Glas', subtitle: 'ca. 250ml', grams: 250, icon: '🥤', isDefault: true },
        { id: 'rec_drink_mug', label: '1 großer Becher', subtitle: 'ca. 350ml', grams: 350, icon: '🥤' },
        { id: 'rec_drink_half', label: 'Halbe Menge (1/2)', subtitle: `ca. ${Math.round(totalWeight / 2)}ml`, grams: Math.round(totalWeight / 2), icon: '🥤' },
        { id: 'rec_drink_full', label: 'Ganze Menge (1/1)', subtitle: `ca. ${totalWeight}ml`, grams: totalWeight, icon: '🥤' },
      ];
    }

    // Gekochte Gerichte / Pfannen / Mahlzeiten:
    return [
      { id: 'rec_dish_third', label: '1/3 Drittel', subtitle: `ca. ${Math.round(totalWeight / 3)}g`, grams: Math.round(totalWeight / 3), icon: '🍲', isDefault: true },
      { id: 'rec_dish_half', label: '1/2 Halb', subtitle: `ca. ${Math.round(totalWeight / 2)}g`, grams: Math.round(totalWeight / 2), icon: '🍲' },
      { id: 'rec_dish_quarter', label: '1/4 Viertel', subtitle: `ca. ${Math.round(totalWeight / 4)}g`, grams: Math.round(totalWeight / 4), icon: '🍲' },
      { id: 'rec_dish_full', label: '1/1 Ganz', subtitle: `ca. ${totalWeight}g (Gesamtrezept)`, grams: totalWeight, icon: '🍲' },
      { id: 'rec_dish_fifth', label: '1/5 Fünftel', subtitle: `ca. ${Math.round(totalWeight / 5)}g`, grams: Math.round(totalWeight / 5), icon: '🍲' },
      { id: 'rec_dish_sixth', label: '1/6 Sechstel', subtitle: `ca. ${Math.round(totalWeight / 6)}g`, grams: Math.round(totalWeight / 6), icon: '🍲' },
    ];
  }

  // 1. BANANE (Klein, Mittel, Groß, Sehr groß)
  if (name.includes('banane') || id.includes('banane')) {
    return [
      { id: 'banana_s', label: 'Klein', subtitle: 'ca. 85g', grams: 85, icon: '🍌' },
      { id: 'banana_m', label: 'Mittel', subtitle: 'ca. 120g', grams: 120, icon: '🍌', isDefault: true },
      { id: 'banana_l', label: 'Groß', subtitle: 'ca. 160g', grams: 160, icon: '🍌' },
      { id: 'banana_xl', label: 'Sehr groß', subtitle: 'ca. 200g', grams: 200, icon: '🍌' },
    ];
  }

  // 2. APFEL
  if (name.includes('apfel') || id.includes('apfel')) {
    return [
      { id: 'apple_s', label: 'Klein', subtitle: 'ca. 120g', grams: 120, icon: '🍎' },
      { id: 'apple_m', label: 'Mittel', subtitle: 'ca. 160g', grams: 160, icon: '🍎', isDefault: true },
      { id: 'apple_l', label: 'Groß', subtitle: 'ca. 220g', grams: 220, icon: '🍎' },
    ];
  }

  // 3. BIRNE / PFIRSICH / NECTARINE
  if (name.includes('birne') || name.includes('pfirsich') || name.includes('nektarine')) {
    return [
      { id: 'pear_s', label: 'Klein', subtitle: 'ca. 120g', grams: 120, icon: '🍐' },
      { id: 'pear_m', label: 'Mittel', subtitle: 'ca. 170g', grams: 170, icon: '🍐', isDefault: true },
      { id: 'pear_l', label: 'Groß', subtitle: 'ca. 230g', grams: 230, icon: '🍐' },
    ];
  }

  // 4. ORANGE / MANDARINE / CLEMENTINE
  if (name.includes('orange') || name.includes('mandarine') || name.includes('clementine')) {
    const isMandarine = name.includes('mandarine') || name.includes('clementine');
    if (isMandarine) {
      return [
        { id: 'mand_1', label: '1 Stück', subtitle: 'ca. 50g', grams: 50, icon: '🍊', isDefault: true },
        { id: 'mand_2', label: '2 Stück', subtitle: 'ca. 100g', grams: 100, icon: '🍊' },
        { id: 'mand_3', label: '3 Stück', subtitle: 'ca. 150g', grams: 150, icon: '🍊' },
      ];
    }
    return [
      { id: 'orange_s', label: 'Klein', subtitle: 'ca. 130g', grams: 130, icon: '🍊' },
      { id: 'orange_m', label: 'Mittel', subtitle: 'ca. 180g', grams: 180, icon: '🍊', isDefault: true },
      { id: 'orange_l', label: 'Groß', subtitle: 'ca. 250g', grams: 250, icon: '🍊' },
    ];
  }

  // 5. BEEREN (Erdbeeren, Heidelbeeren, Himbeeren)
  if (name.includes('beere') || name.includes('erdbeere') || name.includes('himbeere') || name.includes('blaubeere')) {
    return [
      { id: 'berry_hand', label: '1 Handvoll', subtitle: 'ca. 40g', grams: 40, icon: '🍓' },
      { id: 'berry_s', label: 'Kleine Schale', subtitle: 'ca. 125g', grams: 125, icon: '🍓', isDefault: true },
      { id: 'berry_m', label: 'Große Schale', subtitle: 'ca. 250g', grams: 250, icon: '🍓' },
    ];
  }

  // 6. AVOCADO
  if (name.includes('avocado')) {
    return [
      { id: 'avo_half', label: '1/2 Avocado', subtitle: 'ca. 75g (essbar)', grams: 75, icon: '🥑' },
      { id: 'avo_whole', label: '1 ganze Avocado', subtitle: 'ca. 150g (essbar)', grams: 150, icon: '🥑', isDefault: true },
    ];
  }

  // 7. EIER
  if (name.includes('ei ') || name.includes('eier') || name.includes('hühnerei') || id.includes('ei_') || id.includes('eier')) {
    return [
      { id: 'egg_s', label: 'Größe S', subtitle: 'ca. 45g', grams: 45, icon: '🥚' },
      { id: 'egg_m', label: 'Größe M', subtitle: 'ca. 55g', grams: 55, icon: '🥚', isDefault: true },
      { id: 'egg_l', label: 'Größe L', subtitle: 'ca. 65g', grams: 65, icon: '🥚' },
      { id: 'egg_2m', label: '2 Eier (M)', subtitle: 'ca. 110g', grams: 110, icon: '🥚' },
    ];
  }

  // 8. BROT (Scheiben)
  if (name.includes('brot') || servingSize.includes('scheibe')) {
    const isToast = name.includes('toast');
    if (isToast) {
      return [
        { id: 'toast_1', label: '1 Scheibe', subtitle: 'ca. 25g', grams: 25, icon: '🍞' },
        { id: 'toast_2', label: '2 Scheiben', subtitle: 'ca. 50g', grams: 50, icon: '🍞', isDefault: true },
        { id: 'toast_3', label: '3 Scheiben', subtitle: 'ca. 75g', grams: 75, icon: '🍞' },
      ];
    }
    const defaultSlice = product.servingWeightGrams || 50;
    return [
      { id: 'bread_thin', label: 'Dünne Scheibe', subtitle: `ca. ${Math.round(defaultSlice * 0.7)}g`, grams: Math.round(defaultSlice * 0.7), icon: '🍞' },
      { id: 'bread_std', label: 'Normale Scheibe', subtitle: `ca. ${defaultSlice}g`, grams: defaultSlice, icon: '🍞', isDefault: true },
      { id: 'bread_thick', label: 'Dicke Scheibe', subtitle: `ca. ${Math.round(defaultSlice * 1.35)}g`, grams: Math.round(defaultSlice * 1.35), icon: '🍞' },
      { id: 'bread_2', label: '2 Scheiben', subtitle: `ca. ${defaultSlice * 2}g`, grams: defaultSlice * 2, icon: '🍞' },
    ];
  }

  // 9. BRÖTCHEN & SEMMELN
  if (name.includes('brötchen') || name.includes('semmel') || name.includes('schrippe') || name.includes('weckerl')) {
    return [
      { id: 'bun_half', label: '1/2 Brötchen', subtitle: 'ca. 30g', grams: 30, icon: '🥖' },
      { id: 'bun_whole', label: '1 ganzes Brötchen', subtitle: 'ca. 60g', grams: 60, icon: '🥖', isDefault: true },
      { id: 'bun_2', label: '2 Brötchen', subtitle: 'ca. 120g', grams: 120, icon: '🥖' },
    ];
  }

  // 10. LAUGENBREZEL / CROISSANT
  if (name.includes('brezel') || name.includes('croissant')) {
    const isCroissant = name.includes('croissant');
    const grams = isCroissant ? 60 : 85;
    const icon = isCroissant ? '🥐' : '🥨';
    return [
      { id: 'pastry_half', label: '1/2 Stück', subtitle: `ca. ${Math.round(grams / 2)}g`, grams: Math.round(grams / 2), icon },
      { id: 'pastry_whole', label: '1 ganzes Stück', subtitle: `ca. ${grams}g`, grams, icon, isDefault: true },
    ];
  }

  // 11. ÖLE (Rapsöl, Olivenöl, Bratöl etc.)
  if (name.includes('öl') || name.includes('raps') || name.includes('oliven') || name.includes('leinöl')) {
    return [
      { id: 'oil_tsp', label: '1 Teelöffel (TL)', subtitle: 'ca. 4g', grams: 4, icon: '🥄' },
      { id: 'oil_tbsp', label: '1 Esslöffel (EL)', subtitle: 'ca. 12g', grams: 12, icon: '🥄', isDefault: true },
      { id: 'oil_2tbsp', label: '2 Esslöffel (EL)', subtitle: 'ca. 24g', grams: 24, icon: '🥄' },
      { id: 'oil_splash', label: 'Kräftiger Schuss', subtitle: 'ca. 20g', grams: 20, icon: '🧈' },
    ];
  }

  // 12. BUTTER & MARGARINE
  if (name.includes('butter') || name.includes('margarine') || name.includes('schmalz')) {
    return [
      { id: 'butter_tip', label: 'Dünn gestrichen', subtitle: 'ca. 5g', grams: 5, icon: '🧈' },
      { id: 'butter_norm', label: 'Normal fürs Brot', subtitle: 'ca. 10g', grams: 10, icon: '🧈', isDefault: true },
      { id: 'butter_thick', label: 'Dick gestrichen', subtitle: 'ca. 15g', grams: 15, icon: '🧈' },
      { id: 'butter_cook', label: '1 EL zum Braten', subtitle: 'ca. 15g', grams: 15, icon: '🥄' },
    ];
  }

  // 13. KÄSE (Schnittkäse wie Gouda, Emmentaler, Edamer)
  if (name.includes('käse') || name.includes('gouda') || name.includes('edamer') || name.includes('emmentaler') || name.includes('tilsiter')) {
    return [
      { id: 'cheese_thin', label: '1 dünne Scheibe', subtitle: 'ca. 20g', grams: 20, icon: '🧀' },
      { id: 'cheese_std', label: '1 normale Scheibe', subtitle: 'ca. 30g', grams: 30, icon: '🧀', isDefault: true },
      { id: 'cheese_2', label: '2 Scheiben', subtitle: 'ca. 60g', grams: 60, icon: '🧀' },
      { id: 'cheese_chunk', label: '1 Stück / Snack', subtitle: 'ca. 40g', grams: 40, icon: '🧀' },
    ];
  }

  // 14. JOGHURT, QUARK, SKYR
  if (name.includes('joghurt') || name.includes('quark') || name.includes('skyr') || name.includes('hüttenkäse')) {
    return [
      { id: 'dairy_tbsp', label: '1 gehäufter EL', subtitle: 'ca. 30g', grams: 30, icon: '🥄' },
      { id: 'dairy_small', label: 'Kleiner Becher', subtitle: 'ca. 150g', grams: 150, icon: '🥣' },
      { id: 'dairy_med', label: 'Standardbecher', subtitle: 'ca. 250g', grams: 250, icon: '🥣', isDefault: true },
      { id: 'dairy_large', label: 'Großer Becher', subtitle: 'ca. 500g', grams: 500, icon: '🥣' },
    ];
  }

  // 15. MILCH, PFLANZENDRINK, GETRÄNKE
  if (name.includes('milch') || name.includes('haferdrink') || name.includes('sojadrink') || name.includes('mandeldrink')) {
    return [
      { id: 'milk_splash', label: 'Schluck für Kaffee', subtitle: 'ca. 25ml', grams: 25, icon: '🥛' },
      { id: 'milk_small', label: 'Kleines Glas', subtitle: 'ca. 150ml', grams: 150, icon: '🥛' },
      { id: 'milk_glass', label: 'Standardglas / Becher', subtitle: 'ca. 250ml', grams: 250, icon: '🥛', isDefault: true },
      { id: 'milk_mug', label: 'Großer Becher', subtitle: 'ca. 350ml', grams: 350, icon: '🥛' },
    ];
  }

  // 16. KAFFEE / TEE
  if (name.includes('kaffee') || name.includes('cappuccino') || name.includes('latte') || name.includes('espresso') || name.includes('tee')) {
    if (name.includes('espresso')) {
      return [
        { id: 'esp_1', label: 'Einfacher Espresso', subtitle: 'ca. 30ml', grams: 30, icon: '☕', isDefault: true },
        { id: 'esp_2', label: 'Doppelter Espresso', subtitle: 'ca. 60ml', grams: 60, icon: '☕' },
      ];
    }
    return [
      { id: 'cup_small', label: 'Kleine Tasse', subtitle: 'ca. 125ml', grams: 125, icon: '☕' },
      { id: 'cup_std', label: 'Normale Tasse', subtitle: 'ca. 200ml', grams: 200, icon: '☕', isDefault: true },
      { id: 'cup_large', label: 'Großer Becher (Mug)', subtitle: 'ca. 300ml', grams: 300, icon: '☕' },
    ];
  }

  // 17. KARTOFFEL & SÜSSKARTOFFEL
  if (name.includes('kartoffel') || name.includes('erdapfel')) {
    return [
      { id: 'pot_s', label: 'Klein', subtitle: 'ca. 80g', grams: 80, icon: '🥔' },
      { id: 'pot_m', label: 'Mittel', subtitle: 'ca. 130g', grams: 130, icon: '🥔', isDefault: true },
      { id: 'pot_l', label: 'Groß', subtitle: 'ca. 200g', grams: 200, icon: '🥔' },
      { id: 'pot_3m', label: '3 mittlere Kartoffeln', subtitle: 'ca. 390g', grams: 390, icon: '🥔' },
    ];
  }

  // 18. ZWIEBEL & KNOBLAUCH
  if (name.includes('zwiebel')) {
    return [
      { id: 'onion_half', label: '1/2 Zwiebel', subtitle: 'ca. 45g', grams: 45, icon: '🧅' },
      { id: 'onion_m', label: '1 mittlere Zwiebel', subtitle: 'ca. 90g', grams: 90, icon: '🧅', isDefault: true },
      { id: 'onion_l', label: '1 große Zwiebel', subtitle: 'ca. 140g', grams: 140, icon: '🧅' },
    ];
  }
  if (name.includes('knoblauch')) {
    return [
      { id: 'garlic_1', label: '1 kleine Zehe', subtitle: 'ca. 3g', grams: 3, icon: '🧄' },
      { id: 'garlic_2', label: '1 normale Zehe', subtitle: 'ca. 5g', grams: 5, icon: '🧄', isDefault: true },
      { id: 'garlic_3', label: '2 Zehen', subtitle: 'ca. 10g', grams: 10, icon: '🧄' },
    ];
  }

  // 19. TOMATEN
  if (name.includes('tomate')) {
    if (name.includes('cherry') || name.includes('cocktail') || name.includes('dattel')) {
      return [
        { id: 'tom_ch_3', label: '3-4 Cherrytomaten', subtitle: 'ca. 50g', grams: 50, icon: '🍅' },
        { id: 'tom_ch_6', label: 'Eine Handvoll', subtitle: 'ca. 100g', grams: 100, icon: '🍅', isDefault: true },
        { id: 'tom_ch_pack', label: 'Kleine Packung', subtitle: 'ca. 250g', grams: 250, icon: '🍅' },
      ];
    }
    return [
      { id: 'tom_s', label: 'Klein', subtitle: 'ca. 70g', grams: 70, icon: '🍅' },
      { id: 'tom_m', label: 'Mittel', subtitle: 'ca. 110g', grams: 110, icon: '🍅', isDefault: true },
      { id: 'tom_l', label: 'Groß / Fleisch', subtitle: 'ca. 180g', grams: 180, icon: '🍅' },
    ];
  }

  // 20. SALATGURKE
  if (name.includes('gurke')) {
    return [
      { id: 'cuc_slices', label: '4-5 Scheiben', subtitle: 'ca. 40g', grams: 40, icon: '🥒' },
      { id: 'cuc_half', label: '1/2 Salatgurke', subtitle: 'ca. 150g', grams: 150, icon: '🥒' },
      { id: 'cuc_whole', label: '1 ganze Salatgurke', subtitle: 'ca. 300g', grams: 300, icon: '🥒', isDefault: true },
    ];
  }

  // 21. NÜSSE & KERNE (Walnüsse, Mandeln, Cashews, Erdnüsse)
  if (name.includes('nuss') || name.includes('nüsse') || name.includes('mandel') || name.includes('cashew') || name.includes('erdnüss')) {
    return [
      { id: 'nut_s', label: 'Kleine Handvoll', subtitle: 'ca. 20g', grams: 20, icon: '🥜' },
      { id: 'nut_m', label: 'Normale Handvoll', subtitle: 'ca. 30g', grams: 30, icon: '🥜', isDefault: true },
      { id: 'nut_l', label: 'Große Schale', subtitle: 'ca. 60g', grams: 60, icon: '🥜' },
    ];
  }

  // 22. SCHOKOLADE & RIEGEL
  if (name.includes('schoko') || name.includes('riegel') || brand.includes('kinderschokolade') || brand.includes('ritter') || brand.includes('milka')) {
    return [
      { id: 'choc_piece', label: '1 Stückchen', subtitle: 'ca. 6g', grams: 6, icon: '🍫' },
      { id: 'choc_row', label: '1 Rippe / Reihe', subtitle: 'ca. 20g', grams: 20, icon: '🍫', isDefault: true },
      { id: 'choc_half', label: '1/2 Tafel', subtitle: 'ca. 50g', grams: 50, icon: '🍫' },
      { id: 'choc_bar', label: '1 ganze Tafel', subtitle: 'ca. 100g', grams: 100, icon: '🍫' },
    ];
  }

  // 23. FLEISCH & GEFLÜGEL & FISCH
  if (name.includes('hähnchen') || name.includes('steak') || name.includes('schnitzel') || name.includes('lachs') || name.includes('filet')) {
    return [
      { id: 'meat_s', label: 'Kleines Filet', subtitle: 'ca. 120g', grams: 120, icon: '🍗' },
      { id: 'meat_m', label: 'Normales Steak / Filet', subtitle: 'ca. 180g', grams: 180, icon: '🍗', isDefault: true },
      { id: 'meat_l', label: 'Großes Steak / Schnitzel', subtitle: 'ca. 250g', grams: 250, icon: '🍗' },
    ];
  }

  // 24. NUDELN, REIS & BEILAGEN (gekocht oder trocken)
  if (name.includes('nudel') || name.includes('pasta') || name.includes('spaghetti') || name.includes('reis')) {
    return [
      { id: 'grain_raw', label: '1 Portion trocken', subtitle: 'ca. 80g', grams: 80, icon: '🌾' },
      { id: 'grain_s', label: 'Kleine Portion gekocht', subtitle: 'ca. 150g', grams: 150, icon: '🍝' },
      { id: 'grain_m', label: 'Normaler Teller gekocht', subtitle: 'ca. 250g', grams: 250, icon: '🍝', isDefault: true },
      { id: 'grain_l', label: 'Großer Teller gekocht', subtitle: 'ca. 380g', grams: 380, icon: '🍝' },
    ];
  }

  // 25. PRODUCT HAS TOTAL PACKAGE / CONTAINER WEIGHT (Glas, Dose, Pizza, Packung, etc.)
  if (product.packageWeightGrams && product.packageWeightGrams > 0) {
    const pw = product.packageWeightGrams;
    const type = product.containerType || 'general';

    let unitWord = 'Packung';
    let icon = '📦';
    if (type === 'jar') {
      unitWord = 'Glas';
      icon = '🫙';
    } else if (type === 'can') {
      unitWord = 'Dose';
      icon = '🥫';
    } else if (type === 'pizza') {
      unitWord = 'Pizza';
      icon = '🍕';
    } else if (type === 'cup') {
      unitWord = 'Becher';
      icon = '🥣';
    } else if (type === 'bottle') {
      unitWord = 'Flasche';
      icon = '🍾';
    }

    if (type === 'pizza') {
      return [
        { id: 'pkg_full', label: `1/1 Ganze ${unitWord}`, subtitle: `ca. ${pw}g (100%)`, grams: pw, icon, isDefault: true },
        { id: 'pkg_half', label: `1/2 Halbe ${unitWord}`, subtitle: `ca. ${Math.round(pw * 0.5)}g (50%)`, grams: Math.round(pw * 0.5), icon },
        { id: 'pkg_three_quarter', label: `3/4 Drei Viertel`, subtitle: `ca. ${Math.round(pw * 0.75)}g (75%)`, grams: Math.round(pw * 0.75), icon },
        { id: 'pkg_quarter', label: `1/4 Ein Viertel`, subtitle: `ca. ${Math.round(pw * 0.25)}g (25%)`, grams: Math.round(pw * 0.25), icon },
      ];
    }

    const articleGanz = unitWord === 'Dose' || unitWord === 'Flasche' || unitWord === 'Pizza' || unitWord === 'Packung' ? 'Ganze' : 'Ganzes';
    const articleHalb = unitWord === 'Dose' || unitWord === 'Flasche' || unitWord === 'Pizza' || unitWord === 'Packung' ? 'Halbe' : 'Halbes';

    return [
      { id: 'pkg_full', label: `1/1 ${articleGanz} ${unitWord}`, subtitle: `ca. ${pw}g (Komplett)`, grams: pw, icon, isDefault: pw <= 500 },
      { id: 'pkg_half', label: `1/2 ${articleHalb} ${unitWord}`, subtitle: `ca. ${Math.round(pw * 0.5)}g (50%)`, grams: Math.round(pw * 0.5), icon, isDefault: pw > 500 },
      { id: 'pkg_two_third', label: `2/3 Zwei Drittel`, subtitle: `ca. ${Math.round(pw * (2 / 3))}g (1/3 übrig)`, grams: Math.round(pw * (2 / 3)), icon },
      { id: 'pkg_one_third', label: `1/3 Ein Drittel`, subtitle: `ca. ${Math.round(pw * (1 / 3))}g (33%)`, grams: Math.round(pw * (1 / 3)), icon },
      { id: 'pkg_quarter', label: `1/4 Ein Viertel`, subtitle: `ca. ${Math.round(pw * 0.25)}g (25%)`, grams: Math.round(pw * 0.25), icon },
    ];
  }

  // 26. DOSEN & KONSERVEN (Tomaten, Bohnen, Kichererbsen, Mais, Thunfisch - Fallback ohne Packungsgewicht)
  if (name.includes('dose') || name.includes('passata') || name.includes('thunfisch') || name.includes('kichererbsen') || name.includes('bohnen')) {
    if (name.includes('thunfisch')) {
      return [
        { id: 'can_tuna_half', label: '1/2 Dose', subtitle: 'ca. 75g (Abtropfgewicht)', grams: 75, icon: '🥫' },
        { id: 'can_tuna_full', label: '1 ganze Dose', subtitle: 'ca. 150g (Abtropfgewicht)', grams: 150, icon: '🥫', isDefault: true },
      ];
    }
    return [
      { id: 'can_half', label: '1/2 Dose / Packung', subtitle: 'ca. 200g', grams: 200, icon: '🥫' },
      { id: 'can_whole', label: '1 ganze Dose / Packung', subtitle: 'ca. 400g', grams: 400, icon: '🥫', isDefault: true },
    ];
  }

  // 27. SUPPEN & EINTÖPFE
  if (name.includes('suppe') || name.includes('eintopf') || name.includes('gulasch')) {
    return [
      { id: 'soup_cup', label: 'Kleine Tasse', subtitle: 'ca. 180ml', grams: 180, icon: '🍲' },
      { id: 'soup_plate', label: 'Tiefer Teller', subtitle: 'ca. 300ml', grams: 300, icon: '🍲', isDefault: true },
      { id: 'soup_bowl', label: 'Große Schüssel', subtitle: 'ca. 450ml', grams: 450, icon: '🍲' },
    ];
  }

  // 28. ZUCKER / HONIG / MARMELADE / AUFSTRICH
  if (name.includes('zucker') || name.includes('honig') || name.includes('marmelade') || name.includes('nutella') || name.includes('sirup')) {
    return [
      { id: 'sweet_tsp', label: '1 Teelöffel (TL)', subtitle: 'ca. 5g', grams: 5, icon: '🥄' },
      { id: 'sweet_std', label: '1 Portion fürs Brot', subtitle: 'ca. 15g', grams: 15, icon: '🥄', isDefault: true },
      { id: 'sweet_tbsp', label: '1 Esslöffel (EL)', subtitle: 'ca. 25g', grams: 25, icon: '🥄' },
    ];
  }

  // 29. PRODUCT HAS PRE-CONFIGURED SERVING WEIGHT (from OpenFoodFacts or Supermarket Catalog)
  if (product.servingWeightGrams && product.servingWeightGrams > 0) {
    const sw = product.servingWeightGrams;
    const label = product.servingSize || '1 Portion';
    return [
      { id: 'srv_half', label: 'Halbe Portion', subtitle: `ca. ${Math.round(sw * 0.5)}g`, grams: Math.round(sw * 0.5), icon: '🥗' },
      { id: 'srv_full', label: label, subtitle: `ca. ${sw}g`, grams: sw, icon: '🥗', isDefault: true },
      { id: 'srv_1_5', label: '1.5 Portionen', subtitle: `ca. ${Math.round(sw * 1.5)}g`, grams: Math.round(sw * 1.5), icon: '🥗' },
      { id: 'srv_double', label: 'Doppelte Portion', subtitle: `ca. ${sw * 2}g`, grams: sw * 2, icon: '🥗' },
    ];
  }

  // 30. UNIVERSAL FALLBACK
  return [
    { id: 'gen_s', label: 'Kleine Portion', subtitle: 'ca. 100g', grams: 100, icon: '🥗' },
    { id: 'gen_m', label: 'Normale Portion', subtitle: 'ca. 200g', grams: 200, icon: '🥗', isDefault: true },
    { id: 'gen_l', label: 'Große Portion', subtitle: 'ca. 350g', grams: 350, icon: '🥗' },
  ];
}
