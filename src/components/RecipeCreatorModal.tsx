import { useState, useMemo } from 'react';
import { db, type RecipeIngredient, type CustomRecipe, type MealType } from '../db/db';
import { ALL_LOCAL_FOODS, type FoodProduct } from '../services/foodApi';
import { X, Trash2, Scale, Sparkles, Check } from 'lucide-react';
import confetti from 'canvas-confetti';

interface RecipeCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRecipeSaved?: (recipe: CustomRecipe) => void;
  defaultMealType?: MealType;
  initialCategory?: 'bread' | 'meal' | 'snack';
}

export const RecipeCreatorModal = ({
  isOpen,
  onClose,
  onRecipeSaved,
  initialCategory = 'bread',
}: RecipeCreatorModalProps) => {
  const [name, setName] = useState('Unser selbstgebackenes Brot');
  const [category, setCategory] = useState<'bread' | 'meal' | 'snack'>(initialCategory);
  
  // Ingredients list
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([
    { name: 'Dinkelmehl Type 630', amountGrams: 500, calories: 1725, protein: 65, carbs: 345, fat: 6.5 },
    { name: 'Wasser (Leitungswasser)', amountGrams: 350, calories: 0, protein: 0, carbs: 0, fat: 0 },
    { name: 'Sauerteig / Anstellgut (Roggen/Dinkel)', amountGrams: 100, calories: 130, protein: 4.5, carbs: 25, fat: 0.6 },
    { name: 'Speisesalz / Meersalz', amountGrams: 10, calories: 0, protein: 0, carbs: 0, fat: 0 },
  ]);

  // Ingredient picker search
  const [ingredientQuery, setIngredientQuery] = useState('');
  const [selectedFood, setSelectedFood] = useState<FoodProduct | null>(null);
  const [ingredientGrams, setIngredientGrams] = useState('50');

  // Loaf weights & Slices
  const [customBakedWeight, setCustomBakedWeight] = useState<string>('');
  const [sliceWeight, setSliceWeight] = useState<string>('50'); // 50g per slice

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

  // Baked weight: if not manually specified, bread typically loses ~12% weight during baking
  const effectiveBakedWeight = useMemo(() => {
    const manual = parseFloat(customBakedWeight);
    if (manual && manual > 0) return manual;
    return Math.round(totalRawWeight * (category === 'bread' ? 0.88 : 1.0));
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
  const numSliceWeight = parseFloat(sliceWeight) || 50;
  const sliceMultiplier = numSliceWeight / 100;
  const caloriesPerSlice = Math.round(caloriesPer100g * sliceMultiplier);
  const proteinPerSlice = Math.round(proteinPer100g * sliceMultiplier * 10) / 10;
  const carbsPerSlice = Math.round(carbsPer100g * sliceMultiplier * 10) / 10;
  const fatPerSlice = Math.round(fatPer100g * sliceMultiplier * 10) / 10;

  // Search filter for ingredient picker
  const filteredFoods = useMemo(() => {
    if (!ingredientQuery.trim() || ingredientQuery.trim().length < 2) return [];
    const q = ingredientQuery.toLowerCase();
    return ALL_LOCAL_FOODS.filter((f) => f.name.toLowerCase().includes(q) || (f.brand || '').toLowerCase().includes(q)).slice(0, 6);
  }, [ingredientQuery]);

  if (!isOpen) return null;

  const handleAddIngredient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFood) return;
    const grams = parseFloat(ingredientGrams) || 100;
    const mult = grams / 100;

    const newIng: RecipeIngredient = {
      name: selectedFood.name,
      amountGrams: grams,
      calories: Math.round(selectedFood.calories100g * mult),
      protein: Math.round(selectedFood.protein100g * mult * 10) / 10,
      carbs: Math.round(selectedFood.carbs100g * mult * 10) / 10,
      fat: Math.round(selectedFood.fat100g * mult * 10) / 10,
    };

    setIngredients([...ingredients, newIng]);
    setSelectedFood(null);
    setIngredientQuery('');
    setIngredientGrams('50');
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

    // Also add to favoriteItems so it's directly accessible in the diary search
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
            <span className="p-2 bg-amber-50 text-amber-600 rounded-xl text-lg">🍞</span>
            <div>
              <h3 className="font-bold text-stone-800 text-base">Eigenes Brot / Rezept berechnen</h3>
              <p className="text-xs text-stone-400">Aus Zutaten exakte Scheiben- & 100g-Werte ermitteln</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSaveRecipe} className="p-6 overflow-y-auto space-y-6">
          
          {/* Recipe Name & Category */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-stone-500 block mb-1">
                Name deines Rezepts *
              </label>
              <input
                type="text"
                required
                placeholder="z. B. Unser Dinkel-Sauerteigbrot"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl border border-stone-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-bold text-stone-800 text-sm"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCategory('bread')}
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
                onClick={() => setCategory('meal')}
                className={`flex-1 py-1.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                  category === 'meal'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-sm'
                    : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                }`}
              >
                🍲 Gekochtes Gericht
              </button>
            </div>
          </div>

          {/* Zutaten-Liste */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Zutaten ({ingredients.length})
              </label>
              <span className="text-xs font-bold text-stone-600">
                Rohgewicht: {totalRawWeight} g
              </span>
            </div>

            {/* List of existing ingredients */}
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

            {/* Add ingredient sub-form */}
            <div className="p-3 bg-white border border-stone-200 rounded-2xl space-y-2">
              <span className="text-xs font-bold text-stone-700 block">Zutat hinzufügen</span>
              
              <div className="relative">
                <input
                  type="text"
                  placeholder="Zutat suchen (z. B. Dinkelvollkornmehl, Hefe, Sonnenblumenkerne)..."
                  value={ingredientQuery}
                  onChange={(e) => setIngredientQuery(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:border-emerald-500"
                />

                {filteredFoods.length > 0 && !selectedFood && (
                  <div className="absolute top-full left-0 right-0 z-10 bg-white border border-stone-200 rounded-xl mt-1 shadow-lg divide-y divide-stone-100 max-h-44 overflow-y-auto">
                    {filteredFoods.map((f) => (
                      <div
                        key={f.id}
                        onClick={() => {
                          setSelectedFood(f);
                          setIngredientQuery(f.name);
                        }}
                        className="p-2 text-xs hover:bg-emerald-50 cursor-pointer flex justify-between"
                      >
                        <span className="font-bold text-stone-800">{f.name}</span>
                        <span className="text-stone-400">{f.calories100g} kcal / 100g</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedFood && (
                <div className="flex gap-2 items-center pt-1">
                  <div className="flex-1 relative">
                    <input
                      type="number"
                      step="1"
                      min="1"
                      placeholder="Menge in g"
                      value={ingredientGrams}
                      onChange={(e) => setIngredientGrams(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-stone-200 text-xs font-bold text-center"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-stone-400">Gramm</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddIngredient}
                    className="py-1.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all"
                  >
                    + Hinzufügen
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* BACKGEWICHT & SCHEIBEN-KALKULATION */}
          <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
              <Scale className="w-4 h-4 text-amber-600" />
              <span>Backverlust & Scheibengewicht</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-xs text-amber-900 block mb-1">
                  Gebackener Laib (Endgewicht)
                </span>
                <div className="relative">
                  <input
                    type="number"
                    step="1"
                    placeholder={`ca. ${effectiveBakedWeight}`}
                    value={customBakedWeight}
                    onChange={(e) => setCustomBakedWeight(e.target.value)}
                    className="w-full py-2 px-3 rounded-xl border border-amber-200 bg-white font-bold text-stone-800 text-xs text-center"
                  />
                  <span className="text-[10px] text-stone-400 block text-center mt-0.5">
                    {customBakedWeight ? 'Exakt gewogen' : 'ca. 12% Backverlust'}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-xs text-amber-900 block mb-1">
                  Gewicht 1 typische Scheibe
                </span>
                <div className="relative">
                  <input
                    type="number"
                    step="1"
                    min="10"
                    max="200"
                    required
                    value={sliceWeight}
                    onChange={(e) => setSliceWeight(e.target.value)}
                    className="w-full py-2 px-3 rounded-xl border border-amber-200 bg-white font-bold text-stone-800 text-xs text-center"
                  />
                  <span className="text-[10px] text-stone-400 block text-center mt-0.5">
                    Ergibt ca. {Math.round(effectiveBakedWeight / numSliceWeight)} Scheiben
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Slice Weight buttons */}
            <div className="flex gap-1.5 pt-1">
              {[40, 50, 55, 60, 70].map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setSliceWeight(String(w))}
                  className={`flex-1 py-1 rounded-lg border text-[11px] font-semibold transition-all ${
                    numSliceWeight === w
                      ? 'border-amber-600 bg-amber-600 text-white'
                      : 'border-amber-200 bg-white text-amber-800 hover:bg-amber-100'
                  }`}
                >
                  {w}g
                </button>
              ))}
            </div>
          </div>

          {/* DAS LIVE ERGEBNIS: PRO 100g UND PRO SCHEIBE */}
          <div className="p-4 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent rounded-2xl border border-emerald-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                Berechnetes Nährwertprofil
              </span>
              <span className="text-xs font-extrabold text-emerald-700 bg-white px-2 py-0.5 rounded-full border border-emerald-200">
                1 Scheibe ({numSliceWeight}g) = {caloriesPerSlice} kcal
              </span>
            </div>

            {/* Per Slice Highlight */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white/90 p-2 rounded-xl text-center shadow-card border border-stone-100">
                <span className="text-[10px] text-violet-600 font-bold block uppercase">Protein</span>
                <span className="text-sm font-black text-stone-800">{proteinPerSlice} g</span>
                <span className="text-[9px] text-stone-400 block">pro Scheibe</span>
              </div>
              <div className="bg-white/90 p-2 rounded-xl text-center shadow-card border border-stone-100">
                <span className="text-[10px] text-amber-600 font-bold block uppercase">Carbs</span>
                <span className="text-sm font-black text-stone-800">{carbsPerSlice} g</span>
                <span className="text-[9px] text-stone-400 block">pro Scheibe</span>
              </div>
              <div className="bg-white/90 p-2 rounded-xl text-center shadow-card border border-stone-100">
                <span className="text-[10px] text-cyan-600 font-bold block uppercase">Fett</span>
                <span className="text-sm font-black text-stone-800">{fatPerSlice} g</span>
                <span className="text-[9px] text-stone-400 block">pro Scheibe</span>
              </div>
            </div>

            <div className="text-center text-[11px] text-stone-500 pt-1">
              Vergleich pro 100g gebackenes Brot: <span className="font-bold text-stone-700">{caloriesPer100g} kcal</span> • P: {proteinPer100g}g • K: {carbsPer100g}g • F: {fatPer100g}g
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!name.trim() || ingredients.length === 0}
            className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] disabled:opacity-50 text-white font-bold text-sm shadow-soft transition-all flex items-center justify-center gap-2"
          >
            <Check className="w-5 h-5" />
            <span>Rezept speichern & bereitstellen</span>
          </button>
        </form>
      </div>
    </div>
  );
};
