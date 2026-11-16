---
name: roadmap
description: Splits one stage of the project into milestones and GitHub issues. The stage comes from /kickoff (the first stage) or from a /change plan (every later stage), and the input is the requirements in docs/product/, the architecture in docs/architecture/ (including modernization migration steps) and the design in docs/design/ (screens, data, interfaces, logic, code structure redesigns, and for existing systems the decisions on old rules and the data migration mapping). The first stage starts with a minimal end-to-end, deployable walking skeleton, then features by dependency and priority, with technical spikes ahead of uncertain work. Every issue has a type, a start step, the planned steps in order, goal, requirements and design elements, acceptance criteria taken from the design, components, dependencies and size; after the user confirms, creates the milestones, labels and issues on GitHub and writes docs/roadmap.md. Use after /design and /scaffold, or from /change. Followed by /implement, one issue at a time or several in parallel.
---

# Planning

Turn one stage into issues that can each be developed, reviewed and merged on their own. One issue maps to one branch and one PR. Every extra issue repeats CI, review, merge, rebase and the checks, so issues are not cut smaller than a behavior the user can notice (the rule is "Pull request size" in the scaffold skill's `shared/testing.md`). Issue content comes from the design: which screen, which interfaces, which rules, so nobody has to guess during development.

A stage is a scope: a whole product, one foundation module, a set of modules, or only research (spikes). The first stage's scope is chosen at kickoff; each later stage's scope is chosen by the change that creates it. This skill splits only the stage it is given. It does not split the whole product again.

## Issue types

| Type | Label | Purpose |
|---|---|---|
| Feature | `type:feature` | New behavior the user can notice |
| Bug | `type:bug` | An existing requirement is not met |
| Refactoring | `type:refactor` | Structural change only, no behavior change, making room for a later feature |
| Chore | `type:chore` | Infrastructure and engineering work: deployment pipeline, logging, monitoring, database migration framework, data migration, cutover |
| Spike | `type:spike` | A question to verify before deciding, handled by /spike; produces an ADR, not production code |

## Start step and planned steps

Every issue has one start step: the earliest skill step its work must go through. The options are kickoff, architect, design, scaffold and implement. A change plan gives each of its issues the start step; first-stage issues start at implement unless they set up a component, a test kind or a deployment target, which starts at scaffold.

Each issue also lists its planned steps in order, from its start step down to implement. Every planned step names the skill that runs it and what that skill must confirm with the user before the next step starts. The last planned step is always implement. All planned steps run on the issue's one branch: each is pushed and commented on the issue, and the issue's one PR is opened after the last of them.

## Steps

### 0. Read the documents

Read CLAUDE.md, `docs/product/`, `docs/architecture/overview.md`, `docs/adr/`, `docs/design/` (the element index in `README.md` and the definitions of screens, data, interfaces and logic; `refactor/` holds code structure redesigns), the current `docs/roadmap.md`, and the GitHub issues (`gh issue list --state all --limit 200 --json number,title,state,milestone,labels`). For an existing system, also the index of `docs/design/as-is/README.md` (elements, findings) and the "From the current system" sections of the design elements in scope.

When called by /change, the input is the change plan: the affected requirements, the design element IDs, the architecture decisions, and each issue with its start step, planned steps, dependencies and expected files. Write the issues from that plan as given.

Check the design is complete:

- When a feature to be scheduled has no design element in the requirement coverage table of `docs/design/README.md`, tell the user to run /design first and come back. Issues split without a design can only be written at user-story level, and development would have to guess.
- Screens with the status "AI draft, awaiting confirmation" can be split into issues, but the issue says "have the user confirm SCR-xxx before starting"; /implement checks this before it starts.
- For an existing system, findings in scope without a resolution, and old elements in scope neither used nor dropped, mean the redesign is unfinished: tell the user to finish them in /design first.

### 1. Milestones

One milestone per stage, titled `Stage <n>: <scope>` (for example `Stage 1: foundation module`), with its goal in the description. The first stage is Stage 1; each later stage takes the next number.

- **First stage: walking skeleton.** The first stage's issues begin with the walking skeleton: the thinnest end-to-end path through every layer (e.g. click a button on a page → call a backend endpoint → write to the database → show the result), running locally with several instances in docker compose, CI green, deploying automatically to staging, with a preview URL for every PR (per the deployment chosen in the architecture). The point is to surface integration and deployment problems early. It also proves each kind of test the architecture chose, with one real test of each kind running locally and in CI. Later stages have no skeleton issues.
- **Features.** The rest of the stage's requirements, in dependency and priority order.

Modernization: each stage maps to one or more steps of the migration in `docs/architecture/overview.md`, and the system runs normally in production at the end of each stage. The first stage is usually "add characterization tests to the parts that will change, and set up standards and checks"; characterization tests pin down today's behavior, including the worked examples of old rules (CUR-RUL), so each later change shows exactly what it changes.

Rewrite: the new system is built in stages like any project, and the stage that moves production to it carries:

- **Data migration**: a repeatable migration from the mapping in the "From the current system" sections of `docs/design/data.md`, rehearsed on copies of the old data until counts, totals and spot checks match; dirty data handled as decided.
- **Cutover**: the switch-over plan from the architecture (freeze or read-only window, final migration, verification, how to fall back to the old system), and switching the old system off afterwards.

Maintenance and extension: the issues of a change belong to the stage that change defines. An element redesigned from the evidence for the first time comes with its characterization tests in the same issue or one before it.

ADRs with the status "Proposed" and open questions marked for verification each become a `type:spike` issue scheduled before the work that depends on them.

### 2. Split issues

For the first stage, split the stage's requirements and design into issues. For a change, the issues come from the change plan: write them out, check their size and risk, and leave the split as the plan has it.

- Prefer vertical slices: an issue completes one behavior the user can notice, frontend and backend together; do not slice by layer ("all tables first", "then all endpoints"). With a UI, an issue is usually one screen (or a group of actions on it) plus the interfaces and data it uses; without a UI, usually one interface, command or scheduled job.
- Size: S (roughly up to 200 changed lines), M (roughly up to 500). An issue above M is split only along lines a reviewer would read separately (e.g. the query and editing parts of one screen), into as few issues as possible; an issue that is merely above S is not split.
- Acceptance criteria come from the design: every validation rule in the field definitions, the success and failure of every action, every error of the interfaces, every row of the decision tables. When there are many, reference them ("all rules of fields 1 to 8 in the SCR-xxx field definitions") and list the most important few separately. For an existing system, every kept old rule's worked example and every changed rule's new result is a criterion.
- Migration steps of code structure redesigns (`docs/design/refactor/`) follow their order: characterization tests, refactoring, expand, migrate, contract, feature. A refactoring issue's acceptance criterion is "behavior unchanged". Steps that stay readable as one diff share an issue; "refactor only" and "add a feature" never do.
- Data migration is split per entity group: migration script, rehearsal on a copy with a comparison report, handling of each dirty-data case; old interfaces with outside callers get their own issues for the compatibility decision (adapter, versioned endpoint, or the coordinated change).
- Write each issue from `templates/issue.md`: type, start step, planned steps, goal, requirements and design elements (REQ, SCR, ENT, API, JOB, LGC IDs; screens with the path of the confirmed screenshot; for an existing system, the old elements replaced), acceptance criteria, components, the issues it depends on, size, estimated risk tier (against `.github/risk-rules.txt`), test points (each at the lowest kind of test that can catch it, as in `testing.md`: field rules are unit tests, only key flows are end-to-end). List the files it is expected to touch: /implement uses that to plan parallel work.
- A spike issue's planned steps are the spike itself (run by /spike) followed by the steps that depend on its ADR.
- Tests are not issues of their own: each issue brings its tests. Only setting up a kind of test that the project lacks, or a delivery or non-functional test that spans features, is a `type:chore` issue.

### 3. Order and confirm

Order by dependency.

- First stage: show the user a table of number, type, title, start step, milestone, design elements, size and dependencies. Where there are trade-offs (cut scope or not, what goes first), let the user choose with AskUserQuestion. Nothing is created on GitHub until the user confirms this table.
- Called by /change: the issue list the user already confirmed in /change is the list used. Keep its order and do not ask the user to confirm it again.

### 4. Create on GitHub

This step creates content in the user's repository. For the first stage, the user's confirmation in step 3 is the approval. When called by /change, the confirmation given in /change is the approval, so create the content without asking again.

1. Labels: `type:feature` (`1d76db`), `type:bug` (`d73a4a`), `type:refactor` (`fbca04`), `type:chore` (`c5def5`), `type:spike` (`d4c5f9`), `size:S` (`ededed`), `size:M` (`bfdadc`), created with `gh label create <name> --color <color> --force`.
2. Milestones: `gh api repos/{owner}/{repo}/milestones -f title="Stage 1: foundation module" -f description="<one sentence>"`, skipping existing ones.
3. Issues: create them in dependency order, dependencies first, so later issues can cite earlier numbers. Write each body to a temporary file, then `gh issue create --title "<title>" --body-file <file> --label <type> --label <size> --milestone "<milestone>"`.

### 5. Write docs/roadmap.md

Write it from `templates/roadmap.md`, in the project's document language, with the stage's goal and issue table. Progress lives in the GitHub issues, not in roadmap.md. Commit it with `docs(roadmap): <content>` on the branch of the change or first stage it belongs to, as /implement and /change describe.

### 6. Next step

Tell the user: run `/implement next`, which lists the issues whose dependencies are done, says how many can start and asks how many to develop (one in this session, or several in parallel; the rest wait for the next `/implement next`), or `/implement <issue number>` for a specific one; when a `type:spike` issue comes first, run /spike first.
