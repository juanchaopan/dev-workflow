# Tech debt and quality baseline

The baseline is the state measured when the project was taken over. Checks run against it: existing problems do not fail, but new code may not make the numbers worse. After paying off an item, update the numbers and the list below and tighten the matching baseline.

## Quality baseline ({{YYYY-MM-DD}})

| Component | Build | Tests | Coverage | Duplication | Lint violations | Architecture violations |
|---|---|---|---|---|---|---|
| {{component}} | {{passes / fails: reason}} | {{count, passing}} | {{percentage or "no data"}} | {{percentage}} | {{count}} | {{count}} |

Most complex functions:

| Location | Complexity | Notes |
|---|---|---|
| `{{file:line}}` | {{value}} | {{what it does}} |

Most frequently changed files in the last year:

| File | Changes | Notes |
|---|---|---|
| `{{file}}` | {{count}} | {{why it changes so often}} |

## Tech debt

| ID | Problem | Impact | Risk | Effort | Recommendation | Status |
|---|---|---|---|---|---|---|
| TD-001 | {{e.g. the framework version is end of life}} | {{e.g. no more security updates}} | {{high / medium / low}} | {{S / M / L}} | {{how to handle it}} | {{open / issue #number / resolved}} |

## Temporarily relaxed checks

| Check | Relaxed for | Reason | Debt item |
|---|---|---|---|
| {{e.g. max-lines-per-function}} | `{{file}}` | {{exceeds the limit today}} | {{TD-xxx}} |
