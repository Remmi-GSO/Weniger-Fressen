import { useState, useMemo, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type RecipeIngredient, type CustomRecipe, type RecipeCategory, type MealType, type DiaryEntry } from '../db/db';
import { ALL_LOCAL_FOODS, searchFoodProducts, normalizeGermanSearch, type FoodProduct } from '../services/foodApi';
import { getPortionPresets } from '../utils/portionPresets';
import { queryFoodWithGemini, parseRecipeWithGemini, generateRecipeWithAiChef, type AiChefRecipeResult } from '../services/geminiApi';
import { compressImage } from '../utils/imageCompress';
import { VoiceInputButton } from './VoiceInputButton';
import { BarcodeScannerModal } from './BarcodeScannerModal';
import { RecipeShareModal } from './RecipeShareModal';
import {
  X,
  Trash2,
  Plus,
  Minus,
  Loader2,
  Star,
  Barcode,
  Check,
  QrCode,
  BookOpen,
  Utensils,
  Sparkles,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Edit3,
  Search,
  Camera,
  Clock,
  CheckSquare,
  Square,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface RecipeCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRecipeSaved?: (recipe: CustomRecipe) => void;
  defaultMealType?: MealType;
  initialCategory?: RecipeCategory;
  initialTab?: 'list' | 'create' | 'chef';
  geminiApiKey?: string;
  onOpenSettings?: () => void;
  selectedDate?: string;
}

const DRINK_STAPLES: Array<{ name: string; grams: number; icon: string }> = [
  { name: 'Wasser (Leitungswasser)', grams: 250, icon: '💧' },
  { name: 'Milch (1,5% Fett)', grams: 250, icon: '🥛' },
  { name: 'Hafermilch (Barista Edition)', grams: 250, icon: '🌾' },
  { name: 'Reine Buttermilch', grams: 250, icon: '🥛' },
  { name: 'Kefir mild (1,5% Fett)', grams: 250, icon: '🥛' },
  { name: 'Magerquark / Speisequark Magerstufe', grams: 100, icon: '🥣' },
  { name: 'Whey Proteinpulver (Vanille / Schoko)', grams: 30, icon: '💪' },
  { name: 'Banane (mittelgroß)', grams: 110, icon: '🍌' },
  { name: 'Beeren-Mix (TK)', grams: 100, icon: '🫐' },
  { name: 'Erdbeeren (frisch)', grams: 150, icon: '🍓' },
  { name: 'Zitronensaft (frisch gepresst)', grams: 20, icon: '🍋' },
  { name: 'Blütenhonig / Imkerhonig', grams: 15, icon: '🍯' },
  { name: 'Chiasamen', grams: 15, icon: '🌱' },
];

const BREAD_STAPLES: Array<{ name: string; grams: number; icon: string }> = [
  { name: 'Dinkelmehl Type 630', grams: 500, icon: '🌾' },
  { name: 'Wasser (Leitungswasser)', grams: 350, icon: '💧' },
  { name: 'Reine Buttermilch', grams: 250, icon: '🥛' },
  { name: 'Kefir mild (1,5% Fett)', grams: 250, icon: '🥛' },
  { name: 'Sauerteig / Anstellgut (Roggen/Dinkel)', grams: 100, icon: '🍞' },
  { name: 'Rapsöl', grams: 20, icon: '🧈' },
  { name: 'Hefe (frisch / Hefewürfel)', grams: 10, icon: '🥖' },
  { name: 'Speisesalz / Meersalz', grams: 10, icon: '🧂' },
  { name: 'Sonnenblumenkerne', grams: 50, icon: '🌻' },
  { name: 'Dinkelvollkornmehl', grams: 250, icon: '🌾' },
  { name: 'Magerquark / Speisequark Magerstufe', grams: 250, icon: '🥣' },
];

const BREAKFAST_STAPLES: Array<{ name: string; grams: number; icon: string }> = [
  { name: 'Haferflocken (zart)', grams: 50, icon: '🥣' },
  { name: 'Magerquark / Speisequark Magerstufe', grams: 200, icon: '🥣' },
  { name: 'Hühnerei (frisch, Klasse M)', grams: 110, icon: '🥚' },
  { name: 'Banane (mittelgroß)', grams: 110, icon: '🍌' },
  { name: 'Beeren-Mix (TK)', grams: 100, icon: '🫐' },
  { name: 'Milch (1,5% Fett)', grams: 150, icon: '🥛' },
  { name: 'Whey Proteinpulver (Vanille / Schoko)', grams: 30, icon: '💪' },
  { name: 'Chiasamen', grams: 15, icon: '🌱' },
  { name: 'Blütenhonig / Imkerhonig', grams: 15, icon: '🍯' },
];

const SALAD_STAPLES: Array<{ name: string; grams: number; icon: string }> = [
  { name: 'Gurke (frisch)', grams: 150, icon: '🥒' },
  { name: 'Tomate (frisch)', grams: 150, icon: '🍅' },
  { name: 'Paprika (rot)', grams: 100, icon: '🫑' },
  { name: 'Feta / Schafskäse', grams: 80, icon: '🧀' },
  { name: 'Olivenöl (nativ extra)', grams: 15, icon: '🫒' },
  { name: 'Kichererbsen (gegart, Dose)', grams: 120, icon: '🧆' },
  { name: 'Kürbiskerne', grams: 20, icon: '🎃' },
  { name: 'Balsamico Essig', grams: 15, icon: '🍾' },
];

const SNACK_STAPLES: Array<{ name: string; grams: number; icon: string }> = [
  { name: 'Mandelkerne (naturbelassen)', grams: 30, icon: '🥜' },
  { name: 'Walnusskerne', grams: 25, icon: '🥜' },
  { name: 'Zartbitterschokolade (85% Kakao)', grams: 25, icon: '🍫' },
  { name: 'Apfel (frisch)', grams: 150, icon: '🍏' },
  { name: 'Reiswaffeln (ungesalzen)', grams: 20, icon: '🌾' },
  { name: 'Proteinriegel', grams: 50, icon: '🍫' },
];

const MEAL_STAPLES: Array<{ name: string; grams: number; icon: string }> = [
  { name: 'Rapsöl', grams: 15, icon: '🧈' },
  { name: 'Olivenöl (nativ extra)', grams: 15, icon: '🫒' },
  { name: 'Butter', grams: 20, icon: '🧈' },
  { name: 'Reine Buttermilch', grams: 200, icon: '🥛' },
  { name: 'Kefir mild (1,5% Fett)', grams: 200, icon: '🥛' },
  { name: 'Magerquark / Speisequark Magerstufe', grams: 250, icon: '🥣' },
  { name: 'Schmand (24% Fett)', grams: 50, icon: '🥣' },
  { name: 'Zwiebel (frisch)', grams: 90, icon: '🧅' },
  { name: 'Knoblauch (frisch)', grams: 5, icon: '🧄' },
  { name: 'Tomatenmark (2-fach konzentriert)', grams: 30, icon: '🥫' },
  { name: 'Passierte Tomaten (Passata)', grams: 400, icon: '🥫' },
  { name: 'Gemüsebrühe (zubereitet)', grams: 250, icon: '🍲' },
  { name: 'Hühnerei (frisch, Klasse M)', grams: 55, icon: '🥚' },
  { name: 'Speisesalz / Meersalz', grams: 5, icon: '🧂' },
];

export const inferRecipeCategory = (r: { name: string; category?: RecipeCategory }): RecipeCategory => {
  if (r.category) return r.category;
  const n = r.name.toLowerCase();
  if (
    n.includes('cortado') ||
    n.includes('kaffee') ||
    n.includes('coffee') ||
    n.includes('espresso') ||
    n.includes('cappuccino') ||
    n.includes('latte') ||
    n.includes('tee') ||
    n.includes('tea') ||
    n.includes('shake') ||
    n.includes('smoothie') ||
    n.includes('saft') ||
    n.includes('drink') ||
    n.includes('getränk') ||
    n.includes('kakao') ||
    n.includes('sirup') ||
    n.includes('limonade') ||
    n.includes('wasser') ||
    n.includes('chai')
  ) {
    return 'drink';
  }
  if (
    n.includes('brot') ||
    n.includes('brötchen') ||
    n.includes('kuchen') ||
    n.includes('loaf') ||
    n.includes('teig') ||
    n.includes('muffin') ||
    n.includes('baguette') ||
    n.includes('toast')
  ) {
    return 'bread';
  }
  if (
    n.includes('müsli') ||
    n.includes('haferflocken') ||
    n.includes('porridge') ||
    n.includes('oats') ||
    n.includes('bowl') ||
    n.includes('frühstück') ||
    n.includes('pancake') ||
    n.includes('rührei') ||
    n.includes('omlett') ||
    n.includes('egg')
  ) {
    return 'breakfast';
  }
  if (n.includes('salat') || n.includes('salad')) {
    return 'salad';
  }
  if (
    n.includes('snack') ||
    n.includes('riegel') ||
    n.includes('keks') ||
    n.includes('cookie') ||
    n.includes('chips') ||
    n.includes('praline')
  ) {
    return 'snack';
  }
  return 'meal';
};

export const RecipeCreatorModal = ({
  isOpen,
  onClose,
  onRecipeSaved,
  defaultMealType = 'lunch',
  initialCategory = 'bread',
  initialTab = 'list',
  geminiApiKey,
  onOpenSettings,
  selectedDate,
}: RecipeCreatorModalProps) => {
  const [name, setName] = useState(
    initialCategory === 'meal'
      ? 'Mein Gericht'
      : initialCategory === 'breakfast'
      ? 'Mein Frühstück'
      : initialCategory === 'salad'
      ? 'Mein Salat'
      : initialCategory === 'drink'
      ? 'Mein Getränk / Smoothie'
      : 'Unser selbstgebackenes Brot'
  );
  const [category, setCategory] = useState<RecipeCategory>(initialCategory);
  const [recipeImageUrl, setRecipeImageUrl] = useState<string | null>(null);
  const [recipePrepTime, setRecipePrepTime] = useState<string>('20');
  const [recipeInstructions, setRecipeInstructions] = useState<string>('');
  const photoInputRef = useRef<HTMLInputElement>(null);
  
  // Edit mode state
  const [editingRecipeId, setEditingRecipeId] = useState<number | null>(null);

  // List view UI state: Accordion & Expand
  const [expandedRecipeId, setExpandedRecipeId] = useState<number | null>(null);
  const [listCategoryFilter, setListCategoryFilter] = useState<'all' | 'favorites' | RecipeCategory>('all');
  const [recipeSearchQuery, setRecipeSearchQuery] = useState('');
  const [categoryChangeSuccess, setCategoryChangeSuccess] = useState<{ id: number; cat: string } | null>(null);
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    bread: true,
    breakfast: true,
    meal: true,
    salad: true,
    drink: true,
    snack: true,
  });

  // Auto-migrate legacy recipes that had no category or were miscategorized before v1.5, or had 5% steam loss
  useEffect(() => {
    const migrateLegacyCategories = async () => {
      try {
        const allRecipes = await db.recipes.toArray();
        for (const r of allRecipes) {
          if (!r.id) continue;
          const inferred = inferRecipeCategory(r);
          const needsCatMigration = !r.category || (r.category === 'meal' && inferred !== 'meal');
          const isDrink = inferred === 'drink';
          const isBread = inferred === 'bread';
          const isCoffee = r.name.toLowerCase().includes('cortado') || r.name.toLowerCase().includes('kaffee') || r.name.toLowerCase().includes('espresso');
          const servingName = isCoffee ? '1 Tasse' : isDrink ? '1 Glas' : isBread ? '1 Scheibe' : r.servingName || '1 Portion (Ganzes Gericht)';
          const servingWeightGrams = isCoffee ? 120 : isDrink ? (r.cookedWeight || 250) : isBread ? 50 : (r.cookedWeight || 250);

          let newCooked = r.cookedWeight;
          // Restore true 100% weight for non-bread meals that suffered from the old 5% steam loss reduction
          if (inferred !== 'bread' && r.totalRawWeight && r.cookedWeight && Math.round(r.totalRawWeight * 0.95) === r.cookedWeight) {
            newCooked = r.totalRawWeight;
          }

          if (needsCatMigration || newCooked !== r.cookedWeight) {
            await db.recipes.update(r.id, {
              category: inferred,
              cookedWeight: newCooked,
              servingName,
              servingWeightGrams: r.servingWeightGrams || servingWeightGrams,
            });
          }
        }
      } catch (err) {
        console.error('Migration of legacy categories failed', err);
      }
    };
    migrateLegacyCategories();
  }, []);

  const handleQuickChangeCategory = async (e: React.MouseEvent, r: CustomRecipe, newCategory: RecipeCategory) => {
    e.stopPropagation();
    if (!r.id) return;
    const isDrink = newCategory === 'drink';
    const isBread = newCategory === 'bread';
    const isCoffee = r.name.toLowerCase().includes('cortado') || r.name.toLowerCase().includes('kaffee') || r.name.toLowerCase().includes('espresso');
    const servingName = isCoffee ? '1 Tasse' : isDrink ? '1 Glas' : isBread ? '1 Scheibe' : '1 Portion';
    const servingWeightGrams = isCoffee ? 120 : isDrink ? 250 : isBread ? 50 : 250;

    await db.recipes.update(r.id, {
      category: newCategory,
      servingName,
      servingWeightGrams: r.servingWeightGrams || servingWeightGrams,
    });

    const labelMap: Record<RecipeCategory, string> = {
      bread: 'Brot & Backen',
      breakfast: 'Frühstück & Bowls',
      meal: 'Hauptgericht',
      salad: 'Salat',
      drink: 'Getränke',
      snack: 'Snacks',
    };

    setCategoryChangeSuccess({ id: r.id, cat: labelMap[newCategory] });
    setTimeout(() => {
      setCategoryChangeSuccess(null);
    }, 2500);
  };

  const toggleCategory = (cat: string) => {
    setOpenCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  const handleStartEdit = (r: CustomRecipe) => {
    setEditingRecipeId(r.id || null);
    setName(r.name);
    const cat = inferRecipeCategory(r);
    setCategory(cat);
    setIngredients(r.ingredients ? [...r.ingredients] : []);
    setSliceWeight(String(r.servingWeightGrams || (cat === 'bread' ? 50 : 250)));
    setCustomBakedWeight(r.cookedWeight ? String(r.cookedWeight) : '');
    setRecipeImageUrl(r.imageUrl || null);
    setRecipePrepTime(r.prepTimeMinutes ? String(r.prepTimeMinutes) : '20');
    setRecipeInstructions(r.instructions ? r.instructions.join('\n') : '');
    setActiveTab('create');
  };

  const handleCancelEdit = () => {
    setEditingRecipeId(null);
    setName(
      category === 'meal'
        ? 'Mein Gericht'
        : category === 'breakfast'
        ? 'Mein Frühstück'
        : category === 'salad'
        ? 'Mein Salat'
        : category === 'drink'
        ? 'Mein Getränk / Smoothie'
        : 'Unser selbstgebackenes Brot'
    );
    setIngredients([]);
    setCustomBakedWeight('');
    setSliceWeight(category === 'bread' ? '50' : '250');
    setRecipeImageUrl(null);
    setRecipePrepTime('20');
    setRecipeInstructions('');
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, 800, 0.75);
      setRecipeImageUrl(compressed.previewUrl);
    } catch (err) {
      console.error('Photo compress failed:', err);
    }
  };

  const handleToggleFavorite = async (e: React.MouseEvent, recipeId?: number) => {
    e.stopPropagation();
    if (!recipeId) return;
    const target = await db.recipes.get(recipeId);
    if (target) {
      await db.recipes.update(recipeId, { isFavorite: !target.isFavorite });
    }
  };

  // Interactive Portion Scaling & Cooking Checkboxes in Database List
  const [portionRatios, setPortionRatios] = useState<Record<number, number>>({});
  const [portionCustomGrams, setPortionCustomGrams] = useState<Record<number, string>>({});
  const [checkedIngredients, setCheckedIngredients] = useState<Record<string, boolean>>({});
  const [checkedInstructions, setCheckedInstructions] = useState<Record<string, boolean>>({});

  const getPortionRatio = (recipeId?: number) => {
    if (!recipeId) return 1;
    return portionRatios[recipeId] !== undefined ? portionRatios[recipeId] : 1;
  };

  const setPortionRatio = (recipeId: number, ratio: number) => {
    setPortionRatios((prev) => ({ ...prev, [recipeId]: ratio }));
    setPortionCustomGrams((prev) => {
      const copy = { ...prev };
      delete copy[recipeId];
      return copy;
    });
  };

  const setRecipeCustomGramInput = (recipeId: number, gramsStr: string, totalWeight: number) => {
    setPortionCustomGrams((prev) => ({ ...prev, [recipeId]: gramsStr }));
    const parsed = parseFloat(gramsStr);
    if (parsed && parsed > 0 && totalWeight > 0) {
      setPortionRatios((prev) => ({ ...prev, [recipeId]: parsed / totalWeight }));
    }
  };

  const toggleIngredientCheck = (key: string) => {
    setCheckedIngredients((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleInstructionCheck = (key: string) => {
    setCheckedInstructions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Diary Logging Modal State & Handlers
  const [diaryLogModalRecipe, setDiaryLogModalRecipe] = useState<CustomRecipe | null>(null);
  const [diaryLogMealType, setDiaryLogMealType] = useState<MealType>(defaultMealType || 'lunch');
  const [diaryLogFraction, setDiaryLogFraction] = useState<number>(1);
  const [diaryLogCustomGrams, setDiaryLogCustomGrams] = useState<string>('');
  const [diaryLogSuccess, setDiaryLogSuccess] = useState<string | null>(null);

  const handleOpenDiaryLog = (e: React.MouseEvent, r: CustomRecipe) => {
    e.stopPropagation();
    setDiaryLogModalRecipe(r);
    // Suggest mealType matching recipe category or current time
    const effectiveCategory = inferRecipeCategory(r);
    if (effectiveCategory === 'breakfast') setDiaryLogMealType('breakfast');
    else if (effectiveCategory === 'snack') setDiaryLogMealType('snack');
    else if (effectiveCategory === 'drink') {
      const hour = new Date().getHours();
      if (hour < 11) setDiaryLogMealType('breakfast');
      else setDiaryLogMealType('snack');
    } else {
      const hour = new Date().getHours();
      if (hour < 11) setDiaryLogMealType('breakfast');
      else if (hour < 15) setDiaryLogMealType('lunch');
      else if (hour < 21) setDiaryLogMealType('dinner');
      else setDiaryLogMealType('snack');
    }

    const currentRatio = r.id ? getPortionRatio(r.id) : 1;
    const currentCustom = r.id ? portionCustomGrams[r.id] || '' : '';
    setDiaryLogFraction(currentRatio);
    setDiaryLogCustomGrams(currentCustom);
  };

  const handleLogToDiary = async () => {
    if (!diaryLogModalRecipe) return;
    const r = diaryLogModalRecipe;
    const effectiveCategory = inferRecipeCategory(r);
    const isBread = effectiveCategory === 'bread';
    const isDrink = effectiveCategory === 'drink';
    const totalDishWeight = r.cookedWeight || r.totalRawWeight;

    let totalLoggedGrams = Math.round(totalDishWeight * diaryLogFraction);
    let unitLabel = '';

    const parsedCustom = parseFloat(diaryLogCustomGrams);
    if (parsedCustom && parsedCustom > 0) {
      totalLoggedGrams = Math.round(parsedCustom);
      unitLabel = `Portion (${totalLoggedGrams}${isDrink ? 'ml' : 'g'})`;
    } else {
      if (isBread) {
        const sliceG = r.servingWeightGrams || 50;
        if (Math.abs(diaryLogFraction - 1) < 0.02) {
          unitLabel = `Ganzer Laib (${totalDishWeight}g)`;
        } else if (Math.abs(diaryLogFraction - 0.5) < 0.02) {
          unitLabel = `1/2 Laib (${totalLoggedGrams}g)`;
        } else {
          const numSlices = Math.max(1, Math.round(totalLoggedGrams / sliceG));
          unitLabel = numSlices === 1 ? `1 Scheibe (${totalLoggedGrams}g)` : `${numSlices} Scheiben (${totalLoggedGrams}g)`;
        }
      } else {
        if (Math.abs(diaryLogFraction - 1) < 0.02) {
          unitLabel = `Ganzes Gericht (${totalLoggedGrams}${isDrink ? 'ml' : 'g'})`;
        } else if (Math.abs(diaryLogFraction - 0.5) < 0.02) {
          unitLabel = `1/2 Gericht (${totalLoggedGrams}${isDrink ? 'ml' : 'g'})`;
        } else if (Math.abs(diaryLogFraction - 1 / 3) < 0.02) {
          unitLabel = `1/3 Gericht (${totalLoggedGrams}${isDrink ? 'ml' : 'g'})`;
        } else if (Math.abs(diaryLogFraction - 0.25) < 0.02) {
          unitLabel = `1/4 Gericht (${totalLoggedGrams}${isDrink ? 'ml' : 'g'})`;
        } else if (Math.abs(diaryLogFraction - 1 / 6) < 0.02) {
          unitLabel = `1/6 Gericht (${totalLoggedGrams}${isDrink ? 'ml' : 'g'})`;
        } else if (diaryLogFraction > 1) {
          unitLabel = `${diaryLogFraction}x Gesamtrezept (${totalLoggedGrams}${isDrink ? 'ml' : 'g'})`;
        } else {
          unitLabel = `Portion (${totalLoggedGrams}${isDrink ? 'ml' : 'g'})`;
        }
      }
    }

    const ratio = totalLoggedGrams / 100;
    const todayStr = selectedDate || new Date().toISOString().split('T')[0];

    const entry: DiaryEntry = {
      date: todayStr,
      mealType: diaryLogMealType,
      name: r.name,
      calories: Math.round(r.calories100g * ratio),
      protein: Math.round((r.protein100g || 0) * ratio * 10) / 10,
      carbs: Math.round((r.carbs100g || 0) * ratio * 10) / 10,
      fat: Math.round((r.fat100g || 0) * ratio * 10) / 10,
      fiber: r.fiber100g ? Math.round(r.fiber100g * ratio * 10) / 10 : undefined,
      sugar: r.sugar100g ? Math.round(r.sugar100g * ratio * 10) / 10 : undefined,
      amount: totalLoggedGrams,
      unit: unitLabel,
      timestamp: Date.now(),
    };

    await db.diaryEntries.add(entry);

    confetti({
      particleCount: 30,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#10B981', '#F59E0B', '#3B82F6'],
    });

    setDiaryLogSuccess(`„${r.name}“ erfolgreich als ${diaryLogMealType === 'breakfast' ? 'Frühstück' : diaryLogMealType === 'lunch' ? 'Mittagessen' : diaryLogMealType === 'dinner' ? 'Abendessen' : 'Snack'} eingetragen!`);
    setTimeout(() => {
      setDiaryLogSuccess(null);
      setDiaryLogModalRecipe(null);
    }, 1600);
  };


  // AI Chef Tab State & Handlers
  const [chefPrompt, setChefPrompt] = useState('');
  const [isChefLoading, setIsChefLoading] = useState(false);
  const [chefError, setChefError] = useState<string | null>(null);
  const [chefResult, setChefResult] = useState<AiChefRecipeResult | null>(null);

  const handleAskChef = async () => {
    if (!chefPrompt.trim()) return;
    if (!geminiApiKey) {
      setChefError('Kein Gemini API-Key hinterlegt. Bitte trage deinen kostenlosen Key in den Profileinstellungen ein.');
      return;
    }

    setIsChefLoading(true);
    setChefError(null);
    setChefResult(null);

    try {
      const res = await generateRecipeWithAiChef({
        userPrompt: chefPrompt.trim(),
        apiKey: geminiApiKey,
      });
      setChefResult(res);
      confetti({
        particleCount: 35,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#F59E0B', '#10B981', '#EC4899'],
      });
    } catch (err: any) {
      setChefError(err.message || 'Der KI-Chefkoch konnte das Rezept leider nicht erstellen.');
    } finally {
      setIsChefLoading(false);
    }
  };

  const handleTransferChefToEditor = (res: AiChefRecipeResult) => {
    setName(res.name);
    setCategory(res.category);
    setIngredients(res.ingredients.map(i => ({
      name: i.name,
      amountGrams: i.amountGrams,
      calories: i.calories,
      protein: i.protein,
      carbs: i.carbs,
      fat: i.fat,
      fiber: i.fiber,
      sugar: i.sugar,
    })));
    setRecipeInstructions(res.instructions.join('\n'));
    setRecipePrepTime(String(res.prepTimeMinutes || 20));
    setSliceWeight(String(res.servingWeightGrams || 250));
    if (res.cookedWeightGrams) setCustomBakedWeight(String(res.cookedWeightGrams));
    setActiveTab('create');
  };

  const handleSaveChefDirectly = async (res: AiChefRecipeResult) => {
    const rawWeight = res.ingredients.reduce((s, i) => s + (i.amountGrams || 0), 0);
    const isBread = res.category === 'bread';
    const cooked = res.cookedWeightGrams || (isBread ? Math.round(rawWeight * 0.86) : rawWeight);
    const totalCalories = res.ingredients.reduce((s, i) => s + (i.calories || 0), 0);
    const totalProtein = res.ingredients.reduce((s, i) => s + (i.protein || 0), 0);
    const totalCarbs = res.ingredients.reduce((s, i) => s + (i.carbs || 0), 0);
    const totalFat = res.ingredients.reduce((s, i) => s + (i.fat || 0), 0);
    const totalFiber = res.ingredients.reduce((s, i) => s + (i.fiber || 0), 0);
    const totalSugar = res.ingredients.reduce((s, i) => s + (i.sugar || 0), 0);

    const cal100g = cooked > 0 ? Math.round((totalCalories / cooked) * 100) : 0;
    const p100g = cooked > 0 ? Math.round(((totalProtein / cooked) * 100) * 10) / 10 : 0;
    const cb100g = cooked > 0 ? Math.round(((totalCarbs / cooked) * 100) * 10) / 10 : 0;
    const f100g = cooked > 0 ? Math.round(((totalFat / cooked) * 100) * 10) / 10 : 0;
    const fib100g = cooked > 0 && totalFiber > 0 ? Math.round(((totalFiber / cooked) * 100) * 10) / 10 : undefined;
    const sug100g = cooked > 0 && totalSugar > 0 ? Math.round(((totalSugar / cooked) * 100) * 10) / 10 : undefined;

    const newRecipe: CustomRecipe = {
      name: res.name,
      category: res.category,
      ingredients: res.ingredients,
      instructions: res.instructions,
      prepTimeMinutes: res.prepTimeMinutes,
      tags: res.tags,
      totalRawWeight: rawWeight,
      cookedWeight: cooked,
      servingName: res.servingName,
      servingWeightGrams: res.servingWeightGrams,
      calories100g: cal100g,
      protein100g: p100g,
      carbs100g: cb100g,
      fat100g: f100g,
      fiber100g: fib100g,
      sugar100g: sug100g,
      createdAt: Date.now(),
    };

    const id = await db.recipes.add(newRecipe);
    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10B981', '#F59E0B', '#EC4899'],
    });
    setChefResult(null);
    setChefPrompt('');
    setActiveTab('list');
    setExpandedRecipeId(id);
  };
  
  // Ingredients list
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>(
    initialCategory === 'meal'
      ? []
      : initialCategory === 'drink'
      ? []
      : [
          { name: 'Dinkelmehl Type 630', amountGrams: 500, calories: 1725, protein: 65, carbs: 345, fat: 6.5 },
          { name: 'Wasser (Leitungswasser)', amountGrams: 350, calories: 0, protein: 0, carbs: 0, fat: 0 },
          { name: 'Sauerteig / Anstellgut (Roggen/Dinkel)', amountGrams: 100, calories: 130, protein: 4.5, carbs: 25, fat: 0.6 },
          { name: 'Speisesalz / Meersalz', amountGrams: 10, calories: 0, protein: 0, carbs: 0, fat: 0 },
        ]
  );

  // Ingredient picker search & selection
  const [ingredientQuery, setIngredientQuery] = useState('');
  const [selectedFood, setSelectedFood] = useState<FoodProduct | null>(null);
  const [ingredientGrams, setIngredientGrams] = useState('50');
  const [searchResults, setSearchResults] = useState<FoodProduct[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activePickerTab, setActivePickerTab] = useState<'search' | 'favorites' | 'staples'>('search');
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // AI Ingredient Lookup State
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Favorites from local database
  const favoriteItems = useLiveQuery(() => db.favoriteItems.orderBy('useCount').reverse().limit(20).toArray()) || [];

  // Portion presets for the currently selected ingredient
  const ingredientPresets = useMemo(() => {
    return getPortionPresets(selectedFood);
  }, [selectedFood]);

  // Loaf / Dish weights & Portions
  const [customBakedWeight, setCustomBakedWeight] = useState<string>('');
  const [sliceWeight, setSliceWeight] = useState<string>(
    initialCategory === 'bread' ? '50' : '250'
  );

  // Custom recipes list & sharing
  const customRecipes = useLiveQuery(() => db.recipes.reverse().toArray()) || [];
  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'chef'>(initialTab);
  const [sharingRecipe, setSharingRecipe] = useState<CustomRecipe | null>(null);

  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  const handleDeleteRecipe = async (e: React.MouseEvent, recipeId?: number) => {
    e.stopPropagation();
    if (!recipeId) return;
    if (window.confirm('Möchtest du dieses Rezept wirklich dauerhaft löschen?')) {
      await db.recipes.delete(recipeId);
      if (expandedRecipeId === recipeId) setExpandedRecipeId(null);
      if (editingRecipeId === recipeId) handleCancelEdit();
    }
  };

  // Whole Recipe AI Parser State
  const [isAiRecipeModalOpen, setIsAiRecipeModalOpen] = useState(false);
  const [aiRecipeText, setAiRecipeText] = useState('');
  const [isAiRecipeParsing, setIsAiRecipeParsing] = useState(false);
  const [aiRecipeError, setAiRecipeError] = useState<string | null>(null);

  const handleParseAiRecipe = async () => {
    if (!aiRecipeText.trim()) return;
    if (!geminiApiKey) {
      setAiRecipeError('Kein Gemini API-Key hinterlegt. Bitte trage deinen kostenlosen Key in den Profileinstellungen ein.');
      return;
    }

    setIsAiRecipeParsing(true);
    setAiRecipeError(null);

    try {
      const parsed = await parseRecipeWithGemini({
        text: aiRecipeText.trim(),
        apiKey: geminiApiKey,
      });

      if (parsed.name) setName(parsed.name);
      if (parsed.category) setCategory(parsed.category);
      if (parsed.servingWeightGrams) setSliceWeight(String(parsed.servingWeightGrams));
      if (parsed.cookedWeightGrams) setCustomBakedWeight(String(parsed.cookedWeightGrams));

      if (parsed.ingredients && parsed.ingredients.length > 0) {
        setIngredients(
          parsed.ingredients.map((ing) => ({
            name: ing.name,
            amountGrams: ing.amountGrams,
            calories: ing.calories,
            protein: ing.protein,
            carbs: ing.carbs,
            fat: ing.fat,
            fiber: ing.fiber,
            sugar: ing.sugar,
          }))
        );
      }

      setIsAiRecipeModalOpen(false);
      setAiRecipeText('');
      confetti({
        particleCount: 35,
        spread: 50,
        origin: { y: 0.6 },
      });
    } catch (err: any) {
      setAiRecipeError(err.message || 'Fehler beim Analysieren des Rezepts mit KI.');
    } finally {
      setIsAiRecipeParsing(false);
    }
  };

  // Debounced search combining local verified items (all supermarket brands & staples) and online OpenFoodFacts
  useEffect(() => {
    const q = ingredientQuery.trim().toLowerCase();
    if (!q || q.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const normQ = normalizeGermanSearch(q);
    const queryTokens = q.split(/\s+/).filter(Boolean);
    const normTokens = normQ.split(/\s+/).filter(Boolean);

    const localMatches = ALL_LOCAL_FOODS.filter((item) => {
      const nameLower = item.name.toLowerCase();
      const brandLower = (item.brand || '').toLowerCase();
      const normName = normalizeGermanSearch(item.name);
      const normBrand = normalizeGermanSearch(item.brand || '');

      return (
        queryTokens.every((token) => nameLower.includes(token) || brandLower.includes(token)) ||
        normTokens.every((token) => normName.includes(token) || normBrand.includes(token))
      );
    }).slice(0, 15);

    setSearchResults(localMatches);
    setActivePickerTab('search');

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const remoteMatches = await searchFoodProducts(q);
        const seen = new Set(localMatches.map((m) => m.name.toLowerCase()));
        const merged = [...localMatches];
        for (const item of remoteMatches) {
          if (!seen.has(item.name.toLowerCase())) {
            seen.add(item.name.toLowerCase());
            merged.push(item);
          }
          if (merged.length >= 25) break;
        }
        setSearchResults(merged);
      } catch (err) {
        console.error('Ingredient search error', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [ingredientQuery]);

  // Compute raw totals
  const totalRawWeight = useMemo(() => {
    return ingredients.reduce((sum, item) => sum + item.amountGrams, 0);
  }, [ingredients]);

  const totalRawCalories = useMemo(() => {
    return ingredients.reduce((sum, item) => sum + item.calories, 0);
  }, [ingredients]);

  const totalRawProtein = useMemo(() => {
    return ingredients.reduce((sum, item) => sum + item.protein, 0);
  }, [ingredients]);

  const totalRawCarbs = useMemo(() => {
    return ingredients.reduce((sum, item) => sum + item.carbs, 0);
  }, [ingredients]);

  const totalRawFat = useMemo(() => {
    return ingredients.reduce((sum, item) => sum + item.fat, 0);
  }, [ingredients]);

  // Baked/Cooked weight: if not manually specified, bread loses ~12% (water evaporation), other categories keep 100% of raw ingredients
  const effectiveBakedWeight = useMemo(() => {
    const manual = parseFloat(customBakedWeight);
    if (manual && manual > 0) return manual;
    if (category === 'bread') return Math.round(totalRawWeight * 0.88);
    return totalRawWeight;
  }, [customBakedWeight, totalRawWeight, category]);

  // Nutritional values per 100g of final baked/cooked food
  const caloriesPer100g = useMemo(() => {
    if (effectiveBakedWeight <= 0) return 0;
    return Math.round((totalRawCalories / effectiveBakedWeight) * 100);
  }, [totalRawCalories, effectiveBakedWeight]);

  const proteinPer100g = useMemo(() => {
    if (effectiveBakedWeight <= 0) return 0;
    return Math.round(((totalRawProtein / effectiveBakedWeight) * 100) * 10) / 10;
  }, [totalRawProtein, effectiveBakedWeight]);

  const carbsPer100g = useMemo(() => {
    if (effectiveBakedWeight <= 0) return 0;
    return Math.round(((totalRawCarbs / effectiveBakedWeight) * 100) * 10) / 10;
  }, [totalRawCarbs, effectiveBakedWeight]);

  const fatPer100g = useMemo(() => {
    if (effectiveBakedWeight <= 0) return 0;
    return Math.round(((totalRawFat / effectiveBakedWeight) * 100) * 10) / 10;
  }, [totalRawFat, effectiveBakedWeight]);

  // Nutritional values per single slice/portion
  const numSliceWeight = parseFloat(sliceWeight) || (category === 'bread' ? 50 : effectiveBakedWeight || 250);
  const sliceMultiplier = numSliceWeight / 100;
  const caloriesPerSlice = Math.round(caloriesPer100g * sliceMultiplier);
  const proteinPerSlice = Math.round(proteinPer100g * sliceMultiplier * 10) / 10;
  const carbsPerSlice = Math.round(carbsPer100g * sliceMultiplier * 10) / 10;
  const fatPerSlice = Math.round(fatPer100g * sliceMultiplier * 10) / 10;

  if (!isOpen) return null;

  const handleSelectFood = (food: FoodProduct, defaultGrams?: number) => {
    setSelectedFood(food);
    const presets = getPortionPresets(food);
    const def = presets.find((p) => p.isDefault) || presets[0];
    const initialGrams = defaultGrams || (def ? def.grams : food.servingWeightGrams || 50);
    setIngredientGrams(String(initialGrams));
    setIngredientQuery('');
    setSearchResults([]);
  };

  const handleSelectFavorite = (fav: any) => {
    const food: FoodProduct = {
      id: String(fav.id || fav.name),
      name: fav.name,
      calories100g: fav.calories,
      protein100g: fav.protein,
      carbs100g: fav.carbs,
      fat100g: fav.fat,
      servingWeightGrams: fav.defaultAmount,
      source: 'local',
    };
    handleSelectFood(food, fav.defaultAmount);
  };

  const handleSelectStaple = (staple: { name: string; grams: number }) => {
    const found = ALL_LOCAL_FOODS.find((f) => f.name.toLowerCase() === staple.name.toLowerCase()) || {
      id: `staple_${Date.now()}`,
      name: staple.name,
      calories100g: staple.name.includes('öl')
        ? 884
        : staple.name.includes('mehl')
        ? 345
        : staple.name.includes('milch') || staple.name.includes('Kefir')
        ? 47
        : staple.name.includes('honig')
        ? 304
        : staple.name.includes('banane')
        ? 89
        : 50,
      protein100g: staple.name.includes('protein') ? 75 : 0,
      carbs100g: 0,
      fat100g: 0,
      source: 'local' as const,
    };
    handleSelectFood(found, staple.grams);
  };

  const handleAiLookupIngredient = async () => {
    const q = ingredientQuery.trim();
    if (!q) return;

    if (!geminiApiKey) {
      setAiError('Kein Gemini API-Key hinterlegt. Bitte trage deinen kostenlosen Key in den Profileinstellungen ein.');
      return;
    }

    setIsAiSearching(true);
    setAiError(null);
    try {
      const product = await queryFoodWithGemini(q, geminiApiKey);
      if (product) {
        handleSelectFood(product);
        setIngredientQuery('');
      } else {
        setAiError(`Konnte für „${q}“ keine Nährwerte über KI ermitteln.`);
      }
    } catch (err: any) {
      setAiError(err.message || 'KI-Recherche fehlgeschlagen.');
    } finally {
      setIsAiSearching(false);
    }
  };

  const handleAddIngredient = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    let foodToAdd = selectedFood;
    const grams = parseFloat(ingredientGrams) || 50;

    // If user didn't pick from dropdown, but entered text
    if (!foodToAdd && ingredientQuery.trim()) {
      if (searchResults.length > 0) {
        foodToAdd = searchResults[0];
      } else {
        foodToAdd = {
          id: `custom_${Date.now()}`,
          name: ingredientQuery.trim(),
          calories100g: 100,
          protein100g: 2,
          carbs100g: 10,
          fat100g: 2,
          source: 'local',
        };
      }
    }

    if (!foodToAdd) return;

    const mult = grams / 100;
    const newIng: RecipeIngredient = {
      name: foodToAdd.name + (foodToAdd.brand ? ` (${foodToAdd.brand})` : ''),
      amountGrams: grams,
      calories: Math.round(foodToAdd.calories100g * mult),
      protein: Math.round(foodToAdd.protein100g * mult * 10) / 10,
      carbs: Math.round(foodToAdd.carbs100g * mult * 10) / 10,
      fat: Math.round(foodToAdd.fat100g * mult * 10) / 10,
    };

    setIngredients((prev) => [...prev, newIng]);
    setSelectedFood(null);
    setIngredientQuery('');
    setIngredientGrams('50');
    setSearchResults([]);
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleSaveRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || ingredients.length === 0) return;

    const instructionsArray = recipeInstructions
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    const parsedPrep = parseInt(recipePrepTime, 10);

    const recipe: CustomRecipe = {
      name: name.trim(),
      category,
      imageUrl: recipeImageUrl || undefined,
      prepTimeMinutes: !isNaN(parsedPrep) && parsedPrep > 0 ? parsedPrep : undefined,
      instructions: instructionsArray.length > 0 ? instructionsArray : undefined,
      ingredients,
      totalRawWeight,
      cookedWeight: effectiveBakedWeight,
      servingName: category === 'bread'
        ? '1 Scheibe'
        : category === 'drink'
        ? (numSliceWeight >= effectiveBakedWeight ? 'Ganzes Getränk' : '1 Glas')
        : (numSliceWeight >= effectiveBakedWeight ? 'Ganzes Gericht' : `1 Portion (von ${Math.max(2, Math.round(effectiveBakedWeight / numSliceWeight))})`),
      servingWeightGrams: numSliceWeight,
      calories100g: caloriesPer100g,
      protein100g: proteinPer100g,
      carbs100g: carbsPer100g,
      fat100g: fatPer100g,
      createdAt: Date.now(),
    };

    let targetId = editingRecipeId;
    if (editingRecipeId) {
      await db.recipes.put({ ...recipe, id: editingRecipeId });
      recipe.id = editingRecipeId;
      setEditingRecipeId(null);
    } else {
      const id = await db.recipes.add(recipe);
      recipe.id = id;
      targetId = id;
    }

    // Also add to favoriteItems so it's directly accessible in diary search
    await db.favoriteItems.add({
      name: recipe.name,
      calories: recipe.calories100g,
      protein: recipe.protein100g,
      carbs: recipe.carbs100g,
      fat: recipe.fat100g,
      defaultUnit: `${recipe.servingName} (${recipe.servingWeightGrams}g)`,
      defaultAmount: recipe.servingWeightGrams,
      useCount: 3,
    });

    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#10B981', '#F59E0B', '#8B5CF6'],
    });

    if (onRecipeSaved && !editingRecipeId) {
      onRecipeSaved(recipe);
    }

    // Switch to list tab & expand the updated recipe!
    setActiveTab('list');
    setExpandedRecipeId(targetId || null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-soft-lg border border-stone-100 overflow-hidden max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="p-4 px-6 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl text-lg bg-emerald-50 text-emerald-600">
              📖
            </span>
            <div>
              <h3 className="font-bold text-stone-800 text-base">
                {editingRecipeId ? 'Rezept bearbeiten' : 'Rezepte-Datenbank'}
              </h3>
              <p className="text-xs text-stone-400">
                {editingRecipeId
                  ? 'Passe Zutaten, Zubereitung oder Foto an'
                  : 'Eigene Rezepte, Fotos, Nährwerte & KI-Chefkoch'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs: 3 Tabs (Datenbank, Erstellen, KI-Chefkoch) */}
        <div className="flex border-b border-stone-100 bg-stone-50/70 px-3 pt-1.5 shrink-0 gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('list')}
            className={`flex-1 py-2 px-2.5 text-xs font-bold border-b-2 transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'list'
                ? 'border-emerald-600 text-emerald-800 bg-white rounded-t-xl shadow-2xs'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Datenbank ({customRecipes.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-2 px-2.5 text-xs font-bold border-b-2 transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'create'
                ? 'border-emerald-600 text-emerald-800 bg-white rounded-t-xl shadow-2xs'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            {editingRecipeId ? <Edit3 className="w-3.5 h-3.5 text-amber-600" /> : <Plus className="w-3.5 h-3.5" />}
            <span>{editingRecipeId ? 'Bearbeiten' : 'Neues Rezept'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('chef')}
            className={`flex-1 py-2 px-2.5 text-xs font-bold border-b-2 transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'chef'
                ? 'border-amber-500 text-amber-900 bg-white rounded-t-xl shadow-2xs'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>KI-Chefkoch</span>
          </button>
        </div>

        {activeTab === 'create' && (
          <form onSubmit={handleSaveRecipe} className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* Edit Mode Notice Banner */}
          {editingRecipeId && (
            <div className="p-3 bg-amber-50 border border-amber-200/90 rounded-2xl flex items-center justify-between text-xs text-amber-950 shadow-2xs animate-in fade-in">
              <div className="flex items-center gap-2">
                <span className="text-base">✏️</span>
                <div>
                  <span className="font-bold block">Du bearbeitest dieses Rezept</span>
                  <span className="text-[11px] text-amber-800">Änderungen werden direkt im Rezept aktualisiert.</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="py-1 px-2.5 rounded-xl bg-white border border-amber-300 text-amber-900 font-bold hover:bg-amber-100 transition-colors shrink-0 text-[11px] cursor-pointer"
              >
                Abbrechen
              </button>
            </div>
          )}

          {/* Recipe Name & Category */}
          <div className="space-y-3">
            {/* Foto Upload Card */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-stone-500 block mb-1">
                Foto zum Rezept (optional)
              </label>
              <input
                type="file"
                ref={photoInputRef}
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              {recipeImageUrl ? (
                <div className="relative rounded-2xl overflow-hidden border border-stone-200 group h-40 bg-stone-100 shadow-2xs">
                  <img
                    src={recipeImageUrl}
                    alt="Rezeptfoto"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-stone-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      className="py-1.5 px-3 rounded-xl bg-white/90 text-stone-800 font-bold text-xs hover:bg-white transition-all shadow-sm flex items-center gap-1 cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Foto ändern</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecipeImageUrl(null)}
                      className="py-1.5 px-3 rounded-xl bg-rose-600/90 text-white font-bold text-xs hover:bg-rose-600 transition-all shadow-sm flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Entfernen</span>
                    </button>
                  </div>
                  <div className="absolute top-2 right-2 sm:hidden flex gap-1">
                    <button
                      type="button"
                      onClick={() => setRecipeImageUrl(null)}
                      className="p-1 rounded-lg bg-stone-900/60 text-white hover:bg-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="w-full py-3.5 border-2 border-dashed border-stone-200 hover:border-emerald-400 hover:bg-emerald-50/30 rounded-2xl flex items-center justify-center gap-2.5 text-stone-500 hover:text-emerald-700 transition-all cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-xl bg-stone-100 group-hover:bg-emerald-100 flex items-center justify-center text-stone-600 group-hover:text-emerald-700 transition-colors">
                    <Camera className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-bold block text-stone-700 group-hover:text-emerald-800">
                      Foto hinzufügen (Kamera oder Galerie)
                    </span>
                    <span className="text-[10px] text-stone-400">
                      Wird automatisch komprimiert & offline gespeichert
                    </span>
                  </div>
                </button>
              )}
            </div>

            {/* Recipe Name */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-stone-500 block mb-1">
                Name deines Rezepts *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder={
                    category === 'bread'
                      ? 'z. B. Unser Dinkel-Sauerteigbrot, Apfelkuchen'
                      : category === 'breakfast'
                      ? 'z. B. Beeren-Haferflocken-Bowl, Rührei'
                      : category === 'salad'
                      ? 'z. B. Bunter Sommersalat mit Feta'
                      : category === 'drink'
                      ? 'z. B. Grüner Smoothie, Protein-Beeren-Shake'
                      : category === 'snack'
                      ? 'z. B. Selbstgemachte Müsliriegel'
                      : 'z. B. Blumenkohl-Auflauf, Rindergulasch, Gemüsecurry'
                  }
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-4 pr-10 py-2.5 rounded-2xl border border-stone-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-bold text-stone-800 text-sm"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  <VoiceInputButton
                    onTranscript={(text) => setName(text)}
                    currentValue={name}
                    size="xs"
                    title="Rezeptnamen einsprechen"
                  />
                </div>
              </div>
            </div>

            {/* Rubriken & Zubereitungszeit */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                  Rubrik wählen:
                </label>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-stone-400" />
                  <span className="text-xs font-bold text-stone-500">Zubereitung:</span>
                  <input
                    type="number"
                    min="1"
                    max="360"
                    value={recipePrepTime}
                    onChange={(e) => setRecipePrepTime(e.target.value)}
                    className="w-12 px-1.5 py-0.5 rounded-lg border border-stone-200 bg-white font-bold text-stone-800 text-xs text-center focus:border-emerald-500"
                  />
                  <span className="text-xs text-stone-400">Min.</span>
                </div>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                {[
                  { id: 'bread' as const, label: 'Brot & Backen', icon: '🍞' },
                  { id: 'breakfast' as const, label: 'Frühstück', icon: '🥣' },
                  { id: 'meal' as const, label: 'Hauptgericht', icon: '🍲' },
                  { id: 'salad' as const, label: 'Salat', icon: '🥗' },
                  { id: 'drink' as const, label: 'Getränk', icon: '🥤' },
                  { id: 'snack' as const, label: 'Snack', icon: '🍫' },
                ].map((cat) => {
                  const isCur = category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setCategory(cat.id);
                        if (cat.id === 'bread' && sliceWeight === '250') setSliceWeight('50');
                        if (cat.id !== 'bread' && sliceWeight === '50') setSliceWeight('250');
                      }}
                      className={`py-2 px-1 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer text-center ${
                        isCur
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-2xs'
                          : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                      }`}
                    >
                      <span className="text-base">{cat.icon}</span>
                      <span className="text-[10px] leading-tight">{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* AI Whole-Recipe Speech & Text Import Banner */}
            <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100/60 p-3 rounded-2xl border border-emerald-200/80 flex items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-sm shrink-0 shadow-2xs">
                  ✨
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-emerald-950 block truncate">
                    Ganzes Rezept per Sprache oder Text?
                  </span>
                  <span className="text-[11px] text-emerald-700 block truncate">
                    Zutaten, Mengenumrechnung & Nährwerte mit KI erfassen
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsAiRecipeModalOpen(true);
                  setAiRecipeError(null);
                }}
                className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Rezept einsprechen</span>
              </button>
            </div>
          </div>

          {/* Zutaten-Liste */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                  Zutaten im Rezept ({ingredients.length})
                </label>
                {ingredients.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIngredients([])}
                    className="text-[11px] text-rose-500 hover:text-rose-700 font-bold transition-colors"
                  >
                    (Leeren)
                  </button>
                )}
              </div>
              <span className="text-xs font-bold text-stone-600">
                Rohgewicht: {totalRawWeight} g
              </span>
            </div>

            {/* List of existing ingredients */}
            {ingredients.length > 0 ? (
              <div className="divide-y divide-stone-100 bg-stone-50/60 rounded-2xl p-2 border border-stone-100">
                {ingredients.map((item, idx) => (
                  <div key={idx} className="py-2 px-2 flex items-center justify-between text-xs">
                    <div className="flex-1 pr-2">
                      <span className="font-bold text-stone-800 block">{item.name}</span>
                      <span className="text-[10px] text-stone-400">
                        {item.amountGrams}g • {item.calories} kcal • P: {item.protein}g • K: {item.carbs}g • F: {item.fat}g
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveIngredient(idx)}
                      className="p-1 text-stone-300 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-3.5 text-center text-stone-400 text-xs bg-stone-50/50 rounded-2xl border border-dashed border-stone-200">
                Füge unten Zutaten hinzu (Öle, Mehl, Eier, Gemüse, Markenprodukte oder per Barcode).
              </div>
            )}

            {/* ADD INGREDIENT PANEL */}
            <div className="p-3.5 bg-stone-50/80 rounded-2xl border border-stone-200/90 space-y-3">
              
              {/* If an ingredient is currently chosen: show Portion Presets + Grams Input */}
              {selectedFood ? (
                <div className="p-3 bg-white rounded-2xl border-2 border-emerald-500 shadow-sm space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-stone-800 text-xs block">
                        {selectedFood.name}
                      </span>
                      <span className="text-[10px] text-stone-500">
                        {selectedFood.calories100g} kcal / 100g {selectedFood.brand ? `• ${selectedFood.brand}` : ''}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFood(null);
                        setIngredientQuery('');
                      }}
                      className="text-xs text-stone-400 hover:text-rose-600 font-bold p-1"
                      title="Abwählen"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Portion Presets (e.g. 1 Ei M, 1 EL Öl, 1 Dose Tomaten, etc.) */}
                  {ingredientPresets.length > 0 && (
                    <div>
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
                        Portions-Vorschlag (1-Tap):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {ingredientPresets.map((p) => {
                          const isCur = ingredientGrams === String(p.grams);
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => setIngredientGrams(String(p.grams))}
                              className={`py-1 px-2.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1 ${
                                isCur
                                  ? 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-2xs'
                                  : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-emerald-50/50'
                              }`}
                            >
                              <span>{p.icon || '🥗'}</span>
                              <span>{p.label}</span>
                              <span className="text-[10px] font-normal text-stone-400">({p.grams}g)</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Numerical Grams Input & Quantity Stepper */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const cur = parseFloat(ingredientGrams) || 0;
                        setIngredientGrams(String(Math.max(1, cur > 50 ? cur - 25 : cur > 10 ? cur - 10 : cur - 1)));
                      }}
                      className="w-8 h-8 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center font-bold"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>

                    <div className="flex-1 relative">
                      <input
                        type="number"
                        step="1"
                        min="1"
                        max="5000"
                        placeholder="Menge in g"
                        value={ingredientGrams}
                        onChange={(e) => setIngredientGrams(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddIngredient();
                          }
                        }}
                        autoFocus
                        className="w-full pl-3 pr-12 py-1.5 rounded-xl border border-stone-200 bg-stone-50 font-extrabold text-stone-800 text-sm text-center focus:border-emerald-500 focus:bg-white"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">
                        Gramm
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const cur = parseFloat(ingredientGrams) || 0;
                        setIngredientGrams(String(cur < 50 ? cur + 10 : cur + 25));
                      }}
                      className="w-8 h-8 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center font-bold"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAddIngredient()}
                      className="py-2 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs shadow-soft transition-all shrink-0 flex items-center gap-1"
                    >
                      <Check className="w-4 h-4" />
                      <span>Ins Rezept ({Math.round(selectedFood.calories100g * ((parseFloat(ingredientGrams) || 0) / 100))} kcal)</span>
                    </button>
                  </div>

                  {/* Standard Gram Steps */}
                  <div className="flex gap-1">
                    {[10, 20, 50, 100, 250, 500].map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setIngredientGrams(String(g))}
                        className={`flex-1 py-0.5 rounded-lg border text-[10px] font-bold transition-all ${
                          ingredientGrams === String(g)
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                            : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                        }`}
                      >
                        {g}g
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                /* INGREDIENT SEARCH & TABS */
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                      Zutat auswählen:
                    </span>
                    
                    {/* Navigation Pills */}
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => setActivePickerTab('search')}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                          activePickerTab === 'search'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-stone-200/70 text-stone-600 hover:bg-stone-200'
                        }`}
                        title="Durchsucht die Offline-Datenbank und Millionen Supermarkt-Marken"
                      >
                        🔍 Textsuche
                      </button>
                      <button
                        type="button"
                        onClick={() => setActivePickerTab('favorites')}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-0.5 ${
                          activePickerTab === 'favorites'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-stone-200/70 text-stone-600 hover:bg-stone-200'
                        }`}
                      >
                        <Star className="w-2.5 h-2.5" />
                        <span>Favoriten</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActivePickerTab('staples')}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                          activePickerTab === 'staples'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-stone-200/70 text-stone-600 hover:bg-stone-200'
                        }`}
                      >
                        🌾 Basics
                      </button>
                    </div>
                  </div>

                  {/* Search Transparency Note */}
                  <p className="text-[10px] text-stone-400 font-medium">
                    💡 Sucht blitzschnell in Offline-Basics & Supermarkt-Marken. <span className="text-emerald-700 font-bold">KI nur per Klick auf ✨</span>.
                  </p>

                  {/* Search Bar + Barcode Scanner + Voice */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Zutat oder Marke suchen (z. B. Rapsöl, Barilla, Tomaten, Eier)..."
                      value={ingredientQuery}
                      onChange={(e) => setIngredientQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (searchResults.length > 0) {
                            handleSelectFood(searchResults[0]);
                          } else {
                            handleAddIngredient();
                          }
                        }
                      }}
                      className="w-full pl-3 pr-20 py-2 rounded-xl border border-stone-200 text-xs font-medium focus:border-emerald-500 bg-white"
                    />
                    <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      {isSearching && (
                        <Loader2 className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
                      )}
                      <button
                        type="button"
                        onClick={() => setIsScannerOpen(true)}
                        className="p-1 rounded-lg text-stone-400 hover:text-emerald-700 hover:bg-emerald-50"
                        title="Barcode scannen"
                      >
                        <Barcode className="w-4 h-4" />
                      </button>
                      <VoiceInputButton
                        onTranscript={(text) => setIngredientQuery(text)}
                        currentValue={ingredientQuery}
                        size="xs"
                        title="Zutat per Sprache suchen"
                      />
                    </div>
                  </div>

                  {/* AI Quick Button when query is entered */}
                  {ingredientQuery.trim().length >= 2 && !selectedFood && (
                    <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 p-2.5 rounded-2xl border border-emerald-200/80 flex items-center justify-between gap-2 shadow-2xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-stone-800 block truncate">
                            Nicht genau gefunden?
                          </span>
                          <span className="text-[10px] text-stone-500 block truncate">
                            Gemini KI ermittelt die exakten Nährwerte
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleAiLookupIngredient}
                        disabled={isAiSearching}
                        className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold transition-all flex items-center gap-1 shrink-0 shadow-xs disabled:opacity-50"
                      >
                        {isAiSearching ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Recherchiere...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Mit KI finden</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* AI Error Alert */}
                  {aiError && (
                    <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl text-xs flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span className="truncate">{aiError}</span>
                      </div>
                      {!geminiApiKey && onOpenSettings && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenSettings();
                          }}
                          className="font-bold underline text-amber-950 ml-2 shrink-0"
                        >
                          Key eintragen
                        </button>
                      )}
                    </div>
                  )}

                  {/* 0 Results & AI Fallback */}
                  {searchResults.length === 0 && !isSearching && ingredientQuery.trim().length >= 2 && !selectedFood && (
                    <div className="p-3 bg-amber-50/70 rounded-2xl border border-amber-200/80 text-center space-y-2">
                      <p className="text-xs text-amber-950 font-medium">
                        Kein Standard-Lebensmittel für „{ingredientQuery}“ gefunden.
                      </p>
                      <button
                        type="button"
                        onClick={handleAiLookupIngredient}
                        disabled={isAiSearching}
                        className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs"
                      >
                        {isAiSearching ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Gemini KI ermittelt Nährwerte...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            <span>„{ingredientQuery}“ jetzt mit KI recherchieren</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* 1. SEARCH RESULTS LIST */}
                  {searchResults.length > 0 && !selectedFood && (
                    <div className="bg-white border border-stone-200 rounded-2xl shadow-soft-lg divide-y divide-stone-100 max-h-56 overflow-y-auto">
                      {searchResults.map((f) => (
                        <div
                          key={f.id}
                          onClick={() => handleSelectFood(f)}
                          className="p-2.5 text-xs hover:bg-emerald-50 cursor-pointer flex justify-between items-center transition-colors group"
                        >
                          <div className="min-w-0 pr-2">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-stone-800 truncate">{f.name}</span>
                              {f.source === 'supermarket' && (
                                <span className="text-[8px] bg-emerald-50 text-emerald-700 font-bold px-1 rounded shrink-0">
                                  Marke
                                </span>
                              )}
                            </div>
                            {f.brand && <span className="text-[10px] text-stone-400 block truncate">{f.brand}</span>}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-emerald-700 font-extrabold text-xs">
                              {f.calories100g} kcal <span className="text-[10px] font-normal text-stone-400">/100g</span>
                            </span>
                            <span className="py-1 px-2 rounded-lg bg-emerald-100/80 text-emerald-800 font-bold text-[10px] group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                              Menge wählen &rarr;
                            </span>
                          </div>
                        </div>
                      ))}

                      {/* Free custom ingredient fallback */}
                      <div
                        onClick={() => handleAddIngredient()}
                        className="p-2.5 text-xs bg-stone-50 hover:bg-emerald-50 text-emerald-800 font-bold cursor-pointer flex items-center gap-1.5 border-t border-stone-200"
                      >
                        <Plus className="w-3.5 h-3.5 text-emerald-600" />
                        <span>„{ingredientQuery}“ als freie Zutat übernehmen</span>
                      </div>
                    </div>
                  )}

                  {/* 2. FAVORITES TAB */}
                  {activePickerTab === 'favorites' && searchResults.length === 0 && (
                    <div className="bg-white rounded-xl p-2 border border-stone-200/80 space-y-1.5 max-h-48 overflow-y-auto">
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block px-1">
                        Häufig genutzte Lebensmittel (1-Tap):
                      </span>
                      {favoriteItems.length > 0 ? (
                        <div className="divide-y divide-stone-100">
                          {favoriteItems.map((fav) => (
                            <div
                              key={fav.id || fav.name}
                              onClick={() => handleSelectFavorite(fav)}
                              className="py-1.5 px-2 hover:bg-emerald-50 rounded-lg cursor-pointer flex justify-between items-center text-xs transition-colors"
                            >
                              <span className="font-semibold text-stone-800 truncate">{fav.name}</span>
                              <span className="text-emerald-700 font-bold text-[11px] shrink-0 ml-2">
                                {fav.calories} kcal <span className="text-stone-400 font-normal">/100g</span>
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-stone-400 p-2 text-center">
                          Noch keine Favoriten erfasst.
                        </p>
                      )}
                    </div>
                  )}

                  {/* 3. STAPLES TAB / DEFAULT CHIPS */}
                  {(activePickerTab === 'staples' || (activePickerTab === 'search' && searchResults.length === 0)) && (
                    <div>
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
                        Beliebte Basics für {category === 'bread' ? 'Brot & Backen' : category === 'drink' ? 'Getränke & Shakes' : category === 'salad' ? 'Salate' : category === 'breakfast' ? 'Frühstück' : category === 'snack' ? 'Snacks' : 'Mahlzeiten'} (1-Tap):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {(category === 'bread'
                          ? BREAD_STAPLES
                          : category === 'drink'
                          ? DRINK_STAPLES
                          : category === 'breakfast'
                          ? BREAKFAST_STAPLES
                          : category === 'salad'
                          ? SALAD_STAPLES
                          : category === 'snack'
                          ? SNACK_STAPLES
                          : MEAL_STAPLES
                        ).map((s) => (
                          <button
                            key={s.name}
                            type="button"
                            onClick={() => handleSelectStaple(s)}
                            className="px-2.5 py-1 bg-white hover:bg-emerald-50 active:scale-95 border border-stone-200 hover:border-emerald-300 text-stone-700 hover:text-emerald-900 rounded-xl text-xs font-medium transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
                          >
                            <span>{s.icon}</span>
                            <span>{s.name.split(' ')[0]}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Schritt-für-Schritt Zubereitung (Instructions) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Schritt-für-Schritt Zubereitung (optional)
              </label>
              <VoiceInputButton
                onTranscript={(text) => {
                  setRecipeInstructions((prev) => (prev ? prev + '\n' + text : text));
                }}
                currentValue={recipeInstructions}
                size="xs"
                title="Schritte nacheinander einsprechen"
              />
            </div>
            <textarea
              rows={4}
              value={recipeInstructions}
              onChange={(e) => setRecipeInstructions(e.target.value)}
              placeholder={'1. Ofen auf 200°C Ober-/Unterhitze vorheizen.\n2. Zutaten waschen und mundgerecht schneiden.\n3. Alles in die Form geben und 25 Min. backen.'}
              className="w-full p-3 rounded-2xl border border-stone-200 bg-white font-medium text-stone-800 text-xs focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 leading-relaxed resize-none"
            />
            <p className="text-[11px] text-stone-400">
              💡 Tipp: Jede Zeile wird im Rezept als eigener Schritt zum interaktiven Abhaken beim Kochen angezeigt.
            </p>
          </div>

          {/* BACKGEWICHT / KOCHVERLUST & PORTIONS-KALKULATION */}
          <div className={`p-4 rounded-2xl space-y-3 border ${
            category === 'drink'
              ? 'bg-blue-50/70 border-blue-200/80 text-blue-900'
              : category === 'bread'
              ? 'bg-amber-50/70 border-amber-200/80 text-amber-900'
              : 'bg-emerald-50/70 border-emerald-200/80 text-emerald-900'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider">
                {category === 'drink' ? '🥤 Getränke-Gesamtmenge' : category === 'bread' ? '🍞 Gebackenes Brotgewicht' : '🍲 Gekochtes Gesamtgewicht'}
              </span>
              <span className="text-xs font-black">
                {effectiveBakedWeight} {category === 'drink' ? 'ml / g' : 'g fertig'}
              </span>
            </div>

            {category === 'bread' ? (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[10px] font-bold block mb-0.5 opacity-70">
                    Gebackenes Gewicht (g)
                  </label>
                  <input
                    type="number"
                    placeholder={`ca. ${effectiveBakedWeight}g`}
                    value={customBakedWeight}
                    onChange={(e) => setCustomBakedWeight(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-stone-200 bg-white font-bold text-stone-800 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold block mb-0.5 opacity-70">
                    Gewicht pro Scheibe (g)
                  </label>
                  <input
                    type="number"
                    value={sliceWeight}
                    onChange={(e) => setSliceWeight(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-stone-200 bg-white font-bold text-stone-800 text-xs"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-xs">
                <div>
                  <label className="text-[10px] font-bold block mb-0.5 opacity-70">
                    {category === 'drink' ? 'Fertige Gesamtmenge (ml / g)' : 'Fertiges Gewicht des gesamten Gerichts (g)'}
                  </label>
                  <input
                    type="number"
                    placeholder={`${effectiveBakedWeight}g`}
                    value={customBakedWeight}
                    onChange={(e) => setCustomBakedWeight(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-stone-200 bg-white font-bold text-stone-800 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold block mb-1 opacity-70">
                    Rezept-Basis & Portionierung:
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: '1/1 Ganzes Gericht', count: 1, grams: effectiveBakedWeight },
                      { label: '2 Portionen (1/2)', count: 2, grams: Math.round(effectiveBakedWeight / 2) },
                      { label: '3 Portionen (1/3)', count: 3, grams: Math.round(effectiveBakedWeight / 3) },
                      { label: '4 Portionen (1/4)', count: 4, grams: Math.round(effectiveBakedWeight / 4) },
                    ].map((p) => {
                      const isSel = (parseInt(sliceWeight, 10) || effectiveBakedWeight) === p.grams;
                      return (
                        <button
                          key={p.label}
                          type="button"
                          onClick={() => setSliceWeight(String(p.grams))}
                          className={`py-1 px-2.5 rounded-xl text-[11px] font-bold transition-all border cursor-pointer ${
                            isSel
                              ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                              : 'bg-white hover:bg-stone-50 text-stone-700 border-stone-200'
                          }`}
                        >
                          <span>{p.label}</span>
                          <span className="opacity-80 text-[10px] ml-1">({p.grams}{category === 'drink' ? 'ml' : 'g'})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Live Nutrition Summary */}
            <div className="p-3 bg-white/90 rounded-xl border border-stone-200/70 flex items-center justify-between gap-2 shadow-2xs">
              <div>
                <span className="text-[10px] font-bold text-stone-400 block uppercase">
                  {category === 'bread'
                    ? `1 Scheibe Brot (${numSliceWeight}g)`
                    : category === 'drink'
                    ? (numSliceWeight >= effectiveBakedWeight ? `Ganzes Getränk (${numSliceWeight}ml)` : `1 Glas (${numSliceWeight}ml)`)
                    : (numSliceWeight >= effectiveBakedWeight ? `Ganzes Gericht (${numSliceWeight}g)` : `1 Portion (${numSliceWeight}g)`)}
                </span>
                <span className="text-xl font-black text-stone-900">
                  {caloriesPerSlice} <span className="text-xs font-normal text-stone-400">kcal</span>
                </span>
                <span className="text-[10px] text-stone-500 block">
                  P: {proteinPerSlice}g • K: {carbsPerSlice}g • F: {fatPerSlice}g
                </span>
              </div>

              <div className="text-right text-[11px] text-stone-500 space-y-0.5">
                <div>Pro 100g: <span className="font-bold text-stone-800">{caloriesPer100g} kcal</span></div>
                <div className="text-[10px] text-stone-400">
                  P: {proteinPer100g}g • K: {carbsPer100g}g • F: {fatPer100g}g
                </div>
              </div>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={ingredients.length === 0 || !name.trim()}
            className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm shadow-soft transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{editingRecipeId ? '💾 Änderungen am Rezept speichern' : 'Rezept dauerhaft speichern'}</span>
            <span>({caloriesPerSlice} kcal / {category === 'bread' ? 'Scheibe' : category === 'drink' ? 'Glas' : 'Portion'})</span>
          </button>
        </form>
        )}

        {/* TAB 2: LIST & SHARE ALL SAVED RECIPES (AUFKLAPPBARE RUBRIKEN & KOMPAKTE VORSCHAU) */}
        {activeTab === 'list' && (
          <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 flex-1">
            {/* Search & Filter Bar */}
            <div className="space-y-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Rezept oder Zutat suchen (z. B. Dinkelbrot, Smoothie, Auflauf)..."
                  value={recipeSearchQuery}
                  onChange={(e) => setRecipeSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 rounded-2xl border border-stone-200 bg-stone-50/60 focus:bg-white focus:border-emerald-500 font-medium text-xs text-stone-800 transition-all"
                />
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                {recipeSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setRecipeSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 font-bold text-xs cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Category Filter Pills */}
              <div className="flex gap-1.5 overflow-x-auto pb-0.5 no-scrollbar text-xs">
                <button
                  type="button"
                  onClick={() => setListCategoryFilter('all')}
                  className={`py-1 px-2.5 rounded-xl font-bold transition-all shrink-0 text-[11px] cursor-pointer ${
                    listCategoryFilter === 'all'
                      ? 'bg-stone-800 text-white shadow-2xs'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  Alle ({customRecipes.length})
                </button>
                <button
                  type="button"
                  onClick={() => setListCategoryFilter('favorites')}
                  className={`py-1 px-2.5 rounded-xl font-bold transition-all shrink-0 text-[11px] flex items-center gap-1 cursor-pointer ${
                    listCategoryFilter === 'favorites'
                      ? 'bg-amber-500 text-white shadow-2xs'
                      : 'bg-amber-50 text-amber-900 border border-amber-200/60 hover:bg-amber-100'
                  }`}
                >
                  <span>⭐</span>
                  <span>Favoriten ({customRecipes.filter((r) => r.isFavorite).length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setListCategoryFilter('bread')}
                  className={`py-1 px-2.5 rounded-xl font-bold transition-all shrink-0 text-[11px] flex items-center gap-1 cursor-pointer ${
                    listCategoryFilter === 'bread'
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  <span>🍞</span>
                  <span>Brot ({customRecipes.filter((r) => inferRecipeCategory(r) === 'bread').length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setListCategoryFilter('breakfast')}
                  className={`py-1 px-2.5 rounded-xl font-bold transition-all shrink-0 text-[11px] flex items-center gap-1 cursor-pointer ${
                    listCategoryFilter === 'breakfast'
                      ? 'bg-orange-600 text-white shadow-2xs'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  <span>🥣</span>
                  <span>Frühstück ({customRecipes.filter((r) => inferRecipeCategory(r) === 'breakfast').length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setListCategoryFilter('meal')}
                  className={`py-1 px-2.5 rounded-xl font-bold transition-all shrink-0 text-[11px] flex items-center gap-1 cursor-pointer ${
                    listCategoryFilter === 'meal'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  <span>🍲</span>
                  <span>Hauptgerichte ({customRecipes.filter((r) => inferRecipeCategory(r) === 'meal').length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setListCategoryFilter('salad')}
                  className={`py-1 px-2.5 rounded-xl font-bold transition-all shrink-0 text-[11px] flex items-center gap-1 cursor-pointer ${
                    listCategoryFilter === 'salad'
                      ? 'bg-lime-600 text-white shadow-2xs'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  <span>🥗</span>
                  <span>Salate ({customRecipes.filter((r) => inferRecipeCategory(r) === 'salad').length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setListCategoryFilter('drink')}
                  className={`py-1 px-2.5 rounded-xl font-bold transition-all shrink-0 text-[11px] flex items-center gap-1 cursor-pointer ${
                    listCategoryFilter === 'drink'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  <span>🥤</span>
                  <span>Getränke ({customRecipes.filter((r) => inferRecipeCategory(r) === 'drink').length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setListCategoryFilter('snack')}
                  className={`py-1 px-2.5 rounded-xl font-bold transition-all shrink-0 text-[11px] flex items-center gap-1 cursor-pointer ${
                    listCategoryFilter === 'snack'
                      ? 'bg-pink-600 text-white shadow-2xs'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  <span>🍫</span>
                  <span>Snacks ({customRecipes.filter((r) => inferRecipeCategory(r) === 'snack').length})</span>
                </button>
              </div>
            </div>

            {/* Rubriken / Categories */}
            {customRecipes.length > 0 ? (
              <div className="space-y-3">
                {[
                  {
                    key: 'bread' as const,
                    title: 'Brot, Brötchen & Backen',
                    icon: '🍞',
                    match: (r: CustomRecipe) => inferRecipeCategory(r) === 'bread',
                    bgHeader: 'bg-amber-50/80',
                    borderHeader: 'border-amber-200/80',
                    textColor: 'text-amber-950',
                    badgeColor: 'bg-amber-100 text-amber-900',
                  },
                  {
                    key: 'breakfast' as const,
                    title: 'Frühstück, Müsli & Bowls',
                    icon: '🥣',
                    match: (r: CustomRecipe) => inferRecipeCategory(r) === 'breakfast',
                    bgHeader: 'bg-orange-50/80',
                    borderHeader: 'border-orange-200/80',
                    textColor: 'text-orange-950',
                    badgeColor: 'bg-orange-100 text-orange-900',
                  },
                  {
                    key: 'meal' as const,
                    title: 'Hauptgerichte & Mahlzeiten',
                    icon: '🍲',
                    match: (r: CustomRecipe) => inferRecipeCategory(r) === 'meal',
                    bgHeader: 'bg-emerald-50/80',
                    borderHeader: 'border-emerald-200/80',
                    textColor: 'text-emerald-950',
                    badgeColor: 'bg-emerald-100 text-emerald-900',
                  },
                  {
                    key: 'salad' as const,
                    title: 'Salate & Frische Beilagen',
                    icon: '🥗',
                    match: (r: CustomRecipe) => inferRecipeCategory(r) === 'salad',
                    bgHeader: 'bg-lime-50/80',
                    borderHeader: 'border-lime-200/80',
                    textColor: 'text-lime-950',
                    badgeColor: 'bg-lime-100 text-lime-900',
                  },
                  {
                    key: 'drink' as const,
                    title: 'Getränke, Shakes & Smoothies',
                    icon: '🥤',
                    match: (r: CustomRecipe) => inferRecipeCategory(r) === 'drink',
                    bgHeader: 'bg-blue-50/80',
                    borderHeader: 'border-blue-200/80',
                    textColor: 'text-blue-950',
                    badgeColor: 'bg-blue-100 text-blue-900',
                  },
                  {
                    key: 'snack' as const,
                    title: 'Snacks, Riegel & Süßes',
                    icon: '🍫',
                    match: (r: CustomRecipe) => inferRecipeCategory(r) === 'snack',
                    bgHeader: 'bg-pink-50/80',
                    borderHeader: 'border-pink-200/80',
                    textColor: 'text-pink-950',
                    badgeColor: 'bg-pink-100 text-pink-900',
                  },
                ].map((rubrik) => {
                  if (listCategoryFilter !== 'all' && listCategoryFilter !== 'favorites' && listCategoryFilter !== rubrik.key) {
                    return null;
                  }

                  const query = recipeSearchQuery.trim().toLowerCase();
                  const rubrikRecipes = customRecipes.filter((r) => {
                    if (!rubrik.match(r)) return false;
                    if (listCategoryFilter === 'favorites' && !r.isFavorite) return false;
                    if (!query) return true;
                    return (
                      r.name.toLowerCase().includes(query) ||
                      r.ingredients?.some((ing) => ing.name.toLowerCase().includes(query))
                    );
                  });

                  if (rubrikRecipes.length === 0) {
                    if (listCategoryFilter === rubrik.key) {
                      return (
                        <div key={rubrik.key} className="py-8 text-center text-stone-400 text-xs bg-stone-50 rounded-2xl border border-stone-200/70">
                          Keine Rezepte in dieser Rubrik gefunden.
                        </div>
                      );
                    }
                    return null;
                  }

                  const isOpen = openCategories[rubrik.key] !== false;

                  return (
                    <div
                      key={rubrik.key}
                      className="border border-stone-200/90 rounded-2xl overflow-hidden bg-white shadow-2xs transition-all"
                    >
                      {/* Rubrik Accordion Header */}
                      <button
                        type="button"
                        onClick={() => toggleCategory(rubrik.key)}
                        className={`w-full p-3 px-4 flex items-center justify-between cursor-pointer select-none transition-colors border-b ${
                          isOpen ? 'border-stone-100' : 'border-transparent'
                        } ${rubrik.bgHeader}`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl">{rubrik.icon}</span>
                          <span className={`font-bold text-xs ${rubrik.textColor}`}>
                            {rubrik.title}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border border-stone-200/60 ${rubrik.badgeColor}`}>
                            {rubrikRecipes.length}
                          </span>
                        </div>
                        {isOpen ? (
                          <ChevronUp className="w-4 h-4 text-stone-500" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-stone-500" />
                        )}
                      </button>

                      {/* Rubrik Recipes List */}
                      {isOpen && (
                        <div className="divide-y divide-stone-100 p-2 space-y-2">
                          {rubrikRecipes.map((r) => {
                            const isExpanded = expandedRecipeId === r.id;
                            const effectiveCategory = inferRecipeCategory(r);
                            const isBread = effectiveCategory === 'bread';
                            const isDrink = effectiveCategory === 'drink';
                            const isCoffee = isDrink && (r.name.toLowerCase().includes('cortado') || r.name.toLowerCase().includes('kaffee') || r.name.toLowerCase().includes('espresso'));
                            const totalDishWeight = r.cookedWeight || r.totalRawWeight;
                            const isWholeDish = !r.servingWeightGrams || r.servingWeightGrams >= totalDishWeight;
                            const basePortionGrams = isBread ? (r.servingWeightGrams || 50) : (isWholeDish ? totalDishWeight : (r.servingWeightGrams || totalDishWeight));
                            const servLabel = isBread ? (r.servingName || '1 Scheibe') : (isWholeDish ? 'Ganzes Gericht' : (r.servingName || '1 Portion'));
                            const previewKcal = Math.round(r.calories100g * (basePortionGrams / 100));

                            if (!isExpanded) {
                              // KOMPAKTE VORSCHAU-ZEILE
                              return (
                                <div
                                  key={r.id}
                                  onClick={() => setExpandedRecipeId(r.id || null)}
                                  className="p-2.5 sm:p-3 bg-white hover:bg-stone-50/90 rounded-2xl border border-stone-200/70 transition-all flex items-center justify-between gap-3 cursor-pointer shadow-2xs group"
                                  title="Tippen, um Rezeptdetails, Zutaten und Portionierer zu sehen"
                                >
                                  <div className="flex items-center gap-3 min-w-0">
                                    {r.imageUrl ? (
                                      <img
                                        src={r.imageUrl}
                                        alt={r.name}
                                        className="w-12 h-12 rounded-xl object-cover border border-stone-200 shrink-0 shadow-2xs"
                                      />
                                    ) : (
                                      <div
                                        className={`w-11 h-11 rounded-xl border flex items-center justify-center text-xl shrink-0 ${
                                          isDrink
                                            ? 'bg-blue-500/10 text-blue-700 border-blue-200/50'
                                            : isBread
                                            ? 'bg-amber-500/10 text-amber-700 border-amber-200/50'
                                            : 'bg-emerald-500/10 text-emerald-700 border-emerald-200/50'
                                        }`}
                                      >
                                        {isCoffee ? '☕' : isDrink ? '🥤' : isBread ? '🍞' : effectiveCategory === 'salad' ? '🥗' : effectiveCategory === 'breakfast' ? '🥣' : effectiveCategory === 'snack' ? '🍫' : '🍲'}
                                      </div>
                                    )}

                                    <div className="min-w-0">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <h4 className="font-extrabold text-stone-900 text-xs sm:text-sm truncate">
                                          {r.name}
                                        </h4>
                                        {r.prepTimeMinutes && (
                                          <span className="text-[10px] text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded-md flex items-center gap-0.5 shrink-0">
                                            <Clock className="w-2.5 h-2.5 text-stone-400" />
                                            {r.prepTimeMinutes} Min.
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2 text-[11px] text-stone-500 truncate mt-0.5">
                                        <span className={`font-bold ${isDrink ? 'text-blue-800' : isBread ? 'text-amber-800' : 'text-emerald-800'}`}>
                                          {servLabel} ({basePortionGrams}{isDrink ? 'ml' : 'g'}): <strong className="text-stone-900 font-black">{previewKcal} kcal</strong>
                                        </span>
                                        <span className="text-[10px] text-stone-400 hidden sm:inline">
                                          P: {Math.round((r.protein100g || 0) * (basePortionGrams / 100) * 10) / 10}g • K: {Math.round((r.carbs100g || 0) * (basePortionGrams / 100) * 10) / 10}g
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <button
                                      type="button"
                                      onClick={(e) => handleToggleFavorite(e, r.id)}
                                      className="p-1.5 text-stone-300 hover:text-amber-500 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
                                      title={r.isFavorite ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
                                    >
                                      <Star className={`w-4 h-4 ${r.isFavorite ? 'fill-amber-400 text-amber-500' : ''}`} />
                                    </button>

                                    <button
                                      type="button"
                                      onClick={(e) => handleOpenDiaryLog(e, r)}
                                      className="p-1.5 px-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200/80 font-bold text-[10px] transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                                      title="Direkt ins Ernährungstagebuch eintragen"
                                    >
                                      <Utensils className="w-3 h-3 text-emerald-700" />
                                      <span className="hidden sm:inline">Tagebuch</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => setExpandedRecipeId(r.id || null)}
                                      className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 group-hover:bg-stone-100 transition-colors"
                                      title="Details öffnen"
                                    >
                                      <ChevronDown className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              );
                            }

                            // AUFGEKLAPPTE DETAILANSICHT (FOTO, SKALIERER, ZUTATEN-CHECKBOXEN, ZUBEREITUNG, PORTIONIERUNG)
                            return (
                              <div
                                key={r.id}
                                className="p-4 bg-white border-2 border-emerald-500/80 rounded-3xl transition-all shadow-md space-y-3.5 animate-in fade-in"
                              >
                                {/* Hero Photo (if available) */}
                                {r.imageUrl && (
                                  <div className="relative rounded-2xl overflow-hidden h-44 w-full bg-stone-100 border border-stone-100 shadow-2xs">
                                    <img
                                      src={r.imageUrl}
                                      alt={r.name}
                                      className="w-full h-full object-cover"
                                    />
                                    {r.prepTimeMinutes && (
                                      <span className="absolute bottom-2.5 left-2.5 bg-stone-900/75 backdrop-blur-xs text-white text-xs font-bold px-2.5 py-1 rounded-xl flex items-center gap-1 shadow-sm">
                                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                                        {r.prepTimeMinutes} Min. Zubereitungszeit
                                      </span>
                                    )}
                                  </div>
                                )}

                                {/* Header: Icon, Name (mit Bearbeiten), Löschen */}
                                <div className="flex items-start justify-between gap-2 border-b border-stone-100 pb-3">
                                  <div className="flex items-center gap-3 min-w-0">
                                    {!r.imageUrl && (
                                      <div
                                        className={`w-12 h-12 rounded-2xl border flex items-center justify-center text-2xl shrink-0 ${
                                          isDrink
                                            ? 'bg-blue-500/10 text-blue-700 border-blue-200/50'
                                            : isBread
                                            ? 'bg-amber-500/10 text-amber-700 border-amber-200/50'
                                            : 'bg-emerald-500/10 text-emerald-700 border-emerald-200/50'
                                        }`}
                                      >
                                        {isCoffee ? '☕' : isDrink ? '🥤' : isBread ? '🍞' : effectiveCategory === 'salad' ? '🥗' : effectiveCategory === 'breakfast' ? '🥣' : effectiveCategory === 'snack' ? '🍫' : '🍲'}
                                      </div>
                                    )}
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <h4 className="font-black text-stone-900 text-sm sm:text-base">
                                          {r.name}
                                        </h4>
                                        <button
                                          type="button"
                                          onClick={(e) => handleToggleFavorite(e, r.id)}
                                          className="p-1 text-stone-300 hover:text-amber-500 transition-colors"
                                          title={r.isFavorite ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
                                        >
                                          <Star className={`w-4 h-4 ${r.isFavorite ? 'fill-amber-400 text-amber-500' : ''}`} />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleStartEdit(r)}
                                          className="text-[10px] font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                                          title="Rezept bearbeiten"
                                        >
                                          <Edit3 className="w-3 h-3 text-amber-700" />
                                          <span>Bearbeiten</span>
                                        </button>
                                      </div>
                                      <span className="text-[11px] text-stone-400 block mt-0.5">
                                        {isDrink ? 'Getränk' : isBread ? 'Laib' : 'Gericht'} fertig: {r.cookedWeight || r.totalRawWeight}{isDrink ? 'ml' : 'g'} (Rohgewicht: {r.totalRawWeight}{isDrink ? 'ml' : 'g'})
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={(e) => handleDeleteRecipe(e, r.id)}
                                      className="p-1.5 rounded-xl text-stone-300 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                      title="Rezept löschen"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>

                                {/* 1-Tap Rubrik / Kategorie Zuordnung */}
                                <div className="p-2.5 bg-stone-50/90 rounded-2xl border border-stone-200/80 space-y-1.5">
                                  <div className="flex items-center justify-between text-[11px]">
                                    <span className="font-bold text-stone-600 flex items-center gap-1">
                                      <span>🏷️</span>
                                      <span>Rubrik / Kategorie zuordnen:</span>
                                    </span>
                                    {categoryChangeSuccess && categoryChangeSuccess.id === r.id && (
                                      <span className="text-emerald-800 font-extrabold bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full text-[10px] animate-in fade-in shadow-2xs">
                                        ✓ Zu „{categoryChangeSuccess.cat}“ verschoben!
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
                                    {[
                                      { key: 'bread' as const, label: 'Brot & Backen', icon: '🍞' },
                                      { key: 'breakfast' as const, label: 'Frühstück', icon: '🥣' },
                                      { key: 'meal' as const, label: 'Hauptgericht', icon: '🍲' },
                                      { key: 'salad' as const, label: 'Salat', icon: '🥗' },
                                      { key: 'drink' as const, label: 'Getränke', icon: '🥤' },
                                      { key: 'snack' as const, label: 'Snacks', icon: '🍫' },
                                    ].map((catItem) => {
                                      const isCurrent = effectiveCategory === catItem.key;
                                      return (
                                        <button
                                          key={catItem.key}
                                          type="button"
                                          onClick={(e) => handleQuickChangeCategory(e, r, catItem.key)}
                                          className={`py-1 px-2.5 rounded-xl text-[11px] font-bold shrink-0 transition-all flex items-center gap-1 cursor-pointer border ${
                                            isCurrent
                                              ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                                              : 'bg-white hover:bg-stone-100 text-stone-700 border-stone-200/90'
                                          }`}
                                          title={`Rezept zu "${catItem.label}" verschieben`}
                                        >
                                          <span>{catItem.icon}</span>
                                          <span>{catItem.label}</span>
                                          {isCurrent && <span className="text-[9px] ml-0.5 font-bold opacity-90">• aktiv</span>}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* Interactive Portion Scaler & Live Macros */}
                                {(() => {
                                  const currentRatio = r.id ? getPortionRatio(r.id) : 1;
                                  const currentCustomGrams = r.id ? portionCustomGrams[r.id] || '' : '';
                                  const activeGrams = currentCustomGrams && parseFloat(currentCustomGrams) > 0
                                    ? Math.round(parseFloat(currentCustomGrams))
                                    : Math.round(totalDishWeight * currentRatio);
                                  const ratioForCalc = activeGrams / 100;
                                  const currentKcal = Math.round(r.calories100g * ratioForCalc);
                                  const currentProt = Math.round((r.protein100g || 0) * ratioForCalc * 10) / 10;
                                  const currentCarbs = Math.round((r.carbs100g || 0) * ratioForCalc * 10) / 10;
                                  const currentFat = Math.round((r.fat100g || 0) * ratioForCalc * 10) / 10;
                                  const ratioForIngredients = totalDishWeight > 0 ? activeGrams / totalDishWeight : 1;

                                  let activePortionTitle = 'Ganzes Gericht (1/1)';
                                  if (isBread) {
                                    const sliceG = r.servingWeightGrams || 50;
                                    if (Math.abs(currentRatio - 1) < 0.02) activePortionTitle = `Ganzer Laib (${totalDishWeight}g)`;
                                    else if (Math.abs(currentRatio - 0.5) < 0.02) activePortionTitle = `1/2 Laib (${activeGrams}g)`;
                                    else {
                                      const sCount = Math.max(1, Math.round(activeGrams / sliceG));
                                      activePortionTitle = sCount === 1 ? `1 Scheibe (${activeGrams}g)` : `${sCount} Scheiben (${activeGrams}g)`;
                                    }
                                  } else {
                                    if (Math.abs(currentRatio - 1) < 0.02) activePortionTitle = `Ganzes Gericht (100% • ${totalDishWeight}${isDrink ? 'ml' : 'g'})`;
                                    else if (Math.abs(currentRatio - 0.5) < 0.02) activePortionTitle = `1/2 Gericht (50% • ${activeGrams}${isDrink ? 'ml' : 'g'})`;
                                    else if (Math.abs(currentRatio - 1 / 3) < 0.02) activePortionTitle = `1/3 Gericht (33% • ${activeGrams}${isDrink ? 'ml' : 'g'})`;
                                    else if (Math.abs(currentRatio - 0.25) < 0.02) activePortionTitle = `1/4 Gericht (25% • ${activeGrams}${isDrink ? 'ml' : 'g'})`;
                                    else if (Math.abs(currentRatio - 1 / 6) < 0.02) activePortionTitle = `1/6 Gericht (17% • ${activeGrams}${isDrink ? 'ml' : 'g'})`;
                                    else if (currentRatio > 1) activePortionTitle = `${currentRatio}x Gesamtrezept (${activeGrams}${isDrink ? 'ml' : 'g'})`;
                                    else activePortionTitle = `Portion (${activeGrams}${isDrink ? 'ml' : 'g'})`;
                                  }

                                  return (
                                    <>
                                      {/* Interactive Portion Scaler (Teiler & Portionen) */}
                                      {isBread ? (
                                        <div className="p-3 bg-stone-50/90 rounded-2xl border border-stone-200/80 space-y-2">
                                          <div className="flex items-center justify-between text-xs">
                                            <span className="font-bold text-stone-800">
                                              Brot portionieren:
                                            </span>
                                            <span className="text-[11px] text-stone-400">
                                              (Laib gesamt: <strong className="text-stone-700 font-extrabold">{totalDishWeight}g</strong>)
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                                            {(() => {
                                              const sliceG = r.servingWeightGrams || 50;
                                              return [
                                                { label: '1 Scheibe', ratio: sliceG / totalDishWeight, grams: sliceG },
                                                { label: '2 Scheiben', ratio: (sliceG * 2) / totalDishWeight, grams: sliceG * 2 },
                                                { label: '3 Scheiben', ratio: (sliceG * 3) / totalDishWeight, grams: sliceG * 3 },
                                                { label: '1/4 Laib', ratio: 0.25, grams: Math.round(totalDishWeight / 4) },
                                                { label: '1/2 Laib', ratio: 0.5, grams: Math.round(totalDishWeight / 2) },
                                                { label: 'Ganzer Laib', ratio: 1, grams: totalDishWeight },
                                              ].map((bItem) => {
                                                const isSel = !currentCustomGrams && Math.abs(currentRatio - bItem.ratio) < 0.02;
                                                return (
                                                  <button
                                                    key={bItem.label}
                                                    type="button"
                                                    onClick={() => r.id && setPortionRatio(r.id, bItem.ratio)}
                                                    className={`py-1.5 px-2.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer border ${
                                                      isSel
                                                        ? 'bg-amber-600 text-white border-amber-700 shadow-2xs'
                                                        : 'bg-white hover:bg-stone-100 text-stone-700 border-stone-200/90'
                                                    }`}
                                                  >
                                                    <span>{bItem.label}</span>
                                                    <span className="text-[10px] opacity-80 ml-1">({bItem.grams}g)</span>
                                                  </button>
                                                );
                                              });
                                            })()}
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="p-3 bg-stone-50/90 rounded-2xl border border-stone-200/80 space-y-2.5">
                                          <div className="flex items-center justify-between gap-2 flex-wrap">
                                            <div className="flex items-center gap-1.5">
                                              <span className="text-xs font-bold text-stone-800">
                                                Portionierung wählen:
                                              </span>
                                              <span className="text-[11px] text-stone-400">
                                                (Gesamtmenge: <strong className="text-stone-700 font-extrabold">{totalDishWeight}{isDrink ? 'ml' : 'g'}</strong>)
                                              </span>
                                            </div>

                                            {/* Cooking Multiplier (2x, 3x) */}
                                            <div className="flex items-center gap-1 text-[11px]">
                                              <span className="text-[10px] text-stone-400 mr-1 hidden sm:inline">Vorkochen:</span>
                                              {[1, 2, 3].map((mult) => {
                                                const isSel = Math.abs(currentRatio - mult) < 0.02 && !currentCustomGrams;
                                                return (
                                                  <button
                                                    key={mult}
                                                    type="button"
                                                    onClick={() => r.id && setPortionRatio(r.id, mult)}
                                                    className={`px-2 py-0.5 rounded-lg font-bold border transition-all cursor-pointer ${
                                                      isSel
                                                        ? 'bg-amber-500 text-white border-amber-600 shadow-2xs'
                                                        : 'bg-white hover:bg-stone-100 text-stone-600 border-stone-200'
                                                    }`}
                                                    title={`${mult}x Gesamt-Rezept zubereiten`}
                                                  >
                                                    {mult}x
                                                  </button>
                                                );
                                              })}
                                            </div>
                                          </div>

                                          {/* Fraction Chips */}
                                          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                                            {[
                                              { label: '1/1 Ganz', fraction: 1, grams: totalDishWeight },
                                              { label: '1/2 Halb', fraction: 0.5, grams: Math.round(totalDishWeight / 2) },
                                              { label: '1/3 Drittel', fraction: 1 / 3, grams: Math.round(totalDishWeight / 3) },
                                              { label: '1/4 Viertel', fraction: 0.25, grams: Math.round(totalDishWeight / 4) },
                                              { label: '1/6 Sechstel', fraction: 1 / 6, grams: Math.round(totalDishWeight / 6) },
                                            ].map((fItem) => {
                                              const isSel = !currentCustomGrams && Math.abs(currentRatio - fItem.fraction) < 0.02;
                                              return (
                                                <button
                                                  key={fItem.label}
                                                  type="button"
                                                  onClick={() => r.id && setPortionRatio(r.id, fItem.fraction)}
                                                  className={`py-1.5 px-2.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer border ${
                                                    isSel
                                                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                                                      : 'bg-white hover:bg-stone-100 text-stone-700 border-stone-200/90'
                                                  }`}
                                                >
                                                  <span>{fItem.label}</span>
                                                  <span className="text-[10px] opacity-80 ml-1">({fItem.grams}{isDrink ? 'ml' : 'g'})</span>
                                                </button>
                                              );
                                            })}

                                            {/* Direct Gram Input */}
                                            <div className="flex items-center gap-1 bg-white border border-stone-200 rounded-xl px-2 py-1 shrink-0">
                                              <span className="text-[10px] font-bold text-stone-400">Frei:</span>
                                              <input
                                                type="number"
                                                placeholder="Gramm"
                                                value={currentCustomGrams}
                                                onChange={(e) => r.id && setRecipeCustomGramInput(r.id, e.target.value, totalDishWeight)}
                                                className="w-14 text-xs font-bold text-stone-800 outline-none text-right"
                                              />
                                              <span className="text-[10px] text-stone-400">{isDrink ? 'ml' : 'g'}</span>
                                            </div>
                                          </div>
                                        </div>
                                      )}

                                      {/* Portionierung & Nährwert-Box (live skaliert) */}
                                      <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                                        <div>
                                          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                                            {activePortionTitle}:
                                          </span>
                                          <span className="text-base font-black text-stone-900 block">
                                            {currentKcal} kcal <span className="text-xs font-normal text-stone-500">für {activeGrams}{isDrink ? 'ml' : 'g'}</span>
                                          </span>
                                          <span className="text-[11px] text-stone-600 font-medium">
                                            P: {currentProt}g • K: {currentCarbs}g • F: {currentFat}g
                                          </span>
                                        </div>

                                        <div className="sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-stone-200/60 text-[11px] text-stone-500">
                                          <span className="font-bold text-stone-700 block">Pro 100g: {r.calories100g} kcal</span>
                                          <span className="text-[10px] text-stone-400 block">
                                            P: {r.protein100g}g • K: {r.carbs100g}g • F: {r.fat100g}g
                                          </span>
                                        </div>
                                      </div>

                                      {/* Zutatenliste mit Live-Skalierung & Checkboxen */}
                                      {r.ingredients && r.ingredients.length > 0 && (
                                        <div className="space-y-1.5">
                                          <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
                                              Zutatenliste ({r.ingredients.length}) • {Math.round(ratioForIngredients * 100)}% skaliert:
                                            </span>
                                            <span className="text-[10px] text-stone-400">Beim Kochen abhaken</span>
                                          </div>
                                          <div className="divide-y divide-stone-100 bg-stone-50/70 rounded-2xl border border-stone-200/60 p-2 max-h-48 overflow-y-auto">
                                            {r.ingredients.map((ing, idx) => {
                                              const ingKey = `${r.id}_ing_${idx}`;
                                              const isDone = !!checkedIngredients[ingKey];
                                              const scaledG = Math.round(ing.amountGrams * ratioForIngredients);
                                              return (
                                                <div
                                                  key={idx}
                                                  onClick={() => toggleIngredientCheck(ingKey)}
                                                  className={`py-1.5 px-2 flex items-center justify-between text-xs cursor-pointer select-none transition-colors rounded-xl ${
                                                    isDone ? 'bg-emerald-50/60 text-stone-400' : 'hover:bg-white text-stone-800'
                                                  }`}
                                                >
                                                  <div className="flex items-center gap-2 min-w-0 pr-2">
                                                    <div className="shrink-0">
                                                      {isDone ? (
                                                        <CheckSquare className="w-4 h-4 text-emerald-600" />
                                                      ) : (
                                                        <Square className="w-4 h-4 text-stone-300" />
                                                      )}
                                                    </div>
                                                    <span className={`truncate font-medium ${isDone ? 'line-through' : ''}`}>
                                                      {ing.name}
                                                    </span>
                                                  </div>
                                                  <span className="font-extrabold text-[11px] shrink-0 text-stone-700">
                                                    {scaledG}g
                                                  </span>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      )}
                                    </>
                                  );
                                })()}

                                {/* Schritt-für-Schritt Zubereitung (Instructions) */}
                                {r.instructions && r.instructions.length > 0 && (
                                  <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
                                        Zubereitung ({r.instructions.length} Schritte):
                                      </span>
                                      <span className="text-[10px] text-stone-400">Schritte abhaken</span>
                                    </div>
                                    <div className="space-y-1.5 bg-stone-50/70 rounded-2xl border border-stone-200/60 p-2.5 max-h-56 overflow-y-auto">
                                      {r.instructions.map((step, idx) => {
                                        const stepKey = `${r.id}_step_${idx}`;
                                        const isDone = !!checkedInstructions[stepKey];
                                        return (
                                          <div
                                            key={idx}
                                            onClick={() => toggleInstructionCheck(stepKey)}
                                            className={`p-2 rounded-xl border text-xs flex items-start gap-2.5 cursor-pointer select-none transition-all ${
                                              isDone
                                                ? 'bg-emerald-50/60 border-emerald-200 text-stone-400 line-through'
                                                : 'bg-white border-stone-200/70 text-stone-800 hover:border-emerald-300'
                                            }`}
                                          >
                                            <div className="pt-0.5 shrink-0">
                                              {isDone ? (
                                                <CheckSquare className="w-4 h-4 text-emerald-600" />
                                              ) : (
                                                <span className="w-4 h-4 rounded-full bg-stone-100 text-stone-600 font-bold text-[10px] flex items-center justify-center">
                                                  {idx + 1}
                                                </span>
                                              )}
                                            </div>
                                            <p className={`flex-1 text-xs leading-relaxed ${isDone ? 'line-through text-stone-400' : 'text-stone-800'}`}>
                                              {step}
                                            </p>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}

                                {/* Aktions-Buttons: Tagebuch, Bearbeiten, Teilen */}
                                <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-stone-100 text-xs">
                                  <div className="flex items-center gap-2 flex-1 flex-wrap">
                                    <button
                                      type="button"
                                      onClick={(e) => handleOpenDiaryLog(e, r)}
                                      className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-soft"
                                      title="Direkt ins Ernährungstagebuch eintragen"
                                    >
                                      <Utensils className="w-3.5 h-3.5" />
                                      <span>Ins Tagebuch</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleStartEdit(r)}
                                      className="py-2 px-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                                      title="Rezept bearbeiten"
                                    >
                                      <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                                      <span>Bearbeiten</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => setSharingRecipe(r)}
                                      className="py-2 px-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 border border-stone-200 text-stone-700 font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                                      title="Per WhatsApp oder QR-Code teilen"
                                    >
                                      <QrCode className="w-3.5 h-3.5" />
                                      <span>Teilen</span>
                                    </button>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => setExpandedRecipeId(null)}
                                    className="py-1.5 px-2.5 text-stone-400 hover:text-stone-700 font-bold text-[11px] rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
                                  >
                                    ▲ Zuklappen
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center text-stone-400 space-y-3">
                <div className="w-16 h-16 rounded-3xl bg-stone-100 flex items-center justify-center text-3xl mx-auto">
                  📖
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-stone-700 text-sm">Noch keine eigenen Rezepte vorhanden</h4>
                  <p className="text-xs text-stone-400 max-w-xs mx-auto">
                    Erstelle dein erstes Rezept mit Fotos & Zubereitung, nutze den KI-Chefkoch oder empfange Rezepte per WhatsApp.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('create')}
                  className="py-2.5 px-4 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors inline-flex items-center gap-1.5 shadow-soft cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Jetzt Rezept erstellen</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: KI-CHEFKOCH (REZEPT-INSPIRATION & SPRACHEINGABE) */}
        {activeTab === 'chef' && (
          <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
            {/* Chefkoch Header & Teaser */}
            <div className="p-4 bg-gradient-to-br from-amber-500/10 via-emerald-500/10 to-teal-500/15 rounded-3xl border border-amber-200/80 space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-emerald-600 text-white flex items-center justify-center text-2xl shadow-sm shrink-0">
                  🪄
                </div>
                <div>
                  <h4 className="font-extrabold text-stone-900 text-sm sm:text-base">
                    Dein persönlicher KI-Chefkoch
                  </h4>
                  <p className="text-xs text-stone-500">
                    Sag oder tippe, worauf du Appetit hast oder welche Reste im Kühlschrank liegen.
                  </p>
                </div>
              </div>
            </div>

            {/* Prompt Input Box with Mic */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-stone-700">
                  Was möchtest du kochen / backen?
                </label>
                <VoiceInputButton
                  onTranscript={(text) => setChefPrompt(text)}
                  currentValue={chefPrompt}
                  size="sm"
                  title="Wunsch oder Zutaten einsprechen"
                />
              </div>
              <div className="relative">
                <textarea
                  rows={3}
                  value={chefPrompt}
                  onChange={(e) => setChefPrompt(e.target.value)}
                  placeholder="z. B. 'Ein schnelles, proteinreiches Mittagessen mit Hähnchen, Brokkoli und etwas Schmand' oder 'Kühlschrank-Reste: 3 Eier, halbe Zucchini und Feta'..."
                  className="w-full p-3.5 rounded-2xl border border-stone-200 bg-stone-50/50 text-xs text-stone-800 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 resize-none leading-relaxed"
                />
              </div>

              {/* Inspiration Chips */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                  Schnelle Inspirationen:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    '🥦 Brokkoli-Käse-Auflauf mit Ei & Schmand',
                    '🥗 Mediterraner Kichererbsensalat mit Gurke & Feta',
                    '🍞 Eiweißbrot mit Magerquark & Körnern',
                    '🍗 Hähnchen-Gemüse-Pfanne mit Tomatenmark',
                    '🍓 Protein-Erdbeer-Shake mit Kefir & Chia',
                  ].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setChefPrompt(chip)}
                      className="py-1 px-2.5 rounded-xl bg-stone-100 hover:bg-emerald-50 text-[11px] font-semibold text-stone-700 hover:text-emerald-900 border border-stone-200/60 transition-all cursor-pointer"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Chef Button */}
              <button
                type="button"
                onClick={handleAskChef}
                disabled={isChefLoading || !chefPrompt.trim()}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-600 hover:from-emerald-700 hover:to-amber-700 active:scale-[0.99] text-white font-bold text-xs shadow-soft transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isChefLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>KI-Chefkoch kreiert dein Rezept & Nährwerte...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-200" />
                    <span>🪄 Jetzt Rezept zaubern</span>
                  </>
                )}
              </button>

              {/* Error banner */}
              {chefError && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>{chefError}</span>
                  </div>
                  {!geminiApiKey && onOpenSettings && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenSettings();
                      }}
                      className="font-bold underline text-amber-950 shrink-0"
                    >
                      Key hinterlegen
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Chef Result Preview Card */}
            {chefResult && (
              <div className="p-4 bg-white border-2 border-emerald-500 rounded-3xl shadow-soft space-y-3.5 animate-in fade-in">
                <div className="flex items-start justify-between gap-2 border-b border-stone-100 pb-3">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xl">
                        {chefResult.category === 'bread' ? '🍞' : chefResult.category === 'drink' ? '🥤' : chefResult.category === 'salad' ? '🥗' : chefResult.category === 'breakfast' ? '🥣' : chefResult.category === 'snack' ? '🍫' : '🍲'}
                      </span>
                      <h4 className="font-black text-stone-900 text-sm sm:text-base">
                        {chefResult.name}
                      </h4>
                    </div>
                    <div className="flex items-center gap-2 text-stone-400 text-xs mt-1">
                      {chefResult.prepTimeMinutes && (
                        <span className="flex items-center gap-1 bg-stone-100 px-2 py-0.5 rounded-lg text-stone-600 font-bold text-[10px]">
                          <Clock className="w-3 h-3 text-stone-400" />
                          {chefResult.prepTimeMinutes} Min.
                        </span>
                      )}
                      <span>
                        Portion: {chefResult.servingName || '1 Portion'} ({chefResult.servingWeightGrams || 250}g)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Nutrition summary */}
                <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/70 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                      Kalorien pro Portion:
                    </span>
                    <span className="text-xl font-black text-emerald-800">
                      {Math.round(
                        (chefResult.ingredients.reduce((s, i) => s + (i.calories || 0), 0) /
                          (chefResult.cookedWeightGrams || chefResult.ingredients.reduce((s, i) => s + (i.amountGrams || 0), 0) || 1)) *
                          (chefResult.servingWeightGrams || 250)
                      )}{' '}
                      <span className="text-xs font-normal text-stone-500">kcal</span>
                    </span>
                  </div>
                  <div className="text-right text-[11px] text-stone-600">
                    <div>
                      P: <strong className="text-stone-800">{Math.round((chefResult.ingredients.reduce((s, i) => s + (i.protein || 0), 0) / (chefResult.cookedWeightGrams || chefResult.ingredients.reduce((s, i) => s + (i.amountGrams || 0), 0) || 1)) * (chefResult.servingWeightGrams || 250) * 10) / 10}g</strong>
                    </div>
                    <div>
                      K: <strong className="text-stone-800">{Math.round((chefResult.ingredients.reduce((s, i) => s + (i.carbs || 0), 0) / (chefResult.cookedWeightGrams || chefResult.ingredients.reduce((s, i) => s + (i.amountGrams || 0), 0) || 1)) * (chefResult.servingWeightGrams || 250) * 10) / 10}g</strong>
                    </div>
                    <div>
                      F: <strong className="text-stone-800">{Math.round((chefResult.ingredients.reduce((s, i) => s + (i.fat || 0), 0) / (chefResult.cookedWeightGrams || chefResult.ingredients.reduce((s, i) => s + (i.amountGrams || 0), 0) || 1)) * (chefResult.servingWeightGrams || 250) * 10) / 10}g</strong>
                    </div>
                  </div>
                </div>

                {/* Ingredients */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
                    Zutaten ({chefResult.ingredients.length}):
                  </span>
                  <div className="divide-y divide-stone-100 bg-stone-50/70 rounded-xl border border-stone-200/60 p-2 max-h-40 overflow-y-auto">
                    {chefResult.ingredients.map((ing, idx) => (
                      <div key={idx} className="py-1 px-1.5 flex items-center justify-between text-xs">
                        <span className="font-semibold text-stone-800 truncate mr-2">{ing.name}</span>
                        <span className="text-[11px] text-stone-500 shrink-0 font-medium">
                          {ing.amountGrams}g ({ing.calories} kcal)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Instructions */}
                {chefResult.instructions && chefResult.instructions.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
                      Zubereitung ({chefResult.instructions.length} Schritte):
                    </span>
                    <div className="space-y-1 bg-stone-50/70 rounded-xl border border-stone-200/60 p-2.5 max-h-44 overflow-y-auto">
                      {chefResult.instructions.map((step, idx) => (
                        <div key={idx} className="text-xs text-stone-700 flex items-start gap-2 py-0.5">
                          <span className="font-bold text-emerald-700 shrink-0">{idx + 1}.</span>
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="pt-2 flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={() => handleSaveChefDirectly(chefResult)}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-soft cursor-pointer"
                  >
                    <span>💾 In Meine Rezepte speichern</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTransferChefToEditor(chefResult)}
                    className="py-2.5 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-stone-500" />
                    <span>Im Editor anpassen</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Barcode Scanner Modal for Ingredients */}
        <BarcodeScannerModal
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          onProductFound={(product) => {
            setIsScannerOpen(false);
            handleSelectFood(product);
          }}
        />

        {/* Recipe Sharing Modal */}
        <RecipeShareModal
          isOpen={!!sharingRecipe}
          onClose={() => setSharingRecipe(null)}
          recipe={sharingRecipe}
        />

        {/* Whole Recipe Speech/Text AI Parser Modal */}
        {isAiRecipeModalOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-3 bg-stone-900/60 backdrop-blur-sm animate-in fade-in">
            <div className="w-full max-w-lg bg-white rounded-3xl shadow-soft-lg border border-stone-100 overflow-hidden flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="p-4 px-5 border-b border-stone-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-stone-800 text-sm">
                      Ganzes Rezept per Sprache / Text erfassen
                    </h3>
                    <p className="text-[11px] text-stone-400">
                      KI zerlegt Zutaten, rechnet Maße um & berechnet Nährwerte
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAiRecipeModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 space-y-4 overflow-y-auto">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-stone-700">
                      Rezept diktieren oder Text hineinkopieren:
                    </label>
                    <VoiceInputButton
                      onTranscript={(text) => setAiRecipeText(text)}
                      currentValue={aiRecipeText}
                      size="sm"
                      title="Rezept per Sprache diktieren"
                    />
                  </div>
                  <textarea
                    rows={6}
                    value={aiRecipeText}
                    onChange={(e) => setAiRecipeText(e.target.value)}
                    placeholder="Diktieren oder tippen: z. B. 'Blumenkohl-Auflauf mit Gouda: 800g Blumenkohl, 3 Eier, 200g Schmand, 100g geriebener Gouda, 2 EL Rapsöl und etwas Muskat. Ergibt 3 große Portionen.'"
                    className="w-full p-3 rounded-2xl border border-stone-200 text-xs text-stone-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 resize-none leading-relaxed bg-stone-50/50"
                    autoFocus
                  />
                </div>

                {/* Quick Examples */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                    Beispiel-Vorlagen ausprobieren:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        setAiRecipeText(
                          'Blumenkohl-Auflauf: 800g Blumenkohl, 3 Eier, 200g Schmand, 100g geriebener Gouda, 2 EL Rapsöl, 1 TL Salz und Muskat. 3 Portionen.'
                        )
                      }
                      className="py-1 px-2.5 rounded-xl bg-stone-100 hover:bg-emerald-50 text-[11px] font-semibold text-stone-700 hover:text-emerald-800 transition-colors"
                    >
                      🍲 Blumenkohl-Auflauf
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setAiRecipeText(
                          'Dinkelbrot mit Kernen: 500g Dinkelmehl 630, 350ml lauwarmes Wasser, 1 Würfel Hefe, 10g Salz, 20g Rapsöl und 50g Sonnenblumenkerne. Ergibt 850g fertiges Brot.'
                        )
                      }
                      className="py-1 px-2.5 rounded-xl bg-stone-100 hover:bg-amber-50 text-[11px] font-semibold text-stone-700 hover:text-amber-900 transition-colors"
                    >
                      🍞 Dinkelbrot mit Kernen
                    </button>
                  </div>
                </div>

                {/* Error */}
                {aiRecipeError && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>{aiRecipeError}</span>
                    </div>
                    {!geminiApiKey && onOpenSettings && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsAiRecipeModalOpen(false);
                          onClose();
                          onOpenSettings();
                        }}
                        className="font-bold underline text-amber-950 shrink-0"
                      >
                        Key hinterlegen
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 px-5 border-t border-stone-100 bg-stone-50 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setIsAiRecipeModalOpen(false)}
                  className="py-2.5 px-4 rounded-xl border border-stone-200 bg-white hover:bg-stone-100 text-stone-600 text-xs font-bold transition-colors"
                >
                  Abbrechen
                </button>

                <button
                  type="button"
                  onClick={handleParseAiRecipe}
                  disabled={isAiRecipeParsing || !aiRecipeText.trim()}
                  className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-soft disabled:opacity-50"
                >
                  {isAiRecipeParsing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>KI analysiert Rezept...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Rezept jetzt mit KI übernehmen</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* DIARY QUICK LOG MODAL */}
        {diaryLogModalRecipe && (
          <div className="fixed inset-0 z-70 flex items-center justify-center p-3 bg-stone-900/60 backdrop-blur-sm animate-in fade-in">
            <div className="w-full max-w-sm bg-white rounded-3xl shadow-soft-lg border border-stone-100 overflow-hidden flex flex-col animate-in zoom-in-95">
              <div className="p-4 px-5 border-b border-stone-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🥗</span>
                  <h3 className="font-bold text-stone-800 text-sm">Ins Tagebuch eintragen</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setDiaryLogModalRecipe(null)}
                  className="w-7 h-7 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-500 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-2xl border border-stone-100">
                  {diaryLogModalRecipe.imageUrl ? (
                    <img
                      src={diaryLogModalRecipe.imageUrl}
                      alt={diaryLogModalRecipe.name}
                      className="w-12 h-12 rounded-xl object-cover border border-stone-200 shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-xl shrink-0">
                      {diaryLogModalRecipe.category === 'bread' ? '🍞' : diaryLogModalRecipe.category === 'drink' ? '🥤' : diaryLogModalRecipe.category === 'salad' ? '🥗' : '🍲'}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h4 className="font-bold text-stone-900 text-xs sm:text-sm truncate">
                      {diaryLogModalRecipe.name}
                    </h4>
                    <p className="text-[11px] text-stone-500">
                      Basis: {diaryLogModalRecipe.calories100g} kcal / 100g
                    </p>
                  </div>
                </div>

                {/* Meal Type Selection */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-600 block">Mahlzeit:</label>
                  <div className="grid grid-cols-4 gap-1">
                    {[
                      { id: 'breakfast' as const, label: 'Frühstück', icon: '🥣' },
                      { id: 'lunch' as const, label: 'Mittag', icon: '🍲' },
                      { id: 'dinner' as const, label: 'Abend', icon: '🌙' },
                      { id: 'snack' as const, label: 'Snack', icon: '🍎' },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setDiaryLogMealType(m.id)}
                        className={`py-1.5 px-1 rounded-xl border text-[11px] font-bold transition-all flex flex-col items-center gap-0.5 cursor-pointer ${
                          diaryLogMealType === m.id
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-2xs'
                            : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                        }`}
                      >
                        <span>{m.icon}</span>
                        <span>{m.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Portion Count & Macros */}
                {(() => {
                  const effectiveCategory = inferRecipeCategory(diaryLogModalRecipe);
                  const isDrink = effectiveCategory === 'drink';
                  const isBread = effectiveCategory === 'bread';
                  const totalDishWeight = diaryLogModalRecipe.cookedWeight || diaryLogModalRecipe.totalRawWeight;

                  let totalG = Math.round(totalDishWeight * diaryLogFraction);
                  const parsedCustom = parseFloat(diaryLogCustomGrams);
                  if (parsedCustom && parsedCustom > 0) {
                    totalG = Math.round(parsedCustom);
                  }

                  const ratio = totalG / 100;
                  const cals = Math.round(diaryLogModalRecipe.calories100g * ratio);
                  const prot = Math.round((diaryLogModalRecipe.protein100g || 0) * ratio * 10) / 10;
                  const carb = Math.round((diaryLogModalRecipe.carbs100g || 0) * ratio * 10) / 10;
                  const fat = Math.round((diaryLogModalRecipe.fat100g || 0) * ratio * 10) / 10;

                  // Label for active portion
                  let activePortionLabel = '';
                  if (parsedCustom && parsedCustom > 0) {
                    activePortionLabel = `Eigene Angabe (${totalG}${isDrink ? 'ml' : 'g'})`;
                  } else if (isBread) {
                    const sliceG = diaryLogModalRecipe.servingWeightGrams || 50;
                    if (Math.abs(diaryLogFraction - 1) < 0.02) {
                      activePortionLabel = `Ganzer Laib (${totalDishWeight}g)`;
                    } else if (Math.abs(diaryLogFraction - 0.5) < 0.02) {
                      activePortionLabel = `1/2 Laib (${totalG}g)`;
                    } else {
                      const numSlices = Math.max(1, Math.round(totalG / sliceG));
                      activePortionLabel = numSlices === 1 ? `1 Scheibe (${totalG}g)` : `${numSlices} Scheiben (${totalG}g)`;
                    }
                  } else {
                    if (Math.abs(diaryLogFraction - 1) < 0.02) {
                      activePortionLabel = `Ganzes Gericht (${totalG}${isDrink ? 'ml' : 'g'})`;
                    } else if (Math.abs(diaryLogFraction - 0.5) < 0.02) {
                      activePortionLabel = `1/2 Gericht (${totalG}${isDrink ? 'ml' : 'g'})`;
                    } else if (Math.abs(diaryLogFraction - 1 / 3) < 0.02) {
                      activePortionLabel = `1/3 Gericht (${totalG}${isDrink ? 'ml' : 'g'})`;
                    } else if (Math.abs(diaryLogFraction - 0.25) < 0.02) {
                      activePortionLabel = `1/4 Gericht (${totalG}${isDrink ? 'ml' : 'g'})`;
                    } else if (Math.abs(diaryLogFraction - 1 / 6) < 0.02) {
                      activePortionLabel = `1/6 Gericht (${totalG}${isDrink ? 'ml' : 'g'})`;
                    } else if (diaryLogFraction > 1) {
                      activePortionLabel = `${diaryLogFraction}x Gesamtrezept (${totalG}${isDrink ? 'ml' : 'g'})`;
                    } else {
                      activePortionLabel = `Portion (${totalG}${isDrink ? 'ml' : 'g'})`;
                    }
                  }

                  return (
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-stone-600">Portionsmenge:</label>
                          <span className="text-xs font-bold text-stone-500">
                            {totalG} {isDrink ? 'ml' : 'g'} gesamt
                          </span>
                        </div>

                        {/* If bread, show slice / loaf chips */}
                        {isBread ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {(() => {
                                const sliceG = diaryLogModalRecipe.servingWeightGrams || 50;
                                const loafG = totalDishWeight;
                                const breadOptions = [
                                  { label: '1 Scheibe', fraction: sliceG / loafG, grams: sliceG },
                                  { label: '2 Scheiben', fraction: (sliceG * 2) / loafG, grams: sliceG * 2 },
                                  { label: '3 Scheiben', fraction: (sliceG * 3) / loafG, grams: sliceG * 3 },
                                  { label: '1/2 Laib', fraction: 0.5, grams: Math.round(loafG / 2) },
                                  { label: 'Ganzer Laib', fraction: 1, grams: loafG },
                                ];
                                return breadOptions.map((bItem) => {
                                  const isSel = !diaryLogCustomGrams && Math.abs(diaryLogFraction - bItem.fraction) < 0.02;
                                  return (
                                    <button
                                      key={bItem.label}
                                      type="button"
                                      onClick={() => {
                                        setDiaryLogFraction(bItem.fraction);
                                        setDiaryLogCustomGrams('');
                                      }}
                                      className={`py-1 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                                        isSel
                                          ? 'bg-amber-600 text-white border-amber-700 shadow-2xs'
                                          : 'bg-white hover:bg-stone-100 text-stone-700 border-stone-200'
                                      }`}
                                    >
                                      <span>{bItem.label}</span>
                                      <span className="text-[10px] opacity-80 ml-1">({bItem.grams}g)</span>
                                    </button>
                                  );
                                });
                              })()}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-stone-500 font-medium">Oder freie Gramm:</span>
                              <div className="flex items-center gap-1 bg-white border border-stone-200 rounded-xl px-2.5 py-1">
                                <input
                                  type="number"
                                  placeholder="z.B. 65"
                                  value={diaryLogCustomGrams}
                                  onChange={(e) => {
                                    setDiaryLogCustomGrams(e.target.value);
                                    const parsed = parseFloat(e.target.value);
                                    if (parsed && parsed > 0 && totalDishWeight > 0) {
                                      setDiaryLogFraction(parsed / totalDishWeight);
                                    }
                                  }}
                                  className="w-16 text-xs font-bold text-stone-800 outline-none text-right"
                                />
                                <span className="text-[11px] text-stone-400">g</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          /* For dishes, bowls, drinks, menus, snacks: Fractions 1/1, 1/2, 1/3, 1/4, 1/6 + custom grams */
                          <div className="space-y-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {[
                                { label: '1/1 Ganz', fraction: 1, grams: totalDishWeight },
                                { label: '1/2 Halb', fraction: 0.5, grams: Math.round(totalDishWeight / 2) },
                                { label: '1/3 Drittel', fraction: 1 / 3, grams: Math.round(totalDishWeight / 3) },
                                { label: '1/4 Viertel', fraction: 0.25, grams: Math.round(totalDishWeight / 4) },
                                { label: '1/6 Sechstel', fraction: 1 / 6, grams: Math.round(totalDishWeight / 6) },
                              ].map((fItem) => {
                                const isSel = !diaryLogCustomGrams && Math.abs(diaryLogFraction - fItem.fraction) < 0.02;
                                return (
                                  <button
                                    key={fItem.label}
                                    type="button"
                                    onClick={() => {
                                      setDiaryLogFraction(fItem.fraction);
                                      setDiaryLogCustomGrams('');
                                    }}
                                    className={`py-1.5 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                                      isSel
                                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                                        : 'bg-white hover:bg-stone-100 text-stone-700 border-stone-200'
                                    }`}
                                  >
                                    <span>{fItem.label}</span>
                                    <span className="text-[10px] opacity-80 ml-1">({fItem.grams}{isDrink ? 'ml' : 'g'})</span>
                                  </button>
                                );
                              })}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-stone-500 font-medium">Oder freie {isDrink ? 'ml' : 'Gramm'}:</span>
                              <div className="flex items-center gap-1 bg-white border border-stone-200 rounded-xl px-2.5 py-1">
                                <input
                                  type="number"
                                  placeholder="z.B. 250"
                                  value={diaryLogCustomGrams}
                                  onChange={(e) => {
                                    setDiaryLogCustomGrams(e.target.value);
                                    const parsed = parseFloat(e.target.value);
                                    if (parsed && parsed > 0 && totalDishWeight > 0) {
                                      setDiaryLogFraction(parsed / totalDishWeight);
                                    }
                                  }}
                                  className="w-16 text-xs font-bold text-stone-800 outline-none text-right"
                                />
                                <span className="text-[11px] text-stone-400">{isDrink ? 'ml' : 'g'}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Calculated Macros Box */}
                      <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex items-center justify-between text-xs">
                        <div>
                          <span className="text-[10px] font-bold text-emerald-900 block uppercase">
                            {activePortionLabel}:
                          </span>
                          <span className="text-xl font-black text-emerald-950">{cals} kcal</span>
                        </div>
                        <div className="text-right text-[11px] text-emerald-800 space-y-0.5">
                          <div>P: <strong className="text-stone-900">{prot}g</strong></div>
                          <div>K: <strong className="text-stone-900">{carb}g</strong> • F: <strong className="text-stone-900">{fat}g</strong></div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Feedback */}
                {diaryLogSuccess && (
                  <div className="p-2.5 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl text-xs font-bold text-center animate-in fade-in">
                    ✓ {diaryLogSuccess}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="p-4 px-5 border-t border-stone-100 bg-stone-50 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setDiaryLogModalRecipe(null)}
                  className="py-2.5 px-4 rounded-xl border border-stone-200 bg-white hover:bg-stone-100 text-stone-600 text-xs font-bold transition-colors cursor-pointer"
                >
                  Abbrechen
                </button>
                <button
                  type="button"
                  onClick={handleLogToDiary}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-soft transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Utensils className="w-3.5 h-3.5" />
                  <span>Jetzt eintragen</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
