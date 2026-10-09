export type SkillCategory = 'Programming' | 'Languages' | 'Communication' | 'Data' | 'Design' | 'Other';

export type SkillColor = 'amber' | 'emerald' | 'sky' | 'indigo' | 'rose' | 'violet' | 'teal';

export interface Skill {
  id: string;
  name: string;
  category: SkillCategory;
  goal: string;
  targetDays: number;
  dailyTargetHours: number;
  completedDays: number;
  totalHoursPracticed: number;
  color: SkillColor;
  iconName: string;
  alarmEnabled: boolean;
  alarmTime: string; // HH:MM 24h
  history: Record<string, number>; // "YYYY-MM-DD" -> hours logged
  checkedDays: Record<string, boolean>; // "YYYY-MM-DD" -> true if marked practiced
  notes?: string;
  createdAt: string;
}

export type AlarmSoundType = 'bell' | 'gentle' | 'digital' | 'marimba';

export interface StudyAlarm {
  id: string;
  title: string;
  time: string; // "HH:MM"
  skillId?: string; // Optional: linked to specific skill
  enabled: boolean;
  daysOfWeek: number[]; // [0,1,2,3,4,5,6] (0 = Sun, 1 = Mon, etc.)
  soundType: AlarmSoundType;
  snoozedUntil?: number; // timestamp ms
}

export interface StudySessionLog {
  id: string;
  skillId: string;
  skillName: string;
  date: string; // YYYY-MM-DD
  durationHours: number;
  notes?: string;
  timestamp: number;
}

export interface StudentProfile {
  name: string;
  dailyGoalHours: number;
  streak: number;
  lastActiveDate: string;
  darkMode: boolean;
  soundEnabled: boolean;
}
