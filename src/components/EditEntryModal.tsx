import { useState, useEffect } from 'react';
import { db, type DiaryEntry, type MealType, type EatingReason } from '../db/db';
import { VoiceInputButton } from './VoiceInputButton';
import { X, Trash2, Check, Scale, Flame } from 'lucide-react';
import confetti from 'canvas-confetti';

interface EditEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: DiaryEntry | null;
}

const mealLabels: Record<MealType, { label: string; icon: string }> = {
  breakfast: { label: 'Frühstück', icon: '🥐' },
  lunch: { label: 'Mittagessen', icon: '🍲' },
  dinner: { label: 'Abendessen', icon: '🥗' },
  snack: { label: 'Snack / Nascherei', icon: '🍿' },
};

const reasonOptions: Array<{ id: EatingReason; label: string; icon: string }> = [
  { id: 'hunger', label: 'Hunger', icon: '🟢' },
  { id: 'cravings', label: 'Lust', icon: '🟡' },
  { id: 'stress', label: 'Stress', icon: '🔴' },
  { id: 'social', label: 'Feier', icon: '🟣' },
];

export const EditEntryModal = ({
  isOpen,
  onClose,
  entry,
}: EditEntryModalProps) => {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState<number>(100);
  const [unit, setUnit] = useState('g');
  const [calories, setCalories] = useState<number>(0);
  const [protein, setProtein] = useState<number>(0);
  const [carbs, setCarbs] = useState<number>(0);
  const [fat, setFat] = useState<number>(0);
  const [fiber, setFiber] = useState<number>(0);
  const [sugar, setSugar] = useState<number>(0);
  const [mealType, setMealType] = useState<MealType>('breakfast');
  const [reason, setReason] = useState<EatingReason | undefined>(undefined);

  // Baseline reference to recalculate proportionally when amount changes
  const [baseAmount, setBaseAmount] = useState<number>(100);
  const [baseCalories, setBaseCalories] = useState<number>(0);
  const [baseProtein, setBaseProtein] = useState<number>(0);
  const [baseCarbs, setBaseCarbs] = useState<number>(0);
  const [baseFat, setBaseFat] = useState<number>(0);
  const [baseFiber, setBaseFiber] = useState<number>(0);
  const [baseSugar, setBaseSugar] = useState<number>(0);

  useEffect(() => {
    if (entry) {
      setName(entry.name);
      const amt = entry.amount && entry.amount > 0 ? entry.amount : 100;
      setAmount(amt);
      setUnit(entry.unit || 'g');
      setCalories(entry.calories || 0);
      setProtein(entry.protein || 0);
      setCarbs(entry.carbs || 0);
      setFat(entry.fat || 0);
      setFiber(entry.fiber || 0);
      setSugar(entry.sugar || 0);
      setMealType(entry.mealType);
      setReason(entry.reason);

      setBaseAmount(amt);
      setBaseCalories(entry.calories || 0);
      setBaseProtein(entry.protein || 0);
      setBaseCarbs(entry.carbs || 0);
      setBaseFat(entry.fat || 0);
      setBaseFiber(entry.fiber || 0);
      setBaseSugar(entry.sugar || 0);
    }
  }, [entry, isOpen]);

  if (!isOpen || !entry) return null;

  // Handles updating the weight/amount and recalculating calories & macros proportionally
  const handleAmountChange = (newAmount: number) => {
    const clamped = Math.max(1, newAmount);
    setAmount(clamped);

    if (baseAmount > 0 && baseCalories > 0) {
      const ratio = clamped / baseAmount;
      setCalories(Math.round(baseCalories * ratio));
      setProtein(Math.round(baseProtein * ratio * 10) / 10);
      setCarbs(Math.round(baseCarbs * ratio * 10) / 10);
      setFat(Math.round(baseFat * ratio * 10) / 10);
      setFiber(Math.round(baseFiber * ratio * 10) / 10);
      setSugar(Math.round(baseSugar * ratio * 10) / 10);
    }
  };

  const handleQuickAddGrams = (delta: number) => {
    handleAmountChange(amount + delta);
  };

  const handleQuickAddKcal = (delta: number) => {
    const newKcal = Math.max(0, calories + delta);
    setCalories(newKcal);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entry.id) return;

    try {
      await db.diaryEntries.update(entry.id, {
        name: name.trim() || entry.name,
        amount,
        unit,
        calories: Math.max(0, Number(calories) || 0),
        protein: Math.max(0, Number(protein) || 0),
        carbs: Math.max(0, Number(carbs) || 0),
        fat: Math.max(0, Number(fat) || 0),
        fiber: Math.max(0, Number(fiber) || 0),
        sugar: Math.max(0, Number(sugar) || 0),
        mealType,
        reason,
      });

      confetti({
        particleCount: 30,
        spread: 50,
        origin: { y: 0.7 },
        colors: ['#10B981', '#F59E0B'],
      });

      onClose();
    } catch (err) {
      console.error('Failed to update diary entry:', err);
    }
  };

  const handleDelete = async () => {
    if (!entry.id) return;
    if (window.confirm(`Möchtest du „${entry.name}“ wirklich aus deinem Tagebuch löschen?`)) {
      try {
        await db.diaryEntries.delete(entry.id);
        onClose();
      } catch (err) {
        console.error('Failed to delete diary entry:', err);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-soft-lg border border-stone-100 overflow-hidden max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="p-4 px-6 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center text-lg shrink-0 border border-amber-100">
              ✏️
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-stone-800 text-sm truncate">
                Eintrag nachträglich bearbeiten
              </h3>
              <p className="text-xs text-stone-400">
                Portion anpassen, Kalorien korrigieren oder verschieben
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-500 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSave} className="p-5 overflow-y-auto space-y-5 flex-1">
          
          {/* Item Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Bezeichnung / Zutat
            </label>
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full py-2.5 pl-3.5 pr-10 rounded-2xl border border-stone-200 focus:border-emerald-500 text-sm font-semibold text-stone-800 bg-white"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <VoiceInputButton
                  onTranscript={(text) => setName(text)}
                  currentValue={name}
                  size="xs"
                  title="Bezeichnung per Sprache korrigieren"
                />
              </div>
            </div>
          </div>

          {/* Amount in Grams & Steppers */}
          <div className="p-4 bg-stone-50 rounded-3xl border border-stone-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5 uppercase tracking-wider">
                <Scale className="w-4 h-4 text-emerald-600" />
                <span>Menge ({unit})</span>
              </span>
              <span className="text-[11px] text-stone-500">
                Rechnet Kalorien & Makros automatisch um
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="5000"
                value={amount}
                onChange={(e) => handleAmountChange(Number(e.target.value))}
                className="w-28 py-2 px-3 rounded-2xl border border-stone-200 text-stone-900 font-extrabold text-center text-lg bg-white focus:border-emerald-500"
              />
              <span className="text-sm font-bold text-stone-500">{unit}</span>

              {/* Stepper Buttons */}
              <div className="flex-1 flex gap-1.5 justify-end">
                <button
                  type="button"
                  onClick={() => handleQuickAddGrams(-10)}
                  className="py-1.5 px-2.5 rounded-xl bg-white border border-stone-200 hover:bg-stone-100 text-stone-700 font-bold text-xs"
                >
                  -10g
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAddGrams(-5)}
                  className="py-1.5 px-2.5 rounded-xl bg-white border border-stone-200 hover:bg-stone-100 text-stone-700 font-bold text-xs"
                >
                  -5g
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAddGrams(5)}
                  className="py-1.5 px-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-xs hover:bg-emerald-100"
                >
                  +5g
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAddGrams(10)}
                  className="py-1.5 px-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-xs hover:bg-emerald-100"
                >
                  +10g
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAddGrams(50)}
                  className="py-1.5 px-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-xs hover:bg-emerald-100"
                >
                  +50g
                </button>
              </div>
            </div>

            {/* Range Slider for smooth touch adjustment */}
            <input
              type="range"
              min="5"
              max={Math.max(300, baseAmount * 2.5)}
              step="5"
              value={amount}
              onChange={(e) => handleAmountChange(Number(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
          </div>

          {/* Calories & Macros Custom Fine-Tuning */}
          <div className="p-4 bg-emerald-50/50 rounded-3xl border border-emerald-200/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5 uppercase tracking-wider">
                <Flame className="w-4 h-4 text-amber-500" />
                <span>Kalorien & Makros</span>
              </span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => handleQuickAddKcal(-25)}
                  className="py-1 px-2 rounded-lg bg-white border border-stone-200 text-[11px] font-bold text-stone-700 hover:bg-stone-100"
                >
                  -25
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAddKcal(25)}
                  className="py-1 px-2 rounded-lg bg-white border border-emerald-200 text-[11px] font-bold text-emerald-800 hover:bg-emerald-100"
                >
                  +25
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAddKcal(50)}
                  className="py-1 px-2 rounded-lg bg-white border border-emerald-200 text-[11px] font-bold text-emerald-800 hover:bg-emerald-100"
                >
                  +50
                </button>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-stone-600 block uppercase">Kalorien</span>
                <input
                  type="number"
                  min="0"
                  value={calories}
                  onChange={(e) => setCalories(Number(e.target.value))}
                  className="w-full py-2 px-2 rounded-xl border border-emerald-300 font-black text-center text-sm text-stone-900 bg-white"
                />
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-violet-700 block uppercase">Protein (g)</span>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={protein}
                  onChange={(e) => setProtein(Number(e.target.value))}
                  className="w-full py-2 px-2 rounded-xl border border-stone-200 font-bold text-center text-xs text-stone-800 bg-white"
                />
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-amber-700 block uppercase">Carbs (g)</span>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={carbs}
                  onChange={(e) => setCarbs(Number(e.target.value))}
                  className="w-full py-2 px-2 rounded-xl border border-stone-200 font-bold text-center text-xs text-stone-800 bg-white"
                />
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-cyan-700 block uppercase">Fett (g)</span>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={fat}
                  onChange={(e) => setFat(Number(e.target.value))}
                  className="w-full py-2 px-2 rounded-xl border border-stone-200 font-bold text-center text-xs text-stone-800 bg-white"
                />
              </div>
            </div>

            {/* Extended Nutrients: Fiber & Sugar */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-emerald-200/50">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-emerald-800 block uppercase tracking-wider">
                  🌾 Ballaststoffe (g)
                </span>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={fiber}
                  onChange={(e) => setFiber(Number(e.target.value))}
                  className="w-full py-1.5 px-2 rounded-xl border border-emerald-200 font-bold text-center text-xs text-emerald-950 bg-white"
                />
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-rose-700 block uppercase tracking-wider">
                  🍬 Zucker (g)
                </span>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={sugar}
                  onChange={(e) => setSugar(Number(e.target.value))}
                  className="w-full py-1.5 px-2 rounded-xl border border-rose-200 font-bold text-center text-xs text-rose-950 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Meal Type Move Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Zu welcher Mahlzeit gehört dieser Eintrag?
            </label>
            <div className="grid grid-cols-4 gap-1.5 p-1 bg-stone-100 rounded-2xl">
              {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMealType(m)}
                  className={`py-2 px-1 text-xs font-bold rounded-xl transition-all flex flex-col items-center gap-0.5 ${
                    mealType === m
                      ? 'bg-white text-emerald-800 shadow-xs'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  <span className="text-sm">{mealLabels[m].icon}</span>
                  <span className="text-[10px] truncate">{mealLabels[m].label.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Eating Reason / Motivation */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Warum gegessen? (Ess-Psychologie)
            </label>
            <div className="grid grid-cols-4 gap-2">
              {reasonOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setReason(reason === opt.id ? undefined : opt.id)}
                  className={`py-2 px-2 rounded-2xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    reason === opt.id
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-xs'
                      : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  <span>{opt.icon}</span>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={handleDelete}
              className="py-3 px-4 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition-colors flex items-center gap-1.5 shrink-0"
              title="Eintrag komplett löschen"
            >
              <Trash2 className="w-4 h-4" />
              <span>Löschen</span>
            </button>

            <button
              type="submit"
              className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-soft transition-all flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Änderungen speichern</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
