import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {
  findUserByEmail,
  findUserById,
  createUser,
  updateUserProfile,
  getUserSkills,
  createSkill,
  updateSkill,
  deleteSkill,
  getUserStudyLogs,
  createStudyLog,
  getUserDailyCheckins,
  toggleDailyCheckin,
  getUserAlarms,
  createAlarm,
  updateAlarm,
  deleteAlarm,
  SkillRow,
  StudyLogRow,
  AlarmRow,
} from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'skilltracker-secret-key-2026';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userEmail?: string;
}

// Authentication Middleware
export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Access token required. Please log in.' });
    return;
  }

  jwt.verify(token, JWT_SECRET, (err, decoded: any) => {
    if (err || !decoded?.userId) {
      res.status(403).json({ error: 'Session expired or invalid token. Please log in again.' });
      return;
    }
    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    next();
  });
}

export const apiRouter = Router();

// Health check endpoint
apiRouter.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// ========================================================
// AUTHENTICATION & PROFILE ROUTES
// ========================================================

// 1. User Registration
apiRouter.post('/auth/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ error: 'Name, email, and password are required.' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      return;
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      res.status(400).json({ error: 'An account with this email already exists.' });
      return;
    }

    // Secure password hashing
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const userId = `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const newUser = await createUser({
      id: userId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password_hash: passwordHash,
      daily_goal_hours: 2.0,
      streak: 0,
      dark_mode: true,
      sound_enabled: true,
      created_at: now,
    });

    // NOTE: Newly registered user starts with an EMPTY skill list!
    // No demo skills are automatically inserted.

    const token = jwt.sign({ userId: newUser.id, email: newUser.email }, JWT_SECRET, {
      expiresIn: '7d',
    });

    res.status(201).json({
      message: 'Account created successfully!',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        dailyGoalHours: newUser.daily_goal_hours,
        streak: newUser.streak,
        darkMode: newUser.dark_mode,
        soundEnabled: newUser.sound_enabled,
      },
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Server error during registration. Please try again.' });
  }
});

// 2. User Login
apiRouter.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const user = await findUserByEmail(email);
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: '7d',
    });

    res.json({
      message: 'Logged in successfully!',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        dailyGoalHours: user.daily_goal_hours,
        streak: user.streak,
        darkMode: user.dark_mode,
        soundEnabled: user.sound_enabled,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login. Please try again.' });
  }
});

// 3. Current User Session Check
apiRouter.get('/auth/me', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await findUserById(req.userId!);
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        dailyGoalHours: user.daily_goal_hours,
        streak: user.streak,
        darkMode: user.dark_mode,
        soundEnabled: user.sound_enabled,
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve profile.' });
  }
});

// 4. Update Profile Settings
apiRouter.put('/auth/profile', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, dailyGoalHours, darkMode, soundEnabled, streak } = req.body;
    const updates: any = {};
    if (typeof name === 'string') updates.name = name.trim();
    if (typeof dailyGoalHours === 'number') updates.daily_goal_hours = dailyGoalHours;
    if (typeof darkMode === 'boolean') updates.dark_mode = darkMode;
    if (typeof soundEnabled === 'boolean') updates.sound_enabled = soundEnabled;
    if (typeof streak === 'number') updates.streak = streak;

    const updated = await updateUserProfile(req.userId!, updates);
    if (!updated) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    res.json({
      user: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        dailyGoalHours: updated.daily_goal_hours,
        streak: updated.streak,
        darkMode: updated.dark_mode,
        soundEnabled: updated.sound_enabled,
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

// 5. User Profile (GET /api/profile)
apiRouter.get('/profile', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await findUserById(req.userId!);
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    res.json({
      profile: {
        id: user.id,
        name: user.name,
        email: user.email,
        dailyGoalHours: Number(user.daily_goal_hours),
        streak: Number(user.streak),
        darkMode: Boolean(user.dark_mode),
        soundEnabled: Boolean(user.sound_enabled),
        createdAt: user.created_at,
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve profile.' });
  }
});

// 6. User Profile (PUT /api/profile)
apiRouter.put('/profile', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, dailyGoalHours, darkMode, soundEnabled, streak } = req.body;
    const updates: any = {};
    if (typeof name === 'string') updates.name = name.trim();
    if (typeof dailyGoalHours === 'number') updates.daily_goal_hours = dailyGoalHours;
    if (typeof darkMode === 'boolean') updates.dark_mode = darkMode;
    if (typeof soundEnabled === 'boolean') updates.sound_enabled = soundEnabled;
    if (typeof streak === 'number') updates.streak = streak;

    const updated = await updateUserProfile(req.userId!, updates);
    if (!updated) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    res.json({
      message: 'Profile updated successfully',
      profile: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        dailyGoalHours: Number(updated.daily_goal_hours),
        streak: Number(updated.streak),
        darkMode: Boolean(updated.dark_mode),
        soundEnabled: Boolean(updated.sound_enabled),
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

// ========================================================
// SKILLS ROUTES (User Specific)
// ========================================================

// Get all skills with aggregated history & check-ins
apiRouter.get('/skills', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const skills = await getUserSkills(userId);
    const logs = await getUserStudyLogs(userId);
    const checkins = await getUserDailyCheckins(userId);

    // Format skills to match frontend structure
    const formatted = skills.map((s) => {
      const history: Record<string, number> = {};
      logs
        .filter((l) => l.skill_id === s.id)
        .forEach((l) => {
          history[l.log_date] = (history[l.log_date] || 0) + Number(l.duration_hours);
        });

      const checkedDays: Record<string, boolean> = {};
      checkins
        .filter((c) => c.skill_id === s.id && c.completed)
        .forEach((c) => {
          checkedDays[c.check_date] = true;
        });

      return {
        id: s.id,
        name: s.name,
        category: s.category,
        goal: s.goal,
        targetDays: Number(s.target_days),
        dailyTargetHours: Number(s.daily_target_hours),
        completedDays: Number(s.completed_days),
        totalHoursPracticed: Number(s.total_hours_practiced),
        color: s.color,
        iconName: s.icon_name,
        alarmEnabled: Boolean(s.alarm_enabled),
        alarmTime: s.alarm_time,
        notes: s.notes,
        history,
        checkedDays,
        createdAt: s.created_at,
      };
    });

    res.json({ skills: formatted });
  } catch (err) {
    console.error('Fetch skills error:', err);
    res.status(500).json({ error: 'Failed to fetch skills.' });
  }
});

// Add a new skill
apiRouter.post('/skills', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const {
      name,
      category,
      goal,
      targetDays,
      dailyTargetHours,
      color,
      iconName,
      alarmEnabled,
      alarmTime,
      notes,
    } = req.body;

    if (!name) {
      res.status(400).json({ error: 'Skill name is required.' });
      return;
    }

    const skillId = `skill-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newSkill: SkillRow = {
      id: skillId,
      user_id: userId,
      name: name.trim(),
      category: category || 'Programming',
      goal: goal || '',
      target_days: Number(targetDays) || 30,
      daily_target_hours: Number(dailyTargetHours) || 1.0,
      completed_days: 0,
      total_hours_practiced: 0,
      color: color || 'indigo',
      icon_name: iconName || (category ? category.toLowerCase() : 'code'),
      alarm_enabled: Boolean(alarmEnabled),
      alarm_time: alarmTime || '19:00',
      notes: notes || '',
      created_at: new Date().toISOString(),
    };

    await createSkill(newSkill);

    // If alarm requested, also create alarm entry
    if (alarmEnabled) {
      await createAlarm({
        id: `alarm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        user_id: userId,
        skill_id: skillId,
        title: `${newSkill.name} Study Time`,
        time: alarmTime || '19:00',
        days_of_week: '0,1,2,3,4,5,6',
        sound_type: 'gentle',
        enabled: true,
        created_at: new Date().toISOString(),
      });
    }

    res.status(201).json({
      skill: {
        ...newSkill,
        targetDays: newSkill.target_days,
        dailyTargetHours: newSkill.daily_target_hours,
        completedDays: 0,
        totalHoursPracticed: 0,
        alarmEnabled: newSkill.alarm_enabled,
        alarmTime: newSkill.alarm_time,
        iconName: newSkill.icon_name,
        history: {},
        checkedDays: {},
        createdAt: newSkill.created_at,
      },
    });
  } catch (err) {
    console.error('Create skill error:', err);
    res.status(500).json({ error: 'Failed to create skill.' });
  }
});

// Update an existing skill
apiRouter.put('/skills/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const skillId = req.params.id;
    const {
      name,
      category,
      goal,
      targetDays,
      dailyTargetHours,
      completedDays,
      totalHoursPracticed,
      color,
      iconName,
      alarmEnabled,
      alarmTime,
      notes,
    } = req.body;

    const updates: Partial<SkillRow> = {};
    if (name) updates.name = name.trim();
    if (category) updates.category = category;
    if (goal !== undefined) updates.goal = goal;
    if (targetDays !== undefined) updates.target_days = Number(targetDays);
    if (dailyTargetHours !== undefined) updates.daily_target_hours = Number(dailyTargetHours);
    if (completedDays !== undefined) updates.completed_days = Number(completedDays);
    if (totalHoursPracticed !== undefined) updates.total_hours_practiced = Number(totalHoursPracticed);
    if (color) updates.color = color;
    if (iconName) updates.icon_name = iconName;
    if (alarmEnabled !== undefined) updates.alarm_enabled = Boolean(alarmEnabled);
    if (alarmTime) updates.alarm_time = alarmTime;
    if (notes !== undefined) updates.notes = notes;

    const updated = await updateSkill(userId, skillId, updates);
    if (!updated) {
      res.status(404).json({ error: 'Skill not found.' });
      return;
    }

    res.json({ skill: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update skill.' });
  }
});

// Delete a skill
apiRouter.delete('/skills/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const skillId = req.params.id;

    const success = await deleteSkill(userId, skillId);
    if (!success) {
      res.status(404).json({ error: 'Skill not found.' });
      return;
    }

    res.json({ message: 'Skill deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete skill.' });
  }
});

// Log study session for a skill
apiRouter.post('/skills/:id/log', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const skillId = req.params.id;
    const { hours, date, notes } = req.body;

    if (!hours || Number(hours) <= 0) {
      res.status(400).json({ error: 'Valid study hours duration is required.' });
      return;
    }

    const logDate = date || new Date().toISOString().slice(0, 10);
    const durationHours = Number(hours);

    // 1. Insert study log
    const logId = `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    await createStudyLog({
      id: logId,
      user_id: userId,
      skill_id: skillId,
      log_date: logDate,
      duration_hours: durationHours,
      notes: notes || '',
      created_at: new Date().toISOString(),
    });

    // 2. Mark daily check-in as completed
    await toggleDailyCheckin(userId, skillId, logDate, true);

    // 3. Update skill total practiced hours & completed days
    const skills = await getUserSkills(userId);
    const currentSkill = skills.find((s) => s.id === skillId);
    if (currentSkill) {
      const newTotal = Number(currentSkill.total_hours_practiced) + durationHours;
      const newCompletedDays = Math.min(
        Number(currentSkill.target_days),
        Number(currentSkill.completed_days) + (currentSkill.completed_days === 0 ? 1 : 0)
      );
      await updateSkill(userId, skillId, {
        total_hours_practiced: newTotal,
        completed_days: newCompletedDays,
      });
    }

    // 4. Update user streak
    const logs = await getUserStudyLogs(userId);
    const uniqueDates = Array.from(new Set(logs.map((l) => l.log_date))).sort().reverse();
    const streak = calculateStreakFromDates(uniqueDates);
    await updateUserProfile(userId, { streak });

    res.json({
      message: 'Study session logged successfully!',
      streak,
    });
  } catch (err) {
    console.error('Study log error:', err);
    res.status(500).json({ error: 'Failed to log study session.' });
  }
});

// Toggle daily check-in
apiRouter.post('/skills/:id/checkin', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const skillId = req.params.id;
    const { date, completed } = req.body;
    const checkDate = date || new Date().toISOString().slice(0, 10);

    const isCompleted = completed !== undefined ? Boolean(completed) : true;
    await toggleDailyCheckin(userId, skillId, checkDate, isCompleted);

    // If checking in, make sure completed_days increments if newly checked
    const skills = await getUserSkills(userId);
    const s = skills.find((item) => item.id === skillId);
    if (s && isCompleted) {
      await updateSkill(userId, skillId, {
        completed_days: Math.min(Number(s.target_days), Number(s.completed_days) + 1),
      });
    }

    res.json({ success: true, completed: isCompleted });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update check-in.' });
  }
});

// Optional Starter Sample Skills Seed (explicitly requested by user in settings only)
apiRouter.post('/skills/seed-starter', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const starterSkills = [
      {
        name: 'JavaScript',
        category: 'Programming',
        goal: 'Learn JavaScript basics, DOM manipulation & build 3 apps',
        target_days: 30,
        daily_target_hours: 1.5,
        color: 'amber',
        alarm_time: '18:30',
      },
      {
        name: 'Python',
        category: 'Programming',
        goal: 'Master Python syntax, data structures & solve 30 problems',
        target_days: 30,
        daily_target_hours: 1.0,
        color: 'sky',
        alarm_time: '19:45',
      },
      {
        name: 'SQL',
        category: 'Data',
        goal: 'Database querying, joins, aggregations & database design',
        target_days: 20,
        daily_target_hours: 1.0,
        color: 'emerald',
        alarm_time: '20:30',
      },
      {
        name: 'English & Communication',
        category: 'Communication',
        goal: 'Daily speaking practice, vocabulary enhancement & presentations',
        target_days: 25,
        daily_target_hours: 0.75,
        color: 'violet',
        alarm_time: '08:00',
      },
    ];

    for (const item of starterSkills) {
      await createSkill({
        id: `skill-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        user_id: userId,
        name: item.name,
        category: item.category,
        goal: item.goal,
        target_days: item.target_days,
        daily_target_hours: item.daily_target_hours,
        completed_days: 0,
        total_hours_practiced: 0,
        color: item.color,
        icon_name: 'code',
        alarm_enabled: true,
        alarm_time: item.alarm_time,
        notes: '',
        created_at: new Date().toISOString(),
      });
    }

    res.json({ message: 'Starter sample skills loaded.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to seed sample skills.' });
  }
});

// ========================================================
// STUDY LOGS ROUTES (GET /api/study-logs, POST /api/study-logs)
// ========================================================

// 1. Get all study logs for current user
apiRouter.get('/study-logs', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const logs = await getUserStudyLogs(userId);
    res.json({ studyLogs: logs });
  } catch (err) {
    console.error('Fetch study logs error:', err);
    res.status(500).json({ error: 'Failed to fetch study logs.' });
  }
});

// 2. Create study log
apiRouter.post('/study-logs', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { skillId, skill_id, hours, duration_hours, date, log_date, notes } = req.body;
    const targetSkillId = skillId || skill_id;
    const targetHours = Number(hours !== undefined ? hours : duration_hours);
    const targetDate = date || log_date || new Date().toISOString().slice(0, 10);

    if (!targetSkillId) {
      res.status(400).json({ error: 'skillId is required.' });
      return;
    }
    if (isNaN(targetHours) || targetHours <= 0) {
      res.status(400).json({ error: 'Valid study duration in hours is required.' });
      return;
    }

    const logId = `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newLog: StudyLogRow = {
      id: logId,
      user_id: userId,
      skill_id: targetSkillId,
      log_date: targetDate,
      duration_hours: targetHours,
      notes: notes || '',
      created_at: new Date().toISOString(),
    };

    await createStudyLog(newLog);
    await toggleDailyCheckin(userId, targetSkillId, targetDate, true);

    // Update skill total practiced hours & completed days
    const skills = await getUserSkills(userId);
    const currentSkill = skills.find((s) => s.id === targetSkillId);
    if (currentSkill) {
      const newTotal = Number(currentSkill.total_hours_practiced) + targetHours;
      const newCompletedDays = Math.min(
        Number(currentSkill.target_days),
        Number(currentSkill.completed_days) + (currentSkill.completed_days === 0 ? 1 : 0)
      );
      await updateSkill(userId, targetSkillId, {
        total_hours_practiced: newTotal,
        completed_days: newCompletedDays,
      });
    }

    // Recalculate streak
    const logs = await getUserStudyLogs(userId);
    const uniqueDates = Array.from(new Set(logs.map((l) => l.log_date))).sort().reverse();
    const streak = calculateStreakFromDates(uniqueDates);
    await updateUserProfile(userId, { streak });

    res.status(201).json({
      message: 'Study session logged successfully!',
      studyLog: newLog,
      streak,
    });
  } catch (err) {
    console.error('Create study log error:', err);
    res.status(500).json({ error: 'Failed to create study log.' });
  }
});

// ========================================================
// ALARMS ROUTES
// ========================================================

apiRouter.get('/alarms', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const alarms = await getUserAlarms(userId);
    const formatted = alarms.map((a) => ({
      id: a.id,
      title: a.title,
      time: a.time,
      skillId: a.skill_id,
      daysOfWeek: a.days_of_week ? a.days_of_week.split(',').map(Number) : [0, 1, 2, 3, 4, 5, 6],
      soundType: a.sound_type,
      enabled: Boolean(a.enabled),
    }));
    res.json({ alarms: formatted });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch alarms.' });
  }
});

apiRouter.post('/alarms', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { title, time, skillId, daysOfWeek, soundType, enabled } = req.body;

    const alarmId = `alarm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newAlarm: AlarmRow = {
      id: alarmId,
      user_id: userId,
      skill_id: skillId || undefined,
      title: title || 'Study Reminder',
      time: time || '19:00',
      days_of_week: Array.isArray(daysOfWeek) ? daysOfWeek.join(',') : '0,1,2,3,4,5,6',
      sound_type: soundType || 'bell',
      enabled: enabled !== undefined ? Boolean(enabled) : true,
      created_at: new Date().toISOString(),
    };

    await createAlarm(newAlarm);
    res.status(201).json({ alarm: newAlarm });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create alarm.' });
  }
});

apiRouter.put('/alarms/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const alarmId = req.params.id;
    const { title, time, skillId, daysOfWeek, soundType, enabled } = req.body;

    const updates: Partial<AlarmRow> = {};
    if (title) updates.title = title;
    if (time) updates.time = time;
    if (skillId !== undefined) updates.skill_id = skillId;
    if (daysOfWeek) updates.days_of_week = Array.isArray(daysOfWeek) ? daysOfWeek.join(',') : daysOfWeek;
    if (soundType) updates.sound_type = soundType;
    if (enabled !== undefined) updates.enabled = Boolean(enabled);

    const updated = await updateAlarm(userId, alarmId, updates);
    res.json({ alarm: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update alarm.' });
  }
});

apiRouter.delete('/alarms/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const alarmId = req.params.id;
    await deleteAlarm(userId, alarmId);
    res.json({ message: 'Alarm deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete alarm.' });
  }
});

// Helper for streak calculation
function calculateStreakFromDates(sortedDateStringsDesc: string[]): number {
  if (sortedDateStringsDesc.length === 0) return 0;

  const todayStr = new Date().toISOString().slice(0, 10);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  const mostRecent = sortedDateStringsDesc[0];
  if (mostRecent !== todayStr && mostRecent !== yesterdayStr) {
    return 0; // Streak broken
  }

  let streak = 0;
  let expectedDate = new Date(mostRecent);

  for (const dateStr of sortedDateStringsDesc) {
    const currentExpectedStr = expectedDate.toISOString().slice(0, 10);
    if (dateStr === currentExpectedStr) {
      streak++;
      expectedDate.setDate(expectedDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}
