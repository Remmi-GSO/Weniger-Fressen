import { type CustomRecipe, db } from '../db/db';
import { X, Check, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface RecipeReceiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  receivedRecipe: Omit<CustomRecipe, 'id'> | null;
  onSaved?: () => void;
}

export const RecipeReceiveModal = ({
  isOpen,
  onClose,
  receivedRecipe,
  onSaved,
}: RecipeReceiveModalProps) => {
  if (!isOpen || !receivedRecipe) return null;

  const isBread = receivedRecipe.category === 'bread' || receivedRecipe.name.toLowerCase().includes('brot');
  const isDrink = receivedRecipe.category === 'drink';
  const sliceWeight = receivedRecipe.servingWeightGrams || (isDrink ? 250 : isBread ? 50 : 250);
  const sliceKcal = Math.round(receivedRecipe.calories100g * (sliceWeight / 100));

  const handleSaveToMyRecipes = async () => {
    try {
      await db.recipes.add({
        ...receivedRecipe,
        createdAt: Date.now(),
      });

      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#F59E0B', '#10B981', '#3B82F6'],
      });

      onSaved?.();
      onClose();
    } catch (err) {
      console.error('Failed to save received recipe', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white rounded-t-3xl sm:rounded-3xl shadow-soft-lg border border-stone-100 overflow-hidden max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="p-4 px-5 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl text-lg">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-bold text-stone-900 text-sm">Rezept empfangen!</h3>
              <p className="text-[11px] text-stone-400">Von Partner oder Freund geteilt</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-left">
          
          <div className="text-center py-2">
            <div className={`w-16 h-16 rounded-3xl border flex items-center justify-center text-3xl mx-auto shadow-sm ${
              isDrink
                ? 'bg-blue-500/10 border-blue-200/60 text-blue-700'
                : isBread
                ? 'bg-amber-500/10 border-amber-200/60 text-amber-700'
                : 'bg-emerald-500/10 border-emerald-200/60 text-emerald-700'
            }`}>
              {isDrink ? '🥤' : isBread ? '🍞' : '🍲'}
            </div>
            <h4 className="font-black text-stone-900 text-base mt-2">{receivedRecipe.name}</h4>
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full inline-block mt-1 ${
              isDrink
                ? 'text-blue-800 bg-blue-100'
                : isBread
                ? 'text-amber-800 bg-amber-100'
                : 'text-emerald-800 bg-emerald-100'
            }`}>
              {isDrink ? 'Getränk / Smoothie' : isBread ? 'Brot & Backwaren' : 'Feste Mahlzeit'}
            </span>
          </div>

          {/* Nutrition breakdown card */}
          <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-700">
                {receivedRecipe.servingName || '1 Scheibe'} ({sliceWeight}g):
              </span>
              <span className="text-base font-black text-stone-900">
                {sliceKcal} kcal
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-stone-200/60 text-xs">
              <div className="bg-white p-1.5 rounded-xl border border-stone-100">
                <span className="text-[10px] text-stone-400 block font-medium">Protein</span>
                <span className="font-bold text-emerald-700">{receivedRecipe.protein100g}g</span>
              </div>
              <div className="bg-white p-1.5 rounded-xl border border-stone-100">
                <span className="text-[10px] text-stone-400 block font-medium">Kohlenh.</span>
                <span className="font-bold text-amber-700">{receivedRecipe.carbs100g}g</span>
              </div>
              <div className="bg-white p-1.5 rounded-xl border border-stone-100">
                <span className="text-[10px] text-stone-400 block font-medium">Fett</span>
                <span className="font-bold text-rose-700">{receivedRecipe.fat100g}g</span>
              </div>
            </div>

            <div className="text-[10px] text-stone-400 text-center pt-1">
              {receivedRecipe.calories100g} kcal pro 100g fertiges Produkt
            </div>
          </div>

          {/* Ingredients list if present */}
          {receivedRecipe.ingredients && receivedRecipe.ingredients.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
                Enthaltene Zutaten ({receivedRecipe.ingredients.length}):
              </span>
              <div className="max-h-32 overflow-y-auto space-y-1 bg-stone-50 p-2.5 rounded-xl border border-stone-100 text-xs">
                {receivedRecipe.ingredients.map((ing, idx) => (
                  <div key={idx} className="flex justify-between text-stone-600">
                    <span>{ing.name}</span>
                    <span className="font-semibold text-stone-500">{ing.amountGrams}g</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Instructions if present */}
          {receivedRecipe.instructions && receivedRecipe.instructions.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
                Zubereitung ({receivedRecipe.instructions.length} Schritte):
              </span>
              <div className="max-h-32 overflow-y-auto space-y-1 bg-stone-50 p-2.5 rounded-xl border border-stone-100 text-xs">
                {receivedRecipe.instructions.map((step, idx) => (
                  <div key={idx} className="text-stone-600 leading-snug">
                    <span className="font-bold text-emerald-700 mr-1.5">{idx + 1}.</span>
                    <span>{step.replace(/^\d+\.\s*/, '')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={handleSaveToMyRecipes}
              className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs shadow-soft transition-all flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>In meine Rezepte übernehmen</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 text-stone-400 hover:text-stone-600 font-semibold text-xs transition-colors"
            >
              Verwerfen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
