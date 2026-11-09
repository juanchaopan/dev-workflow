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

## Files, configuration and messages

Write this section for systems without a database, or when files, configuration or messages are read or written besides the database. One subsection each:

### {{file or message name}}

- Format: {{JSON / YAML / CSV / binary}}
- Location or topic: {{}}
- Written by, read by: {{}}

| Field | Type | Required | Default | Description | Example |
|---|---|---|---|---|---|
| {{}} | {{}} | {{}} | {{}} | {{}} | {{}} |
