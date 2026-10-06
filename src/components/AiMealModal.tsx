import { useState, useRef, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type MealType, type EatingReason, type DiaryEntry } from '../db/db';
import {
  analyzeMealWithGemini,
  suggestSnacksWithGemini,
  type AiMealComponent,
  type AiSnackSuggestion,
  type AiSnackResponse,
  type AiAnswerResult,
  type AiWorkoutResult,
} from '../services/geminiApi';
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
  Wand2,
  Lightbulb,
  BookmarkPlus,
  Utensils,
  BookOpen,
  Flame,
} from 'lucide-react';
import confetti from 'canvas-confetti';

import { estimateFiber, estimateSugar } from '../utils/nutrientEstimator';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

interface AiMealModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
  defaultMealType?: MealType;
  geminiApiKey?: string;
  onOpenSettings?: () => void;
  initialDescription?: string;
  autoStartVoice?: boolean;
  voiceStopSignal?: number;
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


/**
 * Automatically cleans texts that suffered from speech recognition stutter,
 * repeated phrases, or duplicate snapshot recordings.
 */
export function recoverCleanSentence(text: string): string {
  if (!text) return '';
  const trimmed = text.trim();
  const words = trimmed.split(/\s+/);
  if (words.length < 5) return trimmed;

  // 1. Detect repeating core phrase (4+ words) that appears multiple times (speech stutter / engine restart)
  for (let windowSize = Math.min(words.length - 2, 16); windowSize >= 4; windowSize--) {
    for (let i = 0; i <= words.length - windowSize; i++) {
      const phrase = words.slice(i, i + windowSize).join(' ');
      const firstIdx = trimmed.indexOf(phrase);
      const secondIdx = trimmed.lastIndexOf(phrase);
      if (firstIdx !== -1 && secondIdx !== -1 && secondIdx > firstIdx + phrase.length / 2) {
        const between = trimmed.substring(firstIdx + phrase.length, secondIdx).trim();
        const betweenWords = between.split(/\s+/).filter(Boolean);
        if (betweenWords.length <= 6) {
          const secondVersion = (between ? `${between} ` : '') + trimmed.substring(secondIdx);
          if (secondVersion.length >= trimmed.length * 0.35) {
            return secondVersion.trim();
          }
        }
      }
    }
  }

  // 2. Search from the end for trailing statement that was repeated or prefixed earlier
  for (let len = words.length - 1; len >= 3; len--) {
    const candidate = words.slice(words.length - len).join(' ');
    const earlierIndex = trimmed.lastIndexOf(candidate, trimmed.length - candidate.length - 1);
    if (earlierIndex !== -1) {
      return candidate;
    }
  }

  // 3. Fallback: collapse identical consecutive multi-word phrases
  let cleaned = trimmed;
  const phrasePattern = /\b(.{4,80}?)\s+\1\b/gi;
  let prev = '';
  let count = 0;
  while (phrasePattern.test(cleaned) && count < 20) {
    prev = cleaned;
    cleaned = cleaned.replace(phrasePattern, '$1');
    if (cleaned === prev) break;
    count++;
  }

  return cleaned.trim();
}

export const AiMealModal = ({
  isOpen,
  onClose,
  selectedDate,
  defaultMealType = 'breakfast',
  geminiApiKey,
  onOpenSettings,
  initialDescription,
  autoStartVoice = false,
  voiceStopSignal = 0,
}: AiMealModalProps) => {
  const [mealType, setMealType] = useState<MealType>(defaultMealType);
  const [description, setDescription] = useState(initialDescription || '');

  useEffect(() => {
    if (isOpen && initialDescription) {
      setDescription(initialDescription);
    }
  }, [isOpen, initialDescription]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>('image/jpeg');

  // Persistent voice recording state via useSpeechRecognition hook
  const {
    isListening: isRecording,
    isSupported: speechSupported,
    toggleListening,
    startListening,
    stopListening,
  } = useSpeechRecognition({
    continuous: true,
    lang: 'de-DE',
    onTranscript: (text) => {
      setDescription(text);
    },
  });

  // Automatically start voice recording if autoStartVoice is true on opening
  useEffect(() => {
    if (isOpen && autoStartVoice && speechSupported) {
      const timer = setTimeout(() => {
        startListening('', false);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoStartVoice, speechSupported, startListening]);

  // Stop recording when external voiceStopSignal triggers (e.g. user pressed the Magic Button a second time)
  useEffect(() => {
    if (voiceStopSignal > 0 && isRecording) {
      stopListening();
      setDescription((prev) => recoverCleanSentence(prev));
    }
  }, [voiceStopSignal, isRecording, stopListening]);

  // Stop recording when modal is closed
  useEffect(() => {
    if (!isOpen && isRecording) {
      stopListening();
      setDescription((prev) => recoverCleanSentence(prev));
    }
  }, [isOpen, isRecording, stopListening]);

  // Smart detection: adapt meal type if explicitly spoken in sentence
  useEffect(() => {
    if (!description) return;
    const lower = description.toLowerCase();
    if (/\b(frühstück|frühstücken|morgens|zum frühstück)\b/i.test(lower)) {
      setMealType('breakfast');
    } else if (/\b(mittag|mittagessen|mittags|zu mittag)\b/i.test(lower)) {
      setMealType('lunch');
    } else if (/\b(abend|abendessen|abends|abendbrot|zum abendessen)\b/i.test(lower)) {
      setMealType('dinner');
    } else if (/\b(snack|snacks|zwischendurch|nascherei|genascht|als snack)\b/i.test(lower)) {
      setMealType('snack');
    }
  }, [description]);

  // Fetch custom recipes (e.g. homemade breads) for accurate recognition
  const customRecipes = useLiveQuery(() => db.recipes.toArray()) || [];

  // User profile and today's diary metrics for budget-aware snack recommendations
  const userProfile = useLiveQuery(() => db.userProfile.get('current'));
  const todayEntries = useLiveQuery(() => db.diaryEntries.where('date').equals(selectedDate).toArray()) || [];

  const targetCalories = userProfile?.targetCalories || 1750;
  const loggedCalories = todayEntries.reduce((sum, e) => sum + (e.calories || 0), 0);
  const remainingCalories = Math.max(0, targetCalories - loggedCalories);
  const loggedProtein = Math.round(todayEntries.reduce((sum, e) => sum + (e.protein || 0), 0) * 10) / 10;
  const targetProtein = userProfile?.targetProtein || 110;
  const remainingProtein = Math.max(0, Math.round((targetProtein - loggedProtein) * 10) / 10);

  // Snack suggestions state
  const [isSuggestingSnacks, setIsSuggestingSnacks] = useState(false);
  const [snackResponse, setSnackResponse] = useState<AiSnackResponse | null>(null);
  const [loggedSnackId, setLoggedSnackId] = useState<string | null>(null);
  const [savedRecipeSnackId, setSavedRecipeSnackId] = useState<string | null>(null);

  // Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analyzedTitle, setAnalyzedTitle] = useState<string | null>(null);
  const [analyzedNote, setAnalyzedNote] = useState<string | null>(null);
  const [usedModel, setUsedModel] = useState<string | null>(null);
  const [components, setComponents] = useState<AiMealComponent[] | null>(null);

  // Eating reason & saving state
  const [reason, setReason] = useState<EatingReason>('hunger');
  const [isSaved, setIsSaved] = useState(false);

  // In-modal API Key configuration if missing
  const [tempApiKey, setTempApiKey] = useState('');
  const [isSavingKey, setIsSavingKey] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Intent & Assistant Q&A / Workout states
  const [detectedIntent, setDetectedIntent] = useState<'meal' | 'qa' | 'recipe' | 'workout'>('meal');
  const [qaAnswer, setQaAnswer] = useState<AiAnswerResult | null>(null);
  const [workoutData, setWorkoutData] = useState<AiWorkoutResult | null>(null);
  const [isSavingWorkout, setIsSavingWorkout] = useState(false);
  const [isWorkoutSaved, setIsWorkoutSaved] = useState(false);
  const [isRecipeSaved, setIsRecipeSaved] = useState(false);

  // Sync defaultMealType when opened
  useEffect(() => {
    if (isOpen) {
      setMealType(defaultMealType);
      setIsSaved(false);
      setAnalysisError(null);
      setSnackResponse(null);
      setLoggedSnackId(null);
      setSavedRecipeSnackId(null);
      setQaAnswer(null);
      setWorkoutData(null);
      setDetectedIntent('meal');
      setIsSavingWorkout(false);
      setIsWorkoutSaved(false);
      setIsRecipeSaved(false);
    }
  }, [isOpen, defaultMealType]);

  const isAskingForSnack = (text: string) => {
    const t = text.toLowerCase();
    return (
      (t.includes('snack') && (t.includes('vorschlag') || t.includes('schlag') || t.includes('idee') || t.includes('was kann ich') || t.includes('empfehl') || t.includes('kann ich essen') || t.includes('übrig') || t.includes('rest') || t.includes('hunger'))) ||
      ((t.includes('schlag mir') || t.includes('was kann ich noch') || t.includes('ideen für') || t.includes('was soll ich')) && (t.includes('essen') || t.includes('snacken') || t.includes('kalorien')))
    );
  };

  const handleRequestSnackSuggestions = async (overridePrompt?: string) => {
    const activeKey = geminiApiKey || tempApiKey;
    if (!activeKey) {
      setAnalysisError('Bitte trage zuerst deinen kostenlosen Gemini API-Key ein.');
      return;
    }

    if (isRecording) {
      stopListening();
    }

    setIsSuggestingSnacks(true);
    setAnalysisError(null);
    setComponents(null);

    try {
      const promptToUse = overridePrompt || recoverCleanSentence(description) || `Schlag mir gesunde Snacks passend zu meinem Restbudget von ${remainingCalories} kcal vor.`;

      const res = await suggestSnacksWithGemini({
        remainingCalories,
        remainingProtein,
        userPrompt: promptToUse,
        apiKey: activeKey,
        userRecipes: customRecipes.map((r) => ({ name: r.name, category: r.category })),
      });

      setSnackResponse(res);
      setMealType('snack');
    } catch (err: any) {
      setAnalysisError(err.message || 'Konnte keine Snack-Vorschläge laden.');
    } finally {
      setIsSuggestingSnacks(false);
    }
  };

  const handleLogSnackToDiary = async (snack: AiSnackSuggestion) => {
    try {
      const now = Date.now();
      const entries: DiaryEntry[] = snack.ingredients.map((ing, idx) => ({
        date: selectedDate,
        mealType: 'snack',
        name: ing.name,
        calories: ing.calories,
        protein: ing.protein,
        carbs: ing.carbs,
        fat: ing.fat,
        fiber: ing.fiber,
        sugar: ing.sugar,
        amount: ing.amountGrams,
        unit: 'g',
        reason: 'hunger',
        timestamp: now + idx,
      }));

      await db.diaryEntries.bulkAdd(entries);
      setLoggedSnackId(snack.id);
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.6 },
      });
    } catch (err: any) {
      alert('Fehler beim Eintragen ins Tagebuch: ' + (err.message || err));
    }
  };

  const handleSaveSnackAsRecipe = async (snack: AiSnackSuggestion) => {
    try {
      const totalRawWeight = snack.ingredients.reduce((sum, it) => sum + it.amountGrams, 0);
      const totalKcal = snack.calories;
      const totalProt = snack.protein;
      const totalCarbs = snack.carbs;
      const totalFat = snack.fat;

      const calories100g = totalRawWeight > 0 ? Math.round((totalKcal / totalRawWeight) * 100) : totalKcal;
      const protein100g = totalRawWeight > 0 ? Math.round((totalProt / totalRawWeight) * 100 * 10) / 10 : totalProt;
      const carbs100g = totalRawWeight > 0 ? Math.round((totalCarbs / totalRawWeight) * 100 * 10) / 10 : totalCarbs;
      const fat100g = totalRawWeight > 0 ? Math.round((totalFat / totalRawWeight) * 100 * 10) / 10 : totalFat;

      await db.recipes.add({
        name: snack.name,
        category: 'snack',
        servingName: '1 Portion',
        servingWeightGrams: totalRawWeight,
        totalRawWeight,
        cookedWeight: totalRawWeight,
        calories100g,
        protein100g,
        carbs100g,
        fat100g,
        fiber100g: snack.fiber && totalRawWeight > 0 ? Math.round((snack.fiber / totalRawWeight) * 100 * 10) / 10 : undefined,
        sugar100g: snack.sugar && totalRawWeight > 0 ? Math.round((snack.sugar / totalRawWeight) * 100 * 10) / 10 : undefined,
        ingredients: snack.ingredients.map((ing) => ({
          name: ing.name,
          amountGrams: ing.amountGrams,
          calories: ing.calories,
          protein: ing.protein,
          carbs: ing.carbs,
          fat: ing.fat,
          fiber: ing.fiber,
          sugar: ing.sugar,
        })),
        instructions: [`Zutaten abwiegen, in einer Schale anrichten und genießen.`],
        tags: ['Snack', 'Gesund', 'Schnell'],
        createdAt: Date.now(),
      });

      setSavedRecipeSnackId(snack.id);
      confetti({
        particleCount: 30,
        spread: 40,
        origin: { y: 0.6 },
      });
    } catch (err: any) {
      alert('Fehler beim Speichern des Rezepts: ' + (err.message || err));
    }
  };

  if (!isOpen) return null;

  const handleToggleVoice = () => {
    if (!speechSupported) {
      alert('Spracherkennung wird von diesem Browser leider nicht unterstützt. Du kannst den Text einfach eintippen.');
      return;
    }

    if (isRecording) {
      stopListening();
      setDescription((prev) => recoverCleanSentence(prev));
    } else {
      const currentClean = recoverCleanSentence(description);
      setDescription(currentClean);
      toggleListening(currentClean, true);
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
    if (isRecording) {
      stopListening();
    }

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const cleanDesc = recoverCleanSentence(description);
      setDescription(cleanDesc);

      const result = await analyzeMealWithGemini({
        description: cleanDesc,
        imageBase64: imageBase64 || undefined,
        imageMimeType,
        apiKey: activeKey,
        userRecipes: customRecipes.map((r) => ({
          name: r.name,
          category: r.category,
          servingName: r.servingName,
          servingWeightGrams: r.servingWeightGrams,
          calories100g: r.calories100g,
          protein100g: r.protein100g,
          carbs100g: r.carbs100g,
          fat100g: r.fat100g,
          fiber100g: r.fiber100g,
          sugar100g: r.sugar100g,
        })),
      });

      setAnalyzedTitle(result.mealTitle);
      setAnalyzedNote(result.summaryNote || null);
      setUsedModel(result.usedModel || null);
      setDetectedIntent(result.intent || 'meal');
      setQaAnswer(result.qaAnswer || null);
      setWorkoutData(result.workoutData || null);
      setComponents(result.items && result.items.length > 0 ? result.items : null);
    } catch (err: any) {
      setAnalysisError(err.message || 'Die Analyse ist fehlgeschlagen.');
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
    setUsedModel(null);
    setDetectedIntent('meal');
    setQaAnswer(null);
    setWorkoutData(null);
    setIsSavingWorkout(false);
    setIsWorkoutSaved(false);
    setIsRecipeSaved(false);
  };

  const handleSaveWorkout = async () => {
    if (!workoutData) return;
    setIsSavingWorkout(true);
    try {
      await db.activityLogs.add({
        date: selectedDate,
        activityId: 'ai_assistant_workout',
        name: workoutData.activityName,
        icon: '🔥',
        durationMinutes: workoutData.durationMinutes,
        caloriesBurned: workoutData.caloriesBurned,
        intensity:
          workoutData.intensity === 'intense'
            ? 'intense'
            : workoutData.intensity === 'brisk' || workoutData.intensity === 'moderate'
            ? 'moderate'
            : 'light',
        notes: analyzedNote || 'Über KI-Assistent erfasst',
        timestamp: Date.now(),
      });
      setIsWorkoutSaved(true);
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.6 },
      });
    } catch (err: any) {
      alert('Fehler beim Eintragen der Aktivität: ' + (err.message || err));
    } finally {
      setIsSavingWorkout(false);
    }
  };

  const handleSaveAsCustomRecipe = async () => {
    if (!components || components.length === 0) return;
    try {
      const totalRawWeight = components.reduce((sum, it) => sum + it.amountGrams, 0);
      const totalKcal = components.reduce((sum, it) => sum + it.calories, 0);
      const totalProt = Math.round(components.reduce((sum, it) => sum + it.protein, 0) * 10) / 10;
      const totalC = Math.round(components.reduce((sum, it) => sum + it.carbs, 0) * 10) / 10;
      const totalF = Math.round(components.reduce((sum, it) => sum + it.fat, 0) * 10) / 10;

      const calories100g = totalRawWeight > 0 ? Math.round((totalKcal / totalRawWeight) * 100) : totalKcal;
      const protein100g = totalRawWeight > 0 ? Math.round((totalProt / totalRawWeight) * 100 * 10) / 10 : totalProt;
      const carbs100g = totalRawWeight > 0 ? Math.round((totalC / totalRawWeight) * 100 * 10) / 10 : totalC;
      const fat100g = totalRawWeight > 0 ? Math.round((totalF / totalRawWeight) * 100 * 10) / 10 : totalF;

      await db.recipes.add({
        name: analyzedTitle || 'Mein Rezept',
        category: (mealType === 'breakfast' ? 'breakfast' : mealType === 'snack' ? 'snack' : 'meal') as any,
        servingName: '1 Portion',
        servingWeightGrams: totalRawWeight,
        totalRawWeight,
        cookedWeight: totalRawWeight,
        calories100g,
        protein100g,
        carbs100g,
        fat100g,
        ingredients: components.map((c) => ({
          name: c.name,
          amountGrams: c.amountGrams,
          calories: c.calories,
          protein: c.protein,
          carbs: c.carbs,
          fat: c.fat,
          fiber: c.fiber,
          sugar: c.sugar,
        })),
        instructions: analyzedNote ? [analyzedNote] : ['Zutaten zubereiten und genießen.'],
        tags: ['KI-Assistent', 'Rezept'],
        createdAt: Date.now(),
      });

      setIsRecipeSaved(true);
      confetti({
        particleCount: 35,
        spread: 45,
        origin: { y: 0.6 },
      });
    } catch (err: any) {
      alert('Fehler beim Speichern des Rezepts: ' + (err.message || err));
    }
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
        fiber: it.fiber !== undefined ? it.fiber : estimateFiber(it.name, it.amountGrams, it.calories),
        sugar: it.sugar !== undefined ? it.sugar : estimateSugar(it.name, it.amountGrams, it.carbs),
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

          {/* Daily Budget & Nutrition Banner */}
          <div className="p-3 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200/80 rounded-2xl flex items-center justify-between text-xs shadow-2xs">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">🎯</span>
              <div>
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                  Restbudget für heute:
                </span>
                <span className="text-base font-black text-emerald-950">
                  {remainingCalories} kcal
                </span>
                <span className="text-[11px] text-emerald-700 ml-1.5 font-medium">
                  • noch {remainingProtein}g Protein
                </span>
              </div>
            </div>
            <div className="text-right text-[10px] text-stone-500 space-y-0.5">
              <div>Ziel: <strong className="text-stone-700">{targetCalories} kcal</strong></div>
              <div>Geloggt: <strong className="text-stone-700">{loggedCalories} kcal</strong></div>
            </div>
          </div>

          {/* Quick Snack Inspiration Chips */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
              Inspiration für dein Restbudget (1-Klick):
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
              <button
                type="button"
                onClick={() => handleRequestSnackSuggestions(`Schlag mir gesunde Snacks passend zu meinem Restbudget von ${remainingCalories} kcal vor.`)}
                disabled={isSuggestingSnacks}
                className="py-1.5 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 font-bold shrink-0 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <span>💡</span>
                <span>Snack für Restbudget ({remainingCalories} kcal)</span>
              </button>
              <button
                type="button"
                onClick={() => handleRequestSnackSuggestions(`Schlag mir proteinreiche Snacks vor. Ich benötige heute noch ${remainingProtein}g Protein im Rahmen meiner restlichen ${remainingCalories} kcal.`)}
                disabled={isSuggestingSnacks}
                className="py-1.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 font-bold shrink-0 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <span>⚡</span>
                <span>High-Protein ({remainingProtein}g Rest)</span>
              </button>
              <button
                type="button"
                onClick={() => handleRequestSnackSuggestions(`Schlag mir einen leichten, frischen Frucht-, Beeren- oder Joghurt-Snack vor (max. ${Math.min(remainingCalories, 200)} kcal).`)}
                disabled={isSuggestingSnacks}
                className="py-1.5 px-3 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-900 font-bold shrink-0 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <span>🍓</span>
                <span>Frucht & Joghurt</span>
              </button>
            </div>
          </div>
          
          {/* Target Meal Type Selector */}
          <div className="grid grid-cols-4 gap-1.5 p-1 bg-stone-100/80 rounded-2xl">
            {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMealType(m)}
                className={`py-2 px-1 text-xs font-bold rounded-xl transition-all capitalize cursor-pointer ${
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
                Trage bitte deinen Google Gemini Key ein. Die App nutzt automatisch das schnelle, sparsame Modell <strong>Gemini 3.8 Flash</strong> (bzw. <strong>3.5 Flash-Lite</strong>). Über Google AI Studio ist dieses Kontingent <strong>vollkommen kostenlos (0,00 €)</strong> – es entstehen dir garantiert keine Kosten oder Budgetüberschreitungen.
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

          {/* STEP: SNACK SUGGESTIONS RESULTS (When snacks are requested) */}
          {snackResponse && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-3.5 bg-amber-50/80 border border-amber-200/90 rounded-2xl flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs text-amber-900 font-medium">
                  <Lightbulb className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{snackResponse.introNote}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSnackResponse(null)}
                  className="text-xs text-stone-500 hover:text-stone-800 font-bold underline shrink-0 cursor-pointer"
                >
                  Zurück
                </button>
              </div>

              <div className="space-y-3">
                {snackResponse.suggestions.map((snack) => {
                  const isLogged = loggedSnackId === snack.id;
                  const isSavedRecipe = savedRecipeSnackId === snack.id;

                  return (
                    <div
                      key={snack.id}
                      className="p-4 bg-white rounded-2xl border border-stone-200 shadow-2xs space-y-3 transition-all hover:border-emerald-300"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-extrabold text-stone-900 text-sm sm:text-base">
                            {snack.name}
                          </h4>
                          <span className="text-xs text-stone-500 font-medium">
                            {snack.portionDescription}
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-base font-black text-emerald-800 block">
                            {snack.calories} kcal
                          </span>
                          <span className="text-[10px] text-stone-400 font-bold block">
                            P: {snack.protein}g • K: {snack.carbs}g • F: {snack.fat}g
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-stone-600 bg-stone-50 p-2.5 rounded-xl border border-stone-100 leading-relaxed italic">
                        „{snack.reasonWhy}“
                      </p>

                      {/* Ingredients Preview */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                          Zutaten ({snack.ingredients.length}):
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {snack.ingredients.map((ing, iIdx) => (
                            <span
                              key={iIdx}
                              className="text-[11px] bg-stone-100 text-stone-700 px-2 py-0.5 rounded-lg border border-stone-200/60 font-medium"
                            >
                              {ing.amountGrams}g {ing.name} ({ing.calories} kcal)
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Action Buttons: Log to Diary & Save as Recipe */}
                      <div className="pt-1 grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => handleLogSnackToDiary(snack)}
                          disabled={isLogged}
                          className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs ${
                            isLogged
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                              : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white'
                          }`}
                        >
                          {isLogged ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-700" />
                              <span>✓ Im Tagebuch</span>
                            </>
                          ) : (
                            <>
                              <Utensils className="w-3.5 h-3.5" />
                              <span>Ins Tagebuch</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSaveSnackAsRecipe(snack)}
                          disabled={isSavedRecipe}
                          className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                            isSavedRecipe
                              ? 'bg-amber-100 text-amber-950 border-amber-300'
                              : 'bg-white hover:bg-stone-50 text-stone-700 border-stone-200'
                          }`}
                        >
                          {isSavedRecipe ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-amber-700" />
                              <span>✓ Als Rezept gesichert</span>
                            </>
                          ) : (
                            <>
                              <BookmarkPlus className="w-3.5 h-3.5 text-amber-600" />
                              <span>Als Rezept speichern</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setSnackResponse(null)}
                  className="py-2 px-3 text-xs font-bold text-stone-500 hover:text-stone-800 transition-colors cursor-pointer"
                >
                  ← Zurück zur Mahlzeiten-Eingabe
                </button>
                <button
                  type="button"
                  onClick={() => handleRequestSnackSuggestions(`Schlag mir noch andere, alternative Snack-Ideen vor passend zu ${remainingCalories} kcal.`)}
                  disabled={isSuggestingSnacks}
                  className="py-2 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {isSuggestingSnacks ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>🔄 Andere Ideen</span>}
                </button>
              </div>
            </div>
          )}

          {/* STEP 1: CAPTURE & INPUT (When no components, snack suggestions, Q&A or workout yet) */}
          {!components && !snackResponse && !qaAnswer && !workoutData && (
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

              {/* Voice & Text Description Card (Large & Comfortable) */}
              <div className={`p-4 rounded-3xl border transition-all space-y-3 ${
                isRecording
                  ? 'bg-rose-50/50 border-rose-300 ring-2 ring-rose-200'
                  : 'bg-stone-50 border-stone-200/80'
              }`}>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5 uppercase tracking-wider">
                    <Mic className={`w-4 h-4 ${isRecording ? 'text-rose-600 animate-bounce' : 'text-teal-600'}`} />
                    <span>Sprachnotiz oder Text</span>
                  </span>
                  
                  <div className="flex items-center gap-2">
                    {description && (
                      <button
                        type="button"
                        onClick={() => setDescription('')}
                        className="py-1 px-2.5 rounded-full text-xs text-stone-500 hover:text-rose-600 hover:bg-stone-200/60 transition-colors font-medium flex items-center gap-1"
                        title="Text leeren"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Leeren</span>
                      </button>
                    )}

                    {speechSupported && (
                      <button
                        type="button"
                        onClick={handleToggleVoice}
                        className={`py-1.5 px-3.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs ${
                          isRecording
                            ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
                            : 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white'
                        }`}
                      >
                        {isRecording ? (
                          <>
                            <MicOff className="w-3.5 h-3.5" />
                            <span>Aufnahme stoppen</span>
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
                </div>

                {/* Recording Live Status Badge */}
                {isRecording && (
                  <div className="p-2.5 bg-rose-100/90 border border-rose-300/80 rounded-2xl flex items-center justify-between gap-2 text-xs text-rose-950 font-semibold animate-pulse">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping shrink-0" />
                      <span>Dauer-Aufnahme aktiv: Sprich frei heraus – kurze Pausen brechen nicht ab.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        stopListening();
                        setDescription((prev) => recoverCleanSentence(prev));
                      }}
                      className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[11px] font-bold shrink-0 cursor-pointer shadow-2xs"
                    >
                      Fertig ⏹️
                    </button>
                  </div>
                )}

                <div className="relative">
                  <textarea
                    rows={4}
                    placeholder="Z. B. 'Eine Scheibe selbstgebackenes Brot mit 1/4 Avocado, dazu ein weichgekochtes Ei'..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full min-h-[120px] p-3.5 rounded-2xl border border-stone-200 text-sm sm:text-base text-stone-800 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 leading-relaxed shadow-2xs resize-y"
                  />
                </div>

                {/* Helpful One-Click Cleaner if repetitive text is detected */}
                {description && recoverCleanSentence(description) !== description && (
                  <div className="flex items-center justify-between p-2.5 px-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex-wrap gap-2">
                    <span className="font-medium">Wiederholter Text erkannt?</span>
                    <button
                      type="button"
                      onClick={() => setDescription(recoverCleanSentence(description))}
                      className="font-bold underline text-emerald-800 hover:text-emerald-950 flex items-center gap-1"
                    >
                      <Wand2 className="w-3.5 h-3.5" />
                      <span>✨ Wiederholungen bereinigen</span>
                    </button>
                  </div>
                )}

                <p className="text-[11px] text-stone-400">
                  💡 Du kannst sprechen oder tippen. Wenn du „selbstgebackenes Brot“ sagst, übernimmt die KI automatisch dein unter „Rezepte“ gespeichertes Brotrezept!
                </p>
              </div>

              {/* Error Alert */}
              {analysisError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{analysisError}</span>
                </div>
              )}

              {/* Intelligent Action Button: Detect Snack Wish vs Food Analysis */}
              {isAskingForSnack(description) ? (
                <button
                  type="button"
                  onClick={() => handleRequestSnackSuggestions()}
                  disabled={isSuggestingSnacks}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-600 via-emerald-600 to-teal-600 hover:from-amber-700 hover:to-teal-700 active:scale-[0.99] text-white font-bold text-sm shadow-soft transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSuggestingSnacks ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>KI sucht gesunde Snacks für dein Restbudget...</span>
                    </>
                  ) : (
                    <>
                      <Lightbulb className="w-4 h-4" />
                      <span>Passende Snacks für {remainingCalories} kcal anzeigen</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handleAnalyze}
                    disabled={isAnalyzing || (!imageBase64 && !description.trim())}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-[0.99] text-white font-bold text-sm shadow-soft transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>KI analysiert dein Essen (Gemini Flash)...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Mahlzeit jetzt mit KI analysieren</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRequestSnackSuggestions()}
                    disabled={isSuggestingSnacks}
                    className="w-full py-2.5 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isSuggestingSnacks ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Suche Snacks...</span>
                      </>
                    ) : (
                      <>
                        <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                        <span>Oder: Gesunde Snack-Ideen für {remainingCalories} kcal vorschlagen</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP: ASSISTANT Q&A KNOWLEDGE CARD (Answer to nutrition questions, no clamped text!) */}
          {qaAnswer && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-4 bg-gradient-to-br from-indigo-50/90 via-sky-50/70 to-emerald-50/80 border border-indigo-200/80 rounded-2xl space-y-3 shadow-2xs">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-100/90 px-2 py-0.5 rounded-md">
                        Ernährungs-Wissen
                      </span>
                      <h4 className="font-extrabold text-stone-900 text-sm mt-0.5">
                        {qaAnswer.headline}
                      </h4>
                    </div>
                  </div>
                  {usedModel && (
                    <span className="text-[10px] bg-white/90 text-stone-600 font-bold px-2 py-0.5 rounded-full border border-stone-200 shadow-2xs shrink-0">
                      {usedModel} (0 €)
                    </span>
                  )}
                </div>

                {/* Detailed Answer: Full text, beautifully formatted, never clamped! */}
                <div className="text-xs text-stone-700 leading-relaxed whitespace-pre-line space-y-2 pt-1 border-t border-indigo-100/80">
                  {qaAnswer.answerText}
                </div>

                {/* Key Points */}
                {qaAnswer.keyPoints && qaAnswer.keyPoints.length > 0 && (
                  <div className="pt-2 border-t border-indigo-100/80 space-y-1.5">
                    <span className="text-[11px] font-bold text-indigo-950 block">
                      Das Wichtigste auf den Punkt:
                    </span>
                    <div className="space-y-1">
                      {qaAnswer.keyPoints.map((pt, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-stone-700">
                          <span className="text-emerald-600 font-bold mt-0.5">✓</span>
                          <span>{pt}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Practical Action Tip */}
                {qaAnswer.actionSuggestion && (
                  <div className="p-3 bg-white/95 rounded-xl border border-indigo-200/70 flex items-start gap-2 text-xs text-indigo-950 shadow-2xs">
                    <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-bold">Praxis-Tipp: </strong>
                      <span>{qaAnswer.actionSuggestion}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleResetAnalysis}
                  className="flex-1 py-3 rounded-2xl bg-stone-100 hover:bg-stone-200 font-bold text-xs text-stone-700 transition-colors cursor-pointer"
                >
                  Neue Frage oder Mahlzeit
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-soft transition-colors cursor-pointer"
                >
                  Alles klar, danke!
                </button>
              </div>
            </div>
          )}

          {/* STEP: WORKOUT & ACTIVITY CARD (Direct 1-click log) */}
          {workoutData && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-4 bg-gradient-to-br from-amber-50/90 via-orange-50/70 to-rose-50/80 border border-orange-200/80 rounded-2xl space-y-3 shadow-2xs">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-2xl bg-orange-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Flame className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-orange-800 bg-orange-100/90 px-2 py-0.5 rounded-md">
                        Aktivität erkannt
                      </span>
                      <h4 className="font-extrabold text-stone-900 text-sm mt-0.5">
                        {workoutData.activityName}
                      </h4>
                    </div>
                  </div>
                  {usedModel && (
                    <span className="text-[10px] bg-white/90 text-stone-600 font-bold px-2 py-0.5 rounded-full border border-stone-200 shadow-2xs shrink-0">
                      {usedModel} (0 €)
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 text-center">
                  <div className="p-2.5 bg-white/90 rounded-xl border border-orange-200/60 shadow-2xs">
                    <span className="text-[10px] text-stone-400 block font-bold uppercase tracking-wider">Dauer</span>
                    <span className="text-base font-black text-stone-900">{workoutData.durationMinutes} Min.</span>
                  </div>
                  <div className="p-2.5 bg-white/90 rounded-xl border border-orange-200/60 shadow-2xs">
                    <span className="text-[10px] text-stone-400 block font-bold uppercase tracking-wider">Verbrannt</span>
                    <span className="text-base font-black text-orange-600">~{workoutData.caloriesBurned} kcal</span>
                  </div>
                </div>

                {analyzedNote && (
                  <p className="text-xs text-stone-600 pt-1 leading-relaxed whitespace-pre-line">
                    {analyzedNote}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleSaveWorkout}
                  disabled={isSavingWorkout || isWorkoutSaved}
                  className="w-full py-3.5 rounded-2xl bg-orange-600 hover:bg-orange-700 active:scale-[0.99] text-white font-bold text-sm shadow-soft transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isWorkoutSaved ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>In Aktivitäten geloggt!</span>
                    </>
                  ) : (
                    <>
                      <Flame className="w-4 h-4" />
                      <span>In Aktivitäten übernehmen ({workoutData.caloriesBurned} kcal)</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleResetAnalysis}
                  className="w-full py-2.5 text-xs text-stone-500 hover:text-stone-800 font-bold text-center transition-colors cursor-pointer"
                >
                  Andere Eingabe machen
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: INTERACTIVE PROPOSED ITEMS (Review, tweak grams, remove/add) */}
          {components && (
            <div className="space-y-4">
              
              {/* Summary Card with Live Totals */}
              <div className="p-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200/80 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="font-extrabold text-stone-900 text-sm truncate">
                        {analyzedTitle || 'Analysiertes Essen'}
                      </h4>
                      {usedModel && (
                        <span className="text-[10px] bg-emerald-100/90 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200/60 shadow-2xs">
                          {usedModel} (0 €)
                        </span>
                      )}
                    </div>
                    {analyzedNote && (
                      <p className="text-xs text-stone-600 mt-1.5 leading-relaxed whitespace-pre-line">
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
                className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-sm shadow-soft transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
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

              {/* Save as Custom Recipe button */}
              <button
                type="button"
                onClick={handleSaveAsCustomRecipe}
                disabled={isRecipeSaved || components.length === 0}
                className="w-full py-2.5 px-4 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
              >
                {isRecipeSaved ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Als Rezept im Rezeptbuch gespeichert!</span>
                  </>
                ) : (
                  <>
                    <BookmarkPlus className="w-3.5 h-3.5 text-amber-700" />
                    <span>{detectedIntent === 'recipe' ? '⭐ Als neues Rezept speichern' : 'Auch als eigenes Rezept speichern'}</span>
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
