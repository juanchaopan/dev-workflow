# CUR-SCR-{{001}} {{screen name}}

- Trust: {{Observed / Inferred from code / Conflicting}}
- Code: `{{route or page file}}`, `{{backend handler}}`
- How to reach it: {{menu path, URL, which role}}
- Screenshots: {{`CUR-SCR-001-<name>.png` (normal), `CUR-SCR-001-<name>--<state>.png` (state); or "None: the system does not run, see FND-xxx"}}
- Related: {{CUR-API-xxx, CUR-ENT-xxx, CUR-RUL-xxx, REQ-xxx}}

## What it does

{{Who uses it and for what, as far as the code, the screens and the user tell.}}

## Fields

Required, length and validation are recorded separately for each place that enforces them; differences between them are findings.

| # | Field | Kind | Type | Required (screen / server / database) | Length or range (screen / server / database) | Default | Validation and where it runs | Error message | Data source | Trust |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | {{Customer name}} | {{input}} | {{text}} | {{yes / yes / no}} | {{200 / 100 / varchar(100)}} | {{empty}} | {{not blank: screen and server}} | {{"Name required"}} | {{orders.customer_name}} | {{Conflicting, FND-003}} |

## Actions

| Action | What the code does | Interface called | On success | On failure | Trust |
|---|---|---|---|---|---|
| {{Click "Save"}} | {{validates, posts the form}} | {{CUR-API-002}} | {{reloads the list}} | {{shows the server message in an alert}} | {{Observed}} |

## States seen

| State | How it appears | Screenshot |
|---|---|---|
| {{Normal}} | {{}} | `CUR-SCR-{{001}}-{{name}}.png` |
| {{Validation errors / Empty / No permission}} | {{}} | {{file, or "not captured: needs a form submission"}} |

## Rules and findings

- Rules applied on this screen: {{CUR-RUL-xxx}}
- Findings: {{FND-xxx}}
