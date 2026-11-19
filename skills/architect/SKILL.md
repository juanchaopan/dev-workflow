---
name: architect
description: The architect step of an issue, for any language, stack and platform. For "Set up the project" it asks all thirteen steps - metrics, components, technology choices, decision points and the task runner, code structure, deployment targets and infrastructure (existing or new, with monthly cost), data migration, how each component runs, static checks, test subjects and when they run, AI review and risk rules, dependency updates, platform settings, apps, environment variables and secrets; later issues ask only what they touch. Checks the result for holes and writes .docs/architecture.md and one decision record per decision. Use for "/architect <issue>" or when another step comes back to the architecture.
argument-hint: <issue number>
---

# Architect

Read `../issue/workflow.md` first. Every rule there applies here. This step changes only `.docs/architecture.md` and `.docs/decisions/`; its commits carry `Step: architect`.

## Scope

- The issue "Set up the project" goes through all thirteen steps below, in order.
- Every later issue goes through only the steps its change touches. A new library touches step 4; a new kind of data touches steps 7 and maybe 2 and 3; a new deployment target touches step 6; an external account a test needs touches step 13.
- When the brief must change, go back to the kickoff step first.

## The thirteen steps

Ask each step with multiple-choice questions. Each step's reference lists are named with it.

1. **Metrics.** Derive from the brief: scale, availability, consistency, cost, maintenance capacity. Then ask, one by one, whether the project has a metric for performance, resources, security, accessibility and compatibility; record only those it has.
2. **Components.** What the project is made of. A component is any part with its own runtime that starts on its own: a frontend or backend (choose the language or platform), a database or message queue (choose the product).
3. **Technology choices** for each component. Where an option is uncertain, suggest a `spike` issue through /change before deciding.
4. **Decision points** of each stack, such as the build tool, the checking tools and the data access approach; each component's libraries; and the task runner at the repository root: Task, just or Make, with what each needs on each operating system written into the options (for example, Make needs a separate install on Windows; just runs recipes in a POSIX shell by default).
5. **Code structure**: layers, modules, directories and naming, and the test rules for each layer. The structure is enforced later by the architecture rules check.
6. **Deployment targets.** Whether there is a staging environment; production always exists. For each target: where it is deployed, how, and its address, or that it has none (an app store, a package registry, software users install). Staging is deployed by CD after each merge to `main`; every target can also be deployed by a manually started deployment job, which is how production is deployed (/deploy). For each resource a target uses (database, storage, queue, hosting and so on), ask whether to use an existing one or create a new one; a new one's option states its size, region and rough monthly cost. Ask how infrastructure is built: by the provider's commands directly, or as infrastructure as code with a chosen tool (`references/infrastructure-tools.md`).
7. **Data to migrate** (`references/data-migration-tools.md`): which data outside the code must keep step with the code's version; for each kind, incremental migration or rebuild, the tool, where it runs, and the order when several kinds change together. See "Data migration" below.
8. **How each component runs**, on the developer's machine and in CI. First show the user the kinds of component and the ways each can run, without a recommendation; then ask, component by component, which product and which way:
   - kinds: web frontend, mobile app, desktop app, backend service, background worker or scheduled job, database, cache, message queue, object storage, search engine, reverse proxy or gateway, third-party service;
   - ways: natively on the machine with its runtime installed; in a container; in a device emulator or simulator; an emulator of a cloud service; a development instance of the managed service; a test double of a third-party service.
9. **Static checks** (`references/static-check-tools.md`). Ask subject by subject: format, lint, type check, compile and build, architecture rules, duplicate code, code security scan, dependency vulnerabilities, secret leaks, licenses, container and deployment configuration, commit message format (including the commit type matching the branch), the step check, document format, AI simplification, AI review, AI security review. Filter by stack; a subject the stack has no tool for is skipped with a one-sentence reason. Ask once per project which tool runs the git hooks.
10. **Tests** (`references/test-subjects.md`, `references/test-tools.md`). Ask subject by subject: unit, component, integration, contract, end-to-end, performance and load, security, migration. Then:
    - which subject checks each metric and testable requirement of the architecture and the brief;
    - for performance and load: which tool, and where the load comes from, the CI machine or a load-testing service (the cost in the option);
    - whether to add the automatic security scan;
    - for each subject and static check, the timings it runs at, from the seven: before commit, before push, before the PR, PR CI, after merging to `main`, after deploying to staging, before a release. The subjects at PR CI become required checks;
    - for local runs, whether each heavy subject runs in full or only what the agent judges affected. CI always runs everything. When the user chooses local-only or affected-only runs, point out the risk, and accept the choice.
    Write into the options roughly how many CI minutes a month each choice uses, against the plan's free minutes (`../issue/references/platforms.md`, "Plans and free CI minutes").
11. **AI review** (`../implement/references/claude-code.md`): which level `/code-review` runs at, and whether it runs in CI as well; the content of `REVIEW.md`, confirmed item by item: code structure rules, conventions no tool can check, the language of review comments. **Risk rules** (`references/risk-rules.md`): which paths are high risk and which are low risk.
12. **Dependency updates** (`references/dependency-updates.md`): which tool and how it is set up, including the commit types of its PR titles (`fix(deps)` for what the product runs, `chore(deps)` for the rest).
13. **Platform settings** (`../issue/references/platforms.md`): branch rules, required checks, whether remote issue branches are kept forever (recommended), and the apps to install on the platform, such as the AI review app and the dependency update tool's app. **Environment variables and secrets**, one by one: name, purpose, which environments need it, and where its value comes from: generated at random, produced when a resource is created, or supplied by the user. They include the AI review's API key, the tokens the platform's fallbacks need, and the credentials of each external account a test needs, whose name is asked here. Where the plan cannot keep secrets per environment, the name carries the environment, such as `STAGING_DB_URL` and `PROD_DB_URL`. The scaffold step applies all of this.

### Dependencies

`.docs/architecture.md` lists each component's libraries, one per line: name, purpose, license. No versions; versions live only in the manifests and lock files. Libraries a generator adds are not listed; name the generator instead. Every direct dependency added later is listed.

### Data migration

- Migrated data is data outside the code whose version must match the code's: databases, files in object storage or on file systems, data and files kept on users' devices. Messages are not migrated (drain the queue before switching); neither are configuration and secrets.
- Data not fully produced by the code, including dictionary tables users edit, is migrated incrementally: versioned scripts in the repository, applied in order from the data's current version, so skipping versions still works. A merged script never changes; a mistake gets a new script.
- Data fully produced by the code (search indexes, caches, generated tables) is rebuilt, by a separate rebuild command run together with the migration command.
- The tool for a kind of data is chosen when that kind first appears, from the tools for that kind of data on the project's stack; its `V1` script creates it.
- Where migrations run: staging during the CD deployment; production in its deployment job, started by /deploy, with downtime allowed; users' devices and customer-run installations at start-up after install; developers' machines and test databases when the database is created.
- When an issue changes several kinds of data, each runs its own migration; propose the order and ask.

## After the questions

Check the whole architecture for contradictions and gaps on your own. Do not ask the user more questions about it; tell them what you found.

## Output

- `.docs/architecture.md`, with an architecture diagram and these sections, each holding what the steps decided: metrics; components; technology choices and decision points; libraries per component; code structure; deployment targets; data migration; how components run; static checks; tests (subjects, which metric each checks, timings, local run scope); review standards and risk rules; dependency updates; platform settings, apps, environment variables and secrets.
- The section **Deployment targets** has one row per target: name, where it is deployed, address (or none), and the resources it uses. /deploy and /perf-test read it. A new resource's address is filled in when the scaffold step has created it and comes back to this step.
- One decision record per decision, `.docs/decisions/<nnnn>-<short-name>.md`: context, options compared, decision, reasons, costs, when to revisit. Write them from the answers without asking anything more.

End each document with `Last changed: #<issue> (<date>)`, commit with `Step: architect`, push, and comment on the issue.
