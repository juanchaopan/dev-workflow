---
name: change
description: Turns what the user says - an idea, a feature, a bug, a change, a technical question, an operation outside the repository, the analysis of a reference project - into one or more issues on the project's code platform, each with a type label, a size label, dependencies and a body of goal, in scope, out of scope and acceptance criteria. Splits by features users can notice, puts a refactor first when the structure must change, and a spike ahead of what is uncertain. Before the project is set up, offers the "Set up the project" issue instead. Use for "/change", "I want to add...", "this needs to change", "there is a bug", "analyze this old system", "new requirement".
---

# Change

Read `../issue/workflow.md` first. Every rule there applies here. The platform's commands are in `../issue/references/platforms.md`.

## Before the project is set up

When `.docs/architecture.md` does not exist, the project has not been set up. Whatever the user asked for, answer first: the project needs a "Set up the project" issue, done before anything else; once it is done, come back with this request. Then ask whether to create that issue.

When the user agrees, create only that one `maintenance` issue, "Set up the project". Ask what its body needs, as for any issue (below). Then tell the user to run `/issue next`.

## Understand the request

1. Read `.docs/brief.md`, `.docs/architecture.md`, the design documents the request touches, and the open issues. The user may point to something the brief already lists, such as a feature in its scope or a reference project not analyzed yet; take its details from there.
2. Ask what you need to write each issue's body: what the user wants to achieve, what is in and out of scope, how they will know it works. Ask with multiple-choice questions, the most common answer recommended. Do not ask what the brief, the architecture or the design already settle.

## Split it

- Split by features users can notice, each one verifiable on its own. Behavior changes are `feature`, bugs `fix`, structure-only changes `refactor`, repository changes without behavior change `maintenance`, work done only outside the repository `ops`, technical questions `spike`.
- The analysis of a reference project is one `maintenance` issue per reference project.
- When the current structure must change before a feature fits, split out a `refactor` issue that comes first.
- Where something is uncertain, add a `spike` issue the uncertain issues depend on. Ask whether the spike has a time limit.
- Set the dependencies between the issues, and on open issues they need. Dependencies are the only order issues have.
- Estimate each issue's size from the work units it will take (`workflow.md`, "Issue types").
- For each issue, estimate the first step where something changes: kickoff, architect, design, scaffold or implement. This is only an estimate for the user; every issue still runs from kickoff.

Show the user the split as a table: title, type, size, depends on, first step with changes. The user may merge issues or split them further. Change the split until the user confirms it. Only the issues the user confirms are created; what they decide against is not recorded.

## Create the issues

Each issue gets:

- its labels `type:<type>` and `size:<size>`;
- its dependencies, with the platform's dependency links, or `Blocked by #<number>` in the body where the platform has none;
- a body in the issue language from the brief:

```markdown
## Goal
<what this achieves for the user, in one or two sentences>

## In scope
- <what this issue does>

## Out of scope
- <what it deliberately does not do>

## Acceptance criteria
- <a checkable statement for each behavior>

## Depends on
- #<number> <title>, or "nothing"
```

Create them on the platform once the user has confirmed the split. Report the issue numbers and links, and the command to start: `/issue next`.
