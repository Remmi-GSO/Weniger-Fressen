import { useState, useEffect } from 'react';
import { db, type FastingSession } from '../db/db';
import { Play, Square, Timer } from 'lucide-react';
import { CircularProgress } from './CircularProgress';
import confetti from 'canvas-confetti';

interface FastingTrackerProps {
  currentSession?: FastingSession | null;
}

export const FastingTracker: React.FC<FastingTrackerProps> = ({ currentSession }) => {
  const [selectedDuration, setSelectedDuration] = useState<number>(16); // 16:8 standard
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  // Update timer every second when active
  useEffect(() => {
    if (!currentSession?.isActive) {
      setElapsedSeconds(0);
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const elapsed = Math.floor((now - currentSession.startTime) / 1000);
      setElapsedSeconds(Math.max(0, elapsed));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [currentSession]);

  const targetSeconds = (currentSession?.targetDurationHours || selectedDuration) * 3600;
  const progressPercent = Math.min(100, Math.round((elapsedSeconds / targetSeconds) * 100));

  const formatTime = (totalSec: number) => {
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const startFasting = async () => {
    // End any lingering active sessions
    await db.fastingSessions.filter((s) => s.isActive).modify({ isActive: false, endTime: Date.now() });

    await db.fastingSessions.add({
      startTime: Date.now(),
      targetDurationHours: selectedDuration,
      isActive: true,
    });
  };

  const stopFasting = async () => {
    if (!currentSession?.id) return;
    
    // Check if target was reached to show confetti
    if (elapsedSeconds >= targetSeconds) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#8B5CF6', '#A78BFA', '#C4B5FD'],
      });
    }

    await db.fastingSessions.update(currentSession.id, {
      isActive: false,
      endTime: Date.now(),
    });
  };

  // Determine current fasting phase
  const getFastingPhase = () => {
    const hours = elapsedSeconds / 3600;
    if (hours < 4) return { title: 'Blutzucker stabilisiert sich', desc: 'Verdauung ruht allmählich', color: 'text-stone-600' };
    if (hours < 12) return { title: 'Glykogenspeicher leeren sich', desc: 'Körper schaltet auf Fettverbrennung um', color: 'text-amber-600' };
    if (hours < 16) return { title: 'Fettverbrennung & Ketose', desc: 'Optimaler Fettabbau aktiv', color: 'text-emerald-600' };
    return { title: 'Autophagie & Zellerneuerung', desc: 'Maximale Zellgesundheit erreicht! 🎉', color: 'text-purple-600' };
  };

  const phase = getFastingPhase();

  return (
    <div className="bg-white rounded-3xl p-6 shadow-card border border-surface-border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 border border-purple-100">
            <Timer className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-stone-800 text-sm">Intervallfasten</h4>
            <p className="text-xs text-stone-400">
              {currentSession?.isActive ? `${currentSession.targetDurationHours}:8 Modus aktiv` : 'Wähle dein Zeitfenster'}
            </p>
          </div>
        </div>

        {/* Duration picker buttons if not fasting */}
        {!currentSession?.isActive && (
          <div className="flex gap-1 bg-stone-100 p-1 rounded-2xl">
            {[14, 16, 18].map((hours) => (
              <button
                key={hours}
                onClick={() => setSelectedDuration(hours)}
                className={`py-1 px-2.5 rounded-xl text-xs font-bold transition-all ${
                  selectedDuration === hours
                    ? 'bg-white text-purple-700 shadow-sm'
                    : 'text-stone-500 hover:text-stone-700'
                }`}
              >
                {hours}:8
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Timer Circle */}
      <div className="flex flex-col items-center justify-center py-4">
        <CircularProgress
          percentage={currentSession?.isActive ? progressPercent : 0}
          size={190}
          strokeWidth={14}
          colorClass="stroke-purple-500"
          bgColorClass="stroke-purple-100"
        >
          {currentSession?.isActive ? (
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block">Gefastet</span>
              <span className="text-2xl font-black text-stone-800 tracking-tight font-mono">
                {formatTime(elapsedSeconds)}
              </span>
              <span className="text-[11px] text-purple-600 font-bold block">
                {progressPercent}% von {currentSession.targetDurationHours}h
              </span>
            </div>
          ) : (
            <div className="space-y-1">
              <span className="text-2xl">⏳</span>
              <span className="text-sm font-bold text-stone-700 block">Bereit für den Fastenstart?</span>
              <span className="text-xs text-stone-400 block">{selectedDuration} Stunden Ziel</span>
            </div>
          )}
        </CircularProgress>

        {/* Phase Info */}
        {currentSession?.isActive && (
          <div className="mt-4 p-3 bg-purple-50/70 border border-purple-100 rounded-2xl text-center w-full max-w-xs">
            <span className={`text-xs font-bold ${phase.color} block`}>
              {phase.title}
            </span>
            <span className="text-[11px] text-stone-500 mt-0.5 block">
              {phase.desc}
            </span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-3">
        {currentSession?.isActive ? (
          <button
            onClick={stopFasting}
            className="w-full py-3.5 px-4 rounded-2xl bg-rose-50 hover:bg-rose-100/80 border border-rose-200 text-rose-700 font-bold text-sm transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
          >
            <Square className="w-4 h-4 fill-rose-600 text-rose-600" />
            <span>Fasten beenden & Mahlzeit öffnen</span>
          </button>
        ) : (
          <button
            onClick={startFasting}
            className="w-full py-3.5 px-4 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-soft transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Fasten jetzt starten ({selectedDuration}h)</span>
          </button>
        )}
      </div>
    </div>
  );
};
