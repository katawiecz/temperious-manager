
/* ===========================
   app.js
=========================== */
'use strict';

const state = {
  rows: [],         // array of {name, lat, lon, threshold, notify?}
  editIndex: null,  // index being edited or null
};

const el = sel => document.querySelector(sel);
const els = sel => Array.from(document.querySelectorAll(sel));

const tableBody = () => el('#locTable tbody');
const statusEl = () => el('#status');

function setStatus(msg, kind='info'){ statusEl().textContent = msg; }

function rowToHtml(item, idx){
  const notify = item.notify || '—';
  return `<tr>
    <td>${escapeHtml(item.name)}</td>
    <td>${item.lat}</td>
    <td>${item.lon}</td>
    <td>${item.threshold}</td>
    <td><span class="badge">${escapeHtml(notify)}</span></td>
    <td>
      <span class="actionlink" data-act="edit" data-idx="${idx}">Edit</span>
      &nbsp;·&nbsp;
      <span class="actionlink" data-act="del" data-idx="${idx}">Delete</span>
    </td>
  </tr>`;
}

function render(){
  tableBody().innerHTML = state.rows.map(rowToHtml).join('');
}

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, c=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'
  }[c]));
}

async function reloadFromRepo(){
  setStatus('Loading…');
  const res = await fetch('/api/locations');
  if(!res.ok){ setStatus('Failed to load (see console)'); console.error(await res.text()); return; }
  const data = await res.json();
  if(!Array.isArray(data)) { setStatus('Invalid data from API'); return; }
  state.rows = data;
  state.editIndex = null;
  render();
  setStatus(`Loaded ${state.rows.length} location(s)`);
}

function validate(form){
  const name = form.querySelector('#name').value.trim();
  const lat = Number(form.querySelector('#lat').value);
  const lon = Number(form.querySelector('#lon').value);
  const threshold = Number(form.querySelector('#threshold').value);
  const notify = form.querySelector('#notify').value.trim();

  if(name.length < 2) throw new Error('Name must be at least 2 chars');
  if(!Number.isFinite(lat) || lat < -90 || lat > 90) throw new Error('Latitude must be between -90 and 90');
  if(!Number.isFinite(lon) || lon < -180 || lon > 180) throw new Error('Longitude must be between -180 and 180');
  if(!Number.isFinite(threshold)) throw new Error('Threshold must be a number');

  const obj = { name, lat, lon, threshold };
  if(notify) obj.notify = notify;
  return obj;
}

function fillForm(item){
  el('#name').value = item?.name || '';
  el('#lat').value = item?.lat ?? '';
  el('#lon').value = item?.lon ?? '';
  el('#threshold').value = item?.threshold ?? '';
  el('#notify').value = item?.notify || '';
}

function onTableClick(e){
  const a = e.target.closest('.actionlink');
  if(!a) return;
  const idx = Number(a.dataset.idx);
  if(a.dataset.act === 'edit'){
    state.editIndex = idx;
    el('#formTitle').textContent = 'Edit Location';
    fillForm(state.rows[idx]);
    el('#name').focus();
  } else if(a.dataset.act === 'del'){
    state.rows.splice(idx,1);
    render();
    setStatus('Deleted. Remember to Save to Repo.');
  }
}

async function saveToRepo(){
  setStatus('Saving…');
  const res = await fetch('/api/locations', {
    method: 'PUT',
    headers: { 'Content-Type':'application/json' },
    body: JSON.stringify(state.rows)
  });
  if(!res.ok){ setStatus('Save failed (see console)'); console.error(await res.text()); return; }
  const out = await res.json();
  setStatus(`Saved ✓ commit: ${out?.commit?.sha?.slice(0,7) || 'ok'}`);
}

function onFormSubmit(e){
  e.preventDefault();
  try {
    const obj = validate(e.target);
    if(state.editIndex == null){
      state.rows.push(obj);
      setStatus('Added. Remember to Save to Repo.');
    } else {
      state.rows[state.editIndex] = obj;
      state.editIndex = null;
      el('#formTitle').textContent = 'Add Location';
      setStatus('Updated. Remember to Save to Repo.');
    }
    render();
    e.target.reset();
  } catch(err){
    alert(err.message);
  }
}

function onCancel(){
  state.editIndex = null;
  el('#formTitle').textContent = 'Add Location';
  el('#locForm').reset();
}

// wire up
window.addEventListener('DOMContentLoaded', ()=>{
  el('#btnReload').addEventListener('click', reloadFromRepo);
  el('#btnSaveRepo').addEventListener('click', saveToRepo);
  el('#locTable').addEventListener('click', onTableClick);
  el('#locForm').addEventListener('submit', onFormSubmit);
  el('#btnCancel').addEventListener('click', onCancel);
  reloadFromRepo();
});
