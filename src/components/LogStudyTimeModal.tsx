import React, { useState } from 'react';
import { X, Clock, Calendar, CheckCircle2 } from 'lucide-react';
import { Skill } from '../types';
import { getFormattedDate } from '../utils/storage';
import { playSuccessChime } from '../utils/audio';
import confetti from 'canvas-confetti';

interface LogStudyTimeModalProps {
  skill: Skill;
  darkMode: boolean;
  onClose: () => void;
  onSaveLog: (skillId: string, hours: number, date: string, notes?: string) => void;
}

export const LogStudyTimeModal: React.FC<LogStudyTimeModalProps> = ({
  skill,
  darkMode,
  onClose,
  onSaveLog,
}) => {
  const [hours, setHours] = useState<number>(1.0);
  const [date, setDate] = useState<string>(getFormattedDate());
  const [notes, setNotes] = useState<string>('');

  const handleQuickAdd = (additional: number) => {
    setHours((prev) => Math.max(0.25, Number((prev + additional).toFixed(2))));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hours <= 0) return;

    onSaveLog(skill.id, hours, date, notes.trim());

    // Sound & Confetti celebration
    try {
      confetti({
        particleCount: 35,
        spread: 50,
        origin: { y: 0.65 },
      });
      playSuccessChime();
    } catch {
      // fallback
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div
        className={`w-full max-w-md rounded-2xl p-6 sm:p-7 border shadow-2xl relative transition-all ${
          darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-500/15 text-sky-500 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Log Study Time</h2>
              <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {skill.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4 my-4">
          {/* Quick hour buttons */}
          <div>
            <label className="block text-xs font-medium mb-1.5">Study Duration (Hours)</label>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="number"
                step="0.25"
                min="0.25"
                max="24"
                value={hours}
                onChange={(e) => setHours(Number(e.target.value))}
                className={`w-full px-3 py-2 rounded-lg text-sm font-mono font-bold tabular-nums border ${
                  darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
                required
              />
              <span className="text-xs font-mono text-slate-400">hours</span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {[0.25, 0.5, 1.0, 1.5, 2.0].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setHours(val)}
                  className={`px-2.5 py-1 rounded-md text-xs font-mono transition cursor-pointer ${
                    hours === val
                      ? 'bg-sky-600 text-white font-bold'
                      : darkMode
                      ? 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {val >= 1 ? `${val}h` : `${val * 60}m`}
                </button>
              ))}
            </div>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-medium mb-1">Date</label>
            <div className="relative">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg text-xs font-mono tabular-nums border ${
                  darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
                required
              />
            </div>
          </div>

          {/* Study Notes */}
          <div>
            <label className="block text-xs font-medium mb-1">What did you practice? (Optional)</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Worked through exercise 3, practiced speech fluency"
              className={`w-full px-3 py-2 rounded-lg text-xs border resize-none ${
                darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
              }`}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white transition shadow-sm cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Save Progress</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
