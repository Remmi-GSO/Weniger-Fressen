import { useState, useMemo } from 'react';
import { db, type EatingReason, type DiaryEntry } from '../db/db';
import { PRESET_SNACKS, type PresetSnack } from '../data/defaultSnacks';
import { X, Check } from 'lucide-react';
import confetti from 'canvas-confetti';

interface SnackModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
}

export const SnackModal = ({
  isOpen,
  onClose,
  selectedDate,
}: SnackModalProps) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'chocolate' | 'cheese' | 'cookies' | 'nuts' | 'sweets' | 'salty' | 'fruit'>('all');
  const [selectedSnackId, setSelectedSnackId] = useState<string>('choc_milk');
  const [amountMultiplier, setAmountMultiplier] = useState<number>(1);
  const [eatingReason, setEatingReason] = useState<EatingReason>('cravings');

  // Custom free-text snack state
  const [isCustomSnack, setIsCustomSnack] = useState<boolean>(false);
  const [customName, setCustomName] = useState<string>('');
  const [customCalories, setCustomCalories] = useState<string>('80');

  // Filter snacks by category
  const filteredSnacks = useMemo(() => {
    if (selectedCategory === 'all') return PRESET_SNACKS;
    return PRESET_SNACKS.filter((s) => s.category === selectedCategory);
  }, [selectedCategory]);

  // Currently active snack
  const activeSnack = useMemo(() => {
    return PRESET_SNACKS.find((s) => s.id === selectedSnackId) || PRESET_SNACKS[0];
  }, [selectedSnackId]);

  if (!isOpen) return null;

  // Computed values for active snack with multiplier
  const effectiveGrams = Math.round(activeSnack.defaultGrams * amountMultiplier);
  const effectiveCalories = Math.round(activeSnack.calories * amountMultiplier);
  const effectiveProtein = Math.round(activeSnack.protein * amountMultiplier * 10) / 10;
  const effectiveCarbs = Math.round(activeSnack.carbs * amountMultiplier * 10) / 10;
  const effectiveFat = Math.round(activeSnack.fat * amountMultiplier * 10) / 10;

  const handleSelectSnack = (snack: PresetSnack) => {
    setSelectedSnackId(snack.id);
    setAmountMultiplier(1);
    setIsCustomSnack(false);
  };

  const handleSaveSnack = async () => {
    if (isCustomSnack) {
      if (!customName.trim()) return;
      const kcal = parseInt(customCalories, 10) || 80;

      const entry: DiaryEntry = {
        date: selectedDate,
        mealType: 'snack',
        name: `🍫 ${customName.trim()} (Nascherei)`,
        calories: kcal,
        protein: 1,
        carbs: Math.round(kcal * 0.12),
        fat: Math.round(kcal * 0.05),
        amount: 1,
        unit: 'Portion',
        reason: eatingReason,
        isSnackNibble: true,
        timestamp: Date.now(),
      };
      await db.diaryEntries.add(entry);
    } else {
      let portionLabel = `${amountMultiplier}x ${activeSnack.defaultServingName}`;
      if (amountMultiplier === 1) {
        portionLabel = `${activeSnack.defaultServingName} (${effectiveGrams}g)`;
      } else {
        portionLabel = `${amountMultiplier}x ${activeSnack.defaultServingName} (${effectiveGrams}g)`;
      }

      const entry: DiaryEntry = {
        date: selectedDate,
        mealType: 'snack',
        name: `${activeSnack.icon} ${activeSnack.name}`,
        calories: effectiveCalories,
        protein: effectiveProtein,
        carbs: effectiveCarbs,
        fat: effectiveFat,
        amount: effectiveGrams,
        unit: portionLabel,
        reason: eatingReason,
        isSnackNibble: true,
        timestamp: Date.now(),
      };
      await db.diaryEntries.add(entry);
    }

    confetti({
      particleCount: 30,
      spread: 50,
      origin: { y: 0.7 },
      colors: ['#F59E0B', '#EC4899', '#8B5CF6'],
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-soft-lg border border-stone-100 overflow-hidden max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="p-4 px-6 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-pink-50 text-pink-600 rounded-xl text-lg">🍫</span>
            <div>
              <h3 className="font-bold text-stone-800 text-base">Nascherei erfassen</h3>
              <p className="text-xs text-stone-400">Schnelles Erfassen von Schokolade, Käse & Co. außerhalb der 3 Mahlzeiten</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* Category Tabs: Schokolade, Käse, Kekse, Nüsse, etc. */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'all', label: 'Alle', icon: '✨' },
              { id: 'chocolate', label: 'Schokolade', icon: '🍫' },
              { id: 'cheese', label: 'Käsehappen', icon: '🧀' },
              { id: 'cookies', label: 'Kekse', icon: '🍪' },
              { id: 'nuts', label: 'Nüsse', icon: '🥜' },
              { id: 'sweets', label: 'Süßes', icon: '🍬' },
              { id: 'salty', label: 'Salziges', icon: '🥔' },
              { id: 'fruit', label: 'Obst', icon: '🍎' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setSelectedCategory(tab.id as any);
                  setIsCustomSnack(false);
                }}
                className={`py-1.5 px-3 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 border ${
                  selectedCategory === tab.id && !isCustomSnack
                    ? 'border-pink-500 bg-pink-50 text-pink-900 shadow-xs'
                    : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}

            <button
              type="button"
              onClick={() => setIsCustomSnack(true)}
              className={`py-1.5 px-3 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 border ${
                isCustomSnack
                  ? 'border-pink-500 bg-pink-50 text-pink-900 shadow-xs'
                  : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
              }`}
            >
              <span>✏️</span>
              <span>Eigenes</span>
            </button>
          </div>

          {/* CUSTOM SNACK FREE-TEXT MODE */}
          {isCustomSnack ? (
            <div className="p-4 bg-pink-50/70 border border-pink-200 rounded-2xl space-y-3">
              <span className="text-xs font-bold text-pink-950 block">Beliebige Nascherei frei eingeben</span>
              <div>
                <label className="text-[11px] font-semibold text-stone-500 block mb-1">Was hast du genascht?</label>
                <input
                  type="text"
                  autoFocus
                  placeholder="z. B. 2 Pralinen, 1 Kugel Vanilleeis, 3 Toffifee..."
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs font-bold text-stone-800"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-stone-500 block mb-1">Geschätzte Kalorien (kcal)</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    step="5"
                    min="10"
                    max="1500"
                    value={customCalories}
                    onChange={(e) => setCustomCalories(e.target.value)}
                    className="w-28 px-3 py-2 rounded-xl border border-stone-200 text-center text-sm font-extrabold text-stone-800"
                  />
                  <div className="flex gap-1">
                    {[50, 80, 120, 180].map((k) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setCustomCalories(String(k))}
                        className="py-1 px-2 rounded-lg border border-stone-200 bg-white text-stone-600 text-xs font-semibold hover:bg-stone-50"
                      >
                        {k} kcal
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* PRESET SNACKS GRID */
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                {filteredSnacks.map((snack) => {
                  const isSelected = snack.id === selectedSnackId;
                  return (
                    <button
                      key={snack.id}
                      type="button"
                      onClick={() => handleSelectSnack(snack)}
                      className={`p-2.5 rounded-2xl border text-left transition-all flex items-center gap-2.5 ${
                        isSelected
                          ? 'border-pink-500 bg-pink-50/90 text-pink-950 shadow-sm ring-2 ring-pink-500/20'
                          : 'border-stone-200 bg-white hover:bg-stone-50 text-stone-700'
                      }`}
                    >
                      <span className="text-2xl shrink-0">{snack.icon}</span>
                      <div className="min-w-0">
                        <span className="text-xs font-bold block truncate">{snack.name}</span>
                        <span className="text-[10px] text-stone-400 block truncate">
                          {snack.defaultServingName} ({snack.calories} kcal)
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* SELECTION DETAIL & QUICK PORTION BUTTONS */}
              <div className="p-4 bg-stone-50 border border-stone-200/80 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-3xl">{activeSnack.icon}</span>
                    <div>
                      <h4 className="font-extrabold text-stone-900 text-sm">{activeSnack.name}</h4>
                      <span className="text-xs font-semibold text-pink-800">
                        Basis: {activeSnack.defaultServingName} ({activeSnack.defaultGrams}g) = {activeSnack.calories} kcal
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Preset Portions for this snack */}
                {activeSnack.presets && activeSnack.presets.length > 0 && (
                  <div>
                    <label className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block mb-1.5">
                      Portion wählen:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      {activeSnack.presets.map((preset, idx) => {
                        const isCurrent = Math.abs(amountMultiplier - preset.multiplier) < 0.05;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setAmountMultiplier(preset.multiplier)}
                            className={`py-2 px-1.5 rounded-xl border text-center transition-all ${
                              isCurrent
                                ? 'border-pink-600 bg-pink-600 text-white font-bold shadow-xs'
                                : 'border-stone-200 bg-white text-stone-700 text-xs font-medium hover:bg-stone-100'
                            }`}
                          >
                            <span className="text-xs block leading-tight">{preset.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Amount Stepper */}
                <div className="flex items-center justify-between pt-2 border-t border-stone-200/70 text-xs">
                  <span className="text-stone-500 font-medium">Stückzahl / Einheiten anpassen:</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setAmountMultiplier(Math.max(0.5, amountMultiplier - (amountMultiplier <= 1 ? 0.5 : 1)))}
                      className="w-8 h-8 rounded-xl bg-white border border-stone-200 hover:bg-stone-100 flex items-center justify-center font-bold text-stone-700"
                    >
                      -
                    </button>
                    <span className="font-extrabold text-stone-900 text-sm min-w-[2.5rem] text-center">
                      {amountMultiplier}x
                    </span>
                    <button
                      type="button"
                      onClick={() => setAmountMultiplier(amountMultiplier + (amountMultiplier < 1 ? 0.5 : 1))}
                      className="w-8 h-8 rounded-xl bg-white border border-stone-200 hover:bg-stone-100 flex items-center justify-center font-bold text-stone-700"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Live Macro & Calorie Result */}
                <div className="p-3 bg-gradient-to-r from-pink-500/10 via-rose-500/5 to-transparent rounded-xl border border-pink-200/80 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-pink-950 block">
                      Genaschte Menge: {effectiveGrams} Gramm
                    </span>
                    <span className="text-[10px] text-stone-500">
                      P: {effectiveProtein}g • K: {effectiveCarbs}g • F: {effectiveFat}g
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-black text-pink-900 leading-none block">
                      +{effectiveCalories} <span className="text-xs font-normal">kcal</span>
                    </span>
                    <span className="text-[10px] text-pink-700 font-medium">Zwischenmahlzeit</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PSYCHOLOGY TAG: WHY DID YOU EAT THIS NIBBLE? */}
          <div className="space-y-1.5 pt-1">
            <label className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block">
              Warum genascht? (Essen-Psychologie)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {[
                { id: 'cravings', label: 'Lust / Heißhunger', icon: '🟡', desc: 'Appetit' },
                { id: 'stress', label: 'Stress / Frust', icon: '🔴', desc: 'Belohnung' },
                { id: 'social', label: 'Couch / Film / Freunde', icon: '🟣', desc: 'Gewohnheit' },
                { id: 'hunger', label: 'Echter Hunger', icon: '🟢', desc: 'Energie' },
              ].map((reason) => (
                <button
                  key={reason.id}
                  type="button"
                  onClick={() => setEatingReason(reason.id as EatingReason)}
                  className={`p-2 rounded-xl border text-center transition-all ${
                    eatingReason === reason.id
                      ? 'border-pink-500 bg-pink-50 text-pink-950 font-bold shadow-xs'
                      : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50 text-xs'
                  }`}
                >
                  <span className="text-sm block">{reason.icon}</span>
                  <span className="text-[11px] font-bold block truncate">{reason.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            type="button"
            onClick={handleSaveSnack}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 active:scale-[0.99] text-white font-bold text-sm shadow-soft transition-all flex items-center justify-center gap-2"
          >
            <Check className="w-5 h-5" />
            <span>
              Nascherei eintragen (+{isCustomSnack ? customCalories : effectiveCalories} kcal)
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
