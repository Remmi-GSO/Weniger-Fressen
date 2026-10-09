import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type EatingReason, type DiaryEntry, type SnackCategory } from '../db/db';
import { PRESET_SNACKS, type PresetSnack } from '../data/defaultSnacks';
import { VoiceInputButton } from './VoiceInputButton';
import { X, Check, Trash2, RotateCcw, Plus } from 'lucide-react';
import confetti from 'canvas-confetti';

interface SnackModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
}

const CONTAINER_INFO: Record<string, { label: string; icon: string; subtitle: string; addLabel: string; tip?: string }> = {
  chocolate: {
    label: 'Schokoladen-Behälter',
    icon: '🍫',
    subtitle: 'Stück-Zählung (ohne Küchenwaage)',
    addLabel: 'Schokolade hinzufügen',
    tip: '🍫 Stück-Zählung ohne Küchenwaage: Schokolade ist in Rippen & Stücke unterteilt (1 Stück = ~4–8g). Wähle einfach deine Stückzahl!',
  },
  cheese: {
    label: 'Käsehappen-Behälter',
    icon: '🧀',
    subtitle: 'Grammzahlen lernen & Fett im Blick behalten',
    addLabel: 'Käse hinzufügen',
    tip: '🧀 Lerneffekt Käse: Käse ist sehr energiedicht (oft 30–45% Fett). 1 Würfel hat ca. 15g (~55 kcal), 1 Scheibe ca. 30g (~105 kcal). Durch bewusstes Wählen der Grammzahl entwickelst du ein schnelles Augenmaß!',
  },
  cookies: {
    label: 'Keks-Behälter & Gebäck',
    icon: '🍪',
    subtitle: 'Kekse zählen (z. B. Prinzenrolle, Butterkeks)',
    addLabel: 'Keks hinzufügen',
    tip: '🍪 Keksdose im Blick: Ob Prinzenrolle, Butterkeks oder Schoko-Cookie – trage einfach die Stückzahl ein, die du vernascht hast!',
  },
  nuts: {
    label: 'Nüsse & Kerne',
    icon: '🥜',
    subtitle: 'Handvoll-Portionen & gesunde Fette',
    addLabel: 'Nüsse hinzufügen',
    tip: '🥜 Nüsse liefern wertvolle ungesättigte Fettsäuren! 1 kleine Handvoll = ca. 20g (~120 kcal).',
  },
  sweets: {
    label: 'Süßes & Riegel',
    icon: '🍬',
    subtitle: 'Portionen & Kalorien',
    addLabel: 'Süßigkeit hinzufügen',
  },
  salty: {
    label: 'Salziges & Chips',
    icon: '🥔',
    subtitle: 'Knabberkram & Salzkontrolle',
    addLabel: 'Knabberkram hinzufügen',
  },
  fruit: {
    label: 'Obst & Frisches',
    icon: '🍎',
    subtitle: 'Vitamine, Ballaststoffe & Schnitze',
    addLabel: 'Obst hinzufügen',
  },
};

export const SnackModal = ({
  isOpen,
  onClose,
  selectedDate,
}: SnackModalProps) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | SnackCategory>('all');
  const [selectedSnackId, setSelectedSnackId] = useState<string>('choc_milk');
  const [amountMultiplier, setAmountMultiplier] = useState<number>(1);
  const [eatingReason, setEatingReason] = useState<EatingReason>('cravings');

  // Custom free-text snack state
  const [isCustomSnack, setIsCustomSnack] = useState<boolean>(false);
  const [customName, setCustomName] = useState<string>('');
  const [customCalories, setCustomCalories] = useState<string>('80');
  const [customCategory, setCustomCategory] = useState<SnackCategory>('sweets');
  const [customServingName, setCustomServingName] = useState<string>('1 Portion');
  const [customGrams, setCustomGrams] = useState<string>('25');
  const [customIcon, setCustomIcon] = useState<string>('🍫');
  const [markAsStandard, setMarkAsStandard] = useState<boolean>(true);

  // Live queries for user profile (hidden presets) and custom snacks
  const userProfile = useLiveQuery(() => db.userProfile.get('current'));
  const customSnacks = useLiveQuery(() => db.customSnacks.toArray()) || [];

  const hiddenSnackIds = useMemo(() => {
    return userProfile?.hiddenSnackIds || [];
  }, [userProfile?.hiddenSnackIds]);

  // Merge built-in presets (minus hidden ones) with custom standard snacks
  const allAvailableSnacks = useMemo(() => {
    // 1. User's custom standard snacks
    const customStandardPresets: PresetSnack[] = customSnacks
      .filter((cs) => cs.isStandard)
      .map((cs) => ({
        id: `custom_${cs.id}`,
        name: cs.name,
        category: cs.category,
        icon: cs.icon || '🍫',
        defaultServingName: cs.defaultServingName || '1 Portion',
        defaultGrams: cs.defaultGrams || 30,
        calories: cs.calories,
        protein: cs.protein || 1,
        carbs: cs.carbs || 10,
        fat: cs.fat || 5,
        presets: cs.presets && cs.presets.length > 0 ? cs.presets : [
          { label: `1x ${cs.defaultServingName} (${cs.defaultGrams}g)`, grams: cs.defaultGrams, multiplier: 1 },
          { label: `2x (${cs.defaultGrams * 2}g)`, grams: cs.defaultGrams * 2, multiplier: 2 },
        ],
        isCustom: true,
        customId: cs.id,
      }));

    // 2. Built-in presets that the user has not hidden
    const visibleBuiltinPresets = PRESET_SNACKS.filter((s) => !hiddenSnackIds.includes(s.id));

    return [...customStandardPresets, ...visibleBuiltinPresets];
  }, [customSnacks, hiddenSnackIds]);

  // Filter snacks by category
  const filteredSnacks = useMemo(() => {
    if (selectedCategory === 'all') return allAvailableSnacks;
    return allAvailableSnacks.filter((s) => s.category === selectedCategory);
  }, [selectedCategory, allAvailableSnacks]);

  // Currently active snack (ensures active snack belongs to filtered list if a category is selected)
  const activeSnack = useMemo(() => {
    if (filteredSnacks.length === 0) return null;
    const match = filteredSnacks.find((s) => s.id === selectedSnackId);
    return match || filteredSnacks[0] || null;
  }, [selectedSnackId, filteredSnacks]);

  if (!isOpen) return null;

  // Computed values for active snack with multiplier
  const effectiveGrams = activeSnack ? Math.round(activeSnack.defaultGrams * amountMultiplier) : 30;
  const effectiveCalories = activeSnack ? Math.round(activeSnack.calories * amountMultiplier) : 80;
  const effectiveProtein = activeSnack ? Math.round(activeSnack.protein * amountMultiplier * 10) / 10 : 1;
  const effectiveCarbs = activeSnack ? Math.round(activeSnack.carbs * amountMultiplier * 10) / 10 : 10;
  const effectiveFat = activeSnack ? Math.round(activeSnack.fat * amountMultiplier * 10) / 10 : 5;

  const handleSelectSnack = (snack: PresetSnack) => {
    setSelectedSnackId(snack.id);
    setAmountMultiplier(1);
    setIsCustomSnack(false);
  };

  const handleCategoryChange = (cat: 'all' | SnackCategory) => {
    setSelectedCategory(cat);
    setIsCustomSnack(false);
    setAmountMultiplier(1);
    if (cat === 'all') {
      if (allAvailableSnacks.length > 0 && !allAvailableSnacks.some((s) => s.id === selectedSnackId)) {
        setSelectedSnackId(allAvailableSnacks[0].id);
      }
    } else {
      const matchInCat = allAvailableSnacks.filter((s) => s.category === cat);
      if (matchInCat.length > 0) {
        if (!matchInCat.some((s) => s.id === selectedSnackId)) {
          setSelectedSnackId(matchInCat[0].id);
        }
      }
    }
  };

  const handleOpenAddCustomForCategory = (cat: SnackCategory) => {
    setIsCustomSnack(true);
    setCustomCategory(cat);
    if (cat === 'chocolate') {
      setCustomIcon('🍫');
      setCustomServingName('1 Stückchen');
      setCustomGrams('7');
      setCustomCalories('38');
    } else if (cat === 'cheese') {
      setCustomIcon('🧀');
      setCustomServingName('1 Würfel');
      setCustomGrams('15');
      setCustomCalories('55');
    } else if (cat === 'cookies') {
      setCustomIcon('🍪');
      setCustomServingName('1 Keks');
      setCustomGrams('20');
      setCustomCalories('95');
    } else if (cat === 'nuts') {
      setCustomIcon('🥜');
      setCustomServingName('1 kleine Handvoll');
      setCustomGrams('20');
      setCustomCalories('120');
    } else if (cat === 'salty') {
      setCustomIcon('🥔');
      setCustomServingName('1 Handvoll');
      setCustomGrams('25');
      setCustomCalories('130');
    } else if (cat === 'fruit') {
      setCustomIcon('🍎');
      setCustomServingName('1 kleines Stück');
      setCustomGrams('80');
      setCustomCalories('45');
    } else {
      setCustomIcon('🍬');
      setCustomServingName('1 Portion');
      setCustomGrams('25');
      setCustomCalories('80');
    }
  };

  const handleCustomSnackVoice = (text: string) => {
    if (!text) return;
    const kcalMatch = text.match(/(\d+)\s*(?:kcal|kalorien|kalorie|cal)\b/i);
    if (kcalMatch) {
      setCustomCalories(kcalMatch[1]);
      const cleaned = text.replace(kcalMatch[0], '').replace(/\s+/g, ' ').trim();
      if (cleaned) setCustomName(cleaned);
    } else {
      setCustomName(text);
    }
  };

  const handleDeleteCurrentSnack = async () => {
    if (!activeSnack) return;

    if (activeSnack.isCustom && activeSnack.customId) {
      if (!confirm(`Möchtest du deine eigene Standard-Nascherei "${activeSnack.name}" wirklich löschen?`)) {
        return;
      }
      await db.customSnacks.delete(activeSnack.customId);
      const remaining = allAvailableSnacks.filter((s) => s.id !== activeSnack.id);
      if (remaining.length > 0) {
        setSelectedSnackId(remaining[0].id);
      }
    } else {
      if (!confirm(`Möchtest du "${activeSnack.name}" aus deinen Standard-Naschereien entfernen?\n\n(Du kannst sie bei Bedarf jederzeit wiederherstellen)`)) {
        return;
      }
      const updatedHidden = Array.from(new Set([...hiddenSnackIds, activeSnack.id]));
      await db.userProfile.update('current', { hiddenSnackIds: updatedHidden });
      const remaining = allAvailableSnacks.filter((s) => s.id !== activeSnack.id);
      if (remaining.length > 0) {
        setSelectedSnackId(remaining[0].id);
      }
    }
  };

  const handleRestoreHiddenSnacks = async () => {
    if (hiddenSnackIds.length === 0) return;
    if (confirm(`Möchtest du alle ${hiddenSnackIds.length} ausgeblendeten Standard-Naschereien wieder einblenden?`)) {
      await db.userProfile.update('current', { hiddenSnackIds: [] });
    }
  };

  // Save only as a standard template without logging to today
  const handleSaveOnlyAsStandardTemplate = async () => {
    if (!customName.trim()) return;
    const kcal = parseInt(customCalories, 10) || 80;
    const grams = parseInt(customGrams, 10) || 25;
    const sName = customServingName.trim() || '1 Portion';

    const newSnackId = await db.customSnacks.add({
      name: customName.trim(),
      category: customCategory,
      icon: customIcon,
      defaultServingName: sName,
      defaultGrams: grams,
      calories: kcal,
      protein: Math.round(kcal * 0.03 * 10) / 10,
      carbs: Math.round(kcal * 0.12 * 10) / 10,
      fat: Math.round(kcal * 0.05 * 10) / 10,
      isStandard: true,
      presets: [
        { label: `1x ${sName} (${grams}g)`, grams, multiplier: 1 },
        { label: `2x (${grams * 2}g)`, grams: grams * 2, multiplier: 2 },
      ],
      createdAt: Date.now(),
    });

    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#EC4899', '#F43F5E', '#F59E0B'],
    });

    // Switch back to grid view and highlight newly created standard snack
    setSelectedSnackId(`custom_${newSnackId}`);
    setIsCustomSnack(false);
    setCustomName('');
  };

  const handleSaveSnack = async () => {
    if (isCustomSnack) {
      if (!customName.trim()) return;
      const kcal = parseInt(customCalories, 10) || 80;
      const grams = parseInt(customGrams, 10) || 25;
      const sName = customServingName.trim() || '1 Portion';

      // If marked as standard, also save it to customSnacks template table
      if (markAsStandard) {
        await db.customSnacks.add({
          name: customName.trim(),
          category: customCategory,
          icon: customIcon,
          defaultServingName: sName,
          defaultGrams: grams,
          calories: kcal,
          protein: Math.round(kcal * 0.03 * 10) / 10,
          carbs: Math.round(kcal * 0.12 * 10) / 10,
          fat: Math.round(kcal * 0.05 * 10) / 10,
          isStandard: true,
          presets: [
            { label: `1x ${sName} (${grams}g)`, grams, multiplier: 1 },
            { label: `2x (${grams * 2}g)`, grams: grams * 2, multiplier: 2 },
          ],
          createdAt: Date.now(),
        });
      }

      const entry: DiaryEntry = {
        date: selectedDate,
        mealType: 'snack',
        name: `${customIcon} ${customName.trim()} (Nascherei)`,
        calories: kcal,
        protein: Math.round(kcal * 0.03 * 10) / 10,
        carbs: Math.round(kcal * 0.12),
        fat: Math.round(kcal * 0.05),
        amount: grams,
        unit: sName,
        reason: eatingReason,
        isSnackNibble: true,
        timestamp: Date.now(),
      };
      await db.diaryEntries.add(entry);
    } else {
      if (!activeSnack) return;
      let portionLabel = `${amountMultiplier}x ${activeSnack.defaultServingName}`;
      if (amountMultiplier === 1) {
        portionLabel = `${activeSnack.defaultServingName} (${effectiveGrams}g)`;
      } else {
        portionLabel = `${amountMultiplier}x ${activeSnack.defaultServingName} (${effectiveGrams}g)`;
      }

      const entry: DiaryEntry = {
        date: selectedDate,
        mealType: 'snack',
        name: `${activeSnack.icon} ${activeSnack.name}`,
        calories: effectiveCalories,
        protein: effectiveProtein,
        carbs: effectiveCarbs,
        fat: effectiveFat,
        amount: effectiveGrams,
        unit: portionLabel,
        reason: eatingReason,
        isSnackNibble: true,
        timestamp: Date.now(),
      };
      await db.diaryEntries.add(entry);
    }

    confetti({
      particleCount: 35,
      spread: 55,
      origin: { y: 0.7 },
      colors: ['#F59E0B', '#EC4899', '#8B5CF6'],
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-soft-lg border border-stone-100 overflow-hidden max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="p-4 px-6 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-pink-50 text-pink-600 rounded-xl text-lg">🍫</span>
            <div>
              <h3 className="font-bold text-stone-800 text-base">Nascherei erfassen</h3>
              <p className="text-xs text-stone-400">Standard-Auswahl oder eigene Nascherei außerhalb der 3 Mahlzeiten</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-500 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* Category Tabs: Schokolade, Käse, Kekse, Nüsse, etc. */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'all', label: 'Alle', icon: '✨' },
              { id: 'chocolate', label: 'Schokolade', icon: '🍫' },
              { id: 'cheese', label: 'Käsehappen', icon: '🧀' },
              { id: 'cookies', label: 'Kekse', icon: '🍪' },
              { id: 'nuts', label: 'Nüsse', icon: '🥜' },
              { id: 'sweets', label: 'Süßes', icon: '🍬' },
              { id: 'salty', label: 'Salziges', icon: '🥔' },
              { id: 'fruit', label: 'Obst', icon: '🍎' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleCategoryChange(tab.id as any)}
                className={`py-1.5 px-3 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 border cursor-pointer ${
                  selectedCategory === tab.id && !isCustomSnack
                    ? 'border-pink-500 bg-pink-50 text-pink-900 shadow-xs'
                    : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}

            <button
              type="button"
              onClick={() => setIsCustomSnack(true)}
              className={`py-1.5 px-3 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 border cursor-pointer ${
                isCustomSnack
                  ? 'border-pink-500 bg-pink-50 text-pink-900 shadow-xs'
                  : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
              }`}
            >
              <span>✏️</span>
              <span>Eigenes</span>
            </button>
          </div>

          {/* Option to restore hidden standard snacks if any exist */}
          {hiddenSnackIds.length > 0 && !isCustomSnack && (
            <div className="flex items-center justify-between p-2.5 px-3 bg-stone-50 border border-stone-200/80 rounded-xl text-xs text-stone-600">
              <span className="text-[11px]">
                {hiddenSnackIds.length} vorgefertigte Nascherei(en) ausgeblendet
              </span>
              <button
                type="button"
                onClick={handleRestoreHiddenSnacks}
                className="text-[11px] font-bold text-pink-700 hover:text-pink-900 underline flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Wieder einblenden</span>
              </button>
            </div>
          )}

          {/* DEDICATED CONTAINER BANNER (When a specific category/container is active) */}
          {selectedCategory !== 'all' && !isCustomSnack && (
            <div className="p-3 bg-gradient-to-r from-pink-50/90 via-rose-50/50 to-amber-50/40 rounded-2xl border border-pink-200/80 flex items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-2xl shrink-0 p-1.5 bg-white rounded-xl shadow-2xs border border-pink-100">
                  {CONTAINER_INFO[selectedCategory]?.icon || '📦'}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-extrabold text-stone-900 text-xs sm:text-sm truncate">
                      {CONTAINER_INFO[selectedCategory]?.label || `Behälter ${selectedCategory}`}
                    </h4>
                    <span className="text-[10px] bg-pink-100 text-pink-800 font-bold px-1.5 py-0.2 rounded-full">
                      {filteredSnacks.length} Sorte{filteredSnacks.length !== 1 ? 'n' : ''}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 truncate">
                    {CONTAINER_INFO[selectedCategory]?.subtitle || 'Schnellauswahl für diesen Behälter'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleOpenAddCustomForCategory(selectedCategory as SnackCategory)}
                className="py-1.5 px-3 rounded-xl bg-white hover:bg-stone-50 text-pink-900 font-bold text-xs border border-pink-200 shadow-2xs transition-all flex items-center gap-1 shrink-0 cursor-pointer"
                title="Neue Sorte in diesen Behälter legen"
              >
                <Plus className="w-3.5 h-3.5 text-pink-600" />
                <span className="hidden sm:inline">
                  {CONTAINER_INFO[selectedCategory]?.addLabel || 'Hinzufügen'}
                </span>
                <span className="sm:hidden">Neu</span>
              </button>
            </div>
          )}

          {/* CUSTOM SNACK FREE-TEXT MODE */}
          {isCustomSnack ? (
            <div className="p-4 bg-pink-50/70 border border-pink-200 rounded-2xl space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-pink-950 block">
                  Eigene Nascherei hinzufügen
                </span>
                <span className="text-[10px] text-pink-700 font-semibold bg-pink-100/80 px-2 py-0.5 rounded-full">
                  Neu
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-stone-500">Name der Nascherei</label>
                  <VoiceInputButton
                    onTranscript={handleCustomSnackVoice}
                    currentValue={customName}
                    size="xs"
                    title="Nascherei per Sprache einsprechen (z. B. 'Zwei Stück Schokolade')"
                  />
                </div>
                <div className="relative">
                  <input
                    type="text"
                    autoFocus
                    placeholder="z. B. 2 Pralinen, 1 Kugel Vanilleeis, Prinzenrolle..."
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full pl-3 pr-9 py-2 rounded-xl border border-stone-200 text-xs font-bold text-stone-800 bg-white focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500"
                  />
                  <div className="absolute right-1.5 top-1/2 -translate-y-1/2">
                    <VoiceInputButton
                      onTranscript={handleCustomSnackVoice}
                      currentValue={customName}
                      size="xs"
                      title="Nascherei per Sprache einsprechen"
                    />
                  </div>
                </div>
              </div>

              {/* Kalorien & Portionsgröße */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-stone-500 block mb-1">Kalorien (kcal)</label>
                  <input
                    type="number"
                    step="5"
                    min="10"
                    max="1500"
                    value={customCalories}
                    onChange={(e) => setCustomCalories(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-center text-sm font-extrabold text-stone-800 bg-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-stone-500 block mb-1">Gewicht (Gramm)</label>
                  <input
                    type="number"
                    step="5"
                    min="1"
                    max="500"
                    value={customGrams}
                    onChange={(e) => setCustomGrams(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-center text-sm font-extrabold text-stone-800 bg-white"
                  />
                </div>
              </div>

              {/* Quick Kcal Chips */}
              <div className="flex gap-1.5 flex-wrap">
                {[50, 80, 120, 180, 250].map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setCustomCalories(String(k))}
                    className="py-1 px-2.5 rounded-lg border border-stone-200 bg-white text-stone-600 text-[11px] font-semibold hover:bg-stone-50 cursor-pointer"
                  >
                    {k} kcal
                  </button>
                ))}
              </div>

              {/* Portion Label & Kategorie & Icon */}
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-pink-200/60">
                <div>
                  <label className="text-[11px] font-semibold text-stone-500 block mb-1">Einheit / Portion</label>
                  <input
                    type="text"
                    placeholder="z. B. 1 Keks, 1 Stückchen, 1 Würfel"
                    value={customServingName}
                    onChange={(e) => setCustomServingName(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-800 bg-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-stone-500 block mb-1">Behälter / Kategorie</label>
                  <select
                    value={customCategory}
                    onChange={(e) => {
                      const cat = e.target.value as SnackCategory;
                      setCustomCategory(cat);
                      if (cat === 'chocolate') setCustomIcon('🍫');
                      else if (cat === 'cheese') setCustomIcon('🧀');
                      else if (cat === 'cookies') setCustomIcon('🍪');
                      else if (cat === 'nuts') setCustomIcon('🥜');
                      else if (cat === 'salty') setCustomIcon('🥔');
                      else if (cat === 'fruit') setCustomIcon('🍎');
                      else setCustomIcon('🍬');
                    }}
                    className="w-full px-2 py-1.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-800 bg-white cursor-pointer"
                  >
                    <option value="sweets">🍬 Süßes</option>
                    <option value="chocolate">🍫 Schokolade</option>
                    <option value="cookies">🍪 Kekse</option>
                    <option value="cheese">🧀 Käsehappen</option>
                    <option value="nuts">🥜 Nüsse</option>
                    <option value="salty">🥔 Salziges</option>
                    <option value="fruit">🍎 Obst</option>
                  </select>
                </div>
              </div>

              {/* CHECKBOX: ALS STANDARD MARKIEREN */}
              <label className="p-3 bg-white rounded-xl border border-pink-200/80 flex items-start gap-2.5 cursor-pointer shadow-2xs">
                <input
                  type="checkbox"
                  checked={markAsStandard}
                  onChange={(e) => setMarkAsStandard(e.target.checked)}
                  className="mt-0.5 rounded text-pink-600 focus:ring-pink-500 w-4 h-4 cursor-pointer"
                />
                <div className="text-xs">
                  <span className="font-extrabold text-stone-900 block flex items-center gap-1">
                    <span>⭐</span> Als Standard-Nascherei merken
                  </span>
                  <span className="text-[11px] text-stone-500 leading-tight block mt-0.5">
                    Erscheint dauerhaft im Behälter und in der Schnellauswahl für zukünftige 1-Klick-Einträge.
                  </span>
                </div>
              </label>

              {/* Action buttons in custom mode */}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleSaveOnlyAsStandardTemplate}
                  disabled={!customName.trim()}
                  className="flex-1 py-2.5 px-2 bg-white hover:bg-stone-50 border border-pink-300 text-pink-900 text-xs font-bold rounded-xl shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nur als Standard merken</span>
                </button>
              </div>
            </div>
          ) : (
            /* PRESET SNACKS & CONTAINER CONTENT */
            <div className="space-y-4">
              {filteredSnacks.length === 0 ? (
                /* EMPTY CONTAINER STATE */
                <div className="p-6 text-center bg-stone-50/80 rounded-2xl border-2 border-dashed border-pink-200/80 space-y-3">
                  <span className="text-4xl block">
                    {CONTAINER_INFO[selectedCategory]?.icon || '📦'}
                  </span>
                  <h4 className="font-extrabold text-stone-800 text-sm">
                    Dieser Behälter ist noch leer
                  </h4>
                  <p className="text-xs text-stone-500 max-w-xs mx-auto leading-relaxed">
                    Lege deine erste Lieblingssorte hinein oder sprich einfach in den Magic Button:
                    <span className="block mt-1.5 font-semibold text-pink-800 italic bg-pink-50 p-2 rounded-xl border border-pink-100">
                      {selectedCategory === 'cookies'
                        ? '„Erstelle bei den Keksen die Prinzenrolle“'
                        : selectedCategory === 'cheese'
                        ? '„Füge zum Käse bitte Bergkäse hinzu“'
                        : selectedCategory === 'chocolate'
                        ? '„Füge zur Schokolade bitte Milka hinzu“'
                        : '„Erstelle eine neue Standard-Nascherei“'}
                    </span>
                  </p>
                  <button
                    type="button"
                    onClick={() => handleOpenAddCustomForCategory(selectedCategory as SnackCategory)}
                    className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white font-bold text-xs shadow-soft cursor-pointer inline-flex items-center gap-1.5 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Erste Sorte in diesen Behälter legen</span>
                  </button>
                </div>
              ) : (
                <>
                  {/* Grid of snacks in this container */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                    {filteredSnacks.map((snack) => {
                      const isSelected = snack.id === (activeSnack?.id || selectedSnackId);
                      return (
                        <button
                          key={snack.id}
                          type="button"
                          onClick={() => handleSelectSnack(snack)}
                          className={`p-2.5 rounded-2xl border text-left transition-all flex items-center gap-2.5 relative cursor-pointer ${
                            isSelected
                              ? 'border-pink-500 bg-pink-50/90 text-pink-950 shadow-sm ring-2 ring-pink-500/20'
                              : 'border-stone-200 bg-white hover:bg-stone-50 text-stone-700'
                          }`}
                        >
                          <span className="text-2xl shrink-0">{snack.icon}</span>
                          <div className="min-w-0 pr-1">
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-bold block truncate">{snack.name}</span>
                            </div>
                            <span className="text-[10px] text-stone-400 block truncate">
                              {snack.defaultServingName} ({snack.calories} kcal)
                            </span>
                          </div>
                          {snack.isCustom && (
                            <span className="absolute top-1.5 right-1.5 text-[9px] bg-pink-100 text-pink-800 font-extrabold px-1 py-0.2 rounded">
                              ⭐
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* SELECTION DETAIL & QUICK PORTION BUTTONS */}
                  {activeSnack && (
                    <div className="p-4 bg-stone-50 border border-stone-200/80 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-3xl shrink-0">{activeSnack.icon}</span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="font-extrabold text-stone-900 text-sm truncate">{activeSnack.name}</h4>
                              {activeSnack.isCustom && (
                                <span className="text-[10px] bg-pink-100 text-pink-800 font-extrabold px-1.5 py-0.5 rounded-md">
                                  ⭐ Eigene Standard
                                </span>
                              )}
                            </div>
                            <span className="text-xs font-semibold text-pink-800 block truncate">
                              Basis: {activeSnack.defaultServingName} ({activeSnack.defaultGrams}g) = {activeSnack.calories} kcal
                            </span>
                          </div>
                        </div>

                        {/* DELETE / REMOVE BUTTON */}
                        <button
                          type="button"
                          onClick={handleDeleteCurrentSnack}
                          className="py-1.5 px-2.5 rounded-xl bg-white border border-stone-200 hover:border-rose-300 hover:bg-rose-50 text-stone-400 hover:text-rose-600 transition-all shadow-2xs cursor-pointer flex items-center gap-1 text-[11px] font-semibold shrink-0"
                          title={activeSnack.isCustom ? "Diese Standard-Nascherei löschen" : "Aus Standard-Auswahl entfernen"}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Entfernen</span>
                        </button>
                      </div>

                      {/* Educational Tip Box for Cheese / Chocolate / Cookies */}
                      {CONTAINER_INFO[activeSnack.category]?.tip && (
                        <div className={`p-2.5 rounded-xl border flex items-start gap-2 text-[11px] leading-snug ${
                          activeSnack.category === 'cheese'
                            ? 'bg-amber-50/90 border-amber-200 text-amber-950'
                            : activeSnack.category === 'chocolate'
                            ? 'bg-pink-50/90 border-pink-200 text-pink-950'
                            : 'bg-stone-100/80 border-stone-200 text-stone-800'
                        }`}>
                          <div>{CONTAINER_INFO[activeSnack.category]?.tip}</div>
                        </div>
                      )}

                      {/* Quick Preset Portions for this snack */}
                      {activeSnack.presets && activeSnack.presets.length > 0 && (
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block">
                              Portion wählen:
                            </label>
                            {activeSnack.category === 'cheese' && (
                              <span className="text-[10px] text-amber-800 font-semibold bg-amber-100/70 px-2 py-0.5 rounded-full">
                                Gramm-Schritte 🧀
                              </span>
                            )}
                            {activeSnack.category === 'chocolate' && (
                              <span className="text-[10px] text-pink-800 font-semibold bg-pink-100/70 px-2 py-0.5 rounded-full">
                                Stück-Zählung 🍫
                              </span>
                            )}
                            {activeSnack.category === 'cookies' && (
                              <span className="text-[10px] text-amber-800 font-semibold bg-amber-100/70 px-2 py-0.5 rounded-full">
                                Keks-Zählung 🍪
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                            {activeSnack.presets.map((preset, idx) => {
                              const isCurrent = Math.abs(amountMultiplier - preset.multiplier) < 0.05;
                              return (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => setAmountMultiplier(preset.multiplier)}
                                  className={`py-2 px-1.5 rounded-xl border text-center transition-all cursor-pointer ${
                                    isCurrent
                                      ? 'border-pink-600 bg-pink-600 text-white font-bold shadow-xs'
                                      : 'border-stone-200 bg-white text-stone-700 text-xs font-medium hover:bg-stone-100'
                                  }`}
                                >
                                  <span className="text-xs block leading-tight">{preset.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Amount Stepper */}
                      <div className="flex items-center justify-between pt-2 border-t border-stone-200/70 text-xs">
                        <span className="text-stone-500 font-medium">
                          {activeSnack.category === 'chocolate'
                            ? 'Stücke / Rippen:'
                            : activeSnack.category === 'cheese'
                            ? 'Happen / Scheiben:'
                            : activeSnack.category === 'cookies'
                            ? 'Kekse:'
                            : 'Stückzahl / Einheiten:'}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setAmountMultiplier(Math.max(0.5, amountMultiplier - (amountMultiplier <= 1 ? 0.5 : 1)))}
                            className="w-8 h-8 rounded-xl bg-white border border-stone-200 hover:bg-stone-100 flex items-center justify-center font-bold text-stone-700 cursor-pointer"
                          >
                            -
                          </button>
                          <span className="font-extrabold text-stone-900 text-sm min-w-[2.5rem] text-center">
                            {amountMultiplier}x
                          </span>
                          <button
                            type="button"
                            onClick={() => setAmountMultiplier(amountMultiplier + (amountMultiplier < 1 ? 0.5 : 1))}
                            className="w-8 h-8 rounded-xl bg-white border border-stone-200 hover:bg-stone-100 flex items-center justify-center font-bold text-stone-700 cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Live Macro & Calorie Result */}
                      <div className="p-3 bg-gradient-to-r from-pink-500/10 via-rose-500/5 to-transparent rounded-xl border border-pink-200/80 flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-pink-950 block">
                            Genaschte Menge: {effectiveGrams} Gramm
                          </span>
                          <span className="text-[10px] text-stone-500">
                            P: {effectiveProtein}g • K: {effectiveCarbs}g • F: {effectiveFat}g
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-xl font-black text-pink-900 leading-none block">
                            +{effectiveCalories} <span className="text-xs font-normal">kcal</span>
                          </span>
                          <span className="text-[10px] text-pink-700 font-medium">Zwischenmahlzeit</span>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* PSYCHOLOGY TAG: WHY DID YOU EAT THIS NIBBLE? */}
          <div className="space-y-1.5 pt-1">
            <label className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block">
              Warum genascht? (Essen-Psychologie)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {[
                { id: 'cravings', label: 'Lust / Heißhunger', icon: '🟡', desc: 'Appetit' },
                { id: 'stress', label: 'Stress / Frust', icon: '🔴', desc: 'Belohnung' },
                { id: 'social', label: 'Couch / Film / Freunde', icon: '🟣', desc: 'Gewohnheit' },
                { id: 'hunger', label: 'Echter Hunger', icon: '🟢', desc: 'Energie' },
              ].map((reason) => (
                <button
                  key={reason.id}
                  type="button"
                  onClick={() => setEatingReason(reason.id as EatingReason)}
                  className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                    eatingReason === reason.id
                      ? 'border-pink-500 bg-pink-50 text-pink-950 font-bold shadow-xs'
                      : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50 text-xs'
                  }`}
                >
                  <span className="text-sm block">{reason.icon}</span>
                  <span className="text-[11px] font-bold block truncate">{reason.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            type="button"
            onClick={handleSaveSnack}
            disabled={!isCustomSnack && !activeSnack}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 active:scale-[0.99] text-white font-bold text-sm shadow-soft transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
          >
            <Check className="w-5 h-5" />
            <span>
              {isCustomSnack
                ? `Nascherei eintragen (+${customCalories} kcal)`
                : activeSnack
                ? `Nascherei eintragen (+${effectiveCalories} kcal)`
                : 'Bitte zuerst eine Sorte anlegen'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
