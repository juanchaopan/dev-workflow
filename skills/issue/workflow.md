# Workflow rules

Every dev-workflow skill follows these rules. Read this file before running any command or step.

dev-workflow works for a project in any language, on any stack, on any code platform. The rules below name concepts: issue, pull request (PR; a merge request on GitLab), label, required check, secret, deployment job. `references/platforms.md` maps each concept to GitHub, Azure DevOps, GitLab, Bitbucket Cloud and Gitea/Forgejo, with the commands, the plan limits and the fallbacks where a platform lacks something. Look up the platform named in `.docs/brief.md`. Commands shown in the skills, such as `gh ...`, are examples for one platform.

## Working with the user

- **Nothing is done silently.** Everything written into a file or onto a platform is something the user has answered. An idea of your own is a suggestion: explain it in plain language and ask about it on its own, one suggestion per question.
- **Ask with AskUserQuestion**, in the user's language: 2 to 4 concrete options per question, the recommended option first with "(Recommended)" at the end of its label, and a description saying what each option means. Put costs, things the user must prepare and known problems into the option descriptions in plain words. Do not label options with a reliability rating.
- **"You decide"** settles only the question it answers, among the options that question gave. It never approves an extra suggestion and never covers questions not yet asked.
- **Only the main agent asks.** Subagents cannot ask the user. The main agent coordinates, asks and writes the documents; code is written by subagents.
- **Signing in.** A platform's command-line tool needs the user signed in. Ask the user to run the sign-in command themselves by typing `! <command>` in the prompt, for example `! gh auth login` (`references/platforms.md`).
- **Secrets.** No secret value is ever shown, printed or read into the conversation. A value goes straight from where it comes from into the platform's secret store, read from standard input or a file, never typed into a command.
- **Few calls.** Every command the main agent runs costs a pass over the whole conversation. Combine commands that can run together into one, and wait for long work (CI, a deployment job) with one command that blocks until it finishes, run in the background, instead of checking repeatedly.
- **Reference lists** sit next to the skills that use them. Read the list, consider the project, decide, and search online when the list does not cover the case. A list is a starting point, not a limit. Do not propose paid tools first, and mark tools that nobody maintains.
- **Latest versions, pinned.** Tools and runtimes use their latest release, and the version is written out exactly: never `latest`, `lts/*` or Gradle's `+`. When a tool does not support a new major version yet, explain it and let the user choose. When the runtime on the developer's machine is older than the project needs, tell the user and ask what to do.
- **Languages**: the plugin's own files are English. Code comments, documents, prototypes and screen text, issues and review comments use the languages set in `.docs/brief.md`.
- dev-workflow sets the process and the tools. It does not decide how the developer designs code: interface versioning, compatibility, zero-downtime techniques and the like are the developer's choices.

## Issue types

| Type | Meaning | Checked in review | PR title and commit type | Version |
|---|---|---|---|---|
| `feature` | A new feature or behavior change users can notice | Every acceptance criterion has a test | `feat` | minor |
| `fix` | Fixes a bug | A test that reproduces the bug is committed first and fails on the code before the fix | `fix` | patch |
| `refactor` | Changes structure, not behavior | The existing tests pass unchanged | `refactor` | none |
| `maintenance` | Changes the repository without changing the product's behavior: setting up the project, tests, documents, build, dependencies, CI, tools, new components, analysis of a reference project | The product's behavior does not change | `chore` | none |
| `ops` | An issue whose work is done entirely outside the repository and changes nothing in it | Nothing in the repository changes | no PR | — |
| `spike` | Answers a technical question | Nothing is merged | no PR | — |

- **Labels.** The type is the label `type:<type>` and the size the label `size:<size>`, on every platform. With `risk:low`, `risk:medium`, `risk:high` and `human-reviewed`, /kickoff creates them on the platform.
- **Issue references** follow the platform: `#12`, or a Jira key such as `KEY-12` on Bitbucket. `AGENTS.md` records which; the examples below use `#12`.
- The scope in parentheses is free and says what area changed, e.g. `chore(ci): cache dependencies (#31)`.
- A breaking change adds `!` after the type, e.g. `feat(api)!: ...`.
- **Size**, estimated from the expected number of work units: `size:S` one, `size:M` two or three, `size:L` four to six, `size:XL` seven or more.
- **Setting up the project**: the project's first issue is the `maintenance` issue "Set up the project". Its architect step asks all thirteen steps, and its scaffold step builds the project.
- **Analysis of a reference project**: a `maintenance` issue created through /change once the project is set up. Its kickoff step does the analysis.
- **spike**: no steps. Its code goes on `scratch/<number>-<short-name>` and is never merged. The conclusion is a comment on the issue, of any length. Issues that depend on it wait until it is closed. When it is created, ask whether it has a time limit. Whoever uses its code later moves it onto their own branch and brings it up to the project's standards.
- **ops**: no steps. One-off scripts go on `scratch/<number>-<short-name>` and are never merged. When the work turns out to need a repository change, create a new issue with /change and make the issues that depended on this one depend on the new one.
- **Dependencies** are informational on most platforms: before an issue starts, read its dependencies and do not start it while one is open. Read the conclusions of the closed ones it depends on, such as a spike's.

## Documents

- The documents live in `.docs/`. Write the name `.docs/` out wherever a file pattern needs it: path filters in CI, the files a checker covers.
- Names are lowercase English words joined by hyphens, without number prefixes. Only decision records carry a four-digit number: `decisions/0001-<short-name>.md`.
- Every document ends with the line `Last changed: #<issue number> (<date>)`. The first `brief.md`, written before any issue exists, ends with `Last changed: initial commit (<date>)`.
- A document holds only its latest content. A decision that is overturned is deleted; history stays in git.
- After changing a document, check every document that refers to it and keep them consistent.
- Documents on `main` describe only what is implemented.
- What a feature does, what it does not do and how it is accepted is written in its issue; the details are in the design documents. Those two places hold the requirements.

```text
VERSION            the project's version, one line
CHANGELOG.md       features, fixes and breaking changes of every release
README.md          one sentence on the project, and how to run it locally
AGENTS.md          the project's rules for AI agents
CLAUDE.md          one line: @AGENTS.md
REVIEW.md          review standards
<risk rules file>  high-risk and low-risk paths
.docs/
  brief.md         project brief
  architecture.md  architecture overview, diagram, "Deployment targets" section
  decisions/       one record per architecture decision
  design/          screens, data, interfaces, rules, as needed
  reference/<name>/  analysis of one reference project
```

## Steps and what each may change

Every `feature`, `fix`, `refactor` and `maintenance` issue goes through five steps in order: kickoff, architect, design, scaffold, implement. A step with nothing to change leaves one comment on the issue: "No change in this step: <reason>."

| Step | May change |
|---|---|
| kickoff | `.docs/brief.md`, `.docs/reference/` |
| architect | `.docs/architecture.md`, `.docs/decisions/` |
| design | `.docs/design/` |
| scaffold, implement | everything outside `.docs/` |

- Every commit on an issue branch ends with a `Step: <step>` trailer. A commit without one counts as a code step.
- The step check compares each commit's files with this table. The commit-msg hook runs it on every commit; the PR's CI runs it again on the PR's commits as a required check. Merge commits that bring `main` into the branch are skipped: what they bring in was checked on `main`.
- Before the project's hooks exist, the main agent runs the step check on each commit itself.
- **One issue at a time**, in the project's working tree, on the issue's branch.

## One goal

While working on an issue, judge everything that comes up by one question: does this issue's goal or acceptance criteria need it?

- **It does**: go back to the step responsible and work by that step's rules. When that step asks the user something, ask at once. Going back means running that step again, and its commits carry that step's trailer. For example: a new library goes back to architect to choose it, then scaffold adds it; a new kind of data goes back to architect, then through design and scaffold, then implement continues; a problem in the design goes back to design; resources scaffold created go back to architect, which records their addresses in "Deployment targets"; an external account a test needs for the first time goes back to architect.
- **It does not**: note it, and list the notes for the user before the PR is opened. Those the user agrees to become new issues through /change.

**A new check rule or test subject and the existing code**: when the new rule or subject would make this PR's CI fail, bring the existing code into line within this issue without asking. A new static check rule always does; a new test subject does when a coverage minimum is set. Otherwise ask whether to do it in this issue or in a new `maintenance` issue.

**A bug found while adding tests**: mark the test with the test tool's own known-failure marker naming a new `fix` issue, e.g. pytest `@pytest.mark.xfail(strict=True, reason="#23")`, Jest or Vitest `test.failing`, JUnit 5 `@Disabled("#23")`. CI stays green and this issue merges as usual. The `fix` issue fixes the bug and removes the marker.

## Branches and commits

- GitHub Flow, the branching model: `main` is the only long-lived branch, created as the default branch locally and on the platform. PRs are squash-merged, so the PR title becomes the commit on `main`.
- **Issue branch**: `<issue type>/<number>-<short-name>`, e.g. `feature/12-order-filter`. Every check applies to it.
- **Release branch**: `release/<version>`. Its PR title is always `chore(release): <version>`, with no issue number.
- **Dependency update branches** are opened by the update tool, e.g. `renovate/react-19.x`. Their titles are `fix(deps): ...` for what the product runs and `chore(deps): ...` for the rest, with no issue number and no `Step:` trailer.
- **Scratch branch**: `scratch/<number>-<short-name>`, created only when needed, never merged and kept forever. It holds prototype sources, spike code and one-off scripts. Only the commit message format is checked on it.
- Local branches are deleted after the merge. Whether remote issue branches are kept is set in architect step 13.
- Commit messages follow Conventional Commits: the first line at most 100 characters, with the issue reference, e.g. `feat(order): filter orders by date (#12)`, and the last line `Step: <step>`. The type follows the issue type table.
- The first commit of a project, made by /kickoff before any issue exists, is `chore: start the project` with `Step: kickoff` and no issue reference.
- **At the end of each step**, in this order: commit, push, then comment on the issue with what the step changed and its commits. A comment never describes work that is not pushed.
- **Bringing a branch up to date**: merge the latest `main` into it; never rebase a pushed branch. When the merge has conflicts, the PR description lists the files the conflict resolution changed.

## Where an issue stands

Before working on an issue that has started, find where it stands. The remote branch's commits are the record; the comments follow them.

- A step is done when its commits are pushed and its comment exists. Pushed commits without the comment: write the comment.
- Local commits not yet pushed: push them, then comment.
- Changed files not committed: list them and ask the user whether to keep and check them, or discard them and redo that part.
- An open PR, a merge, a deployment: continue from the first thing not done.

## Pull requests, risk and merging

- One issue has one PR, opened when the implementation is done and its checks pass, also when the issue changes only documents. The PR is linked to the issue so the issue closes when the PR merges (`references/platforms.md`).
- **Required checks**: the step check, the PR title type matching the branch name, `risk-gate`, and the CI job of every test subject and static check subject placed at the PR CI timing. A check its path filter skips still reports success.
- **Risk tier**, from the files the PR changes: any file under a high-risk path makes it high; every file under a low-risk path makes it low; anything else is medium. A release PR is always high. The paths are set in architect step 11. The CI job `risk` marks the PR `risk:low`, `risk:medium` or `risk:high`, reading the rules from the target branch so a PR cannot change its own tier.
- **Human approval**: a medium or high PR needs a person's approval, the `human-reviewed` label. The CI job `risk-gate` passes only while the label is on, and a CI job removes the label when a new commit arrives. On a platform without PR labels, the approval is the platform's equivalent named in `references/platforms.md`, such as an approval from a designated reviewer group.
- **Who gives the human approval** is asked once, at the start of every /issue, /implement and /release run that may merge a PR, and holds for that run only:
  - "I approve it after reading the changes" (Recommended).
  - "The agent approves it after an independent review, for this run only": a new agent gets only the PR number, the issue, the design it relies on and the standards, reads the whole diff and answers "may approve" or "must change first" with reasons. Changes it asks for are made, and a new agent reviews the new diff. Once CI passes and the important review comments are fixed, the main agent adds the approval and comments on the PR with the verdict and its reasons. The agent that wrote the code never approves.
- **Merging**: every AI review comment is handled first, fixed or closed with a stated reason, with no limit on rounds. Then the main agent merges with one command that first confirms, whatever the platform enforces: every required check passed, the branch contains the latest `main` and CI passed on it, and a medium or high PR has the human approval. It merges only when all hold, and otherwise reports which does not.
- **Done**: with staging, the issue is done when the merge is deployed to staging, its migrations ran, and the smoke tests passed when the target has them. Without staging, it is done when CI on `main` passes for the merge. The main agent follows the issue until it is done.

## Tests against deployed targets

The smoke tests and the performance tests run against a deployed target; every other test runs in a throwaway environment its command starts and removes.

- **Their data**: every account, record or file such a test needs, the test creates itself. It names each with a prefix the agent chooses for it, such as `smoke-`, plus a random part; before creating, it checks the name is free, and takes another random part when it is not; after three tries it fails. It deletes what it created at the end, deletes what an earlier interrupted run left under the same prefix at the start, and touches nothing else.
- **External accounts**, which a test cannot create, such as an account at a third-party service: the issue whose tests first need one goes back to architect, which asks the user for its name; its credentials are a secret supplied by the user.
- **Smoke tests**: a few end-to-end tests the agent tags smoke, showing that the deployed target works at its most basic. Only targets with an address have them. "Set up the project" gives each such target at least one, checking that its address answers normally. Each later issue judges whether its change adds, replaces or removes a smoke test, and its PR lists the change. On staging every smoke test runs after each deployment; on production only the smoke tests tagged production-safe run, those that change nothing.
