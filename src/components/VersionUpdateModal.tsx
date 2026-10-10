import React, { useState, useEffect } from 'react';
import { Sparkles, X, ChevronDown, ChevronUp, Check } from 'lucide-react';
import confetti from 'canvas-confetti';
import { APP_VERSION } from '../config/version';

interface VersionUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenMagicAssistant: () => void;
}

interface FeatureHighlight {
  id: string;
  emoji: string;
  title: string;
  badge: string;
  short: string;
  details: string;
  colorBg: string;
  colorBorder: string;
  colorIcon: string;
  badgeBg: string;
  badgeText: string;
}

const HIGHLIGHTS: FeatureHighlight[] = [
  {
    id: 'dropdown',
    emoji: '📂',
    title: 'Neues Dropdown für Rezept-Rubriken',
    badge: 'Kompakt',
    short: 'Kein horizontales Scrollen mehr – blitzschnell zur Wunsch-Rubrik!',
    details:
      'Wähle alle Rubriken (Backen, Mahlzeiten, Snacks etc.), deine Favoriten und Community-Rezepte komfortabel über ein aufgeräumtes Dropdown-Menü mit Rezept-Zähler aus.',
    colorBg: 'bg-amber-50/70',
    colorBorder: 'border-amber-200/90',
    colorIcon: 'bg-amber-500 text-white',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-800',
  },
  {
    id: 'categories',
    emoji: '✏️',
    title: 'Rezept-Kategorien frei verwalten & neu anlegen',
    badge: 'Flexibel',
    short: 'Erstelle eigene Rubriken, ändere Namen & Emojis oder lösche Rubriken.',
    details:
      'Passe das Rezeptbuch deinen persönlichen Gewohnheiten an: Neue Rubriken wie z. B. „Airfryer“, „Suppen“ oder „Desserts“ anlegen, Symbole frei wählen und Rezepte flexibel zuordnen.',
    colorBg: 'bg-emerald-50/70',
    colorBorder: 'border-emerald-200/90',
    colorIcon: 'bg-emerald-600 text-white',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-800',
  },
  {
    id: 'accordion',
    emoji: '📑',
    title: 'Aufgeräumte Akkordeon-Eigenschaften',
    badge: 'Übersichtlich',
    short: 'Schluss mit endlosem Scrollen in den Einstellungen!',
    details:
      'Alle App-Einstellungen sind nun in 10 saubere, thematisch gegliederte Akkordeons unterteilt. Mit praktischen „Alle öffnen“ und „Alle schließen“-Schaltern behältst du stets den vollen Überblick.',
    colorBg: 'bg-teal-50/70',
    colorBorder: 'border-teal-200/90',
    colorIcon: 'bg-teal-600 text-white',
    badgeBg: 'bg-teal-100',
    badgeText: 'text-teal-800',
  },
  {
    id: 'supermarket',
    emoji: '🥦',
    title: 'Deutsche Supermärkte & Tiefkühl-Kalorienfix',
    badge: 'Iglo-Fix',
    short: 'Edeka, Rewe, Lidl, Aldi, Iglo & Frosta mit echten Nährwerten erfasst.',
    details:
      'Erkennt verzehrfertige Zubereitungen deutscher Markenprodukte zuverlässig (z. B. Iglo Prinzess-Bohnen 400g = 120 kcal statt fälschlicherweise 0 kcal) und berechnet Gesamtpackungen automatisch.',
    colorBg: 'bg-indigo-50/70',
    colorBorder: 'border-indigo-200/90',
    colorIcon: 'bg-indigo-600 text-white',
    badgeBg: 'bg-indigo-100',
    badgeText: 'text-indigo-800',
  },
  {
    id: 'community',
    emoji: '🌐',
    title: 'Community-Rezepte: Ausblenden & Admin-Löschung',
    badge: 'Moderation',
    short: 'Rezepte individuell verbergen oder global als Admin löschen.',
    details:
      'Jedes Mitglied kann fremde Rezepte nach Wunsch für sich selbst ausblenden. Als Administrator kannst du Rezepte global entfernen – die App lädt die bereinigte community-recipes.json zur Bereitstellung direkt herunter.',
    colorBg: 'bg-purple-50/70',
    colorBorder: 'border-purple-200/90',
    colorIcon: 'bg-purple-600 text-white',
    badgeBg: 'bg-purple-100',
    badgeText: 'text-purple-800',
  },
  {
    id: 'avatar_crop',
    emoji: '📸',
    title: 'Profilbild: Zoom, Zuschnitt & Galerie-Teilen',
    badge: 'Zuschnitt',
    short: 'Kreis-Ausschnitt, Zoom-Schieberegler & Teilen aus der System-Galerie.',
    details:
      'Mit dem neuen Foto-Editor kannst du Profilbilder stufenlos zoomen, passgenau verschieben und drehen. Zudem kannst du Bilder per Rechtsklick oder mobiler Galerie-Teilen-Funktion direkt an die App senden!',
    colorBg: 'bg-rose-50/70',
    colorBorder: 'border-rose-200/90',
    colorIcon: 'bg-rose-600 text-white',
    badgeBg: 'bg-rose-100',
    badgeText: 'text-rose-800',
  },
];

export const VersionUpdateModal: React.FC<VersionUpdateModalProps> = ({
  isOpen,
  onClose,
  onOpenMagicAssistant,
}) => {
  // Accordion state: by default, show the first item open
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({
    dropdown: true,
  });

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

  const toggleItem = (id: string) => {
    setOpenItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const toggleAll = (open: boolean) => {
    const next: Record<string, boolean> = {};
    HIGHLIGHTS.forEach((h) => {
      next[h.id] = open;
    });
    setOpenItems(next);
  };

  const handleTryMagic = () => {
    onClose();
    onOpenMagicAssistant();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-soft-xl border border-stone-100 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Celebration Header */}
        <div className="relative p-5 sm:p-6 bg-gradient-to-br from-amber-500 via-orange-500 to-rose-600 text-white overflow-hidden shrink-0">
          <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-white/10 blur-xl pointer-events-none" />
          <div className="absolute top-2 left-10 w-20 h-20 rounded-full bg-amber-300/20 blur-lg pointer-events-none" />

          <div className="relative z-10 flex items-start justify-between">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-[11px] font-black tracking-wide text-white border border-white/20 shadow-xs uppercase">
                🚀 UPDATE • VERSION {APP_VERSION}
              </span>
              <h3 className="text-xl font-black tracking-tight leading-tight pt-1">
                Kategorien-Manager, Dropdown & Bild-Zoom! 🥳📸
              </h3>
              <p className="text-xs text-white/95 font-medium">
                Rezept-Kategorien frei anpassen, Akkordeon-Menüs, Profilbild-Zuschnitt & Supermarkt-Präzision!
              </p>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors shrink-0 cursor-pointer"
              title="Schließen"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body with Accordion */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3 text-stone-700 flex-1">
          {/* Welcome note & Quick Accordion Controls */}
          <div className="p-3 bg-amber-50/80 rounded-2xl border border-amber-200/80 space-y-2 text-xs">
            <p className="font-medium text-stone-700 leading-relaxed">
              Tippe auf ein Thema, um die Details auszuklappen:
            </p>
            <div className="flex items-center justify-between pt-1 border-t border-amber-200/60 text-[11px] font-bold">
              <span className="text-stone-500">6 Neuerungen in Version {APP_VERSION}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleAll(true)}
                  className="text-amber-800 hover:text-amber-950 underline cursor-pointer"
                >
                  Alle ausklappen
                </button>
                <span className="text-stone-300">•</span>
                <button
                  type="button"
                  onClick={() => toggleAll(false)}
                  className="text-stone-500 hover:text-stone-700 underline cursor-pointer"
                >
                  Alle zuklappen
                </button>
              </div>
            </div>
          </div>

          {/* Accordion Highlights List */}
          <div className="space-y-2">
            {HIGHLIGHTS.map((item) => {
              const isOpen = Boolean(openItems[item.id]);

              return (
                <div
                  key={item.id}
                  className={`rounded-2xl border transition-all overflow-hidden ${item.colorBorder} ${
                    isOpen ? 'bg-white shadow-2xs' : `${item.colorBg} hover:opacity-95`
                  }`}
                >
                  {/* Clickable Header Button */}
                  <button
                    type="button"
                    onClick={() => toggleItem(item.id)}
                    className="w-full p-3 flex items-center justify-between text-left gap-2.5 cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-2xs font-bold text-base ${item.colorIcon}`}
                      >
                        {item.emoji}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-extrabold text-stone-900 text-xs leading-tight truncate">
                            {item.title}
                          </h4>
                          <span
                            className={`text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase shrink-0 ${item.badgeBg} ${item.badgeText}`}
                          >
                            {item.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-500 truncate mt-0.5">
                          {item.short}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 w-6 h-6 rounded-lg bg-stone-100 flex items-center justify-center text-stone-500">
                      {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </div>
                  </button>

                  {/* Expandable Body */}
                  {isOpen && (
                    <div className="px-3.5 pb-3.5 pt-1 text-xs text-stone-600 leading-relaxed border-t border-stone-100/90 animate-in fade-in duration-150 space-y-2">
                      <p>{item.details}</p>
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50/80 p-2 rounded-xl border border-emerald-100">
                        <Check className="w-3.5 h-3.5 shrink-0" />
                        <span>Ab sofort einsatzbereit & vollautomatisch aktiv</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="p-3 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10 rounded-2xl border border-amber-200/80 text-center text-xs font-bold text-amber-950">
            🎉 Viel Freude mit der neuen Version {APP_VERSION}!
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
