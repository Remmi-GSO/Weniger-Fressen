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
import { VoiceInputButton } from './VoiceInputButton';
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

  // Spezial-Modi für Jumping Fit, Crosstrainer & Quest 3 Sport
  const [jumpingPreset, setJumpingPreset] = useState<'full' | 'hiit' | 'tabata' | 'cooldown' | 'custom'>('full');
  const [crosstrainerMode, setCrosstrainerMode] = useState<'manual' | 'estimate'>('manual');
  const [questMode, setQuestMode] = useState<'estimate_racket' | 'manual_move'>('estimate_racket');
  const [manualCalories, setManualCalories] = useState<string>('');

  // Josies Workout State (Allgemein vs. Crosstrainer, Intensitäten, Buße)
  const [josiesType, setJosiesType] = useState<'general' | 'crosstrainer'>('general');
  const [josiesIntensity, setJosiesIntensity] = useState<'gentle' | 'moderate' | 'intense' | 'extreme'>('moderate');
  const [josiesCrosstrainerMode, setJosiesCrosstrainerMode] = useState<'manual' | 'estimate'>('manual');
  const [josiesManualCalories, setJosiesManualCalories] = useState<string>('');
  const [isPenance, setIsPenance] = useState<boolean>(false);

  // Pedometer / Samsung Health Steps State
  const [pedometerSteps, setPedometerSteps] = useState<string>('8000');

  // Custom creation form state
  const [customName, setCustomName] = useState('');
  const [customIcon, setCustomIcon] = useState('🏃');
  const [customKcalPerHour, setCustomKcalPerHour] = useState('300');

  // Currently selected activity
  const currentActivity: ActivityDefinition = useMemo(() => {
    return allActivities.find((a) => a.id === selectedActivityId) || allActivities[0];
  }, [allActivities, selectedActivityId]);

  const isDogWalk = currentActivity.id === 'dog_walk';
  const isJumpingFit = currentActivity.id === 'jumping_fit';
  const isCrosstrainer = currentActivity.id === 'crosstrainer';
  const isQuest3 = currentActivity.id === 'quest3_sport';
  const isJosiesWorkout = currentActivity.id === 'josies_workout' || currentActivity.id === 'joses_workout';
  const isPedometer = currentActivity.id === 'pedometer_steps';

  const isManualMode =
    (isCrosstrainer && crosstrainerMode === 'manual') ||
    (isQuest3 && questMode === 'manual_move') ||
    (isJosiesWorkout && josiesType === 'crosstrainer' && josiesCrosstrainerMode === 'manual');

  const parsedManualKcal = parseInt(manualCalories, 10);
  const parsedJosiesManualKcal = parseInt(josiesManualCalories, 10);
  const hasValidManualKcal =
    (isManualMode && !isJosiesWorkout && !isNaN(parsedManualKcal) && parsedManualKcal > 0) ||
    (isJosiesWorkout && josiesType === 'crosstrainer' && josiesCrosstrainerMode === 'manual' && !isNaN(parsedJosiesManualKcal) && parsedJosiesManualKcal > 0);

  // Intensity multiplier adjusted for activity type
  const intensityMultiplier = useMemo(() => {
    if (isDogWalk) {
      return intensity === 'light' ? 0.8 : intensity === 'intense' ? 1.25 : 1.0;
    }
    if (isJumpingFit) {
      return intensity === 'light' ? 0.9 : intensity === 'intense' ? 1.15 : 1.0;
    }
    return intensity === 'light' ? 0.85 : intensity === 'intense' ? 1.2 : 1.0;
  }, [isDogWalk, isJumpingFit, intensity]);

  // Effektiver Brutto-MET nach Trainingseinheit
  const effectiveMet = useMemo(() => {
    if (isJumpingFit) {
      if (jumpingPreset === 'hiit') return 9.5; // Trampolin HIIT pure
      if (jumpingPreset === 'tabata') return 10.5; // Trampolin Tabata Maximum
      if (jumpingPreset === 'cooldown') return 2.5; // Dehnen
      return 8.9; // 75 Min Komplettsession: (45*9.5 + 20*10.5 + 10*2.5)/75 = 8.83 ~ 8.9 MET
    }
    if (isQuest3) {
      return 6.5; // VR Health Institute: VR Racketsport (Badminton/Tennis) entspricht ~6.5 Brutto-MET
    }
    return currentActivity.met;
  }, [isJumpingFit, jumpingPreset, isQuest3, currentActivity.met]);

  // Baseline-Schritte nach Alltags-PAL
  const baselineSteps = useMemo(() => {
    const lvl = userProfile.stepLevel || 'moderate_walk';
    if (lvl === 'sedentary') return 3500;
    if (lvl === 'active_standing') return 10000;
    if (lvl === 'heavy_work') return 14000;
    return 6000;
  }, [userProfile.stepLevel]);

  const parsedPedometerSteps = parseInt(pedometerSteps, 10) || 0;
  const pedometerNetSteps = Math.max(0, parsedPedometerSteps - baselineSteps);

  const josiesCrosstrainerEstimatedKcal = useMemo(() => {
    let netMet = 5.5;
    if (josiesIntensity === 'gentle') netMet = 4.0;
    else if (josiesIntensity === 'intense') netMet = 7.0;
    else if (josiesIntensity === 'extreme') netMet = 8.5;
    return Math.max(1, Math.round(netMet * (userProfile.weight || 75) * (durationMinutes / 60)));
  }, [josiesIntensity, userProfile.weight, durationMinutes]);


  // Calculated burned calories (Net additional energy above resting metabolic rate)
  const userWeight = userProfile.weight || 75;
  const calorieBreakdown: CalorieBurnCalculation = useMemo(() => {
    // Manuelle Eingabe (vom Crosstrainer-Display oder Quest Move Tracker oder Josies Crosstrainer)
    if (hasValidManualKcal) {
      const activeKcal = isJosiesWorkout ? parsedJosiesManualKcal : parsedManualKcal;
      const resting = Math.round(1.0 * userWeight * (durationMinutes / 60));
      return {
        netCalories: activeKcal,
        grossCalories: activeKcal + resting,
        restingCalories: resting,
        netMet: Math.round((activeKcal / Math.max(1, userWeight * (durationMinutes / 60))) * 10) / 10,
      };
    }

    if (isJosiesWorkout) {
      let netMet = 5.5;
      if (josiesType === 'crosstrainer') {
        netMet = josiesIntensity === 'gentle' ? 4.0 : josiesIntensity === 'intense' ? 7.0 : josiesIntensity === 'extreme' ? 8.5 : 5.5;
      } else {
        netMet = josiesIntensity === 'gentle' ? 3.0 : josiesIntensity === 'intense' ? 7.5 : josiesIntensity === 'extreme' ? 9.5 : 5.5;
      }

      const netKcal = Math.max(1, Math.round(netMet * userWeight * (durationMinutes / 60)));
      const resting = Math.round(1.0 * userWeight * (durationMinutes / 60));
      return {
        netCalories: netKcal,
        grossCalories: netKcal + resting,
        restingCalories: resting,
        netMet: Math.round(netMet * 10) / 10,
      };
    }

    if (isPedometer) {
      const netKcal = Math.round(pedometerNetSteps * (userWeight / 75) * 0.038);
      const resting = Math.round(1.0 * userWeight * (durationMinutes / 60));
      return {
        netCalories: netKcal,
        grossCalories: netKcal + resting,
        restingCalories: resting,
        netMet: Math.round((netKcal / Math.max(1, userWeight * (durationMinutes / 60))) * 10) / 10,
      };
    }

    if (isJumpingFit) {
      let baseKcal = 600;
      if (jumpingPreset === 'hiit') baseKcal = 450;
      else if (jumpingPreset === 'tabata') baseKcal = 150;
      else if (jumpingPreset === 'cooldown') baseKcal = 25;
      else {
        // Fallback: 600 kcal / 75 min = 8 kcal/min
        baseKcal = Math.round((600 / 75) * durationMinutes);
      }
      const netKcal = Math.max(1, Math.round(baseKcal * (userWeight / 75) * intensityMultiplier));
      const resting = Math.round(1.0 * userWeight * (durationMinutes / 60));
      return {
        netCalories: netKcal,
        grossCalories: netKcal + resting,
        restingCalories: resting,
        netMet: Math.round((netKcal / Math.max(1, userWeight * (durationMinutes / 60))) * 10) / 10,
      };
    }

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

    return calculateNetCaloriesBurned(effectiveMet, userWeight, durationMinutes, intensityMultiplier);
  }, [
    hasValidManualKcal,
    parsedManualKcal,
    parsedJosiesManualKcal,
    isJosiesWorkout,
    josiesType,
    josiesIntensity,
    josiesCrosstrainerMode,
    isPedometer,
    pedometerNetSteps,
    isJumpingFit,
    jumpingPreset,
    effectiveMet,
    intensityMultiplier,
    userWeight,
    durationMinutes,
    selectedActivityId,
    customActivities,
  ]);

  const calculatedKcal = calorieBreakdown.netCalories;

  if (!isOpen) return null;

  // Dog walk units (in half-hour chunks: 1, 2, 3, 4 units)
  const halfHourUnits = Math.max(1, Math.round(durationMinutes / 30));

  const handleSelectActivity = (act: ActivityDefinition) => {
    setSelectedActivityId(act.id);
    if (act.id === 'dog_walk') {
      setDurationMinutes(30);
    } else if (act.id === 'josies_workout' || act.id === 'joses_workout') {
      setDurationMinutes(45);
      setJosiesType('general');
      setJosiesIntensity('moderate');
      setJosiesCrosstrainerMode('manual');
      setJosiesManualCalories('');
      setIsPenance(false);
    } else if (act.id === 'pedometer_steps') {
      setDurationMinutes(60);
      setPedometerSteps('8000');
    } else if (act.id === 'jumping_fit') {
      setDurationMinutes(75);
      setJumpingPreset('full');
    } else if (act.id === 'crosstrainer') {
      setDurationMinutes(30);
      setCrosstrainerMode('manual');
      setManualCalories('');
    } else if (act.id === 'quest3_sport') {
      setDurationMinutes(45);
      setQuestMode('estimate_racket');
      setManualCalories('');
    } else if (act.id === 'back_yoga' || act.id === 'gardening' || act.id === 'housework') {
      setDurationMinutes(60);
    } else {
      setDurationMinutes(act.defaultDurationMinutes || 45);
    }
  };

  const handleSaveActivity = async () => {
    if (durationMinutes <= 0 || (calculatedKcal <= 0 && !isPedometer)) return;

    let displayName = currentActivity.name;
    if (isJosiesWorkout) {
      const intLabel =
        josiesIntensity === 'gentle' ? 'Sanft' :
        josiesIntensity === 'intense' ? 'Intensiv' :
        josiesIntensity === 'extreme' ? 'Vollgas' : 'Moderat';

      if (josiesType === 'crosstrainer') {
        displayName = josiesCrosstrainerMode === 'manual'
          ? `Josies Workout (Crosstrainer Display, ${intLabel})`
          : `Josies Workout (Crosstrainer ${durationMinutes} Min, ${intLabel})`;
      } else {
        displayName = `Josies Workout (${durationMinutes} Min, ${intLabel})`;
      }
      if (isPenance) {
        displayName += ' (Buße 🙏)';
      }
    } else if (isPedometer) {
      displayName = `Schritte (${parsedPedometerSteps.toLocaleString('de-DE')} Schritte)`;
    } else if (isJumpingFit) {
      if (jumpingPreset === 'full') displayName = 'Jumping Fit (75 Min: HIIT + Tabata + Dehnen)';
      else if (jumpingPreset === 'hiit') displayName = 'Jumping Fit (45 Min HIIT)';
      else if (jumpingPreset === 'tabata') displayName = 'Jumping Fit (20 Min Tabata)';
      else if (jumpingPreset === 'cooldown') displayName = 'Jumping Fit (10 Min Dehnen)';
      else displayName = `Jumping Fit (${durationMinutes} Min)`;
    } else if (isQuest3) {
      displayName = questMode === 'estimate_racket'
        ? 'Quest 3 Sport (VR Badminton & Tennis)'
        : 'Quest 3 Sport (Move Tracker)';
    } else if (isCrosstrainer) {
      displayName = crosstrainerMode === 'manual'
        ? 'Crosstrainer (Display-Wert)'
        : 'Crosstrainer (Cardio)';
    }

    const log: ActivityLog = {
      date: selectedDate,
      activityId: currentActivity.id,
      name: displayName,
      icon: isPenance ? '🙏' : currentActivity.icon,
      durationMinutes,
      caloriesBurned: calculatedKcal,
      intensity: isManualMode ? 'moderate' : intensity,
      isPenance: isJosiesWorkout ? isPenance : false,
      stepsCount: isPedometer ? parsedPedometerSteps : undefined,
      timestamp: Date.now(),
    };

    await db.activityLogs.add(log);

    confetti({
      particleCount: 35,
      spread: 60,
      origin: { y: 0.7 },
      colors: isPenance ? ['#A855F7', '#7C3AED', '#EC4899'] : ['#F97316', '#EF4444', '#10B981'],
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
            <span className="p-2 bg-orange-50 text-orange-600 rounded-xl text-lg">🏃</span>
            <div>
              <h3 className="font-bold text-stone-800 text-base">Aktivität & Bewegung</h3>
              <p className="text-xs text-stone-400">Verbrannte Kalorien zu deinem Tagesbudget addieren</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-500 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Hinweis falls Sport bereits pauschal im Bedarfsrechner eingerechnet ist */}
          {!userProfile.trackWorkoutsDaily && (userProfile.workoutSessionsPerWeek || 0) > 0 && (
            <div className="p-3.5 bg-amber-50/90 border border-amber-200/90 rounded-2xl flex items-start gap-3 text-xs text-amber-900 animate-in fade-in shadow-2xs">
              <span className="text-lg select-none shrink-0 mt-0.5">💡</span>
              <div className="leading-relaxed">
                <span className="font-bold text-amber-950 block mb-0.5">Bedarfsrechner-Hinweis:</span>
                Du hast in deinem Profil bereits <strong className="font-bold">{userProfile.workoutSessionsPerWeek}x Sport pro Woche</strong> als pauschalen Kalorienbonus eingerechnet.
                Wenn du Workouts hier zusätzlich tagesgenau einträgst, empfehlen wir im <strong>Bedarfsrechner</strong> die Option <em>„Sport tagesgenau erfassen“</em> zu aktivieren, um Doppelzählungen zu vermeiden!
              </div>
            </div>
          )}

          {/* Quick Activity Selector Chips / Grid */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                Aktivität wählen
              </label>
              <button
                type="button"
                onClick={() => setIsCreatingCustom(!isCreatingCustom)}
                className="text-xs font-bold text-orange-700 hover:text-orange-800 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Eigene Aktivität</span>
              </button>
            </div>

            {/* Custom activity creation sub-form */}
            {isCreatingCustom && (
              <form onSubmit={handleCreateCustomActivity} className="p-3 mb-3 bg-orange-50/70 border border-orange-200 rounded-2xl space-y-2.5">
                <span className="text-xs font-bold text-orange-950 block">Neue Aktivität hinterlegen</span>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      required
                      placeholder="Name (z.B. Klettern, Tanzen, Bouldern)"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      className="w-full pl-3 pr-8 py-1.5 rounded-xl border border-orange-200 text-xs font-medium"
                    />
                    <div className="absolute right-1 top-1/2 -translate-y-1/2">
                      <VoiceInputButton
                        onTranscript={(text) => setCustomName(text)}
                        currentValue={customName}
                        size="xs"
                        title="Aktivität per Sprache benennen"
                      />
                    </div>
                  </div>
                  <input
                    type="text"
                    title="Emoji Icon"
                    value={customIcon}
                    onChange={(e) => setCustomIcon(e.target.value)}
                    className="w-12 text-center px-2 py-1.5 rounded-xl border border-orange-200 text-sm"
                  />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-orange-900">
                    <span>ca.</span>
                    <input
                      type="number"
                      step="10"
                      min="50"
                      max="1500"
                      value={customKcalPerHour}
                      onChange={(e) => setCustomKcalPerHour(e.target.value)}
                      className="w-20 px-2 py-1 rounded-lg border border-orange-200 text-xs font-bold text-center"
                    />
                    <span>kcal / Stunde</span>
                  </div>
                  <button
                    type="submit"
                    className="py-1 px-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs cursor-pointer shadow-xs"
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
                    className={`p-2.5 rounded-2xl border text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                      isSelected
                        ? 'border-orange-500 bg-orange-50/90 text-orange-950 shadow-sm ring-2 ring-orange-500/20'
                        : 'border-stone-200 bg-white hover:bg-stone-50 text-stone-700'
                    }`}
                  >
                    <span className="text-2xl shrink-0">{act.icon}</span>
                    <div className="min-w-0">
                      <span className="text-xs font-bold block truncate">{act.name}</span>
                      <span className="text-[10px] text-stone-400 block truncate">
                        {act.id === 'dog_walk'
                          ? 'Halbe Std.'
                          : act.id === 'josies_workout' || act.id === 'joses_workout'
                          ? 'Workout / Buße'
                          : act.id === 'pedometer_steps'
                          ? 'Samsung / Pedometer'
                          : act.id === 'jumping_fit'
                          ? '75 Min (HIIT+Tabata)'
                          : act.id === 'crosstrainer'
                          ? 'Display / Min'
                          : act.id === 'quest3_sport'
                          ? 'VR Racket / Move'
                          : 'Minuten'}
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

            {/* SPEZIAL 0A: JOSIES WORKOUT */}
            {isJosiesWorkout ? (
              <div className="space-y-4 bg-white p-3.5 rounded-2xl border border-orange-200/90 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">💪</span>
                    <span className="text-xs font-extrabold text-stone-800">Josies Workout Konfiguration</span>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-orange-100 text-orange-950 px-2 py-0.5 rounded-full">
                    Individuell
                  </span>
                </div>

                {/* Typ-Umschalter: Allgemeines Workout vs. Crosstrainer */}
                <div className="grid grid-cols-2 gap-1 p-1 bg-stone-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setJosiesType('general');
                      setDurationMinutes(45);
                    }}
                    className={`py-2 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer text-center ${
                      josiesType === 'general'
                        ? 'bg-white text-orange-950 shadow-2xs'
                        : 'text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    🏋️ Allgemeines Workout
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setJosiesType('crosstrainer');
                      setDurationMinutes(30);
                    }}
                    className={`py-2 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer text-center ${
                      josiesType === 'crosstrainer'
                        ? 'bg-white text-orange-950 shadow-2xs'
                        : 'text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    🎿 Crosstrainer
                  </button>
                </div>

                {/* Wenn Typ === 'general' */}
                {josiesType === 'general' ? (
                  <div className="space-y-3 pt-1">
                    {/* Intensitätsstufen */}
                    <div>
                      <label className="text-[11px] font-bold text-stone-700 block mb-1.5">
                        Intensitätsstufe des Workouts:
                      </label>
                      <div className="grid grid-cols-2 gap-1.5">
                        {[
                          { id: 'gentle', label: '🌱 Sanft / Warm-Up', sub: 'Mobilisation, Dehnen (~180 kcal/h)' },
                          { id: 'moderate', label: '⚡ Moderat / Standard', sub: 'Klassisches Kraft- & Zirkeltraining (~350 kcal/h)' },
                          { id: 'intense', label: '🔥 Intensiv / Schweiß', sub: 'Hohe Last, kurze Pausen (~500 kcal/h)' },
                          { id: 'extreme', label: '💥 Vollgas / HIIT', sub: 'Maximale Belastung & Puls (~650 kcal/h)' },
                        ].map((lvl) => (
                          <button
                            key={lvl.id}
                            type="button"
                            onClick={() => setJosiesIntensity(lvl.id as any)}
                            className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                              josiesIntensity === lvl.id
                                ? 'border-orange-600 bg-orange-600 text-white font-bold shadow-xs'
                                : 'border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700'
                            }`}
                          >
                            <span className="text-xs font-black block">{lvl.label}</span>
                            <span className="text-[10px] opacity-85 block leading-snug">{lvl.sub}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Dauer Schnellwahl & Eingabe */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-[11px] font-bold text-stone-700">Dauer des Workouts:</label>
                        <span className="text-xs font-black text-orange-950 bg-orange-100 px-2 py-0.5 rounded-full">
                          {durationMinutes} Minuten
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-1.5">
                        {[20, 30, 45, 60].map((mins) => (
                          <button
                            key={mins}
                            type="button"
                            onClick={() => setDurationMinutes(mins)}
                            className={`py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                              durationMinutes === mins
                                ? 'border-orange-600 bg-orange-50 text-orange-950 font-black'
                                : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                            }`}
                          >
                            {mins} Min
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Wenn Typ === 'crosstrainer' */
                  <div className="space-y-3 pt-1">
                    {/* Crosstrainer Intensitätsstufen */}
                    <div>
                      <label className="text-[11px] font-bold text-stone-700 block mb-1.5">
                        Crosstrainer-Intensität wählen:
                      </label>
                      <div className="grid grid-cols-2 gap-1.5">
                        {[
                          { id: 'gentle', label: '🌱 Sanft / Gemütlich', sub: 'Niedriger Widerstand (~300 kcal/h)' },
                          { id: 'moderate', label: '⚡ Moderat / Standard', sub: 'Stetiges Cardio-Tempo (~400 kcal/h)' },
                          { id: 'intense', label: '🔥 Zügig / Intensiv', sub: 'Hoher Widerstand, schweißtreibend (~500 kcal/h)' },
                          { id: 'extreme', label: '💥 Vollgas / Intervall', sub: 'Sprint-Intervalle, maximaler Widerstand (~600 kcal/h)' },
                        ].map((lvl) => (
                          <button
                            key={lvl.id}
                            type="button"
                            onClick={() => setJosiesIntensity(lvl.id as any)}
                            className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                              josiesIntensity === lvl.id
                                ? 'border-orange-600 bg-orange-600 text-white font-bold shadow-xs'
                                : 'border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700'
                            }`}
                          >
                            <span className="text-xs font-black block">{lvl.label}</span>
                            <span className="text-[10px] opacity-85 block leading-snug">{lvl.sub}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Trainingszeit */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-[11px] font-bold text-stone-700">Trainingsdauer auf dem Crosstrainer:</label>
                        <span className="text-xs font-black text-orange-950 bg-orange-100 px-2 py-0.5 rounded-full">
                          {durationMinutes} Minuten
                        </span>
                      </div>
                      <div className="grid grid-cols-5 gap-1.5 mb-2">
                        {[15, 20, 30, 45, 60].map((mins) => (
                          <button
                            key={mins}
                            type="button"
                            onClick={() => setDurationMinutes(mins)}
                            className={`py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                              durationMinutes === mins
                                ? 'border-orange-600 bg-orange-50 text-orange-950 font-black'
                                : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                            }`}
                          >
                            {mins} Min
                          </button>
                        ))}
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          min="5"
                          max="240"
                          step="5"
                          value={durationMinutes}
                          onChange={(e) => setDurationMinutes(Math.max(1, Number(e.target.value)))}
                          className="w-full py-1.5 pl-3 pr-10 rounded-xl border border-stone-200 font-extrabold text-stone-900 text-xs bg-white"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">
                          Minuten frei
                        </span>
                      </div>
                    </div>

                    {/* Modus: Display vs. Schätzung */}
                    <div className="p-3 bg-orange-50/60 rounded-2xl border border-orange-200/80 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-extrabold text-orange-950">
                          Kalorienberechnung & Display-Vergleich:
                        </label>
                        <span className="text-[10px] text-orange-800 bg-orange-100 px-2 py-0.5 rounded-full font-bold">
                          Netto-Verbrauch
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-1 p-1 bg-white rounded-xl border border-stone-200">
                        <button
                          type="button"
                          onClick={() => setJosiesCrosstrainerMode('manual')}
                          className={`py-2 px-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer text-center ${
                            josiesCrosstrainerMode === 'manual'
                              ? 'bg-orange-600 text-white shadow-2xs font-extrabold'
                              : 'text-stone-600 hover:text-stone-900'
                          }`}
                        >
                          🔢 Display-Wert eingeben
                        </button>
                        <button
                          type="button"
                          onClick={() => setJosiesCrosstrainerMode('estimate')}
                          className={`py-2 px-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer text-center ${
                            josiesCrosstrainerMode === 'estimate'
                              ? 'bg-orange-600 text-white shadow-2xs font-extrabold'
                              : 'text-stone-600 hover:text-stone-900'
                          }`}
                        >
                          ⏱️ App-Schätzwert nutzen
                        </button>
                      </div>

                      {josiesCrosstrainerMode === 'manual' ? (
                        <div className="space-y-2 pt-1">
                          <div>
                            <label className="text-[11px] font-bold text-stone-700 block mb-1">
                              Vom Crosstrainer angezeigte Kalorien:
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                min="10"
                                max="3000"
                                step="5"
                                placeholder="z. B. 320"
                                value={josiesManualCalories}
                                onChange={(e) => setJosiesManualCalories(e.target.value)}
                                className="w-full py-2 pl-3 pr-12 rounded-xl border border-orange-300 font-extrabold text-stone-900 text-sm focus:ring-2 focus:ring-orange-500 bg-white"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">
                                kcal
                              </span>
                            </div>
                          </div>

                          <div className="p-2.5 rounded-xl bg-white border border-orange-200 text-xs text-orange-950 flex items-center justify-between gap-2 shadow-2xs">
                            <div className="leading-snug">
                              <span className="font-bold block">💡 Netto-Schätzung für deine Intensität:</span>
                              <span>
                                {durationMinutes} Min {josiesIntensity === 'gentle' ? 'Sanft' : josiesIntensity === 'intense' ? 'Zügig' : josiesIntensity === 'extreme' ? 'Vollgas' : 'Moderat'}: <strong>ca. {josiesCrosstrainerEstimatedKcal} Netto-kcal</strong>
                                <span className="text-[10px] text-stone-500 block">(Crosstrainer-Displays zeigen oft Brutto inkl. Grundumsatz an)</span>
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setJosiesManualCalories(String(josiesCrosstrainerEstimatedKcal))}
                              className="px-2.5 py-1.5 rounded-xl bg-orange-100 hover:bg-orange-200 font-extrabold text-[11px] text-orange-900 transition-colors shrink-0 cursor-pointer border border-orange-200"
                              title="Wissenschaftlichen Schätzwert als Kalorien übernehmen"
                            >
                              Übernehmen
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 rounded-xl bg-white border border-orange-200 text-xs text-orange-950 space-y-1 shadow-2xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold">Berechneter Netto-Verbrauch:</span>
                            <span className="text-sm font-black text-orange-600">~{josiesCrosstrainerEstimatedKcal} kcal</span>
                          </div>
                          <p className="text-[11px] text-stone-500 leading-snug">
                            Basiert exakt auf deinen {userProfile.weight || 75} kg Körpergewicht, {durationMinutes} Minuten und Stufe <strong>{josiesIntensity === 'gentle' ? 'Sanft' : josiesIntensity === 'intense' ? 'Zügig' : josiesIntensity === 'extreme' ? 'Vollgas' : 'Moderat'}</strong>.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* BUßE BUTTON / SCHALTER */}
                <div className={`p-3.5 rounded-2xl border transition-all ${
                  isPenance 
                    ? 'bg-purple-50/90 border-purple-400 ring-2 ring-purple-300' 
                    : 'bg-stone-50 border-stone-200'
                }`}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <span className="text-2xl select-none shrink-0">🙏</span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-stone-900">Buße / Defizit-Schutz</span>
                          {isPenance ? (
                            <span className="text-[10px] font-black uppercase tracking-wider bg-purple-600 text-white px-2 py-0.5 rounded-full">
                              Aktiv
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-stone-400 bg-stone-200/60 px-1.5 py-0.2 rounded-md">
                              Optional
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-stone-500 mt-0.5 leading-snug">
                          Puffer für optimistische Mahlzeiten-Einträge: Schützt dein Kaloriendefizit, falls Portionen zuvor etwas zu vorsichtig geschätzt wurden. Kalorien werden protokolliert, aber <strong>nicht</strong> dem Essensbudget gutgeschrieben!
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsPenance(!isPenance)}
                      className={`px-3 py-2 rounded-xl font-extrabold text-xs transition-all cursor-pointer shadow-xs shrink-0 ${
                        isPenance
                          ? 'bg-purple-700 hover:bg-purple-800 text-white ring-2 ring-purple-400'
                          : 'bg-white hover:bg-stone-100 text-stone-700 border border-stone-300'
                      }`}
                    >
                      {isPenance ? '✓ Buße aktiv' : 'Buße'}
                    </button>
                  </div>

                  {isPenance && (
                    <div className="mt-2.5 pt-2.5 border-t border-purple-200 text-xs text-purple-950 leading-relaxed animate-in fade-in bg-purple-100/60 p-2.5 rounded-xl">
                      🛡️ <strong>Defizit-Schutz aktiv:</strong> Du verbrennst <strong>{calculatedKcal} kcal</strong> als Sicherheitspuffer. Falls Mahlzeiten heute etwas zu optimistisch verbucht wurden, gleicht dieses Workout das zuverlässig aus – ohne dein heutiges Essensbudget künstlich aufzublähen!
                    </div>
                  )}
                </div>
              </div>
            ) : isPedometer ? (
              /* SPEZIAL 0B: PEDOMETER / SAMSUNG HEALTH SCHRITTE */
              <div className="space-y-4 bg-white p-3.5 rounded-2xl border border-orange-200/90 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">👟</span>
                    <span className="text-xs font-extrabold text-stone-800">Tages-Schritte erfassen</span>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-orange-100 text-orange-950 px-2 py-0.5 rounded-full">
                    Pedometer / Samsung Health
                  </span>
                </div>

                {/* Schritteingabe */}
                <div>
                  <label className="text-[11px] font-bold text-stone-700 block mb-1">
                    Heutige Schrittzahl laut Smartphone-App:
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100000"
                      step="500"
                      placeholder="z.B. 8500"
                      value={pedometerSteps}
                      onChange={(e) => setPedometerSteps(e.target.value)}
                      className="w-full py-2.5 pl-3 pr-16 rounded-xl border border-orange-300 font-black text-stone-900 text-base focus:ring-2 focus:ring-orange-500"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">
                      Schritte
                    </span>
                  </div>
                </div>

                {/* Schnellwahl-Chips */}
                <div className="flex flex-wrap gap-1.5">
                  {[5000, 7500, 10000, 12500, 15000, 20000].map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setPedometerSteps(String(cnt))}
                      className={`py-1 px-2.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                        parseInt(pedometerSteps, 10) === cnt
                          ? 'border-orange-600 bg-orange-50 text-orange-950 font-black'
                          : 'border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-600'
                      }`}
                    >
                      {cnt.toLocaleString('de-DE')}
                    </button>
                  ))}
                </div>

                {/* Berechnungs-Transparenz (Basis vs. Extra) */}
                <div className="p-3 rounded-xl bg-orange-50/70 border border-orange-200/80 text-xs space-y-1 text-orange-950">
                  <div className="flex justify-between items-center text-stone-600">
                    <span>Basis-Schritte im Grundbedarf (PAL):</span>
                    <span className="font-semibold">{baselineSteps.toLocaleString('de-DE')} Schritte</span>
                  </div>
                  <div className="flex justify-between items-center text-stone-900 font-bold border-t border-orange-200/60 pt-1">
                    <span>Netto-Zusatzschritte heute:</span>
                    <span className="text-orange-900">+{pedometerNetSteps.toLocaleString('de-DE')} Schritte</span>
                  </div>
                  <div className="flex justify-between items-center text-orange-950 font-black border-t border-orange-200/60 pt-1 text-[13px]">
                    <span>Verdienter Kalorienbonus:</span>
                    <span className="text-emerald-700">+{calculatedKcal} kcal</span>
                  </div>
                </div>
                <p className="text-[11px] text-stone-400 leading-snug">
                  💡 <strong>Fair berechnet:</strong> Die Basis-Schritte deines Alltags sind bereits in deinem Grundbedarf abgedeckt. Nur Schritte darüber hinaus bringen dir extra Kalorien!
                </p>
              </div>
            ) : isJumpingFit ? (
              <div className="space-y-3 bg-white p-3.5 rounded-2xl border border-orange-200/90 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-stone-800 flex items-center gap-1.5">
                    <span>🦘</span>
                    <span>Jumping Fit Trainingseinheit:</span>
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-orange-100 text-orange-950 px-2 py-0.5 rounded-full">
                    Hochintensives Trampolin
                  </span>
                </div>

                {/* Strukturierte Zusammensetzung */}
                <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] bg-stone-50 p-2 rounded-xl border border-stone-200/70">
                  <div className="p-1 rounded-lg bg-orange-50/80 border border-orange-200/60">
                    <span className="font-extrabold text-orange-950 block">45 Min</span>
                    <span className="text-stone-500 font-medium">HIIT</span>
                  </div>
                  <div className="p-1 rounded-lg bg-orange-50/80 border border-orange-200/60">
                    <span className="font-extrabold text-orange-950 block">20 Min</span>
                    <span className="text-stone-500 font-medium">Tabata</span>
                  </div>
                  <div className="p-1 rounded-lg bg-orange-50/80 border border-orange-200/60">
                    <span className="font-extrabold text-orange-950 block">10 Min</span>
                    <span className="text-stone-500 font-medium">Dehnen</span>
                  </div>
                </div>

                {/* Schnellwahl der Einheiten */}
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setJumpingPreset('full');
                      setDurationMinutes(75);
                    }}
                    className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                      jumpingPreset === 'full'
                        ? 'border-orange-600 bg-orange-600 text-white font-bold shadow-sm'
                        : 'border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700'
                    }`}
                  >
                    <span className="text-xs font-black block">⭐ Komplett: 75 Min</span>
                    <span className="text-[10px] font-semibold opacity-95 block">ca. 600 Netto-kcal</span>
                    <span className="text-[9px] opacity-75 block">HIIT + Tabata + Dehnen</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setJumpingPreset('hiit');
                      setDurationMinutes(45);
                    }}
                    className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                      jumpingPreset === 'hiit'
                        ? 'border-orange-600 bg-orange-600 text-white font-bold shadow-sm'
                        : 'border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700'
                    }`}
                  >
                    <span className="text-xs font-black block">🔥 Nur 45 Min HIIT</span>
                    <span className="text-[10px] font-semibold opacity-95 block">ca. 450 Netto-kcal</span>
                    <span className="text-[9px] opacity-75 block">High-Intensity Intervall</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setJumpingPreset('tabata');
                      setDurationMinutes(20);
                    }}
                    className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                      jumpingPreset === 'tabata'
                        ? 'border-orange-600 bg-orange-600 text-white font-bold shadow-sm'
                        : 'border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700'
                    }`}
                  >
                    <span className="text-xs font-black block">⚡ Nur 20 Min Tabata</span>
                    <span className="text-[10px] font-semibold opacity-95 block">ca. 150 Netto-kcal</span>
                    <span className="text-[9px] opacity-75 block">20s Vollgas / 10s Pause</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setJumpingPreset('cooldown');
                      setDurationMinutes(10);
                    }}
                    className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                      jumpingPreset === 'cooldown'
                        ? 'border-orange-600 bg-orange-600 text-white font-bold shadow-sm'
                        : 'border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700'
                    }`}
                  >
                    <span className="text-xs font-black block">🧘 Nur 10 Min Dehnen</span>
                    <span className="text-[10px] opacity-85 block">Cool-Down & Mobilität</span>
                  </button>
                </div>
              </div>
            ) : isCrosstrainer ? (
              /* SPEZIAL 2: CROSSTRAINER (Display-Kalorien eingeben oder Schätzwert) */
              <div className="space-y-3 bg-white p-3.5 rounded-2xl border border-orange-200/90 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">🎿</span>
                    <span className="text-xs font-extrabold text-stone-800">Crosstrainer Erfassung</span>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-orange-100 text-orange-950 px-2 py-0.5 rounded-full">
                    Ellipsentrainer
                  </span>
                </div>

                {/* Modus-Umschalter */}
                <div className="grid grid-cols-2 gap-1 p-1 bg-stone-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setCrosstrainerMode('manual');
                      setDurationMinutes(30);
                    }}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer text-center ${
                      crosstrainerMode === 'manual'
                        ? 'bg-white text-orange-950 shadow-2xs'
                        : 'text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    🔢 Vom Display ablesen
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCrosstrainerMode('estimate');
                      setDurationMinutes(30);
                    }}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer text-center ${
                      crosstrainerMode === 'estimate'
                        ? 'bg-white text-orange-950 shadow-2xs'
                        : 'text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    ⏱️ Schätzwert berechnen
                  </button>
                </div>

                {crosstrainerMode === 'manual' ? (
                  <div className="space-y-3 pt-1">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] font-bold text-stone-700 block mb-1">
                          Kalorien (laut Display):
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="10"
                            max="3000"
                            step="5"
                            placeholder="z.B. 280"
                            value={manualCalories}
                            onChange={(e) => setManualCalories(e.target.value)}
                            className="w-full py-2 pl-3 pr-10 rounded-xl border border-orange-300 font-extrabold text-stone-900 text-sm focus:ring-2 focus:ring-orange-500"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">
                            kcal
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-stone-700 block mb-1">
                          Trainingszeit:
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="5"
                            max="240"
                            step="5"
                            value={durationMinutes}
                            onChange={(e) => setDurationMinutes(Number(e.target.value))}
                            className="w-full py-2 pl-3 pr-10 rounded-xl border border-stone-200 font-extrabold text-stone-900 text-sm"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">
                            Min
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-[11px] text-stone-500 leading-snug bg-orange-50/60 p-2.5 rounded-xl border border-orange-100">
                      💡 <strong>Tipp:</strong> Trage einfach den verbrauchten Kalorienwert ein, den der Monitor deines Crosstrainers anzeigt.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 pt-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-stone-500 font-medium">Trainingszeit:</span>
                      <span className="font-extrabold text-orange-950 bg-orange-100 px-2 py-0.5 rounded-full">
                        {durationMinutes} Minuten
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[15, 20, 30, 45].map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setDurationMinutes(m)}
                          className={`py-1.5 rounded-xl border text-center transition-all cursor-pointer ${
                            durationMinutes === m
                              ? 'border-orange-600 bg-orange-600 text-white font-bold shadow-sm'
                              : 'border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs font-medium'
                          }`}
                        >
                          {m} Min
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : isQuest3 ? (
              /* SPEZIAL 3: META QUEST 3 SPORT (VR Badminton/Tennis Schätzwert oder Move Tracker) */
              <div className="space-y-3 bg-white p-3.5 rounded-2xl border border-orange-200/90 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">🥽</span>
                    <span className="text-xs font-extrabold text-stone-800">Meta Quest 3 Sport</span>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-orange-100 text-orange-950 px-2 py-0.5 rounded-full">
                    VR Fitness
                  </span>
                </div>

                {/* Modus Umschalter */}
                <div className="grid grid-cols-2 gap-1 p-1 bg-stone-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setQuestMode('estimate_racket');
                      setDurationMinutes(45);
                    }}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer text-center ${
                      questMode === 'estimate_racket'
                        ? 'bg-white text-orange-950 shadow-2xs'
                        : 'text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    🎾 VR Badminton / Tennis
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setQuestMode('manual_move');
                      setDurationMinutes(45);
                    }}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer text-center ${
                      questMode === 'manual_move'
                        ? 'bg-white text-orange-950 shadow-2xs'
                        : 'text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    🥽 Quest Move Tracker
                  </button>
                </div>

                {questMode === 'estimate_racket' ? (
                  <div className="space-y-2.5 pt-1">
                    <div className="bg-orange-50/70 p-2.5 rounded-xl border border-orange-200/70 text-[11px] text-stone-700 leading-snug">
                      🎾 <strong>Schätzwert VR-Racketsport:</strong> Basierend auf Messungen des VR Health Institute (~6.5 MET). Bei VR Badminton & Tennis bist du ständig in Bewegung (Schwünge, Ausfallschritte, Körperspannung).
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="text-stone-500 font-medium">Spielzeit wählen:</span>
                      <span className="font-extrabold text-orange-950 bg-orange-100 px-2 py-0.5 rounded-full">
                        {durationMinutes} Minuten ({Math.round((durationMinutes / 60) * 10) / 10} Std)
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-1.5">
                      {[20, 30, 45, 60].map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setDurationMinutes(m)}
                          className={`py-1.5 rounded-xl border text-center transition-all cursor-pointer ${
                            durationMinutes === m
                              ? 'border-orange-600 bg-orange-600 text-white font-bold shadow-sm'
                              : 'border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs font-medium'
                          }`}
                        >
                          {m} Min
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 pt-1">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] font-bold text-stone-700 block mb-1">
                          Quest Move Kalorien:
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="10"
                            max="3000"
                            step="5"
                            placeholder="z.B. 310"
                            value={manualCalories}
                            onChange={(e) => setManualCalories(e.target.value)}
                            className="w-full py-2 pl-3 pr-10 rounded-xl border border-orange-300 font-extrabold text-stone-900 text-sm focus:ring-2 focus:ring-orange-500"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">
                            kcal
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-stone-700 block mb-1">
                          Spielzeit:
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="5"
                            max="240"
                            step="5"
                            value={durationMinutes}
                            onChange={(e) => setDurationMinutes(Number(e.target.value))}
                            className="w-full py-2 pl-3 pr-10 rounded-xl border border-stone-200 font-extrabold text-stone-900 text-sm"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">
                            Min
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-[11px] text-stone-500 leading-snug bg-orange-50/60 p-2.5 rounded-xl border border-orange-100">
                      💡 <strong>Tipp:</strong> Lies den Wert einfach im Meta Quest Move Overlay oder in der Meta Quest Smartphone-App ab.
                    </p>
                  </div>
                )}
              </div>
            ) : isDogWalk ? (
              /* STANDARD: DOG WALK */
              <div className="space-y-2 bg-white p-3 rounded-xl border border-stone-200/70">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-orange-600" />
                    <span>Halbstündige Einheiten wählen:</span>
                  </span>
                  <span className="text-xs font-extrabold text-orange-950 bg-orange-100 px-2 py-0.5 rounded-full">
                    {halfHourUnits} {halfHourUnits === 1 ? 'Einheit' : 'Einheiten'} = {durationMinutes} Min ({durationMinutes / 60} Std)
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-1.5 pt-1">
                  {[1, 2, 3, 4].map((unit) => {
                    const mins = unit * 30;
                    const isActive = durationMinutes === mins;
                    return (
                      <button
                        key={unit}
                        type="button"
                        onClick={() => setDurationMinutes(mins)}
                        className={`py-2 px-1 rounded-xl border text-center transition-all cursor-pointer ${
                          isActive
                            ? 'border-orange-600 bg-orange-600 text-white font-bold shadow-sm'
                            : 'border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 font-semibold'
                        }`}
                      >
                        <span className="text-xs block">{unit}x Einheit</span>
                        <span className="text-[10px] opacity-80 block">{unit * 0.5} Std</span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs">
                  <span className="text-stone-500">Oder Einheiten schrittweise anpassen:</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setDurationMinutes(Math.max(15, durationMinutes - 30))}
                      className="w-7 h-7 rounded-lg bg-stone-100 hover:bg-stone-200 flex items-center justify-center font-bold text-stone-700 cursor-pointer"
                    >
                      -
                    </button>
                    <span className="font-bold text-stone-800 text-xs min-w-[3rem] text-center">
                      {durationMinutes} min
                    </span>
                    <button
                      type="button"
                      onClick={() => setDurationMinutes(durationMinutes + 30)}
                      className="w-7 h-7 rounded-lg bg-stone-100 hover:bg-stone-200 flex items-center justify-center font-bold text-stone-700 cursor-pointer"
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
                    <Clock className="w-3.5 h-3.5 text-orange-600" />
                    <span>Dauer festlegen:</span>
                  </span>
                  <span className="text-xs font-extrabold text-orange-950 bg-orange-100 px-2 py-0.5 rounded-full">
                    {durationMinutes} Minuten ({Math.round((durationMinutes / 60) * 10) / 10} Std)
                  </span>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5">
                  {[20, 30, 45, 60, 90, 120].map((mins) => {
                    const isActive = durationMinutes === mins;
                    return (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => setDurationMinutes(mins)}
                        className={`py-1.5 rounded-xl border text-center transition-all cursor-pointer ${
                          isActive
                            ? 'border-orange-600 bg-orange-600 text-white font-bold shadow-sm'
                            : 'border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs font-medium'
                        }`}
                      >
                        {mins < 60 ? `${mins}m` : mins === 60 ? '1 Std' : `${mins / 60} Std`}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-3 pt-2 border-t border-stone-100">
                  <input
                    type="range"
                    min="10"
                    max="180"
                    step="5"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="flex-1 accent-orange-600 cursor-pointer"
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

            {/* INTENSITY LEVEL (Nur bei automatischer Berechnung und nicht bei Josies Workout / Pedometer) */}
            {!isManualMode && !isJosiesWorkout && !isPedometer ? (
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-500 font-medium">Intensität:</span>
                <div className="flex gap-1">
                  {(['light', 'moderate', 'intense'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setIntensity(lvl)}
                      className={`py-1 px-2.5 rounded-lg border text-[11px] font-semibold transition-all cursor-pointer ${
                        intensity === lvl
                          ? 'border-orange-600 bg-orange-600 text-white shadow-xs'
                          : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                      }`}
                    >
                      {isDogWalk
                        ? lvl === 'light'
                          ? '🐕 Schnüffeln mit Snoopy'
                          : lvl === 'moderate'
                          ? '🐾 Gassi mit Snoopy'
                          : '⚡ Flottes Gehen mit Snoopy'
                        : isJumpingFit
                        ? lvl === 'light'
                          ? 'Einfedern'
                          : lvl === 'moderate'
                          ? 'Voller Einsatz'
                          : 'Maximalkraft'
                        : isQuest3
                        ? lvl === 'light'
                          ? 'Locker'
                          : lvl === 'moderate'
                          ? 'Match-Modus'
                          : 'Turnier-Puls'
                        : lvl === 'light'
                        ? 'Gemütlich'
                        : lvl === 'moderate'
                        ? 'Moderat'
                        : 'Anstrengend'}
                    </button>
                  ))}
                </div>
              </div>
            ) : isManualMode ? (
              <div className="flex items-center justify-between text-xs py-1.5 px-3 rounded-xl bg-orange-50/70 border border-orange-200/60 text-stone-700">
                <span className="font-bold text-orange-950">Intensität:</span>
                <span className="text-[11px] text-orange-800 font-semibold">Exakt durch Gerätemesswert erfasst</span>
              </div>
            ) : null}

            {/* LIVE CALORIE RESULT HERO BANNER */}
            <div className={`p-3.5 rounded-2xl border space-y-2.5 transition-all ${
              isPenance
                ? 'bg-gradient-to-br from-purple-500/15 via-purple-500/10 to-indigo-500/5 border-purple-300 ring-2 ring-purple-200'
                : 'bg-gradient-to-br from-orange-500/15 via-amber-500/10 to-orange-500/5 border-orange-200/90'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-sm ${
                    isPenance ? 'bg-purple-600 text-white' : 'bg-orange-500 text-white'
                  }`}>
                    {isPenance ? '🙏' : <Flame className="w-5 h-5" />}
                  </div>
                  <div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider block ${
                      isPenance ? 'text-purple-800' : 'text-orange-800'
                    }`}>
                      {isPenance ? 'Buße-Modus aktiv' : isManualMode ? 'Direkter Messwert' : isPedometer ? 'Schritte-Bonus' : 'Netto-Mehrverbrauch'}
                    </span>
                    <span className={`text-xs font-medium ${isPenance ? 'text-purple-950 font-semibold' : 'text-orange-950'}`}>
                      {isPenance
                        ? 'Wird verbrannt, aber nicht dem Essensbudget gutgeschrieben'
                        : isPedometer
                        ? `Netto ${pedometerNetSteps.toLocaleString('de-DE')} Extra-Schritte`
                        : isManualMode
                        ? `Vom Gerätedisplay / Quest Move (${durationMinutes} Min)`
                        : `Für dein Profil (${userWeight} kg • ${durationMinutes} Min)`}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`text-2xl font-black leading-none block ${
                    isPenance ? 'text-purple-950' : 'text-orange-950'
                  }`}>
                    +{calculatedKcal} <span className="text-xs font-bold">kcal</span>
                  </span>
                  <span className={`text-[10px] font-bold ${
                    isPenance ? 'text-purple-700' : 'text-orange-700'
                  }`}>
                    {isPenance ? '🙏 Sünden-Ausgleich' : 'echtes Zusatzbudget'}
                  </span>
                </div>
              </div>

              {/* TRANSPARENTE NETTO-VERBRAUCHS-ERKLÄRUNG */}
              <div className={`pt-2 border-t text-[10px] space-y-1.5 ${
                isPenance ? 'border-purple-200/70 text-purple-950' : 'border-orange-200/70 text-stone-600'
              }`}>
                <div className="flex items-center justify-between font-medium">
                  <span>Körper-Gesamtumsatz (Brutto): ~{calorieBreakdown.grossCalories} kcal</span>
                  <span>Ruhe-Grundumsatz: ~{calorieBreakdown.restingCalories} kcal</span>
                </div>
                <div className={`p-2 rounded-xl border flex items-start gap-1.5 leading-relaxed ${
                  isPenance
                    ? 'bg-purple-100/70 border-purple-200 text-purple-950'
                    : 'bg-white/80 border-orange-100 text-stone-600'
                }`}>
                  <Info className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isPenance ? 'text-purple-700' : 'text-orange-600'}`} />
                  <span>
                    {isPenance ? (
                      <>
                        <strong>Buße-Ausgleich:</strong> Du verbrennst <strong>{calculatedKcal} kcal</strong> für deine Fitness und dein Gewissen. Diese Kalorien werden <em>nicht</em> auf dein Essensbudget aufgeschlagen, sodass du dir damit keine neuen Mahlzeiten erarbeitest.
                      </>
                    ) : isPedometer ? (
                      <>
                        <strong>Pedometer-Abrechnung:</strong> Deine Alltags-Schritte ({baselineSteps.toLocaleString('de-DE')}) sind bereits in deinem Grundbedarf einkalkuliert. Die +{pedometerNetSteps.toLocaleString('de-DE')} Extra-Schritte bringen dir <strong>+{calculatedKcal} kcal</strong> echtes Extra-Budget.
                      </>
                    ) : isManualMode ? (
                      <>
                        <strong>Direkter Messwert:</strong> Dieser Kalorienwert stammt direkt von deinem Trainingsgerät bzw. Headset und wird deinem Tagesbudget voll gutgeschrieben.
                      </>
                    ) : (
                      <>
                        <strong>Echte Netto-Berechnung:</strong> Dein Ruhe-Grundumsatz (~{calorieBreakdown.restingCalories} kcal in {durationMinutes} Min) ist bereits in deinem Tagesziel enthalten. Wir schreiben dir nur den echten Bewegungs-Mehrverbrauch (+{calculatedKcal} kcal) gut – damit dein Kaloriendefizit realistisch bleibt.
                      </>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Submit */}
          <button
            type="button"
            onClick={handleSaveActivity}
            disabled={durationMinutes <= 0 || (isManualMode && !hasValidManualKcal) || (calculatedKcal <= 0 && !isPedometer)}
            className={`w-full py-4 rounded-2xl text-white font-bold text-sm shadow-soft transition-all flex items-center justify-center gap-2 cursor-pointer ${
              durationMinutes <= 0 || (isManualMode && !hasValidManualKcal) || (calculatedKcal <= 0 && !isPedometer)
                ? 'bg-stone-300 cursor-not-allowed'
                : isPenance
                ? 'bg-purple-700 hover:bg-purple-800 shadow-purple-300 active:scale-[0.99]'
                : 'bg-orange-600 hover:bg-orange-700 active:scale-[0.99]'
            }`}
          >
            <Check className="w-5 h-5" />
            <span>
              {isManualMode && !hasValidManualKcal
                ? 'Bitte Kalorienwert eingeben'
                : isPenance
                ? `Aktivität als Buße eintragen (${calculatedKcal} kcal verbrennen)`
                : isPedometer && calculatedKcal === 0
                ? 'Schritte eintragen (Basis-Schritte erreicht)'
                : `Aktivität eintragen (+${calculatedKcal} kcal Budget)`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
