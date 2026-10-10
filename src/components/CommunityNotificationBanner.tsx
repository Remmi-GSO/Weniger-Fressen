import React from 'react';
import type { CommunityRecipe } from '../utils/communityNotifier';
import { getAuthorAvatar } from '../utils/avatar';
import { Sparkles, X, Download } from 'lucide-react';

interface CommunityNotificationBannerProps {
  unseenRecipes: CommunityRecipe[];
  onViewRecipe: (recipe: CommunityRecipe) => void;
  onDismissRecipe: (recipeId: string) => void;
  onDismissAll: () => void;
}

export const CommunityNotificationBanner: React.FC<CommunityNotificationBannerProps> = ({
  unseenRecipes,
  onViewRecipe,
  onDismissRecipe,
  onDismissAll,
}) => {
  if (unseenRecipes.length === 0) return null;

  const currentRecipe = unseenRecipes[0];
  const avatarSrc = getAuthorAvatar(currentRecipe.author, currentRecipe.authorAvatarUrl);
  const remainingCount = unseenRecipes.length - 1;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 p-3 sm:p-3.5 text-white shadow-soft-lg border border-amber-300/40 animate-in fade-in slide-in-from-top-3 duration-300">
      {/* Decorative background glow */}
      <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-white/10 blur-xl pointer-events-none" />
      <div className="absolute top-1 left-12 w-16 h-16 rounded-full bg-amber-300/20 blur-lg pointer-events-none" />

      <div className="relative z-10 flex items-center justify-between gap-3">
        {/* Author Avatar & Recipe Info */}
        <div
          onClick={() => onViewRecipe(currentRecipe)}
          className="flex items-center gap-3 min-w-0 cursor-pointer flex-1 group"
          role="button"
          tabIndex={0}
        >
          {/* Author avatar with badge */}
          <div className="relative shrink-0">
            <img
              src={avatarSrc}
              alt={currentRecipe.author}
              className="w-11 h-11 rounded-full object-cover border-2 border-white/90 shadow-md group-hover:scale-105 transition-transform"
            />
            <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white text-orange-600 flex items-center justify-center text-[10px] shadow-xs">
              🔔
            </span>
          </div>

          {/* Texts */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-[10px] font-black tracking-wide text-white uppercase border border-white/20 shadow-2xs">
                <Sparkles className="w-2.5 h-2.5 text-amber-200" />
                Neues Community-Rezept
              </span>
              {remainingCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-rose-900/40 text-[9px] font-extrabold text-amber-100">
                  +{remainingCount} weitere
                </span>
              )}
            </div>

            <h4 className="text-xs sm:text-sm font-black truncate text-white tracking-tight leading-tight mt-0.5 group-hover:underline">
              „{currentRecipe.name}“
            </h4>

            <p className="text-[11px] text-white/95 font-medium truncate leading-tight">
              von <strong>{currentRecipe.author}</strong> ({currentRecipe.calories100g} kcal/100g)
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => onViewRecipe(currentRecipe)}
            className="py-1.5 px-3 bg-white hover:bg-amber-50 active:scale-95 text-orange-600 font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1 cursor-pointer shrink-0"
            title="Rezept ansehen und importieren"
          >
            <Download className="w-3.5 h-3.5 text-orange-600" />
            <span className="hidden xs:inline">Importieren</span>
            <span className="xs:hidden">Ansehen</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (unseenRecipes.length > 1) {
                onDismissRecipe(currentRecipe.id);
              } else {
                onDismissAll();
              }
            }}
            className="w-7 h-7 rounded-xl bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
            title="Benachrichtigung schließen"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
