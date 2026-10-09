/**
 * SkillTracker - Full-Stack Student Learning & Habit Tracker
 * React + TypeScript + Express backend + Database Persistence
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search,
  Filter,
  Plus,
  ArrowUpDown,
  BookOpen,
  Bell,
  Sparkles,
  Flame,
  CheckCircle,
  Clock,
  RotateCcw,
  Palette,
} from 'lucide-react';
import { Skill, StudyAlarm, StudentProfile, SkillCategory } from './types';
import {
  getFormattedDate,
  calculateStreak,
} from './utils/storage';
import {
  authApi,
  skillsApi,
  alarmsApi,
  getStoredToken,
  AuthResponse,
} from './utils/api';
import { AnimatedBackground } from './components/AnimatedBackground';
import { TopNav } from './components/TopNav';
import { DashboardStats } from './components/DashboardStats';
import { SkillCard } from './components/SkillCard';
import { WeeklyActivityChart } from './components/WeeklyActivityChart';
import { FocusTimer } from './components/FocusTimer';
import { DailyCheckinBanner } from './components/DailyCheckinBanner';
import { AddEditSkillModal } from './components/AddEditSkillModal';
import { LogStudyTimeModal } from './components/LogStudyTimeModal';
import { AlarmManagerModal } from './components/AlarmManagerModal';
import { ActiveAlarmModal } from './components/ActiveAlarmModal';
import { ProfileModal } from './components/ProfileModal';
import { GoalCelebrationToast } from './components/GoalCelebrationToast';
import { AuthPage } from './components/AuthPage';
import { triggerGoalCompletedConfetti } from './utils/confetti';
import { useAlarmWatcher } from './hooks/useAlarmWatcher';
import { BgThemeId } from './components/ReactBitsBackground';
import { ThemeSelectorPopover } from './components/ThemeSelectorPopover';
import { StudyTipsFAB } from './components/StudyTipsFAB';

export default function App() {
  // Authentication state
  const [currentUser, setCurrentUser] = useState<AuthResponse['user'] | null>(null);
  const [authChecking, setAuthChecking] = useState(true);

  // User-specific data states (Empty by default for new users!)
  const [skills, setSkills] = useState<Skill[]>([]);
  const [alarms, setAlarms] = useState<StudyAlarm[]>([]);
  const [profile, setProfile] = useState<StudentProfile>({
    name: '',
    dailyGoalHours: 2.0,
    streak: 0,
    lastActiveDate: getFormattedDate(),
    darkMode: true,
    soundEnabled: true,
  });

  // UI state
  const [activeTab, setActiveTab] = useState<'dashboard' | 'skills' | 'activity' | 'timer' | 'alarms'>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'progress' | 'name' | 'hours' | 'days'>('progress');

  // Modals state
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [loggingSkill, setLoggingSkill] = useState<Skill | null>(null);
  const [isAlarmManagerOpen, setIsAlarmManagerOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [activeRingingAlarm, setActiveRingingAlarm] = useState<StudyAlarm | null>(null);
  const [goalCelebration, setGoalCelebration] = useState<{
    skillName: string;
    hoursToday: number;
    dailyTargetHours: number;
  } | null>(null);

  // ReactBits background theme & custom shade state
  const [bgThemeId, setBgThemeId] = useState<BgThemeId>(
    () => (localStorage.getItem('skilltracker_bg_theme') as BgThemeId) || 'cosmic-aurora'
  );
  const [customBgShade, setCustomBgShade] = useState<string | undefined>(
    () => localStorage.getItem('skilltracker_bg_shade') || undefined
  );
  const [isThemeSelectorOpen, setIsThemeSelectorOpen] = useState(false);

  const handleSelectBgTheme = (newThemeId: BgThemeId) => {
    setBgThemeId(newThemeId);
    localStorage.setItem('skilltracker_bg_theme', newThemeId);
  };

  const handleSelectBgShade = (shadeHex: string) => {
    setCustomBgShade(shadeHex);
    localStorage.setItem('skilltracker_bg_shade', shadeHex);
  };

  const handleResetShadeToDefault = () => {
    setCustomBgShade(undefined);
    localStorage.removeItem('skilltracker_bg_shade');
  };

  // Check existing session token on application load
  useEffect(() => {
    async function checkSession() {
      const token = getStoredToken();
      if (!token) {
        setAuthChecking(false);
        return;
      }
      try {
        const { user } = await authApi.getMe();
        setCurrentUser(user);
        setProfile({
          name: user.name,
          dailyGoalHours: user.dailyGoalHours,
          streak: user.streak,
          lastActiveDate: getFormattedDate(),
          darkMode: user.darkMode,
          soundEnabled: user.soundEnabled,
        });

        // Load user-specific skills and alarms from database
        const [userSkills, userAlarms] = await Promise.all([
          skillsApi.getSkills(),
          alarmsApi.getAlarms(),
        ]);
        setSkills(userSkills);
        setAlarms(userAlarms);
      } catch (err) {
        console.warn('Session check failed, clearing token');
        authApi.logout();
        setCurrentUser(null);
      } finally {
        setAuthChecking(false);
      }
    }

    checkSession();
  }, []);

  // When user signs in or registers successfully
  const handleAuthSuccess = async (user: AuthResponse['user']) => {
    setCurrentUser(user);
    setProfile({
      name: user.name,
      dailyGoalHours: user.dailyGoalHours,
      streak: user.streak,
      lastActiveDate: getFormattedDate(),
      darkMode: user.darkMode,
      soundEnabled: user.soundEnabled,
    });

    try {
      // Newly registered users start with an EMPTY skill list!
      const [userSkills, userAlarms] = await Promise.all([
        skillsApi.getSkills(),
        alarmsApi.getAlarms(),
      ]);
      setSkills(userSkills);
      setAlarms(userAlarms);
    } catch (err) {
      console.error('Failed to load user skills on login', err);
    }
  };

  // Log out handler
  const handleLogout = () => {
    authApi.logout();
    setCurrentUser(null);
    setSkills([]);
    setAlarms([]);
    setActiveTab('dashboard');
  };

  // Alarm Watcher Hook
  const handleTriggerAlarm = useCallback((alarm: StudyAlarm) => {
    setActiveRingingAlarm(alarm);
  }, []);

  useAlarmWatcher({
    alarms,
    skills,
    onTriggerAlarm: handleTriggerAlarm,
  });

  // Dark mode class toggle on <html>
  useEffect(() => {
    if (profile.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [profile.darkMode]);

  const toggleTheme = async () => {
    const nextDark = !profile.darkMode;
    setProfile((prev) => ({ ...prev, darkMode: nextDark }));
    if (currentUser) {
      try {
        await authApi.updateProfile({ darkMode: nextDark });
      } catch (err) {
        // quiet fallback
      }
    }
  };

  // Skill Actions (Connected to backend API)
  const handleSaveSkill = async (
    skillData: Omit<Skill, 'id' | 'createdAt' | 'completedDays' | 'totalHoursPracticed' | 'history' | 'checkedDays'> & { id?: string }
  ) => {
    try {
      if (skillData.id) {
        // Update existing skill in database
        const updated = await skillsApi.updateSkill(skillData.id, skillData);
        setSkills((prev) => prev.map((s) => (s.id === skillData.id ? { ...s, ...updated } : s)));
      } else {
        // Create new skill in database
        const created = await skillsApi.createSkill(skillData);
        setSkills((prev) => [created, ...prev]);
      }

      // Refresh alarms in case alarm was created/updated
      const refreshedAlarms = await alarmsApi.getAlarms();
      setAlarms(refreshedAlarms);
    } catch (err) {
      console.error('Failed to save skill:', err);
      alert('Could not save skill to database.');
    } finally {
      setIsAddEditOpen(false);
      setEditingSkill(null);
    }
  };

  const handleDeleteSkill = async (skillId: string) => {
    const s = skills.find((item) => item.id === skillId);
    if (!s) return;
    if (window.confirm(`Are you sure you want to delete "${s.name}"?`)) {
      try {
        await skillsApi.deleteSkill(skillId);
        setSkills((prev) => prev.filter((item) => item.id !== skillId));
        setAlarms((prev) => prev.filter((a) => a.skillId !== skillId));
      } catch (err) {
        console.error('Failed to delete skill:', err);
        alert('Could not delete skill from database.');
      }
    }
  };

  // Quick log time
  const handleQuickLogTime = async (skillId: string, hours: number) => {
    const today = getFormattedDate();
    const targetSkill = skills.find((s) => s.id === skillId);
    if (targetSkill) {
      const currentTodayHours = targetSkill.history?.[today] || 0;
      const newTodayHours = currentTodayHours + hours;
      // Trigger confetti celebration if student crosses the daily target today
      if (currentTodayHours < targetSkill.dailyTargetHours && newTodayHours >= targetSkill.dailyTargetHours) {
        triggerGoalCompletedConfetti(targetSkill.name);
        setGoalCelebration({
          skillName: targetSkill.name,
          hoursToday: newTodayHours,
          dailyTargetHours: targetSkill.dailyTargetHours,
        });
      }
    }

    // Optimistic UI update
    setSkills((prev) =>
      prev.map((s) => {
        if (s.id !== skillId) return s;
        const currentTodayHours = s.history?.[today] || 0;
        const newHistory = { ...s.history, [today]: currentTodayHours + hours };
        const newCheckedDays = { ...s.checkedDays, [today]: true };

        return {
          ...s,
          totalHoursPracticed: (s.totalHoursPracticed || 0) + hours,
          history: newHistory,
          checkedDays: newCheckedDays,
        };
      })
    );

    try {
      const res = await skillsApi.logStudy(skillId, hours, today);
      if (res.streak !== undefined) {
        setProfile((prev) => ({ ...prev, streak: res.streak }));
      }
    } catch (err) {
      console.error('Failed to persist study log:', err);
    }
  };

  // Modal custom log save
  const handleSaveStudyLog = async (skillId: string, hours: number, date: string, notes?: string) => {
    const today = getFormattedDate();
    const targetSkill = skills.find((s) => s.id === skillId);
    if (targetSkill && date === today) {
      const currentTodayHours = targetSkill.history?.[today] || 0;
      const newTodayHours = currentTodayHours + hours;
      // Trigger confetti celebration if student crosses the daily target today
      if (currentTodayHours < targetSkill.dailyTargetHours && newTodayHours >= targetSkill.dailyTargetHours) {
        triggerGoalCompletedConfetti(targetSkill.name);
        setGoalCelebration({
          skillName: targetSkill.name,
          hoursToday: newTodayHours,
          dailyTargetHours: targetSkill.dailyTargetHours,
        });
      }
    }

    // Optimistic UI update
    setSkills((prev) =>
      prev.map((s) => {
        if (s.id !== skillId) return s;
        const currentHoursOnDate = s.history?.[date] || 0;
        const newHistory = { ...s.history, [date]: currentHoursOnDate + hours };
        const newCheckedDays = { ...s.checkedDays, [date]: true };

        return {
          ...s,
          totalHoursPracticed: (s.totalHoursPracticed || 0) + hours,
          history: newHistory,
          checkedDays: newCheckedDays,
          notes: notes || s.notes,
        };
      })
    );

    try {
      const res = await skillsApi.logStudy(skillId, hours, date, notes);
      if (res.streak !== undefined) {
        setProfile((prev) => ({ ...prev, streak: res.streak }));
      }
    } catch (err) {
      console.error('Failed to persist custom study log:', err);
    }
  };

  // Toggle checkmark for today
  const handleToggleTodayCheck = async (skillId: string) => {
    const today = getFormattedDate();
    const targetSkill = skills.find((s) => s.id === skillId);
    if (!targetSkill) return;

    const isAlreadyChecked = Boolean(targetSkill.checkedDays?.[today]);
    const newChecked = !isAlreadyChecked;

    if (newChecked) {
      const currentTodayHours = targetSkill.history?.[today] || 0;
      const expectedHours = currentTodayHours > 0 ? currentTodayHours : targetSkill.dailyTargetHours;
      if (expectedHours >= targetSkill.dailyTargetHours) {
        triggerGoalCompletedConfetti(targetSkill.name);
        setGoalCelebration({
          skillName: targetSkill.name,
          hoursToday: expectedHours,
          dailyTargetHours: targetSkill.dailyTargetHours,
        });
      }
    }

    setSkills((prev) =>
      prev.map((s) => {
        if (s.id !== skillId) return s;
        const newCheckedDays = { ...s.checkedDays, [today]: newChecked };

        let newHistory = { ...s.history };
        let newTotal = s.totalHoursPracticed;
        let newCompletedDays = s.completedDays;

        if (newChecked) {
          newCompletedDays = Math.min(s.targetDays, s.completedDays + 1);
          if (!newHistory[today]) {
            newHistory[today] = s.dailyTargetHours;
            newTotal += s.dailyTargetHours;
          }
        } else {
          newCompletedDays = Math.max(0, s.completedDays - 1);
        }

        return {
          ...s,
          completedDays: newCompletedDays,
          totalHoursPracticed: newTotal,
          history: newHistory,
          checkedDays: newCheckedDays,
        };
      })
    );

    try {
      await skillsApi.checkIn(skillId, today, newChecked);
    } catch (err) {
      console.error('Failed to toggle checkin:', err);
    }
  };

  // Toggle skill alarm indicator
  const handleToggleSkillAlarm = async (skillId: string) => {
    const s = skills.find((item) => item.id === skillId);
    if (!s) return;
    const newState = !s.alarmEnabled;

    setSkills((prev) =>
      prev.map((item) => (item.id === skillId ? { ...item, alarmEnabled: newState } : item))
    );

    try {
      await skillsApi.updateSkill(skillId, { alarmEnabled: newState });
      const refreshedAlarms = await alarmsApi.getAlarms();
      setAlarms(refreshedAlarms);
    } catch (err) {
      console.error('Failed to toggle alarm:', err);
    }
  };

  // Alarm Management Handlers
  const handleSaveAlarm = async (newAlarm: StudyAlarm) => {
    try {
      const exists = alarms.find((a) => a.id === newAlarm.id);
      if (exists) {
        await alarmsApi.updateAlarm(newAlarm.id, newAlarm);
      } else {
        await alarmsApi.createAlarm(newAlarm);
      }
      const refreshed = await alarmsApi.getAlarms();
      setAlarms(refreshed);
    } catch (err) {
      console.error('Failed to save alarm:', err);
    }
  };

  const handleDeleteAlarm = async (alarmId: string) => {
    try {
      await alarmsApi.deleteAlarm(alarmId);
      setAlarms((prev) => prev.filter((a) => a.id !== alarmId));
    } catch (err) {
      console.error('Failed to delete alarm:', err);
    }
  };

  const handleToggleAlarm = async (alarmId: string) => {
    const alarm = alarms.find((a) => a.id === alarmId);
    if (!alarm) return;
    const nextState = !alarm.enabled;

    setAlarms((prev) =>
      prev.map((a) => (a.id === alarmId ? { ...a, enabled: nextState } : a))
    );

    try {
      await alarmsApi.updateAlarm(alarmId, { enabled: nextState });
    } catch (err) {
      console.error('Failed to toggle alarm:', err);
    }
  };

  const handleTriggerTestAlarm = (alarm: StudyAlarm) => {
    setActiveRingingAlarm(alarm);
  };

  const handleSnoozeAlarm = (minutes: number) => {
    if (!activeRingingAlarm) return;
    const snoozeUntil = Date.now() + minutes * 60 * 1000;
    setAlarms((prev) =>
      prev.map((a) =>
        a.id === activeRingingAlarm.id ? { ...a, snoozedUntil: snoozeUntil } : a
      )
    );
    setActiveRingingAlarm(null);
  };

  const handleStartStudyFromAlarm = () => {
    setActiveRingingAlarm(null);
    setActiveTab('timer');
  };

  // Optional: Seed starter skills if requested in settings or empty state
  const handleSeedStarterSkills = async () => {
    try {
      await skillsApi.seedStarterSkills();
      const [refreshedSkills, refreshedAlarms] = await Promise.all([
        skillsApi.getSkills(),
        alarmsApi.getAlarms(),
      ]);
      setSkills(refreshedSkills);
      setAlarms(refreshedAlarms);
    } catch (err) {
      console.error('Failed to load starter sample skills:', err);
    }
  };

  // Filtered & Sorted skills
  const filteredSkills = useMemo(() => {
    return skills
      .filter((s) => {
        const matchesCategory =
          selectedCategory === 'All' || s.category.toLowerCase() === selectedCategory.toLowerCase();
        const matchesSearch =
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.goal.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'progress') {
          const progA = a.completedDays / (a.targetDays || 1);
          const progB = b.completedDays / (b.targetDays || 1);
          return progB - progA;
        }
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'hours') return b.totalHoursPracticed - a.totalHoursPracticed;
        if (sortBy === 'days') return b.completedDays - a.completedDays;
        return 0;
      });
  }, [skills, searchQuery, selectedCategory, sortBy]);

  const ringingSkill = activeRingingAlarm
    ? skills.find((s) => s.id === activeRingingAlarm.skillId)
    : undefined;

  // Render Loading spinner during initial auth check
  if (authChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#090D16] text-white">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium text-slate-400">Loading SkillTracker...</p>
        </div>
      </div>
    );
  }

  // Render Login & Registration Page when not authenticated
  if (!currentUser) {
    return (
      <div className="min-h-screen relative font-sans">
        <AnimatedBackground
          darkMode={profile.darkMode}
          themeId={bgThemeId}
          customBgShade={customBgShade}
        />
        {/* Quick Theme Switcher Button for Auth View */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
          <button
            onClick={() => setIsThemeSelectorOpen(true)}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-indigo-400 border border-slate-700/60 shadow-lg backdrop-blur-md transition-all cursor-pointer flex items-center gap-2 text-xs font-medium"
            title="Customize Background Colour & ReactBits Aurora"
            aria-label="Customize Background"
          >
            <Palette className="w-4 h-4" />
            <span className="hidden sm:inline">Change Background</span>
          </button>
        </div>
        <AuthPage
          darkMode={profile.darkMode}
          onAuthSuccess={handleAuthSuccess}
        />
        {isThemeSelectorOpen && (
          <ThemeSelectorPopover
            currentThemeId={bgThemeId}
            currentBgShade={customBgShade}
            darkMode={profile.darkMode}
            onSelectTheme={handleSelectBgTheme}
            onSelectBgShade={handleSelectBgShade}
            onResetShadeToDefault={handleResetShadeToDefault}
            onClose={() => setIsThemeSelectorOpen(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className={`min-h-screen relative font-sans ${profile.darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
      {/* Animated Glowing Background (ReactBits Aurora) */}
      <AnimatedBackground
        darkMode={profile.darkMode}
        themeId={bgThemeId}
        customBgShade={customBgShade}
      />

      {/* Top Bar Navigation */}
      <TopNav
        darkMode={profile.darkMode}
        onToggleTheme={toggleTheme}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenAddSkill={() => {
          setEditingSkill(null);
          setIsAddEditOpen(true);
        }}
        onOpenAlarmsModal={() => setIsAlarmManagerOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenThemeSelector={() => setIsThemeSelectorOpen(true)}
        onLogout={handleLogout}
        alarms={alarms}
        userName={profile.name}
      />

      {/* Main Content Viewport */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
        {/* Render Tab Contents */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Welcome & 4 Metric Cards */}
            <DashboardStats
              userName={profile.name}
              skills={skills}
              alarms={alarms}
              streak={profile.streak}
              dailyGoalHours={profile.dailyGoalHours}
              darkMode={profile.darkMode}
              onOpenFocusTimer={() => setActiveTab('timer')}
              onOpenAlarmsModal={() => setIsAlarmManagerOpen(true)}
            />

            {/* Daily Habit Check & Streak Heatmap */}
            <DailyCheckinBanner
              skills={skills}
              streak={profile.streak}
              darkMode={profile.darkMode}
              onToggleCheck={handleToggleTodayCheck}
            />

            {/* Skills Overview Section */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div>
                  <h2 className={`text-xl font-bold tracking-tight ${profile.darkMode ? 'text-white' : 'text-slate-900'}`}>
                    My Learning Skills
                  </h2>
                  <p className={`text-xs ${profile.darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    {skills.length === 0
                      ? 'No skills added yet'
                      : `Showing ${filteredSkills.length} of ${skills.length} skills`}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingSkill(null);
                      setIsAddEditOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition shadow-xs cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add New Skill</span>
                  </button>
                </div>
              </div>

              {/* Empty State for New Users (Requirement 2) */}
              {skills.length === 0 ? (
                <div
                  className={`text-center py-12 px-6 rounded-2xl border transition-all ${
                    profile.darkMode
                      ? 'bg-slate-900/60 border-slate-800'
                      : 'bg-white border-slate-200 shadow-sm'
                  }`}
                >
                  <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                    <BookOpen className="w-7 h-7" />
                  </div>
                  <h3 className={`text-xl font-bold tracking-tight mb-2 ${profile.darkMode ? 'text-white' : 'text-slate-900'}`}>
                    No skills yet
                  </h3>
                  <p className={`text-sm max-w-md mx-auto mb-6 ${profile.darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    Add your first skill to start tracking your progress. Set your target days, daily study hours, and reminder alarms!
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <button
                      onClick={() => {
                        setEditingSkill(null);
                        setIsAddEditOpen(true);
                      }}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm text-white bg-indigo-600 hover:bg-indigo-500 transition shadow-sm cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Your First Skill</span>
                    </button>
                    <button
                      onClick={handleSeedStarterSkills}
                      className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium border transition cursor-pointer ${
                        profile.darkMode
                          ? 'border-slate-800 bg-slate-800/60 hover:bg-slate-800 text-slate-300'
                          : 'border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                      title="Load starter sample skills to explore features"
                    >
                      <span>⚡ Load Sample Skills</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Skills Grid */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                  {filteredSkills.map((skill) => (
                    <SkillCard
                      key={skill.id}
                      skill={skill}
                      darkMode={profile.darkMode}
                      onEdit={(s) => {
                        setEditingSkill(s);
                        setIsAddEditOpen(true);
                      }}
                      onDelete={handleDeleteSkill}
                      onQuickLogTime={handleQuickLogTime}
                      onOpenLogModal={(s) => setLoggingSkill(s)}
                      onToggleTodayCheck={handleToggleTodayCheck}
                      onToggleAlarm={handleToggleSkillAlarm}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Weekly Activity Breakdown */}
            <WeeklyActivityChart
              skills={skills}
              dailyGoalHours={profile.dailyGoalHours}
              darkMode={profile.darkMode}
            />
          </div>
        )}

        {activeTab === 'skills' && (
          <div className="space-y-6">
            {/* Section Header with Search & Filter controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className={`text-2xl font-bold tracking-tight ${profile.darkMode ? 'text-white' : 'text-slate-900'}`}>
                  Skill Management
                </h1>
                <p className={`text-xs sm:text-sm ${profile.darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Manage targets, daily study hours, and reminder alarms for each skill
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingSkill(null);
                  setIsAddEditOpen(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition shadow-sm cursor-pointer self-start md:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Add Skill</span>
              </button>
            </div>

            {/* Filter and Search Bar */}
            <div
              className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                profile.darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'
              }`}
            >
              {/* Search input */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search skills (e.g. JavaScript, Python, SQL)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-9 pr-4 py-2 rounded-lg text-xs border ${
                    profile.darkMode
                      ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-400'
                      : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-500'
                  }`}
                />
              </div>

              {/* Segmented Category Buttons */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                {['All', 'Programming', 'Data', 'Communication', 'Languages', 'Design'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-indigo-600 text-white font-semibold'
                        : profile.darkMode
                        ? 'bg-slate-800 text-slate-400 hover:text-slate-200'
                        : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Sort selector */}
              <div className="flex items-center gap-2 shrink-0">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs border ${
                    profile.darkMode
                      ? 'bg-slate-800 border-slate-700 text-white'
                      : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                >
                  <option value="progress">Sort by Progress %</option>
                  <option value="name">Sort by Name (A-Z)</option>
                  <option value="hours">Sort by Total Hours</option>
                  <option value="days">Sort by Days Done</option>
                </select>
              </div>
            </div>

            {/* Skills Grid */}
            {filteredSkills.length === 0 ? (
              <div
                className={`text-center py-12 rounded-2xl border ${
                  profile.darkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'
                }`}
              >
                <BookOpen className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
                <h3 className="text-base font-semibold mb-1">
                  {skills.length === 0 ? 'No skills yet' : 'No matching skills found'}
                </h3>
                <p className={`text-xs mb-4 ${profile.darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  {skills.length === 0
                    ? 'Add your first skill to start tracking your progress.'
                    : 'Try clearing your search or category filters.'}
                </p>
                <button
                  onClick={() => {
                    if (skills.length === 0) {
                      setEditingSkill(null);
                      setIsAddEditOpen(true);
                    } else {
                      setSearchQuery('');
                      setSelectedCategory('All');
                    }
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white"
                >
                  {skills.length === 0 ? '+ Add Skill' : 'Clear Filters'}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredSkills.map((skill) => (
                  <SkillCard
                    key={skill.id}
                    skill={skill}
                    darkMode={profile.darkMode}
                    onEdit={(s) => {
                      setEditingSkill(s);
                      setIsAddEditOpen(true);
                    }}
                    onDelete={handleDeleteSkill}
                    onQuickLogTime={handleQuickLogTime}
                    onOpenLogModal={(s) => setLoggingSkill(s)}
                    onToggleTodayCheck={handleToggleTodayCheck}
                    onToggleAlarm={handleToggleSkillAlarm}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="space-y-6">
            <WeeklyActivityChart
              skills={skills}
              dailyGoalHours={profile.dailyGoalHours}
              darkMode={profile.darkMode}
            />

            <DailyCheckinBanner
              skills={skills}
              streak={profile.streak}
              darkMode={profile.darkMode}
              onToggleCheck={handleToggleTodayCheck}
            />
          </div>
        )}

        {activeTab === 'timer' && (
          <div className="space-y-6">
            <FocusTimer
              skills={skills}
              darkMode={profile.darkMode}
              onLogStudyTime={(skillId, hours, notes) =>
                handleSaveStudyLog(skillId, hours, getFormattedDate(), notes)
              }
            />
          </div>
        )}

        {activeTab === 'alarms' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className={`text-2xl font-bold tracking-tight ${profile.darkMode ? 'text-white' : 'text-slate-900'}`}>
                  Student Study Alarms
                </h1>
                <p className={`text-xs sm:text-sm ${profile.darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Scheduled study alarms to keep {profile.name || 'you'} focused and on streak
                </p>
              </div>
              <button
                onClick={() => setIsAlarmManagerOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-xl transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>New Alarm</span>
              </button>
            </div>

            {/* Quick Test Alarm trigger banner */}
            <div
              className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                profile.darkMode
                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Bell className="w-5 h-5 text-amber-500 shrink-0" />
                <div className="text-xs">
                  <strong className="block font-semibold">Test the Alarm Feature:</strong>
                  <span>Click below to see the animated alarm ring alert and hear the chime sound!</span>
                </div>
              </div>
              <button
                onClick={() =>
                  handleTriggerTestAlarm(
                    alarms[0] || {
                      id: 'test',
                      title: 'Study Reminder',
                      time: '19:00',
                      enabled: true,
                      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
                      soundType: 'bell',
                    }
                  )
                }
                className="px-4 py-2 rounded-lg font-semibold text-xs bg-amber-600 hover:bg-amber-500 text-white transition shadow-sm cursor-pointer shrink-0"
              >
                Trigger Test Alarm 🔔
              </button>
            </div>

            {/* Alarms list inline view */}
            {alarms.length === 0 ? (
              <div className={`p-8 text-center rounded-2xl border ${profile.darkMode ? 'bg-slate-900/60 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-600'}`}>
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-40 text-amber-500" />
                <p className="text-sm font-semibold mb-1">No study alarms set yet</p>
                <p className="text-xs mb-4">Set scheduled reminder chimes to build reliable daily study routines.</p>
                <button
                  onClick={() => setIsAlarmManagerOpen(true)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 text-white"
                >
                  Create Study Alarm
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {alarms.map((alarm) => {
                  const linkedSkill = skills.find((s) => s.id === alarm.skillId);
                  return (
                    <div
                      key={alarm.id}
                      className={`p-5 rounded-xl border flex items-center justify-between gap-3 ${
                        alarm.enabled
                          ? profile.darkMode
                            ? 'bg-slate-900/80 border-slate-800'
                            : 'bg-white border-slate-200 shadow-xs'
                          : profile.darkMode
                          ? 'bg-slate-900/40 border-slate-800/40 opacity-60'
                          : 'bg-slate-50 border-slate-200 opacity-60'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-2xl font-bold font-mono tabular-nums">
                            {alarm.time}
                          </span>
                          <span
                            className={`text-xs font-semibold px-2 py-0.5 rounded ${
                              alarm.enabled
                                ? 'bg-amber-500/10 text-amber-500'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {alarm.enabled ? 'Active' : 'Muted'}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold">{alarm.title}</h4>
                        <p className="text-xs text-slate-400 mt-1">
                          {linkedSkill ? `Skill: ${linkedSkill.name} · ` : ''}Tone: {alarm.soundType}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <button
                          onClick={() => handleToggleAlarm(alarm.id)}
                          className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${
                            alarm.enabled ? 'bg-amber-500' : 'bg-slate-700'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-full bg-white transition-transform ${
                              alarm.enabled ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                        <button
                          onClick={() => handleTriggerTestAlarm(alarm)}
                          className="text-xs text-amber-500 hover:underline font-medium cursor-pointer"
                        >
                          Ring now 🔔
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* MODALS */}
      {/* 1. Add / Edit Skill Modal */}
      {isAddEditOpen && (
        <AddEditSkillModal
          initialSkill={editingSkill}
          darkMode={profile.darkMode}
          onClose={() => {
            setIsAddEditOpen(false);
            setEditingSkill(null);
          }}
          onSave={handleSaveSkill}
        />
      )}

      {/* 2. Custom Study Time Log Modal */}
      {loggingSkill && (
        <LogStudyTimeModal
          skill={loggingSkill}
          darkMode={profile.darkMode}
          onClose={() => setLoggingSkill(null)}
          onSaveLog={handleSaveStudyLog}
        />
      )}

      {/* 3. Alarm Manager Modal */}
      {isAlarmManagerOpen && (
        <AlarmManagerModal
          alarms={alarms}
          skills={skills}
          darkMode={profile.darkMode}
          onClose={() => setIsAlarmManagerOpen(false)}
          onSaveAlarm={handleSaveAlarm}
          onDeleteAlarm={handleDeleteAlarm}
          onToggleAlarm={handleToggleAlarm}
          onTriggerTestAlarm={handleTriggerTestAlarm}
        />
      )}

      {/* 4. Active Ringing Alarm Alert Modal */}
      {activeRingingAlarm && (
        <ActiveAlarmModal
          alarm={activeRingingAlarm}
          skill={ringingSkill}
          darkMode={profile.darkMode}
          onDismiss={() => setActiveRingingAlarm(null)}
          onSnooze={handleSnoozeAlarm}
          onStartStudy={handleStartStudyFromAlarm}
        />
      )}

      {/* 5. Student Profile & Backup Settings Modal */}
      {isProfileOpen && (
        <ProfileModal
          profile={profile}
          skills={skills}
          alarms={alarms}
          darkMode={profile.darkMode}
          onClose={() => setIsProfileOpen(false)}
          onSaveProfile={async (p) => {
            setProfile(p);
            try {
              await authApi.updateProfile({
                name: p.name,
                dailyGoalHours: p.dailyGoalHours,
                soundEnabled: p.soundEnabled,
              });
            } catch (e) {
              console.error('Failed to update profile settings', e);
            }
          }}
          onResetDemoData={() => {
            setSkills([]);
            setAlarms([]);
          }}
          onImportData={(data) => {
            setSkills(data.skills);
            setAlarms(data.alarms);
          }}
          onLoadStarterSkills={handleSeedStarterSkills}
          onLogout={handleLogout}
          currentBgThemeId={bgThemeId}
          onSelectBgTheme={handleSelectBgTheme}
        />
      )}

      {/* 6. Daily Goal Completion Celebration Toast */}
      {goalCelebration && (
        <GoalCelebrationToast
          skillName={goalCelebration.skillName}
          hoursToday={goalCelebration.hoursToday}
          dailyTargetHours={goalCelebration.dailyTargetHours}
          streak={profile.streak}
          darkMode={profile.darkMode}
          onDismiss={() => setGoalCelebration(null)}
        />
      )}

      {/* 7. ReactBits Background Theme Color Selector Popover */}
      {isThemeSelectorOpen && (
        <ThemeSelectorPopover
          currentThemeId={bgThemeId}
          currentBgShade={customBgShade}
          darkMode={profile.darkMode}
          onSelectTheme={handleSelectBgTheme}
          onSelectBgShade={handleSelectBgShade}
          onResetShadeToDefault={handleResetShadeToDefault}
          onClose={() => setIsThemeSelectorOpen(false)}
        />
      )}

      {/* 8. Study Tips & Productivity Techniques Floating Action Button */}
      <StudyTipsFAB darkMode={profile.darkMode} />
    </div>
  );
}
