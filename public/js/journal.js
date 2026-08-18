/* Reflection Journal database. */
let reflectionRows = [];
let curriculaCache = [];

function reflectionFormFields(r) {
  r = r || {};
  return (
    field('Date', `<input type="date" name="date" required value="${r.date || todayIso()}" />`) +
    field('Curriculum', `<select name="curriculum_id">${optionsHtml(curriculaCache, r.curriculum_id, 'id', 'name', true)}</select>`) +
    field('What did I learn?', `<textarea name="what_did_i_learn">${escapeHtml(r.what_did_i_learn || '')}</textarea>`, true) +
    field('Biggest insight', `<textarea name="biggest_insight">${escapeHtml(r.biggest_insight || '')}</textarea>`, true) +
    field('How can I apply it?', `<textarea name="how_can_i_apply">${escapeHtml(r.how_can_i_apply || '')}</textarea>`, true) +
    field('What action will I take this week?', `<textarea name="action_this_week">${escapeHtml(r.action_this_week || '')}</textarea>`, true) +
    field('What result am I expecting?', `<textarea name="expected_result">${escapeHtml(r.expected_result || '')}</textarea>`, true) +
    field('What has changed since I learned this?', `<textarea name="what_changed">${escapeHtml(r.what_changed || '')}</textarea>`, true) +
    field('Wins', `<textarea name="wins">${escapeHtml(r.wins || '')}</textarea>`) +
    field('Challenges', `<textarea name="challenges">${escapeHtml(r.challenges || '')}</textarea>`) +
    field('Action steps', `<textarea name="action_steps">${escapeHtml(r.action_steps || '')}</textarea>`, true)
  );
}

function openAddModal() {
  openFormModal('New Reflection', reflectionFormFields(), async (data) => {
    await api.post('/api/reflections', data);
    showToast('Reflection saved');
    load();
  });
}

function openEditModal(r) {
  openFormModal(
    'Edit Reflection',
    reflectionFormFields(r),
    async (data) => {
      await api.put(`/api/reflections/${r.id}`, data);
      showToast('Reflection updated');
      load();
    },
    'Save changes'
  );
}

async function removeReflection(id) {
  if (!confirm('Delete this reflection entry?')) return;
  await api.del(`/api/reflections/${id}`);
  showToast('Reflection deleted');
  load();
}

function curriculumName(id) {
  const c = curriculaCache.find((x) => x.id === id);
  return c ? c.name : null;
}

function row(label, value) {
  if (!value) return '';
  return `<div style="margin-bottom:10px;"><strong style="display:block; font-size:12px; text-transform:uppercase; letter-spacing:.03em; color:var(--text-muted); margin-bottom:3px;">${label}</strong>${escapeHtml(value)}</div>`;
}

function renderEntries(rows) {
  const container = document.getElementById('entries');
  const empty = document.getElementById('empty');
  if (rows.length === 0) {
    container.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';
  container.innerHTML = rows
    .map(
      (r) => `
    <div class="card">
      <div class="meta-row" style="margin-top:0; justify-content:space-between;">
        <div class="meta-row" style="margin:0;">
          <strong style="font-size:16px;">${formatDate(r.date)}</strong>
          ${curriculumName(r.curriculum_id) ? badge(curriculumName(r.curriculum_id), 'badge-neutral') : ''}
        </div>
        <div class="cell-actions">
          <button class="btn btn-sm btn-ghost" data-edit="${r.id}">Edit</button>
          <button class="btn btn-sm btn-danger" data-del="${r.id}">Delete</button>
        </div>
      </div>
      <div class="two-col">
        <div>
          ${row('What did I learn?', r.what_did_i_learn)}
          ${row('Biggest insight', r.biggest_insight)}
          ${row('How can I apply it?', r.how_can_i_apply)}
          ${row('What changed since learning this', r.what_changed)}
        </div>
        <div>
          ${row('What action will I take this week?', r.action_this_week)}
          ${row('What result am I expecting?', r.expected_result)}
          ${row('Wins', r.wins)}
          ${row('Challenges', r.challenges)}
          ${row('Action steps', r.action_steps)}
        </div>
      </div>
    </div>`
    )
    .join('');

  container.querySelectorAll('[data-edit]').forEach((btn) =>
    btn.addEventListener('click', () => openEditModal(rows.find((r) => r.id === Number(btn.dataset.edit))))
  );
  container.querySelectorAll('[data-del]').forEach((btn) =>
    btn.addEventListener('click', () => removeReflection(Number(btn.dataset.del)))
  );
}

function applyFilter() {
  const q = document.getElementById('search').value.trim().toLowerCase();
  if (!q) return renderEntries(reflectionRows);
  renderEntries(
    reflectionRows.filter((r) =>
      [r.what_did_i_learn, r.biggest_insight, r.how_can_i_apply, r.action_this_week, r.wins, r.challenges, curriculumName(r.curriculum_id)]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(q))
    )
  );
}

async function load() {
  [reflectionRows, curriculaCache] = await Promise.all([api.get('/api/reflections'), api.get('/api/curricula')]);
  applyFilter();
}

document.getElementById('add-btn').addEventListener('click', openAddModal);
document.getElementById('search').addEventListener('input', debounce(applyFilter, 150));

load().catch((err) => showToast(`Error: ${err.message}`));
