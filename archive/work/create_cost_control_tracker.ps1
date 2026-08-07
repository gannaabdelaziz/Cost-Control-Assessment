Add-Type -AssemblyName System.IO.Compression.FileSystem

$OutputDir = Join-Path (Get-Location) "outputs"
if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir | Out-Null
}

$WorkbookPath = Join-Path $OutputDir "Cost_Control_Department_Lean_Assessment_Tracker.xlsx"
$TempDir = Join-Path (Get-Location) "work\xlsx_build"
if (Test-Path $TempDir) {
    Remove-Item -LiteralPath $TempDir -Recurse -Force
}
New-Item -ItemType Directory -Path $TempDir | Out-Null
New-Item -ItemType Directory -Path (Join-Path $TempDir "_rels") | Out-Null
New-Item -ItemType Directory -Path (Join-Path $TempDir "xl") | Out-Null
New-Item -ItemType Directory -Path (Join-Path $TempDir "xl\_rels") | Out-Null
New-Item -ItemType Directory -Path (Join-Path $TempDir "xl\worksheets") | Out-Null
New-Item -ItemType Directory -Path (Join-Path $TempDir "xl\styles") | Out-Null

function XmlEscape($value) {
    if ($null -eq $value) { return "" }
    return [System.Security.SecurityElement]::Escape([string]$value)
}

function ColName([int]$index) {
    $name = ""
    while ($index -gt 0) {
        $mod = ($index - 1) % 26
        $name = [char](65 + $mod) + $name
        $index = [math]::Floor(($index - $mod) / 26)
    }
    return $name
}

function SheetXml($rows, $widths = @{}, $freezeTop = $true) {
    $xml = New-Object System.Text.StringBuilder
    [void]$xml.Append('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>')
    [void]$xml.Append('<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">')
    if ($freezeTop) {
        [void]$xml.Append('<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>')
    }
    if ($widths.Count -gt 0) {
        [void]$xml.Append('<cols>')
        foreach ($key in $widths.Keys | Sort-Object {[int]$_}) {
            $w = $widths[$key]
            [void]$xml.Append("<col min=""$key"" max=""$key"" width=""$w"" customWidth=""1""/>")
        }
        [void]$xml.Append('</cols>')
    }
    [void]$xml.Append('<sheetData>')
    for ($r = 0; $r -lt $rows.Count; $r++) {
        $rowNum = $r + 1
        [void]$xml.Append("<row r=""$rowNum"">")
        for ($c = 0; $c -lt $rows[$r].Count; $c++) {
            $col = ColName ($c + 1)
            $cellRef = "$col$rowNum"
            $cell = $rows[$r][$c]
            if ($null -eq $cell) { continue }
            if ($cell -is [hashtable] -and $cell.ContainsKey("formula")) {
                $style = if ($cell.ContainsKey("style")) { $cell["style"] } else { 0 }
                [void]$xml.Append("<c r=""$cellRef"" s=""$style""><f>$($cell["formula"])</f></c>")
            } elseif ($cell -is [hashtable] -and $cell.ContainsKey("num")) {
                $style = if ($cell.ContainsKey("style")) { $cell["style"] } else { 0 }
                [void]$xml.Append("<c r=""$cellRef"" s=""$style""><v>$($cell["num"])</v></c>")
            } else {
                $style = if ($rowNum -eq 1) { 1 } else { 0 }
                [void]$xml.Append("<c r=""$cellRef"" t=""inlineStr"" s=""$style""><is><t>$(XmlEscape $cell)</t></is></c>")
            }
        }
        [void]$xml.Append('</row>')
    }
    [void]$xml.Append('</sheetData>')
    [void]$xml.Append('<pageMargins left="0.7" right="0.7" top="0.75" bottom="0.75" header="0.3" footer="0.3"/>')
    [void]$xml.Append('</worksheet>')
    return $xml.ToString()
}

$questions = @(
    @{D="Strategy & Governance"; C="Department Mandate"; W=0.035; Q="Is the Cost Control Department mandate formally defined, approved, and understood by project stakeholders?"; O="Assess whether the department has a clear authorized role."; M="Unclear mandate creates duplicated effort, weak authority, and inconsistent project control."; E="Department charter, authority matrix, organization manual."; B="Best practice is a management-approved charter defining scope, authority, interfaces, and accountability."},
    @{D="Strategy & Governance"; C="Objectives & Alignment"; W=0.035; Q="Are cost control objectives linked to company strategy, project delivery priorities, and executive expectations?"; O="Assess strategic alignment."; M="Unlinked objectives make cost control reactive rather than business-driven."; E="Department objectives, annual plan, management KPIs."; B="Objectives should cascade from business strategy into measurable department and project controls targets."},
    @{D="Strategy & Governance"; C="Governance & Decision Rights"; W=0.035; Q="Are governance forums and decision rights for cost-related matters clearly defined?"; O="Assess governance clarity."; M="Weak decision rights delay approvals and reduce accountability."; E="Governance calendar, approval matrix, meeting minutes."; B="Cost governance should define escalation paths, approval levels, and recurring review forums."},
    @{D="Strategy & Governance"; C="Stakeholder Management"; W=0.030; Q="Does the department actively manage stakeholder expectations across projects and functions?"; O="Assess stakeholder engagement maturity."; M="Cost control depends on timely inputs from project, procurement, finance, planning, and construction teams."; E="Stakeholder map, communication plan, review minutes."; B="Stakeholders should be mapped, engaged through structured routines, and measured through service expectations."},

    @{D="Organization & People"; C="Organization Structure"; W=0.035; Q="Is the cost control organization structure fit for the project portfolio size and complexity?"; O="Assess organization design."; M="Under-designed structures create overload, unclear ownership, and inconsistent project support."; E="Organization chart, portfolio workload analysis."; B="Structure should reflect project complexity, portfolio scale, governance needs, and required interfaces."},
    @{D="Organization & People"; C="Roles & Responsibilities"; W=0.035; Q="Are cost control roles, responsibilities, and accountabilities clearly documented?"; O="Assess role clarity."; M="Unclear responsibilities cause gaps in forecasting, reporting, change control, and data ownership."; E="Job descriptions, RACI, responsibility matrix."; B="Each role should have defined outputs, authorities, interfaces, and competency requirements."},
    @{D="Organization & People"; C="Competency & Training"; W=0.030; Q="Is there a structured competency and training framework for cost control staff?"; O="Assess capability development."; M="EPC cost control needs strong technical, commercial, systems, and analytical capability."; E="Competency matrix, training plan, certification records."; B="Competencies should be assessed periodically and linked to targeted development plans."},
    @{D="Organization & People"; C="Performance Management"; W=0.030; Q="Are individual and team performance measures linked to cost control outcomes?"; O="Assess performance alignment."; M="Teams perform better when expectations are measurable and tied to business value."; E="KPIs, appraisal forms, team scorecards."; B="Performance should include quality, timeliness, forecast accuracy, reporting discipline, and improvement contribution."},

    @{D="Cost Control Core Processes"; C="Cost Breakdown & Coding"; W=0.040; Q="Is there a standardized Cost Breakdown Structure and cost coding system used consistently across projects?"; O="Assess cost structure standardization."; M="Poor coding prevents reliable reporting, benchmarking, and portfolio analysis."; E="CBS, code of accounts, coding procedure."; B="A controlled CBS and code of accounts should align estimating, budget, commitments, actuals, and forecasts."},
    @{D="Cost Control Core Processes"; C="Budget Development"; W=0.040; Q="Are project budgets developed, reviewed, approved, and baselined through a controlled process?"; O="Assess budget control discipline."; M="Weak budget baselines reduce the credibility of variance analysis and forecasting."; E="Budget procedure, approved baseline, budget review records."; B="Budgets should be traceable, approved, version-controlled, and linked to scope and schedule."},
    @{D="Cost Control Core Processes"; C="Baseline Management"; W=0.035; Q="Are cost baselines formally maintained with controlled revisions and audit trail?"; O="Assess baseline control."; M="Uncontrolled baseline changes hide true project performance."; E="Baseline change log, approvals, revision history."; B="Baseline changes should require approved scope, change, or management authorization."},
    @{D="Cost Control Core Processes"; C="Commitments & Actuals"; W=0.040; Q="Are commitments, actual costs, accruals, and liabilities captured accurately and on time?"; O="Assess cost data reliability."; M="Incomplete actuals and commitments distort forecasts and cash flow visibility."; E="ERP reports, commitment register, accrual process."; B="Commitments and actuals should be integrated with procurement, contracts, finance, and project controls."},
    @{D="Cost Control Core Processes"; C="Forecasting"; W=0.045; Q="Is Estimate at Completion prepared using a structured, evidence-based forecasting method?"; O="Assess forecast maturity."; M="Forecast quality is central to executive decision-making and project recovery."; E="Forecast procedure, EAC files, trend logs."; B="EAC should combine actuals, commitments, productivity, trends, risks, changes, and remaining scope."},
    @{D="Cost Control Core Processes"; C="Change & Trend Management"; W=0.040; Q="Are changes, trends, claims, and potential cost impacts identified and controlled early?"; O="Assess change control maturity."; M="Late recognition of change erodes margin and weakens commercial recovery."; E="Change register, trend register, approval workflow."; B="Potential changes should be logged early, evaluated, approved, and reflected in forecast scenarios."},
    @{D="Cost Control Core Processes"; C="Cash Flow & Funding"; W=0.030; Q="Are project cash flow forecasts prepared and reconciled with cost, schedule, procurement, and finance data?"; O="Assess cash flow control."; M="Cash flow visibility supports liquidity planning and project financing decisions."; E="Cash flow reports, finance reconciliation."; B="Cash flow should be derived from approved schedule, procurement plan, payment terms, and current forecast."},

    @{D="Integration with Planning / Procurement / Finance"; C="Planning Integration"; W=0.035; Q="Are cost control outputs integrated with project schedule, progress measurement, and planning updates?"; O="Assess planning-cost integration."; M="Cost performance cannot be interpreted properly without progress and schedule context."; E="Integrated reports, schedule-cost mapping, progress files."; B="Cost, schedule, progress, and forecast processes should share aligned WBS/CBS structures and cut-off dates."},
    @{D="Integration with Planning / Procurement / Finance"; C="Progress & EVM"; W=0.035; Q="Is earned value or equivalent progress-based performance measurement used for major EPC projects?"; O="Assess performance measurement."; M="Progress-based cost control provides early warning of productivity and cost overruns."; E="EV reports, progress rules of credit, S-curves."; B="EVM should use approved baselines, objective progress measurement, and consistent variance analysis."},
    @{D="Integration with Planning / Procurement / Finance"; C="Procurement Interface"; W=0.030; Q="Is procurement cost status integrated into cost reports, forecasts, and cash flow projections?"; O="Assess procurement-cost integration."; M="Procurement commitments are a major driver of EPC cost exposure."; E="Procurement status report, PO log, expediting input."; B="Procurement data should feed commitments, delivery timing, payment timing, and forecast exposure."},
    @{D="Integration with Planning / Procurement / Finance"; C="Finance Reconciliation"; W=0.030; Q="Are cost control reports reconciled regularly with finance actuals and accounting records?"; O="Assess finance alignment."; M="Unreconciled numbers damage management confidence and create competing versions of truth."; E="Reconciliation logs, finance sign-off, ERP extracts."; B="Cost control and finance should agree monthly cut-off, actuals, accruals, and reporting definitions."},

    @{D="Systems, Data & Digitalization"; C="Systems Landscape"; W=0.035; Q="Are cost control systems clearly defined, fit for purpose, and consistently used across projects?"; O="Assess system adequacy."; M="Fragmented tools create manual work, errors, and delayed reporting."; E="System map, ERP configuration, tool list."; B="Systems should support budget, actuals, commitments, forecasts, changes, and reporting workflows."},
    @{D="Systems, Data & Digitalization"; C="Data Quality"; W=0.035; Q="Are data ownership, validation rules, and data quality checks established for cost information?"; O="Assess data governance."; M="Poor data quality makes dashboards and forecasts unreliable."; E="Data dictionary, validation checklist, quality logs."; B="Critical cost data should have named owners, definitions, validations, and periodic quality checks."},
    @{D="Systems, Data & Digitalization"; C="Automation & Workflow"; W=0.030; Q="Are repetitive cost control activities automated where practical?"; O="Assess automation maturity."; M="Manual processes consume time and increase reporting risk."; E="Workflow screenshots, automation logs, templates."; B="High-volume repetitive tasks should be automated using controlled workflows and data integration."},
    @{D="Systems, Data & Digitalization"; C="BI & Dashboards"; W=0.030; Q="Are Power BI or similar dashboards used to provide timely cost and performance visibility?"; O="Assess dashboard maturity."; M="Modern project controls need fast, visual, and drillable performance insight."; E="Dashboard screenshots, data model, refresh log."; B="Dashboards should use governed data, clear KPIs, filters, RAG status, and drill-down capability."},

    @{D="Reporting & Performance Management"; C="Reporting Calendar"; W=0.030; Q="Is there a fixed reporting calendar with clear cut-off dates, owners, and review steps?"; O="Assess reporting discipline."; M="A disciplined reporting cycle improves timeliness and accountability."; E="Reporting calendar, monthly close checklist."; B="Reporting should follow a controlled monthly cycle with defined inputs, reviews, and approvals."},
    @{D="Reporting & Performance Management"; C="Management Reports"; W=0.035; Q="Do cost reports provide clear variance analysis, forecast explanation, risks, and required decisions?"; O="Assess report usefulness."; M="Reports should support decisions, not just present data."; E="Monthly cost report, executive dashboard."; B="Reports should explain variances, EAC movement, risks, corrective actions, and management decisions needed."},
    @{D="Reporting & Performance Management"; C="KPIs & Performance Review"; W=0.030; Q="Are cost control KPIs defined, measured, reviewed, and acted upon?"; O="Assess KPI management."; M="KPIs help management see whether cost control is effective and improving."; E="KPI library, dashboard, review minutes."; B="KPIs should measure timeliness, accuracy, forecast reliability, change control, productivity, and process compliance."},

    @{D="Risk, Compliance & Continuous Improvement"; C="Risk Integration"; W=0.035; Q="Are cost risks and opportunities integrated into forecasts, contingency, and management reporting?"; O="Assess risk-cost integration."; M="Forecasts are incomplete if risk exposure and opportunity are not reflected."; E="Risk register, contingency drawdown, risk-adjusted EAC."; B="Cost forecasts should include risk-adjusted scenarios and clear contingency governance."},
    @{D="Risk, Compliance & Continuous Improvement"; C="Compliance & Assurance"; W=0.030; Q="Are cost control processes periodically reviewed for compliance and effectiveness?"; O="Assess assurance maturity."; M="Without assurance, process drift and weak controls remain hidden."; E="Audit reports, compliance checklist, review findings."; B="Independent or management assurance should test process compliance, data quality, and corrective actions."},
    @{D="Risk, Compliance & Continuous Improvement"; C="Lessons Learned"; W=0.025; Q="Are cost control lessons learned captured and reused across projects?"; O="Assess knowledge reuse."; M="Organizations lose value when recurring cost issues are not captured and prevented."; E="Lessons learned register, closeout reports."; B="Lessons should be captured during and after projects, assigned owners, and embedded into procedures and templates."},
    @{D="Risk, Compliance & Continuous Improvement"; C="Continuous Improvement"; W=0.030; Q="Is there a structured improvement plan for cost control processes, systems, people, and reporting?"; O="Assess improvement discipline."; M="Transformation requires a managed improvement pipeline, not isolated fixes."; E="Improvement roadmap, action tracker, benefits log."; B="Improvement initiatives should be prioritized by value, risk, complexity, owner, timeline, and measurable benefit."}
)

$instructionRows = @(
    @("Cost Control Department Lean Assessment Tracker", "2026-2027 Business Plan & Transformation Roadmap"),
    @("Purpose", "Use this workbook to capture a lean executive-level maturity assessment for the Cost Control Department."),
    @("How to answer", "Enter a value from 1 to 5 in the Selected Maturity column on the Assessment Questions sheet."),
    @("Maturity 1", "Initial / Ad Hoc"),
    @("Maturity 2", "Repeatable"),
    @("Maturity 3", "Defined"),
    @("Maturity 4", "Managed"),
    @("Maturity 5", "Optimized / Best Practice"),
    @("Scoring formula", "Question Weighted Score = Question Weight x Selected Maturity / 5."),
    @("Priority logic", "High priority = gap of 3 or more; Medium = gap of 2; Low = gap below 2."),
    @("Next step", "Complete the assessment, then use the weak domains and categories to build the roadmap and business plan.")
)

$headers = @("Question No.","Domain","Category","Question Weight %","Assessment Objective","Why This Matters","Assessment Question","Level 1 - Initial / Ad Hoc","Level 2 - Repeatable","Level 3 - Defined","Level 4 - Managed","Level 5 - Optimized","Selected Maturity","Custom Answer / Notes","Evidence Requested","Evidence Available?","Best Practice","Question Weighted Score","Gap to Target","Priority","Status")
$assessmentRows = @($headers)
for ($i = 0; $i -lt $questions.Count; $i++) {
    $q = $questions[$i]
    $r = $i + 2
    $assessmentRows += ,@(
        ($i + 1),
        $q.D,
        $q.C,
        @{num=$q.W; style=2},
        $q.O,
        $q.M,
        $q.Q,
        "No formal or consistent practice exists.",
        "Basic practice exists but is informal or inconsistently applied.",
        "Documented practice exists and is applied on most projects.",
        "Managed practice exists with ownership, measurement, and regular review.",
        "Optimized practice is standardized, measured, automated where practical, and continuously improved.",
        "",
        "",
        $q.E,
        "",
        $q.B,
        @{formula="IF(M$r="""","""",D$r*(M$r/5))"; style=2},
        @{formula="IF(M$r="""","""",5-M$r)"; style=0},
        @{formula="IF(M$r="""","""",IF(S$r>=3,""High"",IF(S$r>=2,""Medium"",""Low"")))"; style=0},
        @{formula="IF(M$r="""",""Not Started"",""Answered"")"; style=0}
    )
}

$domains = $questions | Group-Object D
$domainRows = @(@("Domain","Domain Weight %","No. of Questions","Answered Questions","Answered Weight %","Domain Score %","Domain Maturity Level","Target Maturity","Gap","Priority"))
foreach ($group in $domains) {
    $name = $group.Name
    $row = $domainRows.Count + 1
    $domainRows += ,@(
        $name,
        @{formula="SUMIF('Assessment Questions'!B:B,A$row,'Assessment Questions'!D:D)"; style=2},
        @{formula="COUNTIF('Assessment Questions'!B:B,A$row)"},
        @{formula="COUNTIFS('Assessment Questions'!B:B,A$row,'Assessment Questions'!M:M,"">0"")"},
        @{formula="SUMIFS('Assessment Questions'!D:D,'Assessment Questions'!B:B,A$row,'Assessment Questions'!M:M,"">0"")"; style=2},
        @{formula="IF(E$row=0,"""",SUMIFS('Assessment Questions'!R:R,'Assessment Questions'!B:B,A$row)/E$row)"; style=2},
        @{formula="IF(F$row="""","""",F$row*5)"},
        5,
        @{formula="IF(G$row="""","""",H$row-G$row)"},
        @{formula="IF(I$row="""","""",IF(I$row>=3,""High"",IF(I$row>=2,""Medium"",""Low"")))"} 
    )
}

$categoryRows = @(@("Domain","Category","Category Weight %","No. of Questions","Answered Questions","Category Score %","Category Maturity Level","Target Maturity","Gap","Priority"))
$categories = $questions | ForEach-Object { "$($_.D)||$($_.C)" } | Select-Object -Unique
foreach ($cat in $categories) {
    $parts = $cat -split "\|\|"
    $row = $categoryRows.Count + 1
    $categoryRows += ,@(
        $parts[0],
        $parts[1],
        @{formula="SUMIFS('Assessment Questions'!D:D,'Assessment Questions'!B:B,A$row,'Assessment Questions'!C:C,B$row)"; style=2},
        @{formula="COUNTIFS('Assessment Questions'!B:B,A$row,'Assessment Questions'!C:C,B$row)"},
        @{formula="COUNTIFS('Assessment Questions'!B:B,A$row,'Assessment Questions'!C:C,B$row,'Assessment Questions'!M:M,"">0"")"},
        @{formula="IF(E$row=0,"""",SUMIFS('Assessment Questions'!R:R,'Assessment Questions'!B:B,A$row,'Assessment Questions'!C:C,B$row)/SUMIFS('Assessment Questions'!D:D,'Assessment Questions'!B:B,A$row,'Assessment Questions'!C:C,B$row,'Assessment Questions'!M:M,"">0""))"; style=2},
        @{formula="IF(F$row="""","""",F$row*5)"},
        5,
        @{formula="IF(G$row="""","""",H$row-G$row)"},
        @{formula="IF(I$row="""","""",IF(I$row>=3,""High"",IF(I$row>=2,""Medium"",""Low"")))"} 
    )
}

$dashboardRows = @(
    @("Metric","Value"),
    @("Total Questions", @{formula="COUNTA('Assessment Questions'!A2:A31)"}),
    @("Answered Questions", @{formula="COUNTIF('Assessment Questions'!M2:M31,"">0"")"}),
    @("Remaining Questions", @{formula="B2-B3"}),
    @("Assessment Completion %", @{formula="B3/B2"; style=2}),
    @("Overall Weighted Score %", @{formula="SUM('Assessment Questions'!R2:R31)"; style=2}),
    @("Overall Maturity Level", @{formula="B6*5"}),
    @("Gap to Target Maturity 5", @{formula="5-B7"}),
    @("High Priority Items", @{formula="COUNTIF('Assessment Questions'!T2:T31,""High"")"}),
    @("Medium Priority Items", @{formula="COUNTIF('Assessment Questions'!T2:T31,""Medium"")"}),
    @("Low Priority Items", @{formula="COUNTIF('Assessment Questions'!T2:T31,""Low"")"})
)

$roadmapRows = @(
    @("Initiative ID","Initiative Name","Related Domain","Related Category","Priority","Business Value","Complexity","Owner","Supporting Departments","Start Date","Finish Date","Deliverables","KPI Link","Status"),
    @("INIT-001","","","","","","","","","","","","","Not Started")
)

$kpiRows = @(
    @("KPI Name","Objective","Formula","Data Source","Frequency","Target","RAG Thresholds","Owner","Dashboard Visualization"),
    @("Forecast Accuracy","Measure EAC reliability","ABS(Final Cost - Forecast EAC) / Final Cost","Cost reports / ERP","Monthly","To be defined","Green/Amber/Red to be defined","Cost Control Manager","Line or KPI card"),
    @("Reporting Timeliness","Measure reporting discipline","Reports issued on time / Total reports","Reporting calendar","Monthly","To be defined","Green/Amber/Red to be defined","Cost Control Manager","KPI card"),
    @("Change Log Timeliness","Measure early change capture","Changes logged within target time / Total changes","Change register","Monthly","To be defined","Green/Amber/Red to be defined","Project Controls Lead","Bar chart")
)

$widths = @{
    1=14; 2=34; 3=34; 4=16; 5=45; 6=55; 7=65; 8=44; 9=44; 10=44; 11=44; 12=48; 13=18; 14=40; 15=40; 16=20; 17=65; 18=20; 19=14; 20=14; 21=14
}

Set-Content -LiteralPath (Join-Path $TempDir "[Content_Types].xml") -Value '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/worksheets/sheet3.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/worksheets/sheet4.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/worksheets/sheet5.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/worksheets/sheet6.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>' -Encoding UTF8
Set-Content -LiteralPath (Join-Path $TempDir "_rels\.rels") -Value '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>' -Encoding UTF8
Set-Content -LiteralPath (Join-Path $TempDir "xl\workbook.xml") -Value '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Instructions" sheetId="1" r:id="rId1"/><sheet name="Assessment Questions" sheetId="2" r:id="rId2"/><sheet name="Domain Scorecard" sheetId="3" r:id="rId3"/><sheet name="Category Scorecard" sheetId="4" r:id="rId4"/><sheet name="Dashboard Data" sheetId="5" r:id="rId5"/><sheet name="Roadmap and KPI Inputs" sheetId="6" r:id="rId6"/></sheets></workbook>' -Encoding UTF8
Set-Content -LiteralPath (Join-Path $TempDir "xl\_rels\workbook.xml.rels") -Value '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet3.xml"/><Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet4.xml"/><Relationship Id="rId5" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet5.xml"/><Relationship Id="rId6" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet6.xml"/><Relationship Id="rId7" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>' -Encoding UTF8
Set-Content -LiteralPath (Join-Path $TempDir "xl\styles.xml") -Value '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="1"><numFmt numFmtId="164" formatCode="0.00%"/></numFmts><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>' -Encoding UTF8

Set-Content -LiteralPath (Join-Path $TempDir "xl\worksheets\sheet1.xml") -Value (SheetXml $instructionRows @{1=34;2=95} $false) -Encoding UTF8
Set-Content -LiteralPath (Join-Path $TempDir "xl\worksheets\sheet2.xml") -Value (SheetXml $assessmentRows $widths $true) -Encoding UTF8
Set-Content -LiteralPath (Join-Path $TempDir "xl\worksheets\sheet3.xml") -Value (SheetXml $domainRows @{1=48;2=18;3=18;4=18;5=20;6=18;7=20;8=16;9=14;10=14} $true) -Encoding UTF8
Set-Content -LiteralPath (Join-Path $TempDir "xl\worksheets\sheet4.xml") -Value (SheetXml $categoryRows @{1=42;2=42;3=18;4=18;5=18;6=18;7=20;8=16;9=14;10=14} $true) -Encoding UTF8
Set-Content -LiteralPath (Join-Path $TempDir "xl\worksheets\sheet5.xml") -Value (SheetXml $dashboardRows @{1=36;2=24} $false) -Encoding UTF8
Set-Content -LiteralPath (Join-Path $TempDir "xl\worksheets\sheet6.xml") -Value (SheetXml ($roadmapRows + @(@()) + $kpiRows) @{1=24;2=34;3=34;4=34;5=18;6=24;7=18;8=24;9=30;10=16;11=16;12=34;13=24;14=18} $true) -Encoding UTF8

if (Test-Path $WorkbookPath) {
    Remove-Item -LiteralPath $WorkbookPath -Force
}
[System.IO.Compression.ZipFile]::CreateFromDirectory($TempDir, $WorkbookPath)
Write-Host "Created $WorkbookPath"
