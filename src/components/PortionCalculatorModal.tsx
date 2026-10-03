import { useState, useEffect, useMemo } from 'react';
import { db, type MealType, type EatingReason } from '../db/db';
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
  const isBreadOrSlice = Boolean(
    product?.servingSize?.toLowerCase().includes('scheibe') ||
    product?.name?.toLowerCase().includes('brot') ||
    product?.brand?.toLowerCase().includes('selbstgebacken') ||
    product?.source === 'recipe'
  );

  // Compute available intuitive portion presets for this specific food
  const presets = useMemo(() => getPortionPresets(product), [product]);
  const defaultPreset = useMemo(() => {
    return presets.find((p) => p.isDefault) || presets[0] || null;
  }, [presets]);

  // Mode: 'preset' (Klein/Mittel/Groß, Scheibe, etc.) or 'custom_grams' (Küchenwaage)
  const [mode, setMode] = useState<'preset' | 'custom_grams'>('preset');
  const [selectedPreset, setSelectedPreset] = useState<PortionPreset | null>(defaultPreset);
  const [quantity, setQuantity] = useState<number>(1);
  const [customGrams, setCustomGrams] = useState<string>('100');
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
      setCustomGrams(def ? String(def.grams) : (product.servingWeightGrams ? String(product.servingWeightGrams) : '100'));
      setMealType(defaultMealType);
      setReason(undefined);
    }
  }, [product, defaultMealType]);

  if (!isOpen || !product) return null;

  // Calculate effective weight in grams
  let effectiveGrams = 100;
  if (mode === 'preset' && selectedPreset) {
    effectiveGrams = Math.max(1, selectedPreset.grams * quantity);
  } else {
    effectiveGrams = Math.max(1, parseFloat(customGrams.replace(',', '.')) || 100);
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
    if (mode === 'preset' && selectedPreset) {
      unitLabel = `${quantity}x ${selectedPreset.label} (${Math.round(effectiveGrams)}g)`;
    }

    // 1. Add to diary entries
    await db.diaryEntries.add({
      date: selectedDate,
      mealType,
      name: product.name + (product.brand ? ` (${product.brand})` : ''),
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

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-soft-lg border border-stone-100 overflow-hidden max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="p-4 px-6 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl text-lg">⚖️</span>
            <div>
              <h3 className="font-bold text-stone-800 text-base">Portionsrechner</h3>
              <p className="text-xs text-stone-400">Schnell & ohne Waage eintragen</p>
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
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-14 h-14 object-contain rounded-xl bg-white p-1 border border-stone-200/60 shrink-0"
              />
            ) : (
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl shrink-0 ${
                isBreadOrSlice ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100/60 text-emerald-800'
              }`}>
                {selectedPreset?.icon || (isBreadOrSlice ? '🍞' : '🥗')}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-stone-800 text-sm truncate">{product.name}</h4>
              {product.brand && (
                <span className="text-xs text-stone-400 block truncate">{product.brand}</span>
              )}
              <span className="text-[11px] text-emerald-700 font-semibold mt-0.5 block">
                {product.calories100g} kcal <span className="text-stone-400 font-normal">/ 100g</span>
              </span>
            </div>
          </div>

          {/* MODE SELECTOR (Portionsgrößen vs Exakte Gramm) */}
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
              className="text-xs text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 hover:underline"
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

          {/* 1. PRESET MODE (Klein, Mittel, Groß, Scheibe, etc.) */}
          {mode === 'preset' && (
            <div className="space-y-3">
              {/* Portion Chips Grid */}
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
                      className={`p-2.5 rounded-2xl border text-left transition-all relative ${
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

              {/* Quantity Stepper: [-] 1x [ + ] */}
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
                    className="w-9 h-9 rounded-xl bg-white border border-stone-200 hover:bg-stone-100 text-stone-700 font-bold flex items-center justify-center text-base shadow-2xs active:scale-95 transition-all"
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
                    className="w-9 h-9 rounded-xl bg-white border border-stone-200 hover:bg-stone-100 text-stone-700 font-bold flex items-center justify-center text-base shadow-2xs active:scale-95 transition-all"
                    title="Mehr"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Quick Stepper Shortcuts: 0.5x, 1x, 1.5x, 2x */}
              <div className="flex gap-1.5">
                {[0.5, 1, 1.5, 2, 3].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setQuantity(val)}
                    className={`flex-1 py-1 rounded-xl border text-xs font-bold transition-all ${
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

          {/* 2. CUSTOM GRAMS MODE (Kitchen scale) */}
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

              {/* Quick Gram Presets */}
              <div className="flex gap-1.5">
                {[25, 50, 100, 150, 200, 250].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setCustomGrams(String(g))}
                    className="flex-1 py-1 rounded-xl border border-stone-200 text-xs font-semibold text-stone-600 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200 transition-all active:scale-95"
                  >
                    {g}g
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Live Calculated Nutritional Values Card */}
          <div className="p-3.5 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent rounded-2xl border border-emerald-100 text-center space-y-2">
            <div>
              <span className="text-3xl font-black text-stone-800">{calculatedKcal}</span>
              <span className="text-sm font-semibold text-stone-500 ml-1.5">kcal</span>
              <span className="text-xs text-stone-400 ml-2">({Math.round(effectiveGrams)}g)</span>
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
                  className={`py-2 px-1 rounded-2xl border text-center transition-all ${
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
                  className={`py-1.5 px-2.5 rounded-xl border text-xs font-semibold transition-all flex items-center gap-1.5 ${
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
            className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-sm shadow-soft transition-all flex items-center justify-center gap-2"
          >
            <Check className="w-5 h-5" />
            <span>In {mealLabels[mealType]} eintragen ({calculatedKcal} kcal)</span>
          </button>
        </form>
      </div>
    </div>
  );
};
