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
                🚀 UPDATE • VERSION {APP_VERSION}
              </span>
              <h3 className="text-xl font-black tracking-tight leading-tight pt-1">
                Kategorien-Manager, Dropdown & Supermärkte! 🥳🥦
              </h3>
              <p className="text-xs text-white/95 font-medium">
                Rezept-Kategorien frei anpassen, schlankes Rubriken-Dropdown, Akkordeon-Eigenschaften & Iglo/Supermarkt-Kalorienfix!
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

        {/* Scrollable Content Body with Version 2.1 Highlights */}
        <div className="p-5 overflow-y-auto space-y-3 text-stone-700 flex-1">
          <p className="text-xs font-semibold text-stone-600 leading-relaxed bg-amber-50/80 p-3 rounded-2xl border border-amber-200/80">
            Willkommen zur <strong>Version 2.1</strong>! Wir bringen euch maximale Übersicht: Rezept-Kategorien frei anpassen & filtern ohne horizontales Scrollen, einklappbare Akkordeon-Einstellungen, Profilbilder mit Community-Info und verifizierte deutsche Supermarkt-Lebensmittel!
          </p>

          <div className="space-y-2.5">
            {/* 1. Kategorien-Dropdown */}
            <div className="p-3 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border border-amber-200/90 rounded-2xl flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs font-bold text-base">
                📂
              </div>
              <div className="text-xs space-y-0.5">
                <span className="font-extrabold text-stone-900 block">
                  Neues Dropdown für Rezept-Rubriken
                </span>
                <p className="text-stone-600 leading-snug">
                  Kein langes horizontales Scrollen mehr! Wähle alle Rubriken, Favoriten und Community-Rezepte blitzschnell über das aufgeräumte Dropdown-Menü.
                </p>
              </div>
            </div>

            {/* 2. Kategorien frei anpassen & anlegen */}
            <div className="p-3 bg-emerald-50/80 border border-emerald-200/90 rounded-2xl flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs font-bold text-base">
                ✏️
              </div>
              <div className="text-xs space-y-0.5">
                <span className="font-extrabold text-emerald-950 block">
                  Rezept-Kategorien frei verwalten & neu anlegen
                </span>
                <p className="text-stone-600 leading-snug">
                  Erstelle eigene Rubriken (z. B. Airfryer, Suppen, Desserts), passe Emojis & Namen an oder lösche ungenutzte Rubriken direkt in den Eigenschaften.
                </p>
              </div>
            </div>

            {/* 3. Akkordeon-Eigenschaften */}
            <div className="p-3 bg-teal-50/80 border border-teal-200/90 rounded-2xl flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-2xs font-bold text-base">
                📑
              </div>
              <div className="text-xs space-y-0.5">
                <span className="font-extrabold text-teal-950 block">
                  Aufgeräumte Akkordeon-Eigenschaften
                </span>
                <p className="text-stone-600 leading-snug">
                  Schluss mit endlosem Scrollen! Alle Einstellungen sind in 10 einklappbare Themenbereiche unterteilt – mit praktischen „Alle öffnen“ / „Alle schließen“-Buttons.
                </p>
              </div>
            </div>

            {/* 4. Supermärkte & Barcode-Fix */}
            <div className="p-3 bg-indigo-50/80 border border-indigo-200/90 rounded-2xl flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs font-bold text-base">
                🥦
              </div>
              <div className="text-xs space-y-0.5">
                <span className="font-extrabold text-indigo-950 block">
                  Deutsche Supermärkte & Tiefkühl-Kalorienfix
                </span>
                <p className="text-stone-600 leading-snug">
                  Edeka, Rewe, Lidl, Aldi, Iglo & Frosta mit echten Barcodes. Erkennt zubereitete Nährwerte (z. B. Iglo Prinzess-Bohnen 400g = 120 kcal) und berechnet Gesamtpackungen automatisch!
                </p>
              </div>
            </div>

            {/* 5. Community & Profilbilder */}
            <div className="p-3 bg-pink-50/80 border border-pink-200/90 rounded-2xl flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-pink-600 text-white flex items-center justify-center shrink-0 shadow-2xs font-bold text-base">
                🌐
              </div>
              <div className="text-xs space-y-0.5">
                <span className="font-extrabold text-pink-950 block">
                  Community-Rezepte mit Profilbild & Benachrichtigung
                </span>
                <p className="text-stone-600 leading-snug">
                  Persönliche Profilfotos oder Farb-Avatare im Rezeptbuch; Mitglieder werden sofort per Banner & NEU-Badge informiert, wenn ein neues Rezept eingepflegt wird!
                </p>
              </div>
            </div>
          </div>

          <div className="p-3 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10 rounded-2xl border border-amber-200/80 text-center text-xs font-bold text-amber-950">
            🎉 Viel Freude mit der neuen Version 2.1!
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
