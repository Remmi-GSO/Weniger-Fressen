import { useState, useEffect } from 'react';
import { type UserProfile } from '../db/db';
import { generateMorningBriefing, type MorningBriefingData } from '../utils/morningBriefing';
import { X, Sparkles, ArrowRight, Sun, Award } from 'lucide-react';
import confetti from 'canvas-confetti';

interface MorningBriefingModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onOpenFullReport?: () => void;
  isPreview?: boolean;
}

export const MorningBriefingModal = ({
  isOpen,
  onClose,
  userProfile,
  onOpenFullReport,
  isPreview = false,
}: MorningBriefingModalProps) => {
  const [data, setData] = useState<MorningBriefingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      generateMorningBriefing(userProfile)
        .then((res) => {
          setData(res);
          setIsLoading(false);
          // Joyful light confetti on morning open
          if (res.status === 'deficit') {
            confetti({
              particleCount: 25,
              spread: 50,
              origin: { y: 0.6 },
              colors: ['#F59E0B', '#10B981', '#F97316'],
            });
          }
        })
        .catch(() => {
          setIsLoading(false);
        });
    }
  }, [isOpen, userProfile]);

  if (!isOpen) return null;

  const greetingName = userProfile.name ? userProfile.name.trim() : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-soft-xl border border-stone-100 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Sunrise Hero Header */}
        <div className="relative p-6 bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 text-white overflow-hidden shrink-0">
          {/* Subtle background glow circle */}
          <div className="absolute -right-8 -bottom-8 w-36 h-36 rounded-full bg-white/15 blur-xl pointer-events-none" />
          <div className="absolute top-2 left-10 w-20 h-20 rounded-full bg-amber-200/20 blur-lg pointer-events-none" />

          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/20 hover:bg-black/30 flex items-center justify-center text-white transition-colors cursor-pointer"
            title="Schließen"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="relative z-10 flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-2xl shadow-xs">
              🌅
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-wider bg-white/25 px-2.5 py-0.5 rounded-full">
                  Morgen-Briefing
                </span>
                {isPreview && (
                  <span className="text-[10px] font-bold bg-black/30 px-2 py-0.5 rounded-full">
                    Vorschau
                  </span>
                )}
              </div>
              <h2 className="text-xl font-black mt-1 tracking-tight leading-tight">
                {greetingName ? `Guten Morgen, ${greetingName}!` : 'Guten Morgen!'}
              </h2>
              <p className="text-xs text-amber-100/90 font-medium">
                Dein motivierender Start in den Tag
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {isLoading ? (
            <div className="py-12 text-center text-stone-400 space-y-2">
              <Sun className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
              <p className="text-xs font-semibold">Erstelle deinen Morgen-Rückblick...</p>
            </div>
          ) : data ? (
            <>
              {/* Yesterday Summary & Motivational Core */}
              <div className={`p-4 rounded-2xl border transition-all space-y-2.5 ${
                data.status === 'deficit'
                  ? 'bg-emerald-50/70 border-emerald-200/90'
                  : data.status === 'maintenance'
                  ? 'bg-amber-50/70 border-amber-200/90'
                  : data.status === 'surplus'
                  ? 'bg-orange-50/70 border-orange-200/90'
                  : 'bg-stone-50 border-stone-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-black text-xs text-stone-900">
                    <Award className={`w-4 h-4 ${
                      data.status === 'deficit' ? 'text-emerald-600' : 'text-amber-600'
                    }`} />
                    <span>{data.headline}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    data.status === 'deficit'
                      ? 'bg-emerald-100 text-emerald-900 font-extrabold'
                      : data.status === 'maintenance'
                      ? 'bg-amber-100 text-amber-900 font-extrabold'
                      : 'bg-stone-200 text-stone-700'
                  }`}>
                    Rückblick gestern
                  </span>
                </div>

                <p className="text-xs text-stone-700 leading-relaxed font-medium">
                  {data.motivationalMessage}
                </p>

                {data.movementMessage && (
                  <div className="pt-2 border-t border-stone-200/60 flex items-start gap-2 text-xs text-stone-600">
                    <span className="text-base select-none">🏃</span>
                    <span className="leading-snug">{data.movementMessage}</span>
                  </div>
                )}
              </div>

              {/* Yesterday Quick Stats Row */}
              {data.hasYesterdayEntries && (
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2.5 bg-stone-50 rounded-2xl border border-stone-200/80 text-center">
                    <span className="text-[10px] text-stone-400 font-bold block uppercase">Gegessen</span>
                    <span className="text-sm font-black text-stone-900 block mt-0.5">
                      {data.totalKcal} <span className="text-[10px] font-normal text-stone-500">kcal</span>
                    </span>
                  </div>
                  <div className="p-2.5 bg-orange-50/60 rounded-2xl border border-orange-200/80 text-center">
                    <span className="text-[10px] text-orange-950 font-bold block uppercase">Verbrannt</span>
                    <span className="text-sm font-black text-orange-950 block mt-0.5">
                      +{data.burnedKcal} <span className="text-[10px] font-normal text-orange-800">kcal</span>
                    </span>
                  </div>
                  <div className="p-2.5 bg-blue-50/60 rounded-2xl border border-blue-200/80 text-center">
                    <span className="text-[10px] text-blue-950 font-bold block uppercase">Wasser</span>
                    <span className="text-sm font-black text-blue-950 block mt-0.5">
                      {data.waterMl} <span className="text-[10px] font-normal text-blue-800">ml</span>
                    </span>
                  </div>
                </div>
              )}

              {/* Today's Mission & Budget Card */}
              <div className="p-4 bg-gradient-to-r from-amber-50/80 via-orange-50/50 to-amber-50/80 rounded-2xl border border-amber-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-amber-950 flex items-center gap-1.5 uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Dein Fokus für heute</span>
                  </span>
                  <span className="text-xs font-black text-amber-950 bg-amber-100/90 px-2 py-0.5 rounded-full border border-amber-200/70">
                    Budget: {data.todayTargetKcal} kcal
                  </span>
                </div>
                <div className="p-2.5 bg-white/90 rounded-xl border border-amber-200/70 text-xs text-stone-700 leading-snug flex items-start gap-2 shadow-2xs">
                  <span className="text-base select-none shrink-0 mt-0.5">💡</span>
                  <span>{data.todayTip}</span>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Action Buttons */}
        <div className="p-4 px-6 border-t border-stone-100 bg-stone-50/50 space-y-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 active:scale-[0.99] text-white font-extrabold text-sm shadow-soft transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Packen wir's an! 🚀</span>
          </button>

          {onOpenFullReport && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenFullReport();
              }}
              className="w-full py-2 px-3 text-xs font-bold text-stone-500 hover:text-stone-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Vollständigen Ernährungsbericht ansehen</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
