# Current data

- Storage: {{e.g. MySQL 5.7; files under /var/app/data; none}}
- Sources: {{e.g. the migration scripts in db/migrations/, the ORM models in src/models/, a copy of the database taken on YYYY-MM-DD}}
- Data profiling: {{"done on a copy, aggregates only" / "not done: no copy available"}}

What the data actually contains decides what a migration must handle, whatever the new design looks like. Profiling records aggregates only (counts, rates, distinct values); never copy personal data into these documents.

## Entity relationships

```mermaid
erDiagram
  {{CUSTOMERS}} ||--o{ {{ORDERS}} : {{customer_id}}
```

Relationships the code relies on but the database does not enforce (no foreign key) are marked in the description of the column.

## CUR-ENT-{{001}} {{entity}} (`{{table}}`)

- Defined in: `{{migration, DDL or model file}}`
- Rows: {{count, growth if known}}
- Read and written by: {{CUR-SCR-xxx, CUR-API-xxx, CUR-JOB-xxx}}
- Trust: {{Observed / Inferred from code}}

| Column | Type | Nullable | Default | Constraints | Meaning (as the code uses it) | Actual data | Findings |
|---|---|---|---|---|---|---|---|
| {{status}} | {{int}} | {{no}} | {{0}} | {{none}} | {{0 draft, 1 submitted, 2 paid, 3 cancelled}} | {{values 0–3 and 9 (412 rows)}} | {{FND-004}} |
| {{customer_name}} | {{varchar(100)}} | {{yes}} | | | {{shown on CUR-SCR-001}} | {{3% empty}} | {{FND-003}} |

## Files, configuration and messages

Files, configuration and messages the system reads or writes besides the database, with their format, location, fields and an example; who else reads them (other systems depend on them too).
