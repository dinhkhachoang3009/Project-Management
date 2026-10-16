// Seed demo data for the TaskManager app (MongoDB Atlas via backend/.env MONGO_URI).
//
// BOTH workspaces are IT-themed:
//   1. "Acme Product Team"  — software product development (portal, mobile app, API sunset)
//   2. "Cloud Platform & SRE" — infrastructure & reliability (kubernetes, observability)
//
// Usage (run from the backend/ directory):
//   node scripts/seed-demo-data.mjs --wipe
//   --wipe deletes ALL workspace/project/task/comment/activity data first
//   and ALWAYS KEEPS user accounts. Without --wipe it refuses to run if any
//   workspace already exists (safety).
//
// To change who plays which role, edit the emails + role maps below.
// Reset command is simply: node scripts/seed-demo-data.mjs --wipe

import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "../models/user.js";
import Workspace from "../models/workspace.js";
import Project from "../models/project.js";
import Task from "../models/task.js";
import Comment from "../models/comment.js";
import ActivityLog from "../models/activity.js";
import Verification from "../models/verification.js";
import WorkspaceInvite from "../models/workspace-invite.js";
import { recordActivity } from "../libs/index.js";

dotenv.config();

// ============ EDIT HERE: the 7 seeded users (12/14/24 stay untouched spares) ============
const USER_EMAILS = {
  u7a: "dinhkhachoang7a@gmail.com",
  u69: "dinhkhachoang69@gmail.com",
  u23: "dinhkhachoang23@gmail.com",
  u16: "dinhkhachoang16@gmail.com",
  u9a: "dinhkhachoang9a@gmail.com",
  ut2: "dinhkhachoangt2@gmail.com",
  u11: "dinhkhachoang11@gmail.com",
};

const DAY = 24 * 60 * 60 * 1000;
const daysFromNow = (n) => new Date(Date.now() + n * DAY);

const connect = async () => {
  const uri = process.env.MONGO_URI?.trim();
  if (!uri) throw new Error("MONGO_URI is not set in backend/.env");
  await mongoose.connect(uri);
};

const wipe = async () => {
  const results = await Promise.all([
    Workspace.deleteMany({}),
    Project.deleteMany({}),
    Task.deleteMany({}),
    Comment.deleteMany({}),
    ActivityLog.deleteMany({}),
    Verification.deleteMany({}),
    WorkspaceInvite.deleteMany({}),
  ]);
  const names = ["Workspace", "Project", "Task", "Comment", "ActivityLog", "Verification", "WorkspaceInvite"];
  console.log("WIPE COMPLETE (user accounts kept):");
  names.forEach((name, i) => console.log(`  ${name}: ${results[i].deletedCount} deleted`));
};

// ==================== DATASET (all IT-themed, every task unique) ====================

const WORKSPACES = [
  {
    key: "u7a",
    name: "Acme Product Team",
    description: "Software product development: customer portal, mobile app, platform maintenance",
    color: "#3B82F6",
    born: -62,
    roles: { u7a: "owner", u69: "admin", u23: "member", u16: "member", u11: "viewer" },
    projects: [
      {
        title: "Customer Portal v2",
        description: "Rebuild the customer-facing portal on the new design system and v2 API",
        status: "In Progress",
        startIn: -20,
        dueIn: 15,
        progress: 45,
        tags: ["frontend", "react"],
        roles: { u69: "manager", u23: "contributor", u16: "contributor", u11: "viewer" },
        tasks: [
          {
            title: "Design login flow wireframes",
            description: "Wireframes for the new login, forgot-password and MFA entry screens",
            status: "Done", priority: "High", dueIn: -12, born: -18, assignees: ["u23"],
            subtasks: [
              { title: "Draft low-fi sketches", completed: true },
              { title: "Review with 69", completed: true },
              { title: "Finalize hi-fi mockups", completed: true },
              { title: "Hand off to dev", completed: false },
            ],
            comments: [
              { by: "u69", day: 1, text: "Wireframes look clean — one note: add the 'forgot password' link above the fold" },
              { by: "u23", day: 1, text: "Good catch, pushed an update to frame 4" },
              { by: "u16", day: 3, text: "Dev handoff received, no blocking questions" },
            ],
          },
          {
            title: "Implement OAuth2 callback handler",
            description: "Full OAuth2 authorization-code flow with refresh-token storage",
            status: "In Progress", priority: "High", dueIn: 3, born: -8, assignees: ["u69"],
            subtasks: [
              { title: "Validate state parameter", completed: true },
              { title: "Exchange code for tokens", completed: false },
              { title: "Store refresh token securely", completed: false },
              { title: "Handle provider error redirects", completed: false },
            ],
            comments: [
              { by: "u23", day: 1, text: "Found an edge case where the state param is missing on Safari — filed it, can you handle the fallback?" },
              { by: "u69", day: 1, text: "Good catch — added an error redirect, PR is up for review" },
              { by: "u16", day: 2, text: "Reviewed and approved, nice work" },
              { by: "u23", day: 3, text: "Deployed to staging, QA will verify tomorrow morning" },
            ],
          },
          {
            title: "Migrate account settings page to new design system",
            description: "Swap legacy CSS for design tokens on the highest-traffic settings route",
            status: "In Progress", priority: "Medium", dueIn: 6, born: -6, assignees: ["u16"],
            subtasks: [
              { title: "Swap table styles to design tokens", completed: true },
              { title: "Update form controls", completed: false },
              { title: "Remove legacy CSS overrides", completed: false },
            ],
            comments: [
              { by: "u69", day: 1, text: "Heads up: settings page is the most trafficked route — watch CLS closely" },
              { by: "u16", day: 2, text: "Checked Lighthouse after the swap, CLS stayed at 0.02" },
            ],
          },
          {
            title: "Fix flaky checkout E2E test",
            description: "Nightly E2E fails intermittently on the payment iframe",
            status: "To Do", priority: "High", dueIn: 1, born: -3, assignees: ["u69"],
            subtasks: [
              { title: "Reproduce race condition on CI", completed: false },
              { title: "Add explicit waits to payment step", completed: false },
              { title: "Tag test for nightly run", completed: false },
            ],
            comments: [
              { by: "u23", day: 1, text: "Failed again on yesterday's nightly — logs point to the payment iframe loading late" },
              { by: "u69", day: 1, text: "Suspected as much, will add a waitForSelector before asserting" },
            ],
          },
          {
            title: "Write API migration guide for v2 endpoints",
            description: "Partner-facing guide for migrating from v1 to v2 API",
            status: "To Do", priority: "Low", dueIn: 12, born: -2, assignees: ["u23"],
            subtasks: [],
            comments: [
              { by: "u69", day: 1, text: "Please include curl examples — partners keep asking for them" },
            ],
          },
          {
            title: "Set up staging environment for QA",
            description: "Provision a staging cluster seeded with anonymized production data",
            status: "Done", priority: "Medium", dueIn: -5, born: -14, assignees: ["u16"],
            subtasks: [
              { title: "Provision staging cluster", completed: true },
              { title: "Seed test data", completed: true },
              { title: "Open firewall to QA office", completed: true },
            ],
            comments: [
              { by: "u16", day: 1, text: "Staging is live — seeded with last Friday's anonymized dump" },
              { by: "u69", day: 2, text: "Verified login + checkout flow, looks good" },
            ],
          },
          {
            title: "Weekly bug triage",
            description: "Triage the incoming bug queue and assign owners",
            status: "Done", priority: "Low", dueIn: -4, born: -9, assignees: ["u69"],
            subtasks: [],
            comments: [
              { by: "u23", day: 1, text: "Triage notes published in the wiki, 3 tickets moved to backlog" },
            ],
          },
          {
            title: "Accessibility audit of dashboard",
            description: "axe scan on key routes plus a manual keyboard-navigation pass",
            status: "To Do", priority: "Medium", dueIn: 9, born: -1, assignees: ["u23"], watchers: ["u11"],
            subtasks: [
              { title: "Run axe scan on key routes", completed: false },
              { title: "Document violations", completed: false },
            ],
            comments: [],
          },
          {
            title: "Investigate legacy session cookie bug",
            description: "Old cookie jars broke after the SameSite default change",
            status: "Done", priority: "Medium", dueIn: -16, born: -25, assignees: ["u16"], archived: true,
            subtasks: [
              { title: "Reproduce with old cookie jar", completed: true },
              { title: "Write regression test", completed: true },
            ],
            comments: [
              { by: "u23", day: 1, text: "Two more reports came in from Chrome 116 users" },
              { by: "u16", day: 2, text: "Root cause found: SameSite default change — fix deployed, test added" },
            ],
          },
        ],
      },
      {
        title: "Mobile App iOS Release",
        description: "React Native iOS app: beta release to App Store",
        status: "Planning",
        startIn: -5,
        dueIn: 45,
        progress: 15,
        tags: ["mobile", "ios"],
        roles: { u7a: "manager", u16: "contributor", u11: "viewer" },
        tasks: [
          {
            title: "Define minimum viable feature set",
            description: "Scope doc for the v0.1 beta feature set",
            status: "Done", priority: "High", dueIn: -3, born: -5, assignees: ["u7a"],
            subtasks: [
              { title: "Collect stakeholder requests", completed: true },
              { title: "Score by impact/effort", completed: true },
              { title: "Freeze v0.1 scope", completed: true },
            ],
            comments: [
              { by: "u16", day: 1, text: "Draft scope doc looks solid — offline mode flagged for v0.2?" },
              { by: "u7a", day: 1, text: "Yes, parked for v0.2, keep the sync hooks in place though" },
            ],
          },
          {
            title: "Set up React Native CI pipeline",
            description: "Fastlane-based build + TestFlight distribution pipeline",
            status: "In Progress", priority: "Medium", dueIn: 8, born: -3, assignees: ["u16"],
            subtasks: [
              { title: "Configure Fastlane match", completed: true },
              { title: "Add TestFlight distribution step", completed: false },
              { title: "Document build process", completed: false },
            ],
            comments: [
              { by: "u7a", day: 1, text: "Apple dev account credentials are in the shared vault now" },
              { by: "u16", day: 2, text: "Match is configured, first testflight build queued" },
            ],
          },
          {
            title: "Design offline-first sync strategy",
            description: "Conflict resolution and local schema for offline mode",
            status: "To Do", priority: "High", dueIn: 14, born: -2, assignees: ["u7a"],
            subtasks: [
              { title: "Choose conflict resolution rules", completed: false },
              { title: "Define local schema", completed: false },
            ],
            comments: [
              { by: "u16", day: 1, text: "Last-write-wins is probably fine for v0.1, we can revisit" },
            ],
          },
          {
            title: "Choose push notification provider",
            description: "Compare FCM, direct APNs and batch tools on price and DX",
            status: "In Progress", priority: "Low", dueIn: 4, born: -4, assignees: ["u7a"],
            subtasks: [{ title: "Compare FCM vs APNs direct vs batch tools", completed: true }],
            comments: [
              { by: "u7a", day: 2, text: "Pricing from two vendors came back — leaning toward the simpler one" },
              { by: "u16", day: 3, text: "Simpler one had a 100k/month free tier, fits our beta easily" },
            ],
          },
          {
            title: "Prepare App Store listing copy",
            description: "Title, subtitle, keywords and screenshots brief",
            status: "To Do", priority: "Medium", dueIn: 25, born: -1, assignees: ["u16"],
            subtasks: [],
            comments: [
              { by: "u7a", day: 1, text: "Include a 'for dev teams' angle in the subtitle" },
            ],
          },
          {
            title: "Recruit beta testers list",
            description: "Collect 20 internal + external beta testers via TestFlight",
            status: "To Do", priority: "Low", dueIn: 20, born: -1, assignees: ["u16"],
            subtasks: [],
            comments: [],
          },
          {
            title: "Evaluate React Native vs Flutter spike",
            description: "Two-week framework spike before committing the stack",
            status: "Done", priority: "Medium", dueIn: -4, born: -30, assignees: ["u7a"], archived: true,
            subtasks: [
              { title: "Build login screen in both", completed: true },
              { title: "Measure dev velocity", completed: true },
              { title: "Present findings", completed: true },
            ],
            comments: [
              { by: "u16", day: 1, text: "Flutter hot-reload felt faster, but RN wins on team familiarity" },
              { by: "u7a", day: 2, text: "Agreed — decision doc published, going with React Native" },
              { by: "u11", day: 4, text: "Noted for the roadmap review, thanks" },
            ],
          },
        ],
      },
      {
        title: "Legacy API Sunset",
        description: "Shut down v1 API cleanly: audits, notices, migration weekend",
        status: "Completed",
        startIn: -60,
        dueIn: -5,
        progress: 100,
        tags: ["infra", "deprecation"],
        roles: { u69: "manager", u23: "contributor", u16: "contributor" },
        tasks: [
          {
            title: "Audit v1 API consumers",
            description: "Map every consumer of the v1 API to an owning team",
            status: "Done", priority: "High", dueIn: -40, born: -55, assignees: ["u23"],
            subtasks: [
              { title: "Scrape gateway logs", completed: true },
              { title: "Map consumers to teams", completed: true },
              { title: "Email untagged callers", completed: true },
            ],
            comments: [
              { by: "u69", day: 2, text: "42 consumers found — 9 had no team owner" },
              { by: "u23", day: 3, text: "All 9 tracked down and tagged now" },
            ],
          },
          {
            title: "Notify partner teams of sunset date",
            description: "Sunset notice to all external partner integrators",
            status: "Done", priority: "Medium", dueIn: -35, born: -45, assignees: ["u69"],
            subtasks: [
              { title: "Draft sunset notice", completed: true },
              { title: "Send to partner mailing list", completed: true },
            ],
            comments: [
              { by: "u23", day: 2, text: "Two partners asked for a 2-week extension on the webhook API" },
              { by: "u69", day: 3, text: "Approved for the payment webhooks only" },
            ],
          },
          {
            title: "Publish v1 deprecation guide",
            description: "Migration guide linked from every v1 4xx response",
            status: "Done", priority: "Low", dueIn: -30, born: -38, assignees: ["u23"],
            subtasks: [],
            comments: [
              { by: "u16", day: 1, text: "Guide is clear — linked it from every v1 4xx response" },
            ],
          },
          {
            title: "Monitor error rates on v1 endpoints",
            description: "Deprecation dashboard until v1 traffic reaches zero",
            status: "Done", priority: "Medium", dueIn: -10, born: -20, assignees: ["u16"],
            subtasks: [{ title: "Create deprecation dashboard", completed: true }],
            comments: [
              { by: "u16", day: 5, text: "Error rate down to 0.2%, most traffic is off v1 now" },
              { by: "u69", day: 6, text: "Nice, sunset criteria met" },
            ],
          },
          {
            title: "Final migration weekend checklist",
            description: "Cutover checklist for the final sunset weekend",
            status: "Done", priority: "High", dueIn: -6, born: -12, assignees: ["u69"],
            subtasks: [
              { title: "Freeze deploys", completed: true },
              { title: "Final log backup", completed: true },
              { title: "DNS cutover", completed: true },
              { title: "Announce completion", completed: true },
            ],
            comments: [
              { by: "u23", day: 1, text: "Checklist reviewed, one item missing: notify the status page" },
              { by: "u69", day: 1, text: "Added, thanks" },
              { by: "u16", day: 4, text: "Weekend went clean, zero customer tickets" },
            ],
          },
          {
            title: "Disable v1 staging environment",
            description: "Drain and power off the v1 staging stack",
            status: "Done", priority: "Low", dueIn: -8, born: -25, assignees: ["u16"], archived: true,
            subtasks: [{ title: "Drain test traffic", completed: true }],
            comments: [
              { by: "u69", day: 1, text: "Staging v1 down, snapshots kept for 90 days" },
            ],
          },
          {
            title: "Archive v1 Postman collection",
            description: "Move the v1 collection to the archive workspace folder",
            status: "Done", priority: "Low", dueIn: -9, born: -22, assignees: ["u23"], archived: true,
            subtasks: [],
            comments: [],
          },
        ],
      },
    ],
  },
  {
    key: "u69",
    name: "Cloud Platform & SRE",
    description: "Infrastructure, reliability and platform tooling",
    color: "#F59E0B",
    born: -36,
    roles: { u69: "owner", u23: "admin", u7a: "member", u9a: "member", ut2: "viewer" },
    projects: [
      {
        title: "Kubernetes Cluster Upgrade",
        description: "Roll the production cluster to the new version with zero downtime",
        status: "In Progress",
        startIn: -15,
        dueIn: 20,
        progress: 55,
        tags: ["k8s", "infra"],
        roles: { u23: "manager", u9a: "contributor", u7a: "contributor", u69: "contributor", ut2: "viewer" },
        tasks: [
          {
            title: "Terraform modules for new node groups",
            description: "Reusable EKS node-group modules with per-env tfvars",
            status: "Done", priority: "High", dueIn: -10, born: -14, assignees: ["u9a"],
            subtasks: [
              { title: "Define EKS module", completed: true },
              { title: "Peer VPC routes", completed: true },
              { title: "Write tfvars per env", completed: true },
              { title: "Dry-run plan output", completed: false },
            ],
            comments: [
              { by: "u23", day: 1, text: "Module plan output looks clean, no in-place surprises" },
              { by: "u9a", day: 1, text: "Applied to staging without a single warning" },
              { by: "u69", day: 2, text: "Merged. Please keep the tfvars diff tiny per env" },
              { by: "u7a", day: 3, text: "Picked this up for QA env — top work" },
            ],
          },
          {
            title: "Blue/green migration of production traffic",
            description: "Two-cluster cutover guarded by error budgets",
            status: "In Progress", priority: "High", dueIn: 5, born: -7, assignees: ["u23"],
            subtasks: [
              { title: "Freeze config changes", completed: false },
              { title: "Shift 10% traffic", completed: true },
              { title: "Monitor error budgets for 24h", completed: false },
              { title: "Shift 100%", completed: false },
              { title: "Rollback runbook ready", completed: true },
            ],
            comments: [
              { by: "u23", day: 1, text: "10% shifted, p99 latency flat so far" },
              { by: "u9a", day: 2, text: "Error budget burn is under 2% — safe to continue tomorrow" },
              { by: "u69", day: 3, text: "Signed off on the 100% shift for Friday morning" },
            ],
          },
          {
            title: "Update CI/CD pipelines for new cluster",
            description: "Point deploy agents and registry paths at the new cluster",
            status: "In Progress", priority: "Medium", dueIn: 2, born: -5, assignees: ["u7a"],
            subtasks: [
              { title: "Point deploy agents at new API endpoint", completed: true },
              { title: "Update image registry paths", completed: false },
            ],
            comments: [
              { by: "u23", day: 1, text: "Don't forget the nightly cron jobs — they hardcode the old server" },
              { by: "u7a", day: 2, text: "Good catch, moved them to the new kubeconfig" },
            ],
          },
          {
            title: "Recreate monitoring dashboards in new Grafana",
            description: "Import and rebuild the ops dashboards on the new Grafana",
            status: "To Do", priority: "Medium", dueIn: 8, born: -3, assignees: ["u9a"],
            subtasks: [
              { title: "Import API dashboard", completed: false },
              { title: "Rebuild SLO panels", completed: false },
              { title: "Route alerts to on-call", completed: false },
            ],
            comments: [
              { by: "u23", day: 1, text: "Start from the old JSON exports, they're in the repo" },
            ],
          },
          {
            title: "Decommission old worker nodes",
            description: "Cordon and remove the previous generation worker pool",
            status: "To Do", priority: "Low", dueIn: 10, born: -1, assignees: ["u69"],
            subtasks: [{ title: "Confirm no scheduled pods remain", completed: false }],
            comments: [],
          },
          {
            title: "Run chaos game day on staging",
            description: "Pod kills, drain tests and disruption budget verification",
            status: "To Do", priority: "High", dueIn: 12, born: -2, assignees: ["u7a"],
            subtasks: [
              { title: "Kill pods randomly", completed: false },
              { title: "Verify pod disruption budgets", completed: false },
              { title: "Test node drain", completed: false },
            ],
            comments: [
              { by: "u9a", day: 1, text: "I can join as scorer — let's book Thursday afternoon" },
            ],
          },
          {
            title: "Write runbook for DB failover",
            description: "Manual promotion steps rehearsed end-to-end",
            status: "Done", priority: "Medium", dueIn: -6, born: -12, assignees: ["u7a"],
            subtasks: [{ title: "Document manual promotion steps", completed: true }],
            comments: [
              { by: "u23", day: 2, text: "Ran a table-top exercise with the runbook — one missing step around DNS TTLs" },
              { by: "u7a", day: 3, text: "Added the TTL step, rehearsed again end-to-end" },
            ],
          },
          {
            title: "Renew TLS certificates for ingress",
            description: "Move ingress certs to cert-manager with auto-renewal",
            status: "Done", priority: "Low", dueIn: -4, born: -10, assignees: ["u69"],
            subtasks: [],
            comments: [
              { by: "u9a", day: 1, text: "Renewed via cert-manager this time — auto-renewal is on" },
            ],
          },
          {
            title: "Audit cluster version skew",
            description: "Node vs control plane version audit before upgrade",
            status: "Done", priority: "Medium", dueIn: -13, born: -20, assignees: ["u9a"], archived: true,
            subtasks: [{ title: "Compare node vs control plane versions", completed: true }],
            comments: [
              { by: "u23", day: 1, text: "Skew was 2 minors — upgraded the worst offenders first" },
              { by: "u9a", day: 2, text: "All within policy now" },
            ],
          },
          {
            title: "Dry-run upgrade on staging",
            description: "Full upgrade rehearsal on the staging cluster",
            status: "Done", priority: "Medium", dueIn: -11, born: -18, assignees: ["u23"], archived: true,
            subtasks: [],
            comments: [
              { by: "u69", day: 1, text: "Staging dry-run green — schedule prod for the weekend window" },
            ],
          },
        ],
      },
      {
        title: "Observability Stack Rollout",
        description: "OpenTelemetry tracing + Prometheus long-term storage",
        status: "Planning",
        startIn: -8,
        dueIn: 40,
        progress: 20,
        tags: ["observability", "prometheus"],
        roles: { u23: "manager", u9a: "contributor", ut2: "viewer" },
        tasks: [
          {
            title: "Evaluate OpenTelemetry vs vendor agents",
            description: "Bench CPU overhead and trace export compatibility",
            status: "Done", priority: "High", dueIn: -5, born: -8, assignees: ["u9a"],
            subtasks: [
              { title: "Bench CPU overhead", completed: true },
              { title: "Check trace export compat", completed: true },
            ],
            comments: [
              { by: "u23", day: 1, text: "Vendor agent was 2x CPU in the bench — OTel it is" },
              { by: "u9a", day: 1, text: "Agreed, and OTel keeps us vendor-neutral" },
            ],
          },
          {
            title: "Deploy Prometheus long-term storage",
            description: "Thanos + S3 with a tested retention policy",
            status: "In Progress", priority: "Medium", dueIn: 9, born: -7, assignees: ["u9a"],
            subtasks: [
              { title: "Provision Thanos", completed: false },
              { title: "Provision S3 bucket", completed: true },
              { title: "Test retention rules", completed: false },
            ],
            comments: [
              { by: "u9a", day: 1, text: "Thanos sidecar is up, bucket policy locked to read-write for the prom user only" },
              { by: "u23", day: 2, text: "Retention draft: 15d raw, 1y downsampled — sanity-check the storage math" },
              { by: "u9a", day: 3, text: "Math checks out, ~40GB/month with our current series count" },
            ],
          },
          {
            title: "Instrument backend with OTel SDK",
            description: "Tracing on the hot API routes first",
            status: "To Do", priority: "Medium", dueIn: 15, born: -5, assignees: ["u23"],
            subtasks: [
              { title: "Add tracing to API routes", completed: false },
              { title: "Define span attributes", completed: false },
              { title: "Verify export path", completed: false },
            ],
            comments: [
              { by: "u9a", day: 1, text: "Start with the auth + task routes, they cover 80% of traffic" },
            ],
          },
          {
            title: "Define SLIs and error budgets",
            description: "Three core user journeys with SLOs and burn alerts",
            status: "To Do", priority: "High", dueIn: 6, born: -4, assignees: ["u23"],
            subtasks: [{ title: "Pick 3 core user journeys", completed: false }],
            comments: [
              { by: "u69", day: 1, text: "Keep it to 3 SLIs max — more just becomes noise" },
            ],
          },
          {
            title: "Set up alert routing to on-call",
            description: "Alertmanager routes with escalation policy",
            status: "To Do", priority: "Medium", dueIn: 20, born: -2, assignees: ["u9a"],
            subtasks: [],
            comments: [],
          },
          {
            title: "Log retention policy review",
            description: "Audit logs 90 days, everything else 14",
            status: "To Do", priority: "Low", dueIn: 25, born: -1, assignees: ["u9a"],
            subtasks: [],
            comments: [
              { by: "u23", day: 1, text: "Security wants 90 days for audit logs, 14 for the rest" },
            ],
          },
          {
            title: "Migrate from free-tier APM",
            description: "Export history and disable the vendor agent before credits ran out",
            status: "Done", priority: "Medium", dueIn: -6, born: -15, assignees: ["u9a"], archived: true,
            subtasks: [
              { title: "Export last 30d of traces", completed: true },
              { title: "Disable vendor agent", completed: true },
            ],
            comments: [
              { by: "u23", day: 1, text: "Credits were the trigger — good timing to standardize" },
              { by: "u9a", day: 2, text: "Historical traces exported, dashboards switched to Prometheus" },
            ],
          },
        ],
      },
    ],
  },
];

// ==================== SEED ====================

const seed = async () => {
  const emails = Object.values(USER_EMAILS);
  const variants = emails.flatMap((e) => [e, e.trim().toLowerCase()]);
  const found = await User.find({ email: { $in: variants } });
  const byEmail = new Map(found.map((u) => [u.email.toLowerCase(), u]));
  const missing = emails.filter((e) => !byEmail.has(e.trim().toLowerCase()));
  if (missing.length > 0) {
    throw new Error(`These users are NOT registered yet: ${missing.join(", ")}`);
  }
  const unverified = found.filter((u) => !u.isEmailVerified).map((u) => u.email);
  if (unverified.length > 0) {
    console.warn(`WARNING — not email-verified: ${unverified.join(", ")}`);
  }
  const U = Object.fromEntries(
    Object.entries(USER_EMAILS).map(([key, email]) => [key, byEmail.get(email.trim().toLowerCase())])
  );

  const anyWorkspace = await Workspace.countDocuments({});
  if (anyWorkspace > 0) {
    throw new Error("A workspace already exists — run with --wipe to reset demo data first.");
  }

  const stats = { workspaces: 0, projects: 0, tasks: 0, archived: 0, comments: 0, subtasks: 0, activity: 0 };
  const perUser = Object.fromEntries(Object.keys(U).map((k) => [k, { tasks: 0, archived: 0, comments: 0 }]));

  for (const wsSpec of WORKSPACES) {
    const owner = U[wsSpec.key];
    const workspace = await Workspace.create({
      name: wsSpec.name,
      description: wsSpec.description,
      color: wsSpec.color,
      owner: owner._id,
      members: Object.entries(wsSpec.roles).map(([key, role]) => ({
        user: U[key]._id,
        role,
        joinedAt: daysFromNow(wsSpec.born),
      })),
      createdAt: daysFromNow(wsSpec.born),
      updatedAt: daysFromNow(wsSpec.born),
    });
    stats.workspaces++;
    await recordActivity(owner._id, "created_workspace", "Workspace", workspace._id, { name: wsSpec.name });
    stats.activity++;

    const projectIds = [];
    for (const pSpec of wsSpec.projects) {
      const managerKey = Object.entries(pSpec.roles).find(([, r]) => r === "manager")?.[0] ?? wsSpec.key;
      const manager = U[managerKey];
      const project = await Project.create({
        title: pSpec.title,
        description: pSpec.description,
        workspace: workspace._id,
        status: pSpec.status,
        startDate: daysFromNow(pSpec.startIn),
        dueDate: daysFromNow(pSpec.dueIn),
        progress: pSpec.progress,
        members: Object.entries(pSpec.roles).map(([key, role]) => ({ user: U[key]._id, role })),
        tags: pSpec.tags,
        createdBy: manager._id,
        createdAt: daysFromNow(pSpec.startIn),
        updatedAt: daysFromNow(pSpec.startIn),
      });
      stats.projects++;
      await recordActivity(manager._id, "created_project", "Project", project._id, { title: pSpec.title });
      stats.activity++;

      const taskIds = [];
      for (const tSpec of pSpec.tasks) {
        const managerForWatchers = tSpec.priority === "High" ? [manager._id] : [];
        const watcherIds = [...(tSpec.watchers ?? []), ...managerForWatchers]
          .map((w) => (typeof w === "string" ? U[w]._id : w))
          .filter(Boolean);
        const createdAt = daysFromNow(tSpec.born);
        const task = await Task.create({
          title: tSpec.title,
          description: tSpec.description,
          status: tSpec.status,
          priority: tSpec.priority,
          dueDate: daysFromNow(tSpec.dueIn),
          project: project._id,
          assignees: tSpec.assignees.map((k) => U[k]._id),
          subtasks: tSpec.subtasks,
          watchers: watcherIds,
          createdBy: manager._id,
          isArchived: Boolean(tSpec.archived),
          createdAt,
          updatedAt: createdAt,
        });
        stats.tasks++;
        stats.subtasks += tSpec.subtasks.length;
        for (const k of tSpec.assignees) perUser[k].tasks++;
        await recordActivity(manager._id, "created_task", "Task", task._id, { title: tSpec.title });
        stats.activity++;
        if (tSpec.archived && tSpec.status === "Done") {
          await recordActivity(U[tSpec.assignees[0]]._id, "completed_task", "Task", task._id, { title: tSpec.title });
          stats.activity++;
          stats.archived++;
          for (const k of tSpec.assignees) perUser[k].archived++;
        }
        taskIds.push(task._id);

        for (const cSpec of tSpec.comments ?? []) {
          const author = U[cSpec.by];
          const commentAt = new Date(createdAt.getTime() + cSpec.day * DAY);
          await Comment.create({
            task: task._id,
            author: author._id,
            text: cSpec.text,
            createdAt: commentAt,
            updatedAt: commentAt,
          });
          perUser[cSpec.by].comments++;
          stats.comments++;
          await recordActivity(author._id, "added_comment", "Comment", task._id, { taskTitle: tSpec.title });
          stats.activity++;
        }
      }

      await Project.updateOne({ _id: project._id }, { $set: { tasks: taskIds } });
      projectIds.push(project._id);
    }

    await Workspace.updateOne({ _id: workspace._id }, { $set: { projects: projectIds } });
  }

  console.log("\nSEED COMPLETE");
  console.log(
    `Totals — workspaces: ${stats.workspaces}, projects: ${stats.projects}, tasks: ${stats.tasks} (archived: ${stats.archived}), subtasks: ${stats.subtasks}, comments: ${stats.comments}, activity: ${stats.activity}`
  );
  for (const wsSpec of WORKSPACES) {
    console.log(`\nWorkspace "${wsSpec.name}" [${wsSpec.color}]`);
    console.log(
      "  roles:",
      Object.entries(wsSpec.roles)
        .map(([k, r]) => `${USER_EMAILS[k]}=${r}`)
        .join(", ")
    );
    for (const pSpec of wsSpec.projects) {
      const active = pSpec.tasks.filter((t) => !t.archived).length;
      const archived = pSpec.tasks.filter((t) => t.archived).length;
      console.log(
        `  ${pSpec.title} [${pSpec.status}] — ${active} tasks + ${archived} archived — roles: ${Object.entries(
          pSpec.roles
        )
          .map(([k, r]) => `${k}=${r}`)
          .join(", ")}`
      );
    }
  }
  console.log("\nPer-user stats:");
  for (const [k, s] of Object.entries(perUser)) {
    console.log(
      `  ${USER_EMAILS[k]} — tasks: ${s.tasks}, archived (on /achieved page): ${s.archived}, comments written: ${s.comments}`
    );
  }
  const spareCount = (await User.countDocuments({})) - Object.keys(U).length;
  console.log(`Spare users untouched: ${spareCount} (dinhkhachoang12, dinhkhachoang14, dinhkhachoang24)`);
};

const main = async () => {
  const args = process.argv.slice(2);
  const doWipe = args.includes("--wipe");

  if (!doWipe) {
    console.log("Usage:");
    console.log("  node scripts/seed-demo-data.mjs --wipe");
    console.log("  --wipe deletes all workspace/project/task/comment/activity data first (ALWAYS keeps user accounts)");
    console.log("  User emails + role maps are configured at the top of this file (EDIT HERE block).");
    console.log("  Without --wipe this script refuses to run if any workspace exists.");
    return;
  }

  await connect();
  await wipe();
  await seed();
  await mongoose.disconnect();
};

main().catch((err) => {
  console.error(`ERROR: ${err.message}`);
  process.exitCode = 1;
  mongoose.disconnect().finally(() => process.exit(process.exitCode || 0));
});
