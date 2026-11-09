# SCR-{{001}} {{screen name}}

- Status: {{In progress / AI draft, awaiting confirmation / Confirmed (YYYY-MM-DD) / Deprecated}}
- Requirements: {{REQ-xxx}}
- Based on: {{CUR-SCR-xxx in `../as-is/screens/`; "None" for a new screen}}
- Prototypes and screenshots (`.html` and `.png` of the same name):
  - `SCR-{{001}}-{{name}}`: normal
  - `SCR-{{001}}-{{name}}--error`: validation errors
  - `SCR-{{001}}-{{name}}--{{state}}`: {{other state}}
  - {{For a screen kept exactly as it is: "No prototype: the current screenshot `../as-is/screens/CUR-SCR-xxx-<name>.png` is the reference"}}

## Purpose

{{Who uses this screen, when, and to get what done.}}

## Entry and exits

- Comes from: {{which button or menu on SCR-xxx; direct URL}}
- Goes to: {{which screen after success, cancel and error}}
- URL: {{e.g. /orders/:id; "None" without routing}}

## Layout

{{By area: what goes where, top to bottom and left to right. Skip what the screenshots already show; write only what they cannot: which areas are fixed and which scroll, how it rearranges in narrow windows, which areas only some roles see.}}

## Field definitions

| # | Field | Kind | Type | Required | Length or range | Default | Validation | Error message | Data source |
|---|---|---|---|---|---|---|---|---|---|
| 1 | {{Customer name}} | {{input}} | {{text}} | {{yes}} | {{1 to 100 characters}} | {{empty}} | {{not blank after trimming}} | {{Enter the customer name}} | {{ENT-002.customer_name}} |
| 2 | {{Amount}} | {{input}} | {{amount}} | {{yes}} | {{0.01 to 9,999,999.99}} | {{empty}} | {{greater than 0, at most two decimals}} | {{The amount must be greater than 0 / At most two decimals}} | {{ENT-002.amount}} |
| 3 | {{Status}} | {{display}} | {{text}} | — | — | — | — | — | {{status in the API-003 response; display names in LGC-001}} |
| 4 | {{Save}} | {{button}} | — | — | — | — | — | — | {{see "Actions and events"}} |

- Kind: input, display, button, link.
- Type: text, multi-line text, number, amount, date, time, radio, checkbox, drop-down, switch, file, image, etc.
- Drop-downs, radio buttons and checkboxes: list every option and the default, or where the options come from (e.g. "warehouses returned by API-005, sorted by name").
- With several validation rules, give the order they are checked in and which message shows when several fail.

## Actions and events

| Action | Precondition | Processing | On success | On failure |
|---|---|---|---|---|
| {{Click "Save"}} | {{all inputs valid; the button cannot be clicked again while saving}} | {{call API-002}} | {{show "Order saved", back to SCR-001}} | {{show the error above the form; keep the input}} |
| {{Click "Cancel"}} | {{there are unsaved changes}} | {{ask "Discard changes?"}} | {{back to SCR-001}} | — |

## States

| State | When it appears | What is shown | Prototype |
|---|---|---|---|
| Normal | {{}} | {{}} | `SCR-{{001}}-{{name}}.html` |
| Validation errors | {{some field fails its rules on submit}} | {{invalid fields in red with the message below, "N fields need attention" above the form}} | `SCR-{{001}}-{{name}}--error.html` |
| {{Empty / Loading / No permission / Save failed}} | {{}} | {{}} | {{}} |

## Permission differences

{{What different roles see and can do differently; "None" when there is no difference.}}

## From the current system

Only for a screen based on the current system. Every old field rule, business rule and finding touching this screen, with the user's decision.

What changes from the old screen: {{e.g. "same fields, new layout and controls; the old popup editor becomes an inline form"}}

| Old rule or finding | Old behavior | Decision | New behavior | Decided |
|---|---|---|---|---|
| {{CUR-SCR-001 field 1}} | {{required on screen only, 200 characters; column 100}} | {{Change}} | {{required everywhere, at most 100 (field 1)}} | {{FND-003, YYYY-MM-DD}} |
| {{CUR-RUL-002}} | {{10 off orders of 100 or more}} | {{Keep}} | {{same; LGC-002}} | {{YYYY-MM-DD}} |
| {{CUR-RUL-006}} | {{customer 1042 never pays shipping}} | {{Drop}} | {{reason: the contract ended in 2024}} | {{YYYY-MM-DD}} |

## User confirmation log

| Date | User comment or question | Handling |
|---|---|---|
| {{YYYY-MM-DD}} | {{e.g. "Move the save button to the bottom right"}} | {{changed and rendered again}} |
