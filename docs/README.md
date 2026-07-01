# Documentation Index — Zeffyr Music

## Reading Order for AI Agents

1. **[/CLAUDE.md](../CLAUDE.md)** — Claude Code entry point: maps skills, agents, commands, hooks
2. **[/AGENTS.md](../AGENTS.md)** — Main AI guide: rules, patterns, architecture (source of truth)
3. **`css-critical-rules` skill** — YouTube player CSS (BREAKING if violated)
4. **Domain-specific** `.claude/skills/*` for the files you're modifying

## Architecture

| File                                       | Purpose                                                      |
| ------------------------------------------ | ------------------------------------------------------------ |
| [ARCHITECTURE.md](ARCHITECTURE.md)         | System overview, data flows, stores, routing, performance    |
| [CSS_ARCHITECTURE.md](CSS_ARCHITECTURE.md) | CSS file structure, naming, dropdowns, modals, mobile layout |

## Skills (`.claude/skills/`)

Domain guides for Claude Code, loaded on demand from their `description`:

| Skill                      | Domain                            |
| -------------------------- | --------------------------------- |
| `css-critical-rules`       | YouTube player CSS (BREAKING)     |
| `scss-styling`             | SCSS architecture, design system  |
| `bootstrap-ui`             | Bootstrap / ng-bootstrap          |
| `angular-components`       | `*.component.ts`                  |
| `angular-templates`        | `*.html` templates                |
| `angular-services`         | `src/app/services/**`             |
| `signal-store-patterns`    | `@ngrx/signals` stores            |
| `typescript-conventions`   | `*.ts`                            |
| `vitest-testing`           | `*.spec.ts`                       |
| `e2e-playwright`           | `e2e/**`                          |
| `api-data-mapping`         | Backend snake_case ↔ models       |
| `youtube-player-lifecycle` | Player playback / iframe          |
| `ssr-safety`               | SSR, allowedHosts, browser APIs   |
| `seo-help-pages`           | `src/app/help/**` structured data |
| `github-actions`           | `.github/workflows/**`            |

## Documentation Update Triggers

- **Critical rule change** → Update the `css-critical-rules` skill immediately
- **New pattern** → Update the relevant `.claude/skills/*` skill
- **Breaking change** → Update `AGENTS.md` + relevant docs
- **New store/service** → Update `AGENTS.md` folder structure + store/service tables
