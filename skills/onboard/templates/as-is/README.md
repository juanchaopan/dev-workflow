# Current system: evidence

Documented by /onboard on {{YYYY-MM-DD}} from {{e.g. the code at commit abc1234; the system running locally at http://localhost:8080 with test data; a copy of the database taken on YYYY-MM-DD}}.

This is evidence of what the old system does today, not a design to follow. Code can be wrong, parts may not run, and the pieces may contradict each other, so nothing here counts as correct just because the code does it. /design builds the target design from it in `docs/design/`, and the user confirms the target element by element, deciding for every old rule whether it is kept, changed or dropped. Files here are not edited afterwards except for the "Used by" and "Resolution" columns.

Trust levels:

- **Observed**: seen in the running system: screenshots, real responses, real data.
- **Inferred from code**: read from the code only; the system did not run, or this part could not be reached.
- **Conflicting**: sources disagree (frontend and backend, code and data, code and existing documents); see the finding.

## Areas

The progress tracker: /onboard documents one area at a time and running it again continues with the first area that is not "Documented".

| Area | Code | Status | Not reached, and why |
|---|---|---|---|
| {{e.g. Orders}} | `{{src/orders/}}` | {{Not started / Documented (YYYY-MM-DD)}} | {{e.g. "refund approval: needs a manager account we do not have"; "None"}} |

## Elements

| ID | Name | File | Code location | Trust | Findings | Used by |
|---|---|---|---|---|---|---|
| CUR-SCR-{{001}} | {{Order list}} | `screens/CUR-SCR-{{001}}-{{order-list}}.md` | `{{src/pages/orders/list.tsx}}` | {{Observed}} | {{FND-002}} | {{filled in by /design: SCR-003, or "Dropped: reason"}} |
| CUR-ENT-{{001}} | {{Order}} | `data.md` | `{{db/migrations/003_orders.sql}}` | {{Observed}} | {{FND-004}} | {{}} |
| CUR-API-{{001}} | {{List orders}} | `interfaces.md` | `{{src/api/orders.controller.ts:40}}` | {{Inferred from code}} | {{}} | {{}} |
| CUR-JOB-{{001}} | {{Nightly invoice run}} | `interfaces.md` | `{{src/jobs/invoices.ts}}` | {{Inferred from code}} | {{}} | {{}} |
| CUR-RUL-{{001}} | {{Discount for orders over 100}} | `rules.md` | `{{src/orders/pricing.ts:88}}` | {{Conflicting}} | {{FND-001}} | {{}} |

## Findings

Suspected bugs and contradictions are described with their evidence and not decided here: whether the code or the expectation is wrong is the user's call, made in /kickoff (when it changes a requirement) or in /design (when it concerns one element).

| ID | Kind | What | Where | Evidence | Affects | Resolution |
|---|---|---|---|---|---|---|
| FND-{{001}} | {{Suspected bug / Contradiction / Does not run / Dead code / Dirty data / Hidden behavior / Security}} | {{e.g. "the screen says the discount starts at 100, the code applies it from 99.99"}} | `{{file:line}}` | {{e.g. "the order of 99.99 in the test data got the discount"}} | {{CUR-RUL-001, REQ-004}} | {{filled in later: decision, date, where it was decided}} |

Kinds:

- Suspected bug: the behavior looks wrong for the business.
- Contradiction: two places implement the same thing differently (e.g. frontend allows 200 characters, the column holds 100).
- Does not run: a part fails to build, start or respond; say how it failed.
- Dead code: unreachable or unused, e.g. a page no menu leads to.
- Dirty data: data that breaks the rules the code assumes (empty required values, unknown status codes, orphaned rows).
- Hidden behavior: something no screen shows but users depend on, e.g. a hard-coded customer list or a job that silently fixes data.
- Security: e.g. a missing permission check. Tell the user right away as well.
