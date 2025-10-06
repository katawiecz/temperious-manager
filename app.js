/* =============================================================================
   app.js — UI logic for Temperious Manager
   - Renders locations as a table (desktop) and as cards (mobile)
   - Tracks local (unsaved) changes and shows a sticky “Save to Repo” bar
   - Persists to / reloads from a backend endpoint: /api/locations
   ========================================================================== */
'use strict';

/** ---------------------------------------------------------------------------
 * Application state
 * rows:       Array<{ name: string, lat: number, lon: number, threshold: number, daysAhead: number }>
 * editIndex:  Index of the row being edited (null when adding a new one)
 * dirty:      Flag indicating unsaved local changes
 * -------------------------------------------------------------------------- */

const MAX_FORECAST_DAYS = 5;

const state = {
  rows: [],
  editIndex: null,
  dirty: false,
};

/* Lightweight DOM helpers (lazy lookups keep code terse & readable) */
const cardsEl = () => document.querySelector('#locCards');
const saveBar = () => document.querySelector('#saveBar');

const el  = (sel) => document.querySelector(sel);

const tableBody = () => el('#locTable tbody');
const statusEl  = () => el('#status');




/**
 * Update the inline status label.
 * @param {string} msg - Short status text displayed to the user
 * @param {'info'|'error'|'success'} [kind='info'] - Reserved for future styling
 */
function setStatus(msg, kind = 'info') {
  const s = statusEl();
  if (s) s.textContent = msg;
}

/* ============================================================================
   Rendering
   - Table rows (desktop)
   - Mobile cards (shown under 900px)
   ========================================================================== */

/**
 * Render a single row for the desktop table view.
 */
function rowToHtml(item, idx){
  return `<tr>
    <td>${escapeHtml(item.name)}</td>
    <td>${item.lat}</td>
    <td>${item.lon}</td>
    <td>${item.threshold}</td>
    <td>${item.daysAhead}</td>
    <td>
      <span class="actionlink" data-act="edit" data-idx="${idx}">Edit</span>
      &nbsp;·&nbsp;
      <span class="actionlink" data-act="del" data-idx="${idx}">Delete</span>
    </td>
  </tr>`;
}


/**
 * Render a single card for the mobile view.
 */
function rowToCardHtml(item, idx){
  return `
  <article class="loc-card">
    <div class="loc-head">
      <h3 class="loc-name">${escapeHtml(item.name)}</h3>
      <span class="badge">${item.threshold}°C</span>
    </div>
    <p class="coords">${item.lat}, ${item.lon}</p>
    <div class="loc-actions">
      <span class="actionlink" data-act="edit" data-idx="${idx}">Edit</span>
      &nbsp;·&nbsp;
      <span class="actionlink danger" data-act="del" data-idx="${idx}">Delete</span>
      <span class="badge">D+${item.daysAhead}</span>
    </div>
  </article>`;
}


/**
 * Render both views (table + cards). CSS decides which is visible.
 */
function render() {
  tableBody().innerHTML = state.rows.map(rowToHtml).join('');
  if (cardsEl()) cardsEl().innerHTML = state.rows.map(rowToCardHtml).join('');
}



/* ============================================================================
   Utilities
   ========================================================================== */

/**
 * Escape unsafe characters for safe HTML injection.
 * NOTE: Keep this tiny mapping in sync if you expand characters.
 */
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    '\'': '&#39;',
  }[c]));
}

/* ============================================================================
   Data I/O
   - Reload from repo (GET /api/locations)
   - Save to repo   (PUT /api/locations)
   ========================================================================== */

/**
 * Load latest data from repository.
 * If there are unsaved changes, ask for confirmation before discarding.
 */
async function reloadFromRepo() {
  if (state.dirty && !confirm('Discard local unsaved changes and reload from repo?')) return;

  setStatus('Loading…');
  const res = await fetch('/api/locations');
  if (!res.ok) { setStatus('Failed to load (see console)'); console.error(await res.text()); return; }

  const data = await res.json();
  if (!Array.isArray(data)) { setStatus('Invalid data from API'); return; }

  state.rows = data.map(d => ({ ...d, daysAhead: Number.isInteger(d?.daysAhead) ? d.daysAhead : 5 }));
  state.editIndex = null;
  render();
  clearDirty();
  setStatus(`Loaded ${state.rows.length} location(s)`);
}


/**
 * Mark local state as having unsaved changes.
 * Shows the sticky "Save to Repo" bar on mobile/desktop.
 */
function markDirty() {
  state.dirty = true;
  if (saveBar()) saveBar().hidden = false;
}

/**
 * Clear the unsaved-changes flag and hide the sticky bar.
 */
function clearDirty() {
  state.dirty = false;
  if (saveBar()) saveBar().hidden = true;
}

/**
 * Persist current rows to repository (PUT).
 * On success: clear dirty flag and show commit short SHA (if provided).
 */
async function saveToRepo() {
  setStatus('Saving…');
  const res = await fetch('/api/locations', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(state.rows),
  });

  if (!res.ok) {
    setStatus('Save failed (see console)');
    console.error(await res.text());
    return;
  }

  const out = await res.json();
  setStatus(`Saved ✓ commit: ${out?.commit?.sha?.slice(0, 7) || 'ok'}`);
  clearDirty();
}

/* ============================================================================
   Form handling
   ========================================================================== */

/**
 * Validate and normalize form inputs.
 * @throws Error with a user-friendly message when invalid.
 */
function validate(form) {
  const name = form.querySelector('#name').value.trim();
  const lat = Number(form.querySelector('#lat').value);
  const lon = Number(form.querySelector('#lon').value);
  const threshold = Number(form.querySelector('#threshold').value);
  const daysAhead = Number(form.querySelector('#daysAhead').value);

if(name.length < 2) throw new Error('Name must be at least 2 chars');
  if(!Number.isFinite(lat) || lat < -90 || lat > 90) throw new Error('Latitude must be between -90 and 90');
  if(!Number.isFinite(lon) || lon < -180 || lon > 180) throw new Error('Longitude must be between -180 and 180');
  if(!Number.isFinite(threshold)) throw new Error('Threshold must be a number');
  if(!Number.isInteger(daysAhead) || daysAhead < 1 || daysAhead > MAX_FORECAST_DAYS)
    throw new Error(`Forecast days must be 1–${MAX_FORECAST_DAYS}`);

  return { name, lat, lon, threshold, daysAhead };
}

/**
 * Fill the form with an existing item (Edit) or clear it (Add).
 */
function fillForm(item) {
  el('#name').value = item?.name || '';
  el('#lat').value = item?.lat ?? '';
  el('#lon').value = item?.lon ?? '';
  el('#threshold').value = item?.threshold ?? '';
  el('#daysAhead').value = item?.daysAhead ?? 5;
}

/**
 * Handle unified action clicks from both views (table + cards).
 * Supported actions: Edit, Delete.
 */
function onActionsClick(e) {
  const a = e.target.closest('.actionlink');
  if (!a) return;

  const idx = Number(a.dataset.idx);

  if (a.dataset.act === 'edit') {
    state.editIndex = idx;
    el('#formTitle').textContent = 'Edit Location';
    fillForm(state.rows[idx]);
    el('#name').focus();
  } else if (a.dataset.act === 'del') {
    state.rows.splice(idx, 1);
    render();
    setStatus('Deleted. Remember to Save to Repo.');
    markDirty();
  }
}

/**
 * Handle Add/Update submit.
 * - Adds a new row when editIndex is null
 * - Overwrites the row at editIndex otherwise
 */
function onFormSubmit(e) {
  e.preventDefault();

  try {
    const obj = validate(e.target);

    if (state.editIndex == null) {
      state.rows.push(obj);
      setStatus('Added. Remember to Save to Repo.');
    } else {
      state.rows[state.editIndex] = obj;
      state.editIndex = null;
      el('#formTitle').textContent = 'Add Location';
      setStatus('Updated. Remember to Save to Repo.');
    }

    markDirty();
    render();
    e.target.reset();
  } catch (err) {
    alert(err.message);
  }
}

/**
 * Reset the form and exit Edit mode.
 */
function onCancel() {
  state.editIndex = null;
  el('#formTitle').textContent = 'Add Location';
  el('#locForm').reset();
}

/* ============================================================================
   Bootstrapping / Event wiring
   - Bind both toolbars (desktop + sticky mobile) to the same handlers
   ========================================================================== */
window.addEventListener('DOMContentLoaded', () => {
  // Reload (topbar icon + desktop toolbar)
  ['#btnReload', '#btn-reload'].forEach((sel) => {
    const b = document.querySelector(sel);
    if (b) b.addEventListener('click', reloadFromRepo);
  });

  // Save to Repo (desktop toolbar + sticky bottom bar)
  ['#btnSaveRepo', '#btnSaveRepoBottom'].forEach((sel) => {
    const b = document.querySelector(sel);
    if (b) b.addEventListener('click', saveToRepo);
  });

  // Unified action handler for both views
  el('#locTable').addEventListener('click', onActionsClick);
  cardsEl()?.addEventListener('click', onActionsClick);

  // Form handlers
  el('#locForm').addEventListener('submit', onFormSubmit);
  el('#btnCancel').addEventListener('click', onCancel);

  // Initial load from repo
  reloadFromRepo();
});
