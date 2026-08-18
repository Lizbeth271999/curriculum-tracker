/* Vault database: searchable second brain of notes. */
let vaultRows = [];
let curriculaCache = [];

function vaultFormFields(v) {
  v = v || {};
  return (
    field('Note title', `<input name="title" required value="${escapeHtml(v.title || '')}" />`, true) +
    field('Curriculum', `<select name="curriculum_id">${optionsHtml(curriculaCache, v.curriculum_id, 'id', 'name', true)}</select>`) +
    field('Topic', `<input name="topic" value="${escapeHtml(v.topic || '')}" />`) +
    field('Key takeaway', `<textarea name="key_takeaway">${escapeHtml(v.key_takeaway || '')}</textarea>`, true) +
    field('Tags', `<input name="tags" placeholder="comma, separated, tags" value="${escapeHtml(v.tags || '')}" />`, true)
  );
}

function openAddModal() {
  openFormModal('New Vault Note', vaultFormFields(), async (data) => {
    await api.post('/api/vault', data);
    showToast('Note saved');
    load();
  });
}

function openEditModal(v) {
  openFormModal(
    'Edit Vault Note',
    vaultFormFields(v),
    async (data) => {
      await api.put(`/api/vault/${v.id}`, data);
      showToast('Note updated');
      load();
    },
    'Save changes'
  );
}

async function removeNote(id) {
  if (!confirm('Delete this note?')) return;
  await api.del(`/api/vault/${id}`);
  showToast('Note deleted');
  load();
}

function curriculumName(id) {
  const c = curriculaCache.find((x) => x.id === id);
  return c ? c.name : null;
}

function renderGrid(rows) {
  const grid = document.getElementById('grid');
  const empty = document.getElementById('empty');
  if (rows.length === 0) {
    grid.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';
  grid.innerHTML = rows
    .map((v) => {
      const tags = (v.tags || '')
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
        .map((t) => `<span class="tag-chip">${escapeHtml(t)}</span>`)
        .join('');
      return `
      <div class="card" style="margin-top:0;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px;">
          <strong style="font-size:15px;">${escapeHtml(v.title)}</strong>
          <div class="cell-actions">
            <button class="btn btn-sm btn-ghost" data-edit="${v.id}">Edit</button>
            <button class="btn btn-sm btn-danger" data-del="${v.id}">Delete</button>
          </div>
        </div>
        <div class="cell-muted" style="margin:6px 0 10px;">
          ${curriculumName(v.curriculum_id) ? escapeHtml(curriculumName(v.curriculum_id)) + ' · ' : ''}${escapeHtml(v.topic) || ''}
        </div>
        <div style="font-size:14px; margin-bottom:10px;">${escapeHtml(v.key_takeaway) || ''}</div>
        <div>${tags}</div>
      </div>`;
    })
    .join('');

  grid.querySelectorAll('[data-edit]').forEach((btn) =>
    btn.addEventListener('click', () => openEditModal(rows.find((r) => r.id === Number(btn.dataset.edit))))
  );
  grid.querySelectorAll('[data-del]').forEach((btn) =>
    btn.addEventListener('click', () => removeNote(Number(btn.dataset.del)))
  );
}

function applyFilter() {
  const q = document.getElementById('search').value.trim().toLowerCase();
  if (!q) return renderGrid(vaultRows);
  renderGrid(
    vaultRows.filter((v) =>
      [v.title, v.topic, v.key_takeaway, v.tags, curriculumName(v.curriculum_id)]
        .filter(Boolean)
        .some((val) => val.toLowerCase().includes(q))
    )
  );
}

async function load() {
  [vaultRows, curriculaCache] = await Promise.all([api.get('/api/vault'), api.get('/api/curricula')]);
  applyFilter();
}

document.getElementById('add-btn').addEventListener('click', openAddModal);
document.getElementById('search').addEventListener('input', debounce(applyFilter, 150));

load().catch((err) => showToast(`Error: ${err.message}`));
