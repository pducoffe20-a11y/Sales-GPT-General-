import type {
  AccountResearchRecord,
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

const moneyValue = (text: string) => {
  const matches = text.match(/\$[\d,]+(?:\.\d+)?/g) ?? [];
  return matches.reduce((max, value) => Math.max(max, Number(value.replace(/[$,]/g, "")) || 0), 0);
};

const numberValueBefore = (text: string, terms: string[]) => {
  const lower = text.toLowerCase();
  const values = terms.flatMap((term) => {
    const pattern = new RegExp(`([\\d,]+)\\s+(?:active\\s+)?(?:users\\/)?(?:members|learners|${term})`, "gi");
    return Array.from(lower.matchAll(pattern)).map((match) => Number(match[1].replace(/,/g, "")) || 0);
  });
  return values.reduce((max, value) => Math.max(max, value), 0);
};

const extractEvidenceSentences = (text: string) =>
  text
    .split(/\.\s+/)
    .map((sentence) => sentence.trim().replace(/\.$/, ""))
    .filter(Boolean);

const isTargetAccountImport = (rows: Record<string, string>[], sourceName: string) => {
  const source = sourceName.toLowerCase();
  const sample = rows.slice(0, 8).map((row) => Object.values(row).join(" ").toLowerCase()).join(" ");
  return source.includes("target account") || sample.includes("target account") || sample.includes("gold-tier target");
};

const analyzeTargetAccountRow = (row: Record<string, string>, index: number): AccountResearchRecord => {
  const accountName = row.organization || row.account || row.company || row.account_name || `Imported account ${index + 1}`;
  const contact = row.contact || row.full_name || row.name || "";
  const title = row.title || row.role || "";
  const vertical = row.vertical || row.industry || row.segment || "";
  const notes = row.notes || row.context || row.evidence || "";
  const sourceText = `${accountName} ${contact} ${title} ${vertical} ${notes}`;
  const lower = sourceText.toLowerCase();
  const revenue = moneyValue(sourceText);
  const audience = numberValueBefore(sourceText, ["member", "learner"]);
  const isMemberOrg = /association|society|institute|bar|college|member|training|cpa|credential|certified/i.test(sourceText);
  const hasTrainingSignal = /training|learner|education|certification|credential|ce|cpe|professional development/i.test(sourceText);
  const hasTier = /gold|silver|bronze|tier/i.test(sourceText);
  const hasActivity = /last activity|renewal|budget|initiative|launch|opportunity/i.test(sourceText);
  const score = Math.max(
    0,
    Math.min(
      100,
      Math.round(35 + (hasTier ? 18 : 0) + (isMemberOrg ? 16 : 0) + (hasTrainingSignal ? 16 : 0) + (revenue >= 10000000 ? 10 : 0) + (audience >= 20000 ? 10 : 0) + (hasActivity ? 8 : 0))
    )
  );
  const status = score >= 72 ? "Work Now" : score >= 52 ? "Research First" : "Defer";
  const publicEvidence = [
    ...extractEvidenceSentences(notes).slice(0, 4),
    vertical ? `Imported segment: ${vertical}` : ""
  ].filter(Boolean);
  const knownContacts = contact ? [`${contact}${title ? ` · ${title}` : ""}`] : [];
  const linkedinSignals = [
    "Check Sales Navigator for education, certification, learning operations, membership, and executive sponsors.",
    knownContacts.length ? "Validate imported contact remit before outreach." : "Find likely VP/Director Education, Membership, Certification, or Operations contacts."
  ];
  const pipelineConnections = [
    lower.includes("last activity") ? "Imported target list includes last-activity context." : "No pipeline activity included in this row.",
    lower.includes("owner: pat") ? "Pat is listed as owner in the imported territory file." : "Confirm owner/account assignment before working."
  ];
  const whyNow = [
    hasTier ? "Territory file marks this as a tiered target account." : "Target priority tier is not explicit.",
    revenue ? `Revenue signal (${new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(revenue)}) suggests capacity to evaluate a learning platform.` : "Revenue capacity was not imported.",
    audience ? `Imported audience scale (${audience.toLocaleString()} members/learners) can justify member training discovery.` : "Audience scale is missing."
  ];
  const researchGaps = [
    knownContacts.length === 0 ? "No named buyer/contact imported." : "Confirm this contact owns learning or membership outcomes.",
    !hasActivity ? "No recent activity or timing trigger imported." : "Turn last-activity date into a current trigger before outreach.",
    !/lms|platform|learning system|brightspace/i.test(sourceText) ? "Current LMS/platform is unknown." : "Validate platform pain with a current source.",
    "Find public proof of CE, certification, member education, or training programs."
  ];
  return {
    accountName,
    importedFields: row,
    icpFit: {
      status,
      score,
      rationale: isMemberOrg
        ? "Looks like a member, credential, education, or professional association target with enough scale to research."
        : "Imported row has target-list value, but member-training fit needs validation."
    },
    verticalFit: vertical || (isMemberOrg ? "Association / member education target" : "Vertical not imported"),
    memberTrainingFit: hasTrainingSignal || audience ? "Likely worth testing for member training, CE, certification, or learner-scale use cases." : "Training fit is plausible but not proven from the imported row.",
    publicEvidence,
    knownContacts,
    linkedinSignals,
    pipelineConnections,
    whyNow,
    researchGaps,
    nextBestMove: status === "Work Now" ? "Research the account page and LinkedIn buyer map, then draft a review-safe first touch around member education scale." : status === "Research First" ? "Spend 10 minutes validating learning programs, current platform, and one buyer before outreach." : "Do not work yet; enrich account fit and contacts first.",
    confidence: publicEvidence.length >= 3 && (knownContacts.length > 0 || audience > 0) ? "High" : publicEvidence.length >= 2 ? "Medium" : "Low"
  };
};

const buildProspectExportCsv = (records: ProspectRecord[]) => {
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

const buildAccountResearchExportCsv = (records: AccountResearchRecord[]) => {
  const headers = ["account", "fit_status", "fit_score", "confidence", "what_we_know", "research_gaps", "next_best_move"];
  const rows = records.map((record) => [
    record.accountName,
    record.icpFit.status,
    record.icpFit.score,
    record.confidence,
    record.publicEvidence.join(" | "),
    record.researchGaps.join(" | "),
    record.nextBestMove
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
  const shouldBuildAccountQueue = purpose === "prospect_research" && isTargetAccountImport(normalizedRows, sourceName);
  const accountResearchRecords: AccountResearchRecord[] = shouldBuildAccountQueue
    ? normalizedRows.map((row, index) => analyzeTargetAccountRow(row, index))
    : [];
  const records: ProspectRecord[] = shouldBuildAccountQueue
    ? []
    : normalizedRows.map((row, index) => analyzeProspectRow(row, index, sourceType, purpose));
  const workNow = shouldBuildAccountQueue
    ? accountResearchRecords.filter((record) => record.icpFit.status === "Work Now").length
    : records.filter((record) => record.status === "Work Now").length;
  const lightResearch = shouldBuildAccountQueue
    ? accountResearchRecords.filter((record) => record.icpFit.status === "Research First").length
    : records.filter((record) => record.status === "Light Research").length;
  const suppress = shouldBuildAccountQueue
    ? accountResearchRecords.filter((record) => record.icpFit.status === "Defer").length
    : records.filter((record) => record.status === "Suppress").length;
  const commonThemes = shouldBuildAccountQueue
    ? Array.from(new Set(accountResearchRecords.map((record) => record.memberTrainingFit))).slice(0, 4)
    : Array.from(new Set(records.flatMap((record) => record.inferredPains).filter(Boolean))).slice(0, 4);
  const evidenceGaps = Array.from(
    new Set([
      ...(shouldBuildAccountQueue
        ? accountResearchRecords.flatMap((record) => record.researchGaps)
        : records.flatMap((record) => record.unknowns).filter(Boolean)),
      ...profile.missingRecommendedFields.map((field) => `${canonicalFieldLabels[field]} was not mapped.`)
    ])
  ).slice(0, 6);
  const total = shouldBuildAccountQueue ? accountResearchRecords.length : records.length;
  const handoffPrompt = buildHandoffPrompt(purpose, sourceName, profile);
  const exportCsv = shouldBuildAccountQueue ? buildAccountResearchExportCsv(accountResearchRecords) : buildProspectExportCsv(records);
  const handoffJson = JSON.stringify(
    {
      sourceName,
      sourceType,
      purpose,
      profile,
      records,
      accountResearchRecords,
      boardSummary: {
        total,
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
    accountResearchRecords,
    parseWarnings: warnings,
    boardSummary: {
      total,
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
