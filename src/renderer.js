const criteriaBody = document.querySelector('#criteriaTable tbody');
const optionsBody  = document.querySelector('#optionsTable tbody');
const addCriteriaBtn = document.getElementById('addCriteria');
const addOptionBtn = document.getElementById('addOption');
const computeBtn = document.getElementById('computeBtn');
const resultsDiv = document.getElementById('results');
const saveBtn = document.getElementById('saveBtn');
const loadBtn = document.getElementById('loadBtn');
const statusDiv = document.getElementById('status');

function addCriterionRow(name='', weight=0) {
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td><input type="text" class="crit-name" placeholder="e.g., Speed" value="${name}"></td>
    <td><input type="number" class="crit-weight" min="0" max="100" step="1" value="${weight}"></td>
    <td><button class="del">Delete</button></td>`;
  tr.querySelector('.del').onclick = () => tr.remove();
  criteriaBody.appendChild(tr);
}

function currentCriteria() {
  return Array.from(criteriaBody.querySelectorAll('tr')).map(tr => ({
    name: tr.querySelector('.crit-name').value.trim(),
    weight: Number(tr.querySelector('.crit-weight').value || 0)
  })).filter(c => c.name);
}

function addOptionRow(name='') {
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td><input type="text" class="opt-name" placeholder="Option name" value="${name}"></td>
    <td class="scores"></td>
    <td><button class="del">Delete</button></td>`;
  tr.querySelector('.del').onclick = () => tr.remove();
  optionsBody.appendChild(tr);
  renderOptionScores();
}

function currentOptions() {
  return Array.from(optionsBody.querySelectorAll('tr')).map(tr => {
    const name = tr.querySelector('.opt-name').value.trim();
    const scores = {};
    Array.from(tr.querySelectorAll('.score')).forEach(inp => {
      scores[inp.dataset.crit] = Number(inp.value || 0);
    });
    return name ? { name, scores } : null;
  }).filter(Boolean);
}

function renderOptionScores() {
  const crits = currentCriteria();
  Array.from(optionsBody.querySelectorAll('tr')).forEach(tr => {
    const cell = tr.querySelector('.scores');
    cell.innerHTML = '';
    crits.forEach(c => {
      const wrap = document.createElement('div');
      wrap.innerHTML = `<label>${c.name} <input type="number" class="score" data-crit="${c.name}" min="0" max="5" step="1" value="0"></label>`;
      cell.appendChild(wrap);
    });
  });
}

function modelFromUI() {
  const model = {
    problem: document.getElementById('problem').value.trim(),
    outcomes: document.getElementById('outcomes').value.trim(),
    constraints: document.getElementById('constraints').value.trim(),
    assumptions: document.getElementById('assumptions').value.trim(),
    criteria: currentCriteria(),
    options: currentOptions()
  };
  return model;
}

function populateUI(model) {
  document.getElementById('problem').value = model.problem || '';
  document.getElementById('outcomes').value = model.outcomes || '';
  document.getElementById('constraints').value = model.constraints || '';
  document.getElementById('assumptions').value = model.assumptions || '';
  criteriaBody.innerHTML = '';
  (model.criteria || []).forEach(c => addCriterionRow(c.name, c.weight));
  optionsBody.innerHTML = '';
  (model.options || []).forEach(o => addOptionRow(o.name));
  renderOptionScores();
  // fill scores
  (model.options || []).forEach((o, i) => {
    const tr = optionsBody.querySelectorAll('tr')[i];
    if (!tr) return;
    const scoresCell = tr.querySelector('.scores');
    Array.from(scoresCell.querySelectorAll('.score')).forEach(inp => {
      const key = inp.dataset.crit;
      if (o.scores && o.scores[key] != null) inp.value = o.scores[key];
    });
  });
}

addCriteriaBtn.onclick = () => { addCriterionRow(); renderOptionScores(); };
addOptionBtn.onclick = () => addOptionRow();

computeBtn.onclick = () => {
  const model = modelFromUI();
  const res = window.hod.compute(model);
  const list = document.createElement('div');
  list.innerHTML = `<p><strong>Normalized weights</strong>:</p>`;
  res.weights.forEach(w => {
    const badge = document.createElement('span');
    badge.className = 'badge';
    badge.textContent = `${w.name}: ${(w.w*100).toFixed(1)}%`;
    list.appendChild(badge);
  });
  const table = document.createElement('table');
  table.className = 'table';
  table.innerHTML = '<thead><tr><th>Rank</th><th>Option</th><th>Total (0–5)</th></tr></thead>';
  const tb = document.createElement('tbody');
  res.results.forEach((r, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${i+1}</td><td>${r.name}</td><td>${r.total.toFixed(3)}</td>`;
    tb.appendChild(tr);
  });
  table.appendChild(tb);
  resultsDiv.innerHTML = '';
  resultsDiv.appendChild(list);
  resultsDiv.appendChild(table);
};

saveBtn.onclick = async () => {
  const model = modelFromUI();
  const out = await window.hod.save(model);
  statusDiv.textContent = out.ok ? `Saved to ${out.path}` : `Error: ${out.error}`;
};

loadBtn.onclick = async () => {
  const out = await window.hod.load();
  if (out.ok && out.data) {
    populateUI(out.data);
    statusDiv.textContent = `Loaded from ${out.path}`;
  } else if (out.ok && !out.data) {
    statusDiv.textContent = `No save found yet (${out.path})`;
  } else {
    statusDiv.textContent = `Error: ${out.error}`;
  }
};

// Seed with a small example for first run
window.addEventListener('DOMContentLoaded', () => {
  populateUI({
    problem: "Reduce build times for the analytics app",
    outcomes: "p95_build_time < 6m; release weekly",
    constraints: "$5k/mo infra cap",
    assumptions: "Remote cache persists across CI (0.6)",
    criteria: [
      { name: "Speed", weight: 40 },
      { name: "Cost", weight: 25 },
      { name: "Complexity", weight: 20 },
      { name: "Risk", weight: 15 }
    ],
    options: [
      { name: "Remote cache + Gradle", scores: { Speed: 5, Cost: 3, Complexity: 3, Risk: 3 } },
      { name: "Bazel migration",       scores: { Speed: 4, Cost: 2, Complexity: 2, Risk: 2 } },
      { name: "Parallelize CI",        scores: { Speed: 3, Cost: 4, Complexity: 4, Risk: 4 } }
    ]
  });
});
