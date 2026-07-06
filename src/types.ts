export type Priority = "High" | "Medium" | "Low";
export type Confidence = "High" | "Medium" | "Low";
export type ProspectStatus = "Work Now" | "Light Research" | "Suppress";
export type AccountResearchStatus = "Work Now" | "Research First" | "Defer";
export type ImportPurpose = "prospect_research" | "pipeline_review" | "task_flow" | "meeting_brief";
export type CanonicalImportField =
  | "organization"
  | "fullName"
  | "title"
  | "email"
  | "vertical"
  | "notes"
  | "amount"
  | "stage"
  | "closeDate"
  | "probability"
  | "nextStep"
  | "dueDate"
  | "priority";
export type SourceCategory =
  | "csv_upload"
  | "pasted_notes"
  | "crm_export"
  | "calendar"
  | "email"
  | "linkedin"
  | "sales_navigator"
  | "slack"
  | "sharepoint"
  | "zoom"
  | "manual";

export interface IntegrationSource {
  id: string;
  name: string;
  category: SourceCategory;
  plugin: string;
  status: "Live connector" | "Available now" | "Future connector" | "Mock only";
  whatItUnlocks: string;
}

export interface Recommendation {
  id: string;
  account: string;
  contact?: string;
  trigger: string;
  context: string;
  whyItMatters: string;
  recommendedAction: string;
  softCta: string;
  priority: Priority;
  confidence: Confidence;
  source: SourceCategory;
  originatingModule: string;
}

export interface Contact {
  id: string;
  accountId: string;
  name: string;
  title: string;
  email?: string;
  persona: "Champion" | "Influencer" | "Economic Buyer" | "Technical Buyer" | "Blocker" | "Unknown";
  relationship: "Warm" | "Active" | "New" | "Stalled" | "Unknown";
  notes: string;
}

export interface Account {
  id: string;
  name: string;
  vertical: string;
  stage: string;
  fitScore: number;
  timingScore: number;
  relationshipStatus: string;
  knownPain: string;
  buyingCommittee: string[];
  nextBestMove: string;
  researchGaps: string[];
  lastTouch: string;
  nextTouchDue: string;
  amount?: number;
  probability?: number;
  health: "Good" | "Watch" | "Risk";
  competitors: Competitor[];
  contacts: Contact[];
}

export interface Meeting {
  id: string;
  accountId: string;
  contactId: string;
  title: string;
  time: string;
  type: "Discovery" | "Demo" | "Executive Review" | "Workshop" | "Stakeholder Call";
  mode: "Video" | "Onsite";
  prepStatus: "Good" | "Medium" | "Needs work";
  notes: string;
}

export interface Task {
  id: string;
  source: SourceCategory;
  context: string;
  account: string;
  contact?: string;
  concreteNextAction: string;
  whyItMatters: string;
  due: string;
  priority: Priority;
  group: "Top Priorities" | "Meeting Prep And Time-Bound Tasks" | "Follow-Ups And Responses" | "If Time Allows";
  owner: "Pat" | "Prospect" | "Ambiguous";
}

export interface Brief {
  accountSnapshot: string;
  contactAngle: string;
  valueAngles: string[];
  discoveryQuestions: string[];
  likelyObjections: string[];
  opener: string;
  softNextStepAsk: string;
  followUpDraft: string;
  unknownsToConfirm: string[];
}

export interface EmailDraft {
  id: string;
  to: string;
  account: string;
  subject: string;
  context: string;
  body: string;
  lastEdited: string;
  reviewFlags: string[];
}

export interface Trigger {
  id: string;
  account: string;
  contact?: string;
  trigger: string;
  whyItMatters: string;
  recommendedAction: string;
  signalStrength: Priority;
  source: SourceCategory;
}

export interface Competitor {
  name: string;
  note: string;
  risk: Priority;
}

export interface OpportunityNote {
  id: string;
  date: string;
  account: string;
  note: string;
  evidence: string;
}

export interface PipelineOpportunity {
  id: string;
  accountId: string;
  account: string;
  stage: string;
  amount: number;
  closeDate: string;
  probability: number;
  forecast: "Commit" | "Best Case" | "Pipeline" | "At Risk";
  risk: Priority;
  nextMove: string;
  whyItMatters: string;
}


export interface AccountResearchRecord {
  accountName: string;
  importedFields: Record<string, string>;
  icpFit: {
    status: AccountResearchStatus;
    score: number;
    rationale: string;
  };
  verticalFit: string;
  memberTrainingFit: string;
  publicEvidence: string[];
  knownContacts: string[];
  linkedinSignals: string[];
  pipelineConnections: string[];
  whyNow: string[];
  researchGaps: string[];
  nextBestMove: string;
  confidence: Confidence;
}

export interface ProspectRecord {
  prospectId: string;
  fullName: string | null;
  title: string | null;
  organization: string | null;
  email: string | null;
  category: string | null;
  status: ProspectStatus;
  scoreTotal: number;
  scores: {
    fit: number;
    urgency: number;
    persona: number;
    evidence: number;
  };
  verifiedFacts: string[];
  inferredPains: string[];
  unknowns: string[];
  whatToCheckFirst: string[];
  evidenceNotes: string[];
  recommendedActions: Recommendation[];
}

export interface ProspectUpload {
  id: string;
  sourceName: string;
  sourceType: SourceCategory;
  purpose: ImportPurpose;
  generatedAt: string;
  originalRows: Record<string, string>[];
  profile: ImportProfile;
  records: ProspectRecord[];
  accountResearchRecords: AccountResearchRecord[];
  boardSummary: {
    total: number;
    workNow: number;
    lightResearch: number;
    suppress: number;
    commonThemes: string[];
    evidenceGaps: string[];
    recommendedNextChecks: string[];
  };
  parseWarnings: string[];
  handoffPrompt: string;
  exportCsv: string;
  handoffJson: string;
}

export type LinkedInResearchIntent = "account_research" | "person_research" | "growth_pipeline";

export interface LinkedInCommandPlan {
  id: string;
  label: string;
  command: string;
  category: "Research" | "Growth Pipeline" | "Status";
  safety: "Read-only" | "Requires confirmation";
}

export interface LinkedInResearchBrief {
  id: string;
  intent: LinkedInResearchIntent;
  generatedAt: string;
  accountName: string;
  personName: string;
  title: string;
  profileUrl: string;
  companyUrl: string;
  searchUrl: string;
  listName: string;
  limit: string;
  readiness: Confidence;
  researchScore: number;
  verifiedSignals: string[];
  buyerAngles: string[];
  evidenceGaps: string[];
  safeNextActions: string[];
  commandPlans: LinkedInCommandPlan[];
  growthPipeline: {
    importPhase: string[];
    qualificationRules: string[];
    networkMaintenance: string[];
  };
}

export type OutlookIndexMode = "daily_sales_scan" | "weekly_pipeline_prep" | "account_research";

export interface OutlookIndexCommand {
  id: string;
  label: string;
  connector: "Outlook Email" | "Outlook Calendar";
  action: string;
  method: "connector" | "http";
  endpoint?: string;
  payload: string;
  safety: "Read-only" | "Requires confirmation";
  whenToUse: string;
}

export interface OutlookIndexedMessage {
  id: string;
  subject: string;
  sender: string;
  receivedAt: string;
  preview: string;
  account: string;
  sourceLink?: string;
  signalStrength: Priority;
}

export interface OutlookIndexedEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  organizer: string;
  attendees: string[];
  account: string;
  responseState: string;
  sourceLink?: string;
  signalStrength: Priority;
}

export interface OutlookSuppression {
  id: string;
  sourceId: string;
  sourceType: "email" | "calendar";
  reason: string;
  evidence: string;
}

export interface OutlookIndexPlan {
  id: string;
  mode: OutlookIndexMode;
  generatedAt: string;
  mailboxLabel: string;
  startDate: string;
  endDate: string;
  emailQuery: string;
  calendarFocus: string;
  readiness: Confidence;
  indexScore: number;
  stats: {
    emailStages: number;
    calendarStages: number;
    writeActions: number;
    indexedMessages: number;
    indexedEvents: number;
    taskCandidates: number;
    suppressions: number;
  };
  connectorState: "Ready for live adapter" | "Dynamic evidence loaded" | "Needs connector payload" | "Parse error";
  stages: Array<{
    id: string;
    label: string;
    connector: "Outlook Email" | "Outlook Calendar" | "Command Center";
    description: string;
  }>;
  indexSchema: Array<{
    label: string;
    fields: string[];
    purpose: string;
  }>;
  evidenceRules: string[];
  suppressionRules: string[];
  commandPlans: OutlookIndexCommand[];
  messageIndex: OutlookIndexedMessage[];
  eventIndex: OutlookIndexedEvent[];
  taskCandidates: Task[];
  liveRecommendations: Recommendation[];
  suppressionLog: OutlookSuppression[];
  parseWarnings: string[];
  handoffJson: string;
}

export interface ImportProfile {
  delimiter: "comma" | "tab" | "semicolon" | "pipe" | "json" | "unknown";
  rowCount: number;
  columns: string[];
  mappedFields: Partial<Record<CanonicalImportField, string>>;
  missingRecommendedFields: CanonicalImportField[];
  confidence: Confidence;
  purposeLabel: string;
  suggestedWorkflow: string;
}

export interface Battlecard {
  competitor: string;
  risks: string[];
  positioning: string[];
  proofToUse: string[];
}

export interface FollowUpDraft {
  email: string;
  crmNote: string;
  nextTask: Task;
  suggestedFollowUpDate: string;
  reviewFlags: string[];
}

export interface AgentOutput {
  moduleId: string;
  moduleName: string;
  summary: string;
  recommendations: Recommendation[];
  generatedAt: string;
  handoffPrompt: string;
}

export interface ModuleAgentWork {
  id: string;
  label: string;
  evidenceInputs: SourceCategory[];
  reasoning: string;
  output: string;
  handoff: string;
  confidenceRule: string;
  guardrail: string;
}

export interface PluginModule {
  id: string;
  displayName: string;
  plugin: string;
  skills: string[];
  appSection: string;
  purpose: string;
  futureSources: SourceCategory[];
  currentBehavior: string;
  agentWork: ModuleAgentWork[];
}
