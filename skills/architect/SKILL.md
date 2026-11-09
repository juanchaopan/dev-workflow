---
name: architect
description: Technology choices and architecture design from the requirements in docs/product/. Turns requirements into architecture metrics (scale, performance, availability, consistency, cost, maintenance capacity), compares candidate technologies layer by layer for the user to choose, settles each chosen stack's decision points (e.g. build tool, lint tool, data access, state management), and designs layers, components, deployment, environments and PR previews, data ownership, failure handling and visual verification, including distributed designs. Suggests /spike where uncertain, checks for architectural holes, and writes docs/architecture/overview.md and docs/adr/. For modernization and rewrites, designs the target from the requirements rather than patching the current architecture, plus migration steps that ship one at a time, data migration and cutover. Use after /kickoff, or when /change finds the architecture must change. Followed by /design.
---

# Technology choices and architecture

Your role is a pragmatic architect: the architecture must meet the numbers in the requirements and stay maintainable by the people who will maintain it. Every decision says why, and what was given up.

The architecture settles which technologies, which components, who owns which data and how it is deployed. The fields of each screen, the columns of each table and the parameters of each interface are detailed in the next step, /design.

## How to ask

- Ask with AskUserQuestion, in the user's language. At most 4 decisions per round, 2 to 4 candidates each, the recommended one first with "(Recommended)" appended to its label.
- Each candidate's description gives its strengths, weaknesses, when it fits and what it means for this project. For example "PostgreSQL: strong transactions and complex queries, mature ecosystem; you run backups yourself, or use a managed service (from about $15 a month)".
- When candidates differ a lot and need explaining, compare them in a table in your message first, then ask.
- When the user says "you decide", take the recommended option and set the ADR status to "Accepted (AI suggestion, user default)".
- When a decision cannot be settled by discussion (uncertain performance, unfamiliar technology, unclear integration, whether users will understand an interaction), set the ADR status to "Proposed" and suggest verifying with /spike first.

## Three uses

- **New architecture**: from step 0 to the end.
- **Architecture change** (called by /change): read the existing `docs/architecture/overview.md` and `docs/adr/` and redo only the affected parts. New decisions get new ADRs; the old ones they replace get the status "Superseded by ADR-xxxx".
- **Modernization or rewrite** (existing system; /onboard gathered the evidence, /kickoff the goals): design the target architecture first (steps 1 to 7), then step 8, "Migration plan". The current architecture is evidence, not a starting point to patch: the target follows from the requirements and metrics, and the contradictions /onboard listed are not carried into it. The current system still sets hard constraints: the data it holds (volume and what profiling found), the interfaces other systems call, and what must keep running during the transition.

## Steps

### 0. Read the requirements

Read `docs/README.md` and everything under `docs/product/`; for modernization, rewrites and architecture changes also `docs/architecture/` (including its "Contradictions" section and `tech-debt.md`), `docs/adr/`, `docs/design/` and the index of `docs/design/as-is/README.md` (interfaces with outside callers, data volumes, findings). Without requirement documents, tell the user to run /kickoff first. When the requirements lack information the architecture needs (especially numbers for scale and constraints), ask first.

### 1. Architecture metrics

Turn the requirements into a table: metric, target, basis (which REQ or constraint). Cover at least: users and concurrency, data volume and growth, response time, availability, consistency (which data must be consistent immediately and which can lag a few seconds), security and compliance, monthly cost limit, maintenance capacity. For an existing system, put the measured current numbers next to the targets. Confirm uncertain numbers with AskUserQuestion.

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

Prefer stacks the scaffold standards library supports (list the `scaffold/stacks/` directory next to this skill) and tell the user that these come with code standards, architecture checks and automated checks. Stacks outside the library are fine, but tell the user a set of standards must be added (write one modeled on a directory in `scaffold/stacks/`).

Choose which technology, not which version: /scaffold uses the latest stable or LTS release on the day the project is created, and explains any version conflict for the user to decide.

### 5. Settle each stack's decision points

For each chosen stack, read the "Decision points" section of `scaffold/stacks/<stack>/stack.md` and ask each one with AskUserQuestion (at most 4 per round; the recommended option follows the table, adjusted for the conclusions of steps 1 and 2). For example build tool, lint tool, data access, database migration tool, state management, component layering, styling, test framework.

For stacks outside the library, list decision points in the same categories yourself: build and dependency management, project structure and layering, data access, test framework, lint and formatting tools, architecture check tool.

Record the results in an ADR: one "<component> technical details" ADR per component, collecting these small decisions with a sentence or two of reasoning each.

### 6. Delivery and verification

1. **Deployment and environments**: with the user, choose the platform from `scaffold/shared/deployment.md`, the environments (local, PR preview, staging, production), who approves production deployments and how to roll back.
2. **Visual verification** (with a frontend): design source, design tokens or not, Storybook for components or not, visual regression tests or not. There are two design sources: when the user has design files (e.g. Figma), they are the reference; otherwise /design draws an HTML prototype of every screen and the user confirms the screenshots one by one, and the confirmed screenshots are the reference. For an existing system, /design shows each old screen's real screenshot next to its new prototype. See `scaffold/shared/visual-testing.md`; the decision points are in the frontend stack's stack.md. For projects that care about pixel-level results, recommend design tokens, Storybook and visual regression tests.

### 7. Design

Design and document, in order:

- **Layers**: each layer's responsibility and allowed dependency directions. Each component follows the layering convention in its stack's `rules.md` (e.g. pages and presentational components on the frontend, controller → service → repository on the backend); the architecture checks enforce these rules. When a component needs different layering, write an ADR and say how the architecture check rules change.
- **Components**: each component's responsibility, the form of its external interface (e.g. REST, command line, library), the data it owns, its dependencies, its stack and its code directory (in a monorepo usually `apps/<component>`, shared code in `libs/`). The parameters and errors of each interface are settled in /design.
- **Interaction**: synchronous or asynchronous between components; sequence diagrams for the 2 or 3 most important scenarios.
- **Deployment**: instances of each component per environment; stateful or stateless; scaling; load balancing; health checks; how docker compose runs the whole system locally.
- **Data**: which component owns each kind of data (one owner per kind); where it is stored; how consistency is kept; how schema changes are migrated; backup and restore. The columns and constraints of each table are settled in /design.
- **Cross-cutting concerns**: authentication and authorization, configuration and secrets, logs, metrics and tracing, error handling, rate limiting, idempotency, API versioning, feature flags.
- **Failure scenarios**: when each component or external dependency is down or slow, what the user sees, how the system responds and how it recovers.
- **Evolution**: extension points not built now but left room for.

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

Check the whole design against `references/architecture-checklist.md` and list the problems found (single points of failure, distributed consistency, overdesign, requirements no component covers, migration steps that cannot roll back on their own, contradictions of the current architecture carried over, and so on), with a suggestion for each. Use AskUserQuestion where the user must decide.

### 10. Write the documents

Write in the project's document language: the `Language` line in the project's CLAUDE.md when there is one, otherwise the language the user talks to you in.

- `docs/architecture/overview.md`: from `templates/overview.md`, with Mermaid diagrams (context, containers, deployment, key sequences). For modernization and rewrites, keep the "Current state" and "Contradictions" sections and add "Target" and "Migration steps".
- `docs/adr/NNNN-<short-title>.md`: one per significant decision, from `templates/adr.md`. At least: architecture style, the main technology choice of each layer, each component's technical details (step 5), the data consistency approach, deployment and environments, visual verification (with a frontend), migration strategy and data migration (for modernization and rewrites).
- New questions not yet settled go into `docs/product/open-questions.md`; mark those that need /spike.

### 11. Confirm and commit

Summarize the key points and decisions for the user and ask what should change. After changes, commit with `docs(architecture): <content>`. Commit directly when the repository has no branch protection yet; otherwise create a `docs/` branch and use /open-pr.

### 12. Next step

- ADRs with the status "Proposed" waiting for verification: run /spike first.
- New project: run /design to confirm every screen, field, data structure and interface, then /scaffold to create the project.
- Modernization and rewrites: run /design to redesign every element in scope from the evidence (the user decides on every old rule and finding), then /scaffold for new components or a new system, then /roadmap to split the migration steps into issues.
- Architecture changes: when screens, data or interfaces change, run /design first; then back to /change to split issues.
