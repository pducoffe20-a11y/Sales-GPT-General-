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
    v1Behavior: "Uses local data and imported sessions to pick the next best workflow and action."
  },
  {
    id: "prospect-strategy",
    displayName: "Prospect Strategy",
    plugin: "D2L Prospect Strategy",
    skills: ["prospect-strategy-workflow", "prospect-enrichment-json", "prospect-research"],
    appSection: "Prospect List Processor",
    purpose: "Normalize, enrich, score, and classify uploaded prospects.",
    futureSources: ["csv_upload", "crm_export", "manual"],
    v1Behavior: "Parses CSV/text/JSON imports and returns Work Now, Light Research, and Suppress records."
  },
  {
    id: "account-signals",
    displayName: "Account Signals",
    plugin: "D2L Account Signals + Sales analyze-account-signals",
    skills: ["net-new-account-workflow", "association-trigger-workflow", "intent-outreach-workflow", "Sales:analyze-account-signals"],
    appSection: "Hot Triggers",
    purpose: "Turn trigger evidence into account action timing.",
    futureSources: ["email", "slack", "sharepoint", "crm_export"],
    v1Behavior: "Scores trigger language from sample and imported data, preserving source/category confidence."
  },
  {
    id: "meeting-deal-ops",
    displayName: "Meeting + Deal Ops",
    plugin: "D2L Meeting Deal Ops + Sales",
    skills: ["pre-call-brief-workflow", "post-call-debrief-workflow", "deal-journey-workflow", "daily-todo-workflow", "Sales:prepare-for-meeting", "Sales:plan-deal-strategy", "Sales:review-forecast"],
    appSection: "Meeting Prep / Pipeline / Tasks",
    purpose: "Prepare calls, debrief notes, analyze pipeline risk, and extract daily tasks.",
    futureSources: ["calendar", "zoom", "email", "crm_export", "sharepoint"],
    v1Behavior: "Generates structured briefs, follow-ups, risk views, and daily task groups from entered or imported evidence."
  },
  {
    id: "outlook-indexing",
    displayName: "Outlook Indexing",
    plugin: "Outlook Email + Outlook Calendar",
    skills: ["outlook-email", "outlook-email-task-extraction", "outlook-calendar"],
    appSection: "Outlook Indexing Layer",
    purpose: "Index bounded email and calendar windows into seller-ready tasks, meeting context, and suppression decisions.",
    futureSources: ["email", "calendar", "crm_export"],
    v1Behavior: "Builds read-only connector payloads and an evidence schema; no Outlook writes happen from indexing mode."
  },
  {
    id: "outreach-messaging",
    displayName: "Outreach Messaging",
    plugin: "D2L Outreach Messaging",
    skills: ["pat-voice", "cold-email", "outbound-sequencing", "codex-email-json-bridge", "codex-review-handoff", "Sales:follow-up-after-call"],
    appSection: "Follow-Up Builder / Pat Voice Checker",
    purpose: "Create short, human, review-safe seller follow-up and outreach.",
    futureSources: ["email", "crm_export", "zoom"],
    v1Behavior: "Drafts review-only follow-ups and flags corporate phrases before Pat copies anything out."
  },
  {
    id: "prospect-dashboards",
    displayName: "Prospect Dashboards",
    plugin: "D2L Prospect Dashboards",
    skills: ["prospect-dashboard-workflow", "seller-side-sales-assistant-workflow"],
    appSection: "Account Action Board",
    purpose: "Make prospect and account data scan-friendly without hiding weak evidence.",
    futureSources: ["csv_upload", "crm_export", "sharepoint"],
    v1Behavior: "Renders imported records as sortable account/prospect boards with explicit evidence gaps."
  },
  {
    id: "linkedin-research",
    displayName: "LinkedIn Research",
    plugin: "LinkedIn + LinkedIn Growth",
    skills: ["linkedin", "linkedin-growth"],
    appSection: "LinkedIn Research Layer",
    purpose: "Turn profile, company, post, and Sales Navigator evidence into safe account research and growth-list handoffs.",
    futureSources: ["linkedin", "sales_navigator", "crm_export"],
    v1Behavior: "Builds research briefs and command plans without sending messages, invites, reactions, comments, or posts."
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
    status: "Available now",
    whatItUnlocks: "Meeting selection, prep deadlines, attendee state, daily schedule, and follow-up timing."
  },
  {
    id: "outlook-email",
    name: "Outlook Email",
    category: "email",
    plugin: "Sales / Outlook Email",
    status: "Available now",
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
