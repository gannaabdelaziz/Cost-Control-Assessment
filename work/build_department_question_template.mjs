import fs from "node:fs/promises";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const outputDir = "D:/Cost Control Assessment Tool/outputs/Department_Assessment_Tool_Handoff";
await fs.mkdir(outputDir, { recursive: true });

const workbook = Workbook.create();
const guide = workbook.worksheets.add("Instructions");
const questions = workbook.worksheets.add("Question Register");
const domains = workbook.worksheets.add("Domain Summary");

guide.showGridLines = false;
guide.getRange("A1:F1").merge();
guide.getRange("A1").values = [["Department Assessment Question Template"]];
guide.getRange("A1:F1").format = {
  fill: "#001559",
  font: { bold: true, color: "#FFFFFF", size: 16 },
  verticalAlignment: "center",
};
guide.getRange("A1:F1").format.rowHeight = 34;
guide.getRange("A3:B12").values = [
  ["Step", "Action"],
  ["1", "Complete DEPARTMENT_INFORMATION.md."],
  ["2", "Ask Codex to propose domains and weights."],
  ["3", "Enter approved domains in the Domain Summary sheet."],
  ["4", "Draft and review every question in the Question Register."],
  ["5", "Make sure domain weights total 100%."],
  ["6", "Approve the content with the department owner."],
  ["7", "Only then ask Codex to update the HTML application."],
  ["Weight entry", "Enter weights as percentages, for example 10%."],
  ["Status", "Use Draft, Under Review, Approved, or Rejected."],
];
guide.getRange("A3:B3").format = {
  fill: "#0031EB",
  font: { bold: true, color: "#FFFFFF" },
};
guide.getRange("A3:B12").format.wrapText = true;
guide.getRange("A3:B12").format.borders = { preset: "outside", style: "thin", color: "#D9E0F2" };
guide.getRange("A:A").format.columnWidth = 18;
guide.getRange("B:B").format.columnWidth = 75;

const headers = [
  "Question ID", "Domain", "Category", "Domain Weight %", "Question Weight %",
  "Assessment Question", "Evidence Requested", "Process Reference", "Business Impact",
  "Suggested Owner", "Recommended Improvement Action", "Review Status", "Reviewer Notes"
];
questions.getRange("A1:M1").values = [headers];
questions.getRange("A1:M1").format = {
  fill: "#001559",
  font: { bold: true, color: "#FFFFFF" },
  wrapText: true,
  verticalAlignment: "center",
};
questions.getRange("A1:M1").format.rowHeight = 38;
const starterRows = Array.from({ length: 30 }, (_, i) => [
  `Q${String(i + 1).padStart(2, "0")}`, "", "", null, null, "", "", "", "", "", "", "Draft", ""
]);
questions.getRange("A2:M31").values = starterRows;
questions.getRange("D2:E31").format.numberFormat = "0.0%";
questions.getRange("L2:L31").dataValidation = {
  rule: { type: "list", values: ["Draft", "Under Review", "Approved", "Rejected"] }
};
questions.getRange("A1:M31").format.borders = {
  insideHorizontal: { style: "thin", color: "#E7EBF5" },
  bottom: { style: "thin", color: "#D9E0F2" },
};
questions.getRange("A2:M31").format.wrapText = true;
questions.freezePanes.freezeRows(1);
questions.getRange("A:A").format.columnWidth = 12;
questions.getRange("B:C").format.columnWidth = 24;
questions.getRange("D:E").format.columnWidth = 16;
questions.getRange("F:F").format.columnWidth = 52;
questions.getRange("G:K").format.columnWidth = 32;
questions.getRange("L:L").format.columnWidth = 18;
questions.getRange("M:M").format.columnWidth = 32;
const qTable = questions.tables.add("A1:M31", true, "QuestionRegister");
qTable.style = "TableStyleMedium2";

domains.getRange("A1:E1").values = [[
  "Domain", "Domain Weight %", "Proposed Questions", "Approved Questions", "Notes"
]];
domains.getRange("A1:E1").format = {
  fill: "#001559",
  font: { bold: true, color: "#FFFFFF" },
  wrapText: true,
};
const domainRows = Array.from({ length: 12 }, () => ["", null, null, null, ""]);
domains.getRange("A2:E13").values = domainRows;
domains.getRange("B2:B13").format.numberFormat = "0.0%";
domains.getRange("C2:D13").format.numberFormat = "0";
domains.getRange("A15").values = [["Total Weight"]];
domains.getRange("B15").formulas = [["=SUM(B2:B13)"]];
domains.getRange("B15").format.numberFormat = "0.0%";
domains.getRange("A15:B15").format = {
  fill: "#DDE6FF",
  font: { bold: true, color: "#001559" },
  borders: { preset: "outside", style: "thin", color: "#0031EB" },
};
domains.getRange("B15").conditionalFormats.add("cellIs", {
  operator: "equal",
  formula: 1,
  format: { fill: "#DFF4EA", font: { bold: true, color: "#0B6B3A" } }
});
domains.getRange("B15").conditionalFormats.add("cellIs", {
  operator: "notEqual",
  formula: 1,
  format: { fill: "#FDECE8", font: { bold: true, color: "#B42318" } }
});
domains.getRange("A1:E13").format.borders = {
  insideHorizontal: { style: "thin", color: "#E7EBF5" },
  bottom: { style: "thin", color: "#D9E0F2" },
};
domains.freezePanes.freezeRows(1);
domains.getRange("A:A").format.columnWidth = 32;
domains.getRange("B:D").format.columnWidth = 20;
domains.getRange("E:E").format.columnWidth = 45;

const inspect = await workbook.inspect({
  kind: "table",
  range: "Domain Summary!A1:E15",
  include: "values,formulas",
  tableMaxRows: 20,
  tableMaxCols: 8,
});
console.log(inspect.ndjson);

const errors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 100 },
  summary: "final formula error scan",
});
console.log(errors.ndjson);

for (const sheetName of ["Instructions", "Question Register", "Domain Summary"]) {
  const preview = await workbook.render({ sheetName, autoCrop: "all", scale: 1, format: "png" });
  const safeName = sheetName.replaceAll(" ", "_");
  await fs.writeFile(`${outputDir}/.${safeName}_preview.png`, new Uint8Array(await preview.arrayBuffer()));
}

const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(`${outputDir}/Department_Question_Template.xlsx`);
