---
name: implement
description: Develops GitHub issues from branch to merge and beyond, one PR per issue: runs the document steps the issue plans (kickoff, architect, design, scaffold) on its branch, reads the issue with its requirements, architecture, design and standards, works in small test → implement → refactor commits, compares changed screens with the prototypes, opens the PR with /open-pr, handles every AI review comment, follows the PR until it merges, and counts the issue done only when CI on the base branch passes and staging runs it. Heavy tests run by the stage table of the scaffold skill's shared/testing.md against throwaway environments. /implement next picks the issues that can start (blocked ones left out, conflicts rated, rounds planned), then asks once whether to develop them in parallel (one background subagent per issue in its own worktree, mechanical follow-up work on cheaper short-lived agents) or one after another (every plan made and every question asked up front, then developed one by one), and who adds the human-reviewed label on medium and high risk PRs: the user (default) or, for that run only, the agent after an independent full-diff review. Branches stay on the remote. Usage: /implement next, /implement &lt;issue&gt;, or /implement &lt;issue&gt; &lt;issue&gt; ...
---

# Developing issues

| Call | What happens |
|---|---|
| `/implement next` | Picks the issues that can start now and plans them (N1–N3), asks once how to run them and who adds the `human-reviewed` label (N4), then develops them in parallel ("Several issues in parallel") or one after another (N5) |
| `/implement <number>` | Develops that issue in this session ("One issue") |
| `/implement <number> <number> ...` | Takes the given issues as the candidates and goes on as `/implement next` does |

Talk to the user in their language.

An issue is done when its PR has merged, CI on the base branch has passed for the merge commit, and staging runs that commit (when the project has staging). Merging alone is not done.

Branches are never deleted on the remote: once work is merged, only the local branch (and, in parallel work, the worktree) is removed. Never run `git push origin --delete`, `gh pr merge --delete-branch` or anything else that removes a remote branch.

Documents reach main only through the issue's PR, together with the code. Issue work never gets a separate docs branch or a docs-only PR.

## Spending little

Tokens and time go to what an agent reads and to every time it is woken. These rules hold for this session and every subagent.

- **Output**: filter a check's output so only the failures and the last lines come back (`<command> 2>&1 | tail -n 30`, with `set -o pipefail` so the exit code survives). Watch commands print one verdict line. Reports, to the user or the coordinator, state conclusions (what passed, what failed and its key line, what was decided), never logs.
- **Waiting**: one background command per wait that blocks until the thing happens and prints only the verdict. No polling in loops of agent turns; a shell loop sleeps two minutes or more per round and is bounded. A watcher the system stopped for lack of memory is started again once, not replaced by frequent polling.
- **Idle agents**: an agent's prompt cache lasts about five minutes. One that has worked for hours holds a context of hundreds of thousands of tokens, and waking it after a pause rebuilds all of it, even for a one-line reply. So never wake a big agent to ask for progress, send it everything in one message, do small one-off jobs yourself (watching CI and staging, closing an issue, one command), and give follow-up work to a new agent with a short brief.
- **Models**: judgment (reading the issue against the design, planning, tests and code, review findings, design decisions) uses the session's model. Mechanical work (rebasing, rerunning checks, opening a PR, pushing a decided fix) goes to an agent started with `model: "sonnet"`.
- **Nothing twice**: a command that already passed on this exact tree is not rerun; what the stage table leaves to CI is not run locally.

## Choosing what to develop

Issues developed side by side pay off only when they do not get in each other's way, so a parallel batch never holds two issues that conflict. The same plan orders a serial run.

### N1. The candidates

- `/implement next`: the open issues of the earliest unfinished milestone whose dependencies are all closed (`gh issue list --milestone "<milestone>" --state open --json number,title,body,labels`). Without milestones, the open issues by number.
- `/implement <number> <number> ...`: the given issues; check their dependencies the same way.

Leave out, and note why for each: issues still blocked by open issues (including other candidates), `type:spike` issues (for /spike), and issues that need a real environment or manual steps (hardware, production credentials, third-party accounts). An issue whose document steps still need the user's answers is a candidate; those steps run first on its branch (step 4).

Read each candidate's start step, planned steps, expected files and design element IDs, and estimate which files each one will change.

### N2. Rate every pair

- **None**: they change different files.
- **Light**: they share a few files but change separate places in them (each adds its own route, menu entry, line in a shared list, or migration), so the later one rebases onto the earlier and settles the overlap mechanically.
- **Conflict**: they change the same functions, components, screens, tables or interfaces, or one needs the other's result (its data, interface or design), so the later one would largely redo its work.

None and light pairs can be developed side by side. A conflicting pair never goes in the same parallel batch.

### N3. Plan the rounds

A batch is a set of candidates without a conflicting pair. Split all candidates into rounds and choose the first round by these rules, in order:

1. **The most issues**: as many as the largest batch holds.
2. **What it leaves behind**: among first rounds of that size, the one that leaves the rest splittable into the fewest rounds, each as large as possible. Example: A conflicts with C, B conflicts with C and D. The largest batches are A+B, A+D and C+D. A+D leaves B and C, which conflict, so two more rounds; A+B leaves C+D, one more round. Take A+B (or C+D).
3. **Then**: issues the others build on, then fewer light overlaps inside the batch, then the lowest numbers.

Candidates are few, so compare whole batches. The later rounds are a forecast: the next `/implement next` plans again against the code merged by then. The order of a serial run is this plan read out: the first round in the order of rule 3, then the second round, and so on.

**What the machine carries** (parallel only): each subagent installs dependencies in its own worktree and runs its own checks. Look at the CPU cores and free memory and estimate how many subagents fit. When the first round holds more, also prepare a smaller batch taken from it by the same rules. Review load counts too: every medium and high risk PR waits for the user to read it, unless the user chooses the automatic label below.

### N4. Ask

1. Show the candidates in a table: issue, title, size, expected files, conflicts, light overlaps. Below it, the rounds plan, the issues left out in N1 and why, and the CPU cores and free memory when easy to see.
2. When no candidate is left, say what blocks them and stop.
3. Ask everything in one AskUserQuestion call, so the user answers once:

   **How to run** (question 1). Every option names its issues; parallel options hold only batches without a conflicting pair:
   - The first round in parallel, e.g. "Parallel, 3 at once: #12, #15, #20", recommended unless the machine cannot carry it.
   - Another first round of the same size, when rule 2 rates it as good.
   - The smaller batch from N3, recommended when the first round is more than the machine carries.
   - "One after another: #12, then #15, then #20" in the order of the rounds plan: every plan is made and every question asked up front, then each issue is developed only when the one before is done (merged, CI and staging green).

   The user can type any other set; when it holds a conflicting pair for a parallel run, name the pair and what the later issue would have to redo, and go on only once the user confirms. Question 1 is not asked, and the reason is said, when exactly one candidate is left (it is developed as in "One issue"), when every pair conflicts (only serial makes sense), or when the request already named the way ("three at a time" takes a batch of that size by the rules of N3, or the largest there is, saying so; "one by one" is serial).

   **Who adds the `human-reviewed` label** (question 2, asked in every run unless the request said): medium and high risk PRs merge only after the label is on.
   - "I add it after reading the diff" (recommended): the default, as in step 8.
   - "The agent adds it after an independent review of the whole diff, for this run only": the gates of step 8 apply. It replaces the user's own reading of those PRs, so say so in the option.

4. The answer to question 2 holds for this run only: it is not stored, not written to CLAUDE.md and not assumed in the next run. `/implement <number>` has no question and always uses the default unless the user says otherwise in the request.

### N5. Go on

- **Parallel**: B1 of "Several issues in parallel".
- **One issue**: as in "One issue".
- **Serial**: the user is asked once, at the start, and then not again until the end of the run.
  1. **Plans first.** Steps 1 to 3 of "One issue" are done for every issue in the planned order before any code is written, so no branch is created and nothing is committed yet. Start one plan-only agent per issue, all at once (`run_in_background: true`, read-only, no worktree), with a brief as in B2: the issue, its place in the order, the files the issues ahead of it expect to change, steps 1 to 3 only, and to return the plan in a few lines (document steps, code steps, files and tests, size, problems that block it, decisions the user must make, each with options and a recommendation) and end. They end by themselves and are never woken again; the plans stay in this session. With one or two issues, this session may make the plans itself.
  2. **Ask once.** As in B3: one table of the plans, then every decision point (step 2's questions, and for size M or more than 500 changed lines the plan itself) with AskUserQuestion, grouped by issue, each question naming its issue, at most 4 per round, as many rounds as needed. An answer that changes behavior users can see goes through the design skill first (only the affected elements), and the new acceptance criteria are recorded as a comment on the issue before its development starts. An issue whose plan finds it blocked is taken out here, and the user is told. Questions that only the document steps can raise are asked when those steps reach them (step 4), as the skill asks them.
  3. **Develop one by one**, in the planned order, each from step 4 to step 10 of "One issue" in this session, with the answers already given and the plan as the plan of step 3. The next issue starts only when step 10 of the previous one is reported.
  4. **Before each issue after the first**: `git fetch origin`, then compare what has merged since the plans were made with this issue's plan (the files it names, the interfaces and decisions it relies on). When the earlier issues changed nothing the plan rests on, start. Small corrections, such as a renamed file or a shifted line, are made without asking. Only when an earlier issue changed a premise of the plan (the design, an interface, a decision the user made), stop, say what changed and why it matters, and ask the user with the options. A question the plan could not have foreseen (step 5's rule on gaps in the design) also goes to the user, with the reason.
  5. When an issue is blocked, fails in a way the user must decide, or is taken out, stop and tell the user; do not skip it silently.

## One issue

In a serial run, steps 2 and 3 were done up front (N5); the issue starts at step 4.

### 0. Pick the issue

`gh issue view <number> --comments`. `type:spike` issues go to /spike. The issue body gives the start step (the earliest skill step the work goes through, set by /change) and the planned steps in order, from that start step down to implementation.

### 1. Read the context

Read CLAUDE.md (its Tests section: the kinds of tests, their commands, what runs when; and the merge method), the REQs linked from the issue (`docs/product/requirements.md`), the relevant parts of `docs/architecture/overview.md`, the related ADRs and the code to change. The standards in `.claude/rules/` load automatically. What runs at each stage is in the scaffold skill's `shared/testing.md`; where CLAUDE.md is silent, its stage table applies.

Then read the design elements the issue cites: the common rules in `docs/design/README.md`, the screen definitions (`docs/design/screens/SCR-xxx-*.md`) and their screenshots for every state (open the PNGs with Read), the relevant parts of `docs/design/data.md` and `docs/design/interfaces.md`, the related logic in `docs/design/logic/` and redesigns in `docs/design/refactor/`.

### 2. Check whether work can start

- Acceptance criteria unclear, contradictory or disagreeing with the documents: stop and ask the user with AskUserQuestion. When the question concerns requirements or the design itself, suggest /change first.
- Screens, fields, interfaces or data the feature needs are missing from the design, and the issue's planned steps have no design step for them: stop and suggest /change to set the issue's start step to design (or earlier). Do not decide them while coding.
- Issues it depends on are not done: tell the user.
- The new logic does not fit the current structure (a set of classes and interfaces would need redesigning, and neither the issue nor the design plans for it): stop and suggest /change to assess the design impact. Do not redesign while coding.

### 3. A small plan

List the steps, in order: the document steps and scaffold steps the issue plans (they run first, in step 4), then the code steps, each with the files it changes and the tests it adds, at the lowest level that can catch the behavior (a field rule is a unit test, only a key flow is end-to-end). When the structure must be adjusted locally first (e.g. a function split), make that the first code step, committed on its own. Size S starts right away; for size M, or more than 500 changed lines expected, show the plan to the user first.

One issue is one PR, documents included. Every extra PR costs a full CI run (often 15 minutes or more), a review, a merge wait and another rebase, so splitting is the exception: only when the diff would be too large to review in one sitting, or when a D2 change needs its refactoring merged first (the change's plan says so), into as few PRs as possible (two or three), along lines a reviewer would read separately (a behavior-preserving refactor, the server side, the screens), not by size. Tell the user what the split costs and let them decide.

### 4. Create the branch, then run the document steps

Read "Branches and commits" in CLAUDE.md. Base branch: main for GitHub Flow; for Git Flow, develop for feature, fix and refactor, main for hotfix. `git fetch origin`, switch to the base branch, `git pull --ff-only`, create the branch by the naming rules (e.g. `feature/12-email-login`, `fix/31-empty-list`, `refactor/40-payment-strategy`). The branch holds the document changes and the code changes of the issue.

`git config core.hooksPath` should print `.githooks` (the project's SessionStart hook sets it). When it does not, tell the user the local commit message hook is off and suggest `! git config core.hooksPath .githooks`. Work goes on either way: step 5 checks every message itself.

**Document steps.** Run the document steps of the plan on this branch, in the planned order, before any code step:

- **kickoff, architect, design**: invoke the matching skill (`dev-workflow:kickoff`, `dev-workflow:architect`, `dev-workflow:design`) with the Skill tool. Tell it the step it must start from (the issue's start step or the first document step still planned), the elements this issue covers, and that its result goes on this issue's branch. Each skill confirms with the user where it says so (design confirms each changed screen, one at a time).
- **scaffold**: invoke `dev-workflow:scaffold` with the Skill tool in its add-to-existing mode, for the components, test kinds and deployment targets the plan names. Its commits follow step 5.
- **Commit each document change** as `docs(product|architecture|design|adr): <what> (#<number>)`, with the commit message check of step 5.
- **Consistency**: once the document steps are done, check that every document that refers to an affected element (requirements, architecture overview, ADRs, design index and element files, roadmap, README) agrees with the change; fix what does not, in one more document commit.
- **Gate**: the code steps start only when every document step is done and confirmed on the branch. The branch stays open until then.

### 5. Implement in small steps

Document commits come first. The code steps then follow the planned order.

**Preparatory refactoring** (first among the code steps, when step 3 listed it): structure only, no behavior change. The same tests pass before and after; when the code has no tests, first add tests that pin down its current behavior. Commit as `refactor(<scope>): <what was restructured> (#<number>)`. A `type:refactor` issue is entirely this, with no behavior change at all.

**Features and fixes**, for each step:

1. **Test**: write or update tests describing this step's behavior, each at the lowest level that can catch it. Tests come from the design: every validation rule in the field definitions (required, length and range boundaries: the limit and the limit plus one), the success and failure of actions, every error of the interfaces, every row of the decision tables, allowed and disallowed state transitions. For a bug, first write a test that reproduces it and fails now.
2. **Implement**: make the tests pass, rerunning only the tests just changed (watch mode, seconds). Field names, order, messages and formats follow the design and its common rules.
3. **Refactor**: once the tests pass, tidy this step's code and what is around it (duplication, names, long functions) so it reads as if written in one go (see "How to write code" in CLAUDE.md). Do not keep adding layers of conditionals to old functions.
4. **Self-check**: the self-check commands in CLAUDE.md for the components you changed must pass, plus the heavy tests the stage table gives for "before each commit" for what this step changed.
5. **Commit**: one commit does one thing, with a Conventional Commits message that includes the issue number and a first line of at most 100 characters, e.g. `feat(auth): support e-mail sign-in (#12)`. Then run `node .github/scripts/check-commit-message.mjs --range origin/<base>..HEAD` (the rules of CI's `commit-lint`) and fix what it reports at once with `git commit --amend -m "<message>"` while the commit is local. Do not rely on `.githooks/commit-msg`: it runs only in clones whose `core.hooksPath` is set, and judging the length by eye misses the limit.

Rules:

- Every commit passes the self-check when it is made; never commit a broken intermediate state. A document commit is made once the consistency check of step 4 is done. Later rebases do not repeat this commit by commit (see "After a rebase").
- Refactoring and feature changes go in separate commits, so reviewers can see which alter behavior.
- No changes unrelated to the issue; record problems you happen to find as new issues.
- When the architecture check fails, change the structure of the code, not the rules.
- When the design does not cover a situation: decide pure technical details (names, how internal functions are split) yourself; for behavior users can see, business rules and data structures, stop and ask the user, update the design once they confirm, then continue.
- Never commit secrets, tokens, personal data or generated build output.

**Heavy checks** (integration, end-to-end, snapshot such as visual regression, delivery, and non-functional where the table asks for it; the Tests section of CLAUDE.md has the commands) are the slowest part and strain the machine most, so they run exactly where the stage table puts them and leave nothing running.

- Before each commit: only the heavy tests that cover what the commit changed (the project's way of mapping a change to tests; when unsure, run more).
- Before opening the PR: as the "Before the PR" column of CLAUDE.md says, either every heavy kind in full on the main environment, or only the tests that cover the whole branch's change with the full set left to CI. When CLAUDE.md is silent, run the related ones. Delivery tests also run when packaging, migrations or permissions changed, non-functional ones when the change may move a target. Collect all the failures, fix them together, then rerun only what failed and what the fixes affected.
- A PR split into a stack runs this once, on the top, before the first PR opens; the PRs below rely on CI, and each PR that changes screens commits its own regenerated baselines.
- When a stage runs past the time target in CLAUDE.md, do not drop the check: select by change, shard, cache or move it to a later stage, and tell the user which.
- A failure that passes after one rerun is a flaky test: say so, open an issue for it, and do not count on reruns.
- A check this machine cannot run at all is left to CI, and the PR says it was not run locally and why.

**After a rebase**: run the self-check once, on the head of the branch, and the heavy tests that cover what the rebase touched (where a conflict or overlap was settled, and the visual baselines when a screen you share changed). A rebase that settled nothing and only moved the base forward leaves the heavy tests to CI. Commits in between are not checked one by one when the merge method in CLAUDE.md squashes, since only the final tree reaches the base branch. When the merge method keeps every commit, also check each commit where a conflict was settled.

**Checks that need a database or another service** are integration tests and run locally too, against a throwaway container of the image and version CI uses: a random password, bound to 127.0.0.1 on a free port, the databases CI creates, migrations first, removed afterwards whether the run passed or failed. Use the project's own command for this. Browser tests that need the database run the same way; never switch the feature off or skip those tests.

**Ports**: when a check's port can be configured (CLAUDE.md names the variable, e.g. `E2E_PORT`), run it on a free port: `node -e "const s=require('net').createServer().listen(0,()=>{console.log(s.address().port);s.close()})"` prints one. A port that cannot be configured is held by the check for its whole run.

Each heavy check:

1. Before: when it needs Docker and `docker info` fails, start it (Docker Desktop: `docker desktop start`) and note that this check started it.
2. Run it, with the output filtered.
3. After, passed or failed: stop and remove what it started, as CLAUDE.md says (e.g. `docker compose -f <file> down`; `docker run --rm` containers remove themselves). `docker ps` shows none of its containers afterwards.
4. Quit Docker Desktop (`docker desktop stop`) when CLAUDE.md says to and this check started it; leave it when it was already running.

**When screens change**:

- The confirmed prototype screenshots (`docs/design/screens/*.png`) are the reference. After implementing, open the screen in every state the design defines (normal, validation errors, empty data...), take screenshots with Playwright or a browser tool, and compare them one by one with the prototypes: fields, order, text, required markers, where error messages appear. Small differences that come from the component library are acceptable; mention them in the PR.
- For an existing screen, also attach a before screenshot. Put the comparison (prototype and implementation side by side) in the PR description.
- With design files, check sizes, colors and spacing against them; colors and spacing use design tokens.
- When presentational components change, update their Storybook stories (when the project uses Storybook).
- When the look changed on purpose, regenerate only the baselines of the screens that changed and commit them with the code, as in the scaffold skill's `shared/visual-testing.md`; list in the PR which changed and why. Use the project's own visual command from CLAUDE.md when it has one.

### 6. Open the PR

Run `open-pr` with the Skill tool (the project's `/open-pr` command). It runs the self-check, simplification and local review, writes the PR from the template with `Closes #<number>` in the body, and enables auto-merge. The PR description lists the document changes with the code changes, says which heavy kinds ran locally, which did not and why.

### 7. Handle review comments

1. Wait for the checks with one background command that prints only the verdict: `gh pr checks <PR> --watch --interval 60 >/dev/null; gh pr checks <PR> | grep -v -w -e pass -e skipping` (the AI review takes a few minutes). Do nothing else about this PR until it returns.
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
   - Fixed: reply "Fixed in <commit>" and resolve the thread.
   - Reply: `gh api repos/<owner>/<repo>/pulls/<PR>/comments/<comment databaseId>/replies -f body="<text>"`
   - Resolve: `gh api graphql -F id=<thread id> -f query='mutation($id: ID!) { resolveReviewThread(input: {threadId: $id}) { thread { isResolved } } }'`
4. Fix everything of one round together in the same PR, following step 5 (e.g. `fix(auth): address review: validate the e-mail format (#12)`), rerun only the checks the fix affects, run the commit message check once more and push only when it passes. Pushing starts a new review round; go back to 1.
5. When CI fails, read the log (`gh run view <run id> --log-failed`, filtered) and the artifacts it uploaded (failure screenshots, traces), then reproduce the failure locally under the same conditions (same command, test, environment, a real database) before fixing it; repeat a test that fails only sometimes. Push the fix only once the reproduced failure passes locally. When it cannot be reproduced, say in the PR what was tried and why the fix should work, and tell the user the test may be unstable; a failure that appeared once is not ignored because a rerun passed. For visual regression failures, download the comparison images to tell unexpected changes from intended ones. When `commit-lint` fails on a commit already pushed, a new commit cannot fix it: ask the user whether to reword the branch and push it with `git push --force-with-lease`, or to move the work to a new branch and PR.
6. When the AI review hits its round limit, stop, tell the user, and suggest a smaller PR or a different approach.

### 8. Merge

- Low risk: merges automatically once every check passes and every thread is handled.
- Medium and high risk: the PR waits for the `human-reviewed` label and merges automatically once it is on. The label is added by the user, or by the agent in the one case below.
  - **The user adds it** (the default): give them the PR link and risk tier and ask them to read the whole diff and add the label once satisfied. Handle changes they ask for as in step 7 (a new commit removes the label and the user confirms again).
  - **The agent adds it**, only when the user chose it in N4 for this run: the session itself, never the agent that wrote the code, adds the label once both gates hold. (1) An independent review: a new agent on the session's model, given only the PR number, the issue, the design elements it cites and the standards, reads the whole diff (`gh pr diff <PR>`) and answers "may label" or "must change first", with its reasons. On "must change first" the findings are fixed as in step 7 and a new agent reviews the new diff. (2) The PR's own review is handled: every check green, every [Important] and [Security] thread fixed and resolved. A thread the author thinks should stay unfixed remains with the user, who then adds the label themselves. Then `gh pr edit <PR> --add-label human-reviewed`, and a PR comment with the verdict and its reasons. A new commit removes the label, and both gates run again. This authorization ends with the run; nothing carries it to the next.
- With PR preview environments, give the user the preview URL.

Watch the PR until it merges, at every risk tier, with one background command that checks slowly and prints only the end state, for at most an hour: `for i in $(seq 30); do [ "$(gh pr view <PR> --json state -q .state)" != OPEN ] && break; sleep 120; done; gh pr view <PR> --json state,mergeCommit`. When the PR is still open after the checks pass and the label is on, read why (`gh pr checks <PR>`, unresolved threads, `gh pr view <PR> --json mergeStateStatus`) and handle it or tell the user. Merge it yourself only when the user asks, and then without deleting the branch.

### 9. After the merge

1. **Local cleanup**: switch to the base branch, `git pull --ff-only`, `git branch -d <branch>`. The branch stays on the remote.
2. **The issue**: check it closed (`gh issue view <number> --json state`); `Closes #<number>` occasionally fails, so close it with `gh issue close <number> --comment "Done in #<PR>"`.
3. **CI on the base branch**: take the merge commit from `gh pr view <PR> --json mergeCommit`, list its runs with `gh run list --commit <sha> --json databaseId,workflowName,status,conclusion` (they can take a minute to appear), wait for each with `gh run watch <run id>` in the background, then judge by `gh run list --commit <sha> --json workflowName,conclusion`: `success` and `skipped` are fine, `failure`, `cancelled` and `timed_out` are not. Do not use `--exit-status`: it returns 1 for a run whose jobs were all skipped.
4. **Staging** (when CLAUDE.md names one): confirm staging runs the merge commit or a later commit containing it (`git merge-base --is-ancestor <sha> <deployed sha>`), the way CLAUDE.md says (e.g. its version endpoint) or from the deployment records: `gh api "repos/<owner>/<repo>/deployments?environment=staging&sha=<sha>"`, then `gh api repos/<owner>/<repo>/deployments/<id>/statuses` until the latest status is `success`. When no deployment starts within the workflow's usual time, look at the deploy workflow's runs. The smoke flows the pipeline runs against staging count as part of this check.
5. **When something fails**: read the log (filtered) and tell the user what failed and why; reproduce a test failure locally first, as in step 7.5. A failure caused by the change gets a fix through a new branch and PR (steps 4 to 8, the same issue number). A failure that does not come from the change (an unstable test, a platform outage) still goes to the user, with a new issue for an unstable test; rerun the failed jobs (`gh run rerun <run id> --failed`) only once the user knows. The issue is not done while either check is red.

### 10. Report

Which issue was done, the PR link, what changed (documents and code), which refactorings were made, which review comments were handled, whether the implementation differs from the prototypes, which heavy checks ran locally and which were left to CI, who added the `human-reviewed` label (and the independent review's verdict when the agent did), the result of CI on the base branch and of staging, and anything the user should know. In a serial run, say which issue comes next and go on to it; otherwise ask whether to continue with `/implement next`.

## Several issues in parallel

This session becomes the coordinator: it talks to the user, decides the merge order, watches CI and merges, does the small jobs itself, starts agents for follow-up work, and wraps up. Each issue gets a background subagent (Agent tool, `isolation: "worktree"`) that does steps 1 to 6 of "One issue" in its own git worktree and branch, and ends when its PR is open (or, when it is not first in the merge order, when its work is ready locally). Planning, development and local checks run side by side; merges are in order, and heavy checks that conflict wait for each other. The end result must equal doing the issues one after another in the merge order.

Subagents never ask the user anything: they return questions and plans to the coordinator, so the user only ever deals with this session.

A batch is the fixed set of issues chosen in N4. Every issue in it gets its subagent at the start, all of them plan together and all their decisions are settled together. An issue outside the batch is never started during the run, not when a subagent finishes, a PR merges or a subagent is taken out; it waits for the next `/implement next`.

**Who does what after the first report.** A subagent that has planned and developed is expensive to wake (see "Spending little"), so after it returns its PR link or ready report it is not woken again. Everything after goes to a new agent with a short brief: the issue number, the PR number or branch, the path of the existing worktree (it works there, not in a new one), what to do, what is already decided, the rules of B4 and B5, and to report only conclusions. Mechanical work (rebasing and settling overlaps that need no thought, rerunning checks, opening the PR, pushing a decided fix) uses `model: "sonnet"`; review findings, CI failures and anything needing a judgment about the code use the session's model. A mechanical agent that meets a conflict that is not mechanical stops and reports; the coordinator starts a stronger one.

### B1. Settle the merge order

Say plainly that the candidates not in the batch are not started in this run.

Merge order: issues that others build on or whose result they need go first; among light overlaps, the smaller one first, so the larger rebases onto it once. Show the user two tables and confirm them:

- **This batch**: order, issue, size, expected files, light overlaps with earlier issues.
- **Not in this batch**: issue and why: conflicts with which issue of this batch (a later round), beyond what the machine carries, blocked by which issue, `type:spike`, needs manual steps.

When the user asks to add an issue to a running batch, rate it against the unmerged issues of the batch as in N2. When it conflicts with one, it waits for the next `/implement next`. Otherwise it goes at the end of the merge order and goes through B2 and B3 before developing; it starts once a subagent of this batch has finished, unless the user raises the number running at once.

### B2. Start the subagents: plans only

One background subagent per issue (`isolation: "worktree"`, `run_in_background: true`), with a brief:

- The issue number and title, and that it works for the coordinator, never asks the user, and returns everything for the user to the coordinator.
- Its place in the merge order, the issues ahead of it and the files they expect to change.
- Steps 1 to 3 of "One issue" in its own worktree, then stop and return the plan in a few lines: document steps, code steps, files and tests, size, whether it needs splitting (only when the diff is too large to review in one sitting, or a D2 change needs its refactoring first), problems that block it, and the decisions the user must make, each with concrete options and a recommendation. Document steps are planned here, not run.
- After the answers: develop through step 6 (the PR opened when it is first in the merge order, otherwise everything done and checked locally), return a short report and end.
- "Spending little", B4, the commit message check after every commit and before every push, the rule for pushed history (B5), the pitfalls (B7), and that it never deletes a remote branch.

### B3. Settle the decisions with the user

Collect the plans, summarize them in one table, then ask every decision point with AskUserQuestion, grouped by issue (each question names its issue; at most 4 per round, as many rounds as needed). Send each subagent all its answers in one SendMessage and tell it to start developing; this is the one wake-up of a subagent whose context is still small.

Questions that the document steps raise during development come back the same way: the subagent returns each one, the coordinator asks it as above, and the answer goes to the subagent in one SendMessage.

When the plans show two issues of the batch changing the same code after all, tell the user and recommend taking the later one in the merge order out of the batch.

When an answer overturns a plan: when it changes behavior users can see, first update the design with the user through the design skill (only the affected elements); then the subagent records the new acceptance criteria as a comment on its issue before writing code.

### B4. Development in the subagents

Each subagent follows steps 4 and 5 of "One issue" in its worktree:

- Branch from the latest base branch and install dependencies in the worktree itself (`npm ci`, `uv sync`...); nothing is shared between worktrees.
- Develop against the base branch as it was at the start. Never merge, cherry-pick or adapt to the commits or branch of another issue that has not merged: its intermediate states are not final, and following them means redoing the work whenever they change. The one rebase comes in B5.
- Normal self-check commands run in parallel.
- Heavy checks run side by side when they do not conflict and the machine can carry them. Two checks conflict when they need the same thing: a fixed port that cannot be configured, the same output directory or files, the same external test account or environment (the Tests table of CLAUDE.md says what each holds). A configurable port is not shared: each check takes its own free port. Each shared resource has its own lock; checks that share none run at once. The container runtime is shared by count: a check that needs it starts it when it is not running, and only the last check using it quits it, when this batch started it. Do not fix a number of checks that may run at once.

  Memory is the scarcest resource: several agents that each look at the free memory at the same moment all find it enough, start together and run the machine out of memory, and the system then stops background tasks. So starting is serialized:
  1. Take `launch.lock` (taken like the others below, before any resource lock). Only its holder looks at memory and starts a check.
  2. Under it, compare the free memory and CPU load with what the check needs (the memory CLAUDE.md gives for it); while they fall short, retry every 30 seconds, keeping the lock. A machine that is too busy makes tests time out for no reason, which costs more than waiting.
  3. Pick a free port for every configurable port of the check (see "Ports") and pass it through the variable CLAUDE.md names.
  4. Take the resource locks in alphabetical order, so two checks never wait for each other: `LOCKS="$(git rev-parse --git-common-dir)/dev-workflow-locks"`, then for each resource retry `mkdir "$LOCKS/<resource>.lock"` every 30 seconds until it succeeds (`mkdir` is atomic). Write the issue number and time into `<resource>.lock/owner`. A check that holds nothing takes no resource lock.
  5. When the check needs the container runtime: under a short `runtime.lock` (taken the same way), add a file `$LOCKS/runtime-users/<issue number>`; when `docker info` fails, start Docker and create `$LOCKS/runtime-started-by-batch`; release `runtime.lock`.
  6. Start the check and keep `launch.lock` until it has taken its memory (containers and servers up, tests running), then release it so the next check measures what is really left.
  7. When the check ends, passed or failed, clean up as in "Each heavy check": under `runtime.lock` remove this issue's `runtime-users` file; when none is left and `runtime-started-by-batch` exists, quit Docker Desktop when CLAUDE.md says to and remove that file. Then release the resource locks: `rm -rf "$LOCKS/<resource>.lock"`.
  8. A lock older than an hour is not deleted; report it to the coordinator, which checks whether its owner is still working.

### B5. Open PRs in order

- The first issue in the merge order opens its PR as soon as it is done locally (step 6).
- Every later issue finishes locally first (all commits made, all checks passing), reports "ready, waiting for #<previous>" and ends; it is not left waiting. Once the issue ahead of it has merged, the coordinator starts a mechanical agent for it: `git fetch origin`, rebase once onto the latest base branch, settle the light overlaps with what has merged, check as under "After a rebase", then open the PR. When something needs judgment about the code, the agent stops and reports.
- Once a branch is pushed, its history is not rewritten: keep it in sync with the base only by merging (`git merge origin/<base>`) and add commits instead of changing pushed ones. When `commit-lint` fails on a pushed commit, the agent reports it and the coordinator asks the user whether to reword the branch and push with `git push --force-with-lease`, or to move the work to a new branch and PR.
- An issue split into several PRs stacks the later PRs locally on the earlier one; once the earlier one merges, move the next onto the base branch once with `git rebase --onto origin/<base> <old base of the stack> <branch>`, then check as under "After a rebase".

### B6. Reviews, merging and wrap-up

- **Watching**: the coordinator waits for each PR's checks with the one-command wait of step 7.1 and watches each PR until it merges with the command of step 8, so a label added by the user is followed through to the merge. No agent polls.
- **The label on medium and high risk PRs** (step 8): when the user adds it, the coordinator tells the user which PRs need their review and in which order. When the user chose the agent in N4, the coordinator runs both gates of step 8 itself for each such PR: it starts the independent review agent, and adds the label itself. No subagent that wrote code adds a label or merges anything.
- **Review comments and CI failures** (step 7): the coordinator reads the verdict and the unresolved threads itself. For something to fix it starts one new agent per PR with a short brief (the PR, branch, worktree, the threads or the filtered failure log, what is decided) on the session's model, which fixes everything of the round together, reproduces CI failures locally first, pushes, replies in and resolves the threads as step 7 says, and returns one line. A [Nit] to reject, or a thread that needs the user, the coordinator handles itself.
- After each merge the coordinator does steps 9.2 to 9.5 itself: the issue closed, CI on the base branch for the merge commit, staging. It starts the next issue's mechanical agent in the order right away, so the rebase and local checks overlap with that CI; when CI or staging fails for the merge, it tells the user, and the next agent does not open its PR until the user has decided. A merge frees a slot but starts nothing outside the batch.
- **Removing a worktree**, once its issue is done (merged, CI and staging green) or taken out of the batch:
  1. Check nothing would be lost: `git -C <worktree> status --porcelain` prints nothing, and `git -C <worktree> log --oneline @{u}..HEAD` prints nothing (never pushed: `... origin/<base>..HEAD`). Otherwise keep it and ask the user whether to push or drop.
  2. When `git worktree list --porcelain` shows it `locked`, `git worktree unlock <worktree>`.
  3. `git worktree remove <worktree>`, then `git branch -D <branch>` (step 1 showed nothing is only local). The branch stays on the remote.
  4. When Windows cannot delete it because a path is too long: `Remove-Item -LiteralPath '\\?\<absolute path of the worktree>' -Recurse -Force` in PowerShell, then `git worktree prune`.
- The batch ends when every issue in it is done or taken out. Before the summary, confirm with `git worktree list` that only the main repository is left, that no lock or `runtime-users` file is left in `$(git rev-parse --git-common-dir)/dev-workflow-locks`, and that `docker ps` shows nothing the batch started.
- Summarize the batch: issues done with their PRs and the results of CI on the base branch and staging, who added the label on each medium and high risk PR, issues taken out and why, candidates not in the batch, open follow-ups, and the next round the rounds plan forecasts now that this batch has merged.

### B7. Exceptions and pitfalls

- **GitHub Actions or GitHub is down**: agents report it and keep doing local work. The coordinator watches https://www.githubstatus.com and, once it recovers, reruns failed runs (`gh run rerun <run id> --failed`) itself.
- **A worktree disappears** (they can be cleaned up automatically): recreate it from the main repository with `git worktree add <path> <branch>` and continue; commit often so nothing is lost.
- **A background script moved the worktree to another commit** (e.g. a per-commit check): wait for it to finish and confirm `git status` shows the branch again.
- **Stale dependencies after switching branches or rebasing**: when the lock file changed, reinstall before running checks.
- **A subagent is stuck or keeps failing**: the coordinator stops it, tells the user, and takes the issue out of the batch; it can be done alone with `/implement <number>`. No other issue takes its place. Its worktree is removed as in B6 only after the check shows nothing would be lost.
