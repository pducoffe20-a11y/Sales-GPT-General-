import type {
  Account,
  AgenticActionStep,
  AgenticCommandPlan,
  AgenticReviewArtifact,
  Brief,
  DailyTaskManager,
  DailyTaskManagerInput,
  FollowUpDraft,
  ImportPurpose,
  LinkedInResearchBrief,
  LinkedInResearchIntent,
  Meeting,
  OutlookIndexedEvent,
  OutlookIndexedMessage,
  OutlookIndexMode,
  OutlookIndexPlan,
  OutlookSuppression,
  PipelineOpportunity,
  Priority,
  ProspectStatus,
  ProspectRecord,
  Recommendation,
  Signal,
  SignalType,
  SourceCategory,
  Task
} from "../types";

const bannedPhrases = [
  "leverage",
  "robust",
  "seamless",
  "best-in-class",
  "holistic",
  "scalable solutions",
  "hope this finds you well",
  "just following up",
  "circling back",
  "touching base"
];

const getField = (row: Record<string, string>, candidates: string[]) => {
  for (const candidate of candidates) {
    if (row[candidate]) return row[candidate];
  }
  return "";
};

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

const hasAny = (haystack: string, terms: string[]) => terms.some((term) => haystack.includes(term));

const shellQuote = (value: string) => `"${value.replace(/(["\\$`])/g, "\\$1")}"`;


const priorityFromConfidence = (confidence: Signal["confidence"]): Priority =>
  confidence === "High" ? "High" : confidence === "Medium" ? "Medium" : "Low";

const signalToRecommendation = (signal: Signal, index: number, prefix = "signal-rec"): Recommendation => ({
  id: `${prefix}-${index + 1}`,
  account: signal.account,
  contact: signal.contact,
  trigger: signal.evidence,
  context: signal.signalType.replace(/_/g, " "),
  whyItMatters: signal.whyItMatters,
  recommendedAction: signal.recommendedAction,
  softCta: "Worth pressure-testing the next step?",
  priority: priorityFromConfidence(signal.confidence),
  confidence: signal.confidence,
  source: signal.source,
  originatingModule: signal.originatingModule
});

const signalToTask = (signal: Signal, index: number, due = "Next review"): Task => ({
  id: `signal-task-${index + 1}`,
  source: signal.source,
  context: signal.evidence,
  account: signal.account,
  contact: signal.contact,
  concreteNextAction: signal.recommendedAction,
  whyItMatters: signal.whyItMatters,
  due,
  priority: priorityFromConfidence(signal.confidence),
  group:
    signal.signalType === "meeting" || signal.signalType === "deadline"
      ? "Meeting Prep And Time-Bound Tasks"
      : signal.confidence === "High"
        ? "Top Priorities"
        : signal.source === "email"
          ? "Follow-Ups And Responses"
          : "If Time Allows",
  owner: "Pat"
});

const signalTypeFromText = (text: string, fallback: SignalType): SignalType => {
  const lower = text.toLowerCase();
  if (hasAny(lower, ["renewal"])) return "renewal";
  if (hasAny(lower, ["deadline", "due", "by ", "before "])) return "deadline";
  if (hasAny(lower, ["job post", "hiring", "open role"])) return "job_post";
  if (hasAny(lower, ["news", "announced", "press release"])) return "news";
  if (hasAny(lower, ["new role", "promoted", "joined", "changed role"])) return "linkedin_change";
  return fallback;
};

const recommendationCopy = (
  status: ProspectStatus,
  purpose: ImportPurpose
): Pick<Recommendation, "context" | "whyItMatters" | "recommendedAction" | "softCta" | "originatingModule"> => {
  const fallback = {
    context: status === "Suppress" ? "Low evidence record" : "Imported list analysis",
    whyItMatters:
      status === "Work Now"
        ? "Fit, persona, and evidence are strong enough for a careful first touch."
        : status === "Light Research"
          ? "The account could fit, but one confidence gap should be checked before outreach."
          : "The record is too thin or off-fit to spend seller time right now.",
    recommendedAction:
      status === "Work Now"
        ? "Draft one low-pressure outreach note tied to the strongest verified fact."
        : status === "Light Research"
          ? "Check role, remit, and timing before adding this to outreach."
          : "Suppress until stronger account or contact evidence appears.",
    softCta: status === "Work Now" ? "Worth a quick chat?" : "No CTA until the evidence is cleaner.",
    originatingModule: "Prospect Strategy"
  };

  if (purpose === "pipeline_review") {
    return {
      context: status === "Suppress" ? "Pipeline hygiene" : "Pipeline import review",
      whyItMatters:
        status === "Work Now"
          ? "Timing, stage, or next-step evidence suggests this deal needs a seller move now."
          : status === "Light Research"
            ? "The deal may be real, but forecast confidence needs one more verified buyer signal."
            : "There is not enough deal evidence to spend forecast-review time yet.",
      recommendedAction:
        status === "Work Now"
          ? "Confirm next step, buyer owner, and forecast posture before the next pipeline review."
          : status === "Light Research"
            ? "Validate stage, close date, amount, and next buyer commitment before changing forecast."
            : "Keep as low-priority pipeline hygiene until next-step evidence improves.",
      softCta: status === "Work Now" ? "Can we lock the next mutual step?" : "No buyer CTA until the deal evidence is cleaner.",
      originatingModule: "Deal Journey"
    };
  }

  if (purpose === "task_flow") {
    return {
      context: status === "Suppress" ? "Deferred task signal" : "Daily task import",
      whyItMatters:
        status === "Work Now"
          ? "The imported signal is clear enough to become a same-day seller task."
          : status === "Light Research"
            ? "The work item needs owner, timing, or account context before it should take calendar space."
            : "The row is too vague to become an actionable task.",
      recommendedAction:
        status === "Work Now"
          ? "Create the next action with account, owner, due date, and one clear completion condition."
          : status === "Light Research"
            ? "Clarify owner and due date before scheduling seller time."
            : "Do not add to the active worklist until the action is concrete.",
      softCta: status === "Work Now" ? "What is the smallest useful next action?" : "Hold until ownership is clearer.",
      originatingModule: "Daily To-Do"
    };
  }

  if (purpose === "meeting_brief") {
    return {
      context: status === "Suppress" ? "Thin meeting note" : "Meeting prep import",
      whyItMatters:
        status === "Work Now"
          ? "The note has enough account pain or timing context to shape a useful pre-call brief."
          : status === "Light Research"
            ? "The brief needs one more known fact before the meeting prep is reliable."
            : "The note is too thin to guide a buyer-facing conversation.",
      recommendedAction:
        status === "Work Now"
          ? "Build a pre-call brief around the strongest verified pain and the top two unknowns."
          : status === "Light Research"
            ? "Add meeting objective, contact role, or current platform before drafting prep."
            : "Do not use this note externally until more context is captured.",
      softCta: status === "Work Now" ? "What should we learn before proposing a next step?" : "Keep this as internal context.",
      originatingModule: "Pre-Call Brief"
    };
  }

  return fallback;
};

export const analyzeProspectRow = (
  row: Record<string, string>,
  index: number,
  sourceType: SourceCategory = "csv_upload",
  purpose: ImportPurpose = "prospect_research"
): ProspectRecord => {
  const organization = getField(row, ["organization", "account", "company", "company_name", "account_name"]) || null;
  const fullName = getField(row, ["full_name", "name", "contact", "contact_name"]) || null;
  const title = getField(row, ["title", "job_title", "role"]) || null;
  const email = getField(row, ["email", "email_address"]) || null;
  const vertical = getField(row, ["vertical", "industry", "segment", "category"]);
  const notes = getField(row, ["notes", "context", "trigger", "recent_activity", "description"]);
  const amount = getField(row, ["amount", "arr", "acv", "value", "deal_value", "opportunity_amount"]);
  const stage = getField(row, ["stage", "deal_stage", "opportunity_stage", "status"]);
  const closeDate = getField(row, ["close_date", "close", "target_close", "renewal_date"]);
  const probability = getField(row, ["probability", "prob", "confidence", "likelihood"]);
  const nextStep = getField(row, ["next_step", "next_action", "recommended_action", "task", "action"]);
  const dueDate = getField(row, ["due_date", "due", "date", "deadline", "follow_up_date"]);
  const priority = getField(row, ["priority", "urgency", "importance"]);
  const sourceText = `${organization ?? ""} ${fullName ?? ""} ${title ?? ""} ${vertical} ${notes} ${amount} ${stage} ${closeDate} ${probability} ${nextStep} ${dueDate} ${priority}`.toLowerCase();

  const fit = clamp(
    30 +
      (hasAny(sourceText, ["association", "credential", "ce", "member", "certification"]) ? 28 : 0) +
      (hasAny(sourceText, ["healthcare", "bank", "manufacturing", "trade", "workforce"]) ? 18 : 0) +
      (hasAny(sourceText, ["education", "learning", "training", "development"]) ? 18 : 0)
  );
  const urgency = clamp(
    25 +
      (hasAny(sourceText, ["renewal", "budget", "initiative", "approved", "deadline", "launch"]) ? 32 : 0) +
      (hasAny(sourceText, ["new role", "promoted", "hired", "strategy", "modernization"]) ? 20 : 0)
  );
  const persona = clamp(
    20 +
      (hasAny(sourceText, ["vp", "director", "chief", "education", "learning", "workforce", "member"]) ? 35 : 0) +
      (hasAny(sourceText, ["cfo", "cio", "operations", "compliance", "procurement"]) ? 22 : 0)
  );
  const evidence = clamp(
    25 +
      (organization ? 14 : 0) +
      (fullName ? 10 : 0) +
      (title ? 12 : 0) +
      (notes ? 22 : 0) +
      (email ? 8 : 0)
  );
  const timingBoost = hasAny(sourceText, ["budget approved", "lms budget", "deadline", "renewal planning"]) ? 10 : 0;
  const scoreTotal = clamp(fit * 0.35 + urgency * 0.25 + persona * 0.2 + evidence * 0.2 + timingBoost);
  const status: ProspectStatus = scoreTotal >= 72 ? "Work Now" : scoreTotal >= 48 ? "Light Research" : "Suppress";
  const verifiedFacts = [
    organization ? `Organization: ${organization}` : "",
    fullName ? `Contact: ${fullName}` : "",
    title ? `Role: ${title}` : "",
    vertical ? `Segment: ${vertical}` : "",
    amount ? `Amount: ${amount}` : "",
    stage ? `Stage: ${stage}` : "",
    closeDate ? `Close or due date: ${closeDate}` : "",
    probability ? `Probability/confidence: ${probability}` : "",
    nextStep ? `Next step: ${nextStep}` : "",
    priority ? `Priority: ${priority}` : "",
    notes ? `Source note: ${notes}` : ""
  ].filter(Boolean);
  const inferredPains = [
    hasAny(sourceText, ["ce", "credential", "compliance"]) ? "CE/compliance reporting may be a buying angle." : "",
    hasAny(sourceText, ["member", "association"]) ? "Member learning experience likely matters." : "",
    hasAny(sourceText, ["manufacturing", "workforce"]) ? "Training consistency across locations may matter." : "",
    hasAny(sourceText, ["renewal", "budget", "deadline"]) ? "Timing signal may support near-term outreach." : ""
  ].filter(Boolean);
  const unknowns = [
    !title ? "Current title/remit is unknown." : "",
    !email ? "Reachable email is missing." : "",
    !notes ? "No trigger or recent activity was provided." : "",
    !hasAny(sourceText, ["renewal", "budget", "deadline", "initiative", "new role"]) ? "Near-term timing is not verified." : ""
  ].filter(Boolean);
  const purposeCopy = recommendationCopy(status, purpose);
  const evidenceNote = notes || nextStep || stage || dueDate || "Imported row did not include a useful evidence note.";
  const signal: Signal = {
    source: sourceType,
    account: organization ?? "Unknown account",
    contact: fullName ?? undefined,
    opportunityId: getField(row, ["opportunity_id", "opp_id", "deal_id"]) || undefined,
    signalType: purpose === "pipeline_review" ? signalTypeFromText(sourceText, "pipeline_risk") : signalTypeFromText(sourceText, "target_account_fit"),
    evidence: evidenceNote,
    confidence: evidence >= 75 ? "High" : evidence >= 50 ? "Medium" : "Low",
    recommendedAction: purposeCopy.recommendedAction,
    whyItMatters: purposeCopy.whyItMatters,
    originatingModule: purposeCopy.originatingModule
  };
  const linkedinBrief = sourceType === "linkedin" || sourceType === "sales_navigator" || sourceText.includes("linkedin.com")
    ? buildLinkedInResearchBrief({
        intent: purpose === "prospect_research" ? "person_research" : "account_research",
        accountName: organization ?? "",
        personName: fullName ?? "",
        title: title ?? "",
        profileUrl: firstUrlByPath(extractLinkedInUrls(sourceText), ["/in/", "/sales/lead/"]),
        companyUrl: firstUrlByPath(extractLinkedInUrls(sourceText), ["/company/", "/sales/company/"]),
        searchUrl: firstUrlByPath(extractLinkedInUrls(sourceText), ["/search/", "/sales/search/"]),
        listName: organization ? `${organization} LinkedIn evidence` : "LinkedIn evidence",
        limit: "25",
        icp: vertical,
        notes: notes || nextStep || stage || ""
      })
    : null;

  const action: Recommendation = {
    id: `import-rec-${index}`,
    account: organization ?? "Unknown account",
    contact: fullName ?? undefined,
    trigger: evidenceNote,
    context: purposeCopy.context,
    whyItMatters: purposeCopy.whyItMatters,
    recommendedAction: purposeCopy.recommendedAction,
    softCta: purposeCopy.softCta,
    priority: status === "Work Now" ? "High" : status === "Light Research" ? "Medium" : "Low",
    confidence: evidence >= 75 ? "High" : evidence >= 50 ? "Medium" : "Low",
    source: sourceType,
    originatingModule: purposeCopy.originatingModule
  };

  return {
    prospectId: `prospect-${index + 1}`,
    fullName,
    title,
    organization,
    email,
    category: vertical || null,
    status,
    scoreTotal,
    scores: { fit, urgency, persona, evidence },
    verifiedFacts,
    inferredPains,
    unknowns,
    whatToCheckFirst: unknowns.slice(0, 2),
    evidenceNotes: [evidenceNote],
    recommendedActions: [action],
    signals: [signal],
    linkedinSignals: linkedinBrief?.verifiedSignals,
    profileEvidence: linkedinBrief ? [
      linkedinBrief.profileUrl ? `Profile evidence: ${linkedinBrief.profileUrl}` : "Profile evidence still missing.",
      linkedinBrief.companyUrl ? `Company evidence: ${linkedinBrief.companyUrl}` : "Company evidence still missing."
    ] : undefined,
    roleFitEvidence: linkedinBrief?.buyerAngles,
    recentActivityEvidence: linkedinBrief?.verifiedSignals.filter((signal) => signal.startsWith("Seller note:")),
    researchConfidenceImpact: linkedinBrief ? `LinkedIn evidence moves research confidence to ${linkedinBrief.readiness} (${linkedinBrief.researchScore}/100); use only for read-only research, not invites, messages, reactions, comments, posts, or writes.` : undefined
  };
};

const extractLinkedInUrls = (text: string) => {
  const urls = text.match(/https?:\/\/(?:www\.)?linkedin\.com\/[^\s),]+/gi) ?? [];
  return Array.from(new Set(urls.map((url) => url.replace(/[.;]+$/, ""))));
};

const firstUrlByPath = (urls: string[], paths: string[]) =>
  urls.find((url) => paths.some((path) => url.toLowerCase().includes(path))) ?? "";

export const buildLinkedInResearchBrief = (input: {
  intent: LinkedInResearchIntent;
  accountName: string;
  personName: string;
  title: string;
  profileUrl: string;
  companyUrl: string;
  searchUrl: string;
  listName: string;
  limit: string;
  icp: string;
  notes: string;
}): LinkedInResearchBrief => {
  const urls = extractLinkedInUrls(`${input.profileUrl} ${input.companyUrl} ${input.searchUrl} ${input.notes}`);
  const profileUrl = input.profileUrl || firstUrlByPath(urls, ["/in/", "/sales/lead/"]);
  const companyUrl = input.companyUrl || firstUrlByPath(urls, ["/company/", "/sales/company/"]);
  const searchUrl = input.searchUrl || firstUrlByPath(urls, ["/search/", "/sales/search/"]);
  const normalizedLimit = input.limit.trim() || "25";
  const listName = input.listName.trim() || `${input.accountName || "LinkedIn"} research list`;
  const sourceText = `${input.accountName} ${input.personName} ${input.title} ${input.icp} ${input.notes}`.toLowerCase();
  const evidenceHits = [
    input.accountName ? 18 : 0,
    input.personName ? 12 : 0,
    input.title ? 12 : 0,
    profileUrl ? 16 : 0,
    companyUrl ? 14 : 0,
    searchUrl ? 12 : 0,
    input.icp ? 10 : 0,
    input.notes ? 14 : 0
  ];
  const roleFit = hasAny(sourceText, ["learning", "education", "training", "certification", "credential", "member", "workforce", "ce"]) ? 18 : 0;
  const timingFit = hasAny(sourceText, ["new role", "hiring", "budget", "renewal", "deadline", "launch", "post", "initiative"]) ? 12 : 0;
  const researchScore = clamp(evidenceHits.reduce((sum, value) => sum + value, 0) + roleFit + timingFit);
  const readiness = researchScore >= 75 ? "High" : researchScore >= 48 ? "Medium" : "Low";
  const isNavigator = searchUrl.includes("/sales/") || profileUrl.includes("/sales/") || companyUrl.includes("/sales/");
  const searchType = isNavigator ? "nv" : "st";
  const accountLabel = input.accountName || "Unknown account";
  const personLabel = input.personName || "Unknown contact";
  const titleLabel = input.title || "Role unknown";

  const verifiedSignals = [
    input.accountName ? `Account captured: ${input.accountName}` : "",
    input.personName ? `Person captured: ${input.personName}` : "",
    input.title ? `Role/title captured: ${input.title}` : "",
    profileUrl ? `Profile URL ready: ${profileUrl}` : "",
    companyUrl ? `Company URL ready: ${companyUrl}` : "",
    searchUrl ? `Search URL ready: ${searchType === "nv" ? "Sales Navigator" : "standard LinkedIn"} import path` : "",
    input.notes ? `Seller note: ${input.notes}` : ""
  ].filter(Boolean);

  const buyerAngles = [
    hasAny(sourceText, ["learning", "education", "training"]) ? "Learning-program ownership may be a direct Brightspace relevance angle." : "",
    hasAny(sourceText, ["certification", "credential", "ce", "compliance"]) ? "Certification or CE responsibility suggests reporting, audit, and learner-progress questions." : "",
    hasAny(sourceText, ["member", "association"]) ? "Member experience and education operations are likely useful discovery lanes." : "",
    hasAny(sourceText, ["new role", "hiring", "initiative", "budget", "renewal", "deadline"]) ? "Recent-change language is strong enough to check timing before outreach." : "",
    !hasAny(sourceText, ["learning", "education", "training", "certification", "credential", "ce", "member"]) ? "Use LinkedIn to verify whether this person actually owns learning, education, certification, or workforce outcomes." : ""
  ].filter(Boolean);

  const evidenceGaps = [
    !profileUrl ? "Person profile URL is missing." : "",
    !companyUrl ? "Company LinkedIn URL is missing." : "",
    !searchUrl && input.intent === "growth_pipeline" ? "Search URL is missing for the growth import batch." : "",
    !input.icp && input.intent === "growth_pipeline" ? "ICP is not captured yet; qualification cannot be committed responsibly." : "",
    !input.title ? "Current title or remit is missing." : "",
    !input.notes ? "No post, comment, job-change, or seller note was provided." : ""
  ].filter(Boolean);

  const safeNextActions = [
    profileUrl ? "Fetch the profile with experience and recent posts before drafting any outreach." : "Search for the person and confirm profile identity before adding to outreach.",
    companyUrl ? "Fetch company decision makers and posts to separate account signal from individual signal." : "Find the company page so account-level posts and decision makers can be checked.",
    input.intent === "growth_pipeline"
      ? "Before any invite automation, confirm the ICP, account mapping, invite pace, retry policy, and list limit."
      : "Keep this in research mode until the LinkedIn evidence is reviewed against the account plan.",
    "Route usable findings into Prospect Strategy, Meeting Prep, or Pat Voice rather than sending from the research screen."
  ];

  const signals: Signal[] = [
    {
      source: isNavigator ? "sales_navigator" : "linkedin",
      account: accountLabel,
      contact: personLabel === "Unknown contact" ? undefined : personLabel,
      signalType: signalTypeFromText(sourceText, input.intent === "growth_pipeline" ? "target_account_fit" : "linkedin_change"),
      evidence: verifiedSignals[0] ?? input.notes ?? "LinkedIn research input",
      confidence: readiness,
      recommendedAction: safeNextActions[0],
      whyItMatters: buyerAngles[0] ?? "LinkedIn evidence should be verified before it becomes outreach or meeting prep.",
      originatingModule: "LinkedIn Research"
    }
  ];

  const commandPlans = [
    profileUrl
      ? {
          id: "fetch-person",
          label: "Fetch person profile",
          command: `LINKEDAPI_CLIENT=skill:linkedin linkedin person fetch ${shellQuote(profileUrl)} --experience --posts --posts-limit 5 --json -q`,
          category: "Research" as const,
          safety: "Read-only" as const
        }
      : null,
    companyUrl
      ? {
          id: "fetch-company",
          label: "Fetch company page",
          command: `LINKEDAPI_CLIENT=skill:linkedin linkedin company fetch ${shellQuote(companyUrl)} --dms --posts --posts-limit 5 --json -q`,
          category: "Research" as const,
          safety: "Read-only" as const
        }
      : null,
    searchUrl
      ? {
          id: "prepare-growth-import",
          label: "Prepare growth import batch",
          command: `node scripts/import.mjs prepare --searcher <db-account-name> --list ${shellQuote(listName)} --limit ${shellQuote(normalizedLimit)} --type ${searchType} --search-url ${shellQuote(searchUrl)}`,
          category: "Growth Pipeline" as const,
          safety: "Requires confirmation" as const
        }
      : null,
    {
      id: "growth-status",
      label: "Check growth pipeline status",
      command: "node scripts/status.mjs --since 7d --json",
      category: "Status" as const,
      safety: "Read-only" as const
    }
  ].filter((item): item is NonNullable<typeof item> => Boolean(item));

  return {
    id: `linkedin-${Date.now()}`,
    intent: input.intent,
    generatedAt: new Date().toISOString(),
    accountName: accountLabel,
    personName: personLabel,
    title: titleLabel,
    profileUrl,
    companyUrl,
    searchUrl,
    listName,
    limit: normalizedLimit,
    readiness,
    researchScore,
    verifiedSignals,
    buyerAngles,
    evidenceGaps,
    safeNextActions,
    signals,
    commandPlans,
    growthPipeline: {
      importPhase: [
        "Run doctor and account mapping before a first import.",
        "Prepare one named list from a LinkedIn or Sales Navigator search URL with an explicit limit.",
        "Qualify every candidate against Pat's ICP before commit."
      ],
      qualificationRules: [
        "ICP must come from Pat, not a hardcoded default.",
        "Keep unsuitable leads with a concrete reason so filtering is auditable.",
        "For larger batches, qualify in chunks and preserve every hashed URL."
      ],
      networkMaintenance: [
        "Invites run only after leads are committed and assigned to active accounts.",
        "Invite pace, daily cap, active hours, stale pending checks, and retry policy stay account-controlled.",
        "Connection requests, messages, comments, and posts require explicit confirmation."
      ]
    }
  };
};

const modeLabels: Record<OutlookIndexMode, string> = {
  daily_sales_scan: "Daily sales scan",
  weekly_pipeline_prep: "Weekly pipeline prep",
  account_research: "Account research"
};

const normalizeQueryTerms = (value: string) =>
  value
    .split(/[,;\n]+/)
    .map((item) => item.trim())
    .filter(Boolean);

type JsonRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const stringifyUnknown = (value: unknown): string => {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(stringifyUnknown).filter(Boolean).join(", ");
  if (isRecord(value)) {
    const nested =
      value.name ??
      value.displayName ??
      value.address ??
      value.email ??
      value.content ??
      value.dateTime ??
      value.value;
    return stringifyUnknown(nested);
  }
  return "";
};

const getPath = (record: JsonRecord, path: string): unknown =>
  path.split(".").reduce<unknown>((current, part) => (isRecord(current) ? current[part] : undefined), record);

const getStringField = (record: JsonRecord, paths: string[]) => {
  for (const path of paths) {
    const value = stringifyUnknown(getPath(record, path));
    if (value) return value;
  }
  return "";
};

const collectCandidateRecords = (
  payload: unknown,
  predicate: (record: JsonRecord) => boolean,
  depth = 0,
  seen = new WeakSet<object>()
): JsonRecord[] => {
  if (depth > 7 || payload == null) return [];
  if (typeof payload === "object") {
    if (seen.has(payload)) return [];
    seen.add(payload);
  }

  if (Array.isArray(payload)) {
    return payload.flatMap((item) => collectCandidateRecords(item, predicate, depth + 1, seen));
  }

  if (!isRecord(payload)) return [];

  const matches = predicate(payload) ? [payload] : [];
  return [
    ...matches,
    ...Object.values(payload).flatMap((value) => collectCandidateRecords(value, predicate, depth + 1, seen))
  ];
};

const uniqueByFingerprint = <T>(items: T[], fingerprint: (item: T) => string) => {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = fingerprint(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const looksLikeMessage = (record: JsonRecord) => {
  const subject = getStringField(record, ["subject", "title"]);
  const sender = getStringField(record, ["from.emailAddress.address", "from.emailAddress.name", "sender.emailAddress.address", "sender.emailAddress.name", "from", "sender"]);
  const received = getStringField(record, ["receivedDateTime", "received_at", "received", "date"]);
  const preview = getStringField(record, ["bodyPreview", "preview", "snippet", "summary", "body.content", "body"]);
  const hasEventTime = getStringField(record, ["start.dateTime", "start_datetime", "start", "end.dateTime", "end_datetime", "end"]);
  return Boolean(subject && !hasEventTime && (sender || received || preview));
};

const looksLikeEvent = (record: JsonRecord) => {
  const title = getStringField(record, ["subject", "title", "name", "summary"]);
  const start = getStringField(record, ["start.dateTime", "start_datetime", "start"]);
  const end = getStringField(record, ["end.dateTime", "end_datetime", "end"]);
  return Boolean(title && (start || end));
};

const priorityFromText = (text: string): Priority => {
  const lower = text.toLowerCase();
  if (hasAny(lower, ["urgent", "deadline", "due today", "tomorrow", "proposal", "renewal", "executive", "contract", "pricing"])) return "High";
  if (hasAny(lower, ["follow up", "follow-up", "availability", "pilot", "demo", "review", "next step", "meeting"])) return "Medium";
  return "Low";
};

const accountFromText = (text: string, accountTerms: string[]) => {
  const lower = text.toLowerCase();
  return accountTerms.find((term) => lower.includes(term.toLowerCase())) ?? accountTerms[0] ?? "Outlook account";
};

const extractDue = (text: string, fallback: string) => {
  const dateMatch = text.match(/\b(?:by|due|before|on)\s+([a-z]{3,9}\s+\d{1,2}|\d{1,2}\/\d{1,2}(?:\/\d{2,4})?|\d{4}-\d{2}-\d{2}|today|tomorrow)\b/i);
  if (dateMatch) return dateMatch[1];
  return fallback || "Next review";
};

const ownerFromText = (text: string): Task["owner"] => {
  const lower = text.toLowerCase();
  if (hasAny(lower, ["can you", "could you", "please send", "please share", "send over", "follow up", "your team", "you mentioned"])) return "Pat";
  if (hasAny(lower, ["waiting on", "they will", "buyer will", "prospect will", "client will", "customer will"])) return "Prospect";
  return "Ambiguous";
};

const actionFromText = (subject: string, preview: string, account: string) => {
  const text = `${subject} ${preview}`.toLowerCase();
  if (hasAny(text, ["proposal", "pricing", "quote", "contract"])) return `Review and respond to the ${account} proposal/pricing thread.`;
  if (hasAny(text, ["availability", "schedule", "reschedule", "calendar"])) return `Send availability or confirm the next meeting step for ${account}.`;
  if (hasAny(text, ["deadline", "due", "renewal"])) return `Confirm the deadline-driven next step for ${account}.`;
  if (hasAny(text, ["question", "asked", "can you", "could you"])) return `Answer the open buyer question from ${account}.`;
  return `Review the Outlook signal and choose the smallest useful next action for ${account}.`;
};

const messageSuppressionReason = (message: OutlookIndexedMessage) => {
  const text = `${message.subject} ${message.preview} ${message.sender}`.toLowerCase();
  if (hasAny(text, ["unsubscribe", "newsletter", "digest", "webinar invitation", "marketing update", "automated notification"])) {
    return "Newsletter, automated, or broad marketing item.";
  }
  if (message.sender.toLowerCase().includes("@d2l.com") && !hasAny(text, ["customer", "prospect", "proposal", "renewal", message.account.toLowerCase()])) {
    return "Internal-only Outlook item without concrete external prospect work.";
  }
  return "";
};

const eventSuppressionReason = (event: OutlookIndexedEvent) => {
  const text = `${event.title} ${event.organizer} ${event.attendees.join(" ")}`.toLowerCase();
  const hasExternal = event.attendees.some((attendee) => attendee && !attendee.toLowerCase().includes("@d2l.com"));
  if (!hasExternal && !hasAny(text, ["prospect", "customer", event.account.toLowerCase()])) {
    return "Internal calendar item without external buyer context.";
  }
  return "";
};

const normalizeAttendees = (record: JsonRecord) => {
  const raw = getPath(record, "attendees");
  if (!Array.isArray(raw)) return stringifyUnknown(raw) ? [stringifyUnknown(raw)] : [];
  return raw
    .map((attendee) =>
      isRecord(attendee)
        ? getStringField(attendee, ["emailAddress.name", "emailAddress.address", "name", "address", "email"])
        : stringifyUnknown(attendee)
    )
    .filter(Boolean);
};

const normalizeMessages = (payload: unknown, accountTerms: string[]): OutlookIndexedMessage[] => {
  const records = uniqueByFingerprint(
    collectCandidateRecords(payload, looksLikeMessage),
    (record) =>
      [
        getStringField(record, ["id", "message_id", "internetMessageId"]),
        getStringField(record, ["subject", "title"]),
        getStringField(record, ["receivedDateTime", "received_at", "received"])
      ].join("|")
  );

  return records.map((record, index) => {
    const subject = getStringField(record, ["subject", "title"]) || "Untitled email";
    const preview = getStringField(record, ["bodyPreview", "preview", "snippet", "summary", "body.content", "body"]).slice(0, 420);
    const sender =
      getStringField(record, ["from.emailAddress.name", "from.emailAddress.address", "sender.emailAddress.name", "sender.emailAddress.address", "from", "sender"]) ||
      "Unknown sender";
    const receivedAt = getStringField(record, ["receivedDateTime", "received_at", "received", "date"]);
    const id = getStringField(record, ["id", "message_id", "internetMessageId"]) || `message-${index + 1}`;
    const sourceLink = getStringField(record, ["webLink", "source_link", "link"]);
    const account = accountFromText(`${subject} ${preview} ${sender}`, accountTerms);

    return {
      id,
      subject,
      sender,
      receivedAt,
      preview,
      account,
      sourceLink: sourceLink || undefined,
      signalStrength: priorityFromText(`${subject} ${preview}`)
    };
  });
};

const normalizeEvents = (payload: unknown, accountTerms: string[]): OutlookIndexedEvent[] => {
  const records = uniqueByFingerprint(
    collectCandidateRecords(payload, looksLikeEvent),
    (record) =>
      [
        getStringField(record, ["id", "event_id"]),
        getStringField(record, ["subject", "title", "name", "summary"]),
        getStringField(record, ["start.dateTime", "start_datetime", "start"])
      ].join("|")
  );

  return records.map((record, index) => {
    const title = getStringField(record, ["subject", "title", "name", "summary"]) || "Untitled event";
    const start = getStringField(record, ["start.dateTime", "start_datetime", "start"]);
    const end = getStringField(record, ["end.dateTime", "end_datetime", "end"]);
    const organizer = getStringField(record, ["organizer.emailAddress.name", "organizer.emailAddress.address", "organizer", "createdBy.user.displayName"]) || "Unknown organizer";
    const attendees = normalizeAttendees(record);
    const responseState = getStringField(record, ["responseStatus.response", "showAs", "status"]) || "Unknown";
    const id = getStringField(record, ["id", "event_id"]) || `event-${index + 1}`;
    const sourceLink = getStringField(record, ["webLink", "onlineMeeting.joinUrl", "source_link", "link"]);
    const account = accountFromText(`${title} ${organizer} ${attendees.join(" ")}`, accountTerms);

    return {
      id,
      title,
      start,
      end,
      organizer,
      attendees,
      account,
      responseState,
      sourceLink: sourceLink || undefined,
      signalStrength: priorityFromText(`${title} ${start}`)
    };
  });
};

const parseConnectorPayload = (connectorJson: string, accountTerms: string[]) => {
  const warnings: string[] = [];
  if (!connectorJson.trim()) {
    return { messages: [] as OutlookIndexedMessage[], events: [] as OutlookIndexedEvent[], warnings };
  }

  try {
    const parsed = JSON.parse(connectorJson) as unknown;
    const messages = normalizeMessages(parsed, accountTerms);
    const events = normalizeEvents(parsed, accountTerms);
    if (messages.length === 0 && events.length === 0) {
      warnings.push("Connector JSON parsed, but no Outlook message or event records were recognized.");
    }
    return { messages, events, warnings };
  } catch {
    return {
      messages: [] as OutlookIndexedMessage[],
      events: [] as OutlookIndexedEvent[],
      warnings: ["Connector JSON could not be parsed. Paste the raw Outlook connector response or adapter response JSON."]
    };
  }
};

const messageToSignal = (message: OutlookIndexedMessage): Signal => ({
  source: "email",
  account: message.account,
  contact: message.sender,
  signalType: signalTypeFromText(`${message.subject} ${message.preview}`, "email_ask"),
  evidence: message.preview || message.subject,
  confidence: message.signalStrength === "Low" ? "Medium" : "High",
  recommendedAction: actionFromText(message.subject, message.preview, message.account),
  whyItMatters: message.preview || "Outlook connector surfaced this as a recent customer/prospect signal.",
  originatingModule: "Outlook Live Sync"
});

const eventToSignal = (event: OutlookIndexedEvent): Signal => ({
  source: "calendar",
  account: event.account,
  contact: event.organizer,
  signalType: "meeting",
  evidence: `${event.title} · ${event.start || "Scheduled meeting"}`,
  confidence: event.signalStrength === "Low" ? "Medium" : "High",
  recommendedAction: `Prep for ${event.title} and confirm the useful next step before the meeting.`,
  whyItMatters: `${event.start || "Scheduled meeting"} with ${event.organizer}; attendee state ${event.responseState}.`,
  originatingModule: "Outlook Live Sync"
});

export const buildOutlookIndexPlan = (input: {
  mode: OutlookIndexMode;
  mailboxLabel: string;
  startDate: string;
  endDate: string;
  emailQuery: string;
  calendarFocus: string;
  accountFocus: string;
  connectorJson?: string;
  adapterUrl?: string;
}): OutlookIndexPlan => {
  const queryTerms = normalizeQueryTerms(input.emailQuery);
  const focusTerms = normalizeQueryTerms(input.calendarFocus);
  const accountTerms = normalizeQueryTerms(input.accountFocus);
  const hasDates = Boolean(input.startDate && input.endDate);
  const hasEmailQuery = queryTerms.length > 0;
  const hasCalendarFocus = focusTerms.length > 0 || accountTerms.length > 0;
  const indexScore = clamp((hasDates ? 28 : 0) + (hasEmailQuery ? 28 : 0) + (hasCalendarFocus ? 22 : 0) + (input.mailboxLabel ? 12 : 0) + (accountTerms.length ? 10 : 0));
  const readiness = indexScore >= 75 ? "High" : indexScore >= 48 ? "Medium" : "Low";
  const receivedFilter = hasDates ? `received>=${input.startDate} received<=${input.endDate}` : "";
  const searchText = [...accountTerms, ...queryTerms].join(" ");
  const emailSearchQuery = [searchText, receivedFilter].filter(Boolean).join(" ").trim();
  const startDatetime = `${input.startDate || "YYYY-MM-DD"}T00:00:00-04:00`;
  const endDatetime = `${input.endDate || "YYYY-MM-DD"}T23:59:59-04:00`;
  const calendarQuery = accountTerms[0] ?? "";
  const parsedConnector = parseConnectorPayload(input.connectorJson ?? "", accountTerms);
  const suppressedMessages = parsedConnector.messages
    .map((message) => ({ message, reason: messageSuppressionReason(message) }))
    .filter((item) => item.reason);
  const suppressedEvents = parsedConnector.events
    .map((event) => ({ event, reason: eventSuppressionReason(event) }))
    .filter((item) => item.reason);
  const messageIndex = parsedConnector.messages.filter((message) => !messageSuppressionReason(message));
  const eventIndex = parsedConnector.events.filter((event) => !eventSuppressionReason(event));
  const signals = [
    ...messageIndex
      .filter((message) => message.signalStrength !== "Low" || ownerFromText(`${message.subject} ${message.preview}`) !== "Ambiguous")
      .map(messageToSignal),
    ...eventIndex.map(eventToSignal)
  ];
  const taskCandidates = signals.map((signal, index) => signalToTask(signal, index, extractDue(signal.evidence, signal.signalType === "meeting" ? "Before meeting" : "Next review"))).sort((a, b) => {
    const rank = { High: 3, Medium: 2, Low: 1 };
    return rank[b.priority] - rank[a.priority];
  });
  const suppressionLog: OutlookSuppression[] = [
    ...suppressedMessages.map(({ message, reason }, index) => ({
      id: `outlook-suppressed-email-${index + 1}`,
      sourceId: message.id,
      sourceType: "email" as const,
      reason,
      evidence: `${message.subject} - ${message.sender}`
    })),
    ...suppressedEvents.map(({ event, reason }, index) => ({
      id: `outlook-suppressed-event-${index + 1}`,
      sourceId: event.id,
      sourceType: "calendar" as const,
      reason,
      evidence: `${event.title} - ${event.organizer}`
    }))
  ];
  const connectorState =
    parsedConnector.warnings.some((warning) => warning.startsWith("Connector JSON could not"))
      ? "Parse error"
      : input.connectorJson?.trim()
        ? "Dynamic evidence loaded"
        : input.adapterUrl?.trim()
          ? "Ready for live adapter"
          : "Needs connector payload";
  const handoff = {
    mode: input.mode,
    modeLabel: modeLabels[input.mode],
    mailboxLabel: input.mailboxLabel || "Pat Outlook",
    startDate: input.startDate,
    endDate: input.endDate,
    emailQuery: emailSearchQuery,
    calendarWindow: { startDatetime, endDatetime, query: calendarQuery },
    indexOutputs: ["message_index", "event_index", "task_candidates", "suppression_log"],
    liveAdapter: {
      adapterUrl: input.adapterUrl || "",
      emailAction: "search_messages",
      calendarAction: "list_events"
    },
    indexedCounts: {
      messages: messageIndex.length,
      events: eventIndex.length,
      tasks: taskCandidates.length,
      suppressions: suppressionLog.length
    },
    writePolicy: "read_only_until_user_confirms"
  };
  const liveScoreBoost = input.connectorJson?.trim() ? 22 : input.adapterUrl?.trim() ? 12 : 0;
  const liveIndexScore = clamp(indexScore + liveScoreBoost);

  return {
    id: `outlook-index-${Date.now()}`,
    mode: input.mode,
    generatedAt: new Date().toISOString(),
    mailboxLabel: input.mailboxLabel || "Pat Outlook",
    startDate: input.startDate,
    endDate: input.endDate,
    emailQuery: emailSearchQuery,
    calendarFocus: [...focusTerms, ...accountTerms].join(", "),
    readiness: liveIndexScore >= 75 ? "High" : liveIndexScore >= 48 ? "Medium" : readiness,
    indexScore: liveIndexScore,
    stats: {
      emailStages: 2,
      calendarStages: 2,
      writeActions: 0,
      indexedMessages: messageIndex.length,
      indexedEvents: eventIndex.length,
      taskCandidates: taskCandidates.length,
      suppressions: suppressionLog.length
    },
    connectorState,
    stages: [
      {
        id: "email-shortlist",
        label: "Live email search",
        connector: "Outlook Email",
        description: "Run a bounded Outlook Email search with sales/account keywords and index the returned evidence."
      },
      {
        id: "calendar-context",
        label: "Live calendar window",
        connector: "Outlook Calendar",
        description: "List meetings in the same bounded window and flag prep, attendee, and timing risks."
      },
      {
        id: "candidate-fetch",
        label: "Evidence normalization",
        connector: "Outlook Email",
        description: "Normalize connector responses into message and event indexes with source IDs preserved."
      },
      {
        id: "seller-index",
        label: "Seller-ready task synthesis",
        connector: "Command Center",
        description: "Merge duplicate asks, separate Pat-owned/prospect-owned/ambiguous work, and preserve suppressions."
      }
    ],
    indexSchema: [
      {
        label: "Message Index",
        fields: ["message_id", "subject", "sender", "received_at", "account", "preview", "source_link"],
        purpose: "Fast mailbox shortlist without full-body overfetching."
      },
      {
        label: "Event Index",
        fields: ["event_id", "title", "start", "end", "attendees", "response_state", "online_link"],
        purpose: "Meeting context, prep windows, and attendee confirmation risk."
      },
      {
        label: "Task Candidate",
        fields: ["owner", "account", "next_action", "due", "evidence", "source_ids", "confidence"],
        purpose: "Concrete seller work only; weak guesses stay out."
      },
      {
        label: "Suppression Log",
        fields: ["source_id", "reason", "category", "review_note"],
        purpose: "Keep newsletters, internal-only notices, and ambiguous items auditable."
      }
    ],
    evidenceRules: [
      "Scan email first with bounded date and account/sales keywords.",
      "Use calendar as a second pass for meeting context, prep timing, attendee state, and scheduling risk.",
      "Quote or briefly paraphrase the evidence that establishes owner, due date, or commitment.",
      "Fetch full email bodies or event details only for final candidates that need tighter evidence."
    ],
    suppressionRules: [
      "Suppress newsletters, automated notices, and internal-only FYI messages unless they create concrete external-prospect work.",
      "If calendar returns no external prospect meetings, record that as an empty-context signal instead of inventing tasks.",
      "If timing or attendee status conflicts, mark confirmation risk rather than presenting it as settled work.",
      "Never send, schedule, move, categorize, or create Outlook items from live sync mode."
    ],
    commandPlans: [
      {
        id: "email-search",
        label: "Search Outlook email window",
        connector: "Outlook Email",
        action: "search_messages",
        method: "connector",
        endpoint: "mcp://outlook-email/search_messages",
        payload: JSON.stringify({ query: emailSearchQuery || "received>=YYYY-MM-DD received<=YYYY-MM-DD", size: 50 }, null, 2),
        safety: "Read-only",
        whenToUse: "First pass over the mailbox for bounded account, prospect, and follow-up evidence."
      },
      {
        id: "calendar-list",
        label: "List Outlook calendar window",
        connector: "Outlook Calendar",
        action: "list_events",
        method: "connector",
        endpoint: "mcp://outlook-calendar/list_events",
        payload: JSON.stringify({ start_datetime: startDatetime, end_datetime: endDatetime, top: 50 }, null, 2),
        safety: "Read-only",
        whenToUse: "Second pass for meetings, deadlines, attendee state, and prep timing."
      },
      {
        id: "email-fetch-batch",
        label: "Fetch shortlisted email bodies",
        connector: "Outlook Email",
        action: "fetch_messages_batch",
        method: "connector",
        endpoint: "mcp://outlook-email/fetch_messages_batch",
        payload: JSON.stringify({ message_ids: ["<shortlisted-message-id>"], batch_size: 20 }, null, 2),
        safety: "Read-only",
        whenToUse: "Only after shortlist results require body-level evidence for owner or due date."
      },
      {
        id: "calendar-fetch-batch",
        label: "Fetch shortlisted event details",
        connector: "Outlook Calendar",
        action: "fetch_events_batch",
        method: "connector",
        endpoint: "mcp://outlook-calendar/fetch_events_batch",
        payload: JSON.stringify({ event_ids: ["<shortlisted-event-id>"], batch_size: 20 }, null, 2),
        safety: "Read-only",
        whenToUse: "Only when event body, attendee responses, Teams details, or organizer intent matter."
      }
    ],
    messageIndex,
    eventIndex,
    signals,
    taskCandidates,
    liveRecommendations: signals.map((signal, index) => signalToRecommendation(signal, index, "outlook-rec")),
    suppressionLog,
    parseWarnings: parsedConnector.warnings,
    handoffJson: JSON.stringify(handoff, null, 2)
  };
};

export const buildMeetingBrief = (input: {
  accountName: string;
  contactName: string;
  title: string;
  vertical: string;
  meetingType: string;
  notes: string;
  competitors: string;
  recentActivity: string;
}): Brief => {
  const vertical = input.vertical || "association or professional learning";
  const pain = input.notes || input.recentActivity || "their learning programs need a clearer operating model";
  const competitorList = input.competitors
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return {
    accountSnapshot: `${input.accountName || "This account"} looks like a ${vertical} fit where Brightspace can help consolidate learning, reporting, and member experience.`,
    contactAngle: `${input.contactName || "The contact"}${input.title ? ` (${input.title})` : ""} likely cares about practical rollout, proof, and keeping the program manageable.`,
    valueAngles: [
      `Make training easier for members or learners to find and complete.`,
      `Give the education team cleaner reporting without stitching together manual exports.`,
      `Support a phased rollout so the first win is concrete instead of broad.`
    ],
    discoveryQuestions: [
      `What is hardest to manage in the current learning process?`,
      `Where does reporting or compliance create the most manual work?`,
      `Who else needs to feel comfortable before this moves forward?`,
      `What would make a pilot worth the team's time?`,
      `What has to be true by the next planning or renewal window?`
    ],
    likelyObjections: [
      competitorList.length ? `${competitorList.join(", ")} may be framed as lower-change options.` : "They may not want another platform conversation unless the pain is concrete.",
      "Implementation effort could feel bigger than the immediate problem.",
      "Budget approval may depend on showing member or learner impact."
    ],
    opener: `I thought we could keep this practical today. The piece I want to understand is where ${pain} is creating the most friction.`,
    softNextStepAsk: "If this feels useful, should we sketch a small next step with the people who would own rollout?",
    followUpDraft: `Hi ${input.contactName || "there"} - good talking today. The part that stood out is ${pain}. I think the useful next step is to pressure-test a small path forward, not boil the ocean. Worth comparing notes with the right stakeholders next week?`,
    unknownsToConfirm: ["Current platform or process", "Buying committee", "Budget/timing", "Security or procurement path"]
  };
};

export const buildFollowUpDraft = (input: {
  meetingNotes: string;
  contactRole: string;
  caredAbout: string;
  nextStep: string;
  blockers: string;
  account: string;
  contact: string;
}): FollowUpDraft => {
  const caredAbout = input.caredAbout || "making the learning program easier to run";
  const nextStep = input.nextStep || "compare notes on a practical next step";
  const blockers = input.blockers || "No clear blockers captured yet";
  const email = `Hi ${input.contact || "there"} - good talking today. The part that stood out is how much your team is trying to make ${caredAbout} without adding more admin. I’ll send the short notes and a simple next-step outline. Worth finding 25 minutes next week to pressure-test ${nextStep}?`;

  return {
    email,
    crmNote: `Call recap for ${input.account || "account"}: buyer cared about ${caredAbout}. Agreed next step: ${nextStep}. Blockers/risks: ${blockers}. Evidence: ${input.meetingNotes || "Pat-entered meeting notes."}`,
    suggestedFollowUpDate: "3 business days",
    reviewFlags: [
      input.blockers ? "Confirm blocker wording before using externally." : "Add any blocker or objection before sending.",
      "Confirm next-step date/time if a calendar hold exists."
    ],
    nextTask: {
      id: `task-${Date.now()}`,
      source: "manual",
      context: "Follow-up builder",
      account: input.account || "Unknown account",
      contact: input.contact || undefined,
      concreteNextAction: nextStep,
      whyItMatters: "The follow-up only helps if it turns the call into a clear next commitment.",
      due: "3 business days",
      priority: "High",
      group: "Follow-Ups And Responses",
      owner: "Pat"
    }
  };
};

export const reviewPatVoice = (copy: string) => {
  const lower = copy.toLowerCase();
  const flags = bannedPhrases.filter((phrase) => lower.includes(phrase));
  const missingRelevance = !/you|your|team|program|members|learners|ce|training|compliance/i.test(copy);
  const longSentenceCount = copy
    .split(/[.!?]/)
    .map((sentence) => sentence.trim().split(/\s+/).filter(Boolean).length)
    .filter((count) => count > 24).length;
  const rewritten = copy
    .replace(/hope this finds you well,?\s*/gi, "")
    .replace(/just following up/gi, "checking back")
    .replace(/leverage/gi, "use")
    .replace(/robust/gi, "strong")
    .replace(/seamless/gi, "easier")
    .replace(/best-in-class/gi, "proven")
    .replace(/holistic/gi, "clear")
    .replace(/scalable solutions/gi, "tools that can grow with the program")
    .trim();

  return {
    flags,
    missingRelevance,
    longSentenceCount,
    betterOpener:
      missingRelevance
        ? "Open with the buyer's program, role, or trigger before mentioning D2L."
        : "The opener has enough buyer context. Keep it short.",
    tighterCta: "Worth a quick chat?",
    rewritten: rewritten || "Paste a draft to see a cleaner Pat-voice version."
  };
};

const pipelineOpportunityToSignal = (opportunity: PipelineOpportunity): Signal => {
  const riskScore =
    (opportunity.probability < 45 ? 30 : 0) +
    (opportunity.risk === "High" ? 35 : opportunity.risk === "Medium" ? 20 : 5) +
    (/overdue|stalled|security|procurement/i.test(opportunity.nextMove) ? 18 : 0);
  return {
    source: "manual",
    account: opportunity.account,
    opportunityId: opportunity.id,
    signalType: signalTypeFromText(`${opportunity.stage} ${opportunity.closeDate} ${opportunity.nextMove} ${opportunity.whyItMatters}`, "pipeline_risk"),
    evidence: `${opportunity.stage}; ${opportunity.nextMove}`,
    confidence: riskScore >= 55 ? "High" : riskScore >= 32 ? "Medium" : "Low",
    recommendedAction: opportunity.nextMove,
    whyItMatters: opportunity.whyItMatters,
    originatingModule: "Deal Journey"
  };
};

export const buildAccountSignals = (accounts: Account[]): Signal[] =>
  accounts.map((account): Signal => {
    const score = clamp(account.fitScore * 0.45 + account.timingScore * 0.35 + (account.health === "Good" ? 20 : 8));
    return {
      source: "manual",
      account: account.name,
      contact: account.contacts[0]?.name,
      signalType: signalTypeFromText(`${account.stage} ${account.knownPain} ${account.nextBestMove}`, "target_account_fit"),
      evidence: `${account.stage}; last touch: ${account.lastTouch}`,
      confidence: account.researchGaps.length > 1 ? "Medium" : score >= 68 ? "High" : "Low",
      recommendedAction: account.nextBestMove,
      whyItMatters: account.knownPain,
      originatingModule: "Sales Router"
    };
  });
export const dealReviewGroupNames = [
  "Needs Pat Action",
  "Needs Buyer Commitment",
  "Forecast Risk",
  "Manager Review Notes",
  "Low Priority Cleanup"
] as const;

export type DealReviewGroupName = (typeof dealReviewGroupNames)[number];

export type AnalyzedPipelineDeal = PipelineOpportunity & {
  riskScore: number;
  posture: "Could slip" | "Watch closely" | "On track";
  reviewGroup: DealReviewGroupName;
  managerNote: string;
};

const buyerCommitmentPattern = /buyer|prospect|client|customer|committee|stakeholder|executive|send|review|availability|calendar|intro|discovery|demo|session|call|meeting|commitment|mutual/i;
const patActionPattern = /follow up|send availability|send .*literature|get back|re-book|book|schedule|confirm|qualify|review|proposal|sample courses|business case/i;
const cleanupPattern = /tbd|placeholder|no amount|no next step|zoominfo|sourced lead|first substantive/i;

const analyzePipelineDeal = (opportunity: PipelineOpportunity): AnalyzedPipelineDeal => {
  const riskScore =
    (opportunity.probability < 45 ? 30 : 0) +
    (opportunity.probability < 20 ? 12 : 0) +
    (opportunity.amount === 0 ? 18 : 0) +
    (opportunity.forecast === "At Risk" ? 22 : 0) +
    (opportunity.risk === "High" ? 35 : opportunity.risk === "Medium" ? 20 : 5) +
    (/overdue|stalled|security|procurement|placeholder|tbd|rescheduled/i.test(opportunity.nextMove) ? 18 : 0);
  const posture = riskScore >= 70 ? "Could slip" : riskScore >= 38 ? "Watch closely" : "On track";
  const dealText = `${opportunity.stage} ${opportunity.nextMove} ${opportunity.whyItMatters}`;
  const reviewGroup: DealReviewGroupName =
    cleanupPattern.test(dealText) || (opportunity.amount === 0 && opportunity.probability <= 15)
      ? "Low Priority Cleanup"
      : opportunity.forecast === "At Risk" || riskScore >= 82
        ? "Forecast Risk"
        : patActionPattern.test(dealText)
          ? "Needs Pat Action"
          : buyerCommitmentPattern.test(dealText)
            ? "Needs Buyer Commitment"
            : "Manager Review Notes";
  const managerNote = `${reviewGroup} · ${posture}: ${opportunity.whyItMatters}`;

  return {
    ...opportunity,
    riskScore,
    posture,
    reviewGroup,
    managerNote
  };
};

export const analyzePipeline = (opportunities: PipelineOpportunity[]) => opportunities.map(analyzePipelineDeal);

export const buildDealReviewBoard = (opportunities: PipelineOpportunity[]) => {
  const board = dealReviewGroupNames.reduce<Record<DealReviewGroupName, AnalyzedPipelineDeal[]>>(
    (groups, groupName) => ({ ...groups, [groupName]: [] }),
    {} as Record<DealReviewGroupName, AnalyzedPipelineDeal[]>
  );

  analyzePipeline(opportunities)
    .sort((a, b) => b.riskScore - a.riskScore || b.amount - a.amount)
    .forEach((deal) => {
      board[deal.reviewGroup].push(deal);
    });

  return dealReviewGroupNames.map((name) => ({
    name,
    deals: board[name],
    totalAmount: board[name].reduce((sum, deal) => sum + deal.amount, 0),
    weightedAmount: board[name].reduce((sum, deal) => sum + deal.amount * (deal.probability / 100), 0)
  }));
};

export const buildAccountRecommendations = (accounts: Account[]): Recommendation[] =>
  buildAccountSignals(accounts)
    .map((signal, index) => signalToRecommendation(signal, index, "acct-rec"))
    .sort((a, b) => {
      const rank = { High: 3, Medium: 2, Low: 1 };
      return rank[b.priority] - rank[a.priority];
    });

export const groupTasks = (tasks: Task[]) =>
  tasks.reduce<Record<Task["group"], Task[]>>(
    (groups, task) => {
      groups[task.group].push(task);
      return groups;
    },
    {
      "Top Priorities": [],
      "Meeting Prep And Time-Bound Tasks": [],
      "Follow-Ups And Responses": [],
      "If Time Allows": []
    }
  );

const dailyPriorityRank: Record<Priority, number> = { High: 3, Medium: 2, Low: 1 };

const sortByPriority = <T extends { priority: Priority }>(items: T[]): T[] =>
  [...items].sort((a, b) => dailyPriorityRank[b.priority] - dailyPriorityRank[a.priority]);

const confidenceRank: Record<Signal["confidence"], number> = { High: 3, Medium: 2, Low: 1 };

const taskConfidence = (task: Task): Signal["confidence"] => {
  if (task.owner === "Ambiguous") return "Low";
  if (task.priority === "High" && task.due !== "Next review") return "High";
  return task.priority === "Low" ? "Low" : "Medium";
};

const softCtaFromTask = (task: Task) =>
  task.owner === "Prospect"
    ? "What buyer commitment is still missing?"
    : task.owner === "Ambiguous"
      ? "Can we confirm owner before this gets calendar space?"
      : "What is the smallest useful next step?";

const handoffModuleForTask = (task: Task) => {
  if (task.group === "Meeting Prep And Time-Bound Tasks") return "Pre-Call Brief";
  if (task.group === "Follow-Ups And Responses") return "Follow-Up Builder";
  if (task.source === "email" || task.source === "calendar") return "Outlook Live Workbench";
  return "Sales Router";
};

const workstreamForTask = (task: Task): AgenticActionStep["workstream"] => {
  if (task.owner === "Ambiguous") return "Verify";
  if (task.group === "Meeting Prep And Time-Bound Tasks") return "Prep";
  if (task.group === "Follow-Ups And Responses") return "Draft";
  return "Decide";
};

const statusForTask = (task: Task): AgenticActionStep["status"] => {
  if (task.owner === "Ambiguous") return "Needs confirmation";
  if (!task.account || task.account === "Unknown account") return "Blocked";
  return "Ready";
};

const taskToAgenticStep = (task: Task, index: number): AgenticActionStep => {
  const confidence = taskConfidence(task);
  return {
    id: `agentic-task-${index + 1}`,
    workstream: workstreamForTask(task),
    status: statusForTask(task),
    account: task.account,
    contact: task.contact,
    evidence: task.context,
    due: task.due,
    owner: task.owner,
    priority: task.priority,
    whyItMatters: task.whyItMatters,
    recommendedAction: task.concreteNextAction,
    softCta: softCtaFromTask(task),
    confidence,
    source: task.source,
    originatingModule: task.source === "email" || task.source === "calendar" ? "Outlook Live Sync" : "Daily To-Do",
    handoffModule: handoffModuleForTask(task),
    guardrail:
      confidence === "Low"
        ? "Confirm owner, account, and evidence before drafting or scheduling."
        : "Review artifact only; no external send, post, CRM, or Outlook write action."
  };
};

const recommendationToAgenticStep = (rec: Recommendation, index: number): AgenticActionStep => ({
  id: `agentic-rec-${index + 1}`,
  workstream: rec.originatingModule.includes("Deal") ? "Verify" : "Decide",
  status: rec.confidence === "Low" ? "Needs confirmation" : "Ready",
  account: rec.account,
  contact: rec.contact,
  evidence: rec.trigger,
  due: "Next review",
  owner: "Pat",
  priority: rec.priority,
  whyItMatters: rec.whyItMatters,
  recommendedAction: rec.recommendedAction,
  softCta: rec.softCta,
  confidence: rec.confidence,
  source: rec.source,
  originatingModule: rec.originatingModule,
  handoffModule: rec.originatingModule,
  guardrail:
    rec.confidence === "Low"
      ? "Keep as research context until source evidence improves."
      : "Recommendation is ready for Pat review, not automatic execution."
});

const dedupeAgenticSteps = (steps: AgenticActionStep[]) => {
  const seen = new Set<string>();
  return steps.filter((step) => {
    const key = `${step.account}|${step.recommendedAction}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const sortAgenticSteps = (steps: AgenticActionStep[]) =>
  [...steps].sort(
    (a, b) =>
      dailyPriorityRank[b.priority] - dailyPriorityRank[a.priority] ||
      confidenceRank[b.confidence] - confidenceRank[a.confidence]
  );

const buildReviewArtifacts = (steps: AgenticActionStep[]): AgenticReviewArtifact[] =>
  steps
    .filter((step) => step.workstream === "Prep" || step.workstream === "Draft")
    .slice(0, 3)
    .map((step, index) => ({
      id: `agentic-artifact-${index + 1}`,
      label: step.workstream === "Prep" ? "Meeting prep brief" : "Follow-up draft",
      account: step.account,
      source: step.source,
      content: `${step.recommendedAction} Evidence: ${step.evidence}`,
      guardrail: "Create the artifact for Pat review only; keep send/write behavior outside this app."
    }));

const dedupeTasks = (tasks: Task[]): Task[] => {
  const seen = new Set<string>();
  return tasks.filter((task) => {
    const key = `${task.account}|${task.concreteNextAction}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const meetingToTask = (meeting: Meeting, accounts: Account[], index: number): Task => {
  const account = accounts.find((candidate) => candidate.id === meeting.accountId);
  const contact = account?.contacts.find((candidate) => candidate.id === meeting.contactId);
  return {
    id: `meeting-task-${index + 1}`,
    source: "calendar",
    context: meeting.notes,
    account: account?.name ?? meeting.title,
    contact: contact?.name,
    concreteNextAction: `Prep ${meeting.type.toLowerCase()}: ${meeting.title}`,
    whyItMatters: `${meeting.prepStatus} prep before the ${meeting.time} ${meeting.mode.toLowerCase()} session.`,
    due: meeting.time,
    priority: meeting.prepStatus === "Needs work" ? "High" : "Medium",
    group: "Meeting Prep And Time-Bound Tasks",
    owner: "Pat"
  };
};

// Daily Task Manager: merge every "what should Pat do next" source — existing
// tasks, Outlook task candidates, pipeline opportunities, account
// recommendations, and meeting prep — into one ranked, grouped output.
export const buildDailyTaskManager = (input: DailyTaskManagerInput): DailyTaskManager => {
  const accountSignals = buildAccountSignals(input.accounts);
  const pipelineSignals = input.opportunities.map(pipelineOpportunityToSignal);
  const signalTasks = [...accountSignals, ...pipelineSignals].map((signal, index) =>
    signalToTask(
      signal,
      index,
      signal.signalType === "deadline" || signal.signalType === "meeting" ? "Today" : "Next review"
    )
  );
  const meetingTasks = input.meetings
    .filter((meeting) => meeting.prepStatus !== "Good")
    .map((meeting, index) => meetingToTask(meeting, input.accounts, index));

  const tasks = sortByPriority(
    dedupeTasks([
      ...input.existingTasks,
      ...(input.taskCandidates ?? []),
      ...meetingTasks,
      ...signalTasks
    ])
  );

  const recommendations = sortByPriority([
    ...(input.recommendations ?? buildAccountRecommendations(input.accounts)),
    ...pipelineSignals.map((signal, index) => signalToRecommendation(signal, index, "pipeline-rec"))
  ]);

  return { tasks, grouped: groupTasks(tasks), recommendations };
};

export const buildAgenticCommandPlan = (input: {
  daily: DailyTaskManager;
  opportunities: PipelineOpportunity[];
  accounts: Account[];
  meetings: Meeting[];
  outlookPlan?: OutlookIndexPlan;
}): AgenticCommandPlan => {
  const taskSteps = input.daily.tasks.map(taskToAgenticStep);
  const recommendationSteps = input.daily.recommendations
    .slice(0, 8)
    .map(recommendationToAgenticStep);
  const dealSteps = analyzePipeline(input.opportunities)
    .filter((deal) => deal.posture !== "On track" || deal.reviewGroup !== "Low Priority Cleanup")
    .map((deal, index): AgenticActionStep => ({
      id: `agentic-deal-${index + 1}`,
      workstream: deal.posture === "Could slip" ? "Verify" : "Decide",
      status: deal.riskScore >= 82 ? "Needs confirmation" : "Ready",
      account: deal.account,
      evidence: `${deal.stage}; ${deal.forecast}; ${deal.nextMove}`,
      due: deal.closeDate,
      owner: deal.reviewGroup === "Needs Buyer Commitment" ? "Prospect" : "Pat",
      priority: deal.risk,
      whyItMatters: deal.whyItMatters,
      recommendedAction: deal.nextMove,
      softCta:
        deal.reviewGroup === "Needs Buyer Commitment"
          ? "Can we confirm the buyer-owned commitment?"
          : "Should this move before the next forecast review?",
      confidence: deal.riskScore >= 70 ? "High" : deal.riskScore >= 38 ? "Medium" : "Low",
      source: "crm_export",
      originatingModule: "Deal Journey",
      handoffModule: "Deal Review Board",
      guardrail: "Analyze and prepare review notes only; do not change forecast state without Pat approval."
    }));

  const steps = sortAgenticSteps(
    dedupeAgenticSteps([...taskSteps, ...recommendationSteps, ...dealSteps])
  ).slice(0, 7);
  const ready = steps.filter((step) => step.status === "Ready").length;
  const needsConfirmation = steps.filter((step) => step.status === "Needs confirmation").length;
  const blocked = steps.filter((step) => step.status === "Blocked").length;
  const averageConfidence =
    steps.length === 0
      ? 0
      : steps.reduce((sum, step) => sum + confidenceRank[step.confidence], 0) / steps.length;
  const readiness: Signal["confidence"] =
    ready >= 4 && averageConfidence >= 2.35
      ? "High"
      : ready >= 2
        ? "Medium"
        : "Low";
  const nextMove = steps[0];
  const reviewArtifacts = buildReviewArtifacts(steps);
  const suppressionDecisions = [
    ...(input.outlookPlan?.suppressionLog.map(
      (item) => `${item.reason} Evidence: ${item.evidence}`
    ) ?? []),
    ...steps
      .filter((step) => step.confidence === "Low" || step.status === "Blocked")
      .map((step) => `${step.account}: hold until ${step.guardrail.toLowerCase()}`)
  ].slice(0, 4);
  const accountGaps = input.accounts
    .flatMap((account) => account.researchGaps.map((gap) => `${account.name}: ${gap}`))
    .slice(0, 3);
  const evidenceGates = [
    "Every action preserves whyItMatters, recommendedAction, softCta, confidence, source, and originatingModule.",
    "Draft and prep outputs stay review-only until a real connector-backed write adapter exists.",
    input.outlookPlan
      ? `Outlook evidence state: ${input.outlookPlan.connectorState}; ${input.outlookPlan.stats.writeActions} write actions.`
      : "No live connector evidence loaded; use local sample and pasted payloads only.",
    `${input.meetings.length} meetings checked for prep coverage and time-bound tasks.`,
    ...accountGaps
  ].slice(0, 6);

  return {
    id: `agentic-command-${Date.now()}`,
    generatedAt: new Date().toISOString(),
    focus: nextMove?.account ?? "Daily command center",
    readiness,
    autonomyScore: clamp(ready * 12 + needsConfirmation * 6 + reviewArtifacts.length * 8 + (blocked === 0 ? 10 : 0)),
    recommendedNextMove: nextMove?.recommendedAction ?? "Load evidence before making an action recommendation.",
    summary:
      nextMove
        ? `${steps.length} ranked moves, ${reviewArtifacts.length} review artifacts, and ${suppressionDecisions.length} suppression decisions are ready for Pat review.`
        : "No ranked moves yet. Add Outlook, CRM, meeting, or prospect evidence to activate the planner.",
    steps,
    evidenceGates,
    suppressionDecisions,
    reviewArtifacts,
    stats: {
      ready,
      needsConfirmation,
      blocked,
      suppressions: suppressionDecisions.length,
      reviewArtifacts: reviewArtifacts.length
    },
    handoffPrompt:
      nextMove
        ? `Start with ${nextMove.account}: ${nextMove.recommendedAction} Route to ${nextMove.handoffModule}; keep execution review-only.`
        : "No handoff yet."
  };
};
