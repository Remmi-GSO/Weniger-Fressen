import { useState, useMemo, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type RecipeIngredient, type CustomRecipe, type RecipeCategory, type MealType } from '../db/db';
import { ALL_LOCAL_FOODS, searchFoodProducts, normalizeGermanSearch, type FoodProduct } from '../services/foodApi';
import { getPortionPresets } from '../utils/portionPresets';
import { queryFoodWithGemini, parseRecipeWithGemini } from '../services/geminiApi';
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
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface RecipeCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRecipeSaved?: (recipe: CustomRecipe) => void;
  defaultMealType?: MealType;
  initialCategory?: RecipeCategory;
  geminiApiKey?: string;
  onOpenSettings?: () => void;
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

export const RecipeCreatorModal = ({
  isOpen,
  onClose,
  onRecipeSaved,
  initialCategory = 'bread',
  geminiApiKey,
  onOpenSettings,
}: RecipeCreatorModalProps) => {
  const [name, setName] = useState(
    initialCategory === 'meal'
      ? 'Mein Gericht'
      : initialCategory === 'drink'
      ? 'Mein Getränk / Smoothie'
      : 'Unser selbstgebackenes Brot'
  );
  const [category, setCategory] = useState<RecipeCategory>(initialCategory);
  
  // Edit mode state
  const [editingRecipeId, setEditingRecipeId] = useState<number | null>(null);

  // List view UI state: Accordion & Expand
  const [expandedRecipeId, setExpandedRecipeId] = useState<number | null>(null);
  const [listCategoryFilter, setListCategoryFilter] = useState<'all' | RecipeCategory>('all');
  const [recipeSearchQuery, setRecipeSearchQuery] = useState('');
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    bread: true,
    meal: true,
    drink: true,
    snack: true,
  });

  const toggleCategory = (cat: string) => {
    setOpenCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  const handleStartEdit = (r: CustomRecipe) => {
    setEditingRecipeId(r.id || null);
    setName(r.name);
    setCategory(r.category || 'bread');
    setIngredients(r.ingredients ? [...r.ingredients] : []);
    setSliceWeight(String(r.servingWeightGrams || (r.category === 'bread' ? 50 : 250)));
    setCustomBakedWeight(r.cookedWeight ? String(r.cookedWeight) : '');
    setActiveTab('create');
  };

  const handleCancelEdit = () => {
    setEditingRecipeId(null);
    setName(
      category === 'meal'
        ? 'Mein Gericht'
        : category === 'drink'
        ? 'Mein Getränk / Smoothie'
        : 'Unser selbstgebackenes Brot'
    );
    setIngredients([]);
    setCustomBakedWeight('');
    setSliceWeight(category === 'bread' ? '50' : '250');
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
  const [activeTab, setActiveTab] = useState<'create' | 'list'>('create');
  const [sharingRecipe, setSharingRecipe] = useState<CustomRecipe | null>(null);

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

  // Baked/Cooked weight: if not manually specified, bread loses ~12%, cooked meals lose ~5% to steam, drinks lose 0%
  const effectiveBakedWeight = useMemo(() => {
    const manual = parseFloat(customBakedWeight);
    if (manual && manual > 0) return manual;
    if (category === 'drink') return totalRawWeight;
    return Math.round(totalRawWeight * (category === 'bread' ? 0.88 : 0.95));
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
  const numSliceWeight = parseFloat(sliceWeight) || (category === 'bread' ? 50 : category === 'drink' ? 250 : 250);
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

    const recipe: CustomRecipe = {
      name: name.trim(),
      category,
      ingredients,
      totalRawWeight,
      cookedWeight: effectiveBakedWeight,
      servingName: category === 'bread' ? '1 Scheibe' : category === 'drink' ? '1 Glas' : '1 Portion',
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
          <div className="flex items-center gap-2">
            <span className={`p-2 rounded-xl text-lg ${
              category === 'drink'
                ? 'bg-blue-50 text-blue-600'
                : category === 'bread'
                ? 'bg-amber-50 text-amber-600'
                : 'bg-emerald-50 text-emerald-600'
            }`}>
              {category === 'drink' ? '🥤' : category === 'bread' ? '🍞' : '🍲'}
            </span>
            <div>
              <h3 className="font-bold text-stone-800 text-base">
                {editingRecipeId ? 'Rezept bearbeiten' : 'Rezepte'}
              </h3>
              <p className="text-xs text-stone-400">
                {editingRecipeId
                  ? 'Passe Zutaten, Mengen oder Portionen an'
                  : 'Brot & Kuchen, Mahlzeiten und Getränke berechnen'}
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

        {/* Navigation Tabs: Neues Rezept / Bearbeiten vs. Meine Rezepte */}
        <div className="flex border-b border-stone-100 bg-stone-50/70 px-4 pt-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'create'
                ? 'border-emerald-600 text-emerald-800 bg-white rounded-t-xl shadow-2xs'
                : 'border-transparent text-stone-400 hover:text-stone-700'
            }`}
          >
            {editingRecipeId ? <Edit3 className="w-3.5 h-3.5 text-amber-600" /> : <Plus className="w-3.5 h-3.5" />}
            <span>{editingRecipeId ? 'Rezept bearbeiten' : 'Neues Rezept'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('list')}
            className={`flex-1 py-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'list'
                ? 'border-emerald-600 text-emerald-800 bg-white rounded-t-xl shadow-2xs'
                : 'border-transparent text-stone-400 hover:text-stone-700'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Meine Rezepte ({customRecipes.length})</span>
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
          <div className="space-y-2.5">
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
                      : category === 'drink'
                      ? 'z. B. Grüner Smoothie, Protein-Beeren-Shake, Frischer Eistee'
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

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setCategory('bread');
                  if (name === 'Mein Gericht' || name === 'Mein Getränk / Smoothie') setName('Unser selbstgebackenes Brot');
                  if (sliceWeight === '250') setSliceWeight('50');
                }}
                className={`flex-1 py-2 px-2 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  category === 'bread'
                    ? 'border-amber-500 bg-amber-50 text-amber-900 shadow-sm'
                    : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                }`}
              >
                <span>🍞</span>
                <span>Brot & Kuchen</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCategory('meal');
                  if (name === 'Unser selbstgebackenes Brot' || name === 'Mein Getränk / Smoothie') setName('Mein Gericht');
                  if (sliceWeight === '50') setSliceWeight('250');
                }}
                className={`flex-1 py-2 px-2 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  category === 'meal'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-sm'
                    : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                }`}
              >
                <span>🍲</span>
                <span>Feste Mahlzeit</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCategory('drink');
                  if (name === 'Unser selbstgebackenes Brot' || name === 'Mein Gericht') setName('Mein Getränk / Smoothie');
                  setSliceWeight('250');
                }}
                className={`flex-1 py-2 px-2 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  category === 'drink'
                    ? 'border-blue-500 bg-blue-50 text-blue-900 shadow-sm'
                    : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                }`}
              >
                <span>🥤</span>
                <span>Getränk</span>
              </button>
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
                        Beliebte Basics für {category === 'bread' ? 'Brot & Kuchen' : category === 'drink' ? 'Getränke & Shakes' : 'Mahlzeiten'} (1-Tap):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {(category === 'bread' ? BREAD_STAPLES : category === 'drink' ? DRINK_STAPLES : MEAL_STAPLES).map((s) => (
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

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[10px] font-bold block mb-0.5 opacity-70">
                  {category === 'drink' ? 'Gesamtmenge (ml/g)' : category === 'bread' ? 'Gebackenes Gewicht (g)' : 'Fertiges Gewicht (g)'}
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
                  {category === 'drink' ? 'Menge pro Glas / Portion' : category === 'bread' ? 'Gewicht pro Scheibe (g)' : 'Gewicht pro Portion (g)'}
                </label>
                <input
                  type="number"
                  value={sliceWeight}
                  onChange={(e) => setSliceWeight(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-stone-200 bg-white font-bold text-stone-800 text-xs"
                />
              </div>
            </div>

            {/* Live Nutrition Summary */}
            <div className="p-3 bg-white/90 rounded-xl border border-stone-200/70 flex items-center justify-between gap-2 shadow-2xs">
              <div>
                <span className="text-[10px] font-bold text-stone-400 block uppercase">
                  {category === 'drink' ? '1 Glas / Portion' : category === 'bread' ? '1 Scheibe Brot' : '1 Portion'} ({numSliceWeight}{category === 'drink' ? 'ml' : 'g'})
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
                  onClick={() => setListCategoryFilter('bread')}
                  className={`py-1 px-2.5 rounded-xl font-bold transition-all shrink-0 text-[11px] flex items-center gap-1 cursor-pointer ${
                    listCategoryFilter === 'bread'
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'bg-amber-50 text-amber-900 border border-amber-200/60 hover:bg-amber-100'
                  }`}
                >
                  <span>🍞</span>
                  <span>Brot & Kuchen ({customRecipes.filter((r) => r.category === 'bread' || r.name.toLowerCase().includes('brot')).length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setListCategoryFilter('meal')}
                  className={`py-1 px-2.5 rounded-xl font-bold transition-all shrink-0 text-[11px] flex items-center gap-1 cursor-pointer ${
                    listCategoryFilter === 'meal'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-emerald-50 text-emerald-900 border border-emerald-200/60 hover:bg-emerald-100'
                  }`}
                >
                  <span>🍲</span>
                  <span>Mahlzeiten ({customRecipes.filter((r) => (r.category === 'meal' || (!r.category && !r.name.toLowerCase().includes('brot'))) && !r.name.toLowerCase().includes('brot')).length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setListCategoryFilter('drink')}
                  className={`py-1 px-2.5 rounded-xl font-bold transition-all shrink-0 text-[11px] flex items-center gap-1 cursor-pointer ${
                    listCategoryFilter === 'drink'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-blue-50 text-blue-900 border border-blue-200/60 hover:bg-blue-100'
                  }`}
                >
                  <span>🥤</span>
                  <span>Getränke ({customRecipes.filter((r) => r.category === 'drink').length})</span>
                </button>
              </div>
            </div>

            {/* Rubriken / Categories */}
            {customRecipes.length > 0 ? (
              <div className="space-y-3">
                {[
                  {
                    key: 'bread' as const,
                    title: 'Brot, Brötchen & Kuchen',
                    icon: '🍞',
                    match: (r: CustomRecipe) => r.category === 'bread' || r.name.toLowerCase().includes('brot'),
                    bgHeader: 'bg-amber-50/80',
                    borderHeader: 'border-amber-200/80',
                    textColor: 'text-amber-950',
                    badgeColor: 'bg-amber-100 text-amber-900',
                  },
                  {
                    key: 'meal' as const,
                    title: 'Feste Mahlzeiten & Gerichte',
                    icon: '🍲',
                    match: (r: CustomRecipe) => (r.category === 'meal' || (!r.category && !r.name.toLowerCase().includes('brot'))) && !r.name.toLowerCase().includes('brot'),
                    bgHeader: 'bg-emerald-50/80',
                    borderHeader: 'border-emerald-200/80',
                    textColor: 'text-emerald-950',
                    badgeColor: 'bg-emerald-100 text-emerald-900',
                  },
                  {
                    key: 'drink' as const,
                    title: 'Getränke, Shakes & Smoothies',
                    icon: '🥤',
                    match: (r: CustomRecipe) => r.category === 'drink',
                    bgHeader: 'bg-blue-50/80',
                    borderHeader: 'border-blue-200/80',
                    textColor: 'text-blue-950',
                    badgeColor: 'bg-blue-100 text-blue-900',
                  },
                  {
                    key: 'snack' as const,
                    title: 'Snacks & Süßes',
                    icon: '🍫',
                    match: (r: CustomRecipe) => r.category === 'snack',
                    bgHeader: 'bg-pink-50/80',
                    borderHeader: 'border-pink-200/80',
                    textColor: 'text-pink-950',
                    badgeColor: 'bg-pink-100 text-pink-900',
                  },
                ].map((rubrik) => {
                  if (listCategoryFilter !== 'all' && listCategoryFilter !== rubrik.key) {
                    return null;
                  }

                  const query = recipeSearchQuery.trim().toLowerCase();
                  const rubrikRecipes = customRecipes.filter((r) => {
                    if (!rubrik.match(r)) return false;
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
                            const isBread = r.category === 'bread' || r.name.toLowerCase().includes('brot');
                            const isDrink = r.category === 'drink';
                            const sliceWeight = r.servingWeightGrams || (isDrink ? 250 : isBread ? 50 : 250);
                            const sliceKcal = Math.round(r.calories100g * (sliceWeight / 100));
                            const servLabel = r.servingName || (isBread ? '1 Scheibe' : isDrink ? '1 Glas' : '1 Portion');
                            const mult = sliceWeight / 100;
                            const proteinSlice = Math.round((r.protein100g || 0) * mult * 10) / 10;
                            const carbsSlice = Math.round((r.carbs100g || 0) * mult * 10) / 10;
                            const fatSlice = Math.round((r.fat100g || 0) * mult * 10) / 10;

                            if (!isExpanded) {
                              // KOMPAKTE VORSCHAU-ZEILE
                              return (
                                <div
                                  key={r.id}
                                  onClick={() => setExpandedRecipeId(r.id || null)}
                                  className="p-2.5 sm:p-3 bg-white hover:bg-stone-50/90 rounded-xl border border-stone-200/70 transition-all flex items-center justify-between gap-3 cursor-pointer shadow-2xs group"
                                  title="Tippen, um Rezeptdetails, Zutaten und Teilen-Optionen zu sehen"
                                >
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center text-xl shrink-0 ${
                                      isDrink
                                        ? 'bg-blue-500/10 text-blue-700 border-blue-200/50'
                                        : isBread
                                        ? 'bg-amber-500/10 text-amber-700 border-amber-200/50'
                                        : 'bg-emerald-500/10 text-emerald-700 border-emerald-200/50'
                                    }`}>
                                      {isDrink ? '🥤' : isBread ? '🍞' : '🍲'}
                                    </div>

                                    <div className="min-w-0">
                                      <h4 className="font-extrabold text-stone-900 text-xs sm:text-sm truncate">
                                        {r.name}
                                      </h4>
                                      <div className="flex items-center gap-2 text-[11px] text-stone-500 truncate mt-0.5">
                                        <span className={`font-bold ${isDrink ? 'text-blue-800' : isBread ? 'text-amber-800' : 'text-emerald-800'}`}>
                                          {servLabel} ({sliceWeight}{isDrink ? 'ml' : 'g'}): <strong className="text-stone-900 font-black">{sliceKcal} kcal</strong>
                                        </span>
                                        <span className="text-[10px] text-stone-400 hidden sm:inline">
                                          P: {proteinSlice}g • K: {carbsSlice}g • F: {fatSlice}g
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1.5 shrink-0">
                                    {onRecipeSaved && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onRecipeSaved(r);
                                          onClose();
                                        }}
                                        className="p-1.5 px-2.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 font-bold text-[10px] transition-colors flex items-center gap-1 cursor-pointer"
                                        title="Direkt als Mahlzeit eintragen"
                                      >
                                        <Utensils className="w-3 h-3 text-amber-700" />
                                        <span className="hidden sm:inline">Eintragen</span>
                                      </button>
                                    )}

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

                            // AUFGEKLAPPTE DETAILANSICHT (BEARBEITBAR, ZUTATEN, TEILEN, PORTIONIERUNG)
                            return (
                              <div
                                key={r.id}
                                className="p-4 bg-white border-2 border-emerald-500/80 rounded-2xl transition-all shadow-md space-y-3.5 animate-in fade-in"
                              >
                                {/* Header: Icon, Name (mit Bearbeiten), Löschen */}
                                <div className="flex items-start justify-between gap-2 border-b border-stone-100 pb-3">
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center text-2xl shrink-0 ${
                                      isDrink
                                        ? 'bg-blue-500/10 text-blue-700 border-blue-200/50'
                                        : isBread
                                        ? 'bg-amber-500/10 text-amber-700 border-amber-200/50'
                                        : 'bg-emerald-500/10 text-emerald-700 border-emerald-200/50'
                                    }`}>
                                      {isDrink ? '🥤' : isBread ? '🍞' : '🍲'}
                                    </div>
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <h4 className="font-black text-stone-900 text-sm sm:text-base">
                                          {r.name}
                                        </h4>
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
                                        {isDrink ? 'Getränk' : isBread ? 'Laib' : 'Gericht'} fertig gewogen: {r.cookedWeight || r.totalRawWeight}{isDrink ? 'ml' : 'g'} (Rohgewicht: {r.totalRawWeight}{isDrink ? 'ml' : 'g'})
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

                                {/* Portionierung & Nährwert-Box */}
                                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                                  <div>
                                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                                      Portionierung ({servLabel}):
                                    </span>
                                    <span className="text-base font-black text-stone-900 block">
                                      {sliceKcal} kcal <span className="text-xs font-normal text-stone-500">pro {sliceWeight}{isDrink ? 'ml' : 'g'}</span>
                                    </span>
                                    <span className="text-[11px] text-stone-600 font-medium">
                                      P: {proteinSlice}g • K: {carbsSlice}g • F: {fatSlice}g
                                    </span>
                                  </div>

                                  <div className="sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-stone-200/60 text-[11px] text-stone-500">
                                    <span className="font-bold text-stone-700 block">Pro 100g: {r.calories100g} kcal</span>
                                    <span className="text-[10px] text-stone-400 block">
                                      P: {r.protein100g}g • K: {r.carbs100g}g • F: {r.fat100g}g
                                    </span>
                                  </div>
                                </div>

                                {/* Zutatenliste */}
                                {r.ingredients && r.ingredients.length > 0 && (
                                  <div className="space-y-1.5">
                                    <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
                                      Zutatenliste ({r.ingredients.length}):
                                    </span>
                                    <div className="divide-y divide-stone-100 bg-stone-50/70 rounded-xl border border-stone-200/60 p-2 max-h-48 overflow-y-auto">
                                      {r.ingredients.map((ing, idx) => (
                                        <div key={idx} className="py-1 px-1.5 flex items-center justify-between text-xs">
                                          <span className="font-semibold text-stone-800 truncate mr-2">
                                            {ing.name}
                                          </span>
                                          <span className="text-[11px] text-stone-500 shrink-0 font-medium">
                                            {ing.amountGrams}g ({ing.calories} kcal)
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Aktions-Buttons: Bearbeiten, Teilen, Mahlzeit eintragen */}
                                <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-stone-100 text-xs">
                                  <div className="flex items-center gap-2 flex-1">
                                    <button
                                      type="button"
                                      onClick={() => handleStartEdit(r)}
                                      className="py-2 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                                      title="Rezept bearbeiten"
                                    >
                                      <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                                      <span>Bearbeiten</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => setSharingRecipe(r)}
                                      className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-soft"
                                      title="Per WhatsApp oder QR-Code teilen"
                                    >
                                      <QrCode className="w-3.5 h-3.5" />
                                      <span>Per WhatsApp / QR teilen</span>
                                    </button>

                                    {onRecipeSaved && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          onRecipeSaved(r);
                                          onClose();
                                        }}
                                        className="py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 font-bold transition-all flex items-center gap-1 cursor-pointer"
                                        title="Dieses Rezept jetzt als Mahlzeit eintragen"
                                      >
                                        <Utensils className="w-3.5 h-3.5 text-emerald-700" />
                                        <span>Eintragen</span>
                                      </button>
                                    )}
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
                    Erstelle dein erstes Rezept für Brot & Kuchen, eine Mahlzeit oder ein Getränk, oder empfange Rezepte per WhatsApp / QR-Code.
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
      </div>
    </div>
  );
};
