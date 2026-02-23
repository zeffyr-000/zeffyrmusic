---
applyTo: '.github/workflows/**'
---

# GitHub Actions Workflows Guidelines

## Workflow Architecture

Single workflow file handles all CI steps:

| File     | Triggers                            | Role                                  |
| -------- | ----------------------------------- | ------------------------------------- |
| `ci.yml` | `pull_request` + `push` on `master` | Format, lint, test, SonarCloud, build |

**When deployment is implemented**, split into `ci.yml` (PR) + `deploy.yml` (push to master, with deploy steps after the CI job via `workflow_call`).

## Required Secrets

| Secret         | Used by  | Purpose                                 |
| -------------- | -------- | --------------------------------------- |
| `SONAR_TOKEN`  | `ci.yml` | SonarCloud CI analysis                  |
| `GITHUB_TOKEN` | `ci.yml` | Automatic — PR decoration by SonarCloud |

> `CODECOV_TOKEN` is no longer used — Codecov has been replaced by SonarCloud.

## SonarCloud Setup

SonarCloud runs in **CI mode** (not Automatic Analysis). Configuration is in `sonar-project.properties` at the repo root.  
To onboard a new repository:

1. Disable "Automatic Analysis" on SonarCloud dashboard
2. Generate a token: My Account → Security → Generate Token
3. Add `SONAR_TOKEN` to GitHub: Settings → Secrets → Actions
4. Update `sonar.projectKey` and `sonar.organization` in `sonar-project.properties`

> **Dependabot PRs:** Repository secrets are not available to Dependabot workflows. The SonarCloud step is guarded with `if: env.SONAR_TOKEN != ''` (the secret is exposed as a job-level env var) and will be skipped automatically — the CI job still passes.

## Shell Script Rules

Use POSIX-compliant syntax (not bash-specific):

```yaml
# ✅ POSIX-compliant
- run: |
    if [ "${{ github.actor }}" = "dependabot[bot]" ]; then
      npm install
    else
      npm ci
    fi

# ❌ Bash-specific
- run: |
    if [[ "${{ github.actor }}" == "dependabot[bot]" ]]; then ...
```

| Bash    | POSIX |
| ------- | ----- |
| `[[ ]]` | `[ ]` |
| `==`    | `=`   |

## Dependabot PRs

Use `npm install` (not `npm ci`) for Dependabot to sync transitive dependencies:

```yaml
- run: |
    if [ "${{ github.actor }}" = "dependabot[bot]" ]; then
      npm install
    else
      npm ci
    fi
```

## Best Practices

- Quote all variables: `"$variable"`
- Keep scripts minimal — complex logic in npm scripts
- Check existing workflows before adding new ones
- `fetch-depth: 0` is mandatory on all checkouts (required by SonarCloud)
