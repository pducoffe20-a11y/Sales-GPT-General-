# D2L Sales Command Center Build Rules

## Product Standard

This app is a daily D2L Brightspace sales operating system for Pat, not a generic CRM dashboard. Optimize for deciding what to do next, prepping meetings, importing account/prospect data, analyzing pipeline, drafting review-safe follow-ups, and preserving momentum.

## Plugin Boundaries

- Use the outside D2L Codex plugins and Sales plugin as operating logic and vocabulary.
- Keep v1 frontend-only and import-first. Do not claim live Outlook, Slack, SharePoint, Zoom, or CRM execution unless a connector-backed adapter is actually implemented.
- Every recommendation must keep `whyItMatters`, `recommendedAction`, `softCta`, `confidence`, `source`, and `originatingModule`.
- Drafts are review artifacts only. Do not add send/post/write behavior without explicit user approval and a real connector implementation.

## Code Rules

- React + TypeScript + Vite.
- Keep shared contracts in `src/types.ts`.
- Keep local analysis in `src/analysis/`.
- Keep sample data in `src/data/mockData.ts`.
- Keep plugin/source mapping in `src/data/pluginRegistry.ts`.
- Maintain dense, scan-friendly UI. Avoid marketing hero pages, purple SaaS gradients, nested cards, and vague sales jargon.

## Validation

- Run `npm run build`.
- Run `npm run test:smoke` when UI behavior changes.
- Playwright screenshots belong in `artifacts/screenshots`, which is ignored.
