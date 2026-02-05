# GitHub Actions Workflows Guidelines

## Shell Script Conventions

### Use POSIX-Compliant Shell Syntax

Always use POSIX-compliant shell syntax in workflow scripts for portability:

**DO:**

```yaml
- name: Conditional step
  run: |
    if [ "${{ github.actor }}" = "dependabot[bot]" ]; then
      npm install
    else
      npm ci
    fi
```

**DON'T:**

```yaml
# ❌ Bash-specific syntax (not POSIX-compliant)
- name: Conditional step
  run: |
    if [[ "${{ github.actor }}" == "dependabot[bot]" ]]; then
      npm install
    else
      npm ci
    fi
```

### Key Differences

| Bash-specific | POSIX-compliant |
| ------------- | --------------- |
| `[[ ]]`       | `[ ]`           |
| `==`          | `=`             |
| `!=`          | `!=` (same)     |

### Why POSIX?

1. **Portability** - Works on any shell, not just bash
2. **Consistency** - Matches existing workflows in this project
3. **Reliability** - GitHub Actions default shell may vary

## Dependabot PRs

### Lock File Synchronization

Dependabot updates `package.json` but may not sync transitive dependencies in `package-lock.json`. Use `npm install` instead of `npm ci` for Dependabot PRs:

```yaml
- name: Install dependencies
  run: |
    if [ "${{ github.actor }}" = "dependabot[bot]" ]; then
      npm install
    else
      npm ci
    fi
```

### Handling Peer Dependency Conflicts

When Dependabot PRs fail due to peer dependency conflicts:

1. Check if a newer version of the conflicting package exists
2. If not, close the PR with explanation
3. Example: `@jsverse/utils` upgrade blocked by `@jsverse/transloco-messageformat` peer dependency

## Best Practices

1. **Check existing workflows** before adding new shell scripts
2. **Quote all variables** - `"$variable"` not `$variable`
3. **Use explicit exit codes** when needed
4. **Keep scripts minimal** - complex logic belongs in npm scripts
