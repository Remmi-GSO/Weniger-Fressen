import { useState, useEffect, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type MealType, type EatingReason, type CustomRecipe } from '../db/db';
import { type FoodProduct } from '../services/foodApi';
import { getPortionPresets, type PortionPreset } from '../utils/portionPresets';
import { estimateFiber, estimateSugar } from '../utils/nutrientEstimator';
import { X, Plus, Minus, Scale, Check } from 'lucide-react';
import confetti from 'canvas-confetti';

interface PortionCalculatorModalProps {
  product: FoodProduct | null;
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
  defaultMealType?: MealType;
}

export const PortionCalculatorModal = ({
  product,
  isOpen,
  onClose,
  selectedDate,
  defaultMealType = 'lunch',
}: PortionCalculatorModalProps) => {
  // Try retrieving the underlying CustomRecipe from db if it's a saved recipe
  const recipeId = product?.id?.startsWith('recipe-')
    ? parseInt(product.id.replace('recipe-', ''), 10)
    : undefined;

  const dbRecipe = useLiveQuery(
    () => (recipeId ? db.recipes.get(recipeId) : product?.name ? db.recipes.where({ name: product.name }).first() : undefined),
    [recipeId, product?.name]
  );

  const recipe = (product?.recipeData as CustomRecipe | undefined) || dbRecipe;

  // Recipe classification
  const isRecipe = Boolean(product?.source === 'recipe' || recipe || product?.id?.startsWith('recipe-'));
  const effectiveCategory = recipe?.category || product?.recipeCategory || (
    (product?.name || '').toLowerCase().includes('brot') ? 'bread' :
    (product?.name || '').toLowerCase().includes('shake') || (product?.name || '').toLowerCase().includes('smoothie') ? 'drink' :
    'meal'
  );

  const isBread = isRecipe
    ? (effectiveCategory === 'bread' || (product?.name || '').toLowerCase().includes('brot'))
    : Boolean(
        product?.servingSize?.toLowerCase().includes('scheibe') ||
        product?.name?.toLowerCase().includes('brot') ||
        product?.brand?.toLowerCase().includes('selbstgebacken')
      );

  const isDrink = isRecipe ? effectiveCategory === 'drink' : false;
  const isDish = isRecipe && !isBread && !isDrink;

  // Total dish weight
  const totalDishWeight = Math.round(
    recipe?.cookedWeight ||
    product?.cookedWeight ||
    product?.totalDishWeight ||
    recipe?.totalRawWeight ||
    product?.totalRawWeight ||
    product?.servingWeightGrams ||
    1000
  );
  const rawDishWeight = recipe?.totalRawWeight || product?.totalRawWeight;

  // Compute available intuitive portion presets for standard foods
  const presets = useMemo(() => getPortionPresets(product), [product]);
  const defaultPreset = useMemo(() => {
    return presets.find((p) => p.isDefault) || presets[0] || null;
  }, [presets]);

  // States
  // For dishes:
  const [dishMode, setDishMode] = useState<'fraction' | 'grams'>('fraction');
  const [selectedFraction, setSelectedFraction] = useState<number>(1 / 3);
  const [customFractionDenom, setCustomFractionDenom] = useState<string>('');

  // For bread recipes:
  const [breadMode, setBreadMode] = useState<'preset' | 'grams'>('preset');
  const [breadOption, setBreadOption] = useState<'slice' | 'half_loaf' | 'full_loaf'>('slice');
  const [sliceCount, setSliceCount] = useState<number>(1);

  // For drink recipes:
  const [drinkMode, setDrinkMode] = useState<'preset' | 'grams'>('preset');
  const [drinkOption, setDrinkOption] = useState<'glass' | 'mug' | 'half' | 'full'>('glass');

  // For standard foods / manual scale:
  const [mode, setMode] = useState<'preset' | 'custom_grams'>('preset');
  const [selectedPreset, setSelectedPreset] = useState<PortionPreset | null>(defaultPreset);
  const [quantity, setQuantity] = useState<number>(1);
  const [customGrams, setCustomGrams] = useState<string>('100');

  // Shared form state
  const [mealType, setMealType] = useState<MealType>(defaultMealType);
  const [reason, setReason] = useState<EatingReason | undefined>(undefined);

  // Sync state whenever selected product or defaultMealType changes
  useEffect(() => {
    if (product) {
      const pList = getPortionPresets(product);
      const def = pList.find((p) => p.isDefault) || pList[0] || null;
      setSelectedPreset(def);
      setMode('preset');
      setQuantity(1);

      // Reset dish defaults: 1/3 Drittel
      setSelectedFraction(1 / 3);
      setCustomFractionDenom('');
      setDishMode('fraction');

      // Reset bread defaults: 1 Scheibe
      setBreadOption('slice');
      setSliceCount(1);
      setBreadMode('preset');

      // Reset drink defaults: 1 Glas
      setDrinkOption('glass');
      setDrinkMode('preset');

      // Reset grams default
      const defaultG = Math.round(totalDishWeight / 3);
      setCustomGrams(defaultG > 0 ? String(defaultG) : def ? String(def.grams) : '100');

      setMealType(defaultMealType);
      setReason(undefined);
    }
  }, [product, defaultMealType, totalDishWeight]);

  if (!isOpen || !product) return null;

  // Calculate effective weight in grams
  let effectiveGrams = 100;

  if (isDish) {
    if (dishMode === 'fraction') {
      const parsedDenom = parseFloat(customFractionDenom);
      if (parsedDenom && parsedDenom > 0) {
        effectiveGrams = Math.max(1, Math.round(totalDishWeight / parsedDenom));
      } else {
        effectiveGrams = Math.max(1, Math.round(totalDishWeight * selectedFraction));
      }
    } else {
      effectiveGrams = Math.max(1, parseFloat(customGrams.replace(',', '.')) || 100);
    }
  } else if (isBread && isRecipe) {
    if (breadMode === 'preset') {
      const sliceG = recipe?.servingWeightGrams || product?.servingWeightGrams || 50;
      if (breadOption === 'full_loaf') {
        effectiveGrams = totalDishWeight;
      } else if (breadOption === 'half_loaf') {
        effectiveGrams = Math.round(totalDishWeight / 2);
      } else {
        effectiveGrams = Math.max(1, sliceG * sliceCount);
      }
    } else {
      effectiveGrams = Math.max(1, parseFloat(customGrams.replace(',', '.')) || 100);
    }
  } else if (isDrink && isRecipe) {
    if (drinkMode === 'preset') {
      if (drinkOption === 'full') {
        effectiveGrams = totalDishWeight;
      } else if (drinkOption === 'half') {
        effectiveGrams = Math.round(totalDishWeight / 2);
      } else if (drinkOption === 'mug') {
        effectiveGrams = 350;
      } else {
        effectiveGrams = 250;
      }
    } else {
      effectiveGrams = Math.max(1, parseFloat(customGrams.replace(',', '.')) || 100);
    }
  } else {
    // Normal food or non-recipe bread
    if (mode === 'preset' && selectedPreset) {
      effectiveGrams = Math.max(1, selectedPreset.grams * quantity);
    } else {
      effectiveGrams = Math.max(1, parseFloat(customGrams.replace(',', '.')) || 100);
    }
  }

  const multiplier = Math.max(0, effectiveGrams / 100);
  const calculatedKcal = Math.round(product.calories100g * multiplier);
  const calculatedProtein = Math.round(product.protein100g * multiplier * 10) / 10;
  const calculatedCarbs = Math.round(product.carbs100g * multiplier * 10) / 10;
  const calculatedFat = Math.round(product.fat100g * multiplier * 10) / 10;
  const calculatedFiber = (product.fiber100g !== undefined && product.fiber100g > 0)
    ? Math.round(product.fiber100g * multiplier * 10) / 10
    : estimateFiber(product.name, effectiveGrams, calculatedKcal);
  const calculatedSugar = product.sugar100g !== undefined
    ? Math.round(product.sugar100g * multiplier * 10) / 10
    : estimateSugar(product.name, effectiveGrams, calculatedCarbs);

  const mealLabels: Record<MealType, string> = {
    breakfast: 'Frühstück',
    lunch: 'Mittagessen',
    dinner: 'Abendessen',
    snack: 'Snacks',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (calculatedKcal < 0) return;

    // Descriptive unit label for diary
    let unitLabel = `${Math.round(effectiveGrams)}g`;

    if (isDish) {
      if (dishMode === 'fraction') {
        const parsedDenom = parseFloat(customFractionDenom);
        if (parsedDenom && parsedDenom > 0) {
          unitLabel = `1/${parsedDenom} Portion (${Math.round(effectiveGrams)}g)`;
        } else if (Math.abs(selectedFraction - 1) < 0.02) {
          unitLabel = `Ganze Portion (${Math.round(effectiveGrams)}g)`;
        } else if (Math.abs(selectedFraction - 0.5) < 0.02) {
          unitLabel = `1/2 Portion (${Math.round(effectiveGrams)}g)`;
        } else if (Math.abs(selectedFraction - 1 / 3) < 0.02) {
          unitLabel = `1/3 Portion (${Math.round(effectiveGrams)}g)`;
        } else if (Math.abs(selectedFraction - 0.25) < 0.02) {
          unitLabel = `1/4 Portion (${Math.round(effectiveGrams)}g)`;
        } else if (Math.abs(selectedFraction - 0.2) < 0.02) {
          unitLabel = `1/5 Portion (${Math.round(effectiveGrams)}g)`;
        } else if (Math.abs(selectedFraction - 1 / 6) < 0.02) {
          unitLabel = `1/6 Portion (${Math.round(effectiveGrams)}g)`;
        } else {
          unitLabel = `Portion (${Math.round(effectiveGrams)}g)`;
        }
      } else {
        unitLabel = `${Math.round(effectiveGrams)}g (ca. ${Math.round((effectiveGrams / totalDishWeight) * 100)}% d. Rezepts)`;
      }
    } else if (isBread && isRecipe) {
      if (breadMode === 'preset') {
        if (breadOption === 'full_loaf') {
          unitLabel = `Ganzer Laib (${Math.round(effectiveGrams)}g)`;
        } else if (breadOption === 'half_loaf') {
          unitLabel = `1/2 Laib (${Math.round(effectiveGrams)}g)`;
        } else {
          unitLabel = sliceCount === 1 ? `1 Scheibe (${Math.round(effectiveGrams)}g)` : `${sliceCount} Scheiben (${Math.round(effectiveGrams)}g)`;
        }
      } else {
        unitLabel = `${Math.round(effectiveGrams)}g`;
      }
    } else if (isDrink && isRecipe) {
      if (drinkMode === 'preset') {
        if (drinkOption === 'full') {
          unitLabel = `Ganze Menge (${Math.round(effectiveGrams)}ml)`;
        } else if (drinkOption === 'half') {
          unitLabel = `Halbe Menge (${Math.round(effectiveGrams)}ml)`;
        } else if (drinkOption === 'mug') {
          unitLabel = `1 Becher (${Math.round(effectiveGrams)}ml)`;
        } else {
          unitLabel = `1 Glas (${Math.round(effectiveGrams)}ml)`;
        }
      } else {
        unitLabel = `${Math.round(effectiveGrams)}ml`;
      }
    } else if (mode === 'preset' && selectedPreset) {
      unitLabel = `${quantity}x ${selectedPreset.label} (${Math.round(effectiveGrams)}g)`;
    }

    const entryName = isRecipe
      ? `${product.name} (Selbstgemacht)`
      : product.name + (product.brand ? ` (${product.brand})` : '');

    // 1. Add to diary entries
    await db.diaryEntries.add({
      date: selectedDate,
      mealType,
      name: entryName,
      calories: calculatedKcal,
      protein: calculatedProtein,
      carbs: calculatedCarbs,
      fat: calculatedFat,
      fiber: calculatedFiber,
      sugar: calculatedSugar,
      amount: Math.round(effectiveGrams),
      unit: unitLabel,
      barcode: product.barcode,
      reason,
      timestamp: Date.now(),
    });

    // 2. Upsert into favoriteItems for quick re-use
    const existingFav = await db.favoriteItems.where({ name: product.name }).first();
    if (existingFav && existingFav.id !== undefined) {
      await db.favoriteItems.update(existingFav.id, {
        useCount: existingFav.useCount + 1,
        calories: product.calories100g,
        protein: product.protein100g,
        carbs: product.carbs100g,
        fat: product.fat100g,
        fiber: product.fiber100g,
        sugar: product.sugar100g,
      });
    } else {
      await db.favoriteItems.add({
        name: product.name,
        calories: product.calories100g,
        protein: product.protein100g,
        carbs: product.carbs100g,
        fat: product.fat100g,
        fiber: product.fiber100g,
        sugar: product.sugar100g,
        defaultAmount: Math.round(effectiveGrams),
        defaultUnit: unitLabel,
        useCount: 1,
      });
    }

    confetti({
      particleCount: 25,
      spread: 50,
      origin: { y: 0.8 },
      colors: ['#10B981', '#34D399', '#6EE7B7'],
      disableForReducedMotion: true,
    });

    onClose();
  };

  const sliceWeight = recipe?.servingWeightGrams || product?.servingWeightGrams || 50;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-soft-lg border border-stone-100 overflow-hidden max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="p-4 px-6 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl text-lg">
              {isDrink ? '🥤' : isBread ? '🍞' : isDish ? '🥘' : '⚖️'}
            </span>
            <div>
              <h3 className="font-bold text-stone-800 text-base">
                {isDish ? 'Gericht protokollieren' : isBread ? 'Brot protokollieren' : 'Portionsrechner'}
              </h3>
              <p className="text-xs text-stone-400">
                {isDish ? 'Bruchteil (z. B. 1/3) oder Gramm wählen' : 'Schnell & ohne Waage eintragen'}
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

        <form onSubmit={handleSubmit} noValidate className="p-5 sm:p-6 overflow-y-auto space-y-4">
          
          {/* Product Overview Card */}
          <div className="flex items-center gap-3.5 p-3.5 bg-stone-50/80 rounded-2xl border border-stone-100">
            {product.imageUrl || recipe?.imageUrl ? (
              <img
                src={product.imageUrl || recipe?.imageUrl}
                alt={product.name}
                className="w-14 h-14 object-cover rounded-xl bg-white border border-stone-200/60 shrink-0"
              />
            ) : (
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl shrink-0 ${
                isDrink ? 'bg-blue-100 text-blue-800' : isBread ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100/60 text-emerald-800'
              }`}>
                {isDrink ? '🥤' : isBread ? '🍞' : isDish ? '🍲' : (selectedPreset?.icon || '🥗')}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-stone-800 text-sm truncate">{product.name}</h4>
              <span className="text-xs text-stone-500 block truncate">
                {isDish
                  ? `Selbstgekocht • ${totalDishWeight}g gekocht`
                  : isBread && isRecipe
                  ? `Selbstgebacken • ${totalDishWeight}g Laib`
                  : isDrink && isRecipe
                  ? `Selbstgemacht • ${totalDishWeight}ml`
                  : product.brand || 'Lebensmittel'}
              </span>
              <span className="text-[11px] text-emerald-700 font-semibold mt-0.5 block">
                {product.calories100g} kcal <span className="text-stone-400 font-normal">/ 100g</span>
              </span>
            </div>
          </div>

          {/* DEDICATED RECIPE INFO BOX (Transparent Cooked Amount) */}
          {isRecipe && (
            <div className="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-3 space-y-1 text-left">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                  <span>{isDrink ? '🥤' : isBread ? '🍞' : '🍳'}</span>
                  <span>
                    {isBread
                      ? 'Gebackener Brotlaib'
                      : isDrink
                      ? 'Gesamtmenge Getränk'
                      : 'Gesamtmenge fertig gekocht'}
                  </span>
                </span>
                <span className="text-xs font-black text-amber-950 bg-amber-200/90 px-2 py-0.5 rounded-full">
                  {totalDishWeight} {isDrink ? 'ml' : 'g'}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-amber-900/80 pt-0.5 font-medium">
                <span>
                  {rawDishWeight && rawDishWeight !== totalDishWeight
                    ? `Rohgewicht: ${rawDishWeight}${isDrink ? 'ml' : 'g'} • Garverlust: ${Math.round((1 - totalDishWeight / rawDishWeight) * 100)}%`
                    : '100% Topf / Pfanne'}
                </span>
                <span className="font-semibold text-amber-950">
                  Basis: {product.calories100g} kcal / 100g
                </span>
              </div>
            </div>
          )}

          {/* 1. COOKED DISHES (Pfanne, Topf, Auflauf, etc.) */}
          {isDish ? (
            <div className="space-y-3">
              {/* Mode switcher: Bruchteile vs Küchenwaage */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                  {dishMode === 'fraction' ? 'Portionsgröße wählen' : 'Exakte Küchenwaage'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (dishMode === 'fraction') {
                      setDishMode('grams');
                      setCustomGrams(String(Math.round(effectiveGrams)));
                    } else {
                      setDishMode('fraction');
                    }
                  }}
                  className="text-xs text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                >
                  {dishMode === 'fraction' ? (
                    <>
                      <Scale className="w-3.5 h-3.5" />
                      <span>Auf Küchenwaage (g) wechseln</span>
                    </>
                  ) : (
                    <>
                      <span>🥧 Zu Bruchteilen (1/3, 1/2...) wechseln</span>
                    </>
                  )}
                </button>
              </div>

              {dishMode === 'fraction' ? (
                <div className="space-y-2.5">
                  {/* Fraction Chips Grid: 1/3, 1/2, 1/4, 1/1, 1/5, 1/6 */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: '1/3 Drittel', fraction: 1 / 3, subtitle: '1 von 3 Teilen', icon: '⅓' },
                      { label: '1/2 Halb', fraction: 0.5, subtitle: 'Halbe Pfanne', icon: '½' },
                      { label: '1/4 Viertel', fraction: 0.25, subtitle: '1 von 4 Teilen', icon: '¼' },
                      { label: '1/1 Ganz', fraction: 1, subtitle: 'Ganze Pfanne', icon: '1' },
                      { label: '1/5 Fünftel', fraction: 0.2, subtitle: '1 von 5 Teilen', icon: '⅕' },
                      { label: '1/6 Sechstel', fraction: 1 / 6, subtitle: '1 von 6 Teilen', icon: '⅙' },
                    ].map((item) => {
                      const isSel = Math.abs(selectedFraction - item.fraction) < 0.015 && !customFractionDenom;
                      const itemGrams = Math.round(totalDishWeight * item.fraction);
                      const itemKcal = Math.round(product.calories100g * (itemGrams / 100));

                      return (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => {
                            setSelectedFraction(item.fraction);
                            setCustomFractionDenom('');
                          }}
                          className={`p-2.5 rounded-2xl border text-left transition-all relative cursor-pointer ${
                            isSel
                              ? 'border-emerald-500 bg-emerald-50/90 shadow-sm ring-2 ring-emerald-500/20'
                              : 'border-stone-200 bg-white hover:bg-stone-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black px-1.5 py-0.5 rounded-md bg-stone-100 text-stone-700">
                              {item.icon}
                            </span>
                            <span className="text-[11px] font-black text-emerald-800 bg-emerald-100/70 px-1.5 py-0.5 rounded-lg">
                              ~{itemKcal} kcal
                            </span>
                          </div>
                          <div className="mt-1 font-bold text-stone-800 text-xs">
                            {item.label}
                          </div>
                          <div className="text-[10px] text-stone-400 font-medium">
                            ca. {itemGrams}g
                          </div>
                          {isSel && (
                            <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-600"></div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom Fraction: 1 von [ X ] Portionen */}
                  <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/70 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <span className="text-[11px] text-stone-400 font-semibold block uppercase tracking-wider">
                        Eigener Bruchteil
                      </span>
                      <span className="text-xs font-bold text-stone-700 block">
                        1 von wie vielen Portionen gegessen?
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-xs font-bold text-stone-500">1 /</span>
                      <div className="flex items-center gap-1 bg-white border border-stone-200 rounded-xl px-2.5 py-1">
                        <input
                          type="number"
                          min="1"
                          max="50"
                          step="1"
                          placeholder="z.B. 3"
                          value={customFractionDenom}
                          onChange={(e) => {
                            setCustomFractionDenom(e.target.value);
                            const parsed = parseFloat(e.target.value);
                            if (parsed && parsed > 0) {
                              setSelectedFraction(1 / parsed);
                            }
                          }}
                          className="w-12 text-center text-xs font-bold text-stone-800 outline-none"
                        />
                        <span className="text-[10px] text-stone-400">Teile</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Kitchen scale for dish */
                <div className="space-y-2">
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      min="1"
                      max="10000"
                      required
                      value={customGrams}
                      onChange={(e) => setCustomGrams(e.target.value)}
                      className="w-full text-center text-3xl font-extrabold py-2.5 px-4 rounded-2xl border border-stone-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 text-stone-800"
                      autoFocus
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">
                      Gramm (g)
                    </span>
                  </div>

                  <div className="text-center text-xs text-stone-500">
                    Entspricht ca. <strong className="text-emerald-700">{Math.round((effectiveGrams / totalDishWeight) * 100)}%</strong> des Rezepts ({totalDishWeight}g gesamt)
                  </div>

                  <div className="flex gap-1.5">
                    {[
                      Math.round(totalDishWeight / 4),
                      Math.round(totalDishWeight / 3),
                      Math.round(totalDishWeight / 2),
                      totalDishWeight,
                    ].map((g, idx) => {
                      const labels = ['1/4', '1/3', '1/2', 'Ganz'];
                      return (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setCustomGrams(String(g))}
                          className="flex-1 py-1 rounded-xl border border-stone-200 text-xs font-semibold text-stone-600 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200 transition-all active:scale-95 cursor-pointer"
                        >
                          {labels[idx]} ({g}g)
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : isBread && isRecipe ? (
            /* 2. HOMEMADE BREAD RECIPES (Scheiben & Laib) */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                  {breadMode === 'preset' ? 'Scheiben oder Laib wählen' : 'Exakte Küchenwaage'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (breadMode === 'preset') {
                      setBreadMode('grams');
                      setCustomGrams(String(Math.round(effectiveGrams)));
                    } else {
                      setBreadMode('preset');
                    }
                  }}
                  className="text-xs text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                >
                  {breadMode === 'preset' ? (
                    <>
                      <Scale className="w-3.5 h-3.5" />
                      <span>Auf Küchenwaage (g) wechseln</span>
                    </>
                  ) : (
                    <>
                      <span>🍞 Zu Scheiben wechseln</span>
                    </>
                  )}
                </button>
              </div>

              {breadMode === 'preset' ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setBreadOption('slice');
                        setSliceCount(1);
                      }}
                      className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                        breadOption === 'slice' && sliceCount === 1
                          ? 'border-emerald-500 bg-emerald-50/90 ring-2 ring-emerald-500/20'
                          : 'border-stone-200 bg-white hover:bg-stone-50'
                      }`}
                    >
                      <span className="text-sm">🍞</span>
                      <div className="font-bold text-stone-800 text-xs mt-1">1 Scheibe</div>
                      <div className="text-[10px] text-stone-400">ca. {sliceWeight}g</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setBreadOption('slice');
                        setSliceCount(2);
                      }}
                      className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                        breadOption === 'slice' && sliceCount === 2
                          ? 'border-emerald-500 bg-emerald-50/90 ring-2 ring-emerald-500/20'
                          : 'border-stone-200 bg-white hover:bg-stone-50'
                      }`}
                    >
                      <span className="text-sm">🍞</span>
                      <div className="font-bold text-stone-800 text-xs mt-1">2 Scheiben</div>
                      <div className="text-[10px] text-stone-400">ca. {sliceWeight * 2}g</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setBreadOption('half_loaf');
                      }}
                      className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                        breadOption === 'half_loaf'
                          ? 'border-emerald-500 bg-emerald-50/90 ring-2 ring-emerald-500/20'
                          : 'border-stone-200 bg-white hover:bg-stone-50'
                      }`}
                    >
                      <span className="text-sm">🥖</span>
                      <div className="font-bold text-stone-800 text-xs mt-1">1/2 Laib</div>
                      <div className="text-[10px] text-stone-400">ca. {Math.round(totalDishWeight / 2)}g</div>
                    </button>
                  </div>

                  {/* Slice Stepper */}
                  <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/70 flex items-center justify-between gap-3">
                    <div>
                      <span className="text-[11px] text-stone-400 font-semibold block uppercase tracking-wider">
                        Scheibenanzahl
                      </span>
                      <span className="text-xs font-bold text-stone-800 block">
                        {sliceCount}x Scheibe à {sliceWeight}g ({sliceCount * sliceWeight}g)
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setBreadOption('slice');
                          setSliceCount((c) => Math.max(1, c - 1));
                        }}
                        className="w-9 h-9 rounded-xl bg-white border border-stone-200 hover:bg-stone-100 text-stone-700 font-bold flex items-center justify-center text-base shadow-2xs active:scale-95 cursor-pointer"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-extrabold text-base text-stone-800">
                        {sliceCount}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setBreadOption('slice');
                          setSliceCount((c) => c + 1);
                        }}
                        className="w-9 h-9 rounded-xl bg-white border border-stone-200 hover:bg-stone-100 text-stone-700 font-bold flex items-center justify-center text-base shadow-2xs active:scale-95 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Kitchen scale for bread */
                <div className="space-y-2">
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      min="1"
                      max="5000"
                      required
                      value={customGrams}
                      onChange={(e) => setCustomGrams(e.target.value)}
                      className="w-full text-center text-3xl font-extrabold py-2.5 px-4 rounded-2xl border border-stone-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 text-stone-800"
                      autoFocus
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">
                      Gramm (g)
                    </span>
                  </div>
                  <div className="flex gap-1.5">
                    {[sliceWeight, sliceWeight * 2, sliceWeight * 3, Math.round(totalDishWeight / 2)].map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setCustomGrams(String(g))}
                        className="flex-1 py-1 rounded-xl border border-stone-200 text-xs font-semibold text-stone-600 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200 transition-all active:scale-95 cursor-pointer"
                      >
                        {g}g
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : isDrink && isRecipe ? (
            /* 3. DRINK RECIPES */
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'glass' as const, label: '1 Glas', grams: 250, icon: '🥤' },
                  { id: 'mug' as const, label: '1 großer Becher', grams: 350, icon: '🥤' },
                  { id: 'half' as const, label: 'Halbe Menge (1/2)', grams: Math.round(totalDishWeight / 2), icon: '🥤' },
                  { id: 'full' as const, label: 'Ganze Menge (1/1)', grams: totalDishWeight, icon: '🥤' },
                ].map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setDrinkOption(d.id)}
                    className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      drinkOption === d.id
                        ? 'border-emerald-500 bg-emerald-50/90 ring-2 ring-emerald-500/20'
                        : 'border-stone-200 bg-white hover:bg-stone-50'
                    }`}
                  >
                    <span className="text-sm">{d.icon}</span>
                    <div className="font-bold text-stone-800 text-xs mt-1">{d.label}</div>
                    <div className="text-[10px] text-stone-400">ca. {d.grams}ml</div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* 4. STANDARD FOODS (Banane, Joghurt, Brot-Marken, etc.) */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                  {mode === 'preset' ? 'Portionsgröße wählen' : 'Exaktes Gewicht'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (mode === 'preset') {
                      setMode('custom_grams');
                      setCustomGrams(String(Math.round(effectiveGrams)));
                    } else {
                      setMode('preset');
                    }
                  }}
                  className="text-xs text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                >
                  {mode === 'preset' ? (
                    <>
                      <Scale className="w-3.5 h-3.5" />
                      <span>Auf Küchenwaage (g) wechseln</span>
                    </>
                  ) : (
                    <>
                      <span>🍌 Zu Portionsgrößen wechseln</span>
                    </>
                  )}
                </button>
              </div>

              {mode === 'preset' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    {presets.map((p) => {
                      const isSelected = selectedPreset?.id === p.id;
                      const pKcal = Math.round(product.calories100g * (p.grams / 100));
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setSelectedPreset(p);
                          }}
                          className={`p-2.5 rounded-2xl border text-left transition-all relative cursor-pointer ${
                            isSelected
                              ? 'border-emerald-500 bg-emerald-50/90 shadow-sm ring-2 ring-emerald-500/20'
                              : 'border-stone-200 bg-white hover:bg-stone-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm">{p.icon || '🥗'}</span>
                            <span className="text-[11px] font-black text-emerald-800 bg-emerald-100/70 px-1.5 py-0.5 rounded-lg">
                              ~{pKcal} kcal
                            </span>
                          </div>
                          <div className="mt-1 font-bold text-stone-800 text-xs truncate">
                            {p.label}
                          </div>
                          {p.subtitle && (
                            <div className="text-[10px] text-stone-400 font-medium">
                              {p.subtitle}
                            </div>
                          )}
                          {isSelected && (
                            <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-600"></div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Quantity Stepper */}
                  <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/70 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <span className="text-[11px] text-stone-400 font-semibold block uppercase tracking-wider">
                        Anzahl
                      </span>
                      <span className="text-xs font-bold text-stone-800 truncate block">
                        {quantity}x {selectedPreset?.label || 'Portion'} ({Math.round(effectiveGrams)}g)
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => Math.max(0.5, q > 1 ? q - 1 : q === 1 ? 0.5 : 0.5))}
                        className="w-9 h-9 rounded-xl bg-white border border-stone-200 hover:bg-stone-100 text-stone-700 font-bold flex items-center justify-center text-base shadow-2xs active:scale-95 transition-all cursor-pointer"
                        title="Weniger"
                      >
                        <Minus className="w-4 h-4" />
                      </button>

                      <span className="w-10 text-center font-extrabold text-base text-stone-800">
                        {quantity}
                      </span>

                      <button
                        type="button"
                        onClick={() => setQuantity((q) => q + (q < 1 ? 0.5 : 1))}
                        className="w-9 h-9 rounded-xl bg-white border border-stone-200 hover:bg-stone-100 text-stone-700 font-bold flex items-center justify-center text-base shadow-2xs active:scale-95 transition-all cursor-pointer"
                        title="Mehr"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-1.5">
                    {[0.5, 1, 1.5, 2, 3].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setQuantity(val)}
                        className={`flex-1 py-1 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          quantity === val
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-2xs'
                            : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                        }`}
                      >
                        {val}x
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {mode === 'custom_grams' && (
                <div className="space-y-2">
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      min="1"
                      max="5000"
                      required
                      value={customGrams}
                      onChange={(e) => setCustomGrams(e.target.value)}
                      className="w-full text-center text-3xl font-extrabold py-2.5 px-4 rounded-2xl border border-stone-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 text-stone-800"
                      autoFocus
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">
                      Gramm (g)
                    </span>
                  </div>

                  <div className="flex gap-1.5">
                    {[25, 50, 100, 150, 200, 250].map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setCustomGrams(String(g))}
                        className="flex-1 py-1 rounded-xl border border-stone-200 text-xs font-semibold text-stone-600 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200 transition-all active:scale-95 cursor-pointer"
                      >
                        {g}g
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Live Calculated Nutritional Values Card */}
          <div className="p-3.5 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent rounded-2xl border border-emerald-100 text-center space-y-2">
            <div>
              <span className="text-3xl font-black text-stone-800">{calculatedKcal}</span>
              <span className="text-sm font-semibold text-stone-500 ml-1.5">kcal</span>
              <span className="text-xs text-stone-400 ml-2">({Math.round(effectiveGrams)}{isDrink ? 'ml' : 'g'})</span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-emerald-200/50">
              <div className="bg-white/80 p-1.5 rounded-xl shadow-card">
                <span className="text-[10px] font-bold text-violet-600 uppercase block">Protein</span>
                <span className="text-xs font-bold text-stone-800">{calculatedProtein}g</span>
              </div>
              <div className="bg-white/80 p-1.5 rounded-xl shadow-card">
                <span className="text-[10px] font-bold text-amber-600 uppercase block">Carbs</span>
                <span className="text-xs font-bold text-stone-800">{calculatedCarbs}g</span>
              </div>
              <div className="bg-white/80 p-1.5 rounded-xl shadow-card">
                <span className="text-[10px] font-bold text-cyan-600 uppercase block">Fett</span>
                <span className="text-xs font-bold text-stone-800">{calculatedFat}g</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
              <div className="bg-white/70 py-1 px-2 rounded-lg flex items-center justify-between">
                <span className="text-emerald-800 font-semibold flex items-center gap-1">🌾 Ballaststoffe</span>
                <span className="font-bold text-stone-800">{calculatedFiber}g</span>
              </div>
              <div className="bg-white/70 py-1 px-2 rounded-lg flex items-center justify-between">
                <span className="text-rose-700 font-semibold flex items-center gap-1">🍬 Zucker</span>
                <span className="font-bold text-stone-800">{calculatedSugar}g</span>
              </div>
            </div>
          </div>

          {/* Meal Selection */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-stone-400 block mb-1.5">
              Zu welcher Mahlzeit?
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { type: 'breakfast' as MealType, label: 'Früh', icon: '🥐' },
                { type: 'lunch' as MealType, label: 'Mittag', icon: '🍲' },
                { type: 'dinner' as MealType, label: 'Abend', icon: '🥗' },
                { type: 'snack' as MealType, label: 'Snack', icon: '🍎' },
              ].map((m) => (
                <button
                  key={m.type}
                  type="button"
                  onClick={() => setMealType(m.type)}
                  className={`py-2 px-1 rounded-2xl border text-center transition-all cursor-pointer ${
                    mealType === m.type
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-800 font-bold shadow-sm'
                      : 'border-stone-100 text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  <div className="text-lg">{m.icon}</div>
                  <div className="text-[11px] mt-0.5">{m.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Essens-Psychologie (optional) */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-stone-400 block mb-1.5">
              Warum isst du? (optional)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'hunger' as EatingReason, label: 'Echter Hunger', color: 'border-emerald-200 text-emerald-700', active: 'border-emerald-500 bg-emerald-500 text-white', icon: '🟢' },
                { key: 'cravings' as EatingReason, label: 'Appetit & Gelüste', color: 'border-amber-200 text-amber-700', active: 'border-amber-500 bg-amber-500 text-white', icon: '🟡' },
                { key: 'stress' as EatingReason, label: 'Stress & Frust', color: 'border-rose-200 text-rose-700', active: 'border-rose-500 bg-rose-500 text-white', icon: '🔴' },
                { key: 'social' as EatingReason, label: 'Gemeinschaft & Feier', color: 'border-purple-200 text-purple-700', active: 'border-purple-500 bg-purple-500 text-white', icon: '🟣' },
              ].map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setReason(reason === opt.key ? undefined : opt.key)}
                  className={`py-1.5 px-2.5 rounded-xl border text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    reason === opt.key ? opt.active : `bg-white ${opt.color}`
                  }`}
                >
                  <span>{opt.icon}</span>
                  <span className="truncate">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-sm shadow-soft transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Check className="w-5 h-5" />
            <span>In {mealLabels[mealType]} eintragen ({calculatedKcal} kcal)</span>
          </button>
        </form>
      </div>
    </div>
  );
};
