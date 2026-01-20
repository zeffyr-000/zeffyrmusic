# Documentation Index - Zeffyr Music

**Quick Navigation for AI Agents and Developers**

## 🚨 Critical Files (Read First)

| File                                                                   | Purpose                                       | Priority    |
| ---------------------------------------------------------------------- | --------------------------------------------- | ----------- |
| [css-critical-rules.md](../.github/instructions/css-critical-rules.md) | **YouTube player CSS rules** - DO NOT VIOLATE | 🔴 CRITICAL |
| [AGENTS.md](../AGENTS.md)                                              | AI agent guidelines, quality targets (17/20+) | 🟠 HIGH     |
| [copilot-instructions.md](../.github/copilot-instructions.md)          | Code standards, conventions, testing          | 🟠 HIGH     |

## 📚 Architecture Documentation

| File                                                           | Purpose                                           | When to Read        |
| -------------------------------------------------------------- | ------------------------------------------------- | ------------------- |
| [ARCHITECTURE.md](ARCHITECTURE.md)                             | Overall system design, stores, services           | Project onboarding  |
| [STATE_MANAGEMENT_MIGRATION.md](STATE_MANAGEMENT_MIGRATION.md) | Signal Stores migration history                   | Working with stores |
| [CSS_ARCHITECTURE.md](CSS_ARCHITECTURE.md)                     | Additional CSS context (see critical rules first) | CSS modifications   |

## 📝 Historical Context

| File                                                         | Purpose                             | When to Read                |
| ------------------------------------------------------------ | ----------------------------------- | --------------------------- |
| [CSS_REFACTORING_CHANGELOG.md](CSS_REFACTORING_CHANGELOG.md) | CSS refactoring metrics and lessons | Understanding CSS decisions |
| [BOOTSTRAP_GUIDELINES.md](BOOTSTRAP_GUIDELINES.md)           | Bootstrap best practices            | UI development              |

## 🎯 Learning Paths

**New AI Agent (First Time):**

1. Read `css-critical-rules.md` ⚠️
2. Read `AGENTS.md`
3. Read `copilot-instructions.md`
4. Skim `ARCHITECTURE.md`

**CSS Modification Task:**

1. **MUST read** `css-critical-rules.md` first
2. Reference `CSS_ARCHITECTURE.md` for additional context
3. Check `CSS_REFACTORING_CHANGELOG.md` for historical decisions

**New Feature Development:**

1. Read `ARCHITECTURE.md` (stores, services)
2. Read `copilot-instructions.md` (coding standards)
3. Check `STATE_MANAGEMENT_MIGRATION.md` if using stores

- YouTube player integration has specific requirements
- External elements need global CSS
- Mobile responsive rules are non-negotiable
- Past refactoring lessons documented

## 📦 Code Instructions (AI-Optimized)

Located in `.github/instructions/`:

- `css-critical-rules.md` - CSS critical rules (YAML frontmatter, code-first)
- `components.instructions.md` - Component patterns
- `stores.instructions.md` - Store patterns
- `services.instructions.md` - Service patterns
- `templates.instructions.md` - HTML/template patterns
- `tests.instructions.md` - Testing patterns

**Format:** Optimized for AI parsing (YAML metadata, code examples, minimal prose)

## 🔧 Maintenance Guidelines

**Documentation Update Triggers:**

1. **Critical rule change** → Update `css-critical-rules.md` immediately
2. **New pattern** → Update relevant `.github/instructions/*.md` file
3. **Breaking change** → Update `AGENTS.md` + relevant docs
4. **Major refactor** → Add changelog entry (keep ≤200 lines)

**File Size Targets:**

- Critical rules: ≤150 lines
- Agent guidelines: ≤200 lines
- Architecture: ≤300 lines
- Changelogs: ≤200 lines

**Avoid:**

- Duplicate information across files
- Prose-heavy explanations (use code examples)
- Historical details (summarize, don't chronicle)

Last updated: January 20, 2026
