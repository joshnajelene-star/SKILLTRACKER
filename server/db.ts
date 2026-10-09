/**
 * SkillTracker Database Layer
 * Supports MySQL (via mysql2/promise) when MYSQL_HOST / DB_HOST is configured,
 * with an automatic file-backed relational fallback store so beginners can run
 * the app immediately without complex local MySQL daemon configuration.
 */

import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';

export interface UserRow {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  daily_goal_hours: number;
  streak: number;
  dark_mode: boolean;
  sound_enabled: boolean;
  created_at: string;
}

export interface SkillRow {
  id: string;
  user_id: string;
  name: string;
  category: string;
  goal: string;
  target_days: number;
  daily_target_hours: number;
  completed_days: number;
  total_hours_practiced: number;
  color: string;
  icon_name: string;
  alarm_enabled: boolean;
  alarm_time: string;
  notes: string;
  created_at: string;
}

export interface StudyLogRow {
  id: string;
  user_id: string;
  skill_id: string;
  log_date: string;
  duration_hours: number;
  notes?: string;
  created_at: string;
}

export interface DailyCheckinRow {
  id: string;
  user_id: string;
  skill_id: string;
  check_date: string;
  completed: boolean;
  created_at: string;
}

export interface AlarmRow {
  id: string;
  user_id: string;
  skill_id?: string;
  title: string;
  time: string;
  days_of_week: string; // e.g. "0,1,2,3,4,5,6"
  sound_type: string;
  enabled: boolean;
  created_at: string;
}

interface DatabaseStore {
  users: UserRow[];
  skills: SkillRow[];
  study_logs: StudyLogRow[];
  daily_checkins: DailyCheckinRow[];
  alarms: AlarmRow[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

let mysqlPool: mysql.Pool | null = null;
let useMySQL = false;

// Initialize Database connection & tables
export async function initDatabase() {
  const host = process.env.DB_HOST || process.env.MYSQL_HOST;
  const user = process.env.DB_USER || process.env.MYSQL_USER;
  const password = process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD;
  const database = process.env.DB_NAME || process.env.MYSQL_DATABASE || 'skilltracker_db';
  const port = Number(process.env.DB_PORT || process.env.MYSQL_PORT) || 3306;

  if (host && user) {
    try {
      console.log(`[Database] Attempting connection to MySQL at ${host}:${port}...`);
      try {
        mysqlPool = mysql.createPool({
          host,
          user,
          password,
          database,
          port,
          waitForConnections: true,
          connectionLimit: 10,
          queueLimit: 0,
        });

        // Test connection
        await mysqlPool.query('SELECT 1');
      } catch (poolErr: any) {
        // If database does not exist, connect to MySQL server to create it
        if (poolErr?.code === 'ER_BAD_DB_ERROR' || poolErr?.message?.includes('Unknown database')) {
          console.log(`[Database] Database '${database}' not found on MySQL server. Creating it now...`);
          const adminConn = await mysql.createConnection({
            host,
            user,
            password,
            port,
          });
          await adminConn.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
          await adminConn.end();

          mysqlPool = mysql.createPool({
            host,
            user,
            password,
            database,
            port,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
          });
          await mysqlPool.query('SELECT 1');
        } else {
          throw poolErr;
        }
      }

      useMySQL = true;
      console.log(`[Database] Successfully connected to MySQL database '${database}'!`);
      await createMySQLTablesIfNotExist();
      return;
    } catch (err) {
      console.warn('[Database] MySQL server not reachable, using resilient local storage fallback:', (err as Error).message);
    }
  }

  // Fallback to local relational JSON store
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    const initialData: DatabaseStore = {
      users: [],
      skills: [],
      study_logs: [],
      daily_checkins: [],
      alarms: [],
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
  }

  console.log(`[Database] Local relational data store initialized at ${DB_FILE}`);
}

async function createMySQLTablesIfNotExist() {
  if (!mysqlPool) return;
  try {
    await mysqlPool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        daily_goal_hours DECIMAL(4, 2) DEFAULT 2.00,
        streak INT DEFAULT 0,
        dark_mode BOOLEAN DEFAULT TRUE,
        sound_enabled BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await mysqlPool.query(`
      CREATE TABLE IF NOT EXISTS skills (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL,
        name VARCHAR(100) NOT NULL,
        category VARCHAR(50) NOT NULL DEFAULT 'Programming',
        goal TEXT,
        target_days INT NOT NULL DEFAULT 30,
        daily_target_hours DECIMAL(4, 2) NOT NULL DEFAULT 1.00,
        completed_days INT DEFAULT 0,
        total_hours_practiced DECIMAL(6, 2) DEFAULT 0.00,
        color VARCHAR(30) DEFAULT 'indigo',
        icon_name VARCHAR(50) DEFAULT 'code',
        alarm_enabled BOOLEAN DEFAULT TRUE,
        alarm_time VARCHAR(10) DEFAULT '19:00',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await mysqlPool.query(`
      CREATE TABLE IF NOT EXISTS study_logs (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL,
        skill_id VARCHAR(64) NOT NULL,
        log_date DATE NOT NULL,
        duration_hours DECIMAL(4, 2) NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await mysqlPool.query(`
      CREATE TABLE IF NOT EXISTS daily_checkins (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL,
        skill_id VARCHAR(64) NOT NULL,
        check_date DATE NOT NULL,
        completed BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await mysqlPool.query(`
      CREATE TABLE IF NOT EXISTS alarms (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL,
        skill_id VARCHAR(64) NULL,
        title VARCHAR(150) NOT NULL,
        time VARCHAR(10) NOT NULL,
        days_of_week VARCHAR(50) NOT NULL DEFAULT '0,1,2,3,4,5,6',
        sound_type VARCHAR(30) NOT NULL DEFAULT 'bell',
        enabled BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } catch (e) {
    console.error('[Database] Failed to auto-create tables in MySQL', e);
  }
}

// Helpers for reading/writing local storage
function readLocalStore(): DatabaseStore {
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return { users: [], skills: [], study_logs: [], daily_checkins: [], alarms: [] };
  }
}

function writeLocalStore(data: DatabaseStore) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to write local database file', e);
  }
}

// ========================================================
// USERS CRUD
// ========================================================

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const normalized = email.trim().toLowerCase();
  if (useMySQL && mysqlPool) {
    const [rows] = await mysqlPool.query<mysql.RowDataPacket[]>(
      'SELECT * FROM users WHERE LOWER(email) = ? LIMIT 1',
      [normalized]
    );
    return (rows[0] as UserRow) || null;
  }

  const store = readLocalStore();
  const found = store.users.find((u) => u.email.toLowerCase() === normalized);
  return found || null;
}

export async function findUserById(id: string): Promise<UserRow | null> {
  if (useMySQL && mysqlPool) {
    const [rows] = await mysqlPool.query<mysql.RowDataPacket[]>(
      'SELECT * FROM users WHERE id = ? LIMIT 1',
      [id]
    );
    return (rows[0] as UserRow) || null;
  }

  const store = readLocalStore();
  return store.users.find((u) => u.id === id) || null;
}

export async function createUser(user: UserRow): Promise<UserRow> {
  if (useMySQL && mysqlPool) {
    await mysqlPool.query(
      `INSERT INTO users (id, name, email, password_hash, daily_goal_hours, streak, dark_mode, sound_enabled, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user.id,
        user.name,
        user.email.toLowerCase(),
        user.password_hash,
        user.daily_goal_hours,
        user.streak,
        user.dark_mode,
        user.sound_enabled,
        user.created_at,
      ]
    );
    return user;
  }

  const store = readLocalStore();
  store.users.push(user);
  writeLocalStore(store);
  return user;
}

export async function updateUserProfile(
  userId: string,
  updates: Partial<Pick<UserRow, 'name' | 'daily_goal_hours' | 'streak' | 'dark_mode' | 'sound_enabled'>>
): Promise<UserRow | null> {
  if (useMySQL && mysqlPool) {
    const fields: string[] = [];
    const values: any[] = [];
    for (const [key, val] of Object.entries(updates)) {
      fields.push(`${key} = ?`);
      values.push(val);
    }
    if (fields.length > 0) {
      values.push(userId);
      await mysqlPool.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
    }
    return findUserById(userId);
  }

  const store = readLocalStore();
  const idx = store.users.findIndex((u) => u.id === userId);
  if (idx === -1) return null;
  store.users[idx] = { ...store.users[idx], ...updates };
  writeLocalStore(store);
  return store.users[idx];
}

// ========================================================
// SKILLS CRUD (Strictly scoped to user_id)
// ========================================================

export async function getUserSkills(userId: string): Promise<SkillRow[]> {
  if (useMySQL && mysqlPool) {
    const [rows] = await mysqlPool.query<mysql.RowDataPacket[]>(
      'SELECT * FROM skills WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    return rows as SkillRow[];
  }

  const store = readLocalStore();
  return store.skills.filter((s) => s.user_id === userId);
}

export async function createSkill(skill: SkillRow): Promise<SkillRow> {
  if (useMySQL && mysqlPool) {
    await mysqlPool.query(
      `INSERT INTO skills (id, user_id, name, category, goal, target_days, daily_target_hours, completed_days, total_hours_practiced, color, icon_name, alarm_enabled, alarm_time, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        skill.id,
        skill.user_id,
        skill.name,
        skill.category,
        skill.goal,
        skill.target_days,
        skill.daily_target_hours,
        skill.completed_days,
        skill.total_hours_practiced,
        skill.color,
        skill.icon_name,
        skill.alarm_enabled,
        skill.alarm_time,
        skill.notes,
        skill.created_at,
      ]
    );
    return skill;
  }

  const store = readLocalStore();
  store.skills.push(skill);
  writeLocalStore(store);
  return skill;
}

export async function updateSkill(userId: string, skillId: string, updates: Partial<SkillRow>): Promise<SkillRow | null> {
  if (useMySQL && mysqlPool) {
    const fields: string[] = [];
    const values: any[] = [];
    for (const [key, val] of Object.entries(updates)) {
      if (key !== 'id' && key !== 'user_id' && key !== 'created_at') {
        fields.push(`${key} = ?`);
        values.push(val);
      }
    }
    if (fields.length > 0) {
      values.push(skillId, userId);
      await mysqlPool.query(`UPDATE skills SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`, values);
    }
    const [rows] = await mysqlPool.query<mysql.RowDataPacket[]>(
      'SELECT * FROM skills WHERE id = ? AND user_id = ? LIMIT 1',
      [skillId, userId]
    );
    return (rows[0] as SkillRow) || null;
  }

  const store = readLocalStore();
  const idx = store.skills.findIndex((s) => s.id === skillId && s.user_id === userId);
  if (idx === -1) return null;
  store.skills[idx] = { ...store.skills[idx], ...updates };
  writeLocalStore(store);
  return store.skills[idx];
}

export async function deleteSkill(userId: string, skillId: string): Promise<boolean> {
  if (useMySQL && mysqlPool) {
    const [result] = await mysqlPool.query<mysql.ResultSetHeader>(
      'DELETE FROM skills WHERE id = ? AND user_id = ?',
      [skillId, userId]
    );
    await mysqlPool.query('DELETE FROM study_logs WHERE skill_id = ? AND user_id = ?', [skillId, userId]);
    await mysqlPool.query('DELETE FROM daily_checkins WHERE skill_id = ? AND user_id = ?', [skillId, userId]);
    await mysqlPool.query('DELETE FROM alarms WHERE skill_id = ? AND user_id = ?', [skillId, userId]);
    return result.affectedRows > 0;
  }

  const store = readLocalStore();
  const initialLength = store.skills.length;
  store.skills = store.skills.filter((s) => !(s.id === skillId && s.user_id === userId));
  store.study_logs = store.study_logs.filter((l) => !(l.skill_id === skillId && l.user_id === userId));
  store.daily_checkins = store.daily_checkins.filter((c) => !(c.skill_id === skillId && c.user_id === userId));
  store.alarms = store.alarms.filter((a) => !(a.skill_id === skillId && a.user_id === userId));
  writeLocalStore(store);
  return store.skills.length < initialLength;
}

// ========================================================
// STUDY LOGS CRUD
// ========================================================

export async function getUserStudyLogs(userId: string): Promise<StudyLogRow[]> {
  if (useMySQL && mysqlPool) {
    const [rows] = await mysqlPool.query<mysql.RowDataPacket[]>(
      'SELECT * FROM study_logs WHERE user_id = ? ORDER BY log_date ASC',
      [userId]
    );
    return rows.map((r) => ({
      ...r,
      log_date: typeof r.log_date === 'string' ? r.log_date.slice(0, 10) : new Date(r.log_date).toISOString().slice(0, 10),
    })) as StudyLogRow[];
  }

  const store = readLocalStore();
  return store.study_logs.filter((l) => l.user_id === userId);
}

export async function createStudyLog(log: StudyLogRow): Promise<StudyLogRow> {
  if (useMySQL && mysqlPool) {
    await mysqlPool.query(
      `INSERT INTO study_logs (id, user_id, skill_id, log_date, duration_hours, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [log.id, log.user_id, log.skill_id, log.log_date, log.duration_hours, log.notes || null, log.created_at]
    );
    return log;
  }

  const store = readLocalStore();
  store.study_logs.push(log);
  writeLocalStore(store);
  return log;
}

// ========================================================
// DAILY CHECK-INS CRUD
// ========================================================

export async function getUserDailyCheckins(userId: string): Promise<DailyCheckinRow[]> {
  if (useMySQL && mysqlPool) {
    const [rows] = await mysqlPool.query<mysql.RowDataPacket[]>(
      'SELECT * FROM daily_checkins WHERE user_id = ?',
      [userId]
    );
    return rows.map((r) => ({
      ...r,
      check_date: typeof r.check_date === 'string' ? r.check_date.slice(0, 10) : new Date(r.check_date).toISOString().slice(0, 10),
    })) as DailyCheckinRow[];
  }

  const store = readLocalStore();
  return store.daily_checkins.filter((c) => c.user_id === userId);
}

export async function toggleDailyCheckin(
  userId: string,
  skillId: string,
  date: string,
  completed: boolean
): Promise<boolean> {
  if (useMySQL && mysqlPool) {
    if (completed) {
      await mysqlPool.query(
        `INSERT INTO daily_checkins (id, user_id, skill_id, check_date, completed, created_at)
         VALUES (?, ?, ?, ?, TRUE, ?)
         ON DUPLICATE KEY UPDATE completed = TRUE`,
        [`chk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`, userId, skillId, date, new Date().toISOString()]
      );
    } else {
      await mysqlPool.query(
        'DELETE FROM daily_checkins WHERE user_id = ? AND skill_id = ? AND check_date = ?',
        [userId, skillId, date]
      );
    }
    return completed;
  }

  const store = readLocalStore();
  const existingIdx = store.daily_checkins.findIndex(
    (c) => c.user_id === userId && c.skill_id === skillId && c.check_date === date
  );

  if (completed) {
    if (existingIdx >= 0) {
      store.daily_checkins[existingIdx].completed = true;
    } else {
      store.daily_checkins.push({
        id: `chk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        user_id: userId,
        skill_id: skillId,
        check_date: date,
        completed: true,
        created_at: new Date().toISOString(),
      });
    }
  } else {
    if (existingIdx >= 0) {
      store.daily_checkins.splice(existingIdx, 1);
    }
  }

  writeLocalStore(store);
  return completed;
}

// ========================================================
// ALARMS CRUD
// ========================================================

export async function getUserAlarms(userId: string): Promise<AlarmRow[]> {
  if (useMySQL && mysqlPool) {
    const [rows] = await mysqlPool.query<mysql.RowDataPacket[]>(
      'SELECT * FROM alarms WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    return rows as AlarmRow[];
  }

  const store = readLocalStore();
  return store.alarms.filter((a) => a.user_id === userId);
}

export async function createAlarm(alarm: AlarmRow): Promise<AlarmRow> {
  if (useMySQL && mysqlPool) {
    await mysqlPool.query(
      `INSERT INTO alarms (id, user_id, skill_id, title, time, days_of_week, sound_type, enabled, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        alarm.id,
        alarm.user_id,
        alarm.skill_id || null,
        alarm.title,
        alarm.time,
        alarm.days_of_week,
        alarm.sound_type,
        alarm.enabled,
        alarm.created_at,
      ]
    );
    return alarm;
  }

  const store = readLocalStore();
  store.alarms.push(alarm);
  writeLocalStore(store);
  return alarm;
}

export async function updateAlarm(userId: string, alarmId: string, updates: Partial<AlarmRow>): Promise<AlarmRow | null> {
  if (useMySQL && mysqlPool) {
    const fields: string[] = [];
    const values: any[] = [];
    for (const [key, val] of Object.entries(updates)) {
      if (key !== 'id' && key !== 'user_id' && key !== 'created_at') {
        fields.push(`${key} = ?`);
        values.push(val);
      }
    }
    if (fields.length > 0) {
      values.push(alarmId, userId);
      await mysqlPool.query(`UPDATE alarms SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`, values);
    }
    const [rows] = await mysqlPool.query<mysql.RowDataPacket[]>(
      'SELECT * FROM alarms WHERE id = ? AND user_id = ? LIMIT 1',
      [alarmId, userId]
    );
    return (rows[0] as AlarmRow) || null;
  }

  const store = readLocalStore();
  const idx = store.alarms.findIndex((a) => a.id === alarmId && a.user_id === userId);
  if (idx === -1) return null;
  store.alarms[idx] = { ...store.alarms[idx], ...updates };
  writeLocalStore(store);
  return store.alarms[idx];
}

export async function deleteAlarm(userId: string, alarmId: string): Promise<boolean> {
  if (useMySQL && mysqlPool) {
    const [result] = await mysqlPool.query<mysql.ResultSetHeader>(
      'DELETE FROM alarms WHERE id = ? AND user_id = ?',
      [alarmId, userId]
    );
    return result.affectedRows > 0;
  }

  const store = readLocalStore();
  const initialLength = store.alarms.length;
  store.alarms = store.alarms.filter((a) => !(a.id === alarmId && a.user_id === userId));
  writeLocalStore(store);
  return store.alarms.length < initialLength;
}
