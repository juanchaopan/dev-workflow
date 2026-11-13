---
name: scaffold
description: Creates the project from docs/architecture/: generates each component with its official generator on the latest versions (runtimes on the current LTS, nothing hard-coded; when a tool lags behind a new major, explains it and lets the user choose), installs the standards library's code standards, architecture checks, lint and formatting per the architecture's decision points, plus design tokens, Storybook and visual regression tests when chosen, and project commands that run the tests needing a database or another service, and the visual checks, in throwaway containers; writes a multi-instance docker compose setup and the deployment pipeline (staging, production, PR previews); creates the GitHub repository and runs /setup-ai-review. Can also add a stack's standards to an existing project with a baseline. Stacks: Angular, Spring Boot (Maven or Gradle), Python, React (TypeScript), Node.js (TypeScript), .NET Blazor. Use after /design; followed by /roadmap.
---

# Creating the project

This skill's directory (the Base directory shown when the skill loads) contains:

- `stacks/<stack>/`: the standards library, one directory per stack.
  - `stack.md`: how to recognize it, required tools, decision points, versions, how to create it, which standards and checks to install afterwards, self-check commands, format hook rules, CI steps, where the version number lives, references.
  - `rules.md`: code standards for AI, including layering rules, copied to the project's `.claude/rules/`.
  - `files/`: lint, formatting and architecture check configuration, copied to the component directory.
- `shared/`: what several stacks share.
  - `versions.mjs`: looks versions up: the current LTS of a runtime; the highest version of an npm package that a given set of tools supports.
  - `arch-check.mjs`: wrapper around dependency-cruiser (used by Angular, React and Node).
  - `visual-testing.md`, `playwright.config.ts`: design tokens, Storybook, visual regression tests.
  - `deployment.md`, `deploy.yml`: environments, deployment platforms, PR previews and the deployment pipeline.
- `common/`: files every project root needs (`.editorconfig`, `.gitattributes`, `.gitignore`, the feature request issue template).

## Two uses

- **New project**: steps 0 to 11. This includes the new system of a rewrite, which /onboard documented the old one for.
- **Add standards to an existing project** (asked by the user, or called by /onboard): steps 0, 4, 5 and 10. Recognize stacks with the "How to recognize it" section of each `stack.md`. Do not overwrite existing configuration files: compare them, tell the user how you plan to merge, and change them after approval. When the directory structure does not match the library's layering conventions, do not move code around on a large scale; install the tools and rules first and record existing violations as a baseline as in step 8 of the onboard skill. Changes go through a branch and /open-pr.

Talk to the user in their language. Project documents follow the project's document language (the `Language` line in its CLAUDE.md, otherwise the user's language).

## Versions: looked up, never hard-coded; the user decides trade-offs

A new project should use the latest versions of the day it is created, and this library cannot know what those are, so no version number is written into its documents or configuration; everything is looked up on the spot:

| What | How |
|---|---|
| Runtimes (Node.js, Java, .NET) | The current LTS: `node <this skill's directory>/shared/versions.mjs lts <product>`, with the products `nodejs`, `eclipse-temurin`, `dotnet` |
| Python | The latest stable release: `node <this skill's directory>/shared/versions.mjs lts python` |
| Generators | `@latest`, or the generator's own latest (e.g. `npx -y @angular/cli@latest`, Spring Initializr's defaults) |
| Libraries and tools | The latest release |
| Maven plugins and dependencies | `<release>` in the Maven Central metadata; see the Spring Boot `stack.md` |

The library picks tools that do not constrain versions where it can (e.g. architecture checks parse source with SWC and Node.js linting defaults to Oxlint, neither of which depends on the TypeScript JS API), so most of the time the latest release is used without asking.

When there is a conflict, the user decides; do not choose for them. When a chosen tool does not support a new major release yet (the "Versions" section of `stack.md` says how to check with `versions.mjs npm <package> <tools>...`), stop and tell the user: what the latest release is, up to which version the tool supports it, and why. Then let them choose with AskUserQuestion:

- Use the latest release and switch to a tool or configuration that already supports it (listed in `stack.md`); say what is lost by switching.
- Keep the tool and use the highest version it supports; say how far behind that is. Once the tool catches up, Dependabot brings existing projects along (step 10).

Record the choice and the reasons in the component's technical details ADR. Never pin an old version on your own, and never quietly switch a check off to use a newer version. Versions tied to a framework (e.g. TypeScript in Angular and NestJS) follow the framework and are not upgraded separately.

## Steps

### 0. Read the design

Read `docs/architecture/overview.md` and `docs/adr/` and list every component: name, directory, stack, the decision points recorded in the ADRs (build tool, lint tool, data access, component layering, Storybook and visual regression tests, and so on) and the deployment. Without architecture documents, tell the user to run /architect first. When an ADR leaves a decision point open, ask the user with the recommended option from the `stack.md` decision table. When a component's stack is not in the library, tell the user it can still be created, but a set of standards must be added (write one modeled on a directory in `stacks/`, at least lint, formatting and an architecture check).

Then read `docs/design/README.md`: `docs/design/screens/tokens.css`, used by the screen prototypes, is the source of the frontend design tokens. When a new project has no `docs/design/` yet, remind the user to run /design before /roadmap splits issues; they may still create the project first.

### 1. Confirm the directory structure

Default structure for a monorepo with several components:

```
<project>/
├── apps/<component>/   every independently deployable component
├── libs/<name>/        code shared between components (only when needed)
├── infra/              docker-compose.yml, deployment configuration
├── docs/               requirements, architecture, design, decisions, roadmap
├── .claude/rules/      code standards per component
└── .github/            CI, review, deployment, templates
```

With a single component it can live at the repository root. Show the user the tree and create it after confirmation.

### 2. Check tools and versions

Check each stack's "Required tools" in `stack.md`, e.g. `node --version`, `java --version`, `dotnet --version`, `uv --version`, `docker --version`. Compare runtimes with the current LTS from the "Versions" section: when the local one is older, tell the user the current LTS and how to upgrade, and let them decide whether to upgrade first or create the project with the local version (when an ADR chose a different version, follow the ADR). Tell the user how to install missing tools; never install system software yourself.

Then check each `stack.md` "Versions" section for conflicts, and when there is one, let the user choose as described there.

### 3. Create the components

For each component, generate the project in its directory with the "Create" commands of `stack.md`. Use the official generators; never hand-write a project skeleton. When a generator asks questions, answer them with arguments or take the defaults.

### 4. Install standards and checks

For each component, do every step of the "After creating" section of `stack.md`, following the branch the decision points chose (e.g. Maven or Gradle, Oxlint or typescript-eslint). That covers:

- lint, formatting, and complexity and length limits;
- the architecture check (dependency-cruiser, ArchUnit, import-linter or ArchUnitNET) and the layered directories `rules.md` prescribes;
- copying `rules.md` to `.claude/rules/<component>.md`, replacing the `paths` placeholder in its frontmatter with the component directory and filling in placeholders such as component and package names in the body;
- Storybook and visual regression tests when the decision points chose them, from the "Optional" sections of `stack.md` and `shared/visual-testing.md`, including the project's own visual command that `visual-testing.md` describes;
- design tokens (with a frontend): create `src/styles/tokens.(s)css`. When there is a `docs/design/screens/tokens.css`, use its variable names and values so the implemented screens match the confirmed prototypes; with design files, take the values from them; otherwise start with a basic set of colors, font sizes and spacing;
- when the component's tests need a database or another service (cache, message queue and the like), a project command that runs them locally against a throwaway container: the same image and version as CI, a random password, bound to 127.0.0.1 on a free port, the same databases CI creates, migrations first, the container removed afterwards whether the run passed or failed. It does the whole sequence in one command, and CLAUDE.md lists it among the self-check commands and the heavy checks.

Finally run every self-check command of `stack.md` in the component directory; all must pass. When generated code violates the standards (architecture checks and complexity limits included), fix it until it complies; do not relax the rules.

### 5. Common root files

Copy the files in `common/` to the repository root, merging with existing ones. Keep the `.gitignore` files generators create in component directories; the root one holds only common entries.

### 6. Local environment

Write `infra/docker-compose.yml` following the deployment design in the architecture:

- One service per component, built from the component's Dockerfile (a multi-stage Dockerfile in the stack's usual style, with a base image on the component's runtime version).
- Stateless components get several instances as designed (`deploy.replicas`) behind a reverse proxy that load-balances, so several instances can be seen locally.
- Databases, caches, message queues and other dependencies use official images with data in named volumes.
- Every service has a health check; dependencies use `depends_on` with `condition: service_healthy`.
- Configuration comes in through environment variables, with example values in `infra/.env.example`; the real `.env` is never committed.

Check it with `docker compose -f infra/docker-compose.yml config`. Ask the user whether to start it now.

### 7. Deployment pipeline

Following the deployment chosen in the architecture and `shared/deployment.md`:

- Platforms that need a workflow: write `.github/workflows/deploy.yml` from `shared/deploy.yml` with the integration branch (develop for Git Flow, main for GitHub Flow), the component list and the platform's deployment steps.
- Platforms with their own Git integration (e.g. static hosting): no workflow; list the settings the user makes on the platform's website (connect the repository, component directory, build command, which branch deploys to which environment, PR previews).
- List what the user must do: create the platform account, create `staging` and `production` environments on GitHub, set Required reviewers on `production`, store the platform token as an environment secret.

### 8. Commit

Split into several Conventional Commits, each doing one thing, e.g.:

- `chore: initialize the repository structure`
- `feat(<component>): generate the <stack> skeleton with <generator>` (one per component)
- `build(<component>): add code standards, architecture checks and lint configuration` (one per component)
- `build(infra): add the local docker compose environment`
- `ci: add the deployment pipeline`

Keep the document commits /kickoff, /architect and /design already made.

### 9. GitHub repository

Ask the user whether the repository is public or private (private repositories on GitHub Free cannot use branch rules or manual approval for production, so the workflow relies on discipline) and what to call it. After approval run `gh repo create <name> --<public or private> --source . --push`.

### 10. Set up the review workflow

Run `setup-ai-review` with the Skill tool. Tell it: this project was just created by /scaffold (or just got its standards); components, directories, self-check commands and CI steps are in each stack's `stack.md`; `.claude/hooks/format.config.json` follows the "Format hook rule" of each `stack.md`, with each rule's `dir` set to the component directory; Dependabot is configured per component package manager, and npm components keep the template's group that upgrades the TypeScript toolchain together. Heavy checks (end-to-end tests, tests that need a database, visual regression tests) go into the "Heavy checks" line of CLAUDE.md, each with what it holds: fixed ports, output directories, whether it uses containers, roughly how much memory.

### 11. Report and next step

Report: the components created, the versions used (runtimes, frameworks, TypeScript, and so on), any version trade-offs and the user's choices, the standards and checks each component got, the decision point results, the self-check results, how to start it locally, the deployment pipeline and the platform settings the user still has to make, and the repository URL. Tell the user to run /roadmap next to split requirements and design into issues; if /design has not been done yet, run /design first.
