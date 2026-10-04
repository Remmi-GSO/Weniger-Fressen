import { BookOpen, Timer, Scale, Settings, Mic, Sparkles } from 'lucide-react';

export type NavTab = 'diary' | 'fasting' | 'weight' | 'settings';

interface BottomNavProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onVoiceMealClick?: () => void;
  onQuickAddClick?: () => void;
}

export const BottomNav = ({
  currentTab,
  onTabChange,
  onVoiceMealClick,
  onQuickAddClick,
}: BottomNavProps) => {
  const handleCentralClick = onVoiceMealClick || onQuickAddClick || (() => {});

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-surface-border px-4 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-lg">
      <div className="max-w-md mx-auto flex items-center justify-around relative">
        
        {/* Tagebuch */}
        <button
          onClick={() => onTabChange('diary')}
          className={`flex flex-col items-center py-1 px-3 rounded-2xl transition-all ${
            currentTab === 'diary'
              ? 'text-emerald-700 font-bold'
              : 'text-stone-400 hover:text-stone-600'
          }`}
        >
          <div className={`p-1 rounded-xl transition-all ${currentTab === 'diary' ? 'bg-emerald-50' : ''}`}>
            <BookOpen className="w-5 h-5" />
          </div>
          <span className="text-[11px] mt-0.5">Tagebuch</span>
        </button>

        {/* Fasten */}
        <button
          onClick={() => onTabChange('fasting')}
          className={`flex flex-col items-center py-1 px-3 rounded-2xl transition-all ${
            currentTab === 'fasting'
              ? 'text-purple-700 font-bold'
              : 'text-stone-400 hover:text-stone-600'
          }`}
        >
          <div className={`p-1 rounded-xl transition-all ${currentTab === 'fasting' ? 'bg-purple-50' : ''}`}>
            <Timer className="w-5 h-5" />
          </div>
          <span className="text-[11px] mt-0.5">Fasten</span>
        </button>

        {/* Floating AI Voice Meal Button in the middle */}
        <button
          onClick={handleCentralClick}
          className="group relative -top-5 w-13 h-13 rounded-full bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-700 hover:to-teal-700 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-emerald-600/35 border-4 border-white transition-all transform hover:scale-105 cursor-pointer"
          title="Mahlzeit direkt einsprechen (KI)"
          aria-label="Mahlzeit direkt per Sprache einsprechen"
        >
          <div className="relative flex items-center justify-center">
            <Mic className="w-6 h-6 stroke-[2.2] transition-transform group-hover:scale-110" />
            <Sparkles className="w-2.5 h-2.5 text-amber-300 absolute -top-1 -right-2 animate-pulse" />
          </div>
        </button>

        {/* Gewicht */}
        <button
          onClick={() => onTabChange('weight')}
          className={`flex flex-col items-center py-1 px-3 rounded-2xl transition-all ${
            currentTab === 'weight'
              ? 'text-emerald-700 font-bold'
              : 'text-stone-400 hover:text-stone-600'
          }`}
        >
          <div className={`p-1 rounded-xl transition-all ${currentTab === 'weight' ? 'bg-emerald-50' : ''}`}>
            <Scale className="w-5 h-5" />
          </div>
          <span className="text-[11px] mt-0.5">Gewicht</span>
        </button>

        {/* Einstellungen */}
        <button
          onClick={() => onTabChange('settings')}
          className={`flex flex-col items-center py-1 px-3 rounded-2xl transition-all ${
            currentTab === 'settings'
              ? 'text-emerald-700 font-bold'
              : 'text-stone-400 hover:text-stone-600'
          }`}
        >
          <div className={`p-1 rounded-xl transition-all ${currentTab === 'settings' ? 'bg-emerald-50' : ''}`}>
            <Settings className="w-5 h-5" />
          </div>
          <span className="text-[11px] mt-0.5">Profil</span>
        </button>

      </div>
    </div>
  );
};
