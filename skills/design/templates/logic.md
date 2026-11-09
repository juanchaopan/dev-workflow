# LGC-{{001}} {{name}}

- Status: {{AI draft, awaiting confirmation / Confirmed (YYYY-MM-DD)}}
- Requirements: {{REQ-xxx}}
- Used by: {{SCR-xxx, API-xxx, JOB-xxx}}

## Rule

{{One paragraph on what this business logic does and why.}}

## State transitions

Write this section when there are states and transitions; delete it otherwise.

```mermaid
stateDiagram-v2
  [*] --> {{Draft}}
  {{Draft}} --> {{Submitted}} : {{submit}}
  {{Submitted}} --> {{Cancelled}} : {{cancel}}
```

| State | Display name | Allowed actions | Who may act | On entering this state |
|---|---|---|---|---|
| {{draft}} | {{Draft}} | {{edit, submit, delete}} | {{creator}} | {{}} |

Invalid transitions (e.g. "Submit" on a cancelled order): {{which error is returned, what the screen shows}}.
Two people acting on the same record at once: {{e.g. version check; whoever saves second sees "The data has changed, please reload"}}.

## Decision table

Write this section when there are many combinations of conditions; delete it otherwise. Each row is one test case.

| # | {{condition 1}} | {{condition 2}} | {{condition 3}} | Result |
|---|---|---|---|---|
| 1 | {{yes}} | {{yes}} | — | {{}} |
| 2 | {{yes}} | {{no}} | — | {{}} |
| 3 | {{no}} | — | — | {{}} |

## Calculation

Write this section when there are formulas; delete it otherwise.

- Formula: {{}}
- Precision and rounding: {{e.g. two decimals, round half up; round before or after summing}}
- Boundaries: {{zero, negative numbers, upper limits, empty values}}

| Example | Input | Result | Note |
|---|---|---|---|
| {{1}} | {{order of 99.50, coupon for 10 off orders of 100 or more}} | {{99.50 to pay}} | {{below 100, no discount}} |
