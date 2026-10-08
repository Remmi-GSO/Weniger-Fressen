import { useState, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import {
  exportAndShareBackup,
  inspectBackupFile,
  executeSmartMerge,
  executeFullOverwrite,
  type BackupInspectionResult,
  type MergeResult,
} from '../utils/dataBackup';
import {
  X,
  Download,
  Upload,
  Share2,
  Check,
  AlertTriangle,
  Database,
  Loader2,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface BackupManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'export' | 'import';
  onSuccess?: () => void;
}

export const BackupManagerModal = ({
  isOpen,
  onClose,
  initialMode = 'export',
  onSuccess,
}: BackupManagerModalProps) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>(initialMode);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Export states
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccessMsg, setExportSuccessMsg] = useState<string | null>(null);

  // Import states
  const [isInspecting, setIsInspecting] = useState(false);
  const [inspection, setInspection] = useState<BackupInspectionResult | null>(null);
  const [importStrategy, setImportStrategy] = useState<'smart_merge' | 'full_overwrite'>('smart_merge');
  const [isExecuting, setIsExecuting] = useState(false);
  const [mergeResult, setMergeResult] = useState<MergeResult | null>(null);
  const [isDone, setIsDone] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Live queries for local database stats
  const diaryEntriesCount = useLiveQuery(() => db.diaryEntries.count()) || 0;
  const recipesCount = useLiveQuery(() => db.recipes.count()) || 0;
  const weightLogsCount = useLiveQuery(() => db.weightLogs.count()) || 0;
  const waterLogsCount = useLiveQuery(() => db.waterLogs.count()) || 0;
  const activityLogsCount = useLiveQuery(() => db.activityLogs.count()) || 0;
  const userProfile = useLiveQuery(() => db.userProfile.get('current'));

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialMode);
      setInspection(null);
      setMergeResult(null);
      setIsDone(false);
      setErrorMessage(null);
      setExportSuccessMsg(null);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  // Handle Export / Share
  const handleExport = async () => {
    setIsExporting(true);
    setExportSuccessMsg(null);
    try {
      const res = await exportAndShareBackup();
      if (res.method === 'share') {
        setExportSuccessMsg('Sicherung erfolgreich geteilt (z.B. per WhatsApp gesendet)!');
      } else {
        setExportSuccessMsg(`Datei '${res.fileName}' wurde in deine Downloads gespeichert.`);
      }
      confetti({
        particleCount: 25,
        spread: 45,
        origin: { y: 0.7 },
      });
    } catch (err: any) {
      console.error('Export failed', err);
      setExportSuccessMsg('Export abgeschlossen.');
    } finally {
      setIsExporting(false);
    }
  };

  // Handle File Upload & Inspection
  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsInspecting(true);
    setErrorMessage(null);
    setInspection(null);
    setMergeResult(null);
    setIsDone(false);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const result = await inspectBackupFile(content);
        if (!result.isValid) {
          setErrorMessage(result.error || 'Ungültige Backup-Datei.');
        } else {
          setInspection(result);
          // If device has no diary entries at all (fresh install), default to full_overwrite for 1:1 setup
          if (diaryEntriesCount === 0 && recipesCount === 0) {
            setImportStrategy('full_overwrite');
          } else {
            setImportStrategy('smart_merge');
          }
        }
      } catch (err: any) {
        setErrorMessage('Fehler beim Einlesen der Datei: ' + (err.message || err));
      } finally {
        setIsInspecting(false);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Execute Merge or Overwrite
  const handleExecuteImport = async () => {
    if (!inspection || !inspection.rawBackupData) return;

    setIsExecuting(true);
    setErrorMessage(null);

    try {
      if (importStrategy === 'smart_merge') {
        const res = await executeSmartMerge(inspection.rawBackupData);
        setMergeResult(res);
      } else {
        await executeFullOverwrite(inspection.rawBackupData);
        setMergeResult({
          addedDiaryEntries: inspection.summary.diaryCount,
          addedWaterLogs: inspection.summary.waterCount,
          addedWeightLogs: inspection.summary.weightCount,
          addedRecipes: inspection.summary.recipeCount,
          addedActivities: inspection.summary.activityCount,
          addedFastingSessions: inspection.summary.fastingCount,
          mergedFavorites: inspection.summary.favoriteCount,
        });
      }

      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10B981', '#3B82F6', '#F59E0B'],
      });

      setIsDone(true);
      onSuccess?.();
    } catch (err: any) {
      console.error('Import failed', err);
      setErrorMessage('Fehler beim Importieren: ' + (err.message || err));
    } finally {
      setIsExecuting(false);
    }
  };

  const handleFinishAndReload = () => {
    onClose();
    setTimeout(() => {
      window.location.reload();
    }, 150);
  };

  return (
    <div className="fixed inset-0 z-60 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-soft-lg border border-stone-100 overflow-hidden max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="p-4 px-6 border-b border-stone-100 flex items-center justify-between bg-stone-50/60">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-emerald-100/80 text-emerald-800 rounded-2xl text-lg shadow-2xs">
              📱
            </span>
            <div>
              <h3 className="font-extrabold text-stone-900 text-sm sm:text-base">
                Datensicherung & Handy-Wechsel
              </h3>
              <p className="text-[11px] text-stone-400">
                100% lokal • Keine Daten gehen verloren
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-500 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        {!isDone && (
          <div className="px-6 pt-3 pb-1 border-b border-stone-100 bg-white">
            <div className="grid grid-cols-2 p-1 bg-stone-100/80 rounded-2xl text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('export');
                  setInspection(null);
                  setErrorMessage(null);
                }}
                className={`py-2 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'export'
                    ? 'bg-white text-emerald-900 shadow-2xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>1. Daten sichern (Export)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('import');
                  setExportSuccessMsg(null);
                }}
                className={`py-2 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'import'
                    ? 'bg-white text-blue-900 shadow-2xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                <Upload className="w-3.5 h-3.5 text-blue-600" />
                <span>2. Daten übertragen (Import)</span>
              </button>
            </div>
          </div>
        )}

        {/* Modal Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1 text-left">

          {/* TAB 1: EXPORT */}
          {activeTab === 'export' && !isDone && (
            <div className="space-y-4">
              
              {/* Device Status Card */}
              <div className="p-4 bg-gradient-to-br from-emerald-50/80 via-teal-50/40 to-stone-50 border border-emerald-200/70 rounded-3xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-extrabold text-stone-800 uppercase tracking-wider">
                      Aktueller Datenstand auf diesem Handy:
                    </span>
                  </div>
                  {userProfile?.name && (
                    <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                      👤 {userProfile.name}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-white/90 p-2.5 rounded-2xl border border-emerald-100 shadow-2xs">
                    <span className="text-base font-black text-stone-900 block">{diaryEntriesCount}</span>
                    <span className="text-[10px] text-stone-500 font-medium">Mahlzeiten</span>
                  </div>
                  <div className="bg-white/90 p-2.5 rounded-2xl border border-emerald-100 shadow-2xs">
                    <span className="text-base font-black text-stone-900 block">{recipesCount}</span>
                    <span className="text-[10px] text-stone-500 font-medium">Eigene Rezepte</span>
                  </div>
                  <div className="bg-white/90 p-2.5 rounded-2xl border border-emerald-100 shadow-2xs">
                    <span className="text-base font-black text-stone-900 block">{weightLogsCount}</span>
                    <span className="text-[10px] text-stone-500 font-medium">Gewichtsmessungen</span>
                  </div>
                  <div className="bg-white/90 p-2.5 rounded-2xl border border-emerald-100 shadow-2xs">
                    <span className="text-base font-black text-stone-900 block">{waterLogsCount}</span>
                    <span className="text-[10px] text-stone-500 font-medium">Wasser-Logs</span>
                  </div>
                  <div className="bg-white/90 p-2.5 rounded-2xl border border-emerald-100 shadow-2xs">
                    <span className="text-base font-black text-stone-900 block">{activityLogsCount}</span>
                    <span className="text-[10px] text-stone-500 font-medium">Aktivitäten</span>
                  </div>
                  <div className="bg-white/90 p-2.5 rounded-2xl border border-emerald-100 shadow-2xs">
                    <span className="text-base font-black text-emerald-700 block">100%</span>
                    <span className="text-[10px] text-stone-500 font-medium">Vollständig</span>
                  </div>
                </div>
              </div>

              {/* Export Button */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleExport}
                  disabled={isExporting}
                  className="w-full py-4 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-extrabold text-sm shadow-soft transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Erstelle Sicherung...</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-5 h-5" />
                      <span>Sicherung erstellen & teilen (z. B. WhatsApp)</span>
                    </>
                  )}
                </button>

                {exportSuccessMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-semibold text-emerald-800 text-center animate-in fade-in">
                    ✓ {exportSuccessMsg}
                  </div>
                )}
              </div>

              {/* Helpful Scenarios Guide */}
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/70 space-y-2.5 text-xs text-stone-600">
                <span className="font-extrabold text-stone-800 uppercase tracking-wider text-[10px] block">
                  So funktioniert der Handy-Wechsel:
                </span>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                      1
                    </span>
                    <p>
                      <strong>Vor der Reparatur / vor dem Wechsel:</strong> Klicke hier auf <em>Sicherung erstellen & teilen</em> und sende dir die Datei selbst per WhatsApp oder E-Mail.
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                      2
                    </span>
                    <p>
                      <strong>Auf dem Austausch-Handy:</strong> Öffne die App, wechsle oben auf <em>2. Daten übertragen</em> und wähle die Datei aus. Du startest direkt mit deinem vollen Stand!
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                      3
                    </span>
                    <p>
                      <strong>Wenn dein repariertes Handy zurück ist:</strong> Sichere die 10 Tage vom Austausch-Handy und wähle auf deinem reparierten Handy <em>Intelligent zusammenführen</em>. Alle 10 Tage werden nahtlos hinzugefügt!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: IMPORT */}
          {activeTab === 'import' && !isDone && (
            <div className="space-y-4">
              
              {/* File Picker Button (when no inspection yet) */}
              {!inspection && (
                <div className="space-y-3">
                  <div className="p-6 border-2 border-dashed border-blue-200 hover:border-blue-400 bg-blue-50/40 hover:bg-blue-50/80 rounded-3xl transition-all text-center space-y-3 cursor-pointer group"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center mx-auto text-2xl group-hover:scale-105 transition-transform shadow-2xs">
                      📂
                    </div>
                    <div>
                      <h4 className="font-extrabold text-stone-900 text-sm">
                        Sicherungsdatei (.json) auswählen
                      </h4>
                      <p className="text-xs text-stone-500 mt-0.5">
                        Tippe hier, um die Datei (z. B. aus WhatsApp oder Downloads) auszuwählen
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={isInspecting}
                      className="py-2.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-soft transition-all inline-flex items-center gap-2"
                    >
                      {isInspecting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Lese Sicherung ein...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          <span>Datei vom Handy wählen</span>
                        </>
                      )}
                    </button>
                    <input
                      type="file"
                      accept=".json"
                      ref={fileInputRef}
                      onChange={handleFileSelected}
                      className="hidden"
                    />
                  </div>

                  {errorMessage && (
                    <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-semibold text-rose-800 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200/70 text-xs text-stone-500 space-y-1">
                    <span className="font-bold text-stone-700 block">💡 Tipp zum Auffinden der Datei:</span>
                    <p>
                      Hast du dir die Datei per WhatsApp geschickt? Tippe in WhatsApp auf die Datei $\rightarrow$ <em>„In Dateien sichern“</em> oder <em>„Speichern“</em>. Dann kannst du sie hier direkt auswählen.
                    </p>
                  </div>
                </div>
              )}

              {/* INSPECTION PREVIEW SCREEN */}
              {inspection && (
                <div className="space-y-4 animate-in fade-in">
                  
                  {/* Backup Card Header */}
                  <div className="p-4 bg-blue-50/80 border border-blue-200/80 rounded-3xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 bg-blue-600 text-white rounded-xl text-xs font-black">
                          ✓
                        </span>
                        <div>
                          <h4 className="font-extrabold text-stone-900 text-sm">
                            Sicherung erkannt!
                          </h4>
                          <span className="text-[10px] text-stone-500">
                            Erstellt am {inspection.exportDate ? new Date(inspection.exportDate).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Unbekannt'} Uhr
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setInspection(null);
                          setErrorMessage(null);
                        }}
                        className="text-xs text-stone-400 hover:text-stone-700 underline font-medium"
                      >
                        Andere Datei
                      </button>
                    </div>

                    {/* Stats of what is inside */}
                    <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-blue-100">
                      <div className="bg-white/90 p-2 rounded-xl border border-blue-100/80">
                        <span className="text-stone-500 text-[10px] block">Mahlzeiten:</span>
                        <strong className="text-stone-900 font-extrabold">
                          {inspection.summary.diaryCount} gesamt
                        </strong>
                        <span className="text-emerald-700 font-bold text-[10px] block">
                          (+ {inspection.newItemsCount.diary} neu auf diesem Handy)
                        </span>
                      </div>

                      <div className="bg-white/90 p-2 rounded-xl border border-blue-100/80">
                        <span className="text-stone-500 text-[10px] block">Rezepte:</span>
                        <strong className="text-stone-900 font-extrabold">
                          {inspection.summary.recipeCount} Rezepte
                        </strong>
                        <span className="text-emerald-700 font-bold text-[10px] block">
                          (+ {inspection.newItemsCount.recipes} neu)
                        </span>
                      </div>

                      <div className="bg-white/90 p-2 rounded-xl border border-blue-100/80">
                        <span className="text-stone-500 text-[10px] block">Gewicht:</span>
                        <strong className="text-stone-900 font-extrabold">
                          {inspection.summary.weightCount} Einträge
                        </strong>
                        {inspection.latestWeight && (
                          <span className="text-stone-600 text-[10px] block">
                            Neuester Stand: {inspection.latestWeight} kg
                          </span>
                        )}
                      </div>

                      <div className="bg-white/90 p-2 rounded-xl border border-blue-100/80">
                        <span className="text-stone-500 text-[10px] block">Wasser & Sport:</span>
                        <strong className="text-stone-900 font-extrabold">
                          {inspection.summary.waterCount + inspection.summary.activityCount} Logs
                        </strong>
                        <span className="text-emerald-700 font-bold text-[10px] block">
                          (+ {inspection.newItemsCount.water + inspection.newItemsCount.activities} neu)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Strategy Selection Cards */}
                  <div className="space-y-2">
                    <label className="text-xs font-extrabold text-stone-700 uppercase tracking-wider block">
                      Wie möchtest du die Daten übernehmen?
                    </label>

                    {/* Option 1: Smart Merge (Recommended) */}
                    <div
                      onClick={() => setImportStrategy('smart_merge')}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-1 relative ${
                        importStrategy === 'smart_merge'
                          ? 'border-emerald-500 bg-emerald-50/70 shadow-xs ring-2 ring-emerald-500/20'
                          : 'border-stone-200 bg-white hover:bg-stone-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-base">🌟</span>
                          <h5 className="font-extrabold text-stone-900 text-xs sm:text-sm">
                            Intelligent zusammenführen (Empfohlen)
                          </h5>
                        </div>
                        <span className="text-[10px] font-bold bg-emerald-200 text-emerald-950 px-2 py-0.5 rounded-full">
                          Sicher
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-600 leading-relaxed pl-6">
                        <strong>Keine Daten gehen verloren!</strong> Fügt alle {inspection.newItemsCount.diary} neuen Mahlzeiten und Rezepte nahtlos hinzu. Alle bisherigen Daten auf diesem Handy bleiben zu 100% erhalten.
                      </p>
                    </div>

                    {/* Option 2: Full Overwrite (For replacement phone starting empty) */}
                    <div
                      onClick={() => setImportStrategy('full_overwrite')}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-1 ${
                        importStrategy === 'full_overwrite'
                          ? 'border-blue-500 bg-blue-50/70 shadow-xs ring-2 ring-blue-500/20'
                          : 'border-stone-200 bg-white hover:bg-stone-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-base">🔄</span>
                          <h5 className="font-extrabold text-stone-900 text-xs sm:text-sm">
                            1:1 Wiederherstellen (Für leeres / neues Handy)
                          </h5>
                        </div>
                        <span className="text-[10px] font-bold bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full">
                          Komplett
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-600 leading-relaxed pl-6">
                        Ideal beim Start auf dem Austausch-Handy: Übernimmt Profil, Einstellungen, Ziele und Historie 1:1 und ersetzt den aktuellen Stand.
                      </p>
                    </div>
                  </div>

                  {errorMessage && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-semibold text-rose-800">
                      {errorMessage}
                    </div>
                  )}

                  {/* Execute Button */}
                  <button
                    type="button"
                    onClick={handleExecuteImport}
                    disabled={isExecuting}
                    className="w-full py-4 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-extrabold text-sm shadow-soft transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
                  >
                    {isExecuting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Übertrage Daten...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-5 h-5" />
                        <span>
                          {importStrategy === 'smart_merge'
                            ? 'Jetzt intelligent zusammenführen'
                            : 'Jetzt 1:1 wiederherstellen'}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* SUCCESS SCREEN */}
          {isDone && (
            <div className="space-y-4 py-2 text-center animate-in zoom-in-95">
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-3xl mx-auto shadow-sm">
                🎉
              </div>

              <div className="space-y-1">
                <h4 className="font-black text-stone-900 text-lg">
                  {importStrategy === 'smart_merge'
                    ? 'Erfolgreich zusammengeführt!'
                    : '1:1 Erfolgreich wiederhergestellt!'}
                </h4>
                <p className="text-xs text-stone-500">
                  {importStrategy === 'smart_merge'
                    ? 'Alle neuen Tagebucheinträge und Rezepte wurden nahtlos integriert. Keine alten Daten wurden gelöscht.'
                    : 'Dein Profil und alle Daten wurden vollständig übertragen.'}
                </p>
              </div>

              {mergeResult && (
                <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl text-left space-y-1.5 text-xs">
                  <span className="font-extrabold text-emerald-950 uppercase tracking-wider text-[10px] block">
                    Zusammenfassung der Übernahme:
                  </span>
                  <div className="space-y-1 text-emerald-900 font-semibold">
                    <div>✓ +{mergeResult.addedDiaryEntries} Tagebucheinträge hinzugefügt</div>
                    <div>✓ +{mergeResult.addedRecipes} Rezepte ins Rezeptbuch übernommen</div>
                    <div>✓ +{mergeResult.addedWeightLogs} Gewichtsmessungen ergänzt</div>
                    <div>✓ +{mergeResult.addedWaterLogs} Wassertracker-Einträge übernommen</div>
                    <div>✓ +{mergeResult.addedActivities} Aktivitäten synchronisiert</div>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleFinishAndReload}
                className="w-full py-4 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-soft transition-all cursor-pointer"
              >
                Fertig & App aktualisieren
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
