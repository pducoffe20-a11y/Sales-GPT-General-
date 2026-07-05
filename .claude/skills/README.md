# Agent Skills

Claude Code agent skills installed into this repo. They load automatically when
you run Claude Code from the repo root and become available via the `Skill` tool.

Sourced from the [awesome-agent-skills](https://github.com/pducoffe20-a11y/awesome-agent-skills)
catalog, selected for relevance to this project (React + TypeScript + Vite, with
Playwright test tooling and a dense sales UI).

| Skill | Origin | Why it's here |
|---|---|---|
| `frontend-design` | [anthropics/skills](https://github.com/anthropics/skills/tree/main/skills/frontend-design) | Distinctive, intentional UI design guidance. Reinforces the dense, scan-first UI rules in `AGENTS.md` and steers away from templated SaaS looks. |
| `webapp-testing` | [anthropics/skills](https://github.com/anthropics/skills/tree/main/skills/webapp-testing) | Playwright-based toolkit for driving and testing the local web app (screenshots, DOM inspection, console logs). Complements the existing `tests/smoke.spec.ts`. |

Each skill retains its upstream `LICENSE.txt`. Files were fetched verbatim from
`anthropics/skills` (`main`).
