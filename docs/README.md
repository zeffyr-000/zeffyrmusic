# Documentation Index — Zeffyr Music

## Reading Order for AI Agents

1. **[/AGENTS.md](../AGENTS.md)** — Main AI guide: rules, patterns, architecture (START HERE)
2. **[css-critical-rules.md](../.github/instructions/css-critical-rules.md)** — YouTube player CSS (BREAKING if violated)
3. **Domain-specific** `.github/instructions/*.md` for the files you're modifying

## Architecture

| File                                       | Purpose                                                      |
| ------------------------------------------ | ------------------------------------------------------------ |
| [ARCHITECTURE.md](ARCHITECTURE.md)         | System overview, data flows, stores, routing, performance    |
| [CSS_ARCHITECTURE.md](CSS_ARCHITECTURE.md) | CSS file structure, naming, dropdowns, modals, mobile layout |

## Instruction Files (`.github/instructions/`)

Auto-applied by VS Code based on file patterns:

| File                         | Applied To                  |
| ---------------------------- | --------------------------- |
| `css-critical-rules.md`      | `**/*.scss, **/*.css`       |
| `bootstrap.instructions.md`  | `**/*.html, **/*.scss`      |
| `components.instructions.md` | `src/app/**/*.component.ts` |
| `services.instructions.md`   | `src/app/services/**/*.ts`  |
| `stores.instructions.md`     | `src/app/store/**/*.ts`     |
| `styles.instructions.md`     | `**/*.scss, **/*.css`       |
| `templates.instructions.md`  | `**/*.html`                 |
| `tests.instructions.md`      | `**/*.spec.ts`              |
| `typescript.instructions.md` | `**/*.ts`                   |
| `workflows.instructions.md`  | `.github/workflows/**`      |

## Documentation Update Triggers

- **Critical rule change** → Update `css-critical-rules.md` immediately
- **New pattern** → Update relevant `.github/instructions/*.md`
- **Breaking change** → Update `AGENTS.md` + relevant docs
- **New store/service** → Update `AGENTS.md` folder structure + store/service tables
