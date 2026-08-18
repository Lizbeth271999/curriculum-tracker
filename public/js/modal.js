/* Generic modal + form helper used by quick-add buttons and every table's
   "add / edit" flow. */

function closeModal() {
  const el = document.getElementById('modal-overlay');
  if (el) el.remove();
  document.removeEventListener('keydown', modalEscHandler);
}

function modalEscHandler(e) {
  if (e.key === 'Escape') closeModal();
}

/**
 * Opens a modal with a form.
 * @param {string} title
 * @param {string} fieldsHtml - inner HTML for a .form-grid containing .field blocks
 * @param {(data: Record<string,string>) => Promise<any>} onSubmit
 * @param {string} submitLabel
 */
function openFormModal(title, fieldsHtml, onSubmit, submitLabel) {
  closeModal();
  const overlay = document.createElement('div');
  overlay.id = 'modal-overlay';
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h2>${title}</h2>
        <button type="button" class="modal-close" aria-label="Close">✕</button>
      </div>
      <form id="modal-form">
        <div class="form-grid">${fieldsHtml}</div>
        <div class="form-actions">
          <button type="button" class="btn btn-ghost" data-cancel>Cancel</button>
          <button type="submit" class="btn btn-primary">${submitLabel || 'Save'}</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(overlay);
  document.addEventListener('keydown', modalEscHandler);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });
  overlay.querySelector('.modal-close').addEventListener('click', closeModal);
  overlay.querySelector('[data-cancel]').addEventListener('click', closeModal);

  const form = overlay.querySelector('#modal-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const data = {};
    for (const [key, value] of formData.entries()) data[key] = value;
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving…';
    try {
      await onSubmit(data);
      closeModal();
    } catch (err) {
      alert(`Something went wrong: ${err.message}`);
      submitBtn.disabled = false;
      submitBtn.textContent = submitLabel || 'Save';
    }
  });

  const firstInput = overlay.querySelector('input, select, textarea');
  if (firstInput) firstInput.focus();
}

function field(labelText, inputHtml, span2) {
  return `<div class="field ${span2 ? 'span-2' : ''}"><label>${labelText}</label>${inputHtml}</div>`;
}
