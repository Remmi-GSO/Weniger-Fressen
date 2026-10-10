import React, { useState, useEffect, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type CustomRecipe, type RecipeCategory } from '../db/db';
import { inferRecipeCategory } from './RecipeCreatorModal';
import { RecipeShareModal } from './RecipeShareModal';
import {
  Search,
  Plus,
  Star,
  Download,
  Check,
  Share2,
  ChevronDown,
  ChevronUp,
  Trash2,
  X,
  Eye,
  Globe,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface CommunityRecipe {
  id: string;
  name: string;
  author: string;
  authorRole?: string;
  category: RecipeCategory;
  imageUrl?: string;
  prepTimeMinutes?: number;
  totalRawWeight: number;
  cookedWeight: number;
  servingName: string;
  servingWeightGrams: number;
  calories100g: number;
  protein100g: number;
  carbs100g: number;
  fat100g: number;
  totalCalories: number;
  tags?: string[];
  description?: string;
  ingredients: Array<{
    name: string;
    amountGrams: number;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }>;
  instructions: string[];
}

interface RecipeDatabaseViewProps {
  onOpenRecipeCreator: () => void;
  onOpenPortionCalcForRecipe: (recipe: CustomRecipe) => void;
  selectedDate?: string;
}

export const RecipeDatabaseView: React.FC<RecipeDatabaseViewProps> = ({
  onOpenRecipeCreator,
  onOpenPortionCalcForRecipe,
}) => {
  // 1. Live Query of all custom & Paprika recipes in Dexie
  const recipes = useLiveQuery(() => db.recipes.reverse().toArray()) || [];

  // 2. States
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [expandedRecipeId, setExpandedRecipeId] = useState<number | null>(null);
  const [shareModalRecipe, setShareModalRecipe] = useState<CustomRecipe | null>(null);

  // Community recipes state
  const [communityRecipes, setCommunityRecipes] = useState<CommunityRecipe[]>([]);
  const [isLoadingCommunity, setIsLoadingCommunity] = useState(false);
  const [selectedCommunityRecipe, setSelectedCommunityRecipe] = useState<CommunityRecipe | null>(null);
  const [importedCommunityIds, setImportedCommunityIds] = useState<Set<string>>(new Set());

  // Load Community Recipes from public/data/community-recipes.json
  useEffect(() => {
    const fetchCommunity = async () => {
      setIsLoadingCommunity(true);
      try {
        const res = await fetch('./data/community-recipes.json');
        if (res.ok) {
          const data: CommunityRecipe[] = await res.json();
          setCommunityRecipes(data);
        }
      } catch (err) {
        console.warn('Could not load community recipes from network', err);
      } finally {
        setIsLoadingCommunity(false);
      }
    };
    fetchCommunity();
  }, []);

  // Check which community recipes are already in the local database
  useEffect(() => {
    if (recipes.length > 0 && communityRecipes.length > 0) {
      const existingNames = new Set(recipes.map((r) => r.name.toLowerCase().trim()));
      const imported = new Set<string>();
      communityRecipes.forEach((cr) => {
        if (existingNames.has(cr.name.toLowerCase().trim())) {
          imported.add(cr.id);
        }
      });
      setImportedCommunityIds(imported);
    }
  }, [recipes, communityRecipes]);

  // Toggle favorite
  const handleToggleFavorite = async (e: React.MouseEvent, recipeId?: number) => {
    e.stopPropagation();
    if (!recipeId) return;
    const target = await db.recipes.get(recipeId);
    if (target) {
      await db.recipes.update(recipeId, { isFavorite: !target.isFavorite });
    }
  };

  // Delete recipe
  const handleDeleteRecipe = async (e: React.MouseEvent, recipeId?: number, recipeName?: string) => {
    e.stopPropagation();
    if (!recipeId) return;
    if (confirm(`Möchtest du das Rezept „${recipeName || ''}“ wirklich aus deiner Rezeptdatenbank löschen?`)) {
      await db.recipes.delete(recipeId);
    }
  };

  // Import Community Recipe
  const handleImportCommunityRecipe = async (commRecipe: CommunityRecipe) => {
    try {
      const newRecipe: Omit<CustomRecipe, 'id'> = {
        name: commRecipe.name,
        category: commRecipe.category,
        ingredients: commRecipe.ingredients,
        instructions: commRecipe.instructions,
        imageUrl: commRecipe.imageUrl,
        prepTimeMinutes: commRecipe.prepTimeMinutes,
        isFavorite: false,
        tags: [...(commRecipe.tags || []), '#community', `von ${commRecipe.author}`],
        totalRawWeight: commRecipe.totalRawWeight,
        cookedWeight: commRecipe.cookedWeight,
        servingName: commRecipe.servingName,
        servingWeightGrams: commRecipe.servingWeightGrams,
        calories100g: commRecipe.calories100g,
        protein100g: commRecipe.protein100g,
        carbs100g: commRecipe.carbs100g,
        fat100g: commRecipe.fat100g,
        createdAt: Date.now(),
      };

      await db.recipes.add(newRecipe);
      setImportedCommunityIds((prev) => new Set(prev).add(commRecipe.id));

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#10B981', '#F59E0B', '#6366F1'],
      });

      setSelectedCommunityRecipe(null);
    } catch (err) {
      console.error('Import failed', err);
      alert('Import fehlgeschlagen');
    }
  };

  // Filter local recipes
  const filteredLocalRecipes = useMemo(() => {
    let result = recipes;
    const q = searchQuery.trim().toLowerCase();

    if (q) {
      result = result.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.tags?.some((t) => t.toLowerCase().includes(q)) ||
          r.ingredients?.some((i) => i.name.toLowerCase().includes(q))
      );
    }

    if (activeCategory === 'favorites') {
      result = result.filter((r) => r.isFavorite);
    } else if (activeCategory === 'bread') {
      result = result.filter((r) => inferRecipeCategory(r) === 'bread');
    } else if (activeCategory === 'meal') {
      result = result.filter((r) => inferRecipeCategory(r) === 'meal');
    } else if (activeCategory === 'salad') {
      result = result.filter((r) => inferRecipeCategory(r) === 'salad');
    } else if (activeCategory === 'drink') {
      result = result.filter((r) => inferRecipeCategory(r) === 'drink');
    } else if (activeCategory === 'snack') {
      result = result.filter((r) => inferRecipeCategory(r) === 'snack');
    }

    return result;
  }, [recipes, searchQuery, activeCategory]);

  // Filter community recipes
  const filteredCommunityRecipes = useMemo(() => {
    let result = communityRecipes;
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (cr) =>
          cr.name.toLowerCase().includes(q) ||
          cr.author.toLowerCase().includes(q) ||
          cr.tags?.some((t) => t.toLowerCase().includes(q)) ||
          cr.ingredients?.some((i) => i.name.toLowerCase().includes(q))
      );
    }
    return result;
  }, [communityRecipes, searchQuery]);

  return (
    <div className="space-y-4 pb-24">
      {/* Banner / Welcome Header */}
      <div className="p-4 bg-gradient-to-br from-amber-500 via-orange-500 to-rose-600 rounded-3xl text-white shadow-soft relative overflow-hidden">
        <div className="absolute -right-4 -bottom-4 w-28 h-28 rounded-full bg-white/10 blur-xl pointer-events-none" />
        <div className="relative z-10 flex items-start justify-between gap-3">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-[10px] font-black tracking-wider text-white border border-white/20 uppercase">
              🍰 MEHR FRESSEN • REZEPTBUCH
            </span>
            <h2 className="text-lg font-black tracking-tight leading-tight">
              Eure große Rezept-Datenbank & Backstube
            </h2>
            <p className="text-xs text-white/90">
              {recipes.length} Meisterwerke bereit • Ganzes Rezept oder Stückweise verbuchen
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenRecipeCreator}
            className="py-2.5 px-3 rounded-2xl bg-white text-stone-900 font-extrabold text-xs shadow-soft hover:bg-amber-50 active:scale-95 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-amber-600" />
            <span>Neues Rezept</span>
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          placeholder="Rezept oder Zutat suchen (z. B. Schwarzwälder, Waffeln, Paella)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-8 py-2.5 rounded-2xl border border-stone-200 bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 font-medium text-xs text-stone-800 transition-all shadow-2xs"
        />
        <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 font-bold text-xs cursor-pointer"
          >
            ✕
          </button>
        )}
      </div>

      {/* Categories Bar */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
        <button
          type="button"
          onClick={() => setActiveCategory('all')}
          className={`py-1.5 px-3 rounded-xl font-bold transition-all shrink-0 text-xs cursor-pointer ${
            activeCategory === 'all'
              ? 'bg-stone-900 text-white shadow-2xs'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          Alle ({recipes.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveCategory('favorites')}
          className={`py-1.5 px-3 rounded-xl font-bold transition-all shrink-0 text-xs flex items-center gap-1 cursor-pointer ${
            activeCategory === 'favorites'
              ? 'bg-amber-500 text-white shadow-2xs'
              : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
          }`}
        >
          <span>⭐</span>
          <span>Favoriten ({recipes.filter((r) => r.isFavorite).length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveCategory('bread')}
          className={`py-1.5 px-3 rounded-xl font-bold transition-all shrink-0 text-xs flex items-center gap-1 cursor-pointer ${
            activeCategory === 'bread'
              ? 'bg-amber-600 text-white shadow-2xs'
              : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
          }`}
        >
          <span>🍞</span>
          <span>Kuchen & Backen ({recipes.filter((r) => inferRecipeCategory(r) === 'bread').length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveCategory('meal')}
          className={`py-1.5 px-3 rounded-xl font-bold transition-all shrink-0 text-xs flex items-center gap-1 cursor-pointer ${
            activeCategory === 'meal'
              ? 'bg-emerald-600 text-white shadow-2xs'
              : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
          }`}
        >
          <span>🍲</span>
          <span>Hauptgerichte ({recipes.filter((r) => inferRecipeCategory(r) === 'meal').length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveCategory('salad')}
          className={`py-1.5 px-3 rounded-xl font-bold transition-all shrink-0 text-xs flex items-center gap-1 cursor-pointer ${
            activeCategory === 'salad'
              ? 'bg-lime-600 text-white shadow-2xs'
              : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
          }`}
        >
          <span>🥗</span>
          <span>Salate ({recipes.filter((r) => inferRecipeCategory(r) === 'salad').length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveCategory('drink')}
          className={`py-1.5 px-3 rounded-xl font-bold transition-all shrink-0 text-xs flex items-center gap-1 cursor-pointer ${
            activeCategory === 'drink'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
          }`}
        >
          <span>🥤</span>
          <span>Getränke ({recipes.filter((r) => inferRecipeCategory(r) === 'drink').length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveCategory('snack')}
          className={`py-1.5 px-3 rounded-xl font-bold transition-all shrink-0 text-xs flex items-center gap-1 cursor-pointer ${
            activeCategory === 'snack'
              ? 'bg-pink-600 text-white shadow-2xs'
              : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
          }`}
        >
          <span>🍪</span>
          <span>Snacks ({recipes.filter((r) => inferRecipeCategory(r) === 'snack').length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveCategory('community')}
          className={`py-1.5 px-3 rounded-xl font-black transition-all shrink-0 text-xs flex items-center gap-1 cursor-pointer ${
            activeCategory === 'community'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-soft ring-2 ring-purple-300'
              : 'bg-indigo-50 text-indigo-900 border border-indigo-200/80 hover:bg-indigo-100'
          }`}
        >
          <Globe className="w-3.5 h-3.5 text-indigo-600" />
          <span>Community ({communityRecipes.length})</span>
        </button>
      </div>

      {/* VIEW A: COMMUNITY REGISTER */}
      {activeCategory === 'community' && (
        <div className="space-y-3">
          <div className="p-3.5 bg-indigo-50/90 border border-indigo-200 rounded-2xl flex items-start gap-2.5">
            <Globe className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-0.5">
              <span className="font-extrabold text-indigo-950 block">
                Offene Community-Rezepte
              </span>
              <p className="text-stone-600 leading-snug">
                Rezepte von anderen Nutzern und Freunden. Schau dir die Kurz-Info an und importiere sie mit 1 Klick in dein eigenes Rezeptbuch!
              </p>
            </div>
          </div>

          {isLoadingCommunity ? (
            <div className="p-8 text-center text-stone-400 bg-stone-50 rounded-2xl text-xs flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <span>Lade Rezepte aus der Community...</span>
            </div>
          ) : filteredCommunityRecipes.length === 0 ? (
            <div className="p-8 text-center text-stone-400 bg-stone-50 rounded-2xl text-xs">
              Keine Community-Rezepte gefunden.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredCommunityRecipes.map((cr) => {
                const isImported = importedCommunityIds.has(cr.id);
                return (
                  <div
                    key={cr.id}
                    className="p-3.5 bg-white border border-stone-200 hover:border-indigo-300 rounded-2xl shadow-2xs space-y-2.5 flex flex-col justify-between transition-all"
                  >
                    <div className="space-y-2">
                      {cr.imageUrl ? (
                        <div className="relative h-32 w-full rounded-xl overflow-hidden bg-stone-100 border border-stone-100">
                          <img
                            src={cr.imageUrl}
                            alt={cr.name}
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-stone-900/70 backdrop-blur-xs text-[10px] font-bold text-white">
                            👤 {cr.author}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-900 text-[10px] font-bold">
                            👤 von {cr.author}
                          </span>
                          <span className="text-[10px] text-stone-400">Community</span>
                        </div>
                      )}

                      <div>
                        <h4 className="font-extrabold text-stone-900 text-sm leading-tight">
                          {cr.name}
                        </h4>
                        {cr.authorRole && (
                          <span className="text-[10px] text-indigo-700 font-semibold block">
                            {cr.authorRole}
                          </span>
                        )}
                        {cr.description && (
                          <p className="text-[11px] text-stone-500 line-clamp-2 mt-1 leading-snug">
                            {cr.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                        <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 font-bold">
                          {cr.calories100g} kcal / 100g
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 font-bold">
                          {cr.protein100g}g P
                        </span>
                        <span className="text-stone-400">
                          • {cr.servingName}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
                      <button
                        type="button"
                        onClick={() => setSelectedCommunityRecipe(cr)}
                        className="flex-1 py-2 px-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Kurz-Info</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleImportCommunityRecipe(cr)}
                        disabled={isImported}
                        className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                          isImported
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs active:scale-95'
                        }`}
                      >
                        {isImported ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Im Rezeptbuch</span>
                          </>
                        ) : (
                          <>
                            <Download className="w-3.5 h-3.5" />
                            <span>Importieren</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW B: LOCAL & PAPRIKA RECIPES */}
      {activeCategory !== 'community' && (
        <div className="space-y-3">
          {filteredLocalRecipes.length === 0 ? (
            <div className="p-8 text-center text-stone-400 bg-stone-50 rounded-2xl text-xs space-y-2">
              <p>Keine Rezepte für die aktuelle Auswahl gefunden.</p>
              <button
                type="button"
                onClick={onOpenRecipeCreator}
                className="inline-flex items-center gap-1 text-amber-700 font-bold hover:underline"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Neues Rezept anlegen</span>
              </button>
            </div>
          ) : (
            filteredLocalRecipes.map((r) => {
              const isExpanded = expandedRecipeId === r.id;
              const totalKcal = Math.round((r.calories100g * (r.cookedWeight || r.totalRawWeight)) / 100);
              const servingKcal = Math.round((r.calories100g * (r.servingWeightGrams || 100)) / 100);

              return (
                <div
                  key={r.id || r.name}
                  className="bg-white border border-stone-200 hover:border-amber-300 rounded-3xl shadow-2xs overflow-hidden transition-all"
                >
                  {/* Card Header & Preview */}
                  <div className="p-3.5 sm:p-4 flex gap-3 sm:gap-4 items-start">
                    {/* Photo thumbnail */}
                    {r.imageUrl ? (
                      <img
                        src={r.imageUrl}
                        alt={r.name}
                        className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-2xl bg-stone-100 border border-stone-200/80 shrink-0"
                      />
                    ) : (
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-3xl shrink-0">
                        {r.category === 'bread' ? '🍞' : r.category === 'drink' ? '🥤' : '🥘'}
                      </div>
                    )}

                    {/* Details */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="font-extrabold text-stone-900 text-sm sm:text-base leading-tight truncate">
                          {r.name}
                        </h4>
                        <button
                          type="button"
                          onClick={(e) => handleToggleFavorite(e, r.id)}
                          className="text-stone-300 hover:text-amber-400 p-0.5 transition-colors cursor-pointer shrink-0"
                          title="Als Favorit markieren"
                        >
                          <Star
                            className={`w-4 h-4 ${r.isFavorite ? 'fill-amber-400 text-amber-400' : ''}`}
                          />
                        </button>
                      </div>

                      {/* Serving & Total Calories highlight */}
                      <div className="text-xs space-y-0.5">
                        <div className="font-extrabold text-emerald-800 flex items-center gap-1.5 flex-wrap">
                          <span>{r.servingName}:</span>
                          <span className="px-1.5 py-0.2 rounded-md bg-emerald-100 font-black">
                            ~{servingKcal} kcal
                          </span>
                        </div>
                        <div className="text-[11px] text-stone-500">
                          Gesamtrezept: <strong>{r.cookedWeight || r.totalRawWeight}g</strong> • <strong>{totalKcal} kcal</strong> ({r.calories100g} kcal / 100g)
                        </div>
                      </div>

                      {/* Macros badges */}
                      <div className="flex items-center gap-1.5 text-[10px] font-bold pt-0.5 flex-wrap">
                        <span className="px-1.5 py-0.5 rounded-md bg-purple-50 text-purple-900 border border-purple-200/60">
                          {r.protein100g || 0}g P
                        </span>
                        <span className="px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200/60">
                          {r.carbs100g || 0}g KH
                        </span>
                        <span className="px-1.5 py-0.5 rounded-md bg-rose-50 text-rose-900 border border-rose-200/60">
                          {r.fat100g || 0}g F
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="px-3.5 py-2.5 bg-stone-50/80 border-t border-stone-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenPortionCalcForRecipe(r)}
                      className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-2xs active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>🍽️</span>
                      <span>Essen & Eintragen</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setShareModalRecipe(r)}
                        className="p-1.5 rounded-xl bg-white border border-stone-200 hover:bg-stone-100 text-stone-600 transition-colors cursor-pointer"
                        title="Per QR-Code / Link teilen"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleDeleteRecipe(e, r.id, r.name)}
                        className="p-1.5 rounded-xl bg-white border border-stone-200 hover:bg-rose-50 hover:text-rose-600 text-stone-400 transition-colors cursor-pointer"
                        title="Rezept löschen"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setExpandedRecipeId(isExpanded ? null : (r.id || null))}
                        className="py-1.5 px-2.5 rounded-xl bg-white border border-stone-200 hover:bg-stone-100 text-stone-700 font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <span>{isExpanded ? 'Weniger' : 'Zutaten & Zubereitung'}</span>
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>

                  {/* Collapsible Details: Ingredients & Instructions */}
                  {isExpanded && (
                    <div className="p-4 bg-stone-50 border-t border-stone-200 space-y-3.5 text-xs">
                      {/* Ingredients list */}
                      <div>
                        <span className="font-extrabold text-stone-800 uppercase tracking-wider text-[11px] block mb-1.5">
                          🛒 Zutaten ({r.ingredients.length})
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {r.ingredients.map((ing, idx) => (
                            <div
                              key={idx}
                              className="p-2 rounded-xl bg-white border border-stone-200/80 flex items-center justify-between gap-2"
                            >
                              <span className="font-medium text-stone-800 truncate">{ing.name}</span>
                              <span className="text-[11px] font-bold text-stone-500 shrink-0">
                                {ing.calories} kcal
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Instructions */}
                      {r.instructions && r.instructions.length > 0 && (
                        <div>
                          <span className="font-extrabold text-stone-800 uppercase tracking-wider text-[11px] block mb-1.5">
                            👩‍🍳 Zubereitung
                          </span>
                          <ol className="space-y-1.5 list-decimal list-inside text-stone-700 leading-relaxed bg-white p-3 rounded-2xl border border-stone-200/80">
                            {r.instructions.map((step, idx) => (
                              <li key={idx} className="pl-1">
                                <span>{step}</span>
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* MODAL: Community Recipe Kurz-Info Preview */}
      {selectedCommunityRecipe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-soft-xl border border-stone-100 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20">
                  🌐 Community-Rezept
                </span>
                <h3 className="text-base font-black pt-1 leading-tight">
                  {selectedCommunityRecipe.name}
                </h3>
                <p className="text-xs text-white/90">
                  Erstellt von <strong>{selectedCommunityRecipe.author}</strong> ({selectedCommunityRecipe.authorRole || 'Community'})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCommunityRecipe(null)}
                className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto space-y-3.5 flex-1 text-xs text-stone-700">
              {selectedCommunityRecipe.imageUrl && (
                <img
                  src={selectedCommunityRecipe.imageUrl}
                  alt={selectedCommunityRecipe.name}
                  className="w-full h-44 object-cover rounded-2xl border border-stone-100 shadow-2xs"
                />
              )}

              {/* Nutrition summary */}
              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 space-y-1">
                <div className="flex items-center justify-between font-bold">
                  <span>Portion ({selectedCommunityRecipe.servingName}):</span>
                  <span className="text-emerald-700">
                    ~{Math.round((selectedCommunityRecipe.calories100g * selectedCommunityRecipe.servingWeightGrams) / 100)} kcal
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-stone-500">
                  <span>Gesamtrezept ({selectedCommunityRecipe.cookedWeight}g):</span>
                  <span>{selectedCommunityRecipe.totalCalories} kcal</span>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-stone-200/60 text-center text-[10px] font-extrabold">
                  <span className="text-purple-900 bg-purple-50 py-0.5 rounded-lg">
                    {selectedCommunityRecipe.protein100g}g Protein
                  </span>
                  <span className="text-amber-900 bg-amber-50 py-0.5 rounded-lg">
                    {selectedCommunityRecipe.carbs100g}g KH
                  </span>
                  <span className="text-rose-900 bg-rose-50 py-0.5 rounded-lg">
                    {selectedCommunityRecipe.fat100g}g Fett
                  </span>
                </div>
              </div>

              {/* Ingredients */}
              <div>
                <span className="font-extrabold text-stone-900 uppercase tracking-wider text-[11px] block mb-1">
                  Zutaten
                </span>
                <div className="space-y-1">
                  {selectedCommunityRecipe.ingredients.map((ing, i) => (
                    <div
                      key={i}
                      className="p-1.5 rounded-xl bg-stone-50 border border-stone-200/60 flex items-center justify-between"
                    >
                      <span>{ing.name}</span>
                      <span className="text-stone-400 font-semibold">{ing.calories} kcal</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Instructions */}
              <div>
                <span className="font-extrabold text-stone-900 uppercase tracking-wider text-[11px] block mb-1">
                  Zubereitung
                </span>
                <ol className="space-y-1.5 list-decimal list-inside bg-stone-50 p-2.5 rounded-2xl border border-stone-200/60 leading-relaxed">
                  {selectedCommunityRecipe.instructions.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-stone-100 bg-stone-50/60 flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedCommunityRecipe(null)}
                className="py-2.5 px-4 rounded-xl bg-white border border-stone-200 text-stone-700 font-bold text-xs hover:bg-stone-100"
              >
                Schließen
              </button>
              <button
                type="button"
                onClick={() => handleImportCommunityRecipe(selectedCommunityRecipe)}
                disabled={importedCommunityIds.has(selectedCommunityRecipe.id)}
                className={`flex-1 py-2.5 px-4 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-soft transition-all cursor-pointer ${
                  importedCommunityIds.has(selectedCommunityRecipe.id)
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                {importedCommunityIds.has(selectedCommunityRecipe.id) ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Bereits in deinen Rezepten</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>In mein Rezeptbuch importieren</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {shareModalRecipe && (
        <RecipeShareModal
          recipe={shareModalRecipe}
          isOpen={true}
          onClose={() => setShareModalRecipe(null)}
        />
      )}
    </div>
  );
};
