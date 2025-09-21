const { contextBridge, ipcRenderer } = require('electron');

function normalizeWeights(criteria) {
  const sum = (criteria || []).reduce((s,c)=> s + (Number(c.weight)||0), 0) || 1;
  return (criteria || []).map(c => ({ name: c.name, w: (Number(c.weight)||0) / sum }));
}

function computeSAW(model, weightsOverride) {
  const crits = model.criteria || [];
  const opts = model.options || [];
  const norm = normalizeWeights(weightsOverride || crits);
  const results = (opts || []).map(o => {
    let total = 0;
    for (const c of norm) {
      const score = Number(((o.scores||{})[c.name]) || 0);
      total += c.w * score;
    }
    return { name: o.name, total };
  }).sort((a,b)=> b.total - a.total);
  return { results, weights: norm };
}

contextBridge.exposeInMainWorld('hod', {
  save: (data) => ipcRenderer.invoke('storage:save', data),
  load: () => ipcRenderer.invoke('storage:load'),
  compute: (model, weightsOverride) => computeSAW(model, weightsOverride),
  exportADR: (markdown) => ipcRenderer.invoke('export:adr', { markdown }),
  normalizeWeights
});
