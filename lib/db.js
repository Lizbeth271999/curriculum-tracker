'use strict';
/**
 * Database layer for the Personal Curriculum Tracker.
 *
 * Uses Node's built-in node:sqlite module, no external dependencies required.
 * Data lives in data/curriculum.sqlite (created automatically on first run).
 *
 * NOTE FOR FUTURE MULTI-USER / CLIENT VERSION:
 * This is built single-user on purpose. When you're ready to offer this to
 * coaching clients, the cleanest path is:
 *   1. Add a `users` table (id, email, name, password_hash, created_at).
 *   2. Add a `user_id` column to every table below, with a foreign key to users.
 *   3. Add `WHERE user_id = ?` to every query in lib/crud.js and server.js.
 *   4. Add login/session handling in server.js.
 * Keeping every table flat with simple foreign keys (as done here) makes that
 * a mechanical change rather than a redesign.
 */
const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

// DATA_DIR lets a host (like Render) point this at a persistent disk mount,
// e.g. /var/data, so the database survives deploys and restarts. Locally it
// just defaults to the data/ folder next to this project.
const dataDir = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
const dbPath = path.join(dataDir, 'curriculum.sqlite');

const db = new DatabaseSync(dbPath);
db.exec('PRAGMA foreign_keys = ON;');

db.exec(`
CREATE TABLE IF NOT EXISTS curriculum (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT,
  status TEXT NOT NULL DEFAULT 'Not Started',
  start_date TEXT,
  end_date TEXT,
  outcome_goal TEXT,
  progress_percent INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 0,
  current_lesson TEXT,
  next_action TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS resource (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'Book',
  curriculum_id INTEGER REFERENCES curriculum(id) ON DELETE SET NULL,
  priority TEXT NOT NULL DEFAULT 'Medium',
  status TEXT NOT NULL DEFAULT 'Not Started',
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS lesson (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  curriculum_id INTEGER REFERENCES curriculum(id) ON DELETE SET NULL,
  week_number INTEGER,
  module_name TEXT,
  resource_id INTEGER REFERENCES resource(id) ON DELETE SET NULL,
  due_date TEXT,
  completed INTEGER NOT NULL DEFAULT 0,
  completed_date TEXT,
  hours_logged REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS action_item (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  action_item TEXT NOT NULL,
  curriculum_id INTEGER REFERENCES curriculum(id) ON DELETE SET NULL,
  related_lesson_id INTEGER REFERENCES lesson(id) ON DELETE SET NULL,
  priority TEXT NOT NULL DEFAULT 'Medium',
  due_date TEXT,
  status TEXT NOT NULL DEFAULT 'Not Started',
  results TEXT,
  hours_logged REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS reflection (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  curriculum_id INTEGER REFERENCES curriculum(id) ON DELETE SET NULL,
  biggest_insight TEXT,
  what_changed TEXT,
  wins TEXT,
  challenges TEXT,
  action_steps TEXT,
  what_did_i_learn TEXT,
  how_can_i_apply TEXT,
  action_this_week TEXT,
  expected_result TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS vault_note (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  curriculum_id INTEGER REFERENCES curriculum(id) ON DELETE SET NULL,
  topic TEXT,
  key_takeaway TEXT,
  tags TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS habit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  curriculum_id INTEGER REFERENCES curriculum(id) ON DELETE SET NULL,
  frequency TEXT NOT NULL DEFAULT 'Daily',
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  total_checks INTEGER NOT NULL DEFAULT 0,
  total_possible INTEGER NOT NULL DEFAULT 0,
  last_checked_date TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS habit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  habit_id INTEGER NOT NULL REFERENCES habit(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  completed INTEGER NOT NULL DEFAULT 1,
  UNIQUE(habit_id, date)
);
`);

module.exports = db;
