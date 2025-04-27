document.addEventListener('DOMContentLoaded', async () => {
  await Promise.all([
    fillSelectFrom('/api/options/developers',      'developerSelect',           true),
    fillSelectFrom('/api/options/areas',           'areaNameSelect'),
    fillSelectFrom('/api/options/masterProjects',  'masterProjectNameSelect'),  // ★ added
    fillSelectFrom('/api/options/projects',        'projectNameSelect'),
    fillSelectFrom('/api/options/management',      'managementCompanyNameSelect'),
    fillSelectFrom('/api/options/floors',          'floorsFilter')
  ]);

  toggleSelect();
  document.querySelectorAll('input[name="searchType"]')
          .forEach(r => r.addEventListener('change', toggleSelect));

  document.getElementById('searchBtn').addEventListener('click', loadResults);
});

function toggleSelect() {
  document.querySelectorAll('.search-select').forEach(s => s.classList.add('hidden'));
  const key = document.querySelector('input[name="searchType"]:checked').value;
  document.getElementById(key + 'Select').classList.remove('hidden');
}

async function fillSelectFrom(url, selectId, allowNone = false) {
  const data = await fetch(url).then(r => r.json());
  const sel  = document.getElementById(selectId);
  if (allowNone) {
    const opt = document.createElement('option');
    opt.value = ''; opt.textContent = '-- Any Developer --';
    sel.appendChild(opt);
  }
  data.forEach(x => {
    const opt = document.createElement('option');
    opt.value = x; opt.textContent = x;
    sel.appendChild(opt);
  });
}

async function loadResults() {
  const qs   = new URLSearchParams();
  const radio = document.querySelector('input[name="searchType"]:checked');
  if (radio) {
    const key = radio.value;                               // already lower-case
    const val = document.getElementById(key + 'Select').value;
    if (val) qs.append(key, val);
  }

  const minFloors = document.getElementById('floorsFilter').value;
  const regOnly   = document.getElementById('registeredFilter').value;
  if (minFloors) qs.append('minFloors', minFloors);
  if (regOnly === '1') qs.append('registeredOnly', 'true');

  const rows = await fetch('/api/projects?' + qs.toString()).then(r => r.json());
  renderTable(rows);

  document.getElementById('rowCount').textContent = `${rows.length} result${rows.length !== 1 ? 's' : ''}`;
  document.getElementById('rowCounter').classList.remove('hidden');

  document.getElementById('advancedFilters').classList.remove('hidden');
  document.getElementById('resultsSection').classList.remove('hidden');
}

function renderTable(rows) {
  const tbody = document.querySelector('#resultsTable tbody');
  tbody.innerHTML = '';
  rows.forEach(r => {
    const tr = document.createElement('tr');
    [
      r.areaName,
      r.masterProjectName || '',
      r.projectName,
      r.numberOfFloors,
      r.numberOfFlats,
      r.isRegistered ? 'Yes' : 'No',
      r.creationDate,
      r.developer,                       // lower-case to match API
      r.managementCompanyName || ''
    ].forEach(text => {
      const td = document.createElement('td');
      td.textContent = text;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
}
