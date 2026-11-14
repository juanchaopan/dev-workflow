---
name: onboard
description: Take over an existing project by gathering evidence of what it really does, without trusting it: inventory, whether it builds and runs, which kinds of tests it has and which are missing, current architecture and its contradictions, features in use, and the full current design — every screen (real screenshots when it runs), fields as enforced on screen, server and database, tables with profiling of the actual data, interfaces and their callers, jobs and the business rules buried in code — each marked observed, inferred or conflicting, with suspected bugs and contradictions listed as findings. Measures the quality baseline, asks where the project goes (maintain, extend, modernize, rewrite) and, when the old code stays, sets up standards and the review workflow with a baseline. /kickoff and /design later decide what to keep, change or drop. Use for "take over this project", "look at this old project", "this repository has no documentation", "modernize or rewrite this system"; /kickoff and /change call it first on undocumented code.
---

# Taking over an existing project

The old system is evidence, not truth. Its code may have bugs, parts may not even run, the architecture may contradict itself, and its screens may be redone completely. Even so, only the old system knows its hidden business rules, the meaning of its data and who depends on its interfaces; requirement interviews alone miss them, and that is how rewrites lose features. So this skill collects everything the old system can tell, marks how far each piece can be trusted, and lists what looks wrong — without deciding. /kickoff decides where the project goes, /architect designs the target, and /design turns the evidence into a target design the user confirms element by element, deciding for every old rule whether it is kept, changed or dropped.

## Principles

- **Read-only for code and configuration**: steps 1 to 6 change no code or configuration. Build, test and start the system, but do not fix it; what fails is a finding. Documents under `docs/` are written as you go.
- **Evidence, with trust levels**: everything documented says how it is known: "Observed" (seen in the running system or the data), "Inferred from code", or "Conflicting" (sources disagree). Requirements, architecture and decisions inferred from code are marked "inferred" until the user confirms them.
- **Describe, do not decide**: when something looks wrong, record a finding with its evidence. Whether the code or the expectation is wrong is the user's call, later.
- **Never touch production**: run the system locally or in a test environment with test data or a copy. Querying a production database, or capturing production screens, needs the user's explicit permission each time, read-only. Documents hold aggregates, never personal data.
- **Let numbers speak**: measure quality with tools and record it as the baseline to compare against later.
- **Progress lives in files**: a large system takes a long time to document. Work one area at a time, write and commit as each area is done, and keep only summaries in the conversation; the user can compact the conversation at any time, and running /onboard again continues where it stopped.
- **Talk to the user in their language**; documents are written in the project's document language (the `Language` line in the project's CLAUDE.md when there is one, otherwise the language the user talks to you in).

## Steps

### 0. Scope and where to resume

Confirm the directory to take over, whether it is a git repository and whether it has a GitHub remote. For a large code base, ask which parts matter most; those areas go first.

When `docs/design/as-is/README.md` already exists, read its "Areas" table: continue with the first area that is not "Documented" (step 4), or with the first later step not done yet.

### 1. Inventory

- **Languages and size**: count files and lines of code by extension.
- **Components**: find every unit that can be built or deployed on its own (every `package.json`, `pom.xml`, `build.gradle(.kts)`, `pyproject.toml`, `*.csproj`, `go.mod`, `Dockerfile` and so on). Identify each component's stack with the "How to recognize it" section of the scaffold skill's `stacks/*/stack.md`.
- **Versions and dependencies**: versions of languages, frameworks and main dependencies; which are at or near end of life (`https://endoflife.date/api/<product>.json`, or `node <scaffold skill directory>/shared/versions.mjs lts <product>` for the current LTS); known vulnerabilities (`npm audit`, `./mvnw dependency-check`, `pip-audit`, `dotnet list package --vulnerable` and so on, by stack).
- **Does it build, test and run**: find the build, test and start commands (README, scripts, compose files, CI) and run each. Start it locally with a local or copied database; ask the user for missing configuration values (never invent credentials). Record what passes, what fails and why. When it does not run, say so plainly, record a "Does not run" finding and continue from the code: everything later is then "Inferred from code".
- **Tests by kind**: for each component, which kinds of the scaffold skill's `shared/testing.md` the project already has (unit, component, integration, end-to-end, snapshot, delivery, non-functional), how many tests of each, whether each runs locally and in CI, and which kinds the seven questions of that file say it needs but lacks. A missing kind is a finding, not something to add now.
- **Engineering setup**: CI/CD configuration, deployment (Dockerfiles, compose files, infrastructure as code), environment configuration, and whether secrets or passwords are committed to the repository (if so, tell the user immediately; it is a security issue).
- **Data and integrations**: database type, migration scripts, schema or model definitions; which external systems it calls and which call it.
- **History**: `git log` for the project's age and recent activity; the most frequently changed files of the last year (`git log --since="1 year ago" --name-only --format="" | sort | uniq -c | sort -rn | head -30`) — often where the most problems are.
- **Existing documents**: READMEs, wikis, old specifications, tickets. They are evidence too, possibly outdated; where they disagree with the code, that is a finding.

Then split the system into **areas** (modules or business domains, e.g. orders, billing, administration) for step 4.

### 2. Current architecture

- Map components and their dependencies, data stores and external integrations. For frontend and Node.js components, dependency-cruiser can generate a dependency graph.
- Look at the actual layering: organized by layer or by feature, cross-layer calls, presentation mixed with business logic, the same concern solved several ways.
- Write `docs/architecture/overview.md` from the architect skill's `templates/overview.md`, with "Current state (documented by /onboard)" under the title and a "Contradictions" section for what does not hold together (e.g. two ways of reaching the database, a "stateless" service keeping sessions in memory). Fill its "Testing" section with the kinds found in step 1. Historical decisions you can see become ADRs with the status "Accepted (inferred from existing code)". /architect designs the target from scratch; it does not inherit these contradictions.

### 3. Existing features

- Infer what the system offers from routes and controllers, pages and menus, scheduled jobs, external interfaces and test cases.
- Write them as requirements from the kickoff skill's `templates/requirements.md`, with the status "Implemented", the source "inferred from code" and the code location under "Related". A feature that does not work gets a finding.
- Ask the user with AskUserQuestion which inferences are right, which features nobody uses any more and what is missing (multi-select, at most 4 questions per round). Update sources and statuses after confirmation.

### 4. Current design, area by area

Document everything the old system does at design level in `docs/design/as-is/`, from this skill's `templates/as-is/`. This is evidence for /design, so it covers the whole system in scope, not only what is about to change. IDs: CUR-SCR, CUR-ENT, CUR-API, CUR-JOB and CUR-RUL for elements, FND for findings.

1. **Index first**: write `docs/design/as-is/README.md` with every area from step 1 as "Not started". It is the progress tracker.
2. **Per area**, cover:
   - **Screens**: one `screens/CUR-SCR-xxx-<name>.md` per screen. Record each field's required flag, length and validation separately for the screen, the server and the database; where they differ, that is a finding (it usually is a bug, and it tells /design which rule users actually live with). When the system runs, capture real screenshots: list each screen's URL and target file in a temporary JSON file outside the repository and run `node <this skill's directory>/capture-screens.mjs [--storage <file>] <list.json>` (behind a sign-in, first run `npx playwright open --save-storage=<file outside the repository> <sign-in URL>`, let the user sign in and close the window, and delete the file afterwards). States that need interaction (validation errors, dialogs) are captured only when a URL reaches them; otherwise describe them. The user may also drop screenshots of the real system into `docs/design/as-is/screens/` with the matching names. When nothing runs, write "None" and rely on the code.
   - **Data**: `data.md` from `templates/as-is/data.md`: every table or file format, with the meaning of each column as the code uses it (e.g. status codes). With the user's permission and a copy of the database, profile it with read-only aggregate queries: row counts, empty rates of columns the code treats as required, distinct values of code columns, orphaned references, out-of-range values. What the data contains is what a migration must handle; mismatches with the code are "Dirty data" findings.
   - **Interfaces**: `interfaces.md` from the design skill's `templates/interfaces.md`, adding "Callers" and "Trust" to each interface and job. Find who calls each external interface (access logs, gateway configuration, other repositories, the user): callers outside this system constrain how it may change.
   - **Business rules**: `rules.md` from `templates/as-is/rules.md`: validation, calculations with a worked example, state transitions, permissions (and whether the server enforces them or only the screen hides a button), scheduled behavior, hard-coded special cases. Each with its code location.
   - **Findings**: append to the "Findings" table in the index: suspected bugs, contradictions, dead code, dirty data, hidden behavior, security problems (tell the user about security problems right away). Describe the evidence; do not decide.
3. **Save the area**: set its status to "Documented (YYYY-MM-DD)", note what could not be reached and why, commit (`docs(as-is): document <area>`), and tell the user the area's counts and its most important findings in a few lines, and that the conversation can be compacted now.
4. **Large systems**: hand each area to a subagent with the Agent tool. Give it this step, the templates, the area's code paths and the next free ID numbers per prefix; it writes the area's files and returns only counts and its findings list. Run areas one after another, or in parallel with disjoint ID ranges; the main conversation updates the index and commits.

The user does not confirm the old design element by element; it may be wrong and much of it may be redone. Ask only what only the user knows and what changes the documentation, e.g. "Is the refund approval screen still used?" or "Is the status code 9 in the data a known case?", at most 4 per round. The decisions on findings come later: in /kickoff when they change requirements, in /design when they concern one element.

### 5. Quality baseline

Measure the current state and write it to `docs/architecture/tech-debt.md` (from this skill's `templates/tech-debt.md`):

- Build and tests: do they pass, number of tests by kind (step 1), coverage (when there is a tool).
- Duplication: run `npx jscpd .` at the repository root (with the `.jscpd.json` from the setup-ai-review skill's template) and record the duplication rate.
- Complexity and lint: run lint with the standards library's configuration for each component's stack, record the number of violations and the most complex functions.
- Architecture violations: run the standards library's architecture check configuration (when it matches the directory structure) and record the number of violations.

Then list the tech debt: for each item, what it is, what it affects, how risky it is, how much work the fix is and the recommended handling. "Does not run" and security findings come first; missing kinds of tests (step 1) are listed with what they would protect.

### 6. Ask where the project goes next

Summarize the evidence in a few lines (what runs, the counts of step 4, the number of findings by kind, the most important ones), then ask with AskUserQuestion:

- **Maintain**: keep it running with bug fixes and small features → step 8, then /change for each request. When a change touches an element, /design builds its target definition from the evidence, resolves its findings with the user and has it confirmed.
- **Extend**: add a batch of new features → step 8, then the "existing code" entry of /kickoff, /design for new and touched elements, /roadmap.
- **Modernize**: upgrade the stack, redesign the architecture, redo the screens, controls or style, move platforms — replacing the old system step by step → step 8 for the old code that keeps running during the migration, then the "existing code" entry of /kickoff, /architect for the target and migration steps, /design to redesign every element in scope from the evidence, /roadmap.
- **Rewrite**: remind the user of the risks (a long stall before anything ships, hidden rules lost, data migration and cutover in one go) and suggest modernizing step by step instead. If the user still wants a rewrite: skip step 8 (the old code is not developed further), then the "existing code" entry of /kickoff with the evidence as the requirement source, /architect, /design for everything, /scaffold for the new system (in a new directory or repository), /roadmap with data migration and cutover milestones.

### 7. Write the documents and commit

Write `docs/README.md` (the kickoff skill's `templates/docs-README.md`) and the documents of steps 2, 3 and 5; step 4's documents are already committed. Summarize the key points for the user and commit after confirmation with `docs: document the current state`. When the repository already has branch protection, put every commit of this skill on one `docs/` branch and merge it with /open-pr at the end.

### 8. Set up standards and workflow (with a baseline)

Only when the old code keeps being developed (maintain, extend, modernize).

1. Run `scaffold` with the Skill tool in its "add standards to an existing project" mode to give every component its stack's standards, lint and architecture checks. When the directory structure does not match the library's layering conventions, do not move code around on a large scale; install the tools and rules, record the baseline, and treat restructuring as tech debt paid off over time.
2. Record existing problems as the baseline so checks only allow improvement from today:

   | Check | Baseline approach |
   |---|---|
   | dependency-cruiser (Angular, React, Node) | `node scripts/arch-check.mjs --baseline` generates `.dependency-cruiser-known-violations.json`; commit it |
   | ArchUnit (Spring Boot) | Wrap the rules in `FreezingArchRule.freeze(...)` and add `freeze.store.default.allowStoreCreation=true` to `archunit.properties`; the first run creates `archunit_store/`; commit it |
   | import-linter (Python) | Add existing violating imports to the matching contract's `ignore_imports` |
   | ArchUnitNET (.NET) | Exclude existing violating types temporarily with `.That().AreNot(...)` and record them in tech-debt.md |
   | Lint complexity and length limits | Relax the limits per file in the lint configuration for files that exceed them today, and record them in tech-debt.md |
   | jscpd | Set `threshold` in `.jscpd.json` to the current duplication rate (rounded up) and lower it over time |

3. Run `setup-ai-review` with the Skill tool to set up the review workflow. The Tests section of CLAUDE.md lists the kinds the project has today, with the commands that already exist; kinds it lacks are listed with "missing" and their reason, and /roadmap schedules setting them up.
4. Recommend to the user: before touching high-risk or frequently changed code, add characterization tests that pin down today's behavior exactly as it is, even where it looks wrong (findings included), so later changes show what they change. Fixing a finding is then a deliberate change with its own test.

### 9. Report

Explain: the components; whether it builds and runs; the kinds of tests it has and lacks; the key points and contradictions of the current architecture; the existing features found and confirmed; the current design documented (screens with and without real screenshots, entities, interfaces and jobs, business rules) and the areas not reached; the findings by kind with the most important ones; the baseline numbers; the 3 to 5 most important tech debt items; the checks set up; and the next step for the chosen direction.
