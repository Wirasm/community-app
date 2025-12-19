---
allowed-tools: Bash(bun run build:*), Bash(bun run lint:*), Bash(bun test:*)
description: Run all checks (build, lint, test)
---

Run comprehensive validation. Execute in sequence:

1. **Build** (includes type checking):
   ```bash
   bun run build
   ```

2. **Lint**:
   ```bash
   bun run lint
   ```

3. **Tests**:
   ```bash
   bun test
   ```

## Report

Summarize results:
- Build: PASS/FAIL
- Lint: X errors, Y warnings
- Tests: X passed, Y failed

**Overall: PASS or FAIL**
