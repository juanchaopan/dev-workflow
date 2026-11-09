---
name: kickoff
description: Requirements discovery from wherever the user starts: a half-formed idea, existing code (to improve, modernize or rewrite), a document (requirements, tender, meeting notes) or a problem (too slow, keeps failing, complaints). Asks rounds of multiple-choice questions to pin down goals, users, the full feature list, scenarios, business rules, edge cases, scale constraints and scope, looks for logical holes after each round, and writes the requirement documents under docs/product/. For existing code it builds on /onboard's evidence without trusting it: what to keep, change or drop, whether screens and style are redone, and the findings that change requirements. Stays at the requirement level; screens, fields, validation and tables are confirmed in /design. Use for "I have an idea", "help me sort out the requirements", "new project", "how do we modernize this old system", "turn this document into requirements" or "kickoff". Followed by /architect, then /design.
---

# Requirements discovery

The goal is to turn whatever the user brings — an idea, a pile of old code, a document or a problem — into requirement documents that both people and AI can work from. Different entry points, same output: the vision, requirements, glossary and open questions under `docs/product/`, so /architect, /design, /roadmap and /implement never need to know where the requirements came from.

Your role is an experienced product manager who keeps asking: think of what the user has not thought of, but let the user make the call.

## How deep this step goes

Requirements say what the system must do, why, and what counts as success. This step settles: goals and users, a complete feature list, the key flow of each feature, business rules, edge cases and failures, scale and constraints, and scope.

What screens look like, whether a field is required, validation rules, table columns and API parameters are design details and are not asked here. /design confirms them screen by screen once the architecture is settled. When the user volunteers such details, record them in the business rules of the matching requirement; /design will use them.

## How to ask (every round)

- Ask with AskUserQuestion, in the user's language. Each round has 2 to 4 questions, each with 2 to 4 options.
- Ask about this project: use its business objects, roles and scenarios, e.g. "Can the amount still change after an order is submitted?", not "Can data be modified?". For a generic question that would fit any project, first infer the most likely answer for this project from what you know, then ask the user to confirm or correct it.
- Make the options concrete: guess realistic answers from what you know. Do not add "Other"; the tool adds free text automatically. Put the recommended option first and append "(Recommended)" to its label.
- Each option's description says what the choice means and what follows from it, e.g. "Multi-user collaboration: needs accounts and permissions, roughly doubles the work".
- Set `multiSelect: true` for questions that allow several answers.
- One topic per round. When an answer changes direction, adjust the following questions. Questions already answered by the code or documents are not asked again; only ask the user to confirm the inference.
- After each round, restate what you understood in three to five sentences, then list the holes found in this round (check against `references/requirement-holes.md`). Holes that need the user's decision go into the next round.
- When the user says "you decide" or "either is fine", take the recommended option and record the source as "AI suggestion, user default".
- Do not make things up. What cannot be settled goes into the open questions. What needs a trial before it can be decided (e.g. "will users understand this interaction", "is this third-party service fast enough") is recorded with a suggestion to verify it with /spike.
- The user can say "stop here" at any time: write up what is clear and put what was not asked into the open questions.

## Step 0: find the entry point

Look at what the user gave you, then at what is in the current directory:

| Situation | Entry | What to do |
|---|---|---|
| `docs/product/requirements.md` already exists and is not only /onboard's inferred features | Existing requirements | Tell the user the requirements already exist and that new features or changed requirements go through /change. Continue only if the user insists on starting over |
| Only an idea | **Idea** | Follow "Idea" below |
| Points at a code directory, or the current directory has code but no `docs/design/as-is/` | **Existing code** | First run `onboard` with the Skill tool to gather the evidence, then follow "Existing code" |
| /onboard has run (`docs/design/as-is/` exists) | **Existing code** | Follow "Existing code" |
| A document (file, link, pasted text) | **Document** | Follow "Document" |
| Describes a problem | **Problem** | Follow "Problem" |

When several apply (e.g. "here is our old system and a new requirements document"), collect information through each flow, then run the hole check and questions once for everything.

For a new project, also ask for the project name (a short English name used for the directory and repository) and the parent directory; create the directory and run `git init`.

## Idea

1. **Hear the idea**: use what the user already said, or ask them to describe it in their own words. Restate in one paragraph what problem it solves, for whom and roughly how, and have the user confirm you understood.
2. **Round 1 — goals and users**: who will use it (there can be several roles); how they solve the problem today; why something new is needed; what success looks like, in measurable terms.
3. **Round 2 — feature list and core scenarios**: list every feature you infer, by role, one sentence each, let the user pick what the first version must have (multi-select) and add what is missing. The list must be complete: /design designs screens and interfaces from it. Then walk through the most important flow: where it starts, the steps, what comes out at the end.
4. **Round 3 — business rules and data**: the key business objects; their states and transitions; who can see and change what; where data comes from, how long it is kept, whether it can be deleted and exported.
5. **Round 4 — edge cases and failures**: concurrent edits, duplicate submissions, retries after failure, lost network, empty data, huge data, malicious use.
6. **Round 5 — scale and constraints**: number of users, data volume, peak load, response time, availability, deployment environment, budget, compliance, launch date, who maintains it. These answers drive the /architect decisions, so get orders of magnitude, e.g. "under 100 / 10,000 / 1 million users".
7. **Round 6 — scope and priorities**: what the first version (MVP) does, what comes later, what is explicitly out.
8. Go to "Final hole check".

## Existing code (maintain, extend, modernize or rewrite)

/onboard has gathered evidence and the user has chosen a direction (maintain, extend, modernize, rewrite):

- `docs/architecture/overview.md`: the current architecture and its contradictions.
- `docs/product/requirements.md`: existing features inferred from code, status "Implemented".
- `docs/design/as-is/`: the current design — screens (real screenshots where it ran), data and what it actually contains, interfaces and their callers, business rules (CUR-RUL) — and the findings (FND: suspected bugs, contradictions, things that do not run, dirty data, hidden behavior).
- `docs/architecture/tech-debt.md`: tech debt and the quality baseline.

None of it is correct just because the old system does it. Build on it, and ask:

1. **Round 1 — why change**: what hurts most (hard to change, slow, unstable, parts that do not work, outdated and unmaintained technology, security and compliance, cost, cannot add features, users dislike the screens); what happens if nothing changes; any deadline (e.g. a framework's end of life).
2. **Round 2 — goals**: what must be true afterwards, measurably (e.g. "a new feature takes three days instead of two weeks", "P95 response time drops from 3 s to 500 ms"); whether the target users and usage change.
3. **Round 3 — what to keep**: of the features /onboard found, which stay as they are, which change, which go away (multi-select; features nobody uses and features that do not work come first). Whether all existing data is migrated, archived or partly dropped. Whether external interfaces and URLs that other systems or users depend on may change.
4. **Round 4 — screens and style** (with a UI): keep the current look, restyle (new colors, fonts and controls, same layouts), or redesign layouts and interactions; whether users must be able to work without retraining; devices and screen sizes now and in the future. /design follows this when it redesigns each screen.
5. **Round 5 — findings that change requirements**: of the findings, those that decide what the system should do rather than how one screen behaves — e.g. a hidden rule users depend on ("customer 1042 never pays shipping"), a behavior that looks like a bug but may be policy, a permission the server never checked, a feature that never worked. Ask with the evidence, at most 4 per round; write the decision into the matching requirement and into the "Resolution" column of the finding. Findings about a single field or screen are left for /design.
6. **Round 6 — transition**: acceptable downtime; whether old and new can run side by side for a while; business that must not break (e.g. payments); one cutover or gradual replacement (/architect designs the details; here ask for the user's constraints and risk tolerance). For a rewrite, also when the old system is switched off and who checks the migrated data.
7. **Round 7 — scale and constraints**: as Round 5 of "Idea", but first confirm the current numbers (users, data volume from the profiling, current deployment) with the user, then ask about expectations.
8. Go to "Final hole check". When writing requirements, features that stay in the old code as they are remain "Implemented"; features rebuilt in the target system (modernize, rewrite) and changed features become "Active", saying exactly what they become, with the old implementation under "Related"; dropped ones become "Deprecated"; new features are "Active". Sources cite the evidence (e.g. "CUR-SCR-004, confirmed by user").

## Document

1. Read every document and extract goals, users, features, business rules, constraints and scope, noting where each item came from (document and location). Design details already in the documents (screens, fields, table structures) are noted with their source too and handed to /design.
2. Restate in one paragraph what the documents want and ask the user whether they still hold (documents are often outdated or represent only one side).
3. Check against `references/requirement-holes.md` for what is missing, vague or contradictory.
4. Ask only about those gaps, one topic per round, 2 to 4 questions each. Do not ask about what the documents already make clear.
5. Go to "Final hole check". Requirement sources are the document locations.

## Problem

1. **Understand the symptom**: since when, how often, who is affected and how badly (e.g. "pages take 10 seconds every day between 3 and 5 pm", "5 users a week complain that payment fails"). Ask for logs, monitoring, screenshots and steps to reproduce, or look for them in the code and logs.
2. **Find the root cause**: gather evidence first, then propose a few possible causes and use AskUserQuestion to get more information and rule causes out. Reproduce it when you can.
3. **Classify**:
   - A bug, or an existing requirement not met: when the project has requirement documents, hand it to /change as L0 (bug fix); when it does not, add this one requirement and treat it as a bug.
   - The requirements themselves are not enough (e.g. scale grew, usage changed): treat it as a new goal and follow "Existing code" or "Idea".
4. Go to "Final hole check".

## Final hole check

Go through everything against `references/requirement-holes.md` and list the problems: contradictions, missing roles or flows, features missing from the feature list, goals that cannot be measured, expectations that do not match the scale, scope that is too large, requirements that conflict with the current system, findings that change requirements but are still open. Give a suggestion for each. Let the user choose with AskUserQuestion where a decision is needed.

## Write the documents

Write them from this skill's `templates/`, in the project's document language: the `Language` line in the project's CLAUDE.md when there is one, otherwise the language the user talks to you in. Keep the IDs and the template structure.

| File | Content |
|---|---|
| `docs/README.md` | Documentation index (only when the file does not exist) |
| `docs/product/vision.md` | One-line positioning, target users, success criteria, scope, constraints, assumptions; for existing code also "Current state", "Why change" and the decision on screens and style |
| `docs/product/requirements.md` | Requirements numbered from REQ-001 (continue existing numbering), at least one per feature, each with a user story and acceptance criteria (Given/When/Then), priority, status and source |
| `docs/product/glossary.md` | Business terms and the one name to use for each; for existing code, also the old names used in code and data where they differ |
| `docs/product/open-questions.md` | Open questions with the requirements they affect and the latest date they must be settled; mark those that need /spike |

## Confirm and commit

Summarize the key points for the user (do not paste whole documents) and ask what should change. After changes, commit with `docs(product): <content>`. Commit directly when the repository has no branch protection yet; otherwise create a `docs/` branch and use /open-pr.

## Next step

Tell the user to run /architect next to settle technology and architecture, then /design to confirm every screen, field, data structure and interface. For existing code, /architect designs the target architecture and the migration steps, and /design redesigns each element from the evidence, with the user deciding on every old rule and finding; when something needs verifying first, suggest /spike.
