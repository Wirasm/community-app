---
allowed-tools: Grep, Read, Write, Bash(mkdir:*)
description: Audit type/lint suppression comments
---

Find all suppression comments in the codebase:
- `// @ts-ignore`
- `// @ts-expect-error`
- `// biome-ignore`
- `{/* @ts-ignore */}`

For each suppression found, analyze:
1. What error is being suppressed?
2. Is the suppression necessary?
3. Can the underlying issue be fixed?

Create report at `.agents/reports/suppression-audit-{YYYY-MM-DD}.md`:

```markdown
# Suppression Audit - {date}

## Summary
- Total suppressions: X
- Recommended to remove: Y
- Recommended to keep: Z

## Findings

### {path}:{line}
**Suppression:** `{comment}`
**Reason:** {why it exists}
**Options:**
1. {fix option}
2. {alternative}
**Recommendation:** Remove | Keep | Refactor
```

ultrathink about each suppression before making recommendations.
