---
name: design
description: Detailed design that code and tests can be written from: screen list and flow; each screen's layout, fields (type, required, length, default, validation, error message), actions and states; data definitions (tables and columns, or file, configuration and message formats); interfaces (HTTP API, command line, library API, scheduled jobs); permissions; complex logic (state machines, decision tables, calculations), chosen by system type. Each screen becomes an HTML prototype rendered to images and confirmed with the user one at a time; progress is committed per element, so the conversation can be compacted at any time and resumes where it stopped. Ends with a completeness check (requirement coverage, CRUD and permission matrices) in docs/design/. Use after /architect, before /scaffold or /roadmap; /change uses it when screens, data, interfaces or logic change. Use for "design the screens", "detailed design", "settle the fields" or "continue the design".
---

# Design

The requirements (`docs/product/`) say what the system must do; the architecture (`docs/architecture/`, `docs/adr/`) says which technologies and which components. This step details every feature until nothing is left to guess during development: what each screen looks like, the rules of each input, the columns of each table, the errors each interface returns. /roadmap splits issues from it and /implement writes code and tests from it.

Your role is an experienced system designer: think every detail through for the user, but let the user confirm every screen and every rule.

## How far the design goes

| Settle now | Do not write in advance |
|---|---|
| Everything the user can see or notice: screens, fields, validation, messages, outcomes of actions; data structures and constraints; external interfaces; permissions; complex business logic | How code is split into classes and functions. /implement decides that within the standards in `.claude/rules/` and the architecture checks; fixing it in advance only makes documents and code drift apart |

Complex business logic means objects with several states and transitions (state machines), rules with many combinations of conditions (decision tables), formulas (amounts, points, deadlines) and algorithms. They are part of the requirements and expensive to guess wrong, so they belong in the design.

What to write depends on the system type:

| System type | Parts to write |
|---|---|
| With a UI (web, desktop, mobile) | Screens, data, interfaces (the API between frontend and backend), permissions, logic |
| Backend service, API | Interfaces, data, permissions, logic |
| Command-line tool | Interfaces (commands, arguments, output, exit codes), data (format of files and configuration it reads and writes), logic |
| Library, SDK | Interfaces (public types, functions and errors), logic |
| Batch and scheduled jobs | Interfaces (triggers, inputs and outputs), data, logic, failures and reruns |

For a system without a database, "data" covers the structure of the files, configuration, messages and caches it reads and writes; if it stores nothing, write "None".

IDs: screens SCR-001, data entities ENT-001, interfaces API-001, scheduled and batch jobs JOB-001, complex logic LGC-001. IDs are never reused; removed elements are marked "Deprecated" in the index.

## Progress lives in files, not in the conversation

A design often has dozens of screens and the conversation gets long. So:

- **The index is the progress tracker**: step 1 writes the element index in `docs/design/README.md` right away, one row per element, starting at "Not started"; update a row as each element moves on.
- **Design one, save one, commit one**: as soon as an element is written and the user confirms it, set its status to "Confirmed (YYYY-MM-DD)" and commit (`docs(design): confirm SCR-xxx <name>`). The user's comments and questions go straight into the definition file's "User confirmation log", not just the conversation.
- **Interrupt at any time**: the user can compact the conversation (`/compact`) or close the session at any time. After each confirmed screen, tell the user once: "Progress is saved; you can compact the conversation now."
- **Read only what you need**: for one element, read the index, the common rules, `tokens.css`, the element's requirements and the elements directly related to it (e.g. the interfaces and entities a screen uses). Do not reread other confirmed screens.
- **Keep screenshots out of the main conversation**: images take a lot of context. After rendering, hand the visual self-check to a subagent (Agent tool) and bring back only the problems it finds, as text; read the images yourself with Read only when no subagent is available. The user looks at the images in the system image viewer, outside the conversation.

## How to ask

Ask with AskUserQuestion, in the user's language: 2 to 4 questions per round, 2 to 4 concrete options each, the recommended one first with "(Recommended)" appended to its label, and a description that says what each option means. The questions here are concrete design trade-offs, e.g. "Is the phone number required or optional?", "Is deleting an order a hard delete or a flag?", "Does the list show 20 or 50 rows per page by default?".

- Do not ask what the requirements already settle. For what they leave open but development needs, recommend the most common approach.
- When the user says "you decide" or "either is fine", take the recommended option and mark the item "AI suggestion, user default" in the design.
- When the design exposes a hole or contradiction in the requirements, ask first and update `docs/product/requirements.md` along with it.
- What needs a trial before it can be decided (e.g. whether users will understand an interaction, whether a third-party API is good enough) is recorded with a suggestion to verify it with /spike.

## Steps

### 0. Read, set the scope, find where to resume

Read `docs/product/`, `docs/architecture/overview.md` and `docs/adr/`. Without requirement documents, tell the user to run /kickoff first; without architecture documents, /architect.

When `docs/design/README.md` already exists, look at the statuses in the index first: if elements are "Not started", "In progress" or "AI draft, awaiting confirmation", tell the user how many are done and how many remain, and continue with the first unconfirmed element (jump to its step).

Scope:

- New project: design the first version (every MVP requirement in `vision.md`). "Later" requirements are designed through /change when their time comes.
- Called by /change: design only the parts the change touches; changed screens are confirmed with the user again.
- Existing code without design documents: first document the current state of the screens, tables and interfaces this change touches from the code (status "Implemented, documented from code"), then change that.

Write the design documents in the project's document language: the `Language` line in the project's CLAUDE.md when there is one, otherwise the language the user talks to you in.

### 1. The big picture

Settle the whole first, then each part:

1. **Element index**: list the screens, data entities, interfaces, scheduled jobs and complex logic the system type calls for, one sentence each, with their REQs.
2. **Screen flow** (with a UI): a Mermaid flowchart of how screens lead to each other, where they are entered, and where success and cancel lead.
3. **Common rules**: conventions every screen and interface follows: display formats for dates, times, amounts and numbers; how required fields are marked; when validation runs (while typing, on leaving a field, on submit); where error messages appear; what empty data, loading and errors look like; pagination; time zones; whether text length counts characters or bytes. Confirm the key ones in one round of AskUserQuestion.
4. Show the index, the flow and the common rules to the user and confirm nothing is missing. Then write `docs/design/README.md` from `templates/README.md` (every element "Not started"), commit, and move on.

### 2. Screens: confirm one at a time

Settle the style first: copy `templates/tokens.css` to `docs/design/screens/tokens.css`, adjust the token values to design files or brand guidelines when there are any, otherwise keep the defaults. Every prototype uses this file; later the project's design tokens are built from the same values.

Then, following the main flow of the screen flow, one screen at a time:

1. **Write the screen definition**: set its status to "In progress" in the index. Write `docs/design/screens/SCR-xxx-<short-name>.md` from `templates/screen.md`: purpose, entry and exits, layout, field definitions (type, required, length or range, default, validation rules, error message and data source of every displayed and input field), actions and events (which interface is called, what happens on success and failure), states, permission differences.
2. **Write the prototypes**: one HTML file per state from `templates/screen.html`, named like the definition file with a suffix for the state: `SCR-001-login.html` (normal), `SCR-001-login--error.html` (validation errors), `SCR-001-login--empty.html` (empty data), `SCR-001-login--loading.html` (loading). Draw at least the normal and validation-error states; add empty data for lists; when roles see different content, draw one per role. Prototypes are for people to look at: plain HTML and CSS using `tokens.css`, no frameworks, no scripts. Use realistic sample data (real-looking names, addresses and amounts, text of different lengths), not placeholders like "test1" or "xxx". For mobile screens set the screenshot size to `390x844`.
3. **Render and self-check**: run `node <this skill's directory>/render-screens.mjs docs/design/screens/SCR-xxx-*.html`. The script renders each HTML file to a PNG of the same name with Playwright's bundled Chromium (free; downloaded on first run). Then hand the check to a subagent with the Agent tool: give it the definition file and the PNG paths, have it look at the images and compare them with the definition for misalignment, overflowing text, garbled characters, missing or misordered fields and text that differs from the definition, and report a list of problems as text only. Fix problems and render again until none are left.
4. **Ask the user to confirm**: run `node <this skill's directory>/render-screens.mjs --open <the HTML files of these PNGs>` to open the screenshots in the system image viewer (no new download; a few seconds). In your message say which screen this is (n of total); the full path of each image and its state; the key points (a summary of the field definitions, the requirements covered, the decisions you made for the user). Then ask with AskUserQuestion, with the options "Confirm this screen" and "Skip for now, review later", and say in the question that comments or questions go straight into "Other".
   - The user comments: change the definition and prototypes, render, self-check and open again, and ask again.
   - The user asks a question: answer it first, and change what needs changing.
   - Record every comment and how it was handled in the definition file's "User confirmation log" right away.
5. **Save progress**: once the user confirms, set the status in the definition file and in the index to "Confirmed (YYYY-MM-DD)", commit the screen's definition, prototypes and screenshots (`docs(design): confirm SCR-xxx <name>`), tell the user "Progress is saved; you can compact the conversation now", then go to the next screen. For "Skip for now", set the status to "AI draft, awaiting confirmation" and commit the same way.

When the user says "do the rest as you see fit", finish the remaining screens as usual, render and self-check them, set their status to "AI draft, awaiting confirmation" and list them in step 8. The user must confirm these screens before they are developed.

### 3. Data

Write `docs/design/data.md` from `templates/data.md`:

- An entity relationship diagram (Mermaid `erDiagram`) and common conventions (primary keys, audit columns, deletion, naming, time zones).
- One section per entity: column, type, nullability, default, constraints (unique, foreign key, check), description; indexes; deletion; expected data volume. Types follow the database chosen in the architecture.
- Consistent with the screens: a field required on a screen is a non-null column; a field limited to 50 characters has a column at least 50 long.
- Without a database, write the structure of files, configuration and messages (field, type, required, default, example).

Show entities to the user as tables, one to three at a time; ask about trade-offs with AskUserQuestion. After each confirmed group, update the index and commit.

### 4. Interfaces

Write `docs/design/interfaces.md` from `templates/interfaces.md`, only the parts this system has:

- **HTTP API**: method and path, permissions, request parameters (type, required and validation of each field), the success response, status code and error code of each error, idempotency, pagination and sorting.
- **Command line**: commands, arguments and options, output format, exit codes.
- **Public library API**: type and function signatures, errors thrown.
- **Scheduled and batch jobs**: when they run, inputs, outputs, how to rerun after a failure, whether running twice is safe.
- **External integrations**: whom it calls and for what, timeouts, retries, what happens when the other side fails.

Interface validation matches the screens (validation on screens never replaces validation in interfaces). Confirm with the user by feature; after each confirmed group, update the index and commit.

### 5. Permissions and complex logic

- **Permission matrix**: role × screen or action, each cell "allowed / not allowed / own data only", written into `docs/design/README.md`.
- **Complex logic**: one file per item, `docs/design/logic/LGC-xxx-<short-name>.md` from `templates/logic.md`. State transitions as a Mermaid `stateDiagram-v2` plus the actions allowed in each state; combinations of conditions as a decision table where each row is a test case; formulas with precision, rounding and boundaries. Confirm with concrete examples, e.g. "An order of 99.50 with a coupon for 10 off orders of 100 or more: no discount, 99.50 to pay". After each confirmed item, update the index and commit.

### 6. Completeness check

Check the whole design against `references/design-checklist.md`. With many elements, hand the check to subagents in batches (screens, data, interfaces), each reporting only a list of problems, so the full definitions never enter the main conversation. The check covers:

- **Requirement coverage**: every "Active" requirement in scope maps to at least one design element, and every design element traces back to a requirement.
- **CRUD matrix**: data entity × screen or interface, each cell C, R, U or D. Look for gaps such as "can be created but never deleted", "a field nothing can change" or "unclear where the data comes from".
- **Permissions**: actions no role can perform; actions a role can perform but should not.
- **Three-way consistency**: screen fields, interface fields and data columns agree on type, required and length.

Give a suggestion for each problem, ask with AskUserQuestion where the user must decide, and check again after fixing.

### 7. Complete the index and commit

Complete `docs/design/README.md` from `templates/README.md`: element index (ID, name, file, requirements, status), screen flow, common rules, permission matrix, requirement coverage, CRUD matrix, completeness check results. Commit with `docs(design): <content>`. Commit to the current branch while the repository has no branch protection; with protection, make every design commit on one `docs/` branch and merge it with /open-pr at the end.

### 8. Report and next step

Report how many screens, entities, interfaces and logic items were designed, how many the user confirmed, which problems the completeness check found and fixed, and what is still "AI draft, awaiting confirmation".

- New project: run /scaffold to create the project, then /roadmap.
- Project already scaffolded, modernization, called by /change: run /roadmap (or return to /change) to split issues.
- Screens still "AI draft, awaiting confirmation": remind the user that their issues cannot start before the screens are confirmed; running /design again resumes with these screens.

## After the design changes

The design is what development follows, so keep it as accurate as the code:

- When a requirement change touches screens, fields, data, interfaces or logic, /change calls this skill to change the design first; changed screens are rendered again and confirmed with the user before issues are split.
- When development finds a problem in the design, stop, change the design and have the user confirm it; do not change only the code.
- When a set of classes and interfaces must be redesigned (/change rates it D2), that code structure redesign lives in `docs/design/refactor/`; /change writes it, not this skill.
