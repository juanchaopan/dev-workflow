# Data definitions

- Status: {{AI draft, awaiting confirmation / Confirmed (YYYY-MM-DD)}}
- Storage: {{as chosen in the ADRs, e.g. PostgreSQL; "None" without a database, then only the "Files, configuration and messages" section}}

## Entity relationships

```mermaid
erDiagram
  {{CUSTOMER}} ||--o{ {{ORDER}} : {{places}}
```

## Common conventions

| Item | Convention |
|---|---|
| Primary keys | {{e.g. bigint identity / UUID v7}} |
| Audit columns | {{e.g. created_at and updated_at on every table; created_by and updated_by where the actor must be traceable}} |
| Deletion | {{e.g. soft delete (deleted_at) by default; personal data hard-deleted as the requirements say}} |
| Naming | {{e.g. plural table names, snake_case columns}} |
| Time | {{e.g. stored in UTC, shown in the user's time zone}} |
| Amounts | {{e.g. numeric(12,2), never floating point}} |

## ENT-{{001}} {{entity name}} (`{{table}}`)

- Requirements: {{REQ-xxx}}
- Description: {{what this entity represents}}
- Deletion: {{hard / soft; whether it can be deleted while referenced}}
- Data volume: {{e.g. 10,000 rows now, 500 more per month}}

| Column | Type | Nullable | Default | Constraints | Description |
|---|---|---|---|---|---|
| {{id}} | {{bigint}} | no | {{identity}} | primary key | |
| {{customer_name}} | {{varchar(100)}} | no | | | {{SCR-002 field 1}} |
| {{amount}} | {{numeric(12,2)}} | no | | {{greater than 0}} | |
| {{status}} | {{varchar(20)}} | no | {{'draft'}} | {{values in LGC-001}} | |

Indexes:

- `{{index name}}`: `{{columns}}`, {{unique / non-unique}}, {{for which query}}

### From the current system

Only for an entity whose data comes from the current system (CUR-ENT-xxx in `as-is/data.md`). Every old column holding data appears once.

| Old table.column | New column | Conversion | Dirty data and its handling |
|---|---|---|---|
| {{orders.status}} | {{status}} | {{0 → 'draft', 1 → 'submitted', 2 → 'paid', 3 → 'cancelled'}} | {{412 rows with 9: become 'cancelled' (FND-004, confirmed YYYY-MM-DD)}} |
| {{orders.customer_name}} | {{customer_name}} | {{trimmed}} | {{3% empty: filled from the customer record}} |
| {{orders.legacy_flag}} | {{none}} | {{archived to the export file}} | {{}} |

## Files, configuration and messages

Write this section for systems without a database, or when files, configuration or messages are read or written besides the database. One subsection each:

### {{file or message name}}

- Format: {{JSON / YAML / CSV / binary}}
- Location or topic: {{}}
- Written by, read by: {{}}

| Field | Type | Required | Default | Description | Example |
|---|---|---|---|---|---|
| {{}} | {{}} | {{}} | {{}} | {{}} | {{}} |
