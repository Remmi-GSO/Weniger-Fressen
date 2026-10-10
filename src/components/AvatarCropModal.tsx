import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ZoomIn, ZoomOut, RotateCw, RotateCcw, Check, X, Move, Sparkles } from 'lucide-react';

interface AvatarCropModalProps {
  isOpen: boolean;
  imageSrc: string | null;
  onClose: () => void;
  onCropComplete: (croppedDataUrl: string) => void;
}

const CROP_BOX_SIZE = 260; // Dimension of the square crop area in pixels
const OUTPUT_SIZE = 320;   // High-res output square size

export const AvatarCropModal: React.FC<AvatarCropModalProps> = ({
  isOpen,
  imageSrc,
  onClose,
  onCropComplete,
}) => {
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [rotation, setRotation] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Load image object whenever imageSrc changes
  useEffect(() => {
    if (!imageSrc) {
      setImageElement(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImageElement(img);
      setZoom(1.0);
      setPan({ x: 0, y: 0 });
      setRotation(0);
    };
    img.onerror = (e) => {
      console.warn('Failed to load image for cropping', e);
      setImageElement(null);
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Compute base scaling so image covers the crop area
  const getBaseScale = useCallback(() => {
    if (!imageElement) return 1;
    const isRotated90or270 = rotation % 180 !== 0;
    const imgW = isRotated90or270 ? imageElement.naturalHeight : imageElement.naturalWidth;
    const imgH = isRotated90or270 ? imageElement.naturalWidth : imageElement.naturalHeight;
    return Math.max(CROP_BOX_SIZE / imgW, CROP_BOX_SIZE / imgH);
  }, [imageElement, rotation]);

  // Pan interaction: mouse
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Pan interaction: touch
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setIsDragging(true);
      setDragStart({ x: touch.clientX - pan.x, y: touch.clientY - pan.y });
    }
  };

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    setPan({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y,
    });
  }, [isDragging, dragStart]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.002;
    setZoom((prev) => Math.min(Math.max(prev + delta, 0.8), 3.5));
  };

  // Add global mouse / touch event listeners during drag
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleTouchEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  // Rotate 90 degrees clockwise
  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // Reset zoom & pan
  const handleReset = () => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
    setRotation(0);
  };

  // Export cropped circle region to Canvas
  const handleApplyCrop = () => {
    if (!imageElement) return;
    setIsProcessing(true);

    try {
      const canvas = document.createElement('canvas');
      canvas.width = OUTPUT_SIZE;
      canvas.height = OUTPUT_SIZE;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        setIsProcessing(false);
        return;
      }

      // High-quality smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Ratio between export resolution and display box
      const exportRatio = OUTPUT_SIZE / CROP_BOX_SIZE;
      const baseScale = getBaseScale();
      const currentScale = baseScale * zoom * exportRatio;

      // Center of canvas
      ctx.save();
      ctx.translate(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2);

      // Apply rotation around center
      ctx.rotate((rotation * Math.PI) / 180);

      // Apply pan (scaled for export ratio)
      // If rotated, adjust pan orientation so drag direction matches visual canvas
      const rad = (-rotation * Math.PI) / 180;
      const unrotatedPanX = pan.x * Math.cos(rad) - pan.y * Math.sin(rad);
      const unrotatedPanY = pan.x * Math.sin(rad) + pan.y * Math.cos(rad);

      ctx.translate(unrotatedPanX * exportRatio, unrotatedPanY * exportRatio);

      // Draw image centered
      const drawW = imageElement.naturalWidth * currentScale;
      const drawH = imageElement.naturalHeight * currentScale;
      ctx.drawImage(
        imageElement,
        -drawW / 2,
        -drawH / 2,
        drawW,
        drawH
      );

      ctx.restore();

      // Convert to compressed jpeg data URL (quality 0.88)
      const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
      onCropComplete(croppedDataUrl);
    } catch (err) {
      console.error('Error applying crop', err);
      alert('Der Bildausschnitt konnte leider nicht verarbeitet werden.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen || !imageSrc) return null;

  const baseScale = getBaseScale();
  const effectiveScale = baseScale * zoom;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-soft-xl border border-stone-100 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm leading-tight">Profilbild anpassen</h3>
              <p className="text-[11px] text-white/90">Ausschnitt wählen & zoomen</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Crop Viewport */}
        <div className="p-4 flex flex-col items-center bg-stone-100/70 select-none">
          <div
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            onWheel={handleWheel}
            className="relative w-[260px] h-[260px] rounded-2xl bg-stone-900 overflow-hidden cursor-grab active:cursor-grabbing shadow-inner flex items-center justify-center border border-stone-300"
          >
            {/* The Image layer */}
            {imageElement && (
              <img
                src={imageSrc}
                alt="Vorschau"
                draggable={false}
                style={{
                  width: `${imageElement.naturalWidth * effectiveScale}px`,
                  height: `${imageElement.naturalHeight * effectiveScale}px`,
                  transform: `translate(${pan.x}px, ${pan.y}px) rotate(${rotation}deg)`,
                  transformOrigin: 'center center',
                  maxWidth: 'none',
                  maxHeight: 'none',
                }}
                className="pointer-events-none select-none transition-transform duration-75"
              />
            )}

            {/* Circular Vignette Overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div
                style={{
                  width: '220px',
                  height: '220px',
                  boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.65)',
                }}
                className="rounded-full border-2 border-emerald-400 relative"
              >
                {/* Guide lines (crosshair grid) */}
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-25">
                  <div className="border-r border-b border-white" />
                  <div className="border-r border-b border-white" />
                  <div className="border-b border-white" />
                  <div className="border-r border-b border-white" />
                  <div className="border-r border-b border-white" />
                  <div className="border-b border-white" />
                  <div className="border-r border-white" />
                  <div className="border-r border-white" />
                  <div />
                </div>
              </div>
            </div>

            {/* Hint Badge */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-stone-900/80 backdrop-blur-xs text-[10px] text-white/90 font-medium flex items-center gap-1 pointer-events-none shadow-xs">
              <Move className="w-3 h-3 text-emerald-400" />
              <span>Ziehen zum Verschieben</span>
            </div>
          </div>
        </div>

        {/* Controls: Zoom, Rotate, Reset */}
        <div className="p-4 space-y-3 bg-white border-t border-stone-100">
          {/* Zoom Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-stone-600">
              <span className="flex items-center gap-1">
                <ZoomIn className="w-3.5 h-3.5 text-emerald-600" />
                <span>Zoom</span>
              </span>
              <span className="text-[11px] font-mono text-stone-500">
                {Math.round(zoom * 100)}%
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setZoom((prev) => Math.max(prev - 0.15, 0.8))}
                className="p-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer"
                title="Verkleinern"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              <input
                type="range"
                min="0.8"
                max="3.5"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="flex-1 accent-emerald-600 cursor-pointer h-2 bg-stone-200 rounded-lg"
              />

              <button
                type="button"
                onClick={() => setZoom((prev) => Math.min(prev + 0.15, 3.5))}
                className="p-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer"
                title="Vergrößern"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Additional Tool Buttons */}
          <div className="flex items-center justify-between pt-1 border-t border-stone-100">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleRotate}
                className="py-1.5 px-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                title="Um 90° drehen"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Drehen</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="py-1.5 px-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                title="Position & Zoom zurücksetzen"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>

            <span className="text-[10px] text-stone-400">Kreis-Zuschnitt</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3 bg-stone-50 border-t border-stone-100 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl bg-white border border-stone-200 hover:bg-stone-100 text-stone-700 text-xs font-bold transition-colors cursor-pointer"
          >
            Abbrechen
          </button>

          <button
            type="button"
            onClick={handleApplyCrop}
            disabled={isProcessing || !imageElement}
            className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs font-extrabold shadow-soft transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isProcessing ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Ausschnitt übernehmen</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
