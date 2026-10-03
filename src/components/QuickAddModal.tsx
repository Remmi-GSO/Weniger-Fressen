import { useState, useEffect } from 'react';
import { db, type MealType, type EatingReason } from '../db/db';
import { VoiceInputButton } from './VoiceInputButton';
import { X, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import confetti from 'canvas-confetti';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string; // YYYY-MM-DD
  defaultMealType?: MealType;
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({
  isOpen,
  onClose,
  selectedDate,
  defaultMealType = 'lunch',
}) => {
  const [mealType, setMealType] = useState<MealType>(defaultMealType);
  const [name, setName] = useState('');
  const [calories, setCalories] = useState<string>('');
  const [showMacros, setShowMacros] = useState(false);
  const [protein, setProtein] = useState<string>('');
  const [carbs, setCarbs] = useState<string>('');
  const [fat, setFat] = useState<string>('');
  const [reason, setReason] = useState<EatingReason | undefined>(undefined);

  // Sync defaultMealType when modal opens
  useEffect(() => {
    if (defaultMealType) setMealType(defaultMealType);
  }, [defaultMealType, isOpen]);

  const handleVoiceTranscript = (text: string) => {
    if (!text) return;
    // Check if calories was spoken e.g. "350 Kalorien Schoko-Muffin" or "Apfel 80 kcal"
    const kcalMatch = text.match(/(\d+)\s*(?:kcal|kalorien|kalorie|cal)\b/i);
    if (kcalMatch) {
      setCalories(kcalMatch[1]);
      const cleaned = text.replace(kcalMatch[0], '').replace(/\s+/g, ' ').trim();
      if (cleaned) {
        setName(cleaned);
      }
    } else if (/^\d+$/.test(text.trim())) {
      // Just a number was spoken
      setCalories(text.trim());
    } else {
      setName(text);
    }
  };

  if (!isOpen) return null;

  const handleQuickPreset = (amount: number) => {
    const current = Number(calories) || 0;
    setCalories(String(current + amount));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const kcal = Number(calories);
    if (!kcal || kcal <= 0) return;

    const defaultNames: Record<MealType, string> = {
      breakfast: 'Frühstück',
      lunch: 'Mittagessen',
      dinner: 'Abendessen',
      snack: 'Snack',
    };

    await db.diaryEntries.add({
      date: selectedDate,
      mealType,
      name: name.trim() || defaultNames[mealType],
      calories: kcal,
      protein: Number(protein) || 0,
      carbs: Number(carbs) || 0,
      fat: Number(fat) || 0,
      reason,
      timestamp: Date.now(),
    });

    // Subtly trigger micro confetti
    confetti({
      particleCount: 20,
      spread: 45,
      origin: { y: 0.8 },
      colors: ['#10B981', '#34D399', '#6EE7B7'],
      disableForReducedMotion: true,
    });

    // Reset & close
    setName('');
    setCalories('');
    setProtein('');
    setCarbs('');
    setFat('');
    setReason(undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-soft-lg border border-stone-100 overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="p-4 px-6 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl text-lg">⚡</span>
            <div>
              <h3 className="font-bold text-stone-800 text-base">Schnelleintrag</h3>
              <p className="text-xs text-stone-400">In 3 Sekunden Kalorien loggen</p>
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
          
          {/* Meal Type Selector */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-stone-400 block mb-2">Mahlzeit</label>
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
                  <div className="text-xs mt-0.5">{m.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Calorie input + quick preset buttons */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-stone-400">Kalorien (kcal) *</label>
              <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full text-[10px] font-bold">
                <span>Einsprechen:</span>
                <VoiceInputButton
                  onTranscript={handleVoiceTranscript}
                  size="xs"
                  title="Kalorien oder Speise einsprechen (z. B. '350 Kalorien Nudeln')"
                />
              </div>
            </div>
            <div className="relative">
              <input
                type="number"
                step="1"
                min="1"
                required
                autoFocus
                placeholder="0"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                className="w-full text-center text-3xl font-extrabold py-3 px-4 rounded-2xl border border-stone-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 text-stone-800"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-stone-400">kcal</span>
            </div>

            {/* Quick buttons */}
            <div className="flex gap-2 mt-2">
              {[100, 200, 350, 500].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleQuickPreset(val)}
                  className="flex-1 py-1.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-all active:scale-95"
                >
                  +{val}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-stone-400 block mb-1">Bezeichnung (optional)</label>
            <div className="relative">
              <input
                type="text"
                placeholder="z. B. Haferbrei mit Beeren, Cappuccino..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 rounded-2xl border border-stone-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-sm text-stone-800"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <VoiceInputButton
                  onTranscript={(text) => setName(text)}
                  currentValue={name}
                  size="xs"
                  title="Bezeichnung per Sprache einsprechen"
                />
              </div>
            </div>
          </div>

          {/* Warum gegessen? (Psychologie-Tracker) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-stone-400">Warum isst du? (1-Tap)</label>
              <span className="text-[10px] text-emerald-600 font-medium">Lerne dein Essverhalten kennen</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'hunger' as EatingReason, label: 'Echter Hunger', color: 'border-emerald-200 text-emerald-700 hover:bg-emerald-50', active: 'border-emerald-500 bg-emerald-500 text-white', icon: '🟢' },
                { key: 'cravings' as EatingReason, label: 'Appetit & Gelüste', color: 'border-amber-200 text-amber-700 hover:bg-amber-50', active: 'border-amber-500 bg-amber-500 text-white', icon: '🟡' },
                { key: 'stress' as EatingReason, label: 'Stress & Frust', color: 'border-rose-200 text-rose-700 hover:bg-rose-50', active: 'border-rose-500 bg-rose-500 text-white', icon: '🔴' },
                { key: 'social' as EatingReason, label: 'Gemeinschaft & Feier', color: 'border-purple-200 text-purple-700 hover:bg-purple-50', active: 'border-purple-500 bg-purple-500 text-white', icon: '🟣' },
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

          {/* Optional Macros Dropdown */}
          <div className="border-t border-stone-100 pt-3">
            <button
              type="button"
              onClick={() => setShowMacros(!showMacros)}
              className="w-full flex items-center justify-between text-xs font-semibold text-stone-500 hover:text-stone-700 py-1"
            >
              <span>Optionale Makros angeben (Protein, Carbs, Fett)</span>
              {showMacros ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showMacros && (
              <div className="grid grid-cols-3 gap-2 mt-3 animate-in fade-in duration-150">
                <div>
                  <span className="text-[10px] font-bold text-violet-600 uppercase block mb-1">Protein</span>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      placeholder="0"
                      value={protein}
                      onChange={(e) => setProtein(e.target.value)}
                      className="w-full py-2 px-3 rounded-xl border border-stone-200 text-sm font-semibold text-center focus:border-violet-500"
                    />
                    <span className="text-[10px] text-stone-400 block text-center mt-0.5">g</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-amber-600 uppercase block mb-1">Carbs</span>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      placeholder="0"
                      value={carbs}
                      onChange={(e) => setCarbs(e.target.value)}
                      className="w-full py-2 px-3 rounded-xl border border-stone-200 text-sm font-semibold text-center focus:border-amber-500"
                    />
                    <span className="text-[10px] text-stone-400 block text-center mt-0.5">g</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-cyan-600 uppercase block mb-1">Fett</span>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      placeholder="0"
                      value={fat}
                      onChange={(e) => setFat(e.target.value)}
                      className="w-full py-2 px-3 rounded-xl border border-stone-200 text-sm font-semibold text-center focus:border-cyan-500"
                    />
                    <span className="text-[10px] text-stone-400 block text-center mt-0.5">g</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!calories || Number(calories) <= 0}
            className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none text-white font-bold text-sm shadow-soft transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            <span>Jetzt eintragen</span>
          </button>
        </form>
      </div>
    </div>
  );
};
