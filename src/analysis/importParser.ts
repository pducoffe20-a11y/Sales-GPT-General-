import type {
  CanonicalImportField,
  ImportProfile,
  ImportPurpose,
  ProspectRecord,
  ProspectUpload,
  SourceCategory
} from "../types";
import { analyzeProspectRow } from "./engines";

type Delimiter = ImportProfile["delimiter"];

export const canonicalFieldLabels: Record<CanonicalImportField, string> = {
  organization: "Account / Company",
  fullName: "Contact name",
  title: "Title / Role",
  email: "Email",
  vertical: "Vertical / Segment",
  notes: "Notes / Trigger / Evidence",
  amount: "Amount",
  stage: "Stage",
  closeDate: "Close date",
  probability: "Probability",
  nextStep: "Next step",
  dueDate: "Due date",
  priority: "Priority"
};

export const importPurposeLabels: Record<ImportPurpose, string> = {
  prospect_research: "Prospect / account research",
  pipeline_review: "Pipeline / forecast review",
  task_flow: "Daily task flow",
  meeting_brief: "Meeting notes / pre-call brief"
};

const fieldAliases: Record<CanonicalImportField, string[]> = {
  organization: ["organization", "account", "company", "company_name", "account_name", "org", "institution"],
  fullName: ["full_name", "name", "contact", "contact_name", "person", "prospect", "lead"],
  title: ["title", "job_title", "role", "position"],
  email: ["email", "email_address", "work_email"],
  vertical: ["vertical", "industry", "segment", "category", "market", "sector"],
  notes: ["notes", "context", "trigger", "recent_activity", "description", "evidence", "summary", "meeting_notes"],
  amount: ["amount", "arr", "acv", "value", "deal_value", "opportunity_amount"],
  stage: ["stage", "deal_stage", "opportunity_stage", "status"],
  closeDate: ["close_date", "close", "target_close", "renewal_date"],
  probability: ["probability", "prob", "confidence", "likelihood"],
  nextStep: ["next_step", "next_action", "recommended_action", "task", "action"],
  dueDate: ["due_date", "due", "date", "deadline", "follow_up_date"],
  priority: ["priority", "urgency", "importance"]
};

export const recommendedFieldsByPurpose: Record<ImportPurpose, CanonicalImportField[]> = {
  prospect_research: ["organization", "fullName", "title", "vertical", "notes"],
  pipeline_review: ["organization", "stage", "amount", "closeDate", "probability", "nextStep"],
  task_flow: ["organization", "fullName", "notes", "nextStep", "dueDate", "priority"],
  meeting_brief: ["organization", "fullName", "title", "notes", "nextStep"]
};

const workflowByPurpose: Record<ImportPurpose, string> = {
  prospect_research: "D2L Prospect Strategy -> Prospect Dashboard",
  pipeline_review: "Sales review-forecast -> D2L Deal Journey",
  task_flow: "D2L Daily To-Do -> Sales follow-up package",
  meeting_brief: "Sales prepare-for-meeting -> D2L Pre-Call Brief"
};

const normalizeHeader = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");

const delimiterCharacters: Record<Exclude<Delimiter, "json" | "unknown">, string> = {
  comma: ",",
  tab: "\t",
  semicolon: ";",
  pipe: "|"
};

const splitDelimitedLine = (line: string, delimiter: string) => {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      cells.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  cells.push(current.trim());
  return cells;
};

const detectDelimiter = (headerLine: string): Exclude<Delimiter, "json"> => {
  const scores = Object.entries(delimiterCharacters).map(([name, delimiter]) => ({
    name: name as Exclude<Delimiter, "json" | "unknown">,
    count: splitDelimitedLine(headerLine, delimiter).length
  }));
  const best = scores.sort((a, b) => b.count - a.count)[0];
  return best && best.count > 1 ? best.name : "unknown";
};

export const parseDelimitedInput = (
  input: string
): { rows: Record<string, string>[]; warnings: string[]; delimiter: Delimiter; columns: string[] } => {
  const warnings: string[] = [];
  const trimmed = input.trim();

  if (!trimmed) {
    return { rows: [], warnings: ["No import text was provided."], delimiter: "unknown", columns: [] };
  }

  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      const records = Array.isArray(parsed) ? parsed : [parsed];
      const rows = records
        .filter((record): record is Record<string, unknown> => typeof record === "object" && record !== null)
        .map((record) =>
          Object.fromEntries(Object.entries(record).map(([key, value]) => [normalizeHeader(key), String(value ?? "")]))
        );
      const columns = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
      return { rows, warnings, delimiter: "json", columns };
    } catch {
      warnings.push("JSON-looking input could not be parsed, so it was treated as delimited text.");
    }
  }

  const lines = trimmed
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    warnings.push("Only one row was found. Add headers and at least one record for better scoring.");
  }

  const delimiterName = detectDelimiter(lines[0]);
  const delimiter = delimiterName === "unknown" ? "," : delimiterCharacters[delimiterName];
  if (delimiterName === "unknown") {
    warnings.push("No clear delimiter was detected. Comma parsing was used as a fallback.");
  }

  const headers = splitDelimitedLine(lines[0], delimiter).map(normalizeHeader);
  const rows = lines.slice(1).map((line) => {
    const values = splitDelimitedLine(line, delimiter);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });

  return { rows, warnings, delimiter: delimiterName, columns: headers };
};

export const profileImportRows = (
  rows: Record<string, string>[],
  columns: string[],
  delimiter: Delimiter,
  purpose: ImportPurpose,
  overrides: Partial<Record<CanonicalImportField, string>> = {}
): ImportProfile => {
  const mappedFields: Partial<Record<CanonicalImportField, string>> = {};

  (Object.keys(fieldAliases) as CanonicalImportField[]).forEach((field) => {
    if (overrides[field]) {
      mappedFields[field] = overrides[field];
      return;
    }

    const alias = fieldAliases[field].find((candidate) => columns.includes(candidate));
    if (alias) mappedFields[field] = alias;
  });

  const required = recommendedFieldsByPurpose[purpose];
  const missingRecommendedFields = required.filter((field) => !mappedFields[field]);
  const hitRate = required.length ? (required.length - missingRecommendedFields.length) / required.length : 0;
  const confidence = hitRate >= 0.8 ? "High" : hitRate >= 0.5 ? "Medium" : "Low";

  return {
    delimiter,
    rowCount: rows.length,
    columns,
    mappedFields,
    missingRecommendedFields,
    confidence,
    purposeLabel: importPurposeLabels[purpose],
    suggestedWorkflow: workflowByPurpose[purpose]
  };
};

const normalizeRowsForAnalysis = (
  rows: Record<string, string>[],
  mappedFields: ImportProfile["mappedFields"]
) =>
  rows.map((row) => {
    const normalized = { ...row };
    (Object.entries(mappedFields) as Array<[CanonicalImportField, string]>).forEach(([field, column]) => {
      if (column && row[column] !== undefined) {
        if (field === "fullName") normalized.full_name = row[column];
        else if (field === "closeDate") normalized.close_date = row[column];
        else if (field === "nextStep") normalized.next_step = row[column];
        else if (field === "dueDate") normalized.due_date = row[column];
        else normalized[field] = row[column];
      }
    });
    return normalized;
  });

const escapeCsv = (value: string | number | null | undefined) => {
  const stringValue = String(value ?? "");
  return /[",\n]/.test(stringValue) ? `"${stringValue.replace(/"/g, '""')}"` : stringValue;
};

const buildExportCsv = (records: ProspectRecord[]) => {
  const headers = ["account", "contact", "title", "status", "score", "why_it_matters", "recommended_action", "soft_cta"];
  const rows = records.map((record) => [
    record.organization,
    record.fullName,
    record.title,
    record.status,
    record.scoreTotal,
    record.recommendedActions[0]?.whyItMatters,
    record.recommendedActions[0]?.recommendedAction,
    record.recommendedActions[0]?.softCta
  ]);
  return [headers, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\n");
};

const buildHandoffPrompt = (purpose: ImportPurpose, sourceName: string, profile: ImportProfile) =>
  `Run ${profile.suggestedWorkflow} for "${sourceName}". Use the imported ${profile.rowCount} rows, preserve source evidence, keep unknowns visible, and return review-safe next actions. Purpose: ${importPurposeLabels[purpose]}.`;

const nextChecksByPurpose: Record<ImportPurpose, string[]> = {
  prospect_research: [
    "Confirm role/remit for Light Research contacts.",
    "Check current platform or renewal timing before drafting.",
    "Keep Suppress records out of outreach unless new evidence appears."
  ],
  pipeline_review: [
    "Confirm the buyer-owned next step for each Work Now opportunity.",
    "Check close date, amount, and forecast category before changing commit posture.",
    "Move thin rows to pipeline hygiene until stage evidence improves."
  ],
  task_flow: [
    "Assign owner and due date before adding a task to today's active work.",
    "Group Work Now rows by account so Pat can batch outreach and follow-up.",
    "Suppress vague reminders until the next action is concrete."
  ],
  meeting_brief: [
    "Confirm meeting objective, contact role, and current platform before using externally.",
    "Turn the strongest evidence note into two discovery questions.",
    "Keep unknowns visible in the pre-call brief instead of guessing."
  ]
};

export const buildProspectUpload = (
  input: string,
  sourceName: string,
  sourceType: SourceCategory,
  purpose: ImportPurpose = "prospect_research",
  mappingOverrides: Partial<Record<CanonicalImportField, string>> = {}
): ProspectUpload => {
  const parsed = parseDelimitedInput(input);
  const warnings = [...parsed.warnings];
  let rows = parsed.rows;
  let columns = parsed.columns;
  let delimiter = parsed.delimiter;

  if (sourceType === "pasted_notes" && input.trim() && rows.length === 0) {
    rows = [{ notes: input.trim() }];
    columns = ["notes"];
    delimiter = "unknown";
    warnings.push("Pasted notes were treated as one evidence record. Add account/contact lines for stronger scoring.");
  }

  const profile = profileImportRows(rows, columns, delimiter, purpose, mappingOverrides);
  const normalizedRows = normalizeRowsForAnalysis(rows, profile.mappedFields);
  const records: ProspectRecord[] = normalizedRows.map((row, index) => analyzeProspectRow(row, index, sourceType, purpose));
  const workNow = records.filter((record) => record.status === "Work Now").length;
  const lightResearch = records.filter((record) => record.status === "Light Research").length;
  const suppress = records.filter((record) => record.status === "Suppress").length;
  const commonThemes = Array.from(
    new Set(records.flatMap((record) => record.inferredPains).filter(Boolean))
  ).slice(0, 4);
  const evidenceGaps = Array.from(
    new Set([
      ...records.flatMap((record) => record.unknowns).filter(Boolean),
      ...profile.missingRecommendedFields.map((field) => `${canonicalFieldLabels[field]} was not mapped.`)
    ])
  ).slice(0, 6);
  const handoffPrompt = buildHandoffPrompt(purpose, sourceName, profile);
  const exportCsv = buildExportCsv(records);
  const handoffJson = JSON.stringify(
    {
      sourceName,
      sourceType,
      purpose,
      profile,
      records,
      boardSummary: {
        total: records.length,
        workNow,
        lightResearch,
        suppress,
        commonThemes,
        evidenceGaps
      },
      handoffPrompt
    },
    null,
    2
  );

  return {
    id: `upload-${Date.now()}`,
    sourceName,
    sourceType,
    purpose,
    generatedAt: new Date().toISOString(),
    originalRows: rows,
    profile,
    records,
    parseWarnings: warnings,
    boardSummary: {
      total: records.length,
      workNow,
      lightResearch,
      suppress,
      commonThemes,
      evidenceGaps,
      recommendedNextChecks: nextChecksByPurpose[purpose]
    },
    handoffPrompt,
    exportCsv,
    handoffJson
  };
};
