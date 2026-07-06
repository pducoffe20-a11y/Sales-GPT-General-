import type { IntegrationSource, PluginModule } from "../types";

export const pluginModules: PluginModule[] = [
  {
    id: "sales-router",
    displayName: "Sales Router",
    plugin: "Sales + D2L Sales Router",
    skills: ["Sales:index", "d2l-sales-workflow-index", "sales-assistant-workflow"],
    appSection: "Today Command Center",
    purpose: "Route broad seller questions into the narrowest useful workflow.",
    futureSources: ["crm_export", "calendar", "email", "sharepoint", "slack"],
    currentBehavior: "Uses local, imported, and connector-indexed evidence to pick the next best workflow and action.",
    agentWork: [
      {
        id: "sales-router-prioritize",
        label: "Prioritize the queue",
        evidenceInputs: ["manual", "crm_export", "calendar", "email"],
        reasoning: "Weigh urgency, account value, meeting timing, overdue touch state, and confidence before ranking seller work.",
        output: "A ranked next-action queue with whyItMatters, recommendedAction, softCta, confidence, source, and originatingModule intact.",
        handoff: "Send the winning action to Meeting + Deal Ops, Outreach Messaging, Prospect Strategy, or Outlook Indexing.",
        confidenceRule: "High confidence needs a concrete trigger plus an account, owner, and visible next step.",
        guardrail: "Route work only; do not send, schedule, update CRM, or write to external tools."
      },
      {
        id: "sales-router-momentum",
        label: "Resolve momentum gaps",
        evidenceInputs: ["crm_export", "manual"],
        reasoning: "Compare fit, timing, nextTouchDue, health, and known pain to find accounts that need a same-day decision.",
        output: "A focus account, a reason to act, and the smallest useful next move.",
        handoff: "Open the Account Action Board when the missing evidence matters more than drafting.",
        confidenceRule: "Downgrade confidence when researchGaps outnumber verified buyer signals.",
        guardrail: "Keep weak signals visible instead of converting them into tasks."
      }
    ]
  },
  {
    id: "prospect-strategy",
    displayName: "Prospect Strategy",
    plugin: "D2L Prospect Strategy",
    skills: ["prospect-strategy-workflow", "prospect-enrichment-json", "prospect-research"],
    appSection: "Prospect List Processor",
    purpose: "Normalize, enrich, score, and classify uploaded prospects.",
    futureSources: ["csv_upload", "crm_export", "manual"],
    currentBehavior: "Parses CSV/text/JSON imports and returns Work Now, Light Research, and Suppress records.",
    agentWork: [
      {
        id: "prospect-strategy-profile",
        label: "Profile the import",
        evidenceInputs: ["csv_upload", "crm_export", "manual", "pasted_notes"],
        reasoning: "Detect delimiters, map messy headers to canonical sales fields, and score how complete the evidence is for the chosen workflow.",
        output: "A column profile, mapped-field count, parse warnings, and workflow handoff prompt.",
        handoff: "Route prospect rows to the dashboard, pipeline rows to Deal Journey, and meeting notes to Pre-Call Brief.",
        confidenceRule: "High confidence requires most recommended fields plus an evidence note or trigger.",
        guardrail: "Do not infer missing titles, emails, budget, or timing when the import did not provide them."
      },
      {
        id: "prospect-strategy-suppress",
        label: "Suppress weak records",
        evidenceInputs: ["csv_upload", "crm_export", "manual"],
        reasoning: "Separate Work Now, Light Research, and Suppress by fit, urgency, persona, and evidence so seller time is protected.",
        output: "A scored board with verified facts, unknowns, first checks, and review-safe recommendations.",
        handoff: "Export CSV/JSON for dashboard review or a downstream D2L prospect workflow.",
        confidenceRule: "A Work Now record needs strong fit plus either timing, persona, or source-note evidence.",
        guardrail: "Suppress thin records until stronger account or contact evidence appears."
      }
    ]
  },
  {
    id: "account-signals",
    displayName: "Account Signals",
    plugin: "D2L Account Signals + Sales analyze-account-signals",
    skills: ["net-new-account-workflow", "association-trigger-workflow", "intent-outreach-workflow", "Sales:analyze-account-signals"],
    appSection: "Hot Triggers",
    purpose: "Turn trigger evidence into account action timing.",
    futureSources: ["email", "slack", "sharepoint", "crm_export"],
    currentBehavior: "Scores trigger language from sample, imported, and connector-indexed data while preserving source/category confidence.",
    agentWork: [
      {
        id: "account-signals-triage",
        label: "Triage trigger language",
        evidenceInputs: ["email", "slack", "sharepoint", "crm_export", "manual"],
        reasoning: "Look for budget, renewal, executive, compliance, platform pain, new-role, and deadline language before raising urgency.",
        output: "A trigger record with whyItMatters, recommendedAction, signalStrength, and source.",
        handoff: "Escalate hot triggers to Sales Router or Meeting + Deal Ops for action framing.",
        confidenceRule: "High signal requires a named account and a concrete timing or buying-change clue.",
        guardrail: "Do not treat internal excitement or broad news as buyer commitment."
      },
      {
        id: "account-signals-merge",
        label: "Merge duplicate signals",
        evidenceInputs: ["email", "sharepoint", "crm_export"],
        reasoning: "Group repeated trigger mentions by account so one buyer event does not create duplicate tasks.",
        output: "A consolidated trigger with the strongest evidence line kept visible.",
        handoff: "Attach merged signals to the account action board and daily queue.",
        confidenceRule: "Repeated weak mentions improve visibility, not owner or due-date certainty.",
        guardrail: "Keep ambiguous ownership out of Pat-owned tasks."
      }
    ]
  },
  {
    id: "meeting-deal-ops",
    displayName: "Meeting + Deal Ops",
    plugin: "D2L Meeting Deal Ops + Sales",
    skills: ["pre-call-brief-workflow", "post-call-debrief-workflow", "deal-journey-workflow", "daily-todo-workflow", "Sales:prepare-for-meeting", "Sales:plan-deal-strategy", "Sales:review-forecast"],
    appSection: "Meeting Prep / Pipeline / Tasks",
    purpose: "Prepare calls, debrief notes, analyze pipeline risk, and extract daily tasks.",
    futureSources: ["calendar", "zoom", "email", "crm_export", "sharepoint"],
    currentBehavior: "Generates structured briefs, follow-ups, risk views, and daily task groups from entered, imported, or connector-indexed evidence.",
    agentWork: [
      {
        id: "meeting-deal-brief",
        label: "Build the call brief",
        evidenceInputs: ["manual", "calendar", "crm_export", "zoom"],
        reasoning: "Convert meeting notes, role, vertical, competitor pressure, and recent activity into value angles, questions, objections, and unknowns.",
        output: "A pre-call brief plus review-only follow-up draft.",
        handoff: "Move post-call notes to Follow-Up Builder and Pat Voice Checker before external use.",
        confidenceRule: "A strong brief names buyer pain, meeting objective, and at least one unknown to confirm.",
        guardrail: "Unknowns stay explicit; the brief does not invent procurement, budget, or platform facts."
      },
      {
        id: "meeting-deal-risk",
        label: "Pressure-test deal risk",
        evidenceInputs: ["crm_export", "calendar", "email"],
        reasoning: "Blend probability, risk label, close date, stage, and next-move language to surface slippage before forecast review.",
        output: "Pipeline posture, slip-risk score, weighted value, and the next risk test.",
        handoff: "Route slipping deals to Sales Router or a manager-review note.",
        confidenceRule: "Risk confidence improves when the next move is buyer-owned and time-bound.",
        guardrail: "Do not change forecast state; this is analysis until Pat approves a CRM action."
      }
    ]
  },
  {
    id: "outlook-indexing",
    displayName: "Outlook Indexing",
    plugin: "Outlook Email + Outlook Calendar",
    skills: ["outlook-email", "outlook-email-task-extraction", "outlook-calendar"],
    appSection: "Outlook Live Workbench",
    purpose: "Index bounded email and calendar windows into seller-ready tasks, meeting context, and suppression decisions.",
    futureSources: ["email", "calendar", "crm_export"],
    currentBehavior: "Builds live read requests, ingests Outlook Email/Calendar connector output, and turns evidence into tasks without Outlook writes.",
    agentWork: [
      {
        id: "outlook-index-normalize",
        label: "Normalize connector payloads",
        evidenceInputs: ["email", "calendar"],
        reasoning: "Parse Outlook Email and Calendar responses into message indexes, event indexes, task candidates, and suppression logs.",
        output: "Dynamic task candidates with owner, due date, evidence, source IDs, and confidence.",
        handoff: "Send concrete Pat-owned work to the daily task board and ambiguous items to confirmation.",
        confidenceRule: "A task candidate needs source evidence plus owner, account, and action language.",
        guardrail: "No Outlook writes, sends, moves, categories, meeting edits, or CRM updates from indexing mode."
      },
      {
        id: "outlook-index-suppress",
        label: "Audit suppressions",
        evidenceInputs: ["email", "calendar"],
        reasoning: "Filter newsletters, automated messages, internal-only calendar items, and non-prospect noise before they pollute the worklist.",
        output: "Suppression log with source ID, reason, and evidence.",
        handoff: "Keep suppressed items inspectable for review rather than deleting them.",
        confidenceRule: "Suppress only when the item lacks concrete external-prospect work.",
        guardrail: "Calendar and mailbox scans stay bounded by the selected window."
      }
    ]
  },
  {
    id: "outreach-messaging",
    displayName: "Outreach Messaging",
    plugin: "D2L Outreach Messaging",
    skills: ["pat-voice", "cold-email", "outbound-sequencing", "codex-email-json-bridge", "codex-review-handoff", "Sales:follow-up-after-call"],
    appSection: "Follow-Up Builder / Pat Voice Checker",
    purpose: "Create short, human, review-safe seller follow-up and outreach.",
    futureSources: ["email", "crm_export", "zoom"],
    currentBehavior: "Drafts review-only follow-ups and flags corporate phrases before Pat copies anything out.",
    agentWork: [
      {
        id: "outreach-draft",
        label: "Draft the review artifact",
        evidenceInputs: ["manual", "zoom", "email", "crm_export"],
        reasoning: "Turn call recap, buyer care-about, next step, blocker, account, and contact into a short email, CRM note, and task.",
        output: "Review-only email, CRM note, next task, suggested follow-up timing, and flags.",
        handoff: "Pass the draft through Pat Voice Checker before copy-out.",
        confidenceRule: "High confidence needs a buyer-specific pain and an agreed next step.",
        guardrail: "Drafts are artifacts only; no send, post, or CRM write behavior."
      },
      {
        id: "outreach-voice",
        label: "Run Pat voice review",
        evidenceInputs: ["manual", "email"],
        reasoning: "Flag banned phrases, missing buyer relevance, long sentences, weak CTA language, and filler.",
        output: "Cleaner rewrite, phrase flags, relevance check, and CTA suggestion.",
        handoff: "Return to Follow-Up Builder when the message needs more buyer evidence.",
        confidenceRule: "A usable rewrite keeps buyer context before any D2L claim.",
        guardrail: "Do not over-polish into corporate language or imply approval to send."
      }
    ]
  },
  {
    id: "prospect-dashboards",
    displayName: "Prospect Dashboards",
    plugin: "D2L Prospect Dashboards",
    skills: ["prospect-dashboard-workflow", "seller-side-sales-assistant-workflow"],
    appSection: "Account Action Board",
    purpose: "Make prospect and account data scan-friendly without hiding weak evidence.",
    futureSources: ["csv_upload", "crm_export", "sharepoint"],
    currentBehavior: "Renders imported and connector-indexed records as sortable account/prospect boards with explicit evidence gaps.",
    agentWork: [
      {
        id: "dashboard-map",
        label: "Map account momentum",
        evidenceInputs: ["manual", "crm_export", "csv_upload"],
        reasoning: "Compare fit, timing, relationship, health, value, buying committee, and research gaps before surfacing an account.",
        output: "Momentum map, account focus, committee view, competitive watch, and next best move.",
        handoff: "Send research gaps to Prospect Strategy or LinkedIn Research before outreach.",
        confidenceRule: "Dashboard confidence drops when committee, budget, or timing evidence is missing.",
        guardrail: "Show gaps beside recommendations instead of hiding them in a summary."
      },
      {
        id: "dashboard-proof",
        label: "Preserve proof trails",
        evidenceInputs: ["sharepoint", "crm_export", "csv_upload"],
        reasoning: "Keep verified facts, source categories, and unknowns visible so account action stays auditable.",
        output: "Scan-friendly account and prospect board with evidence gaps.",
        handoff: "Feed clean proof points into Meeting Prep or Follow-Up Builder.",
        confidenceRule: "Proof is stronger when it comes from CRM/exported source data rather than seller memory alone.",
        guardrail: "No hidden enrichment claims without a connector-backed source."
      }
    ]
  },
  {
    id: "linkedin-research",
    displayName: "LinkedIn Research",
    plugin: "LinkedIn + LinkedIn Growth",
    skills: ["linkedin", "linkedin-growth"],
    appSection: "LinkedIn Research Layer",
    purpose: "Turn profile, company, post, and Sales Navigator evidence into safe account research and growth-list handoffs.",
    futureSources: ["linkedin", "sales_navigator", "crm_export"],
    currentBehavior: "Builds research briefs and command plans without sending messages, invites, reactions, comments, or posts.",
    agentWork: [
      {
        id: "linkedin-verify",
        label: "Verify buyer relevance",
        evidenceInputs: ["linkedin", "sales_navigator", "manual"],
        reasoning: "Check role, account, profile URL, company URL, ICP, notes, and recent signal before producing a buyer angle.",
        output: "Research readiness, verified signals, buyer angles, evidence gaps, and safe next actions.",
        handoff: "Route useful findings to Prospect Strategy, Meeting Prep, or Pat Voice.",
        confidenceRule: "High readiness needs profile/company evidence plus role or ICP fit.",
        guardrail: "Research only; no invites, messages, reactions, comments, or posts."
      },
      {
        id: "linkedin-growth",
        label: "Prepare growth handoff",
        evidenceInputs: ["sales_navigator", "linkedin", "crm_export"],
        reasoning: "Turn a search URL, list name, ICP, and limit into a bounded import plan with qualification rules.",
        output: "Command plan and growth-pipeline readiness checklist.",
        handoff: "Send the resulting list to Prospect Strategy for qualification before outreach.",
        confidenceRule: "A growth list is not ready until ICP and account mapping are explicit.",
        guardrail: "Network maintenance and invite pacing require explicit confirmation outside this screen."
      }
    ]
  }
];

export const integrationSources: IntegrationSource[] = [
  {
    id: "csv",
    name: "CSV Uploads",
    category: "csv_upload",
    plugin: "Built in now",
    status: "Available now",
    whatItUnlocks: "Prospect lists, account lists, contact exports, meeting exports, task exports, and CRM snapshots."
  },
  {
    id: "outlook-calendar",
    name: "Outlook Calendar",
    category: "calendar",
    plugin: "Sales / Outlook Calendar",
    status: "Live connector",
    whatItUnlocks: "Meeting selection, prep deadlines, attendee state, daily schedule, and follow-up timing."
  },
  {
    id: "outlook-email",
    name: "Outlook Email",
    category: "email",
    plugin: "Sales / Outlook Email",
    status: "Live connector",
    whatItUnlocks: "Recent customer threads, overdue replies, explicit asks, deadlines, ownership evidence, and draft review."
  },
  {
    id: "slack",
    name: "Slack",
    category: "slack",
    plugin: "Sales / Slack",
    status: "Future connector",
    whatItUnlocks: "Internal account mentions, coworker updates, blockers, and action items."
  },
  {
    id: "sharepoint",
    name: "SharePoint / OneDrive",
    category: "sharepoint",
    plugin: "Sales / SharePoint",
    status: "Future connector",
    whatItUnlocks: "Sales docs, customer files, proposals, battlecards, and account notes."
  },
  {
    id: "zoom",
    name: "Zoom",
    category: "zoom",
    plugin: "Sales / Zoom",
    status: "Future connector",
    whatItUnlocks: "Meeting summaries, recordings, transcripts, decisions, and action items."
  },
  {
    id: "crm",
    name: "Salesforce / CRM Exports",
    category: "crm_export",
    plugin: "Sales CRM lane",
    status: "Available now",
    whatItUnlocks: "Account truth, contacts, opportunities, stages, close dates, next steps, and forecast review."
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    category: "linkedin",
    plugin: "LinkedIn skill",
    status: "Future connector",
    whatItUnlocks: "Profile research, company pages, posts, comments, connection status, and buyer-role verification."
  },
  {
    id: "sales-navigator",
    name: "Sales Navigator",
    category: "sales_navigator",
    plugin: "LinkedIn Growth skill",
    status: "Future connector",
    whatItUnlocks: "Search imports, ICP qualification, list assignment, pipeline status, invite pacing, and stale pending checks."
  }
];
