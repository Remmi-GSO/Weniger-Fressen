export type DailyStepLevel = 'sedentary' | 'moderate_walk' | 'active_standing' | 'heavy_work';
export type WorkoutIntensity = 'gentle' | 'intense';

export interface BMRParams {
  gender: 'male' | 'female';
  weight: number; // in kg
  height: number; // in cm
  age: number;
  activityLevel?: number; // legacy PAL factor fallback
  stepLevel?: DailyStepLevel;
  trackWorkoutsDaily?: boolean; // Wenn true, wird Sport tagesgenau über Aktivitäten erfasst (Säule 2 = 0)
  workoutSessionsPerWeek?: number; // 0, 1, 2, 3, 4, 5+
  workoutIntensity?: WorkoutIntensity; // 'gentle' (Yoga/Rückenfit) vs. 'intense' (Vollgas/HIIT/Kraft)
  deficit: number; // in kcal, e.g. 250, 500, 750
}

export interface CalculationResult {
  bmr: number;
  tdee: number;
  effectivePAL: number;
  workoutDailyBonus: number;
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
  bmi: number;
  bmiCategory: string;
}

/**
 * Mifflin-St. Jeor Formula for BMR (Basal Metabolic Rate / Grundumsatz)
 */
export function calculateBMR(gender: 'male' | 'female', weight: number, height: number, age: number): number {
  if (gender === 'male') {
    return Math.round(10 * weight + 6.25 * height - 5 * age + 5);
  } else {
    return Math.round(10 * weight + 6.25 * height - 5 * age - 161);
  }
}

/**
 * Calculates BMI and Category
 */
export function calculateBMI(weight: number, heightCm: number): { bmi: number; category: string } {
  const heightM = heightCm / 100;
  const bmi = Math.round((weight / (heightM * heightM)) * 10) / 10;
  let category = 'Normalgewicht';

  if (bmi < 18.5) category = 'Untergewicht';
  else if (bmi < 25) category = 'Normalgewicht';
  else if (bmi < 30) category = 'Leichtes Übergewicht';
  else if (bmi < 35) category = 'Adipositas Grad I';
  else category = 'Adipositas Grad II+';

  return { bmi, category };
}

/**
 * Maps daily non-exercise movement (NEAT) to base PAL factor
 */
export function getBasePAL(stepLevel: DailyStepLevel): number {
  switch (stepLevel) {
    case 'sedentary':
      return 1.20; // Reiner Schreibtisch, < 4.000 Schritte
    case 'moderate_walk':
      return 1.35; // Büro + Spaziergänge / tägliche Hunderunde (~5.000–9.000 Schritte)
    case 'active_standing':
      return 1.55; // Pflege, Verkauf, Gastro, Handwerk (10.000–15.000 Schritte)
    case 'heavy_work':
      return 1.80; // Schwere körperliche Arbeit (Bau, Landwirtschaft)
    default:
      return 1.35;
  }
}

/**
 * Comprehensive nutrition target calculation with evidence-based macro distribution:
 * - Fine-grained calculation separating daily NEAT (Hund/Schritte) from purposeful workout intensity (Yoga vs. Vollgas)
 * - Protein: ~1.8g per kg bodyweight (preserves muscle mass during deficit)
 * - Fat: ~0.85g per kg bodyweight (essential hormonal health)
 * - Carbs: Remaining calories
 */
export function calculateNutritionTargets(params: BMRParams): CalculationResult {
  const bmr = calculateBMR(params.gender, params.weight, params.height, params.age);
  
  let basePAL = params.activityLevel || 1.35;
  if (params.stepLevel) {
    basePAL = getBasePAL(params.stepLevel);
  }

  // Calculate purposeful workout calorie burn per week, averaged per day
  // Wenn trackWorkoutsDaily aktiv ist, wird Sport tagesgenau eingetragen und keine Pauschale aufgeschlagen (verhindert Doppelzählung)
  let workoutDailyBonus = 0;
  const sessions = params.trackWorkoutsDaily ? 0 : (params.workoutSessionsPerWeek || 0);
  if (sessions > 0) {
    // Gentle (Yoga, Rückenfit, Pilates, moderates Radeln): ~200 kcal/session
    // Intense (Kraftsport bis zum Limit, HIIT, schweißtreibendes Laufen, Spinning): ~450 kcal/session
    const burnPerSession = params.workoutIntensity === 'gentle' ? 200 : 450;
    workoutDailyBonus = Math.round((sessions * burnPerSession) / 7);
  }

  const baseTDEE = Math.round(bmr * basePAL);
  const tdee = baseTDEE + workoutDailyBonus;
  const effectivePAL = Math.round((tdee / bmr) * 100) / 100;

  // Safety floor: Never recommend below 1200 kcal for women or 1400 kcal for men
  const minSafeCalories = params.gender === 'female' ? 1200 : 1400;
  const targetCalories = Math.max(minSafeCalories, Math.round(tdee - params.deficit));

  // Protein: 1.8g per kg of current bodyweight (cap at 35% of total calories)
  const targetProtein = Math.round(Math.min(params.weight * 1.8, (targetCalories * 0.35) / 4));
  
  // Fat: 0.85g per kg of bodyweight (cap at 30% of total calories)
  const targetFat = Math.round(Math.min(params.weight * 0.85, (targetCalories * 0.30) / 9));

  // Carbs: Rest of the caloric budget
  const caloriesFromProteinAndFat = (targetProtein * 4) + (targetFat * 9);
  const remainingCalories = Math.max(0, targetCalories - caloriesFromProteinAndFat);
  const targetCarbs = Math.round(remainingCalories / 4);

  const { bmi, category } = calculateBMI(params.weight, params.height);

  return {
    bmr,
    tdee,
    effectivePAL,
    workoutDailyBonus,
    targetCalories,
    targetProtein,
    targetCarbs,
    targetFat,
    bmi,
    bmiCategory: category,
  };
}

/**
 * Returns today's date formatted as YYYY-MM-DD in local time
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formats a YYYY-MM-DD date into German human-readable string (e.g. "Heute, 3. Oktober")
 */
export function formatDisplayDate(dateStr: string): string {
  const today = getTodayDateString();
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  if (dateStr === today) return 'Heute';
  if (dateStr === yesterday) return 'Gestern';
  if (dateStr === tomorrow) return 'Morgen';

  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' });
}
