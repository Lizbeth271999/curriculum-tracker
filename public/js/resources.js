/* Resources database: books, courses, videos, articles, etc. */
let resourceRows = [];
let curriculaCache = [];

function resourceFormFields(r) {
  r = r || {};
  return (
    field('Resource name', `<input name="name" required value="${escapeHtml(r.name || '')}" />`, true) +
    field(
      'Type',
      `<select name="type">
        ${['Book', 'Course', 'Video', 'Podcast', 'Article', 'Workshop', 'Other']
          .map((t) => `<option ${r.type === t ? 'selected' : ''}>${t}</option>`)
          .join('')}
      </select>`
    ) +
    field('Curriculum category', `<select name="curriculum_id">${optionsHtml(curriculaCache, r.curriculum_id, 'id', 'name', true)}</select>`) +
    field(
      'Priority',
      `<select name="priority">
        ${['High', 'Medium', 'Low'].map((p) => `<option ${r.priority === p ? 'selected' : ''}>${p}</option>`).join('')}
      </select>`
    ) +
    field(
      'Status',
      `<select name="status">
        ${['Not Started', 'In Progress', 'Completed'].map((s) => `<option ${r.status === s ? 'selected' : ''}>${s}</option>`).join('')}
      </select>`
    ) +
    field('Notes', `<textarea name="notes">${escapeHtml(r.notes || '')}</textarea>`, true)
  );
}

function openAddModal() {
  openFormModal('New Resource', resourceFormFields(), async (data) => {
    await api.post('/api/resources', data);
    showToast('Resource added');
    load();
  });
}

function openEditModal(r) {
  openFormModal(
    'Edit Resource',
    resourceFormFields(r),
    async (data) => {
      await api.put(`/api/resources/${r.id}`, data);
      showToast('Resource updated');
      load();
    },
    'Save changes'
  );
}

async function removeResource(id) {
  if (!confirm('Delete this resource?')) return;
  await api.del(`/api/resources/${id}`);
  showToast('Resource deleted');
  load();
}

function curriculumName(id) {
  const c = curriculaCache.find((x) => x.id === id);
  return c ? c.name : '—';
}

function renderRows(rows) {
  const tbody = document.getElementById('rows');
  const empty = document.getElementById('empty');
  if (rows.length === 0) {
    tbody.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';
  tbody.innerHTML = rows
    .map(
      (r) => `
    <tr>
      <td><strong>${escapeHtml(r.name)}</strong></td>
      <td>${badge(r.type, 'badge-neutral')}</td>
      <td class="cell-muted">${escapeHtml(curriculumName(r.curriculum_id))}</td>
      <td>${badge(r.priority, priorityBadgeClass(r.priority))}</td>
      <td>${badge(r.status, statusBadgeClass(r.status))}</td>
      <td class="cell-muted">${escapeHtml(r.notes) || '—'}</td>
      <td class="cell-actions">
        <button class="btn btn-sm btn-ghost" data-edit="${r.id}">Edit</button>
        <button class="btn btn-sm btn-danger" data-del="${r.id}">Delete</button>
      </td>
    </tr>`
    )
    .join('');

  tbody.querySelectorAll('[data-edit]').forEach((btn) =>
    btn.addEventListener('click', () => openEditModal(rows.find((r) => r.id === Number(btn.dataset.edit))))
  );
  tbody.querySelectorAll('[data-del]').forEach((btn) =>
    btn.addEventListener('click', () => removeResource(Number(btn.dataset.del)))
  );
}

function applyFilter() {
  const q = document.getElementById('search').value.trim().toLowerCase();
  if (!q) return renderRows(resourceRows);
  renderRows(
    resourceRows.filter((r) =>
      [r.name, r.type, r.status, r.priority, r.notes, curriculumName(r.curriculum_id)]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(q))
    )
  );
}

async function load() {
  [resourceRows, curriculaCache] = await Promise.all([api.get('/api/resources'), api.get('/api/curricula')]);
  applyFilter();
}

document.getElementById('add-btn').addEventListener('click', openAddModal);
document.getElementById('search').addEventListener('input', debounce(applyFilter, 150));

load().catch((err) => showToast(`Error: ${err.message}`));
