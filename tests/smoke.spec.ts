import { mkdirSync } from "node:fs";
import { test, expect } from "@playwright/test";

const screenshotDir = "artifacts/screenshots";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("dashboard loads and captures desktop screenshot", async ({ page }) => {
  mkdirSync(screenshotDir, { recursive: true });
  await expect(page.getByRole("heading", { name: "Today Command Center" })).toBeVisible();
  await expect(page.getByText("Highest-Priority Next Actions")).toBeVisible();
  await expect(page.getByTestId("account-workspace")).toContainText("National Assoc. of Shop Owners");
  await page.screenshot({ path: `${screenshotDir}/desktop-dashboard.png`, fullPage: true });
});

test("navigation works and account detail pages render", async ({ page }) => {
  await page.getByRole("button", { name: "Accounts" }).click();
  await expect(page.getByRole("heading", { name: "Account Action Board" })).toBeVisible();
  await page.getByRole("button", { name: /Healthcare Educators Association/i }).click();
  await expect(page.getByTestId("account-workspace")).toContainText("Healthcare Educators Association");
  await expect(page.getByText("Research Gaps")).toBeVisible();
});

test("global search jumps to matching account context", async ({ page }) => {
  await page.getByLabel("Search").fill("Healthcare");
  await page.locator(".search-results").getByRole("button", { name: /Healthcare Educators Association/i }).first().click();
  await expect(page.getByRole("heading", { name: "Account Action Board" })).toBeVisible();
  await expect(page.getByTestId("account-workspace")).toContainText("Healthcare Educators Association");
});

test("meeting prep form submits", async ({ page }) => {
  await page.getByRole("button", { name: "Meeting Prep" }).click();
  await page.getByLabel("Account name").fill("Credentialing Board of Ohio");
  await page.getByLabel("Contact name").fill("Renee Martin");
  await page.getByLabel("Notes").fill("They need CE reporting, audit readiness, and a low-risk pilot path.");
  await page.getByRole("button", { name: "Generate Prep" }).click();
  await expect(page.getByTestId("meeting-prep-output")).toContainText("Credentialing Board of Ohio");
  await expect(page.getByText("Discovery Questions")).toBeVisible();
});

test("import form analyzes CSV records", async ({ page }) => {
  await page.getByRole("button", { name: "Imports" }).click();
  await page.getByLabel("Source name").fill("Smoke CSV");
  await page.getByLabel("Import data").fill(`company,contact,title,vertical,email,notes
Credentialing Board of Ohio,Renee Martin,Director of Certification,Credentialing,renee@example.org,CE reporting deadline and LMS budget approved`);
  await expect(page.getByTestId("import-profile")).toContainText("Column Profile");
  await expect(page.getByTestId("import-profile")).toContainText("Recommended fields mapped");
  await page.getByRole("button", { name: "Analyze Import" }).click();
  await expect(page.getByTestId("import-results")).toContainText("Credentialing Board of Ohio");
  await expect(page.getByTestId("import-results")).toContainText("Work Now");
  await expect(page.getByRole("link", { name: "Export CSV" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Export JSON" })).toBeVisible();
  await page.screenshot({ path: `${screenshotDir}/import-workflow.png`, fullPage: true });
});

test("pipeline import uses forecast review labels", async ({ page }) => {
  await page.getByRole("button", { name: "Imports" }).click();
  await page.getByLabel("Source name").fill("Pipeline CRM Export");
  await page.getByLabel("Source type").selectOption("crm_export");
  await page.getByText("Pipeline / forecast review").click();
  await page.getByLabel("Import data").fill(`account,contact,title,vertical,stage,amount,close_date,probability,next_step,notes
Healthcare Credentialing Association,Renee Martin,Director of Education,Credentialing,Proposal,125000,2026-08-15,70,Confirm buyer next step,CE compliance budget approved and renewal planning deadline`);
  await page.getByRole("button", { name: "Analyze Import" }).click();
  await expect(page.getByTestId("import-results")).toContainText("Forecast Action");
  await expect(page.getByTestId("import-results")).toContainText("Deal Journey");
  await expect(page.getByTestId("import-results")).toContainText("Review Now");
});

test("linkedin research layer builds a command handoff", async ({ page }) => {
  await page.getByRole("button", { name: "LinkedIn" }).click();
  await expect(page.getByRole("heading", { name: "LinkedIn Research Layer" })).toBeVisible();
  await page.getByLabel("LinkedIn research intent").selectOption("growth_pipeline");
  await page.getByLabel("LinkedIn account name").fill("Credentialing Board of Ohio");
  await page.getByLabel("LinkedIn person name").fill("Renee Martin");
  await page.getByLabel("LinkedIn title").fill("Director of Certification");
  await page.getByLabel("LinkedIn profile URL").fill("https://www.linkedin.com/in/renee-martin-certification");
  await page.getByLabel("LinkedIn company URL").fill("https://www.linkedin.com/company/credentialing-board-of-ohio");
  await page.getByLabel("LinkedIn search URL").fill("https://www.linkedin.com/sales/search/people?query=credentialing%20certification");
  await page.getByLabel("LinkedIn list name").fill("Ohio certification leaders");
  await page.getByLabel("LinkedIn notes").fill("Recent post mentions CE reporting, audit readiness, and LMS budget planning.");
  await page.getByRole("button", { name: "Build LinkedIn Brief" }).click();
  await expect(page.getByTestId("linkedin-brief")).toContainText("D2L Buyer Angles");
  await expect(page.getByTestId("linkedin-command-plan")).toContainText("Fetch person profile");
  await expect(page.getByTestId("linkedin-command-plan")).toContainText("Prepare growth import batch");
  await expect(page.getByText("Growth Pipeline Readiness")).toBeVisible();
  await page.screenshot({ path: `${screenshotDir}/linkedin-research.png`, fullPage: true });
});

test("outlook indexing layer builds read-only connector plan", async ({ page }) => {
  await page.getByRole("button", { name: "Outlook" }).click();
  await expect(page.getByRole("heading", { name: "Outlook Indexing Layer" })).toBeVisible();
  await page.getByLabel("Outlook indexing mode").selectOption("weekly_pipeline_prep");
  await page.getByLabel("Outlook account focus").fill("JUMP, TruMerit, Pacific Medical Training");
  await page.getByRole("button", { name: "Build Index Plan" }).click();
  await expect(page.getByTestId("outlook-index-plan")).toContainText("Email shortlist");
  await expect(page.getByText("Connector Action Plan")).toBeVisible();
  await expect(page.getByText("search_messages")).toBeVisible();
  await expect(page.getByText("list_events")).toBeVisible();
  await expect(page.getByRole("link", { name: "Export JSON" })).toBeVisible();
  await page.screenshot({ path: `${screenshotDir}/outlook-indexing.png`, fullPage: true });
});

test("pasted notes import creates an evidence record and handoff", async ({ page }) => {
  await page.getByRole("button", { name: "Imports" }).click();
  await page.getByLabel("Source type").selectOption("pasted_notes");
  await page.getByText("Meeting notes / pre-call brief").click();
  await page.getByLabel("Import data").fill("Healthcare Educators Association call notes: Sarah wants CE reporting, audit readiness, and a low-risk pilot path.");
  await page.getByRole("button", { name: "Analyze Import" }).click();
  await expect(page.getByTestId("import-results")).toContainText("Pasted notes were treated as one evidence record");
  await expect(page.getByTestId("import-results")).toContainText("Sales prepare-for-meeting");
});

test("captures mobile import result layout", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Imports" }).click();
  await page.getByLabel("Import data").fill(`company,contact,title,vertical,email,notes
Credentialing Board of Ohio,Renee Martin,Director of Certification,Credentialing,renee@example.org,CE reporting deadline and LMS budget approved`);
  await page.getByRole("button", { name: "Analyze Import" }).click();
  await expect(page.getByTestId("import-results")).toContainText("Work Now");
  await page.screenshot({ path: `${screenshotDir}/mobile-import-workflow.png`, fullPage: true });
});

test("follow-up builder and voice checker render outputs", async ({ page }) => {
  await page.getByRole("button", { name: "Follow-Up" }).click();
  await page.getByLabel("Follow-up contact").fill("Renee Martin");
  await page.getByRole("button", { name: "Build Follow-Up" }).click();
  await expect(page.getByTestId("followup-output")).toContainText("Renee Martin");

  await page.getByRole("button", { name: "Pat Voice" }).click();
  await expect(page.locator(".pill.danger", { hasText: "hope this finds you well" })).toBeVisible();
  await expect(page.locator(".pill.danger", { hasText: "just following up" })).toBeVisible();
});

test("captures mobile screenshot", async ({ page }) => {
  mkdirSync(screenshotDir, { recursive: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Today Command Center" })).toBeVisible();
  await page.screenshot({ path: `${screenshotDir}/mobile-dashboard.png`, fullPage: true });
});
