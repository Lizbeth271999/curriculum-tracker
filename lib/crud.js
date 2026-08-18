'use strict';
/** Generic CRUD helper factory shared by every resource route. */
function makeCrud(db, table, columns) {
  return {
    list(orderBy) {
      const order = orderBy || 'id DESC';
      return db.prepare(`SELECT * FROM ${table} ORDER BY ${order}`).all();
    },
    get(id) {
      return db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id);
    },
    create(data) {
      const cols = columns.filter((c) => data[c] !== undefined);
      if (cols.length === 0) throw new Error('No valid fields provided');
      const placeholders = cols.map(() => '?').join(', ');
      const stmt = db.prepare(`INSERT INTO ${table} (${cols.join(', ')}) VALUES (${placeholders})`);
      const info = stmt.run(...cols.map((c) => data[c]));
      return this.get(Number(info.lastInsertRowid));
    },
    update(id, data) {
      const cols = columns.filter((c) => data[c] !== undefined);
      if (cols.length === 0) return this.get(id);
      const setClause = cols.map((c) => `${c} = ?`).join(', ');
      db.prepare(`UPDATE ${table} SET ${setClause}, updated_at = datetime('now') WHERE id = ?`).run(
        ...cols.map((c) => data[c]),
        id
      );
      return this.get(id);
    },
    remove(id) {
      db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(id);
      return { deleted: true };
    },
  };
}

module.exports = { makeCrud };
