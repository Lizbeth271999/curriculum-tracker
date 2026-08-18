/* ActionLab database: implementation tracking. */
let actionRows = [];
let curriculaCache = [];
let lessonsCache = [];

function actionFormFields(a) {
  a = a || {};
  return (
    field('Action item', `<input name="action_item" required value="${escapeHtml(a.action_item || '')}" />`, true) +
    field('Curriculum', `<select name="curriculum_id">${optionsHtml(curriculaCache, a.curriculum_id, 'id', 'name', true)}</select>`) +
    field('Related lesson', `<select name="related_lesson_id">${optionsHtml(lessonsCache, a.related_lesson_id, 'id', 'name', true)}</select>`) +
    field(
      'Priority',
      `<select name="priority">
        ${['High', 'Medium', 'Low'].map((p) => `<option ${a.priority === p ? 'selected' : ''}>${p}</option>`).join('')}
      </select>`
    ) +
    field('Due date', `<input type="date" name="due_date" value="${a.due_date || ''}" />`) +
    field(
      'Status',
      `<select name="status">
        ${['Not Started', 'In Progress', 'Done'].map((s) => `<option ${a.status === s ? 'selected' : ''}>${s}</option>`).join('')}
      </select>`
    ) +
    field('Hours logged', `<input type="number" step="0.25" min="0" name="hours_logged" value="${a.hours_logged ?? 0}" />`) +
    field('Results', `<textarea name="results" placeholder="What actually happened when you applied it?">${escapeHtml(a.results || '')}</textarea>`, true)
  );
}

function openAddModal() {
  openFormModal('New Action Item', actionFormFields(), async (data) => {
    await api.post('/api/actions', { ...data, hours_logged: Number(data.hours_logged || 0) });
    showToast('Action item added');
    load();
  });
}

function openEditModal(a) {
  openFormModal(
    'Edit Action Item',
    actionFormFields(a),
    async (data) => {
      await api.put(`/api/actions/${a.id}`, { ...data, hours_logged: Number(data.hours_logged || 0) });
      showToast('Action item updated');
      load();
    },
    'Save changes'
  );
}

async function removeAction(id) {
  if (!confirm('Delete this action item?')) return;
  await api.del(`/api/actions/${id}`);
  showToast('Action item deleted');
  load();
}

function nameOf(list, id, key) {
  const item = list.find((x) => x.id === id);
  return item ? item[key || 'name'] : '—';
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
      (a) => `
    <tr>
      <td><strong>${escapeHtml(a.action_item)}</strong></td>
      <td class="cell-muted">${escapeHtml(nameOf(curriculaCache, a.curriculum_id))}</td>
      <td class="cell-muted">${escapeHtml(nameOf(lessonsCache, a.related_lesson_id))}</td>
      <td>${badge(a.priority, priorityBadgeClass(a.priority))}</td>
      <td class="cell-muted">${formatDate(a.due_date) || '—'}</td>
      <td>${badge(a.status, statusBadgeClass(a.status))}</td>
      <td class="cell-muted">${escapeHtml(a.results) || '—'}</td>
      <td class="cell-actions">
        <button class="btn btn-sm btn-ghost" data-edit="${a.id}">Edit</button>
        <button class="btn btn-sm btn-danger" data-del="${a.id}">Delete</button>
      </td>
    </tr>`
    )
    .join('');

  tbody.querySelectorAll('[data-edit]').forEach((btn) =>
    btn.addEventListener('click', () => openEditModal(rows.find((r) => r.id === Number(btn.dataset.edit))))
  );
  tbody.querySelectorAll('[data-del]').forEach((btn) =>
    btn.addEventListener('click', () => removeAction(Number(btn.dataset.del)))
  );
}

function applyFilter() {
  const q = document.getElementById('search').value.trim().toLowerCase();
  if (!q) return renderRows(actionRows);
  renderRows(
    actionRows.filter((a) =>
      [a.action_item, a.status, a.priority, a.results, nameOf(curriculaCache, a.curriculum_id)]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(q))
    )
  );
}

async function load() {
  [actionRows, curriculaCache, lessonsCache] = await Promise.all([
    api.get('/api/actions'),
    api.get('/api/curricula'),
    api.get('/api/lessons'),
  ]);
  applyFilter();
}

document.getElementById('add-btn').addEventListener('click', openAddModal);
document.getElementById('search').addEventListener('input', debounce(applyFilter, 150));

load().catch((err) => showToast(`Error: ${err.message}`));
