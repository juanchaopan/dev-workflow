# dev-workflow: a general-purpose AI development workflow

A Claude Code plugin that takes a project from "I have an idea" (or "I inherited a pile of old code") through requirements, architecture, detailed design, project skeleton and plan, to developing, reviewing, merging and releasing feature after feature. For individual developers and small teams, with any stack, for new and existing projects.

The skills hand over to each other through documents in the project repository, not conversation memory: `docs/` (requirements, architecture, design, decisions, roadmap) and `CLAUDE.md` (components, commands, standards, branching strategy). What you discuss today and what you discuss in three months, the AI reads the same "project truth".

The plugin itself is written in English. It talks to you in your language, and writes project documents in the language your project's CLAUDE.md sets (by default, the language you talk to it in).

## Installation

**On your own machine**: put this folder at `~/.claude/skills/dev-workflow/`, and Claude Code loads it as a plugin automatically (`claude plugin list` shows `dev-workflow@skills-dir`). A folder copied or cloned there does not update by itself; pull it after each change, or install it from GitHub as below.

**From GitHub** (updates through the marketplace): run in Claude Code:

```
/plugin marketplace add <your GitHub user>/<repository>
/plugin install dev-workflow@dev-workflow
```

Update with `/plugin marketplace update dev-workflow`, or turn on auto-update for the marketplace in `/plugin`.

Type commands such as `/kickoff` or `/implement` in Claude Code; when another plugin has the same name, add the plugin name: `/dev-workflow:kickoff`. Without a command, Claude also picks the right skill from what you say. Each session loads the skill summaries, roughly 2,500 tokens.

## Workflow

```
New project:
  /kickoff ──► /architect ──► /design ──► /scaffold ──► /roadmap ──► /implement (next or batch) ──► /release
  requirements  stack and       screens,      project and    issues        develop → PR → review → merge   release
                architecture    data and      standards
                                interfaces    + /setup-ai-review
                                confirmed one
                                by one

Existing project:
  /onboard ──► gathers evidence of what the old system does (not trusted), baseline, you choose a direction
     ├── maintain:   /change ──► /design redesigns each touched element from the evidence ──► /implement
     ├── extend:     /kickoff ──► /design ──► /roadmap ──► /implement
     ├── modernize:  /kickoff ──► /architect (target + migration) ──► /design (everything in scope) ──► /roadmap ──► /implement
     └── rewrite:    /kickoff ──► /architect ──► /design (everything) ──► /scaffold ──► /roadmap (incl. data migration, cutover)

Every new idea or issue afterwards:
  /change ──► by requirement level (L0–L4) and design impact (D0–D2) ──► changes to screens, data or interfaces go through /design ──► issues ──► /implement

Whenever unsure (any stage):
  /spike ──► time-boxed verification ──► evidence for you ──► you decide ──► ADR ──► real implementation
```

| Skill | What it does | What you do |
|---|---|---|
| `/kickoff` | From an idea, existing code, a document or a problem: rounds of multiple-choice questions on goals, the feature list, business rules and scale, finds logical holes, writes the requirements. For old systems: what to keep, change or drop, whether screens and style are redone, findings that change requirements | Answer; confirm the requirements |
| `/onboard` | Takes over an existing project without trusting it: inventory, whether it builds and runs, current architecture and its contradictions, features in use, the full current design (real screenshots, fields as enforced on screen, server and database, actual data, interfaces and their callers, business rules buried in code), findings (suspected bugs, contradictions, dirty data), quality baseline; standards set up with a baseline when the old code stays | Say which features are still used; choose maintain, extend, modernize or rewrite |
| `/architect` | Architecture metrics, choices layer by layer, each stack's detailed decisions (e.g. Maven or Gradle, Oxlint or typescript-eslint), deployment and PR previews, visual verification, distributed design, migration plans with data migration and cutover | Choose technologies; confirm the architecture |
| `/design` | Screens (type, required, length, validation and error message of every field), data (tables and columns, or file formats), interfaces, permissions, complex logic; every screen drawn as a prototype screenshot and confirmed with you one at a time; for old systems each screen next to its real screenshot, with every old rule and finding kept, changed or dropped by you, and the data migration mapped; checks requirement coverage, the CRUD matrix and the permission matrix | Look at screenshots, comment, confirm each screen; decide on old rules; confirm data and interfaces |
| `/spike` | Time-boxed spikes: question and criteria, minimal implementation, evidence, conclusion as an ADR, code thrown away | Try it, decide |
| `/scaffold` | Generates components with official generators on the latest versions (looked up, never hard-coded), installs code standards and architecture checks, writes docker compose and the deployment pipeline, creates the repository, sets up the review workflow | Confirm the structure; choose when a tool lags behind a new version; register the deployment platform |
| `/setup-ai-review` | CI, AI code review, security review, risk tiers, commit message checks, duplicate code detection, automatic dependency updates, `@claude` | Choose the branching strategy; store the secret |
| `/roadmap` | Milestones and issues from requirements and design, one small PR per issue, acceptance criteria taken from the design; spikes and the skeleton first; for old systems characterization tests, data migration rehearsals and cutover | Confirm scope and order |
| `/implement` | Branch, refactor first when needed, small "test → implement → refactor" commits (tests derived from the design's rules), screens compared with the confirmed screenshots, PR, review handling, automatic merge. `batch` develops several issues in parallel with one subagent each | Choose which issues go into a batch; answer plan questions; read the diff of medium and high risk PRs and add `human-reviewed` |
| `/change` | Rates a new idea twice — how much the requirements change, how hard it hits the code structure — asks, updates requirements and design, has changed screens confirmed again, splits issues | Confirm the levels; answer; confirm changed screens |
| `/release` | Computes the version, writes the CHANGELOG, runs the release branch, tags, creates the Release, follows the production deployment | Confirm the version; approve the production deployment |

## How far each step goes

| Stage | What gets settled | Skill |
|---|---|---|
| Requirements | What the system does, for whom, the feature list, business rules, scale and scope | /kickoff |
| Architecture | Which technologies, which components, who owns which data, how it is deployed | /architect |
| Design (basic and detailed) | What each screen looks like; type, required, length, validation and error message of every field; every column of every table (or the format of files and configuration without a database); parameters and errors of every interface; permissions; state transitions, decision tables, calculations | /design |
| Code internals | How classes and functions are split | /implement, within the standards and architecture checks, not written in advance |

Requirements stop at the requirement level; fields, validation and table structure wait for /design, when the technology is chosen and every screen can actually be drawn for you. /roadmap splits issues from the design, so each issue cites specific screens, interfaces and rules and nobody has to guess.

How screens are confirmed: the AI writes an HTML prototype of every state of every screen (normal, validation errors, empty data...), renders it to PNG with Playwright's bundled Chromium (free, no external service), opens it in your image viewer and lists the screen's fields in the conversation. You comment or ask questions directly, the AI revises and renders again, and once you confirm, it moves to the next screen. Development starts only after every screen is confirmed, and the confirmed screenshots are committed as the reference for development and review. Progress is saved and committed after every confirmed screen, so you can compact the conversation or stop at any time; running /design again continues where it left off.

## Taking over an old system

An old system's code may have bugs, parts may not run, its architecture may contradict itself, and its screens may be redone completely, so nothing it does is taken as correct. But only the old system knows its hidden business rules, what its data really means and who depends on its interfaces; requirement interviews alone miss them, and that is how rewrites lose features. So the work is split:

1. **/onboard gathers evidence** in `docs/design/as-is/`, area by area: every screen (captured from the running system with Playwright when it runs; `--storage` handles sign-in), each field's required flag, length and validation as enforced separately on screen, server and database, the tables and what the data actually contains (aggregate profiling on a copy, with your permission), interfaces and who calls them, scheduled jobs, and the business rules buried in code with their location. Everything is marked observed, inferred from code or conflicting, and whatever looks wrong becomes a finding with its evidence, undecided. You are not asked to confirm the old design, only what only you know, e.g. whether a screen is still used.
2. **/kickoff decides the direction**: what to keep, change or drop, whether the screens, controls or style are redone, and the findings that change requirements (e.g. a hidden rule users depend on).
3. **/design builds the target design from the evidence**: each screen is shown next to its real screenshot; every old field rule, business rule and finding touching it gets your decision — keep, change or drop — so nothing is carried over or lost silently; the data design maps every old column that holds data, including what happens to dirty data; interfaces with outside callers get a compatibility decision.
4. **/roadmap** adds characterization tests for kept code, data migration rehearsals and cutover; kept rules' worked examples become test cases.

## Versions

Nothing in the plugin pins a version. When /scaffold creates a project it looks versions up on the spot: runtimes (Node.js, Java, .NET) on their current LTS, Python on its latest release, libraries and tools on their latest release. The standards library prefers tools that do not hold versions back (architecture checks parse with SWC; Node.js linting defaults to Oxlint in type-aware mode), so new majors such as TypeScript 7 are used right away. When a tool you chose does not support a new major yet, /scaffold explains the situation and lets you choose: switch tools, or stay a version behind until the tool catches up (Dependabot then upgrades them together).

## Developing several issues at once

`/implement batch` (or `/implement 128 133 134`) develops a batch of issues whose dependencies are done in parallel. A batch holds at most as many issues as run at once, four unless you ask for more; when more are ready, you choose which go into this batch, and the rest wait for the next `/implement batch` instead of starting when a slot frees up. This session coordinates; each issue gets a background subagent in its own git worktree. The subagents plan first, and you answer all their questions in one place; the merge order is fixed up front so the result equals doing the issues one by one; later PRs rebase onto what merged before them; heavy checks such as end-to-end and Docker visual tests queue behind a lock. Each subagent stops when its PR is green and reviewed, and the coordinator tells you which PRs need your review, wakes the next one after each merge, and summarizes the batch with the issues the next batch would pick up.

## Where you step in

1. **Answering questions and choosing**: /kickoff, /architect, /design, /change and /spike ask you, with a recommended option.
2. **Confirming screens**: /design shows you each screen's screenshots; you comment and ask until you are satisfied.
3. **Deciding on old behavior**: for a taken-over system, /kickoff and /design ask you whether each old rule and finding is kept, changed or dropped.
4. **Confirming documents**: requirements, architecture, data, interfaces and plans are shown to you when written.
5. **Verifying spikes**: open the URL, look at the evidence, adopt or drop.
6. **Medium and high risk PRs**: read the diff yourself and add the `human-reviewed` label. Low risk merges automatically.
7. **Releases**: confirm the version, add `human-reviewed` to the release PR, approve the production deployment.
8. **When the AI is unsure**: where business rules, architecture or design leave something open, the AI stops and asks instead of deciding.

## Common scenarios

**A new idea**: say `/change I want users to export their orders` in Claude Code. It rates the change, asks, updates the requirements, draws new prototypes for changed screens for you to confirm, splits issues, then `/implement <issue>`. You can also record an issue with the "Feature" template on GitHub or your phone and run `/change #45` back at your computer. For small, clearly described changes, comment `@claude implement this` on the issue and it is done in the cloud.

**An idea that reshapes existing classes and interfaces**: /change rates it D2, writes a redesign in `docs/design/refactor/` for you to confirm, then splits it into "characterization tests → refactor → expand with new interfaces → migrate callers → remove old interfaces → feature", small PRs that can each ship on their own.

**A complex, uncertain idea**: /kickoff, /architect, /design and /change suggest /spike first. UI spikes give you a URL to open (local, or a PR preview environment) to try yourself before deciding; spike code never enters the main branch, the conclusion goes into an ADR, and the real implementation follows the normal workflow.

**Taking over an old project to modernize or rewrite it**: see "Taking over an old system" above. /onboard gathers the evidence and you choose the direction; /kickoff (existing code entry) settles the goals and what to keep; /architect designs the target and the migration steps that ship one at a time (e.g. strangler fig), with data migration and cutover; /design redesigns every screen, table and interface from the evidence with your decisions on every old rule; /roadmap splits the migration into issues.

## Where the code standards come from

`skills/scaffold/stacks/` is the standards library, one set per stack, in three parts:

| Part | Content | Enforced by |
|---|---|---|
| Tool checks | Lint, formatting, complexity and function length limits: Angular with angular-eslint and Prettier, Spring Boot with Spotless, Checkstyle and PMD, Python with ruff and mypy, React with oxlint and Prettier, Node.js with Oxlint (type-aware) or typescript-eslint and Prettier, .NET with `.editorconfig`, `dotnet format` and analyzers | The format hook (after every changed file) and CI |
| Architecture checks | Layering rules: frontend pages (containers) apart from presentational components, which never call APIs; backend controller → service → repository; a domain layer free of frameworks; features that do not reference each other; no circular dependencies. dependency-cruiser for Angular, React and Node.js, ArchUnit for Spring Boot, import-linter for Python, ArchUnitNET for .NET | Self-check commands and CI; violations fail |
| Judgment rules | `rules.md`: what tools cannot check, distilled from official style guides, the Google style guides, the Alibaba Java Coding Guidelines, Microsoft's coding conventions and common layering practice | Installed into the project's `.claude/rules/`, read by Claude when it changes matching directories, and used by the AI reviewer |

Each stack's `stack.md` also lists "decision points" (e.g. build tool, lint tool, state management, data access) that /architect asks you instead of hard-coding them, and a "Versions" section on how versions are looked up. To add a stack, write a set modeled on any directory — `stack.md`, `rules.md`, `files/` — plus a `tests/stacks/<stack>.sh` smoke test.

## Keeping code from turning into patchwork

| Point | How |
|---|---|
| Design | /design settles screens, data, interfaces and rules up front, so nothing is guessed while coding; /change assesses design impact and, when the structure cannot take a change, writes a redesign and refactors before adding the feature |
| Writing code | "How to write code" in the project's CLAUDE.md; every /implement step is "test → implement → refactor" |
| After writing | /open-pr runs a `simplify` pass first |
| Review | "Patchwork and bloat" in REVIEW.md, which the AI reviewer checks specifically; it also checks behavior against `docs/design/` |
| Machine checks | Complexity and length limits, jscpd duplicate detection, architecture checks; changes to lint and architecture check configuration are always high risk, so rules are never relaxed to fit the code |

## Visuals and layout

What a screen should look like is defined by design files (when you have them; Claude can read Figma through its MCP server) or by the prototype screenshots confirmed in /design. Colors, font sizes and spacing become design tokens with the same values as the prototypes' `tokens.css`; /implement puts the implemented screen next to the prototype screenshot in the PR; presentational components are checked one by one in Storybook; visual regression tests compare Playwright screenshots, and an unexpected change fails the PR with comparison images. See `skills/scaffold/shared/visual-testing.md`.

## Maintenance and upgrades

Tools and generators change every few months (e.g. create-vite moved from ESLint to oxlint, TypeScript 7 shipped without a JS API, PMD renamed rules). The plugin checks itself:

```
node --test "tests/*.test.mjs"                     # unit tests of the scripts installed into projects, seconds
RENDER_SMOKE=1 node --test "tests/*.test.mjs"      # plus real screenshots by the prototype renderer and the screen capture; downloads Chromium the first time
bash tests/stacks/<stack>.sh                        # one stack's smoke test, creates a real project, minutes
BUILD_TOOL=gradle bash tests/stacks/spring-boot.sh
LINT=eslint bash tests/stacks/node-ts.sh
```

Once pushed to GitHub, `.github/workflows/self-test.yml` runs every stack every Monday with the versions a project created that week would get (the current LTS runtimes, the latest tools), and opens an issue when something fails. To fix it, tell Claude Code which stack broke and paste the log; have it update that stack's `stack.md` and configuration, then run the smoke test again. Never fix it by pinning an old version.

Each project's own Dependabot checks its dependencies weekly.

After changing the plugin, commit with Conventional Commits and bump the version in `.claude-plugin/plugin.json` following semantic versioning.

## Not verified automatically

These are in the documents and templates but need real accounts or environments, so the smoke tests do not run them; watch them the first time:

- The deployment pipeline (`skills/scaffold/shared/deploy.yml`) and each platform's PR previews.
- Generating visual regression baselines in Docker (Docker Desktop must be running).
- The GitHub workflows: AI review, security review, `@claude`, Dependabot, branch rules. They only run in a real repository.
- Parallel development with `/implement batch`, which depends on Claude Code's subagents and worktrees in a real project.
- /onboard on a real legacy system: capturing screens behind a sign-in, data profiling on a database copy, and the subagent split by area.
