import React from 'react';
import {
  Code,
  Terminal,
  Database,
  MessageSquare,
  Sparkles,
  Brain,
  Edit2,
  Trash2,
  Plus,
  CheckCircle2,
  Bell,
  Clock,
  Target,
  Calendar,
} from 'lucide-react';
import { Skill, SkillColor } from '../types';
import { getFormattedDate } from '../utils/storage';
import { triggerGoalCompletedConfetti } from '../utils/confetti';
import { playSuccessChime } from '../utils/audio';

interface SkillCardProps {
  skill: Skill;
  darkMode: boolean;
  onEdit: (skill: Skill) => void;
  onDelete: (skillId: string) => void;
  onQuickLogTime: (skillId: string, hours: number) => void;
  onOpenLogModal: (skill: Skill) => void;
  onToggleTodayCheck: (skillId: string) => void;
  onToggleAlarm: (skillId: string) => void;
}

const colorMap: Record<SkillColor, { bg: string; text: string; bar: string; glow: string; border: string }> = {
  amber: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-500',
    bar: 'from-amber-500 to-yellow-400',
    glow: 'shadow-amber-500/20',
    border: 'border-amber-500/20',
  },
  emerald: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-500',
    bar: 'from-emerald-500 to-teal-400',
    glow: 'shadow-emerald-500/20',
    border: 'border-emerald-500/20',
  },
  sky: {
    bg: 'bg-sky-500/10',
    text: 'text-sky-500',
    bar: 'from-sky-500 to-cyan-400',
    glow: 'shadow-sky-500/20',
    border: 'border-sky-500/20',
  },
  indigo: {
    bg: 'bg-indigo-500/10',
    text: 'text-indigo-500',
    bar: 'from-indigo-500 to-purple-400',
    glow: 'shadow-indigo-500/20',
    border: 'border-indigo-500/20',
  },
  rose: {
    bg: 'bg-rose-500/10',
    text: 'text-rose-500',
    bar: 'from-rose-500 to-pink-400',
    glow: 'shadow-rose-500/20',
    border: 'border-rose-500/20',
  },
  violet: {
    bg: 'bg-violet-500/10',
    text: 'text-violet-500',
    bar: 'from-violet-500 to-indigo-400',
    glow: 'shadow-violet-500/20',
    border: 'border-violet-500/20',
  },
  teal: {
    bg: 'bg-teal-500/10',
    text: 'text-teal-500',
    bar: 'from-teal-500 to-emerald-400',
    glow: 'shadow-teal-500/20',
    border: 'border-teal-500/20',
  },
};

const getCategoryIcon = (category: string) => {
  switch (category.toLowerCase()) {
    case 'programming':
      return <Code className="w-5 h-5" />;
    case 'data':
      return <Database className="w-5 h-5" />;
    case 'languages':
    case 'communication':
      return <MessageSquare className="w-5 h-5" />;
    case 'design':
      return <Sparkles className="w-5 h-5" />;
    default:
      return <Brain className="w-5 h-5" />;
  }
};

export const SkillCard: React.FC<SkillCardProps> = ({
  skill,
  darkMode,
  onEdit,
  onDelete,
  onQuickLogTime,
  onOpenLogModal,
  onToggleTodayCheck,
  onToggleAlarm,
}) => {
  const today = getFormattedDate();
  const theme = colorMap[skill.color] || colorMap.indigo;

  // Percentage based on completed days vs target days
  const progressPercent = Math.min(
    100,
    Math.round(((skill.completedDays || 0) / (skill.targetDays || 1)) * 100)
  );

  const isCheckedToday = Boolean(skill.checkedDays?.[today]);
  const hoursToday = skill.history?.[today] || 0;
  const isDailyGoalMet = hoursToday >= skill.dailyTargetHours || isCheckedToday;

  const handleCheckClick = () => {
    if (!isCheckedToday) {
      triggerGoalCompletedConfetti(skill.name);
    }
    onToggleTodayCheck(skill.id);
  };

  return (
    <div
      className={`rounded-2xl p-5 sm:p-6 border transition-all duration-300 relative group flex flex-col justify-between ${
        isDailyGoalMet && hoursToday >= skill.dailyTargetHours
          ? darkMode
            ? 'bg-slate-900/90 border-emerald-500/30 ring-1 ring-emerald-500/20'
            : 'bg-white border-emerald-400/50 shadow-emerald-500/5 shadow-md'
          : darkMode
          ? 'bg-slate-900/80 border-slate-800 hover:border-slate-700 shadow-lg/5'
          : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
      }`}
    >
      <div>
        {/* Card Header: Icon, Category metadata, Actions */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center ${theme.bg} ${theme.text} shrink-0`}
            >
              {getCategoryIcon(skill.category)}
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
                <span>{skill.category}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">{skill.dailyTargetHours}h / day</span>
                {hoursToday >= skill.dailyTargetHours && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="text-emerald-500 font-semibold flex items-center gap-0.5">
                      <Target className="w-3 h-3" />
                      Goal Met ({hoursToday.toFixed(1)}h)
                    </span>
                  </>
                )}
              </div>
              <h3
                className={`text-lg font-bold tracking-tight ${
                  darkMode ? 'text-white' : 'text-slate-900'
                }`}
              >
                {skill.name}
              </h3>
            </div>
          </div>

          {/* Action buttons: Edit, Delete */}
          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit(skill)}
              className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
                darkMode ? 'hover:bg-slate-800 text-slate-400 hover:text-slate-200' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-800'
              }`}
              title="Edit Skill Goals"
              aria-label={`Edit ${skill.name}`}
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(skill.id)}
              className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
                darkMode ? 'hover:bg-rose-950/40 text-slate-400 hover:text-rose-400' : 'hover:bg-rose-50 text-slate-400 hover:text-rose-600'
              }`}
              title="Delete Skill"
              aria-label={`Delete ${skill.name}`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Goal Description */}
        <p
          className={`text-xs sm:text-sm line-clamp-2 mb-4 ${
            darkMode ? 'text-slate-300' : 'text-slate-600'
          }`}
        >
          {skill.goal}
        </p>

        {/* Progress Bar & Percentage */}
        <div className="mb-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className={`font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              Progress
            </span>
            <span className="font-bold font-mono tabular-nums text-indigo-500">
              {progressPercent}%
            </span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${theme.bar} transition-all duration-700`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Metric Overview (Unboxed clean metadata) */}
        <div
          className={`grid grid-cols-2 gap-2 py-3 px-3.5 rounded-xl text-xs mb-4 ${
            darkMode ? 'bg-slate-800/50 text-slate-300' : 'bg-slate-50 text-slate-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <div>
              <span className="block text-[11px] text-slate-400">Days Completed</span>
              <span className="font-bold font-mono tabular-nums">
                {skill.completedDays} / {skill.targetDays} days
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-sky-500 shrink-0" />
            <div>
              <span className="block text-[11px] text-slate-400">Total Practiced</span>
              <span className="font-bold font-mono tabular-nums">
                {skill.totalHoursPracticed.toFixed(1)} hours
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Card Footer: Today's Status & Quick Log Buttons */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
        {/* Row 1: Daily checkmark & Alarm toggle */}
        <div className="flex items-center justify-between text-xs">
          {/* Daily check-in button */}
          <button
            onClick={handleCheckClick}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
              isCheckedToday
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                : darkMode
                ? 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-750'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <CheckCircle2
              className={`w-4 h-4 ${isCheckedToday ? 'text-emerald-500 fill-emerald-500/20' : 'text-slate-400'}`}
            />
            <span>{isCheckedToday ? 'Practiced Today ✅' : 'Mark Practiced Today'}</span>
          </button>

          {/* Alarm indicator */}
          <button
            onClick={() => onToggleAlarm(skill.id)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-mono tabular-nums transition cursor-pointer ${
              skill.alarmEnabled
                ? 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20'
                : darkMode
                ? 'text-slate-500 hover:text-slate-400'
                : 'text-slate-400 hover:text-slate-600'
            }`}
            title={skill.alarmEnabled ? `Alarm active at ${skill.alarmTime}` : 'Alarm disabled for this skill'}
          >
            <Bell className={`w-3.5 h-3.5 ${skill.alarmEnabled ? 'text-amber-500' : 'text-slate-400'}`} />
            <span>{skill.alarmTime}</span>
          </button>
        </div>

        {/* Row 2: Quick Study Logger (+30m, +1h, Custom) */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-slate-400 font-medium shrink-0 mr-1">
            + Log Time:
          </span>
          <button
            onClick={() => onQuickLogTime(skill.id, 0.5)}
            className={`flex-1 py-1 px-2 rounded-md text-xs font-mono font-medium transition text-center cursor-pointer ${
              darkMode
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
            }`}
            title="Log 30 minutes study"
          >
            +30m
          </button>
          <button
            onClick={() => onQuickLogTime(skill.id, 1.0)}
            className={`flex-1 py-1 px-2 rounded-md text-xs font-mono font-medium transition text-center cursor-pointer ${
              darkMode
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
            }`}
            title="Log 1 hour study"
          >
            +1h
          </button>
          <button
            onClick={() => onOpenLogModal(skill)}
            className={`flex-1 py-1 px-2 rounded-md text-xs font-medium transition flex items-center justify-center gap-1 cursor-pointer ${
              darkMode
                ? 'bg-indigo-900/40 hover:bg-indigo-900/60 text-indigo-300'
                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700'
            }`}
            title="Custom study log with notes"
          >
            <Plus className="w-3 h-3" />
            <span>Custom</span>
          </button>
        </div>
      </div>
    </div>
  );
};
