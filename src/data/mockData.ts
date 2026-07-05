import type {
  Account,
  EmailDraft,
  Meeting,
  PipelineOpportunity,
  Recommendation,
  Task,
  Trigger
} from "../types";

export const accounts: Account[] = [
  {
    id: "acct-naso",
    name: "National Assoc. of Shop Owners",
    vertical: "Association / Trade",
    stage: "Demo / Evaluation",
    fitScore: 84,
    timingScore: 88,
    relationshipStatus: "Active champion",
    knownPain: "Member training is split across webinars, PDFs, and local chapter tools.",
    buyingCommittee: ["Champion", "Influencer", "Economic Buyer", "Blocker"],
    nextBestMove: "Move product demo into a pilot plan with success criteria.",
    researchGaps: ["Confirm budget owner", "Confirm LMS incumbent renewal date"],
    lastTouch: "Today",
    nextTouchDue: "Today",
    amount: 185000,
    probability: 75,
    health: "Good",
    competitors: [
      { name: "Cornerstone", note: "Strong brand, deeper marketing", risk: "High" },
      { name: "Absorb LMS", note: "Pricing advantage", risk: "Medium" },
      { name: "TalentLMS", note: "Used by a few chapters", risk: "Medium" }
    ],
    contacts: [
      {
        id: "c-tom",
        accountId: "acct-naso",
        name: "Tom Reynolds",
        title: "VP, Learning & Workforce Development",
        email: "tom.reynolds@example.org",
        persona: "Champion",
        relationship: "Active",
        notes: "Likes the member-experience angle and asked for pilot scope."
      },
      {
        id: "c-lisa",
        accountId: "acct-naso",
        name: "Lisa Grant",
        title: "Director, Learning Operations",
        email: "lisa.grant@example.org",
        persona: "Influencer",
        relationship: "Warm",
        notes: "Owns day-to-day learning operations and chapter training consistency."
      },
      {
        id: "c-mark",
        accountId: "acct-naso",
        name: "Mark Feldman",
        title: "CFO",
        persona: "Economic Buyer",
        relationship: "New",
        notes: "Needs business case and risk controls before pilot approval."
      }
    ]
  },
  {
    id: "acct-hesa",
    name: "Healthcare Educators Association",
    vertical: "Healthcare credentialing",
    stage: "Discovery",
    fitScore: 91,
    timingScore: 79,
    relationshipStatus: "Warm contact",
    knownPain: "CE compliance is expanding faster than the current portal can support.",
    buyingCommittee: ["Champion", "Technical Buyer", "Economic Buyer"],
    nextBestMove: "Run a solution workshop focused on CE reporting and audit readiness.",
    researchGaps: ["Confirm regulatory deadline", "Find IT/security counterpart"],
    lastTouch: "Yesterday",
    nextTouchDue: "Tomorrow",
    amount: 220000,
    probability: 48,
    health: "Good",
    competitors: [
      { name: "EthosCE", note: "Healthcare-specific footprint", risk: "High" },
      { name: "Docebo", note: "Modern UX story", risk: "Medium" }
    ],
    contacts: [
      {
        id: "c-sarah",
        accountId: "acct-hesa",
        name: "Sarah Mitchell",
        title: "Director of Education",
        email: "sarah.mitchell@example.org",
        persona: "Champion",
        relationship: "Warm",
        notes: "Asked for examples of CE programs with cleaner audit trails."
      },
      {
        id: "c-dev",
        accountId: "acct-hesa",
        name: "Dev Patel",
        title: "IT Security Manager",
        persona: "Technical Buyer",
        relationship: "Unknown",
        notes: "Not yet engaged."
      }
    ]
  },
  {
    id: "acct-sms",
    name: "State Medical Society",
    vertical: "Professional association",
    stage: "Proposal",
    fitScore: 86,
    timingScore: 74,
    relationshipStatus: "Proposal out",
    knownPain: "The education team wants one member learning home before annual conference.",
    buyingCommittee: ["Champion", "Influencer", "Technical Buyer"],
    nextBestMove: "Follow up on proposal and offer stakeholder call.",
    researchGaps: ["Procurement path", "Executive sponsor"],
    lastTouch: "10 days ago",
    nextTouchDue: "Overdue",
    amount: 164000,
    probability: 62,
    health: "Watch",
    competitors: [
      { name: "LearnUpon", note: "Simple deployment pitch", risk: "Medium" }
    ],
    contacts: [
      {
        id: "c-leena",
        accountId: "acct-sms",
        name: "Dr. Leena Park",
        title: "Director, Education",
        email: "leena.park@example.org",
        persona: "Champion",
        relationship: "Active",
        notes: "Asked for proposal language tied to conference-readiness."
      }
    ]
  },
  {
    id: "acct-mma",
    name: "Midwest Manufacturers Alliance",
    vertical: "Manufacturing / Trade",
    stage: "Solution Workshop",
    fitScore: 78,
    timingScore: 66,
    relationshipStatus: "Early active",
    knownPain: "Plant safety and skills training vary by region.",
    buyingCommittee: ["Champion", "Economic Buyer"],
    nextBestMove: "Map training consistency story to workforce outcomes.",
    researchGaps: ["Confirm member training budget", "Identify operations executive"],
    lastTouch: "4 days ago",
    nextTouchDue: "Tomorrow",
    amount: 94000,
    probability: 35,
    health: "Good",
    competitors: [
      { name: "Moodle partner", note: "Low-cost incumbent pattern", risk: "Medium" }
    ],
    contacts: [
      {
        id: "c-dana",
        accountId: "acct-mma",
        name: "Dana Keller",
        title: "VP Member Programs",
        persona: "Champion",
        relationship: "Warm",
        notes: "Cares about practical rollouts more than platform breadth."
      }
    ]
  },
  {
    id: "acct-cbc",
    name: "Community Bankers Council",
    vertical: "Banking association",
    stage: "Stakeholder Call",
    fitScore: 82,
    timingScore: 71,
    relationshipStatus: "Competitor displacement",
    knownPain: "Compliance training updates are slow and hard to prove to member banks.",
    buyingCommittee: ["Champion", "Influencer", "Blocker"],
    nextBestMove: "Schedule discovery call around audit readiness and member consistency.",
    researchGaps: ["Confirm competitor contract date", "Find compliance lead"],
    lastTouch: "2 days ago",
    nextTouchDue: "May 22",
    amount: 122000,
    probability: 42,
    health: "Watch",
    competitors: [
      { name: "Absorb LMS", note: "Incumbent in renewal window", risk: "High" }
    ],
    contacts: [
      {
        id: "c-alex",
        accountId: "acct-cbc",
        name: "Alex Rivera",
        title: "Director, Member Education",
        persona: "Champion",
        relationship: "Warm",
        notes: "Mentioned possible competitor renewal."
      }
    ]
  }
];

export const meetings: Meeting[] = [
  {
    id: "m-1",
    accountId: "acct-hesa",
    contactId: "c-sarah",
    title: "Executive review",
    time: "9:00 AM",
    type: "Executive Review",
    mode: "Video",
    prepStatus: "Good",
    notes: "Focus on CE compliance, audit readiness, and implementation risk."
  },
  {
    id: "m-2",
    accountId: "acct-naso",
    contactId: "c-tom",
    title: "Product demo",
    time: "10:30 AM",
    type: "Demo",
    mode: "Onsite",
    prepStatus: "Good",
    notes: "Use pilot framing and ask for success criteria."
  },
  {
    id: "m-3",
    accountId: "acct-mma",
    contactId: "c-dana",
    title: "Solution workshop",
    time: "1:00 PM",
    type: "Workshop",
    mode: "Video",
    prepStatus: "Medium",
    notes: "Bring workforce training consistency angle."
  },
  {
    id: "m-4",
    accountId: "acct-cbc",
    contactId: "c-alex",
    title: "Stakeholder call",
    time: "3:30 PM",
    type: "Stakeholder Call",
    mode: "Video",
    prepStatus: "Good",
    notes: "Competitor renewal and compliance reporting."
  }
];

export const triggers: Trigger[] = [
  {
    id: "tr-1",
    account: "National Assoc. of Shop Owners",
    contact: "Tom Reynolds",
    trigger: "New budget approved for LMS",
    whyItMatters: "Green light to buy and a clear reason to move from demo into pilot.",
    recommendedAction: "Move demo conversation into pilot plan.",
    signalStrength: "High",
    source: "manual"
  },
  {
    id: "tr-2",
    account: "Community Bankers Council",
    contact: "Alex Rivera",
    trigger: "Competitor contract renewal",
    whyItMatters: "Open window to compare audit readiness and member consistency.",
    recommendedAction: "Schedule discovery call around renewal timing.",
    signalStrength: "High",
    source: "manual"
  },
  {
    id: "tr-3",
    account: "Healthcare Educators Association",
    contact: "Sarah Mitchell",
    trigger: "New learning strategy initiative",
    whyItMatters: "CE compliance and reporting needs could be funded this quarter.",
    recommendedAction: "Propose solution workshop.",
    signalStrength: "Medium",
    source: "manual"
  }
];

export const draftEmails: EmailDraft[] = [
  {
    id: "d-1",
    to: "Dr. Leena Park",
    account: "State Medical Society",
    subject: "Proposal and conference timeline",
    context: "Proposal follow-up",
    body: "Hi Leena - I wanted to send a quick note on the proposal and the conference timeline you mentioned. The part that stood out is how much easier this gets when the education team has one clean place for CE delivery and reporting. Worth a quick call to pressure-test the rollout path?",
    lastEdited: "9:15 AM",
    reviewFlags: ["Confirm conference date before sending."]
  },
  {
    id: "d-2",
    to: "Michael Tran",
    account: "Retail & Restaurant Educators",
    subject: "Customer story you requested",
    context: "Case study share",
    body: "Hi Michael - sending the customer story we talked about. The useful part is less the logo and more how they simplified recurring training for a distributed member base. Curious if that maps to what your team is trying to fix.",
    lastEdited: "Yesterday",
    reviewFlags: ["Needs customer-story link."]
  }
];

export const pipeline: PipelineOpportunity[] = accounts.map((account) => ({
  id: `opp-${account.id}`,
  accountId: account.id,
  account: account.name,
  stage: account.stage,
  amount: account.amount ?? 0,
  closeDate: account.nextTouchDue === "Overdue" ? "May 31" : account.nextTouchDue,
  probability: account.probability ?? 20,
  forecast: account.health === "Risk" ? "At Risk" : account.probability && account.probability > 70 ? "Best Case" : "Pipeline",
  risk: account.health === "Good" ? "Low" : account.health === "Watch" ? "Medium" : "High",
  nextMove: account.nextBestMove,
  whyItMatters: account.knownPain
}));

export const todayRecommendations: Recommendation[] = [
  {
    id: "r-1",
    account: "State Medical Society",
    contact: "Dr. Leena Park",
    trigger: "Proposal sent 5/2 with no response",
    context: "Proposal follow-up",
    whyItMatters: "The deal can stall before conference planning if there is no next stakeholder conversation.",
    recommendedAction: "Follow up and offer a stakeholder call.",
    softCta: "Worth a quick call to pressure-test the rollout path?",
    priority: "High",
    confidence: "High",
    source: "manual",
    originatingModule: "Meeting + Deal Ops"
  },
  {
    id: "r-2",
    account: "National Assoc. of Shop Owners",
    contact: "Tom Reynolds",
    trigger: "Budget approved for LMS",
    context: "Demo today",
    whyItMatters: "There is a credible path from demo to pilot if success criteria are named now.",
    recommendedAction: "Move demo into pilot scope and ask who else needs to weigh in.",
    softCta: "Would it be useful to sketch a small pilot plan from here?",
    priority: "High",
    confidence: "High",
    source: "manual",
    originatingModule: "Account Signals"
  },
  {
    id: "r-3",
    account: "Precision Machining Assn.",
    contact: "Dana McElroy",
    trigger: "Needs reporting capability",
    context: "Discovery notes",
    whyItMatters: "Reporting is the concrete pain that can make Brightspace feel practical instead of broad.",
    recommendedAction: "Share a reporting ROI deck and ask what proof matters.",
    softCta: "Happy to send the short reporting example if useful.",
    priority: "Medium",
    confidence: "Medium",
    source: "manual",
    originatingModule: "Sales Router"
  }
];

export const tasks: Task[] = [
  {
    id: "t-1",
    source: "manual",
    context: "Proposal sent 5/2",
    account: "State Medical Society",
    contact: "Dr. Leena Park",
    concreteNextAction: "Send a short follow-up and offer a stakeholder call.",
    whyItMatters: "Keeps the conference-readiness timeline from going quiet.",
    due: "Today",
    priority: "High",
    group: "Top Priorities",
    owner: "Pat"
  },
  {
    id: "t-2",
    source: "manual",
    context: "Budget approved",
    account: "National Assoc. of Shop Owners",
    contact: "Tom Reynolds",
    concreteNextAction: "Confirm pilot scope in the product demo.",
    whyItMatters: "Budget approval is useful only if it turns into a named next commitment.",
    due: "Today",
    priority: "High",
    group: "Meeting Prep And Time-Bound Tasks",
    owner: "Pat"
  },
  {
    id: "t-3",
    source: "manual",
    context: "Security questionnaire pending",
    account: "TechServe Alliance",
    contact: "Jason Brown",
    concreteNextAction: "Provide completed questionnaire and ask if procurement has a blocker.",
    whyItMatters: "Security is the blocker between evaluation and procurement.",
    due: "May 22",
    priority: "Medium",
    group: "Follow-Ups And Responses",
    owner: "Pat"
  },
  {
    id: "t-4",
    source: "manual",
    context: "Case study requested",
    account: "Retail & Restaurant Educators",
    contact: "Michael Tran",
    concreteNextAction: "Send one relevant customer story and ask what maps to their program.",
    whyItMatters: "A focused proof point is more useful than a generic resource dump.",
    due: "Tomorrow",
    priority: "Medium",
    group: "If Time Allows",
    owner: "Pat"
  }
];
