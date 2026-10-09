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
        <div className="relative p-6 bg-gradient-to-br from-emerald-600 via-teal-600 to-indigo-700 text-white overflow-hidden shrink-0">
          <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-white/10 blur-xl pointer-events-none" />
          <div className="absolute top-2 left-10 w-20 h-20 rounded-full bg-emerald-300/20 blur-lg pointer-events-none" />

          <div className="relative z-10 flex items-start justify-between">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-[11px] font-black tracking-wide text-white border border-white/20 shadow-xs uppercase">
                🚀 MEILENSTEIN • VERSION {APP_VERSION}
              </span>
              <h3 className="text-xl font-black tracking-tight leading-tight pt-1">
                Das gigantische Behälter-Update ist da! 🍫🧀🍪
              </h3>
              <p className="text-xs text-white/90 font-medium">
                Schokolade ohne Waage, die Käsehappen-Schule, Keks-Dosen & pure KI-Magie!
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

        {/* Scrollable Content Body with Version 1.8 Highlights */}
        <div className="p-5 overflow-y-auto space-y-3 text-stone-700 flex-1">
          <p className="text-xs font-semibold text-stone-600 leading-relaxed bg-stone-50 p-3 rounded-2xl border border-stone-200/80">
            Wir haben das Tracken von Zwischenmahlzeiten revolutioniert: Organisiert eure Snacks in <strong>speziellen Behältern</strong>, lernt spielend Gramm-Größen und sprecht neue Sorten einfach mit der Stimme ein!
          </p>

          <div className="space-y-2.5">
            {/* 1. Schokoladen-Behälter */}
            <div className="p-3 bg-pink-50/80 border border-pink-200/90 rounded-2xl flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-pink-600 text-white flex items-center justify-center shrink-0 shadow-2xs font-bold text-base">
                🍫
              </div>
              <div className="text-xs space-y-0.5">
                <span className="font-extrabold text-pink-950 block">
                  Schokolade ohne Küchenwaage!
                </span>
                <p className="text-stone-600 leading-snug">
                  Nie wieder Schokolade abwiegen: Trackt einfach nach kleinsten Einheiten (1, 2, 3 Stückchen oder Rippen). Ob Milka (~4,2g), Ritter Sport (~6,25g) oder Lindt (~10g) – Stück-Gewichte und Kalorien stimmen auf den Punkt!
                </p>
              </div>
            </div>

            {/* 2. Käsehappen-Schule */}
            <div className="p-3 bg-amber-50/80 border border-amber-200/90 rounded-2xl flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs font-bold text-base">
                🧀
              </div>
              <div className="text-xs space-y-0.5">
                <span className="font-extrabold text-amber-950 block">
                  Die neue Käsehappen-Augenmaß-Schule!
                </span>
                <p className="text-stone-600 leading-snug">
                  Entwickelt spielerisch ein echtes Gespür für Käse-Mengen: Schnelle Gramm-Schritte (10g Probier-Happen, 15g Würfel, Scheiben) mit Sofort-Feedback zu Fett und Eiweiß!
                </p>
              </div>
            </div>

            {/* 3. Keks-Dose & Prinzenrolle */}
            <div className="p-3 bg-orange-50/80 border border-orange-200/90 rounded-2xl flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-2xs font-bold text-base">
                🍪
              </div>
              <div className="text-xs space-y-0.5">
                <span className="font-extrabold text-orange-950 block">
                  Eigene Keks-Dose & Prinzenrollen-Tracker!
                </span>
                <p className="text-stone-600 leading-snug">
                  Zählt Kekse ab sofort direkt nach Stückzahl – 1 Prinzenrolle (~95 kcal), 2 Kekse oder Schoko-Cookies mit einem einzigen Fingertipp verbuchen!
                </p>
              </div>
            </div>

            {/* 4. Magic Voice Behälter-Assistent */}
            <div className="p-3 bg-indigo-50/80 border border-indigo-200/90 rounded-2xl flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs font-bold text-base">
                🎙️
              </div>
              <div className="text-xs space-y-0.5">
                <span className="font-extrabold text-indigo-950 block">
                  Magic Voice: „Erstelle einen Behälter rund um Kekse...“
                </span>
                <p className="text-stone-600 leading-snug">
                  Sprecht einfach: <em>„Erstelle einen Behälter für Kekse, beginne mit der Prinzenrolle“</em> oder <em>„Füge zur Schokolade Milka-Haselnuss hinzu“</em> – die KI ordnet den Behälter zu, berechnet die Grammzahlen und speichert alles sofort!
                </p>
              </div>
            </div>

            {/* 5. Eigene Standards & Ausblenden */}
            <div className="p-3 bg-rose-50/80 border border-rose-200/90 rounded-2xl flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-2xs font-bold text-base">
                ⭐
              </div>
              <div className="text-xs space-y-0.5">
                <span className="font-extrabold text-rose-950 block">
                  Eigene Standards merken & Vorgaben aufräumen
                </span>
                <p className="text-stone-600 leading-snug">
                  Eigene Naschereien mit 1 Klick als Standard festlegen oder ungeliebte Vorgaben einfach über den Papierkorb aus eurer Übersicht entfernen!
                </p>
              </div>
            </div>

            {/* 6. Sicherer Gerätewechsel & Notfall-Backup */}
            <div className="p-3 bg-emerald-50/80 border border-emerald-200/90 rounded-2xl flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs font-bold text-base">
                🔄
              </div>
              <div className="text-xs space-y-0.5">
                <span className="font-extrabold text-emerald-950 block">
                  Sicherer 10-Tage-Gerätewechsel & Smart Merge
                </span>
                <p className="text-stone-600 leading-snug">
                  Handy in Reparatur? Exportiert den aktuellen Stand aufs Leihgerät und führt die neuen Tage später zerstörungsfrei und ohne Datenverlust wieder zusammen!
                </p>
              </div>
            </div>
          </div>

          <div className="p-3 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 rounded-2xl border border-emerald-200/80 text-center text-xs font-bold text-emerald-900">
            🎉 Viel Spaß mit der nagelneuen Version 1.8!
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-stone-100 bg-stone-50/60 flex flex-col sm:flex-row gap-2 shrink-0">
          <button
            type="button"
            onClick={handleTryMagic}
            className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-700 hover:to-indigo-700 text-white font-bold text-xs shadow-soft transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
          >
            <Sparkles className="w-4 h-4" />
            <span>Magic Button jetzt ausprobieren!</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="py-3 px-4 rounded-2xl bg-white border border-stone-200 hover:bg-stone-100 text-stone-700 font-bold text-xs transition-colors cursor-pointer"
          >
            Verstanden & Los!
          </button>
        </div>

      </div>
    </div>
  );
};
