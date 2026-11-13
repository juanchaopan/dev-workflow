---
name: change
description: Triage a new idea, feature or issue. Rates it on two axes — how much the requirements change (bug fix, new feature within existing requirements, changed requirements, changed goals, changed architecture) and how hard it hits the existing code design (fits the current structure, needs local refactoring, needs a set of classes and interfaces redesigned). Then, by level, asks the user follow-up questions, updates requirement and architecture documents, calls /design when screens, fields, data, interfaces or business logic change and has the user confirm each changed screen, writes a code structure redesign for large structural changes, writes a change record and splits issues (large design changes become a short series of PRs: refactor first, feature last), handing them to /implement. Suggests /spike where things are uncertain. Use when the user says "I want to add a feature", "this needs to change", "new requirement", "look at this issue", or gives an issue number.
---

# Change triage

When a new idea comes in, first find out which layer of the project it touches and how hard it hits the existing code, then decide how much to do: small changes go straight to development; big ones go back to the requirements, architecture or design first instead of straight into code. Going straight to code makes it look more and more like patchwork, and the result drifts from what the user wanted.

## Two axes

**Requirement level**:

| Level | How to tell | Example | What to do |
|---|---|---|---|
| L0 bug fix | An acceptance criterion of an existing requirement is not met | A button does nothing | Make sure there is an issue that reproduces it |
| L1 new feature within the requirements | Fits the existing goals, does not conflict with existing requirements | Sorting for a list | 1 or 2 rounds of questions, add a REQ |
| L2 requirements change | Changes or overturns existing REQs, or conflicts with them | Built for individuals, now must support teams | Find every affected REQ and code, ask, update the requirements, plan the migration |
| L3 goals change | Target users, success criteria or scope change | From a tool to a platform | Revisit the vision, then reassess the architecture |
| L4 architecture changes | The current architecture cannot cope: scale, stack, component split or deployment must change | Split a separate service out of the monolith | Use /architect for new ADRs and migration steps |

**Design impact** (on the existing code structure):

| Level | How to tell | Example | What to do |
|---|---|---|---|
| D0 fits | Existing classes, interfaces and modules can take it; it is just more code | Add a query to the existing order service | Develop directly |
| D1 local refactoring | A few classes or functions must be restructured first, but external interfaces and module boundaries stay | A function keeps growing and must be split before a new branch fits | First a refactor-only issue that keeps behavior, then the feature |
| D2 redesign | A set of classes, interfaces, module boundaries or data structures must be redesigned | Orders supported one payment method and must now support several, so the payment classes and interfaces must become extensible | Write a code structure redesign first, split into a short series of PRs once the user confirms |

Rate both axes independently and do everything each level asks for. When an idea spans several levels, handle it at the highest one.

Also, at any level, whenever something the user can see or notice changes — screens, fields, validation, messages, data structures, interfaces, business logic — change the design in `docs/design/` first, then split issues (step 3).

## How to ask

As in /kickoff: AskUserQuestion in the user's language, 2 to 4 questions per round, 2 to 4 concrete options each, the recommended one first with "(Recommended)". Ask only about this change.

## Steps

### 0. Read the current state

- Given an issue number: `gh issue view <number> --comments`.
- Read CLAUDE.md, `docs/README.md`, `docs/product/`, `docs/architecture/overview.md`, `docs/adr/`, `docs/design/` and `docs/roadmap.md`. For a taken-over system, also the index of `docs/design/as-is/README.md`: the old elements and findings the change touches.
- When the project has no `docs/` yet, first run `onboard` with the Skill tool to gather the evidence of the current state.
- Find the relevant code: which modules, classes and interfaces will change, how many places call them, how they are structured today.

### 1. Rate it

Say which REQs, ADRs, design elements (screens, entities, interfaces, logic), old elements and findings, modules, classes and interfaces the change touches, and therefore which level each axis gets. For design impact look at three things: once the new logic is in, will existing functions grow layer upon layer of conditionals; will two ways of doing the same thing coexist; can existing interfaces express the new requirement without changing their signatures. Ask the user to confirm both levels with AskUserQuestion (recommend your own rating).

When something is uncertain and needs trying out first (e.g. the performance of a new approach, whether a third-party service works), suggest /spike and continue once the conclusion is in.

### 2. Handle by requirement level

**L0**: without an issue, create one following the bug template (steps to reproduce, expected, actual) with the label `type:bug`. Ask how to reproduce it. Compare with the design: when the implementation deviates from the design, fix it to match the design; when the design was unclear and led the implementation astray, clarify the design first (step 3). In a taken-over system without a design for this part, check whether a finding already describes it, and ask whether anyone relies on the current behavior before calling it a bug (old behavior is sometimes policy).

**L1**:
1. Ask 1 or 2 rounds against the relevant items of `references/requirement-holes.md` in the kickoff skill (the kickoff directory next to this skill): who uses it, how, edge cases and failures, how it fits existing features.
2. Add a REQ to `docs/product/requirements.md`, continuing the numbering.

**L2**:
1. List the affected REQs, design elements, code and existing data.
2. Ask: what the new rule is, what happens to old data, whether old and new behavior coexist for a while, whether a feature flag is needed.
3. Update requirements.md: edit changed REQs in place and note the date; mark overturned REQs "Deprecated, replaced by REQ-xxx" and write the new REQs.

**L3**:
1. Ask about the new goals, users, success criteria and scope, and update `docs/product/vision.md`.
2. Check every existing REQ still holds, updating them as in L2.
3. Check the architecture against the new scale and constraints; when it must change, handle as L4.

**L4**: run `architect` with the Skill tool, saying it is an architecture change and why. It writes new ADRs and migration steps.

### 3. Change the design

When the change touches screens, fields, validation, messages, data structures, interfaces or business logic, run `design` with the Skill tool and tell it this is a call from /change and which REQs and design elements are in scope (new, changed, deprecated). It changes only those parts: changed screens get new prototypes and screenshots and are confirmed with the user one by one; data, interface and logic changes are confirmed too; finally it checks the change against the rest of the design.

In a taken-over system, an element the change touches for the first time has no target definition yet: /design redesigns it from the evidence in `docs/design/as-is/` (gathering the evidence first for an area that has none), and the user decides on every old rule and finding involved before the change is applied on top.

Skip this step for purely technical changes the user cannot notice (e.g. performance work, dependency upgrades, internal refactoring).

### 4. Handle by design impact

**D0**: nothing extra.

**D1**: when splitting issues, make the refactoring its own `type:refactor` issue ahead of the feature issue. Its acceptance criterion is "behavior unchanged: tests pass before and after"; it says what structure to move to and why the feature only fits that way.

**D2**:
1. Write `docs/design/refactor/<short-name>.md` from `templates/refactor-design.md`: the current code structure and its problems, the target structure (classes, interfaces, module boundaries, data structures, as Mermaid class or sequence diagrams), interfaces before and after, migration steps, compatibility strategy, test strategy.
2. Show the key points to the user; when there are several options, let the user choose with AskUserQuestion. Split issues only after confirmation.
3. Order the migration in these steps, each mergeable and releasable on its own:
   1. **Characterization tests**: tests for the code about to change that pin down its current behavior.
   2. **Refactoring**: restructure toward the target design without changing behavior.
   3. **Expand**: when an interface must change incompatibly, add the new interface first and keep both.
   4. **Migrate**: move callers to the new interface one by one.
   5. **Contract**: delete the old interface and implementation.
   6. **Feature**: implement the new requirement on the new structure.

   Every extra PR repeats CI, review, merge and rebase, so combine steps whenever the result stays readable as one diff, and tell the user what each split costs. Never put "refactor only" and "add a feature" in the same PR.

### 5. Split issues

Follow the structure of `templates/issue.md` in the roadmap skill (the roadmap directory next to this skill): acceptance criteria come from the changed design and cite the design element IDs and confirmed screenshots; in a taken-over system, also the old elements replaced and the decisions on old rules. Labels are `type:feature`, `type:bug`, `type:refactor`, `type:chore` and `type:spike`; put each issue in a suitable milestone and state the dependencies between issues. Split by the sizes and rules of step 2 of the roadmap skill: one issue is one PR by default.

### 6. Write a change record

For L2 and above, or D2, write `docs/changes/<YYYY-MM-DD>-<short-name>.md` from `templates/change-record.md`: what changed, why, which documents, design elements and code were affected, which decisions were made, which issues were split.

### 7. Commit and hand over

- Document changes go on a `docs/` branch with `docs(product): <content>`, `docs(architecture): <content>` or `docs(design): <content>`, merged with /open-pr.
- Before creating or closing issues on GitHub, show the user the list and wait for approval.
- Tell the user they can run `/implement <issue number>`; with D1 or D2 refactoring issues, start with the first one.
