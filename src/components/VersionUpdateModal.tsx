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
                🚀 UPDATE • VERSION {APP_VERSION}
              </span>
              <h3 className="text-xl font-black tracking-tight leading-tight pt-1">
                Erlebt euer Magic-Wunder! ✨
              </h3>
              <p className="text-xs text-white/90 font-medium">
                Der Magic Button kann jetzt alles – ihr müsst es ihm nur genau sagen!
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

        {/* Scrollable Content Body with 5 Magic Superpowers */}
        <div className="p-5 overflow-y-auto space-y-3.5 text-stone-700 flex-1">
          <p className="text-xs font-semibold text-stone-600 leading-relaxed bg-stone-50 p-3 rounded-2xl border border-stone-200/80">
            Ob gesprochen oder getippt: Der zentrale <strong>Magic Button</strong> ordnet eure Wünsche ab sofort vollautomatisch in die richtige Kategorie ein!
          </p>

          <div className="space-y-2.5">
            {/* 1. Neues Rezept */}
            <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-2xl flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs font-bold text-sm">
                🍲
              </div>
              <div className="text-xs space-y-0.5">
                <span className="font-extrabold text-amber-950 block">
                  „Wollt ihr ein neues Rezept?“
                </span>
                <p className="text-stone-600 leading-snug">
                  Sagt z. B.: <em>„Erstelle mir ein Rezept mit Dinkelmehl und 400 kcal“</em> – die KI berechnet die Zutaten und ihr könnt es direkt im Rezeptbuch speichern!
                </p>
              </div>
            </div>

            {/* 2. Sportliche Aktivität tracken */}
            <div className="p-3 bg-orange-50/70 border border-orange-200/80 rounded-2xl flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-2xs font-bold text-sm">
                🔥
              </div>
              <div className="text-xs space-y-0.5">
                <span className="font-extrabold text-orange-950 block">
                  „Wollt ihr eine sportliche Aktivität tracken?“
                </span>
                <p className="text-stone-600 leading-snug">
                  Sagt z. B.: <em>„40 Minuten zügig auf dem Crosstrainer“</em> – Dauer und Kalorien werden berechnet und mit 1 Klick in eure Aktivitäten geloggt!
                </p>
              </div>
            </div>

            {/* 3. Frage zum Zucker / Ernährungswissen */}
            <div className="p-3 bg-indigo-50/70 border border-indigo-200/80 rounded-2xl flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs font-bold text-sm">
                🍇
              </div>
              <div className="text-xs space-y-0.5">
                <span className="font-extrabold text-indigo-950 block">
                  „Habt ihr eine Frage zum Zucker in eurem Frühstück?“
                </span>
                <p className="text-stone-600 leading-snug">
                  Fragt z. B.: <em>„Wie kommt der Zucker in meine Johannisbeeren?“</em> – ihr erhaltet eine ausführliche Ernährungs-Wissenskarte ohne abgeschnittenen Text!
                </p>
              </div>
            </div>

            {/* 4. Lebensmittel eintragen */}
            <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs font-bold text-sm">
                🍽️
              </div>
              <div className="text-xs space-y-0.5">
                <span className="font-extrabold text-emerald-950 block">
                  „Ihr wollt folgendes Lebensmittel für euer Essen eintragen?“
                </span>
                <p className="text-stone-600 leading-snug">
                  Sprecht es einfach ein: <em>„2 Scheiben selbstgebackenes Brot mit Butter und Gouda“</em> – eigene Rezepte & Brote werden bevorzugt erkannt!
                </p>
              </div>
            </div>

            {/* 5. Snack-Inspiration */}
            <div className="p-3 bg-teal-50/70 border border-teal-200/80 rounded-2xl flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-2xs font-bold text-sm">
                💡
              </div>
              <div className="text-xs space-y-0.5">
                <span className="font-extrabold text-teal-950 block">
                  „Oder Snack-Inspiration für euer Restbudget?“
                </span>
                <p className="text-stone-600 leading-snug">
                  Fragt: <em>„Was kann ich für meine restlichen 250 kcal snacken?“</em> – passend zu Kalorien- und Protein-Resten!
                </p>
              </div>
            </div>
          </div>

          <div className="p-3 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 rounded-2xl border border-emerald-200/80 text-center text-xs font-bold text-emerald-900">
            🎯 Dann sagt es ihm! Alles an einem einzigen Ort!
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
