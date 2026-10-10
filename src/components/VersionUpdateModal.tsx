import React, { useEffect } from 'react';
import { Sparkles, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { APP_VERSION } from '../config/version';

interface VersionUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenMagicAssistant: () => void;
}

export const VersionUpdateModal: React.FC<VersionUpdateModalProps> = ({
  isOpen,
  onClose,
  onOpenMagicAssistant,
}) => {
  useEffect(() => {
    if (isOpen) {
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.5 },
        colors: ['#10B981', '#6366F1', '#F59E0B', '#EC4899'],
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTryMagic = () => {
    onClose();
    onOpenMagicAssistant();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-soft-xl border border-stone-100 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Celebration Header */}
        <div className="relative p-6 bg-gradient-to-br from-amber-500 via-orange-500 to-rose-600 text-white overflow-hidden shrink-0">
          <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-white/10 blur-xl pointer-events-none" />
          <div className="absolute top-2 left-10 w-20 h-20 rounded-full bg-amber-300/20 blur-lg pointer-events-none" />

          <div className="relative z-10 flex items-start justify-between">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-[11px] font-black tracking-wide text-white border border-white/20 shadow-xs uppercase">
                🚀 MEILENSTEIN • VERSION {APP_VERSION}
              </span>
              <h3 className="text-xl font-black tracking-tight leading-tight pt-1">
                Weniger fressen trifft Mehr fressen! 🥳🎉
              </h3>
              <p className="text-xs text-white/95 font-medium">
                Das gigantische Doppel-Update: Tracker & Rezeptbuch vereint, 39 Paprika-Rezepte, Gebinde-Rechner & Community!
              </p>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors shrink-0"
              title="Schließen"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body with Version 2.0 Highlights */}
        <div className="p-5 overflow-y-auto space-y-3 text-stone-700 flex-1">
          <p className="text-xs font-semibold text-stone-600 leading-relaxed bg-amber-50/80 p-3 rounded-2xl border border-amber-200/80">
            Willkommen zur <strong>Version 2.0</strong>! Wir vereinen zwei Welten: Euren smarten Kalorien- & Fastentracker (<strong>Weniger fressen</strong>) und eure große Rezept-Datenbank & Backstube (<strong>Mehr fressen</strong>) mit vollem Startzustands-Gedächtnis!
          </p>

          <div className="space-y-2.5">
            {/* 1. Doppel-Header & Modus-Gedächtnis */}
            <div className="p-3 bg-gradient-to-r from-emerald-50 via-teal-50 to-amber-50 border border-emerald-200/90 rounded-2xl flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs font-bold text-base">
                🔄
              </div>
              <div className="text-xs space-y-0.5">
                <span className="font-extrabold text-stone-900 block">
                  Der neue Doppel-Header: Weniger fressen ↔ Mehr fressen
                </span>
                <p className="text-stone-600 leading-snug">
                  Schaltet ganz oben mit einem Fingertipp zwischen Tracker und Rezeptdatenbank um. Die App merkt sich euren letzten Zustand und startet beim nächsten Mal exakt dort, wo ihr wart!
                </p>
              </div>
            </div>

            {/* 2. Paprika-Rezepte & Original-Fotos */}
            <div className="p-3 bg-amber-50/80 border border-amber-200/90 rounded-2xl flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs font-bold text-base">
                🍰
              </div>
              <div className="text-xs space-y-0.5">
                <span className="font-extrabold text-amber-950 block">
                  39 Paprika-Meisterwerke mit Fotos & Gesamtkalorien
                </span>
                <p className="text-stone-600 leading-snug">
                  Schwarzwälder Kirschtorte, Sachertorte, Tiramisu, Auberginen-Auflauf, Paella, Waffeln und Butterbier – alle Rezepte sind mit Original-Foto, Zubereitung und berechneten Gesamtkalorien da! Verbucht sie grammgenau oder nach Portionen (1 Stück, 1/2, 1/4).
                </p>
              </div>
            </div>

            {/* 3. Smarte Gebinde- & Glas-Logik */}
            <div className="p-3 bg-emerald-50/80 border border-emerald-200/90 rounded-2xl flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs font-bold text-base">
                🫙
              </div>
              <div className="text-xs space-y-0.5">
                <span className="font-extrabold text-emerald-950 block">
                  Smarte Gebinde-Logik: Rote-Bete-Gläser, Pizzen & Dosen
                </span>
                <p className="text-stone-600 leading-snug">
                  Nie wieder rechnen: Die App zeigt das <strong>Ganze Gebinde (1/1)</strong> mit Gesamtkalorien und bietet direkte Anteile: <strong>1/2 Halbes Glas</strong>, <strong>2/3 Zwei Drittel (1/3 übrig)</strong>, <strong>1/3 Ein Drittel</strong> oder 1 Klick zur <strong>Küchenwaage (g)</strong>!
                </p>
              </div>
            </div>

            {/* 4. Das neue Community-Register */}
            <div className="p-3 bg-indigo-50/80 border border-indigo-200/90 rounded-2xl flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs font-bold text-base">
                🌐
              </div>
              <div className="text-xs space-y-0.5">
                <span className="font-extrabold text-indigo-950 block">
                  Neues Register „Community“ mit 1-Klick-Import
                </span>
                <p className="text-stone-600 leading-snug">
                  Entdeckt leckere Rezepte anderer Nutzer (inkl. Ersteller wie <em>„Philipp“</em>, <em>„Markus“</em> oder <em>„Oma Hilde“</em>), lest euch die Kurz-Info durch und übernehmt sie mit einem Fingertipp in euer eigenes Rezeptbuch!
                </p>
              </div>
            </div>

            {/* 5. Smarte Naschereien & Behälter */}
            <div className="p-3 bg-pink-50/80 border border-pink-200/90 rounded-2xl flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-pink-600 text-white flex items-center justify-center shrink-0 shadow-2xs font-bold text-base">
                🍫
              </div>
              <div className="text-xs space-y-0.5">
                <span className="font-extrabold text-pink-950 block">
                  Smarte Snack-Behälter (Schokolade & Käse)
                </span>
                <p className="text-stone-600 leading-snug">
                  Schokolade nach Rippchen/Stückchen ohne Küchenwaage und Käsehappen zum spielerischen Gramm-Lernen mit sofortigem Fett- & Eiweiß-Feedback!
                </p>
              </div>
            </div>
          </div>

          <div className="p-3 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10 rounded-2xl border border-amber-200/80 text-center text-xs font-bold text-amber-950">
            🎉 Viel Freude mit der meisterhaften Version 2.0!
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-stone-100 bg-stone-50/60 flex flex-col sm:flex-row gap-2 shrink-0">
          <button
            type="button"
            onClick={handleTryMagic}
            className="py-3 px-4 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-extrabold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>🎙️ Magic Button</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white font-extrabold text-xs shadow-soft transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
          >
            <Sparkles className="w-4 h-4" />
            <span>Jetzt loslegen & entdecken!</span>
          </button>
        </div>

      </div>
    </div>
  );
};
