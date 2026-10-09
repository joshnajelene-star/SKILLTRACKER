/**
 * Frontend API client for communicating with Node.js/Express backend
 */

import { Skill, StudyAlarm, StudentProfile } from '../types';

const TOKEN_KEY = 'skilltracker_auth_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `HTTP ${response.status}: Request failed`);
  }

  return data as T;
}

// ========================================================
// AUTH API
// ========================================================

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    dailyGoalHours: number;
    streak: number;
    darkMode: boolean;
    soundEnabled: boolean;
  };
  message?: string;
}

export const authApi = {
  async register(name: string, email: string, password: string): Promise<AuthResponse> {
    const res = await apiRequest<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    setStoredToken(res.token);
    return res;
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await apiRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setStoredToken(res.token);
    return res;
  },

  async getMe(): Promise<{ user: AuthResponse['user'] }> {
    return apiRequest<{ user: AuthResponse['user'] }>('/auth/me');
  },

  async updateProfile(updates: Partial<StudentProfile>): Promise<{ user: AuthResponse['user'] }> {
    return apiRequest<{ user: AuthResponse['user'] }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  logout(): void {
    clearStoredToken();
  },
};

// ========================================================
// SKILLS API
// ========================================================

export const skillsApi = {
  async getSkills(): Promise<Skill[]> {
    const res = await apiRequest<{ skills: Skill[] }>('/skills');
    return res.skills;
  },

  async createSkill(skillData: Partial<Skill>): Promise<Skill> {
    const res = await apiRequest<{ skill: Skill }>('/skills', {
      method: 'POST',
      body: JSON.stringify(skillData),
    });
    return res.skill;
  },

  async updateSkill(id: string, skillData: Partial<Skill>): Promise<Skill> {
    const res = await apiRequest<{ skill: Skill }>(`/skills/${id}`, {
      method: 'PUT',
      body: JSON.stringify(skillData),
    });
    return res.skill;
  },

  async deleteSkill(id: string): Promise<void> {
    await apiRequest(`/skills/${id}`, { method: 'DELETE' });
  },

  async logStudy(skillId: string, hours: number, date?: string, notes?: string): Promise<{ streak: number }> {
    return apiRequest<{ streak: number }>(`/skills/${skillId}/log`, {
      method: 'POST',
      body: JSON.stringify({ hours, date, notes }),
    });
  },

  async checkIn(skillId: string, date: string, completed: boolean): Promise<void> {
    await apiRequest(`/skills/${skillId}/checkin`, {
      method: 'POST',
      body: JSON.stringify({ date, completed }),
    });
  },

  async seedStarterSkills(): Promise<void> {
    await apiRequest('/skills/seed-starter', {
      method: 'POST',
    });
  },
};

// ========================================================
// ALARMS API
// ========================================================

export const alarmsApi = {
  async getAlarms(): Promise<StudyAlarm[]> {
    const res = await apiRequest<{ alarms: StudyAlarm[] }>('/alarms');
    return res.alarms;
  },

  async createAlarm(alarm: Partial<StudyAlarm>): Promise<StudyAlarm> {
    const res = await apiRequest<{ alarm: StudyAlarm }>('/alarms', {
      method: 'POST',
      body: JSON.stringify(alarm),
    });
    return res.alarm;
  },

  async updateAlarm(id: string, updates: Partial<StudyAlarm>): Promise<StudyAlarm> {
    const res = await apiRequest<{ alarm: StudyAlarm }>(`/alarms/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return res.alarm;
  },

  async deleteAlarm(id: string): Promise<void> {
    await apiRequest(`/alarms/${id}`, { method: 'DELETE' });
  },
};

// ========================================================
// STUDY LOGS API (GET /api/study-logs, POST /api/study-logs)
// ========================================================

export interface StudyLogEntry {
  id: string;
  user_id: string;
  skill_id: string;
  log_date: string;
  duration_hours: number;
  notes?: string;
  created_at: string;
}

export const studyLogsApi = {
  async getStudyLogs(): Promise<StudyLogEntry[]> {
    const res = await apiRequest<{ studyLogs: StudyLogEntry[] }>('/study-logs');
    return res.studyLogs;
  },

  async createStudyLog(skillId: string, hours: number, date?: string, notes?: string): Promise<{ studyLog: StudyLogEntry; streak: number }> {
    return apiRequest<{ studyLog: StudyLogEntry; streak: number }>('/study-logs', {
      method: 'POST',
      body: JSON.stringify({ skillId, hours, date, notes }),
    });
  },
};

// ========================================================
// PROFILE API (GET /api/profile, PUT /api/profile)
// ========================================================

export const profileApi = {
  async getProfile(): Promise<{ profile: StudentProfile & { id: string; email: string } }> {
    return apiRequest<{ profile: StudentProfile & { id: string; email: string } }>('/profile');
  },

  async updateProfile(updates: Partial<StudentProfile>): Promise<{ profile: StudentProfile }> {
    return apiRequest<{ profile: StudentProfile }>('/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },
};

