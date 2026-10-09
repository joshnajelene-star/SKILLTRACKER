-- ========================================================
-- SkillTracker MySQL Database Schema
-- Beginner-friendly, normalized relational schema
-- ========================================================

CREATE DATABASE IF NOT EXISTS skilltracker_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE skilltracker_db;

-- 1. Users table for authentication and profile preferences
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  daily_goal_hours DECIMAL(4, 2) DEFAULT 2.00,
  streak INT DEFAULT 0,
  dark_mode BOOLEAN DEFAULT TRUE,
  sound_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Skills table linked to each user
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
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Daily practice logs & time tracking
CREATE TABLE IF NOT EXISTS study_logs (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  skill_id VARCHAR(64) NOT NULL,
  log_date DATE NOT NULL,
  duration_hours DECIMAL(4, 2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
);

-- 4. Daily practice check-in status (e.g. checkmarked for date)
CREATE TABLE IF NOT EXISTS daily_checkins (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  skill_id VARCHAR(64) NOT NULL,
  check_date DATE NOT NULL,
  completed BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_skill_date (user_id, skill_id, check_date),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
);

-- 5. Study Alarms table
CREATE TABLE IF NOT EXISTS alarms (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  skill_id VARCHAR(64) NULL,
  title VARCHAR(150) NOT NULL,
  time VARCHAR(10) NOT NULL,
  days_of_week VARCHAR(50) NOT NULL DEFAULT '0,1,2,3,4,5,6',
  sound_type VARCHAR(30) NOT NULL DEFAULT 'bell',
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE SET NULL
);
