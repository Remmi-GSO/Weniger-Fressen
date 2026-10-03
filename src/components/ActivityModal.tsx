import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type UserProfile, type ActivityLog } from '../db/db';
import { 
  DEFAULT_ACTIVITIES, 
  type ActivityDefinition, 
  calculateNetCaloriesBurned, 
  type CalorieBurnCalculation 
} from '../data/defaultActivities';
import { X, Plus, Check, Flame, Clock, Info } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
  userProfile: UserProfile;
}

export const ActivityModal = ({
  isOpen,
  onClose,
  selectedDate,
  userProfile,
}: ActivityModalProps) => {
  // Query custom activities saved by user
  const customActivities = useLiveQuery(() => db.customActivities.toArray()) || [];

  // Combine default and custom activities typed strictly as ActivityDefinition
  const allActivities: ActivityDefinition[] = useMemo(() => {
    const list: ActivityDefinition[] = [...DEFAULT_ACTIVITIES];
    customActivities.forEach((ca) => {
      list.push({
        id: `custom_${ca.id}`,
        name: ca.name,
        category: 'fitness',
        icon: ca.icon || '⚡',
        met: (ca.caloriesPerHour / Math.max(1, userProfile.weight || 75)) + 1.0,
        defaultDurationMinutes: 60,
        unitStepMinutes: ca.unitStepMinutes || 15,
        unitLabel: 'Minuten',
        description: 'Benutzerdefinierte Aktivität',
      });
    });
    return list;
  }, [customActivities, userProfile.weight]);

  const [selectedActivityId, setSelectedActivityId] = useState<string>('dog_walk');
  const [durationMinutes, setDurationMinutes] = useState<number>(30); // 30 min default
  const [intensity, setIntensity] = useState<'light' | 'moderate' | 'intense'>('moderate');
  const [isCreatingCustom, setIsCreatingCustom] = useState(false);

  // Custom creation form state
  const [customName, setCustomName] = useState('');
  const [customIcon, setCustomIcon] = useState('🏃');
  const [customKcalPerHour, setCustomKcalPerHour] = useState('300');

  // Currently selected activity
  const currentActivity: ActivityDefinition = useMemo(() => {
    return allActivities.find((a) => a.id === selectedActivityId) || allActivities[0];
  }, [allActivities, selectedActivityId]);

  const isDogWalk = currentActivity.id === 'dog_walk';

  // Intensity multiplier adjusted for activity type
  const intensityMultiplier = useMemo(() => {
    if (isDogWalk) {
      // Light = Schnüffeln/Bummeln (0.8x -> ~60 kcal / 30 min)
      // Moderate = Normales Gehen mit Hund (1.0x -> ~75 kcal / 30 min)
      // Intense = Zügiges Gehen / Walking mit Hund (1.25x -> ~94 kcal / 30 min)
      return intensity === 'light' ? 0.8 : intensity === 'intense' ? 1.25 : 1.0;
    }
    return intensity === 'light' ? 0.85 : intensity === 'intense' ? 1.2 : 1.0;
  }, [isDogWalk, intensity]);

  // Calculated burned calories (Net additional energy above resting metabolic rate)
  const userWeight = userProfile.weight || 75;
  const calorieBreakdown: CalorieBurnCalculation = useMemo(() => {
    if (selectedActivityId.startsWith('custom_')) {
      const ca = customActivities.find((c) => `custom_${c.id}` === selectedActivityId);
      const ratePerHour = ca?.caloriesPerHour || 250;
      const netKcal = Math.max(1, Math.round((ratePerHour * (durationMinutes / 60)) * intensityMultiplier));
      const resting = Math.round(1.0 * userWeight * (durationMinutes / 60));
      return {
        netCalories: netKcal,
        grossCalories: netKcal + resting,
        restingCalories: resting,
        netMet: Math.round((netKcal / Math.max(1, userWeight * (durationMinutes / 60))) * 10) / 10,
      };
    }
    return calculateNetCaloriesBurned(currentActivity.met, userWeight, durationMinutes, intensityMultiplier);
  }, [currentActivity, intensityMultiplier, userWeight, durationMinutes, selectedActivityId, customActivities]);

  const calculatedKcal = calorieBreakdown.netCalories;

  if (!isOpen) return null;

  // Dog walk units (in half-hour chunks: 1, 2, 3, 4 units)
  const halfHourUnits = Math.max(1, Math.round(durationMinutes / 30));

  const handleSelectActivity = (act: ActivityDefinition) => {
    setSelectedActivityId(act.id);
    if (act.id === 'dog_walk') {
      setDurationMinutes(30);
    } else if (act.id === 'back_yoga' || act.id === 'gardening' || act.id === 'housework') {
      setDurationMinutes(60);
    } else {
      setDurationMinutes(act.defaultDurationMinutes || 45);
    }
  };

  const handleSaveActivity = async () => {
    if (durationMinutes <= 0 || calculatedKcal <= 0) return;

    const log: ActivityLog = {
      date: selectedDate,
      activityId: currentActivity.id,
      name: currentActivity.name,
      icon: currentActivity.icon,
      durationMinutes,
      caloriesBurned: calculatedKcal,
      intensity,
      timestamp: Date.now(),
    };

    await db.activityLogs.add(log);

    confetti({
      particleCount: 35,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#F59E0B', '#EF4444', '#10B981'],
    });

    onClose();
  };

  const handleCreateCustomActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    const kcal = parseFloat(customKcalPerHour) || 300;
    const id = await db.customActivities.add({
      name: customName.trim(),
      icon: customIcon || '⚡',
      caloriesPerHour: kcal,
      unitStepMinutes: 15,
      createdAt: Date.now(),
    });

    setSelectedActivityId(`custom_${id}`);
    setIsCreatingCustom(false);
    setCustomName('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-soft-lg border border-stone-100 overflow-hidden max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="p-4 px-6 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-amber-50 text-amber-600 rounded-xl text-lg">🏃</span>
            <div>
              <h3 className="font-bold text-stone-800 text-base">Aktivität & Bewegung</h3>
              <p className="text-xs text-stone-400">Verbrannte Kalorien zu deinem Tagesbudget addieren</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Quick Activity Selector Chips / Grid */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                Aktivität wählen
              </label>
              <button
                type="button"
                onClick={() => setIsCreatingCustom(!isCreatingCustom)}
                className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Eigene Aktivität</span>
              </button>
            </div>

            {/* Custom activity creation sub-form */}
            {isCreatingCustom && (
              <form onSubmit={handleCreateCustomActivity} className="p-3 mb-3 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2.5">
                <span className="text-xs font-bold text-amber-950 block">Neue Aktivität hinterlegen</span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Name (z.B. Holz hacken, Tennis, Badminton)"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-xl border border-amber-200 text-xs font-medium"
                  />
                  <input
                    type="text"
                    title="Emoji Icon"
                    value={customIcon}
                    onChange={(e) => setCustomIcon(e.target.value)}
                    className="w-12 text-center px-2 py-1.5 rounded-xl border border-amber-200 text-sm"
                  />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-amber-900">
                    <span>ca.</span>
                    <input
                      type="number"
                      step="10"
                      min="50"
                      max="1500"
                      value={customKcalPerHour}
                      onChange={(e) => setCustomKcalPerHour(e.target.value)}
                      className="w-20 px-2 py-1 rounded-lg border border-amber-200 text-xs font-bold text-center"
                    />
                    <span>kcal / Stunde</span>
                  </div>
                  <button
                    type="submit"
                    className="py-1 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs"
                  >
                    Speichern
                  </button>
                </div>
              </form>
            )}

            {/* Grid of activities */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {allActivities.map((act) => {
                const isSelected = act.id === selectedActivityId;
                return (
                  <button
                    key={act.id}
                    type="button"
                    onClick={() => handleSelectActivity(act)}
                    className={`p-2.5 rounded-2xl border text-left transition-all flex items-center gap-2.5 ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50/90 text-amber-950 shadow-sm ring-2 ring-amber-500/20'
                        : 'border-stone-200 bg-white hover:bg-stone-50 text-stone-700'
                    }`}
                  >
                    <span className="text-2xl shrink-0">{act.icon}</span>
                    <div className="min-w-0">
                      <span className="text-xs font-bold block truncate">{act.name}</span>
                      <span className="text-[10px] text-stone-400 block truncate">
                        {act.id === 'dog_walk' ? 'Halbe Std.' : 'Minuten'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ACTIVE SELECTION DETAIL CARD */}
          <div className="p-4 bg-stone-50 border border-stone-200/80 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-3xl">{currentActivity.icon}</span>
                <div>
                  <h4 className="font-extrabold text-stone-800 text-sm">{currentActivity.name}</h4>
                  <p className="text-[11px] text-stone-400">
                    {currentActivity.description || 'Alltägliche oder sportliche Bewegung'}
                  </p>
                </div>
              </div>
            </div>

            {/* DURATION SELECTOR: SPECIAL HALF-HOUR UNITS FOR DOG WALK */}
            {isDogWalk ? (
              <div className="space-y-2 bg-white p-3 rounded-xl border border-stone-200/70">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Halbstündige Einheiten wählen:</span>
                  </span>
                  <span className="text-xs font-extrabold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                    {halfHourUnits} {halfHourUnits === 1 ? 'Einheit' : 'Einheiten'} = {durationMinutes} Min ({durationMinutes / 60} Std)
                  </span>
                </div>

                {/* 1, 2, 3, 4 Unit Buttons */}
                <div className="grid grid-cols-4 gap-1.5 pt-1">
                  {[1, 2, 3, 4].map((unit) => {
                    const mins = unit * 30;
                    const isActive = durationMinutes === mins;
                    return (
                      <button
                        key={unit}
                        type="button"
                        onClick={() => setDurationMinutes(mins)}
                        className={`py-2 px-1 rounded-xl border text-center transition-all ${
                          isActive
                            ? 'border-amber-600 bg-amber-600 text-white font-bold shadow-sm'
                            : 'border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 font-semibold'
                        }`}
                      >
                        <span className="text-xs block">{unit}x Einheit</span>
                        <span className="text-[10px] opacity-80 block">{unit * 0.5} Std</span>
                      </button>
                    );
                  })}
                </div>

                {/* Stepper for custom units */}
                <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs">
                  <span className="text-stone-500">Oder Einheiten schrittweise anpassen:</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setDurationMinutes(Math.max(15, durationMinutes - 30))}
                      className="w-7 h-7 rounded-lg bg-stone-100 hover:bg-stone-200 flex items-center justify-center font-bold text-stone-700"
                    >
                      -
                    </button>
                    <span className="font-bold text-stone-800 text-xs min-w-[3rem] text-center">
                      {durationMinutes} min
                    </span>
                    <button
                      type="button"
                      onClick={() => setDurationMinutes(durationMinutes + 30)}
                      className="w-7 h-7 rounded-lg bg-stone-100 hover:bg-stone-200 flex items-center justify-center font-bold text-stone-700"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* DURATION SELECTOR FOR YOGA, GARDENING, CLEANING & WORKOUTS */
              <div className="space-y-2 bg-white p-3 rounded-xl border border-stone-200/70">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Dauer festlegen:</span>
                  </span>
                  <span className="text-xs font-extrabold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                    {durationMinutes} Minuten ({Math.round((durationMinutes / 60) * 10) / 10} Std)
                  </span>
                </div>

                {/* Quick duration presets */}
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5">
                  {[20, 30, 45, 60, 90, 120].map((mins) => {
                    const isActive = durationMinutes === mins;
                    return (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => setDurationMinutes(mins)}
                        className={`py-1.5 rounded-xl border text-center transition-all ${
                          isActive
                            ? 'border-amber-600 bg-amber-600 text-white font-bold shadow-sm'
                            : 'border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs font-medium'
                        }`}
                      >
                        {mins < 60 ? `${mins}m` : mins === 60 ? '1 Std' : `${mins / 60} Std`}
                      </button>
                    );
                  })}
                </div>

                {/* Exact Minute Slider & Stepper */}
                <div className="flex items-center gap-3 pt-2 border-t border-stone-100">
                  <input
                    type="range"
                    min="10"
                    max="180"
                    step="5"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="flex-1 accent-amber-600 cursor-pointer"
                  />
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="5"
                      min="5"
                      max="360"
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(Number(e.target.value))}
                      className="w-16 px-2 py-1 text-center font-bold text-xs rounded-lg border border-stone-200"
                    />
                    <span className="text-xs text-stone-400">Min</span>
                  </div>
                </div>
              </div>
            )}

            {/* INTENSITY LEVEL */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-500 font-medium">Intensität:</span>
              <div className="flex gap-1">
                {(['light', 'moderate', 'intense'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setIntensity(lvl)}
                    className={`py-1 px-2.5 rounded-lg border text-[11px] font-semibold transition-all ${
                      intensity === lvl
                        ? 'border-amber-600 bg-amber-600 text-white shadow-xs'
                        : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    {isDogWalk
                      ? lvl === 'light'
                        ? '🐕 Schnüffeln mit Snoopy'
                        : lvl === 'moderate'
                        ? '🐾 Gassi mit Snoopy'
                        : '⚡ Flottes Gehen mit Snoopy'
                      : lvl === 'light'
                      ? 'Gemütlich'
                      : lvl === 'moderate'
                      ? 'Moderat'
                      : 'Anstrengend'}
                  </button>
                ))}
              </div>
            </div>

            {/* LIVE CALORIE RESULT HERO BANNER */}
            <div className="p-3.5 bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-amber-500/5 rounded-2xl border border-amber-200/90 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center text-xl shadow-sm">
                    <Flame className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
                      Netto-Mehrverbrauch
                    </span>
                    <span className="text-xs text-amber-950 font-medium">
                      Für dein Profil ({userWeight} kg • {durationMinutes} Min)
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-2xl font-black text-amber-900 leading-none block">
                    +{calculatedKcal} <span className="text-xs font-bold">kcal</span>
                  </span>
                  <span className="text-[10px] text-amber-700 font-medium">
                    echtes Zusatzbudget
                  </span>
                </div>
              </div>

              {/* TRANSPARENTE NETTO-VERBRAUCHS-ERKLÄRUNG */}
              <div className="pt-2 border-t border-amber-200/70 text-[10px] space-y-1.5 text-stone-600">
                <div className="flex items-center justify-between text-stone-500 font-medium">
                  <span>Körper-Gesamtumsatz (Brutto): ~{calorieBreakdown.grossCalories} kcal</span>
                  <span>Ruhe-Grundumsatz: ~{calorieBreakdown.restingCalories} kcal</span>
                </div>
                <div className="bg-white/80 p-2 rounded-xl border border-amber-100 flex items-start gap-1.5 leading-relaxed text-stone-600">
                  <Info className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Echte Netto-Berechnung:</strong> Dein Ruhe-Grundumsatz (~{calorieBreakdown.restingCalories} kcal in {durationMinutes} Min) ist bereits in deinem Tagesziel enthalten. Wir schreiben dir nur den echten Bewegungs-Mehrverbrauch (+{calculatedKcal} kcal) gut – damit dein Kaloriendefizit realistisch bleibt.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Submit */}
          <button
            type="button"
            onClick={handleSaveActivity}
            disabled={durationMinutes <= 0}
            className="w-full py-4 rounded-2xl bg-amber-600 hover:bg-amber-700 active:scale-[0.99] text-white font-bold text-sm shadow-soft transition-all flex items-center justify-center gap-2"
          >
            <Check className="w-5 h-5" />
            <span>Aktivität eintragen (+{calculatedKcal} kcal Budget)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
