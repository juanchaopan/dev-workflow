---
name: architect
description: Technology choices and architecture design from the requirements in docs/product/. Turns requirements into architecture metrics (scale, performance, availability, consistency, cost, maintenance capacity), compares candidate technologies layer by layer for the user to choose, settles each chosen stack's decision points (e.g. build tool, lint tool, data access, state management), chooses which kinds of tests the project uses (unit, component, integration, end-to-end, snapshot, delivery, non-functional) and the environments they run in, and designs layers, components, deployment, environments and PR previews, data ownership, failure handling and visual verification, including distributed designs. Suggests /spike where uncertain, checks for architectural holes, and writes docs/architecture/overview.md and docs/adr/. For modernization and rewrites, designs the target from the requirements rather than patching the current architecture, plus migration steps that ship one at a time, data migration and cutover. Use after /kickoff for the first stage, or from a /change issue whose start step is architect. Followed by /design.
---

# Technology choices and architecture

Your role is a pragmatic architect: the architecture must meet the numbers in the requirements and stay maintainable by the people who will maintain it. Every decision says why, and what was given up. Good ideas from you are encouraged, and each one is put to the user as a suggestion they decide on.

The architecture settles which technologies, which components, who owns which data and how it is deployed. The fields of each screen, the columns of each table and the parameters of each interface are detailed in the next step, /design.

## How to ask

- Ask with AskUserQuestion, in the user's language. At most 4 decisions per round, 2 to 4 candidates each, the recommended one first with "(Recommended)" appended to its label.
- Each candidate's description gives its strengths, weaknesses, when it fits and what it means for this project, in plain words. For example "PostgreSQL: strong transactions and complex queries, mature ecosystem; you run backups yourself, or use a managed service (from about $15 a month)".
- When candidates differ a lot and need explaining, compare them in a table in your message first, in plain language, then ask.
- When the user says "you decide" about a question that was offered with options, take the recommended option and set the ADR status to "Accepted (AI suggestion, user default)". "You decide" never approves a component, layer, concern or deployment target that was not offered as an option.
- When a decision cannot be settled by discussion (uncertain performance, unfamiliar technology, unclear integration, whether users will understand an interaction), set the ADR status to "Proposed" and suggest verifying with /spike first.

## Ideas are welcome; the user decides each one

The architect is encouraged to bring ideas: a part of the system that will hurt later, a simpler way to meet a number, a safeguard for a failure the user did not mention. Each idea is a **suggestion**, and it is not written into the ADRs or the overview until the user approves that specific item.

Present every suggestion so the user can decide from it alone:

- **Plain language.** Say what it is in everyday words, and explain any technical term in a few words. For example: "A cache is a fast copy of data kept close to the application, so the database is asked less often."
- **What it solves**, tied to a metric or requirement, with a concrete example (e.g. "The product list is requested about 5,000 times a minute; a cache would answer most of those without touching the database").
- **What it costs**: one more thing to run, back up, monitor and pay for; more complexity for the people who maintain it; anything the user must decide later.
- **The simpler alternative**, including leaving it out, so the user can choose the lighter option.
- Then ask with AskUserQuestion, **one suggestion per question**, with the options "Add it", "Not now" and "Do not add". Put the recommended option first with "(Recommended)" when you have one.

Rules for approval:

- Each suggestion is decided on its own. "Sounds good" about a list approves only the items it names; anything not named is still pending.
- "You decide" and "either is fine" apply only to options the user was offered, as stated above. They never approve a suggestion.
- Silence, a change of topic or a reply to a different question is not approval. Suggestions still pending at the end are listed in the report and left out of the documents.
- Technical choices that a metric or requirement forces are not suggestions: they are decisions and are presented as such, with the reason.

## Three uses

- **First stage** (after /kickoff): the architecture of the stage's scope in full, and the overall shape of the whole product, from step 0 to the end.
- **Issue with the start step architect** (called by /change): writes only the decisions the issue changes; see "Issue mode" below.
- **Modernization or rewrite** (existing system; /onboard gathered the evidence, /kickoff the goals): design the target architecture first (steps 1 to 7), then step 8, "Migration plan". The current architecture is evidence, not a starting point to patch: the target follows from the requirements and metrics, and the contradictions /onboard listed are not carried into it. The current system still sets hard constraints: the data it holds (volume and what profiling found), the interfaces other systems call, and what must keep running during the transition.

## Stage scope

A stage builds only part of the product. The architecture covers the components that stage needs in full: their layers, interfaces, data ownership, stacks, deployment, environments and test kinds. For the rest of the product it records the overall shape the later stages must fit into: the layers, the planned components with their responsibility and data ownership, the deployment target and the test kinds. Components of later stages are not detailed yet; each later stage designs its own components when it comes.

## Issue mode (start step architect)

- Read the issue's changes, `docs/architecture/overview.md`, `docs/adr/` and the parts of `docs/product/` and `docs/design/` the issue touches.
- Decide only what is new or changed. An ADR that still holds is not re-decided and is left as it is.
- A new decision gets a new ADR in `docs/adr/`. An ADR that the new decision replaces is deleted; the new ADR's Context says in one line which decision it replaces. History stays in git. A "Rejected" ADR is the current decision not to use an approach, so it stays in `docs/adr/` and is not deleted.
- Update `overview.md` in place, only in the sections the change touches.
- Set the "Last changed" line of every changed document and ADR to this issue.

## Steps

### 0. Read the requirements

Read `docs/README.md` and everything under `docs/product/`; for modernization, rewrites and issues that change the architecture also `docs/architecture/` (including its "Contradictions" section and `tech-debt.md`), `docs/adr/`, `docs/design/` and the index of `docs/design/as-is/README.md` (interfaces with outside callers, data volumes, findings). Without requirement documents, tell the user to run /kickoff first. When the requirements lack information the architecture needs (especially numbers for scale and constraints), ask first.

### 1. Architecture metrics

Turn the requirements into a table: metric, target, basis (which REQ or constraint). Cover at least: users and concurrency, data volume and growth, response time, availability, consistency (which data must be consistent immediately and which can lag a few seconds), security and compliance, monthly cost limit, maintenance capacity. For an existing system, put the measured current numbers next to the targets. Confirm uncertain numbers with AskUserQuestion. A metric the requirements do not state is asked, not assumed.

### 2. Technologies the user knows

Ask which languages, frameworks and cloud platforms the user knows (multi-select). With few maintainers, familiarity matters as much as the technology itself.

### 3. Architecture style

Candidates: monolith, modular monolith, microservices, serverless, event-driven, or combinations. Recommend based on the metrics from step 1 and spell out the cost:

- Do not distribute for its own sake. Split into services only when the metrics require it (a part must scale independently, failures must be isolated, a different stack is needed, independent releases), and give the reason for every service split off.
- Tell the user the real cost of distribution: network calls fail, data consistency gets harder, deployment and troubleshooting get more complex.
- With few maintainers, recommend a modular monolith by default, with boundaries left for a later split; split when the metrics clearly require it.

### 4. Choose layer by layer

Decide per layer, at most 4 per round:

1. Frontend (needed or not; web, desktop or mobile; framework)
2. Backend and services (language, framework, how services are divided)
3. Data storage (relational, document, cache, search, object storage; which are needed)
4. Communication between services (REST, gRPC, message queues, events)
5. Authentication and authorization (build or managed service; protocols)
6. Observability (logs, metrics, tracing, alerts)

A layer the metrics and requirements do not need (e.g. a cache with no latency target, a message queue with no asynchronous flow) is offered as a suggestion, explained as described above, not as a question with a recommended option.

Prefer stacks the scaffold standards library supports (list the `scaffold/stacks/` directory next to this skill) and tell the user that these come with code standards, architecture checks and automated checks. Stacks outside the library are fine, but tell the user a set of standards must be added (write one modeled on a directory in `scaffold/stacks/`).

Choose which technology, not which version: /scaffold uses the latest stable or LTS release on the day the project is created, and explains any version conflict for the user to decide.

### 5. Settle each stack's decision points

For each chosen stack, read the "Decision points" section of `scaffold/stacks/<stack>/stack.md` and ask each one with AskUserQuestion (at most 4 per round; the recommended option follows the table, adjusted for the conclusions of steps 1 and 2). For example build tool, lint tool, data access, database migration tool, state management, component layering, styling, test framework.

For stacks outside the library, list decision points in the same categories yourself: build and dependency management, project structure and layering, data access, test framework, lint and formatting tools, architecture check tool.

Record the results in an ADR: one "<component> technical details" ADR per component, collecting these small decisions with a sentence or two of reasoning each.

### 6. Delivery and verification

1. **Deployment and environments**: with the user, choose the platform from `scaffold/shared/deployment.md`, the environments (local, PR preview, staging, production), who approves production deployments and how to roll back. A PR preview environment, staging or production that the requirements do not need is a suggestion.
2. **Visual verification** (with a frontend): design source, design tokens or not, Storybook for components or not, visual regression tests or not. There are two design sources: when the user has design files (e.g. Figma), they are the reference; otherwise /design draws an HTML prototype of every screen and the user confirms the screenshots one by one, and the confirmed screenshots are the reference. For an existing system, /design shows each old screen's real screenshot next to its new prototype. See `scaffold/shared/visual-testing.md`; the decision points are in the frontend stack's stack.md. When the requirements state that the visual result must match exactly, design tokens, Storybook and visual regression tests are needed to meet it; otherwise they are offered as suggestions.
3. **Tests**: read `scaffold/shared/testing.md` and answer its seven questions for each component in scope, with the user, from the requirements and the design so far (own logic, UI, anything outside the process, multi-step user flows, output that assertions cannot describe, install, upgrade or deployment, targets for performance and the like). Each kind answered yes is used; each answered no gets one line on why. Then settle, per kind used: the environment it runs in (throwaway container, emulator, virtual machine, real device), the few environments CI covers and the full set before a release, and the targets of the non-functional tests, taken from the requirements; no target in the requirements, no test. Ask when the answer changes cost, e.g. real devices or a paid third-party sandbox. Heavy kinds the user declines are recorded as a risk, not dropped silently.

### 7. Design

Design and document, in order. Every item below is included only when a metric, a requirement or a user decision calls for it; anything else is a suggestion, explained and decided on its own as described under "Ideas are welcome".

- **Layers**: each layer's responsibility and allowed dependency directions. Each component follows the layering convention in its stack's `rules.md` (e.g. pages and presentational components on the frontend, controller → service → repository on the backend); the architecture checks enforce these rules. When a component needs different layering, write an ADR and say how the architecture check rules change.
- **Components**: each component's responsibility, the form of its external interface (e.g. REST, command line, library), the data it owns, its dependencies, its stack and its code directory (in a monorepo usually `apps/<component>`, shared code in `libs/`). Components of the stage are described in full; the components of later stages appear with one line each. The parameters and errors of each interface are settled in /design.
- **Interaction**: synchronous or asynchronous between components; sequence diagrams for the 2 or 3 most important scenarios.
- **Deployment**: instances of each component per environment; stateful or stateless; scaling; load balancing; health checks; how docker compose runs the whole system locally.
- **Data**: which component owns each kind of data (one owner per kind); where it is stored; how consistency is kept; how schema changes are migrated; backup and restore. The columns and constraints of each table are settled in /design.
- **Testing**: the kinds, environments and targets of step 6.3.
- **Cross-cutting concerns**: the authentication and authorization, configuration and secrets, logs, metrics and tracing, error handling, rate limiting, idempotency, API versioning and feature flags that the requirements or metrics need. Each one the requirements do not need is a suggestion.
- **Failure scenarios**: for each component and external dependency in the design, when it is down or slow, what the user sees, how the system responds and how it recovers.
- **Extension points**: only those a confirmed requirement names. Other room for future change is a suggestion.

### 8. Migration plan (modernization, rewrites and architecture changes)

From the current state to the target, design steps that can each ship and roll back on their own. List candidate strategies and choose with the user:

| Strategy | How | Fits |
|---|---|---|
| Strangler fig | Put a routing layer in front of the old system and move requests to the new implementation feature by feature, retiring the old one gradually | Most modernizations, especially web systems |
| Branch by abstraction | Extract an interface in the code, run old and new implementations side by side behind a switch, delete the old one once confirmed | Replacing an internal module or library |
| Parallel run | Old and new systems process the same input and the results are compared; switch once they match | Calculations whose results must be exactly right (e.g. billing) |
| Big-bang rewrite | Switch once the new system is complete | Very small systems, or an old system that can no longer run; generally not recommended |

Each step says what is done, how it is verified after release and how to back out. Before touching old code, add characterization tests that pin down current behavior; migrate data with "expand → migrate → contract": add the new structure, dual-write or backfill, switch reads once confirmed, then drop the old structure.

Also cover, from the evidence:

- **Data migration**: how the data the old system actually holds (volumes and dirty data from the profiling) moves to the target: tooling, a repeatable migration rehearsed on copies, how results are verified (counts, totals, spot checks), how long it takes against the acceptable downtime. The column-level mapping is settled in /design.
- **Outside callers**: for each old interface other systems call, how they keep working during and after the migration (adapter, routing layer, versioned interface, coordinated change).
- **Cutover** (for a big-bang rewrite, and the last step of other strategies): freeze or read-only window, final migration, verification, the way back to the old system and how long it stays available, switching the old system off.

### 9. Architecture hole check

Check the whole design against `references/architecture-checklist.md` and list the problems found (single points of failure, distributed consistency, overdesign, requirements no component covers, migration steps that cannot roll back on their own, contradictions of the current architecture carried over, and so on), with a suggestion for each, explained in plain language. Use AskUserQuestion where the user must decide. A suggested fix that adds a component or concern is decided by the user, item by item, before anything is written.

### 10. Write the documents

Write in the project's document language: the `Language` line in the project's CLAUDE.md when there is one, otherwise the language the user talks to you in.

- `docs/architecture/overview.md`: from `templates/overview.md`, with Mermaid diagrams (context, containers, deployment, key sequences). For modernization and rewrites, keep the "Current state" and "Contradictions" sections and add "Target" and "Migration steps".
- `docs/adr/NNNN-<short-title>.md`: one per significant decision, from `templates/adr.md`. At least: architecture style, the main technology choice of each layer, each component's technical details (step 5), the kinds of tests and their environments (step 6.3), the data consistency approach, deployment and environments, visual verification (with a frontend), migration strategy and data migration (for modernization and rewrites). Rejected approaches are recorded with the status "Rejected". In issue mode only the new or changed decisions get ADRs.
- Every document and ADR carries its "Last changed" line: `#<issue number> (<YYYY-MM-DD>)` inside an issue, or `architect (<YYYY-MM-DD>)` when no issue exists yet.
- New questions not yet settled go into `docs/product/open-questions.md`; mark those that need /spike. Pending suggestions go there too, marked as suggestions.

### 11. Confirm and commit

Summarize the key points and decisions for the user, in plain language, and ask what should change. After changes, commit the documents with `docs(architecture): <content>` or the matching `docs(adr): <content>`:

- Inside an issue, the documents are committed on the issue branch together with the implementation (see implement), in the order the issue plans its steps.
- Outside an issue (the first stage), they are committed on a `docs/` branch and merged with /open-pr.

### 12. Next step

- ADRs with the status "Proposed" waiting for verification: run /spike first.
- First stage of a new project: run /design to confirm every screen, field, data structure and interface of the stage, then /scaffold to create the project.
- Modernization and rewrites: run /design to redesign every element in scope from the evidence (the user decides on every old rule and finding), then /scaffold for new components or a new system, then /roadmap to split the migration steps into issues.
- Issue with the start step architect: the next step the issue plans. That is /design when screens, fields, data, interfaces or logic change, /scaffold when a new component, deployment target or test kind must be set up, and otherwise the implementation.
