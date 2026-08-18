/* Dashboard: welcome + current curriculum + quick add + progress stats. */

let allCurricula = [];
let allResources = [];

async function loadDashboard() {
  const [dash, curricula, resources] = await Promise.all([
    api.get('/api/dashboard'),
    api.get('/api/curricula'),
    api.get('/api/resources'),
  ]);
  allCurricula = curricula;
  allResources = resources;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning, Lizzie' : hour < 17 ? 'Good afternoon, Lizzie' : 'Good evening, Lizzie';
  document.getElementById('welcome-heading').textContent = greeting;

  renderCurrentCurriculum(dash.activeCurriculum);
  renderProgress(dash.progress);
}

function renderCurrentCurriculum(c) {
  const body = document.getElementById('current-curriculum-body');
  if (!c) {
    body.innerHTML = `
      <div class="current-curriculum-empty">
        <p>No active curriculum yet. Start one to see your progress here.</p>
        <button class="btn btn-primary" id="empty-add-curriculum">+ New Curriculum</button>
      </div>`;
    document.getElementById('empty-add-curriculum').addEventListener('click', openCurriculumModal);
    return;
  }

  const switcherOptions = allCurricula
    .filter((x) => x.status !== 'Completed')
    .map((x) => `<option value="${x.id}" ${x.id === c.id ? 'selected' : ''}>${escapeHtml(x.name)}</option>`)
    .join('');

  body.innerHTML = `
    <div class="meta-row" style="margin-top:0;">
      <div>
        <strong style="font-size:19px;">${escapeHtml(c.name)}</strong>
      </div>
      ${badge(c.category, 'badge-neutral')}
      ${badge(c.status, statusBadgeClass(c.status))}
    </div>
    <div class="progress-row" style="margin: 14px 0 18px;">
      <div class="progress-track"><div class="progress-fill" style="width:${c.progress_percent || 0}%;"></div></div>
      <div class="progress-label">${c.progress_percent || 0}%</div>
    </div>
    <div class="meta-row">
      <div><strong>Current lesson</strong>${escapeHtml(c.current_lesson) || '—'}</div>
      <div><strong>Next action</strong>${escapeHtml(c.next_action) || '—'}</div>
      <div><strong>Outcome goal</strong>${escapeHtml(c.outcome_goal) || '—'}</div>
    </div>
    <div class="form-actions" style="justify-content:space-between; align-items:center; margin-top:16px;">
      <div class="field" style="min-width:220px;">
        <label>Switch current curriculum</label>
        <select id="curriculum-switcher">${switcherOptions}</select>
      </div>
      <button class="btn btn-ghost btn-sm" id="edit-current-curriculum">Update progress / lesson / next action</button>
    </div>
  `;

  document.getElementById('curriculum-switcher').addEventListener('change', async (e) => {
    await api.post(`/api/curricula/${e.target.value}/activate`);
    showToast('Current curriculum updated');
    loadDashboard();
  });

  document.getElementById('edit-current-curriculum').addEventListener('click', () => openUpdateCurrentModal(c));
}

function renderProgress(p) {
  const tiles = [
    { num: p.curriculumsCompletedThisYear, label: 'Curriculums completed' },
    { num: p.booksCompletedThisYear, label: 'Books completed' },
    { num: p.resourcesCompletedThisYear, label: 'Resources completed' },
    { num: p.lessonsCompletedThisYear, label: 'Lessons completed' },
    { num: p.actionItemsDoneThisYear, label: 'Action items implemented' },
    { num: p.hoursLoggedThisYear, label: 'Hours logged' },
  ];
  document.getElementById('progress-stats').innerHTML = tiles
    .map((t) => `<div class="stat-tile"><div class="num">${t.num}</div><div class="label">${t.label}</div></div>`)
    .join('');
}

/* ---------- Quick add modals ---------- */

function curriculumOptionsHtml(selected) {
  return optionsHtml(allCurricula, selected, 'id', 'name', true);
}

function openCurriculumModal() {
  const fields =
    field('Curriculum name', '<input name="name" required placeholder="e.g. Learn Watercolor Painting" />', true) +
    field('Category', '<input name="category" placeholder="e.g. Creative, Business, Health" />') +
    field(
      'Status',
      `<select name="status">
        <option>Not Started</option>
        <option selected>In Progress</option>
        <option>Completed</option>
        <option>Paused</option>
      </select>`
    ) +
    field('Start date', '<input type="date" name="start_date" />') +
    field('End date', '<input type="date" name="end_date" />') +
    field('Outcome goal', '<textarea name="outcome_goal" placeholder="What does done look like?"></textarea>', true) +
    field('Progress %', '<input type="number" name="progress_percent" min="0" max="100" value="0" />') +
    field(
      'Set as current curriculum',
      `<select name="is_active"><option value="1">Yes</option><option value="0">No</option></select>`
    );

  openFormModal('New Curriculum', fields, async (data) => {
    const created = await api.post('/api/curricula', {
      name: data.name,
      category: data.category,
      status: data.status,
      start_date: data.start_date,
      end_date: data.end_date,
      outcome_goal: data.outcome_goal,
      progress_percent: Number(data.progress_percent || 0),
      is_active: Number(data.is_active),
    });
    if (Number(data.is_active) === 1) {
      await api.post(`/api/curricula/${created.id}/activate`);
    }
    showToast('Curriculum added');
    loadDashboard();
  });
}

function openLessonModal() {
  const fields =
    field('Lesson name', '<input name="name" required />', true) +
    field('Curriculum', `<select name="curriculum_id">${curriculumOptionsHtml()}</select>`) +
    field('Week #', '<input type="number" name="week_number" min="1" />') +
    field('Module name', '<input name="module_name" />') +
    field('Resource used', `<select name="resource_id">${optionsHtml(allResources, '', 'id', 'name', true)}</select>`) +
    field('Due date', '<input type="date" name="due_date" />');

  openFormModal('New Lesson', fields, async (data) => {
    await api.post('/api/lessons', {
      name: data.name,
      curriculum_id: data.curriculum_id || null,
      week_number: data.week_number ? Number(data.week_number) : null,
      module_name: data.module_name,
      resource_id: data.resource_id || null,
      due_date: data.due_date,
      completed: 0,
    });
    showToast('Lesson added');
    loadDashboard();
  });
}

function openBookModal() {
  const fields =
    field('Book title', '<input name="name" required />', true) +
    field('Curriculum', `<select name="curriculum_id">${curriculumOptionsHtml()}</select>`) +
    field(
      'Priority',
      `<select name="priority"><option>High</option><option selected>Medium</option><option>Low</option></select>`
    ) +
    field(
      'Status',
      `<select name="status"><option selected>Not Started</option><option>In Progress</option><option>Completed</option></select>`
    ) +
    field('Notes', '<textarea name="notes"></textarea>', true);

  openFormModal('New Book', fields, async (data) => {
    await api.post('/api/resources', {
      name: data.name,
      type: 'Book',
      curriculum_id: data.curriculum_id || null,
      priority: data.priority,
      status: data.status,
      notes: data.notes,
    });
    showToast('Book added');
    loadDashboard();
  });
}

function openResourceModal() {
  const fields =
    field('Resource name', '<input name="name" required />', true) +
    field(
      'Type',
      `<select name="type">
        <option>Book</option><option>Course</option><option>Video</option>
        <option>Podcast</option><option>Article</option><option>Workshop</option><option>Other</option>
      </select>`
    ) +
    field('Curriculum', `<select name="curriculum_id">${curriculumOptionsHtml()}</select>`) +
    field(
      'Priority',
      `<select name="priority"><option>High</option><option selected>Medium</option><option>Low</option></select>`
    ) +
    field(
      'Status',
      `<select name="status"><option selected>Not Started</option><option>In Progress</option><option>Completed</option></select>`
    ) +
    field('Notes', '<textarea name="notes"></textarea>', true);

  openFormModal('New Resource', fields, async (data) => {
    await api.post('/api/resources', data);
    showToast('Resource added');
    loadDashboard();
  });
}

function openReflectionModal() {
  const fields =
    field('Date', `<input type="date" name="date" value="${todayIso()}" required />`) +
    field('Curriculum', `<select name="curriculum_id">${curriculumOptionsHtml()}</select>`) +
    field('What did I learn?', '<textarea name="what_did_i_learn"></textarea>', true) +
    field('What action will I take this week?', '<textarea name="action_this_week"></textarea>', true);

  openFormModal('New Reflection', fields, async (data) => {
    await api.post('/api/reflections', data);
    showToast('Reflection saved');
    loadDashboard();
  });
}

function openUpdateCurrentModal(c) {
  const fields =
    field('Progress %', `<input type="number" name="progress_percent" min="0" max="100" value="${c.progress_percent || 0}" />`) +
    field(
      'Status',
      `<select name="status">
        <option ${c.status === 'Not Started' ? 'selected' : ''}>Not Started</option>
        <option ${c.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
        <option ${c.status === 'Completed' ? 'selected' : ''}>Completed</option>
        <option ${c.status === 'Paused' ? 'selected' : ''}>Paused</option>
      </select>`
    ) +
    field('Current lesson', `<input name="current_lesson" value="${escapeHtml(c.current_lesson || '')}" />`, true) +
    field('Next action', `<input name="next_action" value="${escapeHtml(c.next_action || '')}" />`, true);

  openFormModal('Update Current Curriculum', fields, async (data) => {
    await api.put(`/api/curricula/${c.id}`, {
      progress_percent: Number(data.progress_percent || 0),
      status: data.status,
      current_lesson: data.current_lesson,
      next_action: data.next_action,
    });
    showToast('Curriculum updated');
    loadDashboard();
  });
}

document.getElementById('qa-curriculum').addEventListener('click', openCurriculumModal);
document.getElementById('qa-lesson').addEventListener('click', openLessonModal);
document.getElementById('qa-book').addEventListener('click', openBookModal);
document.getElementById('qa-resource').addEventListener('click', openResourceModal);
document.getElementById('qa-reflection').addEventListener('click', openReflectionModal);

loadDashboard().catch((err) => showToast(`Error: ${err.message}`));
