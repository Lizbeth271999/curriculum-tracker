'use strict';
/** Dashboard aggregation queries: active curriculum + year-to-date progress stats. */
function getDashboardData(db) {
  const activeCurriculum = db
    .prepare('SELECT * FROM curriculum WHERE is_active = 1 ORDER BY updated_at DESC LIMIT 1')
    .get();

  const fallbackCurriculum = activeCurriculum
    ? null
    : db.prepare("SELECT * FROM curriculum WHERE status = 'In Progress' ORDER BY updated_at DESC LIMIT 1").get();

  const curriculumsCompletedThisYear = db
    .prepare(
      "SELECT COUNT(*) AS n FROM curriculum WHERE status = 'Completed' AND strftime('%Y', COALESCE(end_date, updated_at)) = strftime('%Y','now')"
    )
    .get().n;

  const booksCompletedThisYear = db
    .prepare(
      "SELECT COUNT(*) AS n FROM resource WHERE type = 'Book' AND status = 'Completed' AND strftime('%Y', updated_at) = strftime('%Y','now')"
    )
    .get().n;

  const resourcesCompletedThisYear = db
    .prepare(
      "SELECT COUNT(*) AS n FROM resource WHERE status = 'Completed' AND strftime('%Y', updated_at) = strftime('%Y','now')"
    )
    .get().n;

  const lessonsCompletedThisYear = db
    .prepare(
      "SELECT COUNT(*) AS n FROM lesson WHERE completed = 1 AND strftime('%Y', COALESCE(completed_date, updated_at)) = strftime('%Y','now')"
    )
    .get().n;

  const actionItemsDoneThisYear = db
    .prepare(
      "SELECT COUNT(*) AS n FROM action_item WHERE status = 'Done' AND strftime('%Y', updated_at) = strftime('%Y','now')"
    )
    .get().n;

  const hoursFromLessons = db
    .prepare(
      "SELECT COALESCE(SUM(hours_logged), 0) AS n FROM lesson WHERE strftime('%Y', updated_at) = strftime('%Y','now')"
    )
    .get().n;

  const hoursFromActions = db
    .prepare(
      "SELECT COALESCE(SUM(hours_logged), 0) AS n FROM action_item WHERE strftime('%Y', updated_at) = strftime('%Y','now')"
    )
    .get().n;

  return {
    activeCurriculum: activeCurriculum || fallbackCurriculum || null,
    progress: {
      curriculumsCompletedThisYear,
      booksCompletedThisYear,
      resourcesCompletedThisYear,
      lessonsCompletedThisYear,
      actionItemsDoneThisYear,
      hoursLoggedThisYear: Math.round((hoursFromLessons + hoursFromActions) * 10) / 10,
    },
  };
}

module.exports = { getDashboardData };
