# Business rules found in the current system

Rules the code applies, wherever they live: validation, calculations, state transitions, permissions, scheduled behavior and special cases. These are the rules a rewrite most often loses, because no requirement document mentions them. Each one gets a decision in /design: kept, changed or dropped.

Every rule says where it is implemented, so the user can check it and /design can quote it.

## Validation

| ID | Rule | Applies to | Where | Trust | Findings |
|---|---|---|---|---|---|
| CUR-RUL-{{001}} | {{e.g. a phone number must have 10 or 11 digits}} | {{CUR-SCR-002 field 4, CUR-API-002}} | `{{file:line}}` | {{Inferred from code}} | {{}} |

## Calculations

Formulas with their precision, rounding and boundaries, and one worked example taken from real or test data where possible.

| ID | Rule | Example | Where | Trust | Findings |
|---|---|---|---|---|---|
| CUR-RUL-{{002}} | {{e.g. 10 off for orders of 100 or more, applied before tax}} | {{e.g. 120.00 → 110.00, tax on 110.00}} | `{{file:line}}` | {{Observed}} | {{FND-001}} |

## States and transitions

```mermaid
stateDiagram-v2
  [*] --> {{draft}}
  {{draft}} --> {{submitted}} : {{submit}}
```

| ID | Transition | Who may do it | Condition | Side effects | Where | Trust |
|---|---|---|---|---|---|---|
| CUR-RUL-{{003}} | {{draft → submitted}} | {{the owner}} | {{at least one line}} | {{email to the warehouse}} | `{{file:line}}` | {{Inferred from code}} |

Values found in the data but not handled by the code (e.g. a status code 9 no branch checks) are findings.

## Permissions

| ID | Rule | Where it is enforced (screen / server) | Trust | Findings |
|---|---|---|---|---|
| CUR-RUL-{{004}} | {{e.g. only managers approve refunds}} | {{button hidden / no server check}} | {{Conflicting}} | {{FND-006}} |

## Scheduled and background behavior

| ID | Rule | When | Where | Trust |
|---|---|---|---|---|
| CUR-RUL-{{005}} | {{e.g. unpaid orders are cancelled after 7 days}} | {{nightly 02:00}} | `{{file:line}}` | {{Inferred from code}} |

## Special cases

Hard-coded values and exceptions: specific customers, dates, amounts, feature switches, workarounds.

| ID | Rule | Where | Trust | Findings |
|---|---|---|---|---|
| CUR-RUL-{{006}} | {{e.g. customer 1042 never pays shipping}} | `{{file:line}}` | {{Inferred from code}} | {{FND-008}} |
