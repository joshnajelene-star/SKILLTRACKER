import React, { useState } from 'react';
import { X, BookOpen, Clock, Target, Bell, Sparkles } from 'lucide-react';
import { Skill, SkillCategory, SkillColor } from '../types';

interface AddEditSkillModalProps {
  initialSkill?: Skill | null;
  darkMode: boolean;
  onClose: () => void;
  onSave: (skill: Omit<Skill, 'id' | 'createdAt' | 'completedDays' | 'totalHoursPracticed' | 'history' | 'checkedDays'> & { id?: string }) => void;
}

const CATEGORIES: SkillCategory[] = [
  'Programming',
  'Data',
  'Languages',
  'Communication',
  'Design',
  'Other',
];

const COLORS: SkillColor[] = [
  'amber',
  'sky',
  'emerald',
  'violet',
  'indigo',
  'rose',
  'teal',
];

export const AddEditSkillModal: React.FC<AddEditSkillModalProps> = ({
  initialSkill,
  darkMode,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState(initialSkill?.name || '');
  const [category, setCategory] = useState<SkillCategory>(initialSkill?.category || 'Programming');
  const [goal, setGoal] = useState(initialSkill?.goal || '');
  const [targetDays, setTargetDays] = useState(initialSkill?.targetDays || 30);
  const [dailyTargetHours, setDailyTargetHours] = useState(initialSkill?.dailyTargetHours || 1.0);
  const [color, setColor] = useState<SkillColor>(initialSkill?.color || 'amber');
  const [alarmEnabled, setAlarmEnabled] = useState(initialSkill?.alarmEnabled ?? true);
  const [alarmTime, setAlarmTime] = useState(initialSkill?.alarmTime || '19:00');
  const [notes, setNotes] = useState(initialSkill?.notes || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      id: initialSkill?.id,
      name: name.trim(),
      category,
      goal: goal.trim() || `Master ${name.trim()} through daily practice`,
      targetDays: Number(targetDays) || 30,
      dailyTargetHours: Number(dailyTargetHours) || 1,
      color,
      iconName: category.toLowerCase(),
      alarmEnabled,
      alarmTime,
      notes: notes.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div
        className={`w-full max-w-lg rounded-2xl p-6 sm:p-7 border shadow-2xl relative max-h-[90vh] overflow-y-auto transition-all ${
          darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/15 text-indigo-500 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">
                {initialSkill ? 'Edit Skill Goal' : 'Add New Skill'}
              </h2>
              <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Define your target days, daily hours, and study reminders
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4 my-5">
          {/* Skill Name & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">
                Skill Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. JavaScript, Python, SQL"
                className={`w-full px-3 py-2 rounded-lg text-xs border ${
                  darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as SkillCategory)}
                className={`w-full px-3 py-2 rounded-lg text-xs border ${
                  darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Goal Description */}
          <div>
            <label className="block text-xs font-semibold mb-1">Goal / Description</label>
            <input
              type="text"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g. Learn JavaScript basics & build 3 apps"
              className={`w-full px-3 py-2 rounded-lg text-xs border ${
                darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
              }`}
            />
          </div>

          {/* Target Days & Daily Hours */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">
                Target Days
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={targetDays}
                  onChange={(e) => setTargetDays(Number(e.target.value))}
                  className={`w-full px-3 py-2 rounded-lg text-xs font-mono tabular-nums border ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                  required
                />
                <span className="absolute right-3 top-2 text-[11px] text-slate-400">days</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">
                Daily Target
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.25"
                  min="0.25"
                  max="12"
                  value={dailyTargetHours}
                  onChange={(e) => setDailyTargetHours(Number(e.target.value))}
                  className={`w-full px-3 py-2 rounded-lg text-xs font-mono tabular-nums border ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                  required
                />
                <span className="absolute right-3 top-2 text-[11px] text-slate-400">hours/day</span>
              </div>
            </div>
          </div>

          {/* Color Tag Selection */}
          <div>
            <label className="block text-xs font-semibold mb-1.5">Color Accent</label>
            <div className="flex items-center gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full border-2 transition-transform cursor-pointer ${
                    c === 'amber'
                      ? 'bg-amber-500'
                      : c === 'sky'
                      ? 'bg-sky-500'
                      : c === 'emerald'
                      ? 'bg-emerald-500'
                      : c === 'violet'
                      ? 'bg-violet-500'
                      : c === 'indigo'
                      ? 'bg-indigo-500'
                      : c === 'rose'
                      ? 'bg-rose-500'
                      : 'bg-teal-500'
                  } ${color === c ? 'scale-115 border-white ring-2 ring-indigo-500' : 'border-transparent opacity-70 hover:opacity-100'}`}
                />
              ))}
            </div>
          </div>

          {/* Alarm Reminder Settings */}
          <div
            className={`p-3.5 rounded-xl border space-y-2.5 ${
              darkMode ? 'bg-slate-800/50 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-semibold">Daily Study Alarm Reminder</span>
              </div>
              <input
                type="checkbox"
                id="alarmEnabled"
                checked={alarmEnabled}
                onChange={(e) => setAlarmEnabled(e.target.checked)}
                className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
              />
            </div>

            {alarmEnabled && (
              <div className="flex items-center justify-between pt-1 text-xs">
                <span className="text-slate-400">Reminder Time:</span>
                <input
                  type="time"
                  value={alarmTime}
                  onChange={(e) => setAlarmTime(e.target.value)}
                  className={`px-2.5 py-1 rounded-md text-xs font-mono tabular-nums border ${
                    darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-sm cursor-pointer"
            >
              {initialSkill ? 'Update Skill' : 'Create Skill'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
