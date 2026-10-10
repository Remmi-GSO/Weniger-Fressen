import React from 'react';
import { Camera, BookOpen, Utensils, X, Sparkles } from 'lucide-react';

interface SharedImageActionModalProps {
  isOpen: boolean;
  imageSrc: string | null;
  onClose: () => void;
  onUseAsAvatar: () => void;
  onCreateRecipeWithImage: () => void;
  onLogMealWithImage: () => void;
}

export const SharedImageActionModal: React.FC<SharedImageActionModalProps> = ({
  isOpen,
  imageSrc,
  onClose,
  onUseAsAvatar,
  onCreateRecipeWithImage,
  onLogMealWithImage,
}) => {
  if (!isOpen || !imageSrc) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-soft-xl border border-emerald-100">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-xl shrink-0 shadow-2xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-stone-900 text-base leading-tight">
                Bild geteilt!
              </h3>
              <p className="text-xs text-stone-500">
                Über Galerie / System-Teilen empfangen
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-500 cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Thumbnail Preview */}
        <div className="relative h-44 w-full rounded-2xl overflow-hidden bg-stone-100 border border-stone-200/80 shadow-inner">
          <img
            src={imageSrc}
            alt="Geteiltes Bild"
            className="w-full h-full object-cover"
          />
        </div>

        <p className="text-xs text-stone-600 text-center font-medium leading-snug">
          Was möchtest du mit diesem Bild tun?
        </p>

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={onUseAsAvatar}
            className="w-full py-3 px-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-soft transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <Camera className="w-4 h-4" />
            <span>Als Profilbild zuschneiden & zoomen</span>
          </button>

          <button
            type="button"
            onClick={onCreateRecipeWithImage}
            className="w-full py-2.5 px-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <BookOpen className="w-4 h-4" />
            <span>Neues Rezept mit diesem Bild erstellen</span>
          </button>

          <button
            type="button"
            onClick={onLogMealWithImage}
            className="w-full py-2.5 px-3.5 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Utensils className="w-4 h-4 text-stone-600" />
            <span>Mahlzeit / Tagebuch erfassen</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2 text-stone-400 hover:text-stone-600 text-xs font-semibold cursor-pointer text-center"
        >
          Schließen
        </button>
      </div>
    </div>
  );
};
