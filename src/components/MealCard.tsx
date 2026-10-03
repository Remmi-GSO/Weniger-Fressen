import { db, type DiaryEntry, type MealType } from '../db/db';
import { Plus, Trash2, Pencil, Mic } from 'lucide-react';

interface MealCardProps {
  mealType: MealType;
  title: string;
  icon: string;
  recommendedKcal?: number;
  entries: DiaryEntry[];
  onAddClick: (mealType: MealType) => void;
  onSnackClick?: () => void;
  onAiClick?: (mealType: MealType) => void;
  onEditEntry?: (entry: DiaryEntry) => void;
}

const reasonLabels: Record<string, { label: string; bg: string; text: string }> = {
  hunger: { label: 'Hunger', bg: 'bg-emerald-100', text: 'text-emerald-700' },
  cravings: { label: 'Gelüste', bg: 'bg-amber-100', text: 'text-amber-700' },
  stress: { label: 'Stress', bg: 'bg-rose-100', text: 'text-rose-700' },
  social: { label: 'Gemeinschaft', bg: 'bg-purple-100', text: 'text-purple-700' },
};

export const MealCard: React.FC<MealCardProps> = ({
  mealType,
  title,
  icon,
  recommendedKcal,
  entries,
  onAddClick,
  onSnackClick,
  onAiClick,
  onEditEntry,
}) => {
  const totalKcal = entries.reduce((sum, item) => sum + (item.calories || 0), 0);
  const totalProtein = entries.reduce((sum, item) => sum + (item.protein || 0), 0);
  const totalCarbs = entries.reduce((sum, item) => sum + (item.carbs || 0), 0);
  const totalFat = entries.reduce((sum, item) => sum + (item.fat || 0), 0);

  const handleDelete = async (id?: number) => {
    if (id !== undefined) {
      await db.diaryEntries.delete(id);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-5 shadow-card border border-surface-border transition-all">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-stone-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50/80 flex items-center justify-center text-xl shadow-sm border border-emerald-100/50">
            {icon}
          </div>
          <div>
            <h4 className="font-bold text-stone-800 text-sm">{title}</h4>
            {recommendedKcal ? (
              <span className="text-[11px] text-stone-400">
                Richtwert: ~{recommendedKcal} kcal
              </span>
            ) : null}
          </div>
        </div>

        <div className="text-right">
          <div className="text-base font-extrabold text-stone-800">
            {totalKcal} <span className="text-xs font-normal text-stone-400">kcal</span>
          </div>
          {totalProtein > 0 && (
            <div className="text-[10px] text-stone-400">
              P: {Math.round(totalProtein)}g • C: {Math.round(totalCarbs)}g • F: {Math.round(totalFat)}g
            </div>
          )}
        </div>
      </div>

      {/* Entries List */}
      {entries.length > 0 ? (
        <div className="divide-y divide-stone-50 py-1">
          {entries.map((item) => (
            <div
              key={item.id}
              onClick={() => onEditEntry?.(item)}
              className="py-2.5 flex items-center justify-between text-xs group hover:bg-stone-50/80 px-2 -mx-1 rounded-2xl transition-all cursor-pointer"
              title="Antippen, um Menge oder Kalorien nachträglich zu bearbeiten"
            >
              <div className="flex-1 pr-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-semibold text-stone-800 group-hover:text-emerald-800 transition-colors">
                    {item.name}
                  </span>
                  {item.amount && item.amount > 0 && (
                    <span className="text-[10px] text-stone-400 font-medium">
                      ({item.amount}{item.unit || 'g'})
                    </span>
                  )}
                  {item.isSnackNibble && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded-md font-bold bg-pink-100 text-pink-900 border border-pink-200/60">
                      🍫 Nascherei
                    </span>
                  )}
                  {item.reason && reasonLabels[item.reason] && (
                    <span className={`text-[9px] px-1.5 py-0.2 rounded-md font-semibold ${reasonLabels[item.reason].bg} ${reasonLabels[item.reason].text}`}>
                      {reasonLabels[item.reason].label}
                    </span>
                  )}
                </div>
                {(item.protein > 0 || item.carbs > 0 || item.fat > 0) && (
                  <div className="text-[10px] text-stone-400 mt-0.5">
                    {item.protein > 0 ? `P: ${item.protein}g ` : ''}
                    {item.carbs > 0 ? `K: ${item.carbs}g ` : ''}
                    {item.fat > 0 ? `F: ${item.fat}g` : ''}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="font-extrabold text-stone-800 group-hover:text-emerald-700 transition-colors">
                  {item.calories} kcal
                </span>
                {onEditEntry && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditEntry(item);
                    }}
                    className="p-1 rounded-lg text-stone-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                    title="Eintrag bearbeiten"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(item.id);
                  }}
                  className="opacity-70 group-hover:opacity-100 text-stone-300 hover:text-rose-500 p-1 rounded-lg hover:bg-rose-50 transition-all"
                  title="Eintrag löschen"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-3 text-center text-xs text-stone-400">
          Noch nichts für {title.toLowerCase()} eingetragen
        </div>
      )}

      {/* Add Button(s) */}
      <div className="pt-2 flex flex-wrap gap-2">
        {onAiClick && (
          <button
            type="button"
            onClick={() => onAiClick(mealType)}
            className="flex-1 py-2.5 px-3 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 border border-emerald-200/80 text-emerald-800 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs min-w-[125px]"
            title="Mahlzeit per Mikrofon einsprechen oder Foto machen"
          >
            <Mic className="w-3.5 h-3.5 text-emerald-600" />
            <span>🎙️ Einsprechen / Foto</span>
          </button>
        )}
        {mealType === 'snack' && onSnackClick && (
          <button
            type="button"
            onClick={onSnackClick}
            className="flex-1 py-2.5 px-3 rounded-2xl bg-gradient-to-r from-pink-50 to-rose-50 hover:from-pink-100 hover:to-rose-100 border border-pink-200/80 text-pink-900 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs min-w-[110px]"
          >
            <span>🍫</span>
            <span>Nascherei</span>
          </button>
        )}
        <button
          type="button"
          onClick={() => onAddClick(mealType)}
          className={`py-2.5 px-3 rounded-2xl bg-stone-50 hover:bg-emerald-50/70 border border-stone-100 hover:border-emerald-200/60 text-stone-600 hover:text-emerald-700 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
            onAiClick || (mealType === 'snack' && onSnackClick) ? 'flex-1 min-w-[120px]' : 'w-full'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{onAiClick ? 'Manuell suchen' : 'Eintrag hinzufügen'}</span>
        </button>
      </div>
    </div>
  );
};
