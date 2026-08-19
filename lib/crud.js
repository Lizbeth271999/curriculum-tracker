'use strict';
/** Generic async CRUD helper factory shared by every resource route (Postgres). */
function makeCrud(pool, table, columns) {
  return {
    async list(orderBy) {
      const order = orderBy || 'id DESC';
      const { rows } = await pool.query(`SELECT * FROM ${table} ORDER BY ${order}`, []);
      return rows;
    },
    async get(id) {
      const { rows } = await pool.query(`SELECT * FROM ${table} WHERE id = $1`, [id]);
      return rows[0] || null;
    },
    async create(data) {
      const cols = columns.filter((c) => data[c] !== undefined);
      if (cols.length === 0) throw new Error('No valid fields provided');
      const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ');
      const { rows } = await pool.query(
        `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${placeholders}) RETURNING *`,
        cols.map((c) => data[c])
      );
      return rows[0];
    },
    async update(id, data) {
      const cols = columns.filter((c) => data[c] !== undefined);
      if (cols.length === 0) return this.get(id);
      const setClause = cols.map((c, i) => `${c} = $${i + 1}`).join(', ');
      const idParamIndex = cols.length + 1;
      const { rows } = await pool.query(
        `UPDATE ${table} SET ${setClause}, updated_at = to_char(now(), 'YYYY-MM-DD HH24:MI:SS') WHERE id = $${idParamIndex} RETURNING *`,
        [...cols.map((c) => data[c]), id]
      );
      return rows[0];
    },
    async remove(id) {
      await pool.query(`DELETE FROM ${table} WHERE id = $1 RETURNING id`, [id]);
      return { deleted: true };
    },
  };
}

module.exports = { makeCrud };
