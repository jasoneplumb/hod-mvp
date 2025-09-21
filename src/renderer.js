const criteriaBody = document.querySelector('#criteriaTable tbody');
const optionsBody  = document.querySelector('#optionsTable tbody');
const addCriteriaBtn = document.getElementById('addCriteria');
const addOptionBtn = document.getElementById('addOption');
const computeBtn = document.getElementById('computeBtn');
const resultsDiv = document.getElementById('results');
const saveBtn = document.getElementById('saveBtn');
const loadBtn = document.getElementById('loadBtn');
const statusDiv = document.getElementById('status');
const whatIfWrap = document.getElementById('whatIfSliders');
const resetWhatIfBtn = document.getElementById('resetWhatIf');

const exportAdrBtn = document.getElementById('exportAdrBtn');
const adrStatus = document.getElementById('adrStatus');

const experimentsBody = document.querySelector('#experimentsTable tbody');
const addExperimentBtn = document.getElementById('addExperiment');

const evidenceBody = document.querySelector('#evidenceTable tbody');
const addEvidenceBtn = document.getElementById('addEvidence');

const snapshotsDiv = document.getElementById('snapshots');
const snapshotBtn = document.getElementById('snapshotBtn');

let whatIfWeights = null;

function addCriterionRow(name='', weight=0) {
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td><input type="text" class="crit-name" placeholder="e.g., Info Gain" value="${name}"></td>
    <td><input type="number" class="crit-weight" min="0" max="100" step="1" value="${weight}"></td>
    <td><button class="del">Delete</button></td>`;
  tr.querySelector('.del').onclick = () => { tr.remove(); renderOptionScores(); renderWhatIf(); };
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

// Experiments
function addExperimentRow(ex={hypothesis:'',metric:'',threshold:'',status:'Planned',result:''}) {
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td><input type="text" class="ex-hyp" placeholder="Hypothesis" value="${ex.hypothesis||''}"></td>
    <td><input type="text" class="ex-metric" placeholder="Metric" value="${ex.metric||''}"></td>
    <td><input type="text" class="ex-threshold" placeholder="Threshold" value="${ex.threshold||''}"></td>
    <td>
      <select class="ex-status">
        <option ${ex.status==='Planned'?'selected':''}>Planned</option>
        <option ${ex.status==='Running'?'selected':''}>Running</option>
        <option ${ex.status==='Done'?'selected':''}>Done</option>
      </select>
    </td>
    <td><input type="text" class="ex-result" placeholder="Result notes" value="${ex.result||''}"></td>
    <td><button class="del">Delete</button></td>
  `;
  tr.querySelector('.del').onclick = () => tr.remove();
  experimentsBody.appendChild(tr);
}

function currentExperiments() {
  return Array.from(experimentsBody.querySelectorAll('tr')).map(tr => ({
    hypothesis: tr.querySelector('.ex-hyp').value.trim(),
    metric: tr.querySelector('.ex-metric').value.trim(),
    threshold: tr.querySelector('.ex-threshold').value.trim(),
    status: tr.querySelector('.ex-status').value,
    result: tr.querySelector('.ex-result').value.trim()
  })).filter(ex => ex.hypothesis);
}

// Evidence
function addEvidenceRow(ev={title:'',url:'',supports:true,confidence:'',notes:''}) {
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td><input type="text" class="ev-title" placeholder="Title" value="${ev.title||''}"></td>
    <td><input type="text" class="ev-url" placeholder="URL or ref" value="${ev.url||''}"></td>
    <td>
      <select class="ev-supports">
        <option value="true" ${ev.supports!==false?'selected':''}>supports</option>
        <option value="false" ${ev.supports===false?'selected':''}>refutes</option>
      </select>
    </td>
    <td><input type="number" class="ev-conf" min="0" max="1" step="0.1" value="${ev.confidence ?? ''}"></td>
    <td><input type="text" class="ev-notes" placeholder="Notes" value="${ev.notes||''}"></td>
    <td><button class="del">Delete</button></td>
  `;
  tr.querySelector('.del').onclick = () => tr.remove();
  evidenceBody.appendChild(tr);
}

function currentEvidence() {
  return Array.from(evidenceBody.querySelectorAll('tr')).map(tr => ({
    title: tr.querySelector('.ev-title').value.trim(),
    url: tr.querySelector('.ev-url').value.trim(),
    supports: tr.querySelector('.ev-supports').value === 'true',
    confidence: Number(tr.querySelector('.ev-conf').value || 0),
    notes: tr.querySelector('.ev-notes').value.trim()
  })).filter(ev => ev.title);
}

// What-If
function renderWhatIf() {
  whatIfWrap.innerHTML = '';
  const crits = currentCriteria();
  if (!crits.length) return;
  const used = whatIfWeights && whatIfWeights.length === crits.length ? whatIfWeights : crits.map(c => ({ name: c.name, weight: c.weight }));
  whatIfWeights = used;
  used.forEach((c, idx) => {
    const row = document.createElement('div');
    row.className = 'slider';
    row.innerHTML = `
      <span>${c.name}</span>
      <input type="range" class="wi-range" min="0" max="100" step="1" value="${c.weight}">
      <input type="number" class="wi-num" min="0" max="100" step="1" value="${c.weight}">
    `;
    const range = row.querySelector('.wi-range');
    const num = row.querySelector('.wi-num');
    function update(val) {
      whatIfWeights[idx].weight = Number(val);
      num.value = val;
      computeAndRender(true);
    }
    range.oninput = (e) => update(e.target.value);
    num.oninput = (e) => { range.value = e.target.value; update(e.target.value); };
    whatIfWrap.appendChild(row);
  });
}

resetWhatIfBtn.onclick = () => { whatIfWeights = null; renderWhatIf(); computeAndRender(false); };

// Model
let currentSnapshots = [];
function modelFromUI() {
  const model = {
    problem: document.getElementById('problem').value.trim(),
    outcomes: document.getElementById('outcomes').value.trim(),
    constraints: document.getElementById('constraints').value.trim(),
    assumptions: document.getElementById('assumptions').value.trim(),
    criteria: currentCriteria(),
    options: currentOptions(),
    experiments: currentExperiments(),
    evidence: currentEvidence(),
    snapshots: currentSnapshots
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
  (model.options || []).forEach((o, i) => {
    const tr = optionsBody.querySelectorAll('tr')[i];
    if (!tr) return;
    Array.from(tr.querySelectorAll('.score')).forEach(inp => {
      const key = inp.dataset.crit;
      if (o.scores && o.scores[key] != null) inp.value = o.scores[key];
    });
  });
  experimentsBody.innerHTML = '';
  (model.experiments || []).forEach(addExperimentRow);
  evidenceBody.innerHTML = '';
  (model.evidence || []).forEach(addEvidenceRow);
  currentSnapshots = model.snapshots || [];
  renderSnapshots();
  whatIfWeights = null;
  renderWhatIf();
}

// Compute & Results
let lastComputeOut = { results: [], weights: [] };
function computeAndRender(usingWhatIf=false) {
  const model = modelFromUI();
  const override = usingWhatIf && whatIfWeights ? whatIfWeights : null;
  const res = window.hod.compute(model, override);
  const list = document.createElement('div');
  list.innerHTML = `<p><strong>${override ? 'What‑If' : 'Normalized'} weights</strong>:</p>`;
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
  lastComputeOut = res;
}

computeBtn.onclick = () => computeAndRender(Boolean(whatIfWeights));

// Persistence
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

// ADR Export
function renderADRMarkdown(model, computeOut) {
  const weightsLines = (computeOut.weights||[]).map(w => `- ${w.name}: ${(w.w*100).toFixed(1)}%`).join('\n');
  const resultsLines = (computeOut.results||[]).map((r,i)=> `${i+1}. **${r.name}** — ${r.total.toFixed(3)}`).join('\n');
  const evLines = (model.evidence||[]).map(ev => `- [${ev.supports ? 'supports' : 'refutes'}] ${ev.title} (${ev.confidence ?? '?'}) — ${ev.url || ''}`).join('\n');
  const exLines = (model.experiments||[]).map(ex => `- **${ex.hypothesis}** → metric: ${ex.metric} threshold: ${ex.threshold} status: ${ex.status || 'Planned'}`).join('\n');
  return [
    `# Architecture Decision Record — ${new Date().toISOString().slice(0,10)}`,
    ``,
    `**Context / Problem**: ${model.problem || ''}`,
    ``,
    `**Outcomes (targets)**: ${model.outcomes || ''}`,
    `**Constraints**: ${model.constraints || ''}`,
    ``,
    `## Criteria & Weights`,
    weightsLines,
    ``,
    `## Options Ranked (SAW 0–5)`,
    resultsLines,
    ``,
    model.assumptions?.trim() ? '## Assumptions\n' + model.assumptions + '\n' : '',
    (model.evidence||[]).length ? '## Evidence\n' + evLines + '\n' : '',
    (model.experiments||[]).length ? '## Experiments\n' + exLines + '\n' : '',
    `## Trade-offs & Decision`,
    model.rationale || '_Add rationale & trade-offs here._',
    ``
  ].join('\n');
}

exportAdrBtn.onclick = async () => {
  const model = modelFromUI();
  if (!lastComputeOut.results.length) {
    lastComputeOut = window.hod.compute(model);
  }
  const md = renderADRMarkdown(model, lastComputeOut);
  const out = await window.hod.exportADR(md);
  adrStatus.textContent = out.ok ? `ADR saved to ${out.path}` : `Error: ${out.error}`;
};

// Snapshots + Diff
function createSnapshot() {
  const model = modelFromUI();
  const computeOut = window.hod.compute(model, whatIfWeights || null);
  const snap = {
    ts: new Date().toISOString(),
    model: JSON.parse(JSON.stringify(model)),
    results: computeOut
  };
  currentSnapshots.push(snap);
  renderSnapshots();
}

function renderSnapshots() {
  snapshotsDiv.innerHTML = '<h3>Snapshots</h3>';
  if (!currentSnapshots.length) {
    snapshotsDiv.innerHTML += '<p class="hint">No snapshots yet.</p>';
    return;
  }
  const list = document.createElement('ul');
  currentSnapshots.forEach((s, idx) => {
    const li = document.createElement('li');
    li.innerHTML = `<strong>${idx+1}</strong> — ${s.ts}`;
    list.appendChild(li);
  });
  snapshotsDiv.appendChild(list);

  if (currentSnapshots.length >= 2) {
    const a = currentSnapshots[currentSnapshots.length - 2];
    const b = currentSnapshots[currentSnapshots.length - 1];
    const diffText = diffSnapshots(a, b);
    const pre = document.createElement('div');
    pre.className = 'diff';
    pre.textContent = diffText;
    snapshotsDiv.appendChild(pre);
  }
}

function diffSnapshots(a, b) {
  function weightsMap(snap) {
    const comps = snap.results.weights || window.hod.normalizeWeights(snap.model.criteria);
    const m = {}; comps.forEach(w => m[w.name] = w.w); return m;
  }
  function rankMap(snap) {
    const m = {}; (snap.results.results||[]).forEach((r,i)=> m[r.name]=i+1); return m;
  }
  const wa = weightsMap(a), wb = weightsMap(b);
  const ka = Object.keys(wa), kb = Object.keys(wb);
  const allCrit = Array.from(new Set([...ka, ...kb]));
  const lines = [];
  lines.push('— Weights change —');
  allCrit.forEach(k => {
    const va = (wa[k]||0)*100, vb = (wb[k]||0)*100;
    if (Math.abs(va - vb) > 0.01) lines.push(`${k}: ${va.toFixed(1)}% → ${vb.toFixed(1)}%`);
  });
  lines.push('\n— Rank change —');
  const ra = rankMap(a), rb = rankMap(b);
  const allOpts = Array.from(new Set([...Object.keys(ra), ...Object.keys(rb)]));
  allOpts.forEach(o => {
    const pa = ra[o] || '-', pb = rb[o] || '-';
    if (pa !== pb) lines.push(`${o}: #${pa} → #${pb}`);
  });
  if (lines.length <= 2) return 'No significant changes.';
  return lines.join('\n');
}

snapshotBtn.onclick = createSnapshot;

// Buttons & Seed
addCriteriaBtn.onclick = () => { addCriterionRow(); renderOptionScores(); renderWhatIf(); };
addOptionBtn.onclick = () => addOptionRow();
addExperimentBtn.onclick = () => addExperimentRow();
addEvidenceBtn.onclick = () => addEvidenceRow();

window.addEventListener('DOMContentLoaded', () => {
  populateUI({
    problem: "Prioritize Q4 features for HOD MVP",
    outcomes: "Maximize validated learning (decisions made faster, clearer)",
    constraints: "JavaScript only; local-first; small scope",
    assumptions: "Teams will adopt a lightweight ADR if exported in 2 clicks (0.6)",
    criteria: [
      { name: "Info Gain", weight: 30 },
      { name: "Speed to Insight", weight: 20 },
      { name: "Risk Coverage", weight: 20 },
      { name: "Feasibility", weight: 15 },
      { name: "Signal Quality", weight: 15 }
    ],
    options: [
      { name: "ADR One-Pager Export",       scores: { "Info Gain": 4, "Speed to Insight": 5, "Risk Coverage": 3, "Feasibility": 5, "Signal Quality": 4 } },
      { name: "What-If Weight Slider",      scores: { "Info Gain": 4, "Speed to Insight": 4, "Risk Coverage": 4, "Feasibility": 4, "Signal Quality": 4 } },
      { name: "Experiments Board",          scores: { "Info Gain": 5, "Speed to Insight": 3, "Risk Coverage": 4, "Feasibility": 3, "Signal Quality": 4 } },
      { name: "Evidence Attachments",       scores: { "Info Gain": 4, "Speed to Insight": 3, "Risk Coverage": 4, "Feasibility": 3, "Signal Quality": 5 } },
      { name: "Comparison Snapshots + Diff",scores: { "Info Gain": 3, "Speed to Insight": 3, "Risk Coverage": 4, "Feasibility": 4, "Signal Quality": 3 } }
    ],
    experiments: [
      { hypothesis: "What-if slider reduces debate time by focusing on weights", metric: "decision_time_minutes", threshold: "≤ 30", status: "Planned", result: "" }
    ],
    evidence: [
      { title: "Team review feedback", url: "", supports: true, confidence: 0.7, notes: "People want a 1‑pager." }
    ],
    snapshots: []
  });
  computeAndRender(false);
  renderWhatIf();
});
