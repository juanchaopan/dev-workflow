# Design index

{{One sentence: which requirements this design covers, e.g. "every requirement of the first version (MVP)" or "the redesign of the orders and billing areas of the current system".}}

This index is also the progress tracker: /design updates a status as each element moves on, and when interrupted, running /design again continues with the first unconfirmed element.

Statuses:

- Not started, In progress: still being designed.
- Confirmed (YYYY-MM-DD): confirmed by the user, element by element.
- AI draft, awaiting confirmation: finished by AI but not yet reviewed; the user must confirm it before development.
- Deprecated: the ID is kept and no longer used.

For an existing system, "Based on" names the elements of the current system (`as-is/`, CUR-xxx) each element was redesigned from; "None" for something new.

## Design elements

| ID | Name | File | Requirements | Based on | Status |
|---|---|---|---|---|---|
| SCR-{{001}} | {{Order list}} | `screens/SCR-{{001}}-{{order-list}}.md` | {{REQ-001}} | {{CUR-SCR-001 / None}} | {{Confirmed (YYYY-MM-DD)}} |
| ENT-{{001}} | {{Order}} | `data.md` | {{REQ-001, REQ-002}} | {{CUR-ENT-001}} | {{Not started}} |
| API-{{001}} | {{List orders}} | `interfaces.md` | {{REQ-001}} | {{CUR-API-001}} | {{Not started}} |
| JOB-{{001}} | {{}} | `interfaces.md` | {{}} | {{}} | {{Not started}} |
| LGC-{{001}} | {{Order status}} | `logic/LGC-{{001}}-{{order-status}}.md` | {{REQ-003}} | {{CUR-RUL-003}} | {{Not started}} |

## Screen flow

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

## Completeness check results

{{Date of the check; problems found and how they were resolved. "None" when there were none.}}
