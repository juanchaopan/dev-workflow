---
name: design
description: Detailed design that code and tests can be written from: screen list and flow; each screen's layout, fields (type, required, length, default, validation, error message), actions and states; data (tables and columns, or file and message formats); interfaces (HTTP, command line, library, jobs); permissions; complex logic (state machines, decision tables, calculations). Each screen becomes an HTML prototype rendered to images and confirmed with the user one at a time. For an existing system, redesigns from /onboard's evidence: each screen beside its real screenshot, every old rule and finding kept, changed or dropped by the user, data migration mapped. Progress is committed per element, so the conversation can be compacted at any time; ends with a completeness check. Use after /architect, before /scaffold or /roadmap; /change uses it when screens, data, interfaces or logic change. Use for "design the screens", "detailed design", "settle the fields", "redesign the old screens" or "continue the design".
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

## An existing system: redesign from the evidence

When `docs/design/as-is/` exists, /onboard has gathered evidence of what the old system does: screens with real screenshots where it ran, fields with their validation on screen, server and database, the actual data, interfaces and their callers, business rules (CUR-RUL) and findings (FND: suspected bugs, contradictions, dirty data). The evidence is not trusted as correct, and the old screens, controls or style may be redone entirely. So the target design is written in `docs/design/` as for a new system, and the evidence is used like this:

- **Nothing old is carried over silently.** Every old field rule, business rule and finding touching an element in scope gets an explicit decision from the user: **keep** (same behavior), **change** (say into what) or **drop** (say why). A hidden rule nobody decided on is how a rewrite loses features. Record the decisions in the element's "From the current system" section.
- **Findings are settled where they belong.** A suspected bug or contradiction is asked as a concrete question with its evidence, e.g. "The screen allows 200 characters, the database column holds 100 and 3% of names are empty: required, at most 100?". Write the outcome into the "Resolution" column of the finding in `docs/design/as-is/README.md`.
- **The old screen is the starting point, not the answer.** Show its real screenshot next to the new prototype so the user sees what changes. When the user wants a screen exactly as it is (typical when maintaining), its current screenshot becomes the reference and no prototype is drawn; with any visible change, draw prototypes as usual.
- **Data must arrive.** The new data design maps every old table and column that holds data: where it goes, how it is converted, what happens to dirty data. Data design is constrained by what the old data actually contains.
- **External callers constrain interfaces.** For an old interface that other systems call, the user decides: stay compatible, version it, or change it together with the callers by an agreed date.
- **Everything is accounted for.** Every old element in scope ends up "Used by" a new element or "Dropped: reason" in the index of `docs/design/as-is/README.md`. Files under `as-is/` are otherwise left as they are; they record what was.

When the project has existing code but no `docs/design/as-is/` (e.g. /change on an undocumented area), first gather the evidence for the area in scope as in step 4 of the onboard skill (the onboard directory next to this skill), then design from it.

## Progress lives in files, not in the conversation

A design often has dozens of screens and the conversation gets long. So:

- **The index is the progress tracker**: step 1 writes the element index in `docs/design/README.md` right away, one row per element, starting at "Not started"; update a row as each element moves on.
- **Design one, save one, commit one**: as soon as an element is written and the user confirms it, set its status to "Confirmed (YYYY-MM-DD)" and commit (`docs(design): confirm SCR-xxx <name>`). The user's comments and questions go straight into the definition file's "User confirmation log", not just the conversation.
- **Interrupt at any time**: the user can compact the conversation (`/compact`) or close the session at any time. After each confirmed screen, tell the user once: "Progress is saved; you can compact the conversation now."
- **Read only what you need**: for one element, read the index, the common rules, `tokens.css`, the element's requirements, the elements directly related to it (e.g. the interfaces and entities a screen uses) and, for an existing system, the old elements, rules and findings it is based on. Do not reread other confirmed screens.
- **Keep screenshots out of the main conversation**: images take a lot of context. After rendering, hand the visual self-check to a subagent (Agent tool) and bring back only the problems it finds, as text; read the images yourself with Read only when no subagent is available. The user looks at the images in the system image viewer, outside the conversation.

## How to ask

Ask with AskUserQuestion, in the user's language: 2 to 4 questions per round, 2 to 4 concrete options each, the recommended one first with "(Recommended)" appended to its label, and a description that says what each option means. The questions here are concrete design trade-offs, e.g. "Is the phone number required or optional?", "Is deleting an order a hard delete or a flag?", "Does the list show 20 or 50 rows per page by default?", or for an old rule "Keep the free shipping for customer 1042?".

- Do not ask what the requirements already settle. For what they leave open but development needs, recommend the most common approach. For an old rule, recommend keeping it unless a finding, the requirements or the new architecture speak against it.
- When the user says "you decide" or "either is fine", take the recommended option and mark the item "AI suggestion, user default" in the design.
- When the design exposes a hole or contradiction in the requirements, ask first and update `docs/product/requirements.md` along with it.
- What needs a trial before it can be decided (e.g. whether users will understand an interaction, whether a third-party API is good enough) is recorded with a suggestion to verify it with /spike.

## Steps

### 0. Read, set the scope, find where to resume

Read `docs/product/`, `docs/architecture/overview.md` and `docs/adr/`. Without requirement documents, tell the user to run /kickoff first; without architecture documents, /architect. For an existing system, also read the index of `docs/design/as-is/README.md` (areas, elements, findings); read the old element files only when designing the element based on them.

When `docs/design/README.md` already exists, look at the statuses in the index first: if elements are "Not started", "In progress" or "AI draft, awaiting confirmation", tell the user how many are done and how many remain, and continue with the first unconfirmed element (jump to its step).

Scope:

- New project: design the first version (every MVP requirement in `vision.md`). "Later" requirements are designed through /change when their time comes.
- Modernization or rewrite of an existing system: every requirement in scope, redesigned from the evidence; every old element in the areas in scope is either used or dropped.
- Called by /change: design only the parts the change touches; changed screens are confirmed with the user again. On an existing system, an element touched for the first time is redesigned from its evidence.

Write the design documents in the project's document language: the `Language` line in the project's CLAUDE.md when there is one, otherwise the language the user talks to you in.

### 1. The big picture

Settle the whole first, then each part:

1. **Element index**: list the screens, data entities, interfaces, scheduled jobs and complex logic the system type calls for, one sentence each, with their REQs and, for an existing system, the old elements each is based on. List old elements that nothing uses as candidates to drop and ask the user.
2. **Screen flow** (with a UI): a Mermaid flowchart of how screens lead to each other, where they are entered, and where success and cancel lead.
3. **Common rules**: conventions every screen and interface follows: display formats for dates, times, amounts and numbers; how required fields are marked; when validation runs (while typing, on leaving a field, on submit); where error messages appear; what empty data, loading and errors look like; pagination; time zones; whether text length counts characters or bytes. For an existing system, start from what the old system does and say where it is inconsistent. Confirm the key ones in one round of AskUserQuestion.
4. Show the index, the flow and the common rules to the user and confirm nothing is missing. Then write `docs/design/README.md` from `templates/README.md` (every element "Not started"), commit, and move on.

### 2. Screens: confirm one at a time

Settle the style first: copy `templates/tokens.css` to `docs/design/screens/tokens.css`, adjust the token values to design files or brand guidelines when there are any, otherwise keep the defaults. For an existing system, ask first (unless /kickoff or the architecture settled it): keep the current look (take colors, fonts and spacing from the old stylesheets and screenshots into `tokens.css`), restyle with the current layouts, or redesign layouts and controls too. Every prototype uses this file; later the project's design tokens are built from the same values.

Then, following the main flow of the screen flow, one screen at a time:

1. **Write the screen definition**: set its status to "In progress" in the index. Write `docs/design/screens/SCR-xxx-<short-name>.md` from `templates/screen.md`: purpose, entry and exits, layout, field definitions (type, required, length or range, default, validation rules, error message and data source of every displayed and input field), actions and events (which interface is called, what happens on success and failure), states, permission differences. For an existing system, fill in "From the current system": the old screens it is based on, and every old field rule, business rule and finding touching it, with a proposed decision each.
2. **Write the prototypes**: one HTML file per state from `templates/screen.html`, named like the definition file with a suffix for the state: `SCR-001-login.html` (normal), `SCR-001-login--error.html` (validation errors), `SCR-001-login--empty.html` (empty data), `SCR-001-login--loading.html` (loading). Draw at least the normal and validation-error states; add empty data for lists; when roles see different content, draw one per role. Prototypes are for people to look at: plain HTML and CSS using `tokens.css`, no frameworks, no scripts. Use realistic sample data (real-looking names, addresses and amounts, text of different lengths), not placeholders like "test1" or "xxx"; for an existing system, data shaped like the real data (lengths, value ranges) without copying personal data. For mobile screens set the screenshot size to `390x844`. A screen kept exactly as it is gets no prototype (see "An existing system").
3. **Render and self-check**: run `node <this skill's directory>/render-screens.mjs docs/design/screens/SCR-xxx-*.html`. The script renders each HTML file to a PNG of the same name with Playwright's bundled Chromium (free; downloaded on first run). Then hand the check to a subagent with the Agent tool: give it the definition file and the PNG paths, have it look at the images and compare them with the definition for misalignment, overflowing text, garbled characters, missing or misordered fields and text that differs from the definition, and report a list of problems as text only. Fix problems and render again until none are left.
4. **Ask the user to confirm**: run `node <this skill's directory>/render-screens.mjs --open <the HTML files of these PNGs> [<the old screenshots>]` to open the screenshots in the system image viewer (PNG files given by name are opened as they are, so the old screen appears next to the new one). In your message say which screen this is (n of total); the full path of each image and its state; the key points (a summary of the field definitions, the requirements covered, the decisions you made for the user); for an existing system, what changes from the old screen and the decisions still needed on old rules and findings, asked in the same round. Then ask with AskUserQuestion, with the options "Confirm this screen" and "Skip for now, review later", and say in the question that comments or questions go straight into "Other".
   - The user comments: change the definition and prototypes, render, self-check and open again, and ask again.
   - The user asks a question: answer it first, and change what needs changing.
   - Record every comment and how it was handled in the definition file's "User confirmation log" right away.
5. **Save progress**: once the user confirms, set the status in the definition file and in the index to "Confirmed (YYYY-MM-DD)"; for an existing system, fill in "Used by" of the old screens and "Resolution" of the findings settled in `docs/design/as-is/README.md`. Commit the screen's definition, prototypes and screenshots (`docs(design): confirm SCR-xxx <name>`), tell the user "Progress is saved; you can compact the conversation now", then go to the next screen. For "Skip for now", set the status to "AI draft, awaiting confirmation" and commit the same way.

When the user says "do the rest as you see fit", finish the remaining screens as usual, render and self-check them, set their status to "AI draft, awaiting confirmation" and list them in step 8. The user must confirm these screens, and the decisions on old rules and findings in them, before they are developed.

### 3. Data

Write `docs/design/data.md` from `templates/data.md`:

- An entity relationship diagram (Mermaid `erDiagram`) and common conventions (primary keys, audit columns, deletion, naming, time zones).
- One section per entity: column, type, nullability, default, constraints (unique, foreign key, check), description; indexes; deletion; expected data volume. Types follow the database chosen in the architecture.
- Consistent with the screens: a field required on a screen is a non-null column; a field limited to 50 characters has a column at least 50 long.
- Without a database, write the structure of files, configuration and messages (field, type, required, default, example).
- For an existing system, each entity's "From the current system" section maps the old tables and columns to the new ones, with the conversion and the handling of dirty data found by profiling (e.g. "412 orders with status 9: become cancelled, confirmed by the user"). Old columns holding data that nothing maps are listed and decided (dropped, archived, kept).

Show entities to the user as tables, one to three at a time; ask about trade-offs with AskUserQuestion. After each confirmed group, update the index and commit.

### 4. Interfaces

Write `docs/design/interfaces.md` from `templates/interfaces.md`, only the parts this system has:

- **HTTP API**: method and path, permissions, request parameters (type, required and validation of each field), the success response, status code and error code of each error, idempotency, pagination and sorting.
- **Command line**: commands, arguments and options, output format, exit codes.
- **Public library API**: type and function signatures, errors thrown.
- **Scheduled and batch jobs**: when they run, inputs, outputs, how to rerun after a failure, whether running twice is safe.
- **External integrations**: whom it calls and for what, timeouts, retries, what happens when the other side fails.

Interface validation matches the screens (validation on screens never replaces validation in interfaces). For an existing system, every old interface with outside callers states its decision (compatible, versioned, or changed with the callers) and every old job is kept, changed or dropped. Confirm with the user by feature; after each confirmed group, update the index and commit.

### 5. Permissions and complex logic

- **Permission matrix**: role × screen or action, each cell "allowed / not allowed / own data only", written into `docs/design/README.md`. For an existing system, compare with the old permission rules, especially those the old server did not enforce.
- **Complex logic**: one file per item, `docs/design/logic/LGC-xxx-<short-name>.md` from `templates/logic.md`. State transitions as a Mermaid `stateDiagram-v2` plus the actions allowed in each state; combinations of conditions as a decision table where each row is a test case; formulas with precision, rounding and boundaries. Confirm with concrete examples, e.g. "An order of 99.50 with a coupon for 10 off orders of 100 or more: no discount, 99.50 to pay". For an existing system, take the worked examples of the old rules: a kept rule must give the same result, a changed one says the new result. After each confirmed item, update the index and commit.

### 6. Completeness check

Check the whole design against `references/design-checklist.md`. With many elements, hand the check to subagents in batches (screens, data, interfaces, and for an existing system the evidence), each reporting only a list of problems, so the full definitions never enter the main conversation. The check covers:

- **Requirement coverage**: every "Active" requirement in scope maps to at least one design element, and every design element traces back to a requirement.
- **CRUD matrix**: data entity × screen or interface, each cell C, R, U or D. Look for gaps such as "can be created but never deleted", "a field nothing can change" or "unclear where the data comes from".
- **Permissions**: actions no role can perform; actions a role can perform but should not.
- **Three-way consistency**: screen fields, interface fields and data columns agree on type, required and length.
- **Current system** (existing systems): every old element in scope is used or dropped; every old rule touching the scope has a decision; every finding in scope is resolved; every old column holding data is mapped or decided; every interface with outside callers has a compatibility decision.

Give a suggestion for each problem, ask with AskUserQuestion where the user must decide, and check again after fixing.

### 7. Complete the index and commit

Complete `docs/design/README.md` from `templates/README.md`: element index (ID, name, file, requirements, based on, status), screen flow, common rules, permission matrix, requirement coverage, CRUD matrix, the "Current system" counts for an existing system, completeness check results. Commit with `docs(design): <content>`. Commit to the current branch while the repository has no branch protection; with protection, make every design commit on one `docs/` branch and merge it with /open-pr at the end.

### 8. Report and next step

Report how many screens, entities, interfaces and logic items were designed, how many the user confirmed, which problems the completeness check found and fixed, and what is still "AI draft, awaiting confirmation". For an existing system, also how many old elements were used and dropped, how many old rules were kept, changed and dropped, and how many findings were resolved.

- New project or rewrite: run /scaffold to create the project, then /roadmap.
- Project already scaffolded, maintenance, modernization, called by /change: run /roadmap (or return to /change) to split issues.
- Screens still "AI draft, awaiting confirmation": remind the user that their issues cannot start before the screens are confirmed; running /design again resumes with these screens.

## After the design changes

The design is what development follows, so keep it as accurate as the code:

- When a requirement change touches screens, fields, data, interfaces or logic, /change calls this skill to change the design first; changed screens are rendered again and confirmed with the user before issues are split.
- When development finds a problem in the design, stop, change the design and have the user confirm it; do not change only the code.
- When a set of classes and interfaces must be redesigned (/change rates it D2), that code structure redesign lives in `docs/design/refactor/`; /change writes it, not this skill.
