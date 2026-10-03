import { useState, useRef, useEffect } from 'react';
import { db, type MealType, type EatingReason, type DiaryEntry } from '../db/db';
import { analyzeMealWithGemini, type AiMealComponent } from '../services/geminiApi';
import { compressImage } from '../utils/imageCompress';
import {
  X,
  Sparkles,
  Camera,
  Mic,
  MicOff,
  Image as ImageIcon,
  Loader2,
  Plus,
  Trash2,
  Check,
  Key,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AiMealModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
  defaultMealType?: MealType;
  geminiApiKey?: string;
  onOpenSettings?: () => void;
}

const mealLabels: Record<MealType, string> = {
  breakfast: 'Frühstück',
  lunch: 'Mittagessen',
  dinner: 'Abendessen',
  snack: 'Snacks',
};

const reasonOptions: Array<{ id: EatingReason; label: string; icon: string }> = [
  { id: 'hunger', label: 'Hunger', icon: '🟢' },
  { id: 'cravings', label: 'Lust', icon: '🟡' },
  { id: 'stress', label: 'Stress', icon: '🔴' },
  { id: 'social', label: 'Feier', icon: '🟣' },
];

export const AiMealModal = ({
  isOpen,
  onClose,
  selectedDate,
  defaultMealType = 'breakfast',
  geminiApiKey,
  onOpenSettings,
}: AiMealModalProps) => {
  const [mealType, setMealType] = useState<MealType>(defaultMealType);
  const [description, setDescription] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>('image/jpeg');

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analyzedTitle, setAnalyzedTitle] = useState<string | null>(null);
  const [analyzedNote, setAnalyzedNote] = useState<string | null>(null);
  const [components, setComponents] = useState<AiMealComponent[] | null>(null);

  // Eating reason & saving state
  const [reason, setReason] = useState<EatingReason>('hunger');
  const [isSaved, setIsSaved] = useState(false);

  // In-modal API Key configuration if missing
  const [tempApiKey, setTempApiKey] = useState('');
  const [isSavingKey, setIsSavingKey] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize SpeechRecognition on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        setSpeechSupported(true);
        const recognition = new SpeechRecognition();
        recognition.lang = 'de-DE';
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = 0; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript + ' ';
          }
          setDescription(currentTranscript.trim());
        };

        recognition.onerror = (e: any) => {
          console.log('Speech recognition error', e);
          setIsRecording(false);
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  // Sync defaultMealType when opened
  useEffect(() => {
    if (isOpen) {
      setMealType(defaultMealType);
      setIsSaved(false);
      setAnalysisError(null);
    }
  }, [isOpen, defaultMealType]);

  if (!isOpen) return null;

  const handleToggleVoice = () => {
    if (!speechSupported || !recognitionRef.current) {
      alert('Spracherkennung wird von diesem Browser nicht unterstützt. Du kannst den Text einfach eintippen.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.error('Failed to start speech recognition', err);
      }
    }
  };

  const handleImageSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImage(file, 1024, 0.82);
      setImagePreview(compressed.previewUrl);
      setImageBase64(compressed.base64Data);
      setImageMimeType(compressed.mimeType);
      setAnalysisError(null);
    } catch (err) {
      console.error('Failed to compress image', err);
      setAnalysisError('Fehler beim Laden des Fotos.');
    }
  };

  const handleClearImage = () => {
    setImagePreview(null);
    setImageBase64(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSaveApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempApiKey.trim()) return;
    setIsSavingKey(true);
    try {
      const existing = await db.userProfile.get('current');
      if (existing) {
        await db.userProfile.update('current', { geminiApiKey: tempApiKey.trim() });
      } else {
        await db.userProfile.put({
          id: 'current',
          name: '',
          gender: 'female',
          age: 30,
          height: 170,
          weight: 75,
          targetWeight: 68,
          activityLevel: 1.35,
          goalDeficit: 500,
          targetCalories: 1750,
          targetProtein: 110,
          targetCarbs: 180,
          targetFat: 55,
          waterGoal: 2500,
          geminiApiKey: tempApiKey.trim(),
          isOnboarded: true,
          createdAt: new Date().toISOString(),
        });
      }
      setTempApiKey('');
    } catch (err) {
      console.error('Failed to save API key', err);
    } finally {
      setIsSavingKey(false);
    }
  };

  const handleAnalyze = async () => {
    const activeKey = geminiApiKey || tempApiKey;
    if (!activeKey) {
      setAnalysisError('Bitte trage zuerst deinen kostenlosen Gemini API-Key ein.');
      return;
    }

    if (!imageBase64 && !description.trim()) {
      setAnalysisError('Bitte mache ein Foto von deiner Mahlzeit oder sprich/schreibe kurz, was du hattest.');
      return;
    }

    // Stop voice if recording
    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const result = await analyzeMealWithGemini({
        description,
        imageBase64: imageBase64 || undefined,
        imageMimeType,
        apiKey: activeKey,
      });

      setAnalyzedTitle(result.mealTitle);
      setAnalyzedNote(result.summaryNote || null);
      setComponents(result.items);
    } catch (err: any) {
      setAnalysisError(err.message || 'Die Mahlzeiten-Analyse ist fehlgeschlagen.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Adjust grams for an ingredient and recalculate its calories & macros
  const handleUpdateGrams = (index: number, newGrams: number) => {
    if (!components) return;
    const clampedGrams = Math.max(1, newGrams);
    const updated = [...components];
    const item = updated[index];

    const ratio = clampedGrams / 100;
    item.amountGrams = clampedGrams;
    item.calories = Math.round(item.calories100g * ratio);
    item.protein = Math.round(item.protein100g * ratio * 10) / 10;
    item.carbs = Math.round(item.carbs100g * ratio * 10) / 10;
    item.fat = Math.round(item.fat100g * ratio * 10) / 10;

    setComponents(updated);
  };

  const handleUpdateName = (index: number, newName: string) => {
    if (!components) return;
    const updated = [...components];
    updated[index].name = newName;
    setComponents(updated);
  };

  const handleDeleteComponent = (index: number) => {
    if (!components) return;
    const updated = components.filter((_, i) => i !== index);
    setComponents(updated);
  };

  const handleAddComponent = () => {
    if (!components) return;
    const newItem: AiMealComponent = {
      id: `manual_${Date.now()}`,
      name: 'Neue Zutat',
      amountGrams: 50,
      unitLabel: '50g',
      calories: 50,
      protein: 2,
      carbs: 5,
      fat: 1,
      calories100g: 100,
      protein100g: 4,
      carbs100g: 10,
      fat100g: 2,
    };
    setComponents([...components, newItem]);
  };

  const handleResetAnalysis = () => {
    setComponents(null);
    setAnalyzedTitle(null);
    setAnalyzedNote(null);
  };

  const totalCalculatedKcal = components?.reduce((sum, it) => sum + it.calories, 0) || 0;
  const totalCalculatedProtein = Math.round((components?.reduce((sum, it) => sum + it.protein, 0) || 0) * 10) / 10;
  const totalCalculatedCarbs = Math.round((components?.reduce((sum, it) => sum + it.carbs, 0) || 0) * 10) / 10;
  const totalCalculatedFat = Math.round((components?.reduce((sum, it) => sum + it.fat, 0) || 0) * 10) / 10;

  const handleSaveToDiary = async () => {
    if (!components || components.length === 0) return;

    try {
      const entries: DiaryEntry[] = components.map((it, idx) => ({
        date: selectedDate,
        mealType,
        name: it.name,
        calories: it.calories,
        protein: it.protein,
        carbs: it.carbs,
        fat: it.fat,
        amount: it.amountGrams,
        unit: 'g',
        reason,
        timestamp: Date.now() + idx,
      }));

      await db.diaryEntries.bulkAdd(entries);

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#10B981', '#F59E0B', '#3B82F6'],
      });

      setIsSaved(true);
      setTimeout(() => {
        onClose();
        handleResetAnalysis();
        handleClearImage();
        setDescription('');
      }, 700);
    } catch (err) {
      console.error('Failed to save AI meal items to diary', err);
    }
  };

  const effectiveApiKey = geminiApiKey || tempApiKey;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-soft-lg border border-stone-100 overflow-hidden max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="p-4 px-6 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center shadow-xs text-base">
              ✨
            </div>
            <div>
              <h3 className="font-bold text-stone-800 text-base">KI-Mahlzeiten-Assistent</h3>
              <p className="text-xs text-stone-400">
                Foto & Sprache &rarr; <span className="font-semibold text-emerald-700">{mealLabels[mealType]}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          
          {/* Target Meal Type Selector */}
          <div className="grid grid-cols-4 gap-1.5 p-1 bg-stone-100/80 rounded-2xl">
            {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMealType(m)}
                className={`py-2 px-1 text-xs font-bold rounded-xl transition-all capitalize ${
                  mealType === m
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                {m === 'breakfast' ? 'Frühstück' : m === 'lunch' ? 'Mittag' : m === 'dinner' ? 'Abend' : 'Snack'}
              </button>
            ))}
          </div>

          {/* Missing API Key Warning & In-Place Input */}
          {!effectiveApiKey && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs space-y-2.5 text-amber-900">
              <div className="flex items-center gap-2 font-bold text-amber-950">
                <Key className="w-4 h-4 text-amber-600" />
                <span>Kostenloser Google Gemini API-Key erforderlich</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Damit die KI dein Frühstück auf dem Foto und deine Spracheingabe auswerten kann, trage bitte einmal deinen kostenlosen Gemini-Key ein:
              </p>
              <form onSubmit={handleSaveApiKey} className="flex gap-2">
                <input
                  type="password"
                  placeholder="AIzaSy..."
                  value={tempApiKey}
                  onChange={(e) => setTempApiKey(e.target.value)}
                  className="flex-1 py-2 px-3 rounded-xl border border-amber-300 font-mono text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="submit"
                  disabled={isSavingKey || !tempApiKey.trim()}
                  className="py-2 px-3.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors shrink-0 disabled:opacity-50"
                >
                  {isSavingKey ? 'Speichere...' : 'Speichern'}
                </button>
              </form>
              <div className="pt-1 flex items-center justify-between text-[10px]">
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="underline text-emerald-800 font-bold"
                >
                  Kostenlosen Key bei Google anfordern &rarr;
                </a>
                {onOpenSettings && (
                  <button type="button" onClick={onOpenSettings} className="underline text-stone-500">
                    In Einstellungen eintragen
                  </button>
                )}
              </div>
            </div>
          )}

          {/* STEP 1: CAPTURE & INPUT (When no components analyzed yet) */}
          {!components && (
            <div className="space-y-4">
              
              {/* Photo Upload / Camera Card */}
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5 uppercase tracking-wider">
                    <Camera className="w-4 h-4 text-emerald-600" />
                    <span>Foto deines Essens (Kamera oder Galerie)</span>
                  </span>
                  {imagePreview && (
                    <button
                      type="button"
                      onClick={handleClearImage}
                      className="text-xs text-rose-500 hover:text-rose-700 font-semibold"
                    >
                      Foto entfernen
                    </button>
                  )}
                </div>

                {imagePreview ? (
                  <div className="relative rounded-2xl overflow-hidden border border-stone-200 max-h-48 bg-black flex items-center justify-center">
                    <img src={imagePreview} alt="Mahlzeit" className="max-h-48 w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-2 right-2 py-1.5 px-3 rounded-xl bg-black/70 hover:bg-black/90 text-white text-xs font-bold backdrop-blur-sm transition-all flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Anderes Foto</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <label className="py-4 px-3 rounded-2xl border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/40 hover:bg-emerald-50/80 text-emerald-800 text-xs font-bold transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer text-center group">
                      <Camera className="w-6 h-6 text-emerald-600 group-hover:scale-110 transition-transform" />
                      <span>📸 Kamera öffnen</span>
                      <span className="text-[10px] text-stone-400 font-normal">Foto direkt knipsen</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        ref={fileInputRef}
                        onChange={handleImageSelected}
                        className="hidden"
                      />
                    </label>

                    <label className="py-4 px-3 rounded-2xl border-2 border-dashed border-stone-200 hover:border-stone-300 bg-white hover:bg-stone-50 text-stone-700 text-xs font-bold transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer text-center group">
                      <ImageIcon className="w-6 h-6 text-stone-400 group-hover:scale-110 transition-transform" />
                      <span>🖼️ Galerie / Foto wählen</span>
                      <span className="text-[10px] text-stone-400 font-normal">Aus Album hochladen</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelected}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* Voice & Text Description Card */}
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5 uppercase tracking-wider">
                    <Mic className="w-4 h-4 text-teal-600" />
                    <span>Sprachnotiz oder Text</span>
                  </span>
                  
                  {speechSupported && (
                    <button
                      type="button"
                      onClick={handleToggleVoice}
                      className={`py-1 px-2.5 rounded-full text-xs font-bold flex items-center gap-1 transition-all ${
                        isRecording
                          ? 'bg-rose-500 text-white animate-pulse'
                          : 'bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200'
                      }`}
                    >
                      {isRecording ? (
                        <>
                          <MicOff className="w-3.5 h-3.5" />
                          <span>Aufnahme stoppen...</span>
                        </>
                      ) : (
                        <>
                          <Mic className="w-3.5 h-3.5" />
                          <span>🎙️ Jetzt sprechen</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                <textarea
                  rows={2}
                  placeholder="Z. B. 'Zwei Scheiben Dinkelbrot mit Butter und Gouda, ein weichgekochtes Ei und ein Kaffee mit etwas Milch'..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 rounded-xl border border-stone-200 text-xs text-stone-800 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />

                <p className="text-[10px] text-stone-400">
                  💡 Du kannst ein Foto machen, sprechen oder beides kombinieren (z. B. Foto + Sprachzusatz „Dressing war ohne Öl“).
                </p>
              </div>

              {/* Error Alert */}
              {analysisError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{analysisError}</span>
                </div>
              )}

              {/* Analyze Button */}
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={isAnalyzing || (!imageBase64 && !description.trim())}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-[0.99] text-white font-bold text-sm shadow-soft transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Gemini 2.5 Flash analysiert dein Essen...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Mahlzeit jetzt mit KI analysieren</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* STEP 2: INTERACTIVE PROPOSED ITEMS (Review, tweak grams, remove/add) */}
          {components && (
            <div className="space-y-4">
              
              {/* Summary Card with Live Totals */}
              <div className="p-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200/80 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 pr-2">
                    <h4 className="font-extrabold text-stone-900 text-sm truncate">
                      {analyzedTitle || 'Analysiertes Essen'}
                    </h4>
                    {analyzedNote && (
                      <p className="text-[11px] text-stone-500 line-clamp-2 mt-0.5">
                        {analyzedNote}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleResetAnalysis}
                    className="text-xs text-stone-400 hover:text-stone-700 underline shrink-0 font-medium"
                  >
                    Neu aufnehmen
                  </button>
                </div>

                {/* Macro Badges */}
                <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between text-xs">
                  <div className="text-base font-black text-stone-900">
                    {totalCalculatedKcal} <span className="text-xs font-normal text-stone-500">kcal</span>
                  </div>
                  <div className="flex gap-2 text-[11px] font-semibold text-stone-600">
                    <span className="text-violet-700">P: {totalCalculatedProtein}g</span>
                    <span className="text-amber-700">K: {totalCalculatedCarbs}g</span>
                    <span className="text-cyan-700">F: {totalCalculatedFat}g</span>
                  </div>
                </div>
              </div>

              {/* Instructions banner */}
              <div className="px-1 flex items-center justify-between text-xs text-stone-500">
                <span className="font-bold uppercase tracking-wider text-[10px]">
                  Erkannte Komponenten anpassen & korrigieren:
                </span>
                <button
                  type="button"
                  onClick={handleAddComponent}
                  className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Zutat ergänzen</span>
                </button>
              </div>

              {/* List of Ingredients */}
              <div className="space-y-2.5">
                {components.map((item, index) => (
                  <div
                    key={item.id}
                    className="p-3 bg-white rounded-2xl border border-stone-200/80 shadow-xs space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => handleUpdateName(index, e.target.value)}
                        className="font-bold text-stone-800 text-xs flex-1 border-b border-transparent hover:border-stone-300 focus:border-emerald-500 focus:outline-none bg-transparent"
                      />

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-extrabold text-stone-800 text-xs">
                          {item.calories} <span className="font-normal text-[10px] text-stone-400">kcal</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteComponent(index)}
                          className="p-1 rounded-lg text-stone-300 hover:text-rose-500 transition-colors"
                          title="Zutat entfernen"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Weight Controls */}
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-stone-100">
                      <span className="text-[11px] text-stone-400">
                        {item.unitLabel || `${item.amountGrams}g`}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleUpdateGrams(index, Math.max(5, item.amountGrams - 10))}
                          className="w-6 h-6 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold flex items-center justify-center text-xs"
                        >
                          -
                        </button>

                        <div className="flex items-center gap-1 font-bold text-stone-800">
                          <input
                            type="number"
                            min="1"
                            max="2000"
                            value={item.amountGrams}
                            onChange={(e) => handleUpdateGrams(index, Number(e.target.value))}
                            className="w-12 text-center py-0.5 border border-stone-200 rounded-lg text-xs font-bold"
                          />
                          <span className="text-[10px] text-stone-400">g</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleUpdateGrams(index, item.amountGrams + 10)}
                          className="w-6 h-6 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold flex items-center justify-center text-xs"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Eating Reason / Motivation Selector */}
              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-1.5">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                  Warum hast du gegessen?
                </span>
                <div className="grid grid-cols-4 gap-1.5">
                  {reasonOptions.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setReason(r.id)}
                      className={`py-1.5 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                        reason === r.id
                          ? 'bg-white text-stone-900 border border-stone-300 shadow-2xs font-bold'
                          : 'text-stone-500 hover:bg-white/50 border border-transparent'
                      }`}
                    >
                      <span>{r.icon}</span>
                      <span>{r.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Confirm & Save Button */}
              <button
                type="button"
                onClick={handleSaveToDiary}
                disabled={isSaved || components.length === 0}
                className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-sm shadow-soft transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSaved ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>In {mealLabels[mealType]} gespeichert!</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>
                      In {mealLabels[mealType]} übernehmen ({totalCalculatedKcal} kcal)
                    </span>
                  </>
                )}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
