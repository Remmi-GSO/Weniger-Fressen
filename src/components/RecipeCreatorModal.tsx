import { useState, useMemo, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type RecipeIngredient, type CustomRecipe, type MealType } from '../db/db';
import { ALL_LOCAL_FOODS, searchFoodProducts, type FoodProduct } from '../services/foodApi';
import { getPortionPresets } from '../utils/portionPresets';
import { VoiceInputButton } from './VoiceInputButton';
import { BarcodeScannerModal } from './BarcodeScannerModal';
import { X, Trash2, Plus, Minus, Loader2, Star, Barcode, Check } from 'lucide-react';
import confetti from 'canvas-confetti';

interface RecipeCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRecipeSaved?: (recipe: CustomRecipe) => void;
  defaultMealType?: MealType;
  initialCategory?: 'bread' | 'meal' | 'snack';
}

const BREAD_STAPLES: Array<{ name: string; grams: number; icon: string }> = [
  { name: 'Dinkelmehl Type 630', grams: 500, icon: '🌾' },
  { name: 'Wasser (Leitungswasser)', grams: 350, icon: '💧' },
  { name: 'Sauerteig / Anstellgut (Roggen/Dinkel)', grams: 100, icon: '🍞' },
  { name: 'Rapsöl', grams: 20, icon: '🧈' },
  { name: 'Hefe (frisch / Hefewürfel)', grams: 10, icon: '🥖' },
  { name: 'Speisesalz / Meersalz', grams: 10, icon: '🧂' },
  { name: 'Sonnenblumenkerne', grams: 50, icon: '🌻' },
  { name: 'Dinkelvollkornmehl', grams: 250, icon: '🌾' },
];

const MEAL_STAPLES: Array<{ name: string; grams: number; icon: string }> = [
  { name: 'Rapsöl', grams: 15, icon: '🧈' },
  { name: 'Olivenöl (nativ extra)', grams: 15, icon: '🫒' },
  { name: 'Butter', grams: 20, icon: '🧈' },
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
}: RecipeCreatorModalProps) => {
  const [name, setName] = useState(initialCategory === 'meal' ? 'Mein Gericht' : 'Unser selbstgebackenes Brot');
  const [category, setCategory] = useState<'bread' | 'meal' | 'snack'>(initialCategory);
  
  // Ingredients list
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>(
    initialCategory === 'meal'
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

  // Favorites from local database
  const favoriteItems = useLiveQuery(() => db.favoriteItems.orderBy('useCount').reverse().limit(20).toArray()) || [];

  // Portion presets for the currently selected ingredient
  const ingredientPresets = useMemo(() => {
    return getPortionPresets(selectedFood);
  }, [selectedFood]);

  // Loaf / Dish weights & Portions
  const [customBakedWeight, setCustomBakedWeight] = useState<string>('');
  const [sliceWeight, setSliceWeight] = useState<string>(initialCategory === 'meal' ? '250' : '50');

  // Debounced search combining local verified items (all supermarket brands & staples) and online OpenFoodFacts
  useEffect(() => {
    const q = ingredientQuery.trim().toLowerCase();
    if (!q || q.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const queryTokens = q.split(/\s+/).filter(Boolean);
    const localMatches = ALL_LOCAL_FOODS.filter((item) => {
      const nameLower = item.name.toLowerCase();
      const brandLower = (item.brand || '').toLowerCase();
      return queryTokens.every((token) => nameLower.includes(token) || brandLower.includes(token));
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

  // Baked/Cooked weight: if not manually specified, bread loses ~12%, cooked meals lose ~5% to steam
  const effectiveBakedWeight = useMemo(() => {
    const manual = parseFloat(customBakedWeight);
    if (manual && manual > 0) return manual;
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
  const numSliceWeight = parseFloat(sliceWeight) || (category === 'bread' ? 50 : 250);
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
      calories100g: staple.name.includes('öl') ? 884 : staple.name.includes('mehl') ? 345 : 0,
      protein100g: 0,
      carbs100g: 0,
      fat100g: 0,
      source: 'local' as const,
    };
    handleSelectFood(found, staple.grams);
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
      servingName: category === 'bread' ? '1 Scheibe' : '1 Portion',
      servingWeightGrams: numSliceWeight,
      calories100g: caloriesPer100g,
      protein100g: proteinPer100g,
      carbs100g: carbsPer100g,
      fat100g: fatPer100g,
      createdAt: Date.now(),
    };

    const id = await db.recipes.add(recipe);
    recipe.id = id;

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

    if (onRecipeSaved) {
      onRecipeSaved(recipe);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-soft-lg border border-stone-100 overflow-hidden max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="p-4 px-6 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`p-2 rounded-xl text-lg ${category === 'bread' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
              {category === 'bread' ? '🍞' : '🍲'}
            </span>
            <div>
              <h3 className="font-bold text-stone-800 text-base">
                {category === 'bread' ? 'Eigenes Brot berechnen' : 'Eigenes Gericht / Rezept berechnen'}
              </h3>
              <p className="text-xs text-stone-400">
                {category === 'bread'
                  ? 'Exakte Scheiben- & 100g-Werte aus Zutaten ermitteln'
                  : 'Exakte Portions- & 100g-Werte aus Zutaten ermitteln'}
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

        <form onSubmit={handleSaveRecipe} className="p-5 sm:p-6 overflow-y-auto space-y-5">
          
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
                  placeholder={category === 'bread' ? 'z. B. Unser Dinkel-Sauerteigbrot' : 'z. B. Kürbissuppe, Rindergulasch, Gemüsecurry'}
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
                  if (name === 'Mein Gericht') setName('Unser selbstgebackenes Brot');
                  if (sliceWeight === '250') setSliceWeight('50');
                }}
                className={`flex-1 py-1.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                  category === 'bread'
                    ? 'border-amber-500 bg-amber-50 text-amber-900 shadow-sm'
                    : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                }`}
              >
                🍞 Brot & Gebäck
              </button>
              <button
                type="button"
                onClick={() => {
                  setCategory('meal');
                  if (name === 'Unser selbstgebackenes Brot') setName('Mein Gericht');
                  if (sliceWeight === '50') setSliceWeight('250');
                }}
                className={`flex-1 py-1.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                  category === 'meal'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-sm'
                    : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                }`}
              >
                🍲 Gekochtes Gericht / Mahlzeit
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
                      >
                        🔍 Suche
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
                          handleAddIngredient();
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

                  {/* 1. SEARCH RESULTS LIST */}
                  {searchResults.length > 0 && !selectedFood && (
                    <div className="bg-white border border-stone-200 rounded-2xl shadow-soft-lg divide-y divide-stone-100 max-h-56 overflow-y-auto">
                      {searchResults.map((f) => (
                        <div
                          key={f.id}
                          onClick={() => handleSelectFood(f)}
                          className="p-2.5 text-xs hover:bg-emerald-50 cursor-pointer flex justify-between items-center transition-colors"
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
                          <span className="text-emerald-700 font-extrabold text-xs shrink-0">
                            {f.calories100g} kcal <span className="text-[10px] font-normal text-stone-400">/100g</span>
                          </span>
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
                        Beliebte Zutaten (1-Tap):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {(category === 'bread' ? BREAD_STAPLES : MEAL_STAPLES).map((s) => (
                          <button
                            key={s.name}
                            type="button"
                            onClick={() => handleSelectStaple(s)}
                            className="px-2.5 py-1 bg-white hover:bg-emerald-50 active:scale-95 border border-stone-200 hover:border-emerald-300 text-stone-700 hover:text-emerald-900 rounded-xl text-xs font-medium transition-all shadow-2xs flex items-center gap-1"
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
            category === 'bread'
              ? 'bg-amber-50/70 border-amber-200/80 text-amber-900'
              : 'bg-emerald-50/70 border-emerald-200/80 text-emerald-900'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider">
                {category === 'bread' ? '🍞 Gebackenes Brotgewicht' : '🍲 Gekochtes Gesamtgewicht'}
              </span>
              <span className="text-xs font-black">
                {effectiveBakedWeight} g fertig
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[10px] font-bold block mb-0.5 opacity-70">
                  {category === 'bread' ? 'Gebackenes Gewicht (g)' : 'Fertiges Gewicht (g)'}
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
                  {category === 'bread' ? 'Gewicht pro Scheibe (g)' : 'Gewicht pro Portion (g)'}
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
                  {category === 'bread' ? '1 Scheibe Brot' : '1 Portion'} ({numSliceWeight}g)
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
            className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm shadow-soft transition-all flex items-center justify-center gap-2"
          >
            <span>Rezept dauerhaft speichern</span>
            <span>({caloriesPerSlice} kcal / {category === 'bread' ? 'Scheibe' : 'Portion'})</span>
          </button>
        </form>

        {/* Barcode Scanner Modal for Ingredients */}
        <BarcodeScannerModal
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          onProductFound={(product) => {
            setIsScannerOpen(false);
            handleSelectFood(product);
          }}
        />
      </div>
    </div>
  );
};
