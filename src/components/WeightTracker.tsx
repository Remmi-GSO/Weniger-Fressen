import { useState } from 'react';
import { db, type WeightLog, type UserProfile } from '../db/db';
import { Scale, Plus, TrendingDown, Target } from 'lucide-react';

interface WeightTrackerProps {
  logs: WeightLog[];
  userProfile?: UserProfile | null;
}

export const WeightTracker: React.FC<WeightTrackerProps> = ({ logs, userProfile }) => {
  const [newWeight, setNewWeight] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sortedLogs = [...logs].sort((a, b) => b.timestamp - a.timestamp);
  const currentWeight = sortedLogs[0]?.weight || userProfile?.weight || 75;
  const targetWeight = userProfile?.targetWeight || 68;
  const startWeight = sortedLogs[sortedLogs.length - 1]?.weight || currentWeight;
  const totalLost = Math.round((startWeight - currentWeight) * 10) / 10;
  const remaining = Math.round((currentWeight - targetWeight) * 10) / 10;

  const handleLogWeight = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(newWeight);
    if (!val || val <= 30 || val >= 300) return;

    setIsSubmitting(true);
    const today = new Date().toISOString().split('T')[0];

    // Check if entry for today exists
    const existing = await db.weightLogs.where({ date: today }).first();
    if (existing && existing.id !== undefined) {
      await db.weightLogs.update(existing.id, { weight: val, timestamp: Date.now() });
    } else {
      await db.weightLogs.add({ date: today, weight: val, timestamp: Date.now() });
    }

    // Also update current profile weight
    if (userProfile) {
      await db.userProfile.update('current', { weight: val });
    }

    setNewWeight('');
    setIsSubmitting(false);
  };

  // Prepare simple SVG mini graph for the last 7 entries
  const lastEntries = [...logs].sort((a, b) => a.timestamp - b.timestamp).slice(-7);
  const minW = Math.min(...lastEntries.map((l) => l.weight), targetWeight) - 0.5;
  const maxW = Math.max(...lastEntries.map((l) => l.weight), startWeight) + 0.5;
  const rangeW = maxW - minW || 1;

  return (
    <div className="bg-white rounded-3xl p-6 shadow-card border border-surface-border space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-stone-800 text-sm">Gewichtsverlauf</h4>
            <p className="text-xs text-stone-400">Verfolge deinen echten Fortschritt</p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-2xl font-black text-stone-800">{currentWeight}</span>
          <span className="text-xs font-semibold text-stone-400 ml-1">kg</span>
        </div>
      </div>

      {/* Progress Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3.5 bg-emerald-50/70 border border-emerald-100 rounded-2xl">
          <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-semibold mb-1">
            <TrendingDown className="w-4 h-4 text-emerald-600" />
            <span>Abgenommen</span>
          </div>
          <div className="text-lg font-black text-emerald-700">
            {totalLost > 0 ? `-${totalLost} kg` : `${totalLost} kg`}
          </div>
          <span className="text-[10px] text-stone-400">Seit Aufzeichnungsbeginn</span>
        </div>

        <div className="p-3.5 bg-stone-50 border border-stone-200/60 rounded-2xl">
          <div className="flex items-center gap-1.5 text-xs text-stone-600 font-semibold mb-1">
            <Target className="w-4 h-4 text-emerald-600" />
            <span>Bis zum Ziel</span>
          </div>
          <div className="text-lg font-black text-stone-800">
            {remaining > 0 ? `${remaining} kg` : 'Ziel erreicht! 🎉'}
          </div>
          <span className="text-[10px] text-stone-400">Wunschgewicht: {targetWeight} kg</span>
        </div>
      </div>

      {/* Mini SVG Trend Line */}
      {lastEntries.length > 1 && (
        <div className="pt-2">
          <div className="flex justify-between text-[11px] text-stone-400 mb-2">
            <span>Trend der letzten {lastEntries.length} Wiegungen</span>
            <span>Ziel: {targetWeight} kg</span>
          </div>
          <div className="h-28 w-full bg-stone-50/70 rounded-2xl p-2 border border-stone-100 flex items-end justify-between relative overflow-hidden">
            {/* SVG curve */}
            <svg className="w-full h-full overflow-visible">
              {/* Target line */}
              <line
                x1="0%"
                y1={`${100 - ((targetWeight - minW) / rangeW) * 80}%`}
                x2="100%"
                y2={`${100 - ((targetWeight - minW) / rangeW) * 80}%`}
                stroke="#10B981"
                strokeDasharray="4 4"
                strokeWidth="1.5"
                opacity="0.4"
              />

              {/* Data points and line */}
              <polyline
                fill="none"
                stroke="#10B981"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={lastEntries
                  .map((entry, idx) => {
                    const x = (idx / (lastEntries.length - 1)) * 90 + 5;
                    const y = 90 - ((entry.weight - minW) / rangeW) * 75;
                    return `${x}%,${y}%`;
                  })
                  .join(' ')}
              />

              {lastEntries.map((entry, idx) => {
                const x = (idx / (lastEntries.length - 1)) * 90 + 5;
                const y = 90 - ((entry.weight - minW) / rangeW) * 75;
                return (
                  <circle
                    key={entry.id || idx}
                    cx={`${x}%`}
                    cy={`${y}%`}
                    r="4"
                    fill="#10B981"
                    stroke="#FFFFFF"
                    strokeWidth="2"
                  />
                );
              })}
            </svg>
          </div>
        </div>
      )}

      {/* Log Today Weight Form */}
      <form onSubmit={handleLogWeight} className="pt-1 flex gap-2">
        <div className="relative flex-1">
          <input
            type="number"
            step="0.1"
            min="30"
            max="300"
            required
            placeholder="Neues Gewicht eintragen (z. B. 74.2)"
            value={newWeight}
            onChange={(e) => setNewWeight(e.target.value)}
            className="w-full py-2.5 px-4 rounded-2xl border border-stone-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-sm font-semibold text-stone-800"
          />
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">kg</span>
        </div>
        <button
          type="submit"
          disabled={!newWeight || isSubmitting}
          className="py-2.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm shadow-soft transition-all flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Speichern</span>
        </button>
      </form>
    </div>
  );
};
