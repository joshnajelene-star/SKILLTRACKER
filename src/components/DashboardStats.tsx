import React from 'react';
import { Flame, Clock, BookOpen, Target, BellRing, Sparkles } from 'lucide-react';
import { Skill, StudyAlarm } from '../types';
import { getFormattedDate } from '../utils/storage';

interface DashboardStatsProps {
  userName: string;
  skills: Skill[];
  alarms: StudyAlarm[];
  streak: number;
  dailyGoalHours: number;
  darkMode: boolean;
  onOpenFocusTimer: () => void;
  onOpenAlarmsModal: () => void;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  userName,
  skills,
  alarms,
  streak,
  dailyGoalHours,
  darkMode,
  onOpenFocusTimer,
  onOpenAlarmsModal,
}) => {
  const today = getFormattedDate();

  // Calculate stats
  const totalSkills = skills.length;
  const totalHoursPracticed = skills.reduce((acc, s) => acc + (s.totalHoursPracticed || 0), 0);

  // Today's hours
  const todayHours = skills.reduce((acc, s) => acc + (s.history?.[today] || 0), 0);
  const todayPercent = Math.min(100, Math.round((todayHours / (dailyGoalHours || 1)) * 100));

  // Find next enabled alarm
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const enabledAlarms = alarms.filter((a) => a.enabled);

  let nextAlarm: { time: string; title: string; minutesAway: number } | null = null;
  if (enabledAlarms.length > 0) {
    const sorted = [...enabledAlarms]
      .map((a) => {
        const [h, m] = a.time.split(':').map(Number);
        const alarmMins = h * 60 + m;
        let diff = alarmMins - currentMinutes;
        if (diff <= 0) diff += 24 * 60; // next day
        return { time: a.time, title: a.title, minutesAway: diff };
      })
      .sort((a, b) => a.minutesAway - b.minutesAway);

    nextAlarm = sorted[0] || null;
  }

  // Inspirational message for Joshna
  const getMotivationalQuote = (currStreak: number) => {
    if (currStreak >= 7) return "Incredible dedication! A full week of learning unbroken. Keep the momentum going!";
    if (currStreak >= 3) return "You're building solid learning habits every single day. Great pace!";
    return "Every 30 minutes of focused practice brings you closer to mastery. Let's do this!";
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div
        className={`relative overflow-hidden rounded-2xl p-6 sm:p-8 border transition-all ${
          darkMode
            ? 'bg-gradient-to-r from-slate-900/90 via-indigo-950/40 to-slate-900/90 border-slate-800'
            : 'bg-gradient-to-r from-indigo-50/90 via-sky-50/60 to-purple-50/90 border-slate-200'
        }`}
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-semibold text-indigo-500">
                Daily Learning Hub
              </span>
              <span className="text-slate-400" aria-hidden="true">·</span>
              <span className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </span>
            </div>
            <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              Welcome back, {userName} <span className="inline-block animate-bounce">👋</span>
            </h1>
            <p className={`text-sm sm:text-base max-w-2xl ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              {getMotivationalQuote(streak)}
            </p>
          </div>

          {/* Quick CTA Actions */}
          <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
            <button
              onClick={onOpenFocusTimer}
              className="flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-95 rounded-xl shadow-md transition cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Start Focus Session</span>
            </button>
            <button
              onClick={onOpenAlarmsModal}
              className={`flex items-center gap-2 px-3.5 py-2.5 text-xs sm:text-sm font-medium rounded-xl border transition cursor-pointer ${
                darkMode
                  ? 'border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-slate-200'
                  : 'border-slate-300 bg-white hover:bg-slate-50 text-slate-700'
              }`}
            >
              <BellRing className="w-4 h-4 text-amber-500" />
              <span className="hidden sm:inline">Study Alarms</span>
            </button>
          </div>
        </div>

        {/* Ambient subtle glow ring */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 4 Key Metric Cards (Single-Elevation Depth, Tabular Numerals) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: My Skills */}
        <div
          className={`p-4 sm:p-5 rounded-xl border transition-all ${
            darkMode
              ? 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">My Skills</span>
            <BookOpen className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl sm:text-3xl font-bold tabular-nums ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              {totalSkills}
            </span>
            <span className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              tracked
            </span>
          </div>
          <p className={`mt-2 text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Active learning subjects
          </p>
        </div>

        {/* Card 2: Total Hours */}
        <div
          className={`p-4 sm:p-5 rounded-xl border transition-all ${
            darkMode
              ? 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Total Hours</span>
            <Clock className="w-4 h-4 text-sky-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl sm:text-3xl font-bold tabular-nums ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              {totalHoursPracticed.toFixed(1)}h
            </span>
            <span className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              accumulated
            </span>
          </div>
          <p className={`mt-2 text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Today: <span className="font-semibold tabular-nums">{todayHours.toFixed(1)}h</span>
          </p>
        </div>

        {/* Card 3: Streak System */}
        <div
          className={`p-4 sm:p-5 rounded-xl border transition-all ${
            darkMode
              ? 'bg-slate-900/70 border-slate-800 hover:border-amber-500/30'
              : 'bg-white border-slate-200 hover:border-amber-400 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Daily Streak</span>
            <Flame className="w-4 h-4 text-amber-500 animate-pulse" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold tabular-nums text-amber-500 flex items-center gap-1">
              <span>🔥</span> {streak}
            </span>
            <span className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              days
            </span>
          </div>
          <p className={`mt-2 text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Keep practicing daily!
          </p>
        </div>

        {/* Card 4: Daily Goal / Alarm status */}
        <div
          className={`p-4 sm:p-5 rounded-xl border transition-all ${
            darkMode
              ? 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Today's Target</span>
            <Target className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl sm:text-3xl font-bold tabular-nums ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              {todayPercent}%
            </span>
            <span className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              ({todayHours.toFixed(1)} / {dailyGoalHours}h)
            </span>
          </div>
          {nextAlarm ? (
            <p className={`mt-2 text-xs truncate ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>
              Next alarm: <span className="font-semibold tabular-nums">{nextAlarm.time}</span> ({Math.floor(nextAlarm.minutesAway / 60)}h {nextAlarm.minutesAway % 60}m)
            </p>
          ) : (
            <p className={`mt-2 text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              No active study alarms
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
