import React, { useEffect } from 'react';
import { Bell, Flame, Play, Clock, X } from 'lucide-react';
import { StudyAlarm, Skill } from '../types';
import { startRingingAlarm, stopRingingAlarm } from '../utils/audio';

interface ActiveAlarmModalProps {
  alarm: StudyAlarm;
  skill?: Skill;
  darkMode: boolean;
  onDismiss: () => void;
  onSnooze: (minutes: number) => void;
  onStartStudy: (skillId?: string) => void;
}

export const ActiveAlarmModal: React.FC<ActiveAlarmModalProps> = ({
  alarm,
  skill,
  darkMode,
  onDismiss,
  onSnooze,
  onStartStudy,
}) => {
  // Start audio ring loop when modal mounts
  useEffect(() => {
    startRingingAlarm(alarm.soundType || 'bell');

    return () => {
      stopRingingAlarm();
    };
  }, [alarm.soundType]);

  const handleDismiss = () => {
    stopRingingAlarm();
    onDismiss();
  };

  const handleSnooze = (mins: number) => {
    stopRingingAlarm();
    onSnooze(mins);
  };

  const handleStartStudy = () => {
    stopRingingAlarm();
    onStartStudy(alarm.skillId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
      <div
        className={`w-full max-w-md rounded-2xl p-6 sm:p-8 border shadow-2xl relative overflow-hidden text-center transition-all ${
          darkMode
            ? 'bg-slate-900 border-amber-500/30 text-white'
            : 'bg-white border-amber-400 text-slate-900'
        }`}
      >
        {/* Pulsing ring background halo */}
        <div className="absolute -top-16 -left-16 w-48 h-48 bg-amber-500/20 rounded-full blur-2xl animate-pulse" />
        <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-indigo-500/20 rounded-full blur-2xl animate-pulse" />

        {/* Close / Dismiss top corner */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-200 transition cursor-pointer"
          title="Dismiss alarm"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Animated Ringing Bell Icon */}
        <div className="mx-auto w-20 h-20 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mb-5 animate-ring-shake">
          <Bell className="w-10 h-10 text-amber-500" />
        </div>

        {/* Alarm Banner & Title */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-amber-500 bg-amber-500/10 mb-2">
          <span>⏰ Study Reminder</span>
        </div>

        <h3 className="text-xl sm:text-2xl font-bold tracking-tight mb-2">
          {alarm.title || 'Time to Study!'}
        </h3>

        {skill ? (
          <div className="my-4 p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-left">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-semibold text-indigo-400">{skill.name}</span>
              <span className="font-mono tabular-nums text-slate-400">{skill.dailyTargetHours}h daily goal</span>
            </div>
            <p className="text-xs text-slate-300 line-clamp-2">
              {skill.goal}
            </p>
          </div>
        ) : (
          <p className="text-sm text-slate-400 mb-4">
            Keep your momentum going and protect your daily streak!
          </p>
        )}

        {/* Motivational note */}
        <div className="flex items-center justify-center gap-1.5 text-xs text-amber-500 font-medium mb-6">
          <Flame className="w-4 h-4 fill-amber-500" />
          <span>Don't let today slip by — even 20 minutes counts!</span>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          <button
            onClick={handleStartStudy}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-md transition active:scale-98 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Start Focus Session Now</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleSnooze(5)}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-medium border transition cursor-pointer ${
                darkMode
                  ? 'border-slate-800 bg-slate-800/80 hover:bg-slate-800 text-slate-300'
                  : 'border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Snooze (5m)</span>
            </button>

            <button
              onClick={() => handleSnooze(10)}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-medium border transition cursor-pointer ${
                darkMode
                  ? 'border-slate-800 bg-slate-800/80 hover:bg-slate-800 text-slate-300'
                  : 'border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Snooze (10m)</span>
            </button>
          </div>

          <button
            onClick={handleDismiss}
            className={`w-full py-2 text-xs font-medium transition cursor-pointer ${
              darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Dismiss for Today
          </button>
        </div>
      </div>
    </div>
  );
};
