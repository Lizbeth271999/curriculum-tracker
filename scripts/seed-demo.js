'use strict';
/**
 * Optional: populate the tracker with example data so you can see how it
 * looks before adding your own curriculum. Safe to run once on a fresh
 * database. Run with: node scripts/seed-demo.js
 */
const db = require('../lib/db');

const existing = db.prepare('SELECT COUNT(*) AS n FROM curriculum').get().n;
if (existing > 0) {
  console.log('Database already has data, skipping demo seed. Delete data/curriculum.sqlite to start fresh.');
  process.exit(0);
}

const insertCurriculum = db.prepare(`
  INSERT INTO curriculum (name, category, status, start_date, end_date, outcome_goal, progress_percent, is_active, current_lesson, next_action)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
const c1 = insertCurriculum.run(
  'Watercolor Painting Fundamentals', 'Creative', 'In Progress', '2026-06-01', null,
  'Paint a finished piece I would hang on my own wall', 45, 1,
  'Module 3: Wet-on-wet technique', 'Practice 3 wash exercises before Sunday'
);
insertCurriculum.run(
  'Personal Finance Deep Dive', 'Financial', 'Not Started', null, null,
  'Build a full budget and investment plan', 0, 0, null, null
);

const curriculumId = Number(c1.lastInsertRowid);

const insertResource = db.prepare(`
  INSERT INTO resource (name, type, curriculum_id, priority, status, notes) VALUES (?, ?, ?, ?, ?, ?)
`);
const r1 = insertResource.run('Watercolor for the Absolute Beginner', 'Book', curriculumId, 'High', 'In Progress', 'Borrowed from library, due back in 3 weeks');
insertResource.run('YouTube: Wet-on-wet basics', 'Video', curriculumId, 'Medium', 'Completed', '');

const insertLesson = db.prepare(`
  INSERT INTO lesson (name, curriculum_id, week_number, module_name, resource_id, due_date, completed, completed_date, hours_logged)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
insertLesson.run('Color mixing basics', curriculumId, 1, 'Module 1: Foundations', Number(r1.lastInsertRowid), '2026-06-08', 1, '2026-06-07', 2);
insertLesson.run('Wet-on-wet technique', curriculumId, 3, 'Module 3: Techniques', Number(r1.lastInsertRowid), '2026-08-22', 0, null, 0);

const insertAction = db.prepare(`
  INSERT INTO action_item (action_item, curriculum_id, priority, due_date, status, results, hours_logged)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);
insertAction.run('Paint one practice wash every morning this week', curriculumId, 'High', '2026-08-23', 'In Progress', '', 1.5);

const insertReflection = db.prepare(`
  INSERT INTO reflection (date, curriculum_id, biggest_insight, what_changed, wins, challenges, action_steps, what_did_i_learn, how_can_i_apply, action_this_week, expected_result)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
insertReflection.run(
  '2026-08-10', curriculumId,
  'Loose brush control matters more than expensive paint', 'I stopped tensing up when I paint',
  'Finished my first full wash without streaks', 'Still rushing the drying time between layers',
  'Set a timer before adding the next layer',
  'Wet-on-wet needs the paper to be evenly damp, not just wet in the middle',
  'Prep the paper fully before I even pick up the brush',
  'Do 3 timed wash exercises', 'A wash with no visible streaks or blooms'
);

const insertVault = db.prepare(`
  INSERT INTO vault_note (title, curriculum_id, topic, key_takeaway, tags) VALUES (?, ?, ?, ?, ?)
`);
insertVault.run(
  'Wet-on-wet vs wet-on-dry', curriculumId, 'Technique',
  'Wet-on-wet gives soft blooms, wet-on-dry gives crisp edges. Choose based on the mood you want.',
  'watercolor, technique, basics'
);

const insertHabit = db.prepare(`
  INSERT INTO habit (name, curriculum_id, frequency) VALUES (?, ?, ?)
`);
insertHabit.run('Paint for 20 minutes', curriculumId, 'Daily');

console.log('Demo data added. Start the server with: node server.js');
