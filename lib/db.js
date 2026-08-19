'use strict';
/**
 * Database layer for the Personal Curriculum Tracker (Postgres edition).
 *
 * Connects to a Postgres database via DATABASE_URL (e.g. a free Supabase
 * project). Locally, without DATABASE_URL set, it falls back to a local
 * "curriculum_test" database for development.
 *
 * Every timestamp/date column is stored as TEXT in the exact same
 * "YYYY-MM-DD" / "YYYY-MM-DD HH24:MI:SS" format SQLite used to produce.
 * That's deliberate: it keeps every date computation in lib/ and public/js/
 * working unchanged, since they all expect plain strings, not Date objects.
 *
 * NOTE FOR FUTURE MULTI-USER / CLIENT VERSION:
 * This is built single-user on purpose. When you're ready to offer this to
 * coaching clients, the path is:
 *   1. Add a `users` table (id, email, name, password_hash, created_at).
 *   2. Add a `user_id` column to every table below, with a foreign key to users.
 *   3. Add `WHERE user_id = $N` to every query in lib/crud.js and server.js.
 *   4. Add login/session handling in server.js.
 * Keeping every table flat with simple foreign keys (as done here) makes that
 * a mechanical change rather than a redesign.
 */
const { Pool } = require('pg');

const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }
    : { database: process.env.PGDATABASE || 'curriculum_test', host: 'localhost' }
);

const SCHEMA = `
CREATE TABLE IF NOT EXISTS curriculum (
  id SERIAL PRIMARY KEY,
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
  created_at TEXT NOT NULL DEFAULT to_char(now(), 'YYYY-MM-DD HH24:MI:SS'),
  updated_at TEXT NOT NULL DEFAULT to_char(now(), 'YYYY-MM-DD HH24:MI:SS')
);

CREATE TABLE IF NOT EXISTS resource (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'Book',
  curriculum_id INTEGER REFERENCES curriculum(id) ON DELETE SET NULL,
  priority TEXT NOT NULL DEFAULT 'Medium',
  status TEXT NOT NULL DEFAULT 'Not Started',
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT to_char(now(), 'YYYY-MM-DD HH24:MI:SS'),
  updated_at TEXT NOT NULL DEFAULT to_char(now(), 'YYYY-MM-DD HH24:MI:SS')
);

CREATE TABLE IF NOT EXISTS lesson (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  curriculum_id INTEGER REFERENCES curriculum(id) ON DELETE SET NULL,
  week_number INTEGER,
  module_name TEXT,
  resource_id INTEGER REFERENCES resource(id) ON DELETE SET NULL,
  due_date TEXT,
  completed INTEGER NOT NULL DEFAULT 0,
  completed_date TEXT,
  hours_logged REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT to_char(now(), 'YYYY-MM-DD HH24:MI:SS'),
  updated_at TEXT NOT NULL DEFAULT to_char(now(), 'YYYY-MM-DD HH24:MI:SS')
);

CREATE TABLE IF NOT EXISTS action_item (
  id SERIAL PRIMARY KEY,
  action_item TEXT NOT NULL,
  curriculum_id INTEGER REFERENCES curriculum(id) ON DELETE SET NULL,
  related_lesson_id INTEGER REFERENCES lesson(id) ON DELETE SET NULL,
  priority TEXT NOT NULL DEFAULT 'Medium',
  due_date TEXT,
  status TEXT NOT NULL DEFAULT 'Not Started',
  results TEXT,
  hours_logged REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT to_char(now(), 'YYYY-MM-DD HH24:MI:SS'),
  updated_at TEXT NOT NULL DEFAULT to_char(now(), 'YYYY-MM-DD HH24:MI:SS')
);

CREATE TABLE IF NOT EXISTS reflection (
  id SERIAL PRIMARY KEY,
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
  created_at TEXT NOT NULL DEFAULT to_char(now(), 'YYYY-MM-DD HH24:MI:SS'),
  updated_at TEXT NOT NULL DEFAULT to_char(now(), 'YYYY-MM-DD HH24:MI:SS')
);

CREATE TABLE IF NOT EXISTS vault_note (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  curriculum_id INTEGER REFERENCES curriculum(id) ON DELETE SET NULL,
  topic TEXT,
  key_takeaway TEXT,
  tags TEXT,
  created_at TEXT NOT NULL DEFAULT to_char(now(), 'YYYY-MM-DD HH24:MI:SS'),
  updated_at TEXT NOT NULL DEFAULT to_char(now(), 'YYYY-MM-DD HH24:MI:SS')
);

CREATE TABLE IF NOT EXISTS habit (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  curriculum_id INTEGER REFERENCES curriculum(id) ON DELETE SET NULL,
  frequency TEXT NOT NULL DEFAULT 'Daily',
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  total_checks INTEGER NOT NULL DEFAULT 0,
  total_possible INTEGER NOT NULL DEFAULT 0,
  last_checked_date TEXT,
  created_at TEXT NOT NULL DEFAULT to_char(now(), 'YYYY-MM-DD HH24:MI:SS'),
  updated_at TEXT NOT NULL DEFAULT to_char(now(), 'YYYY-MM-DD HH24:MI:SS')
);

CREATE TABLE IF NOT EXISTS habit_log (
  id SERIAL PRIMARY KEY,
  habit_id INTEGER NOT NULL REFERENCES habit(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  completed INTEGER NOT NULL DEFAULT 1,
  UNIQUE(habit_id, date)
);
`;

let readyPromise = null;

/** Ensures the schema exists. Safe to call many times; only runs once. */
function ready() {
  if (!readyPromise) {
    readyPromise = pool.query(SCHEMA);
  }
  return readyPromise;
}

module.exports = { pool, ready };
