import { useState } from 'react';
import { db, type UserProfile } from '../db/db';
import { X, Key, Download, Upload, Trash2, Sliders, Check } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile?: UserProfile | null;
  onReopenOnboarding: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onReopenOnboarding,
}) => {
  const [apiKey, setApiKey] = useState(userProfile?.geminiApiKey || '');
  const [targetCalories, setTargetCalories] = useState(userProfile?.targetCalories || 1800);
  const [targetProtein, setTargetProtein] = useState(userProfile?.targetProtein || 120);
  const [targetCarbs, setTargetCarbs] = useState(userProfile?.targetCarbs || 180);
  const [targetFat, setTargetFat] = useState(userProfile?.targetFat || 55);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await db.userProfile.update('current', {
      geminiApiKey: apiKey.trim(),
      targetCalories: Number(targetCalories),
      targetProtein: Number(targetProtein),
      targetCarbs: Number(targetCarbs),
      targetFat: Number(targetFat),
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
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
              <h3 className="font-bold text-stone-800 text-base">Einstellungen & Ziele</h3>
              <p className="text-xs text-stone-400">Passe deine Ziele und Keys an</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-6">
          
          {/* Calorie & Macro Target adjustments */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-stone-500">Tägliche Nährwertziele</label>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onReopenOnboarding();
                }}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 underline"
              >
                Neu berechnen (Bedarfsrechner)
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-xs text-stone-500 block mb-1">Kalorienziel (kcal)</span>
                <input
                  type="number"
                  min="1000"
                  max="5000"
                  value={targetCalories}
                  onChange={(e) => setTargetCalories(Number(e.target.value))}
                  className="w-full py-2 px-3 rounded-2xl border border-stone-200 text-stone-800 font-bold text-center focus:border-emerald-500"
                />
              </div>

              <div>
                <span className="text-xs text-stone-500 block mb-1">Protein (g)</span>
                <input
                  type="number"
                  min="30"
                  max="400"
                  value={targetProtein}
                  onChange={(e) => setTargetProtein(Number(e.target.value))}
                  className="w-full py-2 px-3 rounded-2xl border border-stone-200 text-stone-800 font-bold text-center focus:border-violet-500"
                />
              </div>

              <div>
                <span className="text-xs text-stone-500 block mb-1">Kohlenhydrate (g)</span>
                <input
                  type="number"
                  min="0"
                  max="600"
                  value={targetCarbs}
                  onChange={(e) => setTargetCarbs(Number(e.target.value))}
                  className="w-full py-2 px-3 rounded-2xl border border-stone-200 text-stone-800 font-bold text-center focus:border-amber-500"
                />
              </div>

              <div>
                <span className="text-xs text-stone-500 block mb-1">Fett (g)</span>
                <input
                  type="number"
                  min="20"
                  max="200"
                  value={targetFat}
                  onChange={(e) => setTargetFat(Number(e.target.value))}
                  className="w-full py-2 px-3 rounded-2xl border border-stone-200 text-stone-800 font-bold text-center focus:border-cyan-500"
                />
              </div>
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
            <p className="text-xs text-stone-500">
              Ermöglicht Foto- und Sprach-Logging mit <span className="font-semibold text-emerald-700">Gemini 2.5 Flash</span>. Der Key wird ausschließlich in deinem Browser (IndexedDB) gespeichert.
            </p>
            <input
              type="password"
              placeholder="AIzaSy..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full py-2.5 px-3.5 rounded-xl border border-stone-200 font-mono text-xs focus:border-emerald-500 bg-white"
            />
          </div>

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
