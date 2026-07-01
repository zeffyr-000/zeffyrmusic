# CLAUDE.md — Zeffyr Music

> Entry point for **Claude Code**. The detailed conventions live in **[`AGENTS.md`](AGENTS.md)** — read it first.
> This file only maps the Claude Code ecosystem for the repo.

## Source of Truth

**[`AGENTS.md`](AGENTS.md)** is the single source of truth for architecture, rules, and patterns
(tech stack, stores vs services, signals, SSR safety, CSS critical rules, testing, etc.).
Read it before any code change. `llms.txt` is a condensed variant for other LLM tooling.

## Skills (`.claude/skills/`)

Domain guides loaded on demand — Claude Code picks the relevant one from its description.

| Skill                      | When it applies                                           |
| -------------------------- | --------------------------------------------------------- |
| `angular-components`       | Editing `*.component.ts`                                  |
| `angular-templates`        | Editing `*.html` templates                                |
| `angular-services`         | Editing `src/app/services/**`                             |
| `signal-store-patterns`    | Creating/modifying `@ngrx/signals` stores                 |
| `typescript-conventions`   | Any `*.ts` file                                           |
| `scss-styling`             | Editing `*.scss` (design system, utilities)               |
| `bootstrap-ui`             | Bootstrap / ng-bootstrap markup and styles                |
| `css-critical-rules`       | **BREAKING** — read before any CSS change near the player |
| `youtube-player-lifecycle` | Playback, control bar, iframe lifecycle                   |
| `ssr-safety`               | `src/server.ts`, stores, utils, SSR/hydration debugging   |
| `api-data-mapping`         | Backend snake_case ↔ frontend model mapping               |
| `vitest-testing`           | `*.spec.ts` unit tests                                    |
| `e2e-playwright`           | `e2e/**` Playwright tests                                 |
| `seo-help-pages`           | `src/app/help/**` structured data                         |
| `github-actions`           | `.github/workflows/**` CI                                 |

## Subagents (`.claude/agents/`)

| Agent               | Purpose                                                             |
| ------------------- | ------------------------------------------------------------------- |
| `angular-migration` | Modernize legacy code to signals / OnPush / zoneless / control flow |
| `player-debug`      | Debug YouTube player (CSS rules, iframe, mobile playback)           |
| `ssr-debug`         | Debug SSR (allowedHosts, hydration, browser-API safety)             |

## Slash commands (`.claude/commands/`)

`/create-component` · `/create-service` · `/create-store` · `/create-test` ·
`/create-e2e-test` · `/refactor-to-signals` · `/fix-css-player` · `/debug-performance` ·
`/code-review`

## Hooks (`.claude/settings.json`)

`PostToolUse` on `Edit|Write|MultiEdit` runs `prettier --write` then `eslint --fix`
on the touched `*.{ts,html,scss,css,json,md}` file.

## Everyday commands

```bash
npm start                    # Dev server
npm run serve:ssr:zeffyrmusic # SSR dev server
npm test                     # Vitest watch
npx vitest run               # Single run
npx vitest run --coverage    # Coverage (target ≥ 80%)
npm run lint                 # ESLint
npm run build                # Production build
npm run e2e                  # Playwright E2E
```
