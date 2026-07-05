import type {
  Account,
  Brief,
  FollowUpDraft,
  ImportPurpose,
  LinkedInResearchBrief,
  LinkedInResearchIntent,
  OutlookIndexMode,
  OutlookIndexPlan,
  PipelineOpportunity,
  Priority,
  ProspectStatus,
  ProspectRecord,
  Recommendation,
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
    recommendedActions: [action]
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

export const buildOutlookIndexPlan = (input: {
  mode: OutlookIndexMode;
  mailboxLabel: string;
  startDate: string;
  endDate: string;
  emailQuery: string;
  calendarFocus: string;
  accountFocus: string;
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
  const handoff = {
    mode: input.mode,
    modeLabel: modeLabels[input.mode],
    mailboxLabel: input.mailboxLabel || "Pat Outlook",
    startDate: input.startDate,
    endDate: input.endDate,
    emailQuery: emailSearchQuery,
    calendarWindow: { startDatetime, endDatetime, query: calendarQuery },
    indexOutputs: ["message_index", "event_index", "task_candidates", "suppression_log"],
    writePolicy: "read_only_until_user_confirms"
  };

  return {
    id: `outlook-index-${Date.now()}`,
    mode: input.mode,
    generatedAt: new Date().toISOString(),
    mailboxLabel: input.mailboxLabel || "Pat Outlook",
    startDate: input.startDate,
    endDate: input.endDate,
    emailQuery: emailSearchQuery,
    calendarFocus: [...focusTerms, ...accountTerms].join(", "),
    readiness,
    indexScore,
    stats: {
      emailStages: 2,
      calendarStages: 2,
      writeActions: 0
    },
    stages: [
      {
        id: "email-shortlist",
        label: "Email shortlist",
        connector: "Outlook Email",
        description: "Search bounded mailbox windows with sales/account keywords before fetching full bodies."
      },
      {
        id: "calendar-context",
        label: "Calendar context",
        connector: "Outlook Calendar",
        description: "List meetings in the same bounded window and flag external attendee or timing risks."
      },
      {
        id: "candidate-fetch",
        label: "Candidate fetch",
        connector: "Outlook Email",
        description: "Fetch full message bodies only for shortlisted threads where owner, due date, or evidence is unclear."
      },
      {
        id: "seller-index",
        label: "Seller-ready index",
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
      "Never send, schedule, move, categorize, or create Outlook items from indexing mode."
    ],
    commandPlans: [
      {
        id: "email-search",
        label: "Search Outlook email window",
        connector: "Outlook Email",
        action: "search_messages",
        payload: JSON.stringify({ query: emailSearchQuery || "received>=YYYY-MM-DD received<=YYYY-MM-DD", size: 50 }, null, 2),
        safety: "Read-only",
        whenToUse: "First pass over the mailbox for bounded account, prospect, and follow-up evidence."
      },
      {
        id: "calendar-list",
        label: "List Outlook calendar window",
        connector: "Outlook Calendar",
        action: "list_events",
        payload: JSON.stringify({ start_datetime: startDatetime, end_datetime: endDatetime, top: 50 }, null, 2),
        safety: "Read-only",
        whenToUse: "Second pass for meetings, deadlines, attendee state, and prep timing."
      },
      {
        id: "email-fetch-batch",
        label: "Fetch shortlisted email bodies",
        connector: "Outlook Email",
        action: "fetch_messages_batch",
        payload: JSON.stringify({ message_ids: ["<shortlisted-message-id>"], batch_size: 20 }, null, 2),
        safety: "Read-only",
        whenToUse: "Only after shortlist results require body-level evidence for owner or due date."
      },
      {
        id: "calendar-fetch-batch",
        label: "Fetch shortlisted event details",
        connector: "Outlook Calendar",
        action: "fetch_events_batch",
        payload: JSON.stringify({ event_ids: ["<shortlisted-event-id>"], batch_size: 20 }, null, 2),
        safety: "Read-only",
        whenToUse: "Only when event body, attendee responses, Teams details, or organizer intent matter."
      }
    ],
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

export const analyzePipeline = (opportunities: PipelineOpportunity[]) =>
  opportunities.map((opportunity) => {
    const riskScore =
      (opportunity.probability < 45 ? 30 : 0) +
      (opportunity.risk === "High" ? 35 : opportunity.risk === "Medium" ? 20 : 5) +
      (/overdue|stalled|security|procurement/i.test(opportunity.nextMove) ? 18 : 0);
    const posture = riskScore >= 55 ? "Could slip" : riskScore >= 32 ? "Watch closely" : "On track";
    return {
      ...opportunity,
      riskScore,
      posture,
      managerNote: `${posture}: ${opportunity.whyItMatters}`
    };
  });

export const buildAccountRecommendations = (accounts: Account[]): Recommendation[] =>
  accounts
    .map((account): Recommendation => {
      const score = clamp(account.fitScore * 0.45 + account.timingScore * 0.35 + (account.health === "Good" ? 20 : 8));
      const priority: Priority = score >= 82 ? "High" : score >= 68 ? "Medium" : "Low";
      return {
        id: `acct-rec-${account.id}`,
        account: account.name,
        contact: account.contacts[0]?.name,
        trigger: account.stage,
        context: account.lastTouch,
        whyItMatters: account.knownPain,
        recommendedAction: account.nextBestMove,
        softCta: "Worth a quick chat to pressure-test the next step?",
        priority,
        confidence: account.researchGaps.length > 1 ? "Medium" : "High",
        source: "manual",
        originatingModule: "Sales Router"
      };
    })
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
