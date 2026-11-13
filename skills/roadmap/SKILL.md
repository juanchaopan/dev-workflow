---
name: roadmap
description: Splits the requirements in docs/product/, the architecture in docs/architecture/ (including modernization migration steps) and the design in docs/design/ (screens, data, interfaces, logic, code structure redesigns, and for existing systems the decisions on old rules and the data migration mapping) into milestones and GitHub issues. Schedules a minimal end-to-end, deployable skeleton first, then features by dependency and priority, with technical spikes ahead of uncertain work, and for existing systems characterization tests, data migration rehearsals and cutover. Every issue has a type, goal, requirements and design elements, acceptance criteria taken from the design, components, dependencies and size; after the user confirms, creates the milestones, labels and issues on GitHub and writes docs/roadmap.md. Use after /design and /scaffold; /change also uses it for new work. Followed by /implement, one issue at a time or several in parallel.
---

# Planning

Turn requirements and design into issues that can each be developed, reviewed and merged on their own. One issue maps to one PR. Every extra issue repeats CI, review, merge, rebase and the checks, so issues are not cut smaller than a behavior the user can notice. Issue content comes from the design — which screen, which interfaces, which rules — so nobody has to guess during development.

## Issue types

| Type | Label | Purpose |
|---|---|---|
| Feature | `type:feature` | New behavior the user can notice |
| Bug | `type:bug` | An existing requirement is not met |
| Refactoring | `type:refactor` | Structural change only, no behavior change, making room for a later feature |
| Chore | `type:chore` | Infrastructure and engineering work: deployment pipeline, logging, monitoring, database migration framework, data migration, cutover |
| Spike | `type:spike` | A question to verify before deciding, handled by /spike; produces an ADR, not production code |

## Steps

### 0. Read the documents

Read CLAUDE.md, `docs/product/`, `docs/architecture/overview.md`, `docs/adr/`, `docs/design/` (the element index in `README.md` and the definitions of screens, data, interfaces and logic; `refactor/` holds code structure redesigns), the existing `docs/roadmap.md`, and the existing GitHub issues (`gh issue list --state all --limit 200 --json number,title,state,milestone,labels`). For an existing system, also the index of `docs/design/as-is/README.md` (elements, findings) and the "From the current system" sections of the design elements in scope. When called by /change, split only the work it hands over and leave the existing plan alone.

Check the design is complete:

- When a feature to be scheduled has no design element in the requirement coverage table of `docs/design/README.md`, tell the user to run /design first and come back. Issues split without a design can only be written at user-story level, and development would have to guess.
- Screens with the status "AI draft, awaiting confirmation" can be split into issues, but the issue says "have the user confirm SCR-xxx before starting"; /implement checks this before it starts.
- For an existing system, findings in scope without a resolution, and old elements in scope neither used nor dropped, mean the redesign is unfinished: tell the user to finish them in /design first.

### 1. Milestones

New project:

- **M0 walking skeleton**: the thinnest end-to-end path through every layer (e.g. click a button on a page → call a backend endpoint → write to the database → show the result), running locally with several instances in docker compose, CI green, deploying automatically to staging, with a preview URL for every PR (per the deployment chosen in the architecture). The point is to surface integration and deployment problems early.
- **M1 MVP**: every first-version requirement in `docs/product/vision.md`.
- **M2 and later**: "later" requirements, grouped.

Modernization: each milestone maps to one or more steps of the migration in `docs/architecture/overview.md`, and the system runs normally in production at the end of each milestone. The first milestone is usually "add characterization tests to the parts that will change, and set up standards and checks"; characterization tests pin down today's behavior, including the worked examples of old rules (CUR-RUL), so each later change shows exactly what it changes.

Rewrite: the new system is a new project (M0 walking skeleton, then features), plus:

- **Data migration**: a repeatable migration from the mapping in the "From the current system" sections of `docs/design/data.md`, rehearsed on copies of the old data until counts, totals and spot checks match; dirty data handled as decided.
- **Cutover**: the switch-over plan from the architecture (freeze or read-only window, final migration, verification, how to fall back to the old system), and switching the old system off afterwards.

Maintenance and extension: issues go into the milestone of their feature; an element redesigned from the evidence for the first time comes with its characterization tests in the same issue or one before it.

ADRs with the status "Proposed" and open questions marked for verification each become a `type:spike` issue scheduled before the work that depends on them.

### 2. Split issues

- Prefer vertical slices: an issue completes one behavior the user can notice, frontend and backend together; do not slice by layer ("all tables first", "then all endpoints"). With a UI, an issue is usually one screen (or a group of actions on it) plus the interfaces and data it uses; without a UI, usually one interface, command or scheduled job.
- Size: S (roughly up to 200 changed lines), M (roughly up to 500). An issue above M is split only along lines a reviewer would read separately (e.g. the query and editing parts of one screen), into as few issues as possible; an issue that is merely above S is not split.
- Acceptance criteria come from the design: every validation rule in the field definitions, the success and failure of every action, every error of the interfaces, every row of the decision tables. When there are many, reference them ("all rules of fields 1 to 8 in the SCR-xxx field definitions") and list the most important few separately. For an existing system, every kept old rule's worked example and every changed rule's new result is a criterion.
- Migration steps of code structure redesigns (`docs/design/refactor/`) follow their order: characterization tests, refactoring, expand, migrate, contract, feature. A refactoring issue's acceptance criterion is "behavior unchanged". Steps that stay readable as one diff share an issue; "refactor only" and "add a feature" never do.
- Data migration is split per entity group: migration script, rehearsal on a copy with a comparison report, handling of each dirty-data case; old interfaces with outside callers get their own issues for the compatibility decision (adapter, versioned endpoint, or the coordinated change).
- Write each issue from `templates/issue.md`: type, goal, requirements and design elements (REQ, SCR, ENT, API, JOB, LGC IDs; screens with the path of the confirmed screenshot; for an existing system, the old elements replaced), acceptance criteria, components, the issues it depends on, size, estimated risk tier (against `.github/risk-rules.txt`), test points. List the files it is expected to touch: /implement uses that to plan parallel work.

### 3. Order and confirm

Order by dependency and show the user a table: number, type, title, milestone, design elements, size, dependencies. Where there are trade-offs (cut scope or not, what goes first), let the user choose with AskUserQuestion.

### 4. Create on GitHub

This step creates content in the user's repository, so get the user's approval first.

1. Labels: `type:feature` (`1d76db`), `type:bug` (`d73a4a`), `type:refactor` (`fbca04`), `type:chore` (`c5def5`), `type:spike` (`d4c5f9`), `size:S` (`ededed`), `size:M` (`bfdadc`), created with `gh label create <name> --color <color> --force`.
2. Milestones: `gh api repos/{owner}/{repo}/milestones -f title="M0 Walking skeleton" -f description="<one sentence>"`, skipping existing ones.
3. Issues: create them in dependency order, dependencies first, so later issues can cite earlier numbers. Write each body to a temporary file, then `gh issue create --title "<title>" --body-file <file> --label <type> --label <size> --milestone "<milestone>"`.

### 5. Write docs/roadmap.md

Write it from `templates/roadmap.md`, in the project's document language, with each milestone's goal and issue table. Progress lives in the GitHub issues, not in roadmap.md. Commit with `docs(roadmap): <content>` on a `docs/` branch with /open-pr.

### 6. Next step

Tell the user: run `/implement next`, which lists the issues whose dependencies are done, says how many can start and asks how many to develop (one in this session, or several in parallel; the rest wait for the next `/implement next`), or `/implement <issue number>` for a specific one; when a `type:spike` issue comes first, run /spike first.
