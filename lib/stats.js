'use strict';
/** Dashboard aggregation queries: active curriculum + year-to-date progress stats. */
async function getDashboardData(pool) {
  const activeRes = await pool.query(
    'SELECT * FROM curriculum WHERE is_active = 1 ORDER BY updated_at DESC LIMIT 1',
    []
  );
  let activeCurriculum = activeRes.rows[0] || null;

  if (!activeCurriculum) {
    const fallbackRes = await pool.query(
      "SELECT * FROM curriculum WHERE status = 'In Progress' ORDER BY updated_at DESC LIMIT 1",
      []
    );
    activeCurriculum = fallbackRes.rows[0] || null;
  }

  const thisYear = "to_char(CURRENT_DATE, 'YYYY')";

  const curriculumsCompletedThisYear = (
    await pool.query(
      `SELECT COUNT(*) AS n FROM curriculum WHERE status = 'Completed' AND substr(COALESCE(end_date, updated_at), 1, 4) = ${thisYear}`,
      []
    )
  ).rows[0].n;

  const booksCompletedThisYear = (
    await pool.query(
      `SELECT COUNT(*) AS n FROM resource WHERE type = 'Book' AND status = 'Completed' AND substr(updated_at, 1, 4) = ${thisYear}`,
      []
    )
  ).rows[0].n;

  const resourcesCompletedThisYear = (
    await pool.query(
      `SELECT COUNT(*) AS n FROM resource WHERE status = 'Completed' AND substr(updated_at, 1, 4) = ${thisYear}`,
      []
    )
  ).rows[0].n;

  const lessonsCompletedThisYear = (
    await pool.query(
      `SELECT COUNT(*) AS n FROM lesson WHERE completed = 1 AND substr(COALESCE(completed_date, updated_at), 1, 4) = ${thisYear}`,
      []
    )
  ).rows[0].n;

  const actionItemsDoneThisYear = (
    await pool.query(
      `SELECT COUNT(*) AS n FROM action_item WHERE status = 'Done' AND substr(updated_at, 1, 4) = ${thisYear}`,
      []
    )
  ).rows[0].n;

  const hoursFromLessons = (
    await pool.query(`SELECT COALESCE(SUM(hours_logged), 0) AS n FROM lesson WHERE substr(updated_at, 1, 4) = ${thisYear}`, [])
  ).rows[0].n;

  const hoursFromActions = (
    await pool.query(`SELECT COALESCE(SUM(hours_logged), 0) AS n FROM action_item WHERE substr(updated_at, 1, 4) = ${thisYear}`, [])
  ).rows[0].n;

  return {
    activeCurriculum,
    progress: {
      curriculumsCompletedThisYear: Number(curriculumsCompletedThisYear),
      booksCompletedThisYear: Number(booksCompletedThisYear),
      resourcesCompletedThisYear: Number(resourcesCompletedThisYear),
      lessonsCompletedThisYear: Number(lessonsCompletedThisYear),
      actionItemsDoneThisYear: Number(actionItemsDoneThisYear),
      hoursLoggedThisYear: Math.round((Number(hoursFromLessons) + Number(hoursFromActions)) * 10) / 10,
    },
  };
}

module.exports = { getDashboardData };
