# Human Oriented Design — MVP Workbench (Electron, JS)

## Purpose
Help humans **frame complex problems, compare options explicitly, make decisions with rationale, and learn from outcomes**.

## Values
- **Progressive structure:** start loose, add structure when helpful.
- **Explainability:** every decision can be reviewed in 2 minutes.
- **Uncertainty visible:** assumptions + confidence are first-class.
- **Human control:** AI suggests; humans decide and annotate.
- **Learning loop:** experiments change beliefs and next actions.

## What this MVP Includes
- A **local-first Electron app** (no TypeScript) with:
  - **Problem/Outcomes/Constraints/Assumptions** capture
  - **Criteria + Weights** (percentages) editor
  - **Options** with **1–5 scores** per criterion
  - **Simple Additive Weighting** (SAW) ranking + normalized weights
  - **Save/Load** to a JSON file in Electron `userData`

## Structure
```
human-oriented-design-mvp/
├─ main.js           # Electron main process; persistence IPC
├─ preload.js        # Safe API surface: save/load + compute()
├─ src/
│  ├─ index.html     # Minimal UI
│  ├─ renderer.js    # UI logic, SAW invocation, save/load
│  └─ styles.css     # Clean defaults
├─ docs/
│  └─ mvp-overview.md
├─ package.json      # JS-only; dev scripts for electron & packager
└─ .gitignore
```

## Implementation Notes
- **No Node integration** in renderer; uses `preload.js` + `contextBridge`.
- **Storage**: `${app.getPath('userData')}/decisions.json`.
- **Computation**: SAW = sum(weightᵢ * scoreᵢ); weights auto-normalize.
- **Scales**: scores 0–5; weights in %; output 0–5 range.

## Running Locally
```bash
npm install
npm start
```
Optional packaging (requires electron-packager):
```bash
npm run package-mac   # or package-win, package-linux
```

## Next Steps (suggested)
- Export **ADR.md** summaries from current model.
- Add **sensitivity** view (tornado chart) and **what-if** sliders.
- Evidence ledger: each option links **supporting/refuting** items.
- Experiments board: hypothesis → metric → threshold → result.
- Local-first sync (PouchDB/CRDT) + optional cloud backup.
