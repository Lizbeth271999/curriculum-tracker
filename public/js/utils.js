/* Shared small helpers used across every page. */

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDate(value) {
  if (!value) return '';
  // Accept both plain YYYY-MM-DD and full timestamps.
  const datePart = String(value).slice(0, 10);
  const [y, m, d] = datePart.split('-').map(Number);
  if (!y || !m || !d) return value;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

function todayIso() {
  const d = new Date();
  const tzOffset = d.getTimezoneOffset() * 60000;
  return new Date(d - tzOffset).toISOString().slice(0, 10);
}

function statusBadgeClass(status) {
  const s = (status || '').toLowerCase();
  if (s.includes('complete') || s === 'done') return 'badge-complete';
  if (s.includes('progress')) return 'badge-progress';
  if (s.includes('pause') || s.includes('stuck') || s.includes('blocked')) return 'badge-paused';
  return 'badge-neutral';
}

function priorityBadgeClass(priority) {
  const p = (priority || '').toLowerCase();
  if (p === 'high') return 'badge-high';
  if (p === 'low') return 'badge-low';
  return 'badge-medium';
}

function badge(text, cls) {
  if (!text) return '<span class="badge badge-neutral">-</span>';
  return `<span class="badge ${cls}">${escapeHtml(text)}</span>`;
}

function showToast(message) {
  let toast = document.getElementById('app-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'app-toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 2400);
}

function debounce(fn, wait) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

function optionsHtml(list, selected, valueKey, labelKey, includeEmpty) {
  let html = includeEmpty ? '<option value="">-</option>' : '';
  for (const item of list) {
    const val = valueKey ? item[valueKey] : item;
    const label = labelKey ? item[labelKey] : item;
    const sel = String(val) === String(selected) ? 'selected' : '';
    html += `<option value="${escapeHtml(val)}" ${sel}>${escapeHtml(label)}</option>`;
  }
  return html;
}
