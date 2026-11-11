---
name: implement
description: Develops GitHub issues from branch to merge and beyond: reads the issue with its requirements, architecture, design (screen definitions and confirmed screenshots, data, interfaces, logic) and standards, branches per CLAUDE.md, refactors first when new logic does not fit, works in small test → implement → refactor commits with tests derived from the design, compares changed screens with the prototypes, opens the PR with /open-pr and handles every AI review comment; medium and high risk PRs wait for the user and are watched until they merge; an issue is done only when CI on the base branch passes for the merge and staging runs it. Heavy checks clean up their containers and leave nothing running. Can develop several issues in parallel: this session coordinates, each issue gets a background subagent in its own worktree, a batch holds no more issues than run at once (the user picks them, the rest wait for the next batch), the user answers all plan questions in one place, PRs merge in a fixed order, heavy checks queue behind a lock, and worktrees are removed once their issue is finished. Usage: /implement &lt;issue&gt;, /implement next, /implement batch, or /implement &lt;issue&gt; &lt;issue&gt; ...
---

# Developing issues

Four ways to call it:

| Call | What happens |
|---|---|
| `/implement <number>` | Develops that issue in this session ("One issue" below) |
| `/implement next` | Picks the next available issue and develops it in this session |
| `/implement batch` | Develops a batch of open issues whose dependencies are done, in parallel, at most as many as run at once; the rest wait for the next `/implement batch` ("Several issues in parallel" below) |
| `/implement <number> <number> ...` | Develops the given issues in parallel, with the same limit |

Talk to the user in their language.

An issue is done when its PR has merged, CI on the base branch has passed for the merge commit, and staging runs that commit (when the project has staging). Merging alone is not done.

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

**Heavy checks** (the "Heavy checks" line of CLAUDE.md, such as end-to-end and visual regression tests in Docker) leave nothing running on the machine:

1. Before: when the check needs Docker and `docker info` fails, start it (Docker Desktop: `docker desktop start`) and note that this check started it.
2. Run the check.
3. After, whether it passed or failed: stop and remove what the check started, as CLAUDE.md says (e.g. `docker compose -f <file> down`; containers run with `docker run --rm` remove themselves). `docker ps` shows none of this check's containers afterwards.
4. Quit Docker Desktop (`docker desktop stop`) when CLAUDE.md says to and this check started it; leave it alone when it was already running.

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

Watch the PR in the background until it merges, at every risk tier: poll `gh pr view <PR> --json state,mergeCommit,labels` every minute (run it with `run_in_background`). When it is still open after the checks pass and the label is on, read why (`gh pr checks <PR>`, unresolved threads, `gh pr view <PR> --json mergeStateStatus`) and handle it or tell the user. Merge it yourself only when the user asks.

### 9. After the merge

1. **Local cleanup**: switch back to the base branch, `git pull --ff-only`, delete the local branch.
2. **The issue**: check it closed (`gh issue view <number> --json state`); `Closes #<number>` occasionally fails to close it, so close it with `gh issue close <number> --comment "Done in #<PR>"`.
3. **CI on the base branch**: take the merge commit from `gh pr view <PR> --json mergeCommit`, list its runs with `gh run list --commit <sha> --json databaseId,workflowName,status,conclusion` (they can take a minute to appear; list again until they do), and wait for each with `gh run watch <run id> --exit-status` in the background.
4. **Staging** (when CLAUDE.md names one): confirm staging runs the merge commit, or a later commit that contains it (`git merge-base --is-ancestor <sha> <deployed sha>`). Check it the way CLAUDE.md says (e.g. its version endpoint), or from the deployment records: `gh api "repos/<owner>/<repo>/deployments?environment=staging&sha=<sha>"`, then `gh api repos/<owner>/<repo>/deployments/<id>/statuses` until the latest status is `success`. When no deployment starts within the deployment workflow's usual time, look at the deploy workflow's runs.
5. **When something fails**: read the log (`gh run view <run id> --log-failed`, or the deployment's log on the platform) and tell the user what failed and why. A failure caused by the change gets a fix through a new branch and PR (steps 4 to 8, the same issue number). A failure that does not come from the change — an unstable test, a platform outage — still goes to the user, with a new issue for an unstable test; rerun the failed jobs (`gh run rerun <run id> --failed`) only once the user knows. The issue is not done while either check is red.

### 10. Report

Say which issue was done, the PR link, what changed, which refactorings were made, which review comments were handled, whether the implementation differs from the prototypes, the result of CI on the base branch and of the staging deployment, and anything the user should know. Ask whether to continue with `/implement next`.

## Several issues in parallel

This session becomes the coordinator: it talks to the user, decides the merge order, wakes subagents, watches merges and what follows them, and wraps up. Each issue gets a background subagent (Agent tool, `isolation: "worktree"`) that does steps 1 to 7 of "One issue" in its own git worktree on its own branch. Planning, development and local checks run side by side; only merges and heavy checks queue. The end result must equal doing the issues one after another in the merge order.

Subagents never ask the user anything: they return questions and plans to the coordinator, which asks the user and sends the answers back with SendMessage, so the user only ever deals with this session.

A batch is a fixed set of issues settled with the user in B2. Every issue in it gets its subagent at the start, all of them plan together and all their decisions are settled together. An issue outside the batch is never started during the run: not when a subagent finishes, not when a PR merges, not when a subagent is taken out. It waits for the next `/implement batch`, where it is planned against the code that has merged by then.

### B1. Choose the candidates

- `/implement batch`: the open issues of the earliest unfinished milestone whose dependencies are all closed.
- `/implement <number> ...`: the given issues; check their dependencies the same way.

Leave out, and tell the user why for each: issues still blocked by open issues (including other candidates; they go into a later batch), `type:spike` issues (for /spike), issues that need a real environment or manual steps (hardware, production credentials, third-party accounts), and issues whose screens are "AI draft, awaiting confirmation" until the user confirms those screens (offer to do that first).

The limit is how many subagents run at once: 4 unless the user asks for more, since each one installs dependencies and runs checks, which takes memory and CPU. A batch holds at most that many issues. When more candidates remain than the limit, B2 lets the user choose which go into this batch.

### B2. Settle the batch and the merge order

Read each candidate's "Components and files" (expected files) and its design elements, and estimate which files each one will change.

When there are more candidates than the limit, recommend which go into this batch: issues that other candidates build on first, then those that overlap least with each other (so they can develop side by side), then the lowest numbers. Ask the user with AskUserQuestion (multi-select) which candidates make up this batch, or whether to raise the limit. Say plainly that the candidates not chosen are not started in this run and wait for the next `/implement batch`.

Choose the merge order within the batch: issues that others build on, and smaller issues touching shared files, go first; issues that overlap heavily stay apart in the order so the later one adapts to the earlier. Show the user two tables and confirm them:

- **This batch**: order, issue, size, expected files, overlaps with earlier issues.
- **Not in this batch**: issue and why — over the limit (next batch), blocked by which issue, `type:spike`, needs manual steps, screens awaiting confirmation.

When the user later asks to add an issue to a running batch, it goes at the end of the merge order and goes through B3 and B4 before it starts developing; the limit still holds, so it starts only once a subagent of this batch has finished.

### B3. Start the subagents: plans only

Start one background subagent per issue in the batch with the Agent tool (`isolation: "worktree"`, `run_in_background: true`). Give each a brief with:

- The issue number and title, and that it works for the coordinator, never asks the user, and returns everything for the user to the coordinator.
- Its place in the merge order, the issues ahead of it and the files they expect to change.
- What to do now: steps 1 to 3 of "One issue" in this skill (read the context, check whether work can start, make a small plan) in its own worktree, then stop and return the plan: steps, files and tests, size, whether it should become several PRs, problems that block it, and the decisions the user must make, each with concrete options and a recommendation.
- The rules for working in a worktree, heavy checks and their lock (B5), and the pitfalls (B8).

### B4. Settle the decisions with the user

Collect the plans. Summarize them for the user in one table, then ask every decision point with AskUserQuestion, grouped by issue (each question names its issue; at most 4 questions per round, as many rounds as needed). Send each subagent its answers with SendMessage and tell it to start developing.

When an answer overturns the plan (e.g. the interaction changes completely): when it changes behavior users can see, first update the design with the user through the design skill (only the affected elements); then the subagent records the new acceptance criteria as a comment on its issue before writing code.

### B5. Development in the subagents

Each subagent follows steps 4 and 5 of "One issue" in its worktree:

- Branch from the latest base branch and install dependencies in the worktree itself (`npm ci`, `uv sync` and so on); nothing is shared with other worktrees.
- Normal self-check commands run in parallel.
- Heavy checks queue behind a lock so only one runs at a time, and each one cleans up before the next starts:
  1. Take the lock: `LOCK="$(git rev-parse --git-common-dir)/dev-workflow-heavy-check.lock"`, then retry `mkdir "$LOCK"` every 30 seconds until it succeeds (`mkdir` is atomic, so only one subagent gets it). Write the issue number and the time into `$LOCK/owner`.
  2. Run the heavy check with its cleanup, as under "Heavy checks" in step 5 of "One issue": start Docker when needed, run, stop what it started, quit Docker Desktop when CLAUDE.md says to and this check started it.
  3. Release the lock right away, whether the check passed or failed: `rm -rf "$LOCK"`.
  4. When a lock is older than an hour, do not delete it; report it to the coordinator, which checks whether its owner is still working.

### B6. Open PRs in order

- The first issue in the merge order opens its PR as soon as it is done locally (step 6 of "One issue").
- Every later issue finishes locally first (all commits made, all checks passing), reports "ready, waiting for #<previous>" and waits. Once the issue ahead of it has merged, the coordinator tells it to continue: `git fetch origin`, rebase onto the latest base branch, adapt to the changes already merged, rerun every check (heavy ones through the lock), then open its PR.
- Once a branch is pushed, keep it in sync with the base branch only by merging (`git merge origin/<base>`); never force-push.
- An issue split into several PRs stacks the later PRs locally on the earlier one; once the earlier one merges, move the next onto the base branch with `git rebase --onto origin/<base> <old base of the stack> <branch>`.

### B7. Reviews, merging and wrap-up

- Each subagent handles its PR's reviews as in step 7 of "One issue", and stops when CI is green and every thread is handled, reporting the PR link and risk tier to the coordinator. It never merges or labels anything itself.
- The coordinator checks each PR's CI itself (`gh pr checks <PR>`) and tells the user which PRs need their review (medium and high risk) and in which order. It watches every PR of the batch in the background until it merges, as in step 8 of "One issue", so a label the user adds is followed through to the merge.
- After each merge, the coordinator does steps 9.2 to 9.5 of "One issue" for it: the issue closed, CI on the base branch for the merge commit, staging. It wakes the next subagent of this batch in the order right away, so the rebase and local checks overlap with that CI; when CI or staging fails for the merge, it tells the user, and the next subagent does not open its PR until the user has decided how to proceed. A merge frees a slot but starts nothing new.
- **Removing a worktree**, once its issue is done (merged, CI and staging green) or taken out of the batch:
  1. Check nothing would be lost: `git -C <worktree> status --porcelain` prints nothing, and `git -C <worktree> log --oneline @{u}..HEAD` prints nothing (for a branch never pushed: `git -C <worktree> log --oneline origin/<base>..HEAD`). When something is uncommitted or unpushed, keep the worktree and ask the user whether to push it or drop it.
  2. When `git worktree list --porcelain` shows it as `locked`, `git worktree unlock <worktree>`.
  3. `git worktree remove <worktree>`, then delete its local branch with `git branch -D <branch>` (step 1 showed nothing is only local).
  4. When Windows cannot delete it because a path is too long, remove the directory in PowerShell with `Remove-Item -LiteralPath '\\?\<absolute path of the worktree>' -Recurse -Force`, then `git worktree prune`.
- The batch ends when every issue in it is done or has been taken out. Before the summary, confirm with `git worktree list` that only the main repository is left (remove any other the same way), that no heavy-check lock is left behind, and that `docker ps` shows nothing the batch started.
- Summarize the batch: issues done with their PRs and the results of CI on the base branch and staging, issues taken out and why, candidates not in this batch (over the limit, blocked, spike, manual steps, screens awaiting confirmation), open follow-ups, and which issues the next `/implement batch` would pick up now that this batch has merged.

### B8. Exceptions and pitfalls

- **GitHub Actions or GitHub itself is down**: subagents report it and keep doing local work. The coordinator watches https://www.githubstatus.com and, once it recovers, tells the subagents to rerun failed runs (`gh run rerun <run id> --failed`).
- **A worktree disappears** (worktrees can be cleaned up automatically): recreate it from the main repository with `git worktree add <path> <branch>` and continue; commit often so nothing is lost.
- **A background script moved the worktree to another commit** (e.g. a per-commit check): wait for it to finish and confirm `git status` shows the branch again before continuing.
- **Dependencies went stale after switching branches or rebasing**: when the lock file changed, reinstall (`npm ci` and the like) before running checks.
- **A subagent is stuck or keeps failing**: the coordinator stops it, tells the user, and takes the issue out of the batch; it can be done alone with `/implement <number>`. No other issue takes its place. Its worktree is removed as in B7 only after the check there shows nothing would be lost.
