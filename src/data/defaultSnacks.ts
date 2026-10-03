export interface PresetSnack {
  id: string;
  name: string;
  category: 'chocolate' | 'cheese' | 'cookies' | 'nuts' | 'sweets' | 'salty' | 'fruit';
  icon: string;
  defaultServingName: string; // e.g. "1 Stückchen", "1 Würfel"
  defaultGrams: number;
  calories: number; // calculated for defaultGrams
  protein: number;
  carbs: number;
  fat: number;
  presets: { label: string; grams: number; multiplier: number }[];
}

export const PRESET_SNACKS: PresetSnack[] = [
  // --- SCHOKOLADE ---
  {
    id: 'choc_milk',
    name: 'Vollmilch-Schokolade',
    category: 'chocolate',
    icon: '🍫',
    defaultServingName: '1 Stückchen',
    defaultGrams: 7,
    calories: 38,
    protein: 0.5,
    carbs: 4.1,
    fat: 2.2,
    presets: [
      { label: '1 Stückchen (7g)', grams: 7, multiplier: 1 },
      { label: '2 Stückchen (14g)', grams: 14, multiplier: 2 },
      { label: '3 Stückchen (21g)', grams: 21, multiplier: 3 },
      { label: '1 Rippe / Riegel (20g)', grams: 20, multiplier: 2.85 },
    ],
  },
  {
    id: 'choc_dark',
    name: 'Zartbitter-Schokolade (70%+)',
    category: 'chocolate',
    icon: '🍫',
    defaultServingName: '1 Stückchen',
    defaultGrams: 8,
    calories: 46,
    protein: 0.6,
    carbs: 3.1,
    fat: 3.4,
    presets: [
      { label: '1 Stückchen (8g)', grams: 8, multiplier: 1 },
      { label: '2 Stückchen (16g)', grams: 16, multiplier: 2 },
      { label: '1 Rippe / Riegel (25g)', grams: 25, multiplier: 3.12 },
    ],
  },
  {
    id: 'choc_hazelnut',
    name: 'Nuss-Schokolade',
    category: 'chocolate',
    icon: '🍫',
    defaultServingName: '1 Stückchen',
    defaultGrams: 8,
    calories: 45,
    protein: 0.7,
    carbs: 3.8,
    fat: 3.0,
    presets: [
      { label: '1 Stückchen (8g)', grams: 8, multiplier: 1 },
      { label: '2 Stückchen (16g)', grams: 16, multiplier: 2 },
      { label: '1 Riegel (25g)', grams: 25, multiplier: 3.12 },
    ],
  },

  // --- KÄSEHAPPEN ---
  {
    id: 'cheese_cube',
    name: 'Gouda / Bergkäse (Würfel)',
    category: 'cheese',
    icon: '🧀',
    defaultServingName: '1 Würfel',
    defaultGrams: 15,
    calories: 54,
    protein: 3.8,
    carbs: 0,
    fat: 4.4,
    presets: [
      { label: '1 Würfel (15g)', grams: 15, multiplier: 1 },
      { label: '2 Würfel (30g)', grams: 30, multiplier: 2 },
      { label: '3 Würfel (45g)', grams: 45, multiplier: 3 },
      { label: 'Handvoll Happen (60g)', grams: 60, multiplier: 4 },
    ],
  },
  {
    id: 'cheese_slice',
    name: 'Scheibe Schnittkäse (Gouda/Emmentaler)',
    category: 'cheese',
    icon: '🧀',
    defaultServingName: '1 Scheibe',
    defaultGrams: 30,
    calories: 108,
    protein: 7.5,
    carbs: 0.1,
    fat: 8.7,
    presets: [
      { label: '1/2 Scheibe (15g)', grams: 15, multiplier: 0.5 },
      { label: '1 Scheibe (30g)', grams: 30, multiplier: 1 },
      { label: '2 Scheiben (60g)', grams: 60, multiplier: 2 },
    ],
  },
  {
    id: 'cheese_parmesan',
    name: 'Parmesan / Grana Padano (Stückchen)',
    category: 'cheese',
    icon: '🧀',
    defaultServingName: '1 Stückchen',
    defaultGrams: 15,
    calories: 60,
    protein: 5.3,
    carbs: 0,
    fat: 4.3,
    presets: [
      { label: '1 Stückchen (15g)', grams: 15, multiplier: 1 },
      { label: '2 Stückchen (30g)', grams: 30, multiplier: 2 },
    ],
  },
  {
    id: 'cheese_babybel_light',
    name: 'Babybel Light',
    category: 'cheese',
    icon: '🧀',
    defaultServingName: '1 Stück',
    defaultGrams: 20,
    calories: 42,
    protein: 5.0,
    carbs: 0.1,
    fat: 2.4,
    presets: [
      { label: '1 Stück (20g)', grams: 20, multiplier: 1 },
      { label: '2 Stück (40g)', grams: 40, multiplier: 2 },
      { label: '3 Stück (60g)', grams: 60, multiplier: 3 },
    ],
  },
  {
    id: 'cheese_babybel',
    name: 'Babybel Original (Rot)',
    category: 'cheese',
    icon: '🧀',
    defaultServingName: '1 Stück',
    defaultGrams: 20,
    calories: 62,
    protein: 4.6,
    carbs: 0,
    fat: 4.8,
    presets: [
      { label: '1 Stück (20g)', grams: 20, multiplier: 1 },
      { label: '2 Stück (40g)', grams: 40, multiplier: 2 },
    ],
  },

  // --- KEKSE & GEBÄCK ---
  {
    id: 'cookie_butter',
    name: 'Butterkeks / Keks',
    category: 'cookies',
    icon: '🍪',
    defaultServingName: '1 Keks',
    defaultGrams: 12,
    calories: 52,
    protein: 0.9,
    carbs: 8.8,
    fat: 1.4,
    presets: [
      { label: '1 Keks (12g)', grams: 12, multiplier: 1 },
      { label: '2 Kekse (24g)', grams: 24, multiplier: 2 },
      { label: '3 Kekse (36g)', grams: 36, multiplier: 3 },
    ],
  },
  {
    id: 'cookie_choc',
    name: 'Schoko-Cookie',
    category: 'cookies',
    icon: '🍪',
    defaultServingName: '1 Cookie',
    defaultGrams: 25,
    calories: 124,
    protein: 1.4,
    carbs: 16.0,
    fat: 6.0,
    presets: [
      { label: '1 Cookie (25g)', grams: 25, multiplier: 1 },
      { label: '2 Cookies (50g)', grams: 50, multiplier: 2 },
    ],
  },

  // --- NÜSSE & KERNE ---
  {
    id: 'nuts_mixed',
    name: 'Gemischte Nüsse (Cashews/Mandeln/Walnüsse)',
    category: 'nuts',
    icon: '🥜',
    defaultServingName: '1 kleine Handvoll',
    defaultGrams: 20,
    calories: 122,
    protein: 3.6,
    carbs: 3.2,
    fat: 10.8,
    presets: [
      { label: '1 kleine Handvoll (20g)', grams: 20, multiplier: 1 },
      { label: '1 große Handvoll (35g)', grams: 35, multiplier: 1.75 },
      { label: '1 Schälchen (50g)', grams: 50, multiplier: 2.5 },
    ],
  },

  // --- SÜSSIGKEITEN & BONBONS ---
  {
    id: 'sweets_gummy',
    name: 'Gummibärchen',
    category: 'sweets',
    icon: '🍬',
    defaultServingName: '5 Stück',
    defaultGrams: 15,
    calories: 51,
    protein: 1.0,
    carbs: 11.5,
    fat: 0.1,
    presets: [
      { label: '5 Stück (15g)', grams: 15, multiplier: 1 },
      { label: '10 Stück (30g)', grams: 30, multiplier: 2 },
      { label: '1 kleine Tüte (50g)', grams: 50, multiplier: 3.33 },
    ],
  },
  {
    id: 'sweets_candybar',
    name: 'Schokoriegel (z.B. Duplo/Kinderriegel)',
    category: 'sweets',
    icon: '🍫',
    defaultServingName: '1 Riegel',
    defaultGrams: 18,
    calories: 99,
    protein: 1.2,
    carbs: 10.3,
    fat: 5.9,
    presets: [
      { label: '1 Riegel (18g)', grams: 18, multiplier: 1 },
      { label: '2 Riegel (36g)', grams: 36, multiplier: 2 },
    ],
  },

  // --- SALZIGES ---
  {
    id: 'salty_chips',
    name: 'Kartoffelchips / Stapelchips',
    category: 'salty',
    icon: '🥔',
    defaultServingName: '1 Handvoll',
    defaultGrams: 25,
    calories: 135,
    protein: 1.5,
    carbs: 13.0,
    fat: 8.5,
    presets: [
      { label: '1 Handvoll (25g)', grams: 25, multiplier: 1 },
      { label: '1 kleine Schale (50g)', grams: 50, multiplier: 2 },
    ],
  },
  {
    id: 'salty_sticks',
    name: 'Salzstangen / Brezeln',
    category: 'salty',
    icon: '🥨',
    defaultServingName: '1 Handvoll',
    defaultGrams: 20,
    calories: 78,
    protein: 2.2,
    carbs: 14.8,
    fat: 1.0,
    presets: [
      { label: '1 Handvoll (20g)', grams: 20, multiplier: 1 },
      { label: 'Große Portion (40g)', grams: 40, multiplier: 2 },
    ],
  },

  // --- OBST & FRISCHES ---
  {
    id: 'fruit_apple',
    name: 'Frischer Apfel (in Schnitzen)',
    category: 'fruit',
    icon: '🍎',
    defaultServingName: '1 kleiner Apfel',
    defaultGrams: 120,
    calories: 62,
    protein: 0.4,
    carbs: 14.0,
    fat: 0.2,
    presets: [
      { label: '1/2 Apfel (60g)', grams: 60, multiplier: 0.5 },
      { label: '1 kleiner Apfel (120g)', grams: 120, multiplier: 1 },
      { label: '1 großer Apfel (180g)', grams: 180, multiplier: 1.5 },
    ],
  },
  {
    id: 'fruit_berries',
    name: 'Beeren (Heidelbeeren/Erdbeeren)',
    category: 'fruit',
    icon: '🫐',
    defaultServingName: '1 Handvoll',
    defaultGrams: 80,
    calories: 38,
    protein: 0.6,
    carbs: 7.2,
    fat: 0.3,
    presets: [
      { label: '1 Handvoll (80g)', grams: 80, multiplier: 1 },
      { label: '1 Schale (150g)', grams: 150, multiplier: 1.88 },
    ],
  },
];
