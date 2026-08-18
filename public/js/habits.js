/* Habit Integration Tracker database. */
let habitRows = [];
let curriculaCache = [];

function habitFormFields(h) {
  h = h || {};
  return (
    field('Habit', `<input name="name" required value="${escapeHtml(h.name || '')}" placeholder="e.g. 20 min reading before bed" />`, true) +
    field('Curriculum', `<select name="curriculum_id">${optionsHtml(curriculaCache, h.curriculum_id, 'id', 'name', true)}</select>`) +
    field(
      'Frequency',
      `<select name="frequency">
        ${['Daily', 'Weekly'].map((f) => `<option ${h.frequency === f ? 'selected' : ''}>${f}</option>`).join('')}
      </select>`
    )
  );
}

function openAddModal() {
  openFormModal('New Habit', habitFormFields(), async (data) => {
    await api.post('/api/habits', data);
    showToast('Habit added');
    load();
  });
}

function openEditModal(h) {
  openFormModal(
    'Edit Habit',
    habitFormFields(h),
    async (data) => {
      await api.put(`/api/habits/${h.id}`, data);
      showToast('Habit updated');
      load();
    },
    'Save changes'
  );
}

async function removeHabit(id) {
  if (!confirm('Delete this habit? Its check-in history will be lost.')) return;
  await api.del(`/api/habits/${id}`);
  showToast('Habit deleted');
  load();
}

async function checkIn(id) {
  await api.post(`/api/habits/${id}/checkin`, {});
  showToast('Nice, marked done for today');
  load();
}

function curriculumName(id) {
  const c = curriculaCache.find((x) => x.id === id);
  return c ? c.name : '—';
}

function successRate(h) {
  if (!h.total_possible) return 0;
  return Math.min(100, Math.round((h.total_checks / h.total_possible) * 100));
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
    .map((h) => {
      const rate = successRate(h);
      const doneToday = h.last_checked_date === todayIso();
      return `
    <tr>
      <td><strong>${escapeHtml(h.name)}</strong></td>
      <td class="cell-muted">${escapeHtml(curriculumName(h.curriculum_id))}</td>
      <td>${badge(h.frequency, 'badge-neutral')}</td>
      <td>🔥 ${h.current_streak || 0}</td>
      <td>
        <div class="progress-row">
          <div class="progress-track"><div class="progress-fill" style="width:${rate}%;"></div></div>
          <div class="progress-label">${rate}%</div>
        </div>
      </td>
      <td class="cell-actions">
        <button class="btn btn-sm ${doneToday ? 'btn-ghost' : 'btn-primary'}" data-checkin="${h.id}" ${doneToday ? 'disabled' : ''}>
          ${doneToday ? 'Done today' : 'Check in'}
        </button>
        <button class="btn btn-sm btn-ghost" data-edit="${h.id}">Edit</button>
        <button class="btn btn-sm btn-danger" data-del="${h.id}">Delete</button>
      </td>
    </tr>`;
    })
    .join('');

  tbody.querySelectorAll('[data-edit]').forEach((btn) =>
    btn.addEventListener('click', () => openEditModal(rows.find((r) => r.id === Number(btn.dataset.edit))))
  );
  tbody.querySelectorAll('[data-del]').forEach((btn) =>
    btn.addEventListener('click', () => removeHabit(Number(btn.dataset.del)))
  );
  tbody.querySelectorAll('[data-checkin]').forEach((btn) =>
    btn.addEventListener('click', () => checkIn(Number(btn.dataset.checkin)))
  );
}

function applyFilter() {
  const q = document.getElementById('search').value.trim().toLowerCase();
  if (!q) return renderRows(habitRows);
  renderRows(
    habitRows.filter((h) =>
      [h.name, h.frequency, curriculumName(h.curriculum_id)].filter(Boolean).some((v) => v.toLowerCase().includes(q))
    )
  );
}

async function load() {
  [habitRows, curriculaCache] = await Promise.all([api.get('/api/habits'), api.get('/api/curricula')]);
  applyFilter();
}

document.getElementById('add-btn').addEventListener('click', openAddModal);
document.getElementById('search').addEventListener('input', debounce(applyFilter, 150));

load().catch((err) => showToast(`Error: ${err.message}`));
