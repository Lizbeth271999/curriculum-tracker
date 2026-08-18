/* Curriculum Library: master database of every curriculum. */
let libraryRows = [];

function curriculumFormFields(c) {
  c = c || {};
  return (
    field('Curriculum name', `<input name="name" required value="${escapeHtml(c.name || '')}" />`, true) +
    field('Category', `<input name="category" value="${escapeHtml(c.category || '')}" />`) +
    field(
      'Status',
      `<select name="status">
        ${['Not Started', 'In Progress', 'Completed', 'Paused']
          .map((s) => `<option ${c.status === s ? 'selected' : ''}>${s}</option>`)
          .join('')}
      </select>`
    ) +
    field('Start date', `<input type="date" name="start_date" value="${c.start_date || ''}" />`) +
    field('End date', `<input type="date" name="end_date" value="${c.end_date || ''}" />`) +
    field('Outcome goal', `<textarea name="outcome_goal">${escapeHtml(c.outcome_goal || '')}</textarea>`, true) +
    field('Progress %', `<input type="number" name="progress_percent" min="0" max="100" value="${c.progress_percent ?? 0}" />`) +
    field('Current lesson', `<input name="current_lesson" value="${escapeHtml(c.current_lesson || '')}" />`) +
    field('Next action', `<input name="next_action" value="${escapeHtml(c.next_action || '')}" />`, true)
  );
}

function openAddModal() {
  openFormModal('New Curriculum', curriculumFormFields(), async (data) => {
    await api.post('/api/curricula', { ...data, progress_percent: Number(data.progress_percent || 0) });
    showToast('Curriculum added');
    load();
  });
}

function openEditModal(c) {
  openFormModal(
    'Edit Curriculum',
    curriculumFormFields(c),
    async (data) => {
      await api.put(`/api/curricula/${c.id}`, { ...data, progress_percent: Number(data.progress_percent || 0) });
      showToast('Curriculum updated');
      load();
    },
    'Save changes'
  );
}

async function removeCurriculum(id) {
  if (!confirm('Delete this curriculum? Linked resources and lessons will stay but lose the link.')) return;
  await api.del(`/api/curricula/${id}`);
  showToast('Curriculum deleted');
  load();
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
      (c) => `
    <tr>
      <td><strong>${escapeHtml(c.name)}</strong>${c.is_active ? ' <span class="badge badge-complete">Current</span>' : ''}</td>
      <td class="cell-muted">${escapeHtml(c.category) || '—'}</td>
      <td>${badge(c.status, statusBadgeClass(c.status))}</td>
      <td class="cell-muted">${formatDate(c.start_date) || '—'}</td>
      <td class="cell-muted">${formatDate(c.end_date) || '—'}</td>
      <td class="cell-muted">${escapeHtml(c.outcome_goal) || '—'}</td>
      <td>
        <div class="progress-row">
          <div class="progress-track"><div class="progress-fill" style="width:${c.progress_percent || 0}%;"></div></div>
          <div class="progress-label">${c.progress_percent || 0}%</div>
        </div>
      </td>
      <td class="cell-actions">
        <button class="btn btn-sm btn-ghost" data-edit="${c.id}">Edit</button>
        <button class="btn btn-sm btn-danger" data-del="${c.id}">Delete</button>
      </td>
    </tr>`
    )
    .join('');

  tbody.querySelectorAll('[data-edit]').forEach((btn) =>
    btn.addEventListener('click', () => openEditModal(rows.find((r) => r.id === Number(btn.dataset.edit))))
  );
  tbody.querySelectorAll('[data-del]').forEach((btn) =>
    btn.addEventListener('click', () => removeCurriculum(Number(btn.dataset.del)))
  );
}

function applyFilter() {
  const q = document.getElementById('search').value.trim().toLowerCase();
  if (!q) return renderRows(libraryRows);
  renderRows(
    libraryRows.filter((c) =>
      [c.name, c.category, c.status, c.outcome_goal].filter(Boolean).some((v) => v.toLowerCase().includes(q))
    )
  );
}

async function load() {
  libraryRows = await api.get('/api/curricula');
  applyFilter();
}

document.getElementById('add-btn').addEventListener('click', openAddModal);
document.getElementById('search').addEventListener('input', debounce(applyFilter, 150));

load().catch((err) => showToast(`Error: ${err.message}`));
