import React, { useEffect } from 'react';
import { Sparkles, Trophy, X, Flame, CheckCircle2 } from 'lucide-react';

interface GoalCelebrationToastProps {
  skillName: string;
  hoursToday: number;
  dailyTargetHours: number;
  streak: number;
  darkMode: boolean;
  onDismiss: () => void;
}

export const GoalCelebrationToast: React.FC<GoalCelebrationToastProps> = ({
  skillName,
  hoursToday,
  dailyTargetHours,
  streak,
  darkMode,
  onDismiss,
}) => {
  // Auto dismiss after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 5500);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <aside
      aria-label="Daily Goal Achievement Notification"
      className="fixed bottom-6 right-6 z-50 max-w-sm sm:max-w-md w-full p-1 animate-bounce-subtle pointer-events-auto"
    >
      <div
        className={`rounded-2xl p-4 sm:p-5 border shadow-2xl backdrop-blur-md relative overflow-hidden transition-all ${
          darkMode
            ? 'bg-slate-900/95 border-emerald-500/40 text-white'
            : 'bg-white/95 border-emerald-500/50 text-slate-900'
        }`}
      >
        {/* Ambient celebration glow */}
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-start justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shrink-0 shadow-md">
              <Trophy className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-500 uppercase tracking-wider mb-0.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Daily Goal Achieved!</span>
              </div>
              <h4 className="text-base font-bold tracking-tight">
                {skillName} Target Met 🎯
              </h4>
              <p className={`text-xs mt-0.5 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                Completed <span className="font-semibold tabular-nums font-mono">{hoursToday.toFixed(1)}h</span> of your {dailyTargetHours}h daily goal today!
              </p>
            </div>
          </div>

          <button
            onClick={onDismiss}
            className="p-1 text-slate-400 hover:text-slate-200 transition cursor-pointer"
            aria-label="Dismiss celebration toast"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Motivational Habit Loop Footer */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-amber-500 font-medium">
            <Flame className="w-3.5 h-3.5 fill-amber-500" />
            <span>Streak Protected: {streak} days</span>
          </div>
          <span className="text-[11px] text-slate-400">Habit loop reinforced! ✨</span>
        </div>
      </div>
    </aside>
  );
};
