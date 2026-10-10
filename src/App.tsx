import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, DEFAULT_USER_PROFILE, type MealType, type CustomRecipe, type DiaryEntry } from './db/db';
import { getTodayDateString } from './utils/nutrition';
import { type FoodProduct } from './services/foodApi';
import { decodePayloadToRecipe } from './utils/recipeShare';
import { Dashboard } from './components/Dashboard';
import { FastingTracker } from './components/FastingTracker';
import { WeightTracker } from './components/WeightTracker';
import { BottomNav, type NavTab } from './components/BottomNav';
import { QuickAddModal } from './components/QuickAddModal';
import { OnboardingModal } from './components/OnboardingModal';
import { SettingsModal } from './components/SettingsModal';
import { FoodSearchModal } from './components/FoodSearchModal';
import { BarcodeScannerModal } from './components/BarcodeScannerModal';
import { PortionCalculatorModal } from './components/PortionCalculatorModal';
import { RecipeCreatorModal } from './components/RecipeCreatorModal';
import { RecipeReceiveModal } from './components/RecipeReceiveModal';
import { ActivityModal } from './components/ActivityModal';
import { SnackModal } from './components/SnackModal';
import { AiMealModal } from './components/AiMealModal';
import { EditEntryModal } from './components/EditEntryModal';
import { NutritionReportModal } from './components/NutritionReportModal';
import { MorningBriefingModal } from './components/MorningBriefingModal';
import { VersionUpdateModal } from './components/VersionUpdateModal';
import { RecipeDatabaseView } from './components/RecipeDatabaseView';
import { CommunityNotificationBanner } from './components/CommunityNotificationBanner';
import {
  fetchCommunityRecipes,
  getSeenCommunityRecipeIds,
  getHiddenCommunityRecipeIds,
  markCommunityRecipeAsSeen,
  markAllCommunityRecipesAsSeen,
  sendCommunityRecipeNotification,
  type CommunityRecipe,
} from './utils/communityNotifier';
import { PAPRIKA_RECIPES } from './data/paprikaRecipes';
import { Settings, Maximize, Minimize } from 'lucide-react';
import { APP_VERSION, RECIPES_VERSION } from './config/version';
import { AvatarCropModal } from './components/AvatarCropModal';
import { SharedImageActionModal } from './components/SharedImageActionModal';
import { checkAndRetrieveSharedImage } from './utils/sharedImageHandler';

export function App() {
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [currentTab, setCurrentTab] = useState<NavTab>('diary');

  // Master App Mode: 'tracker' (Weniger fressen) vs 'recipes' (Mehr fressen)
  const [appMode, setAppMode] = useState<'tracker' | 'recipes'>(() => {
    try {
      return (localStorage.getItem('weniger_fressen_app_mode') as 'tracker' | 'recipes') || 'tracker';
    } catch {
      return 'tracker';
    }
  });

  const handleSwitchAppMode = (mode: 'tracker' | 'recipes') => {
    setAppMode(mode);
    try {
      localStorage.setItem('weniger_fressen_app_mode', mode);
    } catch (e) {
      console.warn('Could not store app mode', e);
    }
  };
  
  // Modals state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isPortionCalcOpen, setIsPortionCalcOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isRecipeCreatorOpen, setIsRecipeCreatorOpen] = useState(false);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [isSnackModalOpen, setIsSnackModalOpen] = useState(false);
  const [isAiMealModalOpen, setIsAiMealModalOpen] = useState(false);
  const [isNutritionReportOpen, setIsNutritionReportOpen] = useState(false);
  const [isMorningBriefingOpen, setIsMorningBriefingOpen] = useState(false);
  const [isMorningBriefingPreview, setIsMorningBriefingPreview] = useState(false);
  const [isVersionUpdateOpen, setIsVersionUpdateOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<DiaryEntry | null>(null);
  const [receivedRecipe, setReceivedRecipe] = useState<Omit<CustomRecipe, 'id'> | null>(null);
  const [activeMealType, setActiveMealType] = useState<MealType>('lunch');
  const [selectedProduct, setSelectedProduct] = useState<FoodProduct | null>(null);

  const [showSettings, setShowSettings] = useState(false);
  const [settingsInitialSection, setSettingsInitialSection] = useState<string | undefined>(undefined);
  const [forceOnboarding, setForceOnboarding] = useState(false);

  // Community notification state
  const [unseenCommunityRecipes, setUnseenCommunityRecipes] = useState<CommunityRecipe[]>([]);
  const [focusCommunityRecipeId, setFocusCommunityRecipeId] = useState<string | null>(null);

  // Check for new community recipes on mount & on app visibility change
  useEffect(() => {
    let isCancelled = false;

    const checkCommunityRecipes = async () => {
      try {
        const commRecipes = await fetchCommunityRecipes();
        if (isCancelled || commRecipes.length === 0) return;

        const seenIds = getSeenCommunityRecipeIds();
        const hiddenIds = getHiddenCommunityRecipeIds();
        const existingLocal = await db.recipes.toArray();
        const existingNames = new Set(existingLocal.map((r) => r.name.toLowerCase().trim()));

        // Filter recipes that have not been seen, not yet imported, and not hidden
        const unseen = commRecipes.filter(
          (cr) => !seenIds.has(cr.id) && !existingNames.has(cr.name.toLowerCase().trim()) && !hiddenIds.has(cr.id)
        );

        if (!isCancelled) {
          setUnseenCommunityRecipes(unseen);

          // If browser notification permission is granted, notify for the first unseen recipe
          if (
            unseen.length > 0 &&
            typeof window !== 'undefined' &&
            'Notification' in window &&
            Notification.permission === 'granted'
          ) {
            const lastNotifiedKey = 'weniger_fressen_last_notified_comm_id';
            const lastNotifiedId = localStorage.getItem(lastNotifiedKey);
            if (lastNotifiedId !== unseen[0].id) {
              sendCommunityRecipeNotification(unseen[0]);
              localStorage.setItem(lastNotifiedKey, unseen[0].id);
            }
          }
        }
      } catch (err) {
        console.warn('Check community recipes failed:', err);
      }
    };

    checkCommunityRecipes();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkCommunityRecipes();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      isCancelled = true;
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  const handleOpenFromCommunityNotification = (recipe: CommunityRecipe) => {
    markCommunityRecipeAsSeen(recipe.id);
    setUnseenCommunityRecipes((prev) => prev.filter((r) => r.id !== recipe.id));
    setFocusCommunityRecipeId(recipe.id);
    handleSwitchAppMode('recipes');
  };

  // Check URL on startup for shared recipe link (#recipe=... or ?recipe=...)
  useEffect(() => {
    const hash = window.location.hash;
    const search = window.location.search;
    if (hash.includes('recipe=') || search.includes('recipe=')) {
      const decoded = decodePayloadToRecipe(hash || search);
      if (decoded) {
        setReceivedRecipe(decoded);
        window.history.replaceState(null, '', window.location.pathname);
      }
    }
  }, []);

  // Check for shared image received via Web Share Target (Gallery / System-Teilen)
  const [sharedImageSrc, setSharedImageSrc] = useState<string | null>(null);
  const [isSharedImageModalOpen, setIsSharedImageModalOpen] = useState(false);
  const [isSharedAvatarCropOpen, setIsSharedCropAvatarOpen] = useState(false);

  useEffect(() => {
    const checkSharedImage = async () => {
      const img = await checkAndRetrieveSharedImage();
      if (img) {
        setSharedImageSrc(img);
        setIsSharedImageModalOpen(true);
      }
    };

    checkSharedImage();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkSharedImage();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  const handleUseSharedImageAsAvatar = () => {
    setIsSharedImageModalOpen(false);
    setIsSharedCropAvatarOpen(true);
  };

  const handleSharedAvatarCropComplete = async (croppedDataUrl: string) => {
    try {
      await db.userProfile.update('current', { avatarUrl: croppedDataUrl });
    } catch (e) {
      console.warn('Could not update avatarUrl from shared image', e);
    }
    setIsSharedCropAvatarOpen(false);
    setSharedImageSrc(null);
  };

  const handleCreateRecipeWithSharedImage = () => {
    setIsSharedImageModalOpen(false);
    handleSwitchAppMode('recipes');
    setIsRecipeCreatorOpen(true);
  };

  const handleLogMealWithSharedImage = () => {
    setIsSharedImageModalOpen(false);
    handleOpenQuickAdd('lunch');
  };

  // Live queries for reactive data updates
  const userProfile = useLiveQuery(() => db.userProfile.get('current'));
  const diaryEntries = useLiveQuery(
    () => db.diaryEntries.where({ date: selectedDate }).sortBy('timestamp'),
    [selectedDate]
  ) || [];
  const waterLogs = useLiveQuery(
    () => db.waterLogs.where({ date: selectedDate }).sortBy('timestamp'),
    [selectedDate]
  ) || [];
  const activityLogs = useLiveQuery(
    () => db.activityLogs.where({ date: selectedDate }).sortBy('timestamp'),
    [selectedDate]
  ) || [];
  const weightLogs = useLiveQuery(() => db.weightLogs.toArray()) || [];
  const fastingSessions = useLiveQuery(() => db.fastingSessions.toArray()) || [];
  const activeFastingSession = fastingSessions.find((s) => s.isActive);

  // Fallback while loading
  const profile = userProfile || DEFAULT_USER_PROFILE;

  // Auto-open morning briefing on first start of the day between 04:00 and 14:00
  useEffect(() => {
    if (!userProfile) return;
    if (!userProfile.isOnboarded) return;
    if (userProfile.showMorningBriefing === false) return;

    const today = getTodayDateString();
    if (userProfile.lastMorningBriefingDate === today) return;

    const currentHour = new Date().getHours();
    if (currentHour >= 4 && currentHour < 14) {
      setIsMorningBriefingPreview(false);
      setIsMorningBriefingOpen(true);
    }
  }, [userProfile?.isOnboarded, userProfile?.showMorningBriefing, userProfile?.lastMorningBriefingDate]);

  // Auto-show Version 1.7 update message to all users on first load of v1.7
  useEffect(() => {
    try {
      const lastSeenVersion = localStorage.getItem('weniger_fressen_last_seen_version');
      if (lastSeenVersion !== APP_VERSION) {
        const timer = setTimeout(() => {
          setIsVersionUpdateOpen(true);
        }, 500);
        return () => clearTimeout(timer);
      }
    } catch (e) {
      console.warn('Could not read last seen version', e);
    }
  }, []);

  const handleCloseVersionUpdate = () => {
    setIsVersionUpdateOpen(false);
    try {
      localStorage.setItem('weniger_fressen_last_seen_version', APP_VERSION);
    } catch (e) {
      console.warn('Could not store last seen version', e);
    }
  };

  const handleCloseMorningBriefing = async () => {
    setIsMorningBriefingOpen(false);
    if (!isMorningBriefingPreview) {
      const today = getTodayDateString();
      try {
        await db.userProfile.update('current', { lastMorningBriefingDate: today });
      } catch (err) {
        console.error('Fehler beim Aktualisieren von lastMorningBriefingDate:', err);
      }
    }
    setIsMorningBriefingPreview(false);
  };

  const handleOpenSearch = (mealType: MealType = 'lunch') => {
    setActiveMealType(mealType);
    setIsSearchOpen(true);
  };

  const handleOpenQuickAdd = (mealType: MealType = 'lunch') => {
    setActiveMealType(mealType);
    setIsQuickAddOpen(true);
  };

  const handleOpenScanner = () => {
    setIsScannerOpen(true);
  };

  const handleOpenRecipeCreator = (mealType: MealType = 'lunch') => {
    setActiveMealType(mealType);
    setIsRecipeCreatorOpen(true);
  };

  // Seed Master Paprika Recipes into local Dexie database if not already present
  useEffect(() => {
    const seedMasterRecipes = async () => {
      try {
        const existing = await db.recipes.toArray();
        const existingNames = new Set(existing.map((r) => r.name.toLowerCase().trim()));
        const toAdd = PAPRIKA_RECIPES.filter((pr) => !existingNames.has(pr.name.toLowerCase().trim()));
        if (toAdd.length > 0) {
          await db.recipes.bulkAdd(toAdd);
        }
      } catch (err) {
        console.warn('Could not seed Paprika recipes:', err);
      }
    };
    seedMasterRecipes();
  }, []);

  const handleOpenPortionCalcForRecipe = (recipe: CustomRecipe) => {
    const product: FoodProduct = {
      id: `recipe-${recipe.id || recipe.name}`,
      name: recipe.name,
      brand: 'Selbstgemacht',
      calories100g: recipe.calories100g,
      protein100g: recipe.protein100g,
      carbs100g: recipe.carbs100g,
      fat100g: recipe.fat100g,
      fiber100g: recipe.fiber100g,
      sugar100g: recipe.sugar100g,
      imageUrl: recipe.imageUrl,
      source: 'recipe',
      recipeData: recipe,
      cookedWeight: recipe.cookedWeight,
      totalRawWeight: recipe.totalRawWeight,
      servingName: recipe.servingName,
      servingWeightGrams: recipe.servingWeightGrams,
      recipeCategory: recipe.category,
    };
    setSelectedProduct(product);
    setIsPortionCalcOpen(true);
  };

  const [aiMealInitialText, setAiMealInitialText] = useState<string>('');
  const [aiMealAutoStartVoice, setAiMealAutoStartVoice] = useState(false);
  const [aiMealVoiceStopSignal, setAiMealVoiceStopSignal] = useState(0);

  const handleOpenAiMeal = (
    mealType: MealType = 'breakfast',
    initialText: string = '',
    autoStartVoice: boolean = false
  ) => {
    setActiveMealType(mealType);
    setAiMealInitialText(initialText);
    setAiMealAutoStartVoice(autoStartVoice);
    setIsAiMealModalOpen(true);
  };

  const handleVoiceMealFromNav = () => {
    if (isAiMealModalOpen) {
      // Tapping the central Magic Button a second time cleanly stops/finishes recording!
      setAiMealVoiceStopSignal((prev) => prev + 1);
      return;
    }

    const currentHour = new Date().getHours();
    let defaultMeal: MealType = 'lunch';
    if (currentHour < 11) defaultMeal = 'breakfast';
    else if (currentHour < 15) defaultMeal = 'lunch';
    else if (currentHour < 21) defaultMeal = 'dinner';
    else defaultMeal = 'snack';

    handleOpenAiMeal(defaultMeal, '', true);
  };

  const handleProductSelected = (product: FoodProduct) => {
    setSelectedProduct(product);
    setIsSearchOpen(false);
    setIsPortionCalcOpen(true);
  };

  const handleProductFoundFromScanner = (product: FoodProduct) => {
    setSelectedProduct(product);
    setIsScannerOpen(false);
    setIsPortionCalcOpen(true);
  };

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
      console.log('Fullscreen error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAF8] text-stone-800 flex flex-col font-sans selection:bg-emerald-100">
      
      {/* Top Header: Dual-Brand Switching ("Weniger fressen" ↔ "Mehr fressen") */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-surface-border px-3 py-2 shadow-xs">
        <div className="max-w-md mx-auto flex items-center justify-between gap-2">
          {/* Dual Brand Switcher */}
          <div className="flex-1 grid grid-cols-2 gap-1.5 p-1 bg-stone-100/90 rounded-2xl border border-stone-200/70">
            {/* Weniger fressen (Tracker) */}
            <button
              type="button"
              onClick={() => handleSwitchAppMode('tracker')}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer text-left ${
                appMode === 'tracker'
                  ? 'bg-white shadow-xs text-stone-900 border border-stone-200/70'
                  : 'text-stone-500 hover:text-stone-800 hover:bg-stone-50/60'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0 transition-transform ${
                  appMode === 'tracker'
                    ? 'bg-gradient-to-tr from-emerald-500 to-teal-500 text-white shadow-2xs scale-105'
                    : 'bg-stone-200/80 text-stone-600'
                }`}
              >
                🥗
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[12px] font-extrabold tracking-tight truncate leading-tight">
                  Weniger fressen
                </div>
                <div className="text-[10px] font-bold text-emerald-600 leading-tight">
                  v{APP_VERSION} • Tracker
                </div>
              </div>
            </button>

            {/* Mehr fressen (Rezepte) */}
            <button
              type="button"
              onClick={() => handleSwitchAppMode('recipes')}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer text-left ${
                appMode === 'recipes'
                  ? 'bg-white shadow-xs text-stone-900 border border-stone-200/70'
                  : 'text-stone-500 hover:text-stone-800 hover:bg-stone-50/60'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0 transition-transform ${
                  appMode === 'recipes'
                    ? 'bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-2xs scale-105'
                    : 'bg-stone-200/80 text-stone-600'
                }`}
              >
                📖
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[12px] font-extrabold tracking-tight truncate leading-tight flex items-center gap-1.5">
                  <span>Mehr fressen</span>
                  {unseenCommunityRecipes.length > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[9px] font-black animate-pulse shadow-xs">
                      {unseenCommunityRecipes.length} NEU
                    </span>
                  )}
                </div>
                <div className="text-[10px] font-bold text-amber-600 leading-tight">
                  v{RECIPES_VERSION} • Rezepte
                </div>
              </div>
            </button>
          </div>

          {/* Quick Controls: Fullscreen & Settings */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={handleToggleFullscreen}
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all border ${
                isFullscreen
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-stone-50 hover:bg-stone-100 text-stone-500 border-stone-200/60'
              }`}
              title={isFullscreen ? 'Vollbildmodus beenden' : 'Vollbildmodus aktivieren'}
            >
              {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
            </button>

            <button
              type="button"
              onClick={() => {
                setSettingsInitialSection(undefined);
                setShowSettings(true);
              }}
              className="w-8 h-8 rounded-xl bg-stone-50 hover:bg-stone-100 flex items-center justify-center text-stone-500 transition-colors border border-stone-200/60 overflow-hidden cursor-pointer"
              title="Einstellungen & Profil"
            >
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full object-cover" />
              ) : (
                <Settings className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Screen Content */}
      <main className="flex-1 max-w-md w-full mx-auto p-4 sm:p-5 space-y-4">
        {unseenCommunityRecipes.length > 0 && (
          <CommunityNotificationBanner
            unseenRecipes={unseenCommunityRecipes}
            onViewRecipe={handleOpenFromCommunityNotification}
            onDismissRecipe={(recipeId) => {
              markCommunityRecipeAsSeen(recipeId);
              setUnseenCommunityRecipes((prev) => prev.filter((r) => r.id !== recipeId));
            }}
            onDismissAll={() => {
              markAllCommunityRecipesAsSeen(unseenCommunityRecipes.map((r) => r.id));
              setUnseenCommunityRecipes([]);
            }}
          />
        )}

        {appMode === 'recipes' ? (
          <RecipeDatabaseView
            onOpenRecipeCreator={() => setIsRecipeCreatorOpen(true)}
            onOpenPortionCalcForRecipe={handleOpenPortionCalcForRecipe}
            selectedDate={selectedDate}
            focusCommunityRecipeId={focusCommunityRecipeId}
            onClearFocusCommunityRecipeId={() => setFocusCommunityRecipeId(null)}
            onOpenCategorySettings={() => {
              setSettingsInitialSection('recipe_categories');
              setShowSettings(true);
            }}
          />
        ) : (
          <>
            {currentTab === 'diary' && (
              <Dashboard
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                userProfile={profile}
                diaryEntries={diaryEntries}
                waterLogs={waterLogs}
                activityLogs={activityLogs}
                activeFastingSession={activeFastingSession}
                onOpenSearch={handleOpenSearch}
                onOpenScanner={handleOpenScanner}
                onOpenQuickAdd={handleOpenQuickAdd}
                onOpenRecipeCreator={handleOpenRecipeCreator}
                onOpenActivityModal={() => setIsActivityModalOpen(true)}
                onOpenSnackModal={() => setIsSnackModalOpen(true)}
                onOpenAiMeal={handleOpenAiMeal}
                onOpenNutritionReport={() => setIsNutritionReportOpen(true)}
                onEditEntry={setEditingEntry}
                onNavigateToTab={setCurrentTab}
              />
            )}

            {currentTab === 'fasting' && (
              <div className="space-y-4 pb-24">
                <FastingTracker currentSession={activeFastingSession} />
              </div>
            )}

            {currentTab === 'weight' && (
              <div className="space-y-4 pb-24">
                <WeightTracker
                  logs={weightLogs}
                  userProfile={profile}
                  onOpenNutritionReport={() => setIsNutritionReportOpen(true)}
                />
              </div>
            )}

            {currentTab === 'settings' && (
              <div className="space-y-4 pb-24">
                <div className="bg-white rounded-3xl p-6 shadow-card border border-surface-border text-center space-y-4">
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto text-3xl overflow-hidden border border-emerald-100 shadow-2xs">
                    {profile.avatarUrl ? (
                      <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full object-cover" />
                    ) : (
                      '👤'
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-stone-800">{profile.name}</h3>
                    <p className="text-xs text-stone-400">
                      Ziel: {profile.targetWeight} kg (Aktuell: {profile.weight} kg)
                    </p>
                  </div>

                  <div className="p-3 bg-stone-50 rounded-2xl text-xs text-stone-600 space-y-1 text-left">
                    <div className="flex justify-between">
                      <span>Tagesbudget:</span>
                      <span className="font-bold text-stone-800">{profile.targetCalories} kcal</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Protein:</span>
                      <span className="font-bold text-stone-800">{profile.targetProtein} g</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Kohlenhydrate:</span>
                      <span className="font-bold text-stone-800">{profile.targetCarbs} g</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Fett:</span>
                      <span className="font-bold text-stone-800">{profile.targetFat} g</span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-1">
                    <button
                      onClick={() => setIsNutritionReportOpen(true)}
                      className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs shadow-soft hover:from-emerald-700 hover:to-teal-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>📊 Ernährungs-Bericht auf Abruf (3, 5, 10, 20 Tage)</span>
                    </button>

                    <button
                      onClick={() => setShowSettings(true)}
                      className="w-full py-3 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs transition-all cursor-pointer"
                    >
                      Ziele & API-Keys bearbeiten
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Floating Bottom Navigation with Aesthetic AI Voice/Meal Button */}
      <BottomNav
        currentTab={currentTab}
        onTabChange={(tab) => {
          handleSwitchAppMode('tracker');
          setCurrentTab(tab);
        }}
        onVoiceMealClick={handleVoiceMealFromNav}
      />

      {/* Food Search Modal (Supermarkt, Basics, Open Food Facts & Gemini KI) */}
      <FoodSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectProduct={handleProductSelected}
        onOpenScanner={handleOpenScanner}
        onOpenQuickAdd={() => {
          setIsSearchOpen(false);
          setIsQuickAddOpen(true);
        }}
        onOpenRecipeCreator={() => {
          setIsSearchOpen(false);
          setIsRecipeCreatorOpen(true);
        }}
        onOpenAiMeal={(initialText?: string) => {
          setIsSearchOpen(false);
          handleOpenAiMeal(activeMealType, initialText || '');
        }}
        onOpenSettings={() => setShowSettings(true)}
        geminiApiKey={profile.geminiApiKey}
        selectedMealType={activeMealType}
      />

      {/* Barcode Scanner Modal (Camera + Fallback) */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onProductFound={handleProductFoundFromScanner}
        onRecipeFound={(recipe) => {
          setIsScannerOpen(false);
          setReceivedRecipe(recipe);
        }}
        onManualAdd={() => {
          setIsScannerOpen(false);
          setIsQuickAddOpen(true);
        }}
      />

      {/* Received Shared Recipe Modal */}
      <RecipeReceiveModal
        isOpen={!!receivedRecipe}
        onClose={() => setReceivedRecipe(null)}
        receivedRecipe={receivedRecipe}
        onSaved={() => {
          setIsSearchOpen(true);
        }}
      />

      {/* Recipe / Bread Creator Modal */}
      <RecipeCreatorModal
        isOpen={isRecipeCreatorOpen}
        onClose={() => setIsRecipeCreatorOpen(false)}
        defaultMealType={activeMealType}
        geminiApiKey={profile.geminiApiKey}
        onOpenSettings={() => setShowSettings(true)}
        selectedDate={selectedDate}
        onRecipeSaved={(recipe) => {
          setIsRecipeCreatorOpen(false);
          // Convert newly created recipe into FoodProduct and open PortionCalculator immediately
          const isBread = recipe.category === 'bread' || recipe.name.toLowerCase().includes('brot');
          const isDrink = recipe.category === 'drink';
          const totalWeight = recipe.cookedWeight || recipe.totalRawWeight || (isDrink ? 250 : isBread ? 500 : 350);
          const servName = recipe.servingName || (isBread ? '1 Scheibe' : isDrink ? '1 Glas' : '1 Portion');
          const servWeight = recipe.servingWeightGrams || (isDrink ? 250 : isBread ? 50 : totalWeight);

          const product: FoodProduct = {
            id: `recipe-${recipe.id || Date.now()}`,
            name: recipe.name,
            brand: isBread
              ? `Selbstgebacken (Laib: ${totalWeight}g)`
              : isDrink
              ? `Selbstgemacht (Gesamt: ${totalWeight}ml)`
              : `Selbstgekocht (Gesamt: ${totalWeight}g)`,
            calories100g: recipe.calories100g,
            protein100g: recipe.protein100g,
            carbs100g: recipe.carbs100g,
            fat100g: recipe.fat100g,
            fiber100g: recipe.fiber100g,
            sugar100g: recipe.sugar100g,
            imageUrl: recipe.imageUrl,
            servingSize: `${servName} (${servWeight}g)`,
            servingWeightGrams: servWeight,
            totalDishWeight: totalWeight,
            cookedWeight: recipe.cookedWeight,
            totalRawWeight: recipe.totalRawWeight,
            recipeCategory: recipe.category,
            source: 'recipe',
            recipeData: recipe,
          };
          setSelectedProduct(product);
          setIsPortionCalcOpen(true);
        }}
      />

      {/* Portion Calculator Modal */}
      <PortionCalculatorModal
        product={selectedProduct}
        isOpen={isPortionCalcOpen}
        onClose={() => {
          setIsPortionCalcOpen(false);
          setSelectedProduct(null);
        }}
        selectedDate={selectedDate}
        defaultMealType={activeMealType}
      />

      {/* Quick Add Modal */}
      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        selectedDate={selectedDate}
        defaultMealType={activeMealType}
      />

      {/* Activity Tracker Modal */}
      <ActivityModal
        isOpen={isActivityModalOpen}
        onClose={() => setIsActivityModalOpen(false)}
        selectedDate={selectedDate}
        userProfile={profile}
      />

      {/* Snack / Nascherei Modal */}
      <SnackModal
        isOpen={isSnackModalOpen}
        onClose={() => setIsSnackModalOpen(false)}
        selectedDate={selectedDate}
      />

      {/* Multimodal AI Meal Modal (Photo capture, speech-to-text, Gemini meal analysis & interactive breakdown) */}
      <AiMealModal
        isOpen={isAiMealModalOpen}
        onClose={() => {
          setIsAiMealModalOpen(false);
          setAiMealInitialText('');
          setAiMealAutoStartVoice(false);
        }}
        selectedDate={selectedDate}
        defaultMealType={activeMealType}
        geminiApiKey={profile.geminiApiKey}
        onOpenSettings={() => setShowSettings(true)}
        initialDescription={aiMealInitialText}
        autoStartVoice={aiMealAutoStartVoice}
        voiceStopSignal={aiMealVoiceStopSignal}
      />

      {/* Edit Existing Diary Entry Modal */}
      <EditEntryModal
        isOpen={Boolean(editingEntry)}
        onClose={() => setEditingEntry(null)}
        entry={editingEntry}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => {
          setShowSettings(false);
          setSettingsInitialSection(undefined);
        }}
        initialSection={settingsInitialSection}
        userProfile={profile}
        onReopenOnboarding={() => setForceOnboarding(true)}
        onOpenRecipeCreator={() => {
          setShowSettings(false);
          setIsRecipeCreatorOpen(true);
        }}
        onOpenNutritionReport={() => {
          setShowSettings(false);
          setIsNutritionReportOpen(true);
        }}
        onOpenMorningBriefingPreview={() => {
          setIsMorningBriefingPreview(true);
          setIsMorningBriefingOpen(true);
        }}
        onOpenVersionUpdate={() => setIsVersionUpdateOpen(true)}
      />

      {/* Multi-Day Nutrition Report Modal (3, 5, 10, 20 Tage mit UPF, Fetten, Ballaststoffen & WhatsApp) */}
      <NutritionReportModal
        isOpen={isNutritionReportOpen}
        onClose={() => setIsNutritionReportOpen(false)}
        userProfile={profile}
        selectedDate={selectedDate}
        onOpenSettings={() => setShowSettings(true)}
      />

      {/* Automated Morning Motivation Briefing Modal */}
      <MorningBriefingModal
        isOpen={isMorningBriefingOpen}
        onClose={handleCloseMorningBriefing}
        userProfile={profile}
        onOpenFullReport={() => setIsNutritionReportOpen(true)}
        isPreview={isMorningBriefingPreview}
      />

      {/* Version 1.7 Update Announcement Modal */}
      <VersionUpdateModal
        isOpen={isVersionUpdateOpen}
        onClose={handleCloseVersionUpdate}
        onOpenMagicAssistant={() => {
          handleCloseVersionUpdate();
          handleOpenAiMeal('breakfast', '', true);
        }}
      />

      {/* Onboarding Modal for First Time Users or Re-calculation */}
      {(!userProfile?.isOnboarded || forceOnboarding) && (
        <OnboardingModal
          initialProfile={userProfile}
          onComplete={() => setForceOnboarding(false)}
        />
      )}

      {/* Web Share Target Incoming Image Action Modal */}
      {isSharedImageModalOpen && sharedImageSrc && (
        <SharedImageActionModal
          isOpen={isSharedImageModalOpen}
          imageSrc={sharedImageSrc}
          onClose={() => {
            setIsSharedImageModalOpen(false);
            setSharedImageSrc(null);
          }}
          onUseAsAvatar={handleUseSharedImageAsAvatar}
          onCreateRecipeWithImage={handleCreateRecipeWithSharedImage}
          onLogMealWithImage={handleLogMealWithSharedImage}
        />
      )}

      {/* Avatar Crop Modal for Shared Image */}
      {isSharedAvatarCropOpen && sharedImageSrc && (
        <AvatarCropModal
          isOpen={isSharedAvatarCropOpen}
          imageSrc={sharedImageSrc}
          onClose={() => {
            setIsSharedCropAvatarOpen(false);
            setSharedImageSrc(null);
          }}
          onCropComplete={handleSharedAvatarCropComplete}
        />
      )}
    </div>
  );
}

export default App;
