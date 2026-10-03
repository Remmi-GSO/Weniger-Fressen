import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, DEFAULT_USER_PROFILE, type MealType, type CustomRecipe } from './db/db';
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
import { Settings } from 'lucide-react';

export function App() {
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [currentTab, setCurrentTab] = useState<NavTab>('diary');
  
  // Modals state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isPortionCalcOpen, setIsPortionCalcOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isRecipeCreatorOpen, setIsRecipeCreatorOpen] = useState(false);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [isSnackModalOpen, setIsSnackModalOpen] = useState(false);
  const [receivedRecipe, setReceivedRecipe] = useState<Omit<CustomRecipe, 'id'> | null>(null);
  const [activeMealType, setActiveMealType] = useState<MealType>('lunch');
  const [selectedProduct, setSelectedProduct] = useState<FoodProduct | null>(null);

  const [showSettings, setShowSettings] = useState(false);
  const [forceOnboarding, setForceOnboarding] = useState(false);

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

  return (
    <div className="min-h-screen bg-[#F8FAF8] text-stone-800 flex flex-col font-sans selection:bg-emerald-100">
      
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-surface-border px-5 py-3.5 shadow-sm">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-xl shadow-soft">
              🥗
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-tight text-stone-900 leading-none">
                Weniger Fressen
              </h1>
              <p className="text-[11px] text-stone-400 font-medium mt-0.5">
                {profile.name && profile.name.trim() !== 'Du' ? (
                  <>Hallo, <span className="font-semibold text-stone-600">{profile.name.trim()}</span> 👋</>
                ) : (
                  <>Willkommen 👋</>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowSettings(true)}
            className="w-9 h-9 rounded-2xl bg-stone-50 hover:bg-stone-100 flex items-center justify-center text-stone-500 transition-colors border border-stone-100"
            title="Einstellungen"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Screen Content */}
      <main className="flex-1 max-w-md w-full mx-auto p-4 sm:p-5">
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
            <WeightTracker logs={weightLogs} userProfile={profile} />
          </div>
        )}

        {currentTab === 'settings' && (
          <div className="space-y-4 pb-24">
            <div className="bg-white rounded-3xl p-6 shadow-card border border-surface-border text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto text-3xl">
                👤
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

              <button
                onClick={() => setShowSettings(true)}
                className="w-full py-3 rounded-2xl bg-emerald-600 text-white font-bold text-xs shadow-soft hover:bg-emerald-700 transition-all"
              >
                Ziele & API-Keys bearbeiten
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Floating Bottom Navigation */}
      <BottomNav
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        onQuickAddClick={() => handleOpenSearch('lunch')}
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
        onRecipeSaved={(recipe) => {
          setIsRecipeCreatorOpen(false);
          // Convert newly created recipe into FoodProduct and open PortionCalculator immediately
          const isBread = recipe.category === 'bread' || recipe.name.toLowerCase().includes('brot');
          const servName = recipe.servingName || (isBread ? '1 Scheibe' : '1 Portion');
          const servWeight = recipe.servingWeightGrams || (isBread ? 50 : 100);

          const product: FoodProduct = {
            id: `recipe-${recipe.id || Date.now()}`,
            name: recipe.name,
            brand: `Selbstgemacht (${servName} ${servWeight}g)`,
            calories100g: recipe.calories100g,
            protein100g: recipe.protein100g,
            carbs100g: recipe.carbs100g,
            fat100g: recipe.fat100g,
            servingSize: `${servName} (${servWeight}g)`,
            servingWeightGrams: servWeight,
            source: 'recipe',
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

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        userProfile={profile}
        onReopenOnboarding={() => setForceOnboarding(true)}
      />

      {/* Onboarding Modal for First Time Users or Re-calculation */}
      {(!userProfile?.isOnboarded || forceOnboarding) && (
        <OnboardingModal
          initialProfile={userProfile}
          onComplete={() => setForceOnboarding(false)}
        />
      )}
    </div>
  );
}

export default App;
