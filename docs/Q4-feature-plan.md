# Q4 Feature Plan (Selected): 2, 3, 5, 6, 8

## Features
2) **ADR One-Pager Export (Markdown)**
3) **What-If Weight Slider (Live Recalc)**
5) **Experiments Board**
6) **Evidence Attachments (supports/refutes + confidence)**
8) **Comparison Snapshots + Diff**

## Acceptance Criteria
- ADR export produces a Markdown file with Context, Outcomes, Constraints, Criteria & Weights, Ranked Options, Assumptions, Evidence, Experiments, Trade-offs.
- What-If sliders change weights and recompute within 100ms on typical hardware.
- Experiments board supports CRUD; fields: hypothesis, metric, threshold, status, result.
- Evidence supports/refutes, confidence 0–1, URL/ref, notes.
- Snapshots save model + compute results; Diff shows weight and rank changes between latest two snapshots.

## Data Model Additions
```json
{
  "experiments": [{"hypothesis":"","metric":"","threshold":"","status":"Planned|Running|Done","result":""}],
  "evidence": [{"title":"","url":"","supports":true,"confidence":0.7,"notes":""}],
  "snapshots": [{"ts":"","model":{...},"results":{"weights":[],"results":[]}}]
}
```

## Usage Tips
1. Enter criteria and options; press **Compute**.
2. Use **What‑If Weights** to explore sensitivity; press **Compute** again to view impact.
3. Add **Evidence** and **Experiments** to capture learning loops.
4. Create **Snapshots** before and after major changes; inspect **Diff**.
5. **Export ADR** to share a 1‑page rationale in reviews.
