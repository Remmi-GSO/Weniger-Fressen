import { useState, useEffect, useMemo } from 'react';
import { db, DEFAULT_USER_PROFILE, type UserProfile, DEFAULT_FOOD_FOCUS, type FoodFocusSettings, DEFAULT_NUTRIENT_BARS, type DashboardNutrientBars } from '../db/db';
import { VoiceInputButton } from './VoiceInputButton';
import { X, Key, Download, Upload, Trash2, Sliders, Check, RefreshCw, CheckCircle, Maximize, Minimize, BarChart3, Scale, Sparkles, Leaf } from 'lucide-react';
import { APP_VERSION, APP_BUILD_DATE, APP_DB_VERSION, APP_CACHE_VERSION } from '../config/version';
import { calculateNutritionTargets, type DailyStepLevel, type WorkoutIntensity } from '../utils/nutrition';
import { triggerAppUpdate } from '../utils/appUpdate';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile?: UserProfile | null;
  onReopenOnboarding: () => void;
  onOpenRecipeCreator?: () => void;
  onOpenNutritionReport?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onReopenOnboarding,
  onOpenRecipeCreator,
  onOpenNutritionReport,
}) => {
  const [userName, setUserName] = useState(
    userProfile?.name && userProfile.name !== 'Du' ? userProfile.name : ''
  );
  const [apiKey, setApiKey] = useState(userProfile?.geminiApiKey || '');
  
  // Body metrics and goals
  const [gender, setGender] = useState<'female' | 'male'>(userProfile?.gender || 'female');
  const [age, setAge] = useState<number>(userProfile?.age || 30);
  const [height, setHeight] = useState<number>(userProfile?.height || 170);
  const [weight, setWeight] = useState<number>(userProfile?.weight || 75);
  const [targetWeight, setTargetWeight] = useState<number>(userProfile?.targetWeight || 68);
  const [goalType, setGoalType] = useState<'lose_weight' | 'maintain_weight'>(
    userProfile?.goalType || (userProfile?.goalDeficit === 0 ? 'maintain_weight' : 'lose_weight')
  );
  const [goalDeficit, setGoalDeficit] = useState<number>(userProfile?.goalDeficit || 500);
  const [stepLevel, setStepLevel] = useState<DailyStepLevel>(userProfile?.stepLevel || 'moderate_walk');
  const [workoutSessions, setWorkoutSessions] = useState<number>(userProfile?.workoutSessionsPerWeek ?? 1);
  const [workoutIntensity, setWorkoutIntensity] = useState<WorkoutIntensity>(userProfile?.workoutIntensity || 'gentle');

  // Food Focus / Quality filters
  const [foodFocus, setFoodFocus] = useState<FoodFocusSettings>(
    userProfile?.foodFocus || DEFAULT_FOOD_FOCUS
  );

  const [targetCalories, setTargetCalories] = useState(userProfile?.targetCalories || 1800);
  const [targetProtein, setTargetProtein] = useState(userProfile?.targetProtein || 120);
  const [targetCarbs, setTargetCarbs] = useState(userProfile?.targetCarbs || 180);
  const [targetFat, setTargetFat] = useState(userProfile?.targetFat || 55);
  const [targetFiber, setTargetFiber] = useState<number>(userProfile?.targetFiber || 30);
  const [targetSugar, setTargetSugar] = useState<number>(userProfile?.targetSugar || 35);
  const [nutrientBars, setNutrientBars] = useState<DashboardNutrientBars>(
    userProfile?.nutrientBars || DEFAULT_NUTRIENT_BARS
  );
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);

  const effectiveDeficit = goalType === 'maintain_weight' ? 0 : (goalDeficit || 500);

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
      deficit: effectiveDeficit,
    });
  }, [gender, age, height, weight, stepLevel, workoutSessions, workoutIntensity, effectiveDeficit]);

  const isStandalone = typeof window !== 'undefined' && (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
    document.referrer.includes('android-app://')
  );

  const [isFullscreen, setIsFullscreen] = useState(
    Boolean(typeof document !== 'undefined' && document.fullscreenElement)
  );

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const handleToggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        } else if ((document.documentElement as unknown as { webkitRequestFullscreen?: () => Promise<void> }).webkitRequestFullscreen) {
          await (document.documentElement as unknown as { webkitRequestFullscreen: () => Promise<void> }).webkitRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as unknown as { webkitExitFullscreen?: () => Promise<void> }).webkitExitFullscreen) {
          await (document as unknown as { webkitExitFullscreen: () => Promise<void> }).webkitExitFullscreen();
        }
      }
    } catch (err) {
      console.log('Fullscreen toggle failed', err);
    }
  };

  // Sync state when userProfile is loaded or modal opens
  useEffect(() => {
    if (isOpen && userProfile) {
      if (userProfile.name && userProfile.name !== 'Du') {
        setUserName(userProfile.name);
      } else if (!userProfile.name || userProfile.name === 'Du') {
        setUserName('');
      }
      if (userProfile.geminiApiKey !== undefined) {
        setApiKey(userProfile.geminiApiKey || '');
      }
      if (userProfile.gender) setGender(userProfile.gender);
      if (userProfile.age) setAge(userProfile.age);
      if (userProfile.height) setHeight(userProfile.height);
      if (userProfile.weight) setWeight(userProfile.weight);
      if (userProfile.targetWeight) setTargetWeight(userProfile.targetWeight);
      if (userProfile.goalType) {
        setGoalType(userProfile.goalType);
      } else if (userProfile.goalDeficit === 0) {
        setGoalType('maintain_weight');
      }
      if (userProfile.goalDeficit !== undefined) setGoalDeficit(userProfile.goalDeficit);
      if (userProfile.stepLevel) setStepLevel(userProfile.stepLevel);
      if (userProfile.workoutSessionsPerWeek !== undefined) setWorkoutSessions(userProfile.workoutSessionsPerWeek);
      if (userProfile.workoutIntensity) setWorkoutIntensity(userProfile.workoutIntensity);
      if (userProfile.foodFocus) {
        setFoodFocus({ ...DEFAULT_FOOD_FOCUS, ...userProfile.foodFocus });
      }

      if (userProfile.targetCalories) {
        setTargetCalories(userProfile.targetCalories);
      }
      if (userProfile.targetProtein) {
        setTargetProtein(userProfile.targetProtein);
      }
      if (userProfile.targetCarbs) {
        setTargetCarbs(userProfile.targetCarbs);
      }
      if (userProfile.targetFat) {
        setTargetFat(userProfile.targetFat);
      }
      if (userProfile.targetFiber) {
        setTargetFiber(userProfile.targetFiber);
      }
      if (userProfile.targetSugar) {
        setTargetSugar(userProfile.targetSugar);
      }
      if (userProfile.nutrientBars) {
        setNutrientBars({ ...DEFAULT_NUTRIENT_BARS, ...userProfile.nutrientBars });
      }
    }
  }, [userProfile, isOpen]);

  const handleCheckForUpdates = async () => {
    setIsCheckingUpdate(true);
    setUpdateMessage(null);
    try {
      setUpdateMessage('Cache geleert! App wird mit neuester Version neu geladen...');
      await triggerAppUpdate();
    } catch (err) {
      console.error('Update check failed', err);
      setUpdateMessage('Aktualisierung fehlgeschlagen.');
      setIsCheckingUpdate(false);
    }
  };

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const existing = await db.userProfile.get('current');
      const base = existing || DEFAULT_USER_PROFILE;
      const cleanName = userName.trim();

      const numWeight = Number(weight) || base.weight;
      const numTargetWeight = goalType === 'maintain_weight' ? numWeight : (Number(targetWeight) || base.targetWeight);

      await db.userProfile.put({
        ...base,
        id: 'current',
        name: cleanName,
        gender,
        age: Number(age) || base.age,
        height: Number(height) || base.height,
        weight: numWeight,
        targetWeight: numTargetWeight,
        goalType,
        goalDeficit: effectiveDeficit,
        maintenanceCalories: calculation.tdee,
        stepLevel,
        workoutSessionsPerWeek: workoutSessions,
        workoutIntensity,
        activityLevel: calculation.effectivePAL,
        geminiApiKey: apiKey.trim(),
        targetCalories: Number(targetCalories) || calculation.targetCalories,
        targetProtein: Number(targetProtein) || calculation.targetProtein,
        targetCarbs: Number(targetCarbs) || calculation.targetCarbs,
        targetFat: Number(targetFat) || calculation.targetFat,
        targetFiber: Number(targetFiber) || 30,
        targetSugar: Number(targetSugar) || 35,
        nutrientBars,
        foodFocus,
        isOnboarded: true,
      });

      // If weight changed or not yet logged today, write to weightLogs
      const today = new Date().toISOString().split('T')[0];
      const existingWeightLog = await db.weightLogs.where({ date: today }).first();
      if (!existingWeightLog) {
        await db.weightLogs.add({ date: today, weight: numWeight, timestamp: Date.now() });
      } else if (existingWeightLog.id !== undefined && existingWeightLog.weight !== numWeight) {
        await db.weightLogs.update(existingWeightLog.id, { weight: numWeight, timestamp: Date.now() });
      }

      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 700);
    } catch (err) {
      console.error('Fehler beim Speichern des Profils:', err);
    }
  };

  const handleExportData = async () => {
    const profile = await db.userProfile.toArray();
    const diary = await db.diaryEntries.toArray();
    const water = await db.waterLogs.toArray();
    const weights = await db.weightLogs.toArray();
    const fasts = await db.fastingSessions.toArray();
    const recipes = await db.recipes.toArray();
    const favoriteItems = await db.favoriteItems.toArray();
    const activityLogs = await db.activityLogs.toArray();
    const customActivities = await db.customActivities.toArray();

    const backup = {
      version: 3,
      appName: 'Weniger Fressen',
      exportDate: new Date().toISOString(),
      data: {
        profile,
        diary,
        water,
        weights,
        fasts,
        recipes,
        favoriteItems,
        activityLogs,
        customActivities,
      },
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `weniger-fressen-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.data) {
          if (json.data.profile?.length) await db.userProfile.bulkPut(json.data.profile);
          if (json.data.diary?.length) await db.diaryEntries.bulkPut(json.data.diary);
          if (json.data.water?.length) await db.waterLogs.bulkPut(json.data.water);
          if (json.data.weights?.length) await db.weightLogs.bulkPut(json.data.weights);
          if (json.data.fasts?.length) await db.fastingSessions.bulkPut(json.data.fasts);
          if (json.data.recipes?.length) await db.recipes.bulkPut(json.data.recipes);
          if (json.data.favoriteItems?.length) await db.favoriteItems.bulkPut(json.data.favoriteItems);
          if (json.data.activityLogs?.length) await db.activityLogs.bulkPut(json.data.activityLogs);
          if (json.data.customActivities?.length) await db.customActivities.bulkPut(json.data.customActivities);
          alert('Backup erfolgreich wiederhergestellt! Alle Mahlzeiten, Rezepte und Aktivitäten wurden geladen.');
          window.location.reload();
        }
      } catch (err) {
        alert('Fehler beim Einlesen der Backup-Datei.');
      }
    };
    reader.readAsText(file);
  };

  const handleResetData = async () => {
    if (confirm('Möchtest du wirklich alle lokalen Daten löschen? Dies kann nicht rückgängig gemacht werden.')) {
      await db.delete();
      window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-soft-lg border border-stone-100 overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="p-4 px-6 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-stone-100 flex items-center justify-center text-stone-700">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-stone-800 text-base">Einstellungen & Eigenschaften</h3>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                  v{APP_VERSION}
                </span>
              </div>
              <p className="text-xs text-stone-400">Passe deine Ziele, Keys und App-Eigenschaften an</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCheckForUpdates}
              disabled={isCheckingUpdate}
              className="py-1 px-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 active:scale-95 border border-emerald-200/90 text-emerald-800 text-[11px] font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
              title="Auf neueste Version aktualisieren & Cache leeren"
            >
              <RefreshCw className={`w-3 h-3 ${isCheckingUpdate ? 'animate-spin text-emerald-600' : 'text-emerald-700'}`} />
              <span>{isCheckingUpdate ? 'Update...' : 'App updaten'}</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-500 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-6">
          
          {/* Dein Name */}
          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-stone-500 block">
              Dein Name / Wie darf die App dich nennen?
            </label>
            <div className="flex items-center gap-2.5">
              <span className="w-10 h-10 rounded-xl bg-white border border-stone-200 flex items-center justify-center text-lg shrink-0">
                👤
              </span>
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Dein Vorname (z. B. Remmi)"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full py-2.5 pl-3.5 pr-10 rounded-xl border border-stone-200 focus:border-emerald-500 font-bold text-stone-800 text-sm bg-white"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  <VoiceInputButton
                    onTranscript={(text) => setUserName(text)}
                    currentValue={userName}
                    size="xs"
                    title="Namen per Sprache einsprechen"
                  />
                </div>
              </div>
            </div>
            <p className="text-[10px] text-stone-400">
              Ersetzt das unpersönliche „Hallo Du“ durch deinen Namen auf dem Dashboard.
            </p>
          </div>

          {/* KÖRPERDATEN & ZIELE (GEWICHT, WUNSCHGEWICHT, GRÖSSE, ALTER, ZIEL) */}
          <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100/90 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-emerald-600" />
                Körperdaten & Ziel
              </span>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onReopenOnboarding();
                }}
                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 underline flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3 text-emerald-600" />
                Vollbild-Assistent
              </button>
            </div>

            {/* Ziel: Abnehmen vs. Gewicht halten */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-stone-600 block">Dein Hauptziel</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setGoalType('lose_weight');
                    setTargetCalories(calculation.targetCalories);
                    setTargetProtein(calculation.targetProtein);
                    setTargetCarbs(calculation.targetCarbs);
                    setTargetFat(calculation.targetFat);
                  }}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all text-center ${
                    goalType === 'lose_weight'
                      ? 'border-emerald-500 bg-white text-emerald-900 shadow-xs'
                      : 'border-stone-200/80 bg-white/60 text-stone-600 hover:bg-white'
                  }`}
                >
                  🎯 Gewicht abnehmen
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setGoalType('maintain_weight');
                    setTargetWeight(weight);
                    setTargetCalories(calculation.tdee);
                    setTargetProtein(calculation.targetProtein);
                    setTargetCarbs(calculation.targetCarbs);
                    setTargetFat(calculation.targetFat);
                  }}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all text-center ${
                    goalType === 'maintain_weight'
                      ? 'border-amber-500 bg-white text-amber-900 shadow-xs'
                      : 'border-stone-200/80 bg-white/60 text-stone-600 hover:bg-white'
                  }`}
                >
                  ⚖️ Gewicht halten
                </button>
              </div>
            </div>

            {/* Gewicht & Wunschgewicht */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-xs text-stone-600 font-semibold block mb-1">
                  Aktuelles Gewicht (kg)
                </span>
                <input
                  type="number"
                  step="0.1"
                  min="30"
                  max="250"
                  required
                  value={weight}
                  onChange={(e) => setWeight(Number(e.target.value))}
                  className="w-full py-2 px-3 rounded-xl border border-stone-200 bg-white text-stone-800 font-bold text-center text-sm focus:border-emerald-500"
                />
              </div>

              <div>
                <span className="text-xs text-stone-600 font-semibold block mb-1">
                  {goalType === 'maintain_weight' ? 'Ziel (Stabilisieren)' : 'Wunschgewicht (kg)'}
                </span>
                <input
                  type="number"
                  step="0.5"
                  min="35"
                  max="200"
                  required
                  disabled={goalType === 'maintain_weight'}
                  value={goalType === 'maintain_weight' ? weight : targetWeight}
                  onChange={(e) => setTargetWeight(Number(e.target.value))}
                  className={`w-full py-2 px-3 rounded-xl border text-stone-800 font-bold text-center text-sm focus:border-emerald-500 ${
                    goalType === 'maintain_weight' ? 'bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed' : 'bg-white border-stone-200'
                  }`}
                />
              </div>
            </div>

            {/* Größe & Alter & Geschlecht */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <span className="text-[11px] text-stone-500 font-semibold block mb-1">Größe (cm)</span>
                <input
                  type="number"
                  min="120"
                  max="230"
                  value={height}
                  onChange={(e) => setHeight(Number(e.target.value))}
                  className="w-full py-1.5 px-2 rounded-xl border border-stone-200 bg-white text-stone-800 font-bold text-center text-xs"
                />
              </div>

              <div>
                <span className="text-[11px] text-stone-500 font-semibold block mb-1">Alter</span>
                <input
                  type="number"
                  min="14"
                  max="100"
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  className="w-full py-1.5 px-2 rounded-xl border border-stone-200 bg-white text-stone-800 font-bold text-center text-xs"
                />
              </div>

              <div>
                <span className="text-[11px] text-stone-500 font-semibold block mb-1">Geschlecht</span>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as 'female' | 'male')}
                  className="w-full py-1.5 px-1 rounded-xl border border-stone-200 bg-white text-stone-800 font-bold text-center text-xs"
                >
                  <option value="female">Weiblich</option>
                  <option value="male">Männlich</option>
                </select>
              </div>
            </div>

            {/* Alltagsbewegung */}
            <div>
              <span className="text-[11px] text-stone-500 font-semibold block mb-1">Alltagsbewegung / Beruf</span>
              <select
                value={stepLevel}
                onChange={(e) => setStepLevel(e.target.value as DailyStepLevel)}
                className="w-full py-1.5 px-2 rounded-xl border border-stone-200 bg-white text-stone-800 font-medium text-xs"
              >
                <option value="sedentary">Überwiegend sitzend (Büro / Homeoffice, &lt; 4.000 Schritte)</option>
                <option value="moderate_walk">Sitzend + Gänge / Hund (~5.000–9.000 Schritte)</option>
                <option value="active_standing">Viel auf den Beinen (Verkauf/Pflege/Handwerk)</option>
                <option value="heavy_work">Schwere körperliche Arbeit (Bau/Landwirtschaft)</option>
              </select>
            </div>

            {/* Live-Berechnungs-Vorschau */}
            <div className="p-3 bg-white/90 rounded-xl border border-emerald-200/70 text-xs space-y-1.5">
              <div className="flex justify-between items-center text-stone-700">
                <span className="text-stone-500">Gesamtverbrauch (Gewicht halten):</span>
                <span className="font-extrabold text-stone-900">{calculation.tdee} kcal</span>
              </div>
              <div className="flex justify-between items-center text-stone-700">
                <span className="text-stone-500">
                  {goalType === 'maintain_weight' ? 'Erhaltungs-Ziel:' : 'Empfohlenes Defizit-Ziel:'}
                </span>
                <span className={`font-extrabold ${goalType === 'maintain_weight' ? 'text-amber-800' : 'text-emerald-700'}`}>
                  {calculation.targetCalories} kcal
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setTargetCalories(calculation.targetCalories);
                  setTargetProtein(calculation.targetProtein);
                  setTargetCarbs(calculation.targetCarbs);
                  setTargetFat(calculation.targetFat);
                }}
                className="w-full mt-1 py-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold text-[11px] transition-colors"
              >
                Berechnete Nährwerte ({calculation.targetCalories} kcal) unten übernehmen
              </button>
            </div>
          </div>

          {/* Dashboard-Balken & Nährstoff-Filter */}
          <div className="p-4 bg-gradient-to-br from-violet-50/60 via-stone-50/50 to-emerald-50/60 rounded-2xl border border-stone-200/90 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">📊</span>
                <div>
                  <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                    Dashboard-Balken anpassen
                  </h4>
                  <p className="text-[11px] text-stone-500">
                    Bestimme selbst, welche Fortschrittsbalken du auf der Startseite sehen möchtest.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onReopenOnboarding();
                }}
                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 underline shrink-0"
              >
                Bedarfsrechner
              </button>
            </div>

            {/* Kalorienziel */}
            <div className="p-3 bg-white rounded-xl border border-stone-200/80 flex items-center justify-between shadow-2xs">
              <div>
                <span className="text-xs font-bold text-stone-800 block">Tägliches Kalorienziel</span>
                <span className="text-[10px] text-stone-400">Budget für den Haupt-Kalorienring</span>
              </div>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="1000"
                  max="5000"
                  value={targetCalories}
                  onChange={(e) => setTargetCalories(Number(e.target.value))}
                  className="w-20 py-1 px-2 rounded-lg border border-stone-200 text-xs font-extrabold text-center text-stone-800 focus:border-emerald-500"
                />
                <span className="text-[10px] text-stone-400 font-bold">kcal</span>
              </div>
            </div>

            {/* Balken-Auswahl & Nährstoffziele */}
            <div className="space-y-2.5">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                Nährstoff-Balken ein- oder ausblenden:
              </span>

              {/* Protein */}
              <div className="p-2.5 bg-white rounded-xl border border-stone-200/80 flex items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-xs shrink-0">
                    P
                  </div>
                  <div>
                    <span className="text-xs font-bold text-stone-800 block">Protein / Eiweiß</span>
                    <span className="text-[10px] text-stone-400">Muskelschutz & Sättigung</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {nutrientBars.protein && (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="20"
                        max="400"
                        value={targetProtein}
                        onChange={(e) => setTargetProtein(Number(e.target.value))}
                        className="w-14 py-1 px-1 rounded-lg border border-stone-200 text-xs font-bold text-center text-stone-800"
                        title="Tagesziel in Gramm"
                      />
                      <span className="text-[10px] text-stone-400 font-bold">g</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setNutrientBars((prev) => ({ ...prev, protein: !prev.protein }))}
                    className={`w-11 h-6 rounded-full transition-colors p-0.5 ${
                      nutrientBars.protein ? 'bg-violet-600' : 'bg-stone-300'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      nutrientBars.protein ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
              </div>

              {/* Kohlenhydrate */}
              <div className="p-2.5 bg-white rounded-xl border border-stone-200/80 flex items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs shrink-0">
                    KH
                  </div>
                  <div>
                    <span className="text-xs font-bold text-stone-800 block">Kohlenhydrate</span>
                    <span className="text-[10px] text-stone-400">Primäre Energie</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {nutrientBars.carbs && (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        max="600"
                        value={targetCarbs}
                        onChange={(e) => setTargetCarbs(Number(e.target.value))}
                        className="w-14 py-1 px-1 rounded-lg border border-stone-200 text-xs font-bold text-center text-stone-800"
                        title="Tagesziel in Gramm"
                      />
                      <span className="text-[10px] text-stone-400 font-bold">g</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setNutrientBars((prev) => ({ ...prev, carbs: !prev.carbs }))}
                    className={`w-11 h-6 rounded-full transition-colors p-0.5 ${
                      nutrientBars.carbs ? 'bg-amber-500' : 'bg-stone-300'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      nutrientBars.carbs ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
              </div>

              {/* Fett */}
              <div className="p-2.5 bg-white rounded-xl border border-stone-200/80 flex items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-cyan-100 text-cyan-700 flex items-center justify-center font-bold text-xs shrink-0">
                    F
                  </div>
                  <div>
                    <span className="text-xs font-bold text-stone-800 block">Fett</span>
                    <span className="text-[10px] text-stone-400">Essentielle Fette & Hormone</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {nutrientBars.fat && (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="10"
                        max="300"
                        value={targetFat}
                        onChange={(e) => setTargetFat(Number(e.target.value))}
                        className="w-14 py-1 px-1 rounded-lg border border-stone-200 text-xs font-bold text-center text-stone-800"
                        title="Tagesziel in Gramm"
                      />
                      <span className="text-[10px] text-stone-400 font-bold">g</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setNutrientBars((prev) => ({ ...prev, fat: !prev.fat }))}
                    className={`w-11 h-6 rounded-full transition-colors p-0.5 ${
                      nutrientBars.fat ? 'bg-cyan-500' : 'bg-stone-300'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      nutrientBars.fat ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
              </div>

              {/* Ballaststoffe (Fiber) - SPEZIELL GEWÜNSCHT */}
              <div className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-3 shadow-2xs ${
                nutrientBars.fiber ? 'bg-emerald-50/80 border-emerald-300' : 'bg-white border-stone-200/80'
              }`}>
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center text-base shrink-0">
                    🌾
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-stone-900">Ballaststoffe</span>
                      <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded-full">
                        Empfohlen
                      </span>
                    </div>
                    <span className="text-[10px] text-stone-500 block">
                      Darmgesundheit & Sättigung (DGE: mind. 30g)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {nutrientBars.fiber && (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="10"
                        max="100"
                        value={targetFiber}
                        onChange={(e) => setTargetFiber(Number(e.target.value))}
                        className="w-14 py-1 px-1 rounded-lg border border-emerald-300 bg-white text-xs font-bold text-center text-stone-800"
                        title="Ballaststoff-Ziel in Gramm"
                      />
                      <span className="text-[10px] text-emerald-700 font-bold">g</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setNutrientBars((prev) => ({ ...prev, fiber: !prev.fiber }))}
                    className={`w-11 h-6 rounded-full transition-colors p-0.5 ${
                      nutrientBars.fiber ? 'bg-emerald-600' : 'bg-stone-300'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      nutrientBars.fiber ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
              </div>

              {/* Zucker (Obergrenze) */}
              <div className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-3 shadow-2xs ${
                nutrientBars.sugar ? 'bg-rose-50/80 border-rose-200' : 'bg-white border-stone-200/80'
              }`}>
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center text-base shrink-0">
                    🍬
                  </div>
                  <div>
                    <span className="text-xs font-bold text-stone-900 block">Zucker (Maximal-Grenze)</span>
                    <span className="text-[10px] text-stone-500 block">
                      WHO-Empfehlung: max. 25–50g/Tag
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {nutrientBars.sugar && (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="10"
                        max="150"
                        value={targetSugar}
                        onChange={(e) => setTargetSugar(Number(e.target.value))}
                        className="w-14 py-1 px-1 rounded-lg border border-rose-300 bg-white text-xs font-bold text-center text-stone-800"
                        title="Zucker-Obergrenze in Gramm"
                      />
                      <span className="text-[10px] text-rose-700 font-bold">g</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setNutrientBars((prev) => ({ ...prev, sugar: !prev.sugar }))}
                    className={`w-11 h-6 rounded-full transition-colors p-0.5 ${
                      nutrientBars.sugar ? 'bg-rose-600' : 'bg-stone-300'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      nutrientBars.sugar ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
              </div>

              {/* Netto-Kohlenhydrate */}
              <div className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-3 shadow-2xs ${
                nutrientBars.netCarbs ? 'bg-teal-50/80 border-teal-200' : 'bg-white border-stone-200/80'
              }`}>
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center text-base shrink-0">
                    🥑
                  </div>
                  <div>
                    <span className="text-xs font-bold text-stone-900 block">Netto-Kohlenhydrate</span>
                    <span className="text-[10px] text-stone-500 block">
                      Gesamtkohlenhydrate abzüglich Ballaststoffe (Low Carb)
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setNutrientBars((prev) => ({ ...prev, netCarbs: !prev.netCarbs }))}
                  className={`w-11 h-6 rounded-full transition-colors p-0.5 ${
                    nutrientBars.netCarbs ? 'bg-teal-600' : 'bg-stone-300'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    nutrientBars.netCarbs ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>

            </div>
          </div>

          {/* Ernährungs-Qualität & Fokus-Filter */}
          <div className="p-4 bg-teal-50/50 rounded-2xl border border-teal-100/90 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
                  <Leaf className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-teal-950 uppercase tracking-wider">
                    Ernährungs-Qualität & Fokus-Filter
                  </h4>
                  <span className="text-[10px] text-teal-700">Persönliche Achtsamkeits-Rückmeldungen</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setFoodFocus(DEFAULT_FOOD_FOCUS)}
                  className="text-[10px] font-bold text-teal-700 hover:text-teal-900 bg-teal-100/70 hover:bg-teal-100 px-2 py-0.5 rounded-full transition-colors"
                >
                  Standard
                </button>
              </div>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              Hake an, auf welche Nahrungsmittel du besonderes Augenmerk richten möchtest. Die App gibt dir auf dem Dashboard ehrliche, alltagstaugliche Rückmeldungen und Vorschläge für nachfolgende Mahlzeiten (z.&nbsp;B. fürs Abendessen):
            </p>

            <div className="space-y-2 pt-1">
              {/* 1. Industriezucker */}
              <label className="flex items-start gap-3 p-2.5 bg-white rounded-xl border border-teal-100 hover:border-teal-300 cursor-pointer transition-all shadow-2xs">
                <input
                  type="checkbox"
                  checked={foodFocus.sugar}
                  onChange={(e) => setFoodFocus((prev) => ({ ...prev, sugar: e.target.checked }))}
                  className="mt-0.5 w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-stone-300 shrink-0"
                />
                <div className="text-xs leading-snug">
                  <div className="font-bold text-stone-800 flex items-center gap-1.5">
                    <span>🍬</span> Industriezucker & Süßwaren
                  </div>
                  <div className="text-[11px] text-stone-500">
                    Schokolade, Kuchen, Kekse, süße Riegel, Cola, Limo & zuckerhaltige Desserts.
                  </div>
                </div>
              </label>

              {/* 2. Ungesunde Fette */}
              <label className="flex items-start gap-3 p-2.5 bg-white rounded-xl border border-teal-100 hover:border-teal-300 cursor-pointer transition-all shadow-2xs">
                <input
                  type="checkbox"
                  checked={foodFocus.unhealthyFat}
                  onChange={(e) => setFoodFocus((prev) => ({ ...prev, unhealthyFat: e.target.checked }))}
                  className="mt-0.5 w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-stone-300 shrink-0"
                />
                <div className="text-xs leading-snug">
                  <div className="font-bold text-stone-800 flex items-center gap-1.5">
                    <span>🧈</span> Ungesunde Fette & Frittiertes
                  </div>
                  <div className="text-[11px] text-stone-500">
                    Pommes, Chips, frittierte Snacks, Mayo, Remoulade, fette Saucen & Fast Food.
                  </div>
                </div>
              </label>

              {/* 3. Käse-Bremse */}
              <label className="flex items-start gap-3 p-2.5 bg-white rounded-xl border border-teal-100 hover:border-teal-300 cursor-pointer transition-all shadow-2xs">
                <input
                  type="checkbox"
                  checked={foodFocus.cheese}
                  onChange={(e) => setFoodFocus((prev) => ({ ...prev, cheese: e.target.checked }))}
                  className="mt-0.5 w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-stone-300 shrink-0"
                />
                <div className="text-xs leading-snug">
                  <div className="font-bold text-stone-800 flex items-center gap-1.5">
                    <span>🧀</span> Käse- & Schmelzkäse-Bremse
                  </div>
                  <div className="text-[11px] text-stone-500">
                    Gouda, Parmesan, Feta, Mozzarella, Raclette & reichlich Überbackenes.
                  </div>
                </div>
              </label>

              {/* 4. Verarbeitete Wurst */}
              <label className="flex items-start gap-3 p-2.5 bg-white rounded-xl border border-teal-100 hover:border-teal-300 cursor-pointer transition-all shadow-2xs">
                <input
                  type="checkbox"
                  checked={foodFocus.processedMeat}
                  onChange={(e) => setFoodFocus((prev) => ({ ...prev, processedMeat: e.target.checked }))}
                  className="mt-0.5 w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-stone-300 shrink-0"
                />
                <div className="text-xs leading-snug">
                  <div className="font-bold text-stone-800 flex items-center gap-1.5">
                    <span>🌭</span> Stark verarbeitete Wurst & Pökelfleisch
                  </div>
                  <div className="text-[11px] text-stone-500">
                    Salami, Wiener, Schinken, Leberkäse, Bratwurst & Speck.
                  </div>
                </div>
              </label>

              {/* 5. Transfette & gehärtete Öle (echte LDL-Treiber) */}
              <label className="flex items-start gap-3 p-2.5 bg-white rounded-xl border border-teal-100 hover:border-teal-300 cursor-pointer transition-all shadow-2xs">
                <input
                  type="checkbox"
                  checked={foodFocus.cholesterol}
                  onChange={(e) => setFoodFocus((prev) => ({ ...prev, cholesterol: e.target.checked }))}
                  className="mt-0.5 w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-stone-300 shrink-0"
                />
                <div className="text-xs leading-snug">
                  <div className="font-bold text-stone-800 flex items-center gap-1.5">
                    <span>🫀</span> Transfette & Arterien-Schutz (echte LDL-Treiber)
                  </div>
                  <div className="text-[11px] text-stone-500">
                    Industrielle Transfette, gehärtetes Palmfett & altes Frittierfett. (Hinweis: Eier & Garnelen erhöhen laut moderner Medizin das LDL-Risiko nicht!)
                  </div>
                </div>
              </label>

              {/* 6. Ballaststoff-Mangel */}
              <label className="flex items-start gap-3 p-2.5 bg-white rounded-xl border border-teal-100 hover:border-teal-300 cursor-pointer transition-all shadow-2xs">
                <input
                  type="checkbox"
                  checked={foodFocus.fiber}
                  onChange={(e) => setFoodFocus((prev) => ({ ...prev, fiber: e.target.checked }))}
                  className="mt-0.5 w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-stone-300 shrink-0"
                />
                <div className="text-xs leading-snug">
                  <div className="font-bold text-stone-800 flex items-center gap-1.5">
                    <span>🌾</span> Ballaststoff-Check (Gemüse & Vollkorn)
                  </div>
                  <div className="text-[11px] text-stone-500">
                    Erinnert an frisches Gemüse, Rohkost, Beeren, Haferflocken & Vollkornprodukte.
                  </div>
                </div>
              </label>

              {/* 7. Hoher Salzgehalt */}
              <label className="flex items-start gap-3 p-2.5 bg-white rounded-xl border border-teal-100 hover:border-teal-300 cursor-pointer transition-all shadow-2xs">
                <input
                  type="checkbox"
                  checked={foodFocus.salt}
                  onChange={(e) => setFoodFocus((prev) => ({ ...prev, salt: e.target.checked }))}
                  className="mt-0.5 w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-stone-300 shrink-0"
                />
                <div className="text-xs leading-snug">
                  <div className="font-bold text-stone-800 flex items-center gap-1.5">
                    <span>🧂</span> Hoher Salzgehalt
                  </div>
                  <div className="text-[11px] text-stone-500">
                    Salzgebäck, Brezeln, Fertigsaucen, Instant-Nudeln & stark gesalzene Produkte.
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* BYOK Gemini API Key */}
          <div className="p-4 bg-gradient-to-br from-emerald-500/5 to-teal-500/10 rounded-2xl border border-emerald-100 space-y-2.5">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-emerald-600" />
              <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                Google Gemini API Key (BYOK)
              </h4>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-full">
                Optional
              </span>
            </div>
            <p className="text-xs text-stone-500 leading-relaxed">
              Ermöglicht Foto- und Sprach-Logging mit dem sparsamen und schnellen <span className="font-semibold text-emerald-700">Gemini 3.8 Flash</span> (über das kostenlose Google AI Studio Free-Tier Kontingent, 0,00 €). Der Key wird ausschließlich lokal in deinem Browser (IndexedDB) gespeichert.
            </p>
            <input
              type="password"
              placeholder="AIzaSy..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full py-2.5 px-3.5 rounded-xl border border-stone-200 font-mono text-xs focus:border-emerald-500 bg-white"
            />
          </div>

          {/* Ernährungs-Bericht auf Abruf (3, 5, 10, 20 Tage) */}
          {onOpenNutritionReport && (
            <div className="p-4 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-emerald-500/10 rounded-2xl border border-emerald-200/90 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 bg-emerald-100 text-emerald-900 rounded-xl text-lg">📊</span>
                  <div>
                    <h4 className="text-xs font-bold text-stone-800">Ernährungs-Bericht auf Abruf</h4>
                    <p className="text-[11px] text-stone-500">Auswertung über 3, 5, 10 oder 20 Tage (UPF, Fette, Ballaststoffe & WhatsApp)</p>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenNutritionReport();
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-[0.99] text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <span>📊 Ernährungs-Bericht jetzt ansehen</span>
              </button>
            </div>
          )}

          {/* Rezepte verwalten & per WhatsApp/QR teilen */}
          {onOpenRecipeCreator && (
            <div className="p-4 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-amber-500/10 rounded-2xl border border-amber-200/90 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 bg-amber-100 text-amber-900 rounded-xl text-lg">🍲</span>
                  <div>
                    <h4 className="text-xs font-bold text-stone-800">Rezepte verwalten</h4>
                    <p className="text-[11px] text-stone-500">Eigene Rezepte für Brot, Mahlzeiten & Getränke ansehen, bearbeiten & teilen</p>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenRecipeCreator();
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-[0.99] text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <span>📲 Rezepte verwalten & per WhatsApp / QR teilen</span>
              </button>
            </div>
          )}

          {/* Data Backup & Export */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-stone-500 block">
              Datensicherung & Import
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleExportData}
                className="py-2.5 px-3 rounded-2xl border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-bold transition-all flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4 text-emerald-600" />
                <span>JSON Backup exportieren</span>
              </button>

              <label className="py-2.5 px-3 rounded-2xl border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer text-center">
                <Upload className="w-4 h-4 text-blue-600" />
                <span>Backup einspielen</span>
                <input type="file" accept=".json" onChange={handleImportData} className="hidden" />
              </label>
            </div>
          </div>

          {/* App-Eigenschaften & Version */}
          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-black">
                  v{APP_VERSION}
                </span>
                <div>
                  <h4 className="text-xs font-bold text-stone-800">App-Eigenschaften & Version</h4>
                  <p className="text-[11px] text-stone-400">Build-Stand: {APP_BUILD_DATE}</p>
                </div>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isStandalone
                  ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                  : 'text-amber-800 bg-amber-50 border border-amber-200'
              }`}>
                {isStandalone ? 'Vollbild PWA aktiv' : 'Im Browser geöffnet'}
              </span>
            </div>

            {/* Detailed Properties Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-white rounded-xl border border-stone-200/70">
                <span className="text-[10px] font-semibold text-stone-400 uppercase block">App-Version</span>
                <span className="font-extrabold text-stone-800 text-xs">v{APP_VERSION}</span>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-stone-200/70">
                <span className="text-[10px] font-semibold text-stone-400 uppercase block">Build-Datum</span>
                <span className="font-extrabold text-stone-800 text-xs">{APP_BUILD_DATE}</span>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-stone-200/70">
                <span className="text-[10px] font-semibold text-stone-400 uppercase block">Lokale Datenbank</span>
                <span className="font-extrabold text-stone-800 text-xs">Dexie ({APP_DB_VERSION})</span>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-stone-200/70">
                <span className="text-[10px] font-semibold text-stone-400 uppercase block">Offline-Cache</span>
                <span className="font-extrabold text-stone-800 text-xs">SW ({APP_CACHE_VERSION})</span>
              </div>
            </div>

            {/* Instant 1-Click Fullscreen Button */}
            <button
              type="button"
              onClick={handleToggleFullscreen}
              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-[0.99] text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              <span>{isFullscreen ? '⛶ Vollbildmodus beenden' : '⛶ Vollbildmodus jetzt aktivieren'}</span>
            </button>

            {!isStandalone && (
              <div className="p-3 bg-amber-50/80 border border-amber-200/90 rounded-2xl text-xs space-y-1.5 text-amber-950">
                <div className="font-bold flex items-center gap-1.5 text-amber-900">
                  <span>📱</span> Dauerhaft als App ohne Browserleiste:
                </div>
                <p className="text-[11px] text-amber-800 leading-tight">
                  Tippe entweder oben auf <strong>„⛶ Vollbildmodus jetzt aktivieren“</strong> oder installiere die App dauerhaft:
                </p>
                <ul className="text-[11px] list-disc list-inside space-y-1 text-amber-900 pl-0.5">
                  <li><strong>In Chrome:</strong> Tippe auf die <strong>3 Punkte (⋮)</strong> &rarr; <strong>„App installieren“</strong>.</li>
                  <li><strong>Tipp:</strong> Sollte dort <em>„Diese App wurde bereits installiert“</em> stehen, tippe auf den <strong>Pfeil nach rechts (➔)</strong> daneben!</li>
                </ul>
              </div>
            )}

            {updateMessage && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-1.5 animate-in fade-in">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-medium">{updateMessage}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleCheckForUpdates}
              disabled={isCheckingUpdate}
              className="w-full py-2.5 px-3 rounded-xl bg-white border border-stone-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-stone-700 hover:text-emerald-800 text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isCheckingUpdate ? 'animate-spin text-emerald-600' : 'text-emerald-600'}`} />
              <span>{isCheckingUpdate ? 'Aktualisiere...' : 'Auf Update prüfen & Cache leeren'}</span>
            </button>

            <p className="text-[10px] text-stone-400 leading-tight">
              💡 Lädt die neueste App-Version von GitHub Pages und leert den Browser-App-Cache. Deine Tagebucheinträge, Brotrezepte und Einstellungen bleiben zu 100 % erhalten.
            </p>
          </div>

          {/* Besucher-Statistiken (Nur für Admin / Dich) */}
          <div className="p-4 bg-gradient-to-br from-indigo-50/70 via-stone-50/50 to-transparent border border-indigo-100/90 rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-indigo-600" />
                Besucher-Statistiken (Privat)
              </span>
              <span className="text-[9px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full">
                Nur für dich
              </span>
            </div>
            <p className="text-[11px] text-stone-500 leading-relaxed">
              Aufrufe werden 100% anonym und DSGVO-konform (ohne Cookies) gezählt. Normale Nutzer sehen davon nichts.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <a
                href="https://weniger-fressen.goatcounter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-all"
              >
                <span>📊</span>
                <span>Live-Statistik öffnen</span>
              </a>
              <a
                href="https://github.com/Remmi-GSO/Weniger-Fressen/graphs/traffic"
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-3 rounded-xl bg-white border border-stone-200 hover:border-stone-400 text-stone-700 font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-all"
              >
                <span>🐙</span>
                <span>GitHub Traffic (14 Tage)</span>
              </a>
            </div>
            <p className="text-[10px] text-stone-400 leading-tight">
              Tipp: Falls du dein Dashboard noch nicht freigeschaltet hast, lege dir einmalig unter <a href="https://www.goatcounter.com/signup" target="_blank" rel="noopener noreferrer" className="underline text-indigo-600 font-semibold">goatcounter.com/signup</a> dein Passwort für den Code <code className="bg-white px-1 py-0.5 rounded border border-stone-200 text-indigo-950 font-bold">weniger-fressen</code> an.
            </p>
          </div>

          {/* Reset App */}
          <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
            <span className="text-xs text-stone-400">Alle lokalen Daten zurücksetzen</span>
            <button
              type="button"
              onClick={handleResetData}
              className="text-xs text-rose-500 hover:text-rose-700 font-semibold flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Daten löschen</span>
            </button>
          </div>

          {/* Save Button */}
          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-sm shadow-soft transition-all flex items-center justify-center gap-2"
          >
            {savedSuccess ? (
              <>
                <Check className="w-4 h-4" />
                <span>Gespeichert!</span>
              </>
            ) : (
              <span>Änderungen speichern</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
