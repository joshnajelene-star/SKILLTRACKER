import React from 'react';
import { Flame, CheckCircle2, Circle, Sparkles, Award } from 'lucide-react';
import { Skill } from '../types';
import { getFormattedDate, getPastDates } from '../utils/storage';
import { triggerGoalCompletedConfetti } from '../utils/confetti';

interface DailyCheckinBannerProps {
  skills: Skill[];
  streak: number;
  darkMode: boolean;
  onToggleCheck: (skillId: string) => void;
}

export const DailyCheckinBanner: React.FC<DailyCheckinBannerProps> = ({
  skills,
  streak,
  darkMode,
  onToggleCheck,
}) => {
  const today = getFormattedDate();
  const past14Days = getPastDates(14);

  const completedTodayCount = skills.filter((s) => s.checkedDays?.[today]).length;
  const allCompletedToday = skills.length > 0 && completedTodayCount === skills.length;

  const handleQuickCheckAll = () => {
    skills.forEach((s) => {
      if (!s.checkedDays?.[today]) {
        onToggleCheck(s.id);
      }
    });

    triggerGoalCompletedConfetti('All Skills');
  };

  return (
    <div
      className={`rounded-2xl p-5 sm:p-6 border transition-all ${
        darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
      }`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-500 flex items-center gap-1">
              <Flame className="w-4 h-4 fill-amber-500" />
              <span>Daily Practice & Streak</span>
            </span>
            <span className="text-slate-400" aria-hidden="true">·</span>
            <span className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              {completedTodayCount} of {skills.length} skills practiced today
            </span>
          </div>
          <h2 className={`text-lg font-bold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Consistency Calendar & Habit Check
          </h2>
        </div>

        {/* Action / Status */}
        <div className="flex items-center gap-3">
          {allCompletedToday ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4" />
              <span>All Done for Today! 🎉</span>
            </div>
          ) : (
            <button
              onClick={handleQuickCheckAll}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition shadow-xs cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Mark All Practiced Today</span>
            </button>
          )}
        </div>
      </div>

      {/* Mini 14-day Habit Heatmap */}
      <div className="space-y-2 mb-5">
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span>Past 14 Days Activity</span>
          <span className="font-mono tabular-nums">Current streak: 🔥 {streak} days</span>
        </div>
        <div className="flex items-center justify-between gap-1 sm:gap-2">
          {past14Days.map((dStr, idx) => {
            const hasActivity = skills.some(
              (s) => s.checkedDays?.[dStr] || (s.history?.[dStr] ?? 0) > 0
            );
            const isToday = dStr === today;
            const dateObj = new Date(dStr + 'T00:00:00');
            const dayInitial = dateObj.toLocaleDateString('en-US', { weekday: 'narrow' });

            return (
              <div
                key={dStr}
                className="flex-1 flex flex-col items-center gap-1 group relative cursor-pointer"
                title={`${dStr}: ${hasActivity ? 'Active practice day' : 'No practice logged'}`}
              >
                <div
                  className={`w-full aspect-square max-w-[28px] rounded-md transition-all ${
                    hasActivity
                      ? 'bg-amber-500 shadow-xs shadow-amber-500/30'
                      : darkMode
                      ? 'bg-slate-800/80 hover:bg-slate-700'
                      : 'bg-slate-100 hover:bg-slate-200'
                  } ${isToday ? 'ring-2 ring-indigo-500 ring-offset-1 dark:ring-offset-slate-900' : ''}`}
                />
                <span className="text-[10px] text-slate-400 font-mono">
                  {dayInitial}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Skills Today Checklist */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80">
        <span className="block text-xs font-medium text-slate-400 mb-2">
          Today's Skill Checkpoints:
        </span>
        {skills.length === 0 ? (
          <p className={`text-xs py-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            No skills added yet. Add a skill to start tracking your daily progress and streak.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {skills.map((s) => {
              const checked = Boolean(s.checkedDays?.[today]);
              return (
                <button
                  key={s.id}
                  onClick={() => onToggleCheck(s.id)}
                  className={`p-2.5 rounded-xl border text-left flex items-center justify-between gap-2 transition cursor-pointer ${
                    checked
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : darkMode
                      ? 'border-slate-800 bg-slate-800/40 text-slate-300 hover:border-slate-700'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {checked ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                    <span className="text-xs font-semibold truncate">{s.name}</span>
                  </div>
                  <span className="text-[10px] font-mono tabular-nums text-slate-400">
                    {s.dailyTargetHours}h
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
