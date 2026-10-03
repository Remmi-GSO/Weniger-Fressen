import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { fetchProductByBarcode, type FoodProduct } from '../services/foodApi';
import { type CustomRecipe } from '../db/db';
import { decodePayloadToRecipe } from '../utils/recipeShare';
import { X, Flashlight, Camera, AlertCircle, Loader2, Search } from 'lucide-react';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductFound: (product: FoodProduct) => void;
  onRecipeFound?: (recipe: Omit<CustomRecipe, 'id'>) => void;
  onManualAdd?: () => void;
}

export const BarcodeScannerModal = ({
  isOpen,
  onClose,
  onProductFound,
  onRecipeFound,
  onManualAdd,
}: BarcodeScannerModalProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [notFoundBarcode, setNotFoundBarcode] = useState<string | null>(null);

  // Active track reference for flashlight & cleanup
  const streamRef = useRef<MediaStream | null>(null);
  const zxingReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const scanningActiveRef = useRef<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;

    scanningActiveRef.current = true;
    setErrorMsg(null);
    setNotFoundBarcode(null);
    setIsSearching(false);

    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        // Request rear camera with optimal resolution
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        streamRef.current = stream;
        setHasPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();

          // Check if torch is available
          const track = stream.getVideoTracks()[0];
          const capabilities = (track.getCapabilities && track.getCapabilities()) as any;
          if (capabilities && capabilities.torch) {
            setHasTorch(true);
          }

          // Start scanning mechanism
          startScanningLoop();
        }
      } catch (err: any) {
        console.error('Camera access error:', err);
        setHasPermission(false);
        setErrorMsg('Kamerazugriff wurde verweigert oder ist nicht verfügbar.');
      }
    };

    startCamera();

    return () => {
      scanningActiveRef.current = false;
      if (zxingReaderRef.current) {
        // Stop ZXing
        zxingReaderRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [isOpen]);

  const handleBarcodeDetected = async (barcode: string) => {
    if (!scanningActiveRef.current || isSearching) return;
    scanningActiveRef.current = false; // pause scanning
    setIsSearching(true);

    // Haptic feedback
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(80);
    }

    // Check if it's a shared recipe QR Code
    if (barcode.includes('recipe=') || barcode.includes('#recipe=')) {
      const decodedRecipe = decodePayloadToRecipe(barcode);
      if (decodedRecipe) {
        onRecipeFound?.(decodedRecipe);
        onClose();
        return;
      }
    }

    try {
      const product = await fetchProductByBarcode(barcode);
      if (product) {
        onProductFound(product);
        onClose();
      } else {
        setNotFoundBarcode(barcode);
        setIsSearching(false);
      }
    } catch (err) {
      console.error('Lookup failed', err);
      setNotFoundBarcode(barcode);
      setIsSearching(false);
    }
  };

  const startScanningLoop = () => {
    // 1. Prefer native Hardware-accelerated BarcodeDetector if available
    const Win = window as any;
    if ('BarcodeDetector' in Win) {
      try {
        const barcodeDetector = new Win.BarcodeDetector({
          formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'qr_code', 'code_128'],
        });

        const scanFrame = async () => {
          if (!scanningActiveRef.current || !videoRef.current) return;

          if (videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
            try {
              const barcodes = await barcodeDetector.detect(videoRef.current);
              if (barcodes && barcodes.length > 0) {
                const code = barcodes[0].rawValue;
                if (code) {
                  handleBarcodeDetected(code);
                  return;
                }
              }
            } catch (e) {
              // Frame dropped, continue
            }
          }

          if (scanningActiveRef.current) {
            requestAnimationFrame(scanFrame);
          }
        };

        requestAnimationFrame(scanFrame);
        return;
      } catch (err) {
        console.warn('Native BarcodeDetector initialization error, falling back to ZXing', err);
      }
    }

    // 2. Fallback: ZXing Library
    try {
      const codeReader = new BrowserMultiFormatReader();
      zxingReaderRef.current = codeReader;

      if (videoRef.current) {
        codeReader.decodeFromVideoElement(videoRef.current, (result) => {
          if (result && scanningActiveRef.current) {
            handleBarcodeDetected(result.getText());
          }
        });
      }
    } catch (err) {
      console.error('ZXing scanner error:', err);
    }
  };

  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    try {
      const nextState = !torchEnabled;
      await (track as any).applyConstraints({
        advanced: [{ torch: nextState }],
      });
      setTorchEnabled(nextState);
    } catch (err) {
      console.warn('Torch toggle failed', err);
    }
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      handleBarcodeDetected(manualCode.trim());
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      
      {/* Top Bar with Close & Torch buttons */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between text-white">
        <div className="flex items-center gap-2 bg-stone-900/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
          <Camera className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold">Barcode Scanner</span>
        </div>

        <div className="flex items-center gap-2">
          {hasTorch && (
            <button
              onClick={toggleTorch}
              className={`p-2.5 rounded-full backdrop-blur-md transition-all ${
                torchEnabled ? 'bg-amber-400 text-stone-900 shadow-lg' : 'bg-stone-900/70 text-white'
              }`}
              title="Taschenlampe"
            >
              <Flashlight className="w-5 h-5" />
            </button>
          )}

          <button
            onClick={onClose}
            className="p-2.5 rounded-full bg-stone-900/70 hover:bg-stone-800 text-white transition-colors border border-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Camera Video Viewport */}
      <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden">
        {hasPermission !== false ? (
          <>
            <video
              ref={videoRef}
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Viewfinder Target Box Overlay */}
            <div className="relative z-10 w-72 h-52 sm:w-80 sm:h-56 rounded-3xl border-2 border-white/30 flex items-center justify-center shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]">
              {/* Corner brackets */}
              <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl -mt-1 -ml-1" />
              <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl -mt-1 -mr-1" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl -mb-1 -ml-1" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-xl -mb-1 -mr-1" />

              {/* Animated Laser line */}
              <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_8px_#10B981] animate-pulse" />
            </div>

            {/* Instruction text */}
            <div className="relative z-10 mt-6 text-center text-white max-w-xs px-4">
              {isSearching ? (
                <div className="flex items-center justify-center gap-2 bg-stone-900/80 backdrop-blur-md px-4 py-2 rounded-full border border-emerald-500/40">
                  <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
                  <span className="text-xs font-semibold text-emerald-200">
                    Nährwerte in Open Food Facts abrufen...
                  </span>
                </div>
              ) : (
                <p className="text-xs font-medium text-stone-300 drop-shadow">
                  Platziere den Barcode im Rahmen – wird automatisch erkannt.
                </p>
              )}
            </div>
          </>
        ) : (
          <div className="p-6 text-center text-white max-w-sm space-y-4">
            <div className="w-16 h-16 bg-rose-500/20 text-rose-400 rounded-3xl flex items-center justify-center mx-auto border border-rose-500/30">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Kamerazugriff erforderlich</h3>
              <p className="text-xs text-stone-300 mt-1">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* Not Found Prompt */}
        {notFoundBarcode && (
          <div className="absolute bottom-24 left-4 right-4 z-20 max-w-sm mx-auto bg-stone-900/95 backdrop-blur-md p-4 rounded-3xl border border-white/20 text-white text-center space-y-3">
            <span className="text-xs text-stone-300 block">
              Barcode <span className="font-mono font-bold text-amber-400">{notFoundBarcode}</span> nicht gefunden.
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setNotFoundBarcode(null);
                  scanningActiveRef.current = true;
                  startScanningLoop();
                }}
                className="flex-1 py-2 px-3 rounded-2xl bg-white/10 hover:bg-white/20 text-xs font-bold transition-colors"
              >
                Erneut scannen
              </button>
              {onManualAdd && (
                <button
                  onClick={() => {
                    onClose();
                    onManualAdd();
                  }}
                  className="flex-1 py-2 px-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white transition-colors"
                >
                  Manuell eintragen
                </button>
              )}
            </div>
          </div>
        )}

        {/* Manual Barcode Input Fallback (always accessible at the bottom) */}
        <div className="absolute bottom-6 left-4 right-4 z-20 max-w-sm mx-auto">
          <form onSubmit={handleManualSearch} className="flex gap-1.5 bg-stone-900/80 backdrop-blur-md p-1.5 rounded-2xl border border-white/15">
            <input
              type="text"
              placeholder="Barcode-Nummer manuell tippen..."
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              className="flex-1 bg-transparent px-3 py-1.5 text-xs text-white placeholder-stone-400 focus:outline-none"
            />
            <button
              type="submit"
              className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center justify-center shrink-0"
              title="Suchen"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
