import Dexie, { type Table } from 'dexie';

export interface FoodFocusSettings {
  sugar: boolean; // Industriezucker & Süßwaren
  unhealthyFat: boolean; // Ungesunde Fette & Frittiertes
  cheese: boolean; // Käse- & Schmelzkäse-Bremse
  processedMeat: boolean; // Stark verarbeitete Wurst & Pökelfleisch
  cholesterol: boolean; // Cholesterin & Eier
  fiber: boolean; // Ballaststoff-Mangel
  salt: boolean; // Hoher Salzgehalt
}

export const DEFAULT_FOOD_FOCUS: FoodFocusSettings = {
  sugar: true,
  unhealthyFat: true,
  cheese: true,
  processedMeat: true,
  cholesterol: false,
  fiber: true,
  salt: false,
};

export interface DashboardNutrientBars {
  protein: boolean; // Eiweiß / Protein (default: true)
  carbs: boolean; // Kohlenhydrate (default: true)
  fat: boolean; // Fett (default: true)
  fiber: boolean; // Ballaststoffe (default: true)
  sugar: boolean; // Zucker / Obergrenze (default: false)
  netCarbs: boolean; // Netto-Kohlenhydrate: KH - Ballaststoffe (default: false)
}

export const DEFAULT_NUTRIENT_BARS: DashboardNutrientBars = {
  protein: true,
  carbs: true,
  fat: true,
  fiber: true,
  sugar: false,
  netCarbs: false,
};

export interface UserProfile {
  id: string; // 'current'
  name: string;
  gender: 'male' | 'female';
  age: number;
  height: number; // in cm
  weight: number; // current weight in kg
  targetWeight: number; // target weight in kg
  activityLevel: number; // PAL factor (1.2 to 1.9)
  stepLevel?: 'sedentary' | 'moderate_walk' | 'active_standing' | 'heavy_work';
  trackWorkoutsDaily?: boolean; // Wenn true, wird Sport tagesgenau über Aktivitäten erfasst (verhindert Doppelzählung)
  workoutSessionsPerWeek?: number; // 0, 1, 2, 3, 4, 5+
  workoutIntensity?: 'gentle' | 'intense';
  goalType?: 'lose_weight' | 'maintain_weight';
  goalDeficit: number; // kcal deficit, e.g. 500 or 0
  maintenanceCalories?: number; // TDEE in kcal (Gesamtumsatz zum Gewicht halten)
  targetCalories: number;
  targetProtein: number; // in grams
  targetCarbs: number; // in grams
  targetFat: number; // in grams
  targetFiber?: number; // in grams (default: 30g)
  targetSugar?: number; // max in grams (default: 35g)
  waterGoal: number; // in ml (e.g. 2500)
  nutrientBars?: DashboardNutrientBars;
  foodFocus?: FoodFocusSettings;
  geminiApiKey?: string;
  isOnboarded: boolean;
  createdAt: string;
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type EatingReason = 'hunger' | 'cravings' | 'stress' | 'social';

export interface DiaryEntry {
  id?: number;
  date: string; // Format: YYYY-MM-DD
  mealType: MealType;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number; // Ballaststoffe in Gramm
  sugar?: number; // Zucker in Gramm
  amount?: number; // e.g. grams or pieces
  unit?: string; // 'g', 'ml', 'Portion', 'Stück'
  barcode?: string;
  reason?: EatingReason;
  isSnackNibble?: boolean; // True if logged via Nascherei tracker outside of 3 main meals
  timestamp: number;
}

export interface WaterLog {
  id?: number;
  date: string; // YYYY-MM-DD
  amount: number; // ml
  timestamp: number;
}

export interface WeightLog {
  id?: number;
  date: string; // YYYY-MM-DD
  weight: number; // kg
  timestamp: number;
}

export interface FastingSession {
  id?: number;
  startTime: number; // epoch ms
  targetDurationHours: number; // e.g. 16
  endTime?: number; // epoch ms
  isActive: boolean;
}

export interface FavoriteItem {
  id?: number;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  defaultUnit: string;
  defaultAmount: number;
  useCount: number;
}

export interface RecipeIngredient {
  name: string;
  amountGrams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
}

export type RecipeCategory = 'bread' | 'meal' | 'drink' | 'snack';

export interface CustomRecipe {
  id?: number;
  name: string;
  category: RecipeCategory;
  ingredients: RecipeIngredient[];
  totalRawWeight: number; // in grams
  cookedWeight: number; // in grams (baked loaf weight or finished weight)
  servingName: string; // e.g. "1 Scheibe", "1 Portion", "1 Glas"
  servingWeightGrams: number; // e.g. 50g
  calories100g: number;
  protein100g: number;
  carbs100g: number;
  fat100g: number;
  fiber100g?: number;
  sugar100g?: number;
  createdAt: number;
}

export interface ActivityLog {
  id?: number;
  date: string; // YYYY-MM-DD
  activityId: string; // e.g. 'dog_walk', 'back_yoga', 'gardening', 'housework'
  name: string;
  icon: string;
  durationMinutes: number; // in minutes
  caloriesBurned: number; // calculated from MET * weight * duration
  intensity?: 'light' | 'moderate' | 'intense';
  notes?: string;
  isPenance?: boolean; // True if "Buße" (Kalorien werden geloggt, aber nicht im Essensbudget gutgeschrieben)
  stepsCount?: number; // Optional steps for pedometer
  timestamp: number;
}

export interface CustomActivity {
  id?: number;
  name: string;
  icon: string;
  caloriesPerHour: number;
  unitStepMinutes?: number;
  createdAt: number;
}

export class WenigerFressenDB extends Dexie {
  userProfile!: Table<UserProfile, string>;
  diaryEntries!: Table<DiaryEntry, number>;
  waterLogs!: Table<WaterLog, number>;
  weightLogs!: Table<WeightLog, number>;
  fastingSessions!: Table<FastingSession, number>;
  favoriteItems!: Table<FavoriteItem, number>;
  recipes!: Table<CustomRecipe, number>;
  activityLogs!: Table<ActivityLog, number>;
  customActivities!: Table<CustomActivity, number>;

  constructor() {
    super('WenigerFressenDB');
    this.version(1).stores({
      userProfile: 'id',
      diaryEntries: '++id, date, mealType, timestamp',
      waterLogs: '++id, date, timestamp',
      weightLogs: '++id, date, timestamp',
      fastingSessions: '++id, isActive, startTime',
      favoriteItems: '++id, name, useCount',
    });
    this.version(2).stores({
      recipes: '++id, name, category, createdAt',
    });
    this.version(3).stores({
      activityLogs: '++id, date, timestamp',
      customActivities: '++id, name, createdAt',
    });
  }
}

export const db = new WenigerFressenDB();

// Default standard profile for fresh installations
export const DEFAULT_USER_PROFILE: UserProfile = {
  id: 'current',
  name: '',
  gender: 'female',
  age: 30,
  height: 170,
  weight: 75,
  targetWeight: 68,
  activityLevel: 1.35,
  stepLevel: 'moderate_walk',
  workoutSessionsPerWeek: 1,
  workoutIntensity: 'gentle',
  goalType: 'lose_weight',
  goalDeficit: 500, // Gesundes moderates Defizit
  maintenanceCalories: 2250,
  targetCalories: 1750,
  targetProtein: 110,
  targetCarbs: 180,
  targetFat: 55,
  waterGoal: 2500,
  foodFocus: DEFAULT_FOOD_FOCUS,
  isOnboarded: false,
  createdAt: new Date().toISOString(),
};
