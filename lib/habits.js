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

function checkIn(db, habitId, date) {
  const habit = db.prepare('SELECT * FROM habit WHERE id = ?').get(habitId);
  if (!habit) throw new Error('Habit not found');
  const day = date || toDateOnly(new Date());

  db.prepare('INSERT OR IGNORE INTO habit_log (habit_id, date, completed) VALUES (?, ?, 1)').run(habitId, day);

  const logs = db
    .prepare('SELECT date FROM habit_log WHERE habit_id = ? ORDER BY date ASC')
    .all(habitId)
    .map((r) => r.date);

  let currentStreak = 0;
  let longestStreak = 0;
  const today = toDateOnly(new Date());

  if (habit.frequency === 'Weekly') {
    const weeks = [...new Set(logs.map(isoWeekKey))].sort();
    let run = 0;
    let prevIdx = null;
    for (let i = 0; i < weeks.length; i++) {
      if (prevIdx === null) run = 1;
      else {
        const [py, pw] = weeks[i - 1].split('-W').map(Number);
        const [cy, cw] = weeks[i].split('-W').map(Number);
        const consecutive = (cy === py && cw === pw + 1) || (cy === py + 1 && pw >= 52 && cw === 1);
        run = consecutive ? run + 1 : 1;
      }
      longestStreak = Math.max(longestStreak, run);
      prevIdx = i;
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

  db.prepare(
    `UPDATE habit SET current_streak = ?, longest_streak = ?, total_checks = ?, total_possible = ?, last_checked_date = ?, updated_at = datetime('now') WHERE id = ?`
  ).run(currentStreak, longestStreak, totalChecks, totalPossible, day, habitId);

  return db.prepare('SELECT * FROM habit WHERE id = ?').get(habitId);
}

module.exports = { checkIn, toDateOnly };
