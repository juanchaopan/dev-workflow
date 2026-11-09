---
name: implement
description: Develops GitHub issues from branch to merge: reads the issue with its requirements, architecture, design (screen definitions and confirmed screenshots, data, interfaces, logic) and standards, branches per CLAUDE.md, refactors first when new logic does not fit, works in small test → implement → refactor commits with tests derived from the design, compares changed screens with the prototypes, opens the PR with /open-pr and handles every AI review comment until it merges; medium and high risk PRs wait for the user. Can develop several issues in parallel: this session coordinates, each issue gets a background subagent in its own worktree, the user answers all plan questions in one place, PRs merge in a fixed order and heavy checks queue behind a lock. Usage: /implement <issue>, /implement next, /implement batch, or /implement <issue> <issue> ...
---

# Developing issues

Four ways to call it:

| Call | What happens |
|---|---|
| `/implement <number>` | Develops that issue in this session ("One issue" below) |
| `/implement next` | Picks the next available issue and develops it in this session |
| `/implement batch` | Develops every open issue whose dependencies are done, in parallel ("Several issues in parallel" below) |
| `/implement <number> <number> ...` | Develops the given issues in parallel |

Talk to the user in their language.

## One issue

### 0. Pick the issue

- `/implement <number>`: `gh issue view <number> --comments`.
- `/implement next`: list the open issues of the earliest unfinished milestone (`gh issue list --milestone "<milestone>" --state open --json number,title,body,labels`), pick the one with the lowest number whose dependencies are all closed, and tell the user which one. Without milestones, go by issue number. `type:spike` issues go to /spike, not here.

### 1. Read the context

Read CLAUDE.md, the REQs linked from the issue (`docs/product/requirements.md`), the relevant parts of `docs/architecture/overview.md`, the related ADRs and the code to change. The standards in `.claude/rules/` load automatically when you change matching files.

Then read the design elements the issue cites: the common rules in `docs/design/README.md`, the screen definitions (`docs/design/screens/SCR-xxx-*.md`) and their screenshots for every state (open the PNGs with Read), the relevant parts of `docs/design/data.md` and `docs/design/interfaces.md`, the related logic in `docs/design/logic/`, and related redesigns in `docs/design/refactor/`.

### 2. Check whether work can start

- When acceptance criteria are unclear, contradictory or disagree with the documents, stop and ask the user with AskUserQuestion. When the question concerns requirements or the design itself, suggest running /change first.
- When a screen the issue cites is still "AI draft, awaiting confirmation", stop and have the user confirm it first (show the screenshots and revise until confirmed, as in step 2 of the design skill).
- When screens, fields, interfaces or data the feature needs are missing from the design, stop and suggest completing the design with /change first. Do not decide them while coding.
- When issues it depends on are not done yet, tell the user.
- When reading the code shows the new logic does not fit the current structure (a set of classes and interfaces would need redesigning, and neither the issue nor the design plans for it), stop and suggest running /change to assess the design impact. Do not redesign while coding.

### 3. A small plan

List the steps: which files each step changes and which tests it adds. When the current structure must be adjusted locally before the new logic fits (e.g. a function must be split first), make that adjustment the first step, committed on its own. Size S starts right away; for size M, or when you expect more than 500 changed lines, show the plan to the user first. When it looks bigger than M, suggest splitting the issue.

### 4. Create the branch

Read "Branches and commits" in CLAUDE.md:

- Base branch: main for GitHub Flow; for Git Flow, develop for feature, fix and refactor, main for hotfix.
- `git fetch origin`, switch to the base branch, `git pull --ff-only`.
- Create the branch following the naming rules, e.g. `feature/12-email-login`, `fix/31-empty-list`, `refactor/40-payment-strategy`.

### 5. Implement in small steps

**Preparatory refactoring** (first, when step 3 listed it): change structure only, not behavior. The same tests pass before and after; when the code to change has no tests, add tests that pin down its current behavior first. Commit as `refactor(<scope>): <what was restructured> (#<number>)`.

**`type:refactor` issues**: the whole issue follows the rules above, with no behavior change at all.

**Features and fixes**, for each step:

1. **Test**: write or update tests describing this step's behavior. Tests come from the design: every validation rule in the field definitions (required, length and range boundaries such as the limit and the limit plus one), the success and failure of actions, every error of the interfaces, every row of the decision tables, allowed and disallowed state transitions. For a bug, first write a test that reproduces it and fails now.
2. **Implement**: write the code that makes the tests pass. Field names, order, messages and formats follow the design and its common rules.
3. **Refactor**: once the tests pass, tidy this step's code and the code around it — remove duplication, improve names, split functions that grew long — so it reads as if written in one go (see "How to write code" in CLAUDE.md). Do not keep adding layers of conditionals to old functions.
4. **Self-check**: run the self-check commands in CLAUDE.md for the components you changed; all must pass.
5. **Commit**: one commit does one thing, with a Conventional Commits message that includes the issue number, e.g. `feat(auth): support e-mail sign-in (#12)`, `test(auth): cover wrong passwords (#12)`.

Rules:

- Every commit passes the self-check on its own; never commit a broken intermediate state.
- Refactoring and feature changes go in separate commits, so reviewers can see which changes alter behavior.
- Do not mix in changes unrelated to the issue; record problems you happen to find as new issues.
- When the architecture check fails, change the structure of the code, not the architecture rules.
- When the design does not cover a situation: decide pure technical details (variable names, how internal functions are split) sensibly yourself; for behavior users can see, business rules and data structures, stop and ask the user, update the design once they confirm, then continue coding.
- Never commit secrets, tokens, personal data or generated build output.

**When screens change**:

- The confirmed prototype screenshots (`docs/design/screens/*.png`) are the reference. After implementing, open the screen in every state the design defines (normal, validation errors, empty data and so on), take screenshots with Playwright or a browser tool, and compare them one by one with the prototype screenshots: fields, order, text, required markers, where error messages appear and every state must match. Small visual differences that come from the component library are acceptable; mention them in the PR.
- For changes to an existing screen, also attach a screenshot from before the change.
- Put the comparison (prototype and implementation side by side) in the PR description.
- With design files, check sizes, colors and spacing against them; colors and spacing use design tokens.
- When presentational components are added or changed, update their Storybook stories (when the project uses Storybook).
- When the look changed on purpose, regenerate the visual regression baselines as in the scaffold skill's `shared/visual-testing.md` and commit them with the code.

### 6. Open the PR

Run `open-pr` with the Skill tool (the project's `/open-pr` command). It runs the self-check, simplification and local review once more, writes the PR from the template with `Closes #<number>` in the body, and enables auto-merge.

### 7. Handle review comments

1. Wait for the checks: `gh pr checks <PR> --watch --interval 30` (the AI review takes a few minutes; run this in the background).
2. Read the unresolved review threads:

   ```
   gh api graphql -F owner=<owner> -F repo=<repo> -F number=<PR> -f query='
     query($owner: String!, $repo: String!, $number: Int!) {
       repository(owner: $owner, name: $repo) {
         pullRequest(number: $number) {
           reviewThreads(first: 100) {
             nodes { id isResolved path line comments(first: 20) { nodes { databaseId author { login } body } } }
           }
         }
       }
     }'
   ```

3. Handle each one:
   - **[Important], [Security]**: fix it. When you think it should not be fixed, reply with the reason in the thread, but **do not resolve the thread yourself**; tell the user to decide.
   - **[Nit], [Pre-existing]**: fix it when worthwhile; otherwise reply with the reason and resolve the thread.
   - Fixed problems: reply "Fixed in <commit>" and resolve the thread.
   - Reply: `gh api repos/<owner>/<repo>/pulls/<PR>/comments/<comment databaseId>/replies -f body="<text>"`
   - Resolve: `gh api graphql -F id=<thread id> -f query='mutation($id: ID!) { resolveReviewThread(input: {threadId: $id}) { thread { isResolved } } }'`
4. Commit fixes following step 5 (e.g. `fix(auth): address review: validate the e-mail format (#12)`) and push. Pushing starts a new review round; go back to 1.
5. When CI fails, read the log (`gh run view <run id> --log-failed`), fix and push again. When visual regression tests fail, download the comparison images to tell unexpected changes from intended ones.
6. When the AI review hits its round limit, stop, tell the user, and suggest a smaller PR or a different approach.

### 8. Merge

- Low risk: merges automatically once every check passes and every thread is handled.
- Medium and high risk: give the user the PR link and risk tier and ask them to read the whole diff and add the `human-reviewed` label once satisfied; it merges automatically after that. Handle changes the user asks for as in step 7 (a new commit removes the label and the user confirms again).
- When the project has PR preview environments, give the user the preview URL to see the result.

After the merge: switch back to the base branch, `git pull --ff-only`, delete the local branch. Check the issue closed (`gh issue view <number> --json state`); `Closes #<number>` occasionally fails to close it, so close it with `gh issue close <number> --comment "Done in #<PR>"`.

### 9. Report

Say which issue was done, the PR link, what changed, which refactorings were made, which review comments were handled, whether the implementation differs from the prototypes, and anything the user should know. Ask whether to continue with `/implement next`.

## Several issues in parallel

This session becomes the coordinator: it talks to the user, decides the merge order, wakes subagents and wraps up. Each issue gets a background subagent (Agent tool, `isolation: "worktree"`) that does steps 1 to 7 of "One issue" in its own git worktree on its own branch. Planning, development and local checks run side by side; only merges and heavy checks queue. The end result must equal doing the issues one after another in the merge order.

Subagents never ask the user anything: they return questions and plans to the coordinator, which asks the user and sends the answers back with SendMessage, so the user only ever deals with this session.

### B1. Choose the batch

- `/implement batch`: the open issues of the earliest unfinished milestone whose dependencies are all closed.
- `/implement <number> ...`: the given issues; check their dependencies the same way.

Leave out, and tell the user why for each: issues still blocked by open issues (including ones in this batch; they go into a later batch), `type:spike` issues (for /spike), issues that need a real environment or manual steps (hardware, production credentials, third-party accounts), and issues whose screens are "AI draft, awaiting confirmation" until the user confirms those screens (offer to do that first).

Run at most 4 subagents at a time unless the user asks for more: each one installs dependencies and runs checks, which takes memory and CPU.

### B2. Fix the merge order

Read each issue's "Components and files" (expected files) and its design elements, and estimate which files each one will change. Choose the merge order: issues that others build on, and smaller issues touching shared files, go first; issues that overlap heavily stay apart in the order so the later one adapts to the earlier. Show the user a table — order, issue, size, expected files, overlaps with earlier issues — and confirm it.

### B3. Start the subagents: plans only

Start one background subagent per issue with the Agent tool (`isolation: "worktree"`, `run_in_background: true`). Give each a brief with:

- The issue number and title, and that it works for the coordinator, never asks the user, and returns everything for the user to the coordinator.
- Its place in the merge order, the issues ahead of it and the files they expect to change.
- What to do now: steps 1 to 3 of "One issue" in this skill (read the context, check whether work can start, make a small plan) in its own worktree, then stop and return the plan: steps, files and tests, size, whether it should become several PRs, problems that block it, and the decisions the user must make, each with concrete options and a recommendation.
- The rules for working in a worktree and the heavy-check lock (B5), and the pitfalls (B8).

### B4. Settle the decisions with the user

Collect the plans. Summarize them for the user in one table, then ask every decision point with AskUserQuestion, grouped by issue (each question names its issue; at most 4 questions per round, as many rounds as needed). Send each subagent its answers with SendMessage and tell it to start developing.

When an answer overturns the plan (e.g. the interaction changes completely): when it changes behavior users can see, first update the design with the user through the design skill (only the affected elements); then the subagent records the new acceptance criteria as a comment on its issue before writing code.

### B5. Development in the subagents

Each subagent follows steps 4 and 5 of "One issue" in its worktree:

- Branch from the latest base branch and install dependencies in the worktree itself (`npm ci`, `uv sync` and so on); nothing is shared with other worktrees.
- Normal self-check commands run in parallel.
- Heavy checks — those listed under "Heavy checks" in CLAUDE.md, such as local end-to-end tests and visual regression tests in Docker — queue behind a lock so only one runs at a time:
  1. Take the lock: `LOCK="$(git rev-parse --git-common-dir)/dev-workflow-heavy-check.lock"`, then retry `mkdir "$LOCK"` every 30 seconds until it succeeds (`mkdir` is atomic, so only one subagent gets it). Write the issue number and the time into `$LOCK/owner`.
  2. Run the heavy check.
  3. Release the lock right away, whether the check passed or failed: `rm -rf "$LOCK"`.
  4. When a lock is older than an hour, do not delete it; report it to the coordinator, which checks whether its owner is still working.

### B6. Open PRs in order

- The first issue in the merge order opens its PR as soon as it is done locally (step 6 of "One issue").
- Every later issue finishes locally first (all commits made, all checks passing), reports "ready, waiting for #<previous>" and waits. Once the issue ahead of it has merged, the coordinator tells it to continue: `git fetch origin`, rebase onto the latest base branch, adapt to the changes already merged, rerun every check (heavy ones through the lock), then open its PR.
- Once a branch is pushed, keep it in sync with the base branch only by merging (`git merge origin/<base>`); never force-push.
- An issue split into several PRs stacks the later PRs locally on the earlier one; once the earlier one merges, move the next onto the base branch with `git rebase --onto origin/<base> <old base of the stack> <branch>`.

### B7. Reviews, merging and wrap-up

- Each subagent handles its PR's reviews as in step 7 of "One issue", and stops when CI is green and every thread is handled, reporting the PR link and risk tier to the coordinator. It never merges or labels anything itself.
- The coordinator checks each PR's CI itself (`gh pr checks <PR>`), tells the user which PRs need their review (medium and high risk) and in which order, and after each merge wakes the next subagent in the order.
- After each merge, the coordinator checks the issue closed and closes it with a comment when `Closes #<number>` did not.
- At the end, summarize the batch: issues done with their PRs, issues left out and why, open follow-ups, and suggest the next batch.

### B8. Exceptions and pitfalls

- **GitHub Actions or GitHub itself is down**: subagents report it and keep doing local work. The coordinator watches https://www.githubstatus.com and, once it recovers, tells the subagents to rerun failed runs (`gh run rerun <run id> --failed`).
- **A worktree disappears** (worktrees can be cleaned up automatically): recreate it from the main repository with `git worktree add <path> <branch>` and continue; commit often so nothing is lost.
- **A background script moved the worktree to another commit** (e.g. a per-commit check): wait for it to finish and confirm `git status` shows the branch again before continuing.
- **Dependencies went stale after switching branches or rebasing**: when the lock file changed, reinstall (`npm ci` and the like) before running checks.
- **A subagent is stuck or keeps failing**: the coordinator stops it, tells the user, and takes the issue out of the batch; it can be done alone with `/implement <number>`.
