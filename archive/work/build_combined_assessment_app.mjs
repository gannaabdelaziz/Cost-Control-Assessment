import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root = path.resolve(import.meta.dirname, "..");
const sourceFiles = [
  { id: "cost-control", name: "Cost Control", file: "outputs/Cost_Control_Department_Assessment_Tool_v2.html", legacyStorageKey: "costControlAssessmentStateV2" },
  { id: "document-control", name: "Document Control", file: "Inputs/Departments/Document Control Department/Department_Assessment_Tool_EDITABLE.html", legacyStorageKey: "documentControlAssessmentStateV1" },
  { id: "planning-controlling", name: "Planning and Controlling", file: "Inputs/Departments/Planning and Controlling Department/Department_Assessment_Tool_EDITABLE.html", legacyStorageKey: "planningControllingAssessmentStateV1" },
  { id: "project-procurement", name: "Project Procurement", file: "Inputs/Departments/Project Procurement Department/Department_Assessment_Tool_EDITABLE.html", legacyStorageKey: "projectProcurementAssessmentStateV1" },
  { id: "technical-office", name: "Technical Office", file: "Inputs/Departments/Technical Office Department/Department_Assessment_Tool_EDITABLE.html", legacyStorageKey: "technicalOfficeAssessmentStateV1" }
];

function extractArray(source, declaration, nextDeclaration) {
  const start = source.indexOf(`const ${declaration} = [`);
  const end = source.indexOf(nextDeclaration, start);
  if (start < 0 || end < 0) throw new Error(`Could not extract ${declaration}`);
  return source.slice(start, end);
}

function parseAssessment(meta) {
  const source = fs.readFileSync(path.join(root, meta.file), "utf8");
  const domainBlock = extractArray(source, "domains", "const questions");
  const questionStart = source.indexOf("const questions = [");
  const questionEnd = source.indexOf("function q(", questionStart);
  const questionBlock = source.slice(questionStart, questionEnd);
  const parsed = vm.runInNewContext(`(() => {
    function q(domain, category, weight, text, evidence, process, theme, impact) {
      return { domain, category, weight, text, evidence, process, theme, impact };
    }
    ${domainBlock}
    ${questionBlock}
    return { domains, questions };
  })()`);
  return { ...meta, ...parsed };
}

const S = (domain, category, text, evidence, theme, impact) => ({
  domain, category, weight: 0, text, evidence,
  process: "Department control framework and approved operating procedures.",
  theme, impact
});

const supplements = {
  "cost-control": [
    S("strategy", "Decision Rights", "Are Cost Control decision rights defined for accepting, challenging, escalating, and approving material cost matters?", "Decision-rights matrix, approval limits, escalation records.", "Governance", "Unclear decision rights delay action and weaken accountability."),
    S("strategy", "Escalation Timeliness", "Are material cost risks escalated within defined time limits to the appropriate management level?", "Escalation protocol, dated risk notifications, management responses.", "Governance", "Late escalation reduces the time available for corrective action."),
    S("people", "Segregation of Duties", "Are incompatible cost preparation, review, approval, and system-posting responsibilities appropriately segregated?", "Role matrix, workflow configuration, sample approvals.", "Governance", "Weak segregation increases error and manipulation risk."),
    S("people", "Knowledge Continuity", "Is critical Cost Control knowledge transferred and retained when responsibilities or personnel change?", "Handover records, standard work, backup assignments.", "People", "Knowledge loss disrupts reporting and control continuity."),
    S("planning", "Scope-to-Budget Mapping", "Is the approved project scope completely mapped to the cost budget structure?", "Scope register, WBS/CBS mapping, reconciliation evidence.", "Process", "Unmapped scope creates omissions and unreliable control baselines."),
    S("planning", "Budget Version Control", "Is each approved budget version uniquely identified and protected from unauthorized change?", "Budget version register, approvals, access history.", "Governance", "Uncontrolled versions undermine baseline integrity."),
    S("planning", "Contingency Governance", "Are contingency and risk allowances released only against defined and approved conditions?", "Contingency register, release approvals, remaining balance.", "Risk", "Uncontrolled contingency use conceals cost deterioration."),
    S("commitments", "Purchase Request Budget Check", "Is budget availability validated before a purchase request enters the approval workflow?", "PR review records, budget availability evidence, rejected requests.", "Commercial", "Late budget checks allow unaffordable requests to progress."),
    S("commitments", "Commitment Coding", "Are commitments recorded against the correct project task, resource, and expenditure code?", "PO/subcontract coding review, ERP records, correction log.", "Data", "Incorrect coding distorts available budget and forecasts."),
    S("commitments", "Commitment Reconciliation", "Are ERP commitments regularly reconciled with approved purchase orders and subcontracts?", "Commitment reconciliation, open-order report, correction evidence.", "Finance", "Unreconciled commitments create incomplete cost exposure."),
    S("commitments", "Accrual Completeness", "Are incurred costs not yet invoiced identified and accrued in the correct reporting period?", "Accrual schedule, receiving records, service confirmations.", "Finance", "Missing accruals overstate performance and weaken forecasts."),
    S("reporting", "Variance Root Cause", "Is each material cost variance assigned a supported root cause?", "Variance register, root-cause analysis, management review.", "Reporting", "Unsupported explanations prevent effective corrective action."),
    S("reporting", "Forecast Assumptions", "Are EAC and ETC assumptions explicitly recorded and traceable to responsible owners?", "Forecast assumption log, owner confirmations, supporting calculations.", "Forecasting", "Hidden assumptions make forecasts difficult to challenge."),
    S("reporting", "Estimate to Complete", "Is the estimate to complete built from current remaining scope and expected execution conditions?", "ETC build-up, remaining quantities, rates and productivity basis.", "Forecasting", "Weak ETC methods produce unreliable final-cost forecasts."),
    S("reporting", "Report Timeliness", "Are approved cost reports issued within the defined monthly reporting timetable?", "Reporting calendar, issue log, late-report analysis.", "Reporting", "Late reporting delays management decisions."),
    S("change", "Change Register Completeness", "Is every identified cost-impacting change recorded in a controlled change register?", "Change register, source notices, completeness checks.", "Change", "Unrecorded changes create hidden exposure."),
    S("change", "Change Recovery Tracking", "Are approved recovery actions for cost changes tracked through financial realization?", "Recovery action log, invoices/claims, realized-value evidence.", "Commercial", "Approved recovery that is not realized still erodes margin."),
    S("systems", "Cost Master Data", "Is cost-control master data governed to maintain valid tasks, resources, codes, and reporting mappings?", "Master-data ownership, change requests, validation reports.", "Data", "Poor master data causes systemic reporting errors."),
    S("systems", "System Access Control", "Is access to cost budgets, forecasts, commitments, and approvals restricted according to authorized roles?", "Access matrix, periodic access review, removal records.", "Systems", "Excess access weakens data integrity and approval control."),
    S("interfaces", "Input Accountability", "Is every monthly cost input assigned to a named owner and due date?", "Input responsibility matrix, calendar, submission tracker.", "Interfaces", "Unowned inputs create repeated reporting delays."),
    S("interfaces", "Cut-off Exception Control", "Are late or incomplete monthly inputs formally identified and resolved before report issue?", "Exception log, provisional treatment approvals, resolution evidence.", "Interfaces", "Uncontrolled exceptions reduce report reliability."),
    S("closure", "Final Cost Reconciliation", "Is the final project cost reconciled across budgets, commitments, actuals, accruals, and approved changes before closure?", "Final reconciliation, closure approvals, unresolved-item log.", "Closure", "Unreconciled closure leaves inaccurate final performance."),
  ],
  "document-control": [
    S("governance", "Document Control Risk Assessment", "Are document-control risks formally assessed and assigned to responsible owners?", "Risk register, owners, treatment actions.", "Risk", "Unmanaged document risks can affect delivery and claims."),
    S("receipt", "Receipt Ownership", "Is every received document assigned to a responsible controller for processing?", "Receipt log, assignment record, work queue.", "Process", "Unassigned receipts can be lost or delayed."),
    S("receipt", "Duplicate Detection", "Are duplicate document receipts identified before registration?", "Duplicate checks, exception log, register corrections.", "Data", "Duplicate records undermine register reliability."),
    S("distribution", "Distribution Authorization", "Is each distribution list authorized before controlled documents are issued?", "Approved distribution matrix, issue records.", "Governance", "Unauthorized distribution exposes controlled information."),
    S("distribution", "Recall Completion", "Is withdrawal of superseded controlled copies confirmed for all applicable recipients?", "Recall log, acknowledgments, outstanding-copy report.", "Compliance", "Unrecalled copies may remain in operational use."),
    S("filing", "Correspondence Delivery Evidence", "Is delivery evidence retained for every formal outgoing correspondence item?", "Courier receipt, email receipt, signed acknowledgment.", "Compliance", "Missing delivery evidence weakens contractual position."),
    S("filing", "Email Record Capture", "Are decision-relevant emails captured in the controlled project record?", "Email filing records, register links, audit sample.", "Compliance", "Material decisions may become untraceable."),
    S("electronic", "Access Removal", "Is electronic document access removed promptly when personnel responsibilities end?", "Leaver/transfer records, access-removal logs.", "Systems", "Dormant access creates unauthorized disclosure risk."),
    S("electronic", "Recovery Testing", "Is restoration of backed-up document records periodically tested?", "Recovery-test results, issues, corrective actions.", "Systems", "Untested backups may fail when needed."),
    S("archive", "Archive Inventory Reconciliation", "Is the physical archive inventory periodically reconciled with the archive register?", "Inventory count, reconciliation, discrepancy actions.", "Compliance", "Unreconciled archives can conceal missing records."),
    S("handover", "Handover Deficiency Control", "Are missing or rejected handover records tracked to verified closure?", "Deficiency log, owners, resubmission evidence.", "Closure", "Open deficiencies delay contractual handover."),
    S("performance", "Service-Level Monitoring", "Are document-control service times monitored against approved targets?", "KPI report, turnaround data, corrective actions.", "Reporting", "Unmonitored service delays affect project workflows."),
  ],
  "planning-controlling": [
    S("governance", "Schedule Governance Exceptions", "Are deviations from approved planning rules formally authorized and recorded?", "Exception requests, approvals, exception log.", "Governance", "Uncontrolled exceptions reduce schedule credibility."),
    S("initiation", "Contract Date Register", "Are all contractual schedule dates captured in a controlled register at initiation?", "Contract date register, contract cross-reference, review record.", "Compliance", "Missing dates create obligation and claim risk."),
    S("initiation", "Planning Deliverable Register", "Are required planning deliverables assigned, dated, and tracked from project initiation?", "Deliverable register, owners, due dates, status.", "Process", "Untracked deliverables delay planning readiness."),
    S("development", "Open-End Logic Control", "Are schedule activities checked for unjustified missing predecessors or successors?", "Schedule-quality report, exception justification.", "Data", "Open ends distort critical-path calculations."),
    S("development", "Excessive Constraint Control", "Are unnecessary or hard schedule constraints identified and removed?", "Constraint report, approvals, correction evidence.", "Data", "Excess constraints create artificial forecast dates."),
    S("integration", "Schedule-Cost Reconciliation", "Is time-phased schedule cost reconciled with the approved project budget?", "Schedule/budget reconciliation, mapping, correction log.", "Finance", "Misalignment weakens earned-value and cash forecasts."),
    S("updating", "Actual-Date Evidence", "Are actual start and finish dates supported by verifiable source evidence?", "Site records, inspections, delivery records, status approvals.", "Data", "Unsupported actual dates distort schedule status."),
    S("updating", "Out-of-Sequence Resolution", "Are out-of-sequence activities reviewed and resolved using an approved scheduling treatment?", "Out-of-sequence report, treatment record, review approval.", "Process", "Improper treatment corrupts forecast logic."),
    S("analysis", "Schedule Performance Indices", "Are schedule performance indicators consistently calculated from approved progress data?", "SPI calculations, source reconciliation, trend report.", "Reporting", "Inconsistent indicators mislead management."),
    S("recovery", "Recovery Action Ownership", "Is every approved recovery action assigned to an accountable owner and due date?", "Recovery register, owners, dates, status evidence.", "Governance", "Unowned recovery plans are unlikely to be delivered."),
    S("recovery", "Delay Notice Timeliness", "Are required contractual delay notices issued within applicable time limits?", "Notice register, contract requirement, issued notices.", "Compliance", "Late notices can prejudice contractual entitlement."),
    S("closeout", "Planning Benchmark Capture", "Are final production and duration benchmarks captured for reuse in future planning?", "Benchmark database, validation, reuse evidence.", "Improvement", "Lost historical data weakens future estimates."),
  ],
  "project-procurement": [
    S("governance", "Procurement Risk Register", "Are procurement risks recorded, assigned, assessed, and monitored throughout the project?", "Procurement risk register, owners, reviews, actions.", "Risk", "Unmanaged procurement risks threaten cost and delivery."),
    S("initiation", "Procurement Strategy", "Is a project procurement strategy approved before major sourcing activities begin?", "Procurement strategy, approvals, sourcing plan.", "Governance", "Absent strategy creates reactive sourcing decisions."),
    S("initiation", "Long-Lead Identification", "Are long-lead items identified early enough to protect project milestones?", "Long-lead register, schedule links, review evidence.", "Planning", "Late identification threatens project completion."),
    S("requests", "Request Change Control", "Are changes to approved SCR and MTS requirements formally authorized and traceable?", "Request revision history, approvals, change log.", "Change", "Uncontrolled changes create sourcing and delivery errors."),
    S("technical", "Technical Submittal Completeness", "Are vendor technical submissions checked for completeness before engineering review?", "Completeness checklist, returned submissions, review records.", "Process", "Incomplete submissions consume review time and delay release."),
    S("sourcing", "Bidder Qualification", "Are prospective suppliers qualified against approved technical, commercial, capacity, and compliance criteria?", "Prequalification records, evaluations, approvals.", "Commercial", "Unqualified suppliers increase delivery and quality risk."),
    S("sourcing", "Commercial Bid Comparison", "Are supplier bids compared using a consistent total-cost and commercial-risk basis?", "Bid comparison, assumptions, clarifications, approval.", "Commercial", "Incomplete comparisons can select poor-value offers."),
    S("expediting", "Supplier Capacity Verification", "Is critical supplier capacity verified against committed manufacturing and delivery dates?", "Capacity assessment, production plan, visit report.", "Risk", "Unsupported capacity commitments lead to delay."),
    S("expediting", "Expediting Evidence", "Is supplier progress supported by objective manufacturing or delivery evidence?", "Production evidence, inspection records, photographs, shipping documents.", "Data", "Unsupported progress reports hide emerging delays."),
    S("interfaces", "Logistics Readiness", "Are logistics, customs, transport, storage, and site-receipt requirements confirmed before dispatch?", "Logistics plan, permits, delivery readiness checklist.", "Interfaces", "Delivery can fail after manufacture if logistics are unready."),
    S("improvement", "Supplier Performance Evaluation", "Is supplier performance formally evaluated using reliable delivery, quality, responsiveness, and compliance data?", "Supplier scorecard, source data, review record.", "Reporting", "Without evaluation, poor suppliers may be repeatedly selected."),
    S("improvement", "Lessons Learned Reuse", "Are procurement lessons converted into reusable actions for future sourcing and expediting?", "Lessons log, action records, updated standards.", "Improvement", "Unreused lessons allow recurring procurement failures."),
  ],
  "technical-office": [
    S("governance", "Technical Risk Register", "Are Technical Office risks recorded, assigned, assessed, and monitored throughout the project?", "Technical risk register, owners, review records.", "Risk", "Unmanaged technical risks affect cost, quality, and schedule."),
    S("initiation", "Technical Deliverable Register", "Are all required Technical Office deliverables assigned, dated, and tracked from project initiation?", "Deliverable register, owners, due dates, status.", "Planning", "Untracked deliverables delay downstream work."),
    S("documents", "Submission Completeness", "Are technical submissions checked for completeness before external issue?", "Submission checklist, returned packages, issue records.", "Process", "Incomplete packages create avoidable review cycles."),
    S("documents", "Comment Ownership", "Is every review comment assigned to a responsible owner and due date?", "Comment register, owners, due dates, closure evidence.", "Governance", "Unowned comments delay approvals."),
    S("procurement", "Technical Clarification Control", "Are vendor technical clarifications recorded and resolved before final technical acceptance?", "Clarification log, responses, acceptance record.", "Compliance", "Open clarifications create supply nonconformance risk."),
    S("procurement", "Approved Vendor Deviation", "Is every accepted vendor deviation formally approved and traceable to the affected requirement?", "Deviation requests, approvals, requirement mapping.", "Change", "Uncontrolled deviations weaken technical compliance."),
    S("materials", "Material Forecast", "Are future material requirements forecast from approved quantities and the current execution schedule?", "Material forecast, schedule links, quantity basis.", "Planning", "Weak forecasting causes shortages or excess inventory."),
    S("materials", "Material Shortage Escalation", "Are forecast material shortages escalated early enough for corrective action?", "Shortage log, escalation records, recovery actions.", "Risk", "Late escalation interrupts construction."),
    S("quantities", "Quantity Measurement Method", "Is the measurement method for each work item defined before quantities are certified?", "Measurement rules, BOQ reference, approvals.", "Process", "Undefined methods create quantity disputes."),
    S("commercial", "Invoice Deduction Control", "Are contractual deductions correctly calculated and applied to each applicable subcontractor invoice?", "Invoice certificate, deduction calculation, contract terms.", "Commercial", "Incorrect deductions cause overpayment or disputes."),
    S("commercial", "Variation Register Reconciliation", "Are Technical Office variation records regularly reconciled with commercial and cost-control registers?", "Register reconciliation, discrepancy log, corrections.", "Interfaces", "Unreconciled registers create missing entitlement or exposure."),
    S("closeout", "Closeout Deficiency Control", "Are missing or rejected technical closeout deliverables tracked to verified closure?", "Deficiency register, owners, resubmission evidence.", "Closure", "Open deficiencies delay final handover."),
  ]
};

const questionRewrites = {
  "cost-control": {
    "Strategic Mandate": {
      answers: [
        "Cost Control has no approved mandate defining its role in protecting project margin, controlling cost, or supporting management decisions.",
        "An informal Cost Control mandate exists, but its responsibilities vary by project and depend on individual management expectations.",
        "An approved mandate defines Cost Control responsibilities for margin protection, cost optimization, and executive decision support, and it is applied on most projects.",
        "The approved mandate is communicated and applied across all projects, with Cost Control involved in the cost decisions and escalations assigned to it.",
        "The mandate is consistently embedded in project governance, and Cost Control involvement demonstrably influences margin protection and executive cost decisions across the portfolio."
      ]
    },
    "Cost Governance": {
      answers: [
        "Material cost issues are handled through informal discussions without defined decision rights, review forums, or escalation routes.",
        "Cost-governance reviews and escalations occur for selected high-risk projects, but responsibilities and response times vary.",
        "Defined cost-governance forums, authorities, and escalation routes are used for most material project cost issues.",
        "All material cost issues follow the approved governance and escalation route, with decisions, owners, and required actions recorded.",
        "Cost governance consistently produces decisions within the required timeframe, and resulting actions are completed without unresolved material escalation."
      ]
    },
    "Business Alignment": {
      answers: [
        "Cost Control objectives are set independently from project-delivery priorities, profitability requirements, and the approved business plan.",
        "Some Cost Control objectives refer to business priorities, but the connection is incomplete or not measurable.",
        "Most Cost Control objectives are linked to defined project-delivery, profitability, reporting, and business-plan priorities.",
        "All Cost Control objectives are linked to approved business priorities and supported by measurable targets and accountable owners.",
        "Achievement of Cost Control objectives is demonstrably reflected in portfolio profitability, delivery decisions, and executive reporting outcomes."
      ]
    },
    "Strategic Process Alignment": {
      answers: [
        "Cost Control processes operate without a documented connection to profitability, cash discipline, delivery performance, or risk-management objectives.",
        "Selected Cost Control processes support strategic objectives, but alignment varies by process or project.",
        "Most Cost Control processes identify the strategic objective they support and are applied accordingly on relevant projects.",
        "All core Cost Control processes are mapped to approved strategic objectives, with conflicting or non-value-adding activities corrected.",
        "Process performance demonstrates a sustained contribution to the strategic outcomes assigned to Cost Control."
      ]
    },
    "Role Clarity": {
      answers: [
        "Responsibilities between Cost Control and its interface functions are unclear, resulting in unowned inputs, reviews, or decisions.",
        "Responsibilities are understood for selected activities, but they vary by project or depend on personal working relationships.",
        "Documented responsibilities identify the owners of most Cost Control inputs, reviews, approvals, and outputs.",
        "Responsibilities and authorities are documented and applied across all relevant departments and projects, with overlaps or gaps formally resolved.",
        "All Cost Control interfaces operate with clear accountability, and responsibility disputes do not create unresolved reporting or decision delays."
      ]
    },
    "Cost Control Capability": {
      answers: [
        "The department does not have the demonstrated skills required to produce reliable cost insight, challenge forecasts, and support corrective action.",
        "The required capability exists in selected individuals or projects, but important activities remain dependent on limited expertise.",
        "Most Cost Control personnel demonstrate the competencies required for their assigned analysis, forecasting, reporting, and challenge responsibilities.",
        "All assigned Cost Control roles meet defined competency requirements, and identified skill gaps have active development or coverage plans.",
        "The department consistently provides reliable cost insight and effective challenge across the full portfolio without unresolved critical capability gaps."
      ]
    },
    "Review and Supervision": {
      answers: [
        "Cost Control outputs can be used for management decisions without a defined supervisory review.",
        "Supervisory review occurs for selected reports or high-risk projects, but the reviewer and review depth are inconsistent.",
        "Most material Cost Control outputs receive a documented supervisory review before management use.",
        "All material Cost Control outputs are reviewed by the required authority, with identified errors or concerns resolved before issue.",
        "Supervisory review consistently prevents material errors from reaching management and leaves no unresolved review exceptions."
      ]
    },
    "Resource Planning": {
      answers: [
        "Cost Control staffing is assigned without a documented assessment of project workload, reporting demand, or required support.",
        "Resource needs are reviewed when shortages become urgent, but allocation remains reactive and inconsistent.",
        "Resource requirements are assessed for most projects using expected workload, reporting cycles, and portfolio priorities.",
        "Department capacity is regularly matched to the complete project portfolio, with approved actions for identified shortages or imbalances.",
        "Resource planning consistently provides the required Cost Control coverage across the portfolio without unresolved critical capacity constraints."
      ]
    },
    "Tender Handover and CCOR": {
      answers: [
        "Projects can begin without a complete tender handover, approved commercial baseline, or confirmed Cost Control opening requirements.",
        "Tender information and baseline records are received for selected projects, but completeness and timing vary.",
        "Most new projects receive the required tender handover information and establish the approved commercial baseline before routine cost control begins.",
        "Every new project completes the required tender handover, baseline confirmation, and Cost Control opening records, with exceptions documented and resolved.",
        "No project enters routine cost control with an unresolved handover or commercial-baseline deficiency."
      ]
    },
    "Budget Breakdown": {
      answers: [
        "The approved budget is not broken down to a level that supports control by scope, resource, task, and responsible execution owner.",
        "Budget detail is available for selected major scopes, while other costs remain grouped at levels that cannot be effectively controlled.",
        "Most budget scope is broken down into controllable tasks and resources with traceability to the approved project baseline.",
        "The complete approved budget is mapped to controllable scope, tasks, resources, and responsible owners, with mapping differences resolved.",
        "The budget structure consistently supports reliable commitment control, forecasting, variance analysis, and management accountability across the full project scope."
      ]
    },
    "Interim Payment Control": {
      category: "Subcontract Quantity Validation",
      text: "Are subcontractor payment quantities validated against approved progress and supporting measurement records before payment approval?",
      answers: [
        "Payment quantities are not validated against approved progress and supporting measurement records.",
        "Payment quantities are validated in some cases, but the practice is inconsistent.",
        "Payment quantities are normally validated using a defined method before payment approval.",
        "Payment quantities are consistently validated for all applicable payments before approval.",
        "Quantity-validation results demonstrate that the control consistently prevents unsupported quantities from being approved."
      ]
    },
    "Executive Review Cycle": {
      answers: [
        "Monthly cost reports are submitted and signed, but no executive review of performance takes place.",
        "Reviews occur occasionally or only for problem projects, and rarely result in agreed actions.",
        "Monthly reviews examine cost performance for most projects and identify required corrective action.",
        "Every monthly review assigns corrective actions with named owners and due dates, and previous actions are revisited.",
        "Monthly reviews consistently drive corrective action to closure, with demonstrable impact on project cost performance."
      ]
    },
    "Monthly Input Calendar": {
      category: "Monthly Cost Report Coverage",
      text: "Are all projects covered by a monthly cost report?",
      evidence: "Monthly cost reports, active-project register, project-priority classification, EAC change log, and report issue records.",
      process: "Monthly cost-reporting cycle and project coverage requirements.",
      theme: "Reporting",
      impact: "Projects outside the monthly reporting cycle may develop cost exposure without timely management visibility.",
      answers: [
        "Monthly cost reports do not cover all priority projects.",
        "All priority projects are covered by a monthly cost report.",
        "All priority projects and selected other active projects are covered by a monthly cost report.",
        "All priority projects, selected other active projects, and every project with a changed EAC are covered in the relevant month.",
        "All active projects are covered by a cost report every month."
      ]
    }
  },
  // Answer-enhancement scaffolds. To override the auto-generated maturity answers for a
  // question, add an entry keyed by the question's `category`, e.g.:
  //   "Some Category": { answers: ["level 1", "level 2", "level 3", "level 4", "level 5"] },
  // `answers` must be exactly 5 non-empty strings (build enforces this). Categories left out
  // fall back to the generic answerAnchors() template. See archive/HANDOFF.md.
  "document-control": {
    "Policy Framework": {
      answers: [
        "No approved document-control procedures or standard forms exist; teams create their own formats as needed.",
        "Some procedures and forms are approved, but several are outdated and staff often work from uncontrolled local copies.",
        "A controlled set of current procedures, forms, logs, and templates is published and used on most projects.",
        "All required procedures and templates are current, approved, and accessible, and their use is verified with exceptions documented.",
        "The controlled framework is applied on every project, with revisions issued on time and no uncontrolled forms in use."
      ]
    },
    "Stakeholder Compliance": {
      answers: [
        "Documents reach Document Control through informal channels, and no one is held accountable for bypassing the process.",
        "Requirements are communicated to stakeholders, but non-compliance is tolerated and rarely followed up.",
        "Most submissions follow the approved channels, and repeated deviations are raised with the responsible party.",
        "Deviations from the required submission route are logged, escalated to the accountable manager, and corrected.",
        "Stakeholders consistently submit through approved channels, and the few deviations that occur are resolved without recurrence."
      ]
    },
    "Status Classification": {
      answers: [
        "Document purpose and issue status are not recorded, so recipients cannot tell whether a document is for review, information, or construction.",
        "Status codes exist but are applied inconsistently, and misclassified documents are found regularly.",
        "Defined status codes such as IFA and IFC are applied correctly to most documents and recorded in the register.",
        "Every issued document carries a verified purpose and status code, with misclassifications corrected before distribution.",
        "Status classification is consistently accurate across all transmittals, and no document is worked to under an incorrect issue status."
      ]
    }
  },
  "planning-controlling": {
    "Department Capacity and Planner Assignment": {
      answers: [
        "Planners are assigned as requests arrive, with no assessment of existing workload or incoming project demand.",
        "Workload is considered informally when a shortage becomes urgent, but assignments remain reactive.",
        "Planning capacity is assessed against current and forecast project demand before most assignment decisions.",
        "A maintained workload model supports all planner assignment, hiring, and reallocation decisions, with shortfalls formally raised.",
        "Planning capacity consistently matches portfolio demand, and no project is left without adequate planning support."
      ]
    },
    "Tender Input and Assumption Control": {
      answers: [
        "Tender schedules are developed without a structured review of scope, BOQ, drawings, or the basis of estimate.",
        "Key tender documents are reviewed informally, but assumptions and missing information are not recorded.",
        "A tender input review covers scope, BOQ, drawings, and productivity data, and the main assumptions are recorded.",
        "All tender inputs are reviewed against a checklist before schedule development, with assumptions, exclusions, and missing information formally logged.",
        "Every tender schedule is traceable to a complete, recorded set of reviewed inputs and assumptions, with no unrecorded gaps at submission."
      ]
    }
  },
  "project-procurement": {
    "Resource Allocation": {
      answers: [
        "Procurement staff are allocated without reference to project workload or the risk profile of the packages involved.",
        "Allocation responds to immediate pressure, so high-risk packages are sometimes handled with insufficient support.",
        "Workload and procurement risk inform resource allocation across most projects.",
        "A maintained resource plan matches department capacity to project workload and package risk, with gaps formally addressed.",
        "Resourcing consistently matches workload and risk across the portfolio, with no critical package left under-supported."
      ]
    },
    "Procurement Requirements Register": {
      answers: [
        "Procurement requirements are held in scattered emails and personal lists with no central register.",
        "A register exists but is incomplete, and entries cannot always be traced to an approved source document.",
        "Most procurement requirements are captured in the register and traceable to their source documents.",
        "The register captures every project requirement with full revision history and traceability to approved sources.",
        "The register is consistently complete and current, and no procurement proceeds against an unregistered requirement."
      ]
    }
  },
  "technical-office": {
    "Roles and Authority": {
      answers: [
        "Responsibilities and decision authorities between Technical Office and the interfacing functions are undefined.",
        "Roles are understood for some activities but vary by project, leaving overlaps and unowned decisions.",
        "An approved RACI assigns responsibilities and authorities across most interfacing functions.",
        "Responsibilities and decision authorities are documented and applied across all listed functions, with overlaps and gaps formally resolved.",
        "Every interface operates with clear, agreed accountability, and role disputes do not delay technical decisions."
      ]
    },
    "Tender Handover": {
      answers: [
        "Technical Office begins work without a formal handover of tender and contract information.",
        "Handover happens for some projects, but the information received is incomplete and is not verified.",
        "Technical Office receives the required tender and contract documents at handover on most projects.",
        "Every handover delivers the required scope, contract, BOQ, specification, and schedule information, and Technical Office verifies it against the contract.",
        "No project starts with an unresolved handover deficiency, and verified tender information is available from day one."
      ]
    }
  }
};

function slug(value) {
  return value.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function answerAnchors(question) {
  const control = question.category;
  const source = `${question.category} ${question.text}`.toLowerCase();
  const patterns = [
    ["timeliness", /timely|timeframe|within|frequency|calendar|due date|cut-off|prompt|overdue|monthly|weekly|daily|delay|date control/],
    ["authorization", /approv|authori[sz]|decision right|release|sign-off|acceptance|escalat/],
    ["accuracy", /accura|validat|verif|reconcil|correct|reliable|quality|forecast|calculation|quantity|data integrity/],
    ["traceability", /trace|record|register|document|archive|filing|retention|audit trail|version|correspondence|coding|numbering/],
    ["closure", /follow-up|follow up|closure|closed|resolve|corrective|recovery|return monitoring|deficien|action ownership/],
    ["alignment", /align|integrat|interface|mapping|linked|handover|coordination|communication/],
    ["capability", /competen|training|capacity|resource allocation|staffing|workload|knowledge|supervision/],
    ["risk", /risk|contingency|exposure|exception/],
    ["coverage", /\ball\b|coverage|scope|completeness|complete|participat|available|assigned|requirement|readiness/]
  ];
  const dimension = (patterns.find(([, pattern]) => pattern.test(source)) || ["application"])[0];
  const byDimension = {
    coverage: [
      `The “${control}” requirement does not cover all required cases.`,
      `The “${control}” requirement covers only the highest-priority cases.`,
      `The “${control}” requirement covers most applicable cases using defined selection criteria.`,
      `The “${control}” requirement covers all applicable cases except documented exceptions.`,
      `The “${control}” requirement covers every applicable case with no unresolved coverage gaps.`
    ],
    timeliness: [
      `The required timeframe for “${control}” is not consistently recognized or followed.`,
      `“${control}” is completed on time only for selected or urgent cases.`,
      `“${control}” is completed within the required timeframe for most applicable cases.`,
      `“${control}” meets the required timeframe for all applicable cases except documented exceptions.`,
      `“${control}” consistently meets the required timeframe with no unresolved overdue cases.`
    ],
    authorization: [
      `“${control}” can proceed without the required authorization.`,
      `The required authorization for “${control}” is obtained only in selected cases.`,
      `The required authorization for “${control}” is obtained for most applicable cases.`,
      `“${control}” does not proceed without the required authorization, except through documented approved exceptions.`,
      `“${control}” is consistently prevented from proceeding whenever the required authorization is missing.`
    ],
    accuracy: [
      `The result of “${control}” is not reliably checked against its approved source or basis.`,
      `The result of “${control}” is checked only for selected or high-risk cases.`,
      `The result of “${control}” is checked against its approved source for most applicable cases.`,
      `The result of “${control}” is checked for all applicable cases, with identified differences resolved or documented.`,
      `“${control}” consistently produces reliable results with no unresolved material differences.`
    ],
    traceability: [
      `A complete and retrievable record of “${control}” is not maintained.`,
      `Records for “${control}” exist for selected cases but are incomplete or difficult to retrieve.`,
      `Records for “${control}” are complete and retrievable for most applicable cases.`,
      `Records for “${control}” are complete, current, and retrievable for all applicable cases except documented exceptions.`,
      `Every applicable “${control}” record is complete and can be traced without unresolved gaps.`
    ],
    closure: [
      `Items arising from “${control}” are not consistently assigned or followed to closure.`,
      `Only urgent items arising from “${control}” are actively followed to closure.`,
      `Most items arising from “${control}” have an owner and are followed to closure.`,
      `All items arising from “${control}” are assigned and followed to closure, with overdue exceptions documented.`,
      `All items arising from “${control}” are closed within their required dates with no unresolved overdue actions.`
    ],
    alignment: [
      `“${control}” is performed separately from the related functions or information it depends on.`,
      `“${control}” is coordinated with related functions only for selected or urgent cases.`,
      `“${control}” is coordinated with the required functions and information for most applicable cases.`,
      `“${control}” is coordinated across all required functions, with differences identified and resolved.`,
      `“${control}” remains fully aligned across the required functions with no unresolved interface differences.`
    ],
    capability: [
      `The resources or capability required for “${control}” are not defined or reliably available.`,
      `The resources or capability required for “${control}” are available only for selected priorities.`,
      `The required resources and capability support most applicable “${control}” work.`,
      `The required resources and capability support all applicable “${control}” work except documented constraints.`,
      `The required resources and capability consistently support the full “${control}” workload without unresolved constraints.`
    ],
    risk: [
      `Risks related to “${control}” are not consistently identified or addressed.`,
      `Only immediate or high-impact risks related to “${control}” are addressed.`,
      `Most material risks related to “${control}” are identified and assigned for treatment.`,
      `All material risks related to “${control}” are identified, assigned, and monitored, with exceptions documented.`,
      `All material risks related to “${control}” remain within approved exposure limits with no unresolved treatment actions.`
    ],
    application: [
      `The required “${control}” practice is not performed for applicable work.`,
      `The required “${control}” practice is performed only for selected or urgent cases.`,
      `The required “${control}” practice is performed for most applicable cases.`,
      `The required “${control}” practice is performed for all applicable cases except documented exceptions.`,
      `The required “${control}” practice is consistently fulfilled with no unresolved exceptions.`
    ]
  };
  question.answerDimension = dimension;
  return byDimension[dimension];
}

function finalizeDepartment(department) {
  const additions = supplements[department.id] || [];
  const questions = [...department.questions, ...additions];
  const rewrites = questionRewrites[department.id] || {};
  questions.forEach(question => {
    const rewrite = rewrites[question.category];
    if (rewrite) Object.assign(question, rewrite);
  });
  if (questions.length !== 60) throw new Error(`${department.name} has ${questions.length} questions, expected 60`);
  const counts = Object.fromEntries(department.domains.map(d => [d.id, questions.filter(q => q.domain === d.id).length]));
  const usedIds = new Set();
  questions.forEach((question, index) => {
    const base = `${department.id}-${slug(question.category)}`;
    let id = base;
    let suffix = 2;
    while (usedIds.has(id)) id = `${base}-${suffix++}`;
    usedIds.add(id);
    question.id = id;
    question.weight = Number((100 / counts[question.domain]).toFixed(6));
    question.answers = question.answers || answerAnchors(question);
    question.number = index + 1;
  });
  if (usedIds.size !== 60) throw new Error(`${department.name} question IDs are not unique`);
  if (questions.some(question => !Array.isArray(question.answers) || question.answers.length !== 5 || question.answers.some(answer => !String(answer).trim()))) {
    throw new Error(`${department.name} has an incomplete customized answer set`);
  }
  department.domains.forEach(domain => {
    const total = questions.filter(question => question.domain === domain.id).reduce((sum, question) => sum + question.weight, 0);
    if (Math.abs(total - 100) > 0.001) throw new Error(`${department.name} / ${domain.name} question weights total ${total}`);
  });
  return {
    id: department.id,
    name: department.name,
    legacyStorageKey: department.legacyStorageKey,
    schemaVersion: "3.0",
    domains: department.domains,
    questions
  };
}

const departments = Object.fromEntries(sourceFiles.map(parseAssessment).map(finalizeDepartment).map(d => [d.id, d]));
const basePath = path.join(root, sourceFiles[0].file);
let html = fs.readFileSync(basePath, "utf8").replace(/\r\n/g, "\n");

const portalCss = `
    .portal { min-height: 100vh; padding: 30px 36px 48px; background:linear-gradient(180deg,#edf2fb 0,#f7f9fc 46%,#eef2f8 100%); }
    .portal[hidden], .app[hidden] { display: none !important; }
    .portal-shell { max-width: 1500px; margin: 0 auto; }
    .portal-hero { position:relative; overflow:hidden; border-radius:28px; padding:30px 34px; color:#fff; background:linear-gradient(125deg,#001559 0%,#082987 62%,#0031eb 135%); box-shadow:0 22px 55px rgba(0,21,89,.22); }
    .portal-hero:after { content:""; position:absolute; width:420px; height:420px; right:-150px; top:-250px; border-radius:50%; border:70px solid rgba(255,255,255,.08); }
    .portal-header { position:relative; z-index:1; display:flex; justify-content:space-between; gap:32px; align-items:center; }
    .portal-brand { display:flex; align-items:center; gap:22px; }
    .portal-brand-mark { width:70px; height:70px; display:grid; place-items:center; border:1px solid rgba(255,255,255,.24); background:rgba(255,255,255,.1); border-radius:19px; }
    .portal-brand-mark img { width:54px; height:auto; }
    .portal-eyebrow { margin:0 0 6px; color:#b9c9ff; font-size:11px; font-weight:800; letter-spacing:.15em; text-transform:uppercase; }
    .portal-header h1 { color:#fff; font-size:34px; margin:0 0 7px; letter-spacing:-.025em; }
    .portal-header p { color:#d9e2ff; margin:0; max-width:710px; }
    .portal-actions-label { display:block; margin-bottom:8px; color:#b9c9ff; font-size:10px; font-weight:800; text-align:right; letter-spacing:.1em; text-transform:uppercase; }
    .portal-actions { display:flex; flex-wrap:wrap; gap:8px; justify-content:flex-end; max-width:520px; }
    .portal-actions .btn { color:#fff; border-color:rgba(255,255,255,.28); background:rgba(255,255,255,.1); }
    .portal-actions .btn:hover { background:rgba(255,255,255,.18); }
    .portal-actions .primary { color:var(--brand-navy) !important; background:#fff; border-color:#fff; }
    .portfolio-summary { position:relative; z-index:1; display:grid; grid-template-columns:1.25fr repeat(3,1fr); gap:1px; margin-top:28px; overflow:hidden; border:1px solid rgba(255,255,255,.18); border-radius:17px; background:rgba(255,255,255,.16); }
    .portfolio-summary-item { padding:15px 18px; background:rgba(0,10,55,.22); }
    .portfolio-summary-item span { display:block; color:#b9c9ff; font-size:10px; font-weight:800; letter-spacing:.08em; text-transform:uppercase; }
    .portfolio-summary-item strong { display:block; margin-top:5px; color:#fff; font-size:21px; }
    .portfolio-progress { height:7px; margin-top:10px; overflow:hidden; border-radius:999px; background:rgba(255,255,255,.16); }
    .portfolio-progress span { display:block; height:100%; border-radius:999px; background:linear-gradient(90deg,#fff,#85a5ff); }
    .portal-section-head { display:flex; align-items:end; justify-content:space-between; gap:20px; margin:30px 2px 17px; }
    .portal-section-head h2 { margin:0 0 5px; color:var(--brand-navy); font-size:23px; }
    .portal-section-head p { margin:0; color:var(--muted); }
    .portal-legend { display:flex; align-items:center; gap:15px; color:var(--muted); font-size:11px; font-weight:700; }
    .portal-legend span:before { content:""; display:inline-block; width:7px; height:7px; margin-right:6px; border-radius:50%; background:#cbd5e1; }
    .portal-legend .active:before { background:var(--blue); }
    .portal-legend .complete:before { background:var(--green); }
    .department-grid { display:grid; grid-template-columns:repeat(6,minmax(0,1fr)); gap:18px; }
    .department-card { position:relative; grid-column:span 2; min-height:260px; border:1px solid #d9e2f0; border-radius:23px; background:#fff; padding:22px; box-shadow:0 13px 30px rgba(0,21,89,.075); cursor:pointer; text-align:left; transition:.22s ease; }
    .department-card:nth-last-child(2) { grid-column:2 / span 2; }
    .department-card:nth-last-child(1) { grid-column:4 / span 2; }
    .department-card:before { content:""; position:absolute; inset:0 auto 0 0; width:5px; border-radius:23px 0 0 23px; background:var(--department-accent,#0031eb); }
    .department-card:hover { transform:translateY(-4px); border-color:#9eb3ff; box-shadow:0 20px 44px rgba(0,49,235,.14); }
    .department-card-top { display:flex; justify-content:space-between; gap:14px; align-items:flex-start; }
    .department-heading { display:flex; align-items:center; gap:12px; }
    .department-index { width:39px; height:39px; display:grid; place-items:center; flex:0 0 auto; border-radius:12px; color:var(--department-accent,#0031eb); background:color-mix(in srgb,var(--department-accent,#0031eb) 10%,white); font-size:12px; font-weight:900; }
    .department-card h2 { color:var(--brand-navy); font-size:19px; line-height:1.25; margin:0; }
    .department-card small { display:block; margin-top:3px; color:var(--muted); font-size:11px; }
    .department-status { font-size:10px; font-weight:800; color:var(--blue); background:#edf2ff; border-radius:999px; padding:6px 9px; white-space:nowrap; }
    .department-status.complete { color:#08784b; background:#e6f7ef; }
    .department-progress-label { display:flex; justify-content:space-between; margin-top:25px; color:var(--muted); font-size:11px; font-weight:700; }
    .department-progress-label strong { color:var(--brand-navy); }
    .department-progress { height:8px; background:#edf1f7; border-radius:999px; overflow:hidden; margin:8px 0 17px; }
    .department-progress span { display:block; height:100%; background:linear-gradient(90deg,var(--department-accent,#0031eb),#7390ff); }
    .department-metrics { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; }
    .department-metrics div { border:1px solid #edf1f6; background:#f8fafd; padding:10px; border-radius:12px; }
    .department-metrics span { display:block; font-size:10px; color:var(--muted); text-transform:uppercase; font-weight:800; }
    .department-metrics strong { display:block; color:var(--brand-navy); margin-top:4px; font-size:15px; }
    .department-card-footer { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-top:15px; }
    .department-updated { color:var(--muted); font-size:10px; }
    .department-open { color:var(--department-accent,#0031eb); font-size:11px; font-weight:900; white-space:nowrap; }
    @media(max-width:1100px){.department-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.department-card,.department-card:nth-last-child(2),.department-card:nth-last-child(1){grid-column:auto}.portal-header{align-items:flex-start}.portfolio-summary{grid-template-columns:repeat(2,1fr)}}
    @media(max-width:760px){.portal{padding:16px}.portal-hero{padding:22px}.portal-header{display:block}.portal-brand{align-items:flex-start}.portal-brand-mark{display:none}.portal-actions-label{text-align:left;margin-top:22px}.portal-actions{justify-content:flex-start}.portfolio-summary{grid-template-columns:1fr 1fr}.department-grid{grid-template-columns:1fr}.portal-section-head{display:block}.portal-legend{margin-top:12px}.department-metrics{grid-template-columns:repeat(3,1fr)}}
    /* Final home composition: portfolio panel left, department workspace right */
    .portal { padding:24px; }
    .portal-shell { max-width:1560px; display:grid; grid-template-columns:minmax(330px, .36fr) minmax(650px, 1fr); gap:26px; align-items:start; }
    .portal-hero { position:sticky; top:24px; min-height:calc(100vh / var(--app-scale) - 48px); padding:34px 30px; display:flex; flex-direction:column; }
    .portal-header { display:block; }
    .portal-brand { align-items:flex-start; }
    .portal-brand-mark { flex:0 0 auto; }
    .portal-header h1 { font-size:31px; line-height:1.12; }
    .portal-header > div:last-child { margin-top:34px; }
    .portal-actions-label { text-align:left; }
    .portal-actions { display:grid; grid-template-columns:1fr 1fr; max-width:none; justify-content:stretch; }
    .portal-actions .btn { width:100%; min-height:43px; }
    .portfolio-summary { margin-top:auto; grid-template-columns:1fr 1fr; }
    .portfolio-summary-item:first-child { grid-column:1 / -1; }
    .portal-main { min-width:0; padding:10px 0 40px; }
    .portal-section-head { margin:0 2px 20px; align-items:center; }
    .department-grid { grid-template-columns:repeat(2,minmax(0,1fr)); gap:18px; }
    .department-card,.department-card:nth-last-child(2),.department-card:nth-last-child(1) { grid-column:auto; min-height:263px; }
    .department-card:last-child { grid-column:1 / -1; width:calc(50% - 9px); justify-self:center; }
    .back-home-btn { display:inline-flex; align-items:center; gap:7px; margin:0 0 10px; padding:7px 12px; border:1px solid var(--line); border-radius:999px; background:#fff; color:var(--brand-navy); font-size:12px; font-weight:800; cursor:pointer; }
    .back-home-btn:hover { border-color:#9eb3ff; color:var(--blue); background:var(--brand-ice); }
    .answer-title { display:inline-grid !important; place-items:center; width:30px; height:30px; margin-right:11px; border-radius:50%; background:var(--brand-ice); color:var(--blue); font-weight:900; flex:0 0 auto; }
    .answer > span { display:flex; align-items:flex-start; }
    .answer-desc { padding-top:4px; }
    @media(max-width:1100px){
      .portal-shell{grid-template-columns:1fr}.portal-hero{position:relative;top:auto;min-height:auto}.portal-header{display:flex}.portal-header>div:last-child{margin-top:0}.portfolio-summary{margin-top:26px;grid-template-columns:repeat(4,1fr)}.portfolio-summary-item:first-child{grid-column:auto}.portal-main{padding-top:0}.department-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
    }
    @media(max-width:760px){
      .portal{padding:14px}.portal-hero{padding:22px}.portal-header{display:block}.portal-header>div:last-child{margin-top:24px}.portfolio-summary{grid-template-columns:1fr 1fr}.portfolio-summary-item:first-child{grid-column:1/-1}.department-grid{grid-template-columns:1fr}.department-card:last-child{grid-column:auto;width:auto}.portal-actions{grid-template-columns:1fr 1fr}
    }
    /* Compact approved home layout */
    .portal-shell { grid-template-columns:300px minmax(0,1fr); gap:28px; }
    .portal-hero { min-height:0; height:auto; padding:25px 22px; border-radius:24px; }
    .portal-hero:after { width:310px; height:310px; right:-145px; top:-175px; border-width:48px; }
    .portal-brand { gap:13px; }
    .portal-brand-mark { width:50px; height:50px; border-radius:15px; }
    .portal-eyebrow { font-size:8px; letter-spacing:.12em; }
    .portal-header h1 { font-size:25px; line-height:1.08; margin-bottom:7px; }
    .portal-header p { font-size:11px; line-height:1.5; }
    .portal-header > div:last-child { margin-top:24px; }
    .portal-actions-label { margin-bottom:7px; font-size:8px; }
    .portal-actions { gap:7px; }
    .portal-actions .btn { min-height:36px; padding:7px 8px; font-size:10px; }
    .portfolio-summary { margin-top:22px; grid-template-columns:1fr 1fr; border-radius:14px; }
    .portfolio-summary-item { padding:11px 12px; }
    .portfolio-summary-item:first-child { grid-column:1 / -1; }
    .portfolio-summary-item span { font-size:8px; }
    .portfolio-summary-item strong { margin-top:3px; font-size:16px; }
    .portfolio-progress { height:5px; margin-top:7px; }
    .portal-main { padding-top:4px; }
    .portal-section-head { margin-bottom:17px; }
    .portal-section-head h2 { font-size:25px; }
    .portal-section-head p { font-size:12px; }
    .department-grid { grid-template-columns:repeat(3,minmax(0,1fr)); gap:16px; }
    .department-card,.department-card:nth-last-child(2),.department-card:nth-last-child(1),.department-card:last-child { grid-column:auto; width:auto; min-height:245px; justify-self:stretch; padding:20px; }
    .department-card h2 { font-size:17px; }
    .department-heading { gap:10px; }
    .department-index { width:35px; height:35px; }
    .department-progress-label { margin-top:21px; }
    @media(max-width:1350px){
      .portal-shell{grid-template-columns:280px minmax(0,1fr)}.department-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
    }
    @media(max-width:960px){
      .portal-shell{grid-template-columns:1fr}.portal-hero{position:relative;top:auto}.portal-header{display:flex}.portal-header>div:last-child{margin-top:0}.portfolio-summary{grid-template-columns:repeat(4,1fr)}.portfolio-summary-item:first-child{grid-column:auto}.department-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
    }
    @media(max-width:650px){
      .portal-header{display:block}.portal-header>div:last-child{margin-top:20px}.portfolio-summary{grid-template-columns:1fr 1fr}.portfolio-summary-item:first-child{grid-column:1/-1}.department-grid{grid-template-columns:1fr}
    }
    /* Clarity pass: one home action, compact cards, readable assessment answers */
    .portal-export-menu { position:relative; }
    .portal-export-menu summary { list-style:none; width:100%; padding:10px 14px; border:1px solid rgba(255,255,255,.35); border-radius:999px; background:#fff; color:var(--brand-navy); text-align:center; font-size:11px; font-weight:900; cursor:pointer; }
    .portal-export-menu summary::-webkit-details-marker { display:none; }
    .portal-export-menu summary:after { content:" ▾"; }
    .portal-export-menu[open] summary:after { content:" ▴"; }
    .portal-export-options { display:grid; gap:6px; margin-top:8px; padding:8px; border:1px solid rgba(255,255,255,.22); border-radius:14px; background:rgba(0,15,61,.45); }
    .portal-export-options .btn { width:100%; min-height:34px; padding:7px 9px; font-size:10px; }
    .portfolio-summary { grid-template-columns:1fr; }
    .portfolio-summary-item:first-child { grid-column:auto; }
    .department-card,.department-card:nth-last-child(2),.department-card:nth-last-child(1),.department-card:last-child { min-height:180px; }
    .department-progress-label { margin-top:18px; }
    .department-card-footer { margin-top:14px; padding-top:12px; border-top:1px solid #edf1f6; }
    .department-answer-count { color:var(--brand-navy); font-size:11px; font-weight:800; }
    .department-saved { display:block; margin-top:4px; color:var(--muted); font-size:9px; font-weight:500; }
    .answer-desc { color:#243653 !important; font-size:15px !important; font-weight:600 !important; line-height:1.55 !important; }
    .answer { border-color:#ccd7e8 !important; background:#fff !important; }
    .answer:hover { border-color:#8ea7d8 !important; background:#f8faff !important; }
    .answer.selected { border-color:var(--blue) !important; background:#eef3ff !important; box-shadow:0 0 0 2px rgba(0,49,235,.08); }
    /* Home layout: compact content-height left brand card + 3-per-row cards (last two centered) */
    .portal-shell { grid-template-columns:320px minmax(0,1fr); gap:26px; align-items:start; }
    .portal-hero { min-height:0; height:auto; position:sticky; top:24px; display:block; padding:24px 22px; }
    .portal-header { display:block; }
    .portal-brand { display:block; }
    .portal-brand-mark { display:inline-flex; width:auto; height:auto; min-width:0; padding:9px 13px; border-radius:12px; background:rgba(255,255,255,.1); }
    .portal-brand-mark img { width:100%; max-width:170px; height:auto; display:block; }
    .portal-header > div:last-child { margin-top:16px; }
    .portal-header h1 { font-size:22px; line-height:1.15; margin:0 0 7px; }
    .portal-header p { font-size:12px; line-height:1.5; max-width:none; }
    .portal-hero-divider { height:1px; margin:18px 0; background:rgba(255,255,255,.16); }
    .portfolio-summary { display:grid; grid-template-columns:1fr; gap:1px; margin-top:0; }
    .portfolio-summary-item:first-child { grid-column:auto; }
    .portal-hero-actions { margin-top:18px; }
    .portal-actions-label { text-align:left; margin-bottom:8px; }
    .portal-export-menu summary { width:100%; box-sizing:border-box; }
    .department-grid { grid-template-columns:repeat(6,minmax(0,1fr)); gap:18px; }
    .department-card, .department-card:last-child { grid-column:span 2; width:auto; justify-self:stretch; min-height:0; }
    .department-card:nth-last-child(2) { grid-column:2 / span 2; }
    .department-card:nth-last-child(1) { grid-column:4 / span 2; }
    @media(max-width:1100px){
      .portal-shell{grid-template-columns:1fr}
      .portal-hero{position:static}
      .department-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
      .department-card,.department-card:nth-last-child(2),.department-card:nth-last-child(1),.department-card:last-child{grid-column:auto}
    }
    @media(max-width:650px){
      .department-grid{grid-template-columns:1fr}
      .department-card,.department-card:nth-last-child(2),.department-card:nth-last-child(1),.department-card:last-child{grid-column:auto}
    }
    /* Back to Home: solid navy, sits inline beside the page title */
    .topbar-title-row { display:flex; align-items:center; gap:14px; flex-wrap:wrap; margin-bottom:4px; }
    .topbar-title-row h2 { margin:0; }
    .back-home-btn { display:inline-flex; align-items:center; justify-content:center; gap:8px; flex:0 0 auto; margin:0; padding:9px 15px; border:none; border-radius:999px; background:var(--brand-navy); color:#fff; font-size:12.5px; font-weight:800; letter-spacing:.01em; white-space:nowrap; cursor:pointer; transition:.18s ease; }
    .back-home-btn svg { width:16px; height:16px; stroke-width:2.4; flex:0 0 auto; }
    .back-home-btn:hover { background:var(--blue); color:#fff; transform:translateX(-2px); }
    .back-home-btn:focus-visible { outline:2px solid var(--blue); outline-offset:2px; }
    /* Portfolio Overview entry button (home) and its page header */
    .overview-open-btn { display:flex; align-items:center; gap:15px; width:100%; margin:0 0 22px; padding:16px 20px; border:1px solid #cfdcf1; border-radius:16px; background:linear-gradient(120deg,#f4f8ff 0%,#eef3ff 100%); text-align:left; cursor:pointer; transition:.2s ease; }
    .overview-open-btn:hover { border-color:#9eb3ff; background:linear-gradient(120deg,#eaf1ff 0%,#e2ebff 100%); transform:translateY(-2px); box-shadow:0 14px 30px rgba(0,49,235,.12); }
    .overview-open-icon { display:grid; place-items:center; width:42px; height:42px; flex:0 0 auto; border-radius:12px; background:var(--brand-navy); color:#fff; }
    .overview-open-icon svg { width:20px; height:20px; }
    .overview-open-text { flex:1 1 auto; min-width:0; }
    .overview-open-text strong { display:block; color:var(--brand-navy); font-size:15px; }
    .overview-open-text small { display:block; margin-top:2px; color:var(--muted); font-size:11.5px; }
    .overview-open-arrow { color:var(--blue); font-size:17px; font-weight:900; flex:0 0 auto; }
    .overview-back-btn { display:inline-flex; align-items:center; gap:8px; margin:0 0 16px; padding:9px 15px; border:none; border-radius:999px; background:var(--brand-navy); color:#fff; font-size:12.5px; font-weight:800; cursor:pointer; transition:.18s ease; }
    .overview-back-btn svg { width:16px; height:16px; stroke-width:2.4; }
    .overview-back-btn:hover { background:var(--blue); transform:translateX(-2px); }
    /* Combined portfolio dashboard */
    .portfolio-dashboard { margin-bottom:34px; }
    .pf-empty { margin:0; padding:26px; border:1px dashed #c9d6ea; border-radius:14px; background:#fff; color:var(--muted); font-size:13px; text-align:center; }
    .pf-kpis { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:14px; margin-bottom:16px; }
    .pf-kpi { padding:15px 17px; border:1px solid #dbe3f2; border-radius:14px; background:#fff; box-shadow:0 8px 20px rgba(0,21,89,.05); }
    .pf-kpi span { display:block; color:var(--muted); font-size:10px; font-weight:800; letter-spacing:.07em; text-transform:uppercase; }
    .pf-kpi strong { display:block; margin-top:6px; color:var(--brand-navy); font-size:23px; letter-spacing:-.02em; }
    .pf-kpi em { display:block; margin-top:3px; color:var(--muted); font-size:11px; font-style:normal; }
    .pf-panels { display:grid; grid-template-columns:1.35fr 1fr; gap:16px; margin-bottom:16px; }
    .pf-panel { padding:18px 20px; border:1px solid #dbe3f2; border-radius:16px; background:#fff; box-shadow:0 8px 20px rgba(0,21,89,.05); }
    .pf-panel h3 { margin:0 0 14px; color:var(--brand-navy); font-size:14px; font-weight:800; }
    .pf-panel .chart-row { grid-template-columns:150px 1fr 44px; margin:9px 0; font-size:12px; }
    .pf-panel .chart-label { font-size:12px; }
    .pf-panel .chart-fill { height:15px; }
    .pf-donut-wrap { display:flex; align-items:center; gap:18px; flex-wrap:wrap; }
    .pf-gaps { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; }
    .pf-gap { padding:13px 15px; border:1px solid #e6ecf6; border-left:3px solid var(--blue); border-radius:0 11px 11px 0; background:#f9fbfe; }
    .pf-gap-head { display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:6px; }
    .pf-gap-head strong { color:var(--brand-navy); font-size:13px; }
    .pf-gap p { margin:0 0 8px; color:#41536e; font-size:12px; line-height:1.5; }
    .pf-gap-meta { display:flex; justify-content:space-between; gap:10px; color:var(--muted); font-size:10.5px; font-weight:700; }
    .pf-note { margin:0; color:var(--muted); font-size:12.5px; }
    @media(max-width:1100px){
      .pf-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}
      .pf-panels{grid-template-columns:1fr}
      .pf-gaps{grid-template-columns:1fr}
    }
    @media(max-width:650px){
      .pf-kpis{grid-template-columns:1fr}
      .pf-panel .chart-row{grid-template-columns:110px 1fr 40px}
    }
`;
html = html.replace("  </style>", `${portalCss}  </style>`);
html = html.replace(/<title>.*?<\/title>/, "<title>Madkour Department Assessment Portal</title>");

const portalHtml = `
  <section class="portal" id="departmentPortal">
    <div class="portal-shell">
      <div class="portal-hero">
        <div class="portal-header">
          <div class="portal-brand">
            <div class="portal-brand-mark"><img alt="Madkour" id="portalBrandImg"></div>
            <div><div class="portal-eyebrow">Madkour · Operational Excellence</div><h1>Department Assessment Portal</h1><p>One structured workspace for department maturity, evidence, gaps, and improvement roadmaps.</p></div>
          </div>
        </div>
        <div class="portal-hero-divider"></div>
        <div class="portfolio-summary">
          <div class="portfolio-summary-item"><span>Portfolio completion</span><strong id="portfolioCompletion">0%</strong><div class="portfolio-progress"><span id="portfolioProgressBar"></span></div></div>
          <div class="portfolio-summary-item"><span>Total progress</span><strong id="portfolioAnswered">0 / 300</strong></div>
        </div>
        <div class="portal-hero-actions">
          <span class="portal-actions-label">Portfolio controls</span>
          <details class="portal-export-menu">
            <summary>Export All</summary>
            <div class="portal-export-options">
              <button class="btn" id="exportAllCsvBtn">Export Data</button>
              <button class="btn" id="exportAllReportBtn">Management Report</button>
              <button class="btn" id="exportAllJsonBtn">Backup All</button>
              <button class="btn" id="loadAllJsonBtn">Restore</button>
            </div>
            <input id="allJsonFile" type="file" accept="application/json,.json" hidden>
          </details>
        </div>
      </div>
      <div class="portal-main">
        <div id="portalOverviewView" hidden>
          <button class="overview-back-btn" id="overviewBackBtn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M19 12H5"></path><path d="m12 19-7-7 7-7"></path></svg><span>Back to Home</span></button>
          <div class="portal-section-head">
            <div><h2>Portfolio Overview</h2><p>Combined assessment performance across all departments.</p></div>
          </div>
          <p class="pf-empty" id="portfolioEmpty" hidden>No assessment data yet. Open a department and answer its questions to build the portfolio overview.</p>
          <div id="portfolioBody" hidden>
            <div class="pf-kpis">
              <div class="pf-kpi"><span>Portfolio maturity</span><strong id="pfMaturity">0.00 / 5</strong></div>
              <div class="pf-kpi"><span>Assessment score</span><strong id="pfScore">0%</strong></div>
              <div class="pf-kpi"><span>Completion</span><strong id="pfCompletion">0%</strong><em id="pfCoverage">0 / 300 answered</em></div>
              <div class="pf-kpi"><span>Critical + major gaps</span><strong id="pfCritical">0</strong></div>
            </div>
            <div class="pf-panels">
              <div class="pf-panel">
                <h3>Maturity by department</h3>
                <div id="pfDeptChart"></div>
              </div>
              <div class="pf-panel">
                <h3>Severity mix</h3>
                <div class="pf-donut-wrap">
                  <div class="donut" id="pfSeverityDonut"></div>
                  <div class="legend" id="pfSeverityLegend"></div>
                </div>
              </div>
            </div>
            <div class="pf-panel">
              <h3>Top gaps across all departments</h3>
              <div class="pf-gaps" id="pfTopGaps"></div>
            </div>
          </div>
        </div>
        <div id="portalHomeView">
          <button class="overview-open-btn" id="openOverviewBtn">
            <span class="overview-open-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M4 13h6V4H4v9z"></path><path d="M14 20h6V4h-6v16z"></path><path d="M4 20h6v-3H4v3z"></path></svg></span>
            <span class="overview-open-text"><strong>Portfolio Overview</strong><small>Combined performance across all departments</small></span>
            <span class="overview-open-arrow" aria-hidden="true">→</span>
          </button>
          <div class="portal-section-head">
            <div><h2>Choose a Department</h2><p>Open an assessment or continue saved progress.</p></div>
            <div class="portal-legend"><span>Not started</span><span class="active">In progress</span><span class="complete">Complete</span></div>
          </div>
          <div class="department-grid" id="departmentGrid"></div>
        </div>
      </div>
    </div>
  </section>
`;
html = html.replace("<body>\n  <div class=\"app\">", `<body>\n${portalHtml}  <div class="app" id="assessmentApp" hidden>`);
html = html.replace("<p>Cost Control Department</p>", '<p id="sidebarDepartmentName">Department</p>');
html = html.replace("<h2>Cost Control Department Assessment Tool</h2>", '<div class="topbar-title-row"><button class="back-home-btn" id="homeBtn" aria-label="Back to department home"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M19 12H5"></path><path d="m12 19-7-7 7-7"></path></svg><span>Back to Home</span></button><h2 id="toolTitle">Department Assessment Tool</h2></div>');
html = html.replace(/<p class="subtitle">.*?<\/p>/, '<p class="subtitle" id="toolSubtitle">Department maturity, gap analysis, and roadmap governance.</p>');
html = html.replace('<button id="resetBtn" class="danger-item">Reset All Data</button>', '<button id="resetBtn" class="danger-item">Reset Current Department</button>');

const dataStart = html.indexOf("    const maturityScale = [");
const dataEnd = html.indexOf("    const $ =", dataStart);
if (dataStart < 0 || dataEnd < 0) throw new Error("Could not locate data block");
const dataBlock = `    const maturityScale = [
      { value: 1 },
      { value: 2 },
      { value: 3 },
      { value: 4 },
      { value: 5 }
    ];
    const departmentConfigs = ${JSON.stringify(departments, null, 2)};
    let activeDepartmentId = "";
    let domains = [];
    let questions = [];
    let state = null;

    function storageKey(departmentId) { return "madkourDepartmentAssessment:" + departmentId + ":v3"; }
    function createInitialState() {
      return {
        departmentId: activeDepartmentId,
        current: 0,
        answers: questions.map(question => ({ questionId: question.id, level: "", target: 4, evidence: "", notes: "" })),
        domainWeights: Object.fromEntries(domains.map(d => [d.id, d.weight])),
        questionWeights: Object.fromEntries(questions.map((question, index) => [index, question.weight])),
        settings: { defaultTarget: 4, roadmapStart: "2026-07", roadmapEnd: "2027-12", duration: 6, zoom: "quarter", sidebarCollapsed: false },
        selectedInitiative: "",
        history: [],
        schemaVersion: "3.0",
        updatedAt: new Date().toISOString()
      };
    }

`;
html = html.slice(0, dataStart) + dataBlock + html.slice(dataEnd);

html = html.replace('localStorage.setItem("costControlAssessmentStateV2", JSON.stringify(state));', 'state.updatedAt = new Date().toISOString();\n      localStorage.setItem(storageKey(activeDepartmentId), JSON.stringify(state));');
html = html.replace('const saved = localStorage.getItem("costControlAssessmentStateV2");\n      if (!saved) return;', `let saved = localStorage.getItem(storageKey(activeDepartmentId));
      if (!saved) {
        const legacy = departmentConfigs[activeDepartmentId]?.legacyStorageKey;
        saved = legacy ? localStorage.getItem(legacy) : null;
        if (saved) {
          try {
            const oldState = JSON.parse(saved);
            if (Array.isArray(oldState.answers)) {
              oldState.answers.forEach((answer, index) => {
                if (state.answers[index]) state.answers[index] = { ...state.answers[index], ...answer, questionId: questions[index].id };
              });
              state.domainWeights = { ...state.domainWeights, ...(oldState.domainWeights || {}) };
              state.settings = { ...state.settings, ...(oldState.settings || {}) };
              state.history = Array.isArray(oldState.history) ? oldState.history : [];
              saveSilent();
            }
          } catch (error) {}
        }
        return;
      }`);
html = html.replace('maturityScale.map(item => `', 'maturityScale.map(item => { const answerText = qn.answers[item.value - 1]; return `');
html = html.replace('<span class="answer-desc">${esc(item.text)}</span></span>\n        </label>`).join("");', '<span class="answer-desc">${esc(answerText)}</span></span>\n        </label>`; }).join("");');
html = html.replace('${item.value} - ${esc(item.label)}', '${item.value}');
html = html.replace('const achievementRatio = level ? clamp(level / target, 0, 1) : 0;', 'const achievementRatio = level ? clamp(level / 5, 0, 1) : 0;');
html = html.replace('const statusText = !row.level ? "Not Assessed" : row.achievementRatio >= 1 ? "Meets Target" : row.achievementRatio >= .75 ? "Near Target" : "Below Target";', 'const statusText = !row.level ? "Not Assessed" : row.level >= row.target ? "Meets Target" : row.level === row.target - 1 ? "Near Target" : "Below Target";');
html = html.replaceAll('Target Achievement', 'Assessment Score');
html = html.replaceAll('Question Achievement', 'Question Score');
html = html.replaceAll('Weighted assessment achievement against the configured question targets.', 'Weighted assessment score using the selected 20% to 100% response level.');
html = html.replaceAll('Achievement vs target:', 'Assessment score:');
html = html.replaceAll('Achievement vs Target', 'Assessment Score');
html = html.replaceAll('vs configured target', 'absolute weighted score');
html = html.replaceAll('>Achievement<', '>Score<');
html = html.replaceAll('3 - Defined and Applied', 'Level 3 (60%)');
html = html.replaceAll('4 - Controlled and Measured', 'Level 4 (80%)');
html = html.replaceAll('5 - Optimized', 'Level 5 (100%)');
html = html.replace('if (score < 1.5) return "Not Established";', 'if (score < 1.5) return "Level 1";');
html = html.replace('if (score < 2.5) return "Partially Established";', 'if (score < 2.5) return "Level 2";');
html = html.replace('if (score < 3.5) return "Defined and Applied";', 'if (score < 3.5) return "Level 3";');
html = html.replace('if (score < 4.5) return "Controlled and Measured";', 'if (score < 4.5) return "Level 4";');
html = html.replace('return "Optimized";', 'return "Level 5";');
html = html.replace('download("cost-control-assessment-backup.json"', 'download(`${activeDepartmentId}-assessment-backup.json`');
html = html.replace('download("cost-control-assessment-data.csv"', 'download(`${activeDepartmentId}-assessment-data.csv`');
html = html.replace('download("cost-control-executive-brief.html"', 'download(`${activeDepartmentId}-executive-brief.html`');
html = html.replace('download("cost-control-assessment-report.html"', 'download(`${activeDepartmentId}-assessment-report.html`');
html = html.replace('localStorage.removeItem("costControlAssessmentStateV2");\n      location.reload();', 'localStorage.removeItem(storageKey(activeDepartmentId));\n      state = createInitialState();\n      renderAll();');

function portalRuntime() {
    function departmentSummary(config, savedState) {
      const local = savedState || { answers: [], domainWeights: Object.fromEntries(config.domains.map(d => [d.id, d.weight])), questionWeights: Object.fromEntries(config.questions.map((q, i) => [i, q.weight])) };
      let potential = 0, achieved = 0, maturityWeighted = 0, answered = 0;
      const severityCounts = { Critical: 0, Major: 0, Moderate: 0, Minor: 0, "No Gap": 0 };
      const gapRows = [];
      config.questions.forEach((question, index) => {
        const answer = local.answers?.[index] || {};
        const level = Number(answer.level || 0);
        const target = Number(answer.target || 4);
        const points = Number(local.domainWeights?.[question.domain] ?? config.domains.find(d => d.id === question.domain)?.weight ?? 0) * Number(local.questionWeights?.[index] ?? question.weight) / 100;
        potential += points;
        if (level) {
          answered += 1; achieved += points * Math.min(level / 5, 1); maturityWeighted += points * level;
          const maturityGap = Math.max(target - level, 0);
          const sev = severity(maturityGap);
          if (severityCounts[sev] !== undefined) severityCounts[sev] += 1;
          if (maturityGap > 0) {
            gapRows.push({
              department: config.name, category: question.category, text: question.text,
              level, target, severity: sev, priorityScore: maturityGap * points
            });
          }
        }
      });
      return { answered, total: config.questions.length, completion: answered / config.questions.length * 100, achievement: potential ? achieved / potential * 100 : 0, maturity: potential ? maturityWeighted / potential : 0, updatedAt: local.updatedAt || "", severityCounts, gapRows };
    }

    function readDepartmentState(departmentId) {
      try { return JSON.parse(localStorage.getItem(storageKey(departmentId)) || "null"); } catch (error) { return null; }
    }

    function renderDepartmentPortal() {
      const configs = Object.values(departmentConfigs);
      const accents = ["#0031eb", "#6d4aff", "#008a83", "#d66a16", "#176bba"];
      const summaries = configs.map(config => departmentSummary(config, readDepartmentState(config.id)));
      const totalAnswered = summaries.reduce((sum, item) => sum + item.answered, 0);
      const totalQuestions = summaries.reduce((sum, item) => sum + item.total, 0);
      const portfolioCompletion = totalQuestions ? totalAnswered / totalQuestions * 100 : 0;
      $("portfolioCompletion").textContent = portfolioCompletion.toFixed(0) + "%";
      $("portfolioProgressBar").style.width = portfolioCompletion + "%";
      $("portfolioAnswered").textContent = totalAnswered + " / " + totalQuestions;
      $("departmentGrid").innerHTML = configs.map((config, index) => {
        const summary = summaries[index];
        const status = summary.answered === 0 ? "Not Started" : summary.answered === summary.total ? "Complete" : "In Progress";
        const savedText = summary.updatedAt ? "Saved " + new Date(summary.updatedAt).toLocaleDateString() : "No saved data";
        return `<button class="department-card" data-department="${config.id}" style="--department-accent:${accents[index]}">
          <div class="department-card-top"><div class="department-heading"><span class="department-index">${String(index + 1).padStart(2,"0")}</span><div><h2>${esc(config.name)}</h2><small>60 control questions</small></div></div><span class="department-status ${status === "Complete" ? "complete" : ""}">${status}</span></div>
          <div class="department-progress-label"><span>Assessment completion</span><strong>${summary.completion.toFixed(0)}%</strong></div>
          <div class="department-progress"><span style="width:${summary.completion}%"></span></div>
          <div class="department-card-footer"><span><strong class="department-answer-count">${summary.answered} / ${summary.total} questions answered</strong><small class="department-saved">${savedText}</small></span><span class="department-open">Open assessment →</span></div>
        </button>`;
      }).join("");
      document.querySelectorAll("[data-department]").forEach(button => button.addEventListener("click", () => openDepartment(button.dataset.department)));
      renderPortfolioDashboard(configs, summaries, accents, totalAnswered, totalQuestions);
    }

    function renderPortfolioDashboard(configs, summaries, accents, totalAnswered, totalQuestions) {
      const hasData = totalAnswered > 0;
      $("portfolioEmpty").hidden = hasData;
      $("portfolioBody").hidden = !hasData;
      if (!hasData) return;
      const answeredSummaries = summaries.filter(s => s.answered > 0);
      const maturity = answeredSummaries.reduce((sum, s) => sum + s.maturity * s.answered, 0) / totalAnswered;
      const score = answeredSummaries.reduce((sum, s) => sum + s.achievement * s.answered, 0) / totalAnswered;
      const counts = { Critical: 0, Major: 0, Moderate: 0, Minor: 0, "No Gap": 0 };
      summaries.forEach(s => Object.entries(s.severityCounts).forEach(([key, value]) => { counts[key] += value; }));
      $("pfMaturity").textContent = maturity.toFixed(2) + " / 5";
      $("pfScore").textContent = score.toFixed(1) + "%";
      $("pfCompletion").textContent = (totalAnswered / totalQuestions * 100).toFixed(0) + "%";
      $("pfCoverage").textContent = totalAnswered + " / " + totalQuestions + " answered";
      $("pfCritical").textContent = counts.Critical + counts.Major;
      $("pfDeptChart").innerHTML = configs.map((config, index) => {
        const s = summaries[index];
        const label = s.answered ? s.maturity.toFixed(2) : "-";
        return `<div class="chart-row">
          <div class="chart-label">${esc(config.name)}</div>
          <div class="chart-fill"><span style="width:${Math.max(0, Math.min(s.maturity / 5 * 100, 100))}%;background:${accents[index]}"></span></div>
          <div>${label}</div>
        </div>`;
      }).join("");
      renderDonutTo("pfSeverityDonut", "pfSeverityLegend", counts);
      const topGaps = summaries.flatMap(s => s.gapRows).sort((a, b) => b.priorityScore - a.priorityScore).slice(0, 6);
      $("pfTopGaps").innerHTML = topGaps.length
        ? topGaps.map(row => `<div class="pf-gap">
            <div class="pf-gap-head"><strong>${esc(row.category)}</strong>${tag(row.severity)}</div>
            <p>${esc(row.text)}</p>
            <div class="pf-gap-meta"><span>${esc(row.department)}</span><span>Level ${row.level} of ${row.target}</span></div>
          </div>`).join("")
        : `<p class="pf-note">No gaps recorded — every answered question meets its target.</p>`;
    }

    function openDepartment(departmentId) {
      activeDepartmentId = departmentId;
      const config = departmentConfigs[departmentId];
      domains = config.domains;
      questions = config.questions;
      state = createInitialState();
      loadState();
      $("sidebarDepartmentName").textContent = config.name + " Department";
      $("toolTitle").textContent = config.name + " Department Assessment Tool";
      $("toolSubtitle").textContent = `Madkour maturity assessment, gap analysis, roadmap, and reporting for ${config.name}.`;
      $("departmentPortal").hidden = true;
      $("assessmentApp").hidden = false;
      document.querySelector("[data-view='dashboard']").click();
      renderAll();
    }

    function showDepartmentPortal() {
      if (state && activeDepartmentId) saveSilent();
      $("assessmentApp").hidden = true;
      $("departmentPortal").hidden = false;
      closeOverview();
      renderDepartmentPortal();
    }

    function openOverview() {
      renderDepartmentPortal();
      $("portalHomeView").hidden = true;
      $("portalOverviewView").hidden = false;
      window.scrollTo(0, 0);
    }

    function closeOverview() {
      $("portalOverviewView").hidden = true;
      $("portalHomeView").hidden = false;
    }

    function exportAllJson() {
      const states = Object.fromEntries(Object.keys(departmentConfigs).map(id => [id, readDepartmentState(id)]));
      download("all-departments-assessment-backup.json", JSON.stringify({ tool: "Madkour Department Assessment Portal", schemaVersion: "3.0", exportedAt: new Date().toISOString(), states }, null, 2), "application/json");
    }

    function exportAllCsv() {
      const rows = [["Department","Question No","Question ID","Domain","Category","Question","Current Level","Target Level","Evidence Status","Notes"]];
      Object.values(departmentConfigs).forEach(config => {
        const saved = readDepartmentState(config.id) || { answers: [] };
        config.questions.forEach((question, index) => {
          const answer = saved.answers?.[index] || {};
          const domain = config.domains.find(d => d.id === question.domain)?.name || question.domain;
          rows.push([config.name,index + 1,question.id,domain,question.category,question.text,answer.level || "",answer.target || 4,answer.evidence || "",answer.notes || ""]);
        });
      });
      const csvText = rows.map(row => row.map(value => { const text = String(value ?? ""); return /[",\\n\\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text; }).join(",")).join("\\r\\n");
      download("all-departments-assessment-data.csv", "﻿" + csvText, "text/csv;charset=utf-8");
    }

    function exportAllReport() {
      const cards = Object.values(departmentConfigs).map(config => {
        const summary = departmentSummary(config, readDepartmentState(config.id));
        return `<section><h2>${esc(config.name)}</h2><div class="metrics"><div><span>Answered</span><strong>${summary.answered} / ${summary.total}</strong></div><div><span>Completion</span><strong>${summary.completion.toFixed(0)}%</strong></div><div><span>Maturity</span><strong>${summary.answered ? summary.maturity.toFixed(2) + " / 5" : "Not started"}</strong></div><div><span>Assessment Score</span><strong>${summary.answered ? summary.achievement.toFixed(1) + "%" : "Not started"}</strong></div></div></section>`;
      }).join("");
      const report = `<!doctype html><html><head><meta charset="utf-8"><title>All Departments Assessment Dashboard</title><style>body{font-family:Arial,sans-serif;margin:32px;color:#001559;background:#f5f7fb}main{max-width:1100px;margin:auto}h1{font-size:30px}section{background:#fff;border:1px solid #dce3ef;border-radius:16px;padding:20px;margin:14px 0;break-inside:avoid}.metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.metrics div{background:#f4f7fb;padding:14px;border-radius:10px}.metrics span{display:block;font-size:11px;color:#64748b;text-transform:uppercase;font-weight:700}.metrics strong{display:block;margin-top:6px;font-size:18px}@media print{body{background:#fff;margin:10mm}}@media(max-width:700px){.metrics{grid-template-columns:1fr 1fr}}</style></head><body><main><h1>Department Assessment Dashboard</h1><p>Generated ${new Date().toLocaleString()}</p>${cards}</main></body></html>`;
      download("all-departments-dashboard.html", report, "text/html;charset=utf-8");
    }

    function restoreAll(file) {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const payload = JSON.parse(reader.result);
          if (!payload.states || typeof payload.states !== "object") throw new Error("Missing states");
          Object.entries(payload.states).forEach(([id, saved]) => { if (departmentConfigs[id] && saved) localStorage.setItem(storageKey(id), JSON.stringify(saved)); });
          renderDepartmentPortal();
          alert("All department data restored.");
        } catch (error) { alert("This is not a valid all-departments backup."); }
      };
      reader.readAsText(file);
    }
}
const portalRuntimeSource = portalRuntime.toString();
const portalScript = portalRuntimeSource.slice(portalRuntimeSource.indexOf("{") + 1, portalRuntimeSource.lastIndexOf("}"));
const endScript = html.lastIndexOf("    loadState();\n    renderAll();");
if (endScript < 0) throw new Error("Could not locate initialization");
html = html.slice(0, endScript) + portalScript + `    $("homeBtn").addEventListener("click", showDepartmentPortal);
    $("exportAllJsonBtn").addEventListener("click", exportAllJson);
    $("exportAllCsvBtn").addEventListener("click", exportAllCsv);
    $("exportAllReportBtn").addEventListener("click", exportAllReport);
    $("loadAllJsonBtn").addEventListener("click", () => $("allJsonFile").click());
    $("allJsonFile").addEventListener("change", event => event.target.files[0] && restoreAll(event.target.files[0]));
    $("openOverviewBtn").addEventListener("click", openOverview);
    $("overviewBackBtn").addEventListener("click", closeOverview);
    const brandImg = document.getElementById("portalBrandImg");
    const markSrc = document.querySelector(".mark img")?.src;
    if (brandImg && markSrc) brandImg.src = markSrc;
    renderDepartmentPortal();
` + html.slice(endScript + "    loadState();\n    renderAll();".length);

const outputPath = path.join(root, "publish", "index.html");
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, html, "utf8");
const siteEntryPath = path.join(root, "..", "index.html");
fs.writeFileSync(siteEntryPath, html, "utf8");
console.log(`Built ${path.relative(root, outputPath)} and ${path.relative(root, siteEntryPath)} with ${Object.keys(departments).length} departments and ${Object.values(departments).reduce((sum, d) => sum + d.questions.length, 0)} questions.`);
