# Madkour Department Assessment Portal

The primary deliverable is now [`publish/index.html`](publish/index.html), a single local web app containing five independent department assessments:

- Cost Control
- Document Control
- Planning and Controlling
- Project Procurement
- Technical Office

The portal opens with one card per department. Every department has 60 questions, independent browser storage, its own dashboard/gaps/roadmap/report, question-specific maturity descriptions, and individual exports. The portal also provides all-department CSV, printable dashboard, and JSON backup exports.

Run the app by opening `publish/index.html` in a browser. For local browser testing, serve `publish/` with any static web server.

## Rebuilding the combined app

The combined deliverable is generated from the five original HTML assessments plus the approved additions in `work/build_combined_assessment_app.mjs`:

```powershell
node work/build_combined_assessment_app.mjs
```

The original department HTML files under `Inputs/Departments/` remain reference sources and are not overwritten.

## Legacy Cost Control deliverables

A self-contained maturity assessment for a company's Cost Control function. It scores
nine weighted domains, surfaces the biggest gaps, and generates a prioritized
implementation roadmap — all in the browser, no server or build step required.

## Deliverables

| File | What it is |
| --- | --- |
| [`outputs/Cost_Control_Department_Assessment_Tool_v2.html`](outputs/Cost_Control_Department_Assessment_Tool_v2.html) | **Primary app.** Single-page tool — open in any browser. All edits go here. |
| `outputs/Cost_Control_Department_Assessment_Tool.html` | v1 (older, kept for reference only) |
| `outputs/Cost_Control_Department_Lean_Assessment_Tracker.xlsx` | Excel tracker deliverable |
| `outputs/assets/madkour-logo.png` | Brand logo embedded by the app |

## Running the app

Open `outputs/Cost_Control_Department_Assessment_Tool_v2.html` directly in a browser
(double-click, or `Start-Process` on Windows). Everything is inline — no dependencies.

State (answers, weights, settings) lives in the page's `state` object and is persisted
to the browser's local storage.

## The six views

- **Dashboard** — domain maturity, severity mix, weighted-gap charts, top actions
- **Assessment** — answer each question (current level, target, evidence, notes)
- **Gaps** — weighted-gap analysis, severity distribution, domain heatmap, priority gaps
- **Roadmap** — generated initiatives with owners, timeline, and detailed action register
- **Report** — management report preview + copy-to-Excel block
- **Settings** — target settings, domain weights, question weights

## Assessment model

Nine weighted domains (weights sum to 100):

| Domain | Weight |
| --- | --- |
| Strategy & Governance | 10 |
| Organization & Roles | 10 |
| Cost Planning & Budget Control | 15 |
| Commitments, PO & Subcontract Control | 12 |
| Cost Reporting, Forecasting & EAC | 18 |
| Change, Overrun & Contract Value Control | 10 |
| Systems, Data & ERP Discipline | 10 |
| Interfaces & Monthly Cycle | 10 |
| Closure, Lessons Learned & Improvement | 5 |

Each question is defined with the `q(domain, category, weight, text, evidence, process, theme, impact)`
helper inside the HTML's `<script>` block.

## Regenerating the Excel tracker

The `.xlsx` is assembled from raw OOXML (no Excel/COM dependency) by a PowerShell script:

```powershell
pwsh work/create_cost_control_tracker.ps1
```

This rebuilds `work/xlsx_build/` (an intermediate, git-ignored tree) and zips it into
`outputs/Cost_Control_Department_Lean_Assessment_Tracker.xlsx`.

## Repository layout

```
outputs/   Deliverables (HTML app, xlsx, assets)
work/       Build script + intermediate OOXML tree (xlsx_build/ is git-ignored)
```
