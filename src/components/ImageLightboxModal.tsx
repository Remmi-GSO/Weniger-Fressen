import React, { useState, useEffect } from 'react';
import { X, ZoomIn, ZoomOut } from 'lucide-react';

interface ImageLightboxModalProps {
  isOpen: boolean;
  imageSrc: string | null;
  title?: string;
  subtitle?: string;
  onClose: () => void;
}

export const ImageLightboxModal: React.FC<ImageLightboxModalProps> = ({
  isOpen,
  imageSrc,
  title,
  subtitle,
  onClose,
}) => {
  const [isZoomed, setIsZoomed] = useState(false);

  // Reset zoom on open/close or source change
  useEffect(() => {
    setIsZoomed(false);
  }, [isOpen, imageSrc]);

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when lightbox is active
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  if (!isOpen || !imageSrc) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col justify-between bg-stone-950/95 backdrop-blur-md animate-in fade-in duration-200 select-none touch-manipulation"
      onClick={onClose}
    >
      {/* Top Bar: Title & Close Button */}
      <div
        className="w-full p-4 sm:p-5 flex items-center justify-between gap-4 z-10 bg-gradient-to-b from-stone-950/80 to-transparent"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="min-w-0 pr-2">
          {title && (
            <h3 className="text-white font-black text-base sm:text-lg leading-tight truncate drop-shadow-sm flex items-center gap-2">
              <span>{title}</span>
            </h3>
          )}
          {subtitle && (
            <p className="text-stone-300 text-xs sm:text-sm font-medium truncate drop-shadow-sm mt-0.5">
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsZoomed((prev) => !prev)}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-sm border border-white/10 shadow-lg"
            title={isZoomed ? 'Herauszoomen' : 'Vergrößern'}
          >
            {isZoomed ? <ZoomOut className="w-5 h-5" /> : <ZoomIn className="w-5 h-5" />}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-sm border border-white/15 shadow-lg"
            title="Schließen (ESC)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Center Image Container */}
      <div
        className="flex-1 flex items-center justify-center p-2 sm:p-6 overflow-hidden min-h-0"
        onClick={onClose}
      >
        <div
          className={`relative transition-transform duration-300 ease-out max-h-full max-w-full flex items-center justify-center ${
            isZoomed ? 'scale-125 sm:scale-150 cursor-zoom-out' : 'scale-100 cursor-zoom-in'
          }`}
          onClick={(e) => {
            e.stopPropagation();
            setIsZoomed((prev) => !prev);
          }}
        >
          <img
            src={imageSrc}
            alt={title || 'Rezeptbild'}
            className="max-h-[75vh] sm:max-h-[82vh] max-w-[96vw] sm:max-w-[90vw] object-contain rounded-2xl sm:rounded-3xl shadow-2xl border border-white/10 animate-in zoom-in-95 duration-200"
          />
        </div>
      </div>

      {/* Bottom Bar: Helpful hint */}
      <div
        className="w-full p-3 sm:p-4 text-center z-10 bg-gradient-to-t from-stone-950/80 to-transparent"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-stone-400 text-xs font-semibold flex items-center justify-center gap-1.5 drop-shadow-sm">
          <span>🔍</span>
          <span>Tippen zum {isZoomed ? 'Verkleinern' : 'Vergrößern'} • Tippen außerhalb zum Schließen</span>
        </p>
      </div>
    </div>
  );
};
