---
name: onboard
description: Take over an existing project. Reads the code, build configuration, commit history and existing documents and reconstructs the current state — components and dependencies, current architecture and data, features already implemented, tech debt and quality baseline — as documents under docs/, asks the user to confirm what was inferred, then sets up code standards, architecture checks and the review workflow with a baseline, so existing problems are recorded but nothing may get worse. Use when the user says "take over this project", "look at this old project", "this repository has no documentation" or "we need to modernize this system"; /kickoff also calls it first when it meets existing code.
---

# Taking over an existing project

The goal: let a project without documentation or standards join the whole workflow. Read first and change nothing; document the current state; set up standards with a baseline — existing problems are recorded, not counted as failures, new code may not make them worse, and the debt is paid off over time.

## Principles

- **Read-only first**: steps 1 to 5 change no code or configuration. Run builds and tests when needed, but do not fix anything.
- **Mark inferences**: requirements, architecture and decisions inferred from code are marked "inferred" until the user confirms them.
- **Let numbers speak**: measure quality with tools (does the build pass, how many tests, duplication rate, violation counts), record it as the baseline, and compare against it later.
- **Talk to the user in their language**; documents are written in the project's document language (the `Language` line in the project's CLAUDE.md when there is one, otherwise the language the user talks to you in).

## Steps

### 0. Scope

Confirm the directory to take over, whether it is a git repository and whether it has a GitHub remote. For a large code base, ask the user which parts to look at first.

### 1. Inventory

- **Languages and size**: count files and lines of code by extension.
- **Components**: find every unit that can be built or deployed on its own (every `package.json`, `pom.xml`, `build.gradle(.kts)`, `pyproject.toml`, `*.csproj`, `go.mod`, `Dockerfile` and so on). Identify each component's stack with the "How to recognize it" section of the scaffold skill's `stacks/*/stack.md`.
- **Versions and dependencies**: versions of languages, frameworks and main dependencies; which are at or near end of life (`https://endoflife.date/api/<product>.json`, or `node <scaffold skill directory>/shared/versions.mjs lts <product>` for the current LTS); known vulnerabilities in dependencies (`npm audit`, `./mvnw dependency-check`, `pip-audit`, `dotnet list package --vulnerable` and so on, by stack).
- **Does it run**: find the build, test and start commands, run each, and record what passes, what fails and why.
- **Engineering setup**: CI/CD configuration, deployment (Dockerfiles, compose files, infrastructure as code), environment configuration, and whether secrets or passwords are committed to the repository (if so, tell the user immediately; it is a security issue).
- **Data**: database type, migration scripts, schema or model definitions, integrations with external systems.
- **History**: `git log` for the project's age and recent activity; the most frequently changed files of the last year (`git log --since="1 year ago" --name-only --format="" | sort | uniq -c | sort -rn | head -30`) — they are often where the most problems are and what to look at first.

### 2. Current architecture

- Map components and their dependencies, data stores and external integrations. For frontend and Node.js components, dependency-cruiser can generate a dependency graph to help.
- Look at the actual layering: is the code organized by layer or by feature, are there cross-layer calls, are presentation and business logic mixed.
- Write `docs/architecture/overview.md` from the architect skill's `templates/overview.md`, with "Current state (documented by /onboard)" under the title. Historical decisions you can see (e.g. why this database) become ADRs with the status "Accepted (inferred from existing code)".

### 3. Existing features

- Infer what the system offers today from routes and controllers, pages and menus, scheduled jobs, external interfaces and test cases.
- Write them as requirements from the kickoff skill's `templates/requirements.md`, with the status "Implemented", the source "inferred from code" and the code location under "Related".
- Ask the user with AskUserQuestion which inferences are right, which features nobody uses any more and what is missing (multi-select, at most 4 questions per round). Update sources and statuses after confirmation.

The screens, tables and interfaces of existing features are not documented in full here; /design documents the current state of the parts a change touches when /change gets to them.

### 4. Quality baseline

Measure the current state and write it to `docs/architecture/tech-debt.md` (from this skill's `templates/tech-debt.md`):

- Build and tests: do they pass, number of tests, coverage (when there is a tool).
- Duplication: run `npx jscpd .` at the repository root (with the `.jscpd.json` from the setup-ai-review skill's template) and record the duplication rate.
- Complexity and lint: run lint with the standards library's configuration for each component's stack, record the number of violations and the most complex functions.
- Architecture violations: run the standards library's architecture check configuration (when it matches the directory structure) and record the number of violations.

Then list the tech debt: for each item, what it is, what it affects, how risky it is, how much work the fix is and the recommended handling.

### 5. Ask what the user wants to do next

With AskUserQuestion:

- Keep it running, only bug fixes and small features → set up the workflow (step 7), then use /change for each request.
- Add a batch of new features → set up the workflow, then the "existing code" entry of /kickoff to discover the new requirements.
- Modernize (upgrade the stack, redesign the architecture, move platforms) → set up the workflow, then the "existing code" entry of /kickoff, then /architect for the target architecture and migration steps.
- Rewrite → remind the user of the risks (a long stall, hidden business rules getting lost) and suggest incremental replacement first; if the user insists, use the current-state documents as a requirement source for a new project through /kickoff.

### 6. Write the documents and commit

Write `docs/README.md` (the kickoff skill's `templates/docs-README.md`) and the documents of steps 2 to 4. Summarize the key points for the user and commit after confirmation with `docs: document the current state`. When the repository already has branch protection, create a `docs/` branch and use /open-pr.

### 7. Set up standards and workflow (with a baseline)

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

3. Run `setup-ai-review` with the Skill tool to set up the review workflow.
4. Recommend to the user: before touching high-risk or frequently changed code, add characterization tests (pin down today's behavior exactly as it is, even if it looks wrong), so later refactoring shows whether anything broke.

### 8. Report

Explain which components the project has, the key points of the current architecture, how many existing features were found (and how many the user confirmed), the baseline numbers, the 3 to 5 most important tech debt items, which checks were set up and the recommended next step.
