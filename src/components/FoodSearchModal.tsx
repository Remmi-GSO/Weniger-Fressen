import { useState, useEffect, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type MealType, type CustomRecipe } from '../db/db';
import { searchFoodProducts, type FoodProduct } from '../services/foodApi';
import { queryFoodWithGemini } from '../services/geminiApi';
import { RecipeShareModal } from './RecipeShareModal';
import { Search, X, Barcode, Star, Loader2, Sparkles, AlertCircle, Plus, Trash2, Share2 } from 'lucide-react';

interface FoodSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct: (product: FoodProduct) => void;
  onOpenScanner: () => void;
  onOpenQuickAdd: () => void;
  onOpenRecipeCreator?: () => void;
  onOpenSettings?: () => void;
  onOpenAiMeal?: () => void;
  geminiApiKey?: string;
  selectedMealType?: MealType;
}

export const FoodSearchModal = ({
  isOpen,
  onClose,
  onSelectProduct,
  onOpenScanner,
  onOpenQuickAdd,
  onOpenRecipeCreator,
  onOpenSettings,
  onOpenAiMeal,
  geminiApiKey,
  selectedMealType = 'lunch',
}: FoodSearchModalProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FoodProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'search' | 'recipes' | 'favorites'>('search');
  const [sharingRecipe, setSharingRecipe] = useState<CustomRecipe | null>(null);
  
  // AI Lookup states
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Load favorites and custom recipes from local Dexie database
  const favoriteItems = useLiveQuery(() => db.favoriteItems.orderBy('useCount').reverse().limit(30).toArray()) || [];
  const customRecipes = useLiveQuery(() => db.recipes.reverse().toArray()) || [];

  // Instant local search + debounced remote search
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setResults([]);
      setIsLoading(false);
      setAiError(null);
      return;
    }

    setIsLoading(true);
    setAiError(null);

    const timer = setTimeout(async () => {
      try {
        const items = await searchFoodProducts(query);
        setResults(items);
      } catch (err) {
        console.error('Search error', err);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const matchingRecipes = useMemo(() => {
    if (!query.trim() || query.trim().length < 2) return [];
    const q = query.toLowerCase();
    return customRecipes.filter((r) => r.name.toLowerCase().includes(q));
  }, [query, customRecipes]);

  if (!isOpen) return null;

  const popularChips = [
    'Harry Brot',
    'Golden Toast',
    'Haferflocken',
    'Skyr',
    'Magerquark',
    'Hähnchen',
    'Banane',
    'Eier',
    'Barilla',
  ];

  const mealLabels: Record<MealType, string> = {
    breakfast: 'Frühstück',
    lunch: 'Mittagessen',
    dinner: 'Abendessen',
    snack: 'Snacks',
  };

  const handleSelectFavorite = (fav: any) => {
    const product: FoodProduct = {
      id: String(fav.id || fav.name),
      name: fav.name,
      calories100g: fav.calories,
      protein100g: fav.protein,
      carbs100g: fav.carbs,
      fat100g: fav.fat,
      servingWeightGrams: fav.defaultAmount,
      source: 'local',
    };
    onSelectProduct(product);
  };

  const handleAiLookup = async () => {
    if (!query.trim()) return;

    if (!geminiApiKey) {
      setAiError('Bitte hinterlege zuerst deinen kostenlosen Gemini API Key.');
      return;
    }

    setIsAiLoading(true);
    setAiError(null);

    try {
      const product = await queryFoodWithGemini(query, geminiApiKey);
      if (product) {
        onSelectProduct(product);
      } else {
        setAiError('Keine Nährwerte über KI ermittelbar.');
      }
    } catch (err: any) {
      setAiError(err.message || 'Fehler beim KI-Aufruf.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const recipeToFoodProduct = (r: CustomRecipe): FoodProduct => {
    const isBread = r.category === 'bread' || r.name.toLowerCase().includes('brot');
    const servName = r.servingName || (isBread ? '1 Scheibe' : '1 Portion');
    const servWeight = r.servingWeightGrams || (isBread ? 50 : 100);

    return {
      id: `recipe-${r.id}`,
      name: r.name,
      brand: `Selbstgemacht (${servName} ${servWeight}g)`,
      calories100g: r.calories100g,
      protein100g: r.protein100g,
      carbs100g: r.carbs100g,
      fat100g: r.fat100g,
      servingSize: `${servName} (${servWeight}g)`,
      servingWeightGrams: servWeight,
      source: 'recipe',
    };
  };

  const handleDeleteRecipe = async (e: React.MouseEvent, recipeId?: number) => {
    e.stopPropagation();
    if (!recipeId) return;
    if (window.confirm('Möchtest du dieses Rezept wirklich löschen?')) {
      await db.recipes.delete(recipeId);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-soft-lg border border-stone-100 overflow-hidden h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="p-4 px-6 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl text-lg">🍏</span>
            <div>
              <h3 className="font-bold text-stone-800 text-base">Lebensmittel & Supermarkt</h3>
              <p className="text-xs text-stone-400">
                Für <span className="font-semibold text-emerald-700">{mealLabels[selectedMealType]}</span>
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

        {/* Search Bar & Barcode Scanner Button */}
        <div className="p-4 border-b border-stone-100 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                autoFocus
                placeholder="Marke oder Speise (z.B. Harry 1688, Skyr, Toast...)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 rounded-2xl border border-stone-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-sm text-stone-800"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {onOpenAiMeal && (
              <button
                onClick={() => {
                  onClose();
                  onOpenAiMeal();
                }}
                className="px-3 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 border border-emerald-200/80 text-emerald-800 flex items-center gap-1.5 shadow-2xs text-xs font-bold transition-all shrink-0"
                title="Foto oder Sprache mit KI erfassen"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Foto/Sprache</span>
              </button>
            )}

            <button
              onClick={() => {
                onClose();
                onOpenScanner();
              }}
              className="px-3.5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white flex items-center gap-1.5 shadow-soft text-xs font-bold transition-all shrink-0"
              title="Barcode scannen"
            >
              <Barcode className="w-4 h-4" />
              <span className="hidden sm:inline">Scannen</span>
            </button>
          </div>

          {/* Tab Bar: Katalog vs. Rezepte vs. Favoriten */}
          <div className="flex border-b border-stone-100">
            <button
              onClick={() => setActiveTab('search')}
              className={`flex-1 py-2 text-xs font-bold text-center border-b-2 transition-all flex items-center justify-center gap-1 ${
                activeTab === 'search'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-stone-400 hover:text-stone-600'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Katalog</span>
            </button>

            <button
              onClick={() => setActiveTab('recipes')}
              className={`flex-1 py-2 text-xs font-bold text-center border-b-2 transition-all flex items-center justify-center gap-1 ${
                activeTab === 'recipes'
                  ? 'border-amber-600 text-amber-800'
                  : 'border-transparent text-stone-400 hover:text-stone-600'
              }`}
            >
              <span>🍞</span>
              <span>Rezepte ({customRecipes.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('favorites')}
              className={`flex-1 py-2 text-xs font-bold text-center border-b-2 transition-all flex items-center justify-center gap-1 ${
                activeTab === 'favorites'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-stone-400 hover:text-stone-600'
              }`}
            >
              <Star className="w-3.5 h-3.5" />
              <span>Favoriten ({favoriteItems.length})</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {/* TAB 1: SEARCH RESULTS */}
          {activeTab === 'search' && (
            <>
              {/* Bread / Recipe Creator Banner */}
              {(!query || query.toLowerCase().includes('brot') || query.toLowerCase().includes('rezept') || query.toLowerCase().includes('back')) && (
                <div
                  onClick={() => {
                    onClose();
                    onOpenRecipeCreator?.();
                  }}
                  className="p-3 bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent border border-amber-200/90 rounded-2xl flex items-center justify-between cursor-pointer hover:border-amber-400 transition-all group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center text-xl shadow-sm group-hover:scale-105 transition-transform shrink-0">
                      🍞
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-amber-950 flex items-center gap-1.5 truncate">
                        <span>Eigenes Brot / Rezept berechnen</span>
                        <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded-full font-bold">
                          Selber backen
                        </span>
                      </div>
                      <div className="text-[11px] text-amber-800/80 truncate">
                        Zutaten erfassen, Backverlust abziehen & Scheiben wiegen
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-amber-800 bg-white px-2.5 py-1 rounded-xl border border-amber-200 shrink-0">
                    Öffnen →
                  </span>
                </div>
              )}

              {/* Quick Suggestion Chips if search is empty */}
              {!query && (
                <div className="space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-400 block">
                    Beliebte Supermarkt-Marken & Basics
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {popularChips.map((chip) => (
                      <button
                        key={chip}
                        onClick={() => setQuery(chip)}
                        className="py-1.5 px-3 rounded-full bg-stone-100 hover:bg-emerald-50 hover:text-emerald-800 text-stone-600 text-xs font-semibold transition-all border border-stone-200/50"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>

                  <div className="pt-6 text-center text-stone-400 space-y-2">
                    <div className="w-12 h-12 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto text-xl">
                      🔍
                    </div>
                    <p className="text-xs">
                      Tippe oben ein Lebensmittel oder eine Marke ein (z. B. Harry, Golden Toast, Skyr).
                    </p>
                  </div>
                </div>
              )}

              {/* AI Quick Button when user types a query */}
              {query.length >= 2 && (
                <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-green-50 p-3 rounded-2xl border border-emerald-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-stone-800 block truncate">
                        Spezielle Packung nicht gefunden?
                      </span>
                      <span className="text-[10px] text-stone-500 block truncate">
                        Gemini KI liest Nährwerte jeder deutschen Marke
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAiLookup}
                    disabled={isAiLoading}
                    className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold transition-all flex items-center gap-1 shrink-0 shadow-sm disabled:opacity-50"
                  >
                    {isAiLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Recherchiere...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Mit KI finden</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* AI Error Alert */}
              {aiError && (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>{aiError}</span>
                  </div>
                  {!geminiApiKey && onOpenSettings && (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenSettings();
                      }}
                      className="font-bold underline text-amber-900 ml-2 shrink-0"
                    >
                      Key eingeben
                    </button>
                  )}
                </div>
              )}

              {/* Loading State */}
              {isLoading && (
                <div className="py-8 text-center text-stone-400 flex flex-col items-center gap-2">
                  <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
                  <span className="text-xs">Durchsuche Katalog...</span>
                </div>
              )}

              {/* Custom recipes matching search query */}
              {matchingRecipes.length > 0 && (
                <div className="space-y-2 mb-3 pb-3 border-b border-amber-100">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                      <span>🍞</span>
                      <span>Meine selbstgebackenen Brote & Rezepte</span>
                    </span>
                    <span className="text-[10px] text-amber-800 font-bold bg-amber-100 px-2 py-0.5 rounded-full">
                      {matchingRecipes.length} Treffer
                    </span>
                  </div>

                  {matchingRecipes.map((r) => {
                    const isBread = r.category === 'bread' || r.name.toLowerCase().includes('brot');
                    const sliceWeight = r.servingWeightGrams || (isBread ? 50 : 100);
                    const sliceKcal = Math.round(r.calories100g * (sliceWeight / 100));
                    const servLabel = r.servingName || (isBread ? '1 Scheibe' : '1 Portion');

                    return (
                      <div
                        key={`match-recipe-${r.id}`}
                        onClick={() => onSelectProduct(recipeToFoodProduct(r))}
                        className="py-3 px-3 flex items-center justify-between gap-3 bg-gradient-to-r from-amber-50/80 to-orange-50/40 border border-amber-200/80 hover:border-amber-400 rounded-2xl cursor-pointer transition-all group shadow-xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-11 h-11 rounded-xl bg-amber-500 text-white flex items-center justify-center text-xl shrink-0 shadow-xs">
                            🍞
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h4 className="font-bold text-stone-900 text-xs truncate group-hover:text-amber-900">
                                {r.name}
                              </h4>
                              <span className="text-[9px] bg-amber-200 text-amber-950 font-bold px-1.5 py-0.2 rounded-md shrink-0">
                                Eigenes Brot
                              </span>
                            </div>
                            <span className="text-[11px] text-amber-800 font-bold block truncate">
                              {servLabel} ({sliceWeight}g) = {sliceKcal} kcal
                            </span>
                            <div className="text-[10px] text-stone-500 mt-0.5">
                              P: {r.protein100g}g • K: {r.carbs100g}g • F: {r.fat100g}g (pro 100g)
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-xs font-black text-amber-950">
                            {r.calories100g} <span className="text-[10px] font-normal text-stone-400">kcal</span>
                          </div>
                          <span className="text-[10px] text-stone-400 block">/ 100g</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Results List */}
              {!isLoading && results.length > 0 && (
                <div className="divide-y divide-stone-100">
                  {results.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => onSelectProduct(product)}
                      className="py-3 px-2 flex items-center justify-between gap-3 hover:bg-emerald-50/50 rounded-2xl cursor-pointer transition-colors group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-11 h-11 object-contain rounded-xl bg-white p-0.5 border border-stone-200 shrink-0"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-xl bg-stone-100 flex items-center justify-center text-lg shrink-0 text-stone-500">
                            {product.source === 'supermarket' ? '🏪' : '🥗'}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-bold text-stone-800 text-xs truncate group-hover:text-emerald-800">
                              {product.name}
                            </h4>
                            {product.source === 'supermarket' && (
                              <span className="text-[9px] bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.2 rounded-md shrink-0">
                                Supermarkt
                              </span>
                            )}
                          </div>
                          {product.brand && (
                            <span className="text-[11px] text-stone-400 block truncate">
                              {product.brand}
                            </span>
                          )}
                          <div className="text-[10px] text-stone-400 mt-0.5">
                            P: {product.protein100g}g • K: {product.carbs100g}g • F: {product.fat100g}g
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-xs font-black text-stone-800 group-hover:text-emerald-700">
                          {product.calories100g} <span className="text-[10px] font-normal text-stone-400">kcal</span>
                        </div>
                        <span className="text-[10px] text-stone-400">/ 100g</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Not Found */}
              {!isLoading && query.length >= 2 && results.length === 0 && matchingRecipes.length === 0 && (
                <div className="py-10 text-center space-y-3">
                  <span className="text-2xl">🤷‍♂️</span>
                  <div className="text-xs text-stone-500">
                    Keine Produkte für „<span className="font-bold">{query}</span>“ im Katalog gefunden.
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenRecipeCreator?.();
                      }}
                      className="py-2 px-3.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <span>🍞</span>
                      <span>Als eigenes Brot / Rezept anlegen</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleAiLookup}
                      className="py-2 px-4 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Mit Gemini KI finden</span>
                    </button>
                    <button
                      onClick={() => {
                        onClose();
                        onOpenQuickAdd();
                      }}
                      className="py-2 px-3 rounded-xl bg-stone-100 text-stone-700 text-xs font-bold hover:bg-stone-200 transition-colors"
                    >
                      Schnelleintrag ⚡
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* TAB 2: MEINE REZEPTE & BROTE */}
          {activeTab === 'recipes' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                    Meine Kreationen ({customRecipes.length})
                  </h4>
                  <p className="text-[11px] text-stone-400">
                    Selbstgebackene Brote & Mahlzeiten mit Backverlust
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenRecipeCreator?.();
                  }}
                  className="py-1.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white text-xs font-bold transition-all flex items-center gap-1 shadow-sm shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Neues Brot / Rezept</span>
                </button>
              </div>

              {customRecipes.length > 0 ? (
                <div className="space-y-3">
                  {customRecipes.map((r) => {
                    const isBread = r.category === 'bread' || r.name.toLowerCase().includes('brot');
                    const sliceWeight = r.servingWeightGrams || (isBread ? 50 : 100);
                    const sliceKcal = Math.round(r.calories100g * (sliceWeight / 100));
                    const servLabel = r.servingName || (isBread ? '1 Scheibe' : '1 Portion');

                    return (
                      <div
                        key={r.id}
                        onClick={() => onSelectProduct(recipeToFoodProduct(r))}
                        className="p-4 bg-white border border-stone-200/80 hover:border-amber-400 rounded-3xl cursor-pointer transition-all hover:shadow-card group space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-700 border border-amber-200/50 flex items-center justify-center text-2xl shrink-0 group-hover:scale-105 transition-transform">
                              🍞
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <h4 className="font-extrabold text-stone-900 text-sm truncate group-hover:text-amber-900">
                                  {r.name}
                                </h4>
                                <span className="text-[9px] bg-amber-100 text-amber-900 font-bold px-1.5 py-0.2 rounded-md shrink-0">
                                  {r.category === 'bread' ? 'Brot' : 'Gericht'}
                                </span>
                              </div>
                              <span className="text-[11px] text-stone-400 block truncate">
                                Laib gewogen: {r.cookedWeight || r.totalRawWeight}g (Roh: {r.totalRawWeight}g)
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSharingRecipe(r);
                              }}
                              className="px-2 py-1 rounded-xl text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors flex items-center gap-1 text-[11px] font-bold"
                              title="Rezept per QR-Code oder WhatsApp teilen"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Teilen</span>
                            </button>

                            <button
                              type="button"
                              onClick={(e) => handleDeleteRecipe(e, r.id)}
                              className="p-1.5 rounded-xl text-stone-300 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                              title="Rezept löschen"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Ingredients preview */}
                        {r.ingredients && r.ingredients.length > 0 && (
                          <div className="text-[11px] text-stone-500 bg-stone-50 p-2 rounded-xl border border-stone-100/80 line-clamp-2">
                            <span className="font-semibold text-stone-700">Zutaten: </span>
                            {r.ingredients.map((ing) => `${ing.name} (${ing.amountGrams}g)`).join(', ')}
                          </div>
                        )}

                        {/* Nutrition Summary */}
                        <div className="pt-1 flex items-center justify-between border-t border-stone-100 text-xs">
                          <div>
                            <span className="text-amber-800 font-bold block">
                              {servLabel} ({sliceWeight}g):
                            </span>
                            <span className="text-stone-900 font-black text-sm">
                              {sliceKcal} kcal
                            </span>
                          </div>

                          <div className="text-right">
                            <span className="text-stone-400 text-[10px] block">pro 100g Brot:</span>
                            <span className="font-bold text-stone-700">
                              {r.calories100g} kcal <span className="font-normal text-[10px] text-stone-400">• P:{r.protein100g} K:{r.carbs100g} F:{r.fat100g}</span>
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => onSelectProduct(recipeToFoodProduct(r))}
                            className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-soft transition-all"
                          >
                            Loggen
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center text-stone-400 space-y-3">
                  <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mx-auto text-2xl border border-amber-100">
                    🍞
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-stone-700">Noch keine eigenen Rezepte</h4>
                    <p className="text-xs text-stone-400 max-w-xs mx-auto mt-1">
                      Backst du eigenes Brot oder kochst Lieblingsgerichte? Gib Mehle, Sauerteig und Zutaten ein – die App berechnet den Backverlust und exakte Kalorien pro Scheibe.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenRecipeCreator?.();
                    }}
                    className="py-2.5 px-5 rounded-2xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-xs shadow-soft transition-all inline-flex items-center gap-2"
                  >
                    <span>🍞</span>
                    <span>Erstes Brot berechnen</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: FAVORITES & FREQUENTLY EATEN */}
          {activeTab === 'favorites' && (
            <div>
              {favoriteItems.length > 0 ? (
                <div className="divide-y divide-stone-100">
                  {favoriteItems.map((fav) => (
                    <div
                      key={fav.id}
                      onClick={() => handleSelectFavorite(fav)}
                      className="py-3 px-2 flex items-center justify-between gap-3 hover:bg-emerald-50/50 rounded-2xl cursor-pointer transition-colors group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-lg shrink-0 border border-amber-100">
                          ⭐
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-stone-800 text-xs truncate group-hover:text-emerald-800">
                            {fav.name}
                          </h4>
                          <span className="text-[10px] text-stone-400 block">
                            {fav.useCount}x geloggt • P: {fav.protein}g • K: {fav.carbs}g • F: {fav.fat}g
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-black text-stone-800">
                          {fav.calories} kcal
                        </span>
                        <span className="text-[10px] text-stone-400 block">/ 100g</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-stone-400 space-y-2">
                  <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mx-auto text-xl">
                    ⭐
                  </div>
                  <h4 className="text-xs font-bold text-stone-700">Noch keine Favoriten</h4>
                  <p className="text-xs text-stone-400 max-w-xs mx-auto">
                    Lebensmittel, die du suchst oder scannst, werden hier automatisch für den 1-Klick-Zugriff gespeichert.
                  </p>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer: Quick Add Fallback Button */}
        <div className="p-3 bg-stone-50 border-t border-stone-100 flex items-center justify-between px-6">
          <span className="text-xs text-stone-400">Nicht in der Liste?</span>
          <button
            onClick={() => {
              onClose();
              onOpenQuickAdd();
            }}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
          >
            <span>Schnelleintrag öffnen</span>
            <span>⚡</span>
          </button>
        </div>

      </div>

      {/* Recipe Sharing Modal */}
      <RecipeShareModal
        isOpen={!!sharingRecipe}
        onClose={() => setSharingRecipe(null)}
        recipe={sharingRecipe}
      />
    </div>
  );
};
