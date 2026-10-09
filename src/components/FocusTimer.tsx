import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, CheckCircle, Bell, Sparkles } from 'lucide-react';
import { Skill } from '../types';
import { playSound, playSuccessChime } from '../utils/audio';
import confetti from 'canvas-confetti';

interface FocusTimerProps {
  skills: Skill[];
  darkMode: boolean;
  onLogStudyTime: (skillId: string, hours: number, notes?: string) => void;
}

export const FocusTimer: React.FC<FocusTimerProps> = ({
  skills,
  darkMode,
  onLogStudyTime,
}) => {
  const [selectedSkillId, setSelectedSkillId] = useState<string>(skills[0]?.id || '');
  const [targetMinutes, setTargetMinutes] = useState<number>(25);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [sessionCompleted, setSessionCompleted] = useState<boolean>(false);
  const intervalRef = useRef<number | null>(null);

  const selectedSkill = skills.find((s) => s.id === selectedSkillId) || skills[0];

  // Set duration preset
  const handleSelectPreset = (mins: number) => {
    setIsRunning(false);
    setTargetMinutes(mins);
    setSecondsRemaining(mins * 60);
    setSessionCompleted(false);
  };

  // Timer tick
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = window.setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            // Timer Finished!
            clearInterval(intervalRef.current!);
            setIsRunning(false);
            setSessionCompleted(true);
            
            // Play alarm chime
            playSound('bell');
            setTimeout(() => playSuccessChime(), 1200);

            // Confetti
            try {
              confetti({
                particleCount: 70,
                spread: 80,
                origin: { y: 0.6 },
              });
            } catch {
              // fallback
            }

            // Automatically log study time
            if (selectedSkillId) {
              const hoursDone = targetMinutes / 60;
              onLogStudyTime(
                selectedSkillId,
                hoursDone,
                `Completed ${targetMinutes}-min focus study session`
              );
            }

            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, selectedSkillId, targetMinutes, onLogStudyTime]);

  const toggleStartPause = () => {
    if (sessionCompleted) {
      setSecondsRemaining(targetMinutes * 60);
      setSessionCompleted(false);
    }
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setSecondsRemaining(targetMinutes * 60);
    setSessionCompleted(false);
  };

  // Formatted display
  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const totalSeconds = targetMinutes * 60;
  const progressRatio = totalSeconds > 0 ? (totalSeconds - secondsRemaining) / totalSeconds : 0;
  const strokeDashoffset = 565.48 * (1 - progressRatio);

  return (
    <div
      className={`rounded-2xl p-6 sm:p-8 border transition-all ${
        darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}
    >
      <div className="max-w-xl mx-auto flex flex-col items-center text-center">
        {/* Header */}
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-500 mb-2">
          <Sparkles className="w-4 h-4" />
          <span>Interactive Study Timer</span>
        </div>
        <h2 className={`text-2xl font-bold tracking-tight mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          Deep Focus Session
        </h2>
        <p className={`text-xs sm:text-sm mb-6 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
          Focus with no distractions. When the timer ends, your study alarm rings and time is automatically saved!
        </p>

        {/* Skill Selector */}
        <div className="w-full max-w-sm mb-6">
          <label className={`block text-xs font-medium mb-1.5 text-left ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
            Skill to Study:
          </label>
          <select
            value={selectedSkillId}
            onChange={(e) => setSelectedSkillId(e.target.value)}
            disabled={isRunning}
            className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium transition cursor-pointer ${
              darkMode
                ? 'bg-slate-800 border-slate-700 text-white focus:border-indigo-500'
                : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-500'
            }`}
          >
            {skills.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.category})
              </option>
            ))}
          </select>
        </div>

        {/* Duration Presets */}
        <div className="flex items-center justify-center gap-2 mb-8 flex-wrap">
          {[15, 25, 30, 45, 60].map((mins) => (
            <button
              key={mins}
              onClick={() => handleSelectPreset(mins)}
              disabled={isRunning}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                targetMinutes === mins
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : darkMode
                  ? 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-750'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              {mins} mins
            </button>
          ))}
        </div>

        {/* Circular Countdown Display */}
        <div className="relative w-64 h-64 flex items-center justify-center mb-8">
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 200 200">
            {/* Background track circle */}
            <circle
              cx="100"
              cy="100"
              r="90"
              className={`stroke-current ${darkMode ? 'text-slate-800' : 'text-slate-100'}`}
              strokeWidth="10"
              fill="transparent"
            />
            {/* Animated progress circle */}
            <circle
              cx="100"
              cy="100"
              r="90"
              className="stroke-current text-indigo-500 transition-all duration-500"
              strokeWidth="10"
              strokeDasharray="565.48"
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>

          {/* Time Digits in Center */}
          <div className="absolute flex flex-col items-center">
            <span
              className={`text-4xl sm:text-5xl font-mono font-bold tracking-tight tabular-nums ${
                darkMode ? 'text-white' : 'text-slate-900'
              }`}
            >
              {timeFormatted}
            </span>
            <span className={`text-xs mt-1 font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              {isRunning ? 'Studying...' : sessionCompleted ? 'Completed! 🎉' : 'Ready'}
            </span>
          </div>
        </div>

        {/* Timer Controls */}
        <div className="flex items-center gap-4">
          <button
            onClick={toggleStartPause}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white shadow-md transition-all active:scale-95 cursor-pointer ${
              isRunning
                ? 'bg-amber-600 hover:bg-amber-500'
                : 'bg-indigo-600 hover:bg-indigo-500'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-5 h-5" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" />
                <span>{sessionCompleted ? 'Start Another Session' : 'Start Focus'}</span>
              </>
            )}
          </button>

          <button
            onClick={handleReset}
            className={`p-3 rounded-xl border transition cursor-pointer ${
              darkMode
                ? 'border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white'
                : 'border-slate-300 hover:bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
            title="Reset timer"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>

        {/* Completion Alert */}
        {sessionCompleted && (
          <div
            className={`mt-6 p-4 rounded-xl flex items-center gap-3 border text-xs sm:text-sm text-left ${
              darkMode
                ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}
          >
            <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
            <div>
              <p className="font-semibold">Session Logged Successfully!</p>
              <p className="text-xs opacity-90">
                Added +{(targetMinutes / 60).toFixed(2)}h to {selectedSkill?.name}. Keep it up!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
