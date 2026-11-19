---
name: implement
description: The implement step of an issue, for any language, stack and code platform. The main agent plans the work units in an issue comment; fresh developer subagents build them one after another, tests by the issue type's rule, compare every new or redesigned screen with the confirmed design and keep pixel baselines, keep the smoke tests current, write migrations and load scripts; the checks run at their timings, AI simplification, review and security review run before the PR, the notes outside the issue's goal go to the user, and one pull request is opened, reviewed, brought up to date with main, merged by risk tier and followed until the issue is done. Resumes from where an interrupted run stopped. Use for "/implement <issue>".
argument-hint: <issue number>
---

# Implement

Read `../issue/workflow.md` first. Every rule there applies here. This step changes everything outside `.docs/`; its commits carry `Step: implement`.

## Start

- Run as `/implement <number>` on its own, first ask who gives the human approval in this run (`workflow.md`, "Pull requests, risk and merging"). Inside /issue, the run has already asked.
- Find where the step stands (`workflow.md`, "Where an issue stands"): the plan comment, the work units already committed, an open PR, a merge, a deployment. Continue from the first thing not done.

## Plan

The main agent reads the issue, the design it relies on, `.docs/architecture.md`, `AGENTS.md` and `REVIEW.md`, and writes the plan as a comment on the issue: the work units in order, and for each the files it expects to change and the tests it adds. The split into work units is not asked.

## Build

- **One work unit at a time.** Each unit is built by a new developer subagent, which continues from the commits of the unit before. Every check, every review and every fix also gets a new agent, including fixes after the local checks and the local reviews.
- Give each subagent what it needs, since it does not see this conversation: the issue, the plan, its unit, the design elements, `AGENTS.md`, `REVIEW.md`, the task runner commands, and the rules of `workflow.md` it must follow.
- **Order of code and tests** by issue type: a `fix` commits a test that reproduces the bug and fails before the fix; a `refactor` leaves the tests unchanged; a `feature` gives every acceptance criterion a test. Otherwise the agent decides whether tests or code come first. Test cases follow `../architect/references/test-subjects.md`.
- Failing tests, failing CI and review findings are implementation problems: fix them without asking the user.
- When the work shows that something else must change first, follow `workflow.md` ("One goal").

## Screens

- **A screen built for the first time, or changed by the design**: capture the implemented screen and have AI compare it with the current confirmed design image: layout, fields, text and states, not pixels. When they match, the capture becomes the baseline, replacing any earlier one, and is committed with the code. When they do not match, the issue's acceptance criteria are not met: change the code in this issue.
- **Every later run** compares with the baseline pixel by pixel, with fixed test data, a fixed time, animations off and the fixed rendering environment, volatile areas masked. Capture only the states that change how a screen looks, not every combination of data.
- **Animations that matter**: hold the animation at each key frame the design names and capture it, compared like any other screenshot. For example, Playwright pauses an animation and sets its time; Compose and Flutter tests advance the test clock.
- Baselines live in the repository next to their tests, in Git LFS when there are many. The PR lists every new and replaced baseline. The captures AI compared are evidence: commit them to the issue's scratch branch and link them in the PR.
- Read the change to judge which screens it touches.

## Other work the issue carries

- **Smoke tests**: judge whether the change adds, replaces or removes a smoke test, and which smoke tests are production-safe (`workflow.md`, "Tests against deployed targets").
- **Migrations**: every change to a data format gets a new versioned migration script and its migration test.
- **Load scripts**: the issue that builds or changes a flow a performance metric names writes or updates that flow's load script.

## Before the PR

1. Run the checks and tests the architecture placed before the PR and earlier, in the local run scope it set.
2. Run Claude Code's built-in `/simplify`, `/code-review` at the level the architecture set, and `/security-review`, each by a new agent that first reads `REVIEW.md` and `AGENTS.md`. Use the commands as they are; do not rewrite their prompts. Fix what they find, each fix by a new agent.
3. List for the user the notes outside the issue's goal (`workflow.md`, "One goal"). Those the user agrees to become new issues through /change.
4. Open the PR, also when the issue changed only documents, linked so the issue closes when it merges. Its title follows the type table, e.g. `feat(order): filter orders by date (#12)`. The description says which tests ran and why, the smoke tests added, replaced or removed and which are production-safe, and the new and replaced baselines with links to the evidence.

## After the PR

1. Handle every AI review comment: fix it, or close it with the reason. There is no limit on rounds.
2. Wait for CI with one command that blocks until it finishes, run in the background; fix what fails.
3. Get the human approval the way this run chose (`workflow.md`). A new commit removes it, and it is given again.
4. When `main` has moved on, merge the latest `main` into the branch, push, and wait for CI again.
5. Merge with the one command that confirms every condition first (`workflow.md`, "Merging"), squashing. Delete the local branch; keep or delete the remote branch as the architecture set.
6. Follow the merge until the issue is done: with staging, the deployment to staging, its migrations and the smoke tests; without staging, CI on `main`. When something fails after the merge, it is fixed forward in a new `fix` issue through /change.
7. Comment on the issue with the result, and report to the user.
