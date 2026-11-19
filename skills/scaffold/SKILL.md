---
name: scaffold
description: The scaffold step of an issue, for any language, stack and code platform. Carries out what the architecture decided - generates components with their official generators on the latest pinned versions, installs the task runner, git hooks, CI jobs for every check and test subject, the step, title and risk checks and the approval label job, CD to staging, a manually started deployment job per target, the performance test job, test commands that bring up and remove their own throwaway environments, the migration program, screenshot comparison, the first smoke tests, README and AGENTS.md - then, after the user confirms, sets the platform's branch rules and required checks, guides installing the platform apps, creates infrastructure and sets environment variables and secrets with the platforms' command-line tools, never showing a secret's value. Use for "/scaffold <issue>".
argument-hint: <issue number>
---

# Scaffold

Read `../issue/workflow.md` first. Every rule there applies here. This step changes everything outside `.docs/`; its commits carry `Step: scaffold`. Subagents write the files and run the generators; the main agent coordinates and asks.

## Scope

- Carry out only what `.docs/architecture.md` decided. When something needed is not decided, go back to the architect step.
- "Set up the project" builds everything below. A later issue does only what its architect step changed: a new library, a new component, a new check, a new test subject, a new resource, a new secret.
- Do not upgrade an older runtime on the developer's machine in the middle of an issue.
- The tools' details, and where each tool publishes its latest release, are in the architect step's reference lists: `../architect/references/static-check-tools.md`, `test-tools.md`, `test-subjects.md`, `data-migration-tools.md`, `infrastructure-tools.md` and `dependency-updates.md`. The platform's commands and fallbacks are in `../issue/references/platforms.md`.

## Generate

- Generate each component with its official generator, on the latest version, then pin every version.
- List the files the generator created by default and have the user confirm the list once. Ask about anything added beyond the defaults, one item at a time.
- Set the version in every component file that has a version field (`package.json`, `pom.xml`, `pyproject.toml` and the like) to the value in `VERSION`. A component without a version field gets none.

## The task runner

Install the task runner chosen in architect in three places: on the developer's machine, in CI (a step that installs it), and in `README.md` (how others install it).

The command names are fixed, in kebab-case; define each one the project has, and write what it runs:

| Command | Runs |
|---|---|
| `dev` | every component locally |
| `format`, `lint`, `typecheck`, `build` | the static checks of those subjects |
| `check` | every static check |
| `test-unit`, `test-component`, `test-integration`, `test-contract`, `test-e2e`, `test-security`, `test-migration` | that test subject |
| `test-smoke` | the smoke-tagged tests against the address it is given; with an option, only the production-safe ones |
| `test-security-scan` | the automatic security scan |
| `test-perf` | the load scripts, against the target address it is given |
| `migrate`, `rebuild` | the migrations and the rebuilds of every data kind |

## Tests

- Every test command except `test-smoke` and `test-perf` starts its own throwaway environment and removes it afterwards, for example Testcontainers, or `docker compose -p <random name> up -d` and `down -v`. Ports are random, so they never clash with the developer's own. Nothing is left behind, and the developer's machine and CI run the same command.
- `test-smoke` and `test-perf` run against a deployed target, with the data rules of `workflow.md` ("Tests against deployed targets").
- For "Set up the project", write one smoke test per target that has an address, tagged production-safe: its address answers normally.
- Screenshot comparison is set up for every project with a user interface: a fixed rendering environment (for browsers, a pinned container image), fixed test data and time, animations off, volatile areas masked, and a way to hold an animation at a chosen moment for the key frames the design names.
- Install the performance test tool and `test-perf`, which reads the target address from its argument.

## Migrations

Set up the migration program: import the tool chosen in architect, or write one. CD and the deployment jobs run the `migrate` command. A program the project writes itself gets tests for applying scripts in order, recording which versions ran, and stopping with an error when a script that already ran has changed; an imported tool already does these.

## Hooks

With the hook tool chosen in architect:

- the commit-msg hook checks, by the kind of branch (`workflow.md`, "Branches and commits"): on an issue branch, the step table, the Conventional Commits format, the first line's length, and that the commit type matches the branch's issue type; on a scratch branch, the format only; merge commits that bring `main` in are skipped;
- the pre-commit and pre-push hooks run the checks the architecture placed at those timings.

## CI and CD

- One CI job per test subject and per static check subject, at the timings the architecture set. A job with a path filter decides inside itself whether to run, so a skipped required check still reports success; filters name `.docs/` where they need it.
- The PR checks by the kind of branch: on an issue branch, the step check on the PR's commits and the PR title type matching the branch; on a release branch, the title `chore(release): <version>`; on a dependency update branch, a `fix(deps)` or `chore(deps)` title.
- The required checks: the step check, the title check, `risk-gate`, and every job placed at the PR CI timing.
- The risk rules file from architect, the jobs `risk` and `risk-gate`, and the job that removes the human approval when a new commit arrives, with the platform's mechanism and any token its fallback needs (`../issue/references/platforms.md`).
- The AI review in CI when the architecture asks for it: claude-code-action on GitHub; on other platforms a job that runs Claude Code headless, reads `REVIEW.md` and `AGENTS.md` first and posts its comments through the platform's API (`../implement/references/claude-code.md`).
- After a release PR merges: tag the version and create the platform's release.
- The dependency update tool from architect step 12, with the PR title types it set. Pin third-party CI actions and images to a commit or digest, updated by that tool.
- CD, when there is staging: after a merge to `main`, deploy to staging, run `migrate` and `rebuild`, then `test-smoke` against staging. CD deploys code and runs migrations; it does not create infrastructure.
- A manually started deployment job for each target, which /deploy starts: it takes the version to deploy, stops the service when the target needs downtime, runs `migrate` and `rebuild`, deploys, and runs `test-smoke` against the target, only the production-safe tests on production. A target without an address gets a job that publishes and confirms the new version is visible, such as in the package registry. The job uses the target's own secrets, so they never pass through the agent.
- When the project has performance tests, a manually started job that /perf-test starts: it takes the target, runs `test-perf` against its address with the load source architect chose, and keeps the results.
- Paths that are not checked, such as generated code, are decided here and written into each check tool's own configuration (for example ESLint's `ignores`, ruff's `exclude`). A later issue that adds generated code updates them the same way.

## Project files

- `README.md`: one sentence on the project, and how to run it locally.
- `AGENTS.md`: the languages from the brief, the task runner commands, how changes are checked, the branch and commit rules, and the platform's issue reference format.
- `CLAUDE.md`: one line, `@AGENTS.md`.
- `REVIEW.md`: the review standards the architecture holds.
- `.gitignore` includes `secrets.local.env`.

## Outside the repository

Once CI is written, list for the user everything to be done outside the repository, and do it with each platform's command-line tool once they confirm:

- **Branch rules and required checks.** Check the plan first: set what it allows, and tell the user what it does not. The check names are known from the CI just written, so they can be required before CI has ever run.
- **Apps.** The platform apps the architecture names, such as the AI review app and the dependency update tool's app. Installing one is done on the platform's website: walk the user through it and wait until it is done.
- **Infrastructure.** List each new resource and its rough monthly cost; create it once the user confirms, the way architect step 6 chose. Afterwards go back to the architect step and record each address in "Deployment targets".
- **Environment variables and secrets**, set with the platform's tool and, for a deployment target, with that target's own tool, the value always read from standard input or a file (`workflow.md`, "Secrets"):
  - generated at random (a session signing key): generate it and pipe it straight into the setting command;
  - produced when a resource is created (a new database's connection string): take it from the creating command's output and pass it straight on;
  - only the user has it (a payment provider's key, the AI review's API key, an external account's credentials): create `secrets.local.env` listing the names with empty values, have the user fill it in an editor, set the secrets from the file with the tool without opening it, and delete it.
- A later issue that changes any of this does it in its own scaffold step.

## Finish

Run every check and test that applies, fix what fails, commit with `Step: scaffold`, push, and comment on the issue.
