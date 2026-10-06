import { useState } from 'react';
import { db, type WeightLog, type UserProfile } from '../db/db';
import { Scale, Plus, TrendingDown, Target } from 'lucide-react';

interface WeightTrackerProps {
  logs: WeightLog[];
  userProfile?: UserProfile | null;
  onOpenNutritionReport?: () => void;
}

export const WeightTracker: React.FC<WeightTrackerProps> = ({ logs, userProfile, onOpenNutritionReport }) => {
  const [newWeight, setNewWeight] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sortedLogs = [...logs].sort((a, b) => b.timestamp - a.timestamp);
  const currentWeight = sortedLogs[0]?.weight || userProfile?.weight || 75;
  const isMaintainGoal = userProfile?.goalType === 'maintain_weight' || userProfile?.goalDeficit === 0;
  const targetWeight = userProfile?.targetWeight || (isMaintainGoal ? currentWeight : 68);
  const startWeight = sortedLogs[sortedLogs.length - 1]?.weight || currentWeight;
  const totalLost = Math.round((startWeight - currentWeight) * 10) / 10;
  const remaining = Math.round((currentWeight - targetWeight) * 10) / 10;

  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [editTargetWeight, setEditTargetWeight] = useState(String(targetWeight));

  const handleSaveTargetWeight = async () => {
    const val = parseFloat(editTargetWeight);
    if (!val || val <= 30 || val >= 300) return;
    const existingProf = await db.userProfile.get('current');
    if (existingProf) {
      await db.userProfile.update('current', { targetWeight: val });
    }
    setIsEditingTarget(false);
  };

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
    const existingProf = await db.userProfile.get('current');
    if (existingProf) {
      await db.userProfile.update('current', { weight: val });
    } else if (userProfile) {
      await db.userProfile.put({ ...userProfile, id: 'current', weight: val });
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

        <div className="p-3.5 bg-stone-50 border border-stone-200/60 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-stone-600 font-semibold mb-1">
              <Target className="w-4 h-4 text-emerald-600" />
              <span>{isMaintainGoal ? 'Ziel: Halten' : 'Bis zum Ziel'}</span>
            </div>
            <div className="text-lg font-black text-stone-800">
              {isMaintainGoal ? 'Stabil 🎉' : (remaining > 0 ? `${remaining} kg` : 'Ziel erreicht! 🎉')}
            </div>
          </div>

          {isEditingTarget ? (
            <div className="flex items-center gap-1.5 mt-1.5">
              <input
                type="number"
                step="0.5"
                min="35"
                max="200"
                value={editTargetWeight}
                onChange={(e) => setEditTargetWeight(e.target.value)}
                className="w-16 py-1 px-1.5 rounded-lg border border-stone-300 text-xs font-bold text-center bg-white"
              />
              <button
                type="button"
                onClick={handleSaveTargetWeight}
                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold shadow-2xs"
              >
                OK
              </button>
              <button
                type="button"
                onClick={() => setIsEditingTarget(false)}
                className="px-1.5 py-1 text-stone-400 hover:text-stone-600 text-[10px]"
              >
                ✕
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between text-[10px] text-stone-500 mt-1">
              <span>Wunsch: <strong className="text-stone-700">{targetWeight} kg</strong></span>
              <button
                type="button"
                onClick={() => {
                  setEditTargetWeight(String(targetWeight));
                  setIsEditingTarget(true);
                }}
                className="text-emerald-700 font-bold hover:underline"
              >
                Ändern ✏️
              </button>
            </div>
          )}
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
          className="py-2.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm shadow-soft transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Speichern</span>
        </button>
      </form>

      {/* Direct link to Multi-Day Interactive Trend Graphs */}
      {onOpenNutritionReport && (
        <button
          type="button"
          onClick={onOpenNutritionReport}
          className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200/80 hover:bg-emerald-100/60 text-emerald-900 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
        >
          <span>📈</span>
          <span>Interaktive Verlaufskurven (Gewicht, Kalorien & Makros) ansehen</span>
        </button>
      )}
    </div>
  );
};
