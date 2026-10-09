import React, { useState, useRef } from 'react';
import { X, User, Download, Upload, RotateCcw, Volume2, Target, Check, Palette } from 'lucide-react';
import { StudentProfile, Skill, StudyAlarm } from '../types';
import { BG_THEMES, BgThemeId } from './ReactBitsBackground';

interface ProfileModalProps {
  profile: StudentProfile;
  skills: Skill[];
  alarms: StudyAlarm[];
  darkMode: boolean;
  onClose: () => void;
  onSaveProfile: (profile: StudentProfile) => void;
  onResetDemoData: () => void;
  onImportData: (data: { skills: Skill[]; alarms: StudyAlarm[]; profile: StudentProfile }) => void;
  onLoadStarterSkills?: () => void;
  onLogout?: () => void;
  currentBgThemeId?: BgThemeId;
  onSelectBgTheme?: (themeId: BgThemeId) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  profile,
  skills,
  alarms,
  darkMode,
  onClose,
  onSaveProfile,
  onResetDemoData,
  onImportData,
  onLoadStarterSkills,
  onLogout,
  currentBgThemeId = 'cosmic-aurora',
  onSelectBgTheme,
}) => {
  const [name, setName] = useState(profile.name);
  const [dailyGoalHours, setDailyGoalHours] = useState(profile.dailyGoalHours);
  const [soundEnabled, setSoundEnabled] = useState(profile.soundEnabled);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile({
      ...profile,
      name: name.trim() || 'Joshna',
      dailyGoalHours: Number(dailyGoalHours) || 2.0,
      soundEnabled,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleExport = () => {
    const backup = {
      exportDate: new Date().toISOString(),
      profile: { ...profile, name, dailyGoalHours, soundEnabled },
      skills,
      alarms,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `skilltracker-backup-${name.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.skills && Array.isArray(parsed.skills)) {
          onImportData({
            skills: parsed.skills,
            alarms: parsed.alarms || [],
            profile: parsed.profile || profile,
          });
          onClose();
        } else {
          alert('Invalid backup file format');
        }
      } catch (err) {
        alert('Could not parse JSON file');
      }
    };
    reader.readAsText(file);
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
            <div className="w-8 h-8 rounded-lg bg-indigo-500/15 text-indigo-500 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Student Profile & Settings</h2>
              <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Personalize your learning targets
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

        {/* Profile Form */}
        <form onSubmit={handleSave} className="space-y-4 my-4">
          <div>
            <label className="block text-xs font-semibold mb-1">Student Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Joshna"
              className={`w-full px-3 py-2 rounded-lg text-xs border ${
                darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
              }`}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">
              Daily Total Study Goal (Hours)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="16"
                value={dailyGoalHours}
                onChange={(e) => setDailyGoalHours(Number(e.target.value))}
                className={`w-full px-3 py-2 rounded-lg text-xs font-mono tabular-nums border ${
                  darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
                required
              />
              <span className="absolute right-3 top-2 text-[11px] text-slate-400">hours / day</span>
            </div>
          </div>

          {/* ReactBits Background Theme Swatches */}
          {onSelectBgTheme && (
            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-indigo-400" />
                  <span className="font-semibold">ReactBits Aurora Background Color</span>
                </div>
                <span className="text-[10px] text-slate-400">Animated</span>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 pt-1">
                {BG_THEMES.map((theme) => {
                  const isSelected = theme.id === currentBgThemeId;
                  return (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => onSelectBgTheme(theme.id)}
                      className={`h-9 rounded-xl flex items-center justify-center border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-indigo-500 ring-2 ring-indigo-500/50 scale-105'
                          : 'border-slate-300 dark:border-slate-700 opacity-80 hover:opacity-100'
                      }`}
                      style={{
                        background: `linear-gradient(135deg, ${theme.colorStops[0]}, ${theme.colorStops[1]})`,
                      }}
                      title={theme.name}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 text-white drop-shadow" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 text-xs">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-slate-400" />
              <span>Alarm Sounds & Audio Chimes</span>
            </div>
            <input
              type="checkbox"
              checked={soundEnabled}
              onChange={(e) => setSoundEnabled(e.target.checked)}
              className="w-4 h-4 accent-indigo-500 rounded cursor-pointer"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 px-4 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
          >
            {savedSuccess ? (
              <>
                <Check className="w-4 h-4" />
                <span>Saved!</span>
              </>
            ) : (
              <span>Save Profile Changes</span>
            )}
          </button>
        </form>

        {/* Data Persistence Tools */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
          <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Backup & Data Management (LocalStorage)
          </span>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleExport}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium border transition cursor-pointer ${
                darkMode
                  ? 'border-slate-800 bg-slate-800/60 hover:bg-slate-800 text-slate-300'
                  : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium border transition cursor-pointer ${
                darkMode
                  ? 'border-slate-800 bg-slate-800/60 hover:bg-slate-800 text-slate-300'
                  : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import JSON</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
            />
          </div>

          {onLoadStarterSkills && skills.length === 0 && (
            <button
              onClick={() => {
                onLoadStarterSkills();
                onClose();
              }}
              className="w-full py-2 px-3 rounded-lg text-xs font-semibold bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/30 transition flex items-center justify-center gap-1.5 mt-2 cursor-pointer"
            >
              <span>⚡ Load Starter Sample Skills (JS, Python, SQL)</span>
            </button>
          )}

          {onLogout && (
            <button
              onClick={() => {
                onLogout();
                onClose();
              }}
              className="w-full py-1.5 text-xs text-slate-400 hover:text-rose-400 transition flex items-center justify-center gap-1 mt-2 cursor-pointer"
            >
              <span>Log out of this account</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
