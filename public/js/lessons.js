/* Lesson Planner database. */
let lessonRows = [];
let curriculaCache = [];
let resourcesCache = [];

function lessonFormFields(l) {
  l = l || {};
  return (
    field('Lesson name', `<input name="name" required value="${escapeHtml(l.name || '')}" />`, true) +
    field('Curriculum', `<select name="curriculum_id">${optionsHtml(curriculaCache, l.curriculum_id, 'id', 'name', true)}</select>`) +
    field('Week #', `<input type="number" name="week_number" min="1" value="${l.week_number ?? ''}" />`) +
    field('Module name', `<input name="module_name" value="${escapeHtml(l.module_name || '')}" />`) +
    field('Resource used', `<select name="resource_id">${optionsHtml(resourcesCache, l.resource_id, 'id', 'name', true)}</select>`) +
    field('Due date', `<input type="date" name="due_date" value="${l.due_date || ''}" />`) +
    field('Hours logged', `<input type="number" step="0.25" min="0" name="hours_logged" value="${l.hours_logged ?? 0}" />`)
  );
}

function openAddModal() {
  openFormModal('New Lesson', lessonFormFields(), async (data) => {
    await api.post('/api/lessons', {
      ...data,
      week_number: data.week_number ? Number(data.week_number) : null,
      hours_logged: Number(data.hours_logged || 0),
      completed: 0,
    });
    showToast('Lesson added');
    load();
  });
}

function openEditModal(l) {
  openFormModal(
    'Edit Lesson',
    lessonFormFields(l),
    async (data) => {
      await api.put(`/api/lessons/${l.id}`, {
        ...data,
        week_number: data.week_number ? Number(data.week_number) : null,
        hours_logged: Number(data.hours_logged || 0),
      });
      showToast('Lesson updated');
      load();
    },
    'Save changes'
  );
}

async function removeLesson(id) {
  if (!confirm('Delete this lesson?')) return;
  await api.del(`/api/lessons/${id}`);
  showToast('Lesson deleted');
  load();
}

async function toggleComplete(l, checked) {
  await api.put(`/api/lessons/${l.id}`, {
    completed: checked ? 1 : 0,
    completed_date: checked ? todayIso() : null,
  });
  load();
}

function nameOf(list, id) {
  const item = list.find((x) => x.id === id);
  return item ? item.name : '—';
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
      (l) => `
    <tr>
      <td><strong>${escapeHtml(l.name)}</strong></td>
      <td class="cell-muted">${escapeHtml(nameOf(curriculaCache, l.curriculum_id))}</td>
      <td class="cell-muted">${l.week_number ?? '—'}</td>
      <td class="cell-muted">${escapeHtml(l.module_name) || '—'}</td>
      <td class="cell-muted">${escapeHtml(nameOf(resourcesCache, l.resource_id))}</td>
      <td class="cell-muted">${formatDate(l.due_date) || '—'}</td>
      <td class="checkbox-cell"><input type="checkbox" data-toggle="${l.id}" ${l.completed ? 'checked' : ''} /></td>
      <td class="cell-actions">
        <button class="btn btn-sm btn-ghost" data-edit="${l.id}">Edit</button>
        <button class="btn btn-sm btn-danger" data-del="${l.id}">Delete</button>
      </td>
    </tr>`
    )
    .join('');

  tbody.querySelectorAll('[data-edit]').forEach((btn) =>
    btn.addEventListener('click', () => openEditModal(rows.find((r) => r.id === Number(btn.dataset.edit))))
  );
  tbody.querySelectorAll('[data-del]').forEach((btn) =>
    btn.addEventListener('click', () => removeLesson(Number(btn.dataset.del)))
  );
  tbody.querySelectorAll('[data-toggle]').forEach((cb) =>
    cb.addEventListener('change', () =>
      toggleComplete(rows.find((r) => r.id === Number(cb.dataset.toggle)), cb.checked)
    )
  );
}

function applyFilter() {
  const q = document.getElementById('search').value.trim().toLowerCase();
  if (!q) return renderRows(lessonRows);
  renderRows(
    lessonRows.filter((l) =>
      [l.name, l.module_name, nameOf(curriculaCache, l.curriculum_id)].filter(Boolean).some((v) => v.toLowerCase().includes(q))
    )
  );
}

async function load() {
  [lessonRows, curriculaCache, resourcesCache] = await Promise.all([
    api.get('/api/lessons'),
    api.get('/api/curricula'),
    api.get('/api/resources'),
  ]);
  applyFilter();
}

document.getElementById('add-btn').addEventListener('click', openAddModal);
document.getElementById('search').addEventListener('input', debounce(applyFilter, 150));

load().catch((err) => showToast(`Error: ${err.message}`));
