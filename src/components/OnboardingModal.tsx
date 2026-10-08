import { useState, useMemo, type FormEvent } from 'react';
import { db, type UserProfile } from '../db/db';
import { calculateNutritionTargets, type DailyStepLevel, type WorkoutIntensity } from '../utils/nutrition';
import { Sparkles, ArrowRight, ShieldCheck, Dumbbell, Footprints, X, Upload } from 'lucide-react';
import { BackupManagerModal } from './BackupManagerModal';

interface OnboardingModalProps {
  onComplete: () => void;
  initialProfile?: UserProfile | null;
}

export const OnboardingModal = ({ onComplete, initialProfile }: OnboardingModalProps) => {
  const [gender, setGender] = useState<'female' | 'male'>(initialProfile?.gender || 'female');
  const [name, setName] = useState(
    initialProfile?.name && initialProfile.name !== 'Du' ? initialProfile.name : ''
  );
  const [age, setAge] = useState<number>(initialProfile?.age || 30);
  const [height, setHeight] = useState<number>(initialProfile?.height || 170);
  const [weight, setWeight] = useState<number>(initialProfile?.weight || 75);
  const [targetWeight, setTargetWeight] = useState<number>(initialProfile?.targetWeight || 68);
  const [goalType, setGoalType] = useState<'lose_weight' | 'maintain_weight'>(
    initialProfile?.goalType || (initialProfile?.goalDeficit === 0 ? 'maintain_weight' : 'lose_weight')
  );
  
  // Fine-tuned daily movement states
  const [stepLevel, setStepLevel] = useState<DailyStepLevel>(initialProfile?.stepLevel || 'moderate_walk');
  const [trackWorkoutsDaily, setTrackWorkoutsDaily] = useState<boolean>(initialProfile?.trackWorkoutsDaily ?? true);
  const [workoutSessions, setWorkoutSessions] = useState<number>(initialProfile?.workoutSessionsPerWeek ?? 1);
  const [workoutIntensity, setWorkoutIntensity] = useState<WorkoutIntensity>(initialProfile?.workoutIntensity || 'intense');

  const [goalDeficit, setGoalDeficit] = useState<number>(initialProfile?.goalDeficit || 500);

  const effectiveDeficit = goalType === 'maintain_weight' ? 0 : (goalDeficit || 500);
  const [showBackupModal, setShowBackupModal] = useState(false);

  // Live calculation of targets using Mifflin-St. Jeor with fine-grained movement
  const calculation = useMemo(() => {
    return calculateNutritionTargets({
      gender,
      age: Number(age) || 30,
      height: Number(height) || 170,
      weight: Number(weight) || 75,
      stepLevel,
      trackWorkoutsDaily,
      workoutSessionsPerWeek: trackWorkoutsDaily ? 0 : workoutSessions,
      workoutIntensity,
      deficit: effectiveDeficit,
    });
  }, [gender, age, height, weight, stepLevel, trackWorkoutsDaily, workoutSessions, workoutIntensity, effectiveDeficit]);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    const profile: UserProfile = {
      id: 'current',
      name: name.trim(),
      gender,
      age: Number(age),
      height: Number(height),
      weight: Number(weight),
      targetWeight: goalType === 'maintain_weight' ? Number(weight) : Number(targetWeight),
      activityLevel: calculation.effectivePAL,
      stepLevel,
      trackWorkoutsDaily,
      workoutSessionsPerWeek: trackWorkoutsDaily ? 0 : workoutSessions,
      workoutIntensity,
      goalType,
      goalDeficit: effectiveDeficit,
      maintenanceCalories: calculation.tdee,
      targetCalories: calculation.targetCalories,
      targetProtein: calculation.targetProtein,
      targetCarbs: calculation.targetCarbs,
      targetFat: calculation.targetFat,
      waterGoal: 2500,
      isOnboarded: true,
      createdAt: initialProfile?.createdAt || new Date().toISOString(),
    };

    await db.userProfile.put(profile);

    // Also register first weight entry in log
    const today = new Date().toISOString().split('T')[0];
    const existingLog = await db.weightLogs.where({ date: today }).first();
    if (!existingLog) {
      await db.weightLogs.add({
        date: today,
        weight: Number(weight),
        timestamp: Date.now(),
      });
    }

    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-surface-card rounded-t-3xl sm:rounded-3xl shadow-soft-lg border border-surface-border overflow-hidden max-h-[92vh] flex flex-col">
        
        {/* Header - Bleibt immer sichtbar oben fixiert, wird nie abgeschnitten */}
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 p-4 px-6 border-b border-surface-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white shadow-2xs rounded-2xl flex items-center justify-center text-xl border border-emerald-100 shrink-0">
              🥗
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-800">Bedarfsberechnung</h2>
              <p className="text-xs text-stone-500">
                Mifflin-St. Jeor Formel & exakter Tagesbedarf
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onComplete}
            className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-500 transition-colors cursor-pointer shrink-0"
            title="Schließen"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Handywechsel / Migration Banner */}
          <div className="p-3.5 bg-gradient-to-r from-blue-50 via-indigo-50/50 to-blue-50 border border-blue-200/80 rounded-2xl flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center text-base shrink-0">
                📱
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-blue-900 truncate">Handy gewechselt?</div>
                <div className="text-[11px] text-blue-700/80 leading-tight">Backup mit 1 Klick einspielen</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowBackupModal(true)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Backup laden</span>
            </button>
          </div>

          {/* Dein Vorname */}
          <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100/90 space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
              <span>👤</span> Dein Vorname
            </label>
            <input
              type="text"
              placeholder="Wie heißt du? (z. B. Remmi)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-emerald-200/80 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white text-stone-800 font-semibold text-sm placeholder:text-stone-400 placeholder:font-normal"
            />
            <p className="text-[11px] text-emerald-700/80">
              Für deine persönliche Begrüßung auf dem Dashboard.
            </p>
          </div>

          {/* Gender */}
          <div className="space-y-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-stone-500">Biologisches Profil</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setGender('female')}
                className={`py-3 px-4 rounded-2xl border text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                  gender === 'female'
                    ? 'border-emerald-500 bg-emerald-50/80 text-emerald-800 shadow-sm'
                    : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                }`}
              >
                <span>Weiblich</span>
              </button>
              <button
                type="button"
                onClick={() => setGender('male')}
                className={`py-3 px-4 rounded-2xl border text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                  gender === 'male'
                    ? 'border-emerald-500 bg-emerald-50/80 text-emerald-800 shadow-sm'
                    : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                }`}
              >
                <span>Männlich</span>
              </button>
            </div>
          </div>

          {/* Körperdaten */}
          <div className="space-y-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-stone-500">Körperdaten</label>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <span className="text-xs text-stone-500 block mb-1">Alter</span>
                <div className="relative">
                  <input
                    type="number"
                    min="14"
                    max="100"
                    required
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-2xl border border-stone-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-stone-800 font-semibold text-center"
                  />
                  <span className="text-[10px] text-stone-400 block text-center mt-0.5">Jahre</span>
                </div>
              </div>

              <div>
                <span className="text-xs text-stone-500 block mb-1">Größe</span>
                <div className="relative">
                  <input
                    type="number"
                    min="100"
                    max="230"
                    required
                    value={height}
                    onChange={(e) => setHeight(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-2xl border border-stone-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-stone-800 font-semibold text-center"
                  />
                  <span className="text-[10px] text-stone-400 block text-center mt-0.5">cm</span>
                </div>
              </div>

              <div>
                <span className="text-xs text-stone-500 block mb-1">Gewicht</span>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="30"
                    max="250"
                    required
                    value={weight}
                    onChange={(e) => setWeight(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-2xl border border-stone-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-stone-800 font-semibold text-center"
                  />
                  <span className="text-[10px] text-stone-400 block text-center mt-0.5">kg</span>
                </div>
              </div>
            </div>

            <div className="mt-2">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-stone-600 font-medium">Wunschgewicht</span>
                <span className="text-xs font-bold text-emerald-600">{targetWeight} kg ({weight > targetWeight ? `-${(weight - targetWeight).toFixed(1)} kg` : 'Ziel erreicht'})</span>
              </div>
              <input
                type="number"
                step="0.5"
                min="35"
                max="200"
                value={targetWeight}
                onChange={(e) => setTargetWeight(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-2xl border border-stone-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-semibold text-stone-800 text-sm"
              />
            </div>
          </div>

          {/* SÄULE 1: ALLTAGSBEWEGUNG / BERUF (NEAT) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                <Footprints className="w-3.5 h-3.5 text-emerald-600" />
                Säule 1: Alltagsbewegung & Beruf
              </label>
              <span className="text-[10px] text-stone-400">Ohne Sport</span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {[
                {
                  key: 'sedentary' as DailyStepLevel,
                  icon: '🪑',
                  title: 'Überwiegend sitzend',
                  desc: 'Reiner Bürojob / Homeoffice, Auto-Pendler, meist unter 4.000 Schritte am Tag',
                },
                {
                  key: 'moderate_walk' as DailyStepLevel,
                  icon: '🐕',
                  title: 'Sitzend + regelmäßige Gänge / Hund',
                  desc: 'Büroalltag, aber mit täglichen Spaziergängen, Hunderunde oder Wegen zu Fuß (~5.000–9.000 Schritte)',
                  badge: 'Sehr häufig',
                },
                {
                  key: 'active_standing' as DailyStepLevel,
                  icon: '👟',
                  title: 'Viel auf den Beinen',
                  desc: 'Verkauf, Pflege, Kita/Schule, Gastronomie, Handwerk (~10.000–15.000 Schritte)',
                },
                {
                  key: 'heavy_work' as DailyStepLevel,
                  icon: '🔨',
                  title: 'Schwere körperliche Arbeit',
                  desc: 'Bauarbeiten, Land- & Forstwirtschaft, körperliche Höchstbelastung',
                },
              ].map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setStepLevel(opt.key)}
                  className={`p-3 rounded-2xl border text-left transition-all relative flex items-start gap-3 ${
                    stepLevel === opt.key
                      ? 'border-emerald-500 bg-emerald-50/70 shadow-sm'
                      : 'border-stone-100 hover:border-stone-200 bg-white'
                  }`}
                >
                  <span className="text-xl mt-0.5">{opt.icon}</span>
                  <div className="flex-1 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-stone-800">{opt.title}</span>
                      {opt.badge && (
                        <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full">
                          {opt.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-500 mt-0.5">{opt.desc}</p>
                  </div>
                  <div className={`w-4 h-4 rounded-full border mt-1 flex items-center justify-center shrink-0 ${
                    stepLevel === opt.key ? 'border-emerald-500 bg-emerald-500' : 'border-stone-300'
                  }`}>
                    {stepLevel === opt.key && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* SÄULE 2: SPORT & TRAINING */}
          <div className="space-y-3 p-4 bg-stone-50/80 rounded-2xl border border-stone-200/60">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
                <Dumbbell className="w-3.5 h-3.5 text-purple-600" />
                Säule 2: Gezielter Sport & Training
              </label>
              <span className="text-[10px] text-stone-400">Bedarfsrechner</span>
            </div>

            {/* Checkbox: Tagesgenaue Erfassung (Empfohlen) */}
            <label className="flex items-start gap-3 p-3 bg-white rounded-xl border border-emerald-200/80 hover:border-emerald-300 cursor-pointer transition-all shadow-2xs">
              <input
                type="checkbox"
                checked={trackWorkoutsDaily}
                onChange={(e) => setTrackWorkoutsDaily(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-stone-300 shrink-0 cursor-pointer"
              />
              <div className="text-xs leading-snug">
                <div className="font-bold text-stone-900 flex items-center gap-1.5">
                  <span>⚡</span> Sport tagesgenau über Aktivitäten erfassen (Empfohlen)
                </div>
                <div className="text-[11px] text-stone-500 mt-0.5">
                  Workouts (Jumping Fit, Crosstrainer, Quest 3) werden live an dem Tag gutgeschrieben, an dem du trainierst. Verhindert Doppelzählungen und schützt dein Defizit an Ruhetagen!
                </div>
              </div>
            </label>

            {/* Falls NICHT tagesgenau: Zeige Frequenz & Intensität für feste Pauschale */}
            {!trackWorkoutsDaily && (
              <div className="space-y-3 pt-2 border-t border-stone-200/60 animate-in fade-in">
                <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200 text-[11px] text-amber-950">
                  ℹ️ <strong>Feste Pauschale:</strong> Wenn du Sport nicht einzeln erfassen möchtest, wird hier ein gleichmäßiger Kalorienbonus auf alle 7 Wochentage verteilt.
                </div>

                {/* Frequenz */}
                <div>
                  <span className="text-xs text-stone-500 block mb-1.5">Wie oft machst du Sport?</span>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { count: 0, label: '0x', desc: 'Kein Sport' },
                      { count: 1, label: '1–2x', desc: 'Gelegentlich' },
                      { count: 3, label: '3–4x', desc: 'Regelmäßig' },
                      { count: 5, label: '5+x', desc: 'Ambitioniert' },
                    ].map((s) => (
                      <button
                        key={s.count}
                        type="button"
                        onClick={() => setWorkoutSessions(s.count)}
                        className={`py-2 px-2 rounded-xl border text-center transition-all cursor-pointer ${
                          workoutSessions === s.count
                            ? 'border-purple-500 bg-purple-50 text-purple-900 font-bold shadow-sm'
                            : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                        }`}
                      >
                        <div className="text-sm font-bold">{s.label}</div>
                        <div className="text-[10px] text-stone-400">{s.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Intensität (nur wenn Einheiten > 0) */}
                {workoutSessions > 0 && (
                  <div className="pt-2 border-t border-stone-200/60 space-y-2">
                    <span className="text-xs text-stone-500 block">Welche Art von Training machst du vorwiegend?</span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setWorkoutIntensity('gentle')}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                          workoutIntensity === 'gentle'
                            ? 'border-purple-500 bg-purple-50 text-purple-900 shadow-sm'
                            : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                        }`}
                      >
                        <div className="text-lg">🧘</div>
                        <div className="text-xs font-bold mt-1">Sanft & Moderat</div>
                        <div className="text-[10px] text-stone-500 mt-0.5 leading-snug">
                          Rückenfit, Yoga, Pilates, leichtes Radfahren (~200 kcal)
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setWorkoutIntensity('intense')}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                          workoutIntensity === 'intense'
                            ? 'border-purple-500 bg-purple-50 text-purple-900 shadow-sm'
                            : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                        }`}
                      >
                        <div className="text-lg">🏋️</div>
                        <div className="text-xs font-bold mt-1">Intensiv & Vollgas</div>
                        <div className="text-[10px] text-stone-500 mt-0.5 leading-snug">
                          Kraftsport, HIIT, schweißtreibendes Laufen, Spinning (~450 kcal)
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Ziel / Kaloriendefizit */}
          <div className="space-y-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-stone-500">Dein Hauptziel</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setGoalType('lose_weight')}
                className={`p-3 rounded-2xl border text-center transition-all ${
                  goalType === 'lose_weight'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-sm font-bold'
                    : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                }`}
              >
                <div className="text-xl mb-1">🎯</div>
                <div className="text-xs font-bold">Gewicht abnehmen</div>
                <div className="text-[10px] text-stone-400 mt-0.5">Mit gesundem Kaloriendefizit</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setGoalType('maintain_weight');
                  setTargetWeight(weight);
                }}
                className={`p-3 rounded-2xl border text-center transition-all ${
                  goalType === 'maintain_weight'
                    ? 'border-amber-500 bg-amber-50 text-amber-900 shadow-sm font-bold'
                    : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                }`}
              >
                <div className="text-xl mb-1">⚖️</div>
                <div className="text-xs font-bold">Gewicht halten</div>
                <div className="text-[10px] text-stone-400 mt-0.5">Erhaltungsbedarf (weder ab- noch zunehmen)</div>
              </button>
            </div>

            {goalType === 'lose_weight' ? (
              <div className="space-y-2 pt-1">
                <label className="text-[11px] font-semibold text-stone-500 block">Dein Abnehm-Tempo</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { deficit: 250, label: 'Sanft', rate: 'ca. 1 kg/Monat' },
                    { deficit: 500, label: 'Moderat', rate: 'ca. 2 kg/Monat', badge: 'Optimal' },
                    { deficit: 750, label: 'Zügig', rate: 'ca. 3 kg/Monat' },
                  ].map((d) => (
                    <button
                      key={d.deficit}
                      type="button"
                      onClick={() => setGoalDeficit(d.deficit)}
                      className={`p-3 rounded-2xl border text-center transition-all relative ${
                        goalDeficit === d.deficit
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-sm'
                          : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                      }`}
                    >
                      {d.badge && (
                        <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                          {d.badge}
                        </span>
                      )}
                      <div className="text-sm font-bold">{d.label}</div>
                      <div className="text-[11px] text-stone-500 mt-0.5">-{d.deficit} kcal</div>
                      <div className="text-[10px] text-emerald-600 font-medium mt-1">{d.rate}</div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-2xl text-xs text-amber-950 flex items-center gap-2.5">
                <span className="text-xl">✨</span>
                <div>
                  <span className="font-bold block">100 % Erhaltungsenergie</span>
                  <span className="text-[11px] text-amber-800">
                    Dein Zielbudget entspricht genau deinem Gesamtverbrauch ({calculation.tdee} kcal). Du nimmst heute nicht ab, aber eben auch nicht zu!
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Ergebnis-Vorschau Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-200/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                Dein persönliches Budget
              </span>
              <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-semibold">
                BMI: {calculation.bmi} ({calculation.bmiCategory})
              </span>
            </div>

            <div className="flex items-baseline justify-between pt-1">
              <div>
                <span className="text-3xl font-extrabold text-stone-800">{calculation.targetCalories}</span>
                <span className="text-sm text-stone-500 ml-1.5 font-medium">kcal / Tag</span>
              </div>
              <div className="text-right text-xs text-stone-500">
                Verbrauch: <span className="font-semibold text-stone-700">{calculation.tdee} kcal</span>
                {calculation.workoutDailyBonus > 0 && (
                  <span className="text-purple-600 block text-[10px] font-semibold">
                    (inkl. +{calculation.workoutDailyBonus} kcal Sport-Bonus)
                  </span>
                )}
              </div>
            </div>

            {/* Makros */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-emerald-100/80">
              <div className="bg-white/80 p-2 rounded-xl text-center shadow-card">
                <span className="text-[10px] text-violet-600 font-semibold block uppercase">Protein</span>
                <span className="text-sm font-bold text-stone-800">{calculation.targetProtein} g</span>
                <span className="text-[10px] text-stone-400 block">Muskelschutz</span>
              </div>
              <div className="bg-white/80 p-2 rounded-xl text-center shadow-card">
                <span className="text-[10px] text-amber-600 font-semibold block uppercase">Carbs</span>
                <span className="text-sm font-bold text-stone-800">{calculation.targetCarbs} g</span>
                <span className="text-[10px] text-stone-400 block">Energie</span>
              </div>
              <div className="bg-white/80 p-2 rounded-xl text-center shadow-card">
                <span className="text-[10px] text-cyan-600 font-semibold block uppercase">Fett</span>
                <span className="text-sm font-bold text-stone-800">{calculation.targetFat} g</span>
                <span className="text-[10px] text-stone-400 block">Hormone</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-stone-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>100 % lokal: Deine Daten verlassen dein Smartphone zu keinem Zeitpunkt.</span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-base shadow-soft transition-all flex items-center justify-center gap-2"
          >
            <span>Plan übernehmen & starten</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>
      </div>

      {showBackupModal && (
        <BackupManagerModal
          isOpen={showBackupModal}
          onClose={() => setShowBackupModal(false)}
          initialMode="import"
          onSuccess={() => {
            setShowBackupModal(false);
            onComplete();
          }}
        />
      )}
    </div>
  );
};
