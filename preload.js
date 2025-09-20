const { contextBridge, ipcRenderer } = require('electron');

function computeSAW(model) {
  // Simple Additive Weighting with weights in percent and scores on 1..5
  // model = { criteria: [{name, weight}], options: [{name, scores: {critName: number}}] }
  const crits = model.criteria || [];
  const opts = model.options || [];
  const weightSum = crits.reduce((s,c)=> s + (Number(c.weight)||0), 0) || 1;
  const norm = crits.map(c => ({ name: c.name, w: (Number(c.weight)||0) / weightSum }));
  const results = opts.map(o => {
    let total = 0;
    for (const c of norm) {
      const score = Number((o.scores||{})[c.name] || 0);
      total += c.w * score;
    }
    return { name: o.name, total };
  }).sort((a,b)=> b.total - a.total);
  return { results, weights: norm };
}

contextBridge.exposeInMainWorld('hod', {
  save: (data) => ipcRenderer.invoke('storage:save', data),
  load: () => ipcRenderer.invoke('storage:load'),
  compute: (model) => computeSAW(model)
});
