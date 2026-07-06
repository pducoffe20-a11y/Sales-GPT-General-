// Real import samples for testing the Import Processor.
//
// These strings seed the Imports view so the two documents Pat uploaded can be
// analyzed end-to-end. The canonical column order used here is the recommended
// "cleanest format" for manual uploads (automation/connectors are a v2 concern).
//
// Source files (full, unabridged) live in /samples at the repo root:
//   - samples/pa-associations-prospects.csv     (1,388 scored PA associations)
//   - samples/open-opportunities-pipeline.csv    (14 open Salesforce opportunities)
//   - samples/manual-upload-template-*.csv       (blank cleanest-format templates)

import type { ImportPurpose } from "../types";

// Prospect research seed: first 12 rows of the cleaned PA association list.
// The full 1,388-row file is at samples/pa-associations-prospects.csv.
export const prospectSampleCsv = "organization,contact,title,email,vertical,notes\nNATIONAL SLOVAK SOCIETY OF THE USA,,,,Association / member organization,\"assets >$50M; revenue >$25M; priority segment; keyword: society. Likely motion: member education; CE/non-dues revenue fit-check. Brightspace angle: Member education, CE, certification support, segmentation, reporting, and non-dues learning revenue. Context: Canonsburg, PA; annual revenue $325,199,717; source LMS score 80/100.\"\nPENNSYLVANIA LIFE AND HEALTH INSURANCE GUARANTY ASSOCIATION,,,,Association / member organization,\"assets >$50M; revenue >$25M; priority segment; keyword: association. Likely motion: member education; CE/non-dues revenue fit-check. Brightspace angle: Member education, CE, certification support, segmentation, reporting, and non-dues learning revenue. Context: Bala Cynwyd, PA; annual revenue $250,648,552; source LMS score 80/100.\"\nGREATER DELAWARE VALLEY SOCIETY OF TRANSPLANT SURGEONS,,,,Association / member organization,\"assets >$50M; revenue >$25M; priority segment; keyword: society. Likely motion: member education; CE/non-dues revenue fit-check. Brightspace angle: Member education, CE, certification support, segmentation, reporting, and non-dues learning revenue. Context: Philadelphia, PA; annual revenue $152,878,717; source LMS score 80/100.\"\nAMERICAN ASSOCIATION FOR CANCER RESEARCH,,,,Association / member organization,\"assets >$50M; revenue >$25M; priority segment; keyword: association. Likely motion: member education; CE/non-dues revenue fit-check. Brightspace angle: Member education, CE, certification support, segmentation, reporting, and non-dues learning revenue. Context: Philadelphia, PA; annual revenue $137,428,364; source LMS score 80/100.\"\nAMERICAN SOCIETY FOR TESTING AND MATERIALS,,,,Association / member organization,\"assets >$50M; revenue >$25M; priority segment; keyword: society. Likely motion: member education; CE/non-dues revenue fit-check. Brightspace angle: Member education, CE, certification support, segmentation, reporting, and non-dues learning revenue. Context: Conshohocken, PA; annual revenue $134,694,228; source LMS score 80/100.\"\nDEFENDER ASSOCIATION OF PHILADELPHIA,,,,Association / member organization,\"assets >$50M; revenue >$25M; priority segment; keyword: association. Likely motion: member education; CE/non-dues revenue fit-check. Brightspace angle: Member education, CE, certification support, segmentation, reporting, and non-dues learning revenue. Context: Philadelphia, PA; annual revenue $104,576,114; source LMS score 80/100.\"\nGREATER PHILADELPHIA YOUNG MENS CHRISTIAN ASSOCIATION,,,,Association / member organization,\"assets >$50M; revenue >$25M; priority segment; keyword: association. Likely motion: member education; CE/non-dues revenue fit-check. Brightspace angle: Member education, CE, certification support, segmentation, reporting, and non-dues learning revenue. Context: Conshohocken, PA; annual revenue $104,433,568; source LMS score 80/100.\"\nISDA FRATERNAL ASSOCIATION,,,,Association / member organization,\"assets >$50M; revenue >$25M; priority segment; keyword: association. Likely motion: member education; CE/non-dues revenue fit-check. Brightspace angle: Member education, CE, certification support, segmentation, reporting, and non-dues learning revenue. Context: Pittsburgh, PA; annual revenue $99,118,418; source LMS score 80/100.\"\nPENNSYLVANIA STATE EDUCATION ASSOCIATION P S E A,,,,Association / member organization,\"assets >$50M; revenue >$25M; priority segment; keyword: association. Likely motion: member education; CE/non-dues revenue fit-check. Brightspace angle: Member education, CE, certification support, segmentation, reporting, and non-dues learning revenue. Context: Harrisburg, PA; annual revenue $85,684,519; source LMS score 80/100.\"\nPHILADELPHIA ORCHESTRA ASSOCIATION,,,,Association / member organization,\"assets >$50M; revenue >$25M; priority segment; keyword: association. Likely motion: member education; CE/non-dues revenue fit-check. Brightspace angle: Member education, CE, certification support, segmentation, reporting, and non-dues learning revenue. Context: Philadelphia, PA; annual revenue $84,378,360; source LMS score 80/100.\"\nAMERICAN BIBLE SOCIETY,,,,Association / member organization,\"assets >$50M; revenue >$25M; priority segment; keyword: society. Likely motion: member education; CE/non-dues revenue fit-check. Brightspace angle: Member education, CE, certification support, segmentation, reporting, and non-dues learning revenue. Context: Philadelphia, PA; annual revenue $81,580,102; source LMS score 80/100.\"\nWILLIAM PENN ASSOCIATION,,,,Association / member organization,\"assets >$50M; revenue >$25M; priority segment; keyword: association. Likely motion: member education; CE/non-dues revenue fit-check. Brightspace angle: Member education, CE, certification support, segmentation, reporting, and non-dues learning revenue. Context: Pittsburgh, PA; annual revenue $70,565,517; source LMS score 80/100.\"\n";

// Pipeline review seed: all 14 open opportunities from the Salesforce export.
export const pipelineSampleCsv = "organization,stage,amount,close_date,probability,next_step,notes\nAmericanHort,2 - Intention to Move,35000,\"Dec 31, 2026\",35,7/22 - Discovery call after the annual conference,Early-stage LMS opportunity; discovery call scheduled post-conference to confirm learning goals.\nAmerican Philatelic Society,2 - Intention to Move,34000,\"Mar 1, 2027\",35,5/21 - Demo discovery scheduled; SE alignment complete,\"Forj is not providing a seamless learning experience. Wants a blend of community-driven engagement and learning-centric design.\"\nGreen Project Management,2 - Intention to Move,52649.57,\"Sep 30, 2026\",35,6/22 - Executive demo with broader team,\"Limited internal resources to manage learning content and operations; fragmented tool stack forcing manual updates and siloed workflows; lack of LTI integration.\"\nJustice & Upward Mobility Project,4 - Decision Point,39246.60,\"Aug 8, 2026\",70,6/17 - Demo call with Cory,\"No existing LMS to deliver training; very new nonprofit (one year old) still building core capabilities; developing new training and professional development programs.\"\nCape Cod Cranberry Growers' Association,2 - Intention to Move,35000,\"Dec 12, 2026\",35,6/24 - Intro call,\"Manual, time-consuming process of emailing individual certificates after each training; no centralized learning infrastructure.\"\nMassachusetts Society of Certified Public Accountants,1 - Motivation to Move,35000,\"Nov 6, 2026\",15,Follow up (ZoomInfo-sourced lead),Early motivation-stage account; qualify learning need and buying committee before advancing.\nThe National Association of Directors of Nursing Administration,1 - Motivation to Move,35000,\"Dec 3, 2026\",15,Late July intro session,Early motivation-stage account; intro session pending to establish learning priorities.\nNew York State Veterinary Medical Society,1 - Motivation to Move,0,\"Dec 31, 2026\",15,tbd,No amount or next step set yet; needs a first substantive discovery conversation.\nThe Ohio Society of CPA's,3 - Solution Proposal and Evaluation,60000,\"Sep 23, 2026\",55,6/16 - Tiffany to send sample courses for Ruth to review,\"Technical instability of the current LMS, lack of a future-proof LMS strategy, low learner engagement and retention, generational workforce gaps, and compliance pressures (HB 238).\"\nOncology Nursing Society,1 - Motivation to Move,0,\"Dec 31, 2026\",15,Get back on Bill's calendar; consult rescheduled 6/15,Early-stage; consult rescheduled and next step is to re-book time with the buyer.\nPW Training,2 - Intention to Move,34000,\"Dec 31, 2026\",35,6/16 - Michael to send July availability for follow-up discovery,\"Current platform (Thinkific) may not support the language access, reporting, mobile use, and client-specific delivery they need.\"\nSpecies 360,2 - Intention to Move,64500,\"Dec 31, 2026\",35,6/16 - Send availability and literature to Josh to help build the business case,\"Current LMS is a free Moodle-based environment hosted through The Nature Conservancy, creating long-term technical debt; lacks modern AI capabilities and personalized learning paths leadership is requesting.\"\nCGFNS International,1 - Motivation to Move,35000,\"Dec 26, 2026\",15,Disco/Demo next week,Early motivation-stage account; discovery and demo scheduled for next week.\nWisconsin Technology Council,2 - Intention to Move,57000,\"Oct 31, 2026\",35,Discovery call with SE - Monday 6/29,\"Building and operating the AI Readiness Coordination Hub for an NSF-funded project; need a platform to host, update, and deliver AI literacy content to a diverse, multi-sector audience.\"\n";

// Blank templates: the cleanest column layout to hand to reps for manual uploads.
export const prospectUploadTemplate = "organization,contact,title,email,vertical,notes\n\"Example Association\",\"Jane Doe\",\"VP, Education\",\"jane.doe@example.org\",\"Association / member organization\",\"LMS budget approved for FY27; wants CE reporting and member-facing learning. Renewal on incumbent ends Q4.\"\n";
export const pipelineUploadTemplate = "organization,stage,amount,close_date,probability,next_step,notes\n\"Example Association\",\"2 - Intention to Move\",35000,\"Dec 31, 2026\",35,\"6/24 - Discovery call with VP of Education\",\"Incumbent LMS renewal in Q4; wants better reporting and a seamless member learning experience.\"\n";

export interface ImportSample {
  id: string;
  label: string;
  description: string;
  sourceName: string;
  purpose: ImportPurpose;
  data: string;
}

// Loadable samples surfaced in the Imports view, one per uploaded document.
export const importSamples: ImportSample[] = [
  {
    id: "pa-associations",
    label: "PA associations (prospects)",
    description: "1,388 scored PA member organizations \u2014 prospect research.",
    sourceName: "PA associations \u2013 LMS prospect scan",
    purpose: "prospect_research",
    data: prospectSampleCsv
  },
  {
    id: "open-opportunities",
    label: "Open opportunities (pipeline)",
    description: "14 open Salesforce opportunities \u2014 pipeline review.",
    sourceName: "My Open Opportunities \u2013 Salesforce",
    purpose: "pipeline_review",
    data: pipelineSampleCsv
  }
];

// The cleanest manual-upload format, by purpose. Rendered as a reference in the UI.
export const cleanUploadFormats: Record<
  ImportPurpose,
  { columns: string[]; required: string[]; note: string }
> = {
  prospect_research: {
    columns: ["organization", "contact", "title", "email", "vertical", "notes"],
    required: ["organization", "notes"],
    note: "One row per account or person. Put the trigger/evidence in notes \u2014 it drives scoring."
  },
  pipeline_review: {
    columns: ["organization", "stage", "amount", "close_date", "probability", "next_step", "notes"],
    required: ["organization", "stage", "amount", "close_date"],
    note: "One row per opportunity. amount is a plain number; next_step should name a mutual action."
  },
  task_flow: {
    columns: ["organization", "contact", "notes", "next_step", "due_date", "priority"],
    required: ["organization", "next_step"],
    note: "One row per task. next_step is the concrete action; due_date and priority set the queue."
  },
  meeting_brief: {
    columns: ["organization", "contact", "title", "notes", "next_step"],
    required: ["organization", "notes"],
    note: "One row per meeting. notes carries the pain/context the pre-call brief is built from."
  }
};
