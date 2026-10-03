import { useState, useEffect } from 'react';
import { db, type MealType, type EatingReason } from '../db/db';
import { type FoodProduct } from '../services/foodApi';
import { X, Plus } from 'lucide-react';
import confetti from 'canvas-confetti';

interface PortionCalculatorModalProps {
  product: FoodProduct | null;
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
  defaultMealType?: MealType;
}

type PortionUnit = 'gram' | 'portion' | 'piece';

export const PortionCalculatorModal = ({
  product,
  isOpen,
  onClose,
  selectedDate,
  defaultMealType = 'lunch',
}: PortionCalculatorModalProps) => {
  if (!isOpen || !product) return null;

  const hasServing = Boolean(product.servingWeightGrams && product.servingWeightGrams > 0);
  const isBreadOrSlice = Boolean(
    product.servingSize?.toLowerCase().includes('scheibe') ||
    product.name.toLowerCase().includes('brot') ||
    product.brand?.toLowerCase().includes('selbstgebacken') ||
    product.source === 'recipe'
  );

  const [unit, setUnit] = useState<PortionUnit>(hasServing ? 'portion' : 'gram');
  const [amount, setAmount] = useState<string>(hasServing ? '1' : '100');
  const [mealType, setMealType] = useState<MealType>(defaultMealType);
  const [reason, setReason] = useState<EatingReason | undefined>(undefined);

  // Sync state whenever selected product or defaultMealType changes
  useEffect(() => {
    if (product) {
      const serves = Boolean(product.servingWeightGrams && product.servingWeightGrams > 0);
      setUnit(serves ? 'portion' : 'gram');
      setAmount(serves ? '1' : '100');
      setMealType(defaultMealType);
      setReason(undefined);
    }
  }, [product, defaultMealType]);

  // Compute actual weight in grams based on chosen unit & amount
  const numericAmount = parseFloat(amount.replace(',', '.')) || 0;
  let effectiveGrams = 100;
  if (unit === 'gram') {
    effectiveGrams = numericAmount;
  } else if (unit === 'portion') {
    const servingGrams = product.servingWeightGrams || 100;
    effectiveGrams = numericAmount * servingGrams;
  } else if (unit === 'piece') {
    const pieceGrams = product.servingWeightGrams || 50;
    effectiveGrams = numericAmount * pieceGrams;
  }

  const multiplier = Math.max(0, effectiveGrams / 100);
  const calculatedKcal = Math.round(product.calories100g * multiplier);
  const calculatedProtein = Math.round(product.protein100g * multiplier * 10) / 10;
  const calculatedCarbs = Math.round(product.carbs100g * multiplier * 10) / 10;
  const calculatedFat = Math.round(product.fat100g * multiplier * 10) / 10;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (calculatedKcal < 0) return;

    // Unit description for diary
    let unitLabel = `${Math.round(effectiveGrams)}g`;
    if (unit === 'portion' && product.servingSize) {
      const portionTitle = isBreadOrSlice ? (numericAmount === 1 ? 'Scheibe' : 'Scheiben') : 'Portion';
      unitLabel = `${numericAmount}x ${portionTitle} (${Math.round(effectiveGrams)}g)`;
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
      });
    } else {
      await db.favoriteItems.add({
        name: product.name,
        calories: product.calories100g,
        protein: product.protein100g,
        carbs: product.carbs100g,
        fat: product.fat100g,
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
              <p className="text-xs text-stone-400">Passe Menge und Mahlzeit an</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          
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
                {isBreadOrSlice ? '🍞' : '🥗'}
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

          {/* Unit Selector */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-stone-400 block mb-1.5">
              Einheit wählen
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setUnit('gram');
                  setAmount('100');
                }}
                className={`py-2 px-3 rounded-2xl border text-xs font-bold transition-all ${
                  unit === 'gram'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-sm'
                    : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                }`}
              >
                Gramm (g / ml)
              </button>

              {hasServing ? (
                <button
                  type="button"
                  onClick={() => {
                    setUnit('portion');
                    setAmount('1');
                  }}
                  className={`py-2 px-3 rounded-2xl border text-xs font-bold transition-all ${
                    unit === 'portion'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-sm'
                      : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  {isBreadOrSlice ? `Scheibe (${product.servingWeightGrams}g)` : `Portion (${product.servingWeightGrams}g)`}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setUnit('piece');
                    setAmount('1');
                  }}
                  className={`py-2 px-3 rounded-2xl border text-xs font-bold transition-all ${
                    unit === 'piece'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-sm'
                      : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  Stück (~50g)
                </button>
              )}
            </div>
          </div>

          {/* Quantity Input + Fast Presets */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                Menge ({unit === 'gram' ? 'Gramm' : isBreadOrSlice ? 'Scheiben' : 'Portionen'})
              </label>
              {unit !== 'gram' && (
                <span className="text-xs text-stone-500 font-medium">
                  = {Math.round(effectiveGrams)} Gramm
                </span>
              )}
            </div>

            <div className="relative">
              <input
                type="number"
                step={unit === 'gram' ? '1' : '0.1'}
                min="0.1"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full text-center text-3xl font-extrabold py-2.5 px-4 rounded-2xl border border-stone-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 text-stone-800"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">
                {unit === 'gram' ? 'g' : isBreadOrSlice ? 'Sch.' : 'Port.'}
              </span>
            </div>

            {/* Quick Presets */}
            <div className="flex gap-1.5 mt-2">
              {unit === 'gram'
                ? [50, 100, 150, 200, 250].map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setAmount(String(g))}
                      className="flex-1 py-1 rounded-xl border border-stone-200 text-xs font-semibold text-stone-600 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200 transition-all active:scale-95"
                    >
                      {g}g
                    </button>
                  ))
                : (isBreadOrSlice ? [1, 2, 3, 4] : [0.5, 1, 1.5, 2]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setAmount(String(p))}
                      className="flex-1 py-1 rounded-xl border border-stone-200 text-xs font-semibold text-stone-600 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200 transition-all active:scale-95"
                    >
                      {p}{isBreadOrSlice ? (p === 1 ? ' Sch.' : ' Sch.') : 'x'}
                    </button>
                  ))}
            </div>
          </div>

          {/* Live Calculated Nutritional Values Card */}
          <div className="p-4 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent rounded-2xl border border-emerald-100 text-center space-y-2">
            <div>
              <span className="text-3xl font-black text-stone-800">{calculatedKcal}</span>
              <span className="text-sm font-semibold text-stone-500 ml-1.5">kcal</span>
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
          </div>

          {/* Meal Selection */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-stone-400 block mb-2">
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
              Warum isst du? (1-Tap)
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
                  className={`py-2 px-3 rounded-2xl border text-xs font-semibold transition-all flex items-center gap-1.5 ${
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
            <Plus className="w-5 h-5" />
            <span>{calculatedKcal} kcal ins Tagebuch eintragen</span>
          </button>
        </form>
      </div>
    </div>
  );
};
