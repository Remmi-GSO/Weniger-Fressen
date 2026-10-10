import React, { useState } from 'react';
import type { CustomRecipe, UserProfile } from '../db/db';
import type { CommunityRecipe } from '../utils/communityNotifier';
import { getAuthorAvatar } from '../utils/avatar';
import { X, Copy, Check, Download, Globe, Sparkles, ChefHat } from 'lucide-react';
import confetti from 'canvas-confetti';

interface CommunityRecipeSubmitModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile?: UserProfile | null;
  recipes: CustomRecipe[];
  initialRecipe?: CustomRecipe | null;
  onAddLocalCommunityRecipe?: (commRecipe: CommunityRecipe) => void;
}

export const CommunityRecipeSubmitModal: React.FC<CommunityRecipeSubmitModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  recipes,
  initialRecipe,
  onAddLocalCommunityRecipe,
}) => {
  const [selectedRecipeId, setSelectedRecipeId] = useState<number | undefined>(
    initialRecipe?.id || recipes[0]?.id
  );
  const [authorName, setAuthorName] = useState(
    userProfile?.name && userProfile.name !== 'Du' ? userProfile.name : 'Community Mitglied'
  );
  const [authorRole, setAuthorRole] = useState('Hobby-Koch 👨‍🍳');
  const [copied, setCopied] = useState(false);
  const [addedLocal, setAddedLocal] = useState(false);

  if (!isOpen) return null;

  const currentRecipe =
    recipes.find((r) => r.id === selectedRecipeId) || initialRecipe || recipes[0];

  if (!currentRecipe) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in">
        <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center space-y-4">
          <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto text-xl">
            📖
          </div>
          <h3 className="font-bold text-stone-900">Keine eigenen Rezepte vorhanden</h3>
          <p className="text-xs text-stone-500">
            Erstelle zuerst ein Rezept in deinem Rezeptbuch, um es in der Community bereitstellen zu können.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold"
          >
            Schließen
          </button>
        </div>
      </div>
    );
  }

  // Author avatar (from profile or generated)
  const authorAvatarUrl = getAuthorAvatar(authorName, userProfile?.avatarUrl);

  // Generate community recipe payload
  const slug = currentRecipe.name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .slice(0, 25);
  const commId = `comm_${slug}_${Math.floor(Date.now() / 1000)}`;

  const communityObj: CommunityRecipe = {
    id: commId,
    name: currentRecipe.name,
    author: authorName.trim() || 'Community-Mitglied',
    authorRole: authorRole.trim() || 'Community',
    authorAvatarUrl: authorAvatarUrl,
    category: currentRecipe.category,
    imageUrl: currentRecipe.imageUrl,
    prepTimeMinutes: currentRecipe.prepTimeMinutes || 20,
    totalRawWeight: currentRecipe.totalRawWeight,
    cookedWeight: currentRecipe.cookedWeight,
    servingName: currentRecipe.servingName || '1 Portion',
    servingWeightGrams: currentRecipe.servingWeightGrams || 100,
    calories100g: currentRecipe.calories100g,
    protein100g: currentRecipe.protein100g,
    carbs100g: currentRecipe.carbs100g,
    fat100g: currentRecipe.fat100g,
    totalCalories: Math.round((currentRecipe.calories100g * currentRecipe.cookedWeight) / 100),
    tags: currentRecipe.tags || ['#community'],
    description: `Leckeres Community-Rezept von ${authorName.trim() || 'Community'}.`,
    ingredients: currentRecipe.ingredients.map((ing) => ({
      name: ing.name,
      amountGrams: ing.amountGrams,
      calories: ing.calories,
      protein: ing.protein,
      carbs: ing.carbs,
      fat: ing.fat,
    })),
    instructions: currentRecipe.instructions || [
      'Alle Zutaten vorbereiten.',
      'Nach Belieben zubereiten und genießen!',
    ],
  };

  const jsonSnippet = JSON.stringify(communityObj, null, 2);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonSnippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.warn('Copy failed', err);
    }
  };

  const handleDownload = () => {
    try {
      const blob = new Blob([jsonSnippet], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `community-rezept-${slug}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.warn('Download failed', err);
    }
  };

  const handleAddToLocalPreview = () => {
    onAddLocalCommunityRecipe?.(communityObj);
    setAddedLocal(true);
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#10B981', '#6366F1', '#F59E0B'],
    });
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-soft-xl border border-stone-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 px-5 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-lg">
              🌐
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white">Rezept für Community einpflegen</h3>
              <p className="text-[11px] text-indigo-100">Mit deinem Profilbild & automatischer Benachrichtigung</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-stone-700 flex-1">
          {/* Select Recipe */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-700 block">
              1. Welches Rezept möchtest du bereitstellen?
            </label>
            <select
              value={currentRecipe.id}
              onChange={(e) => setSelectedRecipeId(Number(e.target.value))}
              className="w-full py-2.5 px-3 rounded-xl border border-stone-200 text-xs font-semibold text-stone-800 bg-stone-50 focus:bg-white focus:border-indigo-500"
            >
              {recipes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.calories100g} kcal/100g)
                </option>
              ))}
            </select>
          </div>

          {/* Author Details with Profile Picture */}
          <div className="p-3.5 bg-indigo-50/70 rounded-2xl border border-indigo-100 space-y-3">
            <span className="text-[11px] font-bold text-indigo-900 uppercase tracking-wide flex items-center gap-1.5">
              <ChefHat className="w-3.5 h-3.5 text-indigo-600" />
              2. Dein Profil als Rezept-Ersteller
            </span>

            <div className="flex items-center gap-3">
              <img
                src={authorAvatarUrl}
                alt={authorName}
                className="w-12 h-12 rounded-full object-cover border-2 border-indigo-400 shadow-xs shrink-0"
              />
              <div className="flex-1 space-y-2">
                <div>
                  <label className="text-[10px] font-bold text-stone-500 block">Dein Name</label>
                  <input
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="Dein Name"
                    className="w-full py-1.5 px-2.5 text-xs font-bold rounded-lg border border-indigo-200 bg-white text-stone-800"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-stone-500 block">Deine Rolle / Titel</label>
                  <input
                    type="text"
                    value={authorRole}
                    onChange={(e) => setAuthorRole(e.target.value)}
                    placeholder="z. B. Community Bäcker 👨‍🍳"
                    className="w-full py-1.5 px-2.5 text-xs font-semibold rounded-lg border border-indigo-200 bg-white text-stone-800"
                  />
                </div>
              </div>
            </div>
            <p className="text-[10px] text-indigo-700/90 leading-tight">
              📸 Dein Profilbild wird direkt mit dem Rezept verknüpft, sodass Mitglieder dich auch bei gleichem Vornamen sofort erkennen!
            </p>
          </div>

          {/* Explanatory Box: How members get notified */}
          <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200/90 space-y-1.5 text-xs">
            <span className="font-extrabold text-amber-950 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              Wie erhalten die anderen Mitglieder die Info?
            </span>
            <p className="text-stone-600 text-[11px] leading-relaxed">
              Sobald dieses Rezept in <strong>community-recipes.json</strong> eingepflegt und über <strong>update-github.bat</strong> hochgeladen wird, erkennt die App der anderen Mitglieder das neue Rezept vollautomatisch beim nächsten Öffnen:
            </p>
            <ul className="text-[11px] text-stone-600 space-y-1 list-disc list-inside">
              <li>Auffälliges Benachrichtigungs-Banner mit deinem <strong>Profilbild</strong></li>
              <li>Pulsierender <strong>„✨ NEU“</strong>-Badge auf dem Rezeptbuch</li>
              <li>Direkter <strong>1-Klick-Import</strong> in ihr Rezeptbuch</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={handleCopy}
              className={`w-full py-3 px-4 rounded-2xl font-extrabold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Rezept-JSON in Zwischenablage kopiert!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Rezept-JSON kopieren (für community-recipes.json)</span>
                </>
              )}
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleDownload}
                className="py-2.5 px-3 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>JSON-Datei laden</span>
              </button>

              <button
                type="button"
                onClick={handleAddToLocalPreview}
                disabled={addedLocal}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  addedLocal
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-stone-100 hover:bg-stone-200 text-stone-800'
                }`}
              >
                {addedLocal ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>In Vorschau aktiv!</span>
                  </>
                ) : (
                  <>
                    <Globe className="w-3.5 h-3.5 text-indigo-600" />
                    <span>In Vorschau testen</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
