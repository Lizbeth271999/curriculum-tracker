'use strict';
/**
 * Personal Curriculum Tracker - server
 * Only external dependency: `pg` (Postgres driver), since a free host needs
 * real persistent storage rather than a local SQLite file. Run with:
 * node server.js (after `npm install`).
 */
const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');

const { pool, ready } = require('./lib/db');
const { makeCrud } = require('./lib/crud');
const { getDashboardData } = require('./lib/stats');
const { checkIn } = require('./lib/habits');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

const curricula = makeCrud(pool, 'curriculum', [
  'name', 'category', 'status', 'start_date', 'end_date', 'outcome_goal',
  'progress_percent', 'is_active', 'current_lesson', 'next_action',
]);
const resources = makeCrud(pool, 'resource', ['name', 'type', 'curriculum_id', 'priority', 'status', 'notes']);
const lessons = makeCrud(pool, 'lesson', [
  'name', 'curriculum_id', 'week_number', 'module_name', 'resource_id',
  'due_date', 'completed', 'completed_date', 'hours_logged',
]);
const actions = makeCrud(pool, 'action_item', [
  'action_item', 'curriculum_id', 'related_lesson_id', 'priority', 'due_date',
  'status', 'results', 'hours_logged',
]);
const reflections = makeCrud(pool, 'reflection', [
  'date', 'curriculum_id', 'biggest_insight', 'what_changed', 'wins', 'challenges',
  'action_steps', 'what_did_i_learn', 'how_can_i_apply', 'action_this_week', 'expected_result',
]);
const vault = makeCrud(pool, 'vault_note', ['title', 'curriculum_id', 'topic', 'key_takeaway', 'tags']);
const habits = makeCrud(pool, 'habit', ['name', 'curriculum_id', 'frequency']);

const resourceMap = { curricula, resources, lessons, actions, reflections, vault, habits };

function sendJson(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      if (chunks.length === 0) return resolve({});
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch (e) {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
};

function serveStatic(req, res, pathname) {
  let filePath = pathname === '/' ? '/index.html' : pathname;
  filePath = path.normalize(path.join(PUBLIC_DIR, filePath));
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }
  fs.readFile(filePath, (err, data) => {
    if (err) {
      const alt = `${filePath}.html`;
      fs.readFile(alt, (err2, data2) => {
        if (err2) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          return res.end('Not found');
        }
        res.writeHead(200, { 'Content-Type': MIME['.html'] });
        res.end(data2);
      });
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
}

async function handleApi(req, res, pathname, method) {
  const parts = pathname.split('/').filter(Boolean); // e.g. ['api','curricula','5','activate']
  const resourceKey = parts[1];
  const id = parts[2] ? Number(parts[2]) : null;
  const action = parts[3];

  try {
    if (resourceKey === 'dashboard' && method === 'GET') {
      return sendJson(res, 200, await getDashboardData(pool));
    }

    const crud = resourceMap[resourceKey];
    if (!crud) return sendJson(res, 404, { error: 'Unknown resource' });

    if (id && action === 'activate' && resourceKey === 'curricula' && method === 'POST') {
      await pool.query('UPDATE curriculum SET is_active = 0', []);
      await pool.query(
        "UPDATE curriculum SET is_active = 1, updated_at = to_char(now(), 'YYYY-MM-DD HH24:MI:SS') WHERE id = $1",
        [id]
      );
      return sendJson(res, 200, await crud.get(id));
    }

    if (id && action === 'checkin' && resourceKey === 'habits' && method === 'POST') {
      const body = await readBody(req);
      const updated = await checkIn(pool, id, body.date);
      return sendJson(res, 200, updated);
    }

    if (!id && method === 'GET') return sendJson(res, 200, await crud.list());
    if (!id && method === 'POST') {
      const body = await readBody(req);
      return sendJson(res, 201, await crud.create(body));
    }
    if (id && method === 'GET') {
      const row = await crud.get(id);
      if (!row) return sendJson(res, 404, { error: 'Not found' });
      return sendJson(res, 200, row);
    }
    if (id && method === 'PUT') {
      const body = await readBody(req);
      return sendJson(res, 200, await crud.update(id, body));
    }
    if (id && method === 'DELETE') {
      return sendJson(res, 200, await crud.remove(id));
    }
    return sendJson(res, 405, { error: 'Method not allowed' });
  } catch (err) {
    console.error(err);
    return sendJson(res, 500, { error: err.message });
  }
}

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);
  const pathname = decodeURIComponent(parsed.pathname);
  if (pathname.startsWith('/api/')) {
    handleApi(req, res, pathname, req.method).catch((err) => sendJson(res, 500, { error: err.message }));
  } else {
    serveStatic(req, res, pathname);
  }
});

ready()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Personal Curriculum Tracker running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to set up the database:', err.message);
    process.exit(1);
  });
