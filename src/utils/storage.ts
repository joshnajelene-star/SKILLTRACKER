import { Skill, StudyAlarm, StudentProfile, StudySessionLog } from '../types';

const STORAGE_KEYS = {
  SKILLS: 'skilltracker_skills_v1',
  ALARMS: 'skilltracker_alarms_v1',
  PROFILE: 'skilltracker_profile_v1',
  LOGS: 'skilltracker_logs_v1',
};

// Helper to get formatted date string: YYYY-MM-DD
export function getFormattedDate(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getPastDates(numDays = 7): string[] {
  const dates: string[] = [];
  for (let i = numDays - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(getFormattedDate(d));
  }
  return dates;
}

// Generate realistic starting history for Joshna's skills based on prompt
export function getDefaultSkills(): Skill[] {
  const pastDates = getPastDates(7);
  const today = pastDates[pastDates.length - 1];

  return [
    {
      id: 'skill-js',
      name: 'JavaScript',
      category: 'Programming',
      goal: 'Learn JavaScript basics, DOM manipulation & build 3 apps',
      targetDays: 30,
      dailyTargetHours: 1.5,
      completedDays: 24, // 80% of 30 days
      totalHoursPracticed: 16.5,
      color: 'amber',
      iconName: 'code',
      alarmEnabled: true,
      alarmTime: '18:30',
      history: {
        [pastDates[0]]: 1.5,
        [pastDates[1]]: 2.0,
        [pastDates[2]]: 1.5,
        [pastDates[3]]: 1.0,
        [pastDates[4]]: 2.5,
        [pastDates[5]]: 1.5,
        [today]: 1.5,
      },
      checkedDays: {
        [pastDates[0]]: true,
        [pastDates[1]]: true,
        [pastDates[2]]: true,
        [pastDates[3]]: true,
        [pastDates[4]]: true,
        [pastDates[5]]: true,
        [today]: true,
      },
      notes: 'Focused on ES6 features, promises, and React foundations.',
      createdAt: new Date(Date.now() - 24 * 86400000).toISOString(),
    },
    {
      id: 'skill-python',
      name: 'Python',
      category: 'Programming',
      goal: 'Master Python syntax, data structures & solve 30 problems',
      targetDays: 30,
      dailyTargetHours: 1.0,
      completedDays: 15, // 50%
      totalHoursPracticed: 9.0,
      color: 'sky',
      iconName: 'terminal',
      alarmEnabled: true,
      alarmTime: '19:45',
      history: {
        [pastDates[1]]: 1.0,
        [pastDates[2]]: 1.5,
        [pastDates[3]]: 1.0,
        [pastDates[4]]: 1.5,
        [pastDates[5]]: 1.0,
        [today]: 1.0,
      },
      checkedDays: {
        [pastDates[1]]: true,
        [pastDates[2]]: true,
        [pastDates[3]]: true,
        [pastDates[4]]: true,
        [pastDates[5]]: true,
        [today]: true,
      },
      notes: 'Working through list comprehensions and dictionary sorting.',
      createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    },
    {
      id: 'skill-sql',
      name: 'SQL',
      category: 'Data',
      goal: 'Database querying, joins, aggregations & database design',
      targetDays: 20,
      dailyTargetHours: 1.0,
      completedDays: 8, // 40%
      totalHoursPracticed: 5.5,
      color: 'emerald',
      iconName: 'database',
      alarmEnabled: false,
      alarmTime: '20:30',
      history: {
        [pastDates[2]]: 1.0,
        [pastDates[3]]: 1.0,
        [pastDates[5]]: 1.5,
        [today]: 0.5,
      },
      checkedDays: {
        [pastDates[2]]: true,
        [pastDates[3]]: true,
        [pastDates[5]]: true,
        [today]: true,
      },
      notes: 'Practicing complex JOIN queries and GROUP BY filters.',
      createdAt: new Date(Date.now() - 8 * 86400000).toISOString(),
    },
    {
      id: 'skill-comm',
      name: 'English & Communication',
      category: 'Communication',
      goal: 'Daily speaking practice, vocabulary enhancement & presentations',
      targetDays: 25,
      dailyTargetHours: 0.75,
      completedDays: 15, // 60%
      totalHoursPracticed: 6.0,
      color: 'violet',
      iconName: 'message-square',
      alarmEnabled: true,
      alarmTime: '08:00',
      history: {
        [pastDates[0]]: 0.75,
        [pastDates[1]]: 0.75,
        [pastDates[2]]: 0.75,
        [pastDates[4]]: 0.75,
        [pastDates[5]]: 0.75,
        [today]: 0.5,
      },
      checkedDays: {
        [pastDates[0]]: true,
        [pastDates[1]]: true,
        [pastDates[2]]: true,
        [pastDates[4]]: true,
        [pastDates[5]]: true,
        [today]: true,
      },
      notes: 'Reading tech blogs out loud and recording 2-minute project summaries.',
      createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    },
  ];
}

export function getDefaultAlarms(): StudyAlarm[] {
  return [
    {
      id: 'alarm-evening-core',
      title: 'Evening Coding Focus (JavaScript)',
      time: '18:30',
      skillId: 'skill-js',
      enabled: true,
      daysOfWeek: [1, 2, 3, 4, 5, 6, 0], // Every day
      soundType: 'gentle',
    },
    {
      id: 'alarm-python-night',
      title: 'Python Problem Practice',
      time: '19:45',
      skillId: 'skill-python',
      enabled: true,
      daysOfWeek: [1, 2, 3, 4, 5], // Weekdays
      soundType: 'bell',
    },
    {
      id: 'alarm-morning-comm',
      title: 'Morning English Speaking Routine',
      time: '08:00',
      skillId: 'skill-comm',
      enabled: true,
      daysOfWeek: [1, 2, 3, 4, 5, 6],
      soundType: 'marimba',
    },
  ];
}

export function getDefaultProfile(): StudentProfile {
  return {
    name: 'Joshna',
    dailyGoalHours: 2.5,
    streak: 6,
    lastActiveDate: getFormattedDate(),
    darkMode: true,
    soundEnabled: true,
  };
}

export function loadSkills(): Skill[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SKILLS);
    if (!raw) {
      const def = getDefaultSkills();
      saveSkills(def);
      return def;
    }
    return JSON.parse(raw);
  } catch {
    return getDefaultSkills();
  }
}

export function saveSkills(skills: Skill[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SKILLS, JSON.stringify(skills));
  } catch (e) {
    console.error('Failed to save skills to localStorage', e);
  }
}

export function loadAlarms(): StudyAlarm[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ALARMS);
    if (!raw) {
      const def = getDefaultAlarms();
      saveAlarms(def);
      return def;
    }
    return JSON.parse(raw);
  } catch {
    return getDefaultAlarms();
  }
}

export function saveAlarms(alarms: StudyAlarm[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ALARMS, JSON.stringify(alarms));
  } catch (e) {
    console.error('Failed to save alarms to localStorage', e);
  }
}

export function loadProfile(): StudentProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (!raw) {
      const def = getDefaultProfile();
      saveProfile(def);
      return def;
    }
    return { ...getDefaultProfile(), ...JSON.parse(raw) };
  } catch {
    return getDefaultProfile();
  }
}

export function saveProfile(profile: StudentProfile): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  } catch (e) {
    console.error('Failed to save profile to localStorage', e);
  }
}

export function loadLogs(): StudySessionLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LOGS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveLogs(logs: StudySessionLog[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
  } catch (e) {
    console.error('Failed to save logs to localStorage', e);
  }
}

// Calculate streak based on daily checked activity
export function calculateStreak(skills: Skill[]): number {
  if (skills.length === 0) return 0;
  
  let streak = 0;
  const today = new Date();
  
  // Check consecutively backwards starting from today or yesterday
  for (let i = 0; i < 60; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = getFormattedDate(d);

    const practicedOnDay = skills.some(s => (s.checkedDays && s.checkedDays[dateStr]) || (s.history && (s.history[dateStr] ?? 0) > 0));

    if (i === 0 && !practicedOnDay) {
      // today isn't checked yet, don't break streak if yesterday was active
      continue;
    }

    if (practicedOnDay) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}
