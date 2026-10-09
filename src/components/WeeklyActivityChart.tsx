import React, { useState } from 'react';
import { Calendar, TrendingUp, Award, Clock } from 'lucide-react';
import { Skill } from '../types';
import { getFormattedDate } from '../utils/storage';

interface WeeklyActivityChartProps {
  skills: Skill[];
  dailyGoalHours: number;
  darkMode: boolean;
}

interface DayData {
  dayName: string;
  dayShort: string;
  dateStr: string;
  isToday: boolean;
  totalHours: number;
  skillBreakdown: { skillName: string; color: string; hours: number }[];
}

export const WeeklyActivityChart: React.FC<WeeklyActivityChartProps> = ({
  skills,
  dailyGoalHours,
  darkMode,
}) => {
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);

  // Generate 7 days for the current week (Monday to Sunday)
  const today = new Date();
  const currentDayIndex = today.getDay(); // 0 is Sunday, 1 is Monday...
  // Calculate Monday of current week
  const mondayOffset = currentDayIndex === 0 ? -6 : 1 - currentDayIndex;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);

  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const fullDayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const weekData: DayData[] = daysOfWeek.map((short, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = getFormattedDate(d);
    const isToday = dateStr === getFormattedDate(today);

    let totalHours = 0;
    const skillBreakdown: { skillName: string; color: string; hours: number }[] = [];

    skills.forEach((skill) => {
      const h = skill.history?.[dateStr] || 0;
      if (h > 0) {
        totalHours += h;
        skillBreakdown.push({
          skillName: skill.name,
          color: skill.color,
          hours: h,
        });
      }
    });

    return {
      dayName: fullDayNames[i],
      dayShort: short,
      dateStr,
      isToday,
      totalHours,
      skillBreakdown,
    };
  });

  const maxHours = Math.max(3.5, ...weekData.map((d) => d.totalHours), dailyGoalHours * 1.2);
  const totalWeekHours = weekData.reduce((acc, d) => acc + d.totalHours, 0);
  const daysPracticedCount = weekData.filter((d) => d.totalHours > 0).length;
  const bestDay = [...weekData].sort((a, b) => b.totalHours - a.totalHours)[0];

  return (
    <div
      className={`rounded-2xl p-6 border transition-all ${
        darkMode
          ? 'bg-slate-900/80 border-slate-800'
          : 'bg-white border-slate-200 shadow-xs'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-500 mb-1">
            <Calendar className="w-4 h-4" />
            <span>Weekly Activity</span>
          </div>
          <h2 className={`text-lg font-bold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Learning Hours Distribution
          </h2>
          <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Track your study consistency across Monday through Sunday
          </p>
        </div>

        {/* Weekly Quick Metrics */}
        <div className="flex items-center gap-4 text-xs">
          <div className="text-right">
            <span className={`block font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Week Total
            </span>
            <span className="text-base font-bold tabular-nums text-indigo-500">
              {totalWeekHours.toFixed(1)} hrs
            </span>
          </div>
          <div className="h-8 w-px bg-slate-200 dark:bg-slate-800" />
          <div className="text-right">
            <span className={`block font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Active Days
            </span>
            <span className="text-base font-bold tabular-nums text-emerald-500">
              {daysPracticedCount} / 7
            </span>
          </div>
        </div>
      </div>

      {/* Bar Chart Container */}
      <div className="relative pt-6 pb-2">
        {/* Daily Goal Target Line */}
        <div
          className="absolute left-0 right-0 border-t border-dashed border-amber-500/40 z-10 flex items-center justify-end pr-2 pointer-events-none"
          style={{
            bottom: `${(dailyGoalHours / maxHours) * 160 + 36}px`,
          }}
        >
          <span className="text-[10px] font-mono tabular-nums text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded">
            Target: {dailyGoalHours}h
          </span>
        </div>

        {/* Bars Grid */}
        <div className="grid grid-cols-7 gap-2 sm:gap-4 items-end h-44 border-b border-slate-200 dark:border-slate-800 px-1">
          {weekData.map((d) => {
            const heightPercent = Math.min(100, (d.totalHours / maxHours) * 100);
            const metTarget = d.totalHours >= dailyGoalHours;
            const isHovered = selectedDay?.dateStr === d.dateStr;

            return (
              <div
                key={d.dateStr}
                onClick={() => setSelectedDay(isHovered ? null : d)}
                onMouseEnter={() => setSelectedDay(d)}
                className="group flex flex-col items-center justify-end h-full cursor-pointer relative"
              >
                {/* Hours tooltip on hover */}
                <div
                  className={`absolute -top-7 text-[11px] font-mono font-medium tabular-nums px-1.5 py-0.5 rounded transition-all opacity-0 group-hover:opacity-100 ${
                    darkMode ? 'bg-slate-800 text-slate-200' : 'bg-slate-900 text-white'
                  }`}
                >
                  {d.totalHours.toFixed(1)}h
                </div>

                {/* Animated Bar */}
                <div className="w-full max-w-[42px] bg-slate-100 dark:bg-slate-800/60 rounded-t-lg overflow-hidden flex flex-col justify-end h-full">
                  <div
                    className={`w-full rounded-t-lg transition-all duration-500 ${
                      metTarget
                        ? 'bg-gradient-to-t from-emerald-600 to-emerald-400 group-hover:brightness-110'
                        : d.totalHours > 0
                        ? 'bg-gradient-to-t from-indigo-600 to-sky-400 group-hover:brightness-110'
                        : 'bg-transparent'
                    } ${d.isToday ? 'ring-2 ring-indigo-400 ring-offset-1 dark:ring-offset-slate-900' : ''}`}
                    style={{ height: `${Math.max(d.totalHours > 0 ? 8 : 0, heightPercent)}%` }}
                  />
                </div>

                {/* Day Label */}
                <div className="mt-2 text-center">
                  <span
                    className={`text-xs font-medium block ${
                      d.isToday
                        ? 'text-indigo-500 font-bold'
                        : darkMode
                        ? 'text-slate-400 group-hover:text-slate-200'
                        : 'text-slate-600 group-hover:text-slate-900'
                    }`}
                  >
                    {d.dayShort}
                  </span>
                  <span className="text-[10px] text-slate-400 block font-mono">
                    {d.dateStr.slice(8)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Day Detail or Insights Bar */}
      <div className={`mt-4 pt-3 border-t text-xs ${darkMode ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-600'}`}>
        {selectedDay && selectedDay.totalHours > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-medium text-slate-900 dark:text-slate-100">
              {selectedDay.dayName} ({selectedDay.dateStr}): {selectedDay.totalHours.toFixed(1)} hours logged
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {selectedDay.skillBreakdown.map((sb, idx) => (
                <span
                  key={idx}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                    darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {sb.skillName}: <span className="tabular-nums font-mono">{sb.hours}h</span>
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              <span>
                Peak Day: <strong className="text-slate-900 dark:text-slate-200">{bestDay?.dayName}</strong> ({bestDay?.totalHours.toFixed(1)} hrs)
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <Clock className="w-3.5 h-3.5" />
              <span>Click or hover any bar to inspect skill study breakdown</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
