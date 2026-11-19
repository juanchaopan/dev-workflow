---
name: issue
description: Works one issue from where it stands to done, on any code platform. /issue next first asks who gives the human approval, merges the open dependency update PRs whose CI passed (a failed one becomes a maintenance issue), then picks the next open issue that can start. Runs the five steps in order (kickoff, architect, design, scaffold, implement), each by its own skill, pushes and comments after every step, opens one pull request, merges it by risk tier and follows it until staging (or CI on main) proves it done. Spikes and ops issues run without steps. Use for "/issue 12", "/issue next", "work on issue 12" or "continue issue 12".
argument-hint: <issue number> | next
---

# Issue

Read `workflow.md` in this skill's directory first. Every rule there applies here. The platform's commands are in `references/platforms.md`.

## Who approves

When the run may merge a PR, ask first who gives the human approval in this run (`workflow.md`, "Pull requests, risk and merging"). `/issue next` always asks, since it handles dependency update PRs; `/issue <number>` asks unless the issue is a `spike` or an `ops` issue. The answer holds for every PR this run merges.

## Dependency update PRs

`/issue next` handles the open PRs of the dependency update tool before it picks an issue:

- **CI passed**: handle every AI review comment, get the human approval when the PR is medium or high risk, bring the branch up to date with `main` when it is behind and wait for CI again, then merge it (`workflow.md`, "Merging").
- **CI failed**, for example a major upgrade that needs code changes: create a `maintenance` issue for the upgrade through /change, close the PR with a comment naming the issue, and let the issue do the work.

An update PR that opens while an issue is being worked waits for the next `/issue next`.

## Which issue

- `/issue <number>`: that issue.
- `/issue next`: pick one open issue that carries a `type:` label, in this order:
  1. an issue already started and not done (it has a branch or step comments);
  2. among the rest, only issues whose dependencies are all closed;
  3. issues other open issues depend on come first;
  4. then the lowest number.
  Every type can be picked, `spike` and `ops` included. Tell the user which issue you picked and why, then work it to done. The next issue needs another `/issue next`; the user can name one with `/issue <number>` instead.
- When nothing can start, say what blocks each open issue and stop.

## Before the steps

1. Read the issue with its comments, `.docs/brief.md`, `.docs/architecture.md`, the design documents the issue touches, and the conclusions of the closed issues it depends on.
2. Find where it stands (`workflow.md`, "Where an issue stands") and continue from there.
3. Create the branch `<type>/<number>-<short-name>` from the latest `main`, or check out the existing one and merge the latest `main` into it.

## The five steps

Run them in order, each by its skill: `kickoff`, `architect`, `design`, `scaffold`, `implement`. Load the step's skill with the Skill tool and follow it for this issue. A step that has nothing to change in this issue leaves the comment "No change in this step: <reason>." and the next step starts.

At the end of each step, in this order:

1. every commit of the step carries `Step: <step>`;
2. push the branch;
3. comment on the issue, starting with `Step <step>:`, with what the step changed and the commits it made.

A later step that needs an earlier one goes back to it as `workflow.md` ("One goal") says, and comments again when that step's work is done.

The step commands `/kickoff <number>`, `/architect <number>`, `/design <number>`, `/scaffold <number>` and `/implement <number>` run one step only. They require every earlier step to be done; when one is not, say which and stop.

## Spike issues

1. Read the question the issue asks and its time limit, if it has one.
2. When code is needed, create `scratch/<number>-<short-name>` and build only what answers the question.
3. Show the user the evidence: what was tried, what happened, numbers, screenshots or logs, and the answer it supports. Stop and say so when the time limit is reached.
4. When the user accepts the conclusion, write it as a comment on the issue, push the scratch branch, and close the issue.

## Ops issues

1. Read what the issue asks to be done outside the repository.
2. Before each action that changes something, say what it will change and get the user's confirmation. Use the command-line tools of the platform involved; secrets follow `workflow.md`.
3. One-off scripts go on `scratch/<number>-<short-name>`.
4. Comment on the issue with what was done and close it.
5. When the work turns out to need a repository change, follow `workflow.md` ("Issue types", ops).

## After the steps

The implement step opens the PR, handles the review, merges by risk tier and follows the issue until it is done (`workflow.md`). Report to the user: the PR, what merged, where it is deployed, and the notes that became new issues.
