# Project Handoff — Cost Control Assessment Tool

This file is the source of truth for continuing the project on another machine.
Claude Code's cross-session memory does **not** travel between laptops — this file does.

_Last updated: 2026-07-13 · Branch: `brand-alignment`_

## What this is
A single-file browser app. **Primary file:** [`outputs/Cost_Control_Department_Assessment_Tool_v2.html`](outputs/Cost_Control_Department_Assessment_Tool_v2.html).
Open it in any browser — no server, no build, no dependencies. Edit **only** the v2 file;
`Cost_Control_Department_Assessment_Tool.html` (v1) is reference only.

## How to run it
- **Simplest:** double-click `outputs/Cost_Control_Department_Assessment_Tool_v2.html`.
- **Local server (optional):** `node .claude/serve.js` then open http://localhost:8777
  (the `.claude/` helpers are git-ignored, so recreate them or just open the file directly).

## Status — done and verified live
- **Brand alignment:** electric-blue `#0031eb` + navy `#001559` palette, Manrope font,
  pill buttons, retinted sidebar, severity/domain accent colors.
- **Logo:** official Madkour "icon + MADKOUR" white wordmark, inlined as a transparent
  PNG data URI (sidebar) + navy chip behind it in the report/brief so it shows on white.
- **UI (Batch 1):** global zoom-out (`body { zoom: 0.9 }`, with sidebar/app heights using
  `calc(100vh / 0.9)` to compensate for the browser scaling `100vh`); **Backup ▾ dropdown**
  in the top-right toolbar on every view — Export JSON / Load JSON / Reset All Data.
- **Reporting (Batch 2):** **Executive Brief** (one-page standalone HTML — KPI band,
  domain-vs-target bars, severity donut, strengths/risks, auto strategic insights,
  roadmap-at-a-glance; A4 print CSS so Print → Save as PDF gives the boardroom PDF);
  **Operational Appendix** (the old detailed report, kept as secondary export);
  **CSV export** (Excel/Power BI ready, BOM + quoted); **snapshot history** on Save →
  Maturity Trend line appears in the Brief once ≥2 saves exist; `state.schemaVersion = "2.1"`.

## Status — not started
- **Batch 3 (Multi-user, front-end):** respondent identity (name / department / business unit),
  versioned assessment schema, admin **Consolidation & Comparison** screen (import many
  assessment files → roster, averages by dept/BU, disagreement heatmap), all-user backup.
  Collection is file-based at this stage (each respondent sends their file, admin imports).
- **Phase 2 (Hosted platform, separate project):** Supabase (Postgres + auth + row-level
  security) + static hosting, self-service respondent logins, live admin dashboard,
  100+ concurrent respondents, backup = whole database.

## Locked decisions
- Hosting: cloud OK (Supabase/Firebase) for Phase 2.
- Scale: 100+ respondents.
- Primary export: Executive HTML Brief + print-to-PDF.
- Backup control: global, top-right, all views.
- Fonts: Manrope everywhere (Britanica is Madkour's proprietary display font — not embedded).

## To continue with Claude Code on the new machine
1. Open this project folder in Claude Code.
2. Say: **"Read HANDOFF.md and continue — next is Batch 3."**
3. If you want the full comparison-view mockup first, ask for that before wiring it in.

## Repo notes
- Git-ignored: `edge-profile-temp/` (browser cache junk, safe to delete), `work/xlsx_build/`
  (regenerable), `.claude/` (local settings + dev helpers).
- The `.xlsx` tracker is rebuilt by `work/create_cost_control_tracker.ps1` (needs PowerShell).
