'use strict';
/**
 * Optional: populate the tracker with example data so you can see how it
 * looks before adding your own curriculum. Safe to run once on a fresh
 * database. Run with: node scripts/seed-demo.js
 */
const { pool, ready } = require('../lib/db');

async function main() {
  await ready();

  const existing = await pool.query('SELECT COUNT(*) AS n FROM curriculum', []);
  if (Number(existing.rows[0].n) > 0) {
    console.log('Database already has data, skipping demo seed.');
    await pool.end();
    return;
  }

  const c1 = await pool.query(
    `INSERT INTO curriculum (name, category, status, start_date, end_date, outcome_goal, progress_percent, is_active, current_lesson, next_action)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
    [
      'Watercolor Painting Fundamentals', 'Creative', 'In Progress', '2026-06-01', null,
      'Paint a finished piece I would hang on my own wall', 45, 1,
      'Module 3: Wet-on-wet technique', 'Practice 3 wash exercises before Sunday',
    ]
  );
  await pool.query(
    `INSERT INTO curriculum (name, category, status, start_date, end_date, outcome_goal, progress_percent, is_active, current_lesson, next_action)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    ['Personal Finance Deep Dive', 'Financial', 'Not Started', null, null, 'Build a full budget and investment plan', 0, 0, null, null]
  );

  const curriculumId = c1.rows[0].id;

  const r1 = await pool.query(
    `INSERT INTO resource (name, type, curriculum_id, priority, status, notes) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
    ['Watercolor for the Absolute Beginner', 'Book', curriculumId, 'High', 'In Progress', 'Borrowed from library, due back in 3 weeks']
  );
  await pool.query(
    `INSERT INTO resource (name, type, curriculum_id, priority, status, notes) VALUES ($1,$2,$3,$4,$5,$6)`,
    ['YouTube: Wet-on-wet basics', 'Video', curriculumId, 'Medium', 'Completed', '']
  );

  await pool.query(
    `INSERT INTO lesson (name, curriculum_id, week_number, module_name, resource_id, due_date, completed, completed_date, hours_logged)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    ['Color mixing basics', curriculumId, 1, 'Module 1: Foundations', r1.rows[0].id, '2026-06-08', 1, '2026-06-07', 2]
  );
  await pool.query(
    `INSERT INTO lesson (name, curriculum_id, week_number, module_name, resource_id, due_date, completed, completed_date, hours_logged)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    ['Wet-on-wet technique', curriculumId, 3, 'Module 3: Techniques', r1.rows[0].id, '2026-08-22', 0, null, 0]
  );

  await pool.query(
    `INSERT INTO action_item (action_item, curriculum_id, priority, due_date, status, results, hours_logged)
     VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    ['Paint one practice wash every morning this week', curriculumId, 'High', '2026-08-23', 'In Progress', '', 1.5]
  );

  await pool.query(
    `INSERT INTO reflection (date, curriculum_id, biggest_insight, what_changed, wins, challenges, action_steps, what_did_i_learn, how_can_i_apply, action_this_week, expected_result)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
    [
      '2026-08-10', curriculumId,
      'Loose brush control matters more than expensive paint', 'I stopped tensing up when I paint',
      'Finished my first full wash without streaks', 'Still rushing the drying time between layers',
      'Set a timer before adding the next layer',
      'Wet-on-wet needs the paper to be evenly damp, not just wet in the middle',
      'Prep the paper fully before I even pick up the brush',
      'Do 3 timed wash exercises', 'A wash with no visible streaks or blooms',
    ]
  );

  await pool.query(
    `INSERT INTO vault_note (title, curriculum_id, topic, key_takeaway, tags) VALUES ($1,$2,$3,$4,$5)`,
    [
      'Wet-on-wet vs wet-on-dry', curriculumId, 'Technique',
      'Wet-on-wet gives soft blooms, wet-on-dry gives crisp edges. Choose based on the mood you want.',
      'watercolor, technique, basics',
    ]
  );

  await pool.query(`INSERT INTO habit (name, curriculum_id, frequency) VALUES ($1,$2,$3)`, [
    'Paint for 20 minutes', curriculumId, 'Daily',
  ]);

  console.log('Demo data added. Start the server with: node server.js');
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
