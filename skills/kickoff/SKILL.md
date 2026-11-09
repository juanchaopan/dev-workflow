---
name: kickoff
description: Requirements discovery from wherever the user starts — a half-formed idea, an existing code directory (to improve or modernize), an existing document (requirements, tender, meeting notes, competitor analysis) or a problem (too slow, keeps failing, user complaints). Asks rounds of multiple-choice questions to pin down goals, users, the full feature list, scenarios, business rules, edge cases, scale constraints and scope, looks for logical holes after each round with suggestions, and writes the same set of requirement documents under docs/product/. Stays at the requirement level; screens, fields, validation and table structure are confirmed one by one in /design. Use when the user says "I have an idea", "help me sort out the requirements", "new project", "how do we modernize this old system", "turn this document into requirements" or "kickoff". Followed by /architect, then /design.
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
| `docs/product/requirements.md` already exists | Existing requirements | Tell the user the requirements already exist and that new features or changed requirements go through /change. Continue only if the user insists on starting over |
| Only an idea | **Idea** | Follow "Idea" below |
| Points at a code directory, or the current directory has code but no `docs/` | **Existing code** | First run `onboard` with the Skill tool to document the current state, then follow "Existing code" |
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

## Existing code (improve, extend or modernize)

/onboard has documented the current state: `docs/architecture/overview.md` (current architecture), `docs/product/requirements.md` (existing features inferred from code, status "Implemented") and `docs/architecture/tech-debt.md` (tech debt and quality baseline). Build on that and ask:

1. **Round 1 — why change**: what hurts most (hard to change, slow, unstable, outdated and unmaintained technology, security and compliance, cost, cannot add features); what happens if nothing changes; any deadline (e.g. a framework's end of life).
2. **Round 2 — goals**: what must be true afterwards, measurably (e.g. "a new feature takes three days instead of two weeks", "P95 response time drops from 3 s to 500 ms"); whether the target users and usage change.
3. **Round 3 — what to keep**: of the features /onboard inferred, which must stay exactly as they are, which can change, which go away (multi-select); whether data is migrated as is; whether external interfaces and URLs may change.
4. **Round 4 — transition**: acceptable downtime; whether old and new can run side by side for a while; business that must not break (e.g. payments); one cutover or gradual replacement (/architect designs the details; here ask for the user's constraints and risk tolerance).
5. **Round 5 — scale and constraints**: as Round 5 of "Idea", but first confirm the current numbers (users, data volume, current deployment) with the user, then ask about expectations.
6. Go to "Final hole check". When writing requirements, kept features stay "Implemented", changed ones say exactly what they change into, dropped ones become "Deprecated", new features are "Active".

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

Go through everything against `references/requirement-holes.md` and list the problems: contradictions, missing roles or flows, features missing from the feature list, goals that cannot be measured, expectations that do not match the scale, scope that is too large, requirements that conflict with the current system. Give a suggestion for each. Let the user choose with AskUserQuestion where a decision is needed.

## Write the documents

Write them from this skill's `templates/`, in the project's document language: the `Language` line in the project's CLAUDE.md when there is one, otherwise the language the user talks to you in. Keep the IDs and the template structure.

| File | Content |
|---|---|
| `docs/README.md` | Documentation index (only when the file does not exist) |
| `docs/product/vision.md` | One-line positioning, target users, success criteria, scope, constraints, assumptions; for existing code also "Current state" and "Why change" |
| `docs/product/requirements.md` | Requirements numbered from REQ-001 (continue existing numbering), at least one per feature, each with a user story and acceptance criteria (Given/When/Then), priority, status and source |
| `docs/product/glossary.md` | Business terms and the one name to use for each |
| `docs/product/open-questions.md` | Open questions with the requirements they affect and the latest date they must be settled; mark those that need /spike |

## Confirm and commit

Summarize the key points for the user (do not paste whole documents) and ask what should change. After changes, commit with `docs(product): <content>`. Commit directly when the repository has no branch protection yet; otherwise create a `docs/` branch and use /open-pr.

## Next step

Tell the user to run /architect next to settle technology and architecture, then /design to confirm every screen, field, data structure and interface. For existing code, /architect designs the target architecture and the migration steps; when something needs verifying first, suggest /spike.
