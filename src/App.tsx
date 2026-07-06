import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import {
  ArrowUpRight,
  Building2,
  CalendarClock,
  Download,
  GitBranch,
  Inbox,
  LayoutDashboard,
  Linkedin,
  Menu,
  MessageSquareText,
  Moon,
  PenLine,
  Search,
  Sun,
  TriangleAlert,
  Upload
} from "lucide-react";

import {
  accounts,
  meetings,
  pipeline,
  tasks,
  todayRecommendations,
  triggers
} from "./data/mockData";
import { integrationSources } from "./data/pluginRegistry";
import {
  analyzePipeline,
  buildFollowUpDraft,
  buildLinkedInResearchBrief,
  buildMeetingBrief,
  buildOutlookIndexPlan,
  groupTasks,
  reviewPatVoice
} from "./analysis/engines";
import {
  buildProspectUpload,
  canonicalFieldLabels,
  importPurposeLabels,
  parseDelimitedInput,
  profileImportRows,
  recommendedFieldsByPurpose
} from "./analysis/importParser";
import { cleanUploadFormats, importSamples, prospectSampleCsv } from "./data/samples";
import type {
  Account,
  ImportPurpose,
  LinkedInResearchBrief,
  LinkedInResearchIntent,
  OutlookIndexMode,
  OutlookIndexPlan,
  Priority,
  ProspectRecord,
  ProspectStatus,
  ProspectUpload,
  SourceCategory
} from "./types";

/* ------------------------------------------------------------------ utils */

type ViewId =
  | "today"
  | "accounts"
  | "pipeline"
  | "meeting"
  | "followup"
  | "voice"
  | "imports"
  | "linkedin"
  | "outlook";

const fmtMoney = (n: number) =>
  n >= 1000 ? `$${Math.round(n / 1000)}K` : `$${n.toLocaleString()}`;

const heatClass = (v: number) => (v >= 75 ? "hot" : v >= 48 ? "warm" : "cool");

const priorityPill = (p: Priority) =>
  p === "High" ? "danger" : p === "Medium" ? "warn" : "plain";

const healthPill = (h: Account["health"]) =>
  h === "Good" ? "ok" : h === "Watch" ? "warn" : "danger";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

const cssVar = (name: string, value: number): CSSProperties =>
  ({ [name]: value } as CSSProperties);

/* ------------------------------------------------------------ small parts */

function Meter({ value }: { value: number }) {
  return (
    <div className="meter">
      <div className={`meter-fill ${heatClass(value)}`} style={{ width: `${value}%` }} />
    </div>
  );
}

function ScoreRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="score-row">
      <div className="top">
        <span>{label}</span>
        <b>{value}</b>
      </div>
      <Meter value={value} />
    </div>
  );
}

function Panel({
  title,
  eyebrow,
  right,
  children,
  tight,
  testid
}: {
  title?: string;
  eyebrow?: string;
  right?: ReactNode;
  children: ReactNode;
  tight?: boolean;
  testid?: string;
}) {
  return (
    <section className="panel" data-testid={testid}>
      {title && (
        <div className="panel-head">
          {eyebrow && <span className="eyebrow">{eyebrow}</span>}
          <h2>{title}</h2>
          {right && <div className="spacer">{right}</div>}
        </div>
      )}
      <div className={`panel-body${tight ? " tight" : ""}`}>{children}</div>
    </section>
  );
}

function ViewHead({
  eyebrow,
  title,
  sub
}: {
  eyebrow: string;
  title: string;
  sub: string;
}) {
  return (
    <header className="view-head">
      <span className="eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
      <p>{sub}</p>
    </header>
  );
}

/* ------------------------------------------------------------ account view */

function AccountDetail({ account }: { account: Account }) {
  return (
    <div className="acct-detail">
      <div className="acct-headrow">
        <div>
          <h2>{account.name}</h2>
          <div className="muted" style={{ fontSize: 12.5 }}>
            {account.vertical} · {account.stage}
          </div>
        </div>
        <div className="sp">
          <span className={`pill ${healthPill(account.health)}`}>{account.health}</span>
          {account.amount && (
            <div className="num" style={{ fontSize: 16, fontWeight: 700, marginTop: 6 }}>
              {fmtMoney(account.amount)}
            </div>
          )}
        </div>
      </div>

      <div className="row wrap" style={{ marginTop: 4 }}>
        <span className="pill plain">{account.relationshipStatus}</span>
        <span className="pill plain">Next touch · {account.nextTouchDue}</span>
        <span className="pill plain">Last touch · {account.lastTouch}</span>
        {account.probability != null && (
          <span className="pill plain">Win {account.probability}%</span>
        )}
      </div>

      <div className="acct-scores">
        <ScoreRow label="Fit" value={account.fitScore} />
        <ScoreRow label="Timing" value={account.timingScore} />
      </div>

      <div className="subhead">Known pain</div>
      <p className="kv">{account.knownPain}</p>

      <div className="subhead">Next best move</div>
      <div className="callout teal">{account.nextBestMove}</div>

      <div className="subhead">Buying committee</div>
      <div className="chips">
        {account.buyingCommittee.map((role) => (
          <span key={role} className="chip">
            {role}
          </span>
        ))}
      </div>

      <div className="subhead">Research Gaps</div>
      <ul className="gap-list">
        {account.researchGaps.map((gap) => (
          <li key={gap}>{gap}</li>
        ))}
      </ul>

      <div className="subhead">Contacts</div>
      {account.contacts.map((c) => (
        <div className="contact-card" key={c.id}>
          <div className="avatar">{initials(c.name)}</div>
          <div className="ci">
            <div className="cn">
              {c.name} <span className="pill plain">{c.persona}</span>
            </div>
            <div className="ct">{c.title}</div>
            <div className="cnote">{c.notes}</div>
          </div>
          <span className={`pill ${c.relationship === "Active" ? "ok" : "plain"}`}>
            {c.relationship}
          </span>
        </div>
      ))}

      <div className="subhead">Competitive watch</div>
      {account.competitors.map((comp) => (
        <div className="comp-row" key={comp.name}>
          <span className="cn">{comp.name}</span>
          <span className="note">{comp.note}</span>
          <span className={`pill ${priorityPill(comp.risk)}`}>{comp.risk} risk</span>
        </div>
      ))}
    </div>
  );
}

function AccountWorkspace({
  selectedId,
  onSelect
}: {
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const active = accounts.find((a) => a.id === selectedId) ?? accounts[0];
  return (
    <div className="workspace" data-testid="account-workspace">
      <div className="acct-list">
        {accounts.map((a) => (
          <button
            key={a.id}
            className={`acct-btn${a.id === active.id ? " active" : ""}`}
            onClick={() => onSelect(a.id)}
          >
            <span className="n">{a.name}</span>
            <span className="v">{a.vertical}</span>
            <span className="r">
              <span className={`pill ${healthPill(a.health)}`}>{a.health}</span>
              <span className="muted num" style={{ fontSize: 11 }}>
                {a.amount ? fmtMoney(a.amount) : "—"}
              </span>
            </span>
          </button>
        ))}
      </div>
      <AccountDetail account={active} />
    </div>
  );
}

/* -------------------------------------------------------------- today view */

function TodayView({
  selectedId,
  onSelect
}: {
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const focus = accounts.find((a) => a.id === selectedId) ?? accounts[0];
  const openPipeline = pipeline.reduce((sum, o) => sum + o.amount, 0);
  const overdue = accounts.filter((a) => a.nextTouchDue === "Overdue").length;
  const grouped = groupTasks(tasks);

  return (
    <div className="view">
      <ViewHead
        eyebrow="Signal Desk · 05 Jul"
        title="Today Command Center"
        sub="One ranked place to decide the next move, prep the calls that matter, and keep every deal in motion — review-safe, evidence-first."
      />

      <div className="stats">
        <div className="stat">
          <div className="k">{fmtMoney(openPipeline)}</div>
          <div className="l">Open pipeline</div>
        </div>
        <div className="stat">
          <div className="k">{accounts.length}</div>
          <div className="l">Active accounts</div>
        </div>
        <div className="stat">
          <div className="k">{meetings.length}</div>
          <div className="l">Meetings today</div>
        </div>
        <div className="stat">
          <div className="k">{overdue}</div>
          <div className="l">Overdue touches</div>
          {overdue > 0 && <div className="d pill danger">Needs a move</div>}
        </div>
      </div>

      <div className="grid grid-2">
        <Panel eyebrow="Ranked queue" title="Highest-Priority Next Actions" tight>
          <div className="queue">
            {todayRecommendations.map((rec, i) => (
              <div className="queue-item" key={rec.id}>
                <div className="queue-rank">{String(i + 1).padStart(2, "0")}</div>
                <div>
                  <div className="queue-title">
                    <strong>{rec.account}</strong>
                    {rec.contact && <span className="who">· {rec.contact}</span>}
                    <span className={`pill ${priorityPill(rec.priority)}`}>{rec.priority}</span>
                  </div>
                  <div className="queue-trigger">{rec.trigger}</div>
                  <div className="queue-why">{rec.whyItMatters}</div>
                  <div className="queue-action">
                    <b>Do:</b> {rec.recommendedAction}
                  </div>
                  <span className="queue-cta">{rec.softCta}</span>
                  <div className="queue-meta">
                    <span className="pill plain">{rec.originatingModule}</span>
                    <span className="pill plain">Confidence · {rec.confidence}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <div className="stack">
          <Panel eyebrow="Calendar" title="Today's Meetings" tight>
            {meetings.map((m) => {
              const acct = accounts.find((a) => a.id === m.accountId);
              return (
                <div className="listrow" key={m.id}>
                  <span className="lead">{m.time}</span>
                  <div className="body">
                    <strong>{acct?.name ?? m.title}</strong>
                    <p>
                      {m.type} · {m.mode} — {m.notes}
                    </p>
                  </div>
                  <div className="tail">
                    <span
                      className={`pill ${
                        m.prepStatus === "Good" ? "ok" : m.prepStatus === "Medium" ? "warn" : "danger"
                      }`}
                    >
                      {m.prepStatus}
                    </span>
                  </div>
                </div>
              );
            })}
          </Panel>

          <Panel eyebrow="Account signals" title="Hot Triggers" tight>
            {triggers.map((t) => (
              <div className="listrow" key={t.id}>
                <span className={`pill ${priorityPill(t.signalStrength)}`}>{t.signalStrength}</span>
                <div className="body">
                  <strong>{t.trigger}</strong>
                  <p>
                    {t.account}
                    {t.contact ? ` · ${t.contact}` : ""} — {t.whyItMatters}
                  </p>
                </div>
              </div>
            ))}
          </Panel>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginTop: 16 }}>
        <Panel eyebrow="Focus account" title={focus.name} tight>
          <AccountWorkspace selectedId={focus.id} onSelect={onSelect} />
        </Panel>

        <div className="stack">
          <Panel eyebrow="Daily worklist" title="Task Board" tight>
            {Object.entries(grouped)
              .filter(([, list]) => list.length > 0)
              .map(([group, list]) => (
                <div key={group}>
                  <div className="subhead" style={{ margin: "12px 16px 0" }}>
                    {group}
                  </div>
                  {list.map((task) => (
                    <div className="listrow" key={task.id}>
                      <span className="lead">{task.due}</span>
                      <div className="body">
                        <strong>{task.concreteNextAction}</strong>
                        <p>
                          {task.account}
                          {task.contact ? ` · ${task.contact}` : ""} — {task.whyItMatters}
                        </p>
                      </div>
                      <span className={`pill ${priorityPill(task.priority)}`}>{task.priority}</span>
                    </div>
                  ))}
                </div>
              ))}
          </Panel>

          <Panel eyebrow="Import-first" title="Data Sources" tight>
            {integrationSources.map((s) => (
              <div className="listrow" key={s.id}>
                <div className="body">
                  <strong>{s.name}</strong>
                  <p>{s.whatItUnlocks}</p>
                </div>
                <span
                  className={`pill ${s.status === "Available now" ? "ok" : "plain"}`}
                >
                  {s.status === "Available now" ? "Live" : "Planned"}
                </span>
              </div>
            ))}
          </Panel>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ accounts view */

function AccountsView({
  selectedId,
  onSelect
}: {
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="view">
      <ViewHead
        eyebrow="Prospect dashboards"
        title="Account Action Board"
        sub="Every account stays scan-friendly without hiding weak evidence. Pick a name to open fit, timing, committee, and the open questions to close before outreach."
      />
      <Panel tight>
        <AccountWorkspace selectedId={selectedId} onSelect={onSelect} />
      </Panel>
    </div>
  );
}

/* ------------------------------------------------------------ pipeline view */

function PipelineView() {
  const rows = analyzePipeline(pipeline);
  return (
    <div className="view">
      <ViewHead
        eyebrow="Deal journey"
        title="Pipeline Risk Review"
        sub="Forecast posture with the reason attached. Risk score blends probability, health, and next-step language so slippage shows up before the forecast call."
      />
      <Panel tight>
        <div style={{ overflowX: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Account</th>
                <th>Stage</th>
                <th className="r">Amount</th>
                <th className="r">Prob.</th>
                <th>Forecast</th>
                <th>Posture</th>
                <th>Next move</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((o) => (
                <tr key={o.id}>
                  <td>
                    <div className="acc">{o.account}</div>
                    <div className="why">{o.whyItMatters}</div>
                  </td>
                  <td>{o.stage}</td>
                  <td className="r amt">{fmtMoney(o.amount)}</td>
                  <td className="r num">{o.probability}%</td>
                  <td>
                    <span className="pill plain">{o.forecast}</span>
                  </td>
                  <td>
                    <span
                      className={`pill ${
                        o.posture === "On track" ? "ok" : o.posture === "Watch closely" ? "warn" : "danger"
                      }`}
                    >
                      {o.posture}
                    </span>
                  </td>
                  <td style={{ maxWidth: 260 }}>{o.nextMove}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

/* -------------------------------------------------------- meeting prep view */

function MeetingPrepView() {
  const [form, setForm] = useState({
    accountName: "National Assoc. of Shop Owners",
    contactName: "Tom Reynolds",
    title: "VP, Learning & Workforce Development",
    vertical: "Association / Trade",
    meetingType: "Demo",
    notes: "Budget approved; wants pilot scope and success criteria.",
    competitors: "Cornerstone, Absorb LMS",
    recentActivity: ""
  });
  const [brief, setBrief] = useState<ReturnType<typeof buildMeetingBrief> | null>(null);
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="view">
      <ViewHead
        eyebrow="Meeting + deal ops"
        title="Meeting Prep"
        sub="Turn what you know into a pre-call brief: snapshot, angle, the questions to ask, likely objections, and a review-safe follow-up you can send after."
      />
      <div className="tool-grid">
        <Panel eyebrow="Inputs" title="Call details">
          <div className="form-grid">
            <label className="field">
              <span>Account name</span>
              <input aria-label="Account name" value={form.accountName} onChange={(e) => set("accountName")(e.target.value)} />
            </label>
            <label className="field">
              <span>Contact name</span>
              <input aria-label="Contact name" value={form.contactName} onChange={(e) => set("contactName")(e.target.value)} />
            </label>
            <label className="field">
              <span>Title</span>
              <input aria-label="Title" value={form.title} onChange={(e) => set("title")(e.target.value)} />
            </label>
            <label className="field">
              <span>Vertical</span>
              <input aria-label="Vertical" value={form.vertical} onChange={(e) => set("vertical")(e.target.value)} />
            </label>
            <label className="field">
              <span>Meeting type</span>
              <input aria-label="Meeting type" value={form.meetingType} onChange={(e) => set("meetingType")(e.target.value)} />
            </label>
            <label className="field">
              <span>Competitors</span>
              <input aria-label="Competitors" value={form.competitors} onChange={(e) => set("competitors")(e.target.value)} />
            </label>
            <label className="field full">
              <span>Notes</span>
              <textarea aria-label="Notes" rows={3} value={form.notes} onChange={(e) => set("notes")(e.target.value)} />
            </label>
            <label className="field full">
              <span>Recent activity</span>
              <textarea aria-label="Recent activity" rows={2} value={form.recentActivity} onChange={(e) => set("recentActivity")(e.target.value)} />
            </label>
          </div>
          <div className="tool-actions">
            <button className="btn btn-primary" onClick={() => setBrief(buildMeetingBrief(form))}>
              Generate Prep
            </button>
          </div>
        </Panel>

        <Panel eyebrow="Pre-call brief" title="Prep Output">
          <div data-testid="meeting-prep-output">
            {!brief ? (
              <div className="empty-state">
                <div className="big">No brief yet</div>
                Fill the call details and generate a review-safe prep.
              </div>
            ) : (
              <div className="stack" style={{ gap: 4 }}>
                <div className="subhead" style={{ marginTop: 0 }}>Account snapshot</div>
                <p className="kv">{brief.accountSnapshot}</p>
                <div className="subhead">Contact angle</div>
                <p className="kv">{brief.contactAngle}</p>
                <div className="subhead">Value angles</div>
                <ul className="factlist">
                  {brief.valueAngles.map((v) => <li key={v}>{v}</li>)}
                </ul>
                <div className="subhead">Discovery Questions</div>
                <ul className="factlist">
                  {brief.discoveryQuestions.map((q) => <li key={q}>{q}</li>)}
                </ul>
                <div className="subhead">Likely objections</div>
                <ul className="factlist">
                  {brief.likelyObjections.map((o) => <li key={o}>{o}</li>)}
                </ul>
                <div className="subhead">Opener</div>
                <div className="callout teal">{brief.opener}</div>
                <div className="subhead">Soft next-step ask</div>
                <p className="kv">{brief.softNextStepAsk}</p>
                <div className="subhead">Follow-up draft (review only)</div>
                <div className="voice-out">{brief.followUpDraft}</div>
                <div className="subhead">Unknowns to confirm</div>
                <div className="chips">
                  {brief.unknownsToConfirm.map((u) => <span key={u} className="chip">{u}</span>)}
                </div>
              </div>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ follow-up view */

function FollowUpView() {
  const [form, setForm] = useState({
    account: "Healthcare Educators Association",
    contact: "Sarah Mitchell",
    contactRole: "Director of Education",
    caredAbout: "cleaner CE reporting and audit readiness",
    nextStep: "a scoped reporting workshop",
    blockers: "",
    meetingNotes: ""
  });
  const [draft, setDraft] = useState<ReturnType<typeof buildFollowUpDraft> | null>(null);
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="view">
      <ViewHead
        eyebrow="Outreach messaging"
        title="Follow-Up Builder"
        sub="Short, human, review-safe. Draft the email, the CRM note, and the next task in one pass — then check it against Pat's voice before anything leaves the desk."
      />
      <div className="tool-grid">
        <Panel eyebrow="Inputs" title="Call recap">
          <div className="form-grid">
            <label className="field">
              <span>Account</span>
              <input aria-label="Account" value={form.account} onChange={(e) => set("account")(e.target.value)} />
            </label>
            <label className="field">
              <span>Follow-up contact</span>
              <input aria-label="Follow-up contact" value={form.contact} onChange={(e) => set("contact")(e.target.value)} />
            </label>
            <label className="field">
              <span>Contact role</span>
              <input aria-label="Contact role" value={form.contactRole} onChange={(e) => set("contactRole")(e.target.value)} />
            </label>
            <label className="field">
              <span>Agreed next step</span>
              <input aria-label="Agreed next step" value={form.nextStep} onChange={(e) => set("nextStep")(e.target.value)} />
            </label>
            <label className="field full">
              <span>What they cared about</span>
              <input aria-label="What they cared about" value={form.caredAbout} onChange={(e) => set("caredAbout")(e.target.value)} />
            </label>
            <label className="field full">
              <span>Blockers</span>
              <input aria-label="Blockers" value={form.blockers} onChange={(e) => set("blockers")(e.target.value)} />
            </label>
            <label className="field full">
              <span>Meeting notes</span>
              <textarea aria-label="Meeting notes" rows={3} value={form.meetingNotes} onChange={(e) => set("meetingNotes")(e.target.value)} />
            </label>
          </div>
          <div className="tool-actions">
            <button className="btn btn-primary" onClick={() => setDraft(buildFollowUpDraft(form))}>
              Build Follow-Up
            </button>
          </div>
        </Panel>

        <Panel eyebrow="Review artifact" title="Follow-Up Output">
          <div data-testid="followup-output">
            {!draft ? (
              <div className="empty-state">
                <div className="big">No draft yet</div>
                Add the recap and build a review-safe follow-up.
              </div>
            ) : (
              <div className="stack" style={{ gap: 4 }}>
                <div className="subhead" style={{ marginTop: 0 }}>Email (review only)</div>
                <div className="voice-out">{draft.email}</div>
                <div className="subhead">CRM note</div>
                <p className="kv">{draft.crmNote}</p>
                <div className="subhead">Next task</div>
                <div className="callout">
                  <b>{draft.nextTask.concreteNextAction}</b> · due {draft.suggestedFollowUpDate}
                </div>
                <div className="subhead">Review flags</div>
                <ul className="factlist">
                  {draft.reviewFlags.map((f) => <li key={f}>{f}</li>)}
                </ul>
              </div>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- voice view */

const defaultVoiceDraft =
  "Hi Tom, I hope this finds you well. I'm just following up on our last conversation. We think our robust, best-in-class platform will let you leverage a seamless rollout across every chapter. Let me know if you'd like to touch base this week.";

function PatVoiceView() {
  const [copy, setCopy] = useState(defaultVoiceDraft);
  const review = useMemo(() => reviewPatVoice(copy), [copy]);

  return (
    <div className="view">
      <ViewHead
        eyebrow="Outreach messaging"
        title="Pat Voice Checker"
        sub="Catch the corporate tells before Pat copies anything out. Banned phrases get flagged, buyer-relevance is checked, and you get a cleaner rewrite."
      />
      <div className="tool-grid">
        <Panel eyebrow="Draft" title="Paste a message">
          <label className="field">
            <span>Draft copy</span>
            <textarea aria-label="Draft copy" rows={9} value={copy} onChange={(e) => setCopy(e.target.value)} />
          </label>
        </Panel>

        <Panel eyebrow="Review" title="Voice Check">
          <div className="subhead" style={{ marginTop: 0 }}>Flagged phrases</div>
          {review.flags.length === 0 ? (
            <span className="pill ok">No corporate phrases</span>
          ) : (
            <div className="voice-flags">
              {review.flags.map((f) => (
                <span className="pill danger" key={f}>{f}</span>
              ))}
            </div>
          )}

          <div className="subhead">Checks</div>
          <div className="checkline">
            <span className={`pill ${review.missingRelevance ? "danger" : "ok"}`}>
              {review.missingRelevance ? "Weak" : "Good"}
            </span>
            <span>{review.betterOpener}</span>
          </div>
          <div className="checkline">
            <span className={`pill ${review.longSentenceCount > 0 ? "warn" : "ok"}`}>
              {review.longSentenceCount} long
            </span>
            <span>Sentences over 24 words read as filler. Tighter is more Pat.</span>
          </div>
          <div className="checkline">
            <span className="pill accent">CTA</span>
            <span>{review.tighterCta}</span>
          </div>

          <div className="subhead">Cleaner rewrite</div>
          <div className="voice-out">{review.rewritten}</div>
        </Panel>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- imports view */

const sourceTypeLabels: Record<SourceCategory, string> = {
  csv_upload: "CSV upload",
  pasted_notes: "Pasted notes",
  crm_export: "CRM export",
  calendar: "Calendar export",
  email: "Email export",
  linkedin: "LinkedIn export",
  sales_navigator: "Sales Navigator",
  slack: "Slack export",
  sharepoint: "SharePoint",
  zoom: "Zoom",
  manual: "Manual entry"
};

const purposeView: Record<
  ImportPurpose,
  { actionLabel: string; status: Record<ProspectStatus, string> }
> = {
  prospect_research: {
    actionLabel: "Recommended Action",
    status: { "Work Now": "Work Now", "Light Research": "Light Research", Suppress: "Suppress" }
  },
  pipeline_review: {
    actionLabel: "Forecast Action",
    status: { "Work Now": "Review Now", "Light Research": "Verify Deal", Suppress: "Hygiene" }
  },
  task_flow: {
    actionLabel: "Next Action",
    status: { "Work Now": "Work Now", "Light Research": "Clarify", Suppress: "Defer" }
  },
  meeting_brief: {
    actionLabel: "Prep Focus",
    status: { "Work Now": "Prep Now", "Light Research": "Add Context", Suppress: "Thin Note" }
  }
};

const statusPill = (status: ProspectStatus) =>
  status === "Work Now" ? "accent" : status === "Light Research" ? "warn" : "plain";

function UploadFormatReference({ purpose }: { purpose: ImportPurpose }) {
  const fmt = cleanUploadFormats[purpose];
  return (
    <div>
      <div className="callout info" style={{ marginBottom: 12 }}>
        Cleanest manual-upload format for <b>{importPurposeLabels[purpose]}</b>. Automated
        connectors are v2 — for now, match these headers in a CSV.
      </div>
      <div className="subhead" style={{ marginTop: 0 }}>Columns (in order)</div>
      <div className="chips">
        {fmt.columns.map((col) => (
          <span key={col} className={`chip${fmt.required.includes(col) ? " req" : ""}`}>
            <code className="mono">{col}</code>
            {fmt.required.includes(col) ? " *" : ""}
          </span>
        ))}
      </div>
      <div className="callout teal" style={{ marginTop: 12, fontSize: 12 }}>
        {fmt.note} Columns marked <b>*</b> are required; the rest are optional but improve scoring.
      </div>
    </div>
  );
}

function RecordCard({ record, purpose }: { record: ProspectRecord; purpose: ImportPurpose }) {
  const cfg = purposeView[purpose];
  const rec = record.recommendedActions[0];
  return (
    <div className="rec">
      <div className="rec-head">
        <div className="id">
          <div className="org">{record.organization ?? "Unknown account"}</div>
          <div className="per">
            {record.fullName ?? "No contact"}
            {record.title ? ` · ${record.title}` : ""}
          </div>
        </div>
        <div>
          <span className={`pill ${statusPill(record.status)}`}>{cfg.status[record.status]}</span>
        </div>
        <div className="rec-score">
          {record.scoreTotal}
          <small>SCORE</small>
        </div>
      </div>

      <div className="microbars">
        {(["fit", "urgency", "persona", "evidence"] as const).map((k) => (
          <div className="microbar" key={k}>
            <div className="top">
              <span>{k}</span>
              <b>{record.scores[k]}</b>
            </div>
            <Meter value={record.scores[k]} />
          </div>
        ))}
      </div>

      {rec && (
        <div className="rec-block">
          <div className="lab">{cfg.actionLabel}</div>
          <div className="act">{rec.recommendedAction}</div>
          <div className="row wrap" style={{ marginTop: 8 }}>
            <span className="pill plain">{rec.originatingModule}</span>
            <span className="pill plain">Confidence · {rec.confidence}</span>
            <span className="queue-cta">{rec.softCta}</span>
          </div>
        </div>
      )}

      {record.verifiedFacts.length > 0 && (
        <div className="rec-block">
          <div className="lab">Verified facts</div>
          <ul className="factlist">
            {record.verifiedFacts.slice(0, 5).map((f) => <li key={f}>{f}</li>)}
          </ul>
        </div>
      )}

      {record.unknowns.length > 0 && (
        <div className="rec-block">
          <div className="lab">Check first</div>
          <div className="chips">
            {record.unknowns.map((u) => <span key={u} className="chip">{u}</span>)}
          </div>
        </div>
      )}
    </div>
  );
}

function ImportsView() {
  const [sourceName, setSourceName] = useState("PA associations – LMS prospect scan");
  const [sourceType, setSourceType] = useState<SourceCategory>("csv_upload");
  const [purpose, setPurpose] = useState<ImportPurpose>("prospect_research");
  const [input, setInput] = useState(prospectSampleCsv);
  const [upload, setUpload] = useState<ProspectUpload | null>(null);

  const loadSample = (id: string) => {
    const sample = importSamples.find((s) => s.id === id);
    if (!sample) return;
    setInput(sample.data);
    setPurpose(sample.purpose);
    setSourceName(sample.sourceName);
    setSourceType(sample.purpose === "pipeline_review" ? "crm_export" : "csv_upload");
    setUpload(null);
  };

  const profile = useMemo(() => {
    if (!input.trim()) return null;
    const parsed = parseDelimitedInput(input);
    return profileImportRows(parsed.rows, parsed.columns, parsed.delimiter, purpose);
  }, [input, purpose]);

  const required = recommendedFieldsByPurpose[purpose];
  const mappedCount = profile ? required.length - profile.missingRecommendedFields.length : 0;

  const csvHref = upload
    ? `data:text/csv;charset=utf-8,${encodeURIComponent(upload.exportCsv)}`
    : "";
  const jsonHref = upload
    ? `data:application/json;charset=utf-8,${encodeURIComponent(upload.handoffJson)}`
    : "";

  return (
    <div className="view">
      <ViewHead
        eyebrow="Prospect strategy"
        title="Import Processor"
        sub="Load a real sample — the PA association prospect scan, the open Salesforce opportunities, or Pat’s territory target accounts — or paste your own CSV, CRM export, or meeting note. It profiles the columns live, then scores every row into Work Now, Light Research, and Suppress with the evidence kept visible."
      />
      <div className="tool-grid">
        <Panel eyebrow="Inputs" title="Import setup">
          <div className="form-grid">
            <label className="field">
              <span>Source name</span>
              <input aria-label="Source name" value={sourceName} onChange={(e) => setSourceName(e.target.value)} />
            </label>
            <label className="field">
              <span>Source type</span>
              <select
                aria-label="Source type"
                value={sourceType}
                onChange={(e) => setSourceType(e.target.value as SourceCategory)}
              >
                {(Object.keys(sourceTypeLabels) as SourceCategory[]).map((cat) => (
                  <option key={cat} value={cat}>
                    {sourceTypeLabels[cat]}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="field" style={{ marginTop: 12 }}>
            <span>Purpose</span>
            <div className="seg">
              {(Object.keys(importPurposeLabels) as ImportPurpose[]).map((p) => (
                <label key={p}>
                  <input
                    type="radio"
                    name="purpose"
                    checked={purpose === p}
                    onChange={() => setPurpose(p)}
                  />
                  {importPurposeLabels[p]}
                </label>
              ))}
            </div>
          </div>

          <div className="field" style={{ marginTop: 12 }}>
            <span>Load a real sample</span>
            <div className="export-row">
              {importSamples.map((sample) => (
                <button
                  key={sample.id}
                  className="btn"
                  title={sample.description}
                  onClick={() => loadSample(sample.id)}
                >
                  <Upload size={15} /> {sample.label}
                </button>
              ))}
            </div>
          </div>

          <label className="field" style={{ marginTop: 12 }}>
            <span>Import data</span>
            <textarea
              aria-label="Import data"
              rows={9}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste CSV, tab, JSON, or notes…"
            />
          </label>

          <div className="tool-actions">
            <button
              className="btn btn-primary"
              onClick={() =>
                setUpload(buildProspectUpload(input, sourceName || "Import", sourceType, purpose))
              }
            >
              Analyze Import
            </button>
          </div>
        </Panel>

        <div className="stack">
          <Panel eyebrow="Live read" title="Column Profile" testid="import-profile">
            <div>
              {!profile ? (
                <div className="empty-state">
                  <div className="big">Column Profile</div>
                  Paste a list to profile its columns.
                </div>
              ) : (
                <div>
                  <div className="row wrap" style={{ marginBottom: 12 }}>
                    <span className="pill plain">{profile.rowCount} rows</span>
                    <span className="pill plain">Delimiter · {profile.delimiter}</span>
                    <span
                      className={`pill ${
                        profile.confidence === "High" ? "ok" : profile.confidence === "Medium" ? "warn" : "danger"
                      }`}
                    >
                      {profile.confidence} confidence
                    </span>
                  </div>
                  <div className="callout info" style={{ marginBottom: 12 }}>
                    Recommended fields mapped · <b className="num">{mappedCount}/{required.length}</b> for {profile.purposeLabel}
                  </div>
                  <div className="subhead" style={{ marginTop: 0 }}>Mapped columns</div>
                  <ul className="factlist">
                    {(Object.entries(profile.mappedFields) as [keyof typeof canonicalFieldLabels, string][]).map(
                      ([field, col]) => (
                        <li key={field}>
                          {canonicalFieldLabels[field]} ← <code className="mono">{col}</code>
                        </li>
                      )
                    )}
                  </ul>
                  {profile.missingRecommendedFields.length > 0 && (
                    <>
                      <div className="subhead">Missing recommended</div>
                      <div className="chips">
                        {profile.missingRecommendedFields.map((f) => (
                          <span key={f} className="chip">{canonicalFieldLabels[f]}</span>
                        ))}
                      </div>
                    </>
                  )}
                  <div className="subhead">Suggested workflow</div>
                  <div className="callout teal mono" style={{ fontSize: 11.5 }}>
                    {profile.suggestedWorkflow}
                  </div>
                </div>
              )}
            </div>
          </Panel>

          <Panel eyebrow="Manual uploads" title="Cleanest Upload Format" testid="upload-format">
            <UploadFormatReference purpose={purpose} />
          </Panel>

          <Panel eyebrow="Scored board" title="Import Results">
            <div data-testid="import-results">
              {!upload ? (
                <div className="empty-state">
                  <div className="big">Not analyzed yet</div>
                  Run the import to score every row.
                </div>
              ) : (
                <div>
                  <div className="stats" style={{ marginBottom: 14 }}>
                    <div className="stat">
                      <div className="k">{upload.boardSummary.total}</div>
                      <div className="l">Rows</div>
                    </div>
                    <div className="stat">
                      <div className="k">{upload.boardSummary.workNow}</div>
                      <div className="l">{purposeView[purpose].status["Work Now"]}</div>
                    </div>
                    <div className="stat">
                      <div className="k">{upload.boardSummary.lightResearch}</div>
                      <div className="l">{purposeView[purpose].status["Light Research"]}</div>
                    </div>
                    <div className="stat">
                      <div className="k">{upload.boardSummary.suppress}</div>
                      <div className="l">{purposeView[purpose].status.Suppress}</div>
                    </div>
                  </div>

                  {upload.parseWarnings.length > 0 && (
                    <div className="stack" style={{ gap: 8, marginBottom: 14 }}>
                      {upload.parseWarnings.map((w) => (
                        <div className="warnbox" key={w}>
                          <TriangleAlert size={15} />
                          <span>{w}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="callout teal mono" style={{ fontSize: 11.5, marginBottom: 6 }}>
                    {upload.profile.suggestedWorkflow}
                  </div>
                  <div className="export-row" style={{ marginBottom: 16 }}>
                    <a className="btn" href={csvHref} download={`${sourceName || "import"}.csv`}>
                      <Download size={15} /> Export CSV
                    </a>
                    <a className="btn" href={jsonHref} download={`${sourceName || "import"}.json`}>
                      <Download size={15} /> Export JSON
                    </a>
                  </div>

                  {upload.records.map((record) => (
                    <RecordCard key={record.prospectId} record={record} purpose={purpose} />
                  ))}
                </div>
              )}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ linkedin view */

const linkedInIntentLabels: Record<LinkedInResearchIntent, string> = {
  account_research: "Account research",
  person_research: "Person research",
  growth_pipeline: "Growth pipeline"
};

function LinkedInView() {
  const [form, setForm] = useState({
    intent: "account_research" as LinkedInResearchIntent,
    accountName: "Healthcare Educators Association",
    personName: "Sarah Mitchell",
    title: "Director of Education",
    profileUrl: "https://www.linkedin.com/in/sarah-mitchell-education",
    companyUrl: "https://www.linkedin.com/company/healthcare-educators-association",
    searchUrl: "",
    listName: "",
    limit: "25",
    icp: "",
    notes: "Recent post about CE reporting and audit readiness."
  });
  const [brief, setBrief] = useState<LinkedInResearchBrief | null>(null);
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="view">
      <ViewHead
        eyebrow="LinkedIn research"
        title="LinkedIn Research Layer"
        sub="Turn profile, company, and Sales Navigator evidence into safe account research and a growth-list handoff — no messages, invites, or posts are ever sent from here."
      />
      <div className="tool-grid">
        <Panel eyebrow="Inputs" title="Research target">
          <div className="form-grid">
            <label className="field full">
              <span>Research intent</span>
              <select
                aria-label="LinkedIn research intent"
                value={form.intent}
                onChange={(e) => set("intent")(e.target.value)}
              >
                {(Object.keys(linkedInIntentLabels) as LinkedInResearchIntent[]).map((i) => (
                  <option key={i} value={i}>{linkedInIntentLabels[i]}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Account name</span>
              <input aria-label="LinkedIn account name" value={form.accountName} onChange={(e) => set("accountName")(e.target.value)} />
            </label>
            <label className="field">
              <span>Person name</span>
              <input aria-label="LinkedIn person name" value={form.personName} onChange={(e) => set("personName")(e.target.value)} />
            </label>
            <label className="field full">
              <span>Title</span>
              <input aria-label="LinkedIn title" value={form.title} onChange={(e) => set("title")(e.target.value)} />
            </label>
            <label className="field full">
              <span>Profile URL</span>
              <input aria-label="LinkedIn profile URL" value={form.profileUrl} onChange={(e) => set("profileUrl")(e.target.value)} />
            </label>
            <label className="field full">
              <span>Company URL</span>
              <input aria-label="LinkedIn company URL" value={form.companyUrl} onChange={(e) => set("companyUrl")(e.target.value)} />
            </label>
            <label className="field full">
              <span>Search URL</span>
              <input aria-label="LinkedIn search URL" value={form.searchUrl} onChange={(e) => set("searchUrl")(e.target.value)} />
            </label>
            <label className="field">
              <span>List name</span>
              <input aria-label="LinkedIn list name" value={form.listName} onChange={(e) => set("listName")(e.target.value)} />
            </label>
            <label className="field">
              <span>List limit</span>
              <input aria-label="LinkedIn list limit" value={form.limit} onChange={(e) => set("limit")(e.target.value)} />
            </label>
            <label className="field full">
              <span>ICP (for growth qualification)</span>
              <input aria-label="LinkedIn ICP" value={form.icp} onChange={(e) => set("icp")(e.target.value)} />
            </label>
            <label className="field full">
              <span>Notes / recent signal</span>
              <textarea aria-label="LinkedIn notes" rows={3} value={form.notes} onChange={(e) => set("notes")(e.target.value)} />
            </label>
          </div>
          <div className="tool-actions">
            <button className="btn btn-primary" onClick={() => setBrief(buildLinkedInResearchBrief(form))}>
              Build LinkedIn Brief
            </button>
          </div>
        </Panel>

        <div className="stack">
          <Panel eyebrow="Research brief" title="Buyer Research">
            <div data-testid="linkedin-brief">
              {!brief ? (
                <div className="empty-state">
                  <div className="big">No brief yet</div>
                  Add a target and build the research brief.
                </div>
              ) : (
                <div>
                  <div className="readiness">
                    <div className="dial" style={cssVar("--v", brief.researchScore)}>
                      <b>{brief.researchScore}</b>
                    </div>
                    <div>
                      <div className="eyebrow">Research readiness</div>
                      <div style={{ fontSize: 18, fontWeight: 700 }}>{brief.readiness}</div>
                      <div className="muted" style={{ fontSize: 12 }}>
                        {brief.accountName} · {brief.personName}
                      </div>
                    </div>
                  </div>

                  <div className="subhead">Verified signals</div>
                  <ul className="factlist">
                    {brief.verifiedSignals.map((s) => <li key={s}>{s}</li>)}
                  </ul>

                  <div className="subhead">D2L Buyer Angles</div>
                  <ul className="factlist">
                    {brief.buyerAngles.map((a) => <li key={a}>{a}</li>)}
                  </ul>

                  <div className="subhead">Evidence gaps</div>
                  <div className="chips">
                    {brief.evidenceGaps.map((g) => <span key={g} className="chip">{g}</span>)}
                  </div>

                  <div className="subhead">Safe next actions</div>
                  <ul className="factlist">
                    {brief.safeNextActions.map((a) => <li key={a}>{a}</li>)}
                  </ul>
                </div>
              )}
            </div>
          </Panel>

          {brief && (
            <Panel eyebrow="Read-only" title="Command Plan">
              <div data-testid="linkedin-command-plan">
                {brief.commandPlans.map((cmd) => (
                  <div className="cmd" key={cmd.id}>
                    <div className="cmd-head">
                      <span className="lab">{cmd.label}</span>
                      <span className="sp" />
                      <span className={`pill ${cmd.safety === "Read-only" ? "ok" : "warn"}`}>{cmd.safety}</span>
                    </div>
                    <pre>{cmd.command}</pre>
                  </div>
                ))}
              </div>
            </Panel>
          )}

          {brief && brief.intent === "growth_pipeline" && (
            <Panel eyebrow="LinkedIn growth" title="Growth Pipeline Readiness">
              <div className="readiness">
                <div className="dial" style={cssVar("--v", brief.researchScore)}>
                  <b>{brief.researchScore}</b>
                </div>
                <div>
                  <div className="eyebrow">Import readiness</div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{brief.readiness}</div>
                  <div className="muted" style={{ fontSize: 12 }}>List: {brief.listName} · limit {brief.limit}</div>
                </div>
              </div>
              <div className="subhead">Import phase</div>
              <ul className="rulelist">
                {brief.growthPipeline.importPhase.map((r) => (
                  <li key={r}><span className="mk">→</span>{r}</li>
                ))}
              </ul>
              <div className="subhead">Qualification rules</div>
              <ul className="rulelist">
                {brief.growthPipeline.qualificationRules.map((r) => (
                  <li key={r}><span className="mk">→</span>{r}</li>
                ))}
              </ul>
              <div className="subhead">Network maintenance</div>
              <ul className="rulelist deny">
                {brief.growthPipeline.networkMaintenance.map((r) => (
                  <li key={r}><span className="mk">!</span>{r}</li>
                ))}
              </ul>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- outlook view */

const outlookModeLabels: Record<OutlookIndexMode, string> = {
  daily_sales_scan: "Daily sales scan",
  weekly_pipeline_prep: "Weekly pipeline prep",
  account_research: "Account research"
};

function OutlookView() {
  const [form, setForm] = useState({
    mode: "daily_sales_scan" as OutlookIndexMode,
    mailboxLabel: "Pat Outlook",
    startDate: "2026-07-01",
    endDate: "2026-07-07",
    emailQuery: "pilot, proposal, renewal",
    calendarFocus: "discovery, executive review",
    accountFocus: "Healthcare Educators Association"
  });
  const [plan, setPlan] = useState<OutlookIndexPlan | null>(null);
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const jsonHref = plan
    ? `data:application/json;charset=utf-8,${encodeURIComponent(plan.handoffJson)}`
    : "";

  return (
    <div className="view">
      <ViewHead
        eyebrow="Outlook indexing"
        title="Outlook Indexing Layer"
        sub="Build a bounded, read-only plan for turning email and calendar windows into seller-ready tasks. Nothing sends, moves, or writes — indexing only."
      />
      <div className="tool-grid">
        <Panel eyebrow="Inputs" title="Index window">
          <div className="form-grid">
            <label className="field full">
              <span>Indexing mode</span>
              <select
                aria-label="Outlook indexing mode"
                value={form.mode}
                onChange={(e) => set("mode")(e.target.value)}
              >
                {(Object.keys(outlookModeLabels) as OutlookIndexMode[]).map((m) => (
                  <option key={m} value={m}>{outlookModeLabels[m]}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Mailbox</span>
              <input aria-label="Outlook mailbox" value={form.mailboxLabel} onChange={(e) => set("mailboxLabel")(e.target.value)} />
            </label>
            <label className="field">
              <span>Account focus</span>
              <input aria-label="Outlook account focus" value={form.accountFocus} onChange={(e) => set("accountFocus")(e.target.value)} />
            </label>
            <label className="field">
              <span>Start date</span>
              <input aria-label="Outlook start date" type="date" value={form.startDate} onChange={(e) => set("startDate")(e.target.value)} />
            </label>
            <label className="field">
              <span>End date</span>
              <input aria-label="Outlook end date" type="date" value={form.endDate} onChange={(e) => set("endDate")(e.target.value)} />
            </label>
            <label className="field full">
              <span>Email query terms</span>
              <input aria-label="Outlook email query" value={form.emailQuery} onChange={(e) => set("emailQuery")(e.target.value)} />
            </label>
            <label className="field full">
              <span>Calendar focus</span>
              <input aria-label="Outlook calendar focus" value={form.calendarFocus} onChange={(e) => set("calendarFocus")(e.target.value)} />
            </label>
          </div>
          <div className="tool-actions">
            <button className="btn btn-primary" onClick={() => setPlan(buildOutlookIndexPlan(form))}>
              Build Index Plan
            </button>
          </div>
        </Panel>

        <div className="stack">
          <Panel eyebrow="Read-only plan" title="Index Plan">
            <div data-testid="outlook-index-plan">
              {!plan ? (
                <div className="empty-state">
                  <div className="big">No plan yet</div>
                  Set a window and build the index plan.
                </div>
              ) : (
                <div>
                  <div className="readiness">
                    <div className="dial" style={cssVar("--v", plan.indexScore)}>
                      <b>{plan.indexScore}</b>
                    </div>
                    <div>
                      <div className="eyebrow">Index readiness</div>
                      <div style={{ fontSize: 18, fontWeight: 700 }}>{plan.readiness}</div>
                      <div className="muted" style={{ fontSize: 12 }}>
                        {plan.stats.writeActions} write actions · read-only
                      </div>
                    </div>
                  </div>

                  <div className="subhead">Index stages</div>
                  <div className="timeline">
                    {plan.stages.map((s) => (
                      <div className="tl-item" key={s.id}>
                        <div>
                          <div className="lab">{s.label}</div>
                          <div className="conn">{s.connector}</div>
                        </div>
                        <div className="desc">{s.description}</div>
                      </div>
                    ))}
                  </div>

                  <div className="subhead">Index schema</div>
                  <div className="grid" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
                    {plan.indexSchema.map((s) => (
                      <div className="schema-card" key={s.label}>
                        <div className="lab">{s.label}</div>
                        <div className="purpose">{s.purpose}</div>
                        <div className="fields">
                          {s.fields.map((f) => <code key={f}>{f}</code>)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Panel>

          {plan && (
            <Panel eyebrow="Read-only" title="Connector Action Plan">
              <div className="export-row" style={{ marginBottom: 14 }}>
                <a className="btn" href={jsonHref} download="outlook-index.json">
                  <Download size={15} /> Export JSON
                </a>
              </div>
              {plan.commandPlans.map((cmd) => (
                <div className="cmd" key={cmd.id}>
                  <div className="cmd-head">
                    <span className="lab">{cmd.label}</span>
                    <code className="mono" style={{ fontSize: 11, color: "var(--teal)" }}>{cmd.action}</code>
                    <span className="sp" />
                    <span className={`pill ${cmd.safety === "Read-only" ? "ok" : "warn"}`}>{cmd.safety}</span>
                  </div>
                  <pre>{cmd.payload}</pre>
                </div>
              ))}
              <div className="subhead">Evidence rules</div>
              <ul className="rulelist">
                {plan.evidenceRules.map((r) => (
                  <li key={r}><span className="mk">→</span>{r}</li>
                ))}
              </ul>
              <div className="subhead">Suppression rules</div>
              <ul className="rulelist deny">
                {plan.suppressionRules.map((r) => (
                  <li key={r}><span className="mk">!</span>{r}</li>
                ))}
              </ul>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------- app */

const NAV: { id: ViewId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "today", label: "Today", icon: LayoutDashboard },
  { id: "accounts", label: "Accounts", icon: Building2 },
  { id: "pipeline", label: "Pipeline", icon: GitBranch },
  { id: "meeting", label: "Meeting Prep", icon: CalendarClock },
  { id: "followup", label: "Follow-Up", icon: PenLine },
  { id: "voice", label: "Pat Voice", icon: MessageSquareText },
  { id: "imports", label: "Imports", icon: Upload },
  { id: "linkedin", label: "LinkedIn", icon: Linkedin },
  { id: "outlook", label: "Outlook", icon: Inbox }
];

export function App() {
  const [view, setView] = useState<ViewId>("today");
  const [selectedAccount, setSelectedAccount] = useState(accounts[0].id);
  const [query, setQuery] = useState("");
  const [navOpen, setNavOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "light";
    return (localStorage.getItem("signal-desk-theme") as "light" | "dark") || "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("signal-desk-theme", theme);
  }, [theme]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return accounts.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.vertical.toLowerCase().includes(q) ||
        a.contacts.some((c) => c.name.toLowerCase().includes(q))
    );
  }, [query]);

  const go = (id: ViewId) => {
    setView(id);
    setNavOpen(false);
  };

  const openAccount = (id: string) => {
    setSelectedAccount(id);
    setView("accounts");
    setQuery("");
  };

  return (
    <div className={`app${navOpen ? " nav-open" : ""}`}>
      {navOpen && <div className="nav-scrim" onClick={() => setNavOpen(false)} />}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">D2</div>
          <div>
            <div className="brand-name">Signal Desk</div>
            <div className="brand-sub">D2L Sales OS</div>
          </div>
        </div>
        <nav>
          {NAV.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={`nav-item${view === item.id ? " active" : ""}`}
                onClick={() => go(item.id)}
              >
                <Icon size={17} strokeWidth={2} />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="sidebar-foot">
          Import-first · review-safe. Drafts are artifacts for Pat to review — nothing sends without a real connector.
        </div>
      </aside>

      <div className="main">
        <div className="topbar">
          <button className="toolbtn menu-btn" aria-label="Menu" onClick={() => setNavOpen((o) => !o)}>
            <Menu size={18} />
          </button>
          <div className="search">
            <Search className="search-icon" size={16} />
            <input
              aria-label="Search"
              placeholder="Search accounts, verticals, contacts…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query.trim() && (
              <div className="search-results">
                {results.length === 0 ? (
                  <div className="empty">No accounts match “{query}”.</div>
                ) : (
                  results.map((a) => (
                    <button className="result" key={a.id} onClick={() => openAccount(a.id)}>
                      <strong>{a.name}</strong>
                      <span>{a.vertical} · {a.stage}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
          <span className="clock">Sun · 05 Jul 2026</span>
          <button
            className="toolbtn"
            aria-label="Toggle theme"
            onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
          >
            {theme === "light" ? <Moon size={17} /> : <Sun size={17} />}
          </button>
        </div>

        {view === "today" && <TodayView selectedId={selectedAccount} onSelect={setSelectedAccount} />}
        {view === "accounts" && <AccountsView selectedId={selectedAccount} onSelect={setSelectedAccount} />}
        {view === "pipeline" && <PipelineView />}
        {view === "meeting" && <MeetingPrepView />}
        {view === "followup" && <FollowUpView />}
        {view === "voice" && <PatVoiceView />}
        {view === "imports" && <ImportsView />}
        {view === "linkedin" && <LinkedInView />}
        {view === "outlook" && <OutlookView />}
      </div>
    </div>
  );
}
