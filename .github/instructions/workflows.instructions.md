---
applyTo: '.github/workflows/**'
---

# GitHub Actions Workflows Guidelines

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
