import { useMemo } from 'react';
import { type UserProfile, type DiaryEntry, type WaterLog, type FastingSession, type MealType, type ActivityLog, DEFAULT_NUTRIENT_BARS, type DashboardNutrientBars, db } from '../db/db';
import { CircularProgress } from './CircularProgress';
import { MealCard } from './MealCard';
import { WaterTracker } from './WaterTracker';
import { formatDisplayDate, getTodayDateString } from '../utils/nutrition';
import { assessFoodQuality } from '../utils/foodQuality';
import { estimateFiber, estimateSugar } from '../utils/nutrientEstimator';
import { ChevronLeft, ChevronRight, Calendar, Sparkles, Timer, Barcode, Plus, Trash2, Leaf, Mic } from 'lucide-react';

interface DashboardProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  userProfile: UserProfile;
  diaryEntries: DiaryEntry[];
  waterLogs: WaterLog[];
  activityLogs: ActivityLog[];
  activeFastingSession?: FastingSession | null;
  onOpenSearch: (mealType?: MealType) => void;
  onOpenScanner: () => void;
  onOpenQuickAdd: (mealType?: MealType) => void;
  onOpenRecipeCreator?: () => void;
  onOpenActivityModal?: () => void;
  onOpenSnackModal?: () => void;
  onOpenAiMeal?: (mealType?: MealType) => void;
  onOpenNutritionReport?: () => void;
  onEditEntry?: (entry: DiaryEntry) => void;
  onNavigateToTab: (tab: 'diary' | 'fasting' | 'weight' | 'settings') => void;
}

export const Dashboard = ({
  selectedDate,
  onDateChange,
  userProfile,
  diaryEntries,
  waterLogs,
  activityLogs,
  activeFastingSession,
  onOpenSearch,
  onOpenScanner,
  onOpenRecipeCreator,
  onOpenActivityModal,
  onOpenSnackModal,
  onOpenAiMeal,
  onOpenNutritionReport,
  onEditEntry,
  onNavigateToTab,
}: DashboardProps) => {
  const isToday = selectedDate === getTodayDateString();

  // Shift date helper
  const shiftDate = (days: number) => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + days);
    const ny = date.getFullYear();
    const nm = String(date.getMonth() + 1).padStart(2, '0');
    const nd = String(date.getDate()).padStart(2, '0');
    onDateChange(`${ny}-${nm}-${nd}`);
  };

  // Aggregated nutrition & activity calculations
  const totalKcal = diaryEntries.reduce((sum, e) => sum + (e.calories || 0), 0);
  const totalProtein = Math.round(diaryEntries.reduce((sum, e) => sum + (e.protein || 0), 0));
  const totalCarbs = Math.round(diaryEntries.reduce((sum, e) => sum + (e.carbs || 0), 0));
  const totalFat = Math.round(diaryEntries.reduce((sum, e) => sum + (e.fat || 0), 0));
  const totalFiber = Math.round(
    diaryEntries.reduce((sum, e) => sum + (e.fiber !== undefined ? e.fiber : estimateFiber(e.name, e.amount || 100, e.calories)), 0) * 10
  ) / 10;
  const totalSugar = Math.round(
    diaryEntries.reduce((sum, e) => sum + (e.sugar !== undefined ? e.sugar : estimateSugar(e.name, e.amount || 100, e.carbs)), 0) * 10
  ) / 10;

  const totalBurnedKcal = (activityLogs || []).reduce((sum, a) => sum + (a.caloriesBurned || 0), 0);

  const baseTargetKcal = userProfile.targetCalories || 1800;
  const effectiveBudget = baseTargetKcal + totalBurnedKcal;
  const remainingKcal = effectiveBudget - totalKcal;

  // Maintenance energy calculation (Gewicht halten)
  const isMaintainGoal = userProfile.goalType === 'maintain_weight' || userProfile.goalDeficit === 0;
  const maintenanceBase = userProfile.maintenanceCalories || (baseTargetKcal + (userProfile.goalDeficit || (isMaintainGoal ? 0 : 500)));
  const effectiveMaintenance = maintenanceBase + totalBurnedKcal;

  // 3-Zone evaluation:
  // 1. Deficit zone (Zielbereich / Abnehmen): totalKcal <= effectiveBudget
  // 2. Maintenance zone (Gewicht halten): totalKcal > effectiveBudget && totalKcal <= effectiveMaintenance
  // 3. Surplus zone (Überschuss): totalKcal > effectiveMaintenance
  const inDeficitZone = totalKcal <= effectiveBudget;
  const inMaintenanceZone = !isMaintainGoal && !inDeficitZone && totalKcal <= effectiveMaintenance;
  const inSurplusZone = isMaintainGoal ? totalKcal > effectiveMaintenance : totalKcal > effectiveMaintenance;

  const kcalPercent = inMaintenanceZone
    ? Math.min(100, Math.round((totalKcal / effectiveMaintenance) * 100))
    : Math.min(100, Math.round((totalKcal / effectiveBudget) * 100));

  const ringColorClass = inDeficitZone
    ? 'stroke-emerald-500'
    : inMaintenanceZone
    ? 'stroke-amber-500'
    : 'stroke-rose-500';

  const ringBgClass = inDeficitZone
    ? 'stroke-emerald-100'
    : inMaintenanceZone
    ? 'stroke-amber-100'
    : 'stroke-rose-100';

  const targetProtein = userProfile.targetProtein || 120;
  const targetCarbs = userProfile.targetCarbs || 180;
  const targetFat = userProfile.targetFat || 55;
  const targetFiber = userProfile.targetFiber || 30;
  const targetSugar = userProfile.targetSugar || 35;

  const nutrientBars: DashboardNutrientBars = {
    ...DEFAULT_NUTRIENT_BARS,
    ...(userProfile.nutrientBars || {}),
  };

  // Filter entries by meal
  const breakfastEntries = diaryEntries.filter((e) => e.mealType === 'breakfast');
  const lunchEntries = diaryEntries.filter((e) => e.mealType === 'lunch');
  const dinnerEntries = diaryEntries.filter((e) => e.mealType === 'dinner');
  const snackEntries = diaryEntries.filter((e) => e.mealType === 'snack');

  // Eating reason insight
  const reasonCounts = diaryEntries.reduce<Record<string, number>>((acc, cur) => {
    if (cur.reason) acc[cur.reason] = (acc[cur.reason] || 0) + 1;
    return acc;
  }, {});

  // Assess food quality based on user focus settings
  const qualityAssessment = useMemo(() => {
    return assessFoodQuality(diaryEntries, userProfile.foodFocus);
  }, [diaryEntries, userProfile.foodFocus]);

  return (
    <div className="space-y-5 pb-24">
      {/* Date Navigation Bar */}
      <div className="flex items-center justify-between bg-white px-4 py-3 rounded-2xl shadow-card border border-surface-border">
        <button
          onClick={() => shiftDate(-1)}
          className="p-1.5 rounded-xl hover:bg-stone-100 text-stone-600 transition-colors"
          title="Vorheriger Tag"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-600" />
          <span className="font-bold text-stone-800 text-sm">
            {formatDisplayDate(selectedDate)}
          </span>
          {!isToday && (
            <button
              onClick={() => onDateChange(getTodayDateString())}
              className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full hover:bg-emerald-100 transition-colors ml-1"
            >
              Heute
            </button>
          )}
        </div>

        <button
          onClick={() => shiftDate(1)}
          className="p-1.5 rounded-xl hover:bg-stone-100 text-stone-600 transition-colors"
          title="Nächster Tag"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Hero Calorie Ring Card */}
      <div className="bg-white rounded-3xl p-6 shadow-card border border-surface-border">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          
          {/* Main Calorie Ring */}
          <div className="flex-shrink-0">
            <CircularProgress
              percentage={kcalPercent}
              size={175}
              strokeWidth={14}
              colorClass={ringColorClass}
              bgColorClass={ringBgClass}
            >
              <div className="space-y-0.5 text-center px-1">
                <span className={`text-[10px] font-bold uppercase tracking-wider block ${
                  inMaintenanceZone ? 'text-amber-700' : 'text-stone-400'
                }`}>
                  {inDeficitZone
                    ? 'Verbleibend'
                    : inMaintenanceZone
                    ? '⚖️ Halten'
                    : 'Überschritten'}
                </span>
                <span className={`text-3xl font-black tracking-tight ${
                  inDeficitZone
                    ? 'text-stone-800'
                    : inMaintenanceZone
                    ? 'text-amber-800'
                    : 'text-rose-600'
                }`}>
                  {inDeficitZone
                    ? Math.abs(remainingKcal)
                    : inMaintenanceZone
                    ? effectiveMaintenance - totalKcal
                    : Math.abs(totalKcal - effectiveMaintenance)}
                </span>
                <span className="text-[10px] text-stone-400 font-medium block">
                  {inDeficitZone
                    ? `Ziel: ${effectiveBudget} kcal`
                    : inMaintenanceZone
                    ? `Puffer bis Erhalt`
                    : `über Erhalt (${effectiveMaintenance})`}
                </span>
              </div>
            </CircularProgress>
          </div>

          {/* Calorie Stats & Macros Breakdown */}
          <div className="w-full space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-center">
              <div className="p-2 rounded-2xl bg-stone-50 border border-stone-100">
                <span className="text-[9px] font-semibold text-stone-400 block uppercase">Gegessen</span>
                <span className="text-sm font-extrabold text-stone-800">{totalKcal} <span className="text-[10px] font-normal">kcal</span></span>
              </div>
              <div className="p-2 rounded-2xl bg-amber-50/70 border border-amber-100">
                <span className="text-[9px] font-bold text-amber-700 block uppercase">Verbrannt</span>
                <span className="text-sm font-extrabold text-amber-900">+{totalBurnedKcal} <span className="text-[10px] font-normal">kcal</span></span>
              </div>
              <div className="p-2 rounded-2xl bg-stone-50 border border-stone-100">
                <span className="text-[9px] font-semibold text-stone-400 block uppercase">
                  {isMaintainGoal ? 'Ziel (Halten)' : 'Defizit-Ziel'}
                </span>
                <span className="text-sm font-extrabold text-stone-800">{effectiveBudget} <span className="text-[10px] font-normal">kcal</span></span>
              </div>
              <div className={`p-2 rounded-2xl border ${
                inMaintenanceZone ? 'bg-amber-100/80 border-amber-300 text-amber-950 font-bold' : 'bg-emerald-50/60 border-emerald-100 text-emerald-950'
              }`}>
                <span className="text-[9px] font-bold block uppercase">
                  {inMaintenanceZone ? '⚖️ Erhaltung' : 'Gewicht halten'}
                </span>
                <span className="text-sm font-extrabold">{effectiveMaintenance} <span className="text-[10px] font-normal">kcal</span></span>
              </div>
            </div>

            {/* Customizable Nutrient Bars */}
            <div className="space-y-2 pt-1">
              
              {/* Protein */}
              {nutrientBars.protein && (
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-bold text-violet-700">Protein</span>
                    <span className="text-stone-500 font-medium">{totalProtein} / {targetProtein}g</span>
                  </div>
                  <div className="w-full bg-violet-100/60 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-violet-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (totalProtein / targetProtein) * 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Kohlenhydrate */}
              {nutrientBars.carbs && (
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-bold text-amber-700">Kohlenhydrate</span>
                    <span className="text-stone-500 font-medium">{totalCarbs} / {targetCarbs}g</span>
                  </div>
                  <div className="w-full bg-amber-100/60 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-amber-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (totalCarbs / targetCarbs) * 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Fett */}
              {nutrientBars.fat && (
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-bold text-cyan-700">Fett</span>
                    <span className="text-stone-500 font-medium">{totalFat} / {targetFat}g</span>
                  </div>
                  <div className="w-full bg-cyan-100/60 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-cyan-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (totalFat / targetFat) * 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Ballaststoffe (Fiber) */}
              {nutrientBars.fiber && (
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-bold text-emerald-800 flex items-center gap-1">
                      <span>🌾 Ballaststoffe</span>
                      {totalFiber >= targetFiber && (
                        <span className="text-[9px] text-emerald-700 font-black bg-emerald-100 px-1.5 py-0.2 rounded-full">
                          ✓ Ziel erreicht!
                        </span>
                      )}
                    </span>
                    <span className="text-stone-500 font-medium">{totalFiber} / {targetFiber}g</span>
                  </div>
                  <div className="w-full bg-emerald-100/60 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (totalFiber / targetFiber) * 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Zucker (Sugar - Obergrenze) */}
              {nutrientBars.sugar && (
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-bold text-rose-700 flex items-center gap-1">
                      <span>🍬 Zucker (Max.)</span>
                      {totalSugar > targetSugar && (
                        <span className="text-[9px] text-rose-700 font-black bg-rose-100 px-1.5 py-0.2 rounded-full">
                          Limit überschritten
                        </span>
                      )}
                    </span>
                    <span className="text-stone-500 font-medium">{totalSugar} / {targetSugar}g</span>
                  </div>
                  <div className="w-full bg-rose-100/60 rounded-full h-2 overflow-hidden">
                    <div
                      className={`${totalSugar > targetSugar ? 'bg-rose-500' : 'bg-rose-400'} h-full rounded-full transition-all duration-500`}
                      style={{ width: `${Math.min(100, (totalSugar / targetSugar) * 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Netto-Kohlenhydrate (KH minus Ballaststoffe) */}
              {nutrientBars.netCarbs && (
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-bold text-teal-800 flex items-center gap-1">
                      <span>🥑 Netto-Carbs</span>
                      <span className="text-[9px] text-stone-400 font-normal">(KH - Ballastst.)</span>
                    </span>
                    <span className="text-stone-500 font-medium">
                      {Math.max(0, Math.round((totalCarbs - totalFiber) * 10) / 10)}g
                    </span>
                  </div>
                  <div className="w-full bg-teal-100/60 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-teal-500 h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, (Math.max(0, totalCarbs - totalFiber) / Math.max(1, targetCarbs - targetFiber)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* All bars hidden state */}
              {!nutrientBars.protein && !nutrientBars.carbs && !nutrientBars.fat && !nutrientBars.fiber && !nutrientBars.sugar && !nutrientBars.netCarbs && (
                <div className="text-center py-1.5 text-[11px] text-stone-400">
                  Keine Nährstoff-Balken aktiv.
                </div>
              )}

            </div>
          </div>

        </div>

        {/* Wertschätzendes Feedback-Banner */}
        {inMaintenanceZone && (
          <div className="mt-4 p-3.5 bg-gradient-to-r from-amber-50 via-orange-50/60 to-amber-50 border border-amber-200/90 rounded-2xl flex items-center gap-3 text-amber-950 animate-in fade-in">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center text-xl shrink-0 shadow-xs">
              ⚖️
            </div>
            <div className="text-xs leading-relaxed">
              <span className="font-extrabold text-amber-950 block text-xs uppercase tracking-wide">
                Gewicht halten – Alles im grünen Bereich!
              </span>
              <span className="text-stone-700">
                Du nimmst heute nicht ab, aber du nimmst eben auch nicht zu! Du liegst voll im Erhaltungsbereich (max. <strong>{effectiveMaintenance} kcal</strong>). Alles ist super!
              </span>
            </div>
          </div>
        )}

        {inDeficitZone && totalKcal > 0 && (
          <div className="mt-4 p-3 bg-emerald-50/80 border border-emerald-200/80 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-950 animate-in fade-in">
            <span className="text-lg">🎯</span>
            <span className="leading-snug">
              {isMaintainGoal
                ? `Super! Du liegst genau in deinem Erhaltungsbereich (${effectiveBudget} kcal). Dein Gewicht bleibt stabil.`
                : `Klasse! Du bist im Kaloriendefizit (${remainingKcal} kcal Puffer). Heute nimmst du ab!`}
            </span>
          </div>
        )}

        {inSurplusZone && (
          <div className="mt-4 p-3 bg-rose-50/80 border border-rose-200/80 rounded-2xl flex items-center gap-2.5 text-xs text-rose-950 animate-in fade-in">
            <span className="text-lg">🌱</span>
            <span className="leading-snug">
              Heute liegst du etwas über deinem Erhaltungsbedarf ({effectiveMaintenance} kcal). Kein Grund zur Sorge – morgen geht es entspannt weiter!
            </span>
          </div>
        )}
      </div>

      {/* Active Fasting Teaser Banner (if active) */}
      {activeFastingSession?.isActive && (
        <div
          onClick={() => onNavigateToTab('fasting')}
          className="p-4 bg-gradient-to-r from-purple-500/10 via-purple-500/5 to-transparent border border-purple-200/60 rounded-3xl flex items-center justify-between cursor-pointer hover:border-purple-300 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-purple-500 text-white flex items-center justify-center shadow-sm">
              <Timer className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-purple-900">Intervallfasten aktiv</div>
              <div className="text-[11px] text-purple-700">Tippen, um Timer und Phase zu sehen</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-purple-600" />
        </div>
      )}

      {/* Psychology Mood / Eating Reason Tag Summary */}
      {Object.keys(reasonCounts).length > 0 && (
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 p-4 rounded-3xl border border-emerald-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <span className="font-bold text-stone-800 block">Essens-Psychologie heute:</span>
              <span className="text-stone-600 text-[11px]">
                {reasonCounts.hunger ? `🟢 ${reasonCounts.hunger}x Hunger ` : ''}
                {reasonCounts.cravings ? `🟡 ${reasonCounts.cravings}x Lust ` : ''}
                {reasonCounts.stress ? `🔴 ${reasonCounts.stress}x Stress ` : ''}
                {reasonCounts.social ? `🟣 ${reasonCounts.social}x Feier` : ''}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* On-Demand Nutrition Report Banner (3, 5, 10, 20 Tage) */}
      {onOpenNutritionReport && (
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white rounded-3xl p-4 shadow-soft flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-xl shrink-0 shadow-2xs">
              📊
            </div>
            <div className="min-w-0">
              <span className="text-xs font-black uppercase tracking-wider block text-white/95">
                Ernährungs-Bericht auf Abruf
              </span>
              <p className="text-[11px] text-white/80 truncate">
                3, 5, 10 oder 20 Tage (UPF, Fette, Eiweiß & Ballaststoffe)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenNutritionReport}
            className="py-2 px-3.5 rounded-xl bg-white text-emerald-900 hover:bg-emerald-50 active:scale-95 text-xs font-bold transition-all shadow-sm shrink-0 flex items-center gap-1.5 cursor-pointer"
          >
            <span>Bericht ansehen</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Ernährungs-Qualität & Tages-Tipps (Intelligentes Coaching) */}
      {diaryEntries.length > 0 && (qualityAssessment.activeWarnings.length > 0 || qualityAssessment.praises.length > 0 || qualityAssessment.overallTip) && (
        <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-card border border-teal-100/90 space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center shadow-2xs">
                <Leaf className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
                  <span>Ernährungs-Qualität</span>
                  {qualityAssessment.activeWarnings.length > 0 && (
                    <span className="text-[10px] bg-amber-100 text-amber-900 font-extrabold px-1.5 py-0.2 rounded-full">
                      {qualityAssessment.activeWarnings.length} {qualityAssessment.activeWarnings.length > 1 ? 'Tipps' : 'Tipp'}
                    </span>
                  )}
                </h4>
                <p className="text-[11px] text-teal-800 font-medium">
                  Rückmeldung & Empfehlung für dein {qualityAssessment.nextMealName}:
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigateToTab('settings')}
              className="text-[11px] font-bold text-stone-500 hover:text-teal-700 bg-stone-50 hover:bg-teal-50 px-2.5 py-1 rounded-xl transition-all border border-stone-200/80 flex items-center gap-1"
              title="Fokus-Kriterien in den Einstellungen anpassen"
            >
              <span>⚙️</span>
              <span className="hidden sm:inline">Filter</span>
            </button>
          </div>

          {/* Actionable Top Recommendation Banner */}
          {qualityAssessment.overallTip && (
            <div className={`p-3 rounded-2xl text-xs leading-relaxed border ${
              qualityAssessment.activeWarnings.length > 0
                ? 'bg-amber-50/70 border-amber-200/80 text-amber-950'
                : 'bg-emerald-50/70 border-emerald-200/80 text-emerald-950'
            }`}>
              <div className="font-bold flex items-center gap-1.5 mb-1">
                <span>{qualityAssessment.activeWarnings.length > 0 ? '💡 Empfehlung fürs ' + qualityAssessment.nextMealName + ':' : '✨ Prima gemacht!'}</span>
              </div>
              <p className="text-[11.5px] font-medium leading-snug">
                {qualityAssessment.overallTip}
              </p>
            </div>
          )}

          {/* Detailed Warning Items */}
          {qualityAssessment.activeWarnings.length > 0 && (
            <div className="space-y-1.5 pt-0.5">
              {qualityAssessment.activeWarnings.map((w) => (
                <div
                  key={w.key}
                  className="flex items-start gap-2.5 p-2 rounded-xl bg-stone-50/80 border border-stone-100 text-xs"
                >
                  <span className="text-base shrink-0 mt-0.5">{w.icon}</span>
                  <div className="min-w-0 flex-1 text-[11px]">
                    <span className="font-bold text-stone-800 mr-1.5">{w.title}:</span>
                    {w.matchedFoods.length > 0 && (
                      <span className="text-stone-500 font-medium mr-1.5">
                        ({w.matchedFoods.join(', ')})
                      </span>
                    )}
                    <span className="text-stone-600 block sm:inline">{w.recommendation}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Praises (Positives Lob) */}
          {qualityAssessment.praises.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {qualityAssessment.praises.map((p, idx) => (
                <span
                  key={idx}
                  className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1"
                >
                  {p}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Meals Section with Quick Launchers */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">
            Mahlzeiten
          </h3>
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            {onOpenAiMeal && (
              <button
                onClick={() => onOpenAiMeal()}
                className="flex items-center gap-1.5 text-xs font-bold text-teal-800 bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 px-2.5 py-1 rounded-full transition-all border border-emerald-200/80 shadow-2xs"
                title="Mahlzeit per Mikrofon einsprechen oder Foto machen"
              >
                <Mic className="w-3.5 h-3.5 text-emerald-600" />
                <span>🎙️ Einsprechen</span>
              </button>
            )}
            {onOpenSnackModal && (
              <button
                onClick={onOpenSnackModal}
                className="flex items-center gap-1 text-xs font-bold text-pink-900 bg-pink-50 hover:bg-pink-100 px-2.5 py-1 rounded-full transition-all border border-pink-200/80"
                title="Nascherei (Schokolade, Käse...) schnell erfassen"
              >
                <span>🍫</span>
                <span>Nascherei</span>
              </button>
            )}
            {onOpenRecipeCreator && (
              <button
                onClick={onOpenRecipeCreator}
                className="flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-full transition-all border border-amber-200/60"
                title="Eigene Rezepte für Brot, Mahlzeiten & Getränke ansehen und berechnen"
              >
                <span>🍲</span>
                <span>Rezepte</span>
              </button>
            )}
            <button
              onClick={onOpenScanner}
              className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1 rounded-full transition-all border border-emerald-200/50"
            >
              <Barcode className="w-3.5 h-3.5" />
              <span>Scannen</span>
            </button>
          </div>
        </div>

        <MealCard
          mealType="breakfast"
          title="Frühstück"
          icon="🥐"
          recommendedKcal={Math.round(baseTargetKcal * 0.25)}
          entries={breakfastEntries}
          onAddClick={onOpenSearch}
          onAiClick={onOpenAiMeal}
          onEditEntry={onEditEntry}
        />

        <MealCard
          mealType="lunch"
          title="Mittagessen"
          icon="🍲"
          recommendedKcal={Math.round(baseTargetKcal * 0.35)}
          entries={lunchEntries}
          onAddClick={onOpenSearch}
          onAiClick={onOpenAiMeal}
          onEditEntry={onEditEntry}
        />

        <MealCard
          mealType="dinner"
          title="Abendessen"
          icon="🥗"
          recommendedKcal={Math.round(baseTargetKcal * 0.30)}
          entries={dinnerEntries}
          onAddClick={onOpenSearch}
          onAiClick={onOpenAiMeal}
          onEditEntry={onEditEntry}
        />

        <MealCard
          mealType="snack"
          title="Snacks & Naschereien"
          icon="🍿"
          recommendedKcal={Math.round(baseTargetKcal * 0.10)}
          entries={snackEntries}
          onAddClick={onOpenSearch}
          onSnackClick={onOpenSnackModal}
          onAiClick={onOpenAiMeal}
          onEditEntry={onEditEntry}
        />
      </div>

      {/* Activities & Movement Section - Directly under Breakfast, Lunch, Dinner, Snacks */}
      <div className="bg-white rounded-3xl p-5 shadow-card border border-surface-border space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl shadow-xs border border-amber-100">
              🏃
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-extrabold text-stone-900 text-sm">Aktivitäten & Bewegung</h4>
                {totalBurnedKcal > 0 && (
                  <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full">
                    +{totalBurnedKcal} kcal Budget
                  </span>
                )}
              </div>
              <p className="text-[11px] text-stone-400">
                Gassi mit Snoopy (halbstündlich), Rückenfit, Yoga, Garten & Putzen
              </p>
            </div>
          </div>

          {onOpenActivityModal && (
            <button
              onClick={onOpenActivityModal}
              className="flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-2xl transition-all border border-amber-200/70 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Aktivität</span>
            </button>
          )}
        </div>

        {/* List of today's logged activities */}
        {activityLogs && activityLogs.length > 0 ? (
          <div className="divide-y divide-stone-100 pt-1">
            {activityLogs.map((act) => {
              const halfUnits = Math.round(act.durationMinutes / 30);
              const displayName = act.activityId === 'dog_walk' ? 'Gassi gehen mit Snoopy' : act.name;
              return (
                <div key={act.id} className="py-2.5 flex items-center justify-between text-xs group hover:bg-stone-50/60 px-1 -mx-1 rounded-xl">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-2xl shrink-0">{act.icon}</span>
                    <div className="min-w-0">
                      <span className="font-bold text-stone-800 block truncate">{displayName}</span>
                      <span className="text-[10px] text-stone-400">
                        {act.durationMinutes} Min {act.activityId === 'dog_walk' ? `(${halfUnits}x Halbe Std.)` : ''}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <span className="font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200/50">
                      -{act.caloriesBurned} kcal
                    </span>
                    <button
                      onClick={async () => {
                        if (act.id) await db.activityLogs.delete(act.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-stone-300 hover:text-rose-500 p-1 transition-all"
                      title="Aktivität löschen"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div
            onClick={onOpenActivityModal}
            className="p-3 bg-stone-50/80 hover:bg-amber-50/50 rounded-2xl border border-stone-200/60 cursor-pointer transition-colors text-center space-y-0.5"
          >
            <span className="text-xs font-semibold text-stone-600 block">
              🐕 Gassi mit Snoopy, 🧘 Rückenfit/Yoga oder 🪴 Gartenarbeit gemacht?
            </span>
            <span className="text-[11px] text-amber-700 font-bold block">
              + Jetzt Aktivität erfassen & extra Kalorien gutschreiben lassen
            </span>
          </div>
        )}
      </div>

      {/* Water Tracker Section */}
      <div className="pt-2">
        <WaterTracker
          selectedDate={selectedDate}
          waterGoal={userProfile.waterGoal || 2500}
          logs={waterLogs}
        />
      </div>
    </div>
  );
};
