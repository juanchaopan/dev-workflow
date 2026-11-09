# Design completeness checklist

Step 6 of /design checks against this list. For each problem say where it is, why it is a problem and how to fix it.

## Coverage

- Every "Active" requirement in scope maps to at least one design element.
- Every design element traces back to a requirement. One that does not either reveals a missing requirement (add it) or extra work (remove it).
- Every acceptance criterion has a matching behavior in some screen action, interface or logic item.

## Screens

- Every input field has a type, required flag, length or range, validation rules and error messages.
- Drop-downs, radio buttons and checkboxes list every option or say where the options come from.
- Every button says its preconditions and what happens on success and on failure.
- Double clicks and resubmission on a slow network are handled.
- Lists: empty data, lots of data (paging or infinite scroll), sorting, filtering, a search with no results.
- Long text, large numbers and long words without spaces do not break the layout.
- What the user sees without permission, with an expired session, or when the data was deleted or changed by someone else.
- Whether leaving a screen with unsaved input asks for confirmation.
- Every screen in the screen flow has an entry, and no screen is a dead end.
- When the requirements call for phones or narrow windows, there are prototypes at that size.
- Screenshots match the field definitions: fields, order, text and required markers agree.

## Data

- Required on a screen ↔ non-null column; length, type and range agree.
- Every entity is created somewhere and read somewhere; those that need it can be changed and deleted through a screen or interface.
- Deletion is defined, including whether data referenced elsewhere can be deleted and what happens to the references.
- Anything the requirements say "must not repeat" has a unique constraint.
- Retention, export and deletion of personal data meet compliance requirements.
- Amounts use fixed-point types, not floating point; times state their time zone.
- Large tables have indexes for the conditions queried often.

## Interfaces

- Every screen action that reads or writes data has an interface.
- Every interface states its permissions and each error.
- Write operations state whether they are idempotent; retries and resubmissions cannot create duplicates.
- Interface validation matches the screens; validation on screens never replaces validation in interfaces.
- What the user sees, and how data is repaired, when an external system times out, fails or returns unexpected data.
- Scheduled jobs give correct results when run twice or rerun after failing halfway.

## Permissions

- Every action can be performed by at least one role.
- "Own data only" is enforced in the interface by checking ownership, not only by hiding buttons.
- Administrative actions are logged (who, when, what changed).

## Logic

- State machines: every state except final ones has a way out; invalid transitions are handled; concurrent edits of the same record are handled.
- Decision tables: all combinations of conditions are covered, and no two rows have the same conditions with different results.
- Calculations: precision and rounding, zero, negative numbers, upper limits and empty values, each with an example.
