import { db, type WaterLog } from '../db/db';
import { Droplet, Plus, RotateCcw } from 'lucide-react';

interface WaterTrackerProps {
  selectedDate: string;
  waterGoal?: number; // default 2500
  logs: WaterLog[];
}

export const WaterTracker = ({
  selectedDate,
  waterGoal = 2500,
  logs,
}: WaterTrackerProps) => {
  const totalWater = logs.reduce((sum, item) => sum + (item.amount || 0), 0);
  const percentage = Math.min(100, Math.round((totalWater / waterGoal) * 100));

  const addWater = async (amount: number) => {
    await db.waterLogs.add({
      date: selectedDate,
      amount,
      timestamp: Date.now(),
    });
  };

  const removeLast = async () => {
    const last = logs[logs.length - 1];
    if (last && last.id !== undefined) {
      await db.waterLogs.delete(last.id);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-5 shadow-card border border-surface-border">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500 border border-blue-100">
            <Droplet className="w-5 h-5 fill-blue-400 text-blue-500" />
          </div>
          <div>
            <h4 className="font-bold text-stone-800 text-sm">Wasserhaushalt</h4>
            <span className="text-[11px] text-stone-400">
              Ziel: {(waterGoal / 1000).toFixed(1)} Liter
            </span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-base font-extrabold text-blue-600">
            {(totalWater / 1000).toFixed(2)}{' '}
            <span className="text-xs font-normal text-stone-400">L</span>
          </span>
          <div className="text-[10px] text-stone-400">{percentage}% erreicht</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-blue-50 rounded-full h-3 overflow-hidden p-0.5 mb-4 border border-blue-100/50">
        <div
          className="bg-gradient-to-r from-blue-400 to-cyan-400 h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Quick Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => addWater(250)}
          className="flex-1 py-2 px-3 rounded-2xl bg-blue-50/80 hover:bg-blue-100/80 border border-blue-100 text-blue-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+250 ml (Glas)</span>
        </button>

        <button
          onClick={() => addWater(500)}
          className="flex-1 py-2 px-3 rounded-2xl bg-blue-50/80 hover:bg-blue-100/80 border border-blue-100 text-blue-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+500 ml (Flasche)</span>
        </button>

        {logs.length > 0 && (
          <button
            onClick={removeLast}
            className="p-2 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-500 transition-colors"
            title="Letzten Eintrag rückgängig machen"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
