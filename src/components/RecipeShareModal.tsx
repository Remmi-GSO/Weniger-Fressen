import { useEffect, useRef, useState } from 'react';
import { BrowserQRCodeSvgWriter } from '@zxing/browser';
import { type CustomRecipe } from '../db/db';
import { generateShareUrl } from '../utils/recipeShare';
import { X, Copy, Check, Share2, MessageCircle } from 'lucide-react';

interface RecipeShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipe: CustomRecipe | null;
}

export const RecipeShareModal = ({
  isOpen,
  onClose,
  recipe,
}: RecipeShareModalProps) => {
  const qrContainerRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen || !recipe || !qrContainerRef.current) return;

    try {
      const shareUrl = generateShareUrl(recipe);
      const writer = new BrowserQRCodeSvgWriter();
      
      // Clear container and append generated SVG
      qrContainerRef.current.innerHTML = '';
      const svgElement = writer.write(shareUrl, 240, 240);
      svgElement.classList.add('rounded-xl', 'mx-auto', 'shadow-xs');
      qrContainerRef.current.appendChild(svgElement);
    } catch (err) {
      console.error('Failed to generate QR code', err);
    }
  }, [isOpen, recipe]);

  if (!isOpen || !recipe) return null;

  const isBread = recipe.category === 'bread' || recipe.name.toLowerCase().includes('brot');
  const sliceWeight = recipe.servingWeightGrams || (isBread ? 50 : 100);
  const sliceKcal = Math.round(recipe.calories100g * (sliceWeight / 100));
  const shareUrl = generateShareUrl(recipe);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Clipboard copy failed', err);
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `Rezept: ${recipe.name}`,
          text: `Hier ist das Rezept für "${recipe.name}" (${sliceKcal} kcal pro ${recipe.servingName || 'Portion'}):`,
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled share
      }
    } else {
      handleCopyLink();
    }
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `🍞 Rezept: "${recipe.name}"\n` +
      `Nährwerte: ${recipe.calories100g} kcal/100g (${sliceKcal} kcal pro ${recipe.servingName || 'Scheibe'} à ${sliceWeight}g)\n\n` +
      `Direkt in deiner Weniger-Fressen-App öffnen:\n${shareUrl}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white rounded-t-3xl sm:rounded-3xl shadow-soft-lg border border-stone-100 overflow-hidden max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="p-4 px-5 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-amber-50 text-amber-700 rounded-xl text-lg">
              {isBread ? '🍞' : '🍲'}
            </span>
            <div>
              <h3 className="font-bold text-stone-900 text-sm">Rezept teilen</h3>
              <p className="text-[11px] text-stone-400">Für Partner, Familie & Freunde</p>
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
        <div className="p-5 overflow-y-auto space-y-4 text-center">
          
          {/* Recipe Pill */}
          <div className="bg-amber-50/70 p-3 rounded-2xl border border-amber-200/70 text-left space-y-1">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-stone-900 text-sm">{recipe.name}</h4>
              <span className="text-[10px] font-bold bg-amber-200 text-amber-950 px-2 py-0.5 rounded-full">
                {isBread ? 'Eigenes Brot' : 'Rezept'}
              </span>
            </div>
            <p className="text-xs text-amber-900 font-medium">
              {recipe.servingName || '1 Scheibe'} ({sliceWeight}g) = <strong>{sliceKcal} kcal</strong>
            </p>
            <p className="text-[10px] text-stone-500">
              P: {recipe.protein100g}g • K: {recipe.carbs100g}g • F: {recipe.fat100g}g (pro 100g)
            </p>
          </div>

          {/* QR Code Canvas/SVG */}
          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 inline-block mx-auto">
            <div ref={qrContainerRef} className="flex justify-center items-center min-h-[240px]" />
            <p className="text-[11px] font-medium text-stone-500 mt-2">
              📱 Mit Smartphone-Kamera oder Scanner scannen
            </p>
          </div>

          {/* Quick Sharing Action Buttons */}
          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs shadow-soft transition-all flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Per WhatsApp senden</span>
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex-1 py-2.5 px-3 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-stone-400" />}
                <span>{copied ? 'Link kopiert!' : 'Link kopieren'}</span>
              </button>

              {typeof navigator !== 'undefined' && 'share' in navigator && (
                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="py-2.5 px-3.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                  title="Über System teilen"
                >
                  <Share2 className="w-4 h-4 text-stone-500" />
                  <span>Teilen</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
