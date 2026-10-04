import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type UserProfile } from '../db/db';
import { buildNutritionReport, formatReportForWhatsApp, type NutritionReportData } from '../utils/nutritionReport';
import { generateAiReportReview } from '../services/geminiApi';
import {
  X,
  Share2,
  Copy,
  Sparkles,
  Check,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface NutritionReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  selectedDate: string;
  onOpenSettings?: () => void;
}

export const NutritionReportModal = ({
  isOpen,
  onClose,
  userProfile,
  selectedDate,
  onOpenSettings,
}: NutritionReportModalProps) => {
  // Days timeframe: flexible number of days (default: 7)
  const [selectedDays, setSelectedDays] = useState<number>(7);
  const [customInput, setCustomInput] = useState<string>('7');
  const [copied, setCopied] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiReviewText, setAiReviewText] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const handleSelectDays = (days: number) => {
    const clamped = Math.max(1, Math.min(90, Math.round(days)));
    setSelectedDays(clamped);
    setCustomInput(String(clamped));
    setAiReviewText(null);
  };

  // Fetch all diary entries from local database
  const allEntries = useLiveQuery(() => db.diaryEntries.toArray()) || [];

  // Generate Report Data for the selected timeframe
  const report: NutritionReportData = useMemo(() => {
    return buildNutritionReport({
      daysCount: selectedDays,
      endDateStr: selectedDate,
      profile: userProfile,
      entries: allEntries,
    });
  }, [selectedDays, selectedDate, userProfile, allEntries]);

  if (!isOpen) return null;

  const handleCopyText = async () => {
    const text = formatReportForWhatsApp(report, userProfile.name);
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleShareWhatsApp = () => {
    const text = formatReportForWhatsApp(report, userProfile.name);
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleRunAiReview = async () => {
    if (!userProfile.geminiApiKey) {
      setAiError('Bitte hinterlege zuerst deinen kostenlosen Gemini API Key in den Profileinstellungen.');
      return;
    }

    setIsAiLoading(true);
    setAiError(null);

    const summaryText = formatReportForWhatsApp(report, userProfile.name);
    try {
      const coachingText = await generateAiReportReview({
        reportSummaryText: summaryText,
        apiKey: userProfile.geminiApiKey,
        userName: userProfile.name,
      });

      setAiReviewText(coachingText);
      confetti({
        particleCount: 30,
        spread: 50,
        origin: { y: 0.6 },
      });
    } catch (err: any) {
      setAiError(err.message || 'Fehler beim Abrufen der KI-Zusammenfassung.');
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-soft-lg border border-stone-100 overflow-hidden max-h-[92vh] flex flex-col">
        
        {/* Puristischer Header */}
        <div className="p-4 px-6 border-b border-stone-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-xl">📊</span>
            <div className="min-w-0">
              <h3 className="font-extrabold text-stone-900 text-sm tracking-tight truncate">
                Ernährungsbericht
              </h3>
              <p className="text-[11px] text-stone-400 truncate">
                {userProfile.name && userProfile.name.trim() !== 'Du' ? userProfile.name.trim() : 'Mädels'} • {report.daysCount} Tage Analyse
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200/80 flex items-center justify-center text-stone-500 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Flexible Timeframe Selector (Pills + Stepper) */}
        <div className="px-5 py-3 border-b border-stone-100 bg-stone-50/60">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
              Zeitraum: {report.daysCount} Tage ({report.trackedDaysCount} erfasst)
            </span>
            
            {/* Minimalist Stepper & Number Input */}
            <div className="flex items-center gap-1 bg-white border border-stone-200 rounded-xl px-2 py-0.5 shadow-2xs">
              <button
                type="button"
                onClick={() => handleSelectDays(selectedDays - 1)}
                disabled={selectedDays <= 1}
                className="w-5 h-5 flex items-center justify-center text-stone-500 hover:text-stone-900 font-bold disabled:opacity-30 cursor-pointer"
                title="1 Tag weniger"
              >
                −
              </button>
              <input
                type="number"
                min={1}
                max={90}
                value={customInput}
                onChange={(e) => {
                  setCustomInput(e.target.value);
                  const n = parseInt(e.target.value, 10);
                  if (!isNaN(n) && n >= 1 && n <= 90) {
                    setSelectedDays(n);
                    setAiReviewText(null);
                  }
                }}
                className="w-9 text-center text-xs font-black text-stone-900 bg-transparent focus:outline-none"
              />
              <span className="text-[10px] text-stone-400 font-medium">Tage</span>
              <button
                type="button"
                onClick={() => handleSelectDays(selectedDays + 1)}
                disabled={selectedDays >= 90}
                className="w-5 h-5 flex items-center justify-center text-stone-500 hover:text-stone-900 font-bold disabled:opacity-30 cursor-pointer"
                title="1 Tag mehr"
              >
                +
              </button>
            </div>
          </div>

          {/* Quick preset pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {[3, 5, 7, 10, 14, 20, 30].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => handleSelectDays(d)}
                className={`py-1 px-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  selectedDays === d
                    ? 'bg-stone-900 text-white shadow-2xs'
                    : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100 hover:text-stone-900'
                }`}
              >
                {d} Tage
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Report Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          
          {/* Zero Data State */}
          {report.trackedDaysCount === 0 && (
            <div className="p-8 text-center bg-stone-50 rounded-3xl border border-dashed border-stone-200 space-y-2">
              <span className="text-3xl block">📝</span>
              <h4 className="font-bold text-stone-700 text-sm">Noch keine Einträge im Zeitraum</h4>
              <p className="text-xs text-stone-400 max-w-xs mx-auto">
                Erfasse Mahlzeiten im Tagebuch, um hier den ausführlichen Ernährungsbericht zu sehen.
              </p>
            </div>
          )}

          {report.trackedDaysCount > 0 && (
            <>
              {/* Puristic Scorecards: Calories, Protein, Fiber, Sugar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                
                {/* 1. Kalorien */}
                <div className="p-3 bg-white rounded-2xl border border-stone-200/80 shadow-2xs">
                  <div className="flex items-center justify-between text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                    <span>Kalorien Ø</span>
                    <span>{report.calorieStatus === 'deficit' ? '🟢' : report.calorieStatus === 'maintenance' ? '🟡' : '🔴'}</span>
                  </div>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-xl font-black text-stone-900">{report.avgCalories}</span>
                    <span className="text-[10px] text-stone-400">kcal/Tag</span>
                  </div>
                  <div className="text-[10px] text-stone-500 mt-0.5 font-medium truncate">
                    Ziel: {report.targetCalories} kcal ({report.calorieDifference <= 0 ? `${report.calorieDifference} kcal` : `+${report.calorieDifference} kcal`})
                  </div>
                </div>

                {/* 2. Protein */}
                <div className="p-3 bg-white rounded-2xl border border-stone-200/80 shadow-2xs">
                  <div className="flex items-center justify-between text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                    <span>Eiweiß Ø</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                      report.proteinStatus === 'good' ? 'bg-emerald-50 text-emerald-800' : report.proteinStatus === 'low' ? 'bg-amber-50 text-amber-800' : 'bg-purple-50 text-purple-800'
                    }`}>
                      {report.proteinPercent}%
                    </span>
                  </div>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-xl font-black text-stone-900">{report.avgProtein}g</span>
                    <span className="text-[10px] text-stone-400">/ Tag</span>
                  </div>
                  <div className="text-[10px] text-stone-500 mt-0.5 font-medium truncate">
                    Ziel: {report.targetProtein}g ({report.proteinStatus === 'good' ? 'Optimal' : report.proteinStatus === 'low' ? 'Zu wenig' : 'Sehr hoch'})
                  </div>
                </div>

                {/* 3. Ballaststoffe */}
                <div className="p-3 bg-white rounded-2xl border border-stone-200/80 shadow-2xs">
                  <div className="flex items-center justify-between text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                    <span>Ballaststoffe Ø</span>
                    <span>{report.fiberStatus === 'good' || report.fiberStatus === 'optimal' ? '✓' : '⚠️'}</span>
                  </div>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-xl font-black text-stone-900">{report.avgFiber}g</span>
                    <span className="text-[10px] text-stone-400">/ Tag</span>
                  </div>
                  <div className="text-[10px] text-stone-500 mt-0.5 font-medium truncate">
                    Ziel: {report.targetFiber}g ({report.fiberStatus === 'low' ? `-${Math.round(report.targetFiber - report.avgFiber)}g Defizit` : 'Vorbildlich'})
                  </div>
                </div>

                {/* 4. Zucker */}
                <div className="p-3 bg-white rounded-2xl border border-stone-200/80 shadow-2xs">
                  <div className="flex items-center justify-between text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                    <span>Zucker Ø</span>
                    <span>{report.sugarStatus === 'good' ? '🟢' : '⚠️'}</span>
                  </div>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-xl font-black text-stone-900">{report.avgSugar}g</span>
                    <span className="text-[10px] text-stone-400">/ Tag</span>
                  </div>
                  <div className="text-[10px] text-stone-500 mt-0.5 font-medium truncate">
                    Limit: {report.targetSugar}g ({report.sugarStatus === 'good' ? 'Im Rahmen' : 'Erhöht'})
                  </div>
                </div>

              </div>

              {/* CARD 1: HOCHVERARBEITETE LEBENSMITTEL (UPF - NOVA 4) */}
              <div className="p-4 bg-white rounded-2xl border border-stone-200/80 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center text-sm font-bold">
                      🏭
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wide">
                        Hochverarbeitete Lebensmittel (UPF)
                      </h4>
                      <span className="text-[10px] text-stone-400">
                        NOVA-Klasse 4: Fertigprodukte, Knabberartikel, Softdrinks & Wurst
                      </span>
                    </div>
                  </div>

                  <span className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${
                    report.upfStatus === 'excellent'
                      ? 'bg-emerald-100 text-emerald-900'
                      : report.upfStatus === 'moderate'
                      ? 'bg-amber-100 text-amber-900'
                      : 'bg-rose-100 text-rose-900'
                  }`}>
                    {report.upfCaloriesPercent}% der Kalorien
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      report.upfStatus === 'excellent'
                        ? 'bg-emerald-500'
                        : report.upfStatus === 'moderate'
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(5, report.upfCaloriesPercent))}%` }}
                  />
                </div>

                <div className="text-xs text-stone-600 leading-relaxed">
                  {report.upfStatus === 'excellent' && (
                    <p className="text-emerald-900 font-medium">
                      ✨ <strong>Herausragend frisch:</strong> Über 85% eurer Mahlzeiten bestanden aus naturnahen, frischen Zutaten oder selbstgebackenem Brot!
                    </p>
                  )}
                  {report.upfStatus === 'moderate' && (
                    <p className="text-stone-700">
                      👍 <strong>Ausgewogene Mischung:</strong> Der Großteil stammt aus echten Lebensmitteln, mit moderaten Fertigprodukten im gesunden Alltagskompromiss.
                    </p>
                  )}
                  {report.upfStatus === 'high' && (
                    <p className="text-rose-950 font-medium">
                      ⚠️ <strong>Erhöhter Anteil:</strong> Mehr als ein Drittel eurer Energie kam aus industriell verarbeiteten Produkten. 1–2 frische Mahlzeiten mehr senken diesen Wert schnell.
                    </p>
                  )}

                  {report.upfFoods.length > 0 && (
                    <div className="mt-2 text-[11px] text-stone-500">
                      <span className="font-semibold text-stone-700">Erfasste Fertigprodukte: </span>
                      {report.upfFoods.map((f) => `${f.name} (${f.count}x)`).join(', ')}
                    </div>
                  )}
                </div>
              </div>

              {/* CARD 2: FETTE, CHOLESTERIN & ARTERIEN-SCHUTZ */}
              <div className="p-4 bg-white rounded-2xl border border-stone-200/80 shadow-2xs space-y-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center text-sm font-bold">
                    🫀
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wide">
                      Fette, Cholesterin & Arterien-Schutz
                    </h4>
                    <span className="text-[10px] text-stone-400">
                      Moderne Ernährungsmedizin: Echte Risikofaktoren vs. gesunde Nährstoffe
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  {/* Trans Fats Check */}
                  <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-100 flex items-start gap-2">
                    <span className="text-sm shrink-0 mt-0.5">
                      {report.transFatMatches.length === 0 ? '🛡️' : '⚠️'}
                    </span>
                    <div className="text-[11px] leading-snug">
                      <span className="font-bold text-stone-800 block">
                        Industrielle Transfette & Frittierfette (die echten LDL-Treiber):
                      </span>
                      {report.transFatMatches.length === 0 ? (
                        <span className="text-emerald-800 font-medium">
                          Keine bedenklichen gehärteten Fette oder Frittieröle im Zeitraum geloggt. Perfekt für saubere Arterien!
                        </span>
                      ) : (
                        <span className="text-rose-800 font-medium">
                          Gefunden bei: {report.transFatMatches.join(', ')}. Diese Fette nach Möglichkeit reduzieren.
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Egg & Seafood Recognition */}
                  {report.eggAndSeafoodFoods.length > 0 && (
                    <div className="p-2.5 bg-emerald-50/70 rounded-xl border border-emerald-100 flex items-start gap-2">
                      <span className="text-sm shrink-0 mt-0.5">🥚</span>
                      <div className="text-[11px] leading-snug text-emerald-950">
                        <span className="font-bold block">
                          Nährstoff-Plus ({report.eggAndSeafoodFoods.slice(0, 3).join(', ')}):
                        </span>
                        <span>
                          Eier und Meeresfrüchte liefern Cholin, Omega-3 und vollwertiges Protein. Nach aktuellem Stand der Wissenschaft erhöhen sie bei gesunden Menschen <strong>nicht</strong> das schädliche LDL-Cholesterin!
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Healthy Fats Summary */}
                  {report.healthyFatFoods.length > 0 && (
                    <div className="text-[11px] text-stone-500 pt-0.5">
                      <span className="font-bold text-stone-700">Gute ungesättigte Fette dabei: </span>
                      {report.healthyFatFoods.slice(0, 4).join(', ')}
                    </div>
                  )}
                </div>
              </div>

              {/* CARD 3: HÄUFIGSTE LEBENSMITTEL (TOP-LISTE) */}
              {report.topFoods.length > 0 && (
                <div className="p-4 bg-white rounded-2xl border border-stone-200/80 shadow-2xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-sm font-bold">
                        🥗
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wide">
                          Eure häufigsten Lebensmittel
                        </h4>
                        <span className="text-[10px] text-stone-400">
                          {report.uniqueFoodCount} verschiedene Lebensmittel im Zeitraum erfasst
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    {report.topFoods.map((food, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded-xl bg-stone-50 border border-stone-100 flex items-center justify-between text-xs"
                      >
                        <div className="min-w-0 pr-1">
                          <span className="font-bold text-stone-800 block truncate">{food.name}</span>
                          <span className="text-[10px] text-stone-400">
                            ca. {food.totalGrams}g gesamt
                          </span>
                        </div>
                        <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-lg shrink-0">
                          {food.count}x
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CARD 4: FAZIT & DIE WICHTIGSTEN HEBEL */}
              <div className="p-4 bg-gradient-to-br from-emerald-50/70 via-teal-50/60 to-white rounded-2xl border border-emerald-200/90 shadow-2xs space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-sm font-bold shadow-2xs">
                    💡
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wide">
                      Prägnantes Fazit & die 3 Hebel
                    </h4>
                    <span className="text-[10px] text-emerald-800 font-medium">
                      Auf den Punkt gebracht für den Alltag
                    </span>
                  </div>
                </div>

                <p className="text-xs text-stone-800 font-semibold leading-relaxed">
                  {report.overallSummary}
                </p>

                {/* Strengths */}
                <div className="space-y-1 pt-1">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                    Was super lief:
                  </span>
                  {report.strengths.slice(0, 2).map((s, idx) => (
                    <div key={idx} className="flex items-start gap-1.5 text-xs text-emerald-950 font-medium">
                      <span className="text-emerald-600 shrink-0">✓</span>
                      <span>{s}</span>
                    </div>
                  ))}
                </div>

                {/* Levers */}
                <div className="space-y-1 pt-1 border-t border-emerald-100">
                  <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
                    Die besten Hebel für die nächsten Tage:
                  </span>
                  {report.improvementLevers.slice(0, 2).map((l, idx) => (
                    <div key={idx} className="flex items-start gap-1.5 text-xs text-stone-800 leading-snug">
                      <span className="text-emerald-700 shrink-0 font-bold">•</span>
                      <span>{l}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* OPTIONAL AI PERSONAL COACHING TEXT */}
              {aiReviewText ? (
                <div className="p-4 bg-gradient-to-r from-violet-50 to-purple-50 rounded-2xl border border-violet-200 text-xs text-violet-950 space-y-2 animate-in fade-in">
                  <div className="flex items-center gap-2 font-bold text-violet-900">
                    <Sparkles className="w-4 h-4 text-violet-600" />
                    <span>Persönlicher KI-Coach Kommentar:</span>
                  </div>
                  <p className="leading-relaxed whitespace-pre-line text-stone-700">
                    {aiReviewText}
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/70 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <Sparkles className="w-4 h-4 text-violet-600 shrink-0" />
                    <div className="min-w-0 text-xs">
                      <span className="font-bold text-stone-800 block truncate">
                        KI-Coaching für die Mädels generieren?
                      </span>
                      <span className="text-[10px] text-stone-500 block truncate">
                        Erstellt eine persönliche, herzliche Zusammenfassung
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleRunAiReview}
                    disabled={isAiLoading}
                    className="py-1.5 px-3 rounded-xl bg-violet-600 hover:bg-violet-700 active:scale-95 text-white text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 shadow-2xs disabled:opacity-50"
                  >
                    {isAiLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Analysiere...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>KI-Fazit</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* AI Error Alert */}
              {aiError && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>{aiError}</span>
                  </div>
                  {!userProfile.geminiApiKey && onOpenSettings && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenSettings();
                      }}
                      className="font-bold underline text-amber-950 shrink-0"
                    >
                      Key hinterlegen
                    </button>
                  )}
                </div>
              )}
            </>
          )}

        </div>

        {/* Modal Footer with Actions: WhatsApp & Copy */}
        <div className="p-4 px-6 border-t border-stone-100 bg-stone-50 flex items-center justify-between gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleCopyText}
            className="flex-1 py-2.5 px-3 rounded-2xl border border-stone-200 bg-white hover:bg-stone-100 active:scale-95 text-stone-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700">Kopiert!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-stone-500" />
                <span>Text kopieren</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="flex-1 py-2.5 px-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-soft"
          >
            <Share2 className="w-4 h-4" />
            <span>Per WhatsApp teilen</span>
          </button>
        </div>

      </div>
    </div>
  );
};
