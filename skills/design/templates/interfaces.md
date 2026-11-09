# Interface definitions

- Status: {{AI draft, awaiting confirmation / Confirmed (YYYY-MM-DD)}}

Write only the parts this system has; delete the other sections.

## Common conventions

| Item | Convention |
|---|---|
| Paths and versions | {{e.g. /api/v1/...}} |
| Authentication | {{e.g. session cookie after sign-in / Bearer token}} |
| Error response format | {{e.g. `{"code": "ORDER_NOT_FOUND", "message": "...", "fields": {"amount": "The amount must be greater than 0"}}`}} |
| Pagination | {{e.g. page and size parameters, total in the response}} |
| Time format | {{e.g. ISO 8601 with time zone}} |

## HTTP API

### API-{{001}} {{name}}

- Requirements: {{REQ-xxx}}; called by: {{SCR-xxx}}
- `{{POST}} {{/api/v1/orders}}`
- Permissions: {{which roles; for own data only, how ownership is checked}}
- Idempotent: {{yes / no; if no, how duplicate submissions are prevented}}

Request:

| Field | Location | Type | Required | Validation | Description |
|---|---|---|---|---|---|
| {{customerName}} | {{body}} | {{string}} | {{yes}} | {{1 to 100 characters}} | {{ENT-002.customer_name}} |

Success: `{{201}}`

| Field | Type | Description |
|---|---|---|
| {{id}} | {{number}} | {{}} |

Errors:

| Status | Error code | When | What the caller does |
|---|---|---|---|
| 400 | {{VALIDATION_FAILED}} | {{a field fails validation}} | {{show the messages in fields under the matching inputs}} |
| 403 | {{FORBIDDEN}} | {{no permission}} | {{}} |

## Command line

### API-{{001}} `{{command}}`

- Requirements: {{REQ-xxx}}
- Usage: `{{tool}} {{command}} [options] <arguments>`

| Argument or option | Required | Default | Validation | Description |
|---|---|---|---|---|
| {{}} | {{}} | {{}} | {{}} | {{}} |

Output: {{what goes to standard output and in which format (text / JSON); what goes to standard error}}

| Exit code | When |
|---|---|
| 0 | {{success}} |
| {{1}} | {{}} |

## Public library API

### API-{{001}} `{{function or type}}`

- Requirements: {{REQ-xxx}}
- Signature: `{{}}`
- Parameters and return value: {{constraints on each parameter; what is returned}}
- Errors: {{which errors are thrown or returned, and when}}

## Scheduled and batch jobs

| ID | Name | Trigger | Input | Output | On failure | Running twice |
|---|---|---|---|---|---|---|
| JOB-{{001}} | {{}} | {{e.g. daily at 02:00 UTC}} | {{}} | {{}} | {{e.g. alert, rerun automatically the next day}} | {{e.g. deduplicated by date, a rerun processes nothing twice}} |

## External integrations

| Party | Purpose | Timeout | Retries | When it fails or slows down |
|---|---|---|---|---|
| {{}} | {{}} | {{}} | {{}} | {{what the user sees, how data is repaired}} |
