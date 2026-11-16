---
name: change
description: Triage a change to a project after its first stage: an idea, feature, bug, issue number or whole new module. Rates it on two axes (requirement level L0-L4 and design impact D0-D2), finds every affected piece of work and gives each one a start step (kickoff, architect, design, scaffold or implement directly), shows the plan to the user, then creates the issues on GitHub, each with its own start step and its dependencies on other issues. Use when the user says "I want to add a feature", "this needs to change", "new requirement", "look at this issue", or gives an issue number.
---

# Change planning

A change is anything that comes after the first stage of a project, and any change to requirements, architecture or design. The change is rated first: how far it reaches into the requirements, architecture and design, and how hard it hits the existing code. Then it is split into issues. Each issue starts from the earliest step its work needs, so code is never written while the requirements, architecture or design it depends on still have to change.

This skill plans the change and creates the issues. It does not change the project documents itself: each issue changes them on its own branch, through the skill named in its start step, together with its implementation.

## Two axes

**Requirement level**:

| Level | How to tell | Example | What to do |
|---|---|---|---|
| L0 bug fix | An acceptance criterion of an existing requirement is not met | A button does nothing | Make sure there is an issue that reproduces it |
| L1 feature within the requirements | Fits the existing goals, does not conflict with existing requirements | Sorting for a list | 1 or 2 rounds of questions, then a requirement is added |
| L2 requirements change | Changes or overturns existing requirements, or conflicts with them | Built for individuals, now must support teams | Find every affected requirement and piece of code, ask, plan the requirement rewrite and the data migration |
| L3 goals change | Target users, success criteria or scope change | From a tool to a platform | Revisit the vision, then reassess the architecture |
| L4 architecture change | The current architecture cannot cope: scale, stack, component split or deployment must change | Split a separate service out of the monolith | Start from `architect` |

**Design impact** (on the existing code structure):

| Level | How to tell | Example | What to do |
|---|---|---|---|
| D0 fits | Existing classes, interfaces and modules can take it; it is just more code | Add a query to the existing order service | Develop directly |
| D1 local refactoring | A few classes or functions must be restructured first, but external interfaces and module boundaries stay | A function keeps growing and must be split before a new branch fits | A refactor-only issue that keeps behavior, then the feature issue |
| D2 redesign | A set of classes, interfaces, module boundaries or data structures must be redesigned | Orders supported one payment method and must now support several, so the payment classes and interfaces must become extensible | A code structure redesign first, then a short series of PRs (step 5) |

Rate both axes independently and do everything each level asks for. When an idea spans several levels, handle it at the highest one.

Whenever something the user can see or notice changes (screens, fields, validation, messages, data structures, interfaces, business logic), the design element changes before any code does. The issue for that work starts at `design` at the latest.

## How to ask

Use AskUserQuestion in the user's language, 2 to 4 questions per round, 2 to 4 concrete options per question, the recommended option first with "(Recommended)". Ask only about this change.

## Start steps

Every piece of work gets exactly one start step: the earliest step it must go through. Each one names the skill step to begin from.

| Start step | When | Begin from |
|---|---|---|
| kickoff | goals, users, requirements or scope change; the requirement documents must be redefined first | Run `kickoff` with the Skill tool in its "Called by /change" mode: only the affected requirements are redefined, then its document and commit steps |
| architect | technology, components, deployment, data ownership or test kinds change | Run `architect` with the Skill tool, at step 0 (read the requirements), redoing only the decisions that change |
| design | screens, fields, validation, messages, data tables, interfaces or business logic change, and the requirements and architecture already fit | Run `design` with the Skill tool, at step 0 (read, set the scope, find where to resume), with the affected elements as the scope |
| scaffold | a new component, deployment target or test kind must be set up before features are built | Run `scaffold` with the Skill tool in its add-to-existing-project mode, at step 0 (read the design) |
| implement directly | nothing above changes (e.g. sorting in an existing list) | Run `implement` with the Skill tool and the issue number, at step 0 (pick the issue) of "One issue" |

Never start work from a step above what the change needs. A piece of work that only redefines documents is a normal issue whose start step is that document's skill; it is not a feature issue.

## Steps

### 0. Read the current state

- Given an issue number: `gh issue view <number> --comments`.
- Read CLAUDE.md, `docs/README.md`, `docs/product/`, `docs/architecture/overview.md`, `docs/adr/`, `docs/design/` (the index and the element files) and `docs/roadmap.md`, which gives the current stage. For a taken-over system, also the index of `docs/design/as-is/README.md`: the old elements and findings the change touches.
- When the project has no `docs/` yet, first run `onboard` with the Skill tool to gather the evidence of the current state.
- Find the relevant code: which modules, classes and interfaces will change, how many places call them, how they are structured today.

### 1. Rate it

Say which requirements (REQ IDs and their planned stage), ADRs, design elements (screens, entities, interfaces, logic), old elements and findings, modules, classes and interfaces the change touches, and therefore which level each axis gets. For design impact, look at three things: once the new logic is in, will existing functions grow layer upon layer of conditionals; will two ways of doing the same thing coexist; can existing interfaces express the new requirement without changing their signatures. Ask the user to confirm both levels with AskUserQuestion, recommending your own rating.

When something is uncertain and needs trying out first (e.g. the performance of an approach, whether a third-party service works), suggest a spike: run `spike` with the Skill tool. Give it an issue of type `type:spike` that the uncertain pieces depend on.

### 2. Settle the decisions by requirement level

The answers are recorded in the plan and in the issue bodies. The documents themselves are written by the issue's start step.

**L0**: make sure there is an issue that reproduces the bug, using the bug template (steps to reproduce, expected, actual) with the label `type:bug`. Ask how to reproduce it. Compare with the design: when the implementation deviates from the design, the issue brings it back to the design; when the design was unclear and led the implementation astray, the issue starts at `design`. In a taken-over system without a design for this part, check whether a finding already describes it, and ask whether anyone relies on the current behavior before calling it a bug (old behavior is sometimes policy).

**L1**: ask 1 or 2 rounds against the relevant items of `references/requirement-holes.md` in the kickoff skill (the kickoff directory next to this skill): who uses it, how, edge cases and failures, how it fits existing features. The requirement is written by the issue at `kickoff`.

**L2**: list the affected requirements, design elements, code and existing data. Ask: what the new rule is, what happens to old data, whether old and new behavior coexist for a while, whether a feature flag is needed. The issue at `kickoff` removes every requirement that no longer holds from `docs/product/requirements.md` and writes the requirements that replace it in its place.

**L3**: ask about the new goals, users, success criteria and scope. Check every existing requirement still holds, as in L2. Check the architecture against the new scale and constraints; when it must change, handle it as L4.

**L4**: the affected pieces start at `architect`. Ask what the current architecture cannot cope with (the scale, the stack, the component split or the deployment) and what the target must meet.

### 3. Impact analysis per piece of work

Split the change into pieces of work. A piece is the smallest unit that can be one issue; split pieces further only where their start steps or dependencies differ. For each piece write down:

- the affected requirements (IDs and planned stage), design elements (screen, API, entity, job and logic IDs), ADRs and architecture components;
- the code: modules, classes, interfaces, callers, and the existing data it touches;
- the affected documents;
- its design impact (D0, D1 or D2, with the three questions of step 1);
- its start step (table above), and what it depends on.

A piece belongs to the stage its requirements are planned for; a new requirement belongs to the current stage from `docs/roadmap.md`, unless the user places it in a later stage.

### 4. Write the plan and get it confirmed

Show the plan in the conversation, not in a file:

- both levels with the reason for each;
- every issue: title, type label, start step, the planned steps in order, dependencies (other issues, by their place in the plan), stage, size and risk tier;
- for D1 and D2, the refactoring issues first (step 5);
- for each uncertain point, the spike issue.

Confirm with AskUserQuestion: the two levels, the start step of each issue, and the issue list. Offer the recommended option first. Do not create any issue on GitHub before the user approves the plan.

### 5. Design impact: refactoring and the migration series

**D1**: the refactoring is its own issue of type `type:refactor`, placed before the feature issue. Its start step is `implement directly` when the target structure is already settled in the code, otherwise `design`. Its acceptance criterion is "behavior unchanged: tests pass before and after", and the issue says which structure to move to and why the feature only fits that way.

**D2**: the change is a series of PRs, each mergeable and releasable on its own.

1. The first issue is type `type:refactor` with the start step `design`. Its planned steps: write `docs/design/refactor/<short-name>.md` from `templates/refactor-design.md` (the current code structure and its problems, the target structure with classes, interfaces, module boundaries and data structures as Mermaid diagrams, interfaces before and after, migration steps, compatibility strategy, test strategy); show the key points to the user; where there are several options, let the user choose with AskUserQuestion; then commit the document on the issue's branch once confirmed.
2. The migration issues follow the confirmed redesign, each depending on the one before it, in this order:
   1. **Characterization tests**: tests for the code about to change that pin down its current behavior.
   2. **Refactoring**: restructure toward the target design without changing behavior.
   3. **Expand**: when an interface must change incompatibly, add the new interface first and keep both.
   4. **Migrate**: move callers to the new interface one by one.
   5. **Contract**: delete the old interface and implementation.
   6. **Feature**: implement the new requirement on the new structure. Its start step is whatever the requirement needs, usually `design` when screens or logic change.

   Combine steps whenever the result stays readable as one diff, and tell the user what each extra PR costs: it repeats CI, review, merge and rebase. Never put "refactor only" and "add a feature" in the same PR.
3. The migration issues are only listed in the plan at this point. They are created after the user confirms the redesign, so the redesign can still change them.

### 6. Create the issues on GitHub

After the user confirms the plan:

- Hand the confirmed list to `roadmap` with the Skill tool, starting at step 4 (create on GitHub). It creates the milestones and labels and the issues. Each issue body follows `roadmap/templates/issue.md`, extended with these fields: **Start step** (one of the five above); **Planned steps** (every step the issue goes through, in order, down to implementation); **Dependencies** (issue numbers). Labels are `type:feature`, `type:bug`, `type:refactor`, `type:chore` and `type:spike`. Acceptance criteria come from the changed design and cite its element IDs and confirmed screenshots; in a taken-over system, also the old elements replaced and the decisions on old rules.
- Create only the issues that can start now. For D2, the migration issues wait for the redesign issue; once the user has confirmed the redesign in that issue, run `change` with the redesign issue's number to create the remaining ones from the plan.
- Tell the user what to run next: `implement <number>` for an issue that has no open dependency, or `implement next` to let it pick the issues that can start.

## Rules for the issues

These rules apply to every issue created from a plan. Put them in the issue's planned steps.

- **Documents change in place.** Requirements, design elements, architecture documents and ADRs are kept at their latest version only. A requirement or ADR that no longer holds is removed from its file; its replacement is found in git history.
- **Last changed.** Each changed document, requirement, design element and ADR entry records `Last changed: #<issue number> (<YYYY-MM-DD>)`, or `kickoff`, `architect` or `design` for work done before any issue exists.
- **Consistency sweep.** After every document change inside an issue, check every document that refers to an affected element (requirements, vision, architecture overview, ADRs, the design index and element files, `docs/roadmap.md`, `docs/README.md` and the project README where it describes the affected part) and change each one until all of them agree. The sweep is a planned step of the issue, not an afterthought.
- **Document steps before code steps.** The issue's branch holds its document changes and its code. The document steps are confirmed with the user at the user's own pace (e.g. screens one at a time) before the code steps run, and the branch stays open until then. Commits follow the planned order: documents first, then tests, implementation and refactor.
- **Documents on main describe what is implemented for issue work.** A document changed by an issue reaches main together with that issue's code, so the issue's documents on main describe what is built. The first stage's documents are written before any code exists; their status fields show what is built.
