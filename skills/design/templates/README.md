# Design index

- Last changed: {{kickoff / architect / design / #issue number (YYYY-MM-DD)}}

{{One sentence: the stage or issue this design covers, e.g. "the foundation module of the first stage" or "issue #12: order discounts".}}

Elements of this scope are designed in detail. Elements of other modules are listed with one line each and designed when their stage comes. Confirmed elements outside the scope are read-only references.

Statuses:

- Not started, In progress: still being designed.
- AI draft, awaiting confirmation: written by AI but not yet reviewed; the user must confirm it before development.
- Confirmed: confirmed by the user.
- Later stage: an element of another module, designed when its stage comes.

For an existing system, "Based on" names the elements of the current system (`as-is/`, CUR-xxx) each element was designed from; "None" for something without a current counterpart.

## Design elements

| ID | Name | File | Requirements | Based on | Status | Last changed |
|---|---|---|---|---|---|---|
| SCR-{{001}} | {{Order list}} | `screens/SCR-{{001}}-{{order-list}}.md` | {{REQ-001}} | {{CUR-SCR-001 / None}} | {{Confirmed}} | {{design (YYYY-MM-DD)}} |
| ENT-{{001}} | {{Order}} | `data.md` | {{REQ-001, REQ-002}} | {{CUR-ENT-001}} | {{Not started}} | {{}} |
| API-{{001}} | {{List orders}} | `interfaces.md` | {{REQ-001}} | {{CUR-API-001}} | {{Not started}} | {{}} |
| JOB-{{001}} | {{}} | `interfaces.md` | {{}} | {{}} | {{Not started}} | {{}} |
| LGC-{{001}} | {{Order status}} | `logic/LGC-{{001}}-{{order-status}}.md` | {{REQ-003}} | {{CUR-RUL-003}} | {{Not started}} | {{}} |
| SCR-{{010}} | {{Customer report}} | — | {{REQ-020}} | — | {{Later stage: reporting}} | — |

## Screen flow

Screens of this scope. Screens of other modules are added when their stage comes.

```mermaid
flowchart LR
  {{SCR001}}["SCR-001 Order list"] -->|"New"| {{SCR002}}["SCR-002 New order"]
  {{SCR002}} -->|saved, cancelled| {{SCR001}}
```

## Common rules

| Item | Rule |
|---|---|
| Dates and times | {{e.g. 2026-03-05 14:30, shown in the user's time zone}} |
| Amounts and numbers | {{e.g. thousands separators, two decimals for amounts, right-aligned}} |
| Required marker | {{e.g. a red * after the label}} |
| When validation runs | {{e.g. a field on leaving it, all fields on submit}} |
| Error messages | {{e.g. below the field; on a failed submit also a summary above the form}} |
| Empty data, loading, errors | {{}} |
| Pagination | {{e.g. 20 rows per page, page numbers below the list}} |
| Text length | {{e.g. counted in characters}} |
| Duplicate submission | {{e.g. the button is disabled after submitting until the result arrives}} |

## Permission matrix

| Screen or action | {{role A}} | {{role B}} |
|---|---|---|
| {{SCR-001 Order list: view}} | {{all}} | {{own data only}} |
| {{SCR-002 New order: save}} | {{allowed}} | {{not allowed}} |

## Requirement coverage

| Requirement | Design elements |
|---|---|
| {{REQ-001}} | {{SCR-001, API-001, ENT-001}} |

## CRUD matrix

| Screen or interface | ENT-{{001}} {{Order}} | ENT-{{002}} {{Customer}} |
|---|---|---|
| {{SCR-001 / API-001}} | {{R}} | {{R}} |
| {{SCR-002 / API-002}} | {{C}} | {{R}} |

## Current system

Only for an existing system. Counts for the scope of this design; the details are in each element's "From the current system" section and in `as-is/README.md`.

| Item | Count |
|---|---|
| Old elements used / dropped | {{e.g. 34 / 5}} |
| Old rules kept / changed / dropped | {{e.g. 61 / 9 / 4}} |
| Findings resolved / still open | {{e.g. 22 / 0}} |
| Old columns holding data mapped / archived / dropped | {{e.g. 140 / 6 / 3}} |

## Completeness check

{{Date of the last check; the problems still open, or "None".}}
