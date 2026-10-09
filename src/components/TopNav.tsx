import React, { useState } from 'react';
import { Bell, Moon, Sun, Plus, Timer, User, LogOut, Palette, Share2, Check } from 'lucide-react';
import { StudyAlarm } from '../types';

interface TopNavProps {
  darkMode: boolean;
  onToggleTheme: () => void;
  activeTab: 'dashboard' | 'skills' | 'activity' | 'timer' | 'alarms';
  onSelectTab: (tab: 'dashboard' | 'skills' | 'activity' | 'timer' | 'alarms') => void;
  onOpenAddSkill: () => void;
  onOpenAlarmsModal: () => void;
  onOpenProfile: () => void;
  onOpenThemeSelector: () => void;
  onLogout: () => void;
  alarms: StudyAlarm[];
  userName: string;
}

export const TopNav: React.FC<TopNavProps> = ({
  darkMode,
  onToggleTheme,
  activeTab,
  onSelectTab,
  onOpenAddSkill,
  onOpenAlarmsModal,
  onOpenProfile,
  onOpenThemeSelector,
  onLogout,
  alarms,
  userName,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const activeAlarmsCount = alarms.filter((a) => a.enabled).length;

  const handleShareApp = () => {
    const shareUrl = window.location.origin.includes('ais-dev-')
      ? window.location.origin.replace('ais-dev-', 'ais-pre-')
      : window.location.origin;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      });
    }
  };

  return (
    <header
      className={`sticky top-0 z-40 w-full backdrop-blur-md transition-colors border-b ${
        darkMode
          ? 'bg-[#0F172A]/80 border-slate-800/80 text-slate-100'
          : 'bg-white/80 border-slate-200/80 text-slate-900'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Zone 1: Brand Zone - Single clean wordmark */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onSelectTab('dashboard')}
            className="flex items-center gap-2 group text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-md"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-sky-400 flex items-center justify-center text-white font-bold text-base shadow-sm">
              S
            </div>
            <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400 bg-clip-text text-transparent">
              SkillTracker
            </span>
          </button>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => onSelectTab('dashboard')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors cursor-pointer ${
              activeTab === 'dashboard'
                ? darkMode
                  ? 'text-white bg-slate-800'
                  : 'text-slate-900 bg-slate-100'
                : darkMode
                ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => onSelectTab('skills')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors cursor-pointer ${
              activeTab === 'skills'
                ? darkMode
                  ? 'text-white bg-slate-800'
                  : 'text-slate-900 bg-slate-100'
                : darkMode
                ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
            }`}
          >
            My Skills
          </button>
          <button
            onClick={() => onSelectTab('activity')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors cursor-pointer ${
              activeTab === 'activity'
                ? darkMode
                  ? 'text-white bg-slate-800'
                  : 'text-slate-900 bg-slate-100'
                : darkMode
                ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
            }`}
          >
            Weekly Activity
          </button>
          <button
            onClick={() => onSelectTab('timer')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'timer'
                ? darkMode
                  ? 'text-white bg-slate-800'
                  : 'text-slate-900 bg-slate-100'
                : darkMode
                ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
            }`}
          >
            <Timer className="w-4 h-4 text-emerald-500" />
            <span>Focus Timer</span>
          </button>
          <button
            onClick={() => onSelectTab('alarms')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'alarms'
                ? darkMode
                  ? 'text-white bg-slate-800'
                  : 'text-slate-900 bg-slate-100'
                : darkMode
                ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
            }`}
          >
            <Bell className="w-4 h-4 text-amber-500" />
            <span>Study Alarms</span>
            {activeAlarmsCount > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            )}
          </button>
        </nav>

        {/* Zone 3: Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Add Skill button */}
          <button
            onClick={onOpenAddSkill}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 rounded-lg transition-all shadow-sm cursor-pointer whitespace-nowrap"
            title="Add a new skill to track"
          >
            <Plus className="w-4 h-4" />
            <span>Add Skill</span>
          </button>

          {/* Background Theme Color (ReactBits) */}
          <button
            onClick={onOpenThemeSelector}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              darkMode
                ? 'text-indigo-400 hover:bg-slate-800'
                : 'text-indigo-600 hover:bg-slate-100'
            }`}
            title="Change Background Colour & Animation (ReactBits)"
            aria-label="Change Background Theme"
          >
            <Palette className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Share Public App Link with Friends */}
          <button
            onClick={handleShareApp}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              copiedLink
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : darkMode
                ? 'text-sky-400 hover:bg-slate-800'
                : 'text-sky-600 hover:bg-slate-100'
            }`}
            title="Share Public Link with Friends (auto-copies link)"
            aria-label="Share App Link"
          >
            {copiedLink ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="hidden sm:inline">Link Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">Share</span>
              </>
            )}
          </button>

          {/* Alarm Center button */}
          <button
            onClick={onOpenAlarmsModal}
            className={`relative p-2 rounded-lg transition-colors cursor-pointer ${
              darkMode
                ? 'text-slate-300 hover:bg-slate-800'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
            title="Study Alarms & Reminders"
            aria-label="Study Alarms"
          >
            <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
            {activeAlarmsCount > 0 && (
              <span className="absolute top-1 right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
              </span>
            )}
          </button>

          {/* Dark / Light Mode Toggle */}
          <button
            onClick={onToggleTheme}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              darkMode
                ? 'text-slate-300 hover:bg-slate-800'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle Theme"
          >
            {darkMode ? (
              <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700" />
            )}
          </button>

          {/* Profile Button */}
          <button
            onClick={onOpenProfile}
            className={`flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
              darkMode
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
            }`}
            title="Account & Data settings"
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white text-xs font-semibold">
              {userName ? userName.charAt(0).toUpperCase() : 'U'}
            </div>
            <span className="hidden sm:inline font-medium">{userName || 'Student'}</span>
          </button>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              darkMode
                ? 'text-slate-400 hover:text-rose-400 hover:bg-slate-800'
                : 'text-slate-500 hover:text-rose-600 hover:bg-slate-100'
            }`}
            title="Log Out of SkillTracker"
            aria-label="Log Out"
          >
            <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div
        className={`md:hidden flex items-center justify-around px-2 py-2 border-t text-xs ${
          darkMode ? 'border-slate-800 bg-[#0F172A]/90' : 'border-slate-200 bg-white/90'
        }`}
      >
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`px-2 py-1 rounded font-medium ${
            activeTab === 'dashboard'
              ? 'text-indigo-500 font-semibold'
              : darkMode ? 'text-slate-400' : 'text-slate-600'
          }`}
        >
          Dashboard
        </button>
        <button
          onClick={() => onSelectTab('skills')}
          className={`px-2 py-1 rounded font-medium ${
            activeTab === 'skills'
              ? 'text-indigo-500 font-semibold'
              : darkMode ? 'text-slate-400' : 'text-slate-600'
          }`}
        >
          Skills
        </button>
        <button
          onClick={() => onSelectTab('activity')}
          className={`px-2 py-1 rounded font-medium ${
            activeTab === 'activity'
              ? 'text-indigo-500 font-semibold'
              : darkMode ? 'text-slate-400' : 'text-slate-600'
          }`}
        >
          Activity
        </button>
        <button
          onClick={() => onSelectTab('timer')}
          className={`px-2 py-1 rounded font-medium flex items-center gap-1 ${
            activeTab === 'timer'
              ? 'text-emerald-500 font-semibold'
              : darkMode ? 'text-slate-400' : 'text-slate-600'
          }`}
        >
          <Timer className="w-3.5 h-3.5" />
          <span>Timer</span>
        </button>
        <button
          onClick={() => onSelectTab('alarms')}
          className={`px-2 py-1 rounded font-medium flex items-center gap-1 ${
            activeTab === 'alarms'
              ? 'text-amber-500 font-semibold'
              : darkMode ? 'text-slate-400' : 'text-slate-600'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>Alarms</span>
        </button>
      </div>
    </header>
  );
};
