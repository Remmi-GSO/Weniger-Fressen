import { useState, useMemo, type FormEvent } from 'react';
import { db, type UserProfile } from '../db/db';
import { calculateNutritionTargets, type DailyStepLevel, type WorkoutIntensity } from '../utils/nutrition';
import { Sparkles, ArrowRight, ShieldCheck, Dumbbell, Footprints } from 'lucide-react';

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
  
  // Fine-tuned daily movement states
  const [stepLevel, setStepLevel] = useState<DailyStepLevel>(initialProfile?.stepLevel || 'moderate_walk');
  const [workoutSessions, setWorkoutSessions] = useState<number>(initialProfile?.workoutSessionsPerWeek ?? 1);
  const [workoutIntensity, setWorkoutIntensity] = useState<WorkoutIntensity>(initialProfile?.workoutIntensity || 'gentle');

  const [goalDeficit, setGoalDeficit] = useState<number>(initialProfile?.goalDeficit || 500);

  // Live calculation of targets using Mifflin-St. Jeor with fine-grained movement
  const calculation = useMemo(() => {
    return calculateNutritionTargets({
      gender,
      age: Number(age) || 30,
      height: Number(height) || 170,
      weight: Number(weight) || 75,
      stepLevel,
      workoutSessionsPerWeek: workoutSessions,
      workoutIntensity,
      deficit: goalDeficit,
    });
  }, [gender, age, height, weight, stepLevel, workoutSessions, workoutIntensity, goalDeficit]);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    const profile: UserProfile = {
      id: 'current',
      name: name.trim(),
      gender,
      age: Number(age),
      height: Number(height),
      weight: Number(weight),
      targetWeight: Number(targetWeight),
      activityLevel: calculation.effectivePAL,
      stepLevel,
      workoutSessionsPerWeek: workoutSessions,
      workoutIntensity,
      goalDeficit,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-lg bg-surface-card rounded-3xl shadow-soft-lg border border-surface-border overflow-hidden my-6">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-green-50 p-6 border-b border-surface-border text-center">
          <div className="w-14 h-14 bg-white shadow-soft rounded-2xl flex items-center justify-center mx-auto mb-3 text-2xl border border-emerald-100">
            🥗
          </div>
          <h2 className="text-2xl font-bold text-stone-800">Dein individueller Bedarfsplan</h2>
          <p className="text-sm text-stone-500 mt-1 max-w-sm mx-auto">
            Wissenschaftliche Kalorienberechnung mit <span className="font-semibold text-emerald-700">Mifflin-St. Jeor</span> und exakter Anpassung an deinen Alltag & Sport.
          </p>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-6">
          
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
              <span className="text-[10px] text-stone-400">Pro Woche</span>
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
                    className={`py-2 px-2 rounded-xl border text-center transition-all ${
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
                    className={`p-3 rounded-2xl border text-left transition-all ${
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
                    className={`p-3 rounded-2xl border text-left transition-all ${
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

          {/* Ziel / Kaloriendefizit */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-stone-500">Dein Abnehm-Tempo</label>
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
    </div>
  );
};
