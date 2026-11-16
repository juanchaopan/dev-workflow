---
name: scaffold
description: Creates the project from docs/architecture/ and the design of the stage's scope: generates each component the stage uses with its official generator on the latest versions (runtimes on the current LTS, nothing hard-coded; when a tool lags behind a new major, explains it and lets the user choose), installs the standards library's code standards, architecture checks, lint and formatting per the architecture's decision points, plus design tokens, Storybook and visual regression tests when chosen, and for every kind of test the architecture chose (unit, component, integration, end-to-end, snapshot, delivery, non-functional) the project command that prepares and removes its own throwaway environment, configurable ports and paths, a way to run only the tests a change affects and a CI job; writes a multi-instance docker compose setup and the deployment pipeline (staging, production, PR previews); in the first stage creates the GitHub repository and pushes the spike branches and tags kept local; runs /setup-ai-review. Can also add a stack's standards to an existing project with a baseline, or add a component or test kind for a later stage without recreating the repository. Stacks: Angular, Spring Boot (Maven or Gradle), Python, React (TypeScript), Node.js (TypeScript), .NET Blazor. Use after /design for the first stage; /change calls it for a later stage that needs a component, deployment target or test kind; followed by /roadmap.
---

# Creating the project

This skill's directory (the Base directory shown when the skill loads) contains:

- `stacks/<stack>/`: the standards library, one directory per stack.
  - `stack.md`: how to recognize it, required tools, decision points, versions, how to create it, which standards and checks to install afterwards, self-check commands, how each kind of test is done on the stack, format hook rules, CI steps, where the version number lives, references.
  - `rules.md`: code standards for AI, including layering rules, copied to the project's `.claude/rules/`.
  - `files/`: lint, formatting and architecture check configuration, copied to the component directory.
- `shared/`: what several stacks share.
  - `versions.mjs`: looks versions up: the current LTS of a runtime; the highest version of an npm package that a given set of tools supports.
  - `arch-check.mjs`: wrapper around dependency-cruiser (used by Angular, React and Node).
  - `testing.md`: the kinds of tests, how a project chooses them, what runs at each stage, how to stay thorough without being slow, and the size of PRs. Every skill that talks about tests refers to it.
  - `visual-testing.md`, `playwright.config.ts`: design tokens, Storybook, visual regression tests.
  - `deployment.md`, `deploy.yml`: environments, deployment platforms, PR previews and the deployment pipeline.
- `common/`: files every project root needs (`.editorconfig`, `.gitattributes`, `.gitignore`, the feature request issue template).

## Two uses

- **First stage of a project**: steps 0 to 11. The stage's scope comes from `docs/product/` (the stage's scope written by /kickoff). This use creates the repository once, and the components, standards, tests, compose file, deployment pipeline and review workflow that the stage's scope needs. Components that the architecture lists but the stage does not use are not created; the report names them and the stage that creates them.
- **Add to an existing project**, in one of two modes:
  - **Add standards with a baseline** (asked by the user, or called by /onboard): steps 0, 4, 5 and 10. Recognize stacks with the "How to recognize it" section of each `stack.md`. Do not overwrite existing configuration files: compare them, tell the user how you plan to merge, and change them after approval. When the directory structure does not match the library's layering conventions, do not move code around on a large scale; install the tools and rules first and record existing violations as a baseline as in step 8 of the onboard skill. Changes go through a branch and /open-pr.
  - **Add a component or a test kind for a later stage** (called by /change): steps 0, 2, 3, 4, 6, 7, 8, 10 and 11, only for the component or the test kind the change names. The repository, the common root files, the CI basics and the GitHub repository already exist: do not recreate them (skip steps 5 and 9). The compose file, the deployment workflow and CI get an entry for the added part only. Changes go through the issue's branch as in /implement.

Talk to the user in their language. Project documents follow the project's document language (the `Language` line in its CLAUDE.md, otherwise the user's language).

## Versions: looked up, never hard-coded; the user decides trade-offs

A project is created on the latest versions of the day it is created. This library cannot know what those are, so no version number is written into its documents or configuration; everything is looked up on the spot:

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

### 0. Read the architecture and the design of the scope

Read the stage's scope in `docs/product/` (the vision or roadmap document names what this stage builds and what is left for later). Read `docs/architecture/overview.md` and `docs/adr/`, and list every component the stage uses: name, directory, stack, the decision points recorded in the ADRs (build tool, lint tool, data access, component layering, Storybook and visual regression tests, and so on), the kinds of tests the architecture chose for it and the deployment. Components the architecture lists that the scope does not use are noted for the report and left for later stages. In the add mode for a later stage, the component or test kind the change names replaces the stage scope, and the ADRs that decide it are read in full. Without architecture documents, tell the user to run /architect first. When an ADR leaves a decision point open, ask the user with the recommended option from the `stack.md` decision table; when it does not say which kinds of tests the project uses, ask the seven questions of `shared/testing.md` ("Choosing kinds"). When a component's stack is not in the library, tell the user it can still be created, but a set of standards must be added (write one modeled on a directory in `stacks/`, at least lint, formatting and an architecture check).

Then read the design of the scope: `docs/design/README.md` and the element files of the modules in the scope. `docs/design/screens/tokens.css`, used by the screen prototypes, is the source of the frontend design tokens. Designs of modules outside the scope are not read here. When the scope has no design yet, remind the user to run /design for the scope before /roadmap splits issues; they may still create the project first.

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

With a single component it can live at the repository root. Only the components the scope uses get a directory. If the directory is not yet a git repository, initialize one with `main` as the default branch. Show the user the tree and create it after confirmation.

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
- design tokens (with a frontend): create `src/styles/tokens.(s)css`. When there is a `docs/design/screens/tokens.css`, use its variable names and values so the implemented screens match the confirmed prototypes; with design files, take the values from them; otherwise start with a basic set of colors, font sizes and spacing.

**Tests, kind by kind.** For every kind of test the architecture chose for the component (`shared/testing.md`), set up how it runs, following the "Tests by kind" section of the stack's `stack.md`, and give it:

- a first working test that fails when the code is wrong, so the setup is proven (unit, component and the like start with the smoke test `stack.md` describes);
- for each heavy kind (integration, end-to-end, snapshot, delivery, non-functional), one project command (an npm script, a Makefile target or a script file) that does the whole sequence in one go: prepare its own throwaway environment, run, and remove what it started whether the run passed or failed. A kind that needs a database or another service uses the same image and version as CI, a random password, 127.0.0.1 on a free port, the same databases CI creates, and migrations first. Browser tests that need the database run through it too;
- configurable ports and paths: every port or directory a check needs comes from an environment variable with a default, never a value fixed in the code. End-to-end and preview servers read it in the test configuration (`E2E_PORT` in `shared/playwright.config.ts`); the database command picks a free port itself and passes it to the tests the same way. A server or test that can only use a fixed port is the exception: CLAUDE.md names it as holding that port;
- the way to run only what a change affects: the test tool's own option when it has one, otherwise a mapping from directories to test files, written in the project and named in CLAUDE.md;
- the CI job of the kind, from the stack's "CI steps" and `testing.md` ("What each kind needs from the project"), with the environment matrix of the stage table where it asks for one; a scheduled workflow for non-functional tests.

Finally run every self-check command of `stack.md` in the component directory, and each heavy command once; all must pass, and `docker ps` shows nothing they started. When generated code violates the standards (architecture checks and complexity limits included), fix it until it complies; do not relax the rules.

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

- Platforms that need a workflow: write `.github/workflows/deploy.yml` from `shared/deploy.yml` with the integration branch (develop for Git Flow, main for GitHub Flow), the component list and the platform's deployment steps. In the add mode, only the added component's entry is added to the existing workflow.
- Platforms with their own Git integration (e.g. static hosting): no workflow; list the settings the user makes on the platform's website (connect the repository, component directory, build command, which branch deploys to which environment, PR previews).
- List what the user must do: create the platform account, create `staging` and `production` environments on GitHub, set Required reviewers on `production`, store the platform token as an environment secret.
- With the delivery kind: deploying to staging is one delivery test, so the pipeline runs the project's smoke flows (end-to-end, key flows only) against staging after the deployment.

### 8. Commit

Split into several Conventional Commits, each doing one thing, e.g.:

- `chore: initialize the repository structure`
- `feat(<component>): generate the <stack> skeleton with <generator>` (one per component)
- `build(<component>): add code standards, architecture checks and lint configuration` (one per component)
- `test(<component>): add the <kind> test setup and its project command` (one per heavy kind)
- `build(infra): add the local docker compose environment`
- `ci: add the deployment pipeline`

In the add mode, the commits cover only the added component or kind. Keep the document commits /kickoff, /architect and /design already made.

### 9. GitHub repository (first stage only)

Skip this step when the repository already exists on GitHub, which is always the case in the add modes.

Ask the user whether the repository is public or private (private repositories on GitHub Free cannot use branch rules or manual approval for production, so the workflow relies on discipline) and what to call it. After approval run `gh repo create <name> --<public or private> --source . --push` for the main branch. Then push the spike branches (`spike/*`) and the spike archive tags that were kept local because the repository had no remote (see /spike): `git push origin <branch>` and `git push origin <tag>` for each. Spike branches are pushed and never deleted.

### 10. Set up the review workflow

Run `setup-ai-review` with the Skill tool. Tell it: this project was just created by /scaffold (or just got its standards); components, directories, self-check commands and CI steps are in each stack's `stack.md`; `.claude/hooks/format.config.json` follows the "Format hook rule" of each `stack.md`, with each rule's `dir` set to the component directory; Dependabot is configured per component package manager, and npm components keep the template's group that upgrades the TypeScript toolchain together. The kinds of tests the project uses go into the Tests section of CLAUDE.md: each heavy kind with its command, the throwaway environment it prepares and removes, what it holds (the fixed ports it needs or the environment variable that sets them, output directories, whether it uses containers, roughly how much memory), what runs before each commit and before the PR, and its CI job; every kind not used with one line on why; how a change maps to the tests it affects; and the time targets for the stages before a commit and before the PR. In the add modes, tell it to update only the parts for the added component or test kind.

### 11. Report and next step

Report: the components created, the versions used (runtimes, frameworks, TypeScript, and so on), any version trade-offs and the user's choices, the standards and checks each component got, the kinds of tests set up with their commands, the decision point results, the self-check results, how to start it locally, the deployment pipeline and the platform settings the user still has to make, and the repository URL. In the first stage, also list the components the architecture has that this stage does not create, and the stage that will.

Next step: in the first stage, tell the user to run /roadmap next to split the stage's requirements and design into issues; if the scope's design is not done yet, run /design first. In an add mode, report the added part and return to the change that called this skill.
