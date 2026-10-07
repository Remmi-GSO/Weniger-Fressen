import { useEffect, useRef, useState } from 'react';
import { BrowserQRCodeSvgWriter } from '@zxing/browser';
import { type CustomRecipe } from '../db/db';
import { generateShareUrl, generateShareUrlSync } from '../utils/recipeShare';
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
  const [shareUrl, setShareUrl] = useState<string>('');
  const [qrImageOmitted, setQrImageOmitted] = useState(false);

  useEffect(() => {
    if (!isOpen || !recipe) return;

    let isCancelled = false;
    setQrImageOmitted(false);

    const prepareUrlAndQr = async () => {
      try {
        // Optimize thumbnail and generate URL with photo
        const urlWithImage = await generateShareUrl(recipe, { includeImage: true });
        if (isCancelled) return;
        setShareUrl(urlWithImage);

        // Attempt QR Code generation with image
        if (qrContainerRef.current) {
          qrContainerRef.current.innerHTML = '';
          const writer = new BrowserQRCodeSvgWriter();

          try {
            const svgElement = writer.write(urlWithImage, 240, 240);
            svgElement.classList.add('rounded-xl', 'mx-auto', 'shadow-xs');
            qrContainerRef.current.appendChild(svgElement);
          } catch (qrErr) {
            console.warn('QR code payload too large with image, falling back without image', qrErr);
            // Fallback for QR code: generate without image
            const urlWithoutImage = generateShareUrlSync(recipe, { includeImage: false });
            if (qrContainerRef.current) {
              qrContainerRef.current.innerHTML = '';
              const fallbackSvg = writer.write(urlWithoutImage, 240, 240);
              fallbackSvg.classList.add('rounded-xl', 'mx-auto', 'shadow-xs');
              qrContainerRef.current.appendChild(fallbackSvg);
            }
            if (!isCancelled) {
              setQrImageOmitted(true);
            }
          }
        }
      } catch (err) {
        console.error('Failed to generate share URL or QR code', err);
        const fallbackUrl = generateShareUrlSync(recipe, { includeImage: false });
        if (!isCancelled) {
          setShareUrl(fallbackUrl);
          if (qrContainerRef.current) {
            try {
              qrContainerRef.current.innerHTML = '';
              const writer = new BrowserQRCodeSvgWriter();
              const fallbackSvg = writer.write(fallbackUrl, 240, 240);
              fallbackSvg.classList.add('rounded-xl', 'mx-auto', 'shadow-xs');
              qrContainerRef.current.appendChild(fallbackSvg);
            } catch {}
          }
        }
      }
    };

    prepareUrlAndQr();

    return () => {
      isCancelled = true;
    };
  }, [isOpen, recipe]);

  if (!isOpen || !recipe) return null;

  const isBread = recipe.category === 'bread' || recipe.name.toLowerCase().includes('brot');
  const sliceWeight = recipe.servingWeightGrams || (isBread ? 50 : 100);
  const sliceKcal = Math.round(recipe.calories100g * (sliceWeight / 100));

  const activeShareUrl = shareUrl || generateShareUrlSync(recipe, { includeImage: true });

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(activeShareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Clipboard copy failed', err);
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        const shareData: ShareData = {
          title: `Rezept: ${recipe.name}`,
          text: `Hier ist das Rezept für "${recipe.name}" (${sliceKcal} kcal pro ${recipe.servingName || 'Portion'}):`,
          url: activeShareUrl,
        };

        // If recipe has an image, attach it as a File for system sharing (e.g. AirDrop, WhatsApp, Messenger)
        if (recipe.imageUrl && navigator.canShare) {
          try {
            const res = await fetch(recipe.imageUrl);
            const blob = await res.blob();
            const ext = blob.type.includes('png') ? 'png' : blob.type.includes('webp') ? 'webp' : 'jpg';
            const file = new File(
              [blob],
              `rezept_${recipe.name.replace(/[^a-zA-Z0-9_-]/g, '_')}.${ext}`,
              { type: blob.type || 'image/jpeg' }
            );

            if (navigator.canShare({ files: [file] })) {
              shareData.files = [file];
            }
          } catch {
            // Ignore file conversion errors, proceed with URL/text
          }
        }

        await navigator.share(shareData);
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          console.error('Share failed', err);
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const handleWhatsAppShare = () => {
    const hasImage = Boolean(recipe.imageUrl);
    const text = encodeURIComponent(
      `🍞 Rezept: "${recipe.name}"${hasImage ? ' (inklusive Rezeptfoto 📸)' : ''}\n` +
      `Nährwerte: ${recipe.calories100g} kcal/100g (${sliceKcal} kcal pro ${recipe.servingName || 'Scheibe'} à ${sliceWeight}g)\n\n` +
      `Direkt in deiner Weniger-Fressen-App öffnen:\n${activeShareUrl}`
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
          
          {/* Recipe Card Preview */}
          <div className="bg-amber-50/70 p-3 rounded-2xl border border-amber-200/70 text-left flex gap-3 items-center">
            {recipe.imageUrl ? (
              <div className="relative shrink-0 w-14 h-14 rounded-xl overflow-hidden border border-amber-200/80 shadow-xs bg-amber-100/50">
                <img
                  src={recipe.imageUrl}
                  alt={recipe.name}
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-0 inset-x-0 bg-stone-900/65 text-white text-[8px] font-bold py-0.5 text-center backdrop-blur-xs">
                  Foto 📸
                </span>
              </div>
            ) : (
              <div className="w-14 h-14 rounded-xl bg-amber-100/80 flex items-center justify-center text-2xl shrink-0">
                {isBread ? '🍞' : '🍲'}
              </div>
            )}
            <div className="flex-1 min-w-0 space-y-0.5">
              <div className="flex items-center justify-between gap-1">
                <h4 className="font-extrabold text-stone-900 text-sm truncate">{recipe.name}</h4>
                <span className="text-[10px] font-bold bg-amber-200 text-amber-950 px-2 py-0.5 rounded-full shrink-0">
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
          </div>

          {recipe.imageUrl && (
            <div className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/80 rounded-xl py-1.5 px-3">
              <span>📸</span>
              <span>Rezeptfoto wird beim Teilen mitgesendet</span>
            </div>
          )}

          {/* QR Code Canvas/SVG */}
          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 inline-block mx-auto">
            <div ref={qrContainerRef} className="flex justify-center items-center min-h-[240px]" />
            <p className="text-[11px] font-medium text-stone-500 mt-2">
              📱 Mit Smartphone-Kamera oder Scanner scannen
            </p>
            {qrImageOmitted && (
              <p className="text-[10px] text-amber-700 bg-amber-50 rounded-lg py-1 px-2 mt-1.5 border border-amber-200/60">
                ℹ️ QR-Code ohne Foto (Link & WhatsApp teilen das Foto mit)
              </p>
            )}
          </div>

          {/* Quick Sharing Action Buttons */}
          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs shadow-soft transition-all flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Per WhatsApp senden {recipe.imageUrl ? '(mit Foto)' : ''}</span>
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
