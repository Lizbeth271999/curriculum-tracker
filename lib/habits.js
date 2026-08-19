'use strict';
/** Habit check-in, streak, and success-rate logic. */

function toDateOnly(d) {
  return d.toISOString().slice(0, 10);
}

function isoWeekKey(dateStr) {
  const d = new Date(dateStr + 'T00:00:00Z');
  const target = new Date(d.valueOf());
  const dayNr = (d.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNr + 3);
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
  const weekNumber =
    1 + Math.round(((target - firstThursday) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7);
  return `${target.getUTCFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
}

function daysBetween(a, b) {
  const d1 = new Date(a + 'T00:00:00Z');
  const d2 = new Date(b + 'T00:00:00Z');
  return Math.round((d2 - d1) / 86400000);
}

async function checkIn(pool, habitId, date) {
  const habitRes = await pool.query('SELECT * FROM habit WHERE id = $1', [habitId]);
  const habit = habitRes.rows[0];
  if (!habit) throw new Error('Habit not found');
  const day = date || toDateOnly(new Date());

  await pool.query(
    'INSERT INTO habit_log (habit_id, date, completed) VALUES ($1, $2, 1) ON CONFLICT (habit_id, date) DO NOTHING RETURNING id',
    [habitId, day]
  );

  const logsRes = await pool.query('SELECT date FROM habit_log WHERE habit_id = $1 ORDER BY date ASC', [habitId]);
  const logs = logsRes.rows.map((r) => r.date);

  let currentStreak = 0;
  let longestStreak = 0;
  const today = toDateOnly(new Date());

  if (habit.frequency === 'Weekly') {
    const weeks = [...new Set(logs.map(isoWeekKey))].sort();
    let run = 0;
    for (let i = 0; i < weeks.length; i++) {
      if (i === 0) run = 1;
      else {
        const [py, pw] = weeks[i - 1].split('-W').map(Number);
        const [cy, cw] = weeks[i].split('-W').map(Number);
        const consecutive = (cy === py && cw === pw + 1) || (cy === py + 1 && pw >= 52 && cw === 1);
        run = consecutive ? run + 1 : 1;
      }
      longestStreak = Math.max(longestStreak, run);
    }
    const currentWeek = isoWeekKey(today);
    currentStreak = weeks.length && weeks[weeks.length - 1] === currentWeek ? run : 0;
  } else {
    let run = 0;
    for (let i = 0; i < logs.length; i++) {
      if (i === 0) run = 1;
      else {
        run = daysBetween(logs[i - 1], logs[i]) === 1 ? run + 1 : 1;
      }
      longestStreak = Math.max(longestStreak, run);
    }
    currentStreak = logs.length && daysBetween(logs[logs.length - 1], today) <= 1 ? run : 0;
  }

  const createdDate = habit.created_at.slice(0, 10);
  let totalPossible;
  if (habit.frequency === 'Weekly') {
    totalPossible = Math.max(1, Math.floor(daysBetween(createdDate, today) / 7) + 1);
  } else {
    totalPossible = Math.max(1, daysBetween(createdDate, today) + 1);
  }
  const totalChecks = logs.length;

  const updated = await pool.query(
    `UPDATE habit SET current_streak = $1, longest_streak = $2, total_checks = $3, total_possible = $4, last_checked_date = $5, updated_at = to_char(now(), 'YYYY-MM-DD HH24:MI:SS') WHERE id = $6 RETURNING *`,
    [currentStreak, longestStreak, totalChecks, totalPossible, day, habitId]
  );

  return updated.rows[0];
}

module.exports = { checkIn, toDateOnly };
