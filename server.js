// server.ts
import "dotenv/config";
import express from "express";
import path2 from "path";
import fs2 from "fs";
import { fileURLToPath } from "url";

// server/db.ts
import fs from "fs";
import path from "path";
import mysql from "mysql2/promise";
var DATA_DIR = path.resolve(process.cwd(), "data");
var DB_FILE = path.join(DATA_DIR, "database.json");
var mysqlPool = null;
var useMySQL = false;
async function initDatabase() {
  const host = process.env.DB_HOST || process.env.MYSQL_HOST;
  const user = process.env.DB_USER || process.env.MYSQL_USER;
  const password = process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD;
  const database = process.env.DB_NAME || process.env.MYSQL_DATABASE || "skilltracker_db";
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
          queueLimit: 0
        });
        await mysqlPool.query("SELECT 1");
      } catch (poolErr) {
        if (poolErr?.code === "ER_BAD_DB_ERROR" || poolErr?.message?.includes("Unknown database")) {
          console.log(`[Database] Database '${database}' not found on MySQL server. Creating it now...`);
          const adminConn = await mysql.createConnection({
            host,
            user,
            password,
            port
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
            queueLimit: 0
          });
          await mysqlPool.query("SELECT 1");
        } else {
          throw poolErr;
        }
      }
      useMySQL = true;
      console.log(`[Database] Successfully connected to MySQL database '${database}'!`);
      await createMySQLTablesIfNotExist();
      return;
    } catch (err) {
      console.warn("[Database] MySQL server not reachable, using resilient local storage fallback:", err.message);
    }
  }
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    const initialData = {
      users: [],
      skills: [],
      study_logs: [],
      daily_checkins: [],
      alarms: []
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), "utf-8");
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
    console.error("[Database] Failed to auto-create tables in MySQL", e);
  }
}
function readLocalStore() {
  try {
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return { users: [], skills: [], study_logs: [], daily_checkins: [], alarms: [] };
  }
}
function writeLocalStore(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (e) {
    console.error("Failed to write local database file", e);
  }
}
async function findUserByEmail(email) {
  const normalized = email.trim().toLowerCase();
  if (useMySQL && mysqlPool) {
    const [rows] = await mysqlPool.query(
      "SELECT * FROM users WHERE LOWER(email) = ? LIMIT 1",
      [normalized]
    );
    return rows[0] || null;
  }
  const store = readLocalStore();
  const found = store.users.find((u) => u.email.toLowerCase() === normalized);
  return found || null;
}
async function findUserById(id) {
  if (useMySQL && mysqlPool) {
    const [rows] = await mysqlPool.query(
      "SELECT * FROM users WHERE id = ? LIMIT 1",
      [id]
    );
    return rows[0] || null;
  }
  const store = readLocalStore();
  return store.users.find((u) => u.id === id) || null;
}
async function createUser(user) {
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
        user.created_at
      ]
    );
    return user;
  }
  const store = readLocalStore();
  store.users.push(user);
  writeLocalStore(store);
  return user;
}
async function updateUserProfile(userId, updates) {
  if (useMySQL && mysqlPool) {
    const fields = [];
    const values = [];
    for (const [key, val] of Object.entries(updates)) {
      fields.push(`${key} = ?`);
      values.push(val);
    }
    if (fields.length > 0) {
      values.push(userId);
      await mysqlPool.query(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`, values);
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
async function getUserSkills(userId) {
  if (useMySQL && mysqlPool) {
    const [rows] = await mysqlPool.query(
      "SELECT * FROM skills WHERE user_id = ? ORDER BY created_at DESC",
      [userId]
    );
    return rows;
  }
  const store = readLocalStore();
  return store.skills.filter((s) => s.user_id === userId);
}
async function createSkill(skill) {
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
        skill.created_at
      ]
    );
    return skill;
  }
  const store = readLocalStore();
  store.skills.push(skill);
  writeLocalStore(store);
  return skill;
}
async function updateSkill(userId, skillId, updates) {
  if (useMySQL && mysqlPool) {
    const fields = [];
    const values = [];
    for (const [key, val] of Object.entries(updates)) {
      if (key !== "id" && key !== "user_id" && key !== "created_at") {
        fields.push(`${key} = ?`);
        values.push(val);
      }
    }
    if (fields.length > 0) {
      values.push(skillId, userId);
      await mysqlPool.query(`UPDATE skills SET ${fields.join(", ")} WHERE id = ? AND user_id = ?`, values);
    }
    const [rows] = await mysqlPool.query(
      "SELECT * FROM skills WHERE id = ? AND user_id = ? LIMIT 1",
      [skillId, userId]
    );
    return rows[0] || null;
  }
  const store = readLocalStore();
  const idx = store.skills.findIndex((s) => s.id === skillId && s.user_id === userId);
  if (idx === -1) return null;
  store.skills[idx] = { ...store.skills[idx], ...updates };
  writeLocalStore(store);
  return store.skills[idx];
}
async function deleteSkill(userId, skillId) {
  if (useMySQL && mysqlPool) {
    const [result] = await mysqlPool.query(
      "DELETE FROM skills WHERE id = ? AND user_id = ?",
      [skillId, userId]
    );
    await mysqlPool.query("DELETE FROM study_logs WHERE skill_id = ? AND user_id = ?", [skillId, userId]);
    await mysqlPool.query("DELETE FROM daily_checkins WHERE skill_id = ? AND user_id = ?", [skillId, userId]);
    await mysqlPool.query("DELETE FROM alarms WHERE skill_id = ? AND user_id = ?", [skillId, userId]);
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
async function getUserStudyLogs(userId) {
  if (useMySQL && mysqlPool) {
    const [rows] = await mysqlPool.query(
      "SELECT * FROM study_logs WHERE user_id = ? ORDER BY log_date ASC",
      [userId]
    );
    return rows.map((r) => ({
      ...r,
      log_date: typeof r.log_date === "string" ? r.log_date.slice(0, 10) : new Date(r.log_date).toISOString().slice(0, 10)
    }));
  }
  const store = readLocalStore();
  return store.study_logs.filter((l) => l.user_id === userId);
}
async function createStudyLog(log) {
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
async function getUserDailyCheckins(userId) {
  if (useMySQL && mysqlPool) {
    const [rows] = await mysqlPool.query(
      "SELECT * FROM daily_checkins WHERE user_id = ?",
      [userId]
    );
    return rows.map((r) => ({
      ...r,
      check_date: typeof r.check_date === "string" ? r.check_date.slice(0, 10) : new Date(r.check_date).toISOString().slice(0, 10)
    }));
  }
  const store = readLocalStore();
  return store.daily_checkins.filter((c) => c.user_id === userId);
}
async function toggleDailyCheckin(userId, skillId, date, completed) {
  if (useMySQL && mysqlPool) {
    if (completed) {
      await mysqlPool.query(
        `INSERT INTO daily_checkins (id, user_id, skill_id, check_date, completed, created_at)
         VALUES (?, ?, ?, ?, TRUE, ?)
         ON DUPLICATE KEY UPDATE completed = TRUE`,
        [`chk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`, userId, skillId, date, (/* @__PURE__ */ new Date()).toISOString()]
      );
    } else {
      await mysqlPool.query(
        "DELETE FROM daily_checkins WHERE user_id = ? AND skill_id = ? AND check_date = ?",
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
        created_at: (/* @__PURE__ */ new Date()).toISOString()
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
async function getUserAlarms(userId) {
  if (useMySQL && mysqlPool) {
    const [rows] = await mysqlPool.query(
      "SELECT * FROM alarms WHERE user_id = ? ORDER BY created_at DESC",
      [userId]
    );
    return rows;
  }
  const store = readLocalStore();
  return store.alarms.filter((a) => a.user_id === userId);
}
async function createAlarm(alarm) {
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
        alarm.created_at
      ]
    );
    return alarm;
  }
  const store = readLocalStore();
  store.alarms.push(alarm);
  writeLocalStore(store);
  return alarm;
}
async function updateAlarm(userId, alarmId, updates) {
  if (useMySQL && mysqlPool) {
    const fields = [];
    const values = [];
    for (const [key, val] of Object.entries(updates)) {
      if (key !== "id" && key !== "user_id" && key !== "created_at") {
        fields.push(`${key} = ?`);
        values.push(val);
      }
    }
    if (fields.length > 0) {
      values.push(alarmId, userId);
      await mysqlPool.query(`UPDATE alarms SET ${fields.join(", ")} WHERE id = ? AND user_id = ?`, values);
    }
    const [rows] = await mysqlPool.query(
      "SELECT * FROM alarms WHERE id = ? AND user_id = ? LIMIT 1",
      [alarmId, userId]
    );
    return rows[0] || null;
  }
  const store = readLocalStore();
  const idx = store.alarms.findIndex((a) => a.id === alarmId && a.user_id === userId);
  if (idx === -1) return null;
  store.alarms[idx] = { ...store.alarms[idx], ...updates };
  writeLocalStore(store);
  return store.alarms[idx];
}
async function deleteAlarm(userId, alarmId) {
  if (useMySQL && mysqlPool) {
    const [result] = await mysqlPool.query(
      "DELETE FROM alarms WHERE id = ? AND user_id = ?",
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

// server/routes.ts
import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
var JWT_SECRET = process.env.JWT_SECRET || "skilltracker-secret-key-2026";
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    res.status(401).json({ error: "Access token required. Please log in." });
    return;
  }
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err || !decoded?.userId) {
      res.status(403).json({ error: "Session expired or invalid token. Please log in again." });
      return;
    }
    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    next();
  });
}
var apiRouter = Router();
apiRouter.get("/health", (_req, res) => {
  res.json({ status: "ok", time: (/* @__PURE__ */ new Date()).toISOString() });
});
apiRouter.post("/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      res.status(400).json({ error: "Name, email, and password are required." });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: "Password must be at least 6 characters long." });
      return;
    }
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      res.status(400).json({ error: "An account with this email already exists." });
      return;
    }
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const userId = `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const newUser = await createUser({
      id: userId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password_hash: passwordHash,
      daily_goal_hours: 2,
      streak: 0,
      dark_mode: true,
      sound_enabled: true,
      created_at: now
    });
    const token = jwt.sign({ userId: newUser.id, email: newUser.email }, JWT_SECRET, {
      expiresIn: "7d"
    });
    res.status(201).json({
      message: "Account created successfully!",
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        dailyGoalHours: newUser.daily_goal_hours,
        streak: newUser.streak,
        darkMode: newUser.dark_mode,
        soundEnabled: newUser.sound_enabled
      }
    });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ error: "Server error during registration. Please try again." });
  }
});
apiRouter.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required." });
      return;
    }
    const user = await findUserByEmail(email);
    if (!user) {
      res.status(401).json({ error: "Invalid email or password." });
      return;
    }
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      res.status(401).json({ error: "Invalid email or password." });
      return;
    }
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: "7d"
    });
    res.json({
      message: "Logged in successfully!",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        dailyGoalHours: user.daily_goal_hours,
        streak: user.streak,
        darkMode: user.dark_mode,
        soundEnabled: user.sound_enabled
      }
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error during login. Please try again." });
  }
});
apiRouter.get("/auth/me", authenticateToken, async (req, res) => {
  try {
    const user = await findUserById(req.userId);
    if (!user) {
      res.status(404).json({ error: "User not found." });
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
        soundEnabled: user.sound_enabled
      }
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve profile." });
  }
});
apiRouter.put("/auth/profile", authenticateToken, async (req, res) => {
  try {
    const { name, dailyGoalHours, darkMode, soundEnabled, streak } = req.body;
    const updates = {};
    if (typeof name === "string") updates.name = name.trim();
    if (typeof dailyGoalHours === "number") updates.daily_goal_hours = dailyGoalHours;
    if (typeof darkMode === "boolean") updates.dark_mode = darkMode;
    if (typeof soundEnabled === "boolean") updates.sound_enabled = soundEnabled;
    if (typeof streak === "number") updates.streak = streak;
    const updated = await updateUserProfile(req.userId, updates);
    if (!updated) {
      res.status(404).json({ error: "User not found." });
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
        soundEnabled: updated.sound_enabled
      }
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to update profile." });
  }
});
apiRouter.get("/profile", authenticateToken, async (req, res) => {
  try {
    const user = await findUserById(req.userId);
    if (!user) {
      res.status(404).json({ error: "User not found." });
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
        createdAt: user.created_at
      }
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve profile." });
  }
});
apiRouter.put("/profile", authenticateToken, async (req, res) => {
  try {
    const { name, dailyGoalHours, darkMode, soundEnabled, streak } = req.body;
    const updates = {};
    if (typeof name === "string") updates.name = name.trim();
    if (typeof dailyGoalHours === "number") updates.daily_goal_hours = dailyGoalHours;
    if (typeof darkMode === "boolean") updates.dark_mode = darkMode;
    if (typeof soundEnabled === "boolean") updates.sound_enabled = soundEnabled;
    if (typeof streak === "number") updates.streak = streak;
    const updated = await updateUserProfile(req.userId, updates);
    if (!updated) {
      res.status(404).json({ error: "User not found." });
      return;
    }
    res.json({
      message: "Profile updated successfully",
      profile: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        dailyGoalHours: Number(updated.daily_goal_hours),
        streak: Number(updated.streak),
        darkMode: Boolean(updated.dark_mode),
        soundEnabled: Boolean(updated.sound_enabled)
      }
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to update profile." });
  }
});
apiRouter.get("/skills", authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const skills = await getUserSkills(userId);
    const logs = await getUserStudyLogs(userId);
    const checkins = await getUserDailyCheckins(userId);
    const formatted = skills.map((s) => {
      const history = {};
      logs.filter((l) => l.skill_id === s.id).forEach((l) => {
        history[l.log_date] = (history[l.log_date] || 0) + Number(l.duration_hours);
      });
      const checkedDays = {};
      checkins.filter((c) => c.skill_id === s.id && c.completed).forEach((c) => {
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
        createdAt: s.created_at
      };
    });
    res.json({ skills: formatted });
  } catch (err) {
    console.error("Fetch skills error:", err);
    res.status(500).json({ error: "Failed to fetch skills." });
  }
});
apiRouter.post("/skills", authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
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
      notes
    } = req.body;
    if (!name) {
      res.status(400).json({ error: "Skill name is required." });
      return;
    }
    const skillId = `skill-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newSkill = {
      id: skillId,
      user_id: userId,
      name: name.trim(),
      category: category || "Programming",
      goal: goal || "",
      target_days: Number(targetDays) || 30,
      daily_target_hours: Number(dailyTargetHours) || 1,
      completed_days: 0,
      total_hours_practiced: 0,
      color: color || "indigo",
      icon_name: iconName || (category ? category.toLowerCase() : "code"),
      alarm_enabled: Boolean(alarmEnabled),
      alarm_time: alarmTime || "19:00",
      notes: notes || "",
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    await createSkill(newSkill);
    if (alarmEnabled) {
      await createAlarm({
        id: `alarm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        user_id: userId,
        skill_id: skillId,
        title: `${newSkill.name} Study Time`,
        time: alarmTime || "19:00",
        days_of_week: "0,1,2,3,4,5,6",
        sound_type: "gentle",
        enabled: true,
        created_at: (/* @__PURE__ */ new Date()).toISOString()
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
        createdAt: newSkill.created_at
      }
    });
  } catch (err) {
    console.error("Create skill error:", err);
    res.status(500).json({ error: "Failed to create skill." });
  }
});
apiRouter.put("/skills/:id", authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
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
      notes
    } = req.body;
    const updates = {};
    if (name) updates.name = name.trim();
    if (category) updates.category = category;
    if (goal !== void 0) updates.goal = goal;
    if (targetDays !== void 0) updates.target_days = Number(targetDays);
    if (dailyTargetHours !== void 0) updates.daily_target_hours = Number(dailyTargetHours);
    if (completedDays !== void 0) updates.completed_days = Number(completedDays);
    if (totalHoursPracticed !== void 0) updates.total_hours_practiced = Number(totalHoursPracticed);
    if (color) updates.color = color;
    if (iconName) updates.icon_name = iconName;
    if (alarmEnabled !== void 0) updates.alarm_enabled = Boolean(alarmEnabled);
    if (alarmTime) updates.alarm_time = alarmTime;
    if (notes !== void 0) updates.notes = notes;
    const updated = await updateSkill(userId, skillId, updates);
    if (!updated) {
      res.status(404).json({ error: "Skill not found." });
      return;
    }
    res.json({ skill: updated });
  } catch (err) {
    res.status(500).json({ error: "Failed to update skill." });
  }
});
apiRouter.delete("/skills/:id", authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const skillId = req.params.id;
    const success = await deleteSkill(userId, skillId);
    if (!success) {
      res.status(404).json({ error: "Skill not found." });
      return;
    }
    res.json({ message: "Skill deleted successfully." });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete skill." });
  }
});
apiRouter.post("/skills/:id/log", authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const skillId = req.params.id;
    const { hours, date, notes } = req.body;
    if (!hours || Number(hours) <= 0) {
      res.status(400).json({ error: "Valid study hours duration is required." });
      return;
    }
    const logDate = date || (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    const durationHours = Number(hours);
    const logId = `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    await createStudyLog({
      id: logId,
      user_id: userId,
      skill_id: skillId,
      log_date: logDate,
      duration_hours: durationHours,
      notes: notes || "",
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    });
    await toggleDailyCheckin(userId, skillId, logDate, true);
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
        completed_days: newCompletedDays
      });
    }
    const logs = await getUserStudyLogs(userId);
    const uniqueDates = Array.from(new Set(logs.map((l) => l.log_date))).sort().reverse();
    const streak = calculateStreakFromDates(uniqueDates);
    await updateUserProfile(userId, { streak });
    res.json({
      message: "Study session logged successfully!",
      streak
    });
  } catch (err) {
    console.error("Study log error:", err);
    res.status(500).json({ error: "Failed to log study session." });
  }
});
apiRouter.post("/skills/:id/checkin", authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const skillId = req.params.id;
    const { date, completed } = req.body;
    const checkDate = date || (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    const isCompleted = completed !== void 0 ? Boolean(completed) : true;
    await toggleDailyCheckin(userId, skillId, checkDate, isCompleted);
    const skills = await getUserSkills(userId);
    const s = skills.find((item) => item.id === skillId);
    if (s && isCompleted) {
      await updateSkill(userId, skillId, {
        completed_days: Math.min(Number(s.target_days), Number(s.completed_days) + 1)
      });
    }
    res.json({ success: true, completed: isCompleted });
  } catch (err) {
    res.status(500).json({ error: "Failed to update check-in." });
  }
});
apiRouter.post("/skills/seed-starter", authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const starterSkills = [
      {
        name: "JavaScript",
        category: "Programming",
        goal: "Learn JavaScript basics, DOM manipulation & build 3 apps",
        target_days: 30,
        daily_target_hours: 1.5,
        color: "amber",
        alarm_time: "18:30"
      },
      {
        name: "Python",
        category: "Programming",
        goal: "Master Python syntax, data structures & solve 30 problems",
        target_days: 30,
        daily_target_hours: 1,
        color: "sky",
        alarm_time: "19:45"
      },
      {
        name: "SQL",
        category: "Data",
        goal: "Database querying, joins, aggregations & database design",
        target_days: 20,
        daily_target_hours: 1,
        color: "emerald",
        alarm_time: "20:30"
      },
      {
        name: "English & Communication",
        category: "Communication",
        goal: "Daily speaking practice, vocabulary enhancement & presentations",
        target_days: 25,
        daily_target_hours: 0.75,
        color: "violet",
        alarm_time: "08:00"
      }
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
        icon_name: "code",
        alarm_enabled: true,
        alarm_time: item.alarm_time,
        notes: "",
        created_at: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
    res.json({ message: "Starter sample skills loaded." });
  } catch (err) {
    res.status(500).json({ error: "Failed to seed sample skills." });
  }
});
apiRouter.get("/study-logs", authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const logs = await getUserStudyLogs(userId);
    res.json({ studyLogs: logs });
  } catch (err) {
    console.error("Fetch study logs error:", err);
    res.status(500).json({ error: "Failed to fetch study logs." });
  }
});
apiRouter.post("/study-logs", authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { skillId, skill_id, hours, duration_hours, date, log_date, notes } = req.body;
    const targetSkillId = skillId || skill_id;
    const targetHours = Number(hours !== void 0 ? hours : duration_hours);
    const targetDate = date || log_date || (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    if (!targetSkillId) {
      res.status(400).json({ error: "skillId is required." });
      return;
    }
    if (isNaN(targetHours) || targetHours <= 0) {
      res.status(400).json({ error: "Valid study duration in hours is required." });
      return;
    }
    const logId = `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newLog = {
      id: logId,
      user_id: userId,
      skill_id: targetSkillId,
      log_date: targetDate,
      duration_hours: targetHours,
      notes: notes || "",
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    await createStudyLog(newLog);
    await toggleDailyCheckin(userId, targetSkillId, targetDate, true);
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
        completed_days: newCompletedDays
      });
    }
    const logs = await getUserStudyLogs(userId);
    const uniqueDates = Array.from(new Set(logs.map((l) => l.log_date))).sort().reverse();
    const streak = calculateStreakFromDates(uniqueDates);
    await updateUserProfile(userId, { streak });
    res.status(201).json({
      message: "Study session logged successfully!",
      studyLog: newLog,
      streak
    });
  } catch (err) {
    console.error("Create study log error:", err);
    res.status(500).json({ error: "Failed to create study log." });
  }
});
apiRouter.get("/alarms", authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const alarms = await getUserAlarms(userId);
    const formatted = alarms.map((a) => ({
      id: a.id,
      title: a.title,
      time: a.time,
      skillId: a.skill_id,
      daysOfWeek: a.days_of_week ? a.days_of_week.split(",").map(Number) : [0, 1, 2, 3, 4, 5, 6],
      soundType: a.sound_type,
      enabled: Boolean(a.enabled)
    }));
    res.json({ alarms: formatted });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch alarms." });
  }
});
apiRouter.post("/alarms", authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { title, time, skillId, daysOfWeek, soundType, enabled } = req.body;
    const alarmId = `alarm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newAlarm = {
      id: alarmId,
      user_id: userId,
      skill_id: skillId || void 0,
      title: title || "Study Reminder",
      time: time || "19:00",
      days_of_week: Array.isArray(daysOfWeek) ? daysOfWeek.join(",") : "0,1,2,3,4,5,6",
      sound_type: soundType || "bell",
      enabled: enabled !== void 0 ? Boolean(enabled) : true,
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    await createAlarm(newAlarm);
    res.status(201).json({ alarm: newAlarm });
  } catch (err) {
    res.status(500).json({ error: "Failed to create alarm." });
  }
});
apiRouter.put("/alarms/:id", authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const alarmId = req.params.id;
    const { title, time, skillId, daysOfWeek, soundType, enabled } = req.body;
    const updates = {};
    if (title) updates.title = title;
    if (time) updates.time = time;
    if (skillId !== void 0) updates.skill_id = skillId;
    if (daysOfWeek) updates.days_of_week = Array.isArray(daysOfWeek) ? daysOfWeek.join(",") : daysOfWeek;
    if (soundType) updates.sound_type = soundType;
    if (enabled !== void 0) updates.enabled = Boolean(enabled);
    const updated = await updateAlarm(userId, alarmId, updates);
    res.json({ alarm: updated });
  } catch (err) {
    res.status(500).json({ error: "Failed to update alarm." });
  }
});
apiRouter.delete("/alarms/:id", authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const alarmId = req.params.id;
    await deleteAlarm(userId, alarmId);
    res.json({ message: "Alarm deleted." });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete alarm." });
  }
});
function calculateStreakFromDates(sortedDateStringsDesc) {
  if (sortedDateStringsDesc.length === 0) return 0;
  const todayStr = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const yesterday = /* @__PURE__ */ new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);
  const mostRecent = sortedDateStringsDesc[0];
  if (mostRecent !== todayStr && mostRecent !== yesterdayStr) {
    return 0;
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

// server.ts
var __filename = fileURLToPath(import.meta.url);
var __dirname = path2.dirname(__filename);
async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3e3;
  await initDatabase();
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });
  app.use(express.json());
  app.use("/api", apiRouter);
  app.all("/api/*", (req, res) => {
    res.status(404).json({ error: `API route ${req.method} ${req.path} not found` });
  });
  const distPath = path2.resolve(__dirname, "dist");
  const hasDist = fs2.existsSync(distPath) && fs2.existsSync(path2.resolve(distPath, "index.html"));
  const isProduction = process.env.NODE_ENV === "production";
  if (isProduction || hasDist) {
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path2.resolve(distPath, "index.html"));
    });
    console.log(`[SkillTracker] Serving production frontend build from ${distPath}`);
  } else {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
    console.log("[Dev] Vite middleware attached to Express server");
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SkillTracker Server] Listening on http://0.0.0.0:${PORT}`);
  });
}
startServer().catch((err) => {
  console.error("[SkillTracker Server] Startup error:", err);
  process.exit(1);
});
